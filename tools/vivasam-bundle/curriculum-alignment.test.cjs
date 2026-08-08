"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { CURRICULUM_ALIGNMENTS } = require("./g3-curriculum-alignments.cjs");
const { loadSeriesLessons } = require("./build-series-non-ppt-assets.cjs");
const { PATCHES: WORKSHEET_CURRICULUM_LABEL_PATCHES } = require("./patch-worksheet-curriculum-labels.cjs");

const repoRoot = path.resolve(__dirname, "../..");

function deckHtml(lessonId) {
  return fs.readFileSync(
    path.join(repoRoot, "artifacts", "vivasam", lessonId, "claude", `${lessonId}-slides.html`),
    "utf8",
  );
}

function deckSection(lessonId, label) {
  const html = deckHtml(lessonId);
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.match(new RegExp(`<section data-slide[^>]*data-label="${escapedLabel}"[\\s\\S]*?<\\/section>`))?.[0];
}

function assertRepairRoute(lessonId, errorText, step, stepLabel) {
  const share = deckSection(lessonId, "09 생각 나누기");
  assert.ok(share, `${lessonId}: 생각 나누기 슬라이드가 없습니다.`);
  const start = share.indexOf(errorText);
  assert.notEqual(start, -1, `${lessonId}: 검토할 오답을 찾지 못했습니다.`);
  const repair = share.slice(start, start + 2200);
  assert.match(repair, new RegExp(`>${step}<\\/span>[\\s\\S]{0,420}>${stepLabel}<\\/span>`), `${lessonId}: 오답과 첫 수정 단계가 맞지 않습니다.`);
}

function fileHash(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function hasLegacyWorksheetLabel(prompt, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`${escaped}(?!와 소수)`).test(prompt);
}

test("30개 활동은 비상 3학년 교과서 위치와 2022 개정 성취기준을 빠짐없이 가진다", () => {
  assert.equal(CURRICULUM_ALIGNMENTS.length, 30);
  assert.deepEqual(CURRICULUM_ALIGNMENTS.map((item) => item.sequence), Array.from({ length: 30 }, (_, index) => index + 1));
  assert.equal(new Set(CURRICULUM_ALIGNMENTS.map((item) => item.lessonId)).size, 30);
  assert.deepEqual(
    Object.fromEntries(["exact", "connection", "multi-lesson"].map((kind) => [kind, CURRICULUM_ALIGNMENTS.filter((item) => item.alignmentType === kind).length])),
    { exact: 19, connection: 5, "multi-lesson": 6 },
  );

  for (const item of CURRICULUM_ALIGNMENTS) {
    assert.equal(item.curriculumRevision, "2022 개정 교육과정", item.lessonId);
    assert.equal(item.publisher, "비상교육", item.lessonId);
    assert.equal(item.grade, 3, item.lessonId);
    assert.ok([1, 2].includes(item.semester), item.lessonId);
    assert.ok(Number.isInteger(item.unitNumber) && item.unitNumber > 0, item.lessonId);
    assert.ok(item.unitTitle, item.lessonId);
    assert.ok(item.lessonRange, item.lessonId);
    assert.ok(item.lessonTitle, item.lessonId);
    assert.ok(item.textbookPages.start <= item.textbookPages.end, item.lessonId);
    assert.ok(item.standardCodes.length > 0, item.lessonId);
    assert.ok(item.standardCodes.every((code) => /^4수\d{2}-\d{2}$/.test(code)), item.lessonId);
    assert.ok(item.usageNote, item.lessonId);
  }
});

test("정본 교과서 매핑이 빌드 입력의 학기·단원·교육과정 메타데이터를 결정한다", () => {
  const lessons = loadSeriesLessons();
  assert.equal(lessons.length, CURRICULUM_ALIGNMENTS.length);
  for (const [index, lesson] of lessons.entries()) {
    const alignment = CURRICULUM_ALIGNMENTS[index];
    assert.equal(lesson.id, alignment.lessonId);
    assert.equal(lesson.grade, `초등 3학년 ${alignment.semester}학기`);
    assert.equal(lesson.unit, `${alignment.unitNumber}. ${alignment.unitTitle}`);
    assert.deepEqual(lesson.curriculum, alignment);
  }
});

