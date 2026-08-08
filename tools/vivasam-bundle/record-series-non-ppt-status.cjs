#!/usr/bin/env node
"use strict";

const childProcess = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const seriesManifest = require("../../artifacts/vivasam/non-ppt-series-manifest.json");
const {
  loadTracker,
  summarizeTracker,
  validateTracker,
  writeDashboard,
} = require("./track-series.cjs");
const { validateClaudeHtmlSlides } = require("./build-series-non-ppt-assets.cjs");

const REPO_ROOT = path.resolve(__dirname, "../..");
const DEFAULT_TRACKER_PATH = path.join(__dirname, "series-tracker.json");
const DEFAULT_EVIDENCE_PATH = path.join(REPO_ROOT, "artifacts", "vivasam", "eduitit-local-publication.json");
const DEFAULT_DASHBOARD_PATH = path.join(REPO_ROOT, "docs", "vivasam-30-series-progress.md");
const DEFAULT_EDUITIT_ROOT = path.resolve(REPO_ROOT, "../eduitit");
const REQUIRED_STATUSES = Object.freeze(["detail", "run", "render", "thumbnail", "worksheet", "ppt"]);

function ensure(condition, message) {
  if (!condition) throw new Error(`Eduitit 공개 검증 오류: ${message}`);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function validateVerification(verification) {
  ensure(verification && typeof verification === "object", "검증 결과가 객체가 아닙니다.");
  ensure(verification.schemaVersion === 1, "지원하지 않는 검증 스키마입니다.");
  ensure(verification.seriesId === seriesManifest.seriesId, "시리즈 ID가 다릅니다.");
  const expectedCount = seriesManifest.records.length;
  ensure(seriesManifest.count === expectedCount, "시리즈 manifest 개수가 레코드 수와 다릅니다.");
  ensure(verification.verified === expectedCount, `검증 완료 수가 현재 PPT 수령분과 다릅니다: ${verification.verified}`);
  ensure(verification.anonymousAccess === "local-passed", "비로그인 로컬 접근이 통과하지 않았습니다.");
  ensure(verification.catalogStatus === 200, `비로그인 카테고리 목록 상태가 200이 아닙니다: ${verification.catalogStatus}`);
  ensure(Array.isArray(verification.records) && verification.records.length === expectedCount, "검증 레코드 수가 현재 PPT 수령분과 다릅니다.");

  const expectedByLessonId = new Map(seriesManifest.records.map((record) => [record.lessonId, record]));
  const lessonIds = new Set();
  const localRecordIds = new Set();
  const digests = new Set();
  for (const record of verification.records) {
    const expected = expectedByLessonId.get(record.lessonId);
    ensure(expected, `계획에 없는 lessonId입니다: ${record.lessonId}`);
    ensure(!lessonIds.has(record.lessonId), `lessonId가 중복되었습니다: ${record.lessonId}`);
    ensure(record.sequence === expected.sequence, `${record.lessonId} 순번이 다릅니다.`);
    ensure(record.digest === expected.digest, `${record.lessonId} 패키지 지문이 시리즈 manifest와 다릅니다.`);
    ensure(/^[0-9a-f]{12}$/.test(record.digest), `${record.lessonId} digest 형식이 잘못되었습니다.`);
    ensure(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(record.localRecordId), `${record.lessonId} 로컬 레코드 ID가 잘못되었습니다.`);
    ensure(!localRecordIds.has(record.localRecordId), `로컬 레코드 ID가 중복되었습니다: ${record.localRecordId}`);
    ensure(!digests.has(record.digest), `digest가 중복되었습니다: ${record.digest}`);
    ensure(record.etag304 === true, `${record.lessonId} ETag 304 재검증이 실패했습니다.`);
    for (const statusName of REQUIRED_STATUSES) {
      ensure(record.statuses?.[statusName] === 200, `${record.lessonId} ${statusName} 상태가 200이 아닙니다.`);
    }
    lessonIds.add(record.lessonId);
    localRecordIds.add(record.localRecordId);
    digests.add(record.digest);
  }
  ensure(lessonIds.size === expectedCount, "검증된 고유 lessonId 수가 현재 PPT 수령분과 다릅니다.");
  return verification;
}

function countPptSlides(pptxPath) {
  const listing = childProcess.execFileSync("unzip", ["-Z1", pptxPath], { encoding: "utf8" });
  return listing.split(/\r?\n/).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name)).length;
}

