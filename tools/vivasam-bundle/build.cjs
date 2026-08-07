#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const JSZip = require("jszip");
const PptxGenJS = require("pptxgenjs");
const sharp = require("sharp");
const { PDFDocument } = require("pdf-lib");

const lesson = require("./lesson-pictograph.cjs");
const {
  LAYOUT_CONTRACT_VERSION,
  LESSON_LAYOUT,
  assertLessonLayout,
} = require("./layout-contract.cjs");
const {
  TEXT_FLOW_CONTRACT_VERSION,
  SLIDE_TITLE_FLOW,
  TWO_COLUMN_TITLE_FLOW,
  SUMMARY_NEXT_QUESTION_FLOW,
  explicitKoreanLines,
  toPptxTextRuns,
  wrapKoreanWords,
} = require("./korean-text-flow.cjs");

const BUILD_VERSION = "5";
const FONT = "NanumGothic";
const SLIDE_W = 13.333;
const SLIDE_H = 7.5;
const A4_WIDTH = 1240;
const A4_HEIGHT = 1754;
const MACOS_FONTCONFIG = path.join(__dirname, "fontconfig-macos.xml");

function parseArgs(argv) {
  const options = { eduititRoot: "", skipOffice: false };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--eduitit-root") {
      options.eduititRoot = path.resolve(argv[++index] || "");
    } else if (token === "--skip-office") {
      options.skipOffice = true;
    } else {
      throw new Error(`알 수 없는 옵션입니다: ${token}`);
    }
  }
  return options;
}

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

function validateLesson(source) {
  ensure(source.schemaVersion === 1, "지원하지 않는 수업 스키마입니다.");
  ensure(source.slides.length === 11, "골드 스탠더드는 정확히 11장이어야 합니다.");
  ensure(
    source.slides.reduce((sum, slide) => sum + slide.minutes, 0) === source.durationMinutes,
    "슬라이드 시간 합계가 차시 시간과 다릅니다.",
  );
  const files = new Set();
  source.slides.forEach((slide, index) => {
    ensure(slide.number === index + 1, `슬라이드 번호가 연속적이지 않습니다: ${slide.number}`);
    for (const key of ["phase", "title", "intent", "teacherMove", "studentAction", "evidence"]) {
      ensure(String(slide[key] || "").trim(), `슬라이드 ${slide.number}의 ${key}가 비었습니다.`);
    }
    ensure(slide.worksheet?.file?.endsWith(".png"), `슬라이드 ${slide.number} 활동지 파일이 없습니다.`);
    ensure(!files.has(slide.worksheet.file), `활동지 파일명이 중복되었습니다: ${slide.worksheet.file}`);
    files.add(slide.worksheet.file);
    if (["dilemma", "model", "guided", "pair", "independent"].includes(slide.kind)) {
      ensure(Number.isInteger(slide.data.legendValue) && slide.data.legendValue > 0, `슬라이드 ${slide.number} 범례가 없습니다.`);
      ensure(Array.isArray(slide.data.rows) && slide.data.rows.length > 0, `슬라이드 ${slide.number} 그림그래프 행이 없습니다.`);
    }
  });
  const serialized = JSON.stringify(source);
  for (const forbidden of ["김서현", "이민준", "박유나", "010-", "@school", "학생 얼굴"]) {
    ensure(!serialized.includes(forbidden), `개인정보·실제 반응처럼 보이는 금지 문자열이 있습니다: ${forbidden}`);
  }
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
}

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function resetGeneratedDirectory(directory) {
  fs.rmSync(directory, { recursive: true, force: true });
  ensureDir(directory);
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapWords(text, maxChars) {
  return wrapKoreanWords(text, {
    maxCharactersPerLine: maxChars,
    maxLines: 8,
    minLastLineCharacters: 1,
  });
}

function svgText(lines, x, y, options = {}) {
  const {
    size = 42,
    weight = 500,
    color = `#${lesson.palette.ink}`,
    lineHeight = Math.round(size * 1.45),
    anchor = "start",
  } = options;
  const safeLines = Array.isArray(lines) ? lines : [lines];
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${FONT}, Apple SD Gothic Neo, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${safeLines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join("")}</text>`;
}

function starPoints(cx, cy, outerRadius, innerRadius = outerRadius * 0.46) {
  const points = [];
  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    points.push(`${(cx + Math.cos(angle) * radius).toFixed(2)},${(cy + Math.sin(angle) * radius).toFixed(2)}`);
  }
  return points.join(" ");
}

function svgSymbol(kind, x, y, size, color = `#${lesson.palette.forest}`) {
  if (kind === "star") {
    return `<polygon points="${starPoints(x + size / 2, y + size / 2, size / 2)}" fill="${color}"/>`;
  }
  if (kind === "square") {
    return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size * 0.12}" fill="${color}"/>`;
  }
  return `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size / 2}" fill="${color}"/>`;
}

function svgLegend(kind, value, unit, x, y, width = 520) {
  return [
    `<rect x="${x}" y="${y}" width="${width}" height="104" rx="28" fill="#${lesson.palette.mint}" stroke="#${lesson.palette.forest}" stroke-width="3"/>`,
    svgSymbol(kind, x + 34, y + 26, 52, `#${lesson.palette.forest}`),
    svgText(`한 개는 ${value}${unit}`, x + 114, y + 69, { size: 38, weight: 800, color: `#${lesson.palette.forestDark}` }),
  ].join("");
}

function svgPictographRows(rows, kind, x, y, options = {}) {
  const { symbolSize = 58, gap = 20, rowGap = 112, labelWidth = 240, blank = false } = options;
  const chunks = [];
  rows.forEach((row, rowIndex) => {
    const top = y + rowIndex * rowGap;
    chunks.push(svgText(row.label, x, top + 48, { size: 34, weight: 800 }));
    const count = row.count || 0;
    for (let index = 0; index < count; index += 1) {
      chunks.push(svgSymbol(kind, x + labelWidth + index * (symbolSize + gap), top, symbolSize, `#${lesson.palette.forest}`));
    }
    const slots = row.blankSlots || (blank ? 6 : 0);
    for (let index = 0; index < slots; index += 1) {
      const slotX = x + labelWidth + index * (symbolSize + gap);
      chunks.push(`<rect x="${slotX}" y="${top}" width="${symbolSize}" height="${symbolSize}" rx="12" fill="none" stroke="#${lesson.palette.line}" stroke-width="3" stroke-dasharray="10 9"/>`);
    }
    chunks.push(`<line x1="${x}" y1="${top + 78}" x2="${A4_WIDTH - 88}" y2="${top + 78}" stroke="#${lesson.palette.line}" stroke-width="2"/>`);
  });
  return chunks.join("");
}

