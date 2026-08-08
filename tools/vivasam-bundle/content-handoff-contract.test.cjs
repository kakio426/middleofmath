"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const lesson = require("./lesson-pictograph.cjs");
const { SERIES_TARGET_COUNT, buildContentHandoff } = require("./build-content-handoff.cjs");
const { assertContentHandoffContract } = require("./validate-content-handoff.cjs");
const { SERIES_PRODUCTION, assertSeriesProductionContract } = require("./series-production-contract.cjs");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("Claude 전달용 내용 원고는 한 PPT의 화면 내용만 담는다", () => {
  const handoff = buildContentHandoff(lesson);
  assert.equal(SERIES_TARGET_COUNT, 30);
  assert.equal(Object.hasOwn(handoff, "seriesTargetCount"), false);
  assert.equal(handoff.slides.length, 11);
  assert.equal(handoff.lesson.slideCount, 11);
  assert.equal(handoff.slides.reduce((sum, slide) => sum + slide.minutes, 0), 40);
  assert.equal(assertContentHandoffContract(handoff), true);
});

test("내용 원고에는 제작 지시 필드를 넣을 수 없다", () => {
  const handoff = buildContentHandoff(lesson);
  handoff.slides[0].layout = "two-column";
  assert.throws(() => assertContentHandoffContract(handoff), /허용되지 않은|제작 지시 필드/);
});

test("Claude용 파일에 발표자 노트·활동지·정답 정보를 섞으면 차단한다", () => {
  for (const [key, value] of [
    ["presenterNotes", { lessonIntent: "의도" }],
    ["worksheet", { file: "activity.png" }],
    ["answerKey", "정답"],
  ]) {
    const handoff = buildContentHandoff(lesson);
    handoff.slides[0][key] = value;
    assert.throws(() => assertContentHandoffContract(handoff), /허용되지 않은/);
  }
});

test("원본 스키마의 줄바꿈은 내용 원고 제목에서 제거한다", () => {
  const handoff = buildContentHandoff(clone(lesson));
  assert.equal(handoff.slides[5].title, "귤 수와 두 줄의 차이를 구해요");
  assert.ok(handoff.slides.every((slide) => !slide.title.includes("\n")));
});

test("차시 내용에 따라 슬라이드 수를 가변적으로 선언할 수 있다", () => {
  const shorterLesson = clone(lesson);
  const removed = shorterLesson.slides.pop();
  shorterLesson.durationMinutes -= removed.minutes;
  const handoff = buildContentHandoff(shorterLesson);
  assert.equal(handoff.lesson.slideCount, 10);
  assert.equal(handoff.slides.length, 10);
  assert.equal(assertContentHandoffContract(handoff), true);
});

test("내부 생산 하네스는 PPT 30개와 통합 활동지 30개를 추적한다", () => {
  const progress = assertSeriesProductionContract(SERIES_PRODUCTION);
  assert.equal(SERIES_PRODUCTION.targetDeckCount, 30);
  assert.equal(SERIES_PRODUCTION.preferredSlidesPerDeck, 11);
  assert.equal(SERIES_PRODUCTION.slideCountIsFlexible, true);
  assert.equal(SERIES_PRODUCTION.worksheetsPerDeck, 1);
  assert.equal(SERIES_PRODUCTION.targetWorksheetCount, 30);
  assert.equal(SERIES_PRODUCTION.slotCount, 30);
  assert.equal(progress.registeredDeckCount, 30);
  assert.equal(progress.remainingDeckCount, 0);
  assert.equal(progress.plannedWorksheetCount, 30);
  assert.equal(progress.validatedWorksheetCount, 6);
  assert.equal(progress.remainingValidatedWorksheetCount, 24);
  assert.equal(progress.claudePptsValidated, 0);
  assert.equal(progress.fullyCompleted, 0);
});
