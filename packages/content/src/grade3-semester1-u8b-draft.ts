// 미검토 초안 — D4 조건(공식 학기 배치·문항별 관찰 행동 확인) 충족 전 발행 금지
//
// 이 파일은 1.0.0 병합본(승인되지 않은 U8b 범위 포함)에서 분리 보존한
// 4개 단원(평면도형·시간·덧셈과 뺄셈·소수)의 학습 단계·신호·판단·오답
// rationale/derivation이다. docs/implementation-decisions.md D4와
// docs/grade3-semester1-content-coverage.md:92-97이 U8b 별도 버전으로
// 미룬 범위이며, 공식 학기 배치와 문항별 관찰 행동을 사람이 검수하기 전까지
// 어떤 registry·런타임에도 연결하면 안 된다. 아래 코드는 진행 중인 편집
// 초안일 뿐이며 발행 게이트를 통과하지 않는다.
import type {
  CurriculumAnchor,
  Judgment,
  SignalDefinition
} from "@middle-of-math/domain";
import type { DistractorRationale } from "./coverage";

const SOURCE = "교육부 고시 제2022-33호 [별책 8] 수학과 교육과정";

type Answer = { id: string; label: string };
type JudgmentInput = Omit<Judgment, "choices" | "interaction"> & {
  signalId: string;
  answers: Answer[];
};

function judgment(input: JudgmentInput): Judgment {
  const { signalId, answers, ...rest } = input;
  return {
    ...rest,
    interaction: { type: "choice", version: 1 },
    choices: answers.map((answer, index) => ({
      ...answer,
      correct: index === 0,
      ...(index === 0 ? {} : { signalIds: [signalId] })
    }))
  };
}

function signal(
  id: string,
  title: string,
  severity: SignalDefinition["severity"],
  interpretation: string,
  teachingMove: string
): SignalDefinition {
  return {
    id,
    title,
    severity,
    teacherInterpretation: interpretation,
    teachingMove,
    parentSummary: `${title} 생각을 구체물과 식으로 연결하는 연습을 하고 있습니다.`,
    homePrompt: `${teachingMove.replace(/하세요\.?$/, "해 보게 해주세요.")}`
  };
}

const anchors: readonly CurriculumAnchor[] = [
  { id: "[4수01-03]", label: "덧셈과 뺄셈", source: SOURCE },
  { id: "[4수03-01]", label: "평면도형", source: SOURCE },
  { id: "[4수03-02]", label: "각과 직각", source: SOURCE },
  { id: "[4수03-09]", label: "삼각형의 분류", source: SOURCE },
  { id: "[4수03-10]", label: "사각형의 분류", source: SOURCE },
  { id: "[4수03-13]", label: "시간", source: SOURCE },
  { id: "[4수03-14]", label: "시간의 덧셈과 뺄셈", source: SOURCE },
  { id: "[4수01-12]", label: "분수와 소수", source: SOURCE },
  { id: "[4수01-14]", label: "소수의 크기 비교", source: SOURCE }
];

const stages = [
  {
    id: "addition-subtraction.column-add", order: 1, unitId: "addition-subtraction",
    title: "세 자리 수의 덧셈 계산하기", shortTitle: "받아올림을 살려 덧셈함",
    curriculumAnchorIds: ["[4수01-03]"], prerequisiteStageIds: []
  },
  {
    id: "addition-subtraction.column-subtract", order: 2, unitId: "addition-subtraction",
    title: "세 자리 수의 뺄셈 계산하기", shortTitle: "받아내림을 살려 뺄셈함",
    curriculumAnchorIds: ["[4수01-03]"], prerequisiteStageIds: ["addition-subtraction.column-add"]
  },
  {
    id: "plane-figures.line-ray-segment", order: 3, unitId: "plane-figures",
    title: "직선·선분·반직선 구별하기", shortTitle: "끝점으로 도형을 구별함",
    curriculumAnchorIds: ["[4수03-01]"], prerequisiteStageIds: []
  },
  {
    id: "plane-figures.angle-classify", order: 4, unitId: "plane-figures",
    title: "직각과 비교하여 각 분류하기", shortTitle: "직각으로 예각과 둔각을 가름",
    curriculumAnchorIds: ["[4수03-02]"], prerequisiteStageIds: ["plane-figures.line-ray-segment"]
  },
  {
    id: "plane-figures.triangle-angle-classify", order: 5, unitId: "plane-figures",
    title: "각의 크기에 따라 삼각형 분류하기", shortTitle: "직각의 유무로 삼각형을 가름",
    curriculumAnchorIds: ["[4수03-09]"], prerequisiteStageIds: ["plane-figures.angle-classify"]
  },
  {
    id: "plane-figures.quadrilateral-classify", order: 6, unitId: "plane-figures",
    title: "각과 변에 따라 사각형 분류하기", shortTitle: "각과 변으로 사각형을 가름",
    curriculumAnchorIds: ["[4수03-10]"], prerequisiteStageIds: ["plane-figures.triangle-angle-classify"]
  },
  {
    id: "time.minute-read", order: 13, unitId: "time",
    title: "시계로 시각 읽기", shortTitle: "분침으로 시각을 읽음",
    curriculumAnchorIds: ["[4수03-13]"], prerequisiteStageIds: []
  },
  {
    id: "time.duration-calc", order: 14, unitId: "time",
    title: "시각 사이의 시간 구하기", shortTitle: "시간의 덧셈과 뺄셈을 함",
    curriculumAnchorIds: ["[4수03-14]"], prerequisiteStageIds: ["time.minute-read"]
  },
  {
    id: "fraction-decimal.decimal-tenths", order: 17, unitId: "fraction-decimal",
    title: "10분의 몇을 소수로 나타내기", shortTitle: "소수 한 자리 수를 읽고 씀",
    curriculumAnchorIds: ["[4수01-12]"], prerequisiteStageIds: []
  },
  {
    id: "fraction-decimal.decimal-compare", order: 18, unitId: "fraction-decimal",
    title: "소수의 크기 비교하기", shortTitle: "소수의 크기를 비교함",
    curriculumAnchorIds: ["[4수01-14]"], prerequisiteStageIds: ["fraction-decimal.decimal-tenths"]
  }
];