function worksheetShell(slide, body) {
  const instructionLines = wrapWords(slide.worksheet.instruction, 36);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${A4_WIDTH}" height="${A4_HEIGHT}" viewBox="0 0 ${A4_WIDTH} ${A4_HEIGHT}">
  <rect width="${A4_WIDTH}" height="${A4_HEIGHT}" fill="#${lesson.palette.paper}"/>
  <rect x="44" y="40" width="1152" height="1674" rx="36" fill="#${lesson.palette.white}" stroke="#${lesson.palette.line}" stroke-width="3"/>
  <rect x="44" y="40" width="1152" height="138" rx="36" fill="#${lesson.palette.forest}"/>
  <rect x="44" y="132" width="1152" height="46" fill="#${lesson.palette.forest}"/>
  ${svgText(`MIDDLE OF MATH · 수업 꾸러미 ${String(slide.number).padStart(2, "0")}/11`, 86, 94, { size: 22, weight: 800, color: "#FFFFFF" })}
  ${svgText(slide.worksheet.title, 86, 145, { size: 46, weight: 900, color: "#FFFFFF" })}
  ${svgText(slide.phase, 1128, 95, { size: 24, weight: 800, color: `#${lesson.palette.yellow}`, anchor: "end" })}
  <rect x="82" y="212" width="1076" height="118" rx="24" fill="#${lesson.palette.mintLight}"/>
  ${svgText(instructionLines, 116, 264, { size: 30, weight: 700, lineHeight: 39, color: `#${lesson.palette.forestDark}` })}
  <line x1="82" y1="1650" x2="1158" y2="1650" stroke="#${lesson.palette.line}" stroke-width="2"/>
  ${svgText(`${lesson.grade} · ${lesson.unit}`, 82, 1691, { size: 22, weight: 700, color: `#${lesson.palette.muted}` })}
  ${svgText("이름 ____________________", 1158, 1691, { size: 22, weight: 700, color: `#${lesson.palette.muted}`, anchor: "end" })}
  ${body}
</svg>`;
}

function linedAnswerBox(x, y, width, height, label) {
  const lines = [];
  lines.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="26" fill="#FFFFFF" stroke="#${lesson.palette.line}" stroke-width="3"/>`);
  if (label) lines.push(svgText(label, x + 30, y + 52, { size: 28, weight: 800, color: `#${lesson.palette.forestDark}` }));
  for (let offset = 104; offset < height - 30; offset += 76) {
    lines.push(`<line x1="${x + 30}" y1="${y + offset}" x2="${x + width - 30}" y2="${y + offset}" stroke="#${lesson.palette.line}" stroke-width="2"/>`);
  }
  return lines.join("");
}

