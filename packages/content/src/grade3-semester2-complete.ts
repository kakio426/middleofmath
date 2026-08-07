import type {
  DiagnosisSet,
  Judgment,
  LearnerStage,
  SignalDefinition
} from "@middle-of-math/domain";
import { grade3Semester2Anchor } from "./curriculum-anchor-registry";
import { grade3Semester2Diagnosis } from "./grade3-semester2";
import { diagnosisSetSchema } from "./schema";

type Answer = { id: string; label: string };
type JudgmentInput = Omit<Judgment, "choices" | "interaction"> & {
  signalId: string;
  answers: Answer[];
  interactionType?: "choice" | "fraction-bar" | "measurement" | "pictograph";
};

function makeJudgment(input: JudgmentInput): Judgment {
  const { signalId, answers, interactionType = "choice", ...judgment } = input;
  return {
    ...judgment,
    interaction: { type: interactionType, version: 1 },
    choices: answers.map((answer, index) => ({
      ...answer,
      correct: index === 0,
      ...(index === 0 ? {} : { signalIds: [signalId] })
    }))
  };
}

function makeSignal(
  id: string,
  title: string,
  severity: SignalDefinition["severity"],
  parentSummary: string,
  teacherInterpretation: string,
  teachingMove: string,
  homePrompt: string
): SignalDefinition {
  return {
    id,
    title,
    severity,
    teacherInterpretation,
    teachingMove,
    parentSummary,
    homePrompt
  };
}

const addedAnchors: DiagnosisSet["curriculumAnchors"] = [
  "[4수01-08]",
  "[4수03-18]",
  "[4수03-21]",
  "[4수03-22]",
  "[4수03-23]"
].map((id) => grade3Semester2Anchor(id, "v2"));

const existingStageUpdates: Record<string, Partial<LearnerStage>> = {
  "multiplication.place-value": { order: 1 },
  "multiplication.combine": { order: 2 },
  "division.remainder": { order: 6 },
  "division.equal-sharing": { order: 7 },
  "circle.parts": { order: 10 },
  "circle.diameter": { order: 12, curriculumAnchorIds: ["[4수03-06]"] },
  "fraction.part-whole": { order: 14 },
  "fraction.compare": { order: 19 },
  "measurement.capacity": {
    order: 22,
    curriculumAnchorIds: ["[4수03-18]"]
  },
  "measurement.weight": {
    order: 25,
    curriculumAnchorIds: ["[4수03-21]"]
  },
  "pictograph.legend": { order: 29 },
  "pictograph.compare": { order: 32 }
};

const addedStages: LearnerStage[] = [
  {
    id: "multiplication.two-digit",
    order: 3,
    unitId: "multiplication",
    title: "두 자리 수를 곱할 때 두 부분곱 만들기",
    shortTitle: "두 부분곱을 빠짐없이 구함",
    curriculumAnchorIds: ["[4수01-04]"],
    prerequisiteStageIds: ["multiplication.combine"]
  },
  {
    id: "multiplication.estimate",
    order: 4,
    unitId: "multiplication",
    title: "곱셈 결과가 어느 정도인지 어림하기",
    shortTitle: "곱셈 결과를 어림함",
    curriculumAnchorIds: ["[4수01-08]"],
    prerequisiteStageIds: ["multiplication.combine"]
  },
  {
    id: "division.meaning",
    order: 5,
    unitId: "division",
    title: "나눗셈을 똑같이 나누기와 묶음으로 읽기",
    shortTitle: "나눗셈의 뜻을 연결함",
    curriculumAnchorIds: ["[4수01-05]"],
    prerequisiteStageIds: []
  },
  {
    id: "division.remainder-check",
    order: 8,
    unitId: "division",
    title: "몫과 나머지를 곱셈으로 확인하기",
    shortTitle: "몫과 나머지를 확인함",
    curriculumAnchorIds: ["[4수01-05]", "[4수01-06]"],
    prerequisiteStageIds: ["division.equal-sharing"]
  },
  {
    id: "division.estimate",
    order: 9,
    unitId: "division",
    title: "나눗셈의 몫이 어느 정도인지 어림하기",
    shortTitle: "나눗셈의 몫을 어림함",
    curriculumAnchorIds: ["[4수01-08]"],
    prerequisiteStageIds: ["division.equal-sharing"]
  },
  {
    id: "circle.equal-radii",
    order: 11,
    unitId: "circle",
    title: "한 원의 반지름은 모두 같은 길이임을 알기",
    shortTitle: "반지름의 길이를 비교함",
    curriculumAnchorIds: ["[4수03-06]"],
    prerequisiteStageIds: ["circle.parts"]
  },
  {
    id: "circle.compass",
    order: 13,
    unitId: "circle",
    title: "컴퍼스의 벌어진 길이로 원 그리기",
    shortTitle: "컴퍼스로 원을 그림",
    curriculumAnchorIds: ["[4수03-07]"],
    prerequisiteStageIds: ["circle.equal-radii"]
  },
  {
    id: "fraction.discrete",
    order: 15,
    unitId: "fraction",
    title: "여러 개 중 분수만큼의 개수 찾기",
    shortTitle: "전체 개수의 분수만큼을 구함",
    curriculumAnchorIds: ["[4수01-09]"],
    prerequisiteStageIds: ["fraction.part-whole"]
  },
  {
    id: "fraction.unit",
    order: 16,
    unitId: "fraction",
    title: "똑같이 나눈 한 조각을 단위분수로 나타내기",
    shortTitle: "한 조각을 단위분수로 나타냄",
    curriculumAnchorIds: ["[4수01-10]"],
    prerequisiteStageIds: ["fraction.part-whole"]
  },
  {
    id: "fraction.types",
    order: 17,
    unitId: "fraction",
    title: "진분수, 가분수, 대분수 구분하기",
    shortTitle: "분수의 종류를 구분함",
    curriculumAnchorIds: ["[4수01-10]"],
    prerequisiteStageIds: ["fraction.unit"]
  },
  {
    id: "fraction.convert",
    order: 18,
    unitId: "fraction",
    title: "가분수와 대분수를 서로 바꾸기",
    shortTitle: "가분수와 대분수를 바꿈",
    curriculumAnchorIds: ["[4수01-10]"],
    prerequisiteStageIds: ["fraction.types"]
  },
  {
    id: "fraction.unit-compare",
    order: 20,
    unitId: "fraction",
    title: "단위분수의 크기 비교하기",
    shortTitle: "단위분수의 크기를 비교함",
    curriculumAnchorIds: ["[4수01-11]"],
    prerequisiteStageIds: ["fraction.unit"]
  },
  {
    id: "measurement.capacity-measure",
    order: 21,
    unitId: "measurement",
    title: "들이를 알맞은 단위로 어림하고 재기",
    shortTitle: "들이를 어림하고 잼",
    curriculumAnchorIds: ["[4수03-17]"],
    prerequisiteStageIds: []
  },
  {
    id: "measurement.capacity-arithmetic",
    order: 23,
    unitId: "measurement",
    title: "들이의 합과 차 구하기",
    shortTitle: "들이를 더하고 뺌",
    curriculumAnchorIds: ["[4수03-19]"],
    prerequisiteStageIds: ["measurement.capacity"]
  },
  {
    id: "measurement.weight-measure",
    order: 24,
    unitId: "measurement",
    title: "무게를 알맞은 단위로 어림하고 재기",
    shortTitle: "무게를 어림하고 잼",
    curriculumAnchorIds: ["[4수03-20]"],
    prerequisiteStageIds: []
  },
  {
    id: "measurement.ton",
    order: 26,
    unitId: "measurement",
    title: "t과 kg의 관계 알기",
    shortTitle: "t과 kg을 서로 바꿈",
    curriculumAnchorIds: ["[4수03-22]"],
    prerequisiteStageIds: ["measurement.weight"]
  },
  {
    id: "measurement.weight-arithmetic",
    order: 27,
    unitId: "measurement",
    title: "무게의 합과 차 구하기",
    shortTitle: "무게를 더하고 뺌",
    curriculumAnchorIds: ["[4수03-23]"],
    prerequisiteStageIds: ["measurement.weight"]
  },
  {
    id: "pictograph.classify-table",
    order: 28,
    unitId: "pictograph",
    title: "자료를 종류별로 세어 표로 정리하기",
    shortTitle: "자료를 나누어 셈",
    curriculumAnchorIds: ["[4수04-01]"],
    prerequisiteStageIds: []
  },
  {
    id: "pictograph.convert",
    order: 30,
    unitId: "pictograph",
    title: "그림 수를 실제 수량으로 바꾸기",
    shortTitle: "그림을 실제 수량으로 바꿈",
    curriculumAnchorIds: ["[4수04-01]"],
    prerequisiteStageIds: ["pictograph.legend"]
  },
  {
    id: "pictograph.complete",
    order: 31,
    unitId: "pictograph",
    title: "수량에 맞게 그림그래프 완성하기",
    shortTitle: "알맞은 그림 수를 정함",
    curriculumAnchorIds: ["[4수04-01]"],
    prerequisiteStageIds: ["pictograph.convert"]
  }
];