const signals: SignalDefinition[] = [
  signal("addition-subtraction.column-add", "세 자리 수 덧셈의 받아올림", "high", "백의 자리까지 받아올림을 옮기는 과정이 흔들립니다.", "받아올림한 수를 자릿값 위에 적고 더하게 하세요."),
  signal("addition-subtraction.column-subtract", "세 자리 수 뺄셈의 받아내림", "high", "받아내림한 뒤 자릿값에 반영하는 과정이 흔들립니다.", "받아내림한 뒤 각 자리의 수가 어떻게 바뀌는지 세어 보게 하세요."),
  signal("plane-figures.line-ray-segment", "직선·선분·반직선 구별", "medium", "끝점의 유무로 직선, 선분, 반직선을 구별하는 기준이 흔들립니다.", "도형을 손가락으로 따라 그리며 끝점을 짚어보게 하세요."),
  signal("plane-figures.angle-classify", "각과 직각", "medium", "직각과 비교하여 예각과 둔각을 나누는 기준이 흔들립니다.", "직각을 기준으로 각의 크기를 비교하게 하세요."),
  signal("plane-figures.triangle-angle-classify", "각에 따른 삼각형 분류", "medium", "직각의 유무로 삼각형을 분류하는 기준이 흔들립니다.", "그림에서 직각 표시를 먼저 찾게 하세요."),
  signal("plane-figures.quadrilateral-classify", "사각형의 분류", "medium", "네 각과 네 변을 기준으로 사각형을 분류하는 과정이 흔들립니다.", "각과 변을 각각 다른 색으로 표시하게 하세요."),
  signal("time.minute-read", "시각 읽기", "medium", "분침이 가리키는 숫자를 5분 단위로 읽는 과정이 흔들립니다.", "분침의 숫자를 5씩 세며 읽게 하세요."),
  signal("time.duration-calc", "시간의 덧셈과 뺄셈", "medium", "시각 사이의 시간을 60분 단위로 세는 과정이 흔들립니다.", "시각을 시와 분으로 나누어 세게 하세요."),
  signal("fraction-decimal.decimal-tenths", "소수 한 자리 수", "medium", "10분의 몇을 소수로 바꾸는 자릿값 과정이 흔들립니다.", "10등분 그림을 보며 0.1씩 세게 하세요."),
  signal("fraction-decimal.decimal-compare", "소수의 크기 비교", "medium", "소수 한 자리 수를 크기 비교하는 근거가 더 필요합니다.", "소수를 10등분 그림에 놓고 비교하게 하세요.")
];

