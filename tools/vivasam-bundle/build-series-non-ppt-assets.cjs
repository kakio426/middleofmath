#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const { PDFDocument } = require("pdf-lib");
const sharp = require("sharp");

const pictographLesson = require("./lesson-pictograph.cjs");
const { SERIES_PLAN } = require("./g3-series-plan.cjs");
const { wrapKoreanWords } = require("./korean-text-flow.cjs");

const REPO_ROOT = path.resolve(__dirname, "../..");
const ARTIFACTS_ROOT = path.join(REPO_ROOT, "artifacts", "vivasam");
const DEFAULT_EDUITIT_ROOT = path.resolve(REPO_ROOT, "../eduitit");
const FIXED_BUILD_TIME = "2026-08-07T00:00:00.000Z";

const SERIES_ASSET_CONTRACT = Object.freeze({
  version: 1,
  worksheetWidth: 1240,
  worksheetHeight: 1754,
  representativeWidth: 1200,
  representativeHeight: 675,
  titleMaxCharactersPerLine: 11,
  worksheetCount: 30,
  packageCount: 30,
  worksheetFilesPerDeck: 1,
  pptAuthor: "Claude",
  codexOwnsNonPptArtifacts: true,
});

const PALETTE_BY_DOMAIN = Object.freeze({
  multiplication: { accent: "#6941C6", dark: "#352064", soft: "#F2EDFF", warm: "#F7C948" },
  division: { accent: "#0F766E", dark: "#164E48", soft: "#E8F7F3", warm: "#F4C95D" },
  fraction: { accent: "#C2416C", dark: "#70213E", soft: "#FCEEF3", warm: "#F5C451" },
  length: { accent: "#2563A8", dark: "#173E68", soft: "#EAF3FC", warm: "#F4C95D" },
  circle: { accent: "#7C3AED", dark: "#47218B", soft: "#F2ECFF", warm: "#F5C451" },
  measurement: { accent: "#B45309", dark: "#6B3207", soft: "#FFF3DF", warm: "#F4C95D" },
  pictograph: { accent: "#0E7490", dark: "#164E63", soft: "#E8F7FB", warm: "#F5C451" },
});

function ensure(condition, message) {
  if (!condition) throw new Error(`비-PPT 산출물 계약 위반: ${message}`);
}

function compact(value) {
  return String(value ?? "").replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeHtml(value) {
  return escapeXml(value);
}

function escapeMarkdown(value) {
  return compact(value).replace(/\|/g, "\\|");
}

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function fileHash(filePath) {
  return sha256(fs.readFileSync(filePath));
}

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function resetDirectory(directory) {
  fs.rmSync(directory, { recursive: true, force: true });
  ensureDir(directory);
}

function listRelativeFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  const files = [];
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) files.push(path.relative(directory, absolute).split(path.sep).join("/"));
    }
  };
  visit(directory);
  return files.sort();
}

function writeUtf8(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content.endsWith("\n") ? content : `${content}\n`, "utf8");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function normalizeSlide(slide, index) {
  return {
    ...slide,
    number: Number(slide.number || index + 1),
    title: compact(slide.title),
    phase: compact(slide.phase),
    kind: compact(slide.kind),
    visibleContent: Array.isArray(slide.visibleContent) ? slide.visibleContent.map(compact).filter(Boolean) : [],
    intent: compact(slide.intent),
    teacherMove: compact(slide.teacherMove),
    studentAction: compact(slide.studentAction),
    evidence: compact(slide.evidence),
  };
}

function loadSeriesLessons({ repoRoot = REPO_ROOT } = {}) {
  const artifactsRoot = path.join(repoRoot, "artifacts", "vivasam");
  return SERIES_PLAN.map((entry) => {
    const source = entry.existing
      ? pictographLesson
      : JSON.parse(fs.readFileSync(path.join(artifactsRoot, entry.lessonId, "lesson-schema.json"), "utf8"));
    ensure(source.id === entry.lessonId, `${entry.lessonId}의 수업 ID가 계획과 다릅니다.`);
    ensure(Array.isArray(source.slides) && source.slides.length === 11, `${entry.lessonId}의 슬라이드는 11장이어야 합니다.`);
    return {
      ...source,
      sequence: entry.sequence,
      title: compact(source.title),
      subtitle: compact(source.subtitle),
      grade: compact(source.grade),
      unit: compact(source.unit),
      targetBehavior: compact(source.targetBehavior),
      privacyRule: compact(source.privacyRule),
      slides: source.slides.map(normalizeSlide),
      worksheet: {
        ...source.worksheet,
        file: `${entry.lessonId}-worksheet.png`,
        title: compact(source.worksheet?.title || `${source.title} 통합 활동지`),
        instruction: compact(source.worksheet?.instruction || "생각 순서, 적용, 설명, 점검을 한 장에 기록해요."),
      },
    };
  });
}

function findSlide(lesson, kind, fallbackNumber) {
  return lesson.slides.find((slide) => slide.kind === kind)
    || lesson.slides.find((slide) => slide.number === fallbackNumber)
    || { visibleContent: [] };
}

function stripPrefix(value) {
  return compact(value)
    .replace(/^\d+[.)]\s*/, "")
    .replace(/^(상황|문제|질문|다시 볼 문제|확인 결과|핵심 이유|오늘의 핵심)\s*:\s*/, "");
}

function truncateWords(value, maxCharacters) {
  const normalized = compact(value);
  if (Array.from(normalized).length <= maxCharacters) return normalized;
  const tokens = normalized.split(" ");
  const kept = [];
  for (const token of tokens) {
    const candidate = [...kept, token].join(" ");
    if (Array.from(`${candidate}…`).length > maxCharacters) break;
    kept.push(token);
  }
  ensure(kept.length > 0, `어절을 보존해 ${maxCharacters}자 안으로 줄일 수 없습니다: ${normalized}`);
  return `${kept.join(" ")}…`;
}

function conciseErrorCase(value) {
  const normalized = compact(value);
  const colonIndex = normalized.indexOf(":");
  if (/^검토할 답/.test(normalized) && colonIndex > 0) {
    return `${normalized.slice(0, colonIndex)} · 첫 오류는?`;
  }
  return truncateWords(normalized, 46);
}

function firstVisible(slide, prefixPattern, fallbackIndex = 0) {
  return stripPrefix(slide.visibleContent.find((item) => prefixPattern.test(item)) || slide.visibleContent[fallbackIndex] || "");
}

function lessonDomain(lesson) {
  const id = lesson.id;
  if (id.includes("multiplication")) return "multiplication";
  if (id.includes("division")) return "division";
  if (id.includes("fraction")) return "fraction";
  if (id.includes("length")) return "length";
  if (id.includes("circle")) return "circle";
  if (id.includes("capacity") || id.includes("weight")) return "measurement";
  return "pictograph";
}

function routeStepsFromSlide(slide) {
  if (Array.isArray(slide.data?.steps)) {
    return slide.data.steps.map((step) => compact(step.title));
  }
  return slide.visibleContent.slice(0, 4).map(stripPrefix);
}

function firstLessonAnswers(lesson) {
  const exit = compact(lesson.answerKey?.[10]).split(/,\s*/).map(compact).filter(Boolean);
  return {
    guided: compact(lesson.answerKey?.[6]),
    transfer: compact(lesson.answerKey?.[7]),
    errors: [compact(lesson.answerKey?.[9])],
    exit: exit.length === 3 ? exit : [compact(lesson.answerKey?.[10]), "범례를 한 번 적용", "실제 수량으로 비교"],
  };
}

function schemaAnswers(lesson) {
  return {
    guided: compact(lesson.answerKey?.guidedPractice?.label || lesson.answerKey?.sourceJudgments?.[1]?.label),
    transfer: compact(lesson.answerKey?.extension || lesson.mathOracle?.extensionAnswer),
    errors: (lesson.answerKey?.errorAnalysis || []).slice(0, 2).map((item) => compact(`${item.rationale} ${item.derivation}`)),
    exit: (lesson.answerKey?.exitTicket || []).map(compact),
  };
}

