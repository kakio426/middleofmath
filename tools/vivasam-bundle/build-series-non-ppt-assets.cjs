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
const WORKSHEET_IMAGEGEN_SCHEMA_VERSION = 1;

const SERIES_ASSET_CONTRACT = Object.freeze({
  version: 3,
  worksheetWidth: 1024,
  worksheetHeight: 1536,
  worksheetAspectRatio: "2:3",
  worksheetGenerationMode: "built-in-imagegen",
  representativeWidth: 1200,
  representativeHeight: 675,
  titleMaxCharactersPerLine: 11,
  worksheetCount: 30,
  packageCount: 30,
  worksheetFilesPerDeck: 1,
  pptAuthor: "Claude",
  codexOwnsNonPptArtifacts: true,
});

const WORKSHEET_MATH_VISUAL_CONTRACTS = Object.freeze({
  "g3s2-pictograph-legend": {
    problem1Rows: [4, 2],
    problem2Rows: [3, 2],
    problem3EmptyStars: 6,
  },
  "g3s1-multiplication-groups-model": {
    problem1Rows: 6,
    problem1PerRow: 5,
    problem2Groups: 5,
    problem2PerGroup: 4,
    choiceLabels: ["30장", "11장", "6장"],
  },
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

function pictographFacts(slide) {
  if (!Array.isArray(slide.data?.rows) || !slide.data?.legendValue) return "";
  const symbol = ({ circle: "●", square: "■", star: "★" })[slide.data.symbol] || "●";
  const unit = compact(slide.data.legendUnit);
  return [
    `범례: ${symbol} 1개 = ${slide.data.legendValue}${unit}`,
    ...slide.data.rows.map((row) => `${compact(row.label)}: ${symbol} ${row.count}개`),
  ].join(" · ");
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
  const guidedContext = pictographFacts(guided)
    || firstVisible(guided, /^상황:/, 0)
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
      cues: pictographFacts(transfer)
        ? [pictographFacts(transfer)]
        : transfer.visibleContent
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
  <text x="220" y="129" font-family="Apple SD Gothic Neo, sans-serif" font-size="22" font-weight="850" text-anchor="middle" fill="#FFFFFF">수학 수업 ${String(model.sequence).padStart(2, "0")}</text>
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
  pdf.setCreator("Middle of Math worksheet builder");
  pdf.setProducer("pdf-lib");
  pdf.setCreationDate(fixedDate);
  pdf.setModificationDate(fixedDate);
  const image = await pdf.embedPng(fs.readFileSync(pngPath));
  const pageWidth = 595.276;
  const pageHeight = 841.89;
  const page = pdf.addPage([pageWidth, pageHeight]);
  const scale = Math.min(pageWidth / image.width, pageHeight / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  page.drawImage(image, {
    x: (pageWidth - width) / 2,
    y: (pageHeight - height) / 2,
    width,
    height,
  });
  fs.writeFileSync(pdfPath, await pdf.save({ useObjectStreams: false, addDefaultPage: false }));
}

function staticPrefix(lessonId, digest) {
  return `/static/edu_materials/lesson_bundles/${lessonId}/${digest}`;
}

function downloadUrl(lessonId, filename) {
  return `/edu-materials/lesson-bundles/${lessonId}/download/${filename}/`;
}

function practiceUrlFor(lesson) {
  const semester = lesson.id.startsWith("g3s1-") ? "g3s1" : "g3s2";
  return `https://middle-of-math-student.vercel.app/?practice=${semester}-${lessonDomain(lesson)}`;
}

function buildLessonGuide(lesson) {
  const opening = findSlide(lesson, "dilemma", 2);
  const modelSlide = findSlide(lesson, "model", 5);
  const guided = findSlide(lesson, "guided", 6);
  const pair = findSlide(lesson, "pair", 7);
  const exit = findSlide(lesson, "exit", 10);
  return [
    `처음에는 ‘${opening.title}’ 질문만 보여 주세요. 바로 답을 알려 주기보다 30초쯤 혼자 생각하게 한 뒤, 옆 친구와 까닭을 짧게 나누면 수업을 시작하기 좋습니다.`,
    `이어서 ‘${modelSlide.title}’ 문제를 함께 풀어 봅니다. 교사는 계산을 대신 해 주지 말고, 학생이 자료에서 어떤 수를 찾았는지와 그 수를 왜 사용했는지만 차근차근 물어보세요.`,
    `‘${guided.title}’에서는 활동지에 혼자 적어 보게 하고, 다음 ‘${pair.title}’에서 서로의 풀이를 설명하게 합니다. 답이 같아도 설명이 다르면 어떤 부분이 다른지 다시 말해 보게 해 주세요.`,
    `마지막에는 ‘${exit.title}’를 혼자 해결하게 합니다. 정답 개수만 세기보다 식이나 그림, 짧은 설명 가운데 무엇이 빠졌는지를 살펴보면 다음 수업을 준비하기가 한결 수월합니다.`,
  ];
}

function buildPackageHtml({ lesson, model, digest, filenames, pptAvailable }) {
  const palette = PALETTE_BY_DOMAIN[model.domain];
  const guide = buildLessonGuide(lesson);
  const practiceUrl = practiceUrlFor(lesson);
  const pptBlock = pptAvailable
    ? `<p>수업 화면 자료입니다.</p><a class="download" href="${downloadUrl(lesson.id, filenames.pptx)}">PPT 다운로드</a>`
    : `<p class="pending">PPT는 준비되는 대로 올립니다.</p>`;
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(lesson.title)}</title>
<style>
:root{--accent:${palette.accent};--dark:#2f2638;--soft:#f5f0fc;--line:#ddd4e8;--muted:#6d6474}*{box-sizing:border-box}body{margin:0;background:#faf9fc;color:var(--dark);font-family:"Apple SD Gothic Neo","Noto Sans KR",sans-serif;line-height:1.7}.wrap{width:min(900px,calc(100% - 32px));margin:0 auto;padding:42px 0 72px}.heading{padding:0 2px 26px;border-bottom:1px solid var(--line)}h1{margin:0;font-size:clamp(34px,6vw,54px);line-height:1.18;word-break:keep-all}.meta{margin:10px 0 0;color:var(--muted);font-weight:700}.section{margin-top:24px;padding:28px;border:1px solid var(--line);border-radius:22px;background:#fff}.section h2{margin:0 0 14px;font-size:25px;line-height:1.3}.section p{margin:0 0 16px}.download{display:inline-flex;align-items:center;justify-content:center;min-height:48px;border-radius:12px;background:var(--accent);padding:11px 20px;color:#fff;font-weight:800;text-decoration:none}.download.secondary{margin-top:18px;background:#fff;color:var(--accent);border:1px solid var(--accent)}.download:hover,.download:focus-visible{filter:brightness(.94)}.worksheet-image{display:block;width:min(100%,680px);margin:18px auto 22px;border:1px solid var(--line);border-radius:14px}.guide{margin:0;padding-left:22px}.guide li{margin:0 0 12px}.guide li:last-child{margin-bottom:0}.pending{color:var(--muted)}@media(max-width:640px){.wrap{padding-top:28px}.section{padding:22px}}
</style></head><body><main class="wrap">
<header class="heading"><h1>${escapeHtml(lesson.title)}</h1><p class="meta">${escapeHtml(lesson.grade)} · ${escapeHtml(lesson.unit)} · ${lesson.durationMinutes}분</p></header>
<section class="section" data-section="ppt"><h2>PPT</h2>${pptBlock}</section>
<section class="section" data-section="worksheet"><h2>활동지</h2><img class="worksheet-image" src="${staticPrefix(lesson.id, digest)}/${filenames.worksheetPng}" alt="${escapeHtml(lesson.title)} 활동지" loading="lazy"><a class="download" href="${downloadUrl(lesson.id, filenames.worksheetPdf)}">활동지 다운로드</a></section>
<section class="section" data-section="guide"><h2>수업은 이렇게 진행해 보세요</h2><ol class="guide">${guide.map((paragraph) => `<li>${escapeHtml(paragraph)}</li>`).join("")}</ol><a class="download secondary" href="${practiceUrl}" target="_blank" rel="noreferrer">관련 문제 더 풀기</a></section>
</main></body></html>`;
}

function packageFilenames(lessonId) {
  return {
    worksheetPrompt: `${lessonId}-worksheet.prompt.txt`,
    worksheetMetadata: `${lessonId}-worksheet.imagegen.json`,
    worksheetPng: `${lessonId}-worksheet.png`,
    worksheetPdf: `${lessonId}-worksheet.pdf`,
    pptx: `${lessonId}.pptx`,
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
  if (filename.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (filename.endsWith(".json")) return "application/json";
  return "text/markdown; charset=utf-8";
}

function copyFile(source, destination) {
  ensureDir(path.dirname(destination));
  fs.copyFileSync(source, destination);
}

async function validateWorksheetImagegenSource(lesson, { worksheetRoot, filenames = packageFilenames(lesson.id) }) {
  const promptPath = path.join(worksheetRoot, filenames.worksheetPrompt);
  const metadataPath = path.join(worksheetRoot, filenames.worksheetMetadata);
  const pngPath = path.join(worksheetRoot, filenames.worksheetPng);
  const pdfPath = path.join(worksheetRoot, filenames.worksheetPdf);
  for (const [label, filePath] of Object.entries({ prompt: promptPath, imagegenMetadata: metadataPath, png: pngPath })) {
    ensure(fs.existsSync(filePath), `${lesson.id} 활동지 ${label} 파일이 없습니다.`);
  }

  const allowedFiles = new Set([
    filenames.worksheetPrompt,
    filenames.worksheetMetadata,
    filenames.worksheetPng,
    filenames.worksheetPdf,
  ]);
  const actualFiles = listRelativeFiles(worksheetRoot);
  ensure(actualFiles.every((filename) => allowedFiles.has(filename)), `${lesson.id} 활동지 폴더에는 이미지 생성 원본·PNG·PDF만 둘 수 있습니다: ${actualFiles.filter((filename) => !allowedFiles.has(filename)).join(", ")}`);
  ensure(actualFiles.every((filename) => !/\.(?:svg|html?|css)$/i.test(filename)), `${lesson.id} 활동지는 CSS·HTML·SVG로 구성할 수 없습니다.`);

  const prompt = fs.readFileSync(promptPath, "utf8").trim();
  for (const section of ["# 1. Scene:", "# 2. Camera:", "# 3. Lighting:", "# 4. Color grading:", "# 5. Texture/Medium:", "# 6. Text-in-image:"]) {
    ensure(prompt.includes(section), `${lesson.id} 이미지 생성 프롬프트에 ${section} 섹션이 없습니다.`);
  }
  ensure(/\beduitit\b/i.test(prompt), `${lesson.id} 이미지 생성 프롬프트에 eduitit 로고 지시가 없습니다.`);
  ensure(/보라색\s*구름/.test(prompt), `${lesson.id} 이미지 생성 프롬프트에 보라색 구름 지시가 없습니다.`);
  ensure(/AR\s+2:3\s*$/i.test(prompt), `${lesson.id} 이미지 생성 프롬프트는 마지막 줄이 AR 2:3이어야 합니다.`);

  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  ensure(metadata.schemaVersion === WORKSHEET_IMAGEGEN_SCHEMA_VERSION, `${lesson.id} 이미지 생성 메타데이터 스키마가 잘못되었습니다.`);
  ensure(metadata.generationMode === SERIES_ASSET_CONTRACT.worksheetGenerationMode, `${lesson.id} 활동지는 내장 이미지 생성 한 번으로 만든 완성 이미지여야 합니다.`);
  ensure(metadata.generator === "image_gen", `${lesson.id} 활동지 생성기는 image_gen이어야 합니다.`);
  ensure(/^exec-[a-z0-9-]+\.png$/i.test(metadata.sourceOutputId || ""), `${lesson.id} 이미지 생성 출력 식별자가 없습니다.`);
  ensure(metadata.promptFile === filenames.worksheetPrompt, `${lesson.id} 프롬프트 파일명이 메타데이터와 다릅니다.`);
  ensure(metadata.imageFile === filenames.worksheetPng, `${lesson.id} PNG 파일명이 메타데이터와 다릅니다.`);
  ensure(metadata.promptSha256 === fileHash(promptPath), `${lesson.id} 프롬프트 해시가 메타데이터와 다릅니다.`);
  ensure(metadata.imageSha256 === fileHash(pngPath), `${lesson.id} PNG 해시가 메타데이터와 다릅니다.`);

  const imageMetadata = await sharp(pngPath).metadata();
  ensure(imageMetadata.format === "png", `${lesson.id} 활동지 완성본은 PNG여야 합니다.`);
  ensure(imageMetadata.width === SERIES_ASSET_CONTRACT.worksheetWidth && imageMetadata.height === SERIES_ASSET_CONTRACT.worksheetHeight, `${lesson.id} 활동지는 1024×1536 세로형 완성 이미지여야 합니다.`);
  ensure(metadata.width === imageMetadata.width && metadata.height === imageMetadata.height, `${lesson.id} 이미지 크기 메타데이터가 실제 PNG와 다릅니다.`);

  const qa = metadata.visualQa || {};
  for (const flag of ["logoTitleSeparated", "allQuestionTextLegible", "choicesVisuallySeparated", "answerSpacesPresent", "noOverlapsOrClipping"]) {
    ensure(qa[flag] === true, `${lesson.id} 활동지 시각 QA가 통과되지 않았습니다: ${flag}`);
  }
  ensure(qa.reviewedAt, `${lesson.id} 활동지 시각 QA 시간이 없습니다.`);
  const expectedCounts = WORKSHEET_MATH_VISUAL_CONTRACTS[lesson.id];
  ensure(expectedCounts, `${lesson.id} 활동지를 만들기 전에 수학 시각물 수량 계약을 추가하세요.`);
  ensure(JSON.stringify(qa.mathVisualCounts) === JSON.stringify(expectedCounts), `${lesson.id} 활동지의 수학 시각물 수량 계약이 다릅니다.`);

  return { promptPath, metadataPath, pngPath, pdfPath, metadata };
}

async function buildLessonAssets(lesson, { repoRoot = REPO_ROOT } = {}) {
  const artifactsRoot = path.join(repoRoot, "artifacts", "vivasam");
  const lessonRoot = path.join(artifactsRoot, lesson.id);
  const worksheetRoot = path.join(lessonRoot, "worksheet");
  const supportRoot = path.join(lessonRoot, "support");
  const webPackageRoot = path.join(lessonRoot, "web-package");
  // The worksheet prompt, generation metadata, and single finished PNG are
  // authored through built-in imagegen and must survive package rebuilds.
  // Support files and the public web package remain reproducible outputs.
  ensureDir(worksheetRoot);
  resetDirectory(supportRoot);
  resetDirectory(webPackageRoot);

  const model = buildWorksheetModel(lesson);
  const filenames = packageFilenames(lesson.id);
  const worksheetSource = await validateWorksheetImagegenSource(lesson, { worksheetRoot, filenames });
  const worksheetPromptPath = worksheetSource.promptPath;
  const worksheetMetadataPath = worksheetSource.metadataPath;
  const worksheetPngPath = worksheetSource.pngPath;
  const worksheetPdfPath = worksheetSource.pdfPath;
  const representativeSvgPath = path.join(supportRoot, "representative-image.svg");
  const representativeImagePath = path.join(supportRoot, filenames.representative);
  const teachingIntentPath = path.join(supportRoot, filenames.intent);
  const answerKeyPath = path.join(supportRoot, filenames.answerKey);
  const handoffRoot = path.join(lessonRoot, "content-handoff");
  const handoffMarkdownPath = path.join(handoffRoot, filenames.handoffMarkdown);
  const handoffJsonPath = path.join(handoffRoot, filenames.handoffJson);
  const receivedPptxPath = path.join(lessonRoot, "claude", filenames.pptx);
  const pptAvailable = fs.existsSync(receivedPptxPath);

  // PDF is only a print wrapper around the untouched whole-page image.
  // Never place generated text, SVG, HTML, or another raster layer over it.
  await writePdfFromPng(worksheetPngPath, worksheetPdfPath);
  writeUtf8(representativeSvgPath, renderRepresentativeSvg(model));
  await sharp(Buffer.from(fs.readFileSync(representativeSvgPath, "utf8"))).png({ compressionLevel: 9 }).toFile(representativeImagePath);
  writeUtf8(teachingIntentPath, buildTeachingIntentMarkdown(lesson));
  writeUtf8(answerKeyPath, buildAnswerKeyMarkdown(lesson, model));

  const sourceFiles = {
    [filenames.worksheetPng]: worksheetPngPath,
    [filenames.worksheetPdf]: worksheetPdfPath,
    [filenames.representative]: representativeImagePath,
  };
  if (pptAvailable) sourceFiles[filenames.pptx] = receivedPptxPath;
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
      role: filename === filenames.representative
        ? "thumbnail"
        : filename === filenames.pptx
          ? "presentation"
          : "worksheet",
    };
  });
  const downloadAssets = [
    ...(pptAvailable ? [filenames.pptx] : []),
    filenames.worksheetPdf,
  ];
  const manifest = {
    schemaVersion: 3,
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
    pptStatus: pptAvailable ? "available" : "awaiting-claude",
    sourceHtml: "source.html",
    digest,
    thumbnailAsset: `${digest}/${filenames.representative}`,
    worksheetAsset: `${digest}/${filenames.worksheetPng}`,
    pptAsset: pptAvailable ? `${digest}/${filenames.pptx}` : "",
    practiceUrl: practiceUrlFor(lesson),
    downloadAssets,
    assets,
  };
  const packageHtmlPath = path.join(webPackageRoot, "source.html");
  const packageManifestPath = path.join(webPackageRoot, "manifest.json");
  writeUtf8(packageHtmlPath, buildPackageHtml({ lesson, model, digest, filenames, pptAvailable }));
  writeUtf8(packageManifestPath, stableJson(manifest));

  const supportManifest = {
    schemaVersion: 1,
    generatedAt: FIXED_BUILD_TIME,
    lessonId: lesson.id,
    worksheet: {
      source: path.relative(lessonRoot, worksheetPromptPath).split(path.sep).join("/"),
      generationMetadata: path.relative(lessonRoot, worksheetMetadataPath).split(path.sep).join("/"),
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
    worksheetPromptPath,
    worksheetMetadataPath,
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

function hasReceivedPptx(repoRoot, lesson) {
  return fs.existsSync(path.join(repoRoot, "artifacts", "vivasam", lesson.id, "claude", `${lesson.id}.pptx`));
}

function removePrematureGeneratedAssets(repoRoot, lessons) {
  for (const lesson of lessons) {
    const lessonRoot = path.join(repoRoot, "artifacts", "vivasam", lesson.id);
    for (const directory of ["worksheet", "support", "web-package"]) {
      fs.rmSync(path.join(lessonRoot, directory), { recursive: true, force: true });
    }
    fs.rmSync(path.join(lessonRoot, "non-ppt-artifact-manifest.json"), { force: true });
  }
  fs.rmSync(path.join(repoRoot, "artifacts", "vivasam", "review"), { recursive: true, force: true });
}

async function buildSeriesAssets({ repoRoot = REPO_ROOT, eduititRoot = DEFAULT_EDUITIT_ROOT, syncEduitit = true, availableOnly = false } = {}) {
  const allLessons = loadSeriesLessons({ repoRoot });
  const lessons = availableOnly ? allLessons.filter((lesson) => hasReceivedPptx(repoRoot, lesson)) : allLessons;
  ensure(lessons.length > 0, "공개할 PPT가 있는 차시가 없습니다.");
  if (availableOnly) {
    const receivedIds = new Set(lessons.map((lesson) => lesson.id));
    removePrematureGeneratedAssets(repoRoot, allLessons.filter((lesson) => !receivedIds.has(lesson.id)));
  }
  const items = [];
  for (const lesson of lessons) items.push(await buildLessonAssets(lesson, { repoRoot }));
  const review = items.length === SERIES_ASSET_CONTRACT.packageCount
    ? await buildReviewContactSheets(items, { repoRoot })
    : null;
  const seriesManifest = {
    schemaVersion: 1,
    seriesId: "vivasam-2026-middleofmath-30",
    generatedAt: FIXED_BUILD_TIME,
    count: items.length,
    pptStatus: items.every((item) => item.manifest.pptStatus === "available") ? "available" : "partial",
    records: items.map((item) => ({
      sequence: item.lesson.sequence,
      lessonId: item.lesson.id,
      title: item.lesson.title,
      grade: item.lesson.grade,
      unit: item.lesson.unit,
      digest: item.digest,
      pptStatus: item.manifest.pptStatus,
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
  ensure(manifest.schemaVersion === 3, `${item.lesson.id} 패키지 스키마가 최신이 아닙니다.`);
  ensure(manifest.lessonId === item.lesson.id, `${item.lesson.id} 패키지 lessonId가 다릅니다.`);
  ensure(manifest.digest === item.digest, `${item.lesson.id} 패키지 digest가 다릅니다.`);
  ensure(manifest.worksheetCount === 1, `${item.lesson.id} 패키지 활동지 수가 1이 아닙니다.`);
  ensure(["available", "awaiting-claude"].includes(manifest.pptStatus), `${item.lesson.id} PPT 상태가 잘못되었습니다.`);
  const pptAssets = manifest.assets.filter((asset) => asset.path.endsWith(".pptx"));
  const pptAvailable = manifest.pptStatus === "available";
  ensure(pptAssets.length === (pptAvailable ? 1 : 0), `${item.lesson.id} PPT 파일과 상태가 다릅니다.`);
  ensure(manifest.downloadAssets.length === (pptAvailable ? 2 : 1), `${item.lesson.id} 공개 다운로드 수가 잘못되었습니다.`);
  ensure(/^https:\/\/middle-of-math-student\.vercel\.app\/\?practice=g3s[12]-[a-z-]+$/.test(manifest.practiceUrl), `${item.lesson.id} 관련 문제 링크가 잘못되었습니다.`);
  ensure(manifest.assets.every((asset) => !/\.(?:md|json|svg)$/i.test(asset.path)), `${item.lesson.id} 공개 패키지에 내부 자료가 섞였습니다.`);
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
  ensure((html.match(/data-section=/g) || []).length === 3, `${item.lesson.id} 공개 페이지는 세 섹션이어야 합니다.`);
  for (const heading of ["PPT", "활동지", "수업은 이렇게 진행해 보세요"]) ensure(html.includes(heading), `${item.lesson.id} 공개 페이지에 ${heading} 섹션이 없습니다.`);
  ensure(html.includes(`href="${manifest.practiceUrl}"`), `${item.lesson.id} 공개 페이지에 관련 문제 링크가 없습니다.`);
  for (const forbidden of ["비바샘", "개인정보", "Claude", "교사용 정답", "수업 설계 의도", "슬라이드별 내용"]) ensure(!html.includes(forbidden), `${item.lesson.id} 공개 페이지에 금지 문구가 있습니다: ${forbidden}`);
  for (const filename of manifest.downloadAssets) ensure(html.includes(downloadUrl(item.lesson.id, filename)), `${item.lesson.id} 패키지에 ${filename} 다운로드 링크가 없습니다.`);
}

async function validateSeriesArtifacts({ repoRoot = REPO_ROOT, availableOnly = false } = {}) {
  const allLessons = loadSeriesLessons({ repoRoot });
  const lessons = availableOnly ? allLessons.filter((lesson) => hasReceivedPptx(repoRoot, lesson)) : allLessons;
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
      worksheetPromptPath: path.join(lessonRoot, "worksheet", filenames.worksheetPrompt),
      worksheetMetadataPath: path.join(lessonRoot, "worksheet", filenames.worksheetMetadata),
      worksheetPngPath: path.join(lessonRoot, "worksheet", filenames.worksheetPng),
      worksheetPdfPath: path.join(lessonRoot, "worksheet", filenames.worksheetPdf),
      representativeImagePath: path.join(lessonRoot, "support", filenames.representative),
      teachingIntentPath: path.join(lessonRoot, "support", filenames.intent),
      answerKeyPath: path.join(lessonRoot, "support", filenames.answerKey),
    };
    for (const [label, filePath] of Object.entries({ worksheetPrompt: item.worksheetPromptPath, worksheetMetadata: item.worksheetMetadataPath, worksheetPng: item.worksheetPngPath, worksheetPdf: item.worksheetPdfPath, representative: item.representativeImagePath, intent: item.teachingIntentPath, answerKey: item.answerKeyPath })) ensure(fs.existsSync(filePath), `${lesson.id} ${label}가 없습니다.`);
    await validateWorksheetImagegenSource(lesson, {
      worksheetRoot: path.join(lessonRoot, "worksheet"),
      filenames,
    });
    const worksheetMetadata = await sharp(item.worksheetPngPath).metadata();
    const representativeMetadata = await sharp(item.representativeImagePath).metadata();
    ensure(worksheetMetadata.width === SERIES_ASSET_CONTRACT.worksheetWidth && worksheetMetadata.height === SERIES_ASSET_CONTRACT.worksheetHeight, `${lesson.id} 활동지 크기가 이미지 생성 계약과 다릅니다.`);
    ensure(representativeMetadata.width === SERIES_ASSET_CONTRACT.representativeWidth && representativeMetadata.height === SERIES_ASSET_CONTRACT.representativeHeight, `${lesson.id} 대표 이미지 크기가 다릅니다.`);
    ensure(fs.readFileSync(item.worksheetPdfPath).subarray(0, 4).toString("ascii") === "%PDF", `${lesson.id} 활동지 PDF가 올바르지 않습니다.`);
    validatePackage(item);
    items.push(item);
  }
  ensure(items.length === lessons.length, "검증된 차시 수가 대상 차시 수와 다릅니다.");
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
  const availableOnly = args.has("--available-only");
  if (checkOnly) {
    const report = await validateSeriesArtifacts({ repoRoot: REPO_ROOT, availableOnly });
    process.stdout.write(`검증 완료: ${report.lessonCount}개 차시 · 통합 활동지 ${report.worksheetCount}개 · 대표 이미지 ${report.representativeImageCount}개 · Eduitit 패키지 ${report.packageCount}개\n`);
    return;
  }
  const syncEduitit = !args.has("--no-sync-eduitit");
  const result = await buildSeriesAssets({ repoRoot: REPO_ROOT, eduititRoot, syncEduitit, availableOnly });
  const report = await validateSeriesArtifacts({ repoRoot: REPO_ROOT, availableOnly });
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
  validateWorksheetImagegenSource,
  validateSeriesArtifacts,
  wrapRepresentativeTitle,
  wrapText,
};
