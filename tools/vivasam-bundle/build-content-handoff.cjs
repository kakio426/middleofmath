#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const SERIES_TARGET_COUNT = 30;
const HANDOFF_SCHEMA_VERSION = 1;

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

function singleLine(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function parseArgs(argv) {
  const options = { lessonPath: path.join(__dirname, "lesson-pictograph.cjs"), outputRoot: "" };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--lesson") options.lessonPath = path.resolve(argv[++index] || "");
    else if (token === "--output") options.outputRoot = path.resolve(argv[++index] || "");
    else throw new Error(`알 수 없는 옵션입니다: ${token}`);
  }
  return options;
}

function validateLesson(source) {
  ensure(source.schemaVersion === 1, "지원하지 않는 수업 스키마입니다.");
  ensure(singleLine(source.id), "수업 ID가 없습니다.");
  ensure(Array.isArray(source.slides) && source.slides.length > 0, "한 차시 내용 원고에 슬라이드가 없습니다.");
  ensure(source.slides.reduce((sum, slide) => sum + slide.minutes, 0) === source.durationMinutes, "슬라이드 시간 합계가 차시 시간과 다릅니다.");
  ensure(singleLine(source.worksheet?.file), "PPT 한 개에 대응하는 통합 활동지 파일명이 없습니다.");
  ensure(singleLine(source.worksheet?.title), "PPT 한 개에 대응하는 통합 활동지 제목이 없습니다.");
  ensure(singleLine(source.worksheet?.instruction), "PPT 한 개에 대응하는 통합 활동지 안내가 없습니다.");
  source.slides.forEach((slide, index) => {
    ensure(slide.number === index + 1, `슬라이드 번호가 연속적이지 않습니다: ${slide.number}`);
    for (const key of ["phase", "title", "intent", "teacherMove", "studentAction", "evidence"]) {
      ensure(singleLine(slide[key]), `슬라이드 ${slide.number}의 ${key}가 비었습니다.`);
    }
    if (Object.hasOwn(slide, "visibleContent")) {
      ensure(Array.isArray(slide.visibleContent) && slide.visibleContent.length > 0, `슬라이드 ${slide.number}의 화면 내용이 비었습니다.`);
      ensure(slide.visibleContent.every((item) => singleLine(item)), `슬라이드 ${slide.number}의 화면 내용에 빈 항목이 있습니다.`);
    }
  });
  ensure(source.answerKey && Object.keys(source.answerKey).length > 0, "교사용 정답이 없습니다.");
}

function symbolName(symbol) {
  return { star: "별", circle: "원", square: "네모" }[symbol] || singleLine(symbol);
}

function describeLegend(data) {
  if (!data?.symbol || !data?.legendValue || !data?.legendUnit) return [];
  return [`범례: ${symbolName(data.symbol)} 1개 = ${data.legendValue}${data.legendUnit}`];
}

function describeRows(data) {
  if (!Array.isArray(data?.rows)) return [];
  const symbol = symbolName(data.symbol);
  return data.rows.map((row) => {
    const parts = [];
    if (Number(row.count || 0) > 0) parts.push(`${symbol} ${row.count}개`);
    if (Number(row.blankSlots || 0) > 0) parts.push(`학생이 채울 빈칸 ${row.blankSlots}칸`);
    return `${singleLine(row.label)}: ${parts.join(", ") || "빈 행"}`;
  });
}

function visibleContentForSlide(slide, lesson) {
  if (Array.isArray(slide.visibleContent)) return slide.visibleContent.map(singleLine);
  const data = slide.data || {};
  if (slide.kind === "cover") return [singleLine(lesson.subtitle), singleLine(slide.kicker)];
  if (slide.kind === "dilemma") {
    return [
      ...describeLegend(data),
      ...describeRows(data),
      ...data.claims.map((claim) => `${singleLine(claim.label)}: ${singleLine(claim.text)}`),
      "질문: 두 생각은 어디까지 같고, 어디서 달라졌을까요?",
    ];
  }
  if (slide.kind === "goals") return [...data.goals.map(singleLine), `성공 기준: ${singleLine(data.success)}`];
  if (slide.kind === "route") return data.steps.map((step) => `${step.n}. ${singleLine(step.title)} — ${singleLine(step.body)}`);
  if (slide.kind === "model") {
    return [
      ...describeLegend(data),
      ...describeRows(data),
      `뛰어 세기: ${data.skipCounts.join(" → ")}`,
      `식: ${singleLine(data.equation)}`,
    ];
  }
  if (["guided", "pair", "independent"].includes(slide.kind)) {
    return [
      ...describeLegend(data),
      ...describeRows(data),
      ...data.prompts.map((prompt) => `질문: ${singleLine(prompt)}`),
    ];
  }
  if (slide.kind === "errorDetective") {
    return data.cases.flatMap((item) => [
      `${singleLine(item.label)}: ${singleLine(item.text)}`,
      `확인할 단계: ${singleLine(item.missed)}`,
    ]);
  }
  if (slide.kind === "exit") return data.items.map((item, index) => `${index + 1}. ${singleLine(item)}`);
  if (slide.kind === "summary") {
    return [...data.takeaways.map(singleLine), `다음 차시 질문: ${singleLine(data.next)}`];
  }
  throw new Error(`지원하지 않는 슬라이드 종류입니다: ${slide.kind}`);
}

