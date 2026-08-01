import type {
  DiagnosisSet,
  Judgment,
  SignalDefinition
} from "@middle-of-math/domain";
import {
  grade4Semester1Anchor,
  grade4Semester2Anchor
} from "./curriculum-anchor-registry";
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

const stages: DiagnosisSet["learnerStages"] = [
  {
    id: "triangles.classify-isosceles",
    order: 1,
    unitId: "triangles",
    title: "같은 길이인 두 변을 찾아 이등변삼각형 구별하기",
    shortTitle: "이등변삼각형을 구별함",
    curriculumAnchorIds: ["[4수03-08]"],
    prerequisiteStageIds: []
  },
  {
    id: "triangles.classify-equilateral",
    order: 2,
    unitId: "triangles",
    title: "세 변의 길이를 비교하여 정삼각형 구별하기",
    shortTitle: "정삼각형을 구별함",
    curriculumAnchorIds: ["[4수03-08]"],
    prerequisiteStageIds: ["triangles.classify-isosceles"]
  },
  {
    id: "triangles.isosceles-equal-angles",
    order: 3,
    unitId: "triangles",
    title: "이등변삼각형의 같은 크기인 두 각 이용하기",
    shortTitle: "이등변삼각형의 두 각을 이용함",
    curriculumAnchorIds: ["[4수03-08]"],
    prerequisiteStageIds: ["triangles.classify-isosceles"]
  },
  {
    id: "triangles.classify-right",
    order: 4,
    unitId: "triangles",
    title: "직각이 있는 삼각형 구별하기",
    shortTitle: "직각삼각형을 구별함",
    curriculumAnchorIds: ["[4수03-09]"],
    prerequisiteStageIds: []
  },
  {
    id: "triangles.classify-acute-obtuse",
    order: 5,
    unitId: "triangles",
    title: "가장 큰 각으로 예각삼각형과 둔각삼각형 구별하기",
    shortTitle: "예각·둔각삼각형을 구별함",
    curriculumAnchorIds: ["[4수03-09]"],
    prerequisiteStageIds: ["triangles.classify-right"]
  },
  {
    id: "frac-ops.add-same-denominator",
    order: 6,
    unitId: "fraction-add-subtract",
    title: "분모가 같은 두 진분수 더하기",
    shortTitle: "분모가 같은 진분수를 더함",
    curriculumAnchorIds: ["[4수01-15]"],
    prerequisiteStageIds: []
  },
  {
    id: "frac-ops.sum-to-mixed",
    order: 7,
    unitId: "fraction-add-subtract",
    title: "1보다 큰 분수의 합을 대분수로 나타내기",
    shortTitle: "분수의 합을 대분수로 나타냄",
    curriculumAnchorIds: ["[4수01-15]"],
    prerequisiteStageIds: ["frac-ops.add-same-denominator"]
  },
  {
    id: "frac-ops.subtract-same-denominator",
    order: 8,
    unitId: "fraction-add-subtract",
    title: "분모가 같은 두 진분수 빼기",
    shortTitle: "분모가 같은 진분수를 뺌",
    curriculumAnchorIds: ["[4수01-15]"],
    prerequisiteStageIds: []
  },
  {
    id: "frac-ops.whole-minus-fraction",
    order: 9,
    unitId: "fraction-add-subtract",
    title: "1을 가분수로 바꾸어 진분수 빼기",
    shortTitle: "1에서 진분수를 뺌",
    curriculumAnchorIds: ["[4수01-15]"],
    prerequisiteStageIds: ["frac-ops.subtract-same-denominator"]
  },
  {
    id: "frac-ops.mixed-add",
    order: 10,
    unitId: "fraction-add-subtract",
    title: "받아올림 없이 대분수끼리 더하기",
    shortTitle: "대분수끼리 더함",
    curriculumAnchorIds: ["[4수01-15]"],
    prerequisiteStageIds: ["frac-ops.add-same-denominator"]
  },
  {
    id: "quad.perpendicular-side",
    order: 11,
    unitId: "quadrilaterals",
    title: "직각 표시를 근거로 기준 변과 수직인 변 찾기",
    shortTitle: "수직인 변을 찾음",
    curriculumAnchorIds: ["[4수03-03]"],
    prerequisiteStageIds: []
  },
  {
    id: "quad.parallel-side-distance",
    order: 12,
    unitId: "quadrilaterals",
    title: "평행한 두 변 사이의 거리를 수직인 선분으로 읽기",
    shortTitle: "평행한 두 변 사이의 거리를 읽음",
    curriculumAnchorIds: ["[4수03-03]"],
    prerequisiteStageIds: ["quad.perpendicular-side"]
  },
  {
    id: "quad.trapezoid-parallel-pair",
    order: 13,
    unitId: "quadrilaterals",
    title: "평행한 변 한 쌍을 확인하여 사다리꼴 구별하기",
    shortTitle: "사다리꼴을 구별함",
    curriculumAnchorIds: ["[4수03-10]"],
    prerequisiteStageIds: []
  },
  {
    id: "quad.rhombus-equal-sides",
    order: 14,
    unitId: "quadrilaterals",
    title: "네 변이 모두 같은지 확인하여 마름모 구별하기",
    shortTitle: "마름모를 구별함",
    curriculumAnchorIds: ["[4수03-10]"],
    prerequisiteStageIds: []
  },
  {
    id: "quad.parallelogram-opposite-angle",
    order: 15,
    unitId: "quadrilaterals",
    title: "평행사변형의 마주 보는 두 각이 같은 성질 이용하기",
    shortTitle: "평행사변형의 마주 보는 각을 이용함",
    curriculumAnchorIds: ["[4수03-10]"],
    prerequisiteStageIds: ["quad.trapezoid-parallel-pair"]
  },
  {
    id: "decimal.read-write",
    order: 16,
    unitId: "decimal-add-subtract",
    title: "소수 두 자리 수와 세 자리 수를 읽고 쓰기",
    shortTitle: "소수를 읽고 씀",
    curriculumAnchorIds: ["[4수01-13]"],
    prerequisiteStageIds: []
  },
  {
    id: "decimal.compose-place-value",
    order: 17,
    unitId: "decimal-add-subtract",
    title: "0.1과 0.01의 개수로 소수 나타내기",
    shortTitle: "자릿값으로 소수를 나타냄",
    curriculumAnchorIds: ["[4수01-13]"],
    prerequisiteStageIds: ["decimal.read-write"]
  },
  {
    id: "decimal.compare",
    order: 18,
    unitId: "decimal-add-subtract",
    title: "같은 자리끼리 비교하여 소수의 크기 알아보기",
    shortTitle: "소수의 크기를 비교함",
    curriculumAnchorIds: ["[4수01-14]"],
    prerequisiteStageIds: ["decimal.compose-place-value"]
  },
  {
    id: "decimal.add",
    order: 19,
    unitId: "decimal-add-subtract",
    title: "소수점을 맞추어 소수 두 자리 수 범위에서 더하기",
    shortTitle: "소수를 더함",
    curriculumAnchorIds: ["[4수01-16]"],
    prerequisiteStageIds: ["decimal.compose-place-value"]
  },
  {
    id: "decimal.subtract",
    order: 20,
    unitId: "decimal-add-subtract",
    title: "소수점을 맞추어 소수 두 자리 수 범위에서 빼기",
    shortTitle: "소수를 뺌",
    curriculumAnchorIds: ["[4수01-16]"],
    prerequisiteStageIds: ["decimal.compose-place-value"]
  },
  {
    id: "polygon.identify-closed-straight",
    order: 21,
    unitId: "polygons",
    title: "곧은 선으로 둘러싸인 다각형 찾기",
    shortTitle: "다각형을 구별함",
    curriculumAnchorIds: ["[4수03-11]"],
    prerequisiteStageIds: []
  },
  {
    id: "polygon.name-by-side-count",
    order: 22,
    unitId: "polygons",
    title: "변의 수를 세어 다각형 이름 정하기",
    shortTitle: "변의 수로 이름을 정함",
    curriculumAnchorIds: ["[4수03-11]"],
    prerequisiteStageIds: ["polygon.identify-closed-straight"]
  },
  {
    id: "polygon.regular-two-conditions",
    order: 23,
    unitId: "polygons",
    title: "변과 각의 두 조건으로 정다각형 찾기",
    shortTitle: "정다각형을 구별함",
    curriculumAnchorIds: ["[4수03-11]"],
    prerequisiteStageIds: ["polygon.identify-closed-straight"]
  },
  {
    id: "polygon.fill-remaining-space",
    order: 24,
    unitId: "polygons",
    title: "남은 자리에 맞는 모양 조각 묶음 찾기",
    shortTitle: "남은 자리를 채울 조각을 찾음",
    curriculumAnchorIds: ["[4수03-12]"],
    prerequisiteStageIds: []
  },
  {
    id: "polygon.tile-count-pieces",
    order: 25,
    unitId: "polygons",
    title: "한 가지 모양 조각으로 채우는 개수 정하기",
    shortTitle: "채울 조각 수를 정함",
    curriculumAnchorIds: ["[4수03-12]"],
    prerequisiteStageIds: ["polygon.fill-remaining-space"]
  },
  {
    id: "line-graph.tick-unit",
    order: 26,
    unitId: "line-graphs",
    title: "세로 눈금 두 곳의 값을 비교하여 한 칸의 값 정하기",
    shortTitle: "눈금 한 칸의 값을 정함",
    curriculumAnchorIds: ["[4수04-02]"],
    prerequisiteStageIds: []
  },
  {
    id: "line-graph.point-value",
    order: 27,
    unitId: "line-graphs",
    title: "기준값과 눈금 한 칸의 값으로 한 점의 값 읽기",
    shortTitle: "한 점의 값을 읽음",
    curriculumAnchorIds: ["[4수04-02]"],
    prerequisiteStageIds: ["line-graph.tick-unit"]
  },
  {
    id: "line-graph.step-change",
    order: 28,
    unitId: "line-graphs",
    title: "이웃한 두 점의 값 차이로 변화량 구하기",
    shortTitle: "두 점 사이의 변화량을 구함",
    curriculumAnchorIds: ["[4수04-02]"],
    prerequisiteStageIds: ["line-graph.point-value"]
  },
  {
    id: "line-graph.largest-rise",
    order: 29,
    unitId: "line-graphs",
    title: "각 구간의 변화 방향과 크기를 비교하여 가장 크게 증가한 때 찾기",
    shortTitle: "가장 크게 증가한 구간을 찾음",
    curriculumAnchorIds: ["[4수04-02]", "[4수04-03]"],
    prerequisiteStageIds: ["line-graph.step-change"]
  },
  {
    id: "line-graph.between-estimate",
    order: 30,
    unitId: "line-graphs",
    title: "두 점을 이은 선에서 중간 시점의 값 어림하기",
    shortTitle: "두 점 사이의 값을 어림함",
    curriculumAnchorIds: ["[4수04-02]", "[4수04-03]"],
    prerequisiteStageIds: ["line-graph.step-change"]
  }
];

