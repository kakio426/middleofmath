#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_TRACKER_PATH = path.join(__dirname, "series-tracker.json");
const DEFAULT_DASHBOARD_PATH = path.resolve(__dirname, "../../docs/vivasam-30-series-progress.md");

const STATUS_VALUES = Object.freeze({
  "content.status": ["not-started", "drafting", "validated"],
  "worksheet.status": ["not-started", "drafting", "validated"],
  "ppt.status": ["not-started", "awaiting-claude", "received", "validated"],
  "support.intentStatus": ["not-started", "drafting", "validated"],
  "support.answerKeyStatus": ["not-started", "drafting", "validated"],
  "support.representativeImageStatus": ["not-started", "drafting", "validated"],
  "eduitit.packageStatus": ["not-started", "built", "needs-rebuild", "validated"],
  "eduitit.localRecordStatus": ["not-started", "unpublished", "published", "stale"],
  "eduitit.anonymousAccessStatus": ["not-tested", "code-tests-passed", "local-passed", "production-passed"],
  "eduitit.productionStatus": ["not-deployed", "deployed"],
  "submission.communityPostStatus": ["not-posted", "posted"],
  "submission.raceRecordStatus": ["not-registered", "registered"],
});

const STATUS_RANK = Object.freeze({
  "content.status": { "not-started": 0, drafting: 1, validated: 2 },
  "worksheet.status": { "not-started": 0, drafting: 1, validated: 2 },
  "ppt.status": { "not-started": 0, "awaiting-claude": 1, received: 2, validated: 3 },
  "support.intentStatus": { "not-started": 0, drafting: 1, validated: 2 },
  "support.answerKeyStatus": { "not-started": 0, drafting: 1, validated: 2 },
  "support.representativeImageStatus": { "not-started": 0, drafting: 1, validated: 2 },
  "eduitit.packageStatus": { "not-started": 0, built: 1, "needs-rebuild": 1, validated: 2 },
  "eduitit.localRecordStatus": { "not-started": 0, unpublished: 0, published: 1, stale: 1 },
  "eduitit.anonymousAccessStatus": { "not-tested": 0, "code-tests-passed": 1, "local-passed": 2, "production-passed": 3 },
  "eduitit.productionStatus": { "not-deployed": 0, deployed: 1 },
  "submission.communityPostStatus": { "not-posted": 0, posted: 1 },
  "submission.raceRecordStatus": { "not-registered": 0, registered: 1 },
});

const UPDATABLE_PATHS = new Set([
  "lessonId",
  "title",
  "subject",
  "grade",
  "unit",
  "durationMinutes",
  "declaredSlideCount",
  "content.status",
  "content.schemaPath",
  "content.handoffMarkdownPath",
  "content.handoffJsonPath",
  "content.validatedAt",
  "worksheet.status",
  "worksheet.filename",
  "worksheet.sourcePath",
  "worksheet.pngPath",
  "worksheet.pdfPath",
  "worksheet.validatedAt",
  "ppt.status",
  "ppt.format",
  "ppt.pptxPath",
  "ppt.htmlPath",
  "ppt.slideCount",
  "ppt.intakeReportPath",
  "ppt.renderedPdfPath",
  "ppt.slidesDirectory",
  "ppt.validatedAt",
  "ppt.legacyPptxPath",
  "support.intentStatus",
  "support.intentPath",
  "support.answerKeyStatus",
  "support.answerKeyPath",
  "support.representativeImageStatus",
  "support.representativeImagePath",
  "eduitit.packageStatus",
  "eduitit.packagePath",
  "eduitit.digest",
  "eduitit.localRecordStatus",
  "eduitit.localRecordId",
  "eduitit.anonymousAccessStatus",
  "eduitit.productionStatus",
  "eduitit.publicUrl",
  "eduitit.validatedAt",
  "submission.communityPostStatus",
  "submission.communityPostUrl",
  "submission.closedCommunityEvidenceImagePath",
  "submission.raceRecordStatus",
  "submission.recordedAt",
]);

function ensure(condition, message) {
  if (!condition) throw new Error(`30개 시리즈 추적 오류: ${message}`);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(base, override) {
  if (!isPlainObject(base) || !isPlainObject(override)) return clone(override);
  const result = clone(base);
  for (const [key, value] of Object.entries(override)) {
    result[key] = isPlainObject(value) && isPlainObject(result[key])
      ? deepMerge(result[key], value)
      : clone(value);
  }
  return result;
}

function materializeBundle(tracker, rawBundle) {
  const merged = deepMerge(tracker.bundleDefaults, rawBundle);
  merged.sequence = rawBundle.sequence;
  return merged;
}

function loadTracker(trackerPath = DEFAULT_TRACKER_PATH) {
  const resolved = path.resolve(trackerPath);
  ensure(fs.existsSync(resolved), `추적 원장이 없습니다: ${resolved}`);
  try {
    return { tracker: JSON.parse(fs.readFileSync(resolved, "utf8")), trackerPath: resolved };
  } catch (error) {
    throw new Error(`추적 원장을 읽지 못했습니다: ${error.message}`);
  }
}

function repositoryRoots(tracker, trackerPath = DEFAULT_TRACKER_PATH, overrides = {}) {
  const inferredMiddleofmathRoot = path.resolve(path.dirname(trackerPath), "../..");
  const middleofmath = path.resolve(
    overrides.middleofmath || inferredMiddleofmathRoot,
    overrides.middleofmath ? "" : tracker.repositories?.middleofmath || ".",
  );
  const eduitit = path.resolve(
    overrides.eduitit || process.env.EDUITIT_ROOT || middleofmath,
    overrides.eduitit || process.env.EDUITIT_ROOT ? "" : tracker.repositories?.eduitit || "../eduitit",
  );
  return { middleofmath, eduitit };
}

function resolveTrackedPath(value, roots) {
  const match = /^(middleofmath|eduitit):(.+)$/.exec(String(value || ""));
  ensure(match, `저장 경로는 middleofmath: 또는 eduitit: 접두어를 사용해야 합니다: ${value}`);
  const repository = match[1];
  const relativePath = match[2];
  ensure(!path.isAbsolute(relativePath), `절대 경로는 저장할 수 없습니다: ${value}`);
  ensure(!relativePath.includes("\\"), `역슬래시 경로는 저장할 수 없습니다: ${value}`);
  const resolved = path.resolve(roots[repository], relativePath);
  const relativeToRoot = path.relative(roots[repository], resolved);
  ensure(relativeToRoot && !relativeToRoot.startsWith("..") && !path.isAbsolute(relativeToRoot), `저장소 밖으로 나가는 경로입니다: ${value}`);
  return resolved;
}

function toTrackedPath(filePath, roots) {
  const resolved = path.resolve(filePath);
  for (const repository of ["middleofmath", "eduitit"]) {
    const relative = path.relative(roots[repository], resolved);
    if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
      return `${repository}:${relative.split(path.sep).join("/")}`;
    }
  }
  throw new Error(`두 작업 저장소 밖의 파일은 기록할 수 없습니다: ${resolved}`);
}