function presentationSource(lessonId) {
  const claudeRoot = path.join(REPO_ROOT, "artifacts", "vivasam", lessonId, "claude");
  const htmlPath = path.join(claudeRoot, `${lessonId}-slides.html`);
  if (fs.existsSync(htmlPath)) {
    const { slideCount } = validateClaudeHtmlSlides(htmlPath);
    return { format: "html", absolutePath: htmlPath, trackedPath: `${lessonId}-slides.html`, slideCount };
  }
  const pptxPath = path.join(claudeRoot, `${lessonId}.pptx`);
  ensure(fs.existsSync(pptxPath), `${lessonId} Claude HTML/PPTX가 없습니다.`);
  return { format: "pptx", absolutePath: pptxPath, trackedPath: `${lessonId}.pptx`, slideCount: countPptSlides(pptxPath) };
}

function applyVerificationToTracker(sourceTracker, verification, now = new Date().toISOString()) {
  validateVerification(verification);
  ensure(Number.isFinite(Date.parse(now)), "기록 시각이 ISO 시각이 아닙니다.");
  const tracker = clone(sourceTracker);
  const byLessonId = new Map(verification.records.map((record) => [record.lessonId, record]));

  for (const bundle of tracker.bundles) {
    const lessonId = bundle.lessonId;
    const record = byLessonId.get(lessonId);
    const artifactRoot = `middleofmath:artifacts/vivasam/${lessonId}`;
    if (!record) {
      bundle.worksheet = {
        ...bundle.worksheet,
        status: "not-started",
        sourcePath: "",
        pngPath: "",
        pdfPath: "",
        validatedAt: "",
      };
      // 발표 화면을 이미 받은 슬롯은 통합 활동지가 없어서 이번 공개 대상에
      // 들지 못했더라도 수령 증거를 보존한다. 공개 검증은 게시 상태만
      // 되돌려야 하며 HTML/PPTX 수령 자체를 없던 일로 만들면 안 된다.
      bundle.support = {
        ...bundle.support,
        intentStatus: "not-started",
        intentPath: "",
        answerKeyStatus: "not-started",
        answerKeyPath: "",
        representativeImageStatus: "not-started",
        representativeImagePath: "",
      };
      bundle.eduitit = {
        ...bundle.eduitit,
        packageStatus: "not-started",
        packagePath: "",
        digest: "",
        localRecordStatus: "unpublished",
        localRecordId: "",
        anonymousAccessStatus: "not-tested",
        productionStatus: "not-deployed",
        publicUrl: "",
        validatedAt: "",
      };
      continue;
    }
    const presentation = presentationSource(lessonId);
    const productionStillMatches = (
      bundle.eduitit.productionStatus === "deployed"
      && bundle.eduitit.anonymousAccessStatus === "production-passed"
      && bundle.eduitit.digest === record.digest
      && /^https:\/\//.test(bundle.eduitit.publicUrl || "")
    );
    bundle.worksheet = {
      ...bundle.worksheet,
      status: "validated",
      filename: `${lessonId}-worksheet.png`,
      sourcePath: `${artifactRoot}/worksheet/${lessonId}-worksheet.prompt.txt`,
      pngPath: `${artifactRoot}/worksheet/${lessonId}-worksheet.png`,
      pdfPath: `${artifactRoot}/worksheet/${lessonId}-worksheet.pdf`,
      validatedAt: now,
    };
    bundle.support = {
      ...bundle.support,
      intentStatus: "validated",
      intentPath: `${artifactRoot}/support/teaching-intent.md`,
      answerKeyStatus: "validated",
      answerKeyPath: `${artifactRoot}/support/teacher-answer-key.md`,
      representativeImageStatus: "validated",
      representativeImagePath: `${artifactRoot}/support/representative-image.png`,
    };
    bundle.ppt = {
      ...bundle.ppt,
      status: "received",
      format: presentation.format,
      pptxPath: presentation.format === "pptx" ? `${artifactRoot}/claude/${presentation.trackedPath}` : "",
      htmlPath: presentation.format === "html" ? `${artifactRoot}/claude/${presentation.trackedPath}` : "",
      slideCount: presentation.slideCount,
      intakeReportPath: "",
      renderedPdfPath: "",
      slidesDirectory: "",
      validatedAt: "",
    };
    bundle.eduitit = {
      ...bundle.eduitit,
      packageStatus: "validated",
      packagePath: `eduitit:edu_materials/static/edu_materials/lesson_bundles/${lessonId}`,
      digest: record.digest,
      localRecordStatus: "published",
      localRecordId: productionStillMatches ? bundle.eduitit.localRecordId : record.localRecordId,
      anonymousAccessStatus: productionStillMatches ? "production-passed" : "local-passed",
      productionStatus: productionStillMatches ? "deployed" : "not-deployed",
      publicUrl: productionStillMatches ? bundle.eduitit.publicUrl : "",
      validatedAt: productionStillMatches ? bundle.eduitit.validatedAt : now,
    };
    bundle.notes = (bundle.notes || []).filter((note) => !/(이전 Codex 제작|stale|다시 빌드|현재 source\.html 지문)/.test(note));
  }

  tracker.updatedAt = now;
  tracker.history.push({
    at: now,
    sequence: null,
    event: "발표 화면 수령분 산출물·Eduitit 로컬 공개 검증 완료",
    detail: `통합 활동지까지 준비된 Claude HTML/PPTX ${verification.records.length}개를 Eduitit 공개 패키지로 만들고 비로그인 접근을 검증했다. 발표 화면만 도착한 슬롯은 수령 상태를 보존하고 게시를 대기한다.`,
  });
  return tracker;
}