function loadLesson(lessonPath) {
  const resolved = path.resolve(lessonPath);
  if (path.extname(resolved) === ".json") return JSON.parse(fs.readFileSync(resolved, "utf8"));
  delete require.cache[require.resolve(resolved)];
  return require(resolved);
}

function buildContentHandoff(source) {
  validateLesson(source);
  return {
    schemaVersion: HANDOFF_SCHEMA_VERSION,
    lesson: {
      id: source.id,
      version: source.version,
      title: singleLine(source.title),
      subject: singleLine(source.subject),
      grade: singleLine(source.grade),
      unit: singleLine(source.unit),
      durationMinutes: source.durationMinutes,
      slideCount: source.slides.length,
    },
    slides: source.slides.map((slide) => ({
      number: slide.number,
      phase: singleLine(slide.phase),
      minutes: slide.minutes,
      title: singleLine(slide.title),
      visibleContent: visibleContentForSlide(slide, source),
    })),
  };
}

function buildMarkdown(handoff) {
  const slideSections = handoff.slides.map((slide) => `## ${String(slide.number).padStart(2, "0")}. ${slide.phase} · ${slide.minutes}분

제목: ${slide.title}

화면에 들어갈 내용:
${slide.visibleContent.map((item) => `- ${item}`).join("\n")}
`).join("\n");

  return `# Claude 전달용 PPT 내용 원고

- 교과·대상: ${handoff.lesson.subject} · ${handoff.lesson.grade}
- 단원: ${handoff.lesson.unit}
- 차시: ${handoff.lesson.durationMinutes}분
- 수업 제목: ${handoff.lesson.title}

${slideSections}
`.replace(/\n+$/, "\n");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function writeContentHandoff(source, outputRoot) {
  const handoff = buildContentHandoff(source);
  const markdown = buildMarkdown(handoff);
  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.mkdirSync(outputRoot, { recursive: true });
  const jsonPath = path.join(outputRoot, "claude-ppt-content.json");
  const markdownPath = path.join(outputRoot, "claude-ppt-content.md");
  const json = `${JSON.stringify(handoff, null, 2)}\n`;
  fs.writeFileSync(jsonPath, json, "utf8");
  fs.writeFileSync(markdownPath, markdown, "utf8");
  const manifest = {
    schemaVersion: 1,
    lessonId: source.id,
    seriesTargetCount: SERIES_TARGET_COUNT,
    slideCount: handoff.slides.length,
    files: [
      { name: path.basename(jsonPath), bytes: Buffer.byteLength(json), sha256: sha256(json) },
      { name: path.basename(markdownPath), bytes: Buffer.byteLength(markdown), sha256: sha256(markdown) },
    ],
  };
  fs.writeFileSync(path.join(outputRoot, "content-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return { handoff, jsonPath, markdownPath, manifest };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  ensure(fs.existsSync(options.lessonPath), `수업 스키마가 없습니다: ${options.lessonPath}`);
  const source = loadLesson(options.lessonPath);
  const repoRoot = path.resolve(__dirname, "../..");
  const outputRoot = options.outputRoot || path.join(repoRoot, "artifacts", "vivasam", source.id, "content-handoff");
  const result = writeContentHandoff(source, outputRoot);
  process.stdout.write(`${JSON.stringify({
    lessonId: source.id,
    seriesTargetCount: SERIES_TARGET_COUNT,
    slideCount: result.handoff.slides.length,
    json: result.jsonPath,
    markdown: result.markdownPath,
  }, null, 2)}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exit(1);
  }
}

module.exports = {
  HANDOFF_SCHEMA_VERSION,
  SERIES_TARGET_COUNT,
  buildContentHandoff,
  buildMarkdown,
  loadLesson,
  validateLesson,
  writeContentHandoff,
};