const signals: SignalDefinition[] = [
  signal(
    "triangles.classify-isosceles",
    "같은 길이인 두 변 찾기",
    "medium",
    "세 변 중 길이가 같은 두 변을 찾고 이등변삼각형으로 분류하는 근거를 살펴볼 필요가 있습니다.",
    "변마다 길이를 적은 뒤 같은 수 두 개에 같은 표시를 하게 하세요.",
    "같은 길이인 두 변을 찾아 삼각형을 나누는 연습을 하고 있습니다.",
    "막대 세 개의 길이를 재고 같은 길이인 두 막대를 찾아보게 해주세요."
  ),
  signal(
    "triangles.classify-equilateral",
    "세 변이 모두 같은지 확인하기",
    "medium",
    "세 변의 길이가 모두 같은지 하나씩 확인하여 정삼각형으로 분류하는 과정이 흔들립니다.",
    "첫째 변과 둘째 변, 둘째 변과 셋째 변을 차례로 비교하게 하세요.",
    "세 변이 모두 같은 삼각형을 구별하는 연습을 하고 있습니다.",
    "같은 길이의 막대 세 개로 삼각형을 만들고 세 변을 차례로 확인해 보세요."
  ),
  signal(
    "triangles.isosceles-equal-angles",
    "이등변삼각형의 같은 두 각 이용하기",
    "high",
    "이등변삼각형에서 길이가 같은 두 변의 맞은편 각이 같다는 성질을 계산에 연결하는 과정을 확인할 필요가 있습니다.",
    "같은 변에 눈금을 표시하고 그 맞은편 두 각에 같은 표시를 옮겨 보게 하세요.",
    "이등변삼각형에서 크기가 같은 두 각을 이용하는 연습을 하고 있습니다.",
    "종이로 이등변삼각형을 접어 포개지는 두 각을 찾아보게 해주세요."
  ),
  signal(
    "triangles.classify-right",
    "직각이 있는 삼각형 찾기",
    "high",
    "세 각을 살펴 직각이 하나 있는 삼각형을 직각삼각형으로 분류하는 기준을 확인할 필요가 있습니다.",
    "각 하나씩 직각과 비교하고 직각이 있는지를 먼저 말하게 하세요.",
    "직각이 있는 삼각형을 구별하는 연습을 하고 있습니다.",
    "삼각자의 직각 부분을 삼각형의 세 각에 차례로 대어 보게 해주세요."
  ),
  signal(
    "triangles.classify-acute-obtuse",
    "가장 큰 각으로 삼각형 나누기",
    "medium",
    "가장 큰 각이 직각보다 작은지 큰지를 기준으로 예각삼각형과 둔각삼각형을 나누는 과정이 흔들립니다.",
    "세 각 중 가장 큰 각을 먼저 찾고 직각과 비교하게 하세요.",
    "가장 큰 각을 보고 예각삼각형과 둔각삼각형을 구별하는 연습을 하고 있습니다.",
    "종이 삼각형에서 가장 큰 각을 찾아 직각 종이와 비교해 보게 해주세요."
  ),
  signal(
    "frac-ops.add-same-denominator",
    "동분모 덧셈 계산",
    "high",
    "분모가 같은 두 분수에서 분모는 그대로 두고 분자끼리 더하는 근거를 더 확인할 필요가 있습니다.",
    "같은 크기의 조각끼리 더할 때 전체를 나눈 수는 그대로이고 고른 조각 수만 늘어남을 말하게 하세요.",
    "분모가 같은 분수의 덧셈을 계산하는 연습을 하고 있습니다.",
    "종이를 같은 수로 나눈 뒤 색칠한 조각 수끼리 더해 보게 해주세요."
  ),
  signal(
    "frac-ops.sum-to-mixed",
    "합을 대분수로 바꾸기",
    "medium",
    "분모가 같은 분수를 더한 뒤 가분수를 대분수로 나타내는 과정에서 근거를 더 살펴볼 필요가 있습니다. 덧셈보다 앞서 배운 가분수와 대분수의 관계를 먼저 확인해야 할 수 있습니다.",
    "분자에서 분모만큼 한 묶음을 찾고, 자연수 한 개와 남은 분수로 나누어 적게 하세요.",
    "1보다 큰 분수의 합을 대분수로 나타내는 연습을 하고 있습니다.",
    "같은 크기 조각이 한 판을 채우는 수만큼 모이면 1이 됨을 함께 확인해 주세요."
  ),
  signal(
    "frac-ops.subtract-same-denominator",
    "동분모 뺄셈 계산",
    "high",
    "분모가 같은 두 분수에서 분모는 그대로 두고 분자끼리 빼는 근거를 더 확인할 필요가 있습니다.",
    "같은 크기의 조각 중에서 없어진 조각 수만 빼고 전체를 나눈 수는 유지하게 하세요.",
    "분모가 같은 분수의 뺄셈을 계산하는 연습을 하고 있습니다.",
    "같은 수로 나눈 종이에서 색칠한 조각 몇 개를 지우고 남은 수를 세어 보게 해주세요."
  ),
  signal(
    "frac-ops.whole-minus-fraction",
    "1에서 진분수 빼기",
    "high",
    "1을 주어진 분모와 같은 가분수로 바꾸어 진분수를 빼는 과정에서 근거를 더 살펴볼 필요가 있습니다. 뺄셈보다 앞서 배운 가분수 표현을 먼저 확인해야 할 수 있습니다.",
    "1을 분모만큼의 같은 조각으로 나타낸 뒤, 빼는 조각에 선을 긋고 남은 조각을 세게 하세요.",
    "1에서 진분수를 빼는 연습을 하고 있습니다.",
    "종이 한 장을 같은 수로 나누고 몇 조각을 덜어 냈을 때 남은 부분을 분수로 말해 보게 해주세요."
  ),
  signal(
    "frac-ops.mixed-add",
    "대분수끼리 더하기",
    "medium",
    "받아올림이 없는 대분수의 덧셈에서 자연수 부분과 분수 부분을 나누어 더하는 과정이 흔들립니다.",
    "자연수 부분에는 한 줄, 분수 부분에는 다른 줄을 그어 같은 부분끼리 더하게 하세요.",
    "받아올림이 없는 대분수의 덧셈을 연습하고 있습니다.",
    "한 묶음과 남은 조각으로 나타낸 두 양을 자연수끼리, 조각끼리 더해 보게 해주세요."
  ),
  signal(
    "quad.perpendicular-side",
    "직각 표시로 수직인 변 찾기",
    "high",
    "직각 표시를 근거로 기준 변과 수직인 변을 찾는 과정에서, 단순히 만나는 변이나 기준 변과 만나지 않는 변을 고르는지 확인할 필요가 있습니다. 그리기와 설명은 이 선택형 활동에서 관찰하지 않았습니다.",
    "기준 변을 손가락으로 짚고, 만나는 곳의 직각 표시를 확인한 뒤 수직인 변을 말하게 하세요.",
    "직각 표시를 보고 서로 수직인 두 변을 찾는 연습을 하고 있습니다. 그리기와 설명은 이 활동에서 관찰하지 않았습니다.",
    "종이 모서리를 여러 선의 만나는 곳에 대어 직각인 곳만 찾아보게 해주세요."
  ),
  signal(
    "quad.parallel-side-distance",
    "평행한 두 변 사이의 거리 읽기",
    "high",
    "평행한 두 변 사이의 거리를 두 변에 수직인 선분의 길이로 읽는 과정에서, 기울어진 변이나 평행한 변 자체의 길이와 혼동하는지 확인할 필요가 있습니다. 직접 재거나 그리는 행동은 이 선택형 활동에서 관찰하지 않았습니다.",
    "두 평행한 변을 먼저 찾고, 두 변을 직각으로 잇는 선분만 거리로 읽게 하세요.",
    "평행한 두 변 사이의 거리를 수직인 선분으로 읽는 연습을 하고 있습니다. 직접 재거나 그리는 행동은 이 활동에서 관찰하지 않았습니다.",
    "평행한 두 줄 사이에 종이 모서리를 직각으로 놓고 가장 곧게 잇는 길이를 찾아보게 해주세요."
  ),
  signal(
    "quad.trapezoid-parallel-pair",
    "평행한 변 한 쌍으로 사다리꼴 구별하기",
    "medium",
    "화살표 표시를 확인하여 평행한 변이 한 쌍인 사각형을 사다리꼴로 분류하는 과정이 흔들립니다. 그리기와 설명은 이 선택형 활동에서 관찰하지 않았습니다.",
    "마주 보는 두 변씩 짝을 지어 화살표 표시가 같은 쌍을 하나씩 세게 하세요.",
    "평행한 변 한 쌍을 찾아 사다리꼴을 구별하는 연습을 하고 있습니다. 그리기와 설명은 이 활동에서 관찰하지 않았습니다.",
    "막대 네 개로 사각형을 만들고 마주 보는 두 변 중 평행한 한 쌍을 찾아보게 해주세요."
  ),
  signal(
    "quad.rhombus-equal-sides",
    "네 변이 같은 마름모 구별하기",
    "medium",
    "네 변의 같은 눈금을 모두 확인하여 마름모로 분류하고, 직각 조건이 필요한 정사각형·직사각형과 구분하는 과정이 흔들립니다. 그리기와 설명은 이 선택형 활동에서 관찰하지 않았습니다.",
    "네 변의 눈금을 하나씩 확인한 뒤 직각 표시가 있는지도 따로 확인하게 하세요.",
    "네 변이 모두 같은 사각형을 마름모로 구별하는 연습을 하고 있습니다. 그리기와 설명은 이 활동에서 관찰하지 않았습니다.",
    "같은 길이의 막대 네 개로 기울어진 사각형을 만들고 네 변을 차례로 확인해 보게 해주세요."
  ),
  signal(
    "quad.parallelogram-opposite-angle",
    "평행사변형의 마주 보는 각 이용하기",
    "high",
    "평행사변형에서 마주 보는 두 각의 크기가 같다는 성질을 이용하는 과정에서, 이웃한 각이나 모든 각을 90도로 보는지 확인할 필요가 있습니다. 성질을 말이나 글로 설명하는 행동은 이 선택형 활동에서 관찰하지 않았습니다.",
    "한 각에서 마주 보는 꼭짓점까지 손가락으로 건너가 같은 각 표시를 옮기게 하세요.",
    "평행사변형의 마주 보는 두 각이 같은 성질을 이용하는 연습을 하고 있습니다. 성질을 직접 설명하는 행동은 이 활동에서 관찰하지 않았습니다.",
    "종이 평행사변형의 마주 보는 두 모서리를 포개어 같은 각을 찾아보게 해주세요."
  ),
  signal(
    "decimal.read-write",
    "소수의 빈 자리까지 읽고 쓰기",
    "medium",
    "소수점 아래 0도 자리를 나타낸다는 점을 지키며 소수 두 자리 수와 세 자리 수를 읽고 쓰는지 확인할 필요가 있습니다.",
    "소수점 아래 자리를 차례로 짚고 0도 건너뛰지 않고 읽고 쓰게 하세요.",
    "소수점 아래의 0도 빠뜨리지 않고 소수를 읽고 쓰는 연습을 하고 있습니다.",
    "가격이나 길이에 적힌 소수를 소수점 뒤 숫자까지 차례로 읽어 보게 해주세요."
  ),
  signal(
    "decimal.compose-place-value",
    "0.1과 0.01의 개수로 소수 나타내기",
    "high",
    "0.1의 개수와 0.01의 개수를 각각 소수 첫째 자리와 둘째 자리에 놓는 과정이 흔들립니다.",
    "0.1은 소수 첫째 자리, 0.01은 소수 둘째 자리 칸에 개수를 나누어 적게 하세요.",
    "0.1과 0.01이 몇 개인지 보고 소수로 나타내는 연습을 하고 있습니다.",
    "0.1짜리 조각과 0.01짜리 조각의 개수를 따로 세어 한 소수로 말해 보게 해주세요."
  ),
  signal(
    "decimal.compare",
    "소수의 같은 자리끼리 비교하기",
    "high",
    "정수 부분부터 같은 자리끼리 비교하지 않고 소수점 뒤 숫자의 개수나 크기에만 끌리는지 확인할 필요가 있습니다.",
    "소수 둘째 자리까지 0을 채워 적고 정수 부분, 소수 첫째 자리, 둘째 자리 순서로 비교하게 하세요.",
    "같은 자리끼리 살펴 소수의 크기를 비교하는 연습을 하고 있습니다.",
    "두 길이를 소수 둘째 자리까지 적은 뒤 왼쪽 자리부터 차례로 비교해 보게 해주세요."
  ),
  signal(
    "decimal.add",
    "소수점을 맞추어 더하기",
    "high",
    "소수점을 맞추어 같은 자리끼리 더하고 받아올림을 다음 자리로 보내는 과정이 흔들립니다.",
    "두 수의 소수점을 세로로 맞춘 뒤 빈 자리에 0을 쓰고 오른쪽 자리부터 더하게 하세요.",
    "소수점을 맞추고 받아올림을 하며 소수를 더하는 연습을 하고 있습니다.",
    "두 길이를 소수 둘째 자리까지 맞추어 적고 같은 자리끼리 더해 보게 해주세요."
  ),
  signal(
    "decimal.subtract",
    "소수점을 맞추어 빼기",
    "high",
    "소수점을 맞추고 빈 자리에 0을 채운 뒤 받아내림한 만큼 윗자리를 줄이는 과정이 흔들립니다.",
    "소수 둘째 자리까지 0을 채우고, 받아내림할 때 빌려 온 자리와 줄어든 자리를 함께 표시하게 하세요.",
    "소수점을 맞추고 받아내림을 하며 소수를 빼는 연습을 하고 있습니다.",
    "남은 길이를 구할 때 두 수의 소수점을 맞춘 뒤 빌려 온 자리를 표시해 보게 해주세요."
  ),
  signal(
    "polygon.identify-closed-straight",
    "다각형의 선과 둘러싸임 확인하기",
    "high",
    "곧은 선으로만 둘러싸였고 끝이 모두 이어졌는지 함께 확인하여 다각형을 구별하는 과정이 흔들립니다. 직접 재거나 만들거나 말·글로 설명하는 행동은 이 선택형 활동에서 관찰하지 않았습니다.",
    "선마다 곧은지 확인한 뒤 마지막 끝과 처음 끝이 이어졌는지 손가락으로 따라가게 하세요. 직접 재거나 만들거나 말·글로 설명하는 행동은 이 선택형 활동에서 관찰하지 않았습니다.",
    "선의 모양과 이어진 곳을 살펴 다각형을 구별하는 연습을 하고 있습니다.",
    "끈과 막대로 여러 모양을 만들고 곧은 선만으로 둘러싸인 모양을 찾아보게 해주세요."
  ),
  signal(
    "polygon.name-by-side-count",
    "변의 수로 다각형 이름 정하기",
    "medium",
    "오목하게 들어간 곳에서도 변을 빠뜨리지 않고 세어 다각형 이름을 정하는 과정이 흔들립니다. 직접 재거나 만들거나 말·글로 설명하는 행동은 이 선택형 활동에서 관찰하지 않았습니다.",
    "한 꼭짓점에 시작 표시를 하고 변을 한 바퀴 따라가며 하나씩 세게 하세요. 직접 재거나 만들거나 말·글로 설명하는 행동은 이 선택형 활동에서 관찰하지 않았습니다.",
    "오목한 곳이 있는 도형에서도 변의 수를 세어 이름을 정하는 연습을 하고 있습니다.",
    "종이 모양의 한 꼭짓점부터 변을 따라가며 몇 각형인지 말해 보게 해주세요."
  ),
  signal(
    "polygon.regular-two-conditions",
    "정다각형의 두 조건 확인하기",
    "high",
    "모든 변의 길이와 모든 각의 크기가 각각 같은지를 모두 확인하여 정다각형을 구별하는 과정이 흔들립니다. 직접 재거나 만들거나 말·글로 설명하는 행동은 이 선택형 활동에서 관찰하지 않았습니다.",
    "변의 눈금을 모두 확인한 뒤 각의 표시도 모두 확인하도록 두 번 나누어 살펴보게 하세요. 직접 재거나 만들거나 말·글로 설명하는 행동은 이 선택형 활동에서 관찰하지 않았습니다.",
    "변과 각의 두 조건을 모두 보고 정다각형을 구별하는 연습을 하고 있습니다.",
    "여러 종이 모양에서 변이 모두 같은 것과 각이 모두 같은 것을 따로 찾아보게 해주세요."
  ),
  signal(
    "polygon.fill-remaining-space",
    "남은 자리의 모양까지 맞추기",
    "medium",
    "남은 자리의 칸 수뿐 아니라 위·아래로 놓인 모양까지 맞는 조각 묶음을 고르는 과정이 흔들립니다. 실제 조각을 놓거나 여러 방법을 만들고 설명하는 행동은 이 선택형 활동에서 관찰하지 않았습니다.",
    "남은 칸 수를 센 뒤 조각을 머릿속으로 돌려 테두리가 맞는지 다시 확인하게 하세요. 실제 조각을 놓거나 여러 방법을 만들고 설명하는 행동은 이 선택형 활동에서 관찰하지 않았습니다.",
    "남은 자리의 수와 모양에 맞는 조각 묶음을 찾는 연습을 하고 있습니다.",
    "모양 조각을 몇 개 놓고 남은 자리에 어떤 조각이 맞는지 직접 대어 보게 해주세요."
  ),
  signal(
    "polygon.tile-count-pieces",
    "정해진 조각의 크기로 개수 정하기",
    "medium",
    "전체 모양을 정해진 조각 한 개의 크기로 나누어 필요한 개수를 정하는 과정이 흔들립니다. 실제 조각을 놓거나 여러 방법을 만들고 설명하는 행동은 이 선택형 활동에서 관찰하지 않았습니다.",
    "주어진 조각 하나가 삼각형 몇 칸인지 확인하고 전체 칸 수를 같은 크기로 묶게 하세요. 실제 조각을 놓거나 여러 방법을 만들고 설명하는 행동은 이 선택형 활동에서 관찰하지 않았습니다.",
    "한 가지 모양 조각으로 빈틈없이 채울 때 필요한 개수를 정하는 연습을 하고 있습니다.",
    "같은 모양 조각으로 작은 판을 채우며 몇 개가 들어가는지 세어 보게 해주세요."
  ),
  signal(
    "line-graph.tick-unit",
    "세로 눈금 한 칸의 값 정하기",
    "high",
    "표시된 두 눈금값의 차이를 눈금 칸 수로 나누어 한 칸의 값을 정하는 과정에서, 한 칸을 1로 보거나 전체 칸 수를 한 칸의 값으로 보는지 확인할 필요가 있습니다. 자료를 직접 조사하여 꺾은선그래프로 그리거나, 물결선의 위치를 정하거나, 알게 된 점을 말·글로 설명하거나, 앞으로의 값을 예측하는 행동은 이 선택형 활동에서 관찰하지 않았습니다.",
    "표시된 두 눈금 사이의 값 차이와 칸 수를 각각 짚은 뒤 값 차이를 칸 수로 나누게 하세요.",
    "꺾은선그래프에서 눈금 한 칸이 나타내는 값을 정하는 연습을 하고 있습니다. 한 번의 선택만으로 이해 정도를 확정하지 않습니다.",
    "온도계나 자의 표시된 두 수 사이를 세어 한 칸의 값을 함께 정해 보세요."
  ),
  signal(
    "line-graph.point-value",
    "기준값에서 점의 값 읽기",
    "high",
    "기준값에 점까지의 눈금 수와 한 칸의 값을 적용하는 과정에서, 점의 눈금 번호를 그대로 값으로 쓰거나 이웃한 점의 값을 읽는지 확인할 필요가 있습니다. 자료를 직접 조사하여 꺾은선그래프로 그리거나, 물결선의 위치를 정하거나, 알게 된 점을 말·글로 설명하거나, 앞으로의 값을 예측하는 행동은 이 선택형 활동에서 관찰하지 않았습니다.",
    "기준값에서 묻는 점까지 눈금을 따라가며 한 칸의 값을 차례로 더하게 하세요.",
    "꺾은선그래프의 한 점이 나타내는 값을 읽는 연습을 하고 있습니다. 한 번의 선택만으로 이해 정도를 확정하지 않습니다.",
    "시간별 온도 그래프에서 한 시각을 짚고 세로축의 값과 연결해 보세요."
  ),
  signal(
    "line-graph.step-change",
    "두 점 사이 변화량 구하기",
    "high",
    "이웃한 두 점의 값 차이를 구할 때 눈금 칸 수만 쓰거나 나중 점의 값을 변화량으로 보는지 확인할 필요가 있습니다. 자료를 직접 조사하여 꺾은선그래프로 그리거나, 물결선의 위치를 정하거나, 알게 된 점을 말·글로 설명하거나, 앞으로의 값을 예측하는 행동은 이 선택형 활동에서 관찰하지 않았습니다.",
    "두 시점의 값을 각각 적고 큰 값에서 작은 값을 빼 변화한 양을 구하게 하세요.",
    "꺾은선그래프에서 두 시점 사이에 변한 양을 구하는 연습을 하고 있습니다. 한 번의 선택만으로 이해 정도를 확정하지 않습니다.",
    "두 시각의 온도를 각각 읽은 뒤 얼마나 달라졌는지 빼어 보세요."
  ),
  signal(
    "line-graph.largest-rise",
    "가장 크게 증가한 구간 찾기",
    "medium",
    "선의 방향과 변화량을 함께 비교할 때 가장 크게 감소한 구간이나 가장 높은 점이 있는 구간을 고르는지 확인할 필요가 있습니다. 자료를 직접 조사하여 꺾은선그래프로 그리거나, 물결선의 위치를 정하거나, 알게 된 점을 말·글로 설명하거나, 앞으로의 값을 예측하는 행동은 이 선택형 활동에서 관찰하지 않았습니다.",
    "각 구간에 올라감·내려감을 먼저 표시하고, 올라간 구간끼리 눈금 차이를 비교하게 하세요.",
    "꺾은선그래프에서 값이 가장 크게 증가한 구간을 찾는 연습을 하고 있습니다. 한 번의 선택만으로 이해 정도를 확정하지 않습니다.",
    "시간별 그래프의 선마다 화살표 방향과 눈금 차이를 함께 비교해 보세요."
  ),
  signal(
    "line-graph.between-estimate",
    "두 점 사이 값 어림하기",
    "medium",
    "두 점을 이은 선의 중간 높이를 읽을 때 앞 시점의 값을 그대로 쓰거나 중간 눈금 번호만 값으로 쓰는지 확인할 필요가 있습니다. 자료를 직접 조사하여 꺾은선그래프로 그리거나, 물결선의 위치를 정하거나, 알게 된 점을 말·글로 설명하거나, 앞으로의 값을 예측하는 행동은 이 선택형 활동에서 관찰하지 않았습니다.",
    "묻는 시각이 두 시점 사이의 어디쯤인지 먼저 찾고 선의 높이를 세로축으로 옮겨 어림하게 하세요.",
    "꺾은선그래프의 선을 따라 두 시점 사이의 값을 어림하는 연습을 하고 있습니다. 한 번의 선택만으로 이해 정도를 확정하지 않습니다.",
    "두 시각의 중간 시각을 표시하고 선의 높이가 어느 눈금과 만나는지 살펴보세요."
  ),
  signal(
    "needs-scaffold",
    "추가 발판 필요",
    "medium",
    "선택 근거를 더 관찰할 수 있도록 구체물과 짧은 확인 질문이 필요합니다.",
    "한 번에 한 조건이나 한 계산 순서만 확인할 수 있도록 문제를 나누어 제시하세요.",
    "수학 정보를 한 가지씩 확인하는 연습을 하고 있습니다.",
    "무엇을 먼저 확인했는지 한 단계씩 말해 보게 해주세요."
  ),
  signal(
    "needs-review",
    "추가 관찰 필요",
    "low",
    "현재 선택만으로는 한 가지 분류 기준이 안정적인지 더 확인할 필요가 있습니다.",
    "수치나 표현을 바꾼 짧은 문항으로 같은 생각을 한 번 더 확인하세요.",
    "다른 문제에서도 같은 생각을 적용하는지 살펴보고 있습니다.",
    "숫자나 모양을 바꾸어도 같은 방법을 쓸 수 있는지 말해 보게 해주세요."
  )
];