function isTimestamp(value) {
  return typeof value === "string" && /T/.test(value) && Number.isFinite(Date.parse(value));
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getNested(object, dottedPath) {
  return dottedPath.split(".").reduce((current, key) => current?.[key], object);
}

function setNested(object, dottedPath, value) {
  const keys = dottedPath.split(".");
  let current = object;
  for (const key of keys.slice(0, -1)) {
    if (!isPlainObject(current[key])) current[key] = {};
    current = current[key];
  }
  current[keys.at(-1)] = value;
}

function validateStatus(bundle, fieldPath) {
  const value = getNested(bundle, fieldPath);
  ensure(STATUS_VALUES[fieldPath].includes(value), `${bundle.sequence}번 ${fieldPath} 상태가 잘못되었습니다: ${value}`);
}

function requireTrackedArtifact(value, roots, label, expectedType = "file") {
  ensure(value, `${label} 경로가 비었습니다.`);
  const resolved = resolveTrackedPath(value, roots);
  ensure(fs.existsSync(resolved), `${label} 파일이 없습니다: ${resolved}`);
  const stats = fs.statSync(resolved);
  if (expectedType === "file") ensure(stats.isFile(), `${label}가 파일이 아닙니다: ${resolved}`);
  if (expectedType === "directory") ensure(stats.isDirectory(), `${label}가 폴더가 아닙니다: ${resolved}`);
  return resolved;
}

function validateBundle(tracker, rawBundle, context) {
  const { checkArtifacts, roots } = context;
  const bundle = materializeBundle(tracker, rawBundle);
  ensure(Number.isInteger(bundle.sequence) && bundle.sequence >= 1 && bundle.sequence <= 30, `잘못된 순번입니다: ${bundle.sequence}`);
  for (const fieldPath of Object.keys(STATUS_VALUES)) validateStatus(bundle, fieldPath);
  ensure(bundle.ppt.source === "Claude", `${bundle.sequence}번 PPT 제작 주체는 Claude여야 합니다.`);
  ensure(["pptx", "html"].includes(bundle.ppt.format), `${bundle.sequence}번 발표 자료 형식이 잘못되었습니다.`);
  ensure(Array.isArray(bundle.notes), `${bundle.sequence}번 notes는 배열이어야 합니다.`);

  const hasLesson = Boolean(bundle.lessonId);
  if (!hasLesson) {
    ensure(!bundle.title && !bundle.subject && !bundle.grade && !bundle.unit, `${bundle.sequence}번 빈 슬롯에 수업 메타데이터만 남아 있습니다.`);
    ensure(bundle.durationMinutes === null && bundle.declaredSlideCount === null, `${bundle.sequence}번 빈 슬롯에 차시 수치만 남아 있습니다.`);
    for (const fieldPath of Object.keys(STATUS_VALUES)) {
      ensure(getNested(bundle, fieldPath) === STATUS_VALUES[fieldPath][0], `${bundle.sequence}번 빈 슬롯의 ${fieldPath}는 시작 전이어야 합니다.`);
    }
    return bundle;
  }

  ensure(/^[a-z0-9][a-z0-9-]*$/.test(bundle.lessonId), `${bundle.sequence}번 lessonId 형식이 잘못되었습니다: ${bundle.lessonId}`);
  for (const key of ["title", "subject", "grade", "unit"]) ensure(String(bundle[key] || "").trim(), `${bundle.sequence}번 ${key}가 비었습니다.`);
  ensure(Number.isInteger(bundle.durationMinutes) && bundle.durationMinutes > 0, `${bundle.sequence}번 수업 시간이 잘못되었습니다.`);
  ensure(Number.isInteger(bundle.declaredSlideCount) && bundle.declaredSlideCount > 0, `${bundle.sequence}번 선언 슬라이드 수가 잘못되었습니다.`);

  if (bundle.content.status === "validated") {
    ensure(isTimestamp(bundle.content.validatedAt), `${bundle.sequence}번 내용 검증 시각이 없습니다.`);
    if (checkArtifacts) {
      const schemaPath = requireTrackedArtifact(bundle.content.schemaPath, roots, `${bundle.sequence}번 수업 스키마`);
      const markdownPath = requireTrackedArtifact(bundle.content.handoffMarkdownPath, roots, `${bundle.sequence}번 Claude 내용 Markdown`);
      const jsonPath = requireTrackedArtifact(bundle.content.handoffJsonPath, roots, `${bundle.sequence}번 Claude 내용 JSON`);
      ensure([".cjs", ".json"].includes(path.extname(schemaPath)), `${bundle.sequence}번 수업 스키마는 .cjs 또는 .json이어야 합니다.`);
      ensure(path.extname(markdownPath) === ".md", `${bundle.sequence}번 내용 원고는 .md여야 합니다.`);
      const handoff = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      ensure(handoff.lesson?.id === bundle.lessonId, `${bundle.sequence}번 handoff lessonId가 원장과 다릅니다.`);
      ensure(handoff.lesson?.slideCount === bundle.declaredSlideCount, `${bundle.sequence}번 handoff 슬라이드 수가 원장과 다릅니다.`);
      ensure(Array.isArray(handoff.slides) && handoff.slides.length === bundle.declaredSlideCount, `${bundle.sequence}번 handoff 본문 슬라이드 수가 다릅니다.`);
    }
  }

  if (bundle.worksheet.status !== "not-started") ensure(bundle.content.status === "validated", `${bundle.sequence}번 활동지는 내용 검증 뒤 제작해야 합니다.`);
  if (bundle.worksheet.status === "validated") {
    ensure(isTimestamp(bundle.worksheet.validatedAt), `${bundle.sequence}번 활동지 검증 시각이 없습니다.`);
    ensure(bundle.worksheet.filename, `${bundle.sequence}번 통합 활동지 파일명이 없습니다.`);
    if (checkArtifacts) {
      const promptPath = requireTrackedArtifact(bundle.worksheet.sourcePath, roots, `${bundle.sequence}번 통합 활동지 이미지 생성 프롬프트`);
      const pngPath = requireTrackedArtifact(bundle.worksheet.pngPath, roots, `${bundle.sequence}번 통합 활동지 PNG`);
      requireTrackedArtifact(bundle.worksheet.pdfPath, roots, `${bundle.sequence}번 통합 활동지 PDF`);
      ensure(promptPath.endsWith(".prompt.txt"), `${bundle.sequence}번 활동지 원본은 이미지 생성 프롬프트여야 합니다.`);
      ensure(path.basename(pngPath) === bundle.worksheet.filename, `${bundle.sequence}번 활동지 PNG 파일명이 원장과 다릅니다.`);
    }
  }

  if (bundle.ppt.status !== "not-started") ensure(bundle.content.status === "validated", `${bundle.sequence}번 Claude PPT 상태는 내용 검증 뒤 올릴 수 있습니다.`);
  if (["received", "validated"].includes(bundle.ppt.status)) {
    ensure(Number.isInteger(bundle.ppt.slideCount) && bundle.ppt.slideCount > 0, `${bundle.sequence}번 수령 PPT 슬라이드 수가 없습니다.`);
    if (bundle.ppt.format === "html") {
      ensure(!bundle.ppt.pptxPath, `${bundle.sequence}번 HTML 발표 자료에 공개 PPTX 경로가 남아 있습니다.`);
      if (checkArtifacts) requireTrackedArtifact(bundle.ppt.htmlPath, roots, `${bundle.sequence}번 Claude HTML 슬라이드`);
    } else {
      ensure(!bundle.ppt.htmlPath, `${bundle.sequence}번 PPTX 발표 자료에 HTML 경로가 남아 있습니다.`);
      if (checkArtifacts) requireTrackedArtifact(bundle.ppt.pptxPath, roots, `${bundle.sequence}번 Claude PPTX`);
    }
  }
  if (bundle.ppt.status === "validated") {
    ensure(isTimestamp(bundle.ppt.validatedAt), `${bundle.sequence}번 Claude PPT 검증 시각이 없습니다.`);
    if (checkArtifacts) {
      requireTrackedArtifact(bundle.ppt.intakeReportPath, roots, `${bundle.sequence}번 PPT 인수 검수표`);
      requireTrackedArtifact(bundle.ppt.renderedPdfPath, roots, `${bundle.sequence}번 PPT 렌더 PDF`);
      const slidesDirectory = requireTrackedArtifact(bundle.ppt.slidesDirectory, roots, `${bundle.sequence}번 렌더 슬라이드 폴더`, "directory");
      const renderedSlides = fs.readdirSync(slidesDirectory).filter((name) => /\.(jpe?g|png)$/i.test(name));
      ensure(renderedSlides.length === bundle.declaredSlideCount, `${bundle.sequence}번 렌더 슬라이드 이미지 수가 선언값과 다릅니다.`);
    }
  }
  if (bundle.ppt.legacyPptxPath && checkArtifacts) requireTrackedArtifact(bundle.ppt.legacyPptxPath, roots, `${bundle.sequence}번 이전 PPTX`);

  for (const [statusKey, pathKey, label] of [
    ["intentStatus", "intentPath", "수업 설계 의도"],
    ["answerKeyStatus", "answerKeyPath", "교사용 정답"],
    ["representativeImageStatus", "representativeImagePath", "대표 이미지"],
  ]) {
    if (bundle.support[statusKey] === "validated" && checkArtifacts) {
      requireTrackedArtifact(bundle.support[pathKey], roots, `${bundle.sequence}번 ${label}`);
    }
  }

  if (bundle.eduitit.packageStatus !== "not-started" && checkArtifacts) {
    const packagePath = requireTrackedArtifact(bundle.eduitit.packagePath, roots, `${bundle.sequence}번 Eduitit 패키지`, "directory");
    ensure(/^[0-9a-f]{12}$/.test(bundle.eduitit.digest), `${bundle.sequence}번 Eduitit digest 형식이 잘못되었습니다.`);
    if (bundle.eduitit.packageStatus === "validated") {
      const manifestPath = path.join(packagePath, "manifest.json");
      ensure(fs.existsSync(manifestPath), `${bundle.sequence}번 Eduitit manifest.json이 없습니다.`);
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      ensure(manifest.lessonId === bundle.lessonId, `${bundle.sequence}번 Eduitit manifest lessonId가 다릅니다.`);
      ensure(manifest.digest === bundle.eduitit.digest, `${bundle.sequence}번 Eduitit manifest digest가 다릅니다.`);
      ensure(isTimestamp(bundle.eduitit.validatedAt), `${bundle.sequence}번 Eduitit 패키지 검증 시각이 없습니다.`);
    }
  }
  if (["unpublished", "published", "stale"].includes(bundle.eduitit.localRecordStatus) && bundle.eduitit.localRecordId) {
    ensure(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bundle.eduitit.localRecordId), `${bundle.sequence}번 Eduitit 로컬 레코드 ID가 잘못되었습니다.`);
  }
  if (bundle.eduitit.localRecordStatus === "published") ensure(bundle.eduitit.packageStatus === "validated", `${bundle.sequence}번 로컬 공개는 검증된 패키지가 필요합니다.`);
  if (["local-passed", "production-passed"].includes(bundle.eduitit.anonymousAccessStatus)) {
    ensure(bundle.eduitit.localRecordStatus === "published", `${bundle.sequence}번 익명 접근 통과는 최신 로컬 공개 레코드가 필요합니다.`);
  }
  if (bundle.eduitit.productionStatus === "deployed") {
    ensure(bundle.eduitit.packageStatus === "validated", `${bundle.sequence}번 운영 배포는 검증된 패키지가 필요합니다.`);
    ensure(bundle.eduitit.anonymousAccessStatus === "production-passed", `${bundle.sequence}번 운영 배포는 비로그인 접근 검증이 필요합니다.`);
    ensure(isHttpUrl(bundle.eduitit.publicUrl) && bundle.eduitit.publicUrl.startsWith("https://"), `${bundle.sequence}번 운영 공개 URL은 HTTPS여야 합니다.`);
  } else {
    ensure(!bundle.eduitit.publicUrl, `${bundle.sequence}번 미배포 상태에는 공개 URL을 기록할 수 없습니다.`);
  }

  if (bundle.submission.communityPostStatus === "posted") ensure(isHttpUrl(bundle.submission.communityPostUrl), `${bundle.sequence}번 교사 커뮤니티·블로그·SNS 게시물 URL이 필요합니다.`);
  if (bundle.submission.closedCommunityEvidenceImagePath && checkArtifacts) requireTrackedArtifact(bundle.submission.closedCommunityEvidenceImagePath, roots, `${bundle.sequence}번 폐쇄형 커뮤니티 증빙 이미지`);
  if (bundle.submission.raceRecordStatus === "registered") {
    ensure(bundle.submission.communityPostStatus === "posted", `${bundle.sequence}번 나의 레이스 등록 전 공유 게시물이 필요합니다.`);
    ensure(isTimestamp(bundle.submission.recordedAt), `${bundle.sequence}번 나의 레이스 등록 시각이 없습니다.`);
  }
  return bundle;
}

