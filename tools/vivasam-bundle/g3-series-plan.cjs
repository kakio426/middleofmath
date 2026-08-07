"use strict";

const RESERVED_SOURCE_SCOPES = Object.freeze([
  "packages/content/src/grade3-semester1-u8b-draft.ts",
  "packages/content/src/grade4-semester1.ts",
  "packages/content/src/grade4-semester2.ts",
  "packages/content/src/grade5-semester1.ts",
  "packages/content/src/grade5-semester2.ts",
  "packages/content/src/grade6-semester1.ts",
  "packages/content/src/grade6-semester2.ts",
]);

const STRATEGIES = Object.freeze({
  "1:multiplication.equal-groups": {
    hook: "같은 수가 여러 번 보이면 덧셈보다 더 짧게 나타낼 수 있을까요?",
    steps: ["한 묶음의 수 찾기", "묶음 수 찾기", "두 수를 곱셈식으로 나타내기", "단위를 붙여 전체 말하기"],
    rule: "한 묶음의 수 × 묶음 수 = 전체 수",
  },
  "1:multiplication.two-digit-by-one": {
    hook: "23×3에서 2를 그대로 2로 곱하면 왜 답이 작아질까요?",
    steps: ["두 자리 수를 십과 일로 나누기", "각 부분에 한 자리 수 곱하기", "두 부분곱 더하기", "어림으로 답 확인하기"],
    rule: "십의 자리 값과 일의 자리 값을 각각 곱한 뒤 두 부분곱을 더한다.",
  },
  "1:division.equal-partition": {
    hook: "전체를 똑같이 나눌 때 사람 수와 한 사람 몫은 같은 수일까요?",
    steps: ["전체 수 확인하기", "나눌 묶음 수 확인하기", "하나씩 똑같이 나누기", "곱셈으로 몫 확인하기"],
    rule: "전체 ÷ 묶음 수 = 한 묶음의 수",
  },
  "1:division.multiplication-link": {
    hook: "4×6=24 하나만 알아도 나눗셈 두 개를 만들 수 있을까요?",
    steps: ["곱셈식의 전체 찾기", "두 요인 찾기", "전체를 한 요인으로 나누기", "남은 요인을 몫으로 확인하기"],
    rule: "곱셈식의 전체를 한 요인으로 나누면 다른 요인이 된다.",
  },
  "1:fraction.equal-partition": {
    hook: "조각 수만 같으면 크기가 달라도 같은 분수라고 할 수 있을까요?",
    steps: ["전체 하나 확인하기", "조각 크기가 같은지 비교하기", "전체 조각 수 세기", "한 조각이 전체의 얼마인지 말하기"],
    rule: "분수로 나타내려면 전체를 똑같은 크기로 나누어야 한다.",
  },
  "1:fraction.part-of-whole": {
    hook: "분모와 분자는 각각 무엇을 세는 수일까요?",
    steps: ["전체 조각 수 세기", "고른 조각 수 세기", "전체 수를 분모에 쓰기", "고른 수를 분자에 쓰기"],
    rule: "전체 조각 수는 분모, 고른 조각 수는 분자에 쓴다.",
  },
  "1:length.unit-choice": {
    hook: "연필과 교실 문의 길이를 같은 단위로 말하면 편할까요?",
    steps: ["재려는 대상 확인하기", "길이의 크기 어림하기", "mm·cm·m·km 중 고르기", "수와 단위를 함께 말하기"],
    rule: "작은 두께는 mm, 생활 물건은 cm·m, 먼 거리는 km가 알맞다.",
  },
  "1:length.unit-convert": {
    hook: "1m와 100cm는 숫자가 다른데 왜 같은 길이일까요?",
    steps: ["바꿀 단위 관계 쓰기", "몇 배인지 확인하기", "수에 배수를 적용하기", "바뀐 단위로 검산하기"],
    rule: "1m=100cm, 1km=1000m의 관계를 사용한다.",
  },
  "2:multiplication.place-value": {
    hook: "324×3에서 300만 먼저 곱하면 무엇을 알 수 있을까요?",
    steps: ["수의 자릿값 나누기", "각 자릿값에 곱하기", "부분곱 기록하기", "다음 계산과 연결하기"],
    rule: "자릿값을 그대로 살려 각 부분을 곱한다.",
  },
  "2:multiplication.combine": {
    hook: "부분곱을 옆에 붙이는 것과 더하는 것은 왜 다른 결과를 만들까요?",
    steps: ["각 부분곱 확인하기", "같은 전체의 부분인지 확인하기", "부분곱 모두 더하기", "원래 곱셈으로 검산하기"],
    rule: "각 자리에서 만든 부분곱은 이어 붙이지 않고 더한다.",
  },
  "2:multiplication.two-digit": {
    hook: "23×12에서 12를 10과 2로 나누면 계산이 어떻게 보일까요?",
    steps: ["두 번째 수를 십과 일로 나누기", "첫 수에 각각 곱하기", "두 부분곱 더하기", "어림으로 크기 확인하기"],
    rule: "두 자리 수를 십과 일로 나누어 두 부분곱을 빠짐없이 구한다.",
  },
  "2:division.meaning": {
    hook: "24개를 6개씩 묶는 것과 6명에게 나누는 것은 식에서 어떻게 다를까요?",
    steps: ["전체 수 찾기", "한 묶음 수 또는 묶음 수 확인하기", "무엇을 구하는지 말하기", "곱셈으로 확인하기"],
    rule: "나눗셈은 한 묶음의 수나 묶음 수를 구하는 식이다.",
  },
  "2:division.remainder": {
    hook: "먼저 같은 수만큼 나누고 남은 것은 어디에 기록해야 할까요?",
    steps: ["먼저 나누어 준 전체 구하기", "처음 수에서 빼기", "남은 수 확인하기", "남은 수가 나누는 수보다 작은지 보기"],
    rule: "처음 수 - 나누어 준 수 = 남은 수",
  },
  "2:division.remainder-check": {
    hook: "몫과 나머지만으로 처음 수를 다시 만들 수 있을까요?",
    steps: ["나누는 수와 몫 곱하기", "나머지 더하기", "처음 수와 비교하기", "나머지의 크기 확인하기"],
    rule: "나누는 수 × 몫 + 나머지 = 처음 수",
  },
  "2:circle.parts": {
    hook: "원의 중심에서 원 위까지 그은 선분에는 어떤 이름이 있을까요?",
    steps: ["원의 중심 O 찾기", "원 위의 점 찾기", "중심과 원 위를 잇기", "선분을 반지름으로 말하기"],
    rule: "원의 중심과 원 위의 한 점을 이은 선분이 반지름이다.",
  },
  "2:circle.diameter": {
    hook: "반지름 두 개를 곧게 이으면 왜 지름이 될까요?",
    steps: ["원의 중심 찾기", "중심을 지나는 곧은 선분 확인하기", "반지름 두 개로 나누어 보기", "두 배 관계 계산하기"],
    rule: "지름은 중심을 지나며 반지름의 2배이다.",
  },
  "2:fraction.part-whole": {
    hook: "색칠한 칸과 전체 칸 중 어느 수가 분모로 갈까요?",
    steps: ["전체를 똑같이 나눴는지 보기", "전체 조각 수 세기", "색칠한 조각 수 세기", "분자와 분모에 놓기"],
    rule: "전체 조각 수를 분모에, 색칠한 조각 수를 분자에 쓴다.",
  },
  "2:fraction.convert": {
    hook: "7/3에서 완전한 1은 몇 개 들어 있을까요?",
    steps: ["분자를 분모만큼 묶기", "완전한 묶음 수 세기", "남은 수 확인하기", "자연수와 분수로 나타내기"],
    rule: "분모만큼 묶인 수는 자연수, 남은 수는 분자가 된다.",
  },
  "2:fraction.compare": {
    hook: "분모가 같을 때는 어느 수를 비교하면 될까요?",
    steps: ["두 분모가 같은지 확인하기", "한 조각 크기가 같음을 말하기", "분자 비교하기", "부등호나 말로 나타내기"],
    rule: "분모가 같으면 분자가 큰 분수가 더 크다.",
  },
  "2:measurement.capacity": {
    hook: "1L는 100mL 열 묶음과 어떤 관계일까요?",
    steps: ["1L=1000mL 쓰기", "L 수에 1000 곱하기", "남은 mL 더하기", "단위를 붙여 확인하기"],
    rule: "1L=1000mL이므로 L를 mL로 바꿀 때 1000배 한다.",
  },
  "2:measurement.weight": {
    hook: "2kg 300g에서 2와 300을 그냥 붙이면 왜 위험할까요?",
    steps: ["1kg=1000g 쓰기", "kg을 g으로 바꾸기", "남은 g 더하기", "원래 혼합 단위와 비교하기"],
    rule: "1kg=1000g이므로 kg을 g으로 바꾼 뒤 g을 더한다.",
  },
  "2:pictograph.legend": {
    hook: "그림은 네 개인데 실제 수량은 왜 네 개가 아닐 수 있을까요?",
    steps: ["범례 확인하기", "그림 수 세기", "그림 수에 범례 값 적용하기", "단위를 붙여 실제 수량 말하기"],
    rule: "그림 수 × 그림 한 개가 나타내는 수 = 실제 수량",
  },
  "2:pictograph.compare": {
    hook: "그림 개수 차이와 실제 수량 차이는 언제 같고 언제 다를까요?",
    steps: ["범례 확인하기", "각 행의 그림 수 세기", "각 행을 실제 수량으로 바꾸기", "실제 수량끼리 빼기"],
    rule: "그림 수의 차이에 범례 값을 적용해야 실제 수량 차이가 된다.",
  },
});

