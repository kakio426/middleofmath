"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { RESERVED_SOURCE_SCOPES, SERIES_PLAN, assertSeriesPlan } = require("./g3-series-plan.cjs");
const { validateLesson } = require("./build-content-handoff.cjs");
const { assertContentHandoffContract, validateFiles } = require("./validate-content-handoff.cjs");
const { loadTracker, summarizeTracker, validateTracker } = require("./track-series.cjs");

const repoRoot = path.resolve(__dirname, "../..");
const artifactsRoot = path.join(repoRoot, "artifacts", "vivasam");
const trackerPath = path.join(__dirname, "series-tracker.json");
const SOURCE_CHECKSUMS = Object.freeze({
  1: "0656d583e8bf2987f456e47887a0d7243f6b611a4b586f45c11eeba7dca88112",
  2: "afe6e080570e79438ec70ddcfe676ed78bc918ebd1acf5b48ab1fa46012408a2",
});

function artifactPaths(entry) {
  const lessonRoot = path.join(artifactsRoot, entry.lessonId);
  return {
    lessonRoot,
    schemaPath: path.join(lessonRoot, "lesson-schema.json"),
    handoffRoot: path.join(lessonRoot, "content-handoff"),
    jsonPath: path.join(lessonRoot, "content-handoff", "claude-ppt-content.json"),
    markdownPath: path.join(lessonRoot, "content-handoff", "claude-ppt-content.md"),
  };
}

test("시리즈는 초3 1학기 15개와 2학기 15개로만 구성된다", () => {
  assert.equal(assertSeriesPlan(), true);
  assert.equal(SERIES_PLAN.length, 30);
  assert.equal(SERIES_PLAN.filter((entry) => entry.semester === 1).length, 15);
  assert.equal(SERIES_PLAN.filter((entry) => entry.semester === 2).length, 15);
  assert.equal(new Set(SERIES_PLAN.map((entry) => entry.lessonId)).size, 30);
});

test("Claude 내용 원고 30세트가 모두 존재하고 내용 전용 계약을 통과한다", () => {
  const hashes = new Set();
  for (const entry of SERIES_PLAN) {
    const paths = artifactPaths(entry);
    const handoff = validateFiles(paths.handoffRoot);
    assert.equal(assertContentHandoffContract(handoff), true);
    assert.equal(handoff.lesson.slideCount, 11);
    assert.equal(handoff.lesson.durationMinutes, 40);
    assert.equal(handoff.slides.length, 11);
    assert.ok(handoff.slides.every((slide) => !slide.title.includes("\n")));
    assert.ok(handoff.slides.every((slide) => Array.from(slide.title).length <= 24), `${entry.lessonId}에 너무 긴 슬라이드 제목이 있습니다.`);
    assert.ok(handoff.slides.flatMap((slide) => slide.visibleContent).every((item) => !item.includes("\n")));
    const serialized = fs.readFileSync(paths.jsonPath, "utf8");
    hashes.add(crypto.createHash("sha256").update(serialized).digest("hex"));
  }
  assert.equal(hashes.size, 30, "30개 내용 원고가 서로 다른 내용을 가져야 합니다.");
});

test("새로 생성한 29개 내부 스키마는 한 활동지와 수학 근거를 가진다", () => {
  const worksheetFiles = new Set();
  for (const entry of SERIES_PLAN.filter((item) => !item.existing)) {
    const schema = JSON.parse(fs.readFileSync(artifactPaths(entry).schemaPath, "utf8"));
    assert.doesNotThrow(() => validateLesson(schema));
    assert.equal(schema.slides.length, 11);
    assert.equal(schema.slides.reduce((sum, slide) => sum + slide.minutes, 0), 40);
    assert.equal(Object.hasOwn(schema, "worksheet"), true);
    assert.equal(schema.slides.some((slide) => Object.hasOwn(slide, "worksheet")), false);
    assert.match(schema.worksheet.file, /-worksheet\.png$/);
    assert.equal(worksheetFiles.has(schema.worksheet.file), false);
    worksheetFiles.add(schema.worksheet.file);
    assert.equal(schema.mathOracle.sourceChecksum, SOURCE_CHECKSUMS[entry.semester]);
    assert.equal(schema.mathOracle.sourceJudgments.length, 2);
    assert.equal(new Set(schema.mathOracle.sourceJudgments.map((item) => item.judgmentId)).size, 2);
    assert.ok(schema.mathOracle.sourceJudgments.every((item) => item.choiceId && item.label));
    assert.ok(schema.mathOracle.extensionAnswer);
    assert.ok(schema.answerKey.extension);
    assert.equal(schema.answerKey.errorAnalysis.length, 4);
    assert.doesNotMatch(schema.targetBehavior, /다\s+또한/, `${entry.lessonId}의 목표 문장이 어색하게 이어집니다.`);
    assert.match(schema.targetBehavior, /다\. 식·자료·한 문장으로 근거를 설명한다\.$/);
  }
  assert.equal(worksheetFiles.size, 29);
});

