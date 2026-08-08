"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const tracker = require("./series-tracker.json");
const seriesManifest = require("../../artifacts/vivasam/non-ppt-series-manifest.json");
const {
  REQUIRED_STATUSES,
  applyProductionVerificationToTracker,
  validateProductionVerification,
  validatePublication,
} = require("./record-series-production-status.cjs");
const { applyVerificationToTracker } = require("./record-series-non-ppt-status.cjs");
const { summarizeTracker, validateTracker } = require("./track-series.cjs");

const trackerPath = path.join(__dirname, "series-tracker.json");

function publicationFixture() {
  return {
    validated: seriesManifest.records.length,
    published: seriesManifest.records.length,
    created: seriesManifest.records.length,
    updated: 0,
    teacher: "eduitit_curriculum_lab",
    category: "lesson_bundle",
    anonymousAccess: "requires-http-tests",
    pptStatus: "available",
    records: seriesManifest.records.map((record) => {
      const id = `00000000-0000-4000-8000-${String(record.sequence).padStart(12, "0")}`;
      const detailPath = `/edu-materials/${id}/`;
      return {
        sequence: record.sequence,
        lessonId: record.lessonId,
        digest: record.digest,
        localRecordId: id,
        detailPath,
        runPath: `${detailPath}run/`,
        detailUrl: `https://eduitit.site${detailPath}`,
        runUrl: `https://eduitit.site${detailPath}run/`,
      };
    }),
  };
}

function verificationFixture() {
  const publication = publicationFixture();
  return {
    schemaVersion: 1,
    seriesId: tracker.seriesId,
    verifiedAt: "2026-08-07T11:45:00.000Z",
    commitHash: "142e25ae027951847cf37d82d24f8d6b62817662",
    baseUrl: "https://eduitit.site",
    catalogUrl: "https://eduitit.site/edu-materials/?category=lesson_bundle",
    catalogStatus: 200,
    anonymousAccess: "production-passed",
    verified: seriesManifest.records.length,
    publication: { created: seriesManifest.records.length, updated: 0, published: seriesManifest.records.length, teacher: publication.teacher, category: publication.category, pptStatus: publication.pptStatus },
    records: publication.records.map((record) => ({
      sequence: record.sequence,
      lessonId: record.lessonId,
      digest: record.digest,
      productionRecordId: record.localRecordId,
      publicUrl: record.detailUrl,
      runUrl: record.runUrl,
      worksheetUrl: `https://eduitit.site/worksheet/${record.lessonId}`,
      representativeAssetUrl: `https://eduitit.site/representative/${record.lessonId}`,
      statuses: Object.fromEntries(REQUIRED_STATUSES.map((name) => [name, 200])),
      etag304: true,
      downloadStatuses: {},
    })),
  };
}

function receivedTrackerFixture() {
  return applyVerificationToTracker(tracker, {
    schemaVersion: 1,
    seriesId: tracker.seriesId,
    verified: seriesManifest.records.length,
    anonymousAccess: "local-passed",
    catalogPath: "/edu-materials/?category=lesson_bundle",
    catalogStatus: 200,
    records: seriesManifest.records.map((record) => ({
      sequence: record.sequence,
      lessonId: record.lessonId,
      digest: record.digest,
      localRecordId: `00000000-0000-4000-8000-${String(record.sequence).padStart(12, "0")}`,
      etag304: true,
      statuses: { detail: 200, run: 200, render: 200, thumbnail: 200, worksheet: 200, ppt: 200 },
    })),
  }, "2026-08-07T11:30:00.000Z");
}

test("운영 게시 결과는 PPT 수령분의 고유 HTTPS URL과 현재 패키지 지문을 가져야 한다", () => {
  const publication = publicationFixture();
  assert.equal(validatePublication(publication), publication);
  for (const mutate of [
    (payload) => { payload.published -= 1; },
    (payload) => { payload.records[0].digest = "000000000000"; },
    (payload) => { payload.records[1].detailUrl = payload.records[0].detailUrl; },
    (payload) => { payload.records[0].detailUrl = payload.records[0].detailUrl.replace("https://", "http://"); },
  ]) {
    const broken = publicationFixture();
    mutate(broken);
    assert.throws(() => validatePublication(broken), /Eduitit 운영 공개 검증 오류/);
  }
});

test("운영 비로그인 검증은 PPT 수령분만 원장에 기록한다", () => {
  const verification = verificationFixture();
  assert.equal(validateProductionVerification(verification), verification);
  const updated = applyProductionVerificationToTracker(receivedTrackerFixture(), verification);
  const validated = validateTracker(updated, { trackerPath });
  const summary = summarizeTracker(validated);
  assert.equal(summary.productionPublished, 6);
  assert.equal(summary.localAnonymousAccessPassed, 6);
  assert.equal(summary.claudePptsAwaiting, 0);
  assert.equal(summary.claudePptsValidated, 0);
  assert.equal(summary.communityPosts, 0);
  assert.equal(summary.raceRecords, 0);
  for (const bundle of validated.bundles.slice(0, 6)) {
    assert.equal(bundle.eduitit.productionStatus, "deployed");
    assert.equal(bundle.eduitit.anonymousAccessStatus, "production-passed");
    assert.match(bundle.eduitit.publicUrl, /^https:\/\/eduitit\.site\/edu-materials\//);
    assert.equal(bundle.ppt.status, "received");
  }
  for (const bundle of validated.bundles.slice(6)) {
    assert.equal(bundle.eduitit.productionStatus, "not-deployed");
    assert.equal(bundle.eduitit.anonymousAccessStatus, "not-tested");
    assert.equal(bundle.eduitit.publicUrl, "");
    assert.equal(bundle.ppt.status, "received");
    assert.equal(bundle.ppt.format, "html");
    assert.equal(bundle.ppt.slideCount, 12);
  }
});

test("운영 상태·ETag·대표 이미지 중 하나라도 실패하면 기록하지 않는다", () => {
  for (const mutate of [
    (payload) => { payload.catalogStatus = 302; },
    (payload) => { payload.records[0].etag304 = false; },
    (payload) => { payload.records[0].statuses.representativeAsset = 404; },
    (payload) => { payload.records.pop(); payload.verified -= 1; },
  ]) {
    const broken = verificationFixture();
    mutate(broken);
    assert.throws(() => validateProductionVerification(broken), /Eduitit 운영 공개 검증 오류/);
  }
});