function validateUniqueNonEmpty(values, label) {
  const seen = new Set();
  for (const value of values.filter(Boolean)) {
    ensure(!seen.has(value), `${label} 중복입니다: ${value}`);
    seen.add(value);
  }
}

function validateTracker(tracker, options = {}) {
  const trackerPath = path.resolve(options.trackerPath || DEFAULT_TRACKER_PATH);
  const checkArtifacts = options.checkArtifacts !== false;
  ensure(tracker.schemaVersion === 1, "지원하지 않는 추적 원장 스키마입니다.");
  ensure(tracker.seriesId === "vivasam-2026-middleofmath-30", "시리즈 ID가 다릅니다.");
  ensure(tracker.contract?.targetDeckCount === 30, "PPT 목표가 30개가 아닙니다.");
  ensure(tracker.contract?.preferredSlidesPerDeck === 11, "기준 슬라이드 수가 약 11장이 아닙니다.");
  ensure(tracker.contract?.slideCountIsFlexible === true, "슬라이드 수가 가변으로 열려 있지 않습니다.");
  ensure(tracker.contract?.worksheetsPerDeck === 1, "PPT 한 개당 통합 활동지가 1개가 아닙니다.");
  ensure(tracker.contract?.targetWorksheetCount === 30, "전체 통합 활동지 목표가 30개가 아닙니다.");
  ensure(tracker.contract?.pptAuthor === "Claude", "PPT 제작 주체가 Claude로 고정되지 않았습니다.");
  ensure(tracker.contract?.codexOwnsNonPptArtifacts === true, "PPT 외 산출물의 Codex 소유 계약이 없습니다.");
  ensure(isPlainObject(tracker.bundleDefaults), "bundleDefaults가 없습니다.");
  ensure(Array.isArray(tracker.bundles) && tracker.bundles.length === 30, "추적 슬롯은 정확히 30개여야 합니다.");
  const sequences = tracker.bundles.map((bundle) => bundle.sequence);
  ensure(sequences.every((sequence, index) => sequence === index + 1), "추적 슬롯 순번은 1부터 30까지 연속이어야 합니다.");
  const roots = repositoryRoots(tracker, trackerPath, options.roots || {});
  if (checkArtifacts) {
    ensure(fs.existsSync(roots.middleofmath), `middleofmath 저장소가 없습니다: ${roots.middleofmath}`);
    ensure(fs.existsSync(roots.eduitit), `eduitit 저장소가 없습니다: ${roots.eduitit}`);
  }
  const bundles = tracker.bundles.map((bundle) => validateBundle(tracker, bundle, { checkArtifacts, roots }));
  validateUniqueNonEmpty(bundles.map((bundle) => bundle.lessonId), "lessonId");
  validateUniqueNonEmpty(bundles.map((bundle) => bundle.worksheet.filename), "통합 활동지 파일명");
  validateUniqueNonEmpty(bundles.map((bundle) => bundle.eduitit.digest), "Eduitit digest");
  validateUniqueNonEmpty(bundles.map((bundle) => bundle.eduitit.localRecordId), "Eduitit 레코드 ID");
  validateUniqueNonEmpty(bundles.map((bundle) => bundle.eduitit.publicUrl), "운영 공개 URL");
  validateUniqueNonEmpty(bundles.map((bundle) => bundle.submission.communityPostUrl), "공유 게시물 URL");
  ensure(isTimestamp(tracker.updatedAt), "updatedAt이 ISO 시각이 아닙니다.");
  ensure(Array.isArray(tracker.history) && tracker.history.length > 0, "변경 이력이 없습니다.");
  for (const entry of tracker.history) {
    ensure(isTimestamp(entry.at), "변경 이력 시각이 잘못되었습니다.");
    ensure(entry.sequence === null || (Number.isInteger(entry.sequence) && entry.sequence >= 1 && entry.sequence <= 30), "변경 이력 순번이 잘못되었습니다.");
    ensure(String(entry.event || "").trim(), "변경 이력 event가 비었습니다.");
    ensure(String(entry.detail || "").trim(), "변경 이력 detail이 비었습니다.");
  }
  const lastHistoryAt = tracker.history.at(-1).at;
  ensure(Date.parse(lastHistoryAt) <= Date.parse(tracker.updatedAt), "updatedAt이 마지막 변경 이력보다 이릅니다.");
  return { tracker, trackerPath, roots, bundles };
}