function worksheetBody(slide) {
  const p = lesson.palette;
  if (slide.number === 1) {
    return `
      ${svgLegend("star", 5, "권", 92, 390, 500)}
      ${svgPictographRows([{ label: "책", count: 4 }], "star", 104, 560, { symbolSize: 72, gap: 30, labelWidth: 210 })}
      ${svgText("나의 첫 예상", 92, 790, { size: 38, weight: 900 })}
      ${linedAnswerBox(92, 830, 1056, 260, "그림 네 개는 실제로 ______ 권을 뜻할 것 같아요.")}
      ${linedAnswerBox(92, 1140, 1056, 350, "그렇게 생각한 까닭")}
    `;
  }
  if (slide.number === 2) {
    return `
      ${svgLegend("star", 5, "권", 92, 390, 500)}
      ${svgPictographRows([{ label: "책", count: 4 }], "star", 104, 548, { symbolSize: 66, gap: 26, labelWidth: 210 })}
      <rect x="92" y="760" width="500" height="250" rx="28" fill="#${p.mintLight}" stroke="#${p.mint}" stroke-width="3"/>
      ${svgText(["생각 A", "별이 4개니까 4권이에요."], 126, 820, { size: 31, weight: 800, lineHeight: 60 })}
      <rect x="648" y="760" width="500" height="250" rx="28" fill="#FFF8E8" stroke="#${p.yellow}" stroke-width="3"/>
      ${svgText(["생각 B", "별 하나가 5권이니 20권이에요."], 682, 820, { size: 31, weight: 800, lineHeight: 60 })}
      ${linedAnswerBox(92, 1060, 1056, 420, "두 생각이 갈린 지점과 더 설득력 있는 근거")}
    `;
  }
  if (slide.number === 3) {
    const goals = slide.data.goals;
    return goals
      .map((goal, index) => {
        const y = 402 + index * 260;
        return `<rect x="92" y="${y}" width="1056" height="210" rx="28" fill="${index === 1 ? `#${p.mintLight}` : "#FFFFFF"}" stroke="#${p.line}" stroke-width="3"/>
          <circle cx="154" cy="${y + 72}" r="32" fill="#${index === 1 ? p.forest : p.yellow}"/>
          ${svgText(String(index + 1), 154, y + 84, { size: 28, weight: 900, color: index === 1 ? "#FFFFFF" : `#${p.ink}`, anchor: "middle" })}
          ${svgText(wrapWords(goal, 26), 212, y + 66, { size: 34, weight: 800, lineHeight: 47 })}
          <rect x="962" y="${y + 60}" width="140" height="70" rx="18" fill="#FFFFFF" stroke="#${p.line}" stroke-width="3"/>
          ${svgText("전  □  후  □", 1032, y + 104, { size: 22, weight: 800, anchor: "middle", color: `#${p.muted}` })}`;
      })
      .join("") + `
        <rect x="92" y="1205" width="1056" height="230" rx="28" fill="#FFF8E8" stroke="#${p.yellow}" stroke-width="3"/>
        ${svgText(["내가 오늘 꼭 남길 풀이 흔적", "____________________________________________"], 128, 1278, { size: 32, weight: 800, lineHeight: 85 })}
      `;
  }
  if (slide.number === 4) {
    return slide.data.steps
      .map((step, index) => {
        const y = 402 + index * 250;
        return `<circle cx="148" cy="${y + 70}" r="48" fill="#${index === 2 ? p.forest : p.yellow}"/>
          ${svgText(String(step.n), 148, y + 85, { size: 38, weight: 900, anchor: "middle", color: index === 2 ? "#FFFFFF" : `#${p.ink}` })}
          <rect x="226" y="${y}" width="922" height="150" rx="28" fill="#${index === 2 ? p.mintLight : "FFFFFF"}" stroke="#${p.line}" stroke-width="3"/>
          ${svgText(step.title, 270, y + 58, { size: 34, weight: 900 })}
          ${svgText(step.body, 270, y + 112, { size: 28, weight: 650, color: `#${p.muted}` })}
          ${index < 3 ? `<line x1="148" y1="${y + 126}" x2="148" y2="${y + 230}" stroke="#${p.forest}" stroke-width="6" stroke-linecap="round"/>` : ""}`;
      })
      .join("");
  }
  if (slide.number === 5) {
    return `
      ${svgLegend("star", 5, "권", 92, 390, 500)}
      ${svgPictographRows([{ label: "책", count: 4 }], "star", 104, 550, { symbolSize: 72, gap: 36, labelWidth: 210 })}
      ${[5, 10, 15, 20].map((value, index) => svgText(String(value), 350 + index * 108, 730, { size: 28, weight: 900, anchor: "middle", color: `#${p.forest}` })).join("")}
      ${linedAnswerBox(92, 830, 1056, 260, "뛰어 세기: 5 → ____ → ____ → ____")}
      ${linedAnswerBox(92, 1140, 1056, 300, "곱셈식: 그림 수 ____ × 범례 ____ = 실제 수량 ____")}
    `;
  }
  if (slide.number === 6) {
    return `
      ${svgLegend("circle", 2, "개", 92, 390, 500)}
      ${svgPictographRows(slide.data.rows, "circle", 104, 550, { symbolSize: 66, gap: 28, labelWidth: 260 })}
      ${linedAnswerBox(92, 850, 1056, 250, "첫째 줄: 그림 ____개 × 2 = ____개")}
      ${linedAnswerBox(92, 1140, 1056, 300, "차이: (____ − ____) × 2 = ____개")}
    `;
  }
  if (slide.number === 7) {
    return `
      ${svgLegend("square", 10, "그루", 92, 390, 550)}
      ${svgPictographRows(slide.data.rows, "square", 104, 550, { symbolSize: 64, gap: 30, labelWidth: 250 })}
      ${linedAnswerBox(92, 850, 510, 250, "말하는 사람 · 모두 몇 그루?")}
      ${linedAnswerBox(638, 850, 510, 250, "확인하는 사람 · 범례 한 번?")}
      ${linedAnswerBox(92, 1140, 1056, 300, "A는 B보다 몇 그루 더 많은지 한 문장으로 설명")}
    `;
  }
  if (slide.number === 8) {
    return `
      ${svgLegend("star", 5, "권", 92, 390, 500)}
      ${svgPictographRows(slide.data.rows, "star", 104, 550, { symbolSize: 64, gap: 24, labelWidth: 310 })}
      ${linedAnswerBox(92, 860, 1056, 250, "25권에 필요한 별 수: 25 ÷ 5 = ____개")}
      ${linedAnswerBox(92, 1140, 1056, 300, "위 칸보다 더 그릴 별 수와 까닭")}
    `;
  }
  if (slide.number === 9) {
    return slide.data.cases
      .map((item, index) => {
        const y = 400 + index * 470;
        return `<rect x="92" y="${y}" width="1056" height="405" rx="30" fill="#${index === 0 ? p.mintLight : "FFF8E8"}" stroke="#${index === 0 ? p.mint : p.yellow}" stroke-width="3"/>
          ${svgText(item.label, 128, y + 64, { size: 34, weight: 900, color: `#${p.forestDark}` })}
          ${svgText(wrapWords(item.text, 30), 128, y + 128, { size: 32, weight: 700, lineHeight: 48 })}
          ${svgText("놓친 단계: __________________________", 128, y + 250, { size: 28, weight: 800 })}
          ${svgText("더 정확한 설명: ____________________", 128, y + 330, { size: 28, weight: 800 })}`;
      })
      .join("");
  }
  if (slide.number === 10) {
    return slide.data.items
      .map((item, index) => {
        const y = 392 + index * 370;
        return `<rect x="92" y="${y}" width="1056" height="320" rx="28" fill="#FFFFFF" stroke="#${p.line}" stroke-width="3"/>
          <circle cx="148" cy="${y + 62}" r="34" fill="#${index === 0 ? p.forest : index === 1 ? p.yellow : p.coral}"/>
          ${svgText(String(index + 1), 148, y + 74, { size: 28, weight: 900, anchor: "middle", color: index === 1 ? `#${p.ink}` : "#FFFFFF" })}
          ${svgText(wrapWords(item, 33), 206, y + 65, { size: 30, weight: 750, lineHeight: 45 })}
          ${svgText("답·근거: __________________________________________", 126, y + 250, { size: 27, weight: 700, color: `#${p.muted}` })}`;
      })
      .join("");
  }
  return `
    ${slide.data.takeaways.map((item, index) => `<rect x="92" y="${400 + index * 220}" width="1056" height="170" rx="28" fill="#${index === 1 ? p.mintLight : "FFFFFF"}" stroke="#${p.line}" stroke-width="3"/>
      <circle cx="156" cy="${485 + index * 220}" r="32" fill="#${index === 1 ? p.forest : p.yellow}"/>
      ${svgText("✓", 156, 498 + index * 220, { size: 30, weight: 900, anchor: "middle", color: index === 1 ? "#FFFFFF" : `#${p.ink}` })}
      ${svgText(item, 218, 500 + index * 220, { size: 32, weight: 800 })}`).join("")}
    ${linedAnswerBox(92, 1110, 1056, 330, "오늘 가장 도움이 된 단계와 그 까닭")}
  `;
}

async function renderWorksheets(worksheetSvgDir, worksheetPngDir, outputPdfPath) {
  ensureDir(worksheetSvgDir);
  ensureDir(worksheetPngDir);
  const pdf = await PDFDocument.create();
  const rendered = [];
  for (const slide of lesson.slides) {
    const svg = worksheetShell(slide, worksheetBody(slide));
    const baseName = slide.worksheet.file.replace(/\.png$/i, "");
    const svgPath = path.join(worksheetSvgDir, `${baseName}.svg`);
    const pngPath = path.join(worksheetPngDir, slide.worksheet.file);
    fs.writeFileSync(svgPath, svg, "utf8");
    const pngBuffer = await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true, quality: 95 }).toBuffer();
    fs.writeFileSync(pngPath, pngBuffer);
    const embedded = await pdf.embedPng(pngBuffer);
    const page = pdf.addPage([595.28, 841.89]);
    page.drawImage(embedded, { x: 0, y: 0, width: 595.28, height: 841.89 });
    rendered.push(pngPath);
  }
  fs.writeFileSync(outputPdfPath, await pdf.save());
  return rendered;
}

function makeShadow() {
  return { type: "outer", color: "000000", blur: 2, offset: 1, angle: 135, opacity: 0.1 };
}

function addSlideFrame(pptx, slide, source) {
  const p = lesson.palette;
  slide.background = { color: p.paper };
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.42,
    y: 0.32,
    w: 12.49,
    h: 6.84,
    rectRadius: 0.05,
    fill: { color: p.white },
    line: { color: p.line, width: 1.2 },
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.68,
    y: 0.57,
    w: 1.82,
    h: 0.38,
    rectRadius: 0.06,
    fill: { color: p.forest },
    line: { color: p.forest, transparency: 100 },
  });
  slide.addText(source.phase, {
    x: 0.82,
    y: 0.655,
    w: 1.55,
    h: 0.16,
    fontFace: FONT,
    fontSize: 11,
    bold: true,
    color: p.white,
    margin: 0,
    align: "center",
    valign: "mid",
  });
  slide.addText(`${String(source.number).padStart(2, "0")} / 11`, {
    x: 11.7,
    y: 0.65,
    w: 0.78,
    h: 0.16,
    fontFace: FONT,
    fontSize: 10,
    bold: true,
    color: p.muted,
    margin: 0,
    align: "right",
  });
  slide.addText("MIDDLE OF MATH · 수업 꾸러미", {
    x: 0.72,
    y: 6.82,
    w: 4.2,
    h: 0.16,
    fontFace: FONT,
    fontSize: 8.5,
    bold: true,
    color: p.muted,
    margin: 0,
  });
  slide.addText(`${source.minutes}분`, {
    x: 11.9,
    y: 6.82,
    w: 0.55,
    h: 0.16,
    fontFace: FONT,
    fontSize: 8.5,
    bold: true,
    color: p.muted,
    margin: 0,
    align: "right",
  });
}

function addSlideTitle(slide, title, options = {}) {
  const flow = options.flow || SLIDE_TITLE_FLOW;
  const titleLines = explicitKoreanLines(title, flow);
  slide.addText(toPptxTextRuns(titleLines), {
    x: options.x ?? 0.82,
    y: options.y ?? 1.18,
    w: options.w ?? 7.2,
    h: options.h ?? 0.82,
    fontFace: FONT,
    fontSize: options.fontSize ?? 28,
    bold: true,
    color: options.color ?? lesson.palette.ink,
    margin: 0,
    breakLine: false,
    valign: "mid",
    fit: "shrink",
  });
}

function addLegendChip(pptx, slide, kind, value, unit, x, y, w = 3.2) {
  const p = lesson.palette;
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h: 0.72,
    rectRadius: 0.06,
    fill: { color: p.mint },
    line: { color: p.forest, width: 1.4 },
  });
  addPptSymbol(pptx, slide, kind, x + 0.24, y + 0.19, 0.34, p.forest);
  slide.addText(`한 개는 ${value}${unit}`, {
    x: x + 0.78,
    y: y + 0.22,
    w: w - 0.95,
    h: 0.22,
    fontFace: FONT,
    fontSize: 16,
    bold: true,
    color: p.forestDark,
    margin: 0,
    valign: "mid",
  });
}

function addPptSymbol(pptx, slide, kind, x, y, size, color, outline = false) {
  const shape = kind === "star" ? pptx.ShapeType.star5 : kind === "square" ? pptx.ShapeType.roundRect : pptx.ShapeType.ellipse;
  slide.addShape(shape, {
    x,
    y,
    w: size,
    h: size,
    rectRadius: kind === "square" ? 0.03 : undefined,
    fill: outline ? { color: "FFFFFF", transparency: 100 } : { color },
    line: outline ? { color: lesson.palette.line, width: 1.5, dash: "dash" } : { color, transparency: 100 },
  });
}