test("각 수업의 원본 스키마도 정본 단원명과 성취기준에 맞는다", () => {
  for (const alignment of CURRICULUM_ALIGNMENTS) {
    const schemaPath = path.join(repoRoot, "artifacts", "vivasam", alignment.lessonId, "lesson-schema.json");
    if (!fs.existsSync(schemaPath)) continue;
    const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
    assert.equal(schema.unit, `${alignment.unitNumber}. ${alignment.unitTitle}`, alignment.lessonId);
    assert.deepEqual(schema.curriculumAnchorIds, alignment.standardCodes.map((code) => `[${code}]`), alignment.lessonId);
  }
});

test("3학년 1학기 분수 3차시는 해당 차시 성취기준만 사용한다", () => {
  for (const lessonId of ["g3s1-fraction-part-whole", "g3s1-fraction-pizza-context"]) {
    const alignment = CURRICULUM_ALIGNMENTS.find((item) => item.lessonId === lessonId);
    assert.deepEqual(alignment.standardCodes, ["4수01-09"]);
    assert.equal(alignment.lessonRange, "3차시");
    assert.deepEqual(alignment.textbookPages, { start: 134, end: 137 });
  }
});

test("학생과 교사가 보는 모든 슬라이드의 단원 표기도 정본 매핑과 일치한다", () => {
  for (const alignment of CURRICULUM_ALIGNMENTS) {
    const html = deckHtml(alignment.lessonId);
    const expected = `${alignment.unitNumber}. ${alignment.unitTitle}`;
    const visibleUnitLabels = [...html.matchAll(/>(\d+\.\s*[가-힣][^<·]*)(?:\s*·\s*\d+분)?<\/div>/g)]
      .map((match) => match[1].trim());

    assert.ok(visibleUnitLabels.length > 0, `${alignment.lessonId}: 화면 단원 표기가 없습니다.`);
    assert.deepEqual(
      [...new Set(visibleUnitLabels)],
      [expected],
      `${alignment.lessonId}: 화면 단원 표기와 정본 매핑이 다릅니다.`,
    );
  }
});

test("다운로드 활동지도 정본 단원 표기를 쓰고 교정 영역 밖 픽셀을 보존한다", () => {
  assert.equal(Object.keys(WORKSHEET_CURRICULUM_LABEL_PATCHES).length, 18);
  for (const [lessonId, patch] of Object.entries(WORKSHEET_CURRICULUM_LABEL_PATCHES)) {
    const worksheetRoot = path.join(repoRoot, "artifacts", "vivasam", lessonId, "worksheet");
    const stem = `${lessonId}-worksheet`;
    const promptPath = path.join(worksheetRoot, `${stem}.prompt.txt`);
    const imagePath = path.join(worksheetRoot, `${stem}.png`);
    const metadata = JSON.parse(fs.readFileSync(path.join(worksheetRoot, `${stem}.imagegen.json`), "utf8"));
    const prompt = fs.readFileSync(promptPath, "utf8");

    assert.match(prompt, new RegExp(patch.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), lessonId);
    assert.ok(!hasLegacyWorksheetLabel(prompt, patch.oldLabel), `${lessonId}: 활동지 프롬프트에 예전 단원명이 남았습니다.`);
    assert.equal(metadata.promptSha256, fileHash(promptPath), lessonId);
    assert.equal(metadata.imageSha256, fileHash(imagePath), lessonId);
    assert.equal(metadata.postProcessing?.mode, "deterministic-text-overlay", lessonId);
    assert.equal(metadata.postProcessing?.tool, "sharp", lessonId);
    assert.equal(metadata.postProcessing?.script, "tools/vivasam-bundle/patch-worksheet-curriculum-labels.cjs", lessonId);
    assert.equal(metadata.postProcessing?.outsideChangedPixels, 0, lessonId);
    assert.ok(metadata.postProcessing?.changedPixels > 0, lessonId);
    assert.ok(metadata.postProcessing?.regions?.some((region) => region.kind === "curriculum-label" && region.text === patch.label), lessonId);
  }

  const lesson14Root = path.join(repoRoot, "artifacts", "vivasam", "g3s1-length-centimeter-meter", "worksheet");
  const lesson14Prompt = fs.readFileSync(path.join(lesson14Root, "g3s1-length-centimeter-meter-worksheet.prompt.txt"), "utf8");
  const lesson14Metadata = fs.readFileSync(path.join(lesson14Root, "g3s1-length-centimeter-meter-worksheet.imagegen.json"), "utf8");
  assert.match(lesson14Prompt, /지우개 길이 약 5cm/);
  assert.doesNotMatch(lesson14Prompt, /지우개 길이 약 4cm/);
  assert.match(lesson14Metadata, /지우개 약 5cm/);
  assert.doesNotMatch(lesson14Metadata, /지우개 약 4cm/);
});