const SERIES_PLAN = Object.freeze([
  { sequence: 1, lessonId: "g3s2-pictograph-legend", semester: 2, stageId: "pictograph.legend", existing: true, title: "그림 하나에 숨은 수" },
  { sequence: 2, lessonId: "g3s1-multiplication-groups-model", semester: 1, stageId: "multiplication.equal-groups", focus: "direct", title: "같은 묶음은 곱셈으로" , extension: { prompt: "귤이 한 접시에 4개씩 5접시 있습니다. 귤은 모두 몇 개일까요?", visible: ["한 접시 4개", "접시 5개"], answer: "4×5=20개", oracle: { kind: "multiply", factors: [4, 5], expected: 20 } } },
  { sequence: 3, lessonId: "g3s1-multiplication-array-transfer", semester: 1, stageId: "multiplication.equal-groups", focus: "transfer", title: "줄과 칸으로 전체 수 찾기", extension: { prompt: "바둑돌을 한 줄에 6개씩 7줄 놓았습니다. 모두 몇 개일까요?", visible: ["한 줄 6개", "모두 7줄"], answer: "6×7=42개", oracle: { kind: "multiply", factors: [6, 7], expected: 42 } } },
  { sequence: 4, lessonId: "g3s1-multiplication-place-value-model", semester: 1, stageId: "multiplication.two-digit-by-one", focus: "direct", title: "34×2를 두 부분으로", extension: { prompt: "34×2를 30과 4로 나누어 계산해 보세요.", visible: ["30×2", "4×2", "두 부분곱의 합"], answer: "60+8=68", oracle: { kind: "multiply", factors: [34, 2], expected: 68 } } },
  { sequence: 5, lessonId: "g3s1-multiplication-place-value-context", semester: 1, stageId: "multiplication.two-digit-by-one", focus: "transfer", title: "상자 수를 자릿값으로 곱하기", extension: { prompt: "공이 31개씩 든 상자가 3개 있습니다. 공은 모두 몇 개일까요?", visible: ["30×3=90", "1×3=3"], answer: "90+3=93개", oracle: { kind: "multiply", factors: [31, 3], expected: 93 } } },
  { sequence: 6, lessonId: "g3s1-division-equal-sharing", semester: 1, stageId: "division.equal-partition", focus: "direct", title: "18개를 똑같이 나누면", extension: { prompt: "쿠키 18개를 6명에게 똑같이 나누면 한 명은 몇 개씩 받을까요?", visible: ["전체 18개", "6명에게 똑같이"], answer: "18÷6=3개", oracle: { kind: "divide", dividend: 18, divisor: 6, quotient: 3, remainder: 0 } } },
  { sequence: 7, lessonId: "g3s1-division-missing-factor", semester: 1, stageId: "division.equal-partition", focus: "transfer", title: "곱셈의 빈칸으로 몫 찾기", extension: { prompt: "7×□=35에서 □에 알맞은 수를 찾고 나눗셈식으로 나타내세요.", visible: ["7씩 같은 묶음", "전체 35"], answer: "□=5, 35÷7=5", oracle: { kind: "fact-family", factorA: 7, factorB: 5, product: 35 } } },
  { sequence: 8, lessonId: "g3s1-division-fact-family", semester: 1, stageId: "division.multiplication-link", focus: "direct", title: "한 곱셈식에서 두 나눗셈식", extension: { prompt: "8×4=32를 이용해 나눗셈식 두 개를 만드세요.", visible: ["전체 32", "두 요인 8과 4"], answer: "32÷8=4, 32÷4=8", oracle: { kind: "fact-family", factorA: 8, factorB: 4, product: 32 } } },
  { sequence: 9, lessonId: "g3s1-division-group-count", semester: 1, stageId: "division.multiplication-link", focus: "transfer", title: "몇 묶음인지 곱셈으로 확인하기", extension: { prompt: "붙임 딱지 42장을 6장씩 묶으면 몇 묶음일까요?", visible: ["전체 42장", "한 묶음 6장"], answer: "42÷6=7묶음", oracle: { kind: "divide", dividend: 42, divisor: 6, quotient: 7, remainder: 0 } } },
  { sequence: 10, lessonId: "g3s1-fraction-equal-parts", semester: 1, stageId: "fraction.equal-partition", focus: "direct", title: "분수의 첫 조건, 똑같이", extension: { prompt: "같은 길이의 종이띠를 똑같이 5조각으로 나눴습니다. 한 조각은 전체의 얼마일까요?", visible: ["전체 조각 5개", "다섯 조각의 크기가 모두 같음"], answer: "1/5", oracle: { kind: "fraction", numerator: 1, denominator: 5, expected: "1/5" } } },
  { sequence: 11, lessonId: "g3s1-fraction-fix-partition", semester: 1, stageId: "fraction.equal-partition", focus: "transfer", title: "같지 않은 조각을 고쳐 나누기", extension: { prompt: "크기가 다른 5조각 중 한 조각을 1/5이라고 할 수 있을까요? 까닭과 고치는 방법을 말하세요.", visible: ["조각 수는 5개", "조각의 크기는 서로 다름"], answer: "1/5이라고 할 수 없다. 전체를 똑같은 크기 5조각으로 다시 나눈다.", oracle: { kind: "equal-parts", parts: [1, 2, 1, 2, 1], expectedEqual: false } } },
  { sequence: 12, lessonId: "g3s1-fraction-part-whole", semester: 1, stageId: "fraction.part-of-whole", focus: "direct", title: "전체와 부분을 분수로 읽기", extension: { prompt: "전체 7조각 중 3조각을 색칠했습니다. 색칠한 부분을 분수로 나타내세요.", visible: ["전체 7조각", "색칠한 3조각"], answer: "3/7", oracle: { kind: "fraction", numerator: 3, denominator: 7, expected: "3/7" } } },
  { sequence: 13, lessonId: "g3s1-fraction-pizza-context", semester: 1, stageId: "fraction.part-of-whole", focus: "transfer", title: "피자에서 분모와 분자 찾기", extension: { prompt: "피자 한 판을 똑같이 10조각으로 나누어 4조각을 먹었습니다. 먹은 양은 얼마일까요?", visible: ["전체 10조각", "먹은 4조각"], answer: "4/10", oracle: { kind: "fraction", numerator: 4, denominator: 10, expected: "4/10" } } },
  { sequence: 14, lessonId: "g3s1-length-centimeter-meter", semester: 1, stageId: "length.unit-choice", focus: "direct", title: "연필에는 cm, 문에는 m", extension: { prompt: "지우개의 길이와 복도의 길이에 알맞은 단위를 각각 고르세요.", visible: ["지우개 길이 약 4cm", "복도 길이 약 20m"], answer: "지우개는 cm, 복도는 m", oracle: { kind: "referents", expected: ["cm", "m"] } } },
  { sequence: 15, lessonId: "g3s1-length-real-world-units", semester: 1, stageId: "length.unit-choice", focus: "transfer", title: "크기에 맞는 길이 단위", extension: { prompt: "단추의 두께와 두 도시 사이 거리에 알맞은 단위를 각각 고르세요.", visible: ["단추 두께 약 2mm", "두 도시 사이 거리 약 5km"], answer: "단추 두께는 mm, 도시 사이 거리는 km", oracle: { kind: "referents", expected: ["mm", "km"] } } },
  { sequence: 16, lessonId: "g3s1-length-unit-conversion", semester: 1, stageId: "length.unit-convert", focus: "direct", title: "m·cm, km·m 연결하기", extension: { prompt: "3m와 4km를 각각 더 작은 단위로 바꾸세요.", visible: ["1m=100cm", "1km=1000m"], answer: "3m=300cm, 4km=4000m", oracle: { kind: "multi", checks: [{ kind: "convert", value: 3, factor: 100, expected: 300 }, { kind: "convert", value: 4, factor: 1000, expected: 4000 }] } } },
  { sequence: 17, lessonId: "g3s2-multiplication-place-value", semester: 2, stageId: "multiplication.place-value", focus: "direct", title: "자릿값을 살려 먼저 곱하기", extension: { prompt: "241×3에서 200, 40, 1을 각각 곱한 뒤 답을 구하세요.", visible: ["200×3=600", "40×3=120", "1×3=3"], answer: "600+120+3=723", oracle: { kind: "multiply", factors: [241, 3], expected: 723 } } },
  { sequence: 18, lessonId: "g3s2-multiplication-combine", semester: 2, stageId: "multiplication.combine", focus: "direct", title: "부분곱을 빠짐없이 더하기", extension: { prompt: "213×3의 세 부분곱을 구해 합치세요.", visible: ["200×3=600", "10×3=30", "3×3=9"], answer: "600+30+9=639", oracle: { kind: "multiply", factors: [213, 3], expected: 639 } } },
  { sequence: 19, lessonId: "g3s2-multiplication-two-digit", semester: 2, stageId: "multiplication.two-digit", focus: "direct", title: "두 자리 수를 나누어 곱하기", extension: { prompt: "32×14를 32×10과 32×4로 나누어 계산하세요.", visible: ["32×10=320", "32×4=128"], answer: "320+128=448", oracle: { kind: "multiply", factors: [32, 14], expected: 448 } } },
  { sequence: 20, lessonId: "g3s2-division-meaning", semester: 2, stageId: "division.meaning", focus: "direct", title: "나눗셈이 묻는 두 가지", extension: { prompt: "구슬 28개를 7개씩 묶으면 몇 묶음일까요?", visible: ["전체 28개", "한 묶음 7개"], answer: "28÷7=4묶음", oracle: { kind: "divide", dividend: 28, divisor: 7, quotient: 4, remainder: 0 } } },
  { sequence: 21, lessonId: "g3s2-division-remainder", semester: 2, stageId: "division.remainder", focus: "direct", title: "먼저 나누고 남은 수 찾기", extension: { prompt: "사탕 67개를 5명에게 10개씩 먼저 주었습니다. 몇 개가 남았을까요?", visible: ["5명×10개=50개", "처음 67개"], answer: "67-50=17개", oracle: { kind: "subtract", minuend: 67, subtrahend: 50, expected: 17 } } },
  { sequence: 22, lessonId: "g3s2-division-remainder-check", semester: 2, stageId: "division.remainder-check", focus: "direct", title: "몫과 나머지로 처음 수 확인하기", extension: { prompt: "38÷6=6…2가 맞는지 곱셈으로 확인하세요.", visible: ["나누는 수 6", "몫 6", "나머지 2"], answer: "6×6+2=38이므로 맞다.", oracle: { kind: "division-check", divisor: 6, quotient: 6, remainder: 2, dividend: 38 } } },
  { sequence: 23, lessonId: "g3s2-circle-parts", semester: 2, stageId: "circle.parts", focus: "direct", title: "원의 중심과 반지름 찾기", extension: { prompt: "점 O가 원의 중심이고 A가 원 위의 점일 때 선분 OA의 이름은 무엇일까요?", visible: ["O는 원의 중심", "A는 원 위의 점", "선분 OA가 그어져 있음"], answer: "반지름", oracle: { kind: "named-relation", expected: "반지름" } } },
  { sequence: 24, lessonId: "g3s2-circle-diameter", semester: 2, stageId: "circle.diameter", focus: "direct", title: "반지름 두 개가 만드는 지름", extension: { prompt: "반지름이 7cm인 원의 지름은 몇 cm일까요?", visible: ["반지름 7cm", "지름=반지름×2"], answer: "14cm", oracle: { kind: "multiply", factors: [7, 2], expected: 14 } } },
  { sequence: 25, lessonId: "g3s2-fraction-part-whole", semester: 2, stageId: "fraction.part-whole", focus: "direct", title: "색칠한 부분을 분수로", extension: { prompt: "전체를 똑같이 10칸으로 나누고 6칸을 색칠했습니다. 색칠한 부분은 얼마일까요?", visible: ["전체 10칸", "색칠한 6칸"], answer: "6/10", oracle: { kind: "fraction", numerator: 6, denominator: 10, expected: "6/10" } } },
  { sequence: 26, lessonId: "g3s2-fraction-convert", semester: 2, stageId: "fraction.convert", focus: "direct", title: "가분수를 대분수로 바꾸기", extension: { prompt: "11/4를 대분수로 바꾸세요.", visible: ["4개씩 완전한 묶음 만들기", "11=4×2+3"], answer: "2와 3/4", oracle: { kind: "improper-to-mixed", numerator: 11, denominator: 4, whole: 2, remainder: 3 } } },
  { sequence: 27, lessonId: "g3s2-fraction-compare", semester: 2, stageId: "fraction.compare", focus: "direct", title: "분모가 같은 분수 비교하기", extension: { prompt: "3/8과 7/8 중 더 큰 분수는 무엇일까요?", visible: ["두 분수의 분모는 8로 같음", "분자는 3과 7"], answer: "7/8", oracle: { kind: "same-denominator-compare", left: [3, 8], right: [7, 8], expected: "7/8" } } },
  { sequence: 28, lessonId: "g3s2-capacity-unit", semester: 2, stageId: "measurement.capacity", focus: "direct", title: "L를 mL로 정확히 바꾸기", extension: { prompt: "2L 250mL를 mL로 바꾸세요.", visible: ["1L=1000mL", "2L=2000mL"], answer: "2250mL", oracle: { kind: "mixed-unit", major: 2, factor: 1000, minor: 250, expected: 2250 } } },
  { sequence: 29, lessonId: "g3s2-weight-unit", semester: 2, stageId: "measurement.weight", focus: "direct", title: "kg을 g으로 정확히 바꾸기", extension: { prompt: "3kg 40g을 g으로 바꾸세요.", visible: ["1kg=1000g", "3kg=3000g"], answer: "3040g", oracle: { kind: "mixed-unit", major: 3, factor: 1000, minor: 40, expected: 3040 } } },
  { sequence: 30, lessonId: "g3s2-pictograph-compare", semester: 2, stageId: "pictograph.compare", focus: "direct", title: "그림그래프의 실제 차이 구하기", extension: { prompt: "■ 한 개가 4명을 나타냅니다. A반은 ■ 5개, B반은 ■ 2개일 때 몇 명 차이일까요?", visible: ["범례: ■ 1개=4명", "A반 ■ 5개", "B반 ■ 2개"], answer: "(5-2)×4=12명", oracle: { kind: "pictograph-difference", leftCount: 5, rightCount: 2, legendValue: 4, expected: 12 } } },
]);