function addPptRows(pptx, slide, rows, kind, x, y, options = {}) {
  const { labelW = 1.4, size = 0.43, gap = 0.17, rowGap = 0.92 } = options;
  rows.forEach((row, rowIndex) => {
    const top = y + rowIndex * rowGap;
    slide.addText(row.label, {
      x,
      y: top + 0.1,
      w: labelW,
      h: 0.24,
      fontFace: FONT,
      fontSize: 15,
      bold: true,
      color: lesson.palette.ink,
      margin: 0,
    });
    for (let index = 0; index < (row.count || 0); index += 1) {
      addPptSymbol(pptx, slide, kind, x + labelW + index * (size + gap), top, size, lesson.palette.forest);
    }
    for (let index = 0; index < (row.blankSlots || 0); index += 1) {
      addPptSymbol(pptx, slide, kind, x + labelW + index * (size + gap), top, size, lesson.palette.forest, true);
    }
    slide.addShape(pptx.ShapeType.line, {
      x,
      y: top + 0.58,
      w: options.lineW || 5.6,
      h: 0,
      line: { color: lesson.palette.line, width: 1 },
    });
  });
}

function addCard(pptx, slide, x, y, w, h, options = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.05,
    fill: { color: options.fill || lesson.palette.white },
    line: { color: options.line || lesson.palette.line, width: options.lineWidth || 1.1 },
    shadow: options.shadow === false ? undefined : makeShadow(),
  });
}

function addNotes(slide, source) {
  slide.addNotes(
    [
      `수업 설계 의도: ${source.intent}`,
      `교사 발문·행동: ${source.teacherMove}`,
      `학생 활동: ${source.studentAction}`,
      `관찰 근거: ${source.evidence}`,
      `동반 활동지: ${source.worksheet.file} · ${source.worksheet.title}`,
    ].join("\n"),
  );
}

