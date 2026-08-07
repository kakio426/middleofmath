"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { LESSON_LAYOUT, assertLessonLayout } = require("./layout-contract.cjs");
const {
  SUMMARY_NEXT_QUESTION_FLOW,
  assertKoreanTextFlow,
  wrapKoreanWords,
} = require("./korean-text-flow.cjs");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("공통 수업 슬라이드 레이아웃은 모든 최소 간격을 통과한다", () => {
  assert.equal(assertLessonLayout(LESSON_LAYOUT), true);
});

test("왼쪽 바깥 여백이 줄어들면 레이아웃 하네스가 차단한다", () => {
  const invalid = clone(LESSON_LAYOUT);
  invalid.twoColumnActivity.rows.x = 0.7;
  assert.throws(() => assertLessonLayout(invalid), /왼쪽 바깥 여백/);
});

test("제목·범례·그래프의 세로 간격이 붙으면 레이아웃 하네스가 차단한다", () => {
  const invalidTitleGap = clone(LESSON_LAYOUT);
  invalidTitleGap.twoColumnActivity.legend.y = 2.28;
  assert.throws(() => assertLessonLayout(invalidTitleGap), /제목과 첫 활동 요소/);

  const invalidRowsGap = clone(LESSON_LAYOUT);
  invalidRowsGap.twoColumnActivity.rows.y = 3.4;
  assert.throws(() => assertLessonLayout(invalidRowsGap), /범례와 그림그래프/);
});

test("좌우 열이 가까워지면 레이아웃 하네스가 차단한다", () => {
  const invalid = clone(LESSON_LAYOUT);
  invalid.twoColumnActivity.card.x = 6.45;
  assert.throws(() => assertLessonLayout(invalid), /열 간격/);
});

test("긴 한국어 질문은 어절을 보존한 명시적 네 줄로 배치한다", () => {
  const source = "표의 수를 그림그래프로 바꾸려면 어떤 범례가 좋을까요?";
  assert.deepEqual(wrapKoreanWords(source, SUMMARY_NEXT_QUESTION_FLOW), [
    "표의 수를",
    "그림그래프로",
    "바꾸려면 어떤",
    "범례가 좋을까요?",
  ]);
});

test("한 어절을 줄 중간에서 자르면 한국어 줄바꿈 하네스가 차단한다", () => {
  const source = "표의 수를 그림그래프로 바꾸려면 어떤 범례가 좋을까요?";
  assert.throws(
    () => assertKoreanTextFlow(source, ["표의 수를 그림그", "래프로 바꾸려면", "어떤 범례가", "좋을까요?"], SUMMARY_NEXT_QUESTION_FLOW),
    /어절이 줄 중간/,
  );
});

test("마지막 줄이 짧으면 필요한 만큼 여러 어절을 옮겨 균형을 맞춘다", () => {
  const lines = wrapKoreanWords("줄과 칸으로 전체 수 찾기", {
    maxCharactersPerLine: 11,
    maxLines: 2,
    minLastLineCharacters: 4,
  });

  assert.deepEqual(lines, ["줄과 칸으로", "전체 수 찾기"]);
});