const judgments: Judgment[] = [
  judgment({
    id: "g4s2-tri-01",
    unitId: "triangles",
    learnerStageId: "triangles.classify-isosceles",
    curriculumAnchorIds: ["[4수03-08]"],
    prompt: "세 변의 길이를 보고 알맞은 삼각형의 이름을 골라 보세요.",
    visual: {
      kind: "triangle-figure",
      mode: "side-classify",
      sides: [5, 5, 8]
    },
    signalId: "triangles.classify-isosceles",
    answers: [
      { id: "isosceles-558", label: "이등변삼각형" },
      { id: "equilateral-558", label: "정삼각형" },
      { id: "scalene-558", label: "세 변의 길이가 모두 다른 삼각형" }
    ]
  }),
  judgment({
    id: "g4s2-tri-02",
    unitId: "triangles",
    learnerStageId: "triangles.classify-isosceles",
    curriculumAnchorIds: ["[4수03-08]"],
    context: "길이가 9 cm, 9 cm, 4 cm인 막대 세 개를 이어 삼각형을 만들었어요.",
    prompt: "같은 길이인 변을 근거로 알맞은 이름을 찾아보세요.",
    visual: {
      kind: "triangle-figure",
      mode: "side-classify",
      sides: [9, 9, 4]
    },
    signalId: "triangles.classify-isosceles",
    answers: [
      { id: "isosceles-994", label: "이등변삼각형" },
      { id: "equilateral-994", label: "정삼각형" },
      { id: "scalene-994", label: "세 변의 길이가 모두 다른 삼각형" }
    ]
  }),
  judgment({
    id: "g4s2-tri-03",
    unitId: "triangles",
    learnerStageId: "triangles.classify-equilateral",
    curriculumAnchorIds: ["[4수03-08]"],
    prompt: "세 변을 모두 비교하면 어떤 삼각형일까요?",
    visual: {
      kind: "triangle-figure",
      mode: "side-classify",
      sides: [6, 6, 6]
    },
    signalId: "triangles.classify-equilateral",
    answers: [
      { id: "equilateral-666", label: "정삼각형" },
      { id: "only-two-equal-666", label: "두 변만 길이가 같은 삼각형" },
      { id: "scalene-666", label: "세 변의 길이가 모두 다른 삼각형" }
    ]
  }),
  judgment({
    id: "g4s2-tri-04",
    unitId: "triangles",
    learnerStageId: "triangles.classify-equilateral",
    curriculumAnchorIds: ["[4수03-08]"],
    context: "길이가 같은 막대 세 개로 삼각형을 만들었습니다.",
    prompt: "그림에서 세 변의 표시를 확인하고 이름을 골라 보세요.",
    visual: {
      kind: "triangle-figure",
      mode: "side-classify",
      sides: [8, 8, 8]
    },
    signalId: "triangles.classify-equilateral",
    answers: [
      { id: "equilateral-888", label: "정삼각형" },
      { id: "only-two-equal-888", label: "두 변만 길이가 같은 삼각형" },
      { id: "scalene-888", label: "세 변의 길이가 모두 다른 삼각형" }
    ]
  }),
  judgment({
    id: "g4s2-tri-05",
    unitId: "triangles",
    learnerStageId: "triangles.isosceles-equal-angles",
    curriculumAnchorIds: ["[4수03-08]"],
    context: "같은 눈금이 있는 두 변의 길이는 같습니다.",
    prompt: "㉠의 크기는 몇 도일까요?",
    visual: {
      kind: "triangle-figure",
      mode: "side-angle",
      angles: [null, 70, null],
      equalSideIndexes: [0, 1],
      askIndex: 0
    },
    signalId: "triangles.isosceles-equal-angles",
    answers: [
      { id: "angle-70", label: "70°" },
      { id: "angle-110", label: "110°" },
      { id: "angle-35", label: "35°" }
    ]
  }),
  judgment({
    id: "g4s2-tri-06",
    unitId: "triangles",
    learnerStageId: "triangles.isosceles-equal-angles",
    curriculumAnchorIds: ["[4수03-08]"],
    context: "같은 눈금이 있는 두 변의 길이는 같습니다.",
    prompt: "표시된 한 각이 64°일 때 ㉠의 크기는 몇 도일까요?",
    visual: {
      kind: "triangle-figure",
      mode: "side-angle",
      angles: [null, 64, null],
      equalSideIndexes: [1, 2],
      askIndex: 2
    },
    signalId: "triangles.isosceles-equal-angles",
    answers: [
      { id: "angle-64", label: "64°" },
      { id: "angle-116", label: "116°" },
      { id: "angle-32", label: "32°" }
    ]
  }),
  judgment({
    id: "g4s2-tri-07",
    unitId: "triangles",
    learnerStageId: "triangles.classify-right",
    curriculumAnchorIds: ["[4수03-09]"],
    prompt: "세 각을 보고 이 삼각형의 이름을 골라 보세요.",
    visual: {
      kind: "triangle-figure",
      mode: "angle-classify",
      angles: [35, 55, 90]
    },
    signalId: "triangles.classify-right",
    answers: [
      { id: "right-355590", label: "직각삼각형" },
      { id: "acute-355590", label: "예각삼각형" },
      { id: "obtuse-355590", label: "둔각삼각형" }
    ]
  }),
  judgment({
    id: "g4s2-tri-08",
    unitId: "triangles",
    learnerStageId: "triangles.classify-right",
    curriculumAnchorIds: ["[4수03-09]"],
    context: "삼각형을 돌려 놓아도 각의 크기는 달라지지 않습니다.",
    prompt: "직각이 있는지 확인하고 삼각형의 이름을 골라 보세요.",
    visual: {
      kind: "triangle-figure",
      mode: "angle-classify",
      angles: [90, 25, 65]
    },
    signalId: "triangles.classify-right",
    answers: [
      { id: "right-2565", label: "직각삼각형" },
      { id: "acute-2565", label: "예각삼각형" },
      { id: "obtuse-2565", label: "둔각삼각형" }
    ]
  }),
  judgment({
    id: "g4s2-tri-09",
    unitId: "triangles",
    learnerStageId: "triangles.classify-acute-obtuse",
    curriculumAnchorIds: ["[4수03-09]"],
    prompt: "가장 큰 각을 직각과 비교하면 어떤 삼각형일까요?",
    visual: {
      kind: "triangle-figure",
      mode: "angle-classify",
      angles: [40, 60, 80]
    },
    signalId: "triangles.classify-acute-obtuse",
    answers: [
      { id: "acute-406080", label: "예각삼각형" },
      { id: "obtuse-406080", label: "둔각삼각형" },
      { id: "right-406080", label: "직각삼각형" }
    ]
  }),
  judgment({
    id: "g4s2-tri-10",
    unitId: "triangles",
    learnerStageId: "triangles.classify-acute-obtuse",
    curriculumAnchorIds: ["[4수03-09]"],
    context: "세 각 중 가장 큰 각은 110°입니다.",
    prompt: "이 각이 직각보다 큰지 생각하여 이름을 골라 보세요.",
    visual: {
      kind: "triangle-figure",
      mode: "angle-classify",
      angles: [30, 40, 110]
    },
    signalId: "triangles.classify-acute-obtuse",
    answers: [
      { id: "obtuse-3040110", label: "둔각삼각형" },
      { id: "acute-3040110", label: "예각삼각형" },
      { id: "right-3040110", label: "직각삼각형" }
    ]
  }),
  judgment({
    id: "g4s2-frac-01",
    unitId: "fraction-add-subtract",
    learnerStageId: "frac-ops.add-same-denominator",
    curriculumAnchorIds: ["[4수01-15]"],
    prompt: "2/7 + 3/7은 얼마일까요?",
    visual: { kind: "none" },
    signalId: "frac-ops.add-same-denominator",
    answers: [
      { id: "five-sevenths-237", label: "5/7" },
      { id: "five-fourteenths-237", label: "5/14" },
      { id: "one-seventh-237", label: "1/7" }
    ]
  }),
  judgment({
    id: "g4s2-frac-02",
    unitId: "fraction-add-subtract",
    learnerStageId: "frac-ops.add-same-denominator",
    curriculumAnchorIds: ["[4수01-15]"],
    context: "주스를 오전에 3/9 L, 오후에 5/9 L 마셨어요.",
    prompt: "마신 주스는 모두 몇 L일까요?",
    visual: { kind: "none" },
    signalId: "frac-ops.add-same-denominator",
    answers: [
      { id: "eight-ninths-359", label: "8/9 L" },
      { id: "eight-eighteenths-359", label: "8/18 L" },
      { id: "two-ninths-359", label: "2/9 L" }
    ]
  }),
  judgment({
    id: "g4s2-frac-03",
    unitId: "fraction-add-subtract",
    learnerStageId: "frac-ops.sum-to-mixed",
    curriculumAnchorIds: ["[4수01-15]"],
    prompt: "5/6 + 4/6을 대분수로 나타내면 얼마일까요?",
    visual: { kind: "none" },
    signalId: "frac-ops.sum-to-mixed",
    answers: [
      { id: "one-and-three-sixths-546", label: "1과 3/6" },
      { id: "three-and-one-sixth-546", label: "3과 1/6" },
      { id: "nine-twelfths-546", label: "9/12" }
    ]
  }),
  judgment({
    id: "g4s2-frac-04",
    unitId: "fraction-add-subtract",
    learnerStageId: "frac-ops.sum-to-mixed",
    curriculumAnchorIds: ["[4수01-15]"],
    context: "리본을 5/8 m와 6/8 m 이어 붙였어요.",
    prompt: "이어 붙인 리본의 길이를 대분수로 나타내면 몇 m일까요?",
    visual: { kind: "none" },
    signalId: "frac-ops.sum-to-mixed",
    answers: [
      { id: "one-and-three-eighths-568", label: "1과 3/8 m" },
      { id: "three-and-one-eighth-568", label: "3과 1/8 m" },
      { id: "eleven-sixteenths-568", label: "11/16 m" }
    ]
  }),
  judgment({
    id: "g4s2-frac-05",
    unitId: "fraction-add-subtract",
    learnerStageId: "frac-ops.subtract-same-denominator",
    curriculumAnchorIds: ["[4수01-15]"],
    prompt: "8/9 − 5/9는 얼마일까요?",
    visual: { kind: "none" },
    signalId: "frac-ops.subtract-same-denominator",
    answers: [
      { id: "three-ninths-859", label: "3/9" },
      { id: "three-eighteenths-859", label: "3/18" },
      { id: "thirteen-ninths-859", label: "13/9" }
    ]
  }),
  judgment({
    id: "g4s2-frac-06",
    unitId: "fraction-add-subtract",
    learnerStageId: "frac-ops.subtract-same-denominator",
    curriculumAnchorIds: ["[4수01-15]"],
    context: "찰흙 7/10 kg 중에서 4/10 kg을 사용했어요.",
    prompt: "남은 찰흙은 몇 kg일까요?",
    visual: { kind: "none" },
    signalId: "frac-ops.subtract-same-denominator",
    answers: [
      { id: "three-tenths-7410", label: "3/10 kg" },
      { id: "three-twentieths-7410", label: "3/20 kg" },
      { id: "eleven-tenths-7410", label: "11/10 kg" }
    ]
  }),
  judgment({
    id: "g4s2-frac-07",
    unitId: "fraction-add-subtract",
    learnerStageId: "frac-ops.whole-minus-fraction",
    curriculumAnchorIds: ["[4수01-15]"],
    prompt: "1 − 3/8은 얼마일까요?",
    visual: { kind: "none" },
    signalId: "frac-ops.whole-minus-fraction",
    answers: [
      { id: "five-eighths-138", label: "5/8" },
      { id: "two-eighths-138", label: "2/8" },
      { id: "one-and-three-eighths-138", label: "1과 3/8" }
    ]
  }),
  judgment({
    id: "g4s2-frac-08",
    unitId: "fraction-add-subtract",
    learnerStageId: "frac-ops.whole-minus-fraction",
    curriculumAnchorIds: ["[4수01-15]"],
    context: "색 테이프 1 m에서 3/7 m를 잘라 썼어요.",
    prompt: "남은 색 테이프는 몇 m일까요?",
    visual: { kind: "none" },
    signalId: "frac-ops.whole-minus-fraction",
    answers: [
      { id: "four-sevenths-137", label: "4/7 m" },
      { id: "two-sevenths-137", label: "2/7 m" },
      { id: "one-and-three-sevenths-137", label: "1과 3/7 m" }
    ]
  }),
  judgment({
    id: "g4s2-frac-09",
    unitId: "fraction-add-subtract",
    learnerStageId: "frac-ops.mixed-add",
    curriculumAnchorIds: ["[4수01-15]"],
    prompt: "1과 2/7 + 2와 3/7을 대분수로 나타내면 얼마일까요?",
    visual: { kind: "none" },
    signalId: "frac-ops.mixed-add",
    answers: [
      { id: "three-and-five-sevenths-127237", label: "3과 5/7" },
      { id: "three-and-five-fourteenths-127237", label: "3과 5/14" },
      { id: "eight-sevenths-127237", label: "8/7" }
    ]
  }),
  judgment({
    id: "g4s2-frac-10",
    unitId: "fraction-add-subtract",
    learnerStageId: "frac-ops.mixed-add",
    curriculumAnchorIds: ["[4수01-15]"],
    context: "가족이 우유를 어제 1과 1/5 L, 오늘 2와 2/5 L 마셨어요.",
    prompt: "이틀 동안 마신 양을 대분수로 나타내면 몇 L일까요?",
    visual: { kind: "none" },
    signalId: "frac-ops.mixed-add",
    answers: [
      { id: "three-and-three-fifths-11225", label: "3과 3/5 L" },
      { id: "three-and-three-tenths-11225", label: "3과 3/10 L" },
      { id: "six-fifths-11225", label: "6/5 L" }
    ]
  }),
  judgment({
    id: "g4s2-quad-01",
    unitId: "quadrilaterals",
    learnerStageId: "quad.perpendicular-side",
    curriculumAnchorIds: ["[4수03-03]"],
    context: "직각 표시가 있는 곳만 직각입니다.",
    prompt: "변 ㄱㄴ에 수직인 변을 골라 보세요.",
    visual: {
      kind: "quadrilateral-figure",
      mode: "side-perpendicular",
      vertices: [[3, 9], [0, 0], [9, 0], [9, 7]],
      baseSideIndex: 0,
      rightAngleVertexIndexes: [0, 2]
    },
    signalId: "quad.perpendicular-side",
    answers: [
      { id: "side-rg-perpendicular-01", label: "변 ㄹㄱ" },
      { id: "side-nd-touching-01", label: "변 ㄴㄷ" },
      { id: "side-dr-not-touching-01", label: "변 ㄷㄹ" }
    ]
  }),
  judgment({
    id: "g4s2-quad-02",
    unitId: "quadrilaterals",
    learnerStageId: "quad.perpendicular-side",
    curriculumAnchorIds: ["[4수03-03]"],
    context: "직각 표시가 있는 곳만 직각입니다.",
    prompt: "변 ㄹㄱ에 수직인 변을 골라 보세요.",
    visual: {
      kind: "quadrilateral-figure",
      mode: "side-perpendicular",
      vertices: [[0, 12], [0, 0], [8, 4], [4, 12]],
      baseSideIndex: 3,
      rightAngleVertexIndexes: [0, 2]
    },
    signalId: "quad.perpendicular-side",
    answers: [
      { id: "side-gn-perpendicular-02", label: "변 ㄱㄴ" },
      { id: "side-dr-touching-02", label: "변 ㄷㄹ" },
      { id: "side-nd-not-touching-02", label: "변 ㄴㄷ" }
    ]
  }),
  judgment({
    id: "g4s2-quad-03",
    unitId: "quadrilaterals",
    learnerStageId: "quad.parallel-side-distance",
    curriculumAnchorIds: ["[4수03-03]"],
    context: "직각 표시가 있는 곳만 직각입니다. 화살표 표시가 있는 변끼리만 서로 평행합니다.",
    prompt: "변 ㄴㄷ과 변 ㄹㄱ 사이의 거리는 몇 cm일까요?",
    visual: {
      kind: "quadrilateral-figure",
      mode: "side-parallel-distance",
      vertices: [[6, 8], [0, 0], [14, 0], [20, 8]],
      parallelSidePairs: [[0, 2], [1, 3]],
      sideLengthLabels: [
        { sideIndex: 0, lengthCm: 10 },
        { sideIndex: 1, lengthCm: 14 }
      ],
      distanceSegment: {
        fromVertexIndex: 0,
        toSideIndex: 1,
        lengthCm: 8
      }
    },
    signalId: "quad.parallel-side-distance",
    answers: [
      { id: "distance-eight-03", label: "8 cm" },
      { id: "slanted-ten-03", label: "10 cm" },
      { id: "parallel-fourteen-03", label: "14 cm" }
    ]
  }),
  judgment({
    id: "g4s2-quad-04",
    unitId: "quadrilaterals",
    learnerStageId: "quad.parallel-side-distance",
    curriculumAnchorIds: ["[4수03-03]"],
    context: "직각 표시가 있는 곳만 직각입니다. 화살표 표시가 있는 변끼리만 서로 평행합니다.",
    prompt: "변 ㄴㄷ에서 변 ㄹㄱ까지 가장 짧게 잰 길이는 몇 cm일까요?",
    visual: {
      kind: "quadrilateral-figure",
      mode: "side-parallel-distance",
      vertices: [[5, 12], [0, 0], [18, 0], [9, 12]],
      parallelSidePairs: [[1, 3]],
      sideLengthLabels: [
        { sideIndex: 2, lengthCm: 15 },
        { sideIndex: 3, lengthCm: 4 }
      ],
      distanceSegment: {
        fromVertexIndex: 3,
        toSideIndex: 1,
        lengthCm: 12
      }
    },
    signalId: "quad.parallel-side-distance",
    answers: [
      { id: "distance-twelve-04", label: "12 cm" },
      { id: "slanted-fifteen-04", label: "15 cm" },
      { id: "parallel-four-04", label: "4 cm" }
    ]
  }),
  judgment({
    id: "g4s2-quad-05",
    unitId: "quadrilaterals",
    learnerStageId: "quad.trapezoid-parallel-pair",
    curriculumAnchorIds: ["[4수03-10]"],
    context: "화살표 표시가 있는 변끼리만 서로 평행합니다.",
    prompt: "평행한 변의 표시를 보고 이 사각형의 이름을 골라 보세요.",
    visual: {
      kind: "quadrilateral-figure",
      mode: "parallel-classify",
      vertices: [[5, 12], [0, 0], [20, 0], [11, 12]],
      parallelSidePairs: [[1, 3]]
    },
    signalId: "quad.trapezoid-parallel-pair",
    answers: [
      { id: "trapezoid-05", label: "사다리꼴" },
      { id: "parallelogram-05", label: "평행사변형" },
      { id: "rhombus-05", label: "마름모" }
    ]
  }),
  judgment({
    id: "g4s2-quad-06",
    unitId: "quadrilaterals",
    learnerStageId: "quad.trapezoid-parallel-pair",
    curriculumAnchorIds: ["[4수03-10]"],
    context: "화살표 표시가 있는 변끼리만 서로 평행합니다.",
    prompt: "도형을 돌려 놓아도 성질은 같습니다. 이 사각형의 이름을 골라 보세요.",
    visual: {
      kind: "quadrilateral-figure",
      mode: "parallel-classify",
      vertices: [[12, 17], [0, 22], [0, 0], [12, 9]],
      parallelSidePairs: [[1, 3]]
    },
    signalId: "quad.trapezoid-parallel-pair",
    answers: [
      { id: "trapezoid-06", label: "사다리꼴" },
      { id: "parallelogram-06", label: "평행사변형" },
      { id: "rhombus-06", label: "마름모" }
    ]
  }),
  judgment({
    id: "g4s2-quad-07",
    unitId: "quadrilaterals",
    learnerStageId: "quad.rhombus-equal-sides",
    curriculumAnchorIds: ["[4수03-10]"],
    context: "직각 표시가 있는 곳만 직각입니다. 같은 눈금이 있는 변끼리만 길이가 같습니다.",
    prompt: "네 변의 표시를 모두 확인하고 이 사각형의 이름을 골라 보세요.",
    visual: {
      kind: "quadrilateral-figure",
      mode: "equal-side-classify",
      vertices: [[0, 6], [10, 0], [20, 6], [10, 12]],
      equalSideGroups: [[0, 1, 2, 3]]
    },
    signalId: "quad.rhombus-equal-sides",
    answers: [
      { id: "rhombus-07", label: "마름모" },
      { id: "square-07", label: "정사각형" },
      { id: "rectangle-07", label: "직사각형" }
    ]
  }),
  judgment({
    id: "g4s2-quad-08",
    unitId: "quadrilaterals",
    learnerStageId: "quad.rhombus-equal-sides",
    curriculumAnchorIds: ["[4수03-10]"],
    context: "직각 표시가 있는 곳만 직각입니다. 같은 눈금이 있는 변끼리만 길이가 같습니다.",
    prompt: "모양이 길쭉해도 네 변의 성질은 같습니다. 이 사각형의 이름을 골라 보세요.",
    visual: {
      kind: "quadrilateral-figure",
      mode: "equal-side-classify",
      vertices: [[5, 24], [0, 12], [5, 0], [10, 12]],
      equalSideGroups: [[0, 1, 2, 3]]
    },
    signalId: "quad.rhombus-equal-sides",
    answers: [
      { id: "rhombus-08", label: "마름모" },
      { id: "square-08", label: "정사각형" },
      { id: "rectangle-08", label: "직사각형" }
    ]
  }),
  judgment({
    id: "g4s2-quad-09",
    unitId: "quadrilaterals",
    learnerStageId: "quad.parallelogram-opposite-angle",
    curriculumAnchorIds: ["[4수03-10]"],
    context: "화살표 표시가 있는 변끼리만 서로 평행합니다.",
    prompt: "평행사변형에서 마주 보는 각의 성질을 이용하면 ㉠은 몇 도일까요?",
    visual: {
      kind: "quadrilateral-figure",
      mode: "opposite-angle",
      parallelSidePairs: [[0, 2], [1, 3]],
      angles: [null, 70, null, null],
      askAngleIndex: 3
    },
    signalId: "quad.parallelogram-opposite-angle",
    answers: [
      { id: "opposite-seventy-09", label: "70°" },
      { id: "neighbor-one-ten-09", label: "110°" },
      { id: "all-right-ninety-09", label: "90°" }
    ]
  }),
  judgment({
    id: "g4s2-quad-10",
    unitId: "quadrilaterals",
    learnerStageId: "quad.parallelogram-opposite-angle",
    curriculumAnchorIds: ["[4수03-10]"],
    context: "화살표 표시가 있는 변끼리만 서로 평행합니다. 도형을 돌려 놓아도 마주 보는 각의 성질은 같습니다.",
    prompt: "115°와 마주 보는 ㉠의 크기는 몇 도일까요?",
    visual: {
      kind: "quadrilateral-figure",
      mode: "opposite-angle",
      parallelSidePairs: [[0, 2], [1, 3]],
      angles: [115, null, null, null],
      askAngleIndex: 2
    },
    signalId: "quad.parallelogram-opposite-angle",
    answers: [
      { id: "opposite-one-fifteen-10", label: "115°" },
      { id: "neighbor-sixty-five-10", label: "65°" },
      { id: "all-right-ninety-10", label: "90°" }
    ]
  }),
  judgment({
    id: "g4s2-dec-01",
    unitId: "decimal-add-subtract",
    learnerStageId: "decimal.read-write",
    curriculumAnchorIds: ["[4수01-13]"],
    prompt: "일 점 영 오 칠을 숫자로 바르게 쓴 것은 어느 것일까요?",
    visual: { kind: "none" },
    signalId: "decimal.read-write",
    answers: [
      { id: "one-point-zero-five-seven-01", label: "1.057" },
      { id: "one-point-five-seven-01", label: "1.57" },
      { id: "ten-point-five-seven-01", label: "10.57" }
    ]
  }),
  judgment({
    id: "g4s2-dec-02",
    unitId: "decimal-add-subtract",
    learnerStageId: "decimal.read-write",
    curriculumAnchorIds: ["[4수01-13]"],
    prompt: "3.009를 바르게 읽은 것은 어느 것일까요?",
    visual: { kind: "none" },
    signalId: "decimal.read-write",
    answers: [
      { id: "three-point-zero-zero-nine-02", label: "삼 점 영 영 구" },
      { id: "three-point-nine-02", label: "삼 점 구" },
      { id: "thirty-point-zero-nine-02", label: "삼십 점 영 구" }
    ]
  }),
  judgment({
    id: "g4s2-dec-03",
    unitId: "decimal-add-subtract",
    learnerStageId: "decimal.compose-place-value",
    curriculumAnchorIds: ["[4수01-13]"],
    prompt: "0.1이 3개, 0.01이 4개인 수는 얼마일까요?",
    visual: { kind: "none" },
    signalId: "decimal.compose-place-value",
    answers: [
      { id: "zero-point-three-four-03", label: "0.34" },
      { id: "zero-point-four-three-03", label: "0.43" },
      { id: "three-point-four-03", label: "3.4" }
    ]
  }),
  judgment({
    id: "g4s2-dec-04",
    unitId: "decimal-add-subtract",
    learnerStageId: "decimal.compose-place-value",
    curriculumAnchorIds: ["[4수01-13]"],
    context: "찰흙의 무게는 0.1 kg이 6개, 0.01 kg이 2개인 것과 같습니다.",
    prompt: "찰흙은 몇 kg일까요?",
    visual: { kind: "none" },
    signalId: "decimal.compose-place-value",
    answers: [
      { id: "zero-point-six-two-kilograms-04", label: "0.62 kg" },
      { id: "zero-point-two-six-kilograms-04", label: "0.26 kg" },
      { id: "six-point-two-kilograms-04", label: "6.2 kg" }
    ]
  }),
  judgment({
    id: "g4s2-dec-05",
    unitId: "decimal-add-subtract",
    learnerStageId: "decimal.compare",
    curriculumAnchorIds: ["[4수01-14]"],
    context: "1.25, 1.4, 0.98을 비교합니다.",
    prompt: "가장 큰 수는 어느 것일까요?",
    visual: { kind: "none" },
    signalId: "decimal.compare",
    answers: [
      { id: "one-point-four-05", label: "1.4" },
      { id: "one-point-two-five-05", label: "1.25" },
      { id: "zero-point-nine-eight-05", label: "0.98" }
    ]
  }),
  judgment({
    id: "g4s2-dec-06",
    unitId: "decimal-add-subtract",
    learnerStageId: "decimal.compare",
    curriculumAnchorIds: ["[4수01-14]"],
    context: "멀리뛰기 기록은 지호 2.7 m, 나연 2.65 m, 준서 1.98 m입니다.",
    prompt: "가장 멀리 뛴 사람은 누구일까요?",
    visual: { kind: "none" },
    signalId: "decimal.compare",
    answers: [
      { id: "jiho-06", label: "지호" },
      { id: "nayeon-06", label: "나연" },
      { id: "junseo-06", label: "준서" }
    ]
  }),
  judgment({
    id: "g4s2-dec-07",
    unitId: "decimal-add-subtract",
    learnerStageId: "decimal.add",
    curriculumAnchorIds: ["[4수01-16]"],
    prompt: "0.7 + 0.45는 얼마일까요?",
    visual: { kind: "none" },
    signalId: "decimal.add",
    answers: [
      { id: "one-point-one-five-07", label: "1.15" },
      { id: "zero-point-five-two-07", label: "0.52" },
      { id: "zero-point-one-five-07", label: "0.15" }
    ]
  }),
  judgment({
    id: "g4s2-dec-08",
    unitId: "decimal-add-subtract",
    learnerStageId: "decimal.add",
    curriculumAnchorIds: ["[4수01-16]"],
    context: "물통에 물이 0.85 L 있습니다. 여기에 0.6 L를 더 붓습니다.",
    prompt: "물은 모두 몇 L가 될까요?",
    visual: { kind: "none" },
    signalId: "decimal.add",
    answers: [
      { id: "one-point-four-five-liters-08", label: "1.45 L" },
      { id: "zero-point-nine-one-liters-08", label: "0.91 L" },
      { id: "zero-point-four-five-liters-08", label: "0.45 L" }
    ]
  }),
  judgment({
    id: "g4s2-dec-09",
    unitId: "decimal-add-subtract",
    learnerStageId: "decimal.subtract",
    curriculumAnchorIds: ["[4수01-16]"],
    prompt: "1.5 − 0.28은 얼마일까요?",
    visual: { kind: "none" },
    signalId: "decimal.subtract",
    answers: [
      { id: "one-point-two-two-09", label: "1.22" },
      { id: "one-point-three-eight-09", label: "1.38" },
      { id: "one-point-three-two-09", label: "1.32" }
    ]
  }),
  judgment({
    id: "g4s2-dec-10",
    unitId: "decimal-add-subtract",
    learnerStageId: "decimal.subtract",
    curriculumAnchorIds: ["[4수01-16]"],
    context: "리본 2.3 m에서 0.75 m를 사용했습니다.",
    prompt: "남은 리본은 몇 m일까요?",
    visual: { kind: "none" },
    signalId: "decimal.subtract",
    answers: [
      { id: "one-point-five-five-meters-10", label: "1.55 m" },
      { id: "two-point-four-five-meters-10", label: "2.45 m" },
      { id: "two-point-six-five-meters-10", label: "2.65 m" }
    ]
  }),
  judgment({
    id: "g4s2-poly-01",
    unitId: "polygons",
    learnerStageId: "polygon.identify-closed-straight",
    curriculumAnchorIds: ["[4수03-11]"],
    context: "세 모양의 선을 끝까지 따라가며 살펴보세요.",
    prompt: "가, 나, 다 중에서 다각형을 골라 보세요.",
    visual: {
      kind: "polygon-figure",
      mode: "polygon-select",
      candidates: [
        {
          id: "가",
          figure: {
            form: "curved",
            vertices: [[1, 1], [8, 1], [10, 5], [6, 9], [1, 6]],
            curvedSideIndex: 2
          }
        },
        {
          id: "나",
          figure: {
            form: "lattice",
            vertices: [[1, 1], [8, 1], [10, 5], [6, 9], [1, 6]]
          }
        },
        {
          id: "다",
          figure: {
            form: "open",
            vertices: [[1, 1], [8, 1], [10, 5], [6, 9], [1, 6], [3, 3]]
          }
        }
      ]
    },
    signalId: "polygon.identify-closed-straight",
    answers: [
      { id: "closed-straight-na-01", label: "나 도형" },
      { id: "curved-ga-01", label: "가 도형" },
      { id: "open-da-01", label: "다 도형" }
    ]
  }),
  judgment({
    id: "g4s2-poly-02",
    unitId: "polygons",
    learnerStageId: "polygon.identify-closed-straight",
    curriculumAnchorIds: ["[4수03-11]"],
    context: "들어간 곳이 있어도 선의 모양과 이어진 곳을 모두 살펴보세요.",
    prompt: "가, 나, 다 중에서 다각형을 골라 보세요.",
    visual: {
      kind: "polygon-figure",
      mode: "polygon-select",
      candidates: [
        {
          id: "가",
          figure: {
            form: "open",
            vertices: [[1, 1], [9, 1], [9, 7], [6, 5], [4, 9], [1, 7], [3, 4]]
          }
        },
        {
          id: "나",
          figure: {
            form: "curved",
            vertices: [[1, 1], [9, 1], [9, 7], [6, 5], [4, 9], [1, 7]],
            curvedSideIndex: 4
          }
        },
        {
          id: "다",
          figure: {
            form: "lattice",
            vertices: [[1, 1], [9, 1], [9, 7], [6, 5], [4, 9], [1, 7]]
          }
        }
      ]
    },
    signalId: "polygon.identify-closed-straight",
    answers: [
      { id: "closed-straight-da-02", label: "다 도형" },
      { id: "open-ga-02", label: "가 도형" },
      { id: "curved-na-02", label: "나 도형" }
    ]
  }),
  judgment({
    id: "g4s2-poly-03",
    unitId: "polygons",
    learnerStageId: "polygon.name-by-side-count",
    curriculumAnchorIds: ["[4수03-11]"],
    context: "한 꼭짓점에서 시작해 변을 한 바퀴 따라가며 세어 보세요.",
    prompt: "이 다각형의 이름은 무엇일까요?",
    visual: {
      kind: "polygon-figure",
      mode: "side-count-name",
      figure: {
        form: "lattice",
        vertices: [[2, 1], [10, 2], [8, 5], [10, 9], [4, 10], [1, 6]]
      }
    },
    signalId: "polygon.name-by-side-count",
    answers: [
      { id: "hexagon-concave-03", label: "육각형" },
      { id: "pentagon-missed-notch-03", label: "오각형" },
      { id: "heptagon-extra-corner-03", label: "칠각형" }
    ]
  }),
  judgment({
    id: "g4s2-poly-04",
    unitId: "polygons",
    learnerStageId: "polygon.name-by-side-count",
    curriculumAnchorIds: ["[4수03-11]"],
    context: "변의 길이가 달라도 변의 수로 이름을 정합니다.",
    prompt: "이 다각형의 이름은 무엇일까요?",
    visual: {
      kind: "polygon-figure",
      mode: "side-count-name",
      figure: {
        form: "lattice",
        vertices: [[0, 0], [10, 0], [10, 6], [5, 3], [0, 6]]
      }
    },
    signalId: "polygon.name-by-side-count",
    answers: [
      { id: "pentagon-concave-04", label: "오각형" },
      { id: "quadrilateral-missed-notch-04", label: "사각형" },
      { id: "hexagon-extra-corner-04", label: "육각형" }
    ]
  }),
  judgment({
    id: "g4s2-poly-05",
    unitId: "polygons",
    learnerStageId: "polygon.regular-two-conditions",
    curriculumAnchorIds: ["[4수03-11]"],
    context: "세 도형에 있는 표시를 하나씩 살펴보세요.",
    prompt: "정다각형을 골라 보세요.",
    visual: {
      kind: "polygon-figure",
      mode: "regular-select",
      candidates: [
        {
          id: "가",
          figure: {
            form: "lattice",
            vertices: [[0, 3], [4, 6], [8, 3], [4, 0]]
          }
        },
        {
          id: "나",
          figure: {
            form: "equiangular",
            sideCount: 4,
            sideLengths: [9, 4, 9, 4]
          }
        },
        {
          id: "다",
          figure: { form: "regular", sideCount: 4, rotationDegrees: 20 }
        }
      ]
    },
    signalId: "polygon.regular-two-conditions",
    answers: [
      { id: "regular-da-05", label: "다 도형" },
      { id: "equal-sides-only-ga-05", label: "가 도형" },
      { id: "equal-angles-only-na-05", label: "나 도형" }
    ]
  }),
  judgment({
    id: "g4s2-poly-06",
    unitId: "polygons",
    learnerStageId: "polygon.regular-two-conditions",
    curriculumAnchorIds: ["[4수03-11]"],
    context: "세 도형의 표시를 하나씩 비교해 보세요.",
    prompt: "정다각형인 도형은 어느 것일까요?",
    visual: {
      kind: "polygon-figure",
      mode: "regular-select",
      candidates: [
        {
          id: "가",
          figure: { form: "regular", sideCount: 6, rotationDegrees: 0 }
        },
        {
          id: "나",
          figure: {
            form: "lattice",
            vertices: [[3, 0], [8, 0], [11, 4], [8, 8], [3, 8], [0, 4]]
          }
        },
        {
          id: "다",
          figure: {
            form: "equiangular",
            sideCount: 6,
            sideLengths: [2, 3, 2, 3, 2, 3]
          }
        }
      ]
    },
    signalId: "polygon.regular-two-conditions",
    answers: [
      { id: "regular-ga-06", label: "가 도형" },
      { id: "equal-sides-only-na-06", label: "나 도형" },
      { id: "equal-angles-only-da-06", label: "다 도형" }
    ]
  }),
  judgment({
    id: "g4s2-poly-07",
    unitId: "polygons",
    learnerStageId: "polygon.fill-remaining-space",
    curriculumAnchorIds: ["[4수03-12]"],
    context: "색칠된 마름모 조각은 이미 놓여 있습니다.",
    prompt: "남은 자리를 빈틈없이 채울 수 있는 조각 묶음을 골라 보세요.",
    visual: {
      kind: "tile-composition",
      mode: "fill-remaining",
      board: [
        [0, 1, "up"], [0, 1, "down"],
        [1, 1, "up"], [1, 1, "down"], [1, 2, "up"], [2, 1, "up"]
      ],
      placed: [{
        piece: "rhombus",
        cells: [[0, 1, "up"], [0, 1, "down"]]
      }],
      candidates: [
        { id: "가", pieces: ["rhombus", "rhombus"] },
        { id: "나", pieces: ["trapezoid", "triangle"] },
        { id: "다", pieces: ["triangle", "triangle"] }
      ]
    },
    signalId: "polygon.fill-remaining-space",
    answers: [
      { id: "trapezoid-triangle-na-07", label: "나 묶음" },
      { id: "two-rhombi-ga-07", label: "가 묶음" },
      { id: "two-triangles-da-07", label: "다 묶음" }
    ]
  }),
  judgment({
    id: "g4s2-poly-08",
    unitId: "polygons",
    learnerStageId: "polygon.fill-remaining-space",
    curriculumAnchorIds: ["[4수03-12]"],
    context: "색칠된 마름모 옆의 남은 자리를 살펴보세요.",
    prompt: "가, 나, 다 중에서 남은 모양과 꼭 맞는 조각 묶음은 어느 것일까요?",
    visual: {
      kind: "tile-composition",
      mode: "fill-remaining",
      board: [
        [1, 1, "up"], [1, 1, "down"], [1, 2, "up"],
        [1, 2, "down"], [2, 1, "up"], [2, 2, "up"],
        [1, 3, "up"], [1, 3, "down"]
      ],
      placed: [{
        piece: "rhombus",
        cells: [[1, 3, "up"], [1, 3, "down"]]
      }],
      candidates: [
        { id: "가", pieces: ["trapezoid", "trapezoid"] },
        { id: "나", pieces: ["rhombus", "rhombus", "rhombus"] },
        { id: "다", pieces: ["rhombus", "rhombus"] }
      ]
    },
    signalId: "polygon.fill-remaining-space",
    answers: [
      { id: "two-trapezoids-ga-08", label: "가 묶음" },
      { id: "three-rhombi-na-08", label: "나 묶음" },
      { id: "two-rhombi-da-08", label: "다 묶음" }
    ]
  }),
  judgment({
    id: "g4s2-poly-09",
    unitId: "polygons",
    learnerStageId: "polygon.tile-count-pieces",
    curriculumAnchorIds: ["[4수03-12]"],
    context: "작은 삼각형 2칸이 마름모 조각 1개입니다.",
    prompt: "큰 모양을 마름모 조각으로 채우려면 몇 개가 필요할까요?",
    visual: {
      kind: "tile-composition",
      mode: "tile-count",
      region: [
        [2, 1, "down"], [2, 1, "up"],
        [3, 1, "down"], [3, 1, "up"],
        [2, 2, "down"], [2, 2, "up"],
        [3, 2, "down"], [3, 2, "up"],
        [2, 3, "down"], [2, 3, "up"],
        [3, 3, "down"], [3, 3, "up"]
      ],
      piece: "rhombus"
    },
    signalId: "polygon.tile-count-pieces",
    answers: [
      { id: "six-rhombi-09", label: "6개" },
      { id: "three-large-groups-09", label: "3개" },
      { id: "twelve-rhombi-09", label: "12개" }
    ]
  }),
  judgment({
    id: "g4s2-poly-10",
    unitId: "polygons",
    learnerStageId: "polygon.tile-count-pieces",
    curriculumAnchorIds: ["[4수03-12]"],
    context: "작은 삼각형 3칸이 사다리꼴 조각 1개입니다.",
    prompt: "큰 모양을 사다리꼴 조각으로 채우려면 몇 개가 필요할까요?",
    visual: {
      kind: "tile-composition",
      mode: "tile-count",
      region: [
        [2, 1, "up"], [2, 1, "down"], [3, 1, "up"],
        [2, 2, "up"], [2, 2, "down"], [3, 2, "up"],
        [2, 3, "up"], [2, 3, "down"], [3, 3, "up"],
        [4, 3, "down"], [4, 3, "up"], [3, 3, "down"]
      ],
      piece: "trapezoid"
    },
    signalId: "polygon.tile-count-pieces",
    answers: [
      { id: "four-trapezoids-10", label: "4개" },
      { id: "two-trapezoids-10", label: "2개" },
      { id: "twelve-trapezoids-10", label: "12개" }
    ]
  }),
  judgment({
    id: "g4s2-line-01",
    unitId: "line-graphs",
    learnerStageId: "line-graph.tick-unit",
    curriculumAnchorIds: ["[4수04-02]"],
    context: "교실의 기온을 두 시간마다 재어 나타냈습니다.",
    prompt: "세로 눈금 한 칸은 몇 도를 나타낼까요?",
    visual: {
      kind: "line-chart-diagram",
      mode: "tick-unit",
      axis: {
        unitLabel: "도",
        baselineValue: 0,
        tickCount: 6,
        labeledTicks: [{ index: 0, value: 0 }, { index: 6, value: 18 }]
      },
      timeAxis: { label: "시각", categories: ["오전 8시", "오전 10시", "낮 12시", "오후 2시"] },
      points: [
        { categoryIndex: 0, tick: 2 },
        { categoryIndex: 1, tick: 3 },
        { categoryIndex: 2, tick: 5 },
        { categoryIndex: 3, tick: 4 }
      ]
    },
    signalId: "line-graph.tick-unit",
    answers: [
      { id: "three-degrees-01", label: "3도" },
      { id: "one-degree-01", label: "1도" },
      { id: "six-degrees-01", label: "6도" }
    ]
  }),
  judgment({
    id: "g4s2-line-02",
    unitId: "line-graphs",
    learnerStageId: "line-graph.tick-unit",
    curriculumAnchorIds: ["[4수04-02]"],
    context: "저수지의 물 높이를 석 달마다 재었습니다. 물결선 아래는 줄여서 나타냈습니다.",
    prompt: "세로 눈금 한 칸은 몇 센티미터를 나타낼까요?",
    visual: {
      kind: "line-chart-diagram",
      mode: "tick-unit",
      axis: {
        unitLabel: "cm",
        baselineValue: 20,
        tickCount: 5,
        labeledTicks: [{ index: 0, value: 20 }, { index: 5, value: 60 }]
      },
      timeAxis: { label: "달", categories: ["3월", "6월", "9월", "12월"] },
      points: [
        { categoryIndex: 0, tick: 1 },
        { categoryIndex: 1, tick: 2 },
        { categoryIndex: 2, tick: 4 },
        { categoryIndex: 3, tick: 3 }
      ]
    },
    signalId: "line-graph.tick-unit",
    answers: [
      { id: "eight-centimeters-02", label: "8 cm" },
      { id: "one-centimeter-02", label: "1 cm" },
      { id: "five-centimeters-02", label: "5 cm" }
    ]
  }),
  judgment({
    id: "g4s2-line-03",
    unitId: "line-graphs",
    learnerStageId: "line-graph.point-value",
    curriculumAnchorIds: ["[4수04-02]"],
    context: "운동장의 기온을 두 시간마다 재어 나타냈습니다.",
    prompt: "오후 3시의 기온은 몇 도일까요?",
    visual: {
      kind: "line-chart-diagram",
      mode: "point-value",
      axis: {
        unitLabel: "도",
        baselineValue: 0,
        tickCount: 5,
        labeledTicks: [{ index: 0, value: 0 }, { index: 5, value: 25 }]
      },
      timeAxis: { label: "시각", categories: ["오전 9시", "오전 11시", "오후 1시", "오후 3시", "오후 5시"] },
      points: [
        { categoryIndex: 0, tick: 2 },
        { categoryIndex: 1, tick: 3 },
        { categoryIndex: 2, tick: 5 },
        { categoryIndex: 3, tick: 4 },
        { categoryIndex: 4, tick: 3 }
      ],
      target: { kind: "point", categoryIndex: 3 }
    },
    signalId: "line-graph.point-value",
    answers: [
      { id: "twenty-degrees-03", label: "20도" },
      { id: "four-degrees-03", label: "4도" },
      { id: "fifteen-degrees-03", label: "15도" }
    ]
  }),
  judgment({
    id: "g4s2-line-04",
    unitId: "line-graphs",
    learnerStageId: "line-graph.point-value",
    curriculumAnchorIds: ["[4수04-02]"],
    context: "한 달 동안 매주 가장 높은 기온을 나타냈습니다. 물결선 아래는 줄여서 나타냈습니다.",
    prompt: "넷째 주의 가장 높은 기온은 몇 도일까요?",
    visual: {
      kind: "line-chart-diagram",
      mode: "point-value",
      axis: {
        unitLabel: "도",
        baselineValue: 4,
        tickCount: 10,
        labeledTicks: [{ index: 0, value: 4 }, { index: 10, value: 24 }]
      },
      timeAxis: { label: "주", categories: ["첫째 주", "둘째 주", "셋째 주", "넷째 주", "다섯째 주"] },
      points: [
        { categoryIndex: 0, tick: 1 },
        { categoryIndex: 1, tick: 3 },
        { categoryIndex: 2, tick: 9 },
        { categoryIndex: 3, tick: 6 },
        { categoryIndex: 4, tick: 4 }
      ],
      target: { kind: "point", categoryIndex: 3 }
    },
    signalId: "line-graph.point-value",
    answers: [
      { id: "sixteen-degrees-04", label: "16도" },
      { id: "six-degrees-04", label: "6도" },
      { id: "twenty-two-degrees-04", label: "22도" }
    ]
  }),
  judgment({
    id: "g4s2-line-05",
    unitId: "line-graphs",
    learnerStageId: "line-graph.step-change",
    curriculumAnchorIds: ["[4수04-02]"],
    context: "수조의 물 온도를 한 시간마다 재어 나타냈습니다.",
    prompt: "오전 10시부터 오전 11시까지 물 온도는 몇 도 변했을까요?",
    visual: {
      kind: "line-chart-diagram",
      mode: "step-change",
      axis: {
        unitLabel: "도",
        baselineValue: 0,
        tickCount: 7,
        labeledTicks: [{ index: 0, value: 0 }, { index: 7, value: 35 }]
      },
      timeAxis: { label: "시각", categories: ["오전 9시", "오전 10시", "오전 11시", "낮 12시"] },
      points: [
        { categoryIndex: 0, tick: 1 },
        { categoryIndex: 1, tick: 2 },
        { categoryIndex: 2, tick: 6 },
        { categoryIndex: 3, tick: 3 }
      ],
      target: { kind: "interval", fromIndex: 1, toIndex: 2 }
    },
    signalId: "line-graph.step-change",
    answers: [
      { id: "twenty-degrees-05", label: "20도" },
      { id: "four-degrees-05", label: "4도" },
      { id: "thirty-degrees-05", label: "30도" }
    ]
  }),
  judgment({
    id: "g4s2-line-06",
    unitId: "line-graphs",
    learnerStageId: "line-graph.step-change",
    curriculumAnchorIds: ["[4수04-02]"],
    context: "식어 가는 물의 온도를 10분마다 재어 나타냈습니다.",
    prompt: "15분부터 25분까지 물 온도는 몇 도 낮아졌을까요?",
    visual: {
      kind: "line-chart-diagram",
      mode: "step-change",
      axis: {
        unitLabel: "도",
        baselineValue: 0,
        tickCount: 8,
        labeledTicks: [{ index: 0, value: 0 }, { index: 8, value: 80 }]
      },
      timeAxis: { label: "지난 시간", categories: ["5분", "15분", "25분", "35분", "45분"] },
      points: [
        { categoryIndex: 0, tick: 8 },
        { categoryIndex: 1, tick: 7 },
        { categoryIndex: 2, tick: 3 },
        { categoryIndex: 3, tick: 2 },
        { categoryIndex: 4, tick: 1 }
      ],
      target: { kind: "interval", fromIndex: 1, toIndex: 2 }
    },
    signalId: "line-graph.step-change",
    answers: [
      { id: "forty-degrees-06", label: "40도" },
      { id: "four-degrees-06", label: "4도" },
      { id: "thirty-degrees-06", label: "30도" }
    ]
  }),
  judgment({
    id: "g4s2-line-07",
    unitId: "line-graphs",
    learnerStageId: "line-graph.largest-rise",
    curriculumAnchorIds: ["[4수04-02]", "[4수04-03]"],
    context: "하루 동안 세 시간마다 기온을 재어 나타냈습니다.",
    prompt: "기온이 가장 크게 올라간 때는 언제부터 언제까지일까요?",
    visual: {
      kind: "line-chart-diagram",
      mode: "largest-rise",
      axis: {
        unitLabel: "도",
        baselineValue: 0,
        tickCount: 7,
        labeledTicks: [{ index: 0, value: 0 }, { index: 7, value: 28 }]
      },
      timeAxis: { label: "시각", categories: ["오전 6시", "오전 9시", "낮 12시", "오후 3시", "오후 6시"] },
      points: [
        { categoryIndex: 0, tick: 2 },
        { categoryIndex: 1, tick: 3 },
        { categoryIndex: 2, tick: 6 },
        { categoryIndex: 3, tick: 7 },
        { categoryIndex: 4, tick: 2 }
      ],
      target: { kind: "interval", fromIndex: 1, toIndex: 2 }
    },
    signalId: "line-graph.largest-rise",
    answers: [
      { id: "nine-to-noon-07", label: "오전 9시부터 낮 12시까지" },
      { id: "three-to-six-07", label: "오후 3시부터 오후 6시까지" },
      { id: "noon-to-three-07", label: "낮 12시부터 오후 3시까지" }
    ]
  }),
  judgment({
    id: "g4s2-line-08",
    unitId: "line-graphs",
    learnerStageId: "line-graph.largest-rise",
    curriculumAnchorIds: ["[4수04-02]", "[4수04-03]"],
    context: "저수지의 물 높이를 달마다 재었습니다. 물결선 아래는 줄여서 나타냈습니다.",
    prompt: "물 높이가 가장 크게 올라간 때는 언제부터 언제까지일까요?",
    visual: {
      kind: "line-chart-diagram",
      mode: "largest-rise",
      axis: {
        unitLabel: "cm",
        baselineValue: 20,
        tickCount: 6,
        labeledTicks: [{ index: 0, value: 20 }, { index: 6, value: 50 }]
      },
      timeAxis: { label: "달", categories: ["3월", "4월", "5월", "6월", "7월", "8월"] },
      points: [
        { categoryIndex: 0, tick: 1 },
        { categoryIndex: 1, tick: 2 },
        { categoryIndex: 2, tick: 1 },
        { categoryIndex: 3, tick: 5 },
        { categoryIndex: 4, tick: 6 },
        { categoryIndex: 5, tick: 1 }
      ],
      target: { kind: "interval", fromIndex: 2, toIndex: 3 }
    },
    signalId: "line-graph.largest-rise",
    answers: [
      { id: "may-to-june-08", label: "5월부터 6월까지" },
      { id: "july-to-august-08", label: "7월부터 8월까지" },
      { id: "june-to-july-08", label: "6월부터 7월까지" }
    ]
  }),
  judgment({
    id: "g4s2-line-09",
    unitId: "line-graphs",
    learnerStageId: "line-graph.between-estimate",
    curriculumAnchorIds: ["[4수04-02]", "[4수04-03]"],
    context: "기온을 두 시간마다 재어 점을 찍고 선으로 이었습니다.",
    prompt: "오전 10시의 기온은 약 몇 도일까요?",
    visual: {
      kind: "line-chart-diagram",
      mode: "between-estimate",
      axis: {
        unitLabel: "도",
        baselineValue: 0,
        tickCount: 6,
        labeledTicks: [{ index: 0, value: 0 }, { index: 6, value: 18 }]
      },
      timeAxis: { label: "시각", categories: ["오전 7시", "오전 9시", "오전 11시", "오후 1시"] },
      points: [
        { categoryIndex: 0, tick: 2 },
        { categoryIndex: 1, tick: 3 },
        { categoryIndex: 2, tick: 5 },
        { categoryIndex: 3, tick: 2 }
      ],
      target: { kind: "midpoint", fromIndex: 1, toIndex: 2 }
    },
    signalId: "line-graph.between-estimate",
    answers: [
      { id: "about-twelve-degrees-09", label: "약 12도" },
      { id: "about-nine-degrees-09", label: "약 9도" },
      { id: "about-four-degrees-09", label: "약 4도" }
    ]
  }),
  judgment({
    id: "g4s2-line-10",
    unitId: "line-graphs",
    learnerStageId: "line-graph.between-estimate",
    curriculumAnchorIds: ["[4수04-02]", "[4수04-03]"],
    context: "물이 식는 동안 20분마다 온도를 재어 점을 찍고 선으로 이었습니다. 물결선 아래는 줄여서 나타냈습니다.",
    prompt: "처음부터 30분 뒤의 물 온도는 약 몇 도일까요?",
    visual: {
      kind: "line-chart-diagram",
      mode: "between-estimate",
      axis: {
        unitLabel: "도",
        baselineValue: 10,
        tickCount: 4,
        labeledTicks: [{ index: 0, value: 10 }, { index: 4, value: 90 }]
      },
      timeAxis: { label: "지난 시간", categories: ["처음", "20분", "40분", "60분", "80분"] },
      points: [
        { categoryIndex: 0, tick: 4 },
        { categoryIndex: 1, tick: 3 },
        { categoryIndex: 2, tick: 1 },
        { categoryIndex: 3, tick: 1 },
        { categoryIndex: 4, tick: 1 }
      ],
      target: { kind: "midpoint", fromIndex: 1, toIndex: 2 }
    },
    signalId: "line-graph.between-estimate",
    answers: [
      { id: "about-fifty-degrees-10", label: "약 50도" },
      { id: "about-seventy-degrees-10", label: "약 70도" },
      { id: "about-two-degrees-10", label: "약 2도" }
    ]
  })
];