function addDeckSlide(pptx, pres, source, heroPath) {
  const p = lesson.palette;
  const slide = pres.addSlide();
  if (source.kind === "cover") {
    slide.background = { color: p.paper };
    slide.addImage({ path: heroPath, x: 0, y: 0, w: SLIDE_W, h: SLIDE_H, altText: "그림 카드와 범례 카드를 배열하는 손의 종이 질감 일러스트" });
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 6.45,
      h: SLIDE_H,
      fill: { color: p.paper, transparency: 4 },
      line: { color: p.paper, transparency: 100 },
    });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.72,
      y: 0.65,
      w: 2.05,
      h: 0.44,
      rectRadius: 0.05,
      fill: { color: p.forest },
      line: { color: p.forest, transparency: 100 },
    });
    slide.addText(`${lesson.grade} · 1차시 40분`, { x: 0.9, y: 0.78, w: 1.72, h: 0.14, fontFace: FONT, fontSize: 10.5, bold: true, color: p.white, margin: 0, align: "center" });
    slide.addText(source.title, { x: 0.78, y: 1.62, w: 4.95, h: 1.5, fontFace: FONT, fontSize: 34, bold: true, color: p.forestDark, margin: 0, breakLine: false, fit: "shrink", valign: "mid" });
    slide.addText(lesson.subtitle, { x: 0.82, y: 3.35, w: 4.9, h: 0.62, fontFace: FONT, fontSize: 16.5, bold: true, color: p.ink, margin: 0, breakLine: false, fit: "shrink" });
    slide.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 4.45, w: 4.8, h: 1.05, rectRadius: 0.05, fill: { color: p.mintLight }, line: { color: p.mint, width: 1.2 } });
    slide.addText(source.kicker, { x: 1.08, y: 4.82, w: 4.25, h: 0.3, fontFace: FONT, fontSize: 18, bold: true, color: p.forestDark, margin: 0, align: "center" });
    slide.addText("MIDDLE OF MATH", { x: 0.82, y: 6.62, w: 2.5, h: 0.18, fontFace: FONT, fontSize: 10, bold: true, color: p.muted, margin: 0 });
    addNotes(slide, source);
    return;
  }

  addSlideFrame(pptx, slide, source);
  const isTwoColumnActivity = ["guided", "pair", "independent"].includes(source.kind);
  const activityLayout = LESSON_LAYOUT.twoColumnActivity;
  addSlideTitle(slide, source.title, {
    x: isTwoColumnActivity ? activityLayout.title.x : undefined,
    y: isTwoColumnActivity ? activityLayout.title.y : undefined,
    w: isTwoColumnActivity ? activityLayout.title.w : undefined,
    h: isTwoColumnActivity ? activityLayout.title.h : source.title.includes("\n") ? 1.05 : 0.68,
    flow: isTwoColumnActivity ? TWO_COLUMN_TITLE_FLOW : SLIDE_TITLE_FLOW,
  });

  if (source.kind === "dilemma") {
    addLegendChip(pptx, slide, source.data.symbol, source.data.legendValue, source.data.legendUnit, 0.85, 2.25, 3.1);
    addPptRows(pptx, slide, source.data.rows, source.data.symbol, 0.95, 3.35, { labelW: 1.25, size: 0.55, gap: 0.2, lineW: 4.6 });
    source.data.claims.forEach((claim, index) => {
      const x = 6.0 + index * 3.15;
      addCard(pptx, slide, x, 2.18, 2.72, 2.65, { fill: index === 0 ? p.mintLight : "FFF8E8", line: index === 0 ? p.mint : p.yellow });
      slide.addText(claim.label, { x: x + 0.24, y: 2.45, w: 1.1, h: 0.25, fontFace: FONT, fontSize: 13, bold: true, color: p.forestDark, margin: 0 });
      slide.addText(claim.text, { x: x + 0.24, y: 3.02, w: 2.2, h: 0.85, fontFace: FONT, fontSize: 18, bold: true, color: p.ink, margin: 0, align: "center", valign: "mid", fit: "shrink" });
    });
    slide.addShape(pptx.ShapeType.roundRect, { x: 6.0, y: 5.15, w: 5.87, h: 0.88, rectRadius: 0.05, fill: { color: p.forest }, line: { color: p.forest, transparency: 100 } });
    slide.addText("두 생각은 어디까지 같고, 어디서 달라졌을까요?", { x: 6.35, y: 5.47, w: 5.18, h: 0.24, fontFace: FONT, fontSize: 18, bold: true, color: p.white, margin: 0, align: "center" });
  } else if (source.kind === "goals") {
    source.data.goals.forEach((goal, index) => {
      const y = 2.18 + index * 1.25;
      addCard(pptx, slide, 0.88, y, 8.1, 0.98, { fill: index === 1 ? p.mintLight : p.white, shadow: false });
      slide.addShape(pptx.ShapeType.ellipse, { x: 1.15, y: y + 0.24, w: 0.5, h: 0.5, fill: { color: index === 1 ? p.forest : p.yellow }, line: { color: index === 1 ? p.forest : p.yellow, transparency: 100 } });
      slide.addText(String(index + 1), { x: 1.15, y: y + 0.37, w: 0.5, h: 0.14, fontFace: FONT, fontSize: 13, bold: true, color: index === 1 ? p.white : p.ink, margin: 0, align: "center" });
      slide.addText(goal, { x: 1.9, y: y + 0.28, w: 6.65, h: 0.36, fontFace: FONT, fontSize: 19, bold: true, color: p.ink, margin: 0, fit: "shrink", valign: "mid" });
    });
    addCard(pptx, slide, 9.45, 2.18, 2.55, 3.46, { fill: "FFF8E8", line: p.yellow });
    slide.addText("성공 기준", { x: 9.82, y: 2.58, w: 1.8, h: 0.28, fontFace: FONT, fontSize: 17, bold: true, color: p.forestDark, margin: 0, align: "center" });
    slide.addText(source.data.success, { x: 9.82, y: 3.38, w: 1.8, h: 1.3, fontFace: FONT, fontSize: 18, bold: true, color: p.ink, margin: 0, align: "center", valign: "mid", fit: "shrink" });
  } else if (source.kind === "route") {
    source.data.steps.forEach((step, index) => {
      const x = 0.88 + index * 3.03;
      addCard(pptx, slide, x, 2.55, 2.45, 2.85, { fill: index === 2 ? p.mintLight : p.white, line: index === 2 ? p.forest : p.line });
      slide.addShape(pptx.ShapeType.ellipse, { x: x + 0.84, y: 2.87, w: 0.72, h: 0.72, fill: { color: index === 2 ? p.forest : p.yellow }, line: { color: index === 2 ? p.forest : p.yellow, transparency: 100 } });
      slide.addText(String(step.n), { x: x + 0.84, y: 3.08, w: 0.72, h: 0.16, fontFace: FONT, fontSize: 17, bold: true, color: index === 2 ? p.white : p.ink, margin: 0, align: "center" });
      slide.addText(step.title, { x: x + 0.3, y: 3.88, w: 1.85, h: 0.32, fontFace: FONT, fontSize: 20, bold: true, color: p.forestDark, margin: 0, align: "center" });
      slide.addText(step.body, { x: x + 0.38, y: 4.53, w: 1.7, h: 0.48, fontFace: FONT, fontSize: 14, bold: true, color: p.muted, margin: 0, align: "center", fit: "shrink" });
      if (index < 3) {
        slide.addShape(pptx.ShapeType.chevron, { x: x + 2.5, y: 3.68, w: 0.42, h: 0.58, fill: { color: p.forest }, line: { color: p.forest, transparency: 100 } });
      }
    });
  } else if (source.kind === "model") {
    addLegendChip(pptx, slide, source.data.symbol, source.data.legendValue, source.data.legendUnit, 0.9, 2.18, 3.1);
    addPptRows(pptx, slide, source.data.rows, source.data.symbol, 0.98, 3.32, { labelW: 1.2, size: 0.58, gap: 0.2, lineW: 4.6 });
    source.data.skipCounts.forEach((value, index) => {
      slide.addText(String(value), { x: 2.25 + index * 0.78, y: 4.1, w: 0.45, h: 0.22, fontFace: FONT, fontSize: 14, bold: true, color: p.forest, margin: 0, align: "center" });
    });
    addCard(pptx, slide, 6.1, 2.18, 5.6, 3.72, { fill: p.mintLight, line: p.mint });
    slide.addText("그림을 하나씩 짚으면", { x: 6.65, y: 2.66, w: 4.5, h: 0.3, fontFace: FONT, fontSize: 18, bold: true, color: p.forestDark, margin: 0, align: "center" });
    slide.addText(source.data.skipCounts.join("  →  "), { x: 6.55, y: 3.45, w: 4.7, h: 0.5, fontFace: FONT, fontSize: 24, bold: true, color: p.forest, margin: 0, align: "center" });
    slide.addText(source.data.equation, { x: 6.55, y: 4.62, w: 4.7, h: 0.6, fontFace: FONT, fontSize: 30, bold: true, color: p.ink, margin: 0, align: "center" });
  } else if (["guided", "pair", "independent"].includes(source.kind)) {
    const layout = LESSON_LAYOUT.twoColumnActivity;
    addLegendChip(
      pptx,
      slide,
      source.data.symbol,
      source.data.legendValue,
      source.data.legendUnit,
      layout.legend.x,
      layout.legend.y,
      source.kind === "pair" ? layout.legend.pairW : layout.legend.w,
    );
    addPptRows(pptx, slide, source.data.rows, source.data.symbol, layout.rows.x, layout.rows.y, {
      labelW: source.kind === "independent" ? 2.1 : 1.5,
      size: source.kind === "independent" ? 0.42 : 0.5,
      gap: source.kind === "independent" ? 0.1 : 0.18,
      lineW: layout.rows.lineW,
    });
    addCard(pptx, slide, layout.card.x, layout.card.y, layout.card.w, layout.card.h, { fill: source.kind === "pair" ? "FFF8E8" : p.mintLight, line: source.kind === "pair" ? p.yellow : p.mint });
    slide.addText(source.kind === "pair" ? "짝과 바꾸어 설명하기" : source.kind === "independent" ? "혼자 남길 풀이 흔적" : "혼자 30초 → 짝 설명 1분", {
      x: layout.card.x + layout.cardHeading.insetX,
      y: layout.card.y + layout.cardHeading.offsetY,
      w: layout.card.w - layout.cardHeading.insetX - layout.cardHeading.insetRight,
      h: layout.cardHeading.h,
      fontFace: FONT,
      fontSize: 18,
      bold: true,
      color: p.forestDark,
      margin: 0,
      align: "center",
    });
    source.data.prompts.forEach((prompt, index) => {
      const promptY = layout.card.y + layout.prompt.startOffsetY + index * layout.prompt.stepY;
      const dotX = layout.card.x + layout.prompt.dotInsetX;
      slide.addShape(pptx.ShapeType.ellipse, { x: dotX, y: promptY, w: 0.38, h: 0.38, fill: { color: index === 0 ? p.forest : p.yellow }, line: { color: index === 0 ? p.forest : p.yellow, transparency: 100 } });
      slide.addText(String(index + 1), { x: dotX, y: promptY + 0.1, w: 0.38, h: 0.12, fontFace: FONT, fontSize: 10, bold: true, color: index === 0 ? p.white : p.ink, margin: 0, align: "center" });
      slide.addText(prompt, {
        x: layout.card.x + layout.prompt.textInsetX,
        y: promptY + 0.01,
        w: layout.card.w - layout.prompt.textInsetX - 0.36,
        h: 0.38,
        fontFace: FONT,
        fontSize: 16,
        bold: true,
        color: p.ink,
        margin: 0,
        fit: "shrink",
      });
    });
  } else if (source.kind === "errorDetective") {
    source.data.cases.forEach((item, index) => {
      const x = 0.9 + index * 6.05;
      addCard(pptx, slide, x, 2.26, 5.48, 3.75, { fill: index === 0 ? p.mintLight : "FFF8E8", line: index === 0 ? p.mint : p.yellow });
      slide.addText(item.label, { x: x + 0.38, y: 2.62, w: 1.1, h: 0.24, fontFace: FONT, fontSize: 14, bold: true, color: p.forestDark, margin: 0 });
      slide.addText(item.text, { x: x + 0.55, y: 3.32, w: 4.35, h: 0.78, fontFace: FONT, fontSize: 20, bold: true, color: p.ink, margin: 0, align: "center", valign: "mid", fit: "shrink" });
      slide.addShape(pptx.ShapeType.roundRect, { x: x + 0.6, y: 4.75, w: 4.28, h: 0.68, rectRadius: 0.04, fill: { color: p.white }, line: { color: p.line, width: 1 } });
      slide.addText("놓친 단계: __________________", { x: x + 0.92, y: 4.99, w: 3.65, h: 0.18, fontFace: FONT, fontSize: 15, bold: true, color: p.muted, margin: 0 });
    });
  } else if (source.kind === "exit") {
    source.data.items.forEach((item, index) => {
      const y = 2.15 + index * 1.33;
      addCard(pptx, slide, 0.95, y, 11.35, 1.05, { fill: index === 1 ? p.mintLight : p.white, shadow: false });
      slide.addShape(pptx.ShapeType.ellipse, { x: 1.22, y: y + 0.27, w: 0.48, h: 0.48, fill: { color: index === 0 ? p.forest : index === 1 ? p.yellow : p.coral }, line: { color: index === 0 ? p.forest : index === 1 ? p.yellow : p.coral, transparency: 100 } });
      slide.addText(String(index + 1), { x: 1.22, y: y + 0.39, w: 0.48, h: 0.14, fontFace: FONT, fontSize: 12, bold: true, color: index === 1 ? p.ink : p.white, margin: 0, align: "center" });
      slide.addText(item, { x: 1.98, y: y + 0.3, w: 9.82, h: 0.38, fontFace: FONT, fontSize: 16.5, bold: true, color: p.ink, margin: 0, fit: "shrink", valign: "mid" });
    });
    slide.addText("답만 쓰지 말고 식이나 짧은 까닭을 한 줄 남겨요.", { x: 1.0, y: 6.2, w: 11.25, h: 0.22, fontFace: FONT, fontSize: 14, bold: true, color: p.forest, margin: 0, align: "center" });
  } else if (source.kind === "summary") {
    source.data.takeaways.forEach((item, index) => {
      const y = 2.18 + index * 1.07;
      slide.addShape(pptx.ShapeType.ellipse, { x: 1.05, y: y + 0.16, w: 0.46, h: 0.46, fill: { color: index === 1 ? p.forest : p.yellow }, line: { color: index === 1 ? p.forest : p.yellow, transparency: 100 } });
      slide.addText("✓", { x: 1.05, y: y + 0.27, w: 0.46, h: 0.14, fontFace: FONT, fontSize: 12, bold: true, color: index === 1 ? p.white : p.ink, margin: 0, align: "center" });
      addCard(pptx, slide, 1.72, y, 6.4, 0.8, { fill: index === 1 ? p.mintLight : p.white, shadow: false });
      slide.addText(item, { x: 2.05, y: y + 0.25, w: 5.75, h: 0.25, fontFace: FONT, fontSize: 18, bold: true, color: p.ink, margin: 0 });
    });
    const summaryLayout = LESSON_LAYOUT.summary;
    const questionLines = wrapKoreanWords(source.data.next, SUMMARY_NEXT_QUESTION_FLOW);
    addCard(pptx, slide, summaryLayout.card.x, summaryLayout.card.y, summaryLayout.card.w, summaryLayout.card.h, { fill: "FFF8E8", line: p.yellow });
    slide.addText("다음 차시 질문", { ...summaryLayout.label, fontFace: FONT, fontSize: 16, bold: true, color: p.forestDark, margin: 0, align: "center" });
    slide.addText(toPptxTextRuns(questionLines), {
      ...summaryLayout.question,
      fontFace: FONT,
      fontSize: summaryLayout.question.fontSize,
      bold: true,
      color: p.ink,
      margin: 0,
      align: "center",
      valign: "mid",
      fit: "shrink",
    });
  }
  addNotes(slide, source);
}

