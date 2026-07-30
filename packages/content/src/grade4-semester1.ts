import type {
  DiagnosisSet,
  Judgment,
  SignalDefinition
} from "@middle-of-math/domain";
import { grade4Semester1Anchor } from "./curriculum-anchor-registry";
import { diagnosisSetSchema } from "./schema";

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
  teacherInterpretation: string,
  teachingMove: string,
  parentSummary: string,
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

const anchors = [
  "[4수01-01]",
  "[4수01-02]",
  "[4수03-02]",
  "[4수03-24]",
  "[4수03-25]"
].map(grade4Semester1Anchor);

const stages: DiagnosisSet["learnerStages"] = [
  {
    id: "large-number.place-value",
    order: 1,
    unitId: "large-numbers",
    title: "자리 숫자와 자리값 연결하기",
    shortTitle: "자리 숫자와 자리값을 연결함",
    curriculumAnchorIds: ["[4수01-01]"],
    prerequisiteStageIds: []
  },
  {
    id: "large-number.positional-notation",
    order: 2,
    unitId: "large-numbers",
    title: "숫자의 위치에 따른 값의 변화 이해하기",
    shortTitle: "위치에 따른 값의 변화를 이해함",
    curriculumAnchorIds: ["[4수01-01]"],
    prerequisiteStageIds: ["large-number.place-value"]
  },
  {
    id: "large-number.read-write",
    order: 3,
    unitId: "large-numbers",
    title: "큰 수를 읽고 쓰기",
    shortTitle: "큰 수를 읽고 씀",
    curriculumAnchorIds: ["[4수01-01]"],
    prerequisiteStageIds: ["large-number.place-value"]
  },
  {
    id: "large-number.sequence",
    order: 4,
    unitId: "large-numbers",
    title: "큰 수를 일정한 크기로 뛰어 세기",
    shortTitle: "큰 수를 뛰어 셈",
    curriculumAnchorIds: ["[4수01-02]"],
    prerequisiteStageIds: ["large-number.read-write"]
  },
  {
    id: "large-number.compare",
    order: 5,
    unitId: "large-numbers",
    title: "높은 자리부터 큰 수 비교하기",
    shortTitle: "높은 자리부터 수를 비교함",
    curriculumAnchorIds: ["[4수01-02]"],
    prerequisiteStageIds: [
      "large-number.place-value",
      "large-number.sequence"
    ]
  },
  {
    id: "large-number.compare-reasoning",
    order: 6,
    unitId: "large-numbers",
    title: "큰 수를 비교한 방법 설명하기",
    shortTitle: "수 비교 방법을 설명함",
    curriculumAnchorIds: ["[4수01-02]"],
    prerequisiteStageIds: ["large-number.compare"]
  },
  {
    id: "angle.right-angle",
    order: 7,
    unitId: "angles",
    title: "각의 구성 요소와 직각 이해하기",
    shortTitle: "각과 직각을 이해함",
    curriculumAnchorIds: ["[4수03-02]"],
    prerequisiteStageIds: []
  },
  {
    id: "angle.classify",
    order: 8,
    unitId: "angles",
    title: "직각과 비교하여 예각과 둔각 구별하기",
    shortTitle: "예각과 둔각을 구별함",
    curriculumAnchorIds: ["[4수03-02]"],
    prerequisiteStageIds: ["angle.right-angle"]
  },
  {
    id: "angle.protractor-measure",
    order: 9,
    unitId: "angles",
    title: "각도기로 각의 크기 재기",
    shortTitle: "각도기로 각을 잼",
    curriculumAnchorIds: ["[4수03-24]"],
    prerequisiteStageIds: ["angle.classify"]
  },
  {
    id: "angle.estimate",
    order: 10,
    unitId: "angles",
    title: "직각을 기준으로 각의 크기 어림하기",
    shortTitle: "각의 크기를 어림함",
    curriculumAnchorIds: ["[4수03-24]"],
    prerequisiteStageIds: ["angle.protractor-measure"]
  },
  {
    id: "angle.triangle-angle-sum",
    order: 11,
    unitId: "angles",
    title: "삼각형의 세 각의 크기의 합 이해하기",
    shortTitle: "삼각형의 각의 합을 이해함",
    curriculumAnchorIds: ["[4수03-25]"],
    prerequisiteStageIds: ["angle.protractor-measure"]
  },
  {
    id: "angle.quadrilateral-angle-sum",
    order: 12,
    unitId: "angles",
    title: "사각형의 네 각의 크기의 합 이해하기",
    shortTitle: "사각형의 각의 합을 이해함",
    curriculumAnchorIds: ["[4수03-25]"],
    prerequisiteStageIds: ["angle.triangle-angle-sum"]
  }
];