function supportComplete(bundle) {
  return bundle.support.intentStatus === "validated"
    && bundle.support.answerKeyStatus === "validated"
    && bundle.support.representativeImageStatus === "validated";
}

function deriveStage(bundle) {
  if (!bundle.lessonId) return "unplanned";
  if (bundle.submission.raceRecordStatus === "registered") return "submitted";
  if (bundle.submission.communityPostStatus === "posted") return "shared";
  if (bundle.eduitit.productionStatus === "deployed") return "production-published";
  if (bundle.eduitit.localRecordStatus === "published") return "locally-published";
  if (bundle.eduitit.packageStatus === "validated") return "package-ready";
  if (bundle.ppt.status === "validated" && bundle.worksheet.status === "validated" && supportComplete(bundle)) return "bundle-validated";
  if (bundle.ppt.status === "validated") return "ppt-validated";
  if (bundle.content.status === "validated") return "content-ready";
  return "planned";
}

function nextAction(bundle) {
  if (!bundle.lessonId) return "차시 주제·lessonId 확정";
  if (bundle.content.status !== "validated") return "내용 스키마·Claude 원고 검증";
  if (!["received", "validated"].includes(bundle.ppt.status)) return "Claude HTML/PPTX 수령";
  const pending = [];
  if (bundle.worksheet.status !== "validated") pending.push("통합 활동지 1개 제작");
  if (!supportComplete(bundle)) pending.push("수업 진행 안내·대표 이미지 완성");
  if (pending.length) return pending.join(" + ");
  if (bundle.eduitit.packageStatus !== "validated") return "Eduitit 최종 패키지 재빌드·검증";
  if (bundle.eduitit.localRecordStatus !== "published") return bundle.eduitit.localRecordStatus === "stale" ? "Eduitit 로컬 레코드 재발행" : "Eduitit 로컬 공개";
  if (bundle.eduitit.productionStatus !== "deployed") return "운영 배포·비로그인 접근 검증";
  if (bundle.submission.communityPostStatus !== "posted") return "교사 커뮤니티·블로그·SNS 공유";
  if (bundle.submission.raceRecordStatus !== "registered") return "공유 게시물 URL로 나의 레이스 등록";
  return "완료 유지·증빙 보관";
}