const addedSignals: SignalDefinition[] = [
  makeSignal("multiplication.two-digit-factor", "두 자리 수를 곱하는 부분곱", "medium", "두 자리 수를 십과 일로 나누어 각각 곱한 뒤 합치는 연습을 하고 있습니다.", "두 부분곱을 각각 구한 뒤 자릿값에 맞게 더하는 과정이 안정적이지 않습니다.", "곱하는 수를 십과 일로 나누고 두 곱을 각각 적게 하세요.", "23×12에서 12를 10과 2로 나누어 말해 보게 해주세요."),
  makeSignal("multiplication.estimate", "곱셈 결과 어림", "low", "곱셈 결과가 어느 정도인지 가까운 수로 먼저 가늠하는 연습을 하고 있습니다.", "곱셈의 크기를 자릿수와 연결하는 근거가 더 필요합니다.", "곱하는 수를 가까운 십의 자리 수로 바꾸어 먼저 계산하세요.", "48을 50으로 보았을 때 50×6이 얼마쯤인지 물어봐 주세요."),
  makeSignal("division.meaning", "나눗셈의 뜻과 곱셈 관계", "high", "전체와 한 묶음의 수를 보고 몇 묶음인지 찾는 관계를 익히고 있습니다.", "전체, 묶음 수, 한 묶음의 수를 서로 연결하는 과정이 흔들립니다.", "같은 수만큼 묶어 보고 곱셈식과 나눗셈식을 함께 쓰게 하세요.", "24개를 6개씩 묶으면 몇 묶음인지 함께 놓아보세요."),
  makeSignal("division.remainder-check", "몫과 나머지 확인", "medium", "몫과 나머지로 처음 수가 맞는지 다시 확인하는 연습을 하고 있습니다.", "나머지를 나누는 수보다 작게 남기고 원래 수를 확인하는 과정이 안정적이지 않습니다.", "나누는 수×몫+나머지로 원래 수가 되는지 확인하세요.", "29=4×7+1에서 각 수가 무엇을 뜻하는지 물어봐 주세요."),
  makeSignal("division.estimate", "나눗셈의 몫 어림", "low", "나누기 전에 몫이 몇 자리쯤 될지 가까운 수로 가늠하고 있습니다.", "나누어지는 수와 나누는 수의 크기로 몫을 가늠하는 근거가 더 필요합니다.", "나누어떨어지는 가까운 수를 먼저 찾아보게 하세요.", "83을 80으로 보아 80÷4를 먼저 구해 보게 해주세요."),
  makeSignal("circle.equal-radii", "한 원의 같은 반지름", "medium", "한 원의 중심에서 가장자리까지는 어느 방향이든 같은 길이임을 확인하고 있습니다.", "중심에서 원 위까지의 길이가 방향과 관계없이 같다는 성질을 적용하는 과정이 흔들립니다.", "중심에서 원 위의 여러 점까지 직접 재어 비교하세요.", "동전 가운데에서 가장자리까지 여러 방향으로 길이를 비교해 보세요."),
  makeSignal("circle.compass", "컴퍼스로 원 그리기", "medium", "컴퍼스의 침을 고정하고 같은 거리로 원을 그리는 방법을 익히고 있습니다.", "컴퍼스의 침, 연필, 벌어진 길이의 역할을 연결하는 근거가 더 필요합니다.", "침은 움직이지 않고 연필 쪽만 한 바퀴 돌리는 순서를 확인하세요.", "컴퍼스를 3cm 벌리면 어떤 길이가 3cm인지 물어봐 주세요."),
  makeSignal("fraction.discrete", "여러 개의 분수만큼", "medium", "여러 개를 똑같이 나눈 뒤 필요한 몫만큼의 개수를 찾고 있습니다.", "전체 개수를 같은 묶음으로 나눈 뒤 필요한 묶음을 고르는 과정이 흔들립니다.", "전체를 분모만큼 같은 묶음으로 나누고 분자만큼 고르게 하세요.", "12개를 3묶음으로 나눈 뒤 그중 1묶음의 개수를 물어봐 주세요."),
  makeSignal("fraction.unit", "단위분수", "high", "전체를 똑같이 나눈 한 조각을 1이 위에 오는 분수로 나타내고 있습니다.", "전체를 똑같이 나눈 한 조각과 단위분수를 연결하는 근거가 더 필요합니다.", "분자는 1로 두고 전체 조각 수를 분모에 놓게 하세요.", "전체를 7조각으로 나눈 한 조각을 분수로 말해 보게 해주세요."),
  makeSignal("fraction.types", "분수의 종류", "medium", "분자와 분모의 크기와 자연수 부분을 살펴 분수의 종류를 나누고 있습니다.", "분자와 분모의 크기를 보고 분수의 종류를 구분하는 과정이 안정적이지 않습니다.", "분자가 분모보다 작은지, 같거나 큰지를 먼저 표시하세요.", "7/5에서 위 수와 아래 수 중 어느 수가 큰지 물어봐 주세요."),
  makeSignal("fraction.convert", "가분수와 대분수 바꾸기", "high", "분모만큼씩 묶어 가분수와 대분수를 서로 바꾸는 방법을 익히고 있습니다.", "분모만큼 묶어 자연수 부분을 만드는 과정이 흔들립니다.", "분자를 분모만큼씩 묶고 남은 수를 따로 표시하세요.", "7개를 3개씩 묶으면 몇 묶음과 몇 개가 남는지 물어봐 주세요."),
  makeSignal("fraction.unit-compare", "단위분수 크기 비교", "medium", "같은 전체를 더 많이 나누면 한 조각이 더 작아지는 관계를 비교하고 있습니다.", "같은 전체를 더 많이 나눌수록 한 조각이 작아진다는 관계가 흔들립니다.", "같은 길이의 막대를 서로 다른 수로 나누어 한 조각씩 겹쳐 보세요.", "같은 피자를 3조각과 5조각으로 나눌 때 어느 한 조각이 큰지 물어봐 주세요."),
  makeSignal("measurement.capacity-measure", "들이 측정과 어림", "low", "컵과 물통의 크기에 맞추어 mL와 L를 골라 들이를 어림하고 있습니다.", "물건의 들이에 맞는 단위와 어림값을 고르는 근거가 더 필요합니다.", "작은 용기는 mL, 큰 용기는 L로 먼저 나누어 보세요.", "컵과 물통 중 어느 것의 들이를 L로 재기 좋은지 물어봐 주세요."),
  makeSignal("measurement.capacity-arithmetic", "들이의 합과 차", "medium", "L와 mL를 같은 단위끼리 맞추어 들이를 더하고 빼고 있습니다.", "L끼리, mL끼리 계산하고 단위를 정리하는 과정이 흔들립니다.", "L와 mL를 세로로 나란히 놓고 같은 단위끼리 계산하세요.", "2L 300mL와 1L 500mL를 같은 단위끼리 더해 보게 해주세요."),
  makeSignal("measurement.weight-measure", "무게 측정과 어림", "low", "물건의 크기와 무게에 맞추어 g과 kg을 골라 어림하고 있습니다.", "물건의 무게에 맞는 단위와 어림값을 고르는 근거가 더 필요합니다.", "가벼운 물건은 g, 무거운 생활 물건은 kg으로 먼저 나누어 보세요.", "클립과 가방 중 어느 것을 kg으로 재기 좋은지 물어봐 주세요."),
  makeSignal("measurement.ton", "t과 kg의 관계", "high", "아주 무거운 물건의 단위 t을 kg과 연결하여 바꾸는 연습을 하고 있습니다.", "t을 kg으로 바꿀 때 1t=1000kg을 적용하는 과정이 안정적이지 않습니다.", "1t=1000kg을 수직선이나 묶음으로 확인하세요.", "2t은 1000kg이 몇 번인지 물어봐 주세요."),
  makeSignal("measurement.weight-arithmetic", "무게의 합과 차", "medium", "kg과 g을 같은 단위끼리 맞추어 무게를 더하고 빼고 있습니다.", "kg끼리, g끼리 계산하고 단위를 정리하는 과정이 흔들립니다.", "kg과 g를 세로로 나란히 놓고 같은 단위끼리 계산하세요.", "2kg 400g과 1kg 300g을 같은 단위끼리 더해 보게 해주세요."),
  makeSignal("pictograph.classify-table", "자료 분류와 표", "medium", "자료를 종류별로 빠짐없이 나누어 세고 표에 옮기고 있습니다.", "자료를 종류별로 빠짐없이 세어 표에 옮기는 과정이 흔들립니다.", "자료를 하나씩 표시하며 종류별 칸에 바를 정자로 세게 하세요.", "빨강과 파랑 물건을 나누어 각각 몇 개인지 세어 보세요."),
  makeSignal("pictograph.convert", "그림 수와 실제 수량", "medium", "그림의 개수에 범례의 값을 적용하여 실제 수량으로 바꾸고 있습니다.", "그림 수에 범례의 수를 곱해 실제 수량으로 바꾸는 과정이 안정적이지 않습니다.", "그림을 하나 짚을 때마다 범례만큼 뛰어 세게 하세요.", "그림 한 개가 5일 때 그림 네 개를 5씩 뛰어 세어 보세요."),
  makeSignal("pictograph.complete", "그림그래프 완성", "medium", "실제 수량에 범례가 몇 번 들어가는지 찾아 필요한 그림 수를 정하고 있습니다.", "실제 수량을 범례로 나누어 필요한 그림 수를 정하는 과정이 흔들립니다.", "실제 수량에 범례가 몇 번 들어가는지 묶어 보세요.", "20을 5씩 묶으면 그림이 몇 개 필요한지 물어봐 주세요.")
];

