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
  "[4수03-25]",
  "[4수03-04]",
  "[4수03-05]",
  "[4수02-01]",
  "[4수02-02]",
  "[4수02-03]",
  "[4수04-01]",
  "[4수04-03]",
  "[4수01-04]",
  "[4수01-05]",
  "[4수01-07]",
  "[4수01-08]"
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
  },
  {
    id: "figure-transform.slide",
    order: 13,
    unitId: "figure-transform",
    title: "평면도형을 방향과 칸 수에 맞게 밀기",
    shortTitle: "도형을 알맞게 밂",
    curriculumAnchorIds: ["[4수03-04]"],
    prerequisiteStageIds: []
  },
  {
    id: "figure-transform.flip-left-right",
    order: 14,
    unitId: "figure-transform",
    title: "평면도형을 좌우로 뒤집은 변화 이해하기",
    shortTitle: "도형을 좌우로 뒤집음",
    curriculumAnchorIds: ["[4수03-04]"],
    prerequisiteStageIds: []
  },
  {
    id: "figure-transform.flip-up-down",
    order: 15,
    unitId: "figure-transform",
    title: "평면도형을 위아래로 뒤집은 변화 이해하기",
    shortTitle: "도형을 위아래로 뒤집음",
    curriculumAnchorIds: ["[4수03-04]"],
    prerequisiteStageIds: []
  },
  {
    id: "figure-transform.rotate",
    order: 16,
    unitId: "figure-transform",
    title: "중심을 고정하고 평면도형 돌리기",
    shortTitle: "중심을 두고 도형을 돌림",
    curriculumAnchorIds: ["[4수03-04]"],
    prerequisiteStageIds: []
  },
  {
    id: "figure-transform.point-move",
    order: 17,
    unitId: "figure-transform",
    title: "격자에서 점의 이동을 위치와 방향으로 설명하기",
    shortTitle: "점의 이동을 설명함",
    curriculumAnchorIds: ["[4수03-05]"],
    prerequisiteStageIds: []
  },
  {
    id: "patterns-relations.number-rule",
    order: 18,
    unitId: "patterns-relations",
    title: "수 배열에서 반복되는 변화 규칙 찾기",
    shortTitle: "수의 변화 규칙을 찾음",
    curriculumAnchorIds: ["[4수02-01]"],
    prerequisiteStageIds: []
  },
  {
    id: "patterns-relations.figure-rule",
    order: 19,
    unitId: "patterns-relations",
    title: "도형 배열에서 개수의 변화 규칙 찾기",
    shortTitle: "도형 개수의 규칙을 찾음",
    curriculumAnchorIds: ["[4수02-01]"],
    prerequisiteStageIds: ["patterns-relations.number-rule"]
  },
  {
    id: "patterns-relations.rule-as-expression",
    order: 20,
    unitId: "patterns-relations",
    title: "두 양의 대응 규칙을 식으로 나타내기",
    shortTitle: "대응 규칙을 식으로 나타냄",
    curriculumAnchorIds: ["[4수02-01]"],
    prerequisiteStageIds: ["patterns-relations.number-rule"]
  },
  {
    id: "patterns-relations.calc-array-rule",
    order: 21,
    unitId: "patterns-relations",
    title: "계산식 배열의 규칙으로 결과 예상하기",
    shortTitle: "계산 결과를 예상함",
    curriculumAnchorIds: ["[4수02-02]"],
    prerequisiteStageIds: ["patterns-relations.number-rule"]
  },
  {
    id: "patterns-relations.equal-sign",
    order: 22,
    unitId: "patterns-relations",
    title: "등호로 크기가 같은 두 양 나타내기",
    shortTitle: "등식의 관계를 이해함",
    curriculumAnchorIds: ["[4수02-03]"],
    prerequisiteStageIds: []
  },
  {
    id: "bar-graph.scale",
    order: 23,
    unitId: "bar-graphs",
    title: "눈금 한 칸이 나타내는 값 알기",
    shortTitle: "눈금 한 칸의 값을 앎",
    curriculumAnchorIds: ["[4수04-01]"],
    prerequisiteStageIds: []
  },
  {
    id: "bar-graph.read-value",
    order: 24,
    unitId: "bar-graphs",
    title: "막대의 길이와 눈금으로 자료의 값 읽기",
    shortTitle: "막대의 값을 읽음",
    curriculumAnchorIds: ["[4수04-01]"],
    prerequisiteStageIds: ["bar-graph.scale"]
  },
  {
    id: "bar-graph.compare",
    order: 25,
    unitId: "bar-graphs",
    title: "두 막대의 값을 비교하여 차 구하기",
    shortTitle: "두 막대의 차를 구함",
    curriculumAnchorIds: ["[4수04-01]"],
    prerequisiteStageIds: ["bar-graph.read-value"]
  },
  {
    id: "bar-graph.table-match",
    order: 26,
    unitId: "bar-graphs",
    title: "표의 자료와 일치하는 막대그래프 찾기",
    shortTitle: "표와 그래프를 연결함",
    curriculumAnchorIds: ["[4수04-01]", "[4수04-03]"],
    prerequisiteStageIds: ["bar-graph.scale"]
  },
  {
    id: "bar-graph.inquiry",
    order: 27,
    unitId: "bar-graphs",
    title: "막대그래프를 근거로 탐구 질문에 답하기",
    shortTitle: "그래프로 결론을 정함",
    curriculumAnchorIds: ["[4수04-03]"],
    prerequisiteStageIds: [
      "bar-graph.read-value",
      "bar-graph.compare"
    ]
  },
  {
    id: "mul-div.partial-product-place",
    order: 28,
    unitId: "multiplication-division",
    title: "두 자리 수의 십의 자리로 곱한 값 구하기",
    shortTitle: "십의 자리로 곱한 값을 구함",
    curriculumAnchorIds: ["[4수01-04]"],
    prerequisiteStageIds: []
  },
  {
    id: "mul-div.product-combine",
    order: 29,
    unitId: "multiplication-division",
    title: "두 번 곱한 값을 자리에 맞게 합하기",
    shortTitle: "두 곱을 자리에 맞게 합함",
    curriculumAnchorIds: ["[4수01-04]"],
    prerequisiteStageIds: ["mul-div.partial-product-place"]
  },
  {
    id: "mul-div.quotient-place",
    order: 30,
    unitId: "multiplication-division",
    title: "두 자리 수로 나눌 때 몫이 놓이는 자리 정하기",
    shortTitle: "몫이 놓이는 자리를 정함",
    curriculumAnchorIds: ["[4수01-07]"],
    prerequisiteStageIds: []
  },
  {
    id: "mul-div.quotient-adjust",
    order: 31,
    unitId: "multiplication-division",
    title: "어림한 몫을 조건에 맞게 고치기",
    shortTitle: "어림한 몫을 고침",
    curriculumAnchorIds: ["[4수01-07]"],
    prerequisiteStageIds: ["mul-div.quotient-place"]
  },
  {
    id: "mul-div.multiplication-check",
    order: 32,
    unitId: "multiplication-division",
    title: "나눗셈 결과를 곱셈으로 확인하기",
    shortTitle: "곱셈으로 결과를 확인함",
    curriculumAnchorIds: ["[4수01-05]"],
    prerequisiteStageIds: []
  },
  {
    id: "mul-div.estimate",
    order: 33,
    unitId: "multiplication-division",
    title: "곱셈과 나눗셈의 결과를 어림하기",
    shortTitle: "계산 결과를 어림함",
    curriculumAnchorIds: ["[4수01-08]"],
    prerequisiteStageIds: []
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
    "figure-transform.slide",
    "평면도형 밀기",
    "medium",
    "도형의 모양과 방향은 그대로 두고 모든 점을 같은 방향으로 같은 칸 수만큼 옮기는 과정이 흔들립니다.",
    "도형의 한 점을 먼저 옮긴 뒤 나머지 점도 같은 방향과 칸 수로 옮기게 하세요.",
    "도형을 모양 그대로 같은 방향과 거리만큼 옮기는 연습을 하고 있습니다.",
    "격자에 작은 도형을 그리고 오른쪽이나 아래쪽으로 몇 칸 밀어 보게 해주세요."
  ),
  signal(
    "figure-transform.flip-left-right",
    "좌우 뒤집기",
    "medium",
    "세로 기준선을 사이에 두고 도형의 왼쪽과 오른쪽 위치가 바뀌는 과정을 살펴볼 필요가 있습니다.",
    "투명 종이를 세로선에 맞춰 접어 도형의 각 점과 표식이 어디로 가는지 확인하게 하세요.",
    "도형을 좌우로 뒤집었을 때 위치와 방향이 어떻게 바뀌는지 연습하고 있습니다.",
    "비대칭 도형을 그려 세로선을 기준으로 접었을 때 표식이 어디로 가는지 찾아보게 해주세요."
  ),
  signal(
    "figure-transform.flip-up-down",
    "위아래 뒤집기",
    "medium",
    "가로 기준선을 사이에 두고 도형의 위쪽과 아래쪽 위치가 바뀌는 과정을 살펴볼 필요가 있습니다.",
    "가로선에 거울을 대거나 종이를 접어 도형의 각 점과 표식이 어디로 가는지 확인하게 하세요.",
    "도형을 위아래로 뒤집었을 때 위치와 방향이 어떻게 바뀌는지 연습하고 있습니다.",
    "비대칭 도형을 그려 가로선을 기준으로 접었을 때 표식이 어디로 가는지 찾아보게 해주세요."
  ),
  signal(
    "figure-transform.rotate",
    "평면도형 돌리기",
    "high",
    "중심을 고정한 채 시계 방향 또는 시계 반대 방향으로 도형을 돌린 결과를 예상하는 과정이 흔들립니다.",
    "중심에 연필 끝을 고정하고 투명 종이를 90도씩 돌리며 한 점의 이동을 먼저 추적하게 하세요.",
    "중심을 두고 도형을 돌렸을 때 위치와 방향이 어떻게 바뀌는지 연습하고 있습니다.",
    "종이에 화살표를 그린 뒤 한 점을 누르고 시계 방향과 반대 방향으로 돌려 보게 해주세요."
  ),
  signal(
    "figure-transform.point-move",
    "격자에서 점의 이동",
    "high",
    "한 점에서 다른 점까지의 가로·세로 이동을 방향과 칸 수로 나누어 설명하는 과정이 흔들립니다.",
    "출발점에서 가로 이동과 세로 이동을 각각 화살표로 그리고 칸 수를 따로 세게 하세요.",
    "격자에서 한 점이 어느 방향으로 몇 칸 움직였는지 설명하는 연습을 하고 있습니다.",
    "격자에 두 점을 찍고 첫 점에서 둘째 점까지 왼쪽·오른쪽·위쪽·아래쪽 몇 칸인지 말해 보게 해주세요."
  ),
  signal(
    "patterns-relations.number-rule",
    "수의 변화 규칙",
    "medium",
    "이웃한 수 사이에서 반복되는 곱셈 규칙을 찾고 다음 수에 적용하는 과정이 흔들립니다.",
    "연속한 두 수 사이에 같은 곱셈 화살표를 그린 뒤 다음 수에도 그대로 적용하게 하세요.",
    "수 배열에서 같은 변화가 되풀이되는 규칙을 찾는 연습을 하고 있습니다.",
    "2, 6, 18처럼 이어지는 수를 보여 주고 매번 어떻게 바뀌는지 말해 보게 해주세요."
  ),
  signal(
    "patterns-relations.figure-rule",
    "도형 개수의 변화 규칙",
    "medium",
    "도형의 순서와 도형 개수의 변화를 구분하고, 늘어나는 개수를 다음 모양에 적용하는 과정이 흔들립니다.",
    "각 모양의 도형 수를 직접 적고 이웃한 두 수의 차를 나란히 표시하게 하세요.",
    "모양이 한 단계씩 바뀔 때 도형이 몇 개씩 늘어나는지 살펴보고 있습니다.",
    "블록을 3개, 5개, 7개로 늘어놓고 다음에는 몇 개가 될지 물어봐 주세요."
  ),
  signal(
    "patterns-relations.rule-as-expression",
    "대응 규칙을 식으로 나타내기",
    "high",
    "대응표의 두 양을 어느 방향으로 연결할지 정하고 모든 줄에 맞는 식을 고르는 과정이 흔들립니다.",
    "표의 첫째 줄에서 만든 식을 둘째와 셋째 줄에도 대입해 모두 맞는지 확인하게 하세요.",
    "두 양이 어떻게 대응하는지 표에서 찾아 식으로 나타내는 연습을 하고 있습니다.",
    "상자 1개에 물건 4개씩 넣을 때 상자 수와 물건 수의 관계를 말해 보게 해주세요."
  ),
  signal(
    "patterns-relations.calc-array-rule",
    "계산식 배열의 규칙",
    "high",
    "계산식에서 고정된 수와 일정하게 변하는 수를 구별해 계산 결과를 예상하는 과정이 흔들립니다.",
    "각 계산에서 바뀐 수에 밑줄을 긋고 마지막 계산은 같은 연산으로 직접 확인하게 하세요.",
    "나란히 놓인 계산식에서 규칙을 찾아 마지막 결과를 예상하는 연습을 하고 있습니다.",
    "한 수는 그대로 두고 다른 수만 1씩 바꾼 곱셈식을 만들어 결과를 비교해 보게 해주세요."
  ),
  signal(
    "patterns-relations.equal-sign",
    "등호가 나타내는 관계",
    "high",
    "등호를 계산 결과가 나오는 표시로만 보고 양쪽의 값이 같다는 관계를 확인하는 과정이 흔들립니다.",
    "등호 양쪽을 따로 계산해 같은 값이 되도록 빈칸을 조절하게 하세요.",
    "등호 양쪽의 값이 같아야 한다는 뜻을 이용해 빈칸을 찾는 연습을 하고 있습니다.",
    "두 덧셈식 사이에 등호를 놓고 양쪽의 합이 같은지 각각 계산해 보게 해주세요."
  ),
  signal(
    "bar-graph.scale",
    "막대그래프의 눈금",
    "high",
    "눈금 전체의 값과 칸 수를 연결하여 눈금 한 칸이 나타내는 값을 구하는 과정이 흔들립니다.",
    "0부터 마지막 눈금까지 같은 칸 수로 나눈 뒤 전체 값을 칸 수로 나누게 하세요.",
    "막대그래프에서 눈금 한 칸이 얼마를 나타내는지 살펴보고 있습니다.",
    "0부터 30까지 6칸인 눈금을 그려 한 칸의 값을 말해 보게 해주세요."
  ),
  signal(
    "bar-graph.read-value",
    "막대의 값 읽기",
    "high",
    "막대가 닿은 칸 수와 눈금 한 칸의 값을 곱하여 자료의 값을 읽는 과정이 흔들립니다.",
    "막대가 몇 칸인지 먼저 세고, 그 수에 눈금 한 칸의 값을 곱하게 하세요.",
    "막대의 길이를 실제 자료의 값으로 바꾸어 읽는 연습을 하고 있습니다.",
    "한 칸이 5인 눈금에서 7칸 길이의 막대가 얼마를 나타내는지 물어봐 주세요."
  ),
  signal(
    "bar-graph.compare",
    "막대그래프의 비교",
    "high",
    "비교할 두 막대의 값을 각각 읽은 뒤 큰 값에서 작은 값을 빼는 과정이 흔들립니다.",
    "두 막대의 칸 수를 각각 값으로 바꾸고, 더 많은 쪽에서 더 적은 쪽을 빼게 하세요.",
    "두 막대가 나타내는 값을 비교하여 차를 구하는 연습을 하고 있습니다.",
    "한 칸이 10일 때 4칸 막대와 2칸 막대의 차를 말해 보게 해주세요."
  ),
  signal(
    "bar-graph.table-match",
    "표와 막대그래프 연결",
    "medium",
    "표의 수를 눈금 한 칸의 값으로 나누어 각 막대의 알맞은 칸 수를 정하는 과정이 흔들립니다.",
    "표의 각 수 옆에 필요한 막대 칸 수를 적고 항목 순서대로 그래프와 대조하게 하세요.",
    "표의 자료가 막대그래프에 어떻게 나타나는지 연결하는 연습을 하고 있습니다.",
    "간단한 표를 보고 한 칸이 2일 때 각 막대가 몇 칸이어야 하는지 말해 보게 해주세요."
  ),
  signal(
    "bar-graph.inquiry",
    "막대그래프를 이용한 탐구",
    "medium",
    "탐구 질문에 맞는 항목을 찾고 막대 길이를 근거로 결론을 고르는 과정이 흔들립니다.",
    "질문의 핵심 말에 밑줄을 긋고, 그 말과 맞는 가장 길거나 짧은 막대를 먼저 찾게 하세요.",
    "막대그래프의 자료를 근거로 질문에 맞는 결론을 고르는 연습을 하고 있습니다.",
    "가족이 좋아하는 과일 그래프를 보고 어떤 과일을 가장 많이 준비할지 말해 보게 해주세요."
  ),
  signal(
    "mul-div.partial-product-place",
    "십의 자리로 곱하기",
    "high",
    "두 자리 수의 십의 자리 숫자가 몇십을 나타내는지 연결하여 곱하는 과정이 흔들립니다.",
    "곱하는 수를 몇십과 몇으로 나누어 쓰고, 몇십과 먼저 곱한 값을 말하게 하세요.",
    "두 자리 수의 십의 자리가 나타내는 값으로 곱하는 연습을 하고 있습니다.",
    "두 자리 수를 몇십과 몇으로 나눈 뒤 각각 곱한 값을 말해 보게 해주세요."
  ),
  signal(
    "mul-div.product-combine",
    "두 곱을 합하기",
    "medium",
    "두 번 곱해 구한 값을 각각의 자리에 맞게 더하여 전체 곱을 만드는 과정이 흔들립니다.",
    "몇십으로 곱한 값과 몇으로 곱한 값을 따로 적고 두 값을 더하게 하세요.",
    "나누어 곱한 두 값을 자리에 맞게 합하는 연습을 하고 있습니다.",
    "두 자리 수를 몇십과 몇으로 나누어 곱한 뒤 두 답을 더해 보게 해주세요."
  ),
  signal(
    "mul-div.quotient-place",
    "몫이 놓이는 자리",
    "high",
    "두 자리 수로 나눌 때 몫의 첫 숫자가 놓일 자리를 정하는 과정이 흔들립니다.",
    "나누어지는 수의 앞부분과 나누는 수를 비교해 몫이 몇 자리 수인지 먼저 말하게 하세요.",
    "나눗셈에서 몫이 몇 자리 수인지 살펴보는 연습을 하고 있습니다.",
    "세 자리 수를 두 자리 수로 나눌 때 몫이 몇 자리일지 먼저 어림해 보게 해주세요."
  ),
  signal(
    "mul-div.quotient-adjust",
    "어림한 몫 고치기",
    "high",
    "어림한 몫으로 곱한 값과 나누어지는 수를 비교해 몫을 알맞게 고치는 과정이 흔들립니다.",
    "어림한 몫으로 곱한 값이 너무 큰지, 남은 수가 나누는 수보다 작은지 확인하게 하세요.",
    "어림한 몫이 알맞은지 확인하고 크거나 작게 고치는 연습을 하고 있습니다.",
    "어림한 몫으로 다시 곱해 본 뒤 몫을 늘릴지 줄일지 말해 보게 해주세요."
  ),
  signal(
    "mul-div.multiplication-check",
    "곱셈으로 나눗셈 확인",
    "medium",
    "나누는 수와 몫을 곱한 뒤 남은 수를 더해 나누어지는 수와 같은지 확인하는 과정이 흔들립니다.",
    "나누는 수×몫+남은 수를 한 식으로 쓰고 처음 수와 같은지 확인하게 하세요.",
    "나눗셈의 결과를 곱셈과 남은 수로 확인하는 연습을 하고 있습니다.",
    "간단한 나눗셈을 한 뒤 나누는 수와 몫을 곱하고 남은 수를 더해 보게 해주세요."
  ),
  signal(
    "mul-div.estimate",
    "계산 결과 어림",
    "medium",
    "계산하기 쉬운 가까운 수로 바꾸어 곱셈과 나눗셈의 결과 크기를 예상하는 과정이 흔들립니다.",
    "두 수를 가까운 몇백과 몇십으로 바꾼 뒤 먼저 결과의 크기를 말하게 하세요.",
    "계산하기 쉬운 가까운 수를 이용해 답의 크기를 짐작하는 연습을 하고 있습니다.",
    "412×19를 400×20처럼 가까운 수로 바꾸어 얼마쯤인지 말해 보게 해주세요."
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
  }),
  judgment({
    id: "g4s1-transform-01",
    unitId: "figure-transform",
    learnerStageId: "figure-transform.slide",
    curriculumAnchorIds: ["[4수03-04]"],
    context: "범례에서 처음 도형과 나중 도형을 확인해 보세요.",
    prompt: "처음 도형을 어떻게 밀었을까요?",
    visual: {
      kind: "grid-transform-diagram",
      mode: "slide",
      rows: 6,
      columns: 8,
      sourceCells: [
        { row: 1, column: 1 },
        { row: 2, column: 1 },
        { row: 2, column: 2 }
      ],
      targetCells: [
        { row: 1, column: 4 },
        { row: 2, column: 4 },
        { row: 2, column: 5 }
      ],
      sourceMarker: { row: 1, column: 1 },
      targetMarker: { row: 1, column: 4 },
      direction: "right",
      amount: 3
    },
    signalId: "figure-transform.slide",
    answers: [
      { id: "right-three", label: "오른쪽으로 3칸 밀었습니다." },
      { id: "left-three", label: "왼쪽으로 3칸 밀었습니다." },
      { id: "right-four", label: "오른쪽으로 4칸 밀었습니다." }
    ]
  }),
  judgment({
    id: "g4s1-transform-02",
    unitId: "figure-transform",
    learnerStageId: "figure-transform.slide",
    curriculumAnchorIds: ["[4수03-04]"],
    context: "도형 안의 표시된 점도 함께 움직였습니다.",
    prompt: "처음 도형에서 나중 도형으로 옮긴 방법은 무엇일까요?",
    visual: {
      kind: "grid-transform-diagram",
      mode: "slide",
      rows: 6,
      columns: 8,
      sourceCells: [
        { row: 0, column: 4 },
        { row: 0, column: 5 },
        { row: 1, column: 5 }
      ],
      targetCells: [
        { row: 3, column: 4 },
        { row: 3, column: 5 },
        { row: 4, column: 5 }
      ],
      sourceMarker: { row: 0, column: 4 },
      targetMarker: { row: 3, column: 4 },
      direction: "down",
      amount: 3
    },
    signalId: "figure-transform.slide",
    answers: [
      { id: "down-three", label: "아래쪽으로 3칸 밀었습니다." },
      { id: "up-three", label: "위쪽으로 3칸 밀었습니다." },
      { id: "down-four", label: "아래쪽으로 4칸 밀었습니다." }
    ]
  }),
  judgment({
    id: "g4s1-transform-03",
    unitId: "figure-transform",
    learnerStageId: "figure-transform.flip-left-right",
    curriculumAnchorIds: ["[4수03-04]"],
    context: "점선을 기준으로 도형을 움직였습니다.",
    prompt: "처음 도형에서 나중 도형으로 바뀐 방법은 무엇일까요?",
    visual: {
      kind: "grid-transform-diagram",
      mode: "flip-left-right",
      rows: 5,
      columns: 8,
      sourceCells: [
        { row: 1, column: 1 },
        { row: 2, column: 1 },
        { row: 2, column: 2 }
      ],
      targetCells: [
        { row: 1, column: 6 },
        { row: 2, column: 6 },
        { row: 2, column: 5 }
      ],
      sourceMarker: { row: 1, column: 1 },
      targetMarker: { row: 1, column: 6 },
      axisIndex: 4
    },
    signalId: "figure-transform.flip-left-right",
    answers: [
      { id: "flip-left-right", label: "세로선을 기준으로 좌우를 뒤집었습니다." },
      { id: "slide-right", label: "도형의 방향을 그대로 두고 오른쪽으로 밀었습니다." },
      { id: "flip-up-down", label: "가로선을 기준으로 위아래를 뒤집었습니다." }
    ]
  }),
  judgment({
    id: "g4s1-transform-04",
    unitId: "figure-transform",
    learnerStageId: "figure-transform.flip-left-right",
    curriculumAnchorIds: ["[4수03-04]"],
    context: "처음 도형과 나중 도형의 표식은 도형에서 같은 자리를 나타냅니다.",
    prompt: "도형과 점의 위치가 바뀐 방법을 골라 보세요.",
    visual: {
      kind: "grid-transform-diagram",
      mode: "flip-left-right",
      rows: 5,
      columns: 8,
      sourceCells: [
        { row: 0, column: 1 },
        { row: 1, column: 1 },
        { row: 1, column: 2 },
        { row: 2, column: 1 }
      ],
      targetCells: [
        { row: 0, column: 6 },
        { row: 1, column: 6 },
        { row: 1, column: 5 },
        { row: 2, column: 6 }
      ],
      sourceMarker: { row: 1, column: 2 },
      targetMarker: { row: 1, column: 5 },
      axisIndex: 4
    },
    signalId: "figure-transform.flip-left-right",
    answers: [
      { id: "mirror-on-vertical", label: "세로 점선을 기준으로 좌우를 뒤집었습니다." },
      { id: "same-shape-slide", label: "처음 모양과 방향 그대로 오른쪽으로 밀었습니다." },
      { id: "mirror-on-horizontal", label: "가로선을 기준으로 위아래를 뒤집었습니다." }
    ]
  }),
  judgment({
    id: "g4s1-transform-05",
    unitId: "figure-transform",
    learnerStageId: "figure-transform.flip-up-down",
    curriculumAnchorIds: ["[4수03-04]"],
    context: "점선 양쪽의 도형 위치를 살펴보세요.",
    prompt: "처음 도형에서 나중 도형으로 바뀐 방법은 무엇일까요?",
    visual: {
      kind: "grid-transform-diagram",
      mode: "flip-up-down",
      rows: 6,
      columns: 6,
      sourceCells: [
        { row: 1, column: 1 },
        { row: 1, column: 2 },
        { row: 2, column: 1 }
      ],
      targetCells: [
        { row: 4, column: 1 },
        { row: 4, column: 2 },
        { row: 3, column: 1 }
      ],
      sourceMarker: { row: 1, column: 2 },
      targetMarker: { row: 4, column: 2 },
      axisIndex: 3
    },
    signalId: "figure-transform.flip-up-down",
    answers: [
      { id: "flip-up-down", label: "가로선을 기준으로 위아래를 뒤집었습니다." },
      { id: "slide-down", label: "도형의 방향을 그대로 두고 아래쪽으로 밀었습니다." },
      { id: "flip-left-right", label: "세로선을 기준으로 좌우를 뒤집었습니다." }
    ]
  }),
  judgment({
    id: "g4s1-transform-06",
    unitId: "figure-transform",
    learnerStageId: "figure-transform.flip-up-down",
    curriculumAnchorIds: ["[4수03-04]"],
    context: "두 도형 안의 표식 위치를 함께 살펴보세요.",
    prompt: "점선과 도형을 보고 움직인 방법을 골라 보세요.",
    visual: {
      kind: "grid-transform-diagram",
      mode: "flip-up-down",
      rows: 6,
      columns: 6,
      sourceCells: [
        { row: 0, column: 3 },
        { row: 1, column: 2 },
        { row: 1, column: 3 },
        { row: 2, column: 3 }
      ],
      targetCells: [
        { row: 5, column: 3 },
        { row: 4, column: 2 },
        { row: 4, column: 3 },
        { row: 3, column: 3 }
      ],
      sourceMarker: { row: 1, column: 2 },
      targetMarker: { row: 4, column: 2 },
      axisIndex: 3
    },
    signalId: "figure-transform.flip-up-down",
    answers: [
      { id: "mirror-on-horizontal", label: "가로 점선을 기준으로 위아래를 뒤집었습니다." },
      { id: "same-shape-down", label: "처음 모양과 방향 그대로 아래쪽으로 밀었습니다." },
      { id: "mirror-on-vertical", label: "세로선을 기준으로 좌우를 뒤집었습니다." }
    ]
  }),
  judgment({
    id: "g4s1-transform-07",
    unitId: "figure-transform",
    learnerStageId: "figure-transform.rotate",
    curriculumAnchorIds: ["[4수03-04]"],
    context: "십자 표시가 있는 점을 중심으로 도형을 돌렸습니다.",
    prompt: "어느 방향으로 돌린 결과일까요?",
    visual: {
      kind: "grid-transform-diagram",
      mode: "rotate",
      rows: 7,
      columns: 7,
      sourceCells: [
        { row: 1, column: 3 },
        { row: 2, column: 3 },
        { row: 2, column: 4 }
      ],
      targetCells: [
        { row: 3, column: 5 },
        { row: 3, column: 4 },
        { row: 4, column: 4 }
      ],
      sourceMarker: { row: 1, column: 3 },
      targetMarker: { row: 3, column: 5 },
      center: { row: 3, column: 3 },
      turn: "clockwise"
    },
    signalId: "figure-transform.rotate",
    answers: [
      { id: "clockwise-quarter", label: "중심을 고정하고 시계 방향으로 90도 돌렸습니다." },
      { id: "counterclockwise-quarter", label: "중심을 고정하고 시계 반대 방향으로 90도 돌렸습니다." },
      { id: "slide-right-two", label: "중심과 관계없이 오른쪽으로 2칸 밀었습니다." }
    ]
  }),
  judgment({
    id: "g4s1-transform-08",
    unitId: "figure-transform",
    learnerStageId: "figure-transform.rotate",
    curriculumAnchorIds: ["[4수03-04]"],
    context: "십자 표시와 도형 안의 점을 함께 살펴보세요.",
    prompt: "처음 도형을 나중 도형처럼 만드는 방법은 무엇일까요?",
    visual: {
      kind: "grid-transform-diagram",
      mode: "rotate",
      rows: 7,
      columns: 7,
      sourceCells: [
        { row: 3, column: 5 },
        { row: 4, column: 5 },
        { row: 4, column: 4 }
      ],
      targetCells: [
        { row: 1, column: 3 },
        { row: 1, column: 4 },
        { row: 2, column: 4 }
      ],
      sourceMarker: { row: 4, column: 5 },
      targetMarker: { row: 1, column: 4 },
      center: { row: 3, column: 3 },
      turn: "counterclockwise"
    },
    signalId: "figure-transform.rotate",
    answers: [
      { id: "counterclockwise-quarter", label: "중심을 고정하고 시계 반대 방향으로 90도 돌렸습니다." },
      { id: "clockwise-quarter", label: "중심을 고정하고 시계 방향으로 90도 돌렸습니다." },
      { id: "slide-left-two", label: "중심과 관계없이 왼쪽으로 2칸 밀었습니다." }
    ]
  }),
  judgment({
    id: "g4s1-transform-09",
    unitId: "figure-transform",
    learnerStageId: "figure-transform.point-move",
    curriculumAnchorIds: ["[4수03-05]"],
    context: "A점에서 B점으로 움직입니다.",
    prompt: "어느 방향으로 몇 칸 움직여야 할까요?",
    visual: {
      kind: "grid-transform-diagram",
      mode: "point-move",
      rows: 6,
      columns: 8,
      points: [
        { label: "A", row: 4, column: 1 },
        { label: "B", row: 4, column: 5 }
      ]
    },
    signalId: "figure-transform.point-move",
    answers: [
      { id: "right-four", label: "오른쪽으로 4칸 움직입니다." },
      { id: "left-four", label: "왼쪽으로 4칸 움직입니다." },
      { id: "right-five", label: "오른쪽으로 5칸 움직입니다." }
    ]
  }),
  judgment({
    id: "g4s1-transform-10",
    unitId: "figure-transform",
    learnerStageId: "figure-transform.point-move",
    curriculumAnchorIds: ["[4수03-05]"],
    context: "A점에서 가로와 세로 방향으로 움직여 B점에 갑니다.",
    prompt: "A점에서 B점까지의 이동을 바르게 설명한 것은 무엇일까요?",
    visual: {
      kind: "grid-transform-diagram",
      mode: "point-move",
      rows: 6,
      columns: 8,
      points: [
        { label: "A", row: 4, column: 5 },
        { label: "B", row: 1, column: 3 }
      ]
    },
    signalId: "figure-transform.point-move",
    answers: [
      { id: "left-two-up-three", label: "왼쪽으로 2칸, 위쪽으로 3칸 움직입니다." },
      { id: "right-two-down-three", label: "오른쪽으로 2칸, 아래쪽으로 3칸 움직입니다." },
      { id: "left-three-up-four", label: "왼쪽으로 3칸, 위쪽으로 4칸 움직입니다." }
    ]
  }),
  judgment({
    id: "g4s1-pattern-01",
    unitId: "patterns-relations",
    learnerStageId: "patterns-relations.number-rule",
    curriculumAnchorIds: ["[4수02-01]"],
    context: "수의 변화를 차례로 살펴보세요.",
    prompt: "빈칸에 알맞은 수는 무엇일까요?",
    visual: {
      kind: "relation-pattern-diagram",
      mode: "number-sequence",
      terms: [2, 6, 18, null, 162]
    },
    signalId: "patterns-relations.number-rule",
    answers: [
      { id: "fifty-four", label: "54" },
      { id: "thirty", label: "30" },
      { id: "thirty-six", label: "36" }
    ]
  }),
  judgment({
    id: "g4s1-pattern-02",
    unitId: "patterns-relations",
    learnerStageId: "patterns-relations.number-rule",
    curriculumAnchorIds: ["[4수02-01]"],
    context: "앞에서부터 같은 규칙으로 이어진 수입니다.",
    prompt: "빈칸에 알맞은 수는 무엇일까요?",
    visual: {
      kind: "relation-pattern-diagram",
      mode: "number-sequence",
      terms: [4, 12, 36, 108, null]
    },
    signalId: "patterns-relations.number-rule",
    answers: [
      { id: "three-hundred-twenty-four", label: "324" },
      { id: "one-hundred-eighty", label: "180" },
      { id: "four-hundred-thirty-two", label: "432" }
    ]
  }),
  judgment({
    id: "g4s1-pattern-03",
    unitId: "patterns-relations",
    learnerStageId: "patterns-relations.figure-rule",
    curriculumAnchorIds: ["[4수02-01]"],
    context: "모양의 순서에 따라 정사각형 수가 달라집니다.",
    prompt: "네 번째 모양에는 정사각형이 몇 개 있을까요?",
    visual: {
      kind: "relation-pattern-diagram",
      mode: "figure-sequence",
      figure: "square",
      counts: [3, 5, 7, null],
      askOrder: 4
    },
    signalId: "patterns-relations.figure-rule",
    answers: [
      { id: "nine", label: "9개" },
      { id: "two", label: "2개" },
      { id: "four", label: "4개" }
    ]
  }),
  judgment({
    id: "g4s1-pattern-04",
    unitId: "patterns-relations",
    learnerStageId: "patterns-relations.figure-rule",
    curriculumAnchorIds: ["[4수02-01]"],
    context: "삼각형 수가 2개, 5개, 8개, 11개로 늘어납니다.",
    prompt: "다섯 번째 모양에는 삼각형이 몇 개 있을까요?",
    visual: {
      kind: "relation-pattern-diagram",
      mode: "figure-sequence",
      figure: "triangle",
      counts: [2, 5, 8, 11],
      askOrder: 5
    },
    signalId: "patterns-relations.figure-rule",
    answers: [
      { id: "fourteen", label: "14개" },
      { id: "three", label: "3개" },
      { id: "five", label: "5개" }
    ]
  }),
  judgment({
    id: "g4s1-pattern-05",
    unitId: "patterns-relations",
    learnerStageId: "patterns-relations.rule-as-expression",
    curriculumAnchorIds: ["[4수02-01]"],
    context: "표의 모든 줄에 맞는 규칙을 찾아보세요.",
    prompt: "순서와 개수의 관계를 바르게 나타낸 식은 무엇일까요?",
    visual: {
      kind: "relation-pattern-diagram",
      mode: "rule-table",
      leftLabel: "순서",
      rightLabel: "개수",
      rows: [
        { left: 1, right: 4 },
        { left: 2, right: 8 },
        { left: 3, right: 12 }
      ]
    },
    signalId: "patterns-relations.rule-as-expression",
    answers: [
      { id: "count-equals-order-times-four", label: "개수 = 순서 × 4" },
      { id: "count-equals-order-plus-three", label: "개수 = 순서 + 3" },
      { id: "order-equals-count-times-four", label: "순서 = 개수 × 4" }
    ]
  }),
  judgment({
    id: "g4s1-pattern-06",
    unitId: "patterns-relations",
    learnerStageId: "patterns-relations.rule-as-expression",
    curriculumAnchorIds: ["[4수02-01]"],
    context: "색종이 4장으로 딱지 1개를 만듭니다.",
    prompt: "색종이 수와 딱지 수의 관계를 바르게 나타낸 식은 무엇일까요?",
    visual: {
      kind: "relation-pattern-diagram",
      mode: "rule-table",
      leftLabel: "색종이 수",
      rightLabel: "딱지 수",
      rows: [
        { left: 8, right: 2 },
        { left: 16, right: 4 },
        { left: 24, right: 6 }
      ]
    },
    signalId: "patterns-relations.rule-as-expression",
    answers: [
      { id: "ddakji-equals-paper-divide-four", label: "딱지 수 = 색종이 수 ÷ 4" },
      { id: "ddakji-equals-paper-minus-six", label: "딱지 수 = 색종이 수 − 6" },
      { id: "paper-equals-ddakji-divide-four", label: "색종이 수 = 딱지 수 ÷ 4" }
    ]
  }),
  judgment({
    id: "g4s1-pattern-07",
    unitId: "patterns-relations",
    learnerStageId: "patterns-relations.calc-array-rule",
    curriculumAnchorIds: ["[4수02-02]"],
    context: "한 수는 그대로이고 곱하는 수가 1씩 커집니다.",
    prompt: "마지막 계산의 결과는 얼마일까요?",
    visual: {
      kind: "relation-pattern-diagram",
      mode: "calculation-array",
      calculations: [
        { a: 11, operator: "multiply", b: 11, result: 121 },
        { a: 11, operator: "multiply", b: 12, result: 132 },
        { a: 11, operator: "multiply", b: 13, result: 143 },
        { a: 11, operator: "multiply", b: 14, result: null }
      ]
    },
    signalId: "patterns-relations.calc-array-rule",
    answers: [
      { id: "one-hundred-fifty-four", label: "154" },
      { id: "one-hundred-forty-four", label: "144" },
      { id: "one-hundred-fifty-three", label: "153" }
    ]
  }),
  judgment({
    id: "g4s1-pattern-08",
    unitId: "patterns-relations",
    learnerStageId: "patterns-relations.calc-array-rule",
    curriculumAnchorIds: ["[4수02-02]"],
    context: "나누어지는 수는 그대로이고 나누는 수가 2씩 커집니다.",
    prompt: "마지막 계산의 결과는 얼마일까요?",
    visual: {
      kind: "relation-pattern-diagram",
      mode: "calculation-array",
      calculations: [
        { a: 120, operator: "divide", b: 2, result: 60 },
        { a: 120, operator: "divide", b: 4, result: 30 },
        { a: 120, operator: "divide", b: 6, result: 20 },
        { a: 120, operator: "divide", b: 8, result: null }
      ]
    },
    signalId: "patterns-relations.calc-array-rule",
    answers: [
      { id: "fifteen", label: "15" },
      { id: "eighteen", label: "18" },
      { id: "ten", label: "10" }
    ]
  }),
  judgment({
    id: "g4s1-pattern-09",
    unitId: "patterns-relations",
    learnerStageId: "patterns-relations.equal-sign",
    curriculumAnchorIds: ["[4수02-03]"],
    context: "등호 양쪽의 값은 같습니다.",
    prompt: "빈칸에 알맞은 수는 무엇일까요?",
    visual: {
      kind: "relation-pattern-diagram",
      mode: "equal-sign-balance",
      equation: {
        operator: "add",
        left: [45, 18],
        right: [39, null]
      }
    },
    signalId: "patterns-relations.equal-sign",
    answers: [
      { id: "twenty-four", label: "24" },
      { id: "sixty-three", label: "63" },
      { id: "twelve", label: "12" }
    ]
  }),
  judgment({
    id: "g4s1-pattern-10",
    unitId: "patterns-relations",
    learnerStageId: "patterns-relations.equal-sign",
    curriculumAnchorIds: ["[4수02-03]"],
    context: "등호 양쪽의 합이 같아야 합니다.",
    prompt: "빈칸에 알맞은 수는 무엇일까요?",
    visual: {
      kind: "relation-pattern-diagram",
      mode: "equal-sign-balance",
      equation: {
        operator: "add",
        left: [53, 18],
        right: [null, 26]
      }
    },
    signalId: "patterns-relations.equal-sign",
    answers: [
      { id: "forty-five", label: "45" },
      { id: "seventy-one", label: "71" },
      { id: "sixty-one", label: "61" }
    ]
  }),
  judgment({
    id: "g4s1-bar-01",
    unitId: "bar-graphs",
    learnerStageId: "bar-graph.scale",
    curriculumAnchorIds: ["[4수04-01]"],
    context: "세로 눈금은 0부터 50까지 같은 간격으로 5칸입니다.",
    prompt: "눈금 한 칸은 몇 명을 나타낼까요?",
    visual: {
      kind: "bar-chart-diagram",
      mode: "unit-value",
      axis: {
        orientation: "vertical",
        tickCount: 5,
        labeledTicks: [{ index: 0, value: 0 }, { index: 5, value: 50 }],
        unitLabel: "명"
      },
      bars: [
        { category: "사과", ticks: 3 },
        { category: "귤", ticks: 2 }
      ]
    },
    signalId: "bar-graph.scale",
    answers: [
      { id: "ten-people", label: "10명" },
      { id: "five-people", label: "5명" },
      { id: "fifty-people", label: "50명" }
    ]
  }),
  judgment({
    id: "g4s1-bar-02",
    unitId: "bar-graphs",
    learnerStageId: "bar-graph.scale",
    curriculumAnchorIds: ["[4수04-01]"],
    context: "가로 눈금은 0부터 30까지 같은 간격으로 6칸입니다.",
    prompt: "눈금 한 칸은 몇 권을 나타낼까요?",
    visual: {
      kind: "bar-chart-diagram",
      mode: "unit-value",
      axis: {
        orientation: "horizontal",
        tickCount: 6,
        labeledTicks: [{ index: 0, value: 0 }, { index: 6, value: 30 }],
        unitLabel: "권"
      },
      bars: [
        { category: "3월", ticks: 4 },
        { category: "4월", ticks: 2 }
      ]
    },
    signalId: "bar-graph.scale",
    answers: [
      { id: "five-books", label: "5권" },
      { id: "six-books", label: "6권" },
      { id: "thirty-books", label: "30권" }
    ]
  }),
  judgment({
    id: "g4s1-bar-03",
    unitId: "bar-graphs",
    learnerStageId: "bar-graph.read-value",
    curriculumAnchorIds: ["[4수04-01]"],
    prompt: "사과를 좋아하는 학생은 몇 명일까요?",
    visual: {
      kind: "bar-chart-diagram",
      mode: "bar-value",
      axis: {
        orientation: "vertical",
        tickCount: 5,
        labeledTicks: [{ index: 0, value: 0 }, { index: 5, value: 50 }],
        unitLabel: "명"
      },
      bars: [
        { category: "사과", ticks: 3 },
        { category: "귤", ticks: 2 },
        { category: "딸기", ticks: 5 },
        { category: "포도", ticks: 1 }
      ],
      target: "사과"
    },
    signalId: "bar-graph.read-value",
    answers: [
      { id: "thirty-people", label: "30명" },
      { id: "three-people", label: "3명" },
      { id: "twenty-people", label: "20명" }
    ]
  }),
  judgment({
    id: "g4s1-bar-04",
    unitId: "bar-graphs",
    learnerStageId: "bar-graph.read-value",
    curriculumAnchorIds: ["[4수04-01]"],
    prompt: "3월에 빌려 간 책은 몇 권일까요?",
    visual: {
      kind: "bar-chart-diagram",
      mode: "bar-value",
      axis: {
        orientation: "horizontal",
        tickCount: 8,
        labeledTicks: [{ index: 0, value: 0 }, { index: 8, value: 40 }],
        unitLabel: "권"
      },
      bars: [
        { category: "3월", ticks: 7 },
        { category: "4월", ticks: 4 },
        { category: "5월", ticks: 6 },
        { category: "6월", ticks: 2 }
      ],
      target: "3월"
    },
    signalId: "bar-graph.read-value",
    answers: [
      { id: "thirty-five-books", label: "35권" },
      { id: "seven-books", label: "7권" },
      { id: "forty-books", label: "40권" }
    ]
  }),
  judgment({
    id: "g4s1-bar-05",
    unitId: "bar-graphs",
    learnerStageId: "bar-graph.compare",
    curriculumAnchorIds: ["[4수04-01]"],
    prompt: "축구를 좋아하는 학생은 야구보다 몇 명 더 많을까요?",
    visual: {
      kind: "bar-chart-diagram",
      mode: "bar-difference",
      axis: {
        orientation: "vertical",
        tickCount: 5,
        labeledTicks: [{ index: 0, value: 0 }, { index: 5, value: 50 }],
        unitLabel: "명"
      },
      bars: [
        { category: "축구", ticks: 4 },
        { category: "야구", ticks: 2 },
        { category: "농구", ticks: 3 },
        { category: "배구", ticks: 1 }
      ],
      comparison: { kind: "pair", categories: ["축구", "야구"] }
    },
    signalId: "bar-graph.compare",
    answers: [
      { id: "twenty-more", label: "20명" },
      { id: "two-more", label: "2명" },
      { id: "sixty-total", label: "60명" }
    ]
  }),
  judgment({
    id: "g4s1-bar-06",
    unitId: "bar-graphs",
    learnerStageId: "bar-graph.compare",
    curriculumAnchorIds: ["[4수04-01]"],
    prompt: "가장 많은 물건과 가장 적은 물건은 몇 개 차이일까요?",
    visual: {
      kind: "bar-chart-diagram",
      mode: "bar-difference",
      axis: {
        orientation: "horizontal",
        tickCount: 12,
        labeledTicks: [
          { index: 0, value: 0 },
          { index: 6, value: 30 },
          { index: 12, value: 60 }
        ],
        unitLabel: "개"
      },
      bars: [
        { category: "연필", ticks: 12 },
        { category: "지우개", ticks: 8 },
        { category: "자", ticks: 5 }
      ],
      comparison: { kind: "extremes" }
    },
    signalId: "bar-graph.compare",
    answers: [
      { id: "thirty-five-items", label: "35개" },
      { id: "eighty-five-items", label: "85개" },
      { id: "seven-items", label: "7개" }
    ]
  }),
  judgment({
    id: "g4s1-bar-07",
    unitId: "bar-graphs",
    learnerStageId: "bar-graph.table-match",
    curriculumAnchorIds: ["[4수04-01]", "[4수04-03]"],
    prompt: "표의 자료와 같은 막대그래프를 고르세요.",
    visual: {
      kind: "bar-chart-diagram",
      mode: "table-match",
      axis: {
        orientation: "vertical",
        tickCount: 12,
        labeledTicks: [{ index: 0, value: 0 }, { index: 12, value: 36 }],
        unitLabel: "명"
      },
      table: [
        { category: "봄", count: 6 },
        { category: "여름", count: 9 },
        { category: "가을", count: 3 },
        { category: "겨울", count: 12 }
      ],
      candidates: [
        {
          id: "가",
          bars: [
            { category: "봄", ticks: 2 },
            { category: "여름", ticks: 3 },
            { category: "가을", ticks: 1 },
            { category: "겨울", ticks: 4 }
          ]
        },
        {
          id: "나",
          bars: [
            { category: "봄", ticks: 6 },
            { category: "여름", ticks: 9 },
            { category: "가을", ticks: 3 },
            { category: "겨울", ticks: 12 }
          ]
        },
        {
          id: "다",
          bars: [
            { category: "봄", ticks: 3 },
            { category: "여름", ticks: 4 },
            { category: "가을", ticks: 2 },
            { category: "겨울", ticks: 5 }
          ]
        }
      ]
    },
    signalId: "bar-graph.table-match",
    answers: [
      { id: "candidate-ga", label: "가 그래프" },
      { id: "candidate-na", label: "나 그래프" },
      { id: "candidate-da", label: "다 그래프" }
    ]
  }),
  judgment({
    id: "g4s1-bar-08",
    unitId: "bar-graphs",
    learnerStageId: "bar-graph.table-match",
    curriculumAnchorIds: ["[4수04-01]", "[4수04-03]"],
    context: "과일 가게에서 판매한 과일 수를 표로 정리했습니다.",
    prompt: "표의 모든 자료를 알맞게 옮긴 그래프는 어느 것일까요?",
    visual: {
      kind: "bar-chart-diagram",
      mode: "table-match",
      axis: {
        orientation: "horizontal",
        tickCount: 10,
        labeledTicks: [{ index: 0, value: 0 }, { index: 10, value: 20 }],
        unitLabel: "개"
      },
      table: [
        { category: "딸기", count: 8 },
        { category: "포도", count: 4 },
        { category: "귤", count: 10 },
        { category: "배", count: 6 }
      ],
      candidates: [
        {
          id: "가",
          bars: [
            { category: "딸기", ticks: 8 },
            { category: "포도", ticks: 4 },
            { category: "귤", ticks: 10 },
            { category: "배", ticks: 6 }
          ]
        },
        {
          id: "나",
          bars: [
            { category: "딸기", ticks: 4 },
            { category: "포도", ticks: 2 },
            { category: "귤", ticks: 5 },
            { category: "배", ticks: 3 }
          ]
        },
        {
          id: "다",
          bars: [
            { category: "딸기", ticks: 5 },
            { category: "포도", ticks: 3 },
            { category: "귤", ticks: 6 },
            { category: "배", ticks: 4 }
          ]
        }
      ]
    },
    signalId: "bar-graph.table-match",
    answers: [
      { id: "candidate-na", label: "나 그래프" },
      { id: "candidate-ga", label: "가 그래프" },
      { id: "candidate-da", label: "다 그래프" }
    ]
  }),
  judgment({
    id: "g4s1-bar-09",
    unitId: "bar-graphs",
    learnerStageId: "bar-graph.inquiry",
    curriculumAnchorIds: ["[4수04-03]"],
    context: "탐구 질문: 우리 반 학생들이 가장 많이 하는 운동은 무엇일까요?",
    prompt: "막대그래프를 보고 알 수 있는 내용을 고르세요.",
    visual: {
      kind: "bar-chart-diagram",
      mode: "chart-conclusion",
      axis: {
        orientation: "vertical",
        tickCount: 5,
        labeledTicks: [{ index: 0, value: 0 }, { index: 5, value: 20 }],
        unitLabel: "명"
      },
      bars: [
        { category: "축구", ticks: 5 },
        { category: "피구", ticks: 3 },
        { category: "줄넘기", ticks: 4 },
        { category: "배드민턴", ticks: 2 }
      ]
    },
    signalId: "bar-graph.inquiry",
    answers: [
      { id: "soccer-most", label: "축구를 하는 학생이 가장 많습니다." },
      { id: "jump-rope-most", label: "줄넘기를 하는 학생이 가장 많습니다." },
      { id: "all-similar", label: "네 운동의 학생 수가 모두 비슷합니다." }
    ]
  }),
  judgment({
    id: "g4s1-bar-10",
    unitId: "bar-graphs",
    learnerStageId: "bar-graph.inquiry",
    curriculumAnchorIds: ["[4수04-03]"],
    context: "탐구 질문: 문구점에서 어떤 준비물을 가장 많이 준비하면 좋을까요?",
    prompt: "막대그래프를 보고 알 수 있는 내용을 고르세요.",
    visual: {
      kind: "bar-chart-diagram",
      mode: "chart-conclusion",
      axis: {
        orientation: "horizontal",
        tickCount: 8,
        labeledTicks: [
          { index: 0, value: 0 },
          { index: 4, value: 20 },
          { index: 8, value: 40 }
        ],
        unitLabel: "명"
      },
      bars: [
        { category: "공책", ticks: 7 },
        { category: "색연필", ticks: 4 },
        { category: "가위", ticks: 2 },
        { category: "풀", ticks: 3 }
      ]
    },
    signalId: "bar-graph.inquiry",
    answers: [
      { id: "notebook-most", label: "공책을 가장 많이 준비하면 좋습니다." },
      { id: "colored-pencils-most", label: "색연필을 가장 많이 준비하면 좋습니다." },
      { id: "cannot-tell", label: "이 그래프로는 알 수 없습니다." }
    ]
  }),
  judgment({
    id: "g4s1-muldiv-01",
    unitId: "multiplication-division",
    learnerStageId: "mul-div.partial-product-place",
    curriculumAnchorIds: ["[4수01-04]"],
    prompt: "213×24를 계산할 때 213×20은 얼마일까요?",
    visual: { kind: "none" },
    signalId: "mul-div.partial-product-place",
    answers: [
      { id: "4260", label: "4,260" },
      { id: "426", label: "426" },
      { id: "852", label: "852" }
    ]
  }),
  judgment({
    id: "g4s1-muldiv-02",
    unitId: "multiplication-division",
    learnerStageId: "mul-div.partial-product-place",
    curriculumAnchorIds: ["[4수01-04]"],
    context: "공책이 148권씩 든 상자가 26개 있어요.",
    prompt: "상자 20개에 든 공책은 몇 권일까요?",
    visual: { kind: "none" },
    signalId: "mul-div.partial-product-place",
    answers: [
      { id: "2960-books", label: "2,960권" },
      { id: "296-books", label: "296권" },
      { id: "888-books", label: "888권" }
    ]
  }),
  judgment({
    id: "g4s1-muldiv-03",
    unitId: "multiplication-division",
    learnerStageId: "mul-div.product-combine",
    curriculumAnchorIds: ["[4수01-04]"],
    prompt: "148×6은 888, 148×20은 2,960이에요. 148×26은 얼마일까요?",
    visual: { kind: "none" },
    signalId: "mul-div.product-combine",
    answers: [
      { id: "3848", label: "3,848" },
      { id: "1184", label: "1,184" },
      { id: "2960", label: "2,960" }
    ]
  }),
  judgment({
    id: "g4s1-muldiv-04",
    unitId: "multiplication-division",
    learnerStageId: "mul-div.product-combine",
    curriculumAnchorIds: ["[4수01-04]"],
    context: "경기장에 의자가 한 줄에 235개씩 32줄 있어요.",
    prompt: "의자는 모두 몇 개일까요?",
    visual: { kind: "none" },
    signalId: "mul-div.product-combine",
    answers: [
      { id: "7520-chairs", label: "7,520개" },
      { id: "1175-chairs", label: "1,175개" },
      { id: "7050-chairs", label: "7,050개" }
    ]
  }),
  judgment({
    id: "g4s1-muldiv-05",
    unitId: "multiplication-division",
    learnerStageId: "mul-div.quotient-place",
    curriculumAnchorIds: ["[4수01-07]"],
    prompt: "384÷16의 몫에서 첫 숫자는 어느 자리에 쓸까요?",
    visual: { kind: "none" },
    signalId: "mul-div.quotient-place",
    answers: [
      { id: "tens-place", label: "십의 자리" },
      { id: "hundreds-place", label: "백의 자리" },
      { id: "ones-place", label: "일의 자리" }
    ]
  }),
  judgment({
    id: "g4s1-muldiv-06",
    unitId: "multiplication-division",
    learnerStageId: "mul-div.quotient-place",
    curriculumAnchorIds: ["[4수01-07]"],
    context: "사과 552개를 한 상자에 24개씩 담아요.",
    prompt: "필요한 상자 수는 몇 자리 수일까요?",
    visual: { kind: "none" },
    signalId: "mul-div.quotient-place",
    answers: [
      { id: "two-digit", label: "두 자리 수" },
      { id: "three-digit", label: "세 자리 수" },
      { id: "one-digit", label: "한 자리 수" }
    ]
  }),
  judgment({
    id: "g4s1-muldiv-07",
    unitId: "multiplication-division",
    learnerStageId: "mul-div.quotient-adjust",
    curriculumAnchorIds: ["[4수01-07]"],
    context: "252÷18의 몫을 13으로 보고 18×13=234를 구했어요.",
    prompt: "남은 수가 18일 때 몫을 어떻게 고칠까요?",
    visual: { kind: "none" },
    signalId: "mul-div.quotient-adjust",
    answers: [
      { id: "raise-to-14", label: "14로 크게 합니다" },
      { id: "keep-13", label: "13으로 그대로 둡니다" },
      { id: "lower-to-12", label: "12로 작게 합니다" }
    ]
  }),
  judgment({
    id: "g4s1-muldiv-08",
    unitId: "multiplication-division",
    learnerStageId: "mul-div.quotient-adjust",
    curriculumAnchorIds: ["[4수01-07]"],
    context: "425÷27의 몫을 16으로 보고 27×16=432를 구했어요.",
    prompt: "몫을 어떻게 고칠까요?",
    visual: { kind: "none" },
    signalId: "mul-div.quotient-adjust",
    answers: [
      { id: "lower-to-15", label: "15로 작게 합니다" },
      { id: "keep-16", label: "16으로 그대로 둡니다" },
      { id: "raise-to-17", label: "17로 크게 합니다" }
    ]
  }),
  judgment({
    id: "g4s1-muldiv-09",
    unitId: "multiplication-division",
    learnerStageId: "mul-div.multiplication-check",
    curriculumAnchorIds: ["[4수01-05]"],
    context: "295÷23의 몫은 12이고 남은 수는 19예요.",
    prompt: "이 결과를 확인하는 식은 무엇일까요?",
    visual: { kind: "none" },
    signalId: "mul-div.multiplication-check",
    answers: [
      { id: "check-295", label: "23×12+19=295" },
      { id: "drop-remainder-295", label: "23×12=295" },
      { id: "swap-295", label: "23×19+12=295" }
    ]
  }),
  judgment({
    id: "g4s1-muldiv-10",
    unitId: "multiplication-division",
    learnerStageId: "mul-div.multiplication-check",
    curriculumAnchorIds: ["[4수01-05]"],
    context: "색종이 500장을 15명에게 32장씩 나누어 주고 20장이 남았어요.",
    prompt: "나누어 준 결과를 확인하는 식은 무엇일까요?",
    visual: { kind: "none" },
    signalId: "mul-div.multiplication-check",
    answers: [
      { id: "check-500", label: "32×15+20=500" },
      { id: "drop-remainder-500", label: "32×15=500" },
      { id: "swap-500", label: "32×20+15=500" }
    ]
  }),
  judgment({
    id: "g4s1-muldiv-11",
    unitId: "multiplication-division",
    learnerStageId: "mul-div.estimate",
    curriculumAnchorIds: ["[4수01-08]"],
    prompt: "412×19의 값은 어느 수에 가장 가까울까요?",
    visual: { kind: "none" },
    signalId: "mul-div.estimate",
    answers: [
      { id: "about-8000", label: "8,000" },
      { id: "about-4000", label: "4,000" },
      { id: "about-80000", label: "80,000" }
    ]
  }),
  judgment({
    id: "g4s1-muldiv-12",
    unitId: "multiplication-division",
    learnerStageId: "mul-div.estimate",
    curriculumAnchorIds: ["[4수01-08]"],
    context: "귤 612개를 한 봉지에 29개씩 담아요.",
    prompt: "봉지는 몇 개쯤 필요할까요?",
    visual: { kind: "none" },
    signalId: "mul-div.estimate",
    answers: [
      { id: "about-20-bags", label: "20개쯤" },
      { id: "about-30-bags", label: "30개쯤" },
      { id: "about-200-bags", label: "200개쯤" }
    ]
  })
];

const unsigned: DiagnosisSet = {
  manifest: {
    id: "grade4-semester1",
    version: "1.4.0",
    checksum: "469d38973ade98ab7639e181f65dd9dca7ea085497a5fa10656c0d9a324a8bf0",
    title: "4학년 1학기 수학 생각 지도",
    shortTitle: "4-1 수학 생각 지도",
    grade: 4,
    semester: 1,
    curriculum: "2022-revised",
    status: "review",
    units: [
      { id: "large-numbers", order: 1, title: "큰 수" },
      { id: "angles", order: 2, title: "각도" },
      { id: "multiplication-division", order: 3, title: "곱셈과 나눗셈" },
      { id: "figure-transform", order: 4, title: "평면도형의 이동" },
      { id: "bar-graphs", order: 5, title: "막대그래프" },
      { id: "patterns-relations", order: 6, title: "규칙과 관계" }
    ],
    interactionTypes: [{ type: "choice", version: 1 }],
    estimatedMinutes: 33
  },
  curriculumAnchors: anchors,
  learnerStages: stages,
  signals,
  judgments
};

export const grade4Semester1Diagnosis =
  diagnosisSetSchema.parse(unsigned) as DiagnosisSet;