function summarizeTracker(validated) {
  const bundles = validated.bundles;
  const count = (predicate) => bundles.filter(predicate).length;
  return {
    targetDecks: 30,
    registeredLessons: count((bundle) => Boolean(bundle.lessonId)),
    contentValidated: count((bundle) => bundle.content.status === "validated"),
    worksheetsValidated: count((bundle) => bundle.worksheet.status === "validated"),
    claudePptsAwaiting: count((bundle) => bundle.ppt.status === "awaiting-claude"),
    claudePptsReceived: count((bundle) => ["received", "validated"].includes(bundle.ppt.status)),
    claudePptsValidated: count((bundle) => bundle.ppt.status === "validated"),
    supportValidated: count(supportComplete),
    packagesValidated: count((bundle) => bundle.eduitit.packageStatus === "validated"),
    localRecordsPublished: count((bundle) => bundle.eduitit.localRecordStatus === "published"),
    localAnonymousAccessPassed: count((bundle) => bundle.eduitit.anonymousAccessStatus === "local-passed" || bundle.eduitit.anonymousAccessStatus === "production-passed"),
    productionPublished: count((bundle) => bundle.eduitit.productionStatus === "deployed"),
    communityPosts: count((bundle) => bundle.submission.communityPostStatus === "posted"),
    raceRecords: count((bundle) => bundle.submission.raceRecordStatus === "registered"),
    fullyCompleted: count((bundle) => deriveStage(bundle) === "submitted"),
  };
}

function markdownCell(value) {
  return String(value ?? "").replace(/\r?\n/g, " ").replace(/\|/g, "\\|").trim() || "—";
}

