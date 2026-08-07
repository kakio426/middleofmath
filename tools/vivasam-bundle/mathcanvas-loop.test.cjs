"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const tracker = require("./series-tracker.json");
const { materializeBundle, repositoryRoots } = require("./track-series.cjs");
const {
  assertWorksheetContract,
  buildWorksheetIntake,
  parseArgs,
  projectTrackerFields,
} = require("./mathcanvas-loop.cjs");

const trackerPath = path.join(__dirname, "series-tracker.json");

test("3번 활동지 1장을 수동 제작본 우선 MathCanvas intake로 고정한다", () => {
  const bundle = materializeBundle(tracker, tracker.bundles[2]);
  const roots = repositoryRoots(tracker, trackerPath, {
    middleofmath: path.resolve(__dirname, "../.."),
    eduitit: path.resolve(__dirname, "../../..", "eduitit"),
  });
  const evidence = assertWorksheetContract(bundle, roots);
  const lesson = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../artifacts/vivasam/g3s1-multiplication-array-transfer/lesson-schema.json"), "utf8"));
  const intake = buildWorksheetIntake(bundle, lesson, evidence);
  assert.equal(intake.worksheet.filename, "g3s1-multiplication-array-transfer-worksheet.png");
  assert.equal(intake.worksheet.sha256, "65be8eb9aeac51dab319f53c21993bb9d1a5a87f6852116213e99ec68be0d9c8");
  assert.deepEqual(intake.sourcePolicy, {
    reusableProjectSource: "owner-manual-curated",
    generatedProjectSource: "owner-mathcanvas-ai",
    prototypeProjectReuse: false,
    externalProjectReuse: false,
  });
  assert.ok(intake.mathEvidence.answerLabels.includes("6×7=42개"));
  assert.ok(intake.mathEvidence.misconceptions.some((value) => value.includes("5+6=11")));
});

test("활동지 폴더에 PNG가 둘이면 PPT당 활동지 1개 계약을 막는다", () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mathcanvas-one-worksheet-"));
  try {
    const worksheetDirectory = path.join(temporaryRoot, "worksheet");
    fs.mkdirSync(worksheetDirectory, { recursive: true });
    fs.copyFileSync(path.resolve(__dirname, "../../artifacts/vivasam/g3s1-multiplication-array-transfer/worksheet/g3s1-multiplication-array-transfer-worksheet.png"), path.join(worksheetDirectory, "one.png"));
    fs.copyFileSync(path.join(worksheetDirectory, "one.png"), path.join(worksheetDirectory, "two.png"));
    const bundle = materializeBundle(tracker, tracker.bundles[2]);
    bundle.worksheet.filename = "one.png";
    bundle.worksheet.pngPath = "middleofmath:worksheet/one.png";
    assert.throws(() => assertWorksheetContract(bundle, { middleofmath: temporaryRoot, eduitit: temporaryRoot }), /PNG가 정확히 1개/);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("수동 검수 결과와 새 제작 결과를 서로 다른 원장 상태로 투영한다", () => {
  const common = ["middleofmath:intake.json", "middleofmath:result.json", "a".repeat(64)];
  const reviewRequired = projectTrackerFields({ status: "owner-manual-review-required" }, ...common);
  assert.equal(reviewRequired["mathcanvas.status"], "manual-review-required");
  assert.equal(reviewRequired["mathcanvas.route"], "");

  const manual = projectTrackerFields({
    status: "owner-manual-selected",
    selectedProject: { projectId: "manual1", editorUrl: "https://mathcanvas.vivasam.com/ko/view/manual1" },
    manualReview: { reviewedAt: "2026-08-08T00:00:00.000Z" },
  }, ...common);
  assert.equal(manual["mathcanvas.status"], "manual-selected");
  assert.equal(manual["mathcanvas.projectId"], "manual1");

  const generated = projectTrackerFields({
    status: "created",
    completedAt: "2026-08-08T00:10:00.000Z",
    recommendation: { recommendation: { templateId: "number.multiplication.group-array-meaning-v1" } },
    creation: { status: "succeeded", projectId: "new1", editorUrl: "https://mathcanvas.vivasam.com/ko/view/new1" },
  }, ...common);
  assert.equal(generated["mathcanvas.status"], "created");
  assert.equal(generated["mathcanvas.route"], "owner-generated");
  assert.equal(generated["mathcanvas.projectId"], "new1");
});

test("fresh canary 채택 결과는 재생성 없이 원장에 기록할 수 있다", () => {
  const options = parseArgs(["--sequence", "3", "--result-only"]);
  assert.equal(options.resultOnly, true);
  assert.equal(options.confirm, false);
  assert.throws(
    () => parseArgs(["--sequence", "3", "--prepare-only", "--result-only"]),
    /함께 사용할 수 없습니다/
  );
});
