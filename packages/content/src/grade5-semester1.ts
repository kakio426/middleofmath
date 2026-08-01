import type {
  DiagnosisSet,
  Judgment,
  SignalDefinition
} from "@middle-of-math/domain";
import { grade5Semester1Anchor } from "./curriculum-anchor-registry";
import { diagnosisSetSchema } from "./schema";

type Answer = { id: string; label: string; signalIds?: string[] };
type JudgmentInput = Omit<Judgment, "choices" | "interaction"> & {
  signalId: string;
  answers: Answer[];
};

function judgment(input: JudgmentInput): Judgment {
  const { signalId, answers, ...rest } = input;
  return {
    ...rest,
    interaction: { type: "choice", version: 1 },
    choices: answers.map((answer, index) => {
      const { signalIds, ...choice } = answer;
      return {
        ...choice,
        correct: index === 0,
        ...(index === 0 ? {} : { signalIds: signalIds ?? [signalId] })
      };
    })
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
    id: "mixed-operations.multiply-first",
    order: 1,
    unitId: "mixed-operations",
    title: "덧셈·뺄셈보다 곱셈 먼저 계산하기",
    shortTitle: "곱셈을 먼저 계산함",
    curriculumAnchorIds: ["[6수01-01]"],
    prerequisiteStageIds: []
  },
  {
    id: "mixed-operations.divide-first",
    order: 2,
    unitId: "mixed-operations",
    title: "덧셈·뺄셈보다 나눗셈 먼저 계산하기",
    shortTitle: "나눗셈을 먼저 계산함",
    curriculumAnchorIds: ["[6수01-01]"],
    prerequisiteStageIds: []
  },
  {
    id: "mixed-operations.same-rank-left-to-right",
    order: 3,
    unitId: "mixed-operations",
    title: "같은 순위의 계산을 왼쪽부터 하기",
    shortTitle: "같은 순위는 왼쪽부터 계산함",
    curriculumAnchorIds: ["[6수01-01]"],
    prerequisiteStageIds: [
      "mixed-operations.multiply-first",
      "mixed-operations.divide-first"
    ]
  },
  {
    id: "mixed-operations.parentheses-first",
    order: 4,
    unitId: "mixed-operations",
    title: "괄호 안을 먼저 계산하기",
    shortTitle: "괄호 안을 먼저 계산함",
    curriculumAnchorIds: ["[6수01-01]"],
    prerequisiteStageIds: []
  },
  {
    id: "mixed-operations.full-order",
    order: 5,
    unitId: "mixed-operations",
    title: "괄호와 곱셈·나눗셈을 순서에 맞게 계산하기",
    shortTitle: "전체 계산 순서를 적용함",
    curriculumAnchorIds: ["[6수01-01]"],
    prerequisiteStageIds: [
      "mixed-operations.multiply-first",
      "mixed-operations.divide-first",
      "mixed-operations.same-rank-left-to-right",
      "mixed-operations.parentheses-first"
    ]
  },
  {
    id: "factors.list-divisors",
    order: 6,
    unitId: "factors-multiples",
    title: "나누어떨어지는 수를 빠짐없이 찾아 약수 쓰기",
    shortTitle: "약수를 빠짐없이 찾음",
    curriculumAnchorIds: ["[6수01-04]"],
    prerequisiteStageIds: []
  },
  {
    id: "factors.common-and-greatest",
    order: 7,
    unitId: "factors-multiples",
    title: "두 수의 공약수와 최대공약수 찾기",
    shortTitle: "공약수와 최대공약수를 찾음",
    curriculumAnchorIds: ["[6수01-04]"],
    prerequisiteStageIds: ["factors.list-divisors"]
  },
  {
    id: "multiples.list-multiples",
    order: 8,
    unitId: "factors-multiples",
    title: "1배부터 차례로 곱해 배수 쓰기",
    shortTitle: "배수를 차례로 찾음",
    curriculumAnchorIds: ["[6수01-05]"],
    prerequisiteStageIds: []
  },
  {
    id: "multiples.common-and-least",
    order: 9,
    unitId: "factors-multiples",
    title: "두 수의 공배수와 최소공배수 찾기",
    shortTitle: "공배수와 최소공배수를 찾음",
    curriculumAnchorIds: ["[6수01-05]"],
    prerequisiteStageIds: ["multiples.list-multiples"]
  },
  {
    id: "factors-multiples.apply-in-context",
    order: 10,
    unitId: "factors-multiples",
    title: "나누어 담기와 다시 만나는 때에 알맞게 적용하기",
    shortTitle: "상황에 알맞은 방법을 고름",
    curriculumAnchorIds: ["[6수01-04]", "[6수01-05]"],
    prerequisiteStageIds: [
      "factors.common-and-greatest",
      "multiples.common-and-least"
    ]
  },
  {
    id: "correspondence.pair-from-table",
    order: 11,
    unitId: "correspondence",
    title: "대응표의 두 양을 함께 보고 새로운 짝 찾기",
    shortTitle: "대응표에서 새로운 짝을 찾음",
    curriculumAnchorIds: ["[6수02-01]"],
    prerequisiteStageIds: []
  },
  {
    id: "correspondence.symbol-expression",
    order: 12,
    unitId: "correspondence",
    title: "대응표의 규칙을 □와 △를 사용한 식으로 나타내기",
    shortTitle: "대응 규칙을 기호식으로 나타냄",
    curriculumAnchorIds: ["[6수02-01]"],
    prerequisiteStageIds: ["correspondence.pair-from-table"]
  },
  {
    id: "correspondence.base-and-dependent",
    order: 13,
    unitId: "correspondence",
    title: "□에 따라 정해지는 △를 구하는 식 찾기",
    shortTitle: "두 양의 계산 방향을 구별함",
    curriculumAnchorIds: ["[6수02-01]"],
    prerequisiteStageIds: ["correspondence.symbol-expression"]
  },
  {
    id: "correspondence.apply-backward",
    order: 14,
    unitId: "correspondence",
    title: "기호식을 거꾸로 사용해 □의 값 찾기",
    shortTitle: "기호식을 거꾸로 적용함",
    curriculumAnchorIds: ["[6수02-01]"],
    prerequisiteStageIds: ["correspondence.symbol-expression"]
  },
  {
    id: "correspondence.change-together",
    order: 15,
    unitId: "correspondence",
    title: "한 양이 변할 때 다른 양의 변화량 찾기",
    shortTitle: "두 양의 변화를 함께 살핌",
    curriculumAnchorIds: ["[6수02-01]"],
    prerequisiteStageIds: ["correspondence.pair-from-table"]
  },
  {
    id: "frac-equiv.multiply-both",
    order: 16,
    unitId: "fraction-reduction-common-denominator",
    title: "분자와 분모에 같은 수를 곱해 크기가 같은 분수 만들기",
    shortTitle: "같은 수를 곱해 동치분수를 만듦",
    curriculumAnchorIds: ["[6수01-06]"],
    prerequisiteStageIds: []
  },
  {
    id: "frac-equiv.divide-both",
    order: 17,
    unitId: "fraction-reduction-common-denominator",
    title: "분자와 분모를 같은 수로 나누어 약분하기",
    shortTitle: "같은 수로 나누어 약분함",
    curriculumAnchorIds: ["[6수01-06]"],
    prerequisiteStageIds: []
  },
  {
    id: "frac-equiv.simplest-form",
    order: 18,
    unitId: "fraction-reduction-common-denominator",
    title: "더 이상 약분할 수 없는 기약분수로 나타내기",
    shortTitle: "기약분수로 끝까지 약분함",
    curriculumAnchorIds: ["[6수01-06]"],
    prerequisiteStageIds: [
      "frac-equiv.divide-both",
      "factors.common-and-greatest"
    ]
  },
  {
    id: "frac-equiv.common-denominator",
    order: 19,
    unitId: "fraction-reduction-common-denominator",
    title: "두 분수의 분모를 공통분모로 통분하기",
    shortTitle: "공통분모로 통분함",
    curriculumAnchorIds: ["[6수01-06]"],
    prerequisiteStageIds: [
      "frac-equiv.multiply-both",
      "multiples.common-and-least"
    ]
  },
  {
    id: "frac-compare.different-denominator",
    order: 20,
    unitId: "fraction-reduction-common-denominator",
    title: "분모가 다른 분수의 크기 비교하기",
    shortTitle: "분모가 다른 분수를 비교함",
    curriculumAnchorIds: ["[6수01-07]"],
    prerequisiteStageIds: ["frac-equiv.common-denominator"]
  },
  {
    id: "frac-decimal.convert",
    order: 21,
    unitId: "fraction-reduction-common-denominator",
    title: "분수와 소수를 서로 바꾸어 나타내기",
    shortTitle: "분수와 소수를 서로 바꿈",
    curriculumAnchorIds: ["[6수01-12]"],
    prerequisiteStageIds: ["frac-equiv.multiply-both"]
  },
  {
    id: "frac-decimal.compare",
    order: 22,
    unitId: "fraction-reduction-common-denominator",
    title: "분수와 소수의 크기 비교하기",
    shortTitle: "분수와 소수의 크기를 비교함",
    curriculumAnchorIds: ["[6수01-12]"],
    prerequisiteStageIds: [
      "frac-decimal.convert",
      "frac-compare.different-denominator"
    ]
  },
  {
    id: "fa.add-unlike",
    order: 23,
    unitId: "fraction-add-subtract",
    title: "분모가 다른 진분수 더하기",
    shortTitle: "통분하여 진분수를 더함",
    curriculumAnchorIds: ["[6수01-08]"],
    prerequisiteStageIds: ["frac-equiv.common-denominator"]
  },
  {
    id: "fa.sub-unlike",
    order: 24,
    unitId: "fraction-add-subtract",
    title: "분모가 다른 진분수 빼기",
    shortTitle: "통분하여 진분수를 뺌",
    curriculumAnchorIds: ["[6수01-08]"],
    prerequisiteStageIds: ["frac-equiv.common-denominator"]
  },
  {
    id: "fa.reduce-result",
    order: 25,
    unitId: "fraction-add-subtract",
    title: "계산 결과를 기약분수로 나타내기",
    shortTitle: "계산 결과를 끝까지 약분함",
    curriculumAnchorIds: ["[6수01-08]"],
    prerequisiteStageIds: [
      "fa.add-unlike",
      "fa.sub-unlike",
      "frac-equiv.simplest-form"
    ]
  },
  {
    id: "fa.mixed-add",
    order: 26,
    unitId: "fraction-add-subtract",
    title: "분모가 다른 대분수 더하기",
    shortTitle: "자연수와 분수 부분을 함께 더함",
    curriculumAnchorIds: ["[6수01-08]"],
    prerequisiteStageIds: ["fa.add-unlike"]
  },
  {
    id: "fa.carry",
    order: 27,
    unitId: "fraction-add-subtract",
    title: "분수 부분에서 자연수로 받아올림하기",
    shortTitle: "가분수에서 자연수를 받아올림함",
    curriculumAnchorIds: ["[6수01-08]"],
    prerequisiteStageIds: ["fa.mixed-add"]
  },
  {
    id: "fa.borrow",
    order: 28,
    unitId: "fraction-add-subtract",
    title: "자연수에서 분수 부분으로 받아내림하기",
    shortTitle: "자연수 하나를 분수로 받아내림함",
    curriculumAnchorIds: ["[6수01-08]"],
    prerequisiteStageIds: ["fa.sub-unlike", "fa.mixed-add"]
  },
  {
    id: "pa.perimeter",
    order: 29,
    unitId: "polygon-perimeter-area",
    title: "직사각형과 정사각형의 모든 변을 더해 둘레 구하기",
    shortTitle: "모든 변을 더해 둘레를 구함",
    curriculumAnchorIds: ["[6수03-11]"],
    prerequisiteStageIds: []
  },
  {
    id: "pa.area-unit",
    order: 30,
    unitId: "polygon-perimeter-area",
    title: "물건과 장소의 넓이에 알맞은 단위 고르기",
    shortTitle: "알맞은 넓이 단위를 고름",
    curriculumAnchorIds: ["[6수03-12]"],
    prerequisiteStageIds: []
  },
  {
    id: "pa.rectangle-square-area",
    order: 31,
    unitId: "polygon-perimeter-area",
    title: "직사각형과 정사각형의 넓이 구하기",
    shortTitle: "가로와 세로를 곱해 넓이를 구함",
    curriculumAnchorIds: ["[6수03-13]"],
    prerequisiteStageIds: ["pa.area-unit"]
  },
  {
    id: "pa.parallelogram-area",
    order: 32,
    unitId: "polygon-perimeter-area",
    title: "평행사변형의 밑변과 높이로 넓이 구하기",
    shortTitle: "평행사변형의 넓이를 구함",
    curriculumAnchorIds: ["[6수03-14]"],
    prerequisiteStageIds: ["pa.rectangle-square-area"]
  },
  {
    id: "pa.triangle-area",
    order: 33,
    unitId: "polygon-perimeter-area",
    title: "삼각형의 밑변과 높이로 넓이 구하기",
    shortTitle: "삼각형의 넓이를 구함",
    curriculumAnchorIds: ["[6수03-14]"],
    prerequisiteStageIds: ["pa.parallelogram-area"]
  },
  {
    id: "pa.trapezoid-area",
    order: 34,
    unitId: "polygon-perimeter-area",
    title: "사다리꼴의 두 밑변과 높이로 넓이 구하기",
    shortTitle: "사다리꼴의 넓이를 구함",
    curriculumAnchorIds: ["[6수03-14]"],
    prerequisiteStageIds: ["pa.triangle-area"]
  },
  {
    id: "pa.rhombus-area",
    order: 35,
    unitId: "polygon-perimeter-area",
    title: "마름모의 두 대각선으로 넓이 구하기",
    shortTitle: "마름모의 넓이를 구함",
    curriculumAnchorIds: ["[6수03-14]"],
    prerequisiteStageIds: ["pa.triangle-area"]
  }
];