function buildWorksheetModel(lesson) {
  const route = findSlide(lesson, "route", 4);
  const guided = findSlide(lesson, "guided", 6);
  const transfer = findSlide(lesson, "pair", 7);
  const errors = findSlide(lesson, "errorDetective", 9);
  const exit = findSlide(lesson, "exit", 10);
  const summary = findSlide(lesson, "summary", 11);
  const answerData = lesson.id === pictographLesson.id ? firstLessonAnswers(lesson) : schemaAnswers(lesson);

  const guidedPrompt = firstVisible(guided, /^(문제|질문):/, 1)
    || compact(guided.data?.prompts?.join(" / "));
  const guidedContext = firstVisible(guided, /^상황:/, 0)
    || compact(guided.data?.rows?.map((row) => `${row.label} 그림 ${row.count}개`).join(", "));
  const guidedChoices = compact(guided.visibleContent.find((item) => /^선택지:/.test(item)) || "").replace(/^선택지:\s*/, "");
  const transferPrompt = firstVisible(transfer, /^문제:/, 0)
    || compact(transfer.data?.prompts?.join(" / "));

  let errorCases = [];
  if (Array.isArray(errors.data?.cases)) errorCases = errors.data.cases.map((item) => `${item.label}: ${compact(item.text)}`);
  if (!errorCases.length) errorCases = errors.visibleContent.filter((item) => /^(검토할 답|생각 [AB])/.test(item)).slice(0, 2);

  let exitItems = Array.isArray(exit.data?.items) ? exit.data.items.map(compact) : exit.visibleContent.slice(0, 3).map(stripPrefix);
  exitItems = exitItems.filter(Boolean).slice(0, 3);

  const coreRule = stripPrefix(
    summary.visibleContent.find((item) => /^오늘의 핵심:/.test(item))
      || findSlide(lesson, "goals", 3).visibleContent[1]
      || lesson.targetBehavior,
  );

  const model = {
    sequence: lesson.sequence,
    lessonId: lesson.id,
    title: lesson.title,
    subtitle: lesson.subtitle,
    grade: lesson.grade,
    unit: lesson.unit,
    targetBehavior: lesson.targetBehavior,
    worksheetFile: `${lesson.id}-worksheet.png`,
    instruction: lesson.worksheet.instruction,
    domain: lessonDomain(lesson),
    coreRule,
    routeSteps: routeStepsFromSlide(route),
    guided: { context: guidedContext, prompt: guidedPrompt, choices: guidedChoices },
    transfer: {
      prompt: transferPrompt,
      cues: transfer.visibleContent
        .filter((item) => !/^(말하는 사람|듣는 사람|문제):/.test(item))
        .slice(0, 2)
        .map(stripPrefix),
    },
    errorCases: errorCases.map(conciseErrorCase).slice(0, 2),
    exitItems,
    answers: answerData,
  };
  ensure(model.routeSteps.length === 4, `${lesson.id} 생각 순서가 네 단계가 아닙니다.`);
  ensure(model.guided.prompt, `${lesson.id} 따라 풀기 문제가 없습니다.`);
  ensure(model.transfer.prompt, `${lesson.id} 전이 문제가 없습니다.`);
  ensure(model.errorCases.length === 2, `${lesson.id} 오류 사례가 두 개가 아닙니다.`);
  ensure(model.exitItems.length === 3, `${lesson.id} 나가기 문항이 세 개가 아닙니다.`);
  ensure(model.answers.guided && model.answers.transfer, `${lesson.id} 활동지 정답이 비었습니다.`);
  ensure(model.answers.exit.length === 3, `${lesson.id} 나가기 정답이 세 개가 아닙니다.`);
  return model;
}

function wrapText(source, { maxCharacters = 28, maxLines = 3, minLastLineCharacters = 2, hardMax = 58 } = {}) {
  const normalized = compact(source);
  ensure(normalized, "표시할 문장이 비었습니다.");
  for (let width = maxCharacters; width <= hardMax; width += 1) {
    try {
      return wrapKoreanWords(normalized, {
        maxCharactersPerLine: width,
        maxLines,
        minLastLineCharacters,
      });
    } catch (error) {
      if (!/한국어 줄바꿈 계약 위반/.test(error.message)) throw error;
    }
  }
  throw new Error(`비-PPT 산출물 계약 위반: 문장을 ${maxLines}줄 안에 어절 단위로 배치할 수 없습니다: ${normalized}`);
}

function wrapRepresentativeTitle(title) {
  return wrapText(title, {
    maxCharacters: SERIES_ASSET_CONTRACT.titleMaxCharactersPerLine,
    maxLines: 2,
    minLastLineCharacters: 4,
    hardMax: SERIES_ASSET_CONTRACT.titleMaxCharactersPerLine,
  });
}

function textElement({ x, y, text, fontSize, color = "#18201D", weight = 600, maxCharacters = 30, maxLines = 3, lineHeight = 1.35, anchor = "start", className = "", hardMaxCharacters = maxCharacters }) {
  const lines = Array.isArray(text) ? text : wrapText(text, { maxCharacters, maxLines, hardMax: hardMaxCharacters });
  const tspans = lines.map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : Math.round(fontSize * lineHeight)}">${escapeXml(line)}</tspan>`).join("");
  return `<text x="${x}" y="${y}" font-family="Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="${fontSize}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}" class="${className}">${tspans}</text>`;
}

