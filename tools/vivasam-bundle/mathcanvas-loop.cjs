#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  DEFAULT_DASHBOARD_PATH,
  DEFAULT_TRACKER_PATH,
  loadTracker,
  materializeBundle,
  repositoryRoots,
  resolveTrackedPath,
  toTrackedPath,
  updateTracker,
  validateTracker,
} = require("./track-series.cjs");

const REQUIRED_VISUAL_QA = [
  "logoTitleSeparated",
  "allQuestionTextLegible",
  "choicesVisuallySeparated",
  "answerSpacesPresent",
  "noOverlapsOrClipping",
];

function ensure(condition, message) {
  if (!condition) throw new Error(`MathCanvas 연결 루프 오류: ${message}`);
}

function parseArgs(argv) {
  const options = {
    sequence: null,
    trackerPath: DEFAULT_TRACKER_PATH,
    dashboardPath: DEFAULT_DASHBOARD_PATH,
    mathcanvasRoot: path.resolve(__dirname, "../../../mathcanvas-ai/mathcanvas-ai-authoring"),
    prepareOnly: false,
    resultOnly: false,
    confirm: false,
    replace: false,
    json: false,
  };
  while (argv.length) {
    const token = argv.shift();
    if (token === "--sequence") options.sequence = Number(argv.shift());
    else if (token === "--tracker") options.trackerPath = path.resolve(argv.shift() || "");
    else if (token === "--dashboard") options.dashboardPath = path.resolve(argv.shift() || "");
    else if (token === "--mathcanvas-root") options.mathcanvasRoot = path.resolve(argv.shift() || "");
    else if (token === "--prepare-only") options.prepareOnly = true;
    else if (token === "--result-only") options.resultOnly = true;
    else if (token === "--confirm") options.confirm = true;
    else if (token === "--replace") options.replace = true;
    else if (token === "--json") options.json = true;
    else throw new Error(`알 수 없는 옵션입니다: ${token}`);
  }
  ensure(Number.isInteger(options.sequence) && options.sequence >= 1 && options.sequence <= 30, "--sequence는 1~30 정수여야 합니다.");
  ensure(!(options.prepareOnly && options.resultOnly), "--prepare-only와 --result-only는 함께 사용할 수 없습니다.");
  return options;
}

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`${label}을 읽지 못했습니다: ${error.message}`);
  }
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temporaryPath, filePath);
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function readPngDimensions(filePath) {
  const header = fs.readFileSync(filePath).subarray(0, 24);
  ensure(header.length >= 24, `PNG 헤더가 너무 짧습니다: ${filePath}`);
  ensure(header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `PNG 서명이 잘못되었습니다: ${filePath}`);
  ensure(header.subarray(12, 16).toString("ascii") === "IHDR", `PNG IHDR을 찾지 못했습니다: ${filePath}`);
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}

function uniqueText(values, limit) {
  return [...new Set(values
    .filter((value) => typeof value === "string")
    .map((value) => value.replace(/\s+/g, " ").trim())
    .filter(Boolean))]
    .slice(0, limit)
    .map((value) => value.slice(0, 500));
}

