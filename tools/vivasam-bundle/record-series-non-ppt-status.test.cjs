"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const tracker = require("./series-tracker.json");
const seriesManifest = require("../../artifacts/vivasam/non-ppt-series-manifest.json");
const {
  applyVerificationToTracker,
  validateVerification,
} = require("./record-series-non-ppt-status.cjs");
const { summarizeTracker, validateTracker } = require("./track-series.cjs");

const trackerPath = path.join(__dirname, "series-tracker.json");

function verificationFixture() {
  return {
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
      statuses: {
        detail: 200,
        run: 200,
        render: 200,
        thumbnail: 200,
        worksheet: 200,
        ppt: 200,
      },
    })),
  };
}

test("PPT 수령분만 활동지와 Eduitit 익명 공개 결과로 기록한다", () => {
  const verification = verificationFixture();
  assert.equal(validateVerification(verification), verification);
  const updated = applyVerificationToTracker(tracker, verification, "2026-08-07T11:30:00.000Z");
  const validated = validateTracker(updated, { trackerPath });
  const summary = summarizeTracker(validated);

  assert.equal(summary.worksheetsValidated, 6);
  assert.equal(summary.supportValidated, 6);
  assert.equal(summary.packagesValidated, 6);
  assert.equal(summary.localRecordsPublished, 6);
  assert.equal(summary.claudePptsAwaiting, 24);
  assert.equal(summary.claudePptsValidated, 0);
  assert.equal(summary.productionPublished, 6);

  for (const bundle of validated.bundles.slice(0, 6)) {
    assert.equal(bundle.worksheet.status, "validated");
    assert.match(bundle.worksheet.sourcePath, /-worksheet\.prompt\.txt$/);
    assert.doesNotMatch(bundle.worksheet.sourcePath, /\.svg$/i);
    assert.ok(fs.existsSync(bundle.worksheet.sourcePath.replace("middleofmath:", path.resolve(__dirname, "../..") + path.sep)));
    assert.ok(fs.existsSync(bundle.worksheet.pngPath.replace("middleofmath:", path.resolve(__dirname, "../..") + path.sep)));
    assert.equal(bundle.support.intentStatus, "validated");
    assert.equal(bundle.support.answerKeyStatus, "validated");
    assert.equal(bundle.support.representativeImageStatus, "validated");
    assert.equal(bundle.eduitit.packageStatus, "validated");
    assert.equal(bundle.eduitit.localRecordStatus, "published");
    assert.equal(bundle.eduitit.anonymousAccessStatus, "production-passed");
    assert.equal(bundle.eduitit.productionStatus, "deployed");
    assert.match(bundle.eduitit.publicUrl, /^https:\/\/eduitit\.site\/edu-materials\//);
    assert.equal(bundle.ppt.status, "received");
    assert.equal(bundle.ppt.slideCount, 12);
  }
  for (const bundle of validated.bundles.slice(6)) {
    assert.equal(bundle.worksheet.status, "not-started");
    assert.equal(bundle.support.intentStatus, "not-started");
    assert.equal(bundle.eduitit.packageStatus, "not-started");
    assert.equal(bundle.eduitit.localRecordStatus, "unpublished");
    assert.equal(bundle.eduitit.productionStatus, "not-deployed");
    assert.equal(bundle.ppt.status, "awaiting-claude");
  }
});

test("익명 접근 상태·ETag·30개 고유 레코드가 하나라도 틀리면 기록을 막는다", () => {
  for (const mutate of [
    (payload) => { payload.catalogStatus = 302; },
    (payload) => { payload.records[0].etag304 = false; },
    (payload) => { payload.records[1].lessonId = payload.records[0].lessonId; },
    (payload) => { payload.records.pop(); payload.verified -= 1; },
  ]) {
    const payload = verificationFixture();
    mutate(payload);
    assert.throws(() => validateVerification(payload), /Eduitit 공개 검증 오류/);
  }
});