function conceptVisual(model, { x, y, width, height, accent, warm }) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  if (model.domain === "multiplication") {
    const dots = [];
    for (let row = 0; row < 3; row += 1) for (let column = 0; column < 4; column += 1) {
      dots.push(`<circle cx="${x + 42 + column * 52}" cy="${y + 34 + row * 46}" r="13" fill="${row === 1 ? warm : accent}"/>`);
    }
    return `<g aria-label="같은 묶음 배열"><rect x="${x + 8}" y="${y + 4}" width="${width - 16}" height="${height - 8}" rx="30" fill="#FFFFFF" opacity=".78"/>${dots.join("")}<path d="M${x + 28} ${y + height - 30}H${x + width - 28}" stroke="${accent}" stroke-width="5" stroke-linecap="round"/></g>`;
  }
  if (model.domain === "division") {
    const groups = [0, 1, 2].map((group) => {
      const gx = x + 14 + group * 78;
      const circles = [0, 1, 2, 3].map((index) => `<circle cx="${gx + 20 + (index % 2) * 28}" cy="${y + 45 + Math.floor(index / 2) * 34}" r="9" fill="${index === 3 ? warm : accent}"/>`).join("");
      return `<rect x="${gx}" y="${y + 18}" width="68" height="100" rx="18" fill="#FFFFFF" stroke="${accent}" stroke-width="3"/>${circles}`;
    });
    return `<g aria-label="같은 수로 나눈 세 묶음">${groups.join("")}<path d="M${x + 22} ${y + height - 22}H${x + width - 22}" stroke="${accent}" stroke-width="5" stroke-linecap="round"/></g>`;
  }
  if (model.domain === "fraction") {
    const segmentWidth = (width - 36) / 6;
    const segments = Array.from({ length: 6 }, (_, index) => `<rect x="${x + 18 + index * segmentWidth}" y="${y + 42}" width="${segmentWidth}" height="72" fill="${index < 3 ? accent : "#FFFFFF"}" stroke="${accent}" stroke-width="3"/>`).join("");
    return `<g aria-label="여섯 칸 중 세 칸이 색칠된 분수 막대"><rect x="${x + 7}" y="${y + 12}" width="${width - 14}" height="${height - 24}" rx="28" fill="#FFFFFF" opacity=".82"/>${segments}<circle cx="${centerX}" cy="${y + 140}" r="8" fill="${warm}"/></g>`;
  }
  if (model.domain === "length") {
    const ticks = Array.from({ length: 11 }, (_, index) => `<line x1="${x + 22 + index * ((width - 44) / 10)}" y1="${y + 82}" x2="${x + 22 + index * ((width - 44) / 10)}" y2="${y + (index % 5 === 0 ? 42 : 58)}" stroke="${accent}" stroke-width="${index % 5 === 0 ? 5 : 3}"/>`).join("");
    return `<g aria-label="길이 단위 자"><rect x="${x + 10}" y="${y + 30}" width="${width - 20}" height="92" rx="20" fill="#FFFFFF" stroke="${accent}" stroke-width="4"/>${ticks}<path d="M${x + 34} ${y + 142}H${x + width - 34}" stroke="${warm}" stroke-width="10" stroke-linecap="round"/></g>`;
  }
  if (model.domain === "circle") {
    return `<g aria-label="중심과 반지름을 표시한 원"><circle cx="${centerX}" cy="${centerY}" r="${Math.min(width, height) * 0.36}" fill="#FFFFFF" stroke="${accent}" stroke-width="7"/><line x1="${centerX}" y1="${centerY}" x2="${centerX + Math.min(width, height) * 0.34}" y2="${centerY}" stroke="${warm}" stroke-width="8" stroke-linecap="round"/><circle cx="${centerX}" cy="${centerY}" r="9" fill="${accent}"/><text x="${centerX - 5}" y="${centerY - 18}" font-family="Apple SD Gothic Neo, sans-serif" font-size="24" font-weight="800" fill="${accent}">O</text></g>`;
  }
  if (model.domain === "measurement") {
    const isWeight = model.lessonId.includes("weight");
    if (isWeight) {
      return `<g aria-label="무게를 재는 저울"><path d="M${centerX} ${y + 25}V${y + 128}" stroke="${accent}" stroke-width="9" stroke-linecap="round"/><path d="M${x + 42} ${y + 62}H${x + width - 42}" stroke="${accent}" stroke-width="7" stroke-linecap="round"/><path d="M${x + 62} ${y + 66}L${x + 34} ${y + 122}H${x + 90}Z" fill="${warm}" opacity=".9"/><path d="M${x + width - 62} ${y + 66}L${x + width - 90} ${y + 122}H${x + width - 34}Z" fill="${warm}" opacity=".9"/><path d="M${centerX - 48} ${y + 142}H${centerX + 48}" stroke="${accent}" stroke-width="10" stroke-linecap="round"/></g>`;
    }
    return `<g aria-label="들이를 나타내는 눈금 용기"><path d="M${x + 56} ${y + 20}H${x + width - 56}L${x + width - 78} ${y + height - 18}H${x + 78}Z" fill="#FFFFFF" stroke="${accent}" stroke-width="6"/><path d="M${x + 76} ${y + 93}H${x + width - 76}L${x + width - 85} ${y + height - 28}H${x + 85}Z" fill="${warm}" opacity=".85"/>${[0, 1, 2].map((i) => `<line x1="${x + width - 96}" y1="${y + 55 + i * 26}" x2="${x + width - 62}" y2="${y + 55 + i * 26}" stroke="${accent}" stroke-width="4"/>`).join("")}</g>`;
  }
  const symbols = [0, 1, 2, 3].map((index) => `<text x="${x + 35 + index * 54}" y="${y + 95}" font-family="Arial, sans-serif" font-size="56" font-weight="800" fill="${index === 3 ? warm : accent}">★</text>`).join("");
  return `<g aria-label="범례가 있는 그림그래프"><rect x="${x + 10}" y="${y + 16}" width="${width - 20}" height="${height - 32}" rx="25" fill="#FFFFFF" opacity=".82"/>${symbols}<text x="${x + 38}" y="${y + 142}" font-family="Apple SD Gothic Neo, sans-serif" font-size="22" font-weight="800" fill="${accent}">★ 1개 = 5</text></g>`;
}

function sectionBox({ x, y, width, height, number, title, palette, body }) {
  return `<g>
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="28" fill="#FFFFFF" stroke="#DDD8EA" stroke-width="3"/>
    <circle cx="${x + 42}" cy="${y + 43}" r="24" fill="${palette.accent}"/>
    <text x="${x + 42}" y="${y + 51}" font-family="Apple SD Gothic Neo, sans-serif" font-size="23" font-weight="800" text-anchor="middle" fill="#FFFFFF">${number}</text>
    ${textElement({ x: x + 82, y: y + 52, text: title, fontSize: 27, weight: 800, color: palette.dark, maxCharacters: 18, maxLines: 1 })}
    ${body}
  </g>`;
}

function answerLines(x, y, width, count = 2, gap = 54) {
  return Array.from({ length: count }, (_, index) => `<line x1="${x}" y1="${y + index * gap}" x2="${x + width}" y2="${y + index * gap}" stroke="#BFB8CE" stroke-width="2" stroke-dasharray="8 8"/>`).join("");
}

