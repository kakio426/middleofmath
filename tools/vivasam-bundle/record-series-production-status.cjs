#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const seriesManifest = require("../../artifacts/vivasam/non-ppt-series-manifest.json");
const {
  loadTracker,
  summarizeTracker,
  validateTracker,
  writeDashboard,
} = require("./track-series.cjs");
const { writeSubmissionRegister } = require("./build-submission-register.cjs");

const REPO_ROOT = path.resolve(__dirname, "../..");
const DEFAULT_TRACKER_PATH = path.join(__dirname, "series-tracker.json");
const DEFAULT_DASHBOARD_PATH = path.join(REPO_ROOT, "docs", "vivasam-30-series-progress.md");
const DEFAULT_EVIDENCE_PATH = path.join(REPO_ROOT, "artifacts", "vivasam", "eduitit-production-publication.json");
const DEFAULT_BASE_URL = "https://eduitit.site";
const REQUIRED_STATUSES = Object.freeze([
  "detail",
  "run",
  "render",
  "thumbnail",
  "worksheet",
  "representativeAsset",
]);

function ensure(condition, message) {
  if (!condition) throw new Error(`Eduitit 운영 공개 검증 오류: ${message}`);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeBaseUrl(value) {
  const url = new URL(value || DEFAULT_BASE_URL);
  ensure(url.protocol === "https:", "운영 기준 URL은 HTTPS여야 합니다.");
  return url.origin;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function validatePublication(publication, baseUrl = DEFAULT_BASE_URL) {
  const origin = normalizeBaseUrl(baseUrl);
  ensure(publication && typeof publication === "object", "운영 게시 결과가 객체가 아닙니다.");
  ensure(publication.validated === 30 && publication.published === 30, "운영 게시·검증 수가 30이 아닙니다.");
  ensure(publication.created + publication.updated === 30, "운영 생성·갱신 합계가 30이 아닙니다.");
  ensure(publication.category === "lesson_bundle", "운영 카테고리가 수업 꾸러미가 아닙니다.");
  ensure(publication.pptStatus === "awaiting-claude", "운영 게시물이 Claude PPT 대기 상태가 아닙니다.");
  ensure(Array.isArray(publication.records) && publication.records.length === 30, "운영 게시 레코드는 정확히 30개여야 합니다.");

  const expectedByLessonId = new Map(seriesManifest.records.map((record) => [record.lessonId, record]));
  const lessonIds = new Set();
  const recordIds = new Set();
  const urls = new Set();
  for (const record of publication.records) {
    const expected = expectedByLessonId.get(record.lessonId);
    ensure(expected, `계획에 없는 lessonId입니다: ${record.lessonId}`);
    ensure(record.sequence === expected.sequence, `${record.lessonId} 순번이 다릅니다.`);
    ensure(record.digest === expected.digest, `${record.lessonId} 패키지 지문이 다릅니다.`);
    ensure(isUuid(record.localRecordId), `${record.lessonId} 운영 레코드 ID 형식이 잘못되었습니다.`);
    ensure(record.detailUrl === `${origin}${record.detailPath}`, `${record.lessonId} 상세 URL이 운영 도메인과 다릅니다.`);
    ensure(record.runUrl === `${origin}${record.runPath}`, `${record.lessonId} 실행 URL이 운영 도메인과 다릅니다.`);
    ensure(!lessonIds.has(record.lessonId), `${record.lessonId}가 중복되었습니다.`);
    ensure(!recordIds.has(record.localRecordId), `${record.lessonId} 운영 레코드 ID가 중복되었습니다.`);
    ensure(!urls.has(record.detailUrl), `${record.lessonId} 운영 상세 URL이 중복되었습니다.`);
    lessonIds.add(record.lessonId);
    recordIds.add(record.localRecordId);
    urls.add(record.detailUrl);
  }
  ensure(lessonIds.size === 30, "운영 게시의 고유 lessonId가 30개가 아닙니다.");
  return publication;
}

async function getResponse(url, { headers = {} } = {}) {
  const response = await fetch(url, {
    method: "GET",
    redirect: "manual",
    headers: {
      "User-Agent": "MiddleOfMath-Vivasam-Publication-Guard/1.0",
      ...headers,
    },
  });
  const body = Buffer.from(await response.arrayBuffer());
  return { response, body };
}

function ensureStatus(result, expected, label) {
  ensure(result.response.status === expected, `${label} 상태가 ${expected}이 아닙니다: ${result.response.status}`);
}

function packageManifest(lessonId) {
  const manifestPath = path.join(REPO_ROOT, "artifacts", "vivasam", lessonId, "web-package", "manifest.json");
  ensure(fs.existsSync(manifestPath), `${lessonId} 로컬 패키지 manifest가 없습니다.`);
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

async function verifyProductionHttp(publication, {
  baseUrl = DEFAULT_BASE_URL,
  commitHash = "",
  verifiedAt = new Date().toISOString(),
} = {}) {
  const origin = normalizeBaseUrl(baseUrl);
  validatePublication(publication, origin);
  ensure(Number.isFinite(Date.parse(verifiedAt)), "운영 검증 시각이 ISO 시각이 아닙니다.");

  const catalogUrl = `${origin}/edu-materials/?category=lesson_bundle`;
  const catalog = await getResponse(catalogUrl);
  ensureStatus(catalog, 200, "비로그인 수업 꾸러미 목록");
  ensure((catalog.response.headers.get("content-type") || "").includes("text/html"), "수업 꾸러미 목록 응답이 HTML이 아닙니다.");

  const records = [];
  for (const record of [...publication.records].sort((a, b) => a.sequence - b.sequence)) {
    const manifest = packageManifest(record.lessonId);
    const worksheetUrl = `${origin}/edu-materials/lesson-bundles/${record.lessonId}/download/${record.lessonId}-worksheet.pdf/`;
    const representativeAssetUrl = `${origin}/static/edu_materials/lesson_bundles/${record.lessonId}/${record.digest}/representative-image.png`;
    const urls = {
      detail: record.detailUrl,
      run: record.runUrl,
      render: `${origin}${record.detailPath}render/`,
      thumbnail: `${origin}${record.detailPath}thumbnail/`,
      worksheet: worksheetUrl,
      representativeAsset: representativeAssetUrl,
    };

    const detail = await getResponse(urls.detail);
    const run = await getResponse(urls.run);
    const render = await getResponse(urls.render, { headers: { "Accept-Encoding": "gzip" } });
    const thumbnail = await getResponse(urls.thumbnail);
    const worksheet = await getResponse(urls.worksheet);
    const representative = await getResponse(urls.representativeAsset);
    const results = { detail, run, render, thumbnail, worksheet, representativeAsset: representative };
    for (const name of REQUIRED_STATUSES) ensureStatus(results[name], 200, `${record.lessonId} ${name}`);

    ensure((detail.response.headers.get("content-type") || "").includes("text/html"), `${record.lessonId} 상세 응답이 HTML이 아닙니다.`);
    ensure((run.response.headers.get("content-type") || "").includes("text/html"), `${record.lessonId} 실행 응답이 HTML이 아닙니다.`);
    const csp = render.response.headers.get("content-security-policy") || "";
    const cacheControl = render.response.headers.get("cache-control") || "";
    const edgeEtag = render.response.headers.get("etag") || "";
    // Cloudflare may omit the response ETag after edge compression even though
    // the origin still honors If-None-Match. The origin ETag contract is the
    // SHA-256 of the uncompressed runtime body, which fetch() gives us here.
    const etag = edgeEtag || `W/"sha256:${crypto.createHash("sha256").update(render.body).digest("hex")}"`;
    ensure(csp.includes("frame-ancestors 'self'"), `${record.lessonId} 렌더 CSP가 없습니다.`);
    ensure(cacheControl.includes("public"), `${record.lessonId} 렌더 공개 캐시 헤더가 없습니다.`);
    ensure((thumbnail.response.headers.get("content-type") || "").startsWith("image/"), `${record.lessonId} 썸네일이 이미지가 아닙니다.`);
    ensure((worksheet.response.headers.get("content-type") || "").includes("application/pdf"), `${record.lessonId} 활동지가 PDF가 아닙니다.`);
    ensure((representative.response.headers.get("content-type") || "").startsWith("image/"), `${record.lessonId} 대표 자산이 이미지가 아닙니다.`);
    ensure(worksheet.body.subarray(0, 4).toString("ascii") === "%PDF", `${record.lessonId} 활동지 PDF 시그니처가 잘못되었습니다.`);

    const notModified = await getResponse(urls.render, { headers: { "If-None-Match": etag } });
    ensureStatus(notModified, 304, `${record.lessonId} 렌더 ETag 재검증`);
    ensure(notModified.body.length === 0, `${record.lessonId} 304 응답에 본문이 있습니다.`);

    const downloadStatuses = {};
    if (record.sequence === 1) {
      for (const filename of manifest.downloadAssets) {
        const url = `${origin}/edu-materials/lesson-bundles/${record.lessonId}/download/${filename}/`;
        const download = await getResponse(url);
        ensureStatus(download, 200, `${record.lessonId} ${filename} 다운로드`);
        downloadStatuses[filename] = download.response.status;
      }
    }

    records.push({
      sequence: record.sequence,
      lessonId: record.lessonId,
      digest: record.digest,
      productionRecordId: record.localRecordId,
      publicUrl: record.detailUrl,
      runUrl: record.runUrl,
      worksheetUrl,
      representativeAssetUrl,
      statuses: Object.fromEntries(REQUIRED_STATUSES.map((name) => [name, results[name].response.status])),
      etag304: true,
      etagSource: edgeEtag ? "response-header" : "computed-runtime-sha256",
      edgeEtagVisible: Boolean(edgeEtag),
      downloadStatuses,
    });
  }

  return {
    schemaVersion: 1,
    seriesId: seriesManifest.seriesId,
    verifiedAt,
    commitHash,
    baseUrl: origin,
    catalogUrl,
    catalogStatus: catalog.response.status,
    anonymousAccess: "production-passed",
    verified: records.length,
    publication: {
      created: publication.created,
      updated: publication.updated,
      published: publication.published,
      teacher: publication.teacher,
      category: publication.category,
      pptStatus: publication.pptStatus,
    },
    records,
  };
}

function validateProductionVerification(verification) {
  ensure(verification?.schemaVersion === 1, "지원하지 않는 운영 검증 스키마입니다.");
  ensure(verification.seriesId === seriesManifest.seriesId, "운영 검증 시리즈 ID가 다릅니다.");
  ensure(verification.anonymousAccess === "production-passed", "운영 비로그인 접근이 통과하지 않았습니다.");
  ensure(verification.catalogStatus === 200, "운영 목록 상태가 200이 아닙니다.");
  ensure(verification.verified === 30, "운영 검증 완료 수가 30이 아닙니다.");
  ensure(Array.isArray(verification.records) && verification.records.length === 30, "운영 검증 레코드는 정확히 30개여야 합니다.");
  const expected = new Map(seriesManifest.records.map((record) => [record.lessonId, record]));
  const ids = new Set();
  const urls = new Set();
  for (const record of verification.records) {
    const planned = expected.get(record.lessonId);
    ensure(planned && planned.sequence === record.sequence, `${record.lessonId} 운영 순번이 다릅니다.`);
    ensure(planned.digest === record.digest, `${record.lessonId} 운영 지문이 다릅니다.`);
    ensure(isUuid(record.productionRecordId), `${record.lessonId} 운영 레코드 ID가 잘못되었습니다.`);
    ensure(record.publicUrl.startsWith("https://"), `${record.lessonId} 운영 URL이 HTTPS가 아닙니다.`);
    ensure(record.etag304 === true, `${record.lessonId} 운영 ETag 검증이 실패했습니다.`);
    for (const name of REQUIRED_STATUSES) ensure(record.statuses?.[name] === 200, `${record.lessonId} ${name} 상태가 200이 아닙니다.`);
    ensure(!ids.has(record.productionRecordId), `${record.lessonId} 운영 레코드 ID가 중복되었습니다.`);
    ensure(!urls.has(record.publicUrl), `${record.lessonId} 운영 URL이 중복되었습니다.`);
    ids.add(record.productionRecordId);
    urls.add(record.publicUrl);
  }
  return verification;
}

function applyProductionVerificationToTracker(sourceTracker, verification, now = verification.verifiedAt) {
  validateProductionVerification(verification);
  ensure(Number.isFinite(Date.parse(now)), "운영 기록 시각이 ISO 시각이 아닙니다.");
  const tracker = clone(sourceTracker);
  const byLessonId = new Map(verification.records.map((record) => [record.lessonId, record]));
  for (const bundle of tracker.bundles) {
    const record = byLessonId.get(bundle.lessonId);
    ensure(record, `${bundle.lessonId} 운영 검증 레코드가 없습니다.`);
    bundle.eduitit = {
      ...bundle.eduitit,
      digest: record.digest,
      anonymousAccessStatus: "production-passed",
      productionStatus: "deployed",
      publicUrl: record.publicUrl,
      validatedAt: now,
    };
  }
  tracker.updatedAt = now;
  tracker.history.push({
    at: now,
    sequence: null,
    event: "Eduitit 운영 공개·비로그인 검증 30개 완료",
    detail: "운영 수업 꾸러미 30개를 게시하고 목록·상세·실행·렌더·썸네일·대표 이미지·활동지 다운로드와 ETag 304를 비로그인 외부 HTTP로 검증했다. Claude PPTX와 커뮤니티·나의 레이스 등록은 별도 상태로 유지했다.",
  });
  return tracker;
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
    publicationPath: "",
    verificationPath: "",
    trackerPath: DEFAULT_TRACKER_PATH,
    dashboardPath: DEFAULT_DASHBOARD_PATH,
    evidencePath: DEFAULT_EVIDENCE_PATH,
    baseUrl: DEFAULT_BASE_URL,
    commitHash: "",
    eduititRoot: "",
  };
  while (argv.length) {
    const token = argv.shift();
    if (token === "--publication") options.publicationPath = path.resolve(argv.shift() || "");
    else if (token === "--verification-json") options.verificationPath = path.resolve(argv.shift() || "");
    else if (token === "--tracker") options.trackerPath = path.resolve(argv.shift() || "");
    else if (token === "--dashboard") options.dashboardPath = path.resolve(argv.shift() || "");
    else if (token === "--evidence") options.evidencePath = path.resolve(argv.shift() || "");
    else if (token === "--base-url") options.baseUrl = argv.shift() || "";
    else if (token === "--commit") options.commitHash = argv.shift() || "";
    else if (token === "--eduitit-root") {
      const value = argv.shift();
      ensure(value, "--eduitit-root 뒤에 경로를 입력하세요.");
      options.eduititRoot = path.resolve(value);
    }
    else throw new Error(`알 수 없는 옵션입니다: ${token}`);
  }
  ensure(options.verificationPath || options.publicationPath, "--publication 또는 --verification-json이 필요합니다.");
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const verification = options.verificationPath
    ? validateProductionVerification(JSON.parse(fs.readFileSync(options.verificationPath, "utf8")))
    : await verifyProductionHttp(
      validatePublication(JSON.parse(fs.readFileSync(options.publicationPath, "utf8")), options.baseUrl),
      { baseUrl: options.baseUrl, commitHash: options.commitHash },
    );
  const loaded = loadTracker(options.trackerPath);
  const tracker = applyProductionVerificationToTracker(loaded.tracker, verification);
  const validated = validateTracker(tracker, {
    trackerPath: loaded.trackerPath,
    roots: options.eduititRoot ? { eduitit: options.eduititRoot } : {},
  });
  writeAtomic(options.evidencePath, `${JSON.stringify(verification, null, 2)}\n`);
  writeAtomic(loaded.trackerPath, `${JSON.stringify(tracker, null, 2)}\n`);
  writeDashboard(validated, options.dashboardPath);
  const submissionRegister = writeSubmissionRegister(tracker);
  process.stdout.write(`${JSON.stringify({
    verifiedAt: verification.verifiedAt,
    evidencePath: options.evidencePath,
    dashboardPath: options.dashboardPath,
    submissionRegisterJsonPath: submissionRegister.jsonPath,
    submissionRegisterMarkdownPath: submissionRegister.markdownPath,
    catalogUrl: verification.catalogUrl,
    ...summarizeTracker(validated),
  }, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exit(1);
  });
}

module.exports = {
  DEFAULT_EVIDENCE_PATH,
  REQUIRED_STATUSES,
  applyProductionVerificationToTracker,
  validateProductionVerification,
  validatePublication,
  verifyProductionHttp,
};