const judgments: Judgment[] = [
  judgment({
    id: "g3s1-add-01", unitId: "addition-subtraction", learnerStageId: "addition-subtraction.column-add",
    curriculumAnchorIds: ["[4수01-03]"], prompt: "268+147을 계산하면 얼마일까요?", visual: { kind: "none" },
    signalId: "addition-subtraction.column-add",
    answers: [{ id: "415", label: "415" }, { id: "305", label: "305" }, { id: "3015", label: "3015" }]
  }),
  judgment({
    id: "g3s1-add-02", unitId: "addition-subtraction", learnerStageId: "addition-subtraction.column-add",
    curriculumAnchorIds: ["[4수01-03]"], context: "장난감 자동차가 256개, 인형이 178개 있어요.",
    prompt: "자동차와 인형은 모두 몇 개일까요?", visual: { kind: "none" },
    signalId: "addition-subtraction.column-add",
    answers: [{ id: "434", label: "434개" }, { id: "324", label: "324개" }, { id: "334", label: "334개" }]
  }),
  judgment({
    id: "g3s1-add-03", unitId: "addition-subtraction", learnerStageId: "addition-subtraction.column-subtract",
    curriculumAnchorIds: ["[4수01-03]"], prompt: "435-178을 계산하면 얼마일까요?", visual: { kind: "none" },
    signalId: "addition-subtraction.column-subtract",
    answers: [{ id: "257", label: "257" }, { id: "367", label: "367" }, { id: "343", label: "343" }]
  }),
  judgment({
    id: "g3s1-add-04", unitId: "addition-subtraction", learnerStageId: "addition-subtraction.column-subtract",
    curriculumAnchorIds: ["[4수01-03]"], context: "과녁에서 350점을 얻기 위해 178점을 쏘았어요.",
    prompt: "앞으로 몇 점을 더 얻어야 할까요?", visual: { kind: "none" },
    signalId: "addition-subtraction.column-subtract",
    answers: [{ id: "172", label: "172점" }, { id: "282", label: "282점" }, { id: "180", label: "180점" }]
  }),
  judgment({
    id: "g3s1-pf-01", unitId: "plane-figures", learnerStageId: "plane-figures.line-ray-segment",
    curriculumAnchorIds: ["[4수03-01]"], prompt: "선분은 어느 그림일까요?",
    visual: {
      kind: "line-segment-ray",
      figures: [
        { label: "가", type: "line" },
        { label: "나", type: "ray" },
        { label: "다", type: "segment" }
      ]
    },
    signalId: "plane-figures.line-ray-segment",
    answers: [{ id: "segment", label: "다 그림" }, { id: "line", label: "가 그림" }, { id: "ray", label: "나 그림" }]
  }),
  judgment({
    id: "g3s1-pf-02", unitId: "plane-figures", learnerStageId: "plane-figures.line-ray-segment",
    curriculumAnchorIds: ["[4수03-01]"], prompt: "반직선의 끝점은 몇 개일까요?",
    visual: {
      kind: "line-segment-ray",
      figures: [{ label: "반직선", type: "ray" }]
    },
    signalId: "plane-figures.line-ray-segment",
    answers: [{ id: "one", label: "1개" }, { id: "two", label: "2개" }, { id: "zero", label: "0개" }]
  }),
  judgment({
    id: "g3s1-pf-03", unitId: "plane-figures", learnerStageId: "plane-figures.angle-classify",
    curriculumAnchorIds: ["[4수03-02]"], prompt: "직각과 비교했을 때 더 작은 각은 어떤 각일까요?",
    visual: { kind: "angle-figure", degrees: 45, mode: "bare", referenceRightAngle: true },
    signalId: "plane-figures.angle-classify",
    answers: [{ id: "acute", label: "예각" }, { id: "obtuse", label: "둔각" }, { id: "right", label: "직각" }]
  }),
  judgment({
    id: "g3s1-pf-04", unitId: "plane-figures", learnerStageId: "plane-figures.angle-classify",
    curriculumAnchorIds: ["[4수03-02]"], prompt: "직각과 비교했을 때 더 큰 각은 어떤 각일까요?",
    visual: { kind: "angle-figure", degrees: 120, mode: "bare", referenceRightAngle: true },
    signalId: "plane-figures.angle-classify",
    answers: [{ id: "obtuse", label: "둔각" }, { id: "acute", label: "예각" }, { id: "right", label: "직각" }]
  }),
  judgment({
    id: "g3s1-pf-05", unitId: "plane-figures", learnerStageId: "plane-figures.triangle-angle-classify",
    curriculumAnchorIds: ["[4수03-09]"], prompt: "이 삼각형을 각의 크기에 따라 분류하면 어떤 삼각형일까요?",
    visual: { kind: "triangle-figure", mode: "angle-classify", angles: [90, 55, 35], rightAngleIndexes: [0] },
    signalId: "plane-figures.triangle-angle-classify",
    answers: [
      { id: "right", label: "직각삼각형" },
      { id: "acute", label: "예각삼각형" },
      { id: "obtuse", label: "둔각삼각형" }
    ]
  }),
  judgment({
    id: "g3s1-pf-06", unitId: "plane-figures", learnerStageId: "plane-figures.triangle-angle-classify",
    curriculumAnchorIds: ["[4수03-09]"], prompt: "이 삼각형이 직각삼각형이 아닌 이유는 무엇일까요?",
    visual: { kind: "triangle-figure", mode: "angle-classify", angles: [110, 40, 30] },
    signalId: "plane-figures.triangle-angle-classify",
    answers: [
      { id: "no-right", label: "직각이 없기 때문이에요" },
      { id: "unequal", label: "세 각의 크기가 모두 다르기 때문이에요" },
      { id: "two-right", label: "직각보다 큰 각이 두 개이기 때문이에요" }
    ]
  }),
  judgment({
    id: "g3s1-pf-07", unitId: "plane-figures", learnerStageId: "plane-figures.quadrilateral-classify",
    curriculumAnchorIds: ["[4수03-10]"], context: "화살표 표시가 있는 변끼리만 서로 평행해요.",
    prompt: "평행한 변의 표시를 보고 이 사각형의 이름을 골라 보세요.",
    visual: {
      kind: "quadrilateral-figure",
      mode: "parallel-classify",
      vertices: [[5, 12], [0, 0], [20, 0], [11, 12]],
      parallelSidePairs: [[1, 3]]
    },
    signalId: "plane-figures.quadrilateral-classify",
    answers: [{ id: "trapezoid", label: "사다리꼴" }, { id: "parallelogram", label: "평행사변형" }, { id: "rhombus", label: "마름모" }]
  }),
  judgment({
    id: "g3s1-pf-08", unitId: "plane-figures", learnerStageId: "plane-figures.quadrilateral-classify",
    curriculumAnchorIds: ["[4수03-10]"], context: "같은 눈금이 있는 변끼리만 길이가 같아요.",
    prompt: "네 변의 표시를 모두 확인하고 이 사각형의 이름을 골라 보세요.",
    visual: {
      kind: "quadrilateral-figure",
      mode: "equal-side-classify",
      vertices: [[0, 5], [10, 0], [20, 5], [10, 10]],
      equalSideGroups: [[0, 1, 2, 3]]
    },
    signalId: "plane-figures.quadrilateral-classify",
    answers: [{ id: "rhombus", label: "마름모" }, { id: "square", label: "정사각형" }, { id: "rectangle", label: "직사각형" }]
  }),
  judgment({
    id: "g3s1-tim-01", unitId: "time", learnerStageId: "time.minute-read",
    curriculumAnchorIds: ["[4수03-13]"], prompt: "시계가 나타내는 시각은 무엇일까요?",
    visual: { kind: "clock-face", hour: 4, minute: 25 },
    signalId: "time.minute-read",
    answers: [{ id: "4시25분", label: "4시 25분" }, { id: "5시25분", label: "5시 25분" }, { id: "4시5분", label: "4시 5분" }]
  }),
  judgment({
    id: "g3s1-tim-02", unitId: "time", learnerStageId: "time.minute-read",
    curriculumAnchorIds: ["[4수03-13]"], prompt: "이 시계를 바르게 읽은 것은 무엇일까요?",
    visual: { kind: "clock-face", hour: 3, minute: 45 },
    signalId: "time.minute-read",
    answers: [{ id: "3시45분", label: "3시 45분" }, { id: "3시9분", label: "3시 9분" }, { id: "4시45분", label: "4시 45분" }]
  }),
  judgment({
    id: "g3s1-tim-03", unitId: "time", learnerStageId: "time.duration-calc",
    curriculumAnchorIds: ["[4수03-14]"], prompt: "3시 20분부터 3시 45분까지는 몇 분일까요?", visual: { kind: "none" },
    signalId: "time.duration-calc",
    answers: [{ id: "25", label: "25분" }, { id: "15", label: "15분" }, { id: "65", label: "1시간 5분" }]
  }),
  judgment({
    id: "g3s1-tim-04", unitId: "time", learnerStageId: "time.duration-calc",
    curriculumAnchorIds: ["[4수03-14]"], context: "책을 2시 10분부터 2시 55분까지 읽었어요.",
    prompt: "책을 읽은 시간은 몇 분일까요?", visual: { kind: "none" },
    signalId: "time.duration-calc",
    answers: [{ id: "45", label: "45분" }, { id: "35", label: "35분" }, { id: "65", label: "1시간 5분" }]
  }),
  judgment({
    id: "g3s1-dec-01", unitId: "fraction-decimal", learnerStageId: "fraction-decimal.decimal-tenths",
    curriculumAnchorIds: ["[4수01-12]"], prompt: "10분의 4를 소수로 나타내면 무엇일까요?",
    visual: { kind: "fraction-bar", numerator: 4, denominator: 10 }, signalId: "fraction-decimal.decimal-tenths",
    answers: [{ id: "0.4", label: "0.4" }, { id: "0.04", label: "0.04" }, { id: "4", label: "4" }]
  }),
  judgment({
    id: "g3s1-dec-02", unitId: "fraction-decimal", learnerStageId: "fraction-decimal.decimal-tenths",
    curriculumAnchorIds: ["[4수01-12]"], prompt: "0.7을 분수로 나타내면 무엇일까요?",
    visual: { kind: "fraction-bar", numerator: 7, denominator: 10 }, signalId: "fraction-decimal.decimal-tenths",
    answers: [{ id: "7of10", label: "7/10" }, { id: "10of7", label: "10/7" }, { id: "7of100", label: "7/100" }]
  }),
  judgment({
    id: "g3s1-dec-03", unitId: "fraction-decimal", learnerStageId: "fraction-decimal.decimal-compare",
    curriculumAnchorIds: ["[4수01-14]"], prompt: "소수 0.4와 0.9를 비교하면 무엇일까요?", visual: { kind: "none" },
    signalId: "fraction-decimal.decimal-compare",
    answers: [{ id: "0.9-bigger", label: "0.9가 더 커요" }, { id: "0.4-bigger", label: "0.4가 더 커요" }, { id: "equal", label: "둘이 같아요" }]
  }),
  judgment({
    id: "g3s1-dec-04", unitId: "fraction-decimal", learnerStageId: "fraction-decimal.decimal-compare",
    curriculumAnchorIds: ["[4수01-14]"], context: "빵 한 개를 똑같이 10조각으로 나누어 민지는 4조각을, 지우는 6조각을 먹었어요.",
    prompt: "먹은 양을 소수로 비교하면 무엇일까요?", visual: { kind: "none" },
    signalId: "fraction-decimal.decimal-compare",
    answers: [{ id: "0.6-bigger", label: "지우가 먹은 0.6이 더 커요" }, { id: "0.4-bigger", label: "민지가 먹은 0.4가 더 커요" }, { id: "equal", label: "둘이 같아요" }]
  })
];