const signals: SignalDefinition[] = [
  signal(
    "large-number.place-value",
    "큰 수의 자리값",
    "medium",
    "자리 이름과 그 자리에 놓인 숫자가 나타내는 값을 연결하는 과정이 흔들립니다.",
    "자리표에서 한 칸씩 왼쪽으로 갈 때 값이 10배가 됨을 말하게 하세요.",
    "큰 수에서 숫자가 놓인 자리에 따라 값이 달라지는 생각을 연습하고 있습니다.",
    "다섯 자리 수 하나를 쓰고, 각 숫자가 나타내는 값을 차례로 말해 보게 해주세요."
  ),
  signal(
    "large-number.positional-notation",
    "위치적 기수법",
    "high",
    "같은 숫자도 놓인 자리가 달라지면 값이 10배씩 달라지는 관계가 흔들립니다.",
    "같은 숫자 카드 두 장을 서로 다른 자리에 놓고 실제 값을 비교하게 하세요.",
    "같은 숫자라도 놓인 위치에 따라 값이 달라지는 원리를 익히고 있습니다.",
    "숫자 4를 백의 자리와 만의 자리에 놓았을 때 각각 얼마인지 물어봐 주세요."
  ),
  signal(
    "large-number.read-write",
    "큰 수 읽고 쓰기",
    "medium",
    "만 단위와 각 자리의 값을 빠짐없이 연결하여 읽고 쓰는 과정이 흔들립니다.",
    "수를 만 단위와 그보다 작은 단위로 나눈 뒤 0이 있는 자리도 표시하게 하세요.",
    "큰 수를 숫자와 한글로 서로 바꾸어 나타내는 연습을 하고 있습니다.",
    "80,530을 보고 어느 자리에 0이 있는지 짚은 뒤 읽어 보게 해주세요."
  ),
  signal(
    "large-number.sequence",
    "큰 수의 계열",
    "medium",
    "큰 수에서 일정한 크기만큼 커지거나 작아지는 규칙을 이어 가는 과정이 흔들립니다.",
    "두 이웃한 수의 차를 먼저 구하고, 커지는지 작아지는지 화살표로 표시하게 하세요.",
    "큰 수를 일정한 크기만큼 뛰어 세는 규칙을 살펴보고 있습니다.",
    "50,000에서 500씩 커지는 수를 세 번 이어 말해 보게 해주세요."
  ),
  signal(
    "large-number.compare",
    "큰 수의 크기 비교",
    "high",
    "가장 높은 자리부터 처음 다른 자리를 찾아 수의 크기를 비교하는 과정이 흔들립니다.",
    "두 수의 같은 자리는 지우고, 처음 다른 자리 한 곳에 표시하게 하세요.",
    "큰 수를 높은 자리부터 차례로 비교하는 연습을 하고 있습니다.",
    "64,208과 64,820에서 처음 다른 자리가 어디인지 물어봐 주세요."
  ),
  signal(
    "large-number.compare-reasoning",
    "큰 수 비교 방법 설명",
    "high",
    "비교 결과는 알더라도 처음 다른 자리의 숫자를 근거로 설명하는 과정이 흔들립니다.",
    "두 수에서 처음 다른 자리를 찾고, 그 자리의 두 숫자로 한 문장을 만들게 하세요.",
    "큰 수의 크기를 비교한 까닭을 자리 이름과 숫자로 설명하는 연습을 하고 있습니다.",
    "두 큰 수를 보여 주고 어느 자리 때문에 더 큰지 말해 보게 해주세요."
  ),
  signal(
    "angle.right-angle",
    "각과 직각",
    "medium",
    "각의 꼭짓점과 변을 찾고, 변의 길이와 관계없이 직각을 알아보는 과정이 흔들립니다.",
    "길이가 다른 두 반직선으로 직각을 그린 뒤 꼭짓점과 두 변을 손으로 짚어 말하게 하세요.",
    "각을 이루는 꼭짓점과 두 변을 찾고 직각을 알아보는 연습을 하고 있습니다.",
    "책 모서리에서 두 선이 만나는 점과 뻗은 두 방향을 찾아보게 해주세요."
  ),
  signal(
    "angle.classify",
    "예각과 둔각",
    "medium",
    "각을 직각과 비교하여 더 작은 예각과 더 큰 둔각으로 구별하는 과정이 흔들립니다.",
    "직각 종이를 각 위에 대어 어느 쪽이 더 벌어졌는지 먼저 말하게 하세요.",
    "직각을 기준으로 각이 더 작은지 큰지 구별하는 연습을 하고 있습니다.",
    "문이 조금 열린 모습과 많이 열린 모습을 직각인 책 모서리와 비교해 보게 해주세요."
  ),
  signal(
    "angle.protractor-measure",
    "각도기 사용",
    "high",
    "각도기의 중심과 0 눈금을 맞춘 뒤 알맞은 방향의 눈금을 읽는 과정이 흔들립니다.",
    "각도기 중심을 꼭짓점에, 0 눈금을 한 변에 맞춘 뒤 시작한 쪽의 눈금만 따라가게 하세요.",
    "각도기를 바르게 놓고 알맞은 눈금을 읽는 연습을 하고 있습니다.",
    "각도기의 중심과 0 눈금이 각각 어디에 맞아야 하는지 먼저 말해 보게 해주세요."
  ),
  signal(
    "angle.estimate",
    "각의 크기 어림",
    "medium",
    "직각 90도를 기준으로 각이 어느 방향으로 얼마나 차이 나는지 어림하는 과정이 흔들립니다.",
    "직각보다 작은지 큰지를 먼저 정한 뒤 45도, 90도, 135도 기준과 비교하게 하세요.",
    "직각을 기준으로 각의 크기를 어림하는 연습을 하고 있습니다.",
    "팔을 벌려 직각을 만든 뒤 더 좁게 또는 더 넓게 벌리며 각을 어림해 보게 해주세요."
  ),
  signal(
    "angle.triangle-angle-sum",
    "삼각형의 각의 합",
    "high",
    "삼각형의 세 각의 크기의 합을 이용하여 빠진 각을 구하거나 가능한 삼각형인지 판단하는 과정이 흔들립니다.",
    "삼각형의 세 모서리를 오려 한 점에 모아 일직선이 됨을 확인한 뒤 식으로 나타내게 하세요.",
    "삼각형의 세 각을 모두 더한 관계를 이용하는 연습을 하고 있습니다.",
    "두 각의 크기를 정해 주고 나머지 한 각을 어떻게 구할지 말해 보게 해주세요."
  ),
  signal(
    "angle.quadrilateral-angle-sum",
    "사각형의 각의 합",
    "high",
    "사각형을 삼각형 두 개로 나누어 네 각의 크기의 합을 구하는 과정이 흔들립니다.",
    "사각형에 대각선을 그어 삼각형 두 개를 만들고 각의 합을 두 번 더하게 하세요.",
    "사각형을 삼각형 두 개로 나누어 네 각의 관계를 살펴보고 있습니다.",
    "종이 사각형에 대각선을 긋고 생긴 삼각형 수와 각의 합을 말해 보게 해주세요."
  ),
  signal(
    "needs-scaffold",
    "자리표 지원 필요",
    "low",
    "자리표를 함께 보면 현재 생각을 더 분명하게 드러낼 수 있습니다.",
    "수를 자리표에 한 자리씩 옮겨 적은 뒤 다시 물어보세요.",
    "자리표를 사용해 큰 수의 구조를 다시 살펴보고 있습니다.",
    "큰 수를 네 자리씩 끊어 읽으며 자리표에 적어 보게 해주세요."
  ),
  signal(
    "needs-review",
    "추가 관찰 필요",
    "low",
    "현재 두 문항만으로는 한 가지 생각으로 확정하기 어려워 다른 수의 확인이 필요합니다.",
    "자리와 숫자를 바꾼 비슷한 문항으로 같은 생각을 한 번 더 확인하세요.",
    "다른 큰 수에서도 같은 방법을 쓰는지 한 번 더 살펴보고 있습니다.",
    "숫자를 바꾼 비슷한 문제를 한 번 더 말로 풀어 보게 해주세요."
  )
];