function renderDashboard(validated) {
  const summary = summarizeTracker(validated);
  const rows = validated.bundles.map((bundle) => {
    const share = bundle.submission.raceRecordStatus === "registered"
      ? "레이스 등록"
      : bundle.submission.communityPostStatus === "posted" ? "게시 완료" : "미게시";
    const localPublication = `${bundle.eduitit.localRecordStatus}/${bundle.eduitit.anonymousAccessStatus}`;
    return `| ${String(bundle.sequence).padStart(2, "0")} | ${markdownCell(bundle.title || bundle.lessonId)} | ${markdownCell(bundle.declaredSlideCount)} | ${bundle.content.status} | ${bundle.worksheet.status} | ${bundle.ppt.status} | ${supportComplete(bundle) ? "validated" : "pending"} | ${bundle.eduitit.packageStatus} | ${localPublication} | ${bundle.eduitit.productionStatus} | ${share} | ${markdownCell(nextAction(bundle))} |`;
  }).join("\n");
  const historyRows = validated.tracker.history.slice(-20).reverse().map((entry) =>
    `| ${markdownCell(entry.at)} | ${entry.sequence === null ? "전체" : String(entry.sequence).padStart(2, "0")} | ${markdownCell(entry.event)} | ${markdownCell(entry.detail)} |`,
  ).join("\n");
  const bundleNotes = validated.bundles.filter((bundle) => bundle.notes.length > 0).map((bundle) =>
    `### ${String(bundle.sequence).padStart(2, "0")}. ${markdownCell(bundle.title || bundle.lessonId)}\n\n${bundle.notes.map((note) => `- ${markdownCell(note)}`).join("\n")}`,
  ).join("\n\n") || "- 기록된 메모가 없습니다.";
  return `# 비바샘 수업 꾸러미 30개 진행표

이 문서는 \`tools/vivasam-bundle/series-tracker.json\`에서 자동 생성됩니다. 직접 고치지 말고 \`track-series.cjs update\`로 원장을 갱신하세요.

- 원장 최종 갱신: ${validated.tracker.updatedAt}
- 생산 계약: PPT 30개 · PPT당 약 11장(차시별 가변) · PPT당 통합 활동지 1개 · 활동지 총 30개
- 역할: Claude는 발표 화면(HTML 우선, 기존 PPTX 호환)만 제작, Codex는 내용 원고와 발표 화면 외 모든 산출물·플랫폼·검증·추적 담당

## 전체 현황

| 지표 | 완료 | 목표 |
|---|---:|---:|
| 주제 등록 | ${summary.registeredLessons} | 30 |
| 내용 원고 검증 | ${summary.contentValidated} | 30 |
| 통합 활동지 검증 | ${summary.worksheetsValidated} | 30 |
| Claude 발표 화면 수령 | ${summary.claudePptsReceived} | 30 |
| 설계 의도·정답·대표 이미지 검증 | ${summary.supportValidated} | 30 |
| Eduitit 패키지 검증 | ${summary.packagesValidated} | 30 |
| Eduitit 로컬 공개·비로그인 접근 검증 | ${summary.localAnonymousAccessPassed} | 30 |
| 운영 공개·비로그인 접근 검증 | ${summary.productionPublished} | 30 |
| 교사 커뮤니티·블로그·SNS 게시 | ${summary.communityPosts} | 30 |
| 나의 레이스 등록 | ${summary.raceRecords} | 30 |
| 전 과정 완료 | ${summary.fullyCompleted} | 30 |

현재 Claude HTML/PPTX 수령 대기: ${summary.claudePptsAwaiting}개. 남은 전체 완료 슬롯: ${30 - summary.fullyCompleted}개.

## 30개 슬롯

| 번호 | 수업 | 슬라이드 | 내용 | 통합 활동지 1개 | Claude PPT | 지원 자료 | Eduitit 패키지 | 로컬 공개/익명 접근 | 운영 공개 | 공유·레이스 | 다음 할 일 |
|---:|---|---:|---|---|---|---|---|---|---|---|---|
${rows}

## 판정 원칙

- 이전 Codex 제작 발표 화면이나 슬라이드별 활동지는 새 계약의 Claude HTML/PPTX 또는 통합 활동지 1개 완료로 계산하지 않습니다.
- \`validated\`, \`published\`, \`deployed\`, \`registered\`는 대응 파일·ID·URL·검증 시각이 있을 때만 기록합니다.
- Eduitit 운영 공개는 HTTPS 공개 URL과 비로그인 운영 접근 검증이 모두 있어야 완료입니다.
- 나의 레이스 등록은 먼저 교사 커뮤니티·블로그·SNS 게시물 URL이 있어야 완료입니다.

## 슬롯 메모

${bundleNotes}

## 최근 변경 이력

| 시각 | 번호 | 이벤트 | 근거 |
|---|---:|---|---|
${historyRows}
`;
}