const signals: SignalDefinition[] = [
  signal(
    "needs-scaffold",
    "도움이 필요한 응답",
    "medium",
    "여러 문항에서 같은 단계의 도움 요청이 반복되는지 함께 살펴볼 필요가 있습니다.",
    "식을 한 줄씩 다시 쓰고 먼저 계산할 부분만 표시하게 하세요.",
    "계산 순서를 천천히 확인하는 연습을 하고 있습니다.",
    "답을 알려주기보다 가장 먼저 계산할 부분을 찾아보게 해주세요."
  ),
  signal(
    "needs-review",
    "다시 확인할 응답",
    "low",
    "한 번의 선택만으로 결론 내리지 않고 같은 단계의 두 응답을 함께 확인해야 합니다.",
    "비슷한 식을 한 번 더 풀며 계산 순서를 말로 설명하게 하세요.",
    "계산한 순서를 다시 확인하는 연습을 하고 있습니다.",
    "풀이 뒤에 어떤 계산을 먼저 했는지 한 문장으로 말해 보게 해주세요."
  ),
  signal(
    "mixed-operations.incomplete-expression",
    "첫 계산 뒤에 멈춤",
    "medium",
    "먼저 계산할 부분은 찾았지만 그 중간값을 남은 식과 이어 계산하지 않았는지 확인할 필요가 있습니다.",
    "첫 계산 결과를 원래 식에 다시 넣고 남은 기호가 없을 때까지 한 줄씩 이어 쓰게 하세요.",
    "계산을 시작한 뒤 식 전체를 끝까지 이어 푸는 연습을 하고 있습니다.",
    "첫 계산값이 나온 뒤 아직 남은 기호가 있는지 함께 확인해 주세요."
  ),
  signal(
    "mixed-operations.multiply-first",
    "곱셈 우선 계산",
    "high",
    "덧셈이나 뺄셈과 곱셈이 섞인 식에서 곱셈을 먼저 계산하는 순서를 확인할 필요가 있습니다.",
    "곱셈 부분에 먼저 밑줄을 긋고 그 계산 결과로 식을 한 번 다시 쓰게 하세요.",
    "여러 계산이 섞인 식에서 곱셈을 먼저 하는 연습을 하고 있습니다.",
    "9+2×5처럼 짧은 식에서 먼저 계산할 부분만 손가락으로 짚어 보게 해주세요."
  ),
  signal(
    "mixed-operations.divide-first",
    "나눗셈 우선 계산",
    "high",
    "덧셈이나 뺄셈과 나눗셈이 섞인 식에서 나눗셈을 먼저 계산하는 순서를 확인할 필요가 있습니다.",
    "나눗셈 부분에 먼저 밑줄을 긋고 그 계산 결과로 식을 한 번 다시 쓰게 하세요.",
    "여러 계산이 섞인 식에서 나눗셈을 먼저 하는 연습을 하고 있습니다.",
    "15+24÷6처럼 나누어떨어지는 식에서 먼저 계산할 부분을 찾아보게 해주세요."
  ),
  signal(
    "mixed-operations.same-rank-left-to-right",
    "같은 순위는 왼쪽부터 계산",
    "medium",
    "곱셈과 나눗셈 또는 덧셈과 뺄셈처럼 순위가 같은 계산을 왼쪽부터 하는지 확인할 필요가 있습니다.",
    "식 위에 왼쪽부터 ①, ②를 써서 같은 순위의 계산 순서를 눈에 보이게 하세요.",
    "순위가 같은 계산은 왼쪽부터 하는 연습을 하고 있습니다.",
    "48÷6×2와 30−8+5에서 첫 번째로 계산할 부분을 각각 표시해 보게 해주세요."
  ),
  signal(
    "mixed-operations.parentheses-first",
    "괄호 안 우선 계산",
    "medium",
    "괄호가 있는 식에서 괄호 안을 먼저 하나의 수로 만드는 순서를 확인할 필요가 있습니다.",
    "괄호를 동그라미로 표시하고 괄호 안의 계산 결과로 괄호 전체를 바꾸어 쓰게 하세요.",
    "괄호가 있는 식에서 괄호 안을 먼저 계산하는 연습을 하고 있습니다.",
    "5×(7−3)에서 가장 먼저 계산할 곳을 찾아 말해 보게 해주세요."
  ),
  signal(
    "mixed-operations.full-order",
    "전체 계산 순서 적용",
    "high",
    "괄호를 계산한 뒤에도 곱셈·나눗셈을 덧셈·뺄셈보다 먼저 하는 전체 순서를 이어 적용하는지 확인할 필요가 있습니다.",
    "괄호, 곱셈·나눗셈, 덧셈·뺄셈의 세 줄 체크표를 두고 한 단계씩 식을 다시 쓰게 하세요.",
    "괄호가 있는 혼합 계산에서 전체 순서를 차례로 적용하는 연습을 하고 있습니다.",
    "18+(10−4)×3에서 계산할 순서를 말로만 설명한 뒤 값을 구해 보게 해주세요."
  ),
  signal(
    "factors-multiples.common-set",
    "두 목록에서 공통인 수 찾기",
    "medium",
    "두 수의 약수나 배수를 한데 모은 뒤 두 목록에 모두 있는 수만 남기는 과정인지 확인할 필요가 있습니다.",
    "두 목록을 나란히 쓰고 양쪽에 모두 있는 수에 같은 색으로 표시하게 하세요.",
    "두 수에 모두 맞는 수를 골라내는 연습을 하고 있습니다.",
    "두 수의 목록을 각각 쓴 뒤 두 곳에 모두 나온 수만 동그라미 쳐 보게 해주세요."
  ),
  signal(
    "factors.list-divisors",
    "약수 빠짐없이 찾기",
    "high",
    "주어진 수를 나머지 없이 나누는 수를 1과 자기 자신까지 포함해 찾는지 확인할 필요가 있습니다.",
    "1부터 차례로 나누어 보고 나머지가 0인 수만 약수 목록에 쓰게 하세요.",
    "나누어떨어지는 수를 빠짐없이 찾는 연습을 하고 있습니다.",
    "12를 1부터 12까지 나누어 보며 나머지가 0인 수만 적어 보게 해주세요."
  ),
  signal(
    "factors.common-and-greatest",
    "공약수와 최대공약수 찾기",
    "high",
    "두 수의 약수 목록에서 공통인 수만 남기고 그중 가장 큰 수를 고르는지 확인할 필요가 있습니다.",
    "두 수의 약수를 각각 쓴 뒤 공통인 수에 표시하고 마지막으로 가장 큰 수를 고르게 하세요.",
    "두 수의 공약수와 그중 가장 큰 수를 찾는 연습을 하고 있습니다.",
    "12와 18의 약수를 각각 쓴 뒤 두 곳에 모두 있는 수와 가장 큰 수를 찾아보게 해주세요."
  ),
  signal(
    "multiples.list-multiples",
    "배수 차례로 찾기",
    "high",
    "주어진 수에 1부터 차례로 곱해 자기 자신부터 배수 목록을 만드는지 확인할 필요가 있습니다.",
    "주어진 수 옆에 ×1, ×2, ×3을 차례로 적고 나온 값을 배수 목록으로 쓰게 하세요.",
    "1배부터 차례로 곱해 배수를 찾는 연습을 하고 있습니다.",
    "6×1, 6×2, 6×3을 계산해 6의 배수를 작은 것부터 적어 보게 해주세요."
  ),
  signal(
    "multiples.common-and-least",
    "공배수와 최소공배수 찾기",
    "high",
    "두 수의 배수 목록에서 공통인 수만 남기고 그중 가장 작은 수를 고르는지 확인할 필요가 있습니다.",
    "두 수의 배수를 각각 작은 것부터 쓰고 처음으로 함께 나오는 수에 표시하게 하세요.",
    "두 수의 공배수와 그중 가장 작은 수를 찾는 연습을 하고 있습니다.",
    "4와 6의 배수를 각각 쓰며 처음으로 함께 나오는 수를 찾아보게 해주세요."
  ),
  signal(
    "factors-multiples.apply-in-context",
    "상황에 알맞게 약수와 배수 적용하기",
    "high",
    "똑같이 나누어 담는 상황과 두 일이 다시 함께 일어나는 상황을 구별해 알맞은 값을 찾는지 확인할 필요가 있습니다.",
    "나누어 담기에는 공약수, 다시 함께 일어나는 때에는 공배수 목록을 쓰게 하세요.",
    "상황을 살펴 약수와 배수 중 알맞은 방법을 고르는 연습을 하고 있습니다.",
    "나누어 담는 문제인지 다시 만나는 때를 찾는 문제인지 먼저 말해 보게 해주세요."
  ),
  signal(
    "correspondence.pair-from-table",
    "대응표에서 새 짝 찾기",
    "medium",
    "표의 한 양만 보지 않고 두 양의 짝이 어떻게 함께 변하는지 확인할 필요가 있습니다.",
    "각 행의 두 수를 화살표로 짝지은 뒤 같은 계산이 모든 행에 맞는지 확인하게 하세요.",
    "대응표의 두 양을 함께 보며 새로운 짝을 찾는 연습을 하고 있습니다.",
    "표의 한 행씩 두 수를 소리 내어 짝지어 보고 다음 짝을 찾아보게 해주세요."
  ),
  signal(
    "correspondence.symbol-expression",
    "대응 규칙을 기호식으로 나타내기",
    "high",
    "첫 행에만 맞는 식이 아니라 대응표의 모든 행에 맞는 □와 △의 식을 고르는지 확인할 필요가 있습니다.",
    "후보 식마다 표의 세 행을 차례로 대입해 모두 맞는 식 하나만 남기게 하세요.",
    "대응표의 규칙을 □와 △가 들어간 식으로 나타내는 연습을 하고 있습니다.",
    "표의 첫 행뿐 아니라 둘째, 셋째 행에도 식이 맞는지 함께 확인해 주세요."
  ),
  signal(
    "correspondence.base-and-dependent",
    "두 양의 계산 방향 구별하기",
    "medium",
    "□와 △의 자리를 바꾸지 않고 □의 값으로 △를 구하는 계산 방향을 확인할 필요가 있습니다.",
    "먼저 '□를 알면 △를 어떻게 구할까?'라고 말한 뒤 그 순서대로 기호를 놓게 하세요.",
    "두 양 가운데 어느 양으로 다른 양을 구하는지 구별하는 연습을 하고 있습니다.",
    "□에 한 값을 넣고 식으로 △가 표와 같은지 확인해 보게 해주세요."
  ),
  signal(
    "correspondence.apply-backward",
    "기호식을 거꾸로 적용하기",
    "medium",
    "한 양의 값이 주어졌을 때 기호식의 계산을 반대로 하여 다른 양을 찾는지 확인할 필요가 있습니다.",
    "기호식의 곱셈은 나눗셈으로, 나눗셈은 곱셈으로 바꾼 뒤 원래 식에 다시 넣어 확인하게 하세요.",
    "기호식을 거꾸로 사용해 처음 양의 값을 찾는 연습을 하고 있습니다.",
    "주어진 식의 계산을 반대로 한 뒤 원래 식에 다시 넣어 맞는지 살펴보게 해주세요."
  ),
  signal(
    "correspondence.change-together",
    "두 양의 변화량 함께 보기",
    "medium",
    "한 양이 늘어난 양과 대응하는 다른 양이 늘어난 양을 관계에 맞게 함께 계산하는지 확인할 필요가 있습니다.",
    "변하기 전과 뒤의 두 양을 두 줄로 쓰고 각각 얼마나 변했는지 표시하게 하세요.",
    "한 양이 변할 때 다른 양이 얼마나 함께 변하는지 살펴보는 연습을 하고 있습니다.",
    "한 양이 몇 늘었는지 먼저 말하고 그만큼 다른 양이 어떻게 달라지는지 계산해 보게 해주세요."
  ),
  signal(
    "frac-equiv.multiply-both",
    "분자와 분모에 같은 수 곱하기",
    "high",
    "크기가 같은 분수를 만들 때 분자와 분모에 서로 다른 계산을 하거나 한쪽만 바꾸는지 확인할 필요가 있습니다.",
    "원래 분수의 분자와 분모 옆에 같은 곱셈 수를 나란히 적게 하세요.",
    "분자와 분모에 같은 수를 곱해 크기가 같은 분수를 만드는 연습을 하고 있습니다.",
    "분수의 위와 아래에 같은 수를 곱했는지 함께 확인해 주세요."
  ),
  signal(
    "frac-equiv.divide-both",
    "분자와 분모를 같은 수로 나누기",
    "high",
    "약분할 때 분자와 분모를 같은 수로 나누고 있는지 확인할 필요가 있습니다.",
    "목표 분모를 먼저 보고 원래 분모를 몇으로 나누었는지 찾은 뒤 분자도 같은 수로 나누게 하세요.",
    "분자와 분모를 같은 수로 나누어 약분하는 연습을 하고 있습니다.",
    "분모를 나눈 수로 분자도 똑같이 나누었는지 확인해 주세요."
  ),
  signal(
    "frac-equiv.simplest-form",
    "기약분수까지 약분하기",
    "high",
    "한 번 약분한 뒤 멈추거나 최대공약수를 잘못 적용해 더 이상 약분할 수 없는 분수까지 가지 못하는지 확인할 필요가 있습니다.",
    "분자와 분모의 공약수가 1만 남을 때까지 나누고 마지막에 최대공약수를 다시 확인하게 하세요.",
    "분수를 더 이상 약분할 수 없는 기약분수로 나타내는 연습을 하고 있습니다.",
    "약분한 뒤에도 분자와 분모를 함께 나눌 수 있는 수가 남았는지 살펴보게 해주세요."
  ),
  signal(
    "frac-equiv.common-denominator",
    "공통분모로 통분하기",
    "high",
    "공통분모를 만들 때 분모만 바꾸거나 분자에 알맞지 않은 수를 곱하는지 확인할 필요가 있습니다.",
    "원래 분모가 공통분모가 되려면 몇 배인지 찾고 분자에도 그 수를 곱하게 하세요.",
    "두 분수의 분모를 같게 바꾸는 통분을 연습하고 있습니다.",
    "분모에 곱한 수를 분자에도 똑같이 곱했는지 확인해 주세요."
  ),
  signal(
    "frac-compare.different-denominator",
    "분모가 다른 분수 비교하기",
    "high",
    "분자나 분모의 숫자 하나만 보고 분수의 크기를 판단하는지 확인할 필요가 있습니다.",
    "분모를 같게 통분하거나 소수로 바꾸어 공통 기준에서 비교하게 하세요.",
    "분모가 다른 분수를 같은 기준으로 바꾸어 비교하는 연습을 하고 있습니다.",
    "분자나 분모만 보지 말고 분모를 같게 만든 뒤 비교해 보게 해주세요."
  ),
  signal(
    "frac-decimal.convert",
    "분수와 소수 서로 바꾸기",
    "high",
    "분수를 소수로, 소수를 분수로 바꿀 때 자릿값과 분모 10·100의 관계를 적용하는지 확인할 필요가 있습니다.",
    "분모를 10이나 100으로 만든 뒤 소수의 자릿값과 연결하게 하세요.",
    "분수와 소수를 같은 값을 나타내는 다른 형태로 바꾸는 연습을 하고 있습니다.",
    "소수 한 자리면 분모 10, 두 자리면 분모 100에서 시작해 보게 해주세요."
  ),
  signal(
    "frac-decimal.compare",
    "분수와 소수 크기 비교하기",
    "high",
    "분수와 소수가 섞였을 때 겉으로 보이는 숫자만 비교하고 같은 형태로 바꾸지 않는지 확인할 필요가 있습니다.",
    "모두 소수 또는 같은 분모의 분수로 바꾼 뒤 한 줄에 나란히 놓고 비교하게 하세요.",
    "분수와 소수를 같은 형태로 바꾸어 크기를 비교하는 연습을 하고 있습니다.",
    "분수와 소수를 모두 소수로 바꾼 뒤 작은 것부터 놓아 보게 해주세요."
  ),
  signal(
    "fa.add-unlike",
    "분모가 다른 분수 더하기",
    "high",
    "분모가 다른 분수를 더할 때 먼저 통분하고 바뀐 분자를 더하는지 확인할 필요가 있습니다.",
    "두 분수의 공통분모를 정한 뒤 각 분자도 같은 배수로 바꾸어 더하게 하세요.",
    "분모가 다른 분수를 통분하여 더하는 연습을 하고 있습니다.",
    "분모만 같게 하지 말고 분자도 같은 배수로 바뀌었는지 확인해 주세요."
  ),
  signal(
    "fa.sub-unlike",
    "분모가 다른 분수 빼기",
    "high",
    "분모가 다른 분수를 뺄 때 먼저 통분하고 바뀐 분자를 빼는지 확인할 필요가 있습니다.",
    "두 분수의 공통분모를 정하고 바뀐 두 분자를 나란히 쓴 뒤 빼게 하세요.",
    "분모가 다른 분수를 통분하여 빼는 연습을 하고 있습니다.",
    "두 분모를 같게 만든 뒤 바뀐 분자끼리 뺐는지 확인해 주세요."
  ),
  signal(
    "fa.reduce-result",
    "계산 결과 끝까지 약분하기",
    "medium",
    "분수의 덧셈이나 뺄셈은 맞았지만 결과를 기약분수까지 약분하지 않고 멈추는지 확인할 필요가 있습니다.",
    "계산 뒤 분자와 분모의 공약수가 1만 남았는지 한 번 더 확인하게 하세요.",
    "분수를 계산한 뒤 결과를 끝까지 약분하는 연습을 하고 있습니다.",
    "답을 구한 뒤 위아래를 함께 나눌 수 있는 수가 남았는지 살펴보게 해주세요."
  ),
  signal(
    "fa.mixed-add",
    "대분수의 자연수와 분수 함께 더하기",
    "high",
    "대분수 덧셈에서 자연수 부분을 빠뜨리거나 분수의 분자와 분모를 각각 더하는지 확인할 필요가 있습니다.",
    "자연수 부분과 분수 부분을 두 줄로 나누어 각각 계산한 뒤 다시 합치게 하세요.",
    "대분수의 자연수 부분과 분수 부분을 모두 더하는 연습을 하고 있습니다.",
    "두 대분수의 자연수 부분도 빠짐없이 더했는지 확인해 주세요."
  ),
  signal(
    "fa.carry",
    "분수 부분에서 받아올림하기",
    "high",
    "대분수 덧셈의 분수 부분이 1보다 클 때 자연수 하나를 받아올리는지 확인할 필요가 있습니다.",
    "가분수에서 분모만큼을 묶어 자연수 1로 옮기고 남은 분수를 쓰게 하세요.",
    "분수 부분이 1보다 클 때 자연수로 받아올리는 연습을 하고 있습니다.",
    "분자가 분모보다 크거나 같은지 보고 자연수 하나를 만들 수 있는지 확인해 주세요."
  ),
  signal(
    "fa.borrow",
    "자연수에서 받아내림하기",
    "high",
    "대분수 뺄셈에서 분수 부분을 바로 뺄 수 없을 때 자연수 하나를 같은 분모의 분수로 바꾸는지 확인할 필요가 있습니다.",
    "자연수 하나를 줄이고 그 1을 분모와 같은 분자의 분수로 바꾸어 분수 부분에 더하게 하세요.",
    "분수 부분이 작을 때 자연수 하나를 분수로 받아내리는 연습을 하고 있습니다.",
    "바로 뺄 수 없다면 자연수 하나를 줄여 분수 부분으로 옮겨 보게 해주세요."
  ),
  signal(
    "pa.perimeter",
    "다각형의 둘레 구하기",
    "high",
    "둘레를 구할 때 한 쌍의 변만 더하거나 넓이 계산을 사용하는지 확인할 필요가 있습니다.",
    "도형의 테두리를 손가락으로 한 바퀴 따라가며 모든 변을 빠짐없이 더하게 하세요.",
    "도형의 모든 변을 더해 둘레를 구하는 연습을 하고 있습니다.",
    "도형의 테두리를 한 바퀴 짚으며 더한 변에 표시해 보게 해주세요."
  ),
  signal(
    "pa.area-unit",
    "넓이 단위 선택하기",
    "medium",
    "넓이에는 제곱 단위를 쓰고 대상의 크기에 맞는 단위를 고르는지 확인할 필요가 있습니다.",
    "길이 단위와 넓이 단위를 나란히 놓고, 한 변이 1인 정사각형을 기준으로 고르게 하세요.",
    "대상의 크기에 알맞은 넓이 단위를 고르는 연습을 하고 있습니다.",
    "책 표지와 방바닥을 비교하며 cm²와 m² 중 알맞은 단위를 말해 보게 해주세요."
  ),
  signal(
    "pa.rectangle-square-area",
    "직사각형과 정사각형의 넓이",
    "high",
    "가로와 세로를 곱해 넓이를 구해야 할 때 둘레를 구하거나 두 길이만 더하는지 확인할 필요가 있습니다.",
    "한 줄의 단위 정사각형 수와 줄 수를 연결해 가로와 세로를 곱하게 하세요.",
    "가로와 세로를 곱해 직사각형과 정사각형의 넓이를 구하는 연습을 하고 있습니다.",
    "작은 격자를 그리고 한 줄의 칸 수와 줄 수를 곱해 보게 해주세요."
  ),
  signal(
    "pa.parallelogram-area",
    "평행사변형의 넓이",
    "high",
    "평행사변형의 밑변과 수직 높이를 곱하는지 확인할 필요가 있습니다.",
    "기울어진 부분을 잘라 옮겨 직사각형으로 바꾸고 밑변과 높이를 짚게 하세요.",
    "평행사변형의 밑변과 높이를 곱해 넓이를 구하는 연습을 하고 있습니다.",
    "기울어진 변이 아니라 밑변과 직각으로 만나는 높이를 찾아 곱해 보게 해주세요."
  ),
  signal(
    "pa.triangle-area",
    "삼각형의 넓이",
    "high",
    "밑변과 높이를 곱한 뒤 2로 나누는지 확인할 필요가 있습니다.",
    "같은 삼각형 두 개로 평행사변형을 만들고 왜 절반인지 말하게 하세요.",
    "삼각형의 넓이가 밑변과 높이를 곱한 값의 절반임을 연습하고 있습니다.",
    "같은 삼각형 두 개를 맞붙여 넓이가 두 배가 되는지 살펴보게 해주세요."
  ),
  signal(
    "pa.trapezoid-area",
    "사다리꼴의 넓이",
    "high",
    "윗변과 아랫변을 모두 더하고 높이를 곱한 뒤 2로 나누는지 확인할 필요가 있습니다.",
    "같은 사다리꼴 두 개를 이어 평행사변형을 만들고 밑변이 두 변의 합이 됨을 확인하게 하세요.",
    "사다리꼴의 두 평행한 변과 높이로 넓이를 구하는 연습을 하고 있습니다.",
    "윗변과 아랫변을 먼저 더한 뒤 높이를 곱하고 2로 나누어 보게 해주세요."
  ),
  signal(
    "pa.rhombus-area",
    "마름모의 넓이",
    "high",
    "두 대각선을 곱한 뒤 2로 나누는지 확인할 필요가 있습니다.",
    "두 대각선이 만드는 직사각형과 마름모의 넓이를 비교해 절반 관계를 확인하게 하세요.",
    "마름모의 두 대각선으로 넓이를 구하는 연습을 하고 있습니다.",
    "두 대각선을 곱한 값이 마름모 두 개의 넓이임을 그림으로 확인해 보게 해주세요."
  )
];