test("첫 선택 전에는 정답 보기만 검은 테두리로 강조하지 않는다", () => {
  for (const { lessonId } of CURRICULUM_ALIGNMENTS) {
    const html = deckHtml(lessonId);
    const hiddenBlocks = [...html.matchAll(/<sc-if value="\{\{ hide\.a1 \}\}"[^>]*>([\s\S]*?)<\/sc-if>/g)].map((match) => match[1]);
    for (const block of hiddenBlocks.filter((value) => value.includes("border-radius:9999px"))) {
      assert.doesNotMatch(block, /border:1px solid #000/, `${lessonId}: 행동 전 정답 선택지가 강조되어 있습니다.`);
      assert.match(block, /border:1px solid #8a8a8a/, `${lessonId}: 행동 전 선택지 스타일이 다른 보기와 같지 않습니다.`);
      assert.match(block, /color:#4a4a4a/, `${lessonId}: 행동 전 선택지 글자색이 다른 보기와 같지 않습니다.`);
    }
  }
});

test("첫 활동의 수학적 표현은 선택 전에 완성 답을 대신 말하지 않는다", () => {
  const forbiddenByLesson = {
    "g3s1-division-fact-family": /24÷4=6/,
    "g3s1-division-group-count": /5×\s*7\s*=35|7묶음/,
    "g3s1-length-centimeter-meter": /연필 약 15cm/,
    "g3s1-length-real-world-units": /2개 높이\s*=\s*약 2m/,
    "g3s1-length-unit-conversion": /10cm짜리 10개\s*=\s*100cm\s*=\s*1m/,
    "g3s2-multiplication-combine": />72</,
    "g3s2-multiplication-two-digit": /230\+46\s*276/,
    "g3s2-division-remainder-check": /4×7\+1\s*=\s*29/,
    "g3s2-capacity-unit": /100mL 컵 10개\s*=\s*1000mL/,
    "g3s2-weight-unit": /1000\+1000\+300\s*=\s*2300g/,
    "g3s2-division-remainder": /16÷4=4/,
  };

  for (const [lessonId, forbidden] of Object.entries(forbiddenByLesson)) {
    const html = deckHtml(lessonId);
    const activity = html.match(/<section data-slide[^>]*data-label="05 활동1 함께"[\s\S]*?<\/section>/)?.[0];
    assert.ok(activity, `${lessonId}: 첫 활동 슬라이드가 없습니다.`);
    const evidenceBeforeChoices = activity.split(/border-top:1px solid rgba\(0,0,0,\.16\);padding-top/)[0];
    const evidenceBeforeConfirm = evidenceBeforeChoices.replace(
      /<sc-if value="\{\{ rv\.a1 \}\}"[^>]*>[\s\S]*?<\/sc-if>/g,
      "",
    );
    assert.doesNotMatch(evidenceBeforeConfirm, forbidden, `${lessonId}: 선택 전에 표현이 답을 완성해 보여 줍니다.`);
    assert.match(activity, /data-answer-stage="predict"/, `${lessonId}: 예상 단계 표시가 없습니다.`);
    assert.match(activity, /data-answer-stage="confirm"/, `${lessonId}: 확인 단계 표시가 없습니다.`);
  }
});

test("열기와 동기 유발의 표현도 첫 예상 전에 완성 답을 말하지 않는다", () => {
  const forbiddenByLesson = {
    "g3s1-division-fact-family": /24÷4\s*=\s*6/,
    "g3s1-division-group-count": /5개씩\s*7묶음\s*=\s*35/,
    "g3s1-length-centimeter-meter": /15cm/,
    "g3s1-length-real-world-units": /2m/,
    "g3s1-length-unit-conversion": /1m\s*=\s*100cm|10cm 막대 10개\s*=\s*100cm/,
    "g3s2-division-remainder-check": /4×7\+1\s*=\s*29|4개씩 7묶음 \+ 나머지 1\s*=\s*29/,
    "g3s2-capacity-unit": /1L\s*=\s*1000mL|100mL 컵 10개\s*=\s*1000mL/,
    "g3s2-weight-unit": /2kg\s*300g\s*=\s*2300g|1000g?\s*\+\s*1000g?\s*\+\s*300g?\s*=\s*2300g/,
  };

  for (const [lessonId, forbidden] of Object.entries(forbiddenByLesson)) {
    const opening = deckSection(lessonId, "01 열기");
    const motivation = deckSection(lessonId, "02 동기 유발");
    assert.ok(opening && motivation, `${lessonId}: 열기 또는 동기 유발 슬라이드가 없습니다.`);
    const evidenceBeforeChoices = motivation.split("풀이 A")[0];
    const prePrediction = `${opening}\n${evidenceBeforeChoices}`.replace(/src="data:[^"]+"/g, 'src="[DATA]"');
    assert.doesNotMatch(prePrediction, forbidden, `${lessonId}: 첫 예상 전에 완성 답이 보입니다.`);
    assert.match(prePrediction, /\?/, `${lessonId}: 첫 예상에서 미완성 표현을 찾을 수 없습니다.`);
  }
});

test("몇 묶음 문제는 예상 전에 완성 묶음 수를 그림으로 보여 주지 않는다", () => {
  const motivation = deckSection("g3s1-division-group-count", "02 동기 유발");
  const activity = deckSection("g3s1-division-group-count", "05 활동1 함께");
  assert.ok(motivation && activity);
  assert.match(motivation, /data-answer-staging="ungrouped-35"/);
  assert.match(motivation, /35장을 5장씩 묶는 방법을 먼저 생각해 보세요/);
  assert.match(activity, /<sc-if value="\{\{ hide\.a1 \}\}"[^>]*><div data-answer-staging="ungrouped-35"/);
  assert.match(activity, /아직 묶지 않은 35장 · 5장씩 직접 묶어 보세요/);
  assert.match(activity, /<sc-if value="\{\{ rv\.a1 \}\}"[^>]*><span data-answer-stage="confirm"[^>]*>5×7=35 · 7묶음/);
});

test("학생용 분수는 슬래시 대신 위아래로 쌓아 표시한다", () => {
  const fractionLessons = [
    "g3s1-fraction-equal-parts",
    "g3s1-fraction-fix-partition",
    "g3s1-fraction-part-whole",
    "g3s1-fraction-pizza-context",
    "g3s2-fraction-part-whole",
    "g3s2-fraction-convert",
    "g3s2-fraction-compare",
  ];

  for (const lessonId of fractionLessons) {
    const html = deckHtml(lessonId);
    const deckStart = html.indexOf("<x-import data-eduitit-deck");
    const deckEnd = html.lastIndexOf("</x-import>");
    const deck = html.slice(deckStart, deckEnd);
    const visibleText = [...deck.matchAll(/>([^<>]+)</g)].map((match) => match[1]).join(" ");
    assert.doesNotMatch(visibleText, /\d+\s*\/\s*\d+/, `${lessonId}: 학생 화면에 슬래시 분수가 남았습니다.`);
    assert.match(deck, /class="mc-frac"/, `${lessonId}: 쌓인 분수 표현이 없습니다.`);
  }
});

test("오답 설명은 학생이 가장 먼저 고쳐야 할 단계와 연결된다", () => {
  assertRepairRoute("g3s1-multiplication-array-transfer", "6줄의 묶음 수 6을", "03", "곱셈식으로 나타내기");
  assertRepairRoute("g3s1-multiplication-groups-model", "4봉지의 묶음 수 4를", "03", "곱셈식으로 나타내기");
  assertRepairRoute("g3s1-division-equal-sharing", "12÷3 대신 12-3=9", "03", "하나씩 똑같이 나누기");
  assertRepairRoute("g3s1-division-missing-factor", "5×□=20의 빈칸 대신 20-5=15", "03", "하나씩 똑같이 나누기");
  assertRepairRoute("g3s1-division-fact-family", "24÷4 대신 24-4=20", "03", "전체를 한 요인으로 나누기");
  assertRepairRoute("g3s1-division-group-count", "35÷5 대신 35-5=30", "03", "전체를 한 요인으로 나누기");
  assertRepairRoute("g3s1-fraction-part-whole", "남은 5-2=3을 분모로", "03", "전체 수를 분모에 쓰기");
  assertRepairRoute("g3s1-fraction-pizza-context", "남은 8-3=5를 분모로", "03", "전체 수를 분모에 쓰기");
  assertRepairRoute("g3s1-length-centimeter-meter", "15cm의 단위를 mm로", "03", "mm·cm·m·km 중 고르기");
  assertRepairRoute("g3s1-length-real-world-units", "약 2m의 단위를 cm로", "03", "mm·cm·m·km 중 고르기");
  assertRepairRoute("g3s1-length-unit-conversion", "1m=100cm 대신 1m=10cm", "01", "바꿀 단위 관계 쓰기");
  assertRepairRoute("g3s1-length-unit-conversion", "1m=100cm 대신 1m=1000cm", "01", "바꿀 단위 관계 쓰기");
  assertRepairRoute("g3s2-multiplication-place-value", "20을 2로 읽고", "01", "수의 자릿값 나누기");
  assertRepairRoute("g3s2-multiplication-place-value", "20×3 대신 20+3=23", "02", "각 자릿값에 곱하기");
  assertRepairRoute("g3s2-multiplication-two-digit", "23×12 대신 23+230=253", "02", "첫 수에 각각 곱하기");
  assertRepairRoute("g3s2-division-meaning", "24÷6 대신 24-6=18", "03", "무엇을 구하는지 말하기");
  assertRepairRoute("g3s2-division-remainder-check", "4×7+1=29 대신 4×7-1=27", "02", "나머지 더하기");
  assertRepairRoute("g3s2-circle-parts", "중심→원 위 한 점인 선분을 지름", "04", "선분을 반지름으로 말하기");
  assertRepairRoute("g3s2-circle-parts", "중심과 원 위를 잇는 선분을 원의 둘레", "04", "선분을 반지름으로 말하기");
  assertRepairRoute("g3s2-fraction-part-whole", "색칠 3, 전체 4", "04", "분자와 분모에 놓기");
  assertRepairRoute("g3s2-fraction-convert", "몫 2와 나머지 1을 바꾸어", "04", "자연수와 분수로 나타내기");
  assertRepairRoute("g3s2-fraction-convert", "몫 2에 1을 더해", "04", "자연수와 분수로 나타내기");
  assertRepairRoute("g3s2-fraction-compare", "분모 5=5만 확인", "03", "분자 비교하기");
  assertRepairRoute("g3s2-weight-unit", "2|030=2030g", "02", "kg을 g으로 바꾸기");
  assertRepairRoute("g3s2-pictograph-compare", "다시 ×2를 하여", "03", "각 행을 실제 수량으로 바꾸기");
});

test("감사에서 발견한 내용 오류와 단위 표현을 되돌리지 않는다", () => {
  const lesson07 = deckHtml("g3s1-division-missing-factor");
  assert.match(lesson07, /곱셈식과 나눗셈식에 같은 세 수가 쓰였는지 확인하기/);
  assert.doesNotMatch(lesson07, /두 나눗셈식에 같은 세 수가 쓰였는지 확인하기/);

  const lesson15 = deckHtml("g3s1-length-real-world-units");
  assert.match(lesson15, /단추 두께 약 2mm/);
  assert.match(lesson15, /두 도시 사이 거리 약 5km/);
  assert.doesNotMatch(lesson15, /단추 두께 약 3mm|두 도시 사이 거리 약 40km/);

  const lesson14 = deckHtml("g3s1-length-centimeter-meter");
  assert.match(lesson14, /지우개 약 5cm/);
  assert.ok((lesson14.match(/약 5cm/g) || []).length >= 2);
  assert.doesNotMatch(lesson14, /지우개 약 4cm/);
  const lesson14Schema = fs.readFileSync(path.join(repoRoot, "artifacts", "vivasam", "g3s1-length-centimeter-meter", "lesson-schema.json"), "utf8");
  const lesson14Handoff = fs.readFileSync(path.join(repoRoot, "artifacts", "vivasam", "g3s1-length-centimeter-meter", "content-handoff", "claude-ppt-content.md"), "utf8");
  assert.match(lesson14Schema, /지우개 길이 약 5cm/);
  assert.match(lesson14Handoff, /지우개 길이 약 5cm/);
  assert.doesNotMatch(`${lesson14Schema}\n${lesson14Handoff}`, /지우개 길이 약 4cm/);

  const lesson21 = deckHtml("g3s2-division-remainder");
  const lesson21Alignment = CURRICULUM_ALIGNMENTS.find((item) => item.lessonId === "g3s2-division-remainder");
  assert.equal(lesson21Alignment.lessonRange, "4~7차시");
  assert.deepEqual(lesson21Alignment.textbookPages, { start: 38, end: 47 });
  assert.match(lesson21, /52÷4=13/);
  assert.match(lesson21, /4×10=40 · 40\+28=\?/);
  assert.match(lesson21, /68÷4=17/);
  assert.match(lesson21, /활동지에 처음 수를 쓴 뒤, 공책에서 남은 28개도 4상자에 나눠 보세요/);
  assert.match(lesson21, /활동지 · 67−50=17/);
  assert.match(lesson21, /공책 · 17÷5=3…2/);
  assert.match(lesson21, /67÷5=13…2/);
  assert.match(lesson21, /남은 수도 끝까지 나누기/);
  assert.match(lesson21, /활동지에 쓴 17이 왜 마지막 나머지가 아닌지 설명하기/);
  assert.doesNotMatch(lesson21, /중간의 17과 최종 나머지 2가 다른 까닭 설명하기/);
  assert.doesNotMatch(lesson21, /12&lt;4\?\s*[×✗]|17개가 남았습니다/);
  assert.doesNotMatch(lesson21, /67÷5=14…−3/);
  assert.match(lesson21, /52÷4=10…12/);
  assert.match(lesson21, /52−40=2/);
  assert.doesNotMatch(lesson21, /74÷5|83÷6/);

  const lesson21Schema = JSON.parse(fs.readFileSync(path.join(repoRoot, "artifacts", "vivasam", "g3s2-division-remainder", "lesson-schema.json"), "utf8"));
  assert.equal(lesson21Schema.slides.length, 11);
  assert.deepEqual(lesson21Schema.curriculumAnchorIds, ["[4수01-06]"]);
  assert.match(lesson21Schema.targetBehavior, /중간에 남은 수도 이어서 나누어 몫과 최종 나머지를 구분/);
  assert.equal(lesson21Schema.mathOracle.extensionOracle.intermediateRemaining, 17);
  assert.equal(lesson21Schema.mathOracle.extensionOracle.quotient, 13);
  assert.equal(lesson21Schema.mathOracle.extensionOracle.remainder, 2);

  const lesson28 = deckHtml("g3s2-capacity-unit");
  assert.match(lesson28, /1L와 1000mL는 같은 들이입니다\. 몇 L 몇 mL를 mL로 나타낼 때는 L 수에 1000을 곱하고 남은 mL를 더합니다\./);
  assert.doesNotMatch(lesson28, /L를 mL로 바꿀 때 1000배/);
  const lesson28Repair = lesson28.match(/<section data-slide[^>]*data-label="09 생각 나누기"[\s\S]*?<\/section>/)?.[0];
  assert.ok(lesson28Repair);
  assert.match(lesson28Repair, /data-step="1" data-active="false"/);
  assert.doesNotMatch(lesson28Repair, /data-step="1" data-active="true"/);

  const lesson29 = deckHtml("g3s2-weight-unit");
  assert.match(lesson29, /1kg과 1000g은 같은 무게입니다\. 몇 kg 몇 g을 g으로 나타낼 때는 kg 수에 1000을 곱하고 남은 g을 더합니다\./);
});