function assertWorksheetContract(bundle, roots) {
  ensure(bundle.content.status === "validated", `${bundle.sequence}번 내용이 검증되지 않았습니다.`);
  ensure(bundle.worksheet.status === "validated", `${bundle.sequence}번 통합 활동지 1개가 검증되지 않았습니다.`);
  const pngPath = resolveTrackedPath(bundle.worksheet.pngPath, roots);
  const worksheetDirectory = path.dirname(pngPath);
  const pngFiles = fs.readdirSync(worksheetDirectory).filter((name) => name.toLowerCase().endsWith(".png"));
  ensure(pngFiles.length === 1, `${bundle.sequence}번 활동지 폴더에는 PNG가 정확히 1개여야 합니다. 현재 ${pngFiles.length}개입니다.`);
  ensure(pngFiles[0] === bundle.worksheet.filename, `${bundle.sequence}번 유일한 PNG가 원장 파일명과 다릅니다.`);
  const metadataPath = pngPath.replace(/\.png$/i, ".imagegen.json");
  ensure(fs.existsSync(metadataPath), `${bundle.sequence}번 활동지 이미지 생성 메타데이터가 없습니다.`);
  const metadata = readJson(metadataPath, "활동지 이미지 생성 메타데이터");
  ensure(metadata.generationMode === "built-in-imagegen", `${bundle.sequence}번 활동지는 내장 이미지 생성 결과여야 합니다.`);
  ensure(metadata.imageFile === bundle.worksheet.filename, `${bundle.sequence}번 이미지 메타데이터 파일명이 다릅니다.`);
  const sha256 = sha256File(pngPath);
  ensure(metadata.imageSha256 === sha256, `${bundle.sequence}번 활동지 PNG 해시가 메타데이터와 다릅니다.`);
  const dimensions = readPngDimensions(pngPath);
  ensure(metadata.width === dimensions.width && metadata.height === dimensions.height, `${bundle.sequence}번 활동지 PNG 크기가 메타데이터와 다릅니다.`);
  for (const key of REQUIRED_VISUAL_QA) {
    ensure(metadata.visualQa?.[key] === true, `${bundle.sequence}번 활동지 시각 검수 ${key}가 통과하지 않았습니다.`);
  }
  ensure(Number.isFinite(Date.parse(metadata.visualQa.reviewedAt)), `${bundle.sequence}번 활동지 화면 검수 시각이 없습니다.`);
  return { pngPath, metadataPath, metadata, sha256, ...dimensions };
}

