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
  eduititStaleFields,
  loadLessonSchema,
  parseArgs,
  projectTrackerFields,
  shouldSyncMathCanvasPackage,
  syncMathCanvasPackage,
  validateMathCanvasPackageLink,
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
  assert.equal(options.syncEduitit, true);
  assert.throws(
    () => parseArgs(["--sequence", "3", "--prepare-only", "--result-only"]),
    /함께 사용할 수 없습니다/
  );
});

test("수업 스키마는 JSON과 기존 CJS 차시를 모두 MathCanvas 입력으로 읽는다", () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mathcanvas-lesson-schema-"));
  try {
    const jsonPath = path.join(temporaryRoot, "lesson.json");
    const cjsPath = path.join(temporaryRoot, "lesson.cjs");
    fs.writeFileSync(jsonPath, JSON.stringify({ id: "json-lesson", slides: [{}] }), "utf8");
    fs.writeFileSync(cjsPath, 'module.exports = { id: "cjs-lesson", slides: [{}] };\n', "utf8");

    assert.equal(loadLessonSchema(jsonPath).id, "json-lesson");
    assert.equal(loadLessonSchema(cjsPath).id, "cjs-lesson");
    assert.throws(() => loadLessonSchema(path.join(temporaryRoot, "lesson.txt")), /JSON 또는 CJS/);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

function writeMathCanvasPackage(repositoryRoot, lessonId, editorUrl, { eduitit = false } = {}) {
  const packageRoot = eduitit
    ? path.join(repositoryRoot, "edu_materials", "static", "edu_materials", "lesson_bundles", lessonId)
    : path.join(repositoryRoot, "artifacts", "vivasam", lessonId, "web-package");
  fs.mkdirSync(packageRoot, { recursive: true });
  fs.writeFileSync(
    path.join(packageRoot, "manifest.json"),
    `${JSON.stringify({ lessonId, digest: "123456789abc", mathCanvasEditorUrl: editorUrl }, null, 2)}\n`,
    "utf8",
  );
  const section = editorUrl
    ? `<section data-section="mathcanvas"><a href="${editorUrl}" target="_blank" rel="noopener noreferrer">MathCanvas에서 열기</a></section>`
    : "";
  fs.writeFileSync(
    path.join(packageRoot, "source.html"),
    `<!doctype html><section data-section="ppt"></section><section data-section="worksheet"></section><section data-section="guide"></section>${section}`,
    "utf8",
  );
}

test("MathCanvas 완료 상태는 패키지 생성·Eduitit 동기화·정확한 링크 검증까지 잇는다", () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mathcanvas-package-sync-"));
  try {
    const middleofmathRoot = path.join(temporaryRoot, "middleofmath");
    const eduititRoot = path.join(temporaryRoot, "eduitit");
    const lessonId = "g3s1-loop-test";
    const editorUrl = "https://mathcanvas.vivasam.com/ko/view/loop1";
    writeMathCanvasPackage(middleofmathRoot, lessonId, editorUrl);
    writeMathCanvasPackage(eduititRoot, lessonId, editorUrl, { eduitit: true });
    const prepared = {
      bundle: {
        lessonId,
        ppt: { status: "received" },
        mathcanvas: { editorUrl: "" },
        eduitit: { localRecordId: "00000000-0000-4000-8000-000000000003" },
      },
      validated: { roots: { middleofmath: middleofmathRoot, eduitit: eduititRoot } },
    };
    const options = {
      trackerPath: path.join(middleofmathRoot, "tools", "vivasam-bundle", "series-tracker.json"),
      eduititRoot,
      syncEduitit: true,
    };
    const fields = {
      "mathcanvas.status": "created",
      "mathcanvas.editorUrl": editorUrl,
    };
    const calls = [];

    assert.equal(shouldSyncMathCanvasPackage(prepared.bundle, fields), true);
    const synced = syncMathCanvasPackage(options, prepared, fields, (...args) => {
      calls.push(args);
      return "생성 완료";
    });

    assert.equal(calls.length, 1);
    assert.ok(calls[0][1].includes("--available-only"));
    assert.ok(calls[0][1].includes("--tracker"));
    assert.equal(synced.status, "synced");
    assert.equal(synced.editorUrl, editorUrl);
    assert.equal(validateMathCanvasPackageLink(prepared, editorUrl).digest, "123456789abc");
    assert.deepEqual(eduititStaleFields(synced, prepared.bundle), {
      "eduitit.packageStatus": "validated",
      "eduitit.packagePath": `eduitit:edu_materials/static/edu_materials/lesson_bundles/${lessonId}`,
      "eduitit.digest": "123456789abc",
      "eduitit.localRecordStatus": "stale",
      "eduitit.anonymousAccessStatus": "not-tested",
      "eduitit.productionStatus": "not-deployed",
      "eduitit.publicUrl": "",
      "eduitit.validatedAt": synced.validatedAt,
    });
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

test("PPT가 아직 없거나 MathCanvas 링크가 생기지 않은 단계는 패키지 동기화를 미룬다", () => {
  const fields = { "mathcanvas.status": "manual-review-required", "mathcanvas.editorUrl": "" };
  assert.equal(
    shouldSyncMathCanvasPackage({ ppt: { status: "received" }, mathcanvas: { editorUrl: "" } }, fields),
    false,
  );
  assert.equal(
    shouldSyncMathCanvasPackage({ ppt: { status: "awaiting-claude" }, mathcanvas: { editorUrl: "old" } }, {
      "mathcanvas.status": "created",
      "mathcanvas.editorUrl": "https://mathcanvas.vivasam.com/ko/view/new1",
    }),
    false,
  );
});