function parseVerifierOutput(output) {
  const lines = String(output || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines.reverse()) {
    if (!line.startsWith("{")) continue;
    try {
      return JSON.parse(line);
    } catch {
      // Django 로그가 섞일 수 있으므로 마지막 유효 JSON 행까지 계속 찾는다.
    }
  }
  throw new Error("Eduitit 공개 검증 오류: 검증 명령 출력에서 JSON 결과를 찾지 못했습니다.");
}

function runVerifier(eduititRoot = DEFAULT_EDUITIT_ROOT) {
  const pythonPath = path.join(eduititRoot, ".venv", "bin", "python");
  ensure(fs.existsSync(pythonPath), `Eduitit Python 실행 파일이 없습니다: ${pythonPath}`);
  const result = childProcess.spawnSync(
    pythonPath,
    ["manage.py", "verify_middleofmath_series_public", "--json"],
    { cwd: eduititRoot, encoding: "utf8", env: process.env, maxBuffer: 10 * 1024 * 1024 },
  );
  if (result.status !== 0) {
    throw new Error(`Eduitit 공개 검증 오류: 검증 명령이 실패했습니다.\n${result.stderr || result.stdout}`);
  }
  return validateVerification(parseVerifierOutput(result.stdout));
}

function writeAtomic(filePath, contents) {
  const resolved = path.resolve(filePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  const temporaryPath = `${resolved}.tmp-${process.pid}`;
  fs.writeFileSync(temporaryPath, contents, "utf8");
  fs.renameSync(temporaryPath, resolved);
}

function parseArgs(argv) {
  const options = {
    trackerPath: DEFAULT_TRACKER_PATH,
    dashboardPath: DEFAULT_DASHBOARD_PATH,
    evidencePath: DEFAULT_EVIDENCE_PATH,
    eduititRoot: DEFAULT_EDUITIT_ROOT,
    verificationJsonPath: "",
  };
  while (argv.length) {
    const token = argv.shift();
    if (token === "--tracker") options.trackerPath = path.resolve(argv.shift() || "");
    else if (token === "--dashboard") options.dashboardPath = path.resolve(argv.shift() || "");
    else if (token === "--evidence") options.evidencePath = path.resolve(argv.shift() || "");
    else if (token === "--eduitit-root") options.eduititRoot = path.resolve(argv.shift() || "");
    else if (token === "--verification-json") options.verificationJsonPath = path.resolve(argv.shift() || "");
    else throw new Error(`알 수 없는 옵션입니다: ${token}`);
  }
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const verification = options.verificationJsonPath
    ? validateVerification(JSON.parse(fs.readFileSync(options.verificationJsonPath, "utf8")))
    : runVerifier(options.eduititRoot);
  const now = new Date().toISOString();
  const loaded = loadTracker(options.trackerPath);
  const tracker = applyVerificationToTracker(loaded.tracker, verification, now);
  const validated = validateTracker(tracker, {
    trackerPath: loaded.trackerPath,
    roots: { eduitit: options.eduititRoot },
  });
  const evidence = {
    ...verification,
    recordedAt: now,
    scope: "local-django-publication",
    productionStatus: "not-deployed",
  };

  writeAtomic(options.evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  writeAtomic(loaded.trackerPath, `${JSON.stringify(tracker, null, 2)}\n`);
  writeDashboard(validated, options.dashboardPath);

  const summary = summarizeTracker(validated);
  process.stdout.write(`${JSON.stringify({
    recordedAt: now,
    evidencePath: options.evidencePath,
    dashboardPath: options.dashboardPath,
    ...summary,
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
  DEFAULT_EVIDENCE_PATH,
  applyVerificationToTracker,
  parseVerifierOutput,
  runVerifier,
  validateVerification,
};
