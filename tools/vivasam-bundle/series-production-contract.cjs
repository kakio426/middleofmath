"use strict";

const path = require("node:path");

const tracker = require("./series-tracker.json");
const { deriveStage, summarizeTracker, validateTracker } = require("./track-series.cjs");

const TRACKER_PATH = path.join(__dirname, "series-tracker.json");
const initialValidation = validateTracker(tracker, { trackerPath: TRACKER_PATH, checkArtifacts: false });

const SERIES_PRODUCTION = Object.freeze({
  targetDeckCount: tracker.contract.targetDeckCount,
  preferredSlidesPerDeck: tracker.contract.preferredSlidesPerDeck,
  slideCountIsFlexible: tracker.contract.slideCountIsFlexible,
  worksheetsPerDeck: tracker.contract.worksheetsPerDeck,
  targetWorksheetCount: tracker.contract.targetWorksheetCount,
  slotCount: tracker.bundles.length,
  trackerPath: TRACKER_PATH,
  bundles: Object.freeze(initialValidation.bundles.filter((bundle) => bundle.lessonId).map((bundle) => Object.freeze({
    sequence: bundle.sequence,
    lessonId: bundle.lessonId,
    declaredSlideCount: bundle.declaredSlideCount,
    worksheetFile: bundle.worksheet.filename,
    status: deriveStage(bundle),
  }))),
});

function ensure(condition, message) {
  if (!condition) throw new Error(`30개 시리즈 계약 위반: ${message}`);
}

function assertSeriesProductionContract(plan = SERIES_PRODUCTION) {
  ensure(plan.targetDeckCount === 30, "PPT 목표가 30개가 아닙니다.");
  ensure(plan.preferredSlidesPerDeck === 11, "PPT 한 개의 기준 슬라이드 수가 약 11장이 아닙니다.");
  ensure(plan.slideCountIsFlexible === true, "슬라이드 수가 가변으로 열려 있지 않습니다.");
  ensure(plan.worksheetsPerDeck === 1, "PPT 한 개당 통합 활동지가 1개가 아닙니다.");
  ensure(plan.targetWorksheetCount === 30, "전체 통합 활동지 목표가 30개가 아닙니다.");
  ensure(plan.slotCount === 30, "영구 추적 슬롯이 정확히 30개가 아닙니다.");

  const validated = validateTracker(tracker, { trackerPath: TRACKER_PATH, checkArtifacts: false });
  const summary = summarizeTracker(validated);
  const plannedWorksheetCount = validated.bundles.filter((bundle) => bundle.worksheet.filename).length;
  return {
    registeredDeckCount: summary.registeredLessons,
    remainingDeckCount: plan.targetDeckCount - summary.registeredLessons,
    plannedWorksheetCount,
    validatedWorksheetCount: summary.worksheetsValidated,
    remainingValidatedWorksheetCount: plan.targetWorksheetCount - summary.worksheetsValidated,
    claudePptsValidated: summary.claudePptsValidated,
    fullyCompleted: summary.fullyCompleted,
  };
}

module.exports = { SERIES_PRODUCTION, TRACKER_PATH, assertSeriesProductionContract };
