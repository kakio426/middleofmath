"use strict";

// Canonical mapping verified against the Bisang teacher editions for grades 3-1
// and 3-2. Generated lesson packages must derive their unit and provenance from
// this file instead of the older broad topic labels in individual lesson schemas.
const CURRICULUM_ALIGNMENTS = Object.freeze([
  { sequence: 1, lessonId: "g3s2-pictograph-legend", semester: 2, unitNumber: 6, unitTitle: "그림그래프", alignmentType: "exact", standardCodes: ["4수04-01"], lessonRange: "3차시", lessonTitle: "그림그래프로 나타내고 해석해 볼까요?", textbookPages: { start: 137, end: 141 }, usageNote: "그림 수에 범례를 적용해 실제 수량과 차이를 해석한다." },
  { sequence: 2, lessonId: "g3s1-multiplication-groups-model", semester: 1, unitNumber: 4, unitTitle: "곱셈", alignmentType: "connection", standardCodes: ["4수01-04"], lessonRange: "1차시 단원 도입~2차시 전", lessonTitle: "두 자리 수의 곱셈 전 선수 개념 확인", textbookPages: { start: 86, end: 89 }, usageNote: "한 묶음 수와 묶음 수를 곱으로 나타내는 감각을 도입 전 진단·복습에 활용한다." },
  { sequence: 3, lessonId: "g3s1-multiplication-array-transfer", semester: 1, unitNumber: 4, unitTitle: "곱셈", alignmentType: "connection", standardCodes: ["4수01-04"], lessonRange: "1차시 단원 도입~2차시 전", lessonTitle: "두 자리 수의 곱셈 전 선수 개념 확인", textbookPages: { start: 86, end: 89 }, usageNote: "배열을 곱셈식으로 읽는 감각을 확인한 뒤 자릿값 곱셈으로 이어 간다." },
  { sequence: 4, lessonId: "g3s1-multiplication-place-value-model", semester: 1, unitNumber: 4, unitTitle: "곱셈", alignmentType: "exact", standardCodes: ["4수01-04"], lessonRange: "3차시", lessonTitle: "(몇십몇)×(몇)을 구해 볼까요?(1)", textbookPages: { start: 90, end: 91 }, usageNote: "받아올림이 없는 두 자리 수를 십과 일로 나누어 부분곱을 만든다." },
  { sequence: 5, lessonId: "g3s1-multiplication-place-value-context", semester: 1, unitNumber: 4, unitTitle: "곱셈", alignmentType: "exact", standardCodes: ["4수01-04"], lessonRange: "3차시", lessonTitle: "(몇십몇)×(몇)을 구해 볼까요?(1)", textbookPages: { start: 90, end: 91 }, usageNote: "자릿값을 보존해 만든 부분곱을 더하는 원리를 생활 맥락에 적용한다." },
  { sequence: 6, lessonId: "g3s1-division-equal-sharing", semester: 1, unitNumber: 3, unitTitle: "나눗셈", alignmentType: "exact", standardCodes: ["4수01-05"], lessonRange: "2차시", lessonTitle: "똑같이 나누어 볼까요?", textbookPages: { start: 62, end: 65 }, usageNote: "전체를 같은 수의 묶음에 똑같이 나누며 한 묶음의 수를 구한다." },
  { sequence: 7, lessonId: "g3s1-division-missing-factor", semester: 1, unitNumber: 3, unitTitle: "나눗셈", alignmentType: "exact", standardCodes: ["4수01-05", "4수01-06"], lessonRange: "6차시", lessonTitle: "나눗셈의 몫을 곱셈식으로 구해 볼까요?", textbookPages: { start: 77, end: 79 }, usageNote: "곱셈식의 빈 요인을 찾아 몫을 구하고 관련 나눗셈식으로 확인한다." },
  { sequence: 8, lessonId: "g3s1-division-fact-family", semester: 1, unitNumber: 3, unitTitle: "나눗셈", alignmentType: "exact", standardCodes: ["4수01-05"], lessonRange: "5차시", lessonTitle: "곱셈과 나눗셈의 관계를 알아볼까요?", textbookPages: { start: 74, end: 76 }, usageNote: "하나의 곱셈식에서 관련된 두 나눗셈식을 만든다." },
  { sequence: 9, lessonId: "g3s1-division-group-count", semester: 1, unitNumber: 3, unitTitle: "나눗셈", alignmentType: "exact", standardCodes: ["4수01-05", "4수01-06"], lessonRange: "6차시", lessonTitle: "나눗셈의 몫을 곱셈식으로 구해 볼까요?", textbookPages: { start: 77, end: 79 }, usageNote: "몇 묶음인지 묻는 몫을 곱셈 사실로 확인한다." },
  { sequence: 10, lessonId: "g3s1-fraction-equal-parts", semester: 1, unitNumber: 6, unitTitle: "분수와 소수", alignmentType: "exact", standardCodes: ["4수01-09"], lessonRange: "2차시", lessonTitle: "똑같이 나누어 볼까요?", textbookPages: { start: 132, end: 133 }, usageNote: "조각 수뿐 아니라 전체가 같은 크기로 등분되었는지 판단한다." },
  { sequence: 11, lessonId: "g3s1-fraction-fix-partition", semester: 1, unitNumber: 6, unitTitle: "분수와 소수", alignmentType: "exact", standardCodes: ["4수01-09"], lessonRange: "2차시", lessonTitle: "똑같이 나누어 볼까요?", textbookPages: { start: 132, end: 133 }, usageNote: "잘못 나눈 그림을 고치며 등분할 조건을 설명한다." },
  { sequence: 12, lessonId: "g3s1-fraction-part-whole", semester: 1, unitNumber: 6, unitTitle: "분수와 소수", alignmentType: "exact", standardCodes: ["4수01-09"], lessonRange: "3차시", lessonTitle: "분수를 알아볼까요?(1)", textbookPages: { start: 134, end: 137 }, usageNote: "전체 조각 수와 고른 조각 수를 분모·분자와 연결한다." },
  { sequence: 13, lessonId: "g3s1-fraction-pizza-context", semester: 1, unitNumber: 6, unitTitle: "분수와 소수", alignmentType: "exact", standardCodes: ["4수01-09"], lessonRange: "3차시", lessonTitle: "분수를 알아볼까요?(1)", textbookPages: { start: 134, end: 137 }, usageNote: "생활 그림에서 분수를 쓰고 읽으며 분모와 분자의 뜻을 말한다." },
  { sequence: 14, lessonId: "g3s1-length-centimeter-meter", semester: 1, unitNumber: 5, unitTitle: "길이와 시간", alignmentType: "connection", standardCodes: ["4수03-15"], lessonRange: "2~5차시 전·사이", lessonTitle: "길이 단위 선택 선수 개념 진단", textbookPages: { start: 110, end: 117 }, usageNote: "cm와 m의 선수 감각을 확인하고 mm와 km 학습으로 이어 간다." },
  { sequence: 15, lessonId: "g3s1-length-real-world-units", semester: 1, unitNumber: 5, unitTitle: "길이와 시간", alignmentType: "multi-lesson", standardCodes: ["4수03-15"], lessonRange: "2~5차시", lessonTitle: "길이 단위 학습 종합 적용", textbookPages: { start: 110, end: 117 }, usageNote: "mm, cm, m, km 중 대상 크기에 알맞은 단위를 고르는 종합 적용에 활용한다." },
  { sequence: 16, lessonId: "g3s1-length-unit-conversion", semester: 1, unitNumber: 5, unitTitle: "길이와 시간", alignmentType: "connection", standardCodes: ["4수03-16"], lessonRange: "4차시 전후", lessonTitle: "m보다 큰 단위는 무엇일까요?", textbookPages: { start: 114, end: 115 }, usageNote: "1m=100cm를 복습하면서 1km=1000m 관계로 연결한다." },
  { sequence: 17, lessonId: "g3s2-multiplication-place-value", semester: 2, unitNumber: 1, unitTitle: "곱셈", alignmentType: "multi-lesson", standardCodes: ["4수01-04"], lessonRange: "2~4차시", lessonTitle: "(세 자리 수)×(한 자리 수)", textbookPages: { start: 10, end: 17 }, usageNote: "세 자리 수를 백, 십, 일로 나누어 각 부분곱의 자릿값을 보존한다." },
  { sequence: 18, lessonId: "g3s2-multiplication-combine", semester: 2, unitNumber: 1, unitTitle: "곱셈", alignmentType: "multi-lesson", standardCodes: ["4수01-04"], lessonRange: "2~4차시", lessonTitle: "(세 자리 수)×(한 자리 수)", textbookPages: { start: 10, end: 17 }, usageNote: "여러 받아올림 경우에 공통으로 필요한 부분곱 합치기를 점검한다." },
  { sequence: 19, lessonId: "g3s2-multiplication-two-digit", semester: 2, unitNumber: 1, unitTitle: "곱셈", alignmentType: "multi-lesson", standardCodes: ["4수01-04"], lessonRange: "7~8차시", lessonTitle: "(몇십몇)×(몇십몇)", textbookPages: { start: 22, end: 25 }, usageNote: "두 번째 수를 십과 일로 나누어 두 부분곱을 만든 뒤 더한다." },
  { sequence: 20, lessonId: "g3s2-division-meaning", semester: 2, unitNumber: 2, unitTitle: "나눗셈", alignmentType: "connection", standardCodes: ["4수01-05"], lessonRange: "1차시 단원 도입~2차시 전", lessonTitle: "두 자리 수 나눗셈 전 뜻 진단", textbookPages: { start: 32, end: 35 }, usageNote: "계산 절차 전에 한 묶음의 수와 묶음 수라는 나눗셈의 두 뜻을 진단한다." },
  { sequence: 21, lessonId: "g3s2-division-remainder", semester: 2, unitNumber: 2, unitTitle: "나눗셈", alignmentType: "multi-lesson", standardCodes: ["4수01-06"], lessonRange: "4~7차시", lessonTitle: "나머지가 없는·있는 (몇십몇)÷(몇)", textbookPages: { start: 38, end: 47 }, usageNote: "나머지가 없는 계산에서 10개씩 먼저 나누는 방법을 확인한 뒤, 남은 수도 다시 나누어 몫과 최종 나머지를 구별한다." },
  { sequence: 22, lessonId: "g3s2-division-remainder-check", semester: 2, unitNumber: 2, unitTitle: "나눗셈", alignmentType: "multi-lesson", standardCodes: ["4수01-06"], lessonRange: "6~7차시", lessonTitle: "나머지가 있는 (몇십몇)÷(몇)", textbookPages: { start: 42, end: 47 }, usageNote: "나누는 수×몫+나머지로 결과를 검산하고 나머지의 뜻을 확인한다." },
  { sequence: 23, lessonId: "g3s2-circle-parts", semester: 2, unitNumber: 3, unitTitle: "원", alignmentType: "exact", standardCodes: ["4수03-06"], lessonRange: "2~3차시", lessonTitle: "원의 중심, 반지름, 지름을 알아볼까요?", textbookPages: { start: 64, end: 67 }, usageNote: "중심과 원 위의 점을 직접 짚으며 반지름을 정의한다." },
  { sequence: 24, lessonId: "g3s2-circle-diameter", semester: 2, unitNumber: 3, unitTitle: "원", alignmentType: "exact", standardCodes: ["4수03-06"], lessonRange: "4차시", lessonTitle: "원의 성질을 알아볼까요?", textbookPages: { start: 68, end: 69 }, usageNote: "중심을 지나는 지름이 반지름 두 개의 길이라는 성질을 확인한다." },
  { sequence: 25, lessonId: "g3s2-fraction-part-whole", semester: 2, unitNumber: 4, unitTitle: "분수와 소수", alignmentType: "exact", standardCodes: ["4수01-09"], lessonRange: "2차시", lessonTitle: "분수로 나타내어 볼까요?", textbookPages: { start: 80, end: 81 }, usageNote: "등분된 전체에서 주어진 부분을 분수로 나타낸다." },
  { sequence: 26, lessonId: "g3s2-fraction-convert", semester: 2, unitNumber: 4, unitTitle: "분수와 소수", alignmentType: "exact", standardCodes: ["4수01-10"], lessonRange: "6차시", lessonTitle: "대분수를 알아볼까요?", textbookPages: { start: 88, end: 89 }, usageNote: "가분수 개념을 이어 분모만큼 묶어 대분수로 바꾼다." },
  { sequence: 27, lessonId: "g3s2-fraction-compare", semester: 2, unitNumber: 4, unitTitle: "분수와 소수", alignmentType: "exact", standardCodes: ["4수01-11"], lessonRange: "7차시", lessonTitle: "분모가 같은 분수의 크기를 비교해 볼까요?", textbookPages: { start: 90, end: 91 }, usageNote: "한 조각의 크기가 같을 때 분자와 전체 양의 관계로 비교한다." },
  { sequence: 28, lessonId: "g3s2-capacity-unit", semester: 2, unitNumber: 5, unitTitle: "들이와 무게", alignmentType: "exact", standardCodes: ["4수03-18"], lessonRange: "2차시", lessonTitle: "들이를 비교하고 들이의 단위를 알아볼까요?", textbookPages: { start: 108, end: 110 }, usageNote: "1L=1000mL를 사용해 혼합 단위와 단일 단위를 연결한다." },
  { sequence: 29, lessonId: "g3s2-weight-unit", semester: 2, unitNumber: 5, unitTitle: "들이와 무게", alignmentType: "exact", standardCodes: ["4수03-21"], lessonRange: "6차시", lessonTitle: "무게의 단위를 알아볼까요?", textbookPages: { start: 118, end: 120 }, usageNote: "1kg=1000g을 사용해 몇 kg 몇 g을 g으로 바꾼다." },
  { sequence: 30, lessonId: "g3s2-pictograph-compare", semester: 2, unitNumber: 6, unitTitle: "그림그래프", alignmentType: "exact", standardCodes: ["4수04-01"], lessonRange: "3차시", lessonTitle: "그림그래프로 나타내고 해석해 볼까요?", textbookPages: { start: 137, end: 141 }, usageNote: "그림 개수의 차이가 아니라 범례를 적용한 실제 수량 차이를 구한다." },
].map((item) => Object.freeze({
  curriculumRevision: "2022 개정 교육과정",
  publisher: "비상교육",
  grade: 3,
  ...item,
  standardCodes: Object.freeze([...item.standardCodes]),
  textbookPages: Object.freeze({ ...item.textbookPages }),
})));

const CURRICULUM_ALIGNMENT_BY_ID = Object.freeze(Object.fromEntries(
  CURRICULUM_ALIGNMENTS.map((item) => [item.lessonId, item]),
));

module.exports = {
  CURRICULUM_ALIGNMENTS,
  CURRICULUM_ALIGNMENT_BY_ID,
};