const addedJudgments: Judgment[] = [
  makeJudgment({
    id: "g3s2-mul-03", unitId: "multiplication", learnerStageId: "multiplication.place-value",
    curriculumAnchorIds: ["[4수01-04]"], context: "붙임 딱지가 324장씩 든 상자가 3개 있어요.",
    prompt: "324×3에서 300장씩만 먼저 세면 몇 장일까요?",
    visual: { kind: "none" },
    signalId: "multiplication.place-value-loss",
    answers: [{ id: "900", label: "900장" }, { id: "90", label: "90장" }, { id: "327", label: "327장" }]
  }),
  makeJudgment({
    id: "g3s2-mul-04", unitId: "multiplication", learnerStageId: "multiplication.combine",
    curriculumAnchorIds: ["[4수01-04]"], context: "연필이 247자루씩 든 상자가 3개 있어요.",
    prompt: "200×3은 600, 40×3은 120, 7×3은 21이에요. 연필은 모두 몇 자루일까요?",
    visual: { kind: "none" }, signalId: "multiplication.partial-product",
    answers: [{ id: "741", label: "741자루" }, { id: "721", label: "721자루" }, { id: "621", label: "621자루" }]
  }),
  makeJudgment({
    id: "g3s2-mul-05", unitId: "multiplication", learnerStageId: "multiplication.two-digit",
    curriculumAnchorIds: ["[4수01-04]"], prompt: "23×12에서 23×10은 230, 23×2는 46이에요. 답은 얼마일까요?",
    visual: { kind: "none" }, signalId: "multiplication.two-digit-factor",
    answers: [{ id: "276", label: "276" }, { id: "2346", label: "2346" }, { id: "253", label: "253" }]
  }),
  makeJudgment({
    id: "g3s2-mul-06", unitId: "multiplication", learnerStageId: "multiplication.two-digit",
    curriculumAnchorIds: ["[4수01-04]"], context: "한 상자에 연필이 14자루씩 있고 상자가 21개 있어요.",
    prompt: "연필은 모두 몇 자루일까요?", visual: { kind: "none" },
    signalId: "multiplication.two-digit-factor",
    answers: [{ id: "294", label: "294자루" }, { id: "284", label: "284자루" }, { id: "35", label: "35자루" }]
  }),
  makeJudgment({
    id: "g3s2-mul-07", unitId: "multiplication", learnerStageId: "multiplication.estimate",
    curriculumAnchorIds: ["[4수01-08]"], prompt: "48×6은 어느 수에 가장 가까울까요?",
    visual: { kind: "none" }, signalId: "multiplication.estimate",
    answers: [{ id: "300", label: "300" }, { id: "30", label: "30" }, { id: "3000", label: "3000" }]
  }),
  makeJudgment({
    id: "g3s2-mul-08", unitId: "multiplication", learnerStageId: "multiplication.estimate",
    curriculumAnchorIds: ["[4수01-08]"], context: "한 줄에 의자가 31개쯤 있고 이런 줄이 19줄쯤 있어요.",
    prompt: "의자는 모두 몇 개쯤일까요?", visual: { kind: "none" },
    signalId: "multiplication.estimate",
    answers: [{ id: "about-600", label: "600개쯤" }, { id: "about-60", label: "60개쯤" }, { id: "about-6000", label: "6000개쯤" }]
  }),
  makeJudgment({
    id: "g3s2-div-03", unitId: "division", learnerStageId: "division.remainder",
    curriculumAnchorIds: ["[4수01-05]", "[4수01-06]"], context: "상자 4개에 공을 10개씩 먼저 담았더니 아직 28개가 남았어요.",
    prompt: "처음에 공은 모두 몇 개였을까요?",
    visual: { kind: "none" }, signalId: "division.leftover",
    answers: [{ id: "68-total", label: "68개" }, { id: "40-total", label: "40개" }, { id: "28-left", label: "28개" }]
  }),
  makeJudgment({
    id: "g3s2-div-04", unitId: "division", learnerStageId: "division.equal-sharing",
    curriculumAnchorIds: ["[4수01-05]", "[4수01-06]"],
    prompt: "공 18개를 상자 3개에 똑같이 담으면 한 상자에 몇 개씩 담을까요?",
    visual: { kind: "none" }, signalId: "division.equal-share",
    answers: [{ id: "6", label: "6개" }, { id: "3-boxes", label: "3개" }, { id: "21", label: "21개" }]
  }),
  makeJudgment({
    id: "g3s2-div-05", unitId: "division", learnerStageId: "division.meaning",
    curriculumAnchorIds: ["[4수01-05]"], prompt: "24개를 6개씩 묶으면 몇 묶음일까요?",
    visual: {
      kind: "item-collection",
      ariaLabel: "묶기 전 공 24개",
      items: Array.from({ length: 24 }, () => "●")
    },
    signalId: "division.meaning",
    answers: [{ id: "4-groups", label: "4묶음" }, { id: "6-groups", label: "6묶음" }, { id: "18-groups", label: "18묶음" }]
  }),
  makeJudgment({
    id: "g3s2-div-06", unitId: "division", learnerStageId: "division.meaning",
    curriculumAnchorIds: ["[4수01-05]"], context: "쿠키 35개를 접시 5개에 똑같이 나누어 놓았어요.",
    prompt: "한 접시의 쿠키 수를 구하는 식은 무엇일까요?",
    visual: { kind: "division-groups", total: 35, groups: 5 }, signalId: "division.meaning",
    answers: [{ id: "35-div-5", label: "35÷5=7" }, { id: "35-div-5-wrong", label: "35÷5=5" }, { id: "35-minus-5", label: "35-5=30" }]
  }),
  makeJudgment({
    id: "g3s2-div-07", unitId: "division", learnerStageId: "division.remainder-check",
    curriculumAnchorIds: ["[4수01-05]", "[4수01-06]"], prompt: "29÷4의 몫이 7, 나머지가 1인지 확인하는 식은 무엇일까요?",
    visual: { kind: "none" }, signalId: "division.remainder-check",
    answers: [{ id: "4x7-plus1", label: "4×7+1=29" }, { id: "4x7-minus1", label: "4×7-1=27" }, { id: "4plus7plus1", label: "4+7+1=12" }]
  }),
  makeJudgment({
    id: "g3s2-div-08", unitId: "division", learnerStageId: "division.remainder-check",
    curriculumAnchorIds: ["[4수01-05]", "[4수01-06]"], prompt: "47개를 6개씩 묶으면 7묶음이 되고 5개가 남아요. 알맞은 식은 무엇일까요?",
    visual: { kind: "division-groups", total: 47, groups: 7 }, signalId: "division.remainder-check",
    // 선택지 ID 는 2.1.0 발행으로 고정됐다. 학생 응답이 이 ID 를 참조하므로
    // 값을 바꿔도 ID 는 옛 값을 이름으로 유지한다. 라벨이 실제 선택지다.
    answers: [{ id: "6x7-plus5", label: "6×7+5=47" }, { id: "6x5-plus7", label: "6×5+7=37" }, { id: "7x5-plus6", label: "6+7+5=18" }]
  }),
  makeJudgment({
    id: "g3s2-div-09", unitId: "division", learnerStageId: "division.estimate",
    curriculumAnchorIds: ["[4수01-08]"], prompt: "83÷4의 몫은 어느 수에 가장 가까울까요?",
    visual: { kind: "none" }, signalId: "division.estimate",
    answers: [{ id: "about-20", label: "20쯤" }, { id: "about-2", label: "2쯤" }, { id: "about-200", label: "200쯤" }]
  }),
  makeJudgment({
    id: "g3s2-div-10", unitId: "division", learnerStageId: "division.estimate",
    curriculumAnchorIds: ["[4수01-08]"], context: "구슬 158개를 8명에게 비슷하게 나누려고 해요.",
    prompt: "한 사람에게 몇 개쯤 돌아갈까요?", visual: { kind: "none" },
    signalId: "division.estimate",
    // 선택지 ID 는 2.1.0 발행으로 고정됐다. 학생 응답이 이 ID 를 참조하므로
    // 값을 바꿔도 ID 는 옛 값을 이름으로 유지한다. 라벨이 실제 선택지다.
    answers: [{ id: "about-20-each", label: "20개쯤" }, { id: "about-2-each", label: "2개쯤" }, { id: "about-80-each", label: "200개쯤" }]
  }),
  makeJudgment({
    id: "g3s2-circle-03", unitId: "circle", learnerStageId: "circle.parts",
    curriculumAnchorIds: ["[4수03-06]"], context: "동전의 가운데를 O, 가장자리의 한 점을 A라고 했어요.",
    prompt: "O와 A를 곧게 이은 선분의 이름은 무엇일까요?",
    visual: { kind: "circle", mode: "radius" }, signalId: "circle.center-radius",
    answers: [{ id: "radius-oa", label: "반지름" }, { id: "diameter-oa", label: "지름" }, { id: "center-oa", label: "중심" }]
  }),
  makeJudgment({
    id: "g3s2-circle-04", unitId: "circle", learnerStageId: "circle.diameter",
    curriculumAnchorIds: ["[4수03-06]"], context: "둥근 시계의 중심에서 가장자리까지는 6cm예요.",
    prompt: "중심을 지나 한쪽 가장자리에서 반대쪽 가장자리까지는 몇 cm일까요?",
    visual: { kind: "circle", mode: "diameter", radiusValue: 6 }, signalId: "circle.radius-diameter",
    answers: [{ id: "12cm", label: "12cm" }, { id: "6cm", label: "6cm" }, { id: "36cm", label: "36cm" }]
  }),
  makeJudgment({
    id: "g3s2-circle-05", unitId: "circle", learnerStageId: "circle.equal-radii",
    curriculumAnchorIds: ["[4수03-06]"], prompt: "한 원에서 반지름 OA가 3cm예요. 다른 반지름 OB는 몇 cm일까요?",
    visual: { kind: "circle", mode: "equal-radii", radiusValue: 3 }, signalId: "circle.equal-radii",
    answers: [{ id: "3cm", label: "3cm" }, { id: "6cm", label: "6cm" }, { id: "1cm", label: "1cm" }]
  }),
  makeJudgment({
    id: "g3s2-circle-06", unitId: "circle", learnerStageId: "circle.equal-radii",
    curriculumAnchorIds: ["[4수03-06]"], context: "동전의 가운데에서 가장자리의 여러 점까지 길이를 재었어요.",
    prompt: "길이는 어떻게 될까요?", visual: { kind: "circle", mode: "equal-radii" },
    signalId: "circle.equal-radii",
    answers: [{ id: "all-same", label: "모두 같아요" }, { id: "all-different", label: "모두 달라요" }, { id: "one-double", label: "한 곳만 두 배예요" }]
  }),
  makeJudgment({
    id: "g3s2-circle-07", unitId: "circle", learnerStageId: "circle.compass",
    curriculumAnchorIds: ["[4수03-07]"], prompt: "컴퍼스로 원을 그릴 때 움직이지 않게 두는 곳은 어디일까요?",
    visual: { kind: "circle", mode: "compass-center" }, signalId: "circle.compass",
    answers: [{ id: "needle", label: "침이 닿은 곳" }, { id: "pencil", label: "연필이 닿은 곳" }, { id: "both-move", label: "두 곳 모두" }]
  }),
  makeJudgment({
    id: "g3s2-circle-08", unitId: "circle", learnerStageId: "circle.compass",
    curriculumAnchorIds: ["[4수03-07]"], prompt: "컴퍼스를 5cm 벌려 그린 원의 반지름은 얼마일까요?",
    visual: { kind: "circle", mode: "compass-radius", radiusValue: 5 }, signalId: "circle.compass",
    // 선택지 ID 는 2.1.0 발행으로 고정됐다. 학생 응답이 이 ID 를 참조하므로
    // 값을 바꿔도 ID 는 옛 값을 이름으로 유지한다. 라벨이 실제 선택지다.
    answers: [{ id: "5cm", label: "5cm" }, { id: "10cm", label: "10cm" }, { id: "25cm", label: "그릴 때마다 달라져요" }]
  })
];