type Entry = readonly [
  judgmentId: string,
  choiceId: string,
  misconceptionSlug: string,
  rationale: string,
  derivation: string
];

function stage(
  stageId: string,
  signalId: string,
  sharedSignalRationale: string,
  misconceptionTitles: Record<string, string>,
  entries: Entry[]
) {
  return { stageId, signalId, sharedSignalRationale, misconceptionTitles, entries };
}

const authoring = [
  stage(
    "addition-subtraction.column-add",
    "addition-subtraction.column-add",
    "두 오답은 모두 받아올림한 수를 윗자리 계산에 이어 나르는 과정에서 함께 관찰합니다.",
    {
      "carry-not-added-next": "받아올림한 수를 다음 자리 합에 더하지 않음",
      "carry-chain-broken": "받아올림이 가장 높은 자리까지 전달되지 않음"
    },
    [
      ["g3s1-add-01", "305", "carry-not-added-next", "일의 자리에서 받아올린 1과 십의 자리에서 받아올린 1을 다음 자리 덧셈에 더하지 않았습니다.", "268+147을 8+7=15, 6+4=10, 2+1=3으로 보아 305로 만들었습니다."],
      ["g3s1-add-01", "3015", "carry-chain-broken", "받아올림을 옮기지 않고 각 자리 합을 그대로 이어 붙였습니다.", "268+147을 2+1=3, 6+4=10, 8+7=15로 보아 3·10·15를 이어 3015로 만들었습니다."],
      ["g3s1-add-02", "324", "carry-not-added-next", "받아올림한 수를 다음 자리 덧셈에 더하지 않고 자리 합만 구했습니다.", "256+178을 6+8=14, 5+7=12, 2+1=3으로 보아 324로 만들었습니다."],
      ["g3s1-add-02", "334", "carry-chain-broken", "십의 자리에서 백의 자리로 받아올림이 전달되지 않아 가장 높은 자리가 어긋났습니다.", "256+178의 십의 자리에서 받아올림한 1을 백의 자리 2+1에 더하지 않아 334로 만들었습니다."]
    ]
  ),
  stage(
    "addition-subtraction.column-subtract",
    "addition-subtraction.column-subtract",
    "두 오답은 모두 받아내림한 뒤 각 자릿값을 다시 세는 과정에서 함께 관찰합니다.",
    {
      "borrow-lost-at-hundreds": "가장 높은 자리에서 받아내림을 반영하지 않음",
      "ones-borrow-handling-broken": "일의 자리 받아내림 처리에서 어긋남"
    },
    [
      ["g3s1-add-03", "367", "borrow-lost-at-hundreds", "백의 자리에서 받아내림한 뒤 4에서 1을 빼 주지 않았습니다.", "435-178을 십의 자리 13-7=6까지 받아내림하고 백의 자리는 4-1=3으로 계산해 367로 만들었습니다."],
      ["g3s1-add-03", "343", "ones-borrow-handling-broken", "받아내림 대신 큰 수에서 작은 수를 빼는 것으로 바꾸었습니다.", "435-178의 각 자리를 8-5=3, 7-3=4, 4-1=3으로 계산해 343으로 만들었습니다."],
      ["g3s1-add-04", "282", "borrow-lost-at-hundreds", "백의 자리에서 받아내림한 뒤 3에서 1을 빼 주지 않았습니다.", "350-178의 십의 자리 15-7=8까지 받아내림하고 백의 자리는 3-1=2로 계산해 282로 만들었습니다."],
      ["g3s1-add-04", "180", "ones-borrow-handling-broken", "일의 자리까지 빼지 않고 십의 자리 단위에서 계산을 멈추었습니다.", "350-178을 350-170으로 보아 일의 자리 8을 빼지 않고 180으로 만들었습니다."]
    ]
  ),
  stage(
    "plane-figures.line-ray-segment",
    "plane-figures.line-ray-segment",
    "두 오답은 모두 끝점의 수를 세어 직선·반직선·선분을 구별하는 기준에서 함께 관찰합니다.",
    {
      "line-confused": "직선과 선분·반직선을 구별하지 못함",
      "ray-confused": "반직선과 선분을 구별하지 못함"
    },
    [
      ["g3s1-pf-01", "line", "line-confused", "끝점이 없는 직선을 선분으로 보았습니다.", "끝점이 양쪽에 있는 그림만 선분인데 가 그림(직선)을 선분으로 판단했습니다."],
      ["g3s1-pf-01", "ray", "ray-confused", "끝점이 하나인 반직선을 선분으로 보았습니다.", "끝점이 한쪽에만 있는 나 그림(반직선)을 선분으로 판단했습니다."],
      ["g3s1-pf-02", "zero", "line-confused", "반직선의 끝점 수를 직선처럼 0개로 보았습니다.", "반직선에는 시작점 하나만 있는데 0개라고 답했습니다."],
      ["g3s1-pf-02", "two", "ray-confused", "반직선의 끝점 수를 선분처럼 2개로 보았습니다.", "반직선에는 시작점 하나만 있는데 2개라고 답했습니다."]
    ]
  ),
  stage(
    "plane-figures.angle-classify",
    "plane-figures.angle-classify",
    "두 오답은 모두 직각을 기준으로 각의 크기를 비교하는 과정에서 함께 관찰합니다.",
    {
      "right-angle-default": "직각과 비교하지 않고 직각이라고 봄",
      "size-direction-reversed": "직각보다 크고 작은 방향을 반대로 봄"
    },
    [
      ["g3s1-pf-03", "right", "right-angle-default", "직각보다 작은 45°의 각을 직각과 비교하지 않고 직각으로 보았습니다.", "직각 기준을 사용하지 않고 45° 각을 그냥 직각이라고 답했습니다."],
      ["g3s1-pf-03", "obtuse", "size-direction-reversed", "직각보다 작은 각을 직각보다 큰 각으로 보았습니다.", "45°를 직각보다 작은 예각으로 보지 않고 둔각이라고 답했습니다."],
      ["g3s1-pf-04", "right", "right-angle-default", "직각보다 큰 120°의 각을 직각과 비교하지 않고 직각으로 보았습니다.", "직각 기준을 사용하지 않고 120° 각을 그냥 직각이라고 답했습니다."],
      ["g3s1-pf-04", "acute", "size-direction-reversed", "직각보다 큰 각을 직각보다 작은 각으로 보았습니다.", "120°를 직각보다 큰 둔각으로 보지 않고 예각이라고 답했습니다."]
    ]
  ),
  stage(
    "plane-figures.triangle-angle-classify",
    "plane-figures.triangle-angle-classify",
    "두 오답은 모두 각의 크기를 다시 세어 직각의 유무를 확인하는 과정에서 함께 관찰합니다.",
    {
      "right-angle-misread": "직각인 각의 크기를 잘못 읽음",
      "classification-rule-misused": "직각의 유무 대신 다른 기준으로 분류함"
    },
    [
      ["g3s1-pf-05", "acute", "right-angle-misread", "90°인 각을 예각으로 보아 직각이 없다고 판단했습니다.", "각이 90°, 55°, 35°인 삼각형을 예각삼각형으로 분류했습니다."],
      ["g3s1-pf-05", "obtuse", "classification-rule-misused", "직각의 유무를 확인하지 않고 큰 각이 있다는 것만으로 분류했습니다.", "90°인 각이 있어도 가장 큰 각만 보아 둔각삼각형으로 분류했습니다."],
      ["g3s1-pf-06", "two-right", "right-angle-misread", "직각보다 큰 각의 수를 잘못 세어 두 개로 보았습니다.", "110° 하나만 직각보다 큰데 직각보다 큰 각이 두 개라고 답했습니다."],
      ["g3s1-pf-06", "unequal", "classification-rule-misused", "직각의 유무 대신 세 각의 크기가 모두 다름을 근거로 삼았습니다.", "직각이 없음을 확인하지 않고 세 각이 모두 다르다는 이유로 판단했습니다."]
    ]
  ),
  stage(
    "plane-figures.quadrilateral-classify",
    "plane-figures.quadrilateral-classify",
    "두 오답은 모두 제시된 변·각 표시를 다시 확인해 사각형을 분류하는 과정에서 함께 관찰합니다.",
    {
      "condition-substituted": "표시된 조건 대신 다른 성질로 분류함",
      "condition-overcounted": "조건을 실제보다 더 충족한다고 봄"
    },
    [
      ["g3s1-pf-07", "parallelogram", "condition-overcounted", "평행한 변이 한 쌍뿐인데 두 쌍으로 보았습니다.", "화살표 표시가 한 쌍뿐인데 평행사변형으로 판단했습니다."],
      ["g3s1-pf-07", "rhombus", "condition-substituted", "평행 표시를 확인하지 않고 네 변의 길이가 같다고 보았습니다.", "화살표(평행) 표시 대신 변 길이 조건으로 마름모라고 판단했습니다."],
      ["g3s1-pf-08", "square", "condition-overcounted", "네 변의 길이만 같을 뿐인데 네 각이 직각이라고 보았습니다.", "같은 눈금이 네 변에 모두 있는 마름모를 정사각형으로 판단했습니다."],
      ["g3s1-pf-08", "rectangle", "condition-substituted", "변의 길이 표시를 각이 직각이라는 뜻으로 보았습니다.", "같은 눈금 표시를 직각 표시로 오인해 직사각형으로 판단했습니다."]
    ]
  ),
  stage(
    "time.minute-read",
    "time.minute-read",
    "두 오답은 모두 분침의 위치를 5분 단위로 세거나 시침의 위치를 읽는 과정에서 함께 관찰합니다.",
    {
      "minute-digit-direct": "분침이 가리키는 숫자를 5분 단위로 세지 않고 그대로 읽음",
      "hour-position-misread": "시침의 위치를 잘못 읽음"
    },
    [
      ["g3s1-tim-01", "4시5분", "minute-digit-direct", "분침이 5를 가리키는 것을 5분으로 읽었습니다.", "분침 숫자 1개를 5분 단위로 바꾸지 않고 4시 5분으로 답했습니다."],
      ["g3s1-tim-01", "5시25분", "hour-position-misread", "시침이 4와 5 사이에 있는 것을 5시로 읽었습니다.", "4시가 지난 시각인데 5시 25분으로 답했습니다."],
      ["g3s1-tim-02", "3시9분", "minute-digit-direct", "분침이 9를 가리키는 것을 9분으로 읽었습니다.", "분침 숫자 9개를 5분 단위로 세지 않고 3시 9분으로 답했습니다."],
      ["g3s1-tim-02", "4시45분", "hour-position-misread", "시침이 3과 4 사이에 있는 것을 4시로 읽었습니다.", "3시가 지난 시각인데 4시 45분으로 답했습니다."]
    ]
  ),
  stage(
    "time.duration-calc",
    "time.duration-calc",
    "두 오답은 모두 시작 시각과 끝 시각의 시·분 관계를 세어 차이를 구하는 과정에서 함께 관찰합니다.",
    {
      "minutes-added": "시간 차이를 구할 때 분끼리 더함",
      "clock-read-shifted": "시계의 시각을 잘못 읽어 차이가 어긋남"
    },
    [
      ["g3s1-tim-03", "65", "minutes-added", "끝 시각 3시 45분의 분에서 시작 시각 3시 20분의 분을 빼지 않고 더했습니다.", "3시 20분부터 3시 45분까지를 45+20=65분으로 계산했습니다."],
      ["g3s1-tim-03", "15", "clock-read-shifted", "3시 45분의 분침 위치를 30분으로 잘못 읽어 차이를 15분으로 계산했습니다.", "3시 20분부터 3시 45분까지를 45-30=15분으로 답했습니다."],
      ["g3s1-tim-04", "65", "minutes-added", "끝 시각 2시 55분의 분에서 시작 시각 2시 10분의 분을 빼지 않고 더했습니다.", "2시 10분부터 2시 55분까지를 55+10=65분으로 계산했습니다."],
      ["g3s1-tim-04", "35", "clock-read-shifted", "2시 10분의 분침 위치를 20분으로 잘못 읽어 차이를 35분으로 계산했습니다.", "2시 10분부터 2시 55분까지를 55-20=35분으로 답했습니다."]
    ]
  ),
  stage(
    "fraction-decimal.decimal-tenths",
    "fraction-decimal.decimal-tenths",
    "두 오답은 모두 10분의 몇을 소수로 놓을 때 자릿값의 위치를 함께 확인하는 단계에서 관찰합니다.",
    {
      "tenths-as-hundredths": "십분의 몇을 백분의 몇으로 봄",
      "notation-misplaced": "소수점이나 분모·분자를 잘못 놓음"
    },
    [
      ["g3s1-dec-01", "0.04", "tenths-as-hundredths", "10분의 4를 소수 둘째 자리로 옮겨 0.04로 보았습니다.", "4/10을 0.4로 놓지 않고 0.04로 답했습니다."],
      ["g3s1-dec-01", "4", "notation-misplaced", "소수점을 빠뜨려 자연수 4로 보았습니다.", "10분의 4를 0.4로 놓지 않고 4로 답했습니다."],
      ["g3s1-dec-02", "7of100", "tenths-as-hundredths", "0.7을 분모 100의 분수로 보았습니다.", "0.7을 7/10으로 놓지 않고 7/100으로 답했습니다."],
      ["g3s1-dec-02", "10of7", "notation-misplaced", "분모와 분자의 위치를 뒤집어 놓았습니다.", "0.7을 7/10 대신 10/7로 뒤집어 답했습니다."]
    ]
  ),
  stage(
    "fraction-decimal.decimal-compare",
    "fraction-decimal.decimal-compare",
    "두 오답은 모두 소수의 소수 부분 크기를 비교하는 기준에서 함께 관찰합니다.",
    {
      "whole-part-only-compared": "정수 부분만 보고 같다고 봄",
      "size-direction-reversed": "소수 부분의 크기를 반대로 봄"
    },
    [
      ["g3s1-dec-03", "equal", "whole-part-only-compared", "0.4와 0.9 모두 정수 부분이 0이라는 것만 보고 소수 부분을 비교하지 않았습니다.", "0.4와 0.9의 소수 부분 4와 9를 비교하지 않고 같다고 답했습니다."],
      ["g3s1-dec-03", "0.4-bigger", "size-direction-reversed", "0.4와 0.9의 소수 부분 크기를 반대로 보았습니다.", "0.9가 더 큰데 0.4가 더 크다고 답했습니다."],
      ["g3s1-dec-04", "equal", "whole-part-only-compared", "0.4와 0.6 모두 정수 부분이 0이라는 것만 보고 소수 부분을 비교하지 않았습니다.", "0.4와 0.6의 소수 부분 4와 6을 비교하지 않고 같다고 답했습니다."],
      ["g3s1-dec-04", "0.4-bigger", "size-direction-reversed", "0.4와 0.6의 소수 부분 크기를 반대로 보았습니다.", "0.6이 더 큰데 0.4가 더 크다고 답했습니다."]
    ]
  )
] as const;

export const grade3Semester1U8bDraftMisconceptionTitles = Object.freeze(
  Object.fromEntries(
    authoring.flatMap((item) =>
      Object.entries(item.misconceptionTitles).map(([slug, title]) => [
        `${item.stageId}.${slug}`,
        title
      ])
    )
  )
);

export const grade3Semester1U8bDraftDistractorRationales: DistractorRationale[] =
  authoring.flatMap((item) =>
    item.entries.map(([judgmentId, choiceId, slug, rationale, derivation]) => ({
      judgmentId,
      choiceId,
      signalIds: [item.signalId],
      misconceptionId: `${item.stageId}.${slug}`,
      rationale,
      derivation,
      sharedSignalRationale: item.sharedSignalRationale
    }))
  );

export const grade3Semester1U8bDraft = {
  note: "미검토 초안 — 1.0.0에서 분리 보존한 U8b 후보(평면도형·시간·덧셈과 뺄셈·소수). D4 조건 충족 전 발행 금지.",
  curriculumAnchors: anchors,
  learnerStages: stages,
  signals,
  judgments
};