function writeAtomic(filePath, contents) {
  const resolved = path.resolve(filePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  const temporaryPath = `${resolved}.tmp-${process.pid}`;
  fs.writeFileSync(temporaryPath, contents, "utf8");
  fs.renameSync(temporaryPath, resolved);
}

function writeTracker(trackerPath, tracker) {
  writeAtomic(trackerPath, `${JSON.stringify(tracker, null, 2)}\n`);
}

function writeDashboard(validated, dashboardPath = DEFAULT_DASHBOARD_PATH) {
  writeAtomic(dashboardPath, renderDashboard(validated));
  return path.resolve(dashboardPath);
}

function parseScalar(value) {
  if (value === "null") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
  return value;
}

function parseArgs(argv) {
  const command = argv[0] && (!argv[0].startsWith("--") || ["--help", "-h"].includes(argv[0])) ? argv.shift() : "status";
  const options = {
    command,
    trackerPath: DEFAULT_TRACKER_PATH,
    dashboardPath: DEFAULT_DASHBOARD_PATH,
    sequence: null,
    sets: [],
    event: "",
    detail: "",
    note: "",
    allowDowngrade: false,
    lessonPath: "",
    handoffDir: "",
    json: false,
  };
  while (argv.length) {
    const token = argv.shift();
    if (token === "--tracker") options.trackerPath = path.resolve(argv.shift() || "");
    else if (token === "--dashboard") options.dashboardPath = path.resolve(argv.shift() || "");
    else if (token === "--sequence") options.sequence = Number(argv.shift());
    else if (token === "--set") {
      const pair = argv.shift() || "";
      const separator = pair.indexOf("=");
      ensure(separator > 0, `--set은 field=value 형식이어야 합니다: ${pair}`);
      options.sets.push([pair.slice(0, separator), parseScalar(pair.slice(separator + 1))]);
    } else if (token === "--event") options.event = argv.shift() || "";
    else if (token === "--detail") options.detail = argv.shift() || "";
    else if (token === "--note") options.note = argv.shift() || "";
    else if (token === "--allow-downgrade") options.allowDowngrade = true;
    else if (token === "--lesson") options.lessonPath = path.resolve(argv.shift() || "");
    else if (token === "--handoff-dir") options.handoffDir = path.resolve(argv.shift() || "");
    else if (token === "--json") options.json = true;
    else throw new Error(`알 수 없는 옵션입니다: ${token}`);
  }
  return options;
}

function assertNoUnapprovedDowngrade(before, after, changedPaths, allowDowngrade) {
  if (allowDowngrade) return;
  for (const fieldPath of changedPaths.filter((item) => STATUS_RANK[item])) {
    const beforeRank = STATUS_RANK[fieldPath][getNested(before, fieldPath)];
    const afterRank = STATUS_RANK[fieldPath][getNested(after, fieldPath)];
    ensure(afterRank >= beforeRank, `${fieldPath}를 하향하려면 --allow-downgrade가 필요합니다.`);
  }
}

function appendHistory(tracker, sequence, event, detail, now = new Date().toISOString()) {
  ensure(String(event || "").trim(), "상태 갱신에는 --event가 필요합니다.");
  tracker.updatedAt = now;
  tracker.history.push({ at: now, sequence, event: event.trim(), detail: detail.trim() });
}

function updateTracker(options) {
  ensure(Number.isInteger(options.sequence) && options.sequence >= 1 && options.sequence <= 30, "--sequence는 1~30 정수여야 합니다.");
  ensure(options.sets.length > 0 || options.note, "--set 또는 --note가 필요합니다.");
  const loaded = loadTracker(options.trackerPath);
  const tracker = clone(loaded.tracker);
  const rawBundle = tracker.bundles.find((bundle) => bundle.sequence === options.sequence);
  const before = materializeBundle(tracker, rawBundle);
  for (const [fieldPath, value] of options.sets) {
    ensure(UPDATABLE_PATHS.has(fieldPath), `갱신할 수 없는 필드입니다: ${fieldPath}`);
    setNested(rawBundle, fieldPath, value);
  }
  if (options.note) {
    rawBundle.notes = [...before.notes, options.note.trim()];
  }
  const after = materializeBundle(tracker, rawBundle);
  assertNoUnapprovedDowngrade(before, after, options.sets.map(([fieldPath]) => fieldPath), options.allowDowngrade);
  const changed = options.sets.map(([fieldPath]) => fieldPath).concat(options.note ? ["notes"] : []);
  appendHistory(tracker, options.sequence, options.event, options.detail || `갱신 필드: ${changed.join(", ")}`);
  const validated = validateTracker(tracker, { trackerPath: loaded.trackerPath });
  writeTracker(loaded.trackerPath, tracker);
  const dashboardPath = writeDashboard(validated, options.dashboardPath);
  return { validated, dashboardPath };
}

function findRawBundleForLesson(tracker, lessonId, requestedSequence) {
  if (requestedSequence !== null) {
    ensure(Number.isInteger(requestedSequence) && requestedSequence >= 1 && requestedSequence <= 30, "--sequence는 1~30 정수여야 합니다.");
    const raw = tracker.bundles.find((bundle) => bundle.sequence === requestedSequence);
    ensure(!raw.lessonId || raw.lessonId === lessonId, `${requestedSequence}번 슬롯은 다른 lessonId를 사용 중입니다: ${raw.lessonId}`);
    return raw;
  }
  const matches = tracker.bundles.filter((bundle) => bundle.lessonId === lessonId);
  ensure(matches.length === 1, `lessonId=${lessonId} 슬롯을 하나로 찾지 못했습니다. 새 차시는 --sequence를 지정하세요.`);
  return matches[0];
}

function recordContent(options) {
  ensure(options.lessonPath && fs.existsSync(options.lessonPath), `--lesson 파일이 없습니다: ${options.lessonPath}`);
  ensure(options.handoffDir && fs.existsSync(options.handoffDir), `--handoff-dir 폴더가 없습니다: ${options.handoffDir}`);
  const loaded = loadTracker(options.trackerPath);
  const tracker = clone(loaded.tracker);
  const roots = repositoryRoots(tracker, loaded.trackerPath);
  let lesson;
  if (path.extname(options.lessonPath) === ".json") lesson = JSON.parse(fs.readFileSync(options.lessonPath, "utf8"));
  else {
    delete require.cache[require.resolve(options.lessonPath)];
    lesson = require(options.lessonPath);
  }
  ensure(Array.isArray(lesson.slides) && lesson.slides.length > 0, "수업 스키마에 슬라이드가 없습니다.");
  ensure(lesson.worksheet?.file, "수업 스키마에 PPT당 통합 활동지 파일명이 없습니다.");
  const rawBundle = findRawBundleForLesson(tracker, lesson.id, options.sequence);
  const handoffMarkdown = path.join(options.handoffDir, "claude-ppt-content.md");
  const handoffJson = path.join(options.handoffDir, "claude-ppt-content.json");
  ensure(fs.existsSync(handoffMarkdown) && fs.existsSync(handoffJson), "검증된 Claude 내용 원고 파일이 없습니다.");
  const handoff = JSON.parse(fs.readFileSync(handoffJson, "utf8"));
  ensure(handoff.lesson?.id === lesson.id && handoff.slides?.length === lesson.slides.length, "수업 스키마와 Claude 내용 원고가 다릅니다.");
  const now = new Date().toISOString();
  Object.assign(rawBundle, {
    lessonId: lesson.id,
    title: String(lesson.title || "").replace(/\s+/g, " ").trim(),
    subject: String(lesson.subject || "").trim(),
    grade: String(lesson.grade || "").trim(),
    unit: String(lesson.unit || "").trim(),
    durationMinutes: lesson.durationMinutes,
    declaredSlideCount: lesson.slides.length,
  });
  rawBundle.content = {
    ...rawBundle.content,
    status: "validated",
    schemaPath: toTrackedPath(options.lessonPath, roots),
    handoffMarkdownPath: toTrackedPath(handoffMarkdown, roots),
    handoffJsonPath: toTrackedPath(handoffJson, roots),
    validatedAt: now,
  };
  rawBundle.worksheet = { ...rawBundle.worksheet, filename: lesson.worksheet.file };
  const currentPptStatus = materializeBundle(tracker, rawBundle).ppt.status;
  if (currentPptStatus === "not-started") rawBundle.ppt = { ...rawBundle.ppt, status: "awaiting-claude" };
  appendHistory(
    tracker,
    rawBundle.sequence,
    options.event || "Claude 전달용 PPT 내용 원고 검증",
    options.detail || `${lesson.slides.length}장 분량의 화면 내용만 포함한 handoff를 검증하고 기록했다.`,
    now,
  );
  const validated = validateTracker(tracker, { trackerPath: loaded.trackerPath });
  writeTracker(loaded.trackerPath, tracker);
  const dashboardPath = writeDashboard(validated, options.dashboardPath);
  return { validated, dashboardPath, sequence: rawBundle.sequence };
}

function printStatus(validated, asJson = false) {
  const summary = summarizeTracker(validated);
  if (asJson) {
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    return;
  }
  const active = validated.bundles.filter((bundle) => bundle.lessonId && deriveStage(bundle) !== "submitted");
  process.stdout.write([
    "비바샘 수업 꾸러미 30개 추적 현황",
    `- 주제 등록: ${summary.registeredLessons}/30`,
    `- 내용 원고 검증: ${summary.contentValidated}/30`,
    `- 통합 활동지 검증: ${summary.worksheetsValidated}/30`,
    `- Claude HTML/PPTX 수령: ${summary.claudePptsReceived}/30 (수령 대기 ${summary.claudePptsAwaiting})`,
    `- Eduitit 패키지 검증: ${summary.packagesValidated}/30`,
    `- Eduitit 로컬 공개·비로그인 검증: ${summary.localAnonymousAccessPassed}/30`,
    `- 운영 공개: ${summary.productionPublished}/30`,
    `- 나의 레이스 등록: ${summary.raceRecords}/30`,
    `- 전 과정 완료: ${summary.fullyCompleted}/30`,
    ...active.slice(0, 5).map((bundle) => `- ${String(bundle.sequence).padStart(2, "0")} ${bundle.title}: ${nextAction(bundle)}`),
  ].join("\n") + "\n");
}

function printUsage() {
  process.stdout.write(`usage:
  node track-series.cjs validate [--tracker FILE]
  node track-series.cjs status [--json]
  node track-series.cjs render [--dashboard FILE]
  node track-series.cjs show --sequence N
  node track-series.cjs update --sequence N --set field=value [--set ...] --event TEXT [--detail TEXT] [--note TEXT]
  node track-series.cjs record-content --lesson FILE --handoff-dir DIR [--sequence N]

상태 하향은 오류 수정일 때만 --allow-downgrade를 명시합니다.
`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (["help", "--help", "-h"].includes(options.command)) return printUsage();
  if (options.command === "update") {
    const result = updateTracker(options);
    printStatus(result.validated, false);
    process.stdout.write(`진행표: ${result.dashboardPath}\n`);
    return;
  }
  if (options.command === "record-content") {
    const result = recordContent(options);
    process.stdout.write(`${result.sequence}번 내용 원고 상태를 기록했습니다.\n진행표: ${result.dashboardPath}\n`);
    return;
  }
  const loaded = loadTracker(options.trackerPath);
  const validated = validateTracker(loaded.tracker, { trackerPath: loaded.trackerPath });
  if (options.command === "validate") {
    process.stdout.write(`추적 원장 검증 통과: 30개 슬롯, PPT당 통합 활동지 1개\n`);
  } else if (options.command === "status") {
    printStatus(validated, options.json);
  } else if (options.command === "render") {
    process.stdout.write(`진행표 생성: ${writeDashboard(validated, options.dashboardPath)}\n`);
  } else if (options.command === "show") {
    ensure(Number.isInteger(options.sequence) && options.sequence >= 1 && options.sequence <= 30, "show에는 --sequence가 필요합니다.");
    process.stdout.write(`${JSON.stringify(validated.bundles[options.sequence - 1], null, 2)}\n`);
  } else {
    throw new Error(`알 수 없는 명령입니다: ${options.command}`);
  }
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
  DEFAULT_DASHBOARD_PATH,
  DEFAULT_TRACKER_PATH,
  STATUS_RANK,
  STATUS_VALUES,
  UPDATABLE_PATHS,
  assertNoUnapprovedDowngrade,
  deriveStage,
  loadTracker,
  materializeBundle,
  nextAction,
  recordContent,
  renderDashboard,
  repositoryRoots,
  resolveTrackedPath,
  summarizeTracker,
  supportComplete,
  toTrackedPath,
  updateTracker,
  validateTracker,
  writeDashboard,
};