const context = "계산 순서대로 풀어 보세요.";
const judgments: Judgment[] = [
  judgment({ id: "g5s1-mix-01", unitId: "mixed-operations", learnerStageId: "mixed-operations.multiply-first", curriculumAnchorIds: ["[6수01-01]"], context, prompt: "8 + 3 × 4 = ?", visual: { kind: "none" }, signalId: "mixed-operations.multiply-first", answers: [{ id: "twenty-01", label: "20" }, { id: "forty-four-01", label: "44" }, { id: "twelve-01", label: "12", signalIds: ["mixed-operations.incomplete-expression"] }] }),
  judgment({ id: "g5s1-mix-02", unitId: "mixed-operations", learnerStageId: "mixed-operations.multiply-first", curriculumAnchorIds: ["[6수01-01]"], context, prompt: "30 − 4 × 5 = ?", visual: { kind: "none" }, signalId: "mixed-operations.multiply-first", answers: [{ id: "ten-02", label: "10" }, { id: "one-hundred-thirty-02", label: "130" }, { id: "twenty-02", label: "20", signalIds: ["mixed-operations.incomplete-expression"] }] }),
  judgment({ id: "g5s1-mix-03", unitId: "mixed-operations", learnerStageId: "mixed-operations.divide-first", curriculumAnchorIds: ["[6수01-01]"], context, prompt: "12 + 24 ÷ 6 − 2 = ?", visual: { kind: "none" }, signalId: "mixed-operations.divide-first", answers: [{ id: "fourteen-03", label: "14" }, { id: "four-03", label: "4" }, { id: "eighteen-03", label: "18" }] }),
  judgment({ id: "g5s1-mix-04", unitId: "mixed-operations", learnerStageId: "mixed-operations.divide-first", curriculumAnchorIds: ["[6수01-01]"], context, prompt: "40 − 24 ÷ 4 + 4 = ?", visual: { kind: "none" }, signalId: "mixed-operations.divide-first", answers: [{ id: "thirty-eight-04", label: "38" }, { id: "eight-04", label: "8" }, { id: "thirty-seven-04", label: "37" }] }),
  judgment({ id: "g5s1-mix-05", unitId: "mixed-operations", learnerStageId: "mixed-operations.same-rank-left-to-right", curriculumAnchorIds: ["[6수01-01]"], context, prompt: "72 ÷ 3 × 4 = ?", visual: { kind: "none" }, signalId: "mixed-operations.same-rank-left-to-right", answers: [{ id: "ninety-six-05", label: "96" }, { id: "six-05", label: "6" }, { id: "twenty-four-05", label: "24", signalIds: ["mixed-operations.incomplete-expression"] }] }),
  judgment({ id: "g5s1-mix-06", unitId: "mixed-operations", learnerStageId: "mixed-operations.same-rank-left-to-right", curriculumAnchorIds: ["[6수01-01]"], context, prompt: "35 − 12 − 7 = ?", visual: { kind: "none" }, signalId: "mixed-operations.same-rank-left-to-right", answers: [{ id: "sixteen-06", label: "16" }, { id: "thirty-06", label: "30" }, { id: "twenty-three-06", label: "23", signalIds: ["mixed-operations.incomplete-expression"] }] }),
  judgment({ id: "g5s1-mix-07", unitId: "mixed-operations", learnerStageId: "mixed-operations.parentheses-first", curriculumAnchorIds: ["[6수01-01]"], context, prompt: "(8 + 4) × 3 = ?", visual: { kind: "none" }, signalId: "mixed-operations.parentheses-first", answers: [{ id: "thirty-six-07", label: "36" }, { id: "twenty-07", label: "20" }, { id: "twelve-07", label: "12", signalIds: ["mixed-operations.incomplete-expression"] }] }),
  judgment({ id: "g5s1-mix-08", unitId: "mixed-operations", learnerStageId: "mixed-operations.parentheses-first", curriculumAnchorIds: ["[6수01-01]"], context, prompt: "72 ÷ (6 + 3) = ?", visual: { kind: "none" }, signalId: "mixed-operations.parentheses-first", answers: [{ id: "eight-08", label: "8" }, { id: "fifteen-08", label: "15" }, { id: "nine-08", label: "9", signalIds: ["mixed-operations.incomplete-expression"] }] }),
  judgment({ id: "g5s1-mix-09", unitId: "mixed-operations", learnerStageId: "mixed-operations.full-order", curriculumAnchorIds: ["[6수01-01]"], context, prompt: "20 + 24 ÷ (8 − 4) = ?", visual: { kind: "none" }, signalId: "mixed-operations.full-order", answers: [{ id: "twenty-six-09", label: "26" }, { id: "eleven-09", label: "11" }, { id: "nineteen-09", label: "19" }] }),
  judgment({ id: "g5s1-mix-10", unitId: "mixed-operations", learnerStageId: "mixed-operations.full-order", curriculumAnchorIds: ["[6수01-01]"], context, prompt: "50 − (6 + 2) × 4 = ?", visual: { kind: "none" }, signalId: "mixed-operations.full-order", answers: [{ id: "eighteen-10", label: "18" }, { id: "one-hundred-sixty-eight-10", label: "168" }, { id: "fifty-two-10", label: "52" }] }),
  judgment({ id: "g5s1-fm-01", unitId: "factors-multiples", learnerStageId: "factors.list-divisors", curriculumAnchorIds: ["[6수01-04]"], context: "나누어떨어지는 수를 빠짐없이 찾아보세요.", prompt: "18의 약수를 모두 쓴 것은 어느 것인가요?", visual: { kind: "none" }, signalId: "factors.list-divisors", answers: [{ id: "divisors-18", label: "1, 2, 3, 6, 9, 18" }, { id: "without-ends-18", label: "2, 3, 6, 9" }, { id: "with-four-18", label: "1, 2, 3, 4, 6, 9, 18" }] }),
  judgment({ id: "g5s1-fm-02", unitId: "factors-multiples", learnerStageId: "factors.list-divisors", curriculumAnchorIds: ["[6수01-04]"], context: "24개를 남김없이 똑같이 나누어 보세요.", prompt: "가능한 묶음 수를 모두 쓴 것은 어느 것인가요?", visual: { kind: "none" }, signalId: "factors.list-divisors", answers: [{ id: "divisors-24", label: "1, 2, 3, 4, 6, 8, 12, 24" }, { id: "without-ends-24", label: "2, 3, 4, 6, 8, 12" }, { id: "with-five-24", label: "1, 2, 3, 4, 5, 6, 8, 12, 24" }] }),
  judgment({ id: "g5s1-fm-03", unitId: "factors-multiples", learnerStageId: "factors.common-and-greatest", curriculumAnchorIds: ["[6수01-04]"], context: "두 수의 약수에 모두 들어 있는 수를 찾아보세요.", prompt: "12와 18의 공약수를 모두 쓴 것은 어느 것인가요?", visual: { kind: "none" }, signalId: "factors.common-and-greatest", answers: [{ id: "common-12-18", label: "1, 2, 3, 6" }, { id: "union-12-18", label: "1, 2, 3, 4, 6, 9, 12, 18", signalIds: ["factors-multiples.common-set"] }, { id: "stopped-12-18", label: "1, 2, 3" }] }),
  judgment({ id: "g5s1-fm-04", unitId: "factors-multiples", learnerStageId: "factors.common-and-greatest", curriculumAnchorIds: ["[6수01-04]"], context: "두 수의 공약수 중 가장 큰 수를 찾아보세요.", prompt: "16과 24의 최대공약수는 얼마인가요?", visual: { kind: "none" }, signalId: "factors.common-and-greatest", answers: [{ id: "greatest-16-24", label: "8" }, { id: "one-sided-greatest-16-24", label: "12", signalIds: ["factors-multiples.common-set"] }, { id: "stopped-greatest-16-24", label: "4" }] }),
  judgment({ id: "g5s1-fm-05", unitId: "factors-multiples", learnerStageId: "multiples.list-multiples", curriculumAnchorIds: ["[6수01-05]"], context: "1배부터 차례로 곱해 보세요.", prompt: "7의 배수를 작은 것부터 네 개 쓴 것은?", visual: { kind: "none" }, signalId: "multiples.list-multiples", answers: [{ id: "multiples-7", label: "7, 14, 21, 28" }, { id: "start-two-7", label: "14, 21, 28, 35" }, { id: "count-up-7", label: "7, 8, 9, 10" }] }),
  judgment({ id: "g5s1-fm-06", unitId: "factors-multiples", learnerStageId: "multiples.list-multiples", curriculumAnchorIds: ["[6수01-05]"], context: "한 묶음에 연필이 9자루씩 있습니다.", prompt: "한 묶음부터 네 묶음까지 연필 수는?", visual: { kind: "none" }, signalId: "multiples.list-multiples", answers: [{ id: "multiples-9", label: "9, 18, 27, 36" }, { id: "start-two-9", label: "18, 27, 36, 45" }, { id: "count-up-9", label: "9, 10, 11, 12" }] }),
  judgment({ id: "g5s1-fm-07", unitId: "factors-multiples", learnerStageId: "multiples.common-and-least", curriculumAnchorIds: ["[6수01-05]"], context: "두 수의 배수에 모두 들어 있는 수를 찾아보세요.", prompt: "4와 8의 공배수를 작은 것부터 세 개 쓴 것은?", visual: { kind: "none" }, signalId: "multiples.common-and-least", answers: [{ id: "common-4-8", label: "8, 16, 24" }, { id: "product-start-4-8", label: "32, 64, 96" }, { id: "merged-4-8", label: "4, 8, 12", signalIds: ["factors-multiples.common-set"] }] }),
  judgment({ id: "g5s1-fm-08", unitId: "factors-multiples", learnerStageId: "multiples.common-and-least", curriculumAnchorIds: ["[6수01-05]"], context: "두 수의 공배수 중 가장 작은 수를 찾아보세요.", prompt: "6과 8의 최소공배수는 얼마인가요?", visual: { kind: "none" }, signalId: "multiples.common-and-least", answers: [{ id: "least-6-8", label: "24" }, { id: "product-least-6-8", label: "48" }, { id: "one-sided-least-6-8", label: "12", signalIds: ["factors-multiples.common-set"] }] }),
  judgment({ id: "g5s1-fm-09", unitId: "factors-multiples", learnerStageId: "factors-multiples.apply-in-context", curriculumAnchorIds: ["[6수01-04]", "[6수01-05]"], context: "상황에 알맞은 수를 찾아보세요.", prompt: "사탕 12개와 젤리 18개를 남기지 않고 똑같이 나누어 담습니다. 봉지는 최대 몇 개인가요?", visual: { kind: "none" }, signalId: "factors-multiples.apply-in-context", answers: [{ id: "six-bags", label: "6" }, { id: "lcm-as-bags", label: "36" }, { id: "sum-as-bags", label: "30" }] }),
  judgment({ id: "g5s1-fm-10", unitId: "factors-multiples", learnerStageId: "factors-multiples.apply-in-context", curriculumAnchorIds: ["[6수01-04]", "[6수01-05]"], context: "상황에 알맞은 수를 찾아보세요.", prompt: "6분마다 오는 버스와 8분마다 오는 버스가 방금 함께 왔습니다. 다음에 함께 오는 것은 몇 분 뒤인가요?", visual: { kind: "none" }, signalId: "factors-multiples.apply-in-context", answers: [{ id: "twenty-four-minutes", label: "24" }, { id: "gcd-as-minutes", label: "2" }, { id: "sum-as-minutes", label: "14" }] }),
  judgment({
    id: "g5s1-cor-01",
    unitId: "correspondence",
    learnerStageId: "correspondence.pair-from-table",
    curriculumAnchorIds: ["[6수02-01]"],
    context: "표의 두 양을 함께 살펴보세요.",
    prompt: "묶음이 6개일 때 사탕은 몇 개인가요?",
    visual: { kind: "relation-pattern-diagram", mode: "rule-table", leftLabel: "묶음 수", rightLabel: "사탕 수", rows: [{ left: 2, right: 14 }, { left: 3, right: 21 }, { left: 5, right: 35 }] },
    signalId: "correspondence.pair-from-table",
    answers: [{ id: "candies-42", label: "42" }, { id: "right-difference-49", label: "49" }, { id: "same-increase-36", label: "36" }]
  }),
  judgment({
    id: "g5s1-cor-02",
    unitId: "correspondence",
    learnerStageId: "correspondence.pair-from-table",
    curriculumAnchorIds: ["[6수02-01]"],
    context: "표의 두 양을 함께 살펴보세요.",
    prompt: "상자가 9개일 때 공은 몇 개인가요?",
    visual: { kind: "relation-pattern-diagram", mode: "rule-table", leftLabel: "상자 수", rightLabel: "공 수", rows: [{ left: 3, right: 12 }, { left: 6, right: 24 }, { left: 7, right: 28 }] },
    signalId: "correspondence.pair-from-table",
    answers: [{ id: "balls-36", label: "36" }, { id: "right-difference-32", label: "32" }, { id: "same-increase-30", label: "30" }]
  }),
  judgment({
    id: "g5s1-cor-03",
    unitId: "correspondence",
    learnerStageId: "correspondence.symbol-expression",
    curriculumAnchorIds: ["[6수02-01]"],
    context: "□는 묶음 수, △는 색종이 수입니다.",
    prompt: "□와 △의 관계를 나타낸 식은 어느 것인가요?",
    visual: { kind: "relation-pattern-diagram", mode: "rule-table", leftLabel: "묶음 수", rightLabel: "색종이 수", rows: [{ left: 2, right: 10 }, { left: 3, right: 15 }, { left: 5, right: 25 }] },
    signalId: "correspondence.symbol-expression",
    answers: [{ id: "triangle-square-times-five", label: "△ = □ × 5" }, { id: "first-row-plus-eight", label: "△ = □ + 8" }, { id: "times-as-plus-five", label: "△ = □ + 5" }]
  }),
  judgment({
    id: "g5s1-cor-04",
    unitId: "correspondence",
    learnerStageId: "correspondence.symbol-expression",
    curriculumAnchorIds: ["[6수02-01]"],
    context: "□는 사람 수, △는 연필 수입니다.",
    prompt: "□와 △의 관계를 나타낸 식은 어느 것인가요?",
    visual: { kind: "relation-pattern-diagram", mode: "rule-table", leftLabel: "사람 수", rightLabel: "연필 수", rows: [{ left: 4, right: 12 }, { left: 6, right: 18 }, { left: 9, right: 27 }] },
    signalId: "correspondence.symbol-expression",
    answers: [{ id: "triangle-square-times-three", label: "△ = □ × 3" }, { id: "first-row-plus-eight-04", label: "△ = □ + 8" }, { id: "times-as-plus-three", label: "△ = □ + 3" }]
  }),
  judgment({
    id: "g5s1-cor-05",
    unitId: "correspondence",
    learnerStageId: "correspondence.base-and-dependent",
    curriculumAnchorIds: ["[6수02-01]"],
    context: "□는 구슬 수, △는 봉지 수입니다.",
    prompt: "□로 △를 구하는 식은 어느 것인가요?",
    visual: { kind: "relation-pattern-diagram", mode: "rule-table", leftLabel: "구슬 수", rightLabel: "봉지 수", rows: [{ left: 15, right: 3 }, { left: 20, right: 4 }, { left: 30, right: 6 }] },
    signalId: "correspondence.base-and-dependent",
    answers: [{ id: "triangle-square-divide-five", label: "△ = □ ÷ 5" }, { id: "square-triangle-divide-five", label: "□ = △ ÷ 5" }, { id: "divide-as-times-five", label: "△ = □ × 5" }]
  }),
  judgment({
    id: "g5s1-cor-06",
    unitId: "correspondence",
    learnerStageId: "correspondence.base-and-dependent",
    curriculumAnchorIds: ["[6수02-01]"],
    context: "□는 사탕 수, △는 접시 수입니다.",
    prompt: "□로 △를 구하는 식은 어느 것인가요?",
    visual: { kind: "relation-pattern-diagram", mode: "rule-table", leftLabel: "사탕 수", rightLabel: "접시 수", rows: [{ left: 24, right: 4 }, { left: 36, right: 6 }, { left: 48, right: 8 }] },
    signalId: "correspondence.base-and-dependent",
    answers: [{ id: "triangle-square-divide-six", label: "△ = □ ÷ 6" }, { id: "square-triangle-divide-six", label: "□ = △ ÷ 6" }, { id: "divide-as-times-six", label: "△ = □ × 6" }]
  }),
  judgment({
    id: "g5s1-cor-07",
    unitId: "correspondence",
    learnerStageId: "correspondence.apply-backward",
    curriculumAnchorIds: ["[6수02-01]"],
    context: "□는 묶음, △는 구슬이며 △ = □ × 8입니다.",
    prompt: "구슬이 56개일 때 묶음은 몇 개인가요?",
    visual: { kind: "relation-pattern-diagram", mode: "rule-table", leftLabel: "묶음 수", rightLabel: "구슬 수", rows: [{ left: 2, right: 16 }, { left: 4, right: 32 }, { left: 5, right: 40 }] },
    signalId: "correspondence.apply-backward",
    answers: [{ id: "square-seven", label: "7" }, { id: "nearest-row-six", label: "6" }, { id: "subtract-inverse-48", label: "48" }]
  }),
  judgment({
    id: "g5s1-cor-08",
    unitId: "correspondence",
    learnerStageId: "correspondence.apply-backward",
    curriculumAnchorIds: ["[6수02-01]"],
    context: "□는 연필, △는 묶음이며 △ = □ ÷ 6입니다.",
    prompt: "묶음이 12개일 때 연필은 몇 자루인가요?",
    visual: { kind: "relation-pattern-diagram", mode: "rule-table", leftLabel: "연필 수", rightLabel: "묶음 수", rows: [{ left: 30, right: 5 }, { left: 42, right: 7 }, { left: 54, right: 9 }] },
    signalId: "correspondence.apply-backward",
    answers: [{ id: "pencils-seventy-two", label: "72" }, { id: "nearest-row-sixty", label: "60" }, { id: "repeat-divide-two", label: "2" }]
  }),
  judgment({
    id: "g5s1-cor-09",
    unitId: "correspondence",
    learnerStageId: "correspondence.change-together",
    curriculumAnchorIds: ["[6수02-01]"],
    context: "□는 상자, △는 사과이며 △ = □ × 7입니다.",
    prompt: "상자가 4개 늘면 사과는 몇 개 늘어나나요?",
    visual: { kind: "relation-pattern-diagram", mode: "rule-table", leftLabel: "상자 수", rightLabel: "사과 수", rows: [{ left: 2, right: 14 }, { left: 5, right: 35 }, { left: 8, right: 56 }] },
    signalId: "correspondence.change-together",
    answers: [{ id: "triangle-increase-28", label: "28" }, { id: "table-change-twenty-one", label: "21" }, { id: "increase-plus-factor-11", label: "11" }]
  }),
  judgment({
    id: "g5s1-cor-10",
    unitId: "correspondence",
    learnerStageId: "correspondence.change-together",
    curriculumAnchorIds: ["[6수02-01]"],
    context: "□는 공, △는 상자이며 △ = □ ÷ 7입니다.",
    prompt: "공이 14개 늘어나면 상자는 몇 개 늘어나나요?",
    visual: { kind: "relation-pattern-diagram", mode: "rule-table", leftLabel: "공 수", rightLabel: "상자 수", rows: [{ left: 28, right: 4 }, { left: 35, right: 5 }, { left: 63, right: 9 }] },
    signalId: "correspondence.change-together",
    answers: [{ id: "triangle-increase-two", label: "2" }, { id: "table-change-one", label: "1" }, { id: "increase-plus-factor-21", label: "21" }]
  }),
  judgment({ id: "g5s1-frq-01", unitId: "fraction-reduction-common-denominator", learnerStageId: "frac-equiv.multiply-both", curriculumAnchorIds: ["[6수01-06]"], context: "분자와 분모에 같은 수를 곱해 보세요.", prompt: "2/3와 크기가 같은 분수는 어느 것인가요?", visual: { kind: "none" }, signalId: "frac-equiv.multiply-both", answers: [{ id: "eight-twelfths-01", label: "8/12" }, { id: "two-twelfths-01", label: "2/12" }, { id: "six-sevenths-01", label: "6/7" }] }),
  judgment({ id: "g5s1-frq-02", unitId: "fraction-reduction-common-denominator", learnerStageId: "frac-equiv.multiply-both", curriculumAnchorIds: ["[6수01-06]"], context: "분자와 분모를 함께 바꾸어 보세요.", prompt: "3/5와 크기가 같은 분수는 어느 것인가요?", visual: { kind: "none" }, signalId: "frac-equiv.multiply-both", answers: [{ id: "nine-fifteenths-02", label: "9/15" }, { id: "three-fifteenths-02", label: "3/15" }, { id: "six-eighths-02", label: "6/8" }] }),
  judgment({ id: "g5s1-frq-03", unitId: "fraction-reduction-common-denominator", learnerStageId: "frac-equiv.divide-both", curriculumAnchorIds: ["[6수01-06]"], context: "분자와 분모를 같은 수로 나누어 보세요.", prompt: "12/18을 약분하여 분모가 6인 분수로 나타내면?", visual: { kind: "none" }, signalId: "frac-equiv.divide-both", answers: [{ id: "four-sixths-03", label: "4/6" }, { id: "two-sixths-03", label: "2/6" }, { id: "three-sixths-03", label: "3/6" }] }),
  judgment({ id: "g5s1-frq-04", unitId: "fraction-reduction-common-denominator", learnerStageId: "frac-equiv.divide-both", curriculumAnchorIds: ["[6수01-06]"], context: "분모가 9인 같은 크기의 분수를 찾아보세요.", prompt: "18/27을 약분한 분수는 어느 것인가요?", visual: { kind: "none" }, signalId: "frac-equiv.divide-both", answers: [{ id: "six-ninths-04", label: "6/9" }, { id: "two-ninths-04", label: "2/9" }, { id: "nine-ninths-04", label: "9/9" }] }),
  judgment({ id: "g5s1-frq-05", unitId: "fraction-reduction-common-denominator", learnerStageId: "frac-equiv.simplest-form", curriculumAnchorIds: ["[6수01-06]"], context: "더 이상 약분할 수 없는 분수로 나타내 보세요.", prompt: "20/36을 기약분수로 나타내면?", visual: { kind: "none" }, signalId: "frac-equiv.simplest-form", answers: [{ id: "five-ninths-05", label: "5/9" }, { id: "ten-twelfths-05", label: "10/12" }, { id: "sixteen-thirty-seconds-05", label: "16/32" }] }),
  judgment({ id: "g5s1-frq-06", unitId: "fraction-reduction-common-denominator", learnerStageId: "frac-equiv.simplest-form", curriculumAnchorIds: ["[6수01-06]"], context: "공약수가 1만 남도록 끝까지 약분해 보세요.", prompt: "18/30과 크기가 같은 기약분수는?", visual: { kind: "none" }, signalId: "frac-equiv.simplest-form", answers: [{ id: "three-fifths-06", label: "3/5" }, { id: "six-fifteenths-06", label: "6/15" }, { id: "twelve-twenty-fourths-06", label: "12/24" }] }),
  judgment({ id: "g5s1-frq-07", unitId: "fraction-reduction-common-denominator", learnerStageId: "frac-equiv.common-denominator", curriculumAnchorIds: ["[6수01-06]"], context: "두 분모의 공배수를 공통분모로 씁니다.", prompt: "1/4와 2/3을 분모가 12인 분수로 통분할 때 1/4는 무엇이 되나요?", visual: { kind: "none" }, signalId: "frac-equiv.common-denominator", answers: [{ id: "three-twelfths-07", label: "3/12" }, { id: "one-twelfth-07", label: "1/12" }, { id: "four-twelfths-07", label: "4/12" }] }),
  judgment({ id: "g5s1-frq-08", unitId: "fraction-reduction-common-denominator", learnerStageId: "frac-equiv.common-denominator", curriculumAnchorIds: ["[6수01-06]"], context: "두 분모의 공배수를 공통분모로 씁니다.", prompt: "3/4과 2/5를 분모가 20인 분수로 통분할 때 3/4은 무엇이 되나요?", visual: { kind: "none" }, signalId: "frac-equiv.common-denominator", answers: [{ id: "fifteen-twentieths-08", label: "15/20" }, { id: "three-twentieths-08", label: "3/20" }, { id: "twelve-twentieths-08", label: "12/20" }] }),
  judgment({ id: "g5s1-frq-09", unitId: "fraction-reduction-common-denominator", learnerStageId: "frac-compare.different-denominator", curriculumAnchorIds: ["[6수01-07]"], context: "분모가 다른 분수를 비교해 보세요.", prompt: "4/5, 7/9, 2/3 중 가장 큰 분수는?", visual: { kind: "none" }, signalId: "frac-compare.different-denominator", answers: [{ id: "four-fifths-09", label: "4/5" }, { id: "seven-ninths-09", label: "7/9" }, { id: "two-thirds-09", label: "2/3" }] }),
  judgment({ id: "g5s1-frq-10", unitId: "fraction-reduction-common-denominator", learnerStageId: "frac-compare.different-denominator", curriculumAnchorIds: ["[6수01-07]"], context: "분모가 다른 분수를 비교해 보세요.", prompt: "2/3, 3/8, 7/10 중 가장 작은 분수는?", visual: { kind: "none" }, signalId: "frac-compare.different-denominator", answers: [{ id: "three-eighths-10", label: "3/8" }, { id: "two-thirds-10", label: "2/3" }, { id: "seven-tenths-10", label: "7/10" }] }),
  judgment({ id: "g5s1-frq-11", unitId: "fraction-reduction-common-denominator", learnerStageId: "frac-decimal.convert", curriculumAnchorIds: ["[6수01-12]"], context: "분모를 10이나 100으로 만들어 보세요.", prompt: "3/5를 소수로 나타내면?", visual: { kind: "none" }, signalId: "frac-decimal.convert", answers: [{ id: "zero-point-six-11", label: "0.6" }, { id: "zero-point-three-five-11", label: "0.35" }, { id: "zero-point-three-11", label: "0.3" }] }),
  judgment({ id: "g5s1-frq-12", unitId: "fraction-reduction-common-denominator", learnerStageId: "frac-decimal.convert", curriculumAnchorIds: ["[6수01-12]"], context: "분모를 10이나 100으로 만들어 보세요.", prompt: "0.25를 기약분수로 나타내면?", visual: { kind: "none" }, signalId: "frac-decimal.convert", answers: [{ id: "one-fourth-12", label: "1/4" }, { id: "two-fifths-12", label: "2/5" }, { id: "twenty-five-tenths-12", label: "25/10" }] }),
  judgment({ id: "g5s1-frq-13", unitId: "fraction-reduction-common-denominator", learnerStageId: "frac-decimal.compare", curriculumAnchorIds: ["[6수01-12]"], context: "분수와 소수를 같은 형태로 바꾸어 비교해 보세요.", prompt: "0.7, 4/5, 3/4 중 가장 큰 것은?", visual: { kind: "none" }, signalId: "frac-decimal.compare", answers: [{ id: "four-fifths-13", label: "4/5" }, { id: "zero-point-seven-13", label: "0.7" }, { id: "three-fourths-13", label: "3/4" }] }),
  judgment({ id: "g5s1-frq-14", unitId: "fraction-reduction-common-denominator", learnerStageId: "frac-decimal.compare", curriculumAnchorIds: ["[6수01-12]"], context: "분수와 소수를 같은 형태로 바꾸어 비교해 보세요.", prompt: "0.3, 3/8, 2/5 중 가장 작은 것은?", visual: { kind: "none" }, signalId: "frac-decimal.compare", answers: [{ id: "zero-point-three-14", label: "0.3" }, { id: "two-fifths-14", label: "2/5" }, { id: "three-eighths-14", label: "3/8" }] }),
  judgment({ id: "g5s1-fa-01", unitId: "fraction-add-subtract", learnerStageId: "fa.add-unlike", curriculumAnchorIds: ["[6수01-08]"], context: "두 분수를 통분하여 더해 보세요.", prompt: "1/4 + 1/3 = ?", visual: { kind: "none" }, signalId: "fa.add-unlike", answers: [{ id: "seven-twelfths-fa01", label: "7/12" }, { id: "two-sevenths-fa01", label: "2/7" }, { id: "two-twelfths-fa01", label: "2/12" }] }),
  judgment({ id: "g5s1-fa-02", unitId: "fraction-add-subtract", learnerStageId: "fa.add-unlike", curriculumAnchorIds: ["[6수01-08]"], context: "계산 결과와 같은 분수를 고르세요.", prompt: "2/5 + 1/2 = ?", visual: { kind: "none" }, signalId: "fa.add-unlike", answers: [{ id: "nine-tenths-fa02", label: "9/10" }, { id: "three-sevenths-fa02", label: "3/7" }, { id: "three-tenths-fa02", label: "3/10" }] }),
  judgment({ id: "g5s1-fa-03", unitId: "fraction-add-subtract", learnerStageId: "fa.sub-unlike", curriculumAnchorIds: ["[6수01-08]"], context: "두 분수를 통분하여 빼 보세요.", prompt: "3/4 − 1/6 = ?", visual: { kind: "none" }, signalId: "fa.sub-unlike", answers: [{ id: "seven-twelfths-fa03", label: "7/12" }, { id: "two-halves-fa03", label: "2/2" }, { id: "two-twelfths-fa03", label: "2/12" }] }),
  judgment({ id: "g5s1-fa-04", unitId: "fraction-add-subtract", learnerStageId: "fa.sub-unlike", curriculumAnchorIds: ["[6수01-08]"], context: "계산 결과와 같은 분수를 고르세요.", prompt: "5/6 − 1/4 = ?", visual: { kind: "none" }, signalId: "fa.sub-unlike", answers: [{ id: "seven-twelfths-fa04", label: "7/12" }, { id: "four-halves-fa04", label: "4/2" }, { id: "four-twelfths-fa04", label: "4/12" }] }),
  judgment({ id: "g5s1-fa-05", unitId: "fraction-add-subtract", learnerStageId: "fa.reduce-result", curriculumAnchorIds: ["[6수01-08]"], context: "계산한 뒤 끝까지 약분하세요.", prompt: "1/6 + 1/10 = ?", visual: { kind: "none" }, signalId: "fa.reduce-result", answers: [{ id: "four-fifteenths-fa05", label: "4/15" }, { id: "four-thirtieths-fa05", label: "4/30" }, { id: "two-sixteenths-fa05", label: "2/16" }] }),
  judgment({ id: "g5s1-fa-06", unitId: "fraction-add-subtract", learnerStageId: "fa.reduce-result", curriculumAnchorIds: ["[6수01-08]"], context: "계산한 뒤 끝까지 약분하세요.", prompt: "7/12 − 1/4 = ?", visual: { kind: "none" }, signalId: "fa.reduce-result", answers: [{ id: "one-third-fa06", label: "1/3" }, { id: "one-twelfth-fa06", label: "1/12" }, { id: "six-eighths-fa06", label: "6/8" }] }),
  judgment({ id: "g5s1-fa-07", unitId: "fraction-add-subtract", learnerStageId: "fa.mixed-add", curriculumAnchorIds: ["[6수01-08]"], context: "자연수와 분수 부분을 모두 더하세요.", prompt: "1 1/4 + 2 2/3 = ?", visual: { kind: "none" }, signalId: "fa.mixed-add", answers: [{ id: "three-eleven-twelfths-fa07", label: "3 11/12" }, { id: "one-eleven-twelfths-fa07", label: "1 11/12" }, { id: "three-three-sevenths-fa07", label: "3 3/7" }] }),
  judgment({ id: "g5s1-fa-08", unitId: "fraction-add-subtract", learnerStageId: "fa.mixed-add", curriculumAnchorIds: ["[6수01-08]"], context: "자연수 부분과 분수 부분을 나누어 계산하세요.", prompt: "2 1/6 + 1 1/4 = ?", visual: { kind: "none" }, signalId: "fa.mixed-add", answers: [{ id: "three-five-twelfths-fa08", label: "3 5/12" }, { id: "two-five-twelfths-fa08", label: "2 5/12" }, { id: "three-two-tenths-fa08", label: "3 2/10" }] }),
  judgment({ id: "g5s1-fa-09", unitId: "fraction-add-subtract", learnerStageId: "fa.carry", curriculumAnchorIds: ["[6수01-08]"], context: "분수 부분이 1보다 큰지 살펴보세요.", prompt: "1 3/4 + 1/2 = ?", visual: { kind: "none" }, signalId: "fa.carry", answers: [{ id: "two-one-fourth-fa09", label: "2 1/4" }, { id: "one-one-fourth-fa09", label: "1 1/4" }, { id: "two-five-fourths-fa09", label: "2 5/4" }] }),
  judgment({ id: "g5s1-fa-10", unitId: "fraction-add-subtract", learnerStageId: "fa.carry", curriculumAnchorIds: ["[6수01-08]"], context: "가분수가 되면 자연수로 받아올리세요.", prompt: "2 2/3 + 1/2 = ?", visual: { kind: "none" }, signalId: "fa.carry", answers: [{ id: "three-one-sixth-fa10", label: "3 1/6" }, { id: "two-one-sixth-fa10", label: "2 1/6" }, { id: "three-seven-sixths-fa10", label: "3 7/6" }] }),
  judgment({ id: "g5s1-fa-11", unitId: "fraction-add-subtract", learnerStageId: "fa.borrow", curriculumAnchorIds: ["[6수01-08]"], context: "필요하면 자연수 하나를 받아내리세요.", prompt: "3 1/4 − 1 1/2 = ?", visual: { kind: "none" }, signalId: "fa.borrow", answers: [{ id: "one-three-fourths-fa11", label: "1 3/4" }, { id: "three-one-fourth-fa11", label: "3 1/4" }, { id: "two-one-fourth-fa11", label: "2 1/4" }] }),
  judgment({ id: "g5s1-fa-12", unitId: "fraction-add-subtract", learnerStageId: "fa.borrow", curriculumAnchorIds: ["[6수01-08]"], context: "받아내린 뒤 자연수와 분수를 모두 빼세요.", prompt: "4 1/6 − 2 1/2 = ?", visual: { kind: "none" }, signalId: "fa.borrow", answers: [{ id: "one-two-thirds-fa12", label: "1 2/3" }, { id: "four-one-sixth-fa12", label: "4 1/6" }, { id: "two-one-sixth-fa12", label: "2 1/6" }] }),
  judgment({ id: "g5s1-pa-01", unitId: "polygon-perimeter-area", learnerStageId: "pa.perimeter", curriculumAnchorIds: ["[6수03-11]"], context: "도형의 테두리 길이를 구하세요.", prompt: "직사각형의 둘레는 몇 cm인가요?", visual: { kind: "perimeter-area-diagram", shape: "rectangle", width: 8, height: 5 }, signalId: "pa.perimeter", answers: [{ id: "twenty-six-cm-pa01", label: "26 cm" }, { id: "thirteen-cm-pa01", label: "13 cm" }, { id: "forty-cm-pa01", label: "40 cm" }] }),
  judgment({ id: "g5s1-pa-02", unitId: "polygon-perimeter-area", learnerStageId: "pa.perimeter", curriculumAnchorIds: ["[6수03-11]"], context: "네 변의 길이를 모두 생각하세요.", prompt: "정사각형의 둘레는 몇 cm인가요?", visual: { kind: "perimeter-area-diagram", shape: "square", side: 6 }, signalId: "pa.perimeter", answers: [{ id: "twenty-four-cm-pa02", label: "24 cm" }, { id: "twelve-cm-pa02", label: "12 cm" }, { id: "thirty-six-cm-pa02", label: "36 cm" }] }),
  judgment({ id: "g5s1-pa-03", unitId: "polygon-perimeter-area", learnerStageId: "pa.area-unit", curriculumAnchorIds: ["[6수03-12]"], context: "교실 바닥의 넓이를 나타내려고 해요.", prompt: "알맞은 단위는 어느 것인가요?", visual: { kind: "none" }, signalId: "pa.area-unit", answers: [{ id: "square-meter-pa03", label: "m²" }, { id: "square-centimeter-pa03", label: "cm²" }, { id: "meter-pa03", label: "m" }] }),
  judgment({ id: "g5s1-pa-04", unitId: "polygon-perimeter-area", learnerStageId: "pa.area-unit", curriculumAnchorIds: ["[6수03-12]"], context: "공책 표지의 넓이를 나타내려고 해요.", prompt: "알맞은 단위는 어느 것인가요?", visual: { kind: "none" }, signalId: "pa.area-unit", answers: [{ id: "square-centimeter-pa04", label: "cm²" }, { id: "square-meter-pa04", label: "m²" }, { id: "centimeter-pa04", label: "cm" }] }),
  judgment({ id: "g5s1-pa-05", unitId: "polygon-perimeter-area", learnerStageId: "pa.rectangle-square-area", curriculumAnchorIds: ["[6수03-13]"], context: "가로와 세로를 이용하세요.", prompt: "직사각형의 넓이는 몇 cm²인가요?", visual: { kind: "perimeter-area-diagram", shape: "rectangle", width: 8, height: 4 }, signalId: "pa.rectangle-square-area", answers: [{ id: "thirty-two-square-cm-pa05", label: "32 cm²" }, { id: "twenty-four-square-cm-pa05", label: "24 cm²" }, { id: "twelve-square-cm-pa05", label: "12 cm²" }] }),
  judgment({ id: "g5s1-pa-06", unitId: "polygon-perimeter-area", learnerStageId: "pa.rectangle-square-area", curriculumAnchorIds: ["[6수03-13]"], context: "한 변의 길이를 두 번 사용하세요.", prompt: "정사각형의 넓이는 몇 cm²인가요?", visual: { kind: "perimeter-area-diagram", shape: "square", side: 7 }, signalId: "pa.rectangle-square-area", answers: [{ id: "forty-nine-square-cm-pa06", label: "49 cm²" }, { id: "twenty-eight-square-cm-pa06", label: "28 cm²" }, { id: "fourteen-square-cm-pa06", label: "14 cm²" }] }),
  judgment({ id: "g5s1-pa-07", unitId: "polygon-perimeter-area", learnerStageId: "pa.parallelogram-area", curriculumAnchorIds: ["[6수03-14]"], context: "밑변과 높이를 확인하세요.", prompt: "평행사변형의 넓이는 몇 cm²인가요?", visual: { kind: "perimeter-area-diagram", shape: "parallelogram", base: 9, height: 4 }, signalId: "pa.parallelogram-area", answers: [{ id: "thirty-six-square-cm-pa07", label: "36 cm²" }, { id: "thirteen-square-cm-pa07", label: "13 cm²" }, { id: "eighty-one-square-cm-pa07", label: "81 cm²" }] }),
  judgment({ id: "g5s1-pa-08", unitId: "polygon-perimeter-area", learnerStageId: "pa.parallelogram-area", curriculumAnchorIds: ["[6수03-14]"], context: "수직으로 표시된 높이를 사용하세요.", prompt: "평행사변형의 넓이는 몇 cm²인가요?", visual: { kind: "perimeter-area-diagram", shape: "parallelogram", base: 7, height: 5 }, signalId: "pa.parallelogram-area", answers: [{ id: "thirty-five-square-cm-pa08", label: "35 cm²" }, { id: "twelve-square-cm-pa08", label: "12 cm²" }, { id: "forty-nine-square-cm-pa08", label: "49 cm²" }] }),
  judgment({ id: "g5s1-pa-09", unitId: "polygon-perimeter-area", learnerStageId: "pa.triangle-area", curriculumAnchorIds: ["[6수03-14]"], context: "밑변과 높이를 곱한 뒤 생각하세요.", prompt: "삼각형의 넓이는 몇 cm²인가요?", visual: { kind: "perimeter-area-diagram", shape: "triangle", base: 10, height: 6 }, signalId: "pa.triangle-area", answers: [{ id: "thirty-square-cm-pa09", label: "30 cm²" }, { id: "sixty-square-cm-pa09", label: "60 cm²" }, { id: "sixteen-square-cm-pa09", label: "16 cm²" }] }),
  judgment({ id: "g5s1-pa-10", unitId: "polygon-perimeter-area", learnerStageId: "pa.triangle-area", curriculumAnchorIds: ["[6수03-14]"], context: "같은 삼각형 두 개를 떠올려 보세요.", prompt: "삼각형의 넓이는 몇 cm²인가요?", visual: { kind: "perimeter-area-diagram", shape: "triangle", base: 8, height: 7 }, signalId: "pa.triangle-area", answers: [{ id: "twenty-eight-square-cm-pa10", label: "28 cm²" }, { id: "fifty-six-square-cm-pa10", label: "56 cm²" }, { id: "fifteen-square-cm-pa10", label: "15 cm²" }] }),
  judgment({ id: "g5s1-pa-11", unitId: "polygon-perimeter-area", learnerStageId: "pa.trapezoid-area", curriculumAnchorIds: ["[6수03-14]"], context: "윗변과 아랫변을 모두 사용하세요.", prompt: "사다리꼴의 넓이는 몇 cm²인가요?", visual: { kind: "perimeter-area-diagram", shape: "trapezoid", topBase: 6, bottomBase: 10, height: 5 }, signalId: "pa.trapezoid-area", answers: [{ id: "forty-square-cm-pa11", label: "40 cm²" }, { id: "eighty-square-cm-pa11", label: "80 cm²" }, { id: "fifty-five-square-cm-pa11", label: "55 cm²" }] }),
  judgment({ id: "g5s1-pa-12", unitId: "polygon-perimeter-area", learnerStageId: "pa.trapezoid-area", curriculumAnchorIds: ["[6수03-14]"], context: "두 평행한 변과 높이를 확인하세요.", prompt: "사다리꼴의 넓이는 몇 cm²인가요?", visual: { kind: "perimeter-area-diagram", shape: "trapezoid", topBase: 8, bottomBase: 14, height: 4 }, signalId: "pa.trapezoid-area", answers: [{ id: "forty-four-square-cm-pa12", label: "44 cm²" }, { id: "eighty-eight-square-cm-pa12", label: "88 cm²" }, { id: "forty-eight-square-cm-pa12", label: "48 cm²" }] }),
  judgment({ id: "g5s1-pa-13", unitId: "polygon-perimeter-area", learnerStageId: "pa.rhombus-area", curriculumAnchorIds: ["[6수03-14]"], context: "두 대각선의 길이를 사용하세요.", prompt: "마름모의 넓이는 몇 cm²인가요?", visual: { kind: "perimeter-area-diagram", shape: "rhombus", diagonal1: 10, diagonal2: 6 }, signalId: "pa.rhombus-area", answers: [{ id: "thirty-square-cm-pa13", label: "30 cm²" }, { id: "sixty-square-cm-pa13", label: "60 cm²" }, { id: "sixteen-square-cm-pa13", label: "16 cm²" }] }),
  judgment({ id: "g5s1-pa-14", unitId: "polygon-perimeter-area", learnerStageId: "pa.rhombus-area", curriculumAnchorIds: ["[6수03-14]"], context: "두 대각선을 곱한 뒤 생각하세요.", prompt: "마름모의 넓이는 몇 cm²인가요?", visual: { kind: "perimeter-area-diagram", shape: "rhombus", diagonal1: 12, diagonal2: 8 }, signalId: "pa.rhombus-area", answers: [{ id: "forty-eight-square-cm-pa14", label: "48 cm²" }, { id: "ninety-six-square-cm-pa14", label: "96 cm²" }, { id: "twenty-square-cm-pa14", label: "20 cm²" }] })
];