function renderWorksheetSvg(model) {
  const palette = PALETTE_BY_DOMAIN[model.domain];
  const titleLines = wrapText(model.title, { maxCharacters: 23, maxLines: 2, minLastLineCharacters: 4, hardMax: 25 });
  const printableChoices = Array.from(model.guided.choices || "").length <= 34 ? model.guided.choices : "";
  const routeCards = model.routeSteps.map((step, index) => {
    const x = 76 + index * 282;
    const lines = wrapText(step, { maxCharacters: 10, maxLines: 2, minLastLineCharacters: 2, hardMax: 12 });
    return `<g><rect x="${x}" y="318" width="254" height="108" rx="22" fill="#FFFFFF" stroke="${palette.accent}" stroke-width="2"/><circle cx="${x + 31}" cy="350" r="18" fill="${index === 3 ? palette.warm : palette.accent}"/><text x="${x + 31}" y="357" font-family="Apple SD Gothic Neo, sans-serif" font-size="18" font-weight="800" text-anchor="middle" fill="${index === 3 ? palette.dark : "#FFFFFF"}">${index + 1}</text>${textElement({ x: x + 59, y: 348, text: lines, fontSize: 20, weight: 700, color: palette.dark, maxCharacters: 18, maxLines: 2, lineHeight: 1.35 })}</g>`;
  }).join("");

  const guidedBody = [
    textElement({ x: 108, y: 590, text: model.guided.context, fontSize: 18, weight: 600, color: "#4B4754", maxCharacters: 23, maxLines: 2 }),
    textElement({ x: 108, y: 656, text: model.guided.prompt, fontSize: 20, weight: 800, color: palette.dark, maxCharacters: 20, maxLines: 4 }),
    printableChoices ? textElement({ x: 108, y: 766, text: `선택: ${printableChoices}`, fontSize: 17, weight: 700, color: palette.accent, maxCharacters: 22, maxLines: 2 }) : "",
    textElement({ x: 108, y: 832, text: "식과 답", fontSize: 18, weight: 800, color: "#615B6C", maxCharacters: 10, maxLines: 1 }),
    answerLines(108, 860, 446, 2, 28),
  ].join("");

  const transferBody = [
    textElement({ x: 670, y: 590, text: model.transfer.prompt, fontSize: 20, weight: 800, color: palette.dark, maxCharacters: 20, maxLines: 4 }),
    model.transfer.cues.length ? textElement({ x: 670, y: 704, text: model.transfer.cues.join(" · "), fontSize: 18, weight: 650, color: "#4B4754", maxCharacters: 22, maxLines: 2 }) : "",
    textElement({ x: 670, y: 784, text: "풀이와 설명 한 문장", fontSize: 18, weight: 800, color: "#615B6C", maxCharacters: 18, maxLines: 1 }),
    answerLines(670, 824, 446, 2, 48),
  ].join("");

  const errorText = model.errorCases.map((item, index) => {
    const y = 1044 + index * 112;
    return `<g><rect x="108" y="${y - 38}" width="500" height="88" rx="18" fill="${index === 0 ? palette.soft : "#FFF8E7"}"/><circle cx="136" cy="${y - 2}" r="18" fill="${index === 0 ? palette.accent : palette.warm}"/><text x="136" y="${y + 5}" font-family="Apple SD Gothic Neo, sans-serif" font-size="17" font-weight="800" text-anchor="middle" fill="${index === 0 ? "#FFFFFF" : palette.dark}">${String.fromCharCode(65 + index)}</text>${textElement({ x: 170, y: y - 12, text: item, fontSize: 17, weight: 650, color: "#3C3842", maxCharacters: 20, maxLines: 3 })}</g>`;
  }).join("");

  const exitText = model.exitItems.map((item, index) => {
    const y = 1042 + index * 105;
    return `<g><circle cx="690" cy="${y - 4}" r="20" fill="${index === 2 ? palette.warm : palette.accent}"/><text x="690" y="${y + 4}" font-family="Apple SD Gothic Neo, sans-serif" font-size="18" font-weight="800" text-anchor="middle" fill="${index === 2 ? palette.dark : "#FFFFFF"}">${index + 1}</text>${textElement({ x: 730, y: y - 12, text: item, fontSize: 17, weight: 650, color: "#3C3842", maxCharacters: 24, maxLines: 3 })}<line x1="730" y1="${y + 49}" x2="1115" y2="${y + 49}" stroke="#BFB8CE" stroke-width="2" stroke-dasharray="8 8"/></g>`;
  }).join("");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SERIES_ASSET_CONTRACT.worksheetWidth}" height="${SERIES_ASSET_CONTRACT.worksheetHeight}" viewBox="0 0 ${SERIES_ASSET_CONTRACT.worksheetWidth} ${SERIES_ASSET_CONTRACT.worksheetHeight}" role="img" aria-label="${escapeXml(model.title)} 통합 활동지">
  <rect width="1240" height="1754" fill="#FBFAFD"/>
  <rect x="0" y="0" width="1240" height="250" fill="${palette.soft}"/>
  <path d="M910 0H1240V250H1000C1060 210 1080 140 1042 88C1010 44 958 24 910 0Z" fill="${palette.accent}" opacity=".10"/>
  <rect x="64" y="42" width="190" height="46" rx="23" fill="${palette.accent}"/>
  <text x="159" y="73" font-family="Apple SD Gothic Neo, sans-serif" font-size="20" font-weight="800" text-anchor="middle" fill="#FFFFFF">활동지 ${String(model.sequence).padStart(2, "0")} / 30</text>
  ${textElement({ x: 68, y: 138, text: titleLines, fontSize: 40, weight: 850, color: palette.dark, maxCharacters: 25, maxLines: 2, lineHeight: 1.18 })}
  ${textElement({ x: 68, y: 225, text: `${model.grade} · ${model.unit}`, fontSize: 20, weight: 700, color: "#5F586A", maxCharacters: 35, maxLines: 1 })}
  ${conceptVisual(model, { x: 914, y: 42, width: 265, height: 170, accent: palette.accent, warm: palette.warm })}
  <text x="1174" y="226" font-family="Apple SD Gothic Neo, sans-serif" font-size="18" font-weight="700" text-anchor="end" fill="#5F586A">이름 ____________</text>

  <rect x="64" y="278" width="1112" height="172" rx="28" fill="${palette.soft}" stroke="${palette.accent}" stroke-width="2"/>
  <text x="88" y="312" font-family="Apple SD Gothic Neo, sans-serif" font-size="20" font-weight="850" fill="${palette.dark}">생각 순서</text>
  ${routeCards}

  ${sectionBox({ x: 64, y: 476, width: 548, height: 422, number: 1, title: "따라 풀기", palette, body: guidedBody })}
  ${sectionBox({ x: 628, y: 476, width: 548, height: 422, number: 2, title: "새 문제 설명하기", palette, body: transferBody })}
  ${sectionBox({ x: 64, y: 924, width: 548, height: 390, number: 3, title: "오류 탐정", palette, body: `${errorText}${textElement({ x: 108, y: 1264, text: "먼저 고칠 단계와 까닭", fontSize: 18, weight: 800, color: "#615B6C", maxCharacters: 20, maxLines: 1 })}${answerLines(108, 1296, 446, 1, 50)}` })}
  ${sectionBox({ x: 628, y: 924, width: 548, height: 390, number: 4, title: "나가기 표", palette, body: exitText })}

  <rect x="64" y="1340" width="1112" height="292" rx="28" fill="#FFFFFF" stroke="#DDD8EA" stroke-width="3"/>
  <rect x="88" y="1368" width="310" height="44" rx="22" fill="${palette.accent}"/>
  <text x="243" y="1398" font-family="Apple SD Gothic Neo, sans-serif" font-size="20" font-weight="850" text-anchor="middle" fill="#FFFFFF">오늘의 핵심 관계</text>
  ${textElement({ x: 90, y: 1462, text: model.coreRule, fontSize: 28, weight: 850, color: palette.dark, maxCharacters: 35, maxLines: 2 })}
  <line x1="90" y1="1540" x2="1150" y2="1540" stroke="#D5D0DF" stroke-width="2"/>
  <text x="92" y="1588" font-family="Apple SD Gothic Neo, sans-serif" font-size="20" font-weight="750" fill="#4B4754">스스로 확인</text>
  <rect x="250" y="1566" width="25" height="25" rx="5" fill="#FFFFFF" stroke="${palette.accent}" stroke-width="3"/><text x="290" y="1587" font-family="Apple SD Gothic Neo, sans-serif" font-size="18" font-weight="650" fill="#4B4754">정보를 찾았다</text>
  <rect x="495" y="1566" width="25" height="25" rx="5" fill="#FFFFFF" stroke="${palette.accent}" stroke-width="3"/><text x="535" y="1587" font-family="Apple SD Gothic Neo, sans-serif" font-size="18" font-weight="650" fill="#4B4754">식·그림으로 풀었다</text>
  <rect x="790" y="1566" width="25" height="25" rx="5" fill="#FFFFFF" stroke="${palette.accent}" stroke-width="3"/><text x="830" y="1587" font-family="Apple SD Gothic Neo, sans-serif" font-size="18" font-weight="650" fill="#4B4754">까닭을 설명했다</text>

  <text x="68" y="1708" font-family="Apple SD Gothic Neo, sans-serif" font-size="17" font-weight="750" fill="#746D7C">MIDDLE OF MATH · 비바샘 수업 꾸러미</text>
  <text x="1172" y="1708" font-family="Apple SD Gothic Neo, sans-serif" font-size="17" font-weight="650" text-anchor="end" fill="#746D7C">개인정보 없는 수업용 예시</text>
</svg>`;
  return svg;
}

function renderRepresentativeSvg(model) {
  const palette = PALETTE_BY_DOMAIN[model.domain];
  const titleLines = wrapRepresentativeTitle(model.title);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-label="${escapeXml(model.title)} 대표 이미지">
  <defs><filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#33245A" flood-opacity=".16"/></filter></defs>
  <rect width="1200" height="675" fill="#F8F5FF"/>
  <circle cx="1060" cy="92" r="190" fill="${palette.accent}" opacity=".08"/>
  <circle cx="104" cy="654" r="180" fill="${palette.warm}" opacity=".12"/>
  <rect x="62" y="58" width="1076" height="559" rx="56" fill="#FFFFFF" stroke="#DDD5F2" stroke-width="3" filter="url(#shadow)"/>
  <rect x="98" y="96" width="244" height="50" rx="25" fill="${palette.accent}"/>
  <text x="220" y="129" font-family="Apple SD Gothic Neo, sans-serif" font-size="22" font-weight="850" text-anchor="middle" fill="#FFFFFF">수업 꾸러미 ${String(model.sequence).padStart(2, "0")}</text>
  ${textElement({ x: 102, y: 246, text: titleLines, fontSize: 58, weight: 900, color: palette.dark, maxCharacters: SERIES_ASSET_CONTRACT.titleMaxCharactersPerLine, maxLines: 2, lineHeight: 1.18 })}
  ${textElement({ x: 104, y: 405, text: model.subtitle || model.coreRule, fontSize: 25, weight: 650, color: "#5D5668", maxCharacters: 33, maxLines: 2 })}
  <rect x="102" y="492" width="430" height="64" rx="28" fill="${palette.soft}"/>
  <text x="128" y="533" font-family="Apple SD Gothic Neo, sans-serif" font-size="22" font-weight="800" fill="${palette.accent}">${escapeXml(model.grade)} · ${escapeXml(model.unit)}</text>
  <g transform="translate(718 123)">
    <circle cx="165" cy="118" r="98" fill="#DCCEFF"/>
    <circle cx="265" cy="104" r="120" fill="#EEE8FF"/>
    <circle cx="350" cy="145" r="84" fill="#DCCEFF"/>
    <rect x="92" y="118" width="335" height="238" rx="46" fill="#FFFFFF" stroke="${palette.accent}" stroke-width="5" filter="url(#shadow)"/>
    ${conceptVisual(model, { x: 132, y: 156, width: 255, height: 170, accent: palette.accent, warm: palette.warm })}
  </g>
  <text x="102" y="592" font-family="Apple SD Gothic Neo, sans-serif" font-size="18" font-weight="750" fill="#746D7C">MIDDLE OF MATH · EDUITIT</text>
</svg>`;
}