const fractionMeasurementGraphJudgments: Judgment[] = [
  makeJudgment({
    id: "g3s2-frac-03", unitId: "fraction", learnerStageId: "fraction.part-whole",
    curriculumAnchorIds: ["[4수01-09]", "[4수01-10]"], context: "초콜릿 한 판을 똑같은 8조각으로 나누어 5조각을 남겼어요.",
    prompt: "남은 양은 전체의 얼마일까요?",
    visual: { kind: "fraction-bar", numerator: 5, denominator: 8 }, interactionType: "fraction-bar",
    signalId: "fraction.part-whole",
    answers: [{ id: "five-eighths", label: "5/8" }, { id: "eight-fifths", label: "8/5" }, { id: "five-ones", label: "5/1" }]
  }),
  makeJudgment({
    id: "g3s2-frac-04", unitId: "fraction", learnerStageId: "fraction.compare",
    curriculumAnchorIds: ["[4수01-11]"], context: "같은 크기의 두 병에 주스가 각각 3/7, 6/7만큼 들어 있어요.",
    prompt: "주스가 더 많이 든 병은 어느 쪽일까요?",
    visual: { kind: "none" }, interactionType: "fraction-bar",
    signalId: "fraction.same-denominator",
    answers: [{ id: "six-sevenths", label: "6/7" }, { id: "three-sevenths", label: "3/7" }, { id: "same-seven", label: "두 분수는 같아요" }]
  }),
  makeJudgment({
    id: "g3s2-frac-05", unitId: "fraction", learnerStageId: "fraction.discrete",
    curriculumAnchorIds: ["[4수01-09]"], prompt: "단추 12개의 1/3은 몇 개일까요?",
    visual: {
      kind: "item-collection",
      ariaLabel: "흩어져 있는 단추 12개",
      items: Array.from({ length: 12 }, () => "●")
    }, interactionType: "fraction-bar",
    signalId: "fraction.discrete",
    answers: [{ id: "4-buttons", label: "4개" }, { id: "3-buttons", label: "3개" }, { id: "9-buttons", label: "9개" }]
  }),
  makeJudgment({
    id: "g3s2-frac-06", unitId: "fraction", learnerStageId: "fraction.discrete",
    curriculumAnchorIds: ["[4수01-09]"], context: "붙임 딱지가 20장 있어요.",
    prompt: "20장의 3/5은 몇 장일까요?",
    visual: {
      kind: "item-collection",
      ariaLabel: "흩어져 있는 붙임 딱지 20장",
      items: Array.from({ length: 20 }, () => "■")
    }, interactionType: "fraction-bar",
    signalId: "fraction.discrete",
    answers: [{ id: "12-stickers", label: "12장" }, { id: "4-stickers", label: "4장" }, { id: "15-stickers", label: "15장" }]
  }),
  makeJudgment({
    id: "g3s2-frac-07", unitId: "fraction", learnerStageId: "fraction.unit",
    curriculumAnchorIds: ["[4수01-10]"], prompt: "전체를 7조각으로 똑같이 나눈 한 조각은 얼마일까요?",
    visual: { kind: "fraction-bar", numerator: 1, denominator: 7 }, interactionType: "fraction-bar",
    signalId: "fraction.unit",
    answers: [{ id: "one-seventh", label: "1/7" }, { id: "seven-ones", label: "7/1" }, { id: "one-sixth", label: "1/6" }]
  }),
  makeJudgment({
    id: "g3s2-frac-08", unitId: "fraction", learnerStageId: "fraction.unit",
    curriculumAnchorIds: ["[4수01-10]"], context: "리본 한 줄을 9도막으로 똑같이 잘랐어요.",
    prompt: "한 도막은 전체의 얼마일까요?", visual: { kind: "fraction-bar", numerator: 1, denominator: 9 }, interactionType: "fraction-bar",
    signalId: "fraction.unit",
    answers: [{ id: "one-ninth", label: "1/9" }, { id: "nine-ones", label: "9/1" }, { id: "one-tenth", label: "1/10" }]
  }),
  makeJudgment({
    id: "g3s2-frac-09", unitId: "fraction", learnerStageId: "fraction.types",
    curriculumAnchorIds: ["[4수01-10]"], prompt: "7/5는 어떤 분수일까요?",
    visual: { kind: "none" },
    signalId: "fraction.types",
    answers: [{ id: "improper", label: "가분수" }, { id: "proper", label: "진분수" }, { id: "mixed", label: "대분수" }]
  }),
  makeJudgment({
    id: "g3s2-frac-10", unitId: "fraction", learnerStageId: "fraction.types",
    curriculumAnchorIds: ["[4수01-10]"], prompt: "1과 2/3처럼 자연수와 진분수가 함께 있는 분수는 무엇일까요?",
    visual: { kind: "none" }, signalId: "fraction.types",
    answers: [{ id: "mixed-number", label: "대분수" }, { id: "proper-number", label: "진분수" }, { id: "unit-number", label: "단위분수" }]
  }),
  makeJudgment({
    id: "g3s2-frac-11", unitId: "fraction", learnerStageId: "fraction.convert",
    curriculumAnchorIds: ["[4수01-10]"], prompt: "7/3을 대분수로 나타내면 무엇일까요?",
    visual: { kind: "none" },
    signalId: "fraction.convert",
    answers: [{ id: "two-and-one-third", label: "2와 1/3" }, { id: "one-and-two-thirds", label: "1과 2/3" }, { id: "three-and-one-third", label: "3과 1/3" }]
  }),
  makeJudgment({
    id: "g3s2-frac-12", unitId: "fraction", learnerStageId: "fraction.convert",
    curriculumAnchorIds: ["[4수01-10]"], prompt: "3과 1/4을 가분수로 나타내면 무엇일까요?",
    visual: { kind: "none" }, signalId: "fraction.convert",
    answers: [{ id: "thirteen-fourths", label: "13/4" }, { id: "seven-fourths", label: "7/4" }, { id: "three-fourths-convert", label: "3/4" }]
  }),
  makeJudgment({
    id: "g3s2-frac-13", unitId: "fraction", learnerStageId: "fraction.unit-compare",
    curriculumAnchorIds: ["[4수01-11]"], prompt: "1/3과 1/5 중 더 큰 분수는 무엇일까요?",
    visual: { kind: "none" }, interactionType: "fraction-bar",
    signalId: "fraction.unit-compare",
    answers: [{ id: "one-third", label: "1/3" }, { id: "one-fifth", label: "1/5" }, { id: "same-unit", label: "두 분수는 같아요" }]
  }),
  makeJudgment({
    id: "g3s2-frac-14", unitId: "fraction", learnerStageId: "fraction.unit-compare",
    curriculumAnchorIds: ["[4수01-11]"], context: "같은 크기의 떡을 하나는 8조각, 하나는 6조각으로 똑같이 나눴어요.",
    prompt: "한 조각이 더 큰 것은 어느 쪽일까요?", visual: { kind: "none" }, interactionType: "fraction-bar",
    signalId: "fraction.unit-compare",
    answers: [{ id: "one-sixth", label: "1/6" }, { id: "one-eighth", label: "1/8" }, { id: "same-piece", label: "두 조각은 같아요" }]
  }),
  makeJudgment({
    id: "g3s2-measure-03", unitId: "measurement", learnerStageId: "measurement.capacity",
    curriculumAnchorIds: ["[4수03-18]"], prompt: "2L 300mL를 mL로만 나타내면 얼마일까요?",
    visual: {
      kind: "unit-relation",
      medium: "capacity",
      given: [{ value: 2, unit: "L" }, { value: 300, unit: "mL" }],
      targetUnit: "mL"
    }, interactionType: "measurement",
    signalId: "measurement.capacity-unit",
    answers: [{ id: "2300ml", label: "2300mL" }, { id: "2030ml", label: "2030mL" }, { id: "300ml", label: "300mL" }]
  }),
  makeJudgment({
    id: "g3s2-measure-04", unitId: "measurement", learnerStageId: "measurement.weight",
    curriculumAnchorIds: ["[4수03-21]"], prompt: "3kg 50g을 g으로만 나타내면 얼마일까요?",
    visual: {
      kind: "unit-relation",
      medium: "weight",
      given: [{ value: 3, unit: "kg" }, { value: 50, unit: "g" }],
      targetUnit: "g"
    }, interactionType: "measurement",
    signalId: "measurement.weight-unit",
    answers: [{ id: "3050g", label: "3050g" }, { id: "350g", label: "350g" }, { id: "3005g", label: "3005g" }]
  }),
  makeJudgment({
    id: "g3s2-measure-05", unitId: "measurement", learnerStageId: "measurement.capacity-measure",
    curriculumAnchorIds: ["[4수03-17]"], prompt: "종이컵 한 컵의 들이로 알맞은 것은 무엇일까요?",
    visual: {
      kind: "measure-referent",
      medium: "capacity",
      object: "paper-cup",
      instrument: "beaker"
    }, interactionType: "measurement",
    signalId: "measurement.capacity-measure",
    answers: [{ id: "about-200ml", label: "약 200mL" }, { id: "about-200l", label: "약 200L" }, { id: "about-2ml", label: "약 2mL" }]
  }),
  makeJudgment({
    id: "g3s2-measure-06", unitId: "measurement", learnerStageId: "measurement.capacity-measure",
    curriculumAnchorIds: ["[4수03-17]"], context: "큰 물통 하나에 물이 가득 들어 있어요.",
    prompt: "물통의 들이로 알맞은 것은 무엇일까요?",
    visual: {
      kind: "measure-referent",
      medium: "capacity",
      object: "water-bottle",
      instrument: "beaker"
    }, interactionType: "measurement",
    signalId: "measurement.capacity-measure",
    answers: [{ id: "about-8l", label: "약 8L" }, { id: "about-8ml", label: "약 8mL" }, { id: "about-800l", label: "약 800L" }]
  }),
  makeJudgment({
    id: "g3s2-measure-07", unitId: "measurement", learnerStageId: "measurement.capacity-arithmetic",
    curriculumAnchorIds: ["[4수03-19]"], prompt: "2L 300mL와 1L 500mL를 더하면 얼마일까요?",
    visual: {
      kind: "quantity-combine",
      medium: "capacity",
      operator: "add",
      left: [{ value: 2, unit: "L" }, { value: 300, unit: "mL" }],
      right: [{ value: 1, unit: "L" }, { value: 500, unit: "mL" }]
    }, interactionType: "measurement",
    signalId: "measurement.capacity-arithmetic",
    answers: [{ id: "3l800ml", label: "3L 800mL" }, { id: "3l80ml", label: "3L 80mL" }, { id: "1l200ml", label: "1L 200mL" }]
  }),
  makeJudgment({
    id: "g3s2-measure-08", unitId: "measurement", learnerStageId: "measurement.capacity-arithmetic",
    curriculumAnchorIds: ["[4수03-19]"], context: "물 5L에서 2L 750mL를 사용했어요.",
    prompt: "남은 물은 얼마일까요?",
    visual: {
      kind: "quantity-combine",
      medium: "capacity",
      operator: "subtract",
      left: [{ value: 5, unit: "L" }],
      right: [{ value: 2, unit: "L" }, { value: 750, unit: "mL" }]
    }, interactionType: "measurement",
    signalId: "measurement.capacity-arithmetic",
    answers: [{ id: "2l250ml", label: "2L 250mL" }, { id: "3l250ml", label: "3L 250mL" }, { id: "2l750ml", label: "2L 750mL" }]
  }),
  makeJudgment({
    id: "g3s2-measure-09", unitId: "measurement", learnerStageId: "measurement.weight-measure",
    curriculumAnchorIds: ["[4수03-20]"], prompt: "수박 한 통의 무게로 알맞은 것은 무엇일까요?",
    visual: {
      kind: "measure-referent",
      medium: "weight",
      object: "watermelon",
      instrument: "scale"
    }, interactionType: "measurement",
    signalId: "measurement.weight-measure",
    answers: [{ id: "about-4kg", label: "약 4kg" }, { id: "about-4g", label: "약 4g" }, { id: "about-400kg", label: "약 400kg" }]
  }),
  makeJudgment({
    id: "g3s2-measure-10", unitId: "measurement", learnerStageId: "measurement.weight-measure",
    curriculumAnchorIds: ["[4수03-20]"], context: "작은 종이 클립 하나를 재려고 해요.",
    prompt: "알맞은 무게는 무엇일까요?",
    visual: {
      kind: "measure-referent",
      medium: "weight",
      object: "paper-clip",
      instrument: "scale"
    }, interactionType: "measurement",
    signalId: "measurement.weight-measure",
    answers: [{ id: "about-1g", label: "약 1g" }, { id: "about-1kg", label: "약 1kg" }, { id: "about-100kg", label: "약 100kg" }]
  }),
  makeJudgment({
    id: "g3s2-measure-11", unitId: "measurement", learnerStageId: "measurement.ton",
    curriculumAnchorIds: ["[4수03-22]"], prompt: "1t은 몇 kg일까요?",
    visual: {
      kind: "unit-relation",
      medium: "weight",
      given: [{ value: 1, unit: "t" }],
      targetUnit: "kg"
    }, interactionType: "measurement",
    signalId: "measurement.ton",
    answers: [{ id: "1000kg", label: "1000kg" }, { id: "100kg", label: "100kg" }, { id: "10000kg", label: "10000kg" }]
  }),
  makeJudgment({
    id: "g3s2-measure-12", unitId: "measurement", learnerStageId: "measurement.ton",
    curriculumAnchorIds: ["[4수03-22]"], context: "트럭에 실은 짐의 무게가 2t 500kg이에요.",
    prompt: "kg으로만 나타내면 얼마일까요?",
    visual: {
      kind: "unit-relation",
      medium: "weight",
      given: [{ value: 2, unit: "t" }, { value: 500, unit: "kg" }],
      targetUnit: "kg"
    }, interactionType: "measurement",
    signalId: "measurement.ton",
    answers: [{ id: "2500kg", label: "2500kg" }, { id: "2050kg", label: "2050kg" }, { id: "500kg", label: "500kg" }]
  }),
  makeJudgment({
    id: "g3s2-measure-13", unitId: "measurement", learnerStageId: "measurement.weight-arithmetic",
    curriculumAnchorIds: ["[4수03-23]"], prompt: "2kg 400g과 1kg 300g을 더하면 얼마일까요?",
    visual: {
      kind: "quantity-combine",
      medium: "weight",
      operator: "add",
      left: [{ value: 2, unit: "kg" }, { value: 400, unit: "g" }],
      right: [{ value: 1, unit: "kg" }, { value: 300, unit: "g" }]
    }, interactionType: "measurement",
    signalId: "measurement.weight-arithmetic",
    answers: [{ id: "3kg700g", label: "3kg 700g" }, { id: "3kg100g", label: "3kg 100g" }, { id: "1kg100g", label: "1kg 100g" }]
  }),
  makeJudgment({
    id: "g3s2-measure-14", unitId: "measurement", learnerStageId: "measurement.weight-arithmetic",
    curriculumAnchorIds: ["[4수03-23]"], context: "쌀 5kg에서 2kg 800g을 덜어 냈어요.",
    prompt: "남은 쌀의 무게는 얼마일까요?",
    visual: {
      kind: "quantity-combine",
      medium: "weight",
      operator: "subtract",
      left: [{ value: 5, unit: "kg" }],
      right: [{ value: 2, unit: "kg" }, { value: 800, unit: "g" }]
    }, interactionType: "measurement",
    signalId: "measurement.weight-arithmetic",
    answers: [{ id: "2kg200g", label: "2kg 200g" }, { id: "3kg200g", label: "3kg 200g" }, { id: "2kg800g", label: "2kg 800g" }]
  }),
  makeJudgment({
    id: "g3s2-graph-03", unitId: "pictograph", learnerStageId: "pictograph.legend",
    curriculumAnchorIds: ["[4수04-01]"], context: "★ 한 개는 책 5권을 나타냅니다.",
    prompt: "그림그래프에 나타낸 책은 모두 몇 권일까요?",
    visual: { kind: "pictograph", symbol: "★", value: 5, rows: [{ label: "책", count: 4 }] }, interactionType: "pictograph",
    signalId: "pictograph.legend",
    answers: [{ id: "20-books", label: "20권" }, { id: "4-books", label: "4권" }, { id: "5-books", label: "5권" }]
  }),
  makeJudgment({
    id: "g3s2-graph-04", unitId: "pictograph", learnerStageId: "pictograph.compare",
    curriculumAnchorIds: ["[4수04-01]"], context: "● 한 개는 학생 3명을 나타냅니다.",
    prompt: "축구는 ● 5개, 야구는 ● 3개, 농구는 ● 1개예요. 야구와 농구를 합한 수는 축구와 몇 명 차이일까요?",
    visual: { kind: "pictograph", symbol: "●", value: 3, rows: [{ label: "축구", count: 5 }, { label: "야구", count: 3 }, { label: "농구", count: 1 }] }, interactionType: "pictograph",
    signalId: "pictograph.difference",
    answers: [{ id: "3-students", label: "3명" }, { id: "1-student", label: "1명" }, { id: "9-students", label: "9명" }]
  }),
  makeJudgment({
    id: "g3s2-graph-05", unitId: "pictograph", learnerStageId: "pictograph.classify-table",
    curriculumAnchorIds: ["[4수04-01]"], context: "공을 색깔에 따라 나누어 세어 보세요.",
    prompt: "빨간색 공은 몇 개일까요?",
    visual: {
      kind: "item-collection",
      ariaLabel: "빨간색 공, 파란색 공, 빨간색 공, 노란색 공, 파란색 공, 빨간색 공",
      items: ["🔴", "🔵", "🔴", "🟡", "🔵", "🔴"]
    },
    signalId: "pictograph.classify-table",
    answers: [{ id: "3-red", label: "3개" }, { id: "2-red", label: "2개" }, { id: "6-red", label: "6개" }]
  }),
  makeJudgment({
    id: "g3s2-graph-06", unitId: "pictograph", learnerStageId: "pictograph.classify-table",
    curriculumAnchorIds: ["[4수04-01]"], context: "동물 그림을 종류별로 나누어 세어 보세요.",
    prompt: "토끼는 몇 마리일까요?",
    visual: {
      kind: "item-collection",
      ariaLabel: "고양이, 토끼, 강아지, 고양이, 토끼, 강아지, 고양이",
      items: ["🐱", "🐰", "🐶", "🐱", "🐰", "🐶", "🐱"]
    },
    signalId: "pictograph.classify-table",
    answers: [{ id: "2-rabbits", label: "2마리" }, { id: "3-rabbits", label: "3마리" }, { id: "7-rabbits", label: "7마리" }]
  }),
  makeJudgment({
    id: "g3s2-graph-07", unitId: "pictograph", learnerStageId: "pictograph.convert",
    curriculumAnchorIds: ["[4수04-01]"], context: "● 한 개는 귤 2개를 나타냅니다.",
    prompt: "●가 4개이면 귤은 모두 몇 개일까요?",
    visual: { kind: "pictograph", symbol: "●", value: 2, rows: [{ label: "귤", count: 4 }] }, interactionType: "pictograph",
    signalId: "pictograph.convert",
    answers: [{ id: "8-tangerines", label: "8개" }, { id: "6-tangerines", label: "6개" }, { id: "4-tangerines", label: "4개" }]
  }),
  makeJudgment({
    id: "g3s2-graph-08", unitId: "pictograph", learnerStageId: "pictograph.convert",
    curriculumAnchorIds: ["[4수04-01]"], context: "■ 한 개는 나무 10그루를 나타냅니다.",
    prompt: "공원 A에 ■ 3개, 공원 B에 ■ 2개가 있어요. 두 공원의 나무는 모두 몇 그루일까요?",
    visual: { kind: "pictograph", symbol: "■", value: 10, rows: [{ label: "공원 A", count: 3 }, { label: "공원 B", count: 2 }] }, interactionType: "pictograph",
    signalId: "pictograph.convert",
    answers: [{ id: "50-trees", label: "50그루" }, { id: "5-trees", label: "5그루" }, { id: "30-trees", label: "30그루" }]
  }),
  makeJudgment({
    id: "g3s2-graph-09", unitId: "pictograph", learnerStageId: "pictograph.complete",
    curriculumAnchorIds: ["[4수04-01]"], context: "● 한 개는 사과 2개를 나타냅니다.",
    prompt: "사과 8개를 나타내려면 ●를 몇 개 그릴까요?",
    visual: { kind: "pictograph", symbol: "●", value: 2, rows: [{ label: "사과", count: 0 }] }, interactionType: "pictograph",
    signalId: "pictograph.complete",
    answers: [{ id: "4-symbols", label: "4개" }, { id: "6-symbols", label: "6개" }, { id: "16-symbols", label: "16개" }]
  }),
  makeJudgment({
    id: "g3s2-graph-10", unitId: "pictograph", learnerStageId: "pictograph.complete",
    curriculumAnchorIds: ["[4수04-01]"], context: "★ 한 개는 책 5권을 나타냅니다. 위 칸의 책 15권은 ★ 3개로 그렸어요.",
    prompt: "아래 칸의 책이 25권이라면 위 칸보다 ★를 몇 개 더 그릴까요?",
    visual: { kind: "pictograph", symbol: "★", value: 5, rows: [{ label: "위 칸", count: 3 }, { label: "아래 칸", count: 0 }] }, interactionType: "pictograph",
    signalId: "pictograph.complete",
    answers: [{ id: "2-more-symbols", label: "2개 더" }, { id: "5-more-symbols", label: "5개 더" }, { id: "10-more-symbols", label: "10개 더" }]
  })
];