const unsigned: DiagnosisSet = {
  manifest: {
    id: "grade5-semester1",
    version: "1.0.0",
    checksum: "aec518a3b0ec6057072d7fccbaeb78fd937f27f26fb7cdfa126ef50028f48bc8",
    title: "5학년 1학기 수학 생각 지도",
    shortTitle: "5-1 수학 생각 지도",
    grade: 5,
    semester: 1,
    curriculum: "2022-revised",
    status: "review",
    units: [
      { id: "mixed-operations", order: 1, title: "자연수의 혼합 계산" },
      { id: "factors-multiples", order: 2, title: "약수와 배수" },
      { id: "correspondence", order: 3, title: "대응 관계" },
      { id: "fraction-reduction-common-denominator", order: 4, title: "약분과 통분" },
      { id: "fraction-add-subtract", order: 5, title: "분수의 덧셈과 뺄셈" },
      { id: "polygon-perimeter-area", order: 6, title: "다각형의 둘레와 넓이" }
    ],
    interactionTypes: [{ type: "choice", version: 1 }],
    estimatedMinutes: 35
  },
  curriculumAnchors: [
    grade5Semester1Anchor("[6수01-01]"),
    grade5Semester1Anchor("[6수01-04]"),
    grade5Semester1Anchor("[6수01-05]"),
    grade5Semester1Anchor("[6수02-01]"),
    grade5Semester1Anchor("[6수01-06]"),
    grade5Semester1Anchor("[6수01-07]"),
    grade5Semester1Anchor("[6수01-12]"),
    grade5Semester1Anchor("[6수01-08]"),
    grade5Semester1Anchor("[6수03-11]"),
    grade5Semester1Anchor("[6수03-12]"),
    grade5Semester1Anchor("[6수03-13]"),
    grade5Semester1Anchor("[6수03-14]")
  ],
  learnerStages: stages,
  signals,
  judgments
};

export const grade5Semester1Diagnosis =
  diagnosisSetSchema.parse(unsigned) as DiagnosisSet;