function ensure(condition, message) {
  if (!condition) throw new Error(`초3 30개 시리즈 계획 오류: ${message}`);
}

function verifyOracle(oracle) {
  if (oracle.kind === "multi") return oracle.checks.every(verifyOracle);
  if (oracle.kind === "multiply") return oracle.factors.reduce((product, value) => product * value, 1) === oracle.expected;
  if (oracle.kind === "divide") return Math.floor(oracle.dividend / oracle.divisor) === oracle.quotient && oracle.dividend % oracle.divisor === oracle.remainder;
  if (oracle.kind === "fact-family") return oracle.factorA * oracle.factorB === oracle.product;
  if (oracle.kind === "fraction") return `${oracle.numerator}/${oracle.denominator}` === oracle.expected && oracle.numerator >= 0 && oracle.denominator > 0;
  if (oracle.kind === "equal-parts") return new Set(oracle.parts).size === (oracle.expectedEqual ? 1 : 2);
  if (oracle.kind === "referents") return oracle.expected.every((unit) => ["mm", "cm", "m", "km"].includes(unit));
  if (oracle.kind === "convert") return oracle.value * oracle.factor === oracle.expected;
  if (oracle.kind === "subtract") return oracle.minuend - oracle.subtrahend === oracle.expected;
  if (oracle.kind === "division-check") return oracle.divisor * oracle.quotient + oracle.remainder === oracle.dividend && oracle.remainder < oracle.divisor;
  if (oracle.kind === "named-relation") return oracle.expected === "반지름";
  if (oracle.kind === "improper-to-mixed") return oracle.numerator === oracle.denominator * oracle.whole + oracle.remainder && oracle.remainder < oracle.denominator;
  if (oracle.kind === "same-denominator-compare") return oracle.left[1] === oracle.right[1] && (oracle.left[0] > oracle.right[0] ? `${oracle.left[0]}/${oracle.left[1]}` : `${oracle.right[0]}/${oracle.right[1]}`) === oracle.expected;
  if (oracle.kind === "mixed-unit") return oracle.major * oracle.factor + oracle.minor === oracle.expected;
  if (oracle.kind === "pictograph-difference") return Math.abs(oracle.leftCount - oracle.rightCount) * oracle.legendValue === oracle.expected;
  return false;
}

function assertSeriesPlan(plan = SERIES_PLAN) {
  ensure(plan.length === 30, "차시가 정확히 30개가 아닙니다.");
  ensure(plan.every((entry, index) => entry.sequence === index + 1), "순번이 1~30으로 연속되지 않습니다.");
  ensure(plan.filter((entry) => entry.semester === 1).length === 15, "1학기 차시가 15개가 아닙니다.");
  ensure(plan.filter((entry) => entry.semester === 2).length === 15, "2학기 차시가 15개가 아닙니다.");
  ensure(new Set(plan.map((entry) => entry.lessonId)).size === 30, "lessonId가 중복되었습니다.");
  for (const entry of plan) {
    ensure(STRATEGIES[`${entry.semester}:${entry.stageId}`], `${entry.lessonId}의 수업 전략이 없습니다.`);
    if (!entry.existing) {
      ensure(entry.extension && verifyOracle(entry.extension.oracle), `${entry.lessonId}의 확장 문항 오라클이 실패했습니다.`);
    }
  }
  return true;
}

assertSeriesPlan();

module.exports = {
  RESERVED_SOURCE_SCOPES,
  SERIES_PLAN,
  STRATEGIES,
  assertSeriesPlan,
  verifyOracle,
};