const unsigned: DiagnosisSet = {
  manifest: {
    id: "grade4-semester2",
    version: "1.4.0",
    checksum: "d61e9778e63adf96c492ba8306c7f8b256b15d6d45ba4bbcbe62286647166cb5",
    title: "4학년 2학기 수학 생각 지도",
    shortTitle: "4-2 수학 생각 지도",
    grade: 4,
    semester: 2,
    curriculum: "2022-revised",
    status: "review",
    units: [
      { id: "triangles", order: 1, title: "삼각형" },
      {
        id: "fraction-add-subtract",
        order: 2,
        title: "분수의 덧셈과 뺄셈"
      },
      { id: "quadrilaterals", order: 3, title: "사각형" },
      {
        id: "decimal-add-subtract",
        order: 4,
        title: "소수의 덧셈과 뺄셈"
      },
      { id: "polygons", order: 5, title: "다각형" },
      { id: "line-graphs", order: 6, title: "꺾은선그래프" }
    ],
    interactionTypes: [{ type: "choice", version: 1 }],
    estimatedMinutes: 30
  },
  curriculumAnchors: [
    grade4Semester2Anchor("[4수03-08]"),
    grade4Semester2Anchor("[4수03-09]"),
    grade4Semester2Anchor("[4수01-15]"),
    grade4Semester2Anchor("[4수03-03]"),
    grade4Semester2Anchor("[4수03-10]"),
    grade4Semester2Anchor("[4수01-13]"),
    grade4Semester2Anchor("[4수01-14]"),
    grade4Semester2Anchor("[4수01-16]"),
    grade4Semester2Anchor("[4수03-11]"),
    grade4Semester2Anchor("[4수03-12]"),
    grade4Semester2Anchor("[4수04-02]"),
    grade4Semester1Anchor("[4수04-03]")
  ],
  learnerStages: stages,
  signals,
  judgments
};

export const grade4Semester2Diagnosis =
  diagnosisSetSchema.parse(unsigned) as DiagnosisSet;