async function buildDeck(deckPath, heroPath) {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Middle of Math";
  pptx.company = "Middle of Math";
  pptx.subject = `${lesson.grade} ${lesson.unit} 수업 꾸러미`;
  pptx.title = lesson.title;
  pptx.lang = "ko-KR";
  pptx.theme = {
    headFontFace: FONT,
    bodyFontFace: FONT,
    lang: "ko-KR",
  };
  pptx.defineLayout({ name: "MOM_WIDE", width: SLIDE_W, height: SLIDE_H });
  pptx.layout = "MOM_WIDE";
  lesson.slides.forEach((source) => addDeckSlide(pptx, pptx, source, heroPath));
  await pptx.writeFile({ fileName: deckPath, compression: true });
  await normalizeNoteMasterOrder(deckPath);
}

async function normalizeNoteMasterOrder(deckPath) {
  const zip = await JSZip.loadAsync(fs.readFileSync(deckPath));
  const presentationEntry = zip.file("ppt/presentation.xml");
  ensure(presentationEntry, "PPTX presentation.xml이 없습니다.");
  let presentationXml = await presentationEntry.async("string");
  const notesMasterMatch = presentationXml.match(/<p:notesMasterIdLst>[\s\S]*?<\/p:notesMasterIdLst>/);
  const slideMasterMatch = presentationXml.match(/<p:sldMasterIdLst>[\s\S]*?<\/p:sldMasterIdLst>/);
  const slideListIndex = presentationXml.indexOf("<p:sldIdLst>");
  if (notesMasterMatch && slideMasterMatch && presentationXml.indexOf(notesMasterMatch[0]) > slideListIndex) {
    presentationXml = presentationXml.replace(notesMasterMatch[0], "");
    presentationXml = presentationXml.replace(
      slideMasterMatch[0],
      `${slideMasterMatch[0]}${notesMasterMatch[0]}`,
    );
    zip.file("ppt/presentation.xml", presentationXml);
    const normalizedDeck = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });
    fs.writeFileSync(deckPath, normalizedDeck);
  }
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "pipe", encoding: "utf8", ...options });
  if (result.status !== 0) {
    throw new Error(`${command} 실패\n${result.stdout || ""}\n${result.stderr || ""}`.trim());
  }
  return result;
}

function renderDeck(deckPath, outputRoot) {
  const officeEnvironment = fs.existsSync(MACOS_FONTCONFIG)
    ? { ...process.env, FONTCONFIG_FILE: process.env.FONTCONFIG_FILE || MACOS_FONTCONFIG }
    : process.env;
  runCommand(
    "soffice",
    ["--headless", "--convert-to", "pdf", "--outdir", outputRoot, deckPath],
    { env: officeEnvironment },
  );
  const pdfPath = path.join(outputRoot, `${path.basename(deckPath, ".pptx")}.pdf`);
  ensure(fs.existsSync(pdfPath), "PowerPoint PDF 렌더 결과가 없습니다.");
  const slideDir = path.join(outputRoot, "slides");
  ensureDir(slideDir);
  runCommand("pdftoppm", ["-jpeg", "-r", "150", pdfPath, path.join(slideDir, "slide")]);
  const slides = fs.readdirSync(slideDir).filter((name) => /^slide-\d+\.jpg$/.test(name)).sort();
  ensure(slides.length === lesson.slides.length, `슬라이드 렌더 수가 다릅니다: ${slides.length}`);
  return { pdfPath, slidePaths: slides.map((name) => path.join(slideDir, name)) };
}

async function buildContactSheet(imagePaths, destination, options) {
  const { columns, tileWidth, tileHeight } = options;
  const gap = 16;
  const rows = Math.ceil(imagePaths.length / columns);
  const width = columns * tileWidth + (columns + 1) * gap;
  const height = rows * tileHeight + (rows + 1) * gap;
  const tiles = await Promise.all(imagePaths.map(async (imagePath, index) => ({
    input: await sharp(imagePath)
      .resize(tileWidth, tileHeight, { fit: "contain", background: "#ffffff" })
      .jpeg({ quality: 88 })
      .toBuffer(),
    left: gap + (index % columns) * (tileWidth + gap),
    top: gap + Math.floor(index / columns) * (tileHeight + gap),
  })));
  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: "#e8efec",
    },
  }).composite(tiles).jpeg({ quality: 90 }).toFile(destination);
}

function buildDesignIntentMarkdown() {
  const rows = lesson.slides.map((slide) => `| ${slide.number} | ${slide.phase} | ${slide.minutes}분 | ${slide.intent} | ${slide.teacherMove} | ${slide.studentAction} | ${slide.worksheet.file} |`).join("\n");
  return `# ${lesson.title} — 슬라이드별 수업 설계 의도

- 대상: ${lesson.grade}
- 단원: ${lesson.unit}
- 차시: ${lesson.durationMinutes}분
- 교육과정 앵커: ${lesson.curriculumAnchor}
- 관찰 행동: ${lesson.targetBehavior}
- 개인정보 원칙: ${lesson.privacyRule}

| 장 | 단계 | 시간 | 수업 설계 의도 | 교사 행동 | 학생 활동 | 동반 활동지 |
|---:|---|---:|---|---|---|---|
${rows}
`;
}

function buildAnswerKeyMarkdown() {
  return `# ${lesson.title} — 교사용 정답·관찰 포인트

${Object.entries(lesson.answerKey).map(([slide, answer]) => `- 슬라이드 ${slide}: ${answer}`).join("\n")}

한 번의 오답으로 오개념을 확정하지 않습니다. 서로 다른 직접·전이 문항에서 같은 오류가 반복되는지 확인한 뒤 다음 수업 행동을 정합니다.
`;
}

