"use strict";

const LAYOUT_CONTRACT_VERSION = 1;

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

const LESSON_LAYOUT = deepFreeze({
  slide: {
    width: 13.333,
    frameLeft: 0.42,
    frameRight: 12.91,
    footerTop: 6.72,
  },
  twoColumnActivity: {
    title: { x: 1.02, y: 1.18, w: 5.8, h: 1.05 },
    legend: { x: 1.1, y: 2.52, h: 0.72, w: 3.1, pairW: 3.55 },
    rows: { x: 1.18, y: 3.64, lineW: 5.0 },
    card: { x: 6.82, y: 2.52, w: 4.98, h: 3.72 },
    cardHeading: { insetX: 0.42, offsetY: 0.4, insetRight: 0.42, h: 0.32 },
    prompt: { dotInsetX: 0.38, textInsetX: 0.92, startOffsetY: 1.15, stepY: 0.82 },
    minimums: {
      outerInset: 0.58,
      titleToBody: 0.28,
      legendToRows: 0.38,
      columnGap: 0.55,
      rightInset: 0.75,
      bodyToFooter: 0.42,
    },
  },
  summary: {
    leftContentRight: 8.12,
    card: { x: 8.58, y: 2.18, w: 3.55, h: 3.45 },
    label: { x: 8.95, y: 2.62, w: 2.81, h: 0.28 },
    question: { x: 8.95, y: 3.36, w: 2.81, h: 1.62, fontSize: 18 },
    minimums: { columnGap: 0.4, rightInset: 0.75, innerInset: 0.32 },
  },
});

function ensure(condition, message) {
  if (!condition) throw new Error(`레이아웃 계약 위반: ${message}`);
}

function atLeast(actual, minimum) {
  return actual + 0.0001 >= minimum;
}

function atMost(actual, maximum) {
  return actual - 0.0001 <= maximum;
}

function assertLessonLayout(layout = LESSON_LAYOUT) {
  const { slide, twoColumnActivity: activity, summary } = layout;
  const min = activity.minimums;
  const titleBottom = activity.title.y + activity.title.h;
  const firstBodyTop = Math.min(activity.legend.y, activity.card.y);
  const legendBottom = activity.legend.y + activity.legend.h;
  const rowsRight = activity.rows.x + activity.rows.lineW;
  const cardRight = activity.card.x + activity.card.w;
  const cardBottom = activity.card.y + activity.card.h;

  ensure(atLeast(activity.title.x - slide.frameLeft, min.outerInset), "활동 제목의 왼쪽 바깥 여백이 부족합니다.");
  ensure(atLeast(activity.legend.x - slide.frameLeft, min.outerInset), "범례의 왼쪽 바깥 여백이 부족합니다.");
  ensure(atLeast(activity.rows.x - slide.frameLeft, min.outerInset), "그림그래프의 왼쪽 바깥 여백이 부족합니다.");
  ensure(atLeast(firstBodyTop - titleBottom, min.titleToBody), "제목과 첫 활동 요소 사이의 세로 간격이 부족합니다.");
  ensure(atLeast(activity.rows.y - legendBottom, min.legendToRows), "범례와 그림그래프 사이의 세로 간격이 부족합니다.");
  ensure(atLeast(activity.card.x - rowsRight, min.columnGap), "왼쪽 그림그래프와 오른쪽 안내 카드 사이의 열 간격이 부족합니다.");
  ensure(atLeast(slide.frameRight - cardRight, min.rightInset), "오른쪽 안내 카드의 바깥 여백이 부족합니다.");
  ensure(atLeast(slide.footerTop - cardBottom, min.bodyToFooter), "안내 카드와 하단 정보 사이의 여백이 부족합니다.");

  const summaryCardRight = summary.card.x + summary.card.w;
  ensure(atLeast(summary.card.x - summary.leftContentRight, summary.minimums.columnGap), "정리 목록과 다음 차시 카드 사이의 열 간격이 부족합니다.");
  ensure(atLeast(slide.frameRight - summaryCardRight, summary.minimums.rightInset), "다음 차시 카드의 오른쪽 바깥 여백이 부족합니다.");
  for (const [name, box] of [["라벨", summary.label], ["질문", summary.question]]) {
    ensure(atLeast(box.x - summary.card.x, summary.minimums.innerInset), `다음 차시 ${name}의 왼쪽 안쪽 여백이 부족합니다.`);
    ensure(atLeast(summaryCardRight - (box.x + box.w), summary.minimums.innerInset), `다음 차시 ${name}의 오른쪽 안쪽 여백이 부족합니다.`);
    ensure(atMost(box.y + box.h, summary.card.y + summary.card.h), `다음 차시 ${name}이 카드 아래로 넘칩니다.`);
  }
  return true;
}

module.exports = {
  LAYOUT_CONTRACT_VERSION,
  LESSON_LAYOUT,
  assertLessonLayout,
};