const judgments: Judgment[] = [
  judgment({
    id: "g4s1-large-01",
    unitId: "large-numbers",
    learnerStageId: "large-number.place-value",
    curriculumAnchorIds: ["[4수01-01]"],
    prompt: "자리표에서 강조한 3이 나타내는 값은 얼마일까요?",
    visual: {
      kind: "place-value-chart",
      digits: [7, 3, 5, 2, 4],
      ask: "value",
      highlightIndexes: [1]
    },
    signalId: "large-number.place-value",
    answers: [
      { id: "three-thousand", label: "3,000" },
      { id: "three-hundred", label: "300" },
      { id: "thirty-thousand", label: "30,000" }
    ]
  }),
  judgment({
    id: "g4s1-large-02",
    unitId: "large-numbers",
    learnerStageId: "large-number.place-value",
    curriculumAnchorIds: ["[4수01-01]"],
    prompt: "자리표에서 숫자 4는 어느 자리의 숫자일까요?",
    visual: {
      kind: "place-value-chart",
      digits: [8, 4, 1, 6, 2, 9],
      ask: "place-name"
    },
    signalId: "large-number.place-value",
    answers: [
      { id: "ten-thousands-place", label: "만의 자리" },
      { id: "thousands-place", label: "천의 자리" },
      { id: "hundred-thousands-place", label: "십만의 자리" }
    ]
  }),
  judgment({
    id: "g4s1-large-03",
    unitId: "large-numbers",
    learnerStageId: "large-number.positional-notation",
    curriculumAnchorIds: ["[4수01-01]"],
    prompt: "만의 자리 5의 값은 백의 자리 5의 값의 몇 배일까요?",
    visual: {
      kind: "place-value-chart",
      digits: [5, 4, 5, 2, 0],
      ask: "value",
      highlightIndexes: [0, 2]
    },
    signalId: "large-number.positional-notation",
    answers: [
      { id: "hundred-times", label: "100배" },
      { id: "ten-times", label: "10배" },
      { id: "same-value", label: "두 값은 같습니다" }
    ]
  }),
  judgment({
    id: "g4s1-large-04",
    unitId: "large-numbers",
    learnerStageId: "large-number.positional-notation",
    curriculumAnchorIds: ["[4수01-01]"],
    context: "자리표에서 강조한 2를 백만의 자리로 옮긴다고 생각해 보세요.",
    prompt: "2가 나타내는 값은 몇 배가 될까요?",
    visual: {
      kind: "place-value-chart",
      digits: [7, 0, 0, 2, 5, 0, 0],
      ask: "value",
      highlightIndexes: [3]
    },
    signalId: "large-number.positional-notation",
    answers: [
      { id: "thousand-times", label: "1,000배" },
      { id: "hundred-times", label: "100배" },
      { id: "same-value", label: "값은 달라지지 않습니다" }
    ]
  }),
  judgment({
    id: "g4s1-large-05",
    unitId: "large-numbers",
    learnerStageId: "large-number.read-write",
    curriculumAnchorIds: ["[4수01-01]"],
    prompt: "70,306을 바르게 읽은 것은 어느 것일까요?",
    visual: { kind: "none" },
    signalId: "large-number.read-write",
    answers: [
      { id: "correct-reading", label: "칠만 삼백육" },
      { id: "thousands-reading", label: "칠천 삼백육" },
      { id: "hundreds-omitted", label: "칠만 육" }
    ]
  }),
  judgment({
    id: "g4s1-large-06",
    unitId: "large-numbers",
    learnerStageId: "large-number.read-write",
    curriculumAnchorIds: ["[4수01-01]"],
    context: "팔만 오백삼십을 숫자로 나타냅니다.",
    prompt: "알맞은 수는 무엇일까요?",
    visual: { kind: "none" },
    signalId: "large-number.read-write",
    answers: [
      { id: "80530", label: "80,530" },
      { id: "8530", label: "8,530" },
      { id: "80030", label: "80,030" }
    ]
  }),
  judgment({
    id: "g4s1-large-07",
    unitId: "large-numbers",
    learnerStageId: "large-number.sequence",
    curriculumAnchorIds: ["[4수01-02]"],
    context: "52,300, 52,400, □ 순서로 수가 이어집니다.",
    prompt: "□에 들어갈 수는 무엇일까요?",
    visual: { kind: "none" },
    signalId: "large-number.sequence",
    answers: [
      { id: "52500", label: "52,500" },
      { id: "52410", label: "52,410" },
      { id: "52300", label: "52,300" }
    ]
  }),
  judgment({
    id: "g4s1-large-08",
    unitId: "large-numbers",
    learnerStageId: "large-number.sequence",
    curriculumAnchorIds: ["[4수01-02]"],
    prompt: "67,500, 67,000, 66,500은 어떻게 뛰어 센 수일까요?",
    visual: { kind: "none" },
    signalId: "large-number.sequence",
    answers: [
      { id: "minus-500", label: "500씩 작아지는 수" },
      { id: "minus-50", label: "50씩 작아지는 수" },
      { id: "plus-500", label: "500씩 커지는 수" }
    ]
  }),
  judgment({
    id: "g4s1-large-09",
    unitId: "large-numbers",
    learnerStageId: "large-number.compare",
    curriculumAnchorIds: ["[4수01-02]"],
    prompt: "64,208과 64,820 중 더 큰 수는 어느 것일까요?",
    visual: { kind: "none" },
    signalId: "large-number.compare",
    answers: [
      { id: "64820", label: "64,820" },
      { id: "64208", label: "64,208" },
      { id: "same", label: "두 수는 같습니다" }
    ]
  }),
  judgment({
    id: "g4s1-large-10",
    unitId: "large-numbers",
    learnerStageId: "large-number.compare",
    curriculumAnchorIds: ["[4수01-02]"],
    context: "87,250, 85,720, 87,205를 비교합니다.",
    prompt: "가장 큰 수는 어느 것일까요?",
    visual: { kind: "none" },
    signalId: "large-number.compare",
    answers: [
      { id: "87250", label: "87,250" },
      { id: "85720", label: "85,720" },
      { id: "same", label: "세 수는 같습니다" }
    ]
  }),
  judgment({
    id: "g4s1-large-11",
    unitId: "large-numbers",
    learnerStageId: "large-number.compare-reasoning",
    curriculumAnchorIds: ["[4수01-02]"],
    prompt: "47,902와 47,699를 바르게 비교한 까닭은 어느 것일까요?",
    visual: { kind: "none" },
    signalId: "large-number.compare-reasoning",
    answers: [
      {
        id: "first-different-place",
        label: "만과 천의 자리 숫자가 같고, 백의 자리에서 9가 6보다 크므로 47,902가 더 큽니다."
      },
      {
        id: "ones-first",
        label: "일의 자리에서 9가 2보다 크므로 47,699가 더 큽니다."
      },
      {
        id: "reversed-order",
        label: "백의 자리에서 6이 9보다 작으므로 47,699가 더 큽니다."
      }
    ]
  }),
  judgment({
    id: "g4s1-large-12",
    unitId: "large-numbers",
    learnerStageId: "large-number.compare-reasoning",
    curriculumAnchorIds: ["[4수01-02]"],
    context: "민수는 83,415가 83,154보다 작다고 말했습니다.",
    prompt: "바르게 고친 까닭은 어느 것일까요?",
    visual: { kind: "none" },
    signalId: "large-number.compare-reasoning",
    answers: [
      {
        id: "first-different-place",
        label: "만과 천의 자리 숫자가 같고, 백의 자리에서 4가 1보다 크므로 83,415가 더 큽니다."
      },
      {
        id: "ones-first",
        label: "일의 자리에서 5가 4보다 크므로 83,415가 더 큽니다."
      },
      {
        id: "reversed-order",
        label: "백의 자리에서 4가 1보다 크므로 83,415가 더 작습니다."
      }
    ]
  }),
  judgment({
    id: "g4s1-angle-01",
    unitId: "angles",
    learnerStageId: "angle.right-angle",
    curriculumAnchorIds: ["[4수03-02]"],
    prompt: "짧은 변과 긴 변으로 그린 각입니다. 이 각에 대한 설명으로 알맞은 것은 무엇일까요?",
    visual: {
      kind: "angle-figure",
      degrees: 90,
      mode: "bare",
      rayLengths: [42, 88],
      label: "가"
    },
    signalId: "angle.right-angle",
    answers: [
      { id: "right-angle", label: "두 변이 직각을 이루므로 직각입니다." },
      { id: "ray-length-large", label: "긴 변이 있어 직각보다 큰 각입니다." },
      { id: "unequal-rays", label: "두 변의 길이가 달라 직각이 될 수 없습니다." }
    ]
  }),
  judgment({
    id: "g4s1-angle-02",
    unitId: "angles",
    learnerStageId: "angle.right-angle",
    curriculumAnchorIds: ["[4수03-02]"],
    context: "책 모서리를 한 각으로 간단히 그린 그림입니다.",
    prompt: "이 각의 꼭짓점과 두 변을 바르게 말한 것은 무엇일까요?",
    visual: {
      kind: "angle-figure",
      degrees: 90,
      mode: "bare",
      rayLengths: [96, 40],
      label: "나"
    },
    signalId: "angle.right-angle",
    answers: [
      {
        id: "vertex-and-rays",
        label: "두 변이 만나는 점이 꼭짓점이고, 꼭짓점에서 뻗은 두 반직선이 변입니다."
      },
      {
        id: "long-ray-only",
        label: "더 긴 반직선만 변이고 짧은 쪽은 변이 아닙니다."
      },
      {
        id: "equal-rays-required",
        label: "두 변의 길이가 같아야 꼭짓점이라고 부를 수 있습니다."
      }
    ]
  }),
  judgment({
    id: "g4s1-angle-03",
    unitId: "angles",
    learnerStageId: "angle.classify",
    curriculumAnchorIds: ["[4수03-02]"],
    prompt: "직각보다 작은 각과 큰 각 가운데 이 각은 어디에 속할까요?",
    visual: {
      kind: "angle-figure",
      degrees: 125,
      mode: "bare",
      referenceRightAngle: true,
      label: "가"
    },
    signalId: "angle.classify",
    answers: [
      { id: "obtuse", label: "둔각입니다." },
      { id: "acute", label: "예각입니다." },
      { id: "right", label: "직각입니다." }
    ]
  }),
  judgment({
    id: "g4s1-angle-04",
    unitId: "angles",
    learnerStageId: "angle.classify",
    curriculumAnchorIds: ["[4수03-02]"],
    context: "직각 기준선과 함께 각을 그렸습니다.",
    prompt: "이 각과 직각의 관계를 바르게 설명한 것은 무엇일까요?",
    visual: {
      kind: "angle-figure",
      degrees: 85,
      mode: "bare",
      referenceRightAngle: true,
      label: "나"
    },
    signalId: "angle.classify",
    answers: [
      {
        id: "slightly-less-than-right",
        label: "기준선보다 조금 덜 벌어져 직각보다 작은 예각입니다."
      },
      {
        id: "more-than-right",
        label: "기준선보다 더 벌어져 직각보다 큰 둔각입니다."
      },
      {
        id: "almost-right",
        label: "기준선과 거의 붙어 있으니 직각입니다."
      }
    ]
  }),
  judgment({
    id: "g4s1-angle-05",
    unitId: "angles",
    learnerStageId: "angle.protractor-measure",
    curriculumAnchorIds: ["[4수03-24]"],
    prompt: "각도기의 눈금을 읽으면 이 각은 몇 도일까요?",
    visual: {
      kind: "angle-figure",
      degrees: 125,
      mode: "protractor",
      protractorPlacement: "aligned",
      label: "가"
    },
    signalId: "angle.protractor-measure",
    answers: [
      { id: "125-degrees", label: "125도" },
      { id: "55-degrees", label: "55도" },
      {
        id: "cannot-measure",
        label: "기준선이 어긋나 각도를 잴 수 없습니다."
      }
    ]
  }),
  judgment({
    id: "g4s1-angle-06",
    unitId: "angles",
    learnerStageId: "angle.protractor-measure",
    curriculumAnchorIds: ["[4수03-24]"],
    context: "친구가 각도기를 놓고 각을 재려고 합니다.",
    prompt: "각도기를 놓은 방법에 대해 바르게 말한 것은 무엇일까요?",
    visual: {
      kind: "angle-figure",
      degrees: 70,
      mode: "protractor",
      protractorPlacement: "baseline-off",
      label: "나"
    },
    signalId: "angle.protractor-measure",
    answers: [
      {
        id: "realign-zero",
        label: "0 눈금이 한 변에서 벗어나 있으니 다시 맞추어 놓아야 합니다."
      },
      {
        id: "read-other-scale",
        label: "그대로 두고 반대쪽 눈금을 읽으면 됩니다."
      },
      {
        id: "center-only",
        label: "중심만 꼭짓점에 있으면 되니 이미 바르게 놓았습니다."
      }
    ]
  }),
  judgment({
    id: "g4s1-angle-07",
    unitId: "angles",
    learnerStageId: "angle.estimate",
    curriculumAnchorIds: ["[4수03-24]"],
    prompt: "직각과 비교하여 이 각의 크기를 어림하면 얼마쯤일까요?",
    visual: {
      kind: "angle-figure",
      degrees: 45,
      mode: "bare",
      referenceRightAngle: true,
      label: "가"
    },
    signalId: "angle.estimate",
    answers: [
      { id: "about-45", label: "45도쯤" },
      { id: "about-90", label: "90도쯤" },
      { id: "about-135", label: "135도쯤" }
    ]
  }),
  judgment({
    id: "g4s1-angle-08",
    unitId: "angles",
    learnerStageId: "angle.estimate",
    curriculumAnchorIds: ["[4수03-24]"],
    context: "시계의 긴바늘과 짧은바늘이 이루는 각을 어림합니다.",
    prompt: "그림의 각은 어느 크기에 가장 가까울까요?",
    visual: {
      kind: "angle-figure",
      degrees: 150,
      mode: "bare",
      label: "나"
    },
    signalId: "angle.estimate",
    answers: [
      { id: "about-150", label: "150도쯤" },
      { id: "about-100", label: "100도쯤" },
      { id: "about-30", label: "30도쯤" }
    ]
  }),
  judgment({
    id: "g4s1-angle-09",
    unitId: "angles",
    learnerStageId: "angle.triangle-angle-sum",
    curriculumAnchorIds: ["[4수03-25]"],
    prompt: "두 각의 크기를 보고 나머지 한 각의 크기를 구해 보세요.",
    visual: {
      kind: "polygon-angle-diagram",
      polygon: "triangle",
      mode: "find-missing",
      angles: [
        { label: "가", value: 55 },
        { label: "나", value: 80 },
        { label: "다", value: null }
      ]
    },
    signalId: "angle.triangle-angle-sum",
    answers: [
      { id: "45-degrees", label: "45도" },
      { id: "90-degrees", label: "90도" },
      { id: "25-degrees", label: "25도" }
    ]
  }),
  judgment({
    id: "g4s1-angle-10",
    unitId: "angles",
    learnerStageId: "angle.triangle-angle-sum",
    curriculumAnchorIds: ["[4수03-25]"],
    context: "민지는 세 각이 60도, 70도, 60도인 삼각형을 그렸다고 말했습니다.",
    prompt: "민지의 말에 대해 바르게 판단한 것은 무엇일까요?",
    visual: {
      kind: "polygon-angle-diagram",
      polygon: "triangle",
      mode: "verify-claim",
      angles: [
        { label: "가", value: 60 },
        { label: "나", value: 70 },
        { label: "다", value: 60 }
      ]
    },
    signalId: "angle.triangle-angle-sum",
    answers: [
      {
        id: "sum-is-190",
        label: "세 각을 더하면 190도가 되어 삼각형을 그릴 수 없습니다."
      },
      {
        id: "no-right-angle-needed",
        label: "직각이 없으니 세 각의 크기와 관계없이 그릴 수 있습니다."
      },
      {
        id: "difference-is-enough",
        label: "가장 큰 각에서 가장 작은 각을 뺀 10도만 확인하면 되므로 그릴 수 있습니다."
      }
    ]
  }),
  judgment({
    id: "g4s1-angle-11",
    unitId: "angles",
    learnerStageId: "angle.quadrilateral-angle-sum",
    curriculumAnchorIds: ["[4수03-25]"],
    prompt: "세 각의 크기를 보고 나머지 한 각의 크기를 구해 보세요.",
    visual: {
      kind: "polygon-angle-diagram",
      polygon: "quadrilateral",
      mode: "find-missing",
      angles: [
        { label: "가", value: 95 },
        { label: "나", value: 100 },
        { label: "다", value: 80 },
        { label: "라", value: null }
      ]
    },
    signalId: "angle.quadrilateral-angle-sum",
    answers: [
      { id: "85-degrees", label: "85도" },
      { id: "90-degrees", label: "90도" },
      { id: "5-degrees", label: "5도" }
    ]
  }),
  judgment({
    id: "g4s1-angle-12",
    unitId: "angles",
    learnerStageId: "angle.quadrilateral-angle-sum",
    curriculumAnchorIds: ["[4수03-25]"],
    context: "사각형에 대각선을 그어 삼각형 두 개로 나누었습니다.",
    prompt: "네 각의 크기의 합을 구하는 방법으로 알맞은 것은 무엇일까요?",
    visual: {
      kind: "polygon-angle-diagram",
      polygon: "quadrilateral",
      mode: "verify-claim",
      angles: [
        { label: "가", value: 95 },
        { label: "나", value: 100 },
        { label: "다", value: 80 },
        { label: "라", value: 85 }
      ],
      diagonal: true
    },
    signalId: "angle.quadrilateral-angle-sum",
    answers: [
      {
        id: "two-triangle-sums",
        label: "삼각형 두 개의 세 각의 합을 더하면 됩니다."
      },
      {
        id: "one-triangle-sum",
        label: "삼각형이 두 개라도 삼각형 하나의 세 각의 합과 같습니다."
      },
      {
        id: "all-right-angles",
        label: "네 각이 모두 직각이라고 보고 90도를 네 번 더하면 됩니다."
      }
    ]
  })
];

const unsigned: DiagnosisSet = {
  manifest: {
    id: "grade4-semester1",
    version: "1.0.0",
    checksum: "0cf12964a5d2a47f0e6ba0cea738d87bea8e649fbf73664384b95d6e6965f4f1",
    title: "4학년 1학기 수학 생각 지도",
    shortTitle: "4-1 수학 생각 지도",
    grade: 4,
    semester: 1,
    curriculum: "2022-revised",
    status: "review",
    units: [
      { id: "large-numbers", order: 1, title: "큰 수" },
      { id: "angles", order: 2, title: "각도" }
    ],
    interactionTypes: [{ type: "choice", version: 1 }],
    estimatedMinutes: 12
  },
  curriculumAnchors: anchors,
  learnerStages: stages,
  signals,
  judgments
};

export const grade4Semester1Diagnosis =
  diagnosisSetSchema.parse(unsigned) as DiagnosisSet;