function buildWorksheetIntake(bundle, lesson, worksheetEvidence) {
  ensure(lesson.id === bundle.lessonId, "수업 스키마와 추적 원장의 lessonId가 다릅니다.");
  const answerLabels = uniqueText([
    ...(lesson.mathOracle?.sourceJudgments || []).map((item) => item.label),
    lesson.mathOracle?.extensionAnswer,
    ...(lesson.answerKey?.sourceJudgments || []).map((item) => item.label),
    lesson.answerKey?.guidedPractice?.label,
    lesson.answerKey?.extension,
    ...(lesson.answerKey?.exitTicket || []),
    ...(worksheetEvidence.metadata.visualQa?.mathVisualCounts?.problem1ChoiceLabels || []),
  ], 20);
  const misconceptions = uniqueText((lesson.answerKey?.errorAnalysis || []).flatMap((item) => [item.derivation, item.rationale]), 12);
  const slideEvidence = (lesson.slides || []).flatMap((slide) => slide.visibleContent || []).filter((value) => /묶음|줄|칸|곱|×|배열/.test(value));
  const mathVisualCounts = worksheetEvidence.metadata.visualQa?.mathVisualCounts;
  const visualSummary = uniqueText([
    mathVisualCounts ? `활동지 수학 시각 정보: ${JSON.stringify(mathVisualCounts)}` : "",
    ...slideEvidence,
  ], 20);
  ensure(answerLabels.length > 0, "활동지와 연결할 정답 근거를 찾지 못했습니다.");
  ensure(visualSummary.length > 0, "활동지와 연결할 시각·수학 근거를 찾지 못했습니다.");
  const inspectedAt = new Date(worksheetEvidence.metadata.visualQa.reviewedAt).toISOString();
  return {
    schemaVersion: 1,
    intakeId: `${lesson.id}-${worksheetEvidence.sha256.slice(0, 12)}`,
    generatedAt: inspectedAt,
    sourcePolicy: {
      reusableProjectSource: "owner-manual-curated",
      generatedProjectSource: "owner-mathcanvas-ai",
      prototypeProjectReuse: false,
      externalProjectReuse: false,
    },
    lesson: {
      lessonId: lesson.id,
      title: lesson.title,
      gradeLabel: lesson.grade,
      unit: lesson.unit,
      targetBehavior: lesson.targetBehavior,
      worksheetTitle: lesson.worksheet?.title || bundle.worksheet.filename,
      curriculumAnchorIds: lesson.curriculumAnchorIds || [],
    },
    worksheet: {
      filename: bundle.worksheet.filename,
      sha256: worksheetEvidence.sha256,
      width: worksheetEvidence.width,
      height: worksheetEvidence.height,
      inspectedAt,
      visualQa: Object.fromEntries(REQUIRED_VISUAL_QA.map((key) => [key, true])),
    },
    mathEvidence: { answerLabels, misconceptions, visualSummary },
    recommendation: { problemCount: 2, difficulty: "normal" },
  };
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} 실패\n${result.stdout || ""}${result.stderr || ""}`.trim());
  }
  return result.stdout;
}

function runMathCanvas(options, intakePath, resultPath) {
  ensure(fs.existsSync(path.join(options.mathcanvasRoot, "package.json")), `MathCanvas 저장소가 없습니다: ${options.mathcanvasRoot}`);
  run("pnpm", ["--filter", "@mathcanvas/mcp-server...", "build"], options.mathcanvasRoot);
  const args = [
    path.join(options.mathcanvasRoot, "scripts/run-lesson-bundle-activity.mjs"),
    "--input", intakePath,
    "--output", resultPath,
    ...(options.confirm ? ["--confirm"] : []),
    ...(options.replace ? ["--replace"] : []),
  ];
  return run(process.execPath, args, options.mathcanvasRoot);
}

function projectTrackerFields(result, intakeTrackedPath, resultTrackedPath, worksheetSha256) {
  const common = {
    "mathcanvas.intakePath": intakeTrackedPath,
    "mathcanvas.resultPath": resultTrackedPath,
    "mathcanvas.worksheetSha256": worksheetSha256,
    "mathcanvas.manualProjectId": "",
    "mathcanvas.templateId": "",
    "mathcanvas.projectId": "",
    "mathcanvas.editorUrl": "",
    "mathcanvas.publicStudentUrl": "",
    "mathcanvas.validatedAt": "",
  };
  const mapping = {
    "owner-manual-review-required": { status: "manual-review-required", route: "" },
    "owner-manual-selected": { status: "manual-selected", route: "owner-manual" },
    "owner-template-required": { status: "template-required", route: "owner-generated" },
    "owner-template-review-required": { status: "template-review-required", route: "owner-generated" },
    "ready-to-create": { status: "ready-to-create", route: "owner-generated" },
    created: { status: "created", route: "owner-generated" },
  };
  const projected = mapping[result.status];
  ensure(projected, `지원하지 않는 MathCanvas 결과 상태입니다: ${result.status}`);
  common["mathcanvas.status"] = projected.status;
  common["mathcanvas.route"] = projected.route;
  if (result.status === "owner-manual-selected") {
    common["mathcanvas.manualProjectId"] = result.selectedProject.projectId;
    common["mathcanvas.projectId"] = result.selectedProject.projectId;
    common["mathcanvas.editorUrl"] = result.selectedProject.editorUrl;
    common["mathcanvas.validatedAt"] = result.manualReview.reviewedAt;
  }
  const templateId = result.canaryApproval?.blueprintId
    || result.templateApproval?.templateId
    || result.templateReviewRequest?.templateId
    || result.recommendation?.recommendation?.templateId
    || result.recommendation?.templateId;
  if (templateId) common["mathcanvas.templateId"] = templateId;
  if (result.status === "created") {
    ensure(result.creation?.status === "succeeded", "MathCanvas 생성 결과가 성공이 아닙니다.");
    common["mathcanvas.projectId"] = result.creation.projectId;
    common["mathcanvas.editorUrl"] = result.creation.editorUrl;
    common["mathcanvas.validatedAt"] = result.completedAt;
  }
  return common;
}

function prepare(options) {
  const loaded = loadTracker(options.trackerPath);
  const validated = validateTracker(loaded.tracker, { trackerPath: loaded.trackerPath });
  const bundle = validated.bundles[options.sequence - 1];
  ensure(bundle.sequence === options.sequence, "추적 슬롯을 찾지 못했습니다.");
  ensure(bundle.lessonId, `${options.sequence}번 차시가 비어 있습니다.`);
  const worksheetEvidence = assertWorksheetContract(bundle, validated.roots);
  const lessonPath = resolveTrackedPath(bundle.content.schemaPath, validated.roots);
  ensure(path.extname(lessonPath) === ".json", "MathCanvas 연결은 JSON 수업 스키마를 사용해야 합니다.");
  const lesson = readJson(lessonPath, "수업 스키마");
  const activityDirectory = path.join(path.dirname(lessonPath), "mathcanvas");
  const intakePath = path.join(activityDirectory, "worksheet-intake.json");
  const resultPath = path.join(activityDirectory, "activity-result.json");
  const intake = buildWorksheetIntake(bundle, lesson, worksheetEvidence);
  writeJsonAtomic(intakePath, intake);
  return {
    loaded,
    validated,
    bundle,
    intake,
    intakePath,
    resultPath,
    intakeTrackedPath: toTrackedPath(intakePath, validated.roots),
    resultTrackedPath: toTrackedPath(resultPath, validated.roots),
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const prepared = prepare(options);
  if (options.prepareOnly) {
    const sets = {
      "mathcanvas.status": "intake-ready",
      "mathcanvas.route": "",
      "mathcanvas.intakePath": prepared.intakeTrackedPath,
      "mathcanvas.resultPath": "",
      "mathcanvas.worksheetSha256": prepared.intake.worksheet.sha256,
    };
    updateTracker({
      trackerPath: options.trackerPath,
      dashboardPath: options.dashboardPath,
      sequence: options.sequence,
      sets: Object.entries(sets),
      note: "활동지 1장을 MathCanvas 선별·생성 입력으로 고정했습니다.",
      event: "MathCanvas 활동지 intake 생성",
      detail: "PPT당 활동지 1개 원칙을 유지하고 로그인한 내 캔버스 수동 제작본 선별 단계로 넘겼습니다.",
      allowDowngrade: options.replace,
    });
    process.stdout.write(`${JSON.stringify({ status: "intake-ready", intakePath: prepared.intakePath }, null, 2)}\n`);
    return;
  }
  if (!options.resultOnly) runMathCanvas(options, prepared.intakePath, prepared.resultPath);
  else ensure(fs.existsSync(prepared.resultPath), `기록할 MathCanvas 결과가 없습니다: ${prepared.resultPath}`);
  const result = readJson(prepared.resultPath, "MathCanvas 처리 결과");
  const fields = projectTrackerFields(result, prepared.intakeTrackedPath, prepared.resultTrackedPath, prepared.intake.worksheet.sha256);
  updateTracker({
    trackerPath: options.trackerPath,
    dashboardPath: options.dashboardPath,
    sequence: options.sequence,
    sets: Object.entries(fields),
    note: result.status === "owner-manual-selected"
      ? "로그인한 내 캔버스에서 직접 만든 수동 자료를 화면 검수해 선택했습니다."
      : "수동 제작본 검수 결과를 반영했으며 다른 사람 자료와 기존 AI 프로토타입은 재사용하지 않습니다.",
    event: "MathCanvas 선별·생성 상태 갱신",
    detail: `${result.status}: 활동지 해시 ${prepared.intake.worksheet.sha256.slice(0, 12)}`,
    allowDowngrade: options.replace,
  });
  const output = { result, trackerFields: fields, intakePath: prepared.intakePath, resultPath: prepared.resultPath };
  process.stdout.write(options.json ? `${JSON.stringify(output, null, 2)}\n` : `${options.sequence}번 MathCanvas 상태: ${fields["mathcanvas.status"]}\n`);
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
  REQUIRED_VISUAL_QA,
  assertWorksheetContract,
  buildWorksheetIntake,
  parseArgs,
  prepare,
  projectTrackerFields,
  readPngDimensions,
};