function integratedSectionForKind(kind) {
  return ({ guided: "1. 따라 풀기", pair: "2. 새 문제 설명하기", errorDetective: "3. 오류 탐정", exit: "4. 나가기 표" })[kind] || "활동지와 간접 연결";
}

function buildTeachingIntentMarkdown(lesson) {
  const rows = lesson.slides.map((slide) => `| ${slide.number} | ${escapeMarkdown(slide.phase)} | ${slide.minutes}분 | ${escapeMarkdown(slide.title)} | ${escapeMarkdown(slide.intent)} | ${escapeMarkdown(slide.teacherMove)} | ${escapeMarkdown(slide.studentAction)} | ${escapeMarkdown(slide.evidence)} | ${integratedSectionForKind(slide.kind)} |`).join("\n");
  return `# ${lesson.title} — 슬라이드별 수업 설계 의도

- 교과목: ${lesson.subject}
- 대상: ${lesson.grade}
- 단원: ${lesson.unit}
- 수업 시간: ${lesson.durationMinutes}분
- 핵심 관찰 행동: ${lesson.targetBehavior}
- 개인정보 원칙: ${lesson.privacyRule}

## 차시 설계의 핵심

이 차시는 학생이 정답만 말하는 데서 멈추지 않고, 자료에서 필요한 정보를 찾고 수학적 관계를 적용한 뒤 식·그림·한 문장으로 근거를 남기도록 설계했습니다. 슬라이드의 짝 설명과 오류 분석은 한 장짜리 통합 활동지의 기록으로 이어지며, 교사는 서로 다른 문항에서 같은 오류가 반복되는지 확인한 뒤 다음 수업 행동을 결정합니다.

| 장 | 단계 | 시간 | 제목 | 수업 설계 의도 | 교사 행동 | 학생 활동 | 확인할 증거 | 통합 활동지 연결 |
|---:|---|---:|---|---|---|---|---|---|
${rows}

## 기록 활용

- 활동지는 실명이나 얼굴이 없는 빈 양식으로 공유합니다.
- 학생 답안 예시는 ‘풀이 A/B’처럼 익명화한 합성 사례만 사용합니다.
- 한 번의 오답으로 오개념을 확정하지 않고 직접 문항과 전이 문항의 반복 증거를 함께 봅니다.
`;
}

function buildAnswerKeyMarkdown(lesson, model) {
  const slideAnswers = lesson.id === pictographLesson.id
    ? Object.entries(lesson.answerKey).map(([number, answer]) => `- 슬라이드 ${number}: ${compact(answer)}`).join("\n")
    : [
        ...lesson.answerKey.sourceJudgments.map((item) => `- 출처 문항 ${item.judgmentId}: ${item.label}`),
        `- 따라 풀기: ${model.answers.guided}`,
        `- 새 문제: ${model.answers.transfer}`,
        ...lesson.answerKey.errorAnalysis.map((item) => `- 오류 ${item.choiceId}: ${compact(item.rationale)} (${compact(item.derivation)})`),
      ].join("\n");
  return `# ${lesson.title} — 교사용 정답·관찰 포인트

## 통합 활동지 정답

- 1. 따라 풀기: ${model.answers.guided}
- 2. 새 문제 설명하기: ${model.answers.transfer}
- 3. 오류 탐정: ${model.answers.errors.join(" / ")}
- 4. 나가기 표
${model.answers.exit.map((answer, index) => `  ${index + 1}. ${answer}`).join("\n")}

## 슬라이드 확인 정답

${slideAnswers}

## 관찰 포인트

- 답이 맞는지만 보지 않고, 학생이 ${model.coreRule} 관계를 실제로 사용했는지 확인합니다.
- 계산, 단위, 설명 가운데 어느 지점에서 처음 달라졌는지 표시합니다.
- 같은 오류가 직접 문항과 새 문제에서 반복될 때만 다음 차시의 소집단 또는 개별 확인 근거로 사용합니다.
`;
}

async function writePdfFromPng(pngPath, pdfPath) {
  const pdf = await PDFDocument.create();
  const fixedDate = new Date(FIXED_BUILD_TIME);
  pdf.setTitle(path.basename(pdfPath));
  pdf.setAuthor("Middle of Math");
  pdf.setCreator("Middle of Math Vivasam non-PPT harness");
  pdf.setProducer("pdf-lib");
  pdf.setCreationDate(fixedDate);
  pdf.setModificationDate(fixedDate);
  const image = await pdf.embedPng(fs.readFileSync(pngPath));
  const page = pdf.addPage([595.276, 841.89]);
  page.drawImage(image, { x: 0, y: 0, width: 595.276, height: 841.89 });
  fs.writeFileSync(pdfPath, await pdf.save({ useObjectStreams: false, addDefaultPage: false }));
}

function staticPrefix(lessonId, digest) {
  return `/static/edu_materials/lesson_bundles/${lessonId}/${digest}`;
}

function downloadUrl(lessonId, filename) {
  return `/edu-materials/lesson-bundles/${lessonId}/download/${filename}/`;
}