const learnerStages = [
  ...grade3Semester2Diagnosis.learnerStages.map((stage) => ({
    ...stage,
    ...existingStageUpdates[stage.id]
  })),
  ...addedStages
].sort((left, right) => left.order - right.order);

const existingJudgments = grade3Semester2Diagnosis.judgments.map((judgment) => {
  if (judgment.id === "g3s2-mul-01") {
    return { ...judgment, visual: { kind: "none" } as const };
  }
  if (judgment.id === "g3s2-div-02") {
    return {
      ...judgment,
      context: "사탕 12개를 4명에게 똑같이 나누어 줍니다.",
      prompt: "한 사람에게 몇 개씩 줄까요?"
    };
  }
  if (judgment.id === "g3s2-circle-02") {
    return {
      ...judgment,
      curriculumAnchorIds: ["[4수03-06]"],
      visual: {
        kind: "circle",
        mode: "diameter",
        radiusValue: 4
      } satisfies Judgment["visual"]
    };
  }
  if (judgment.id === "g3s2-circle-01") {
    return {
      ...judgment,
      visual: {
        kind: "circle",
        mode: "radius"
      } satisfies Judgment["visual"]
    };
  }
  if (judgment.id === "g3s2-frac-02") {
    return { ...judgment, visual: { kind: "none" } as const };
  }
  if (judgment.id === "g3s2-measure-01") {
    return {
      ...judgment,
      curriculumAnchorIds: ["[4수03-18]"],
      visual: {
        kind: "unit-relation",
        medium: "capacity",
        given: [{ value: 1, unit: "L" }],
        targetUnit: "mL"
      } satisfies Judgment["visual"]
    };
  }
  if (judgment.id === "g3s2-measure-02") {
    return {
      ...judgment,
      curriculumAnchorIds: ["[4수03-21]"],
      visual: {
        kind: "unit-relation",
        medium: "weight",
        given: [{ value: 2, unit: "kg" }, { value: 300, unit: "g" }],
        targetUnit: "g"
      } satisfies Judgment["visual"]
    };
  }
  return judgment;
});