function buildWebHtml(digest, assetNames) {
  const base = `/static/edu_materials/lesson_bundles/${lesson.id}/${digest}`;
  const cards = lesson.slides.map((slide, index) => {
    const slideImage = `${base}/${assetNames.slides[index]}`;
    const worksheetImage = `${base}/${assetNames.worksheets[index]}`;
    return `<article class="slide-card">
      <div class="slide-media"><img src="${slideImage}" alt="${escapeXml(`${slide.number}장 ${slide.phase} 슬라이드`)}" loading="lazy"></div>
      <div class="slide-copy">
        <div class="eyebrow">${String(slide.number).padStart(2, "0")} · ${escapeXml(slide.phase)} · ${slide.minutes}분</div>
        <h2>${escapeXml(slide.title.replaceAll("\n", " "))}</h2>
        <dl>
          <div><dt>수업 설계 의도</dt><dd>${escapeXml(slide.intent)}</dd></div>
          <div><dt>학생 활동</dt><dd>${escapeXml(slide.studentAction)}</dd></div>
          <div><dt>관찰 근거</dt><dd>${escapeXml(slide.evidence)}</dd></div>
        </dl>
        <a class="worksheet" href="${worksheetImage}" target="_blank" rel="noopener">${escapeXml(slide.worksheet.title)} 이미지 열기</a>
        <img class="worksheet-preview" src="${worksheetImage}" alt="${escapeXml(`${slide.worksheet.title} 빈 활동지`)}" loading="lazy">
      </div>
    </article>`;
  }).join("\n");

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeXml(lesson.title)} · Middle of Math 수업 꾸러미</title>
  <style>
    :root{--forest:#${lesson.palette.forest};--dark:#${lesson.palette.forestDark};--mint:#${lesson.palette.mint};--soft:#${lesson.palette.mintLight};--yellow:#${lesson.palette.yellow};--ink:#${lesson.palette.ink};--muted:#${lesson.palette.muted};--line:#${lesson.palette.line};--paper:#${lesson.palette.paper}}
    *{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:"Noto Sans KR","Apple SD Gothic Neo",system-ui,sans-serif;line-height:1.65;word-break:keep-all}a{color:inherit}.page{width:min(1180px,calc(100% - 32px));margin:0 auto;padding:34px 0 72px}.hero{overflow:hidden;border:1px solid var(--line);border-radius:28px;background:#fff;box-shadow:0 18px 50px rgba(13,73,58,.08)}.hero-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(360px,.95fr)}.hero-copy{padding:54px}.badge{display:inline-flex;min-height:36px;align-items:center;border-radius:999px;background:var(--forest);padding:0 16px;color:#fff;font-size:14px;font-weight:900}.hero h1{margin:24px 0 10px;color:var(--dark);font-size:clamp(38px,6vw,68px);line-height:1.08}.hero p{margin:0;color:var(--muted);font-size:18px}.hero-art{min-height:420px;background:url('${base}/${assetNames.hero}') center/cover no-repeat}.meta{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;border-top:1px solid var(--line);background:var(--line)}.meta div{background:#fff;padding:20px}.meta strong{display:block;color:var(--dark);font-size:14px}.meta span{display:block;margin-top:5px;color:var(--muted);font-size:14px}.downloads{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}.button{display:inline-flex;min-height:48px;align-items:center;justify-content:center;border-radius:14px;background:var(--forest);padding:0 20px;color:#fff;font-weight:900;text-decoration:none}.button.secondary{border:1px solid var(--line);background:#fff;color:var(--dark)}.notice{margin:28px 0 44px;border:1px solid var(--mint);border-radius:20px;background:var(--soft);padding:22px 24px;color:var(--dark)}.notice strong{font-weight:900}.section-heading{margin:0 0 22px}.section-heading h2{margin:0;color:var(--dark);font-size:32px}.section-heading p{margin:5px 0 0;color:var(--muted)}.slide-list{display:grid;gap:24px}.slide-card{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(360px,.9fr);overflow:hidden;border:1px solid var(--line);border-radius:24px;background:#fff}.slide-media{display:flex;align-items:flex-start;background:#edf3f1;padding:18px}.slide-media img{width:100%;height:auto;border-radius:14px;box-shadow:0 12px 28px rgba(23,33,29,.12)}.slide-copy{padding:28px}.eyebrow{color:var(--forest);font-size:13px;font-weight:900}.slide-copy h2{margin:8px 0 18px;color:var(--dark);font-size:26px;line-height:1.25}.slide-copy dl{display:grid;gap:14px;margin:0}.slide-copy dl div{border-top:1px solid var(--line);padding-top:12px}.slide-copy dt{font-size:13px;font-weight:900;color:var(--dark)}.slide-copy dd{margin:4px 0 0;color:var(--muted);font-size:15px}.worksheet{display:inline-flex;margin-top:20px;border-radius:12px;background:#fff3cc;padding:10px 14px;color:var(--dark);font-size:14px;font-weight:900;text-decoration:none}.worksheet-preview{display:block;width:170px;height:auto;margin-top:14px;border:1px solid var(--line);border-radius:10px}.footer{margin-top:34px;border-radius:22px;background:var(--dark);padding:28px;color:#fff}.footer p{margin:4px 0;color:#d9eee7}.footer code{color:#fff3cc}@media(max-width:820px){.hero-grid,.slide-card{grid-template-columns:1fr}.hero-copy{padding:34px 26px}.hero-art{min-height:280px}.meta{grid-template-columns:1fr 1fr}.slide-copy{padding:22px}.page{width:min(100% - 20px,1180px)}}
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <div class="hero-grid">
        <div class="hero-copy">
          <span class="badge">한 차시 완결형 수업 꾸러미</span>
          <h1>${escapeXml(lesson.title)}</h1>
          <p>${escapeXml(lesson.subtitle)}</p>
          <div class="downloads">
            <a class="button" href="${base}/${assetNames.deck}">PPTX 내려받기</a>
            <a class="button secondary" href="${base}/${assetNames.deckPdf}">슬라이드 PDF</a>
            <a class="button secondary" href="${base}/${assetNames.worksheetPdf}">활동지 11종 PDF</a>
            <a class="button secondary" href="${base}/${assetNames.intent}">설계 의도 원문</a>
            <a class="button secondary" href="${base}/${assetNames.answerKey}">교사용 정답·관찰 포인트</a>
          </div>
        </div>
        <div class="hero-art" role="img" aria-label="별과 원 그림 카드를 배열하며 범례를 탐구하는 손의 종이 질감 일러스트"></div>
      </div>
      <div class="meta">
        <div><strong>교과·대상</strong><span>${escapeXml(`${lesson.subject} · ${lesson.grade}`)}</span></div>
        <div><strong>단원</strong><span>${escapeXml(lesson.unit)}</span></div>
        <div><strong>수업 시간</strong><span>${lesson.durationMinutes}분</span></div>
        <div><strong>핵심 행동</strong><span>그림 수 → 범례 → 실제 수량 → 비교</span></div>
      </div>
    </section>
    <aside class="notice"><strong>등록용 공개 자료 안내</strong><br>이 페이지에는 수업 목표, 수업 흐름, 슬라이드별 설계 의도, 활동지, 내려받기 파일이 함께 있습니다. 실제 학생 이름·얼굴·댓글은 포함하지 않았습니다. 대회 운영 기준상 외부 커뮤니티 게시물로 인정되는지는 제출 전 운영진 기준을 다시 확인하세요.</aside>
    <div class="section-heading"><h2>슬라이드와 수업 설계 의도</h2><p>각 장의 학생 활동과 동반 활동지를 함께 확인할 수 있습니다.</p></div>
    <section class="slide-list">${cards}</section>
    <footer class="footer"><strong>제작·검수 원칙</strong><p>Middle of Math 원자료의 범례·행·오답 근거를 사용했으며, 그림그래프는 화면에 범례와 모든 데이터 행을 함께 표시했습니다.</p><p>빈 활동지만 공개하고 실제 학생 결과물은 올리지 않습니다.</p></footer>
  </main>
</body>
</html>`;
}

function copyFile(source, destination) {
  ensureDir(path.dirname(destination));
  fs.copyFileSync(source, destination);
}

async function buildWebPackage({ eduititRoot, outputRoot, digest, heroPath, deckPath, deckPdfPath, worksheetPdfPath, slidePaths, worksheetPaths, intentPath, answerKeyPath }) {
  const localPackage = path.join(outputRoot, "web-package");
  resetGeneratedDirectory(localPackage);
  const targetBase = eduititRoot
    ? path.join(eduititRoot, "edu_materials", "static", "edu_materials", "lesson_bundles", lesson.id)
    : localPackage;
  if (eduititRoot) resetGeneratedDirectory(targetBase);
  const digestDir = path.join(targetBase, digest);
  ensureDir(digestDir);

  const assetNames = {
    hero: "cover-illustration.png",
    deck: `${lesson.id}.pptx`,
    deckPdf: `${lesson.id}.pdf`,
    worksheetPdf: `${lesson.id}-worksheets.pdf`,
    intent: "slide-design-intent.md",
    answerKey: "teacher-answer-key.md",
    slides: [],
    worksheets: [],
  };
  copyFile(heroPath, path.join(digestDir, assetNames.hero));
  copyFile(deckPath, path.join(digestDir, assetNames.deck));
  copyFile(deckPdfPath, path.join(digestDir, assetNames.deckPdf));
  copyFile(worksheetPdfPath, path.join(digestDir, assetNames.worksheetPdf));
  copyFile(intentPath, path.join(digestDir, assetNames.intent));
  copyFile(answerKeyPath, path.join(digestDir, assetNames.answerKey));
  slidePaths.forEach((source, index) => {
    const name = `slide-${String(index + 1).padStart(2, "0")}.jpg`;
    copyFile(source, path.join(digestDir, name));
    assetNames.slides.push(name);
  });
  worksheetPaths.forEach((source, index) => {
    const name = lesson.slides[index].worksheet.file;
    copyFile(source, path.join(digestDir, name));
    assetNames.worksheets.push(name);
  });

  const sourceHtml = buildWebHtml(digest, assetNames);
  ensure(!sourceHtml.includes("data:image/"), "게시 HTML에 인라인 이미지가 들어갔습니다.");
  ensure(!sourceHtml.includes("http://"), "게시 HTML에 HTTP 외부 자원이 들어갔습니다.");
  fs.writeFileSync(path.join(targetBase, "source.html"), sourceHtml, "utf8");

  const assets = fs.readdirSync(digestDir).sort().map((name) => {
    const filePath = path.join(digestDir, name);
    return { path: `${digest}/${name}`, sha256: sha256File(filePath), bytes: fs.statSync(filePath).size };
  });
  const manifest = {
    schemaVersion: 1,
    lessonId: lesson.id,
    lessonVersion: lesson.version,
    digest,
    sourceHtml: "source.html",
    sourceSha256: sha256Buffer(Buffer.from(sourceHtml, "utf8")),
    sourceBytes: Buffer.byteLength(sourceHtml, "utf8"),
    thumbnailAsset: `${digest}/${assetNames.hero}`,
    assets,
  };
  fs.writeFileSync(path.join(targetBase, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  if (eduititRoot) {
    const localDigestDir = path.join(localPackage, digest);
    ensureDir(localDigestDir);
    assets.forEach((asset) => {
      copyFile(
        path.join(targetBase, asset.path),
        path.join(localPackage, asset.path),
      );
    });
    copyFile(path.join(targetBase, "source.html"), path.join(localPackage, "source.html"));
    copyFile(path.join(targetBase, "manifest.json"), path.join(localPackage, "manifest.json"));
  }
  return { targetBase, manifest };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  validateLesson(lesson);
  assertLessonLayout(LESSON_LAYOUT);
  const repoRoot = path.resolve(__dirname, "../..");
  const outputRoot = path.join(repoRoot, "artifacts", "vivasam", lesson.id);
  const heroPath = path.join(__dirname, "assets", "pictograph-legend-hero.png");
  ensure(fs.existsSync(heroPath), `대표 이미지가 없습니다: ${heroPath}`);
  resetGeneratedDirectory(outputRoot);
  const worksheetSvgDir = path.join(outputRoot, "worksheets", "svg");
  const worksheetPngDir = path.join(outputRoot, "worksheets", "png");
  const worksheetPdfPath = path.join(outputRoot, `${lesson.id}-worksheets.pdf`);
  const intentPath = path.join(outputRoot, "slide-design-intent.md");
  const answerKeyPath = path.join(outputRoot, "teacher-answer-key.md");
  const lessonManifestPath = path.join(outputRoot, "lesson.json");
  fs.writeFileSync(intentPath, buildDesignIntentMarkdown(), "utf8");
  fs.writeFileSync(answerKeyPath, buildAnswerKeyMarkdown(), "utf8");
  fs.writeFileSync(lessonManifestPath, `${JSON.stringify(lesson, null, 2)}\n`, "utf8");

  const worksheetPaths = await renderWorksheets(worksheetSvgDir, worksheetPngDir, worksheetPdfPath);
  const deckPath = path.join(outputRoot, `${lesson.id}.pptx`);
  await buildDeck(deckPath, heroPath);

  let deckPdfPath = path.join(outputRoot, `${lesson.id}.pdf`);
  let slidePaths = [];
  if (!options.skipOffice) {
    const rendered = renderDeck(deckPath, outputRoot);
    deckPdfPath = rendered.pdfPath;
    slidePaths = rendered.slidePaths;
  } else {
    ensure(fs.existsSync(deckPdfPath), "--skip-office를 쓰려면 기존 PDF가 필요합니다.");
    const slideDir = path.join(outputRoot, "slides");
    slidePaths = fs.readdirSync(slideDir).filter((name) => /^slide-\d+\.jpg$/.test(name)).sort().map((name) => path.join(slideDir, name));
  }

  const slideContactSheetPath = path.join(outputRoot, "slides-contact-sheet.jpg");
  const worksheetContactSheetPath = path.join(outputRoot, "worksheets-contact-sheet.jpg");
  await buildContactSheet(slidePaths, slideContactSheetPath, {
    columns: 3,
    tileWidth: 480,
    tileHeight: 270,
  });
  await buildContactSheet(worksheetPaths, worksheetContactSheetPath, {
    columns: 4,
    tileWidth: 280,
    tileHeight: 396,
  });

  const digestInput = Buffer.concat([
    Buffer.from(JSON.stringify(lesson)),
    Buffer.from(BUILD_VERSION),
    Buffer.from(JSON.stringify(LESSON_LAYOUT)),
    Buffer.from(`${LAYOUT_CONTRACT_VERSION}:${TEXT_FLOW_CONTRACT_VERSION}`),
    fs.readFileSync(heroPath),
  ]);
  const digest = sha256Buffer(digestInput).slice(0, 12);
  const web = await buildWebPackage({
    eduititRoot: options.eduititRoot,
    outputRoot,
    digest,
    heroPath,
    deckPath,
    deckPdfPath,
    worksheetPdfPath,
    slidePaths,
    worksheetPaths,
    intentPath,
    answerKeyPath,
  });

  const artifactManifest = {
    lessonId: lesson.id,
    lessonVersion: lesson.version,
    buildVersion: BUILD_VERSION,
    layoutContractVersion: LAYOUT_CONTRACT_VERSION,
    textFlowContractVersion: TEXT_FLOW_CONTRACT_VERSION,
    digest,
    durationMinutes: lesson.durationMinutes,
    slideCount: slidePaths.length,
    worksheetCount: worksheetPaths.length,
    deck: path.relative(repoRoot, deckPath),
    deckPdf: path.relative(repoRoot, deckPdfPath),
    worksheetPdf: path.relative(repoRoot, worksheetPdfPath),
    slideContactSheet: path.relative(repoRoot, slideContactSheetPath),
    worksheetContactSheet: path.relative(repoRoot, worksheetContactSheetPath),
    webPackage: web.targetBase,
  };
  fs.writeFileSync(path.join(outputRoot, "artifact-manifest.json"), `${JSON.stringify(artifactManifest, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(artifactManifest, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