function buildPackageHtml({ lesson, model, digest, filenames }) {
  const palette = PALETTE_BY_DOMAIN[model.domain];
  const slides = lesson.slides.map((slide) => `<article class="slide-card">
    <div class="slide-number">${String(slide.number).padStart(2, "0")}</div>
    <div><div class="eyebrow">${escapeHtml(slide.phase)} · ${slide.minutes}분</div><h3>${escapeHtml(slide.title)}</h3><ul>${slide.visibleContent.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul><p><strong>수업 의도</strong> ${escapeHtml(slide.intent)}</p></div>
  </article>`).join("");
  const downloads = [
    ["인쇄용 활동지 PDF", filenames.worksheetPdf],
    ["활동지 PNG", filenames.worksheetPng],
    ["편집 가능한 활동지 SVG", filenames.worksheetSvg],
    ["수업 설계 의도", filenames.intent],
    ["교사용 정답", filenames.answerKey],
    ["Claude용 PPT 내용 원고", filenames.handoffMarkdown],
    ["Claude용 내용 데이터", filenames.handoffJson],
  ];
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(lesson.title)} 수업 꾸러미</title>
<style>
:root{--accent:${palette.accent};--dark:${palette.dark};--soft:${palette.soft};--warm:${palette.warm};--ink:#26212c;--muted:#665f70;--line:#ded8e8}*{box-sizing:border-box}body{margin:0;background:#f8f6fb;color:var(--ink);font-family:"Apple SD Gothic Neo","Noto Sans KR",sans-serif;line-height:1.65}.wrap{width:min(1120px,calc(100% - 32px));margin:0 auto;padding:28px 0 72px}.hero,.panel,.slide-card{background:#fff;border:1px solid var(--line);box-shadow:0 16px 42px rgba(51,36,90,.08)}.hero{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(320px,.9fr);gap:36px;align-items:center;border-radius:34px;padding:46px}.badge{display:inline-flex;border-radius:999px;background:var(--accent);color:#fff;padding:8px 16px;font-weight:800}.hero h1{font-size:clamp(36px,5vw,62px);line-height:1.12;margin:22px 0 14px;word-break:keep-all}.meta{font-size:18px;font-weight:750;color:var(--muted)}.hero img{width:100%;border-radius:26px}.status{margin-top:22px;border-radius:20px;background:var(--soft);padding:16px 18px;font-weight:800;color:var(--dark)}.panel{margin-top:28px;border-radius:30px;padding:34px}.panel h2{font-size:30px;line-height:1.2;margin:0 0 18px;color:var(--dark)}.worksheet{display:grid;grid-template-columns:minmax(300px,.75fr) minmax(0,1.25fr);gap:30px;align-items:start}.worksheet img{width:100%;border:1px solid var(--line);border-radius:22px}.downloads{display:grid;gap:10px}.downloads a{display:flex;justify-content:space-between;gap:18px;border:1px solid var(--line);border-radius:16px;padding:14px 16px;color:var(--dark);font-weight:800;text-decoration:none}.downloads a:hover,.downloads a:focus-visible{border-color:var(--accent);background:var(--soft)}.slides{display:grid;gap:18px}.slide-card{display:grid;grid-template-columns:64px minmax(0,1fr);gap:18px;border-radius:24px;padding:24px}.slide-number{display:grid;place-items:center;width:54px;height:54px;border-radius:18px;background:var(--accent);color:#fff;font-weight:900}.eyebrow{color:var(--accent);font-size:13px;font-weight:900;letter-spacing:.08em}.slide-card h3{margin:4px 0 10px;font-size:24px;word-break:keep-all}.slide-card ul{margin:0;padding-left:20px}.slide-card p{margin:14px 0 0;padding:12px 14px;border-radius:14px;background:var(--soft)}details{border:1px solid var(--line);border-radius:18px;padding:16px 18px}summary{cursor:pointer;font-weight:900;color:var(--dark)}pre{white-space:pre-wrap;word-break:keep-all;font:inherit}.privacy{border-left:5px solid var(--warm);padding-left:16px;color:var(--muted)}@media(max-width:800px){.hero,.worksheet{grid-template-columns:1fr}.hero{padding:28px}.panel{padding:24px}.slide-card{grid-template-columns:48px minmax(0,1fr)}.slide-number{width:44px;height:44px}}
</style></head><body><main class="wrap">
<section class="hero"><div><span class="badge">수업 꾸러미 ${String(lesson.sequence).padStart(2, "0")} / 30</span><h1>${escapeHtml(lesson.title)}</h1><p class="meta">${escapeHtml(lesson.grade)} · ${escapeHtml(lesson.unit)} · ${lesson.durationMinutes}분</p><p>${escapeHtml(lesson.targetBehavior)}</p><div class="status">자료 상태 · 활동지와 수업 기록 공개 완료 · PPT는 Claude 제작 후 추가 예정</div></div><img src="${staticPrefix(lesson.id, digest)}/${filenames.representative}" alt="${escapeHtml(lesson.title)} 수업의 핵심 수학 개념을 표현한 대표 이미지"></section>
<section class="panel"><h2>수업 설계 의도</h2><p>학생이 답만 고르는 데서 멈추지 않고 자료의 정보, 핵심 관계, 계산 결과, 설명을 연결하도록 설계했습니다. 짝 설명 뒤 같은 생각을 혼자 기록하게 하여 개인별 학습 증거를 남깁니다.</p><p class="privacy">실제 학생 이름·얼굴·학급·댓글을 사용하지 않았으며, 풀이 비교는 익명 합성 사례로 구성했습니다.</p></section>
<section class="panel worksheet"><div><h2>통합 활동지 1개</h2><img src="${staticPrefix(lesson.id, digest)}/${filenames.worksheetPng}" alt="${escapeHtml(lesson.title)} 한 장짜리 통합 활동지 미리보기" loading="lazy"></div><div><h2>수업 자료 받기</h2><p>한 차시에서 사용하는 생각 순서, 따라 풀기, 새 문제 설명, 오류 탐정, 나가기 표를 활동지 한 장에 묶었습니다.</p><div class="downloads">${downloads.map(([label, filename]) => `<a href="${downloadUrl(lesson.id, filename)}"><span>${escapeHtml(label)}</span><span>다운로드</span></a>`).join("")}</div></div></section>
<section class="panel"><h2>슬라이드별 내용과 수업 의도</h2><div class="slides">${slides}</div></section>
<section class="panel"><h2>교사용 정답</h2><details><summary>정답과 관찰 포인트 펼치기</summary><pre>${escapeHtml(buildAnswerKeyMarkdown(lesson, model))}</pre></details></section>
</main></body></html>`;
}

function packageFilenames(lessonId) {
  return {
    worksheetSvg: `${lessonId}-worksheet.svg`,
    worksheetPng: `${lessonId}-worksheet.png`,
    worksheetPdf: `${lessonId}-worksheet.pdf`,
    representative: "representative-image.png",
    intent: "teaching-intent.md",
    answerKey: "teacher-answer-key.md",
    handoffMarkdown: "claude-ppt-content.md",
    handoffJson: "claude-ppt-content.json",
  };
}

function contentTypeFor(filename) {
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".svg")) return "image/svg+xml";
  if (filename.endsWith(".pdf")) return "application/pdf";
  if (filename.endsWith(".json")) return "application/json";
  return "text/markdown; charset=utf-8";
}

function copyFile(source, destination) {
  ensureDir(path.dirname(destination));
  fs.copyFileSync(source, destination);
}

async function buildLessonAssets(lesson, { repoRoot = REPO_ROOT } = {}) {
  const artifactsRoot = path.join(repoRoot, "artifacts", "vivasam");
  const lessonRoot = path.join(artifactsRoot, lesson.id);
  const worksheetRoot = path.join(lessonRoot, "worksheet");
  const supportRoot = path.join(lessonRoot, "support");
  const webPackageRoot = path.join(lessonRoot, "web-package");
  // These three directories are fully generated. Resetting them prevents an
  // older digest or a received PPTX from leaking into the non-PPT package.
  resetDirectory(worksheetRoot);
  resetDirectory(supportRoot);
  resetDirectory(webPackageRoot);

  const model = buildWorksheetModel(lesson);
  const filenames = packageFilenames(lesson.id);
  const worksheetSvgPath = path.join(worksheetRoot, filenames.worksheetSvg);
  const worksheetPngPath = path.join(worksheetRoot, filenames.worksheetPng);
  const worksheetPdfPath = path.join(worksheetRoot, filenames.worksheetPdf);
  const representativeSvgPath = path.join(supportRoot, "representative-image.svg");
  const representativeImagePath = path.join(supportRoot, filenames.representative);
  const teachingIntentPath = path.join(supportRoot, filenames.intent);
  const answerKeyPath = path.join(supportRoot, filenames.answerKey);
  const handoffRoot = path.join(lessonRoot, "content-handoff");
  const handoffMarkdownPath = path.join(handoffRoot, filenames.handoffMarkdown);
  const handoffJsonPath = path.join(handoffRoot, filenames.handoffJson);

  writeUtf8(worksheetSvgPath, renderWorksheetSvg(model));
  await sharp(Buffer.from(fs.readFileSync(worksheetSvgPath, "utf8"))).png({ compressionLevel: 9 }).toFile(worksheetPngPath);
  await writePdfFromPng(worksheetPngPath, worksheetPdfPath);
  writeUtf8(representativeSvgPath, renderRepresentativeSvg(model));
  await sharp(Buffer.from(fs.readFileSync(representativeSvgPath, "utf8"))).png({ compressionLevel: 9 }).toFile(representativeImagePath);
  writeUtf8(teachingIntentPath, buildTeachingIntentMarkdown(lesson));
  writeUtf8(answerKeyPath, buildAnswerKeyMarkdown(lesson, model));

  const sourceFiles = {
    [filenames.worksheetSvg]: worksheetSvgPath,
    [filenames.worksheetPng]: worksheetPngPath,
    [filenames.worksheetPdf]: worksheetPdfPath,
    [filenames.representative]: representativeImagePath,
    [filenames.intent]: teachingIntentPath,
    [filenames.answerKey]: answerKeyPath,
    [filenames.handoffMarkdown]: handoffMarkdownPath,
    [filenames.handoffJson]: handoffJsonPath,
  };
  for (const [name, filePath] of Object.entries(sourceFiles)) ensure(fs.existsSync(filePath), `${lesson.id}의 ${name} 파일이 없습니다.`);

  const digestInput = Object.entries(sourceFiles).sort(([a], [b]) => a.localeCompare(b)).map(([name, filePath]) => `${name}:${fileHash(filePath)}`).join("\n");
  const digest = sha256(`${lesson.id}\n${lesson.version}\n${digestInput}`).slice(0, 12);
  const digestRoot = path.join(webPackageRoot, digest);
  ensureDir(digestRoot);
  for (const [name, sourcePath] of Object.entries(sourceFiles)) copyFile(sourcePath, path.join(digestRoot, name));

  const assets = Object.keys(sourceFiles).sort().map((filename) => {
    const filePath = path.join(digestRoot, filename);
    return {
      path: `${digest}/${filename}`,
      bytes: fs.statSync(filePath).size,
      sha256: fileHash(filePath),
      contentType: contentTypeFor(filename),
      role: filename === filenames.representative ? "thumbnail" : filename.startsWith(`${lesson.id}-worksheet`) ? "worksheet" : filename.startsWith("claude-") ? "content-handoff" : "teacher-support",
    };
  });
  const downloadAssets = [filenames.worksheetPdf, filenames.worksheetPng, filenames.worksheetSvg, filenames.intent, filenames.answerKey, filenames.handoffMarkdown, filenames.handoffJson];
  const manifest = {
    schemaVersion: 2,
    seriesId: "vivasam-2026-middleofmath-30",
    generatedAt: FIXED_BUILD_TIME,
    lessonId: lesson.id,
    sequence: lesson.sequence,
    title: lesson.title,
    subject: lesson.subject,
    subjectCode: lesson.subjectCode || "MATH",
    grade: lesson.grade,
    unit: lesson.unit,
    durationMinutes: lesson.durationMinutes,
    slideCount: lesson.slides.length,
    worksheetCount: 1,
    pptAuthor: "Claude",
    pptStatus: "awaiting-claude",
    sourceHtml: "source.html",
    digest,
    thumbnailAsset: `${digest}/${filenames.representative}`,
    worksheetAsset: `${digest}/${filenames.worksheetPng}`,
    downloadAssets,
    assets,
  };
  const packageHtmlPath = path.join(webPackageRoot, "source.html");
  const packageManifestPath = path.join(webPackageRoot, "manifest.json");
  writeUtf8(packageHtmlPath, buildPackageHtml({ lesson, model, digest, filenames }));
  writeUtf8(packageManifestPath, stableJson(manifest));

  const supportManifest = {
    schemaVersion: 1,
    generatedAt: FIXED_BUILD_TIME,
    lessonId: lesson.id,
    worksheet: {
      source: path.relative(lessonRoot, worksheetSvgPath).split(path.sep).join("/"),
      png: path.relative(lessonRoot, worksheetPngPath).split(path.sep).join("/"),
      pdf: path.relative(lessonRoot, worksheetPdfPath).split(path.sep).join("/"),
      count: 1,
    },
    support: {
      teachingIntent: path.relative(lessonRoot, teachingIntentPath).split(path.sep).join("/"),
      answerKey: path.relative(lessonRoot, answerKeyPath).split(path.sep).join("/"),
      representativeImage: path.relative(lessonRoot, representativeImagePath).split(path.sep).join("/"),
    },
    package: { digest, manifest: "web-package/manifest.json", html: "web-package/source.html" },
  };
  writeUtf8(path.join(lessonRoot, "non-ppt-artifact-manifest.json"), stableJson(supportManifest));

  return {
    lesson,
    model,
    digest,
    lessonRoot,
    worksheetSvgPath,
    worksheetPngPath,
    worksheetPdfPath,
    representativeImagePath,
    teachingIntentPath,
    answerKeyPath,
    packageRoot: webPackageRoot,
    packageManifestPath,
    packageHtmlPath,
    manifest,
  };
}

function syncPackageToEduitit(item, { eduititRoot = DEFAULT_EDUITIT_ROOT } = {}) {
  const destinationRoot = path.join(eduititRoot, "edu_materials", "static", "edu_materials", "lesson_bundles", item.lesson.id);
  resetDirectory(destinationRoot);
  copyFile(item.packageHtmlPath, path.join(destinationRoot, "source.html"));
  copyFile(item.packageManifestPath, path.join(destinationRoot, "manifest.json"));
  const destinationDigestRoot = path.join(destinationRoot, item.digest);
  ensureDir(destinationDigestRoot);
  for (const asset of item.manifest.assets) {
    const filename = path.basename(asset.path);
    copyFile(path.join(item.packageRoot, asset.path), path.join(destinationDigestRoot, filename));
  }
  return destinationRoot;
}

async function composeContactSheet(items, {
  sourceKey,
  outputPath,
  tileWidth,
  tileHeight,
  gap,
}) {
  const columns = 5;
  const rows = 6;
  ensure(items.length === columns * rows, "접촉표에 들어갈 산출물은 정확히 30개여야 합니다.");
  const width = columns * tileWidth + (columns + 1) * gap;
  const height = rows * tileHeight + (rows + 1) * gap;
  const composites = [];
  for (const [index, item] of items.entries()) {
    const input = await sharp(item[sourceKey])
      .resize(tileWidth, tileHeight, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png({ compressionLevel: 9 })
      .toBuffer();
    composites.push({
      input,
      left: gap + (index % columns) * (tileWidth + gap),
      top: gap + Math.floor(index / columns) * (tileHeight + gap),
    });
  }
  ensureDir(path.dirname(outputPath));
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 247, g: 244, b: 251, alpha: 1 },
    },
  }).composite(composites).png({ compressionLevel: 9 }).toFile(outputPath);
  return { outputPath, width, height };
}

async function buildReviewContactSheets(items, { repoRoot = REPO_ROOT } = {}) {
  const artifactsRoot = path.join(repoRoot, "artifacts", "vivasam");
  const reviewRoot = path.join(artifactsRoot, "review");
  const worksheetSheet = await composeContactSheet(items, {
    sourceKey: "worksheetPngPath",
    outputPath: path.join(reviewRoot, "worksheets-contact-sheet.png"),
    tileWidth: 220,
    tileHeight: 311,
    gap: 18,
  });
  const representativeSheet = await composeContactSheet(items, {
    sourceKey: "representativeImagePath",
    outputPath: path.join(reviewRoot, "representative-images-contact-sheet.png"),
    tileWidth: 320,
    tileHeight: 180,
    gap: 20,
  });
  const index = {
    schemaVersion: 1,
    seriesId: "vivasam-2026-middleofmath-30",
    generatedAt: FIXED_BUILD_TIME,
    count: items.length,
    contactSheets: {
      worksheets: path.basename(worksheetSheet.outputPath),
      representativeImages: path.basename(representativeSheet.outputPath),
    },
    records: items.map((item) => ({
      sequence: item.lesson.sequence,
      lessonId: item.lesson.id,
      title: item.lesson.title,
      worksheetPng: path.relative(artifactsRoot, item.worksheetPngPath).split(path.sep).join("/"),
      representativeImage: path.relative(artifactsRoot, item.representativeImagePath).split(path.sep).join("/"),
    })),
  };
  const indexPath = path.join(reviewRoot, "index.json");
  writeUtf8(indexPath, stableJson(index));
  return { reviewRoot, worksheetSheet, representativeSheet, indexPath };
}

async function buildSeriesAssets({ repoRoot = REPO_ROOT, eduititRoot = DEFAULT_EDUITIT_ROOT, syncEduitit = true } = {}) {
  const lessons = loadSeriesLessons({ repoRoot });
  const items = [];
  for (const lesson of lessons) items.push(await buildLessonAssets(lesson, { repoRoot }));
  const review = await buildReviewContactSheets(items, { repoRoot });
  const seriesManifest = {
    schemaVersion: 1,
    seriesId: "vivasam-2026-middleofmath-30",
    generatedAt: FIXED_BUILD_TIME,
    count: items.length,
    pptAuthor: "Claude",
    pptStatus: "awaiting-claude",
    records: items.map((item) => ({
      sequence: item.lesson.sequence,
      lessonId: item.lesson.id,
      title: item.lesson.title,
      grade: item.lesson.grade,
      unit: item.lesson.unit,
      digest: item.digest,
      packageManifest: `${item.lesson.id}/manifest.json`,
    })),
  };
  const middleManifestPath = path.join(repoRoot, "artifacts", "vivasam", "non-ppt-series-manifest.json");
  writeUtf8(middleManifestPath, stableJson(seriesManifest));
  if (syncEduitit) {
    const eduititSeriesRoot = path.join(eduititRoot, "edu_materials", "static", "edu_materials", "lesson_bundles");
    resetDirectory(eduititSeriesRoot);
    for (const item of items) item.eduititPackageRoot = syncPackageToEduitit(item, { eduititRoot });
    writeUtf8(path.join(eduititSeriesRoot, "series-manifest.json"), stableJson(seriesManifest));
  }
  return { items, seriesManifest, middleManifestPath, review };
}

function validatePackage(item) {
  const manifest = JSON.parse(fs.readFileSync(item.packageManifestPath, "utf8"));
  ensure(manifest.lessonId === item.lesson.id, `${item.lesson.id} 패키지 lessonId가 다릅니다.`);
  ensure(manifest.digest === item.digest, `${item.lesson.id} 패키지 digest가 다릅니다.`);
  ensure(manifest.worksheetCount === 1, `${item.lesson.id} 패키지 활동지 수가 1이 아닙니다.`);
  ensure(manifest.pptStatus === "awaiting-claude", `${item.lesson.id} PPT 대기 상태가 아닙니다.`);
  ensure(manifest.assets.every((asset) => !asset.path.endsWith(".pptx")), `${item.lesson.id} 패키지에 Codex PPT가 섞였습니다.`);
  ensure(manifest.downloadAssets.length === 7, `${item.lesson.id} 다운로드 자료 수가 7이 아닙니다.`);
  const expectedFiles = ["manifest.json", "source.html", ...manifest.assets.map((asset) => asset.path)].sort();
  const actualFiles = listRelativeFiles(item.packageRoot);
  ensure(JSON.stringify(actualFiles) === JSON.stringify(expectedFiles), `${item.lesson.id} 패키지에 manifest 밖의 잔여 파일이 있습니다.`);
  for (const asset of manifest.assets) {
    const assetPath = path.join(item.packageRoot, asset.path);
    ensure(fs.existsSync(assetPath), `${item.lesson.id} 패키지 자산이 없습니다: ${asset.path}`);
    ensure(fs.statSync(assetPath).size === asset.bytes, `${item.lesson.id} 패키지 자산 크기가 다릅니다: ${asset.path}`);
    ensure(fileHash(assetPath) === asset.sha256, `${item.lesson.id} 패키지 자산 해시가 다릅니다: ${asset.path}`);
  }
  const html = fs.readFileSync(item.packageHtmlPath, "utf8");
  ensure(!/data:(?:image|text\/html)/i.test(html), `${item.lesson.id} 패키지에 data URL이 있습니다.`);
  ensure(html.includes("통합 활동지 1개"), `${item.lesson.id} 패키지에 통합 활동지 계약이 없습니다.`);
  ensure(html.includes("PPT는 Claude 제작 후 추가 예정"), `${item.lesson.id} 패키지에 PPT 대기 안내가 없습니다.`);
  for (const filename of manifest.downloadAssets) ensure(html.includes(downloadUrl(item.lesson.id, filename)), `${item.lesson.id} 패키지에 ${filename} 다운로드 링크가 없습니다.`);
}

async function validateSeriesArtifacts({ repoRoot = REPO_ROOT } = {}) {
  const lessons = loadSeriesLessons({ repoRoot });
  const items = [];
  for (const lesson of lessons) {
    const lessonRoot = path.join(repoRoot, "artifacts", "vivasam", lesson.id);
    const filenames = packageFilenames(lesson.id);
    const packageManifestPath = path.join(lessonRoot, "web-package", "manifest.json");
    ensure(fs.existsSync(packageManifestPath), `${lesson.id} 패키지 manifest가 없습니다. 먼저 --build를 실행하세요.`);
    const manifest = JSON.parse(fs.readFileSync(packageManifestPath, "utf8"));
    const item = {
      lesson,
      lessonId: lesson.id,
      digest: manifest.digest,
      packageRoot: path.join(lessonRoot, "web-package"),
      packageManifestPath,
      packageHtmlPath: path.join(lessonRoot, "web-package", "source.html"),
      worksheetSvgPath: path.join(lessonRoot, "worksheet", filenames.worksheetSvg),
      worksheetPngPath: path.join(lessonRoot, "worksheet", filenames.worksheetPng),
      worksheetPdfPath: path.join(lessonRoot, "worksheet", filenames.worksheetPdf),
      representativeImagePath: path.join(lessonRoot, "support", filenames.representative),
      teachingIntentPath: path.join(lessonRoot, "support", filenames.intent),
      answerKeyPath: path.join(lessonRoot, "support", filenames.answerKey),
    };
    for (const [label, filePath] of Object.entries({ worksheetSvg: item.worksheetSvgPath, worksheetPng: item.worksheetPngPath, worksheetPdf: item.worksheetPdfPath, representative: item.representativeImagePath, intent: item.teachingIntentPath, answerKey: item.answerKeyPath })) ensure(fs.existsSync(filePath), `${lesson.id} ${label}가 없습니다.`);
    const worksheetMetadata = await sharp(item.worksheetPngPath).metadata();
    const representativeMetadata = await sharp(item.representativeImagePath).metadata();
    ensure(worksheetMetadata.width === SERIES_ASSET_CONTRACT.worksheetWidth && worksheetMetadata.height === SERIES_ASSET_CONTRACT.worksheetHeight, `${lesson.id} 활동지 크기가 A4 렌더 계약과 다릅니다.`);
    ensure(representativeMetadata.width === SERIES_ASSET_CONTRACT.representativeWidth && representativeMetadata.height === SERIES_ASSET_CONTRACT.representativeHeight, `${lesson.id} 대표 이미지 크기가 다릅니다.`);
    ensure(fs.readFileSync(item.worksheetPdfPath).subarray(0, 4).toString("ascii") === "%PDF", `${lesson.id} 활동지 PDF가 올바르지 않습니다.`);
    validatePackage(item);
    items.push(item);
  }
  ensure(items.length === 30, "검증된 차시 수가 30이 아닙니다.");
  return {
    lessonCount: items.length,
    worksheetCount: items.length,
    supportCount: items.length,
    representativeImageCount: items.length,
    packageCount: items.length,
    worksheetHashes: items.map((item) => fileHash(item.worksheetPngPath)),
    representativeImageHashes: items.map((item) => fileHash(item.representativeImagePath)),
    items,
  };
}

async function main() {
  const argv = process.argv.slice(2);
  const args = new Set(argv);
  const eduititRootFlag = argv.indexOf("--eduitit-root");
  ensure(eduititRootFlag === -1 || argv[eduititRootFlag + 1], "--eduitit-root 뒤에 경로를 입력하세요.");
  const eduititRoot = eduititRootFlag === -1
    ? DEFAULT_EDUITIT_ROOT
    : path.resolve(argv[eduititRootFlag + 1]);
  const checkOnly = args.has("--check");
  if (checkOnly) {
    const report = await validateSeriesArtifacts({ repoRoot: REPO_ROOT });
    process.stdout.write(`검증 완료: ${report.lessonCount}개 차시 · 통합 활동지 ${report.worksheetCount}개 · 대표 이미지 ${report.representativeImageCount}개 · Eduitit 패키지 ${report.packageCount}개\n`);
    return;
  }
  const syncEduitit = !args.has("--no-sync-eduitit");
  const result = await buildSeriesAssets({ repoRoot: REPO_ROOT, eduititRoot, syncEduitit });
  const report = await validateSeriesArtifacts({ repoRoot: REPO_ROOT });
  process.stdout.write(`생성 완료: ${result.items.length}개 차시\n`);
  process.stdout.write(`통합 활동지: ${report.worksheetCount}/30\n`);
  process.stdout.write(`수업 의도·정답·대표 이미지: ${report.supportCount}/30\n`);
  process.stdout.write(`Eduitit 패키지: ${report.packageCount}/30${syncEduitit ? " (동기화 완료)" : ""}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  ARTIFACTS_ROOT,
  DEFAULT_EDUITIT_ROOT,
  SERIES_ASSET_CONTRACT,
  buildAnswerKeyMarkdown,
  buildLessonAssets,
  buildPackageHtml,
  buildReviewContactSheets,
  buildSeriesAssets,
  buildTeachingIntentMarkdown,
  buildWorksheetModel,
  loadSeriesLessons,
  renderRepresentativeSvg,
  renderWorksheetSvg,
  validateSeriesArtifacts,
  wrapRepresentativeTitle,
  wrapText,
};