const curriculumAnchors = grade3Semester2Diagnosis.curriculumAnchors
  .map((anchor) => grade3Semester2Anchor(anchor.id, "v2"))
  .concat(addedAnchors);

const signals = grade3Semester2Diagnosis.signals
  .map((signal) => {
    if (signal.id === "division.leftover") {
      return {
        ...signal,
        teacherInterpretation: "먼저 나눈 양과 아직 나누지 않은 양을 전체와 연결하는 과정이 흔들립니다.",
        teachingMove: "먼저 나눈 양, 남은 양, 전체를 세 칸에 나누어 놓고 빠진 수를 찾아보세요.",
        parentSummary: "먼저 나눈 양과 아직 남은 양을 전체와 연결하는 연습을 하고 있습니다.",
        homePrompt: "네 접시에 10개씩 놓고 12개가 남았다면 처음에는 몇 개인지 물어봐 주세요."
      };
    }
    if (signal.id === "division.equal-share") {
      return {
        ...signal,
        teachingMove: "나누어야 할 양을 묶음 수만큼의 동그라미에 하나씩 번갈아 놓게 해보세요.",
        homePrompt: "물건을 접시 몇 개에 똑같이 놓으면 한 접시에 몇 개인지 함께 놓아보세요."
      };
    }
    if (signal.id === "circle.radius-diameter") {
      return {
        ...signal,
        teacherInterpretation: "지름이 중심을 지나며 반지름 두 개의 길이라는 관계를 적용하는 과정이 흔들립니다."
      };
    }
    if (signal.id === "measurement.capacity-unit") {
      return {
        ...signal,
        teacherInterpretation: "L와 mL의 관계를 사용해 들이를 한 단위로 나타내는 과정이 흔들립니다."
      };
    }
    if (signal.id === "pictograph.legend") {
      return {
        ...signal,
        teacherInterpretation: "그림 수, 실제 수량, 그림 한 개가 나타내는 수를 서로 연결하는 과정이 흔들립니다."
      };
    }
    if (signal.id === "pictograph.difference") {
      return {
        ...signal,
        teacherInterpretation: "그림그래프의 두 수량을 실제 수로 바꾸고 차이를 비교하는 과정이 흔들립니다."
      };
    }
    return signal;
  })
  .concat(addedSignals);

const stageOrderById = new Map(
  learnerStages.map((stage) => [stage.id, stage.order] as const)
);

const judgments = [
  ...existingJudgments,
  ...addedJudgments,
  ...fractionMeasurementGraphJudgments
].sort((left, right) => {
  const stageOrder =
    (stageOrderById.get(left.learnerStageId) ?? Number.MAX_SAFE_INTEGER) -
    (stageOrderById.get(right.learnerStageId) ?? Number.MAX_SAFE_INTEGER);
  return stageOrder || left.id.localeCompare(right.id);
});

const diagnosis: DiagnosisSet = {
  ...grade3Semester2Diagnosis,
  manifest: {
    ...grade3Semester2Diagnosis.manifest,
    version: "2.2.0",
    checksum: "afe6e080570e79438ec70ddcfe676ed78bc918ebd1acf5b48ab1fa46012408a2",
    estimatedMinutes: 32,
    status: "review"
  },
  curriculumAnchors,
  learnerStages,
  signals,
  judgments
};

export const grade3Semester2CompleteDiagnosis =
  diagnosisSetSchema.parse(diagnosis) as DiagnosisSet;