test("승인되지 않은 1학기 초안과 4~6학년 범위를 사용하지 않는다", () => {
  for (const entry of SERIES_PLAN.filter((item) => !item.existing)) {
    const schema = JSON.parse(fs.readFileSync(artifactPaths(entry).schemaPath, "utf8"));
    const evidence = schema.sourceEvidence.join("\n");
    for (const reserved of RESERVED_SOURCE_SCOPES) assert.equal(evidence.includes(reserved), false, `${entry.lessonId}가 예약 범위를 사용했습니다.`);
    if (entry.semester === 1) assert.match(evidence, /grade3-semester1\.ts/);
    if (entry.semester === 2) assert.match(evidence, /grade3-semester2-complete\.ts/);
  }
});

test("Claude Markdown에는 디자인·활동지·정답·플랫폼 지시가 섞이지 않는다", () => {
  const forbidden = /(레이아웃|색상 팔레트|폰트|글꼴|여백|좌측 배치|우측 배치|디자인 지시|발표자 노트|동반 활동지|교사용 정답|Eduitit|플랫폼)/;
  for (const entry of SERIES_PLAN) {
    const markdown = fs.readFileSync(artifactPaths(entry).markdownPath, "utf8");
    assert.doesNotMatch(markdown, forbidden, entry.lessonId);
    assert.doesNotMatch(markdown, /(수이 필요한|수'을 이용해|함\.)/, entry.lessonId);
  }
});

test("개념 유형에 맞지 않는 공통 풀이 문구를 쓰지 않는다", () => {
  const circle = fs.readFileSync(artifactPaths(SERIES_PLAN.find((entry) => entry.lessonId === "g3s2-circle-parts")).markdownPath, "utf8");
  const fraction = fs.readFileSync(artifactPaths(SERIES_PLAN.find((entry) => entry.lessonId === "g3s1-fraction-equal-parts")).markdownPath, "utf8");
  const unitChoice = fs.readFileSync(artifactPaths(SERIES_PLAN.find((entry) => entry.lessonId === "g3s1-length-real-world-units")).markdownPath, "utf8");
  const capacity = fs.readFileSync(artifactPaths(SERIES_PLAN.find((entry) => entry.lessonId === "g3s2-capacity-unit")).markdownPath, "utf8");

  assert.doesNotMatch(circle, /(식 쓰기|답에 단위 붙이기|원 자료: radius)/);
  assert.match(circle, /이름과 근거를 남겨요/);
  assert.match(fraction, /분수와 까닭을 남겨요/);
  assert.match(unitChoice, /단위 선택과 까닭을 남겨요/);
  assert.match(capacity, /1L는 100mL 열 묶음과 어떤 관계일까요\?/);
  assert.doesNotMatch(capacity, /1L를 100mL로 바꾸면/);
});

test("색인과 합본은 30개 원고를 빠짐없이 가리킨다", () => {
  const index = fs.readFileSync(path.join(artifactsRoot, "CLAUDE-CONTENT-INDEX.md"), "utf8");
  const combined = fs.readFileSync(path.join(artifactsRoot, "claude-all-30-ppt-content.md"), "utf8");
  const manifest = JSON.parse(fs.readFileSync(path.join(artifactsRoot, "claude-content-series-manifest.json"), "utf8"));
  assert.equal((index.match(/^\| \d{2} \|/gm) || []).length, 30);
  assert.equal((combined.match(/^# PPT \d{2} ·/gm) || []).length, 30);
  assert.equal(manifest.count, 30);
  assert.equal(manifest.records.length, 30);
  for (const entry of SERIES_PLAN) assert.ok(index.includes(entry.lessonId));
});

test("추적 원장은 내용 30개와 수령된 HTML 발표 자료 30개를 정확히 기록한다", () => {
  const loaded = loadTracker(trackerPath);
  const validated = validateTracker(loaded.tracker, { trackerPath });
  const summary = summarizeTracker(validated);
  assert.equal(summary.registeredLessons, 30);
  assert.equal(summary.contentValidated, 30);
  assert.equal(summary.claudePptsReceived, 30);
  assert.equal(summary.claudePptsAwaiting, 0);
  assert.equal(summary.claudePptsValidated, 0);
  assert.equal(summary.worksheetsValidated, 30);
  assert.equal(summary.supportValidated, 30);
  assert.equal(summary.packagesValidated, 30);
  assert.equal(summary.localRecordsPublished, 0);
  assert.equal(summary.productionPublished, 0);
  assert.equal(summary.fullyCompleted, 0);
});
