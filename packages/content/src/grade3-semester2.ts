import type { DiagnosisSet } from "@middle-of-math/domain";
import { diagnosisSetSchema } from "./schema";

const source = "교육부 고시 제2022-33호 [별책 8] 수학과 교육과정";

const diagnosis: DiagnosisSet = {
  manifest: {
    id: "grade3-semester2",
    version: "1.0.0",
    checksum: "c7fb34ecbaadc47a3d64bd8c525b02313dd8eecc74e57a796cf042c77e962a69",
    title: "3학년 2학기 수학",
    shortTitle: "3-2 수학",
    grade: 3,
    semester: 2,
    curriculum: "2022-revised",
    status: "published",
    units: [
      { id: "multiplication", order: 1, title: "곱셈" },
      { id: "division", order: 2, title: "나눗셈" },
      { id: "circle", order: 3, title: "원" },
      { id: "fraction", order: 4, title: "분수" },
      { id: "measurement", order: 5, title: "들이와 무게" },
      { id: "pictograph", order: 6, title: "그림그래프" }
    ],
    interactionTypes: [
      { type: "choice", version: 1 },
      { type: "fraction-bar", version: 1 },
      { type: "measurement", version: 1 },
      { type: "pictograph", version: 1 }
    ],
    estimatedMinutes: 12
  },
  curriculumAnchors: [
    { id: "[4수01-04]", label: "한 자리 수 또는 두 자리 수를 곱하는 곱셈", source },
    { id: "[4수01-05]", label: "나눗셈의 의미와 곱셈과의 관계", source },
    { id: "[4수01-06]", label: "한 자리 수로 나누는 나눗셈", source },
    { id: "[4수03-06]", label: "원의 중심, 반지름, 지름", source },
    { id: "[4수03-07]", label: "컴퍼스로 원 그리기", source },
    { id: "[4수01-09]", label: "등분할과 분수", source },
    { id: "[4수01-10]", label: "단위분수, 진분수, 가분수, 대분수", source },
    { id: "[4수01-11]", label: "분모가 같은 분수와 단위분수의 크기 비교", source },
    { id: "[4수03-17]", label: "L와 mL의 관계와 들이 측정", source },
    { id: "[4수03-19]", label: "들이의 덧셈과 뺄셈", source },
    { id: "[4수03-20]", label: "g과 kg의 관계와 무게 측정", source },
    { id: "[4수04-01]", label: "실생활 자료와 그림그래프", source }
  ],
  learnerStages: [
    { id: "multiplication.place-value", order: 1, unitId: "multiplication", title: "곱하는 수를 자릿값으로 나누기", shortTitle: "십과 일을 나누어 곱함", curriculumAnchorIds: ["[4수01-04]"], prerequisiteStageIds: [] },
    { id: "multiplication.combine", order: 2, unitId: "multiplication", title: "부분곱을 합쳐 곱셈 결과 만들기", shortTitle: "부분곱을 알맞게 합침", curriculumAnchorIds: ["[4수01-04]"], prerequisiteStageIds: ["multiplication.place-value"] },
    { id: "division.remainder", order: 3, unitId: "division", title: "먼저 나누고 남은 양 찾기", shortTitle: "나누고 남은 양을 구분함", curriculumAnchorIds: ["[4수01-05]", "[4수01-06]"], prerequisiteStageIds: [] },
    { id: "division.equal-sharing", order: 4, unitId: "division", title: "남은 양을 다시 똑같이 나누기", shortTitle: "같은 수만큼 나누어 가짐", curriculumAnchorIds: ["[4수01-05]", "[4수01-06]"], prerequisiteStageIds: ["division.remainder"] },
    { id: "circle.parts", order: 5, unitId: "circle", title: "원의 중심과 반지름 구분하기", shortTitle: "원의 중심과 반지름을 구분함", curriculumAnchorIds: ["[4수03-06]"], prerequisiteStageIds: [] },
    { id: "circle.diameter", order: 6, unitId: "circle", title: "반지름과 지름의 관계 알기", shortTitle: "반지름으로 지름을 구함", curriculumAnchorIds: ["[4수03-06]", "[4수03-07]"], prerequisiteStageIds: ["circle.parts"] },
    { id: "fraction.part-whole", order: 7, unitId: "fraction", title: "전체 조각과 색칠한 조각 연결하기", shortTitle: "전체와 부분을 분수로 나타냄", curriculumAnchorIds: ["[4수01-09]", "[4수01-10]"], prerequisiteStageIds: [] },
    { id: "fraction.compare", order: 8, unitId: "fraction", title: "분모가 같은 분수의 크기 비교하기", shortTitle: "같은 분모의 분수를 비교함", curriculumAnchorIds: ["[4수01-11]"], prerequisiteStageIds: ["fraction.part-whole"] },
    { id: "measurement.capacity", order: 9, unitId: "measurement", title: "L와 mL의 관계 알기", shortTitle: "들이 단위를 서로 바꿈", curriculumAnchorIds: ["[4수03-17]", "[4수03-19]"], prerequisiteStageIds: [] },
    { id: "measurement.weight", order: 10, unitId: "measurement", title: "kg과 g의 관계 알기", shortTitle: "무게 단위를 서로 바꿈", curriculumAnchorIds: ["[4수03-20]"], prerequisiteStageIds: [] },
    { id: "pictograph.legend", order: 11, unitId: "pictograph", title: "그림 한 개가 나타내는 수 알기", shortTitle: "그림을 수량으로 바꿈", curriculumAnchorIds: ["[4수04-01]"], prerequisiteStageIds: [] },
    { id: "pictograph.compare", order: 12, unitId: "pictograph", title: "그림그래프의 수량 비교하기", shortTitle: "그림그래프의 차이를 구함", curriculumAnchorIds: ["[4수04-01]"], prerequisiteStageIds: ["pictograph.legend"] }
  ],
  signals: [
    { id: "multiplication.place-value-loss", title: "곱셈에서 자릿값 나누기", severity: "high", teacherInterpretation: "십의 자리와 일의 자리를 나누지 않고 보이는 숫자만 곱하는 선택이 관찰되었습니다.", teachingMove: "24를 20과 4로 나누고 각각 3묶음을 만든 뒤 다시 합쳐 보세요.", parentSummary: "두 자리 수를 십과 일로 나누어 곱하는 연습을 하고 있습니다.", homePrompt: "24를 20과 4로 나누면 각각 몇 묶음인지 물어봐 주세요." },
    { id: "multiplication.partial-product", title: "부분곱 합치기", severity: "medium", teacherInterpretation: "부분곱은 구했지만 자릿값에 맞게 합치는 과정이 안정적이지 않습니다.", teachingMove: "20×3과 4×3의 결과를 수 모형의 십과 일 위치에 놓고 합쳐 보세요.", parentSummary: "나누어 계산한 두 결과를 다시 합치는 과정을 연습하고 있습니다.", homePrompt: "60과 12를 합치면 얼마인지, 왜 두 수를 더하는지 물어봐 주세요." },
    { id: "division.leftover", title: "나눗셈에서 남은 양", severity: "medium", teacherInterpretation: "먼저 같은 수만큼 나눈 뒤 남는 양을 분리하는 과정에서 혼동이 관찰되었습니다.", teachingMove: "52개에서 4명에게 10개씩 준 40개를 먼저 지우고 남은 수를 확인하세요.", parentSummary: "똑같이 나누고 남은 양을 구분하는 연습을 하고 있습니다.", homePrompt: "52개에서 40개를 먼저 나누어 주면 몇 개가 남는지 물어봐 주세요." },
    { id: "division.equal-share", title: "남은 양 똑같이 나누기", severity: "high", teacherInterpretation: "남은 양을 사람 수와 같은 수의 묶음으로 나누는 연결이 흔들립니다.", teachingMove: "남은 12개를 4개의 동그라미에 하나씩 번갈아 놓게 해보세요.", parentSummary: "남은 것을 같은 수만큼 나누는 방법을 연습하고 있습니다.", homePrompt: "12개를 네 접시에 똑같이 놓으면 한 접시에 몇 개인지 함께 놓아보세요." },
    { id: "circle.center-radius", title: "원의 중심과 반지름", severity: "medium", teacherInterpretation: "원의 중심에서 원 위까지의 선분과 원을 가로지르는 선분을 구분하는 근거가 더 필요합니다.", teachingMove: "한 점에서 같은 길이로 여러 방향을 재어 모두 원 위에 닿는지 확인하세요.", parentSummary: "원의 가운데와 원 위를 잇는 선분의 이름과 성질을 익히고 있습니다.", homePrompt: "동전의 가운데를 짚고 가장자리까지의 길이가 어느 방향에서나 같은지 살펴보세요." },
    { id: "circle.radius-diameter", title: "반지름과 지름의 관계", severity: "high", teacherInterpretation: "지름을 반지름과 같은 길이 또는 네 배의 길이로 보는 선택이 관찰되었습니다.", teachingMove: "반지름 두 개를 중심에서 반대 방향으로 이어 지름을 직접 구성하세요.", parentSummary: "반지름 두 개가 이어지면 지름이 된다는 관계를 연습하고 있습니다.", homePrompt: "반지름이 4cm인 원의 지름에는 4cm가 몇 번 들어가는지 물어봐 주세요." },
    { id: "fraction.part-whole", title: "분모와 분자의 역할", severity: "high", teacherInterpretation: "전체 조각 수와 색칠한 조각 수의 위치를 바꾸어 읽는 선택이 관찰되었습니다.", teachingMove: "아래 수는 전체 조각, 위 수는 고른 조각이라는 연결을 막대와 함께 확인하세요.", parentSummary: "전체 조각 수와 선택한 조각 수를 분수로 나타내는 연습을 하고 있습니다.", homePrompt: "피자를 4조각으로 나누고 3조각을 고르면 아래 수와 위 수가 각각 무엇인지 물어봐 주세요." },
    { id: "fraction.same-denominator", title: "같은 분모의 분수 비교", severity: "medium", teacherInterpretation: "같은 크기의 조각끼리 비교할 때 선택한 조각 수를 기준으로 삼는 과정이 흔들립니다.", teachingMove: "분모가 같으면 조각 크기가 같다는 점을 먼저 확인하고 분자만 비교하세요.", parentSummary: "같은 크기 조각에서 더 많이 고른 분수를 찾는 연습을 하고 있습니다.", homePrompt: "5조각 중 2조각과 4조각 중 어느 쪽이 더 많은지 그림으로 물어봐 주세요." },
    { id: "measurement.capacity-unit", title: "L와 mL의 관계", severity: "high", teacherInterpretation: "1L를 100mL 또는 10mL로 바꾸는 선택이 관찰되었습니다.", teachingMove: "1L 용기에 100mL 컵이 몇 번 들어가는지 수 모형과 함께 확인하세요.", parentSummary: "L와 mL 사이의 단위 관계를 연습하고 있습니다.", homePrompt: "1L 물병에 100mL 컵이 몇 번 들어가는지 예상해 보게 해주세요." },
    { id: "measurement.weight-unit", title: "kg과 g의 관계", severity: "medium", teacherInterpretation: "kg과 g을 한 단위로 바꾸어 같은 무게를 확인하는 과정이 안정적이지 않습니다.", teachingMove: "2kg을 2000g으로 먼저 바꾼 뒤 300g을 더하는 순서를 고정하세요.", parentSummary: "kg과 g을 같은 단위로 바꾸어 비교하는 연습을 하고 있습니다.", homePrompt: "2kg 300g과 2300g이 같은지 저울 표기를 함께 읽어보세요." },
    { id: "pictograph.legend", title: "그림그래프의 범례", severity: "high", teacherInterpretation: "그림의 개수만 세고 그림 한 개가 나타내는 수를 적용하지 않은 선택이 관찰되었습니다.", teachingMove: "그림을 셀 때마다 범례의 수만큼 뛰어 세게 해보세요.", parentSummary: "그림 한 개가 여러 개를 나타낼 수 있다는 범례를 연습하고 있습니다.", homePrompt: "별 한 개가 2명을 뜻할 때 별 세 개는 몇 명인지 물어봐 주세요." },
    { id: "pictograph.difference", title: "그림그래프의 차이", severity: "medium", teacherInterpretation: "두 행의 그림 수 차이를 실제 수량 차이로 바꾸는 과정에서 혼동이 관찰되었습니다.", teachingMove: "그림 한 개 차이가 범례로 몇 개 차이인지 두 단계로 나누어 확인하세요.", parentSummary: "그림 수의 차이를 실제 수량 차이로 바꾸는 연습을 하고 있습니다.", homePrompt: "그림이 한 개 더 많을 때 실제로는 몇 개 더 많은지 범례와 함께 물어봐 주세요." },
    { id: "needs-scaffold", title: "판단 시작점에 발판 필요", severity: "low", teacherInterpretation: "오래 머문 뒤 잘 모르겠어요를 선택해 판단을 시작할 기준이 더 필요합니다.", teachingMove: "설명보다 두 보기만 남기거나 구체물에서 먼저 같은 관계를 찾게 하세요.", parentSummary: "어디서부터 생각할지 시작 기준을 찾는 연습이 필요합니다.", homePrompt: "답을 알려주기보다 먼저 무엇을 알고 있는지 한 가지만 말해보게 해주세요." },
    { id: "needs-review", title: "추가 관찰 필요", severity: "low", teacherInterpretation: "현재 콘텐츠에 정의되지 않은 선택이 있어 추가 검토가 필요합니다.", teachingMove: "원본 이벤트와 콘텐츠 버전을 확인하세요.", parentSummary: "추가 관찰이 필요합니다.", homePrompt: "비슷한 문제를 한 번 더 살펴봐 주세요." }
  ],
  judgments: [
    { id: "g3s2-mul-01", unitId: "multiplication", learnerStageId: "multiplication.place-value", curriculumAnchorIds: ["[4수01-04]"], prompt: "24×3을 계산하려고 해요. 먼저 20×3은 얼마일까요?", visual: { kind: "array", rows: 3, columns: 8, label: "24가 3묶음" }, interaction: { type: "choice", version: 1 }, choices: [{ id: "60", label: "60", correct: true }, { id: "6", label: "6", correct: false, signalIds: ["multiplication.place-value-loss"] }, { id: "23", label: "23", correct: false, signalIds: ["multiplication.place-value-loss"] }] },
    { id: "g3s2-mul-02", unitId: "multiplication", learnerStageId: "multiplication.combine", curriculumAnchorIds: ["[4수01-04]"], prompt: "20×3은 60이고 4×3은 12예요. 두 결과를 합치면 얼마일까요?", visual: { kind: "none" }, interaction: { type: "choice", version: 1 }, choices: [{ id: "72", label: "72", correct: true }, { id: "612", label: "612", correct: false, signalIds: ["multiplication.partial-product"] }, { id: "27", label: "27", correct: false, signalIds: ["multiplication.partial-product"] }] },
    { id: "g3s2-div-01", unitId: "division", learnerStageId: "division.remainder", curriculumAnchorIds: ["[4수01-05]", "[4수01-06]"], context: "사탕 52개를 4명에게 똑같이 나누어 줍니다.", prompt: "한 사람에게 10개씩 먼저 주면 몇 개가 남을까요?", visual: { kind: "division-groups", total: 52, groups: 4 }, interaction: { type: "choice", version: 1 }, choices: [{ id: "12", label: "12개", correct: true }, { id: "8", label: "8개", correct: false, signalIds: ["division.leftover"] }, { id: "2", label: "2개", correct: false, signalIds: ["division.leftover"] }] },
    { id: "g3s2-div-02", unitId: "division", learnerStageId: "division.equal-sharing", curriculumAnchorIds: ["[4수01-05]", "[4수01-06]"], prompt: "남은 12개를 4명에게 똑같이 나누면 한 사람에게 몇 개씩 더 줄까요?", visual: { kind: "division-groups", total: 12, groups: 4 }, interaction: { type: "choice", version: 1 }, choices: [{ id: "3", label: "3개", correct: true }, { id: "4", label: "4개", correct: false, signalIds: ["division.equal-share"] }, { id: "8", label: "8개", correct: false, signalIds: ["division.equal-share"] }] },
    { id: "g3s2-circle-01", unitId: "circle", learnerStageId: "circle.parts", curriculumAnchorIds: ["[4수03-06]"], prompt: "원의 중심에서 원 위까지 그은 선분을 무엇이라고 할까요?", visual: { kind: "circle", showCenter: true, showRadius: true }, interaction: { type: "choice", version: 1 }, choices: [{ id: "radius", label: "반지름", correct: true }, { id: "diameter", label: "지름", correct: false, signalIds: ["circle.center-radius"] }, { id: "circumference", label: "둘레", correct: false, signalIds: ["circle.center-radius"] }] },
    { id: "g3s2-circle-02", unitId: "circle", learnerStageId: "circle.diameter", curriculumAnchorIds: ["[4수03-06]", "[4수03-07]"], prompt: "반지름이 4cm인 원의 지름은 얼마일까요?", visual: { kind: "circle", showCenter: true, showDiameter: true }, interaction: { type: "choice", version: 1 }, choices: [{ id: "8cm", label: "8cm", correct: true }, { id: "4cm", label: "4cm", correct: false, signalIds: ["circle.radius-diameter"] }, { id: "16cm", label: "16cm", correct: false, signalIds: ["circle.radius-diameter"] }] },
    { id: "g3s2-frac-01", unitId: "fraction", learnerStageId: "fraction.part-whole", curriculumAnchorIds: ["[4수01-09]", "[4수01-10]"], prompt: "막대 전체를 4칸으로 똑같이 나누고 3칸을 색칠했어요. 알맞은 분수는 무엇일까요?", visual: { kind: "fraction-bar", numerator: 3, denominator: 4 }, interaction: { type: "fraction-bar", version: 1 }, choices: [{ id: "three-fourths", label: "3/4", correct: true }, { id: "four-thirds", label: "4/3", correct: false, signalIds: ["fraction.part-whole"] }, { id: "three-ones", label: "3/1", correct: false, signalIds: ["fraction.part-whole"] }] },
    { id: "g3s2-frac-02", unitId: "fraction", learnerStageId: "fraction.compare", curriculumAnchorIds: ["[4수01-11]"], prompt: "2/5와 4/5 중 더 큰 분수는 무엇일까요?", visual: { kind: "fraction-bar", numerator: 0, denominator: 5, unknown: "numerator" }, interaction: { type: "fraction-bar", version: 1 }, choices: [{ id: "four-fifths", label: "4/5", correct: true }, { id: "two-fifths", label: "2/5", correct: false, signalIds: ["fraction.same-denominator"] }, { id: "same", label: "두 분수는 같아요", correct: false, signalIds: ["fraction.same-denominator"] }] },
    { id: "g3s2-measure-01", unitId: "measurement", learnerStageId: "measurement.capacity", curriculumAnchorIds: ["[4수03-17]", "[4수03-19]"], prompt: "1L는 몇 mL일까요?", visual: { kind: "measurement", amount: 1, unit: "L" }, interaction: { type: "measurement", version: 1 }, choices: [{ id: "1000ml", label: "1000mL", correct: true }, { id: "100ml", label: "100mL", correct: false, signalIds: ["measurement.capacity-unit"] }, { id: "10ml", label: "10mL", correct: false, signalIds: ["measurement.capacity-unit"] }] },
    { id: "g3s2-measure-02", unitId: "measurement", learnerStageId: "measurement.weight", curriculumAnchorIds: ["[4수03-20]"], prompt: "2kg 300g과 같은 무게는 무엇일까요?", visual: { kind: "measurement", amount: 2300, unit: "g" }, interaction: { type: "measurement", version: 1 }, choices: [{ id: "2300g", label: "2300g", correct: true }, { id: "2030g", label: "2030g", correct: false, signalIds: ["measurement.weight-unit"] }, { id: "300g", label: "300g", correct: false, signalIds: ["measurement.weight-unit"] }] },
    { id: "g3s2-graph-01", unitId: "pictograph", learnerStageId: "pictograph.legend", curriculumAnchorIds: ["[4수04-01]"], context: "● 한 개는 과일 2개를 나타냅니다.", prompt: "사과는 모두 몇 개일까요?", visual: { kind: "pictograph", symbol: "●", value: 2, rows: [{ label: "사과", count: 3 }, { label: "배", count: 2 }] }, interaction: { type: "pictograph", version: 1 }, choices: [{ id: "6", label: "6개", correct: true }, { id: "3", label: "3개", correct: false, signalIds: ["pictograph.legend"] }, { id: "5", label: "5개", correct: false, signalIds: ["pictograph.legend"] }] },
    { id: "g3s2-graph-02", unitId: "pictograph", learnerStageId: "pictograph.compare", curriculumAnchorIds: ["[4수04-01]"], context: "● 한 개는 과일 2개를 나타냅니다.", prompt: "사과는 배보다 몇 개 더 많을까요?", visual: { kind: "pictograph", symbol: "●", value: 2, rows: [{ label: "사과", count: 3 }, { label: "배", count: 2 }] }, interaction: { type: "pictograph", version: 1 }, choices: [{ id: "2", label: "2개", correct: true }, { id: "1", label: "1개", correct: false, signalIds: ["pictograph.difference"] }, { id: "4", label: "4개", correct: false, signalIds: ["pictograph.difference"] }] }
  ]
};

export const grade3Semester2Diagnosis = diagnosisSetSchema.parse(diagnosis) as DiagnosisSet;
