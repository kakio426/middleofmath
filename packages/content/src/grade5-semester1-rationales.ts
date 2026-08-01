import type { DistractorRationale } from "./coverage";

type StageRationale = {
  stageId: string;
  misconceptionTitles: Record<string, string>;
  sharedSignalRationale: string;
  entries: Array<{
    judgmentId: string;
    distractors: [
      {
        choiceId: string;
        misconceptionId: string;
        signalIds: string[];
        derivation: string;
        rationale: string;
      },
      {
        choiceId: string;
        misconceptionId: string;
        signalIds: string[];
        derivation: string;
        rationale: string;
      }
    ];
  }>;
};

const stages: StageRationale[] = [
  {
    stageId: "mixed-operations.multiply-first",
    misconceptionTitles: {
      "mixed-operations.multiply-first.calculate-left-to-right": "식을 앞에서부터 차례로 계산함",
      "mixed-operations.multiply-first.stop-after-first-operation": "첫 계산값만 전체 답으로 적음"
    },
    sharedSignalRationale: "곱셈을 먼저 계산한 뒤 그 값을 남은 덧셈·뺄셈과 이어 계산했는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-mix-01",
        distractors: [
          { choiceId: "forty-four-01", misconceptionId: "mixed-operations.multiply-first.calculate-left-to-right", signalIds: ["mixed-operations.multiply-first"], derivation: "8+3=11을 먼저 계산한 뒤 11×4=44로 계산한다.", rationale: "덧셈보다 곱셈 3×4를 먼저 계산해야 합니다." },
          { choiceId: "twelve-01", misconceptionId: "mixed-operations.multiply-first.stop-after-first-operation", signalIds: ["mixed-operations.incomplete-expression"], derivation: "먼저 계산한 3×4=12를 남은 8과 더하지 않고 답으로 적는다.", rationale: "곱셈 결과 12를 다시 8과 더해 전체 식의 값을 구해야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-mix-02",
        distractors: [
          { choiceId: "twenty-02", misconceptionId: "mixed-operations.multiply-first.stop-after-first-operation", signalIds: ["mixed-operations.incomplete-expression"], derivation: "먼저 계산한 4×5=20을 남은 30에서 빼지 않고 답으로 적는다.", rationale: "곱셈 결과 20을 다시 30에서 빼 전체 식의 값을 구해야 합니다." },
          { choiceId: "one-hundred-thirty-02", misconceptionId: "mixed-operations.multiply-first.calculate-left-to-right", signalIds: ["mixed-operations.multiply-first"], derivation: "30−4=26을 먼저 계산한 뒤 26×5=130으로 계산한다.", rationale: "뺄셈보다 곱셈 4×5를 먼저 계산해야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "mixed-operations.divide-first",
    misconceptionTitles: {
      "mixed-operations.divide-first.calculate-add-subtract-first": "나눗셈보다 앞의 덧셈·뺄셈을 먼저 계산함",
      "mixed-operations.divide-first.group-neighboring-terms": "나누는 수 옆의 덧셈·뺄셈을 먼저 묶음"
    },
    sharedSignalRationale: "나눗셈과 그 앞뒤의 덧셈·뺄셈 가운데 어떤 부분을 먼저 계산했는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-mix-03",
        distractors: [
          { choiceId: "four-03", misconceptionId: "mixed-operations.divide-first.calculate-add-subtract-first", signalIds: ["mixed-operations.divide-first"], derivation: "12+24=36을 먼저 계산한 뒤 36÷6=6, 6−2=4로 계산한다.", rationale: "덧셈보다 나눗셈 24÷6을 먼저 계산해야 합니다." },
          { choiceId: "eighteen-03", misconceptionId: "mixed-operations.divide-first.group-neighboring-terms", signalIds: ["mixed-operations.divide-first"], derivation: "나누는 수 옆의 6−2=4를 먼저 묶은 뒤 24÷4=6, 12+6=18로 계산한다.", rationale: "나눗셈 24÷6을 먼저 계산한 뒤 2를 빼야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-mix-04",
        distractors: [
          { choiceId: "eight-04", misconceptionId: "mixed-operations.divide-first.calculate-add-subtract-first", signalIds: ["mixed-operations.divide-first"], derivation: "40−24=16을 먼저 계산한 뒤 16÷4=4, 4+4=8로 계산한다.", rationale: "뺄셈보다 나눗셈 24÷4를 먼저 계산해야 합니다." },
          { choiceId: "thirty-seven-04", misconceptionId: "mixed-operations.divide-first.group-neighboring-terms", signalIds: ["mixed-operations.divide-first"], derivation: "나누는 수 옆의 4+4=8을 먼저 묶은 뒤 24÷8=3, 40−3=37로 계산한다.", rationale: "나눗셈 24÷4를 먼저 계산한 뒤 4를 더해야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "mixed-operations.same-rank-left-to-right",
    misconceptionTitles: {
      "mixed-operations.same-rank-left-to-right.calculate-right-first": "같은 순위 계산을 오른쪽부터 계산함",
      "mixed-operations.same-rank-left-to-right.stop-after-first-operation": "첫 계산값만 전체 답으로 적음"
    },
    sharedSignalRationale: "같은 순위의 계산을 왼쪽부터 시작하고 첫 계산값을 오른쪽 계산과 이어 갔는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-mix-05",
        distractors: [
          { choiceId: "six-05", misconceptionId: "mixed-operations.same-rank-left-to-right.calculate-right-first", signalIds: ["mixed-operations.same-rank-left-to-right"], derivation: "오른쪽 3×4=12를 먼저 계산한 뒤 72÷12=6으로 계산한다.", rationale: "나눗셈과 곱셈은 같은 순위이므로 왼쪽의 72÷3부터 계산해야 합니다." },
          { choiceId: "twenty-four-05", misconceptionId: "mixed-operations.same-rank-left-to-right.stop-after-first-operation", signalIds: ["mixed-operations.incomplete-expression"], derivation: "왼쪽의 첫 계산 72÷3=24만 하고 이어지는 24×4를 하지 않는다.", rationale: "첫 계산값 24에 다시 4를 곱해 전체 식의 값을 구해야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-mix-06",
        distractors: [
          { choiceId: "thirty-06", misconceptionId: "mixed-operations.same-rank-left-to-right.calculate-right-first", signalIds: ["mixed-operations.same-rank-left-to-right"], derivation: "오른쪽 12−7=5를 먼저 계산한 뒤 35−5=30으로 계산한다.", rationale: "두 뺄셈은 같은 순위이므로 왼쪽의 35−12부터 계산해야 합니다." },
          { choiceId: "twenty-three-06", misconceptionId: "mixed-operations.same-rank-left-to-right.stop-after-first-operation", signalIds: ["mixed-operations.incomplete-expression"], derivation: "왼쪽의 첫 계산 35−12=23만 하고 이어지는 23−7을 하지 않는다.", rationale: "첫 계산값 23에서 다시 7을 빼 전체 식의 값을 구해야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "mixed-operations.parentheses-first",
    misconceptionTitles: {
      "mixed-operations.parentheses-first.ignore-parentheses": "괄호를 없는 것처럼 보고 계산함",
      "mixed-operations.parentheses-first.stop-after-parentheses": "첫 계산값만 전체 답으로 적음"
    },
    sharedSignalRationale: "괄호 안을 먼저 계산하고 그 값을 괄호 밖 계산과 이어 갔는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-mix-07",
        distractors: [
          { choiceId: "twenty-07", misconceptionId: "mixed-operations.parentheses-first.ignore-parentheses", signalIds: ["mixed-operations.parentheses-first"], derivation: "괄호를 무시하고 4×3=12를 먼저 계산하여 8+12=20으로 계산한다.", rationale: "괄호 안 8+4를 먼저 계산한 뒤 3을 곱해야 합니다." },
          { choiceId: "twelve-07", misconceptionId: "mixed-operations.parentheses-first.stop-after-parentheses", signalIds: ["mixed-operations.incomplete-expression"], derivation: "괄호 안의 8+4=12만 계산하고 이어지는 12×3을 하지 않는다.", rationale: "괄호 안 계산값 12에 다시 3을 곱해 전체 식의 값을 구해야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-mix-08",
        distractors: [
          { choiceId: "fifteen-08", misconceptionId: "mixed-operations.parentheses-first.ignore-parentheses", signalIds: ["mixed-operations.parentheses-first"], derivation: "괄호를 무시하고 72÷6=12를 먼저 계산하여 12+3=15로 계산한다.", rationale: "괄호 안 6+3을 먼저 계산한 뒤 72를 나누어야 합니다." },
          { choiceId: "nine-08", misconceptionId: "mixed-operations.parentheses-first.stop-after-parentheses", signalIds: ["mixed-operations.incomplete-expression"], derivation: "괄호 안의 6+3=9만 계산하고 이어지는 72÷9를 하지 않는다.", rationale: "괄호 안 계산값 9로 다시 72를 나누어 전체 식의 값을 구해야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "mixed-operations.full-order",
    misconceptionTitles: {
      "mixed-operations.full-order.restart-left-after-parentheses": "괄호 뒤의 식을 다시 왼쪽부터 계산함",
      "mixed-operations.full-order.ignore-parentheses": "괄호를 없애고 원래 식의 순서대로 계산함"
    },
    sharedSignalRationale: "괄호를 처리한 뒤에도 곱셈·나눗셈을 덧셈·뺄셈보다 먼저 적용하는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-mix-09",
        distractors: [
          { choiceId: "eleven-09", misconceptionId: "mixed-operations.full-order.restart-left-after-parentheses", signalIds: ["mixed-operations.full-order"], derivation: "괄호 안 8−4=4 뒤에 20+24=44를 먼저 계산하여 44÷4=11로 계산한다.", rationale: "괄호를 계산한 뒤에는 24÷4를 20+24보다 먼저 계산해야 합니다." },
          { choiceId: "nineteen-09", misconceptionId: "mixed-operations.full-order.ignore-parentheses", signalIds: ["mixed-operations.full-order"], derivation: "괄호를 무시하고 24÷8=3을 계산한 뒤 20+3−4=19로 계산한다.", rationale: "먼저 괄호 안 8−4를 하나의 수 4로 만들어야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-mix-10",
        distractors: [
          { choiceId: "one-hundred-sixty-eight-10", misconceptionId: "mixed-operations.full-order.restart-left-after-parentheses", signalIds: ["mixed-operations.full-order"], derivation: "괄호 안 6+2=8 뒤에 50−8=42를 먼저 계산하여 42×4=168로 계산한다.", rationale: "괄호를 계산한 뒤에는 8×4를 50−8보다 먼저 계산해야 합니다." },
          { choiceId: "fifty-two-10", misconceptionId: "mixed-operations.full-order.ignore-parentheses", signalIds: ["mixed-operations.full-order"], derivation: "괄호를 무시하고 2×4=8을 먼저 계산하여 50−6+8=52로 계산한다.", rationale: "먼저 괄호 안 6+2를 하나의 수 8로 만들어야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "factors.list-divisors",
    misconceptionTitles: {
      "factors.list-divisors.omit-one-and-self": "1과 자기 자신을 약수에서 뺌",
      "factors.list-divisors.include-nondivisor": "나머지가 있는 수도 약수에 넣음"
    },
    sharedSignalRationale: "1과 자기 자신을 포함하고 나머지 없이 나누어지는 수만 약수 목록에 넣었는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-fm-01",
        distractors: [
          { choiceId: "without-ends-18", misconceptionId: "factors.list-divisors.omit-one-and-self", signalIds: ["factors.list-divisors"], derivation: "18의 약수 1, 2, 3, 6, 9, 18에서 1과 18을 빼면 선택한 2, 3, 6, 9가 된다.", rationale: "1과 자기 자신인 18도 18을 나머지 없이 나누므로 약수에 포함해야 합니다." },
          { choiceId: "with-four-18", misconceptionId: "factors.list-divisors.include-nondivisor", signalIds: ["factors.list-divisors"], derivation: "18을 4로 나누면 몫은 4, 나머지는 2인데 나머지를 무시해 4를 넣으면 선택한 1, 2, 3, 4, 6, 9, 18이 된다.", rationale: "18을 4로 나누면 나머지가 있으므로 4는 18의 약수가 아닙니다." }
        ]
      },
      {
        judgmentId: "g5s1-fm-02",
        distractors: [
          { choiceId: "without-ends-24", misconceptionId: "factors.list-divisors.omit-one-and-self", signalIds: ["factors.list-divisors"], derivation: "24의 약수 1, 2, 3, 4, 6, 8, 12, 24에서 1과 24를 빼면 선택한 2, 3, 4, 6, 8, 12가 된다.", rationale: "1과 자기 자신인 24도 24를 나머지 없이 나누므로 약수에 포함해야 합니다." },
          { choiceId: "with-five-24", misconceptionId: "factors.list-divisors.include-nondivisor", signalIds: ["factors.list-divisors"], derivation: "24를 5로 나누면 몫은 4, 나머지는 4인데 나머지를 무시해 5를 넣으면 선택한 1, 2, 3, 4, 5, 6, 8, 12, 24가 된다.", rationale: "24를 5로 나누면 나머지가 있으므로 5는 24의 약수가 아닙니다." }
        ]
      }
    ]
  },
  {
    stageId: "factors.common-and-greatest",
    misconceptionTitles: {
      "factors.common-and-greatest.use-union": "한쪽에만 있는 수도 공약수로 봄",
      "factors.common-and-greatest.stop-early": "공약수를 끝까지 확인하지 않고 멈춤"
    },
    sharedSignalRationale: "두 약수 목록을 합치는 대신 양쪽에 모두 있는 수만 남기고 그중 가장 큰 수까지 찾았는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-fm-03",
        distractors: [
          { choiceId: "union-12-18", misconceptionId: "factors.common-and-greatest.use-union", signalIds: ["factors-multiples.common-set"], derivation: "12의 약수와 18의 약수를 모두 합치면 선택한 1, 2, 3, 4, 6, 9, 12, 18이 된다.", rationale: "공약수는 두 목록을 합친 수가 아니라 두 목록에 모두 있는 1, 2, 3, 6입니다." },
          { choiceId: "stopped-12-18", misconceptionId: "factors.common-and-greatest.stop-early", signalIds: ["factors.common-and-greatest"], derivation: "공약수 1, 2, 3, 6을 찾다가 6을 확인하기 전에 멈추면 선택한 1, 2, 3이 된다.", rationale: "6도 두 수의 약수이므로 공약수에 넣어야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-fm-04",
        distractors: [
          { choiceId: "one-sided-greatest-16-24", misconceptionId: "factors.common-and-greatest.use-union", signalIds: ["factors-multiples.common-set"], derivation: "24의 약수 12를 16의 약수에도 들어 있다고 잘못 보고 가장 큰 공약수로 고르면 선택한 12가 된다.", rationale: "12는 16을 나머지 없이 나누지 못합니다. 두 수의 약수에 모두 있는 수 중 가장 큰 8을 골라야 합니다." },
          { choiceId: "stopped-greatest-16-24", misconceptionId: "factors.common-and-greatest.stop-early", signalIds: ["factors.common-and-greatest"], derivation: "공약수 1, 2, 4까지만 확인하고 8을 확인하기 전에 멈추면 가장 큰 수로 선택한 4가 된다.", rationale: "8도 두 수의 약수입니다. 공약수를 끝까지 확인한 뒤 가장 큰 8을 골라야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "multiples.list-multiples",
    misconceptionTitles: {
      "multiples.list-multiples.start-at-double": "자기 자신인 1배를 빼고 2배부터 셈",
      "multiples.list-multiples.count-by-one": "곱하지 않고 1씩 큰 수를 씀"
    },
    sharedSignalRationale: "주어진 수에 1부터 차례로 곱해 자기 자신부터 배수 목록을 만들었는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-fm-05",
        distractors: [
          { choiceId: "start-two-7", misconceptionId: "multiples.list-multiples.start-at-double", signalIds: ["multiples.list-multiples"], derivation: "7×2=14, 7×3=21, 7×4=28, 7×5=35로 2배부터 쓰면 선택한 14, 21, 28, 35가 된다.", rationale: "7×1=7도 7의 배수이므로 가장 먼저 써야 합니다." },
          { choiceId: "count-up-7", misconceptionId: "multiples.list-multiples.count-by-one", signalIds: ["multiples.list-multiples"], derivation: "7에서 1씩 더해 7, 8, 9, 10을 쓰면 선택한 7, 8, 9, 10이 된다.", rationale: "7의 배수는 7에 1, 2, 3, 4를 차례로 곱해 찾아야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-fm-06",
        distractors: [
          { choiceId: "start-two-9", misconceptionId: "multiples.list-multiples.start-at-double", signalIds: ["multiples.list-multiples"], derivation: "9×2=18, 9×3=27, 9×4=36, 9×5=45로 2배부터 쓰면 선택한 18, 27, 36, 45가 된다.", rationale: "9×1=9도 9의 배수이므로 가장 먼저 써야 합니다." },
          { choiceId: "count-up-9", misconceptionId: "multiples.list-multiples.count-by-one", signalIds: ["multiples.list-multiples"], derivation: "9에서 1씩 더해 9, 10, 11, 12를 쓰면 선택한 9, 10, 11, 12가 된다.", rationale: "9의 배수는 9에 1, 2, 3, 4를 차례로 곱해 찾아야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "multiples.common-and-least",
    misconceptionTitles: {
      "multiples.common-and-least.start-at-product": "두 수의 곱부터 공배수를 시작함",
      "multiples.common-and-least.use-union": "한쪽에만 있는 배수도 공배수로 봄"
    },
    sharedSignalRationale: "두 수의 배수 목록에서 양쪽에 모두 있는 수만 남기고 가장 작은 공배수부터 썼는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-fm-07",
        distractors: [
          { choiceId: "product-start-4-8", misconceptionId: "multiples.common-and-least.start-at-product", signalIds: ["multiples.common-and-least"], derivation: "4×8=32부터 32×1=32, 32×2=64, 32×3=96으로 쓰면 선택한 32, 64, 96이 된다.", rationale: "4와 8의 첫 공배수는 두 수의 곱 32가 아니라 더 작은 8입니다." },
          { choiceId: "merged-4-8", misconceptionId: "multiples.common-and-least.use-union", signalIds: ["factors-multiples.common-set"], derivation: "4의 배수와 8의 배수를 섞어 앞의 수를 쓰면 선택한 4, 8, 12가 된다.", rationale: "4와 12는 두 목록에 모두 있지 않습니다. 4와 8의 배수에 함께 있는 8부터 써야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-fm-08",
        distractors: [
          { choiceId: "product-least-6-8", misconceptionId: "multiples.common-and-least.start-at-product", signalIds: ["multiples.common-and-least"], derivation: "6×8=48을 두 수의 첫 공배수로 보면 최소공배수로 선택한 48이 된다.", rationale: "6과 8의 첫 공배수는 두 수의 곱 48이 아니라 더 작은 24입니다." },
          { choiceId: "one-sided-least-6-8", misconceptionId: "multiples.common-and-least.use-union", signalIds: ["factors-multiples.common-set"], derivation: "6의 배수 12를 8의 배수에도 들어 있다고 잘못 보고 최소공배수로 고르면 선택한 12가 된다.", rationale: "12는 8의 배수가 아닙니다. 두 수의 배수에 모두 있는 수 중 가장 작은 24를 골라야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "factors-multiples.apply-in-context",
    misconceptionTitles: {
      "factors-multiples.apply-in-context.swap-gcd-lcm": "나누기와 다시 만나기 상황을 반대로 고름",
      "factors-multiples.apply-in-context.add-given-numbers": "두 수를 더해서 답함"
    },
    sharedSignalRationale: "똑같이 나누어 담는 상황과 다시 함께 일어나는 상황을 구별하고 두 수를 단순히 더하지 않았는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-fm-09",
        distractors: [
          { choiceId: "lcm-as-bags", misconceptionId: "factors-multiples.apply-in-context.swap-gcd-lcm", signalIds: ["factors-multiples.apply-in-context"], derivation: "나누어 담는 상황을 다시 만나는 상황으로 보고 12와 18의 최소공배수 36을 구하면 선택한 36이 된다.", rationale: "남기지 않고 똑같이 나눌 봉지 수는 두 수의 최대공약수 6으로 찾아야 합니다." },
          { choiceId: "sum-as-bags", misconceptionId: "factors-multiples.apply-in-context.add-given-numbers", signalIds: ["factors-multiples.apply-in-context"], derivation: "사탕과 젤리의 수를 더해 12+18=30으로 계산하면 선택한 30이 된다.", rationale: "전체 간식 수가 아니라 12와 18을 모두 나누어떨어지게 하는 가장 큰 수를 찾아야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-fm-10",
        distractors: [
          { choiceId: "gcd-as-minutes", misconceptionId: "factors-multiples.apply-in-context.swap-gcd-lcm", signalIds: ["factors-multiples.apply-in-context"], derivation: "다시 함께 오는 상황을 나누어 담는 상황으로 보고 6과 8의 최대공약수 2를 구하면 선택한 2가 된다.", rationale: "다시 함께 오는 때는 두 수의 최소공배수 24로 찾아야 합니다." },
          { choiceId: "sum-as-minutes", misconceptionId: "factors-multiples.apply-in-context.add-given-numbers", signalIds: ["factors-multiples.apply-in-context"], derivation: "두 버스의 간격을 더해 6+8=14로 계산하면 선택한 14가 된다.", rationale: "두 간격을 더하지 말고 6의 배수와 8의 배수에서 처음 함께 나오는 24를 찾아야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "correspondence.pair-from-table",
    misconceptionTitles: {
      "correspondence.pair-from-table.repeat-last-difference": "오른쪽 값의 마지막 차이를 그대로 더함",
      "correspondence.pair-from-table.match-left-increase": "왼쪽이 늘어난 만큼 오른쪽도 늘어난다고 봄"
    },
    sharedSignalRationale: "대응표에서 한 양의 변화만 따라가지 않고 각 행의 두 양이 어떤 계산으로 짝을 이루는지 함께 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-cor-01",
        distractors: [
          { choiceId: "right-difference-49", misconceptionId: "correspondence.pair-from-table.repeat-last-difference", signalIds: ["correspondence.pair-from-table"], derivation: "사탕 수 21에서 35로 늘어난 차이 35−21=14를 다음에도 그대로 더해 35+14=49로 계산하면 선택한 49가 된다.", rationale: "묶음 수의 간격이 일정하지 않으므로 사탕 수의 마지막 차이를 그대로 더할 수 없습니다. 한 묶음에 7개씩인 관계로 6×7=42를 구해야 합니다." },
          { choiceId: "same-increase-36", misconceptionId: "correspondence.pair-from-table.match-left-increase", signalIds: ["correspondence.pair-from-table"], derivation: "묶음 수가 5에서 6으로 1 늘었으니 사탕 수도 1 늘어난다고 보고 35+1=36으로 계산하면 선택한 36이 된다.", rationale: "묶음 수가 1 늘면 사탕 수는 7 늘어납니다. 두 양의 짝을 함께 보고 6×7=42를 구해야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-cor-02",
        distractors: [
          { choiceId: "right-difference-32", misconceptionId: "correspondence.pair-from-table.repeat-last-difference", signalIds: ["correspondence.pair-from-table"], derivation: "공 수 24에서 28로 늘어난 차이 28−24=4를 다음에도 그대로 더해 28+4=32로 계산하면 선택한 32가 된다.", rationale: "상자 수의 간격이 일정하지 않으므로 공 수의 마지막 차이를 그대로 더할 수 없습니다. 한 상자에 4개씩인 관계로 9×4=36을 구해야 합니다." },
          { choiceId: "same-increase-30", misconceptionId: "correspondence.pair-from-table.match-left-increase", signalIds: ["correspondence.pair-from-table"], derivation: "상자 수가 7에서 9로 2 늘었으니 공 수도 2 늘어난다고 보고 28+2=30으로 계산하면 선택한 30이 된다.", rationale: "상자 수가 2 늘면 공 수는 8 늘어납니다. 두 양의 짝을 함께 보고 9×4=36을 구해야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "correspondence.symbol-expression",
    misconceptionTitles: {
      "correspondence.symbol-expression.fit-first-row-only": "대응표의 첫 행에만 맞는 식을 고름",
      "correspondence.symbol-expression.replace-multiply-with-add": "곱하는 관계를 더하는 관계로 봄"
    },
    sharedSignalRationale: "□와 △의 식이 대응표의 첫 행뿐 아니라 모든 행에 맞는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-cor-03",
        distractors: [
          { choiceId: "first-row-plus-eight", misconceptionId: "correspondence.symbol-expression.fit-first-row-only", signalIds: ["correspondence.symbol-expression"], derivation: "첫 행 2+8=10만 확인해 △ = □ + 8로 나타내면 선택한 △ = □ + 8이 되지만 둘째 행은 3+8=11로 15와 다르다.", rationale: "첫 행에만 맞는 식입니다. 세 행 모두에서 △는 □의 5배이므로 △ = □ × 5로 나타내야 합니다." },
          { choiceId: "times-as-plus-five", misconceptionId: "correspondence.symbol-expression.replace-multiply-with-add", signalIds: ["correspondence.symbol-expression"], derivation: "한 묶음마다 5장인 관계의 5를 곱하는 수가 아니라 더하는 수로 옮겨 △ = □ + 5를 쓰면 선택한 식이 된다.", rationale: "5를 더하는 관계가 아니라 □에 5를 곱하는 관계입니다." }
        ]
      },
      {
        judgmentId: "g5s1-cor-04",
        distractors: [
          { choiceId: "first-row-plus-eight-04", misconceptionId: "correspondence.symbol-expression.fit-first-row-only", signalIds: ["correspondence.symbol-expression"], derivation: "첫 행 4+8=12만 확인해 △ = □ + 8로 나타내면 선택한 △ = □ + 8이 되지만 둘째 행은 6+8=14로 18과 다르다.", rationale: "첫 행에만 맞는 식입니다. 세 행 모두에서 △는 □의 3배이므로 △ = □ × 3으로 나타내야 합니다." },
          { choiceId: "times-as-plus-three", misconceptionId: "correspondence.symbol-expression.replace-multiply-with-add", signalIds: ["correspondence.symbol-expression"], derivation: "한 사람마다 3자루인 관계의 3을 곱하는 수가 아니라 더하는 수로 옮겨 △ = □ + 3을 쓰면 선택한 식이 된다.", rationale: "3을 더하는 관계가 아니라 □에 3을 곱하는 관계입니다." }
        ]
      }
    ]
  },
  {
    stageId: "correspondence.base-and-dependent",
    misconceptionTitles: {
      "correspondence.base-and-dependent.swap-variables": "□와 △의 자리를 바꾸어 식을 씀",
      "correspondence.base-and-dependent.replace-divide-with-multiply": "나누는 관계를 곱하는 관계로 봄"
    },
    sharedSignalRationale: "□의 값으로 △를 구하는 방향을 정한 뒤 나눗셈 관계를 그대로 식에 나타냈는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-cor-05",
        distractors: [
          { choiceId: "square-triangle-divide-five", misconceptionId: "correspondence.base-and-dependent.swap-variables", signalIds: ["correspondence.base-and-dependent"], derivation: "□와 △의 자리를 바꾸어 □ = △ ÷ 5를 쓰면 선택한 □ = △ ÷ 5가 되고 첫 행의 3÷5는 15가 아니어서 표와 맞지 않는다.", rationale: "□인 구슬 수로 △인 봉지 수를 구해야 하므로 △ = □ ÷ 5로 나타내야 합니다." },
          { choiceId: "divide-as-times-five", misconceptionId: "correspondence.base-and-dependent.replace-divide-with-multiply", signalIds: ["correspondence.base-and-dependent"], derivation: "구슬 5개마다 봉지 1개인 나눗셈 관계를 곱셈으로 바꾸어 △ = □ × 5를 고르면 선택한 △ = □ × 5가 된다.", rationale: "봉지 수는 구슬 수를 5로 나누어 구하므로 곱셈이 아니라 나눗셈을 써야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-cor-06",
        distractors: [
          { choiceId: "square-triangle-divide-six", misconceptionId: "correspondence.base-and-dependent.swap-variables", signalIds: ["correspondence.base-and-dependent"], derivation: "□와 △의 자리를 바꾸어 □ = △ ÷ 6을 쓰면 선택한 □ = △ ÷ 6이 되고 첫 행의 4÷6은 24가 아니어서 표와 맞지 않는다.", rationale: "□인 사탕 수로 △인 접시 수를 구해야 하므로 △ = □ ÷ 6으로 나타내야 합니다." },
          { choiceId: "divide-as-times-six", misconceptionId: "correspondence.base-and-dependent.replace-divide-with-multiply", signalIds: ["correspondence.base-and-dependent"], derivation: "사탕 6개마다 접시 1개인 나눗셈 관계를 곱셈으로 바꾸어 △ = □ × 6을 고르면 선택한 △ = □ × 6이 된다.", rationale: "접시 수는 사탕 수를 6으로 나누어 구하므로 곱셈이 아니라 나눗셈을 써야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "correspondence.apply-backward",
    misconceptionTitles: {
      "correspondence.apply-backward.extend-nearest-row": "표의 가까운 행에서 한 단계만 늘림",
      "correspondence.apply-backward.skip-inverse-operation": "관계를 되돌리는 반대 계산을 하지 않음"
    },
    sharedSignalRationale: "표의 가까운 행만 따라가지 않고 주어진 기호식의 계산을 반대로 하여 처음 양을 찾았는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-cor-07",
        distractors: [
          { choiceId: "nearest-row-six", misconceptionId: "correspondence.apply-backward.extend-nearest-row", signalIds: ["correspondence.apply-backward"], derivation: "표에서 구슬 수가 가장 큰 행 (묶음 수, 구슬 수)=(5, 40)을 찾고 묶음을 하나만 늘려 선택한 6이 된다.", rationale: "△가 40에서 56으로 16 늘면 □는 2 늘어납니다. 56÷8=7로 구해야 합니다." },
          { choiceId: "subtract-inverse-48", misconceptionId: "correspondence.apply-backward.skip-inverse-operation", signalIds: ["correspondence.apply-backward"], derivation: "△ = □ × 8을 되돌릴 때 8로 나누지 않고 56−8=48로 계산하면 선택한 48이 된다.", rationale: "8을 곱한 관계는 8로 나누어 되돌려야 하므로 56÷8=7입니다." }
        ]
      },
      {
        judgmentId: "g5s1-cor-08",
        distractors: [
          { choiceId: "nearest-row-sixty", misconceptionId: "correspondence.apply-backward.extend-nearest-row", signalIds: ["correspondence.apply-backward"], derivation: "표에서 묶음 수가 가장 큰 행 (연필 수, 묶음 수)=(54, 9)을 찾고 연필 한 묶음 6자루만 더해 54+6=60으로 계산하면 선택한 60이 된다.", rationale: "묶음 수가 9에서 12로 3 늘었으므로 연필은 3묶음만큼 늘어납니다. 기호식을 거꾸로 써서 12×6=72를 구해야 합니다." },
          { choiceId: "repeat-divide-two", misconceptionId: "correspondence.apply-backward.skip-inverse-operation", signalIds: ["correspondence.apply-backward"], derivation: "△ = □ ÷ 6을 거꾸로 쓸 때 6을 곱하지 않고 다시 12÷6=2로 계산하면 선택한 2가 된다.", rationale: "6으로 나눈 관계를 되돌릴 때는 6을 곱해야 하므로 12×6=72입니다." }
        ]
      }
    ]
  },
  {
    stageId: "correspondence.change-together",
    misconceptionTitles: {
      "correspondence.change-together.reuse-table-difference": "표에서 본 한 번의 변화량을 그대로 답함",
      "correspondence.change-together.add-change-and-factor": "한 양의 변화량과 관계의 수를 더함"
    },
    sharedSignalRationale: "한 양이 늘어난 양과 대응하는 다른 양이 늘어난 양을 관계에 맞게 함께 계산했는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-cor-09",
        distractors: [
          { choiceId: "table-change-twenty-one", misconceptionId: "correspondence.change-together.reuse-table-difference", signalIds: ["correspondence.change-together"], derivation: "표에서 사과 수가 35에서 56으로 늘어난 한 번의 차이 56−35=21을 질문의 변화량으로 그대로 쓰면 선택한 21이 된다.", rationale: "표의 21은 상자가 3개 늘 때의 변화입니다. 상자가 4개 늘면 사과는 4×7=28개 늘어납니다." },
          { choiceId: "increase-plus-factor-11", misconceptionId: "correspondence.change-together.add-change-and-factor", signalIds: ["correspondence.change-together"], derivation: "상자가 늘어난 양 4와 관계의 수 7을 더해 4+7=11로 계산하면 선택한 11이 된다.", rationale: "두 수를 더하지 않고 상자가 늘어난 양 4에 관계의 수 7을 곱해야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-cor-10",
        distractors: [
          { choiceId: "table-change-one", misconceptionId: "correspondence.change-together.reuse-table-difference", signalIds: ["correspondence.change-together"], derivation: "표에서 상자 수가 4에서 5로 늘어난 한 번의 차이 5−4=1을 질문의 변화량으로 그대로 쓰면 선택한 1이 된다.", rationale: "표의 1은 공이 7개 늘 때의 변화입니다. 공이 14개 늘면 상자는 14÷7=2개 늘어납니다." },
          { choiceId: "increase-plus-factor-21", misconceptionId: "correspondence.change-together.add-change-and-factor", signalIds: ["correspondence.change-together"], derivation: "공이 늘어난 양 14와 한 상자에 담는 공 수 7을 더해 14+7=21로 계산하면 선택한 21이 된다.", rationale: "두 수를 더하지 않고 공이 늘어난 양 14를 한 상자에 담는 공 수 7로 나누어야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "frac-equiv.multiply-both",
    misconceptionTitles: {
      "frac-equiv.multiply-both.change-denominator-only": "분모에만 곱해 분수의 크기를 바꿈",
      "frac-equiv.multiply-both.add-to-both": "분자와 분모에 같은 수를 더함"
    },
    sharedSignalRationale: "크기가 같은 분수를 만들 때 분자와 분모에 같은 수를 곱했는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-frq-01",
        distractors: [
          { choiceId: "two-twelfths-01", misconceptionId: "frac-equiv.multiply-both.change-denominator-only", signalIds: ["frac-equiv.multiply-both"], derivation: "2/3에서 분모 3에만 4를 곱해 2/12를 고른다.", rationale: "분모에 4를 곱했다면 분자에도 4를 곱해 8/12로 나타내야 합니다." },
          { choiceId: "six-sevenths-01", misconceptionId: "frac-equiv.multiply-both.add-to-both", signalIds: ["frac-equiv.multiply-both"], derivation: "2/3의 분자와 분모에 각각 4를 더해 6/7을 고른다.", rationale: "분자와 분모에 같은 수를 더하면 분수의 크기가 유지되지 않습니다. 같은 수를 곱해야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-frq-02",
        distractors: [
          { choiceId: "three-fifteenths-02", misconceptionId: "frac-equiv.multiply-both.change-denominator-only", signalIds: ["frac-equiv.multiply-both"], derivation: "3/5에서 분모 5에만 3을 곱해 3/15를 고른다.", rationale: "분모에 3을 곱했다면 분자에도 3을 곱해 9/15로 나타내야 합니다." },
          { choiceId: "six-eighths-02", misconceptionId: "frac-equiv.multiply-both.add-to-both", signalIds: ["frac-equiv.multiply-both"], derivation: "3/5의 분자와 분모에 각각 3을 더해 6/8을 고른다.", rationale: "분자와 분모에 같은 수를 더하지 말고 각각 같은 수를 곱해야 크기가 유지됩니다." }
        ]
      }
    ]
  },
  {
    stageId: "frac-equiv.divide-both",
    misconceptionTitles: {
      "frac-equiv.divide-both.divide-numerator-by-target-denominator": "새 분모로 분자를 나눔",
      "frac-equiv.divide-both.divide-by-different-numbers": "분자와 분모를 서로 다른 수로 나눔"
    },
    sharedSignalRationale: "약분할 때 분모를 바꾼 나눗수를 찾고 분자에도 같은 나눗수를 적용했는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-frq-03",
        distractors: [
          { choiceId: "two-sixths-03", misconceptionId: "frac-equiv.divide-both.divide-numerator-by-target-denominator", signalIds: ["frac-equiv.divide-both"], derivation: "목표 분모 6으로 분자 12를 나누어 2/6을 고른다.", rationale: "18을 6으로 만들 때 3으로 나누었으므로 12도 3으로 나누어 4/6으로 나타내야 합니다." },
          { choiceId: "three-sixths-03", misconceptionId: "frac-equiv.divide-both.divide-by-different-numbers", signalIds: ["frac-equiv.divide-both"], derivation: "분자 12는 4로 나누고 분모 18은 3으로 나누어 3/6을 고른다.", rationale: "약분할 때 분자와 분모를 서로 다른 수가 아니라 같은 수로 나누어야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-frq-04",
        distractors: [
          { choiceId: "two-ninths-04", misconceptionId: "frac-equiv.divide-both.divide-numerator-by-target-denominator", signalIds: ["frac-equiv.divide-both"], derivation: "목표 분모 9로 분자 18을 나누어 2/9를 고른다.", rationale: "27을 9로 만들 때 3으로 나누었으므로 18도 3으로 나누어 6/9로 나타내야 합니다." },
          { choiceId: "nine-ninths-04", misconceptionId: "frac-equiv.divide-both.divide-by-different-numbers", signalIds: ["frac-equiv.divide-both"], derivation: "분자 18은 2로 나누고 분모 27은 3으로 나누어 9/9를 고른다.", rationale: "분자와 분모를 같은 수로 나누어야 분수의 크기가 바뀌지 않습니다." }
        ]
      }
    ]
  },
  {
    stageId: "frac-equiv.simplest-form",
    misconceptionTitles: {
      "frac-equiv.simplest-form.divide-by-different-numbers": "분자와 분모를 서로 다른 수로 나눔",
      "frac-equiv.simplest-form.subtract-gcd": "최대공약수를 빼서 분자와 분모를 바꿈"
    },
    sharedSignalRationale: "약분한 분수와 원래 분수의 크기가 같고 분자와 분모의 공약수가 1만 남았는지 함께 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-frq-05",
        distractors: [
          { choiceId: "ten-twelfths-05", misconceptionId: "frac-equiv.simplest-form.divide-by-different-numbers", signalIds: ["frac-equiv.simplest-form"], derivation: "분자 20은 2로 나누고 분모 36은 3으로 나누어 10/12를 고른다.", rationale: "20과 36을 같은 공약수로 나누어야 원래 분수의 크기를 유지할 수 있습니다." },
          { choiceId: "sixteen-thirty-seconds-05", misconceptionId: "frac-equiv.simplest-form.subtract-gcd", signalIds: ["frac-equiv.simplest-form"], derivation: "20과 36의 공약수 4를 두 수에서 빼서 16/32를 고른다.", rationale: "공약수를 빼는 것이 아니라 분자와 분모를 같은 공약수로 나누어야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-frq-06",
        distractors: [
          { choiceId: "six-fifteenths-06", misconceptionId: "frac-equiv.simplest-form.divide-by-different-numbers", signalIds: ["frac-equiv.simplest-form"], derivation: "분자 18은 3으로 나누고 분모 30은 2로 나누어 6/15를 고른다.", rationale: "약분할 때는 분자와 분모를 같은 공약수로 나누어야 합니다." },
          { choiceId: "twelve-twenty-fourths-06", misconceptionId: "frac-equiv.simplest-form.subtract-gcd", signalIds: ["frac-equiv.simplest-form"], derivation: "18과 30의 최대공약수 6을 두 수에서 빼서 12/24를 고른다.", rationale: "최대공약수 6을 빼지 말고 분자와 분모를 각각 6으로 나누어야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "frac-equiv.common-denominator",
    misconceptionTitles: {
      "frac-equiv.common-denominator.change-denominator-only": "분모만 공통분모로 바꿈",
      "frac-equiv.common-denominator.multiply-by-original-denominator": "분자에 원래 분모를 곱함"
    },
    sharedSignalRationale: "공통분모가 원래 분모의 몇 배인지 찾고 분자에도 같은 수를 곱했는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-frq-07",
        distractors: [
          { choiceId: "one-twelfth-07", misconceptionId: "frac-equiv.common-denominator.change-denominator-only", signalIds: ["frac-equiv.common-denominator"], derivation: "1/4에서 분모만 12로 바꾸어 1/12를 고른다.", rationale: "4에 3을 곱해 12를 만들었으므로 분자 1에도 3을 곱해 3/12로 나타내야 합니다." },
          { choiceId: "four-twelfths-07", misconceptionId: "frac-equiv.common-denominator.multiply-by-original-denominator", signalIds: ["frac-equiv.common-denominator"], derivation: "분자 1에 원래 분모 4를 곱해 4/12를 고른다.", rationale: "분자에는 원래 분모가 아니라 분모를 12로 만든 배수 3을 곱해야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-frq-08",
        distractors: [
          { choiceId: "three-twentieths-08", misconceptionId: "frac-equiv.common-denominator.change-denominator-only", signalIds: ["frac-equiv.common-denominator"], derivation: "3/4에서 분모만 20으로 바꾸어 3/20을 고른다.", rationale: "4에 5를 곱해 20을 만들었으므로 분자 3에도 5를 곱해 15/20으로 나타내야 합니다." },
          { choiceId: "twelve-twentieths-08", misconceptionId: "frac-equiv.common-denominator.multiply-by-original-denominator", signalIds: ["frac-equiv.common-denominator"], derivation: "분자 3에 원래 분모 4를 곱해 12/20을 고른다.", rationale: "분자에는 원래 분모가 아니라 공통분모를 만든 배수 5를 곱해야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "frac-compare.different-denominator",
    misconceptionTitles: {
      "frac-compare.different-denominator.compare-numerators-only": "분자 숫자만 보고 분수의 크기를 정함",
      "frac-compare.different-denominator.compare-denominators-only": "분모 숫자만 보고 분수의 크기를 정함"
    },
    sharedSignalRationale: "분자나 분모 한쪽의 숫자만 보지 않고 분모를 같게 하여 분수 전체의 크기를 비교했는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-frq-09",
        distractors: [
          { choiceId: "seven-ninths-09", misconceptionId: "frac-compare.different-denominator.compare-numerators-only", signalIds: ["frac-compare.different-denominator"], derivation: "분자 7이 가장 크다는 이유로 7/9를 고른다.", rationale: "분자 숫자만 크다고 분수도 큰 것은 아닙니다. 통분하면 4/5가 가장 큽니다." },
          { choiceId: "two-thirds-09", misconceptionId: "frac-compare.different-denominator.compare-denominators-only", signalIds: ["frac-compare.different-denominator"], derivation: "분모 3이 가장 작다는 이유로 2/3를 고른다.", rationale: "분모만 보고 판단하지 말고 세 분수를 같은 분모로 바꾸어 비교해야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-frq-10",
        distractors: [
          { choiceId: "two-thirds-10", misconceptionId: "frac-compare.different-denominator.compare-numerators-only", signalIds: ["frac-compare.different-denominator"], derivation: "분자 2가 가장 작다는 이유로 2/3를 고른다.", rationale: "분자 숫자만 비교할 수 없습니다. 같은 분모로 바꾸면 3/8이 가장 작습니다." },
          { choiceId: "seven-tenths-10", misconceptionId: "frac-compare.different-denominator.compare-denominators-only", signalIds: ["frac-compare.different-denominator"], derivation: "분모 10이 가장 크다는 이유로 7/10을 가장 작다고 고른다.", rationale: "분모가 크다는 이유만으로 가장 작다고 할 수 없습니다. 통분해 분수 전체를 비교해야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "frac-decimal.convert",
    misconceptionTitles: {
      "frac-decimal.convert.concatenate-digits": "분자와 분모를 소수점 양옆에 이어 씀",
      "frac-decimal.convert.ignore-place-value": "분모 10·100의 자릿값을 적용하지 않음"
    },
    sharedSignalRationale: "분모를 10이나 100으로 바꾸고 소수 자릿값과 분수의 분모를 정확히 연결했는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-frq-11",
        distractors: [
          { choiceId: "zero-point-three-five-11", misconceptionId: "frac-decimal.convert.concatenate-digits", signalIds: ["frac-decimal.convert"], derivation: "3/5의 분자 3과 분모 5를 소수점 양옆에 이어 써 0.35를 고른다.", rationale: "분자와 분모를 이어 쓰지 말고 3/5의 분모를 10으로 만들어 6/10, 즉 0.6으로 바꾸어야 합니다." },
          { choiceId: "zero-point-three-11", misconceptionId: "frac-decimal.convert.ignore-place-value", signalIds: ["frac-decimal.convert"], derivation: "분자 3만 소수 첫째 자리에 놓아 0.3을 고른다.", rationale: "분자만 옮길 수 없습니다. 3/5는 분자와 분모에 2를 곱한 6/10이므로 0.6입니다." }
        ]
      },
      {
        judgmentId: "g5s1-frq-12",
        distractors: [
          { choiceId: "two-fifths-12", misconceptionId: "frac-decimal.convert.concatenate-digits", signalIds: ["frac-decimal.convert"], derivation: "0.25의 두 숫자 2와 5를 분자와 분모로 나누어 2/5를 고른다.", rationale: "0.25는 25/100에서 시작해 분자와 분모를 25로 나누면 1/4입니다." },
          { choiceId: "twenty-five-tenths-12", misconceptionId: "frac-decimal.convert.ignore-place-value", signalIds: ["frac-decimal.convert"], derivation: "소수점 아래가 두 자리인데 분모에 0을 하나만 써 25/10을 고른다.", rationale: "소수 둘째 자리까지 있으므로 먼저 25/100으로 나타낸 뒤 기약분수로 약분해야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "frac-decimal.compare",
    misconceptionTitles: {
      "frac-decimal.compare.compare-visible-digits-only": "소수의 한 자리 숫자와 분자만 비교함",
      "frac-decimal.compare.compare-denominators-only": "분모 숫자만 보고 분수의 크기를 정함"
    },
    sharedSignalRationale: "분수와 소수가 섞였을 때 모두 같은 형태로 바꾼 뒤 전체 값을 비교했는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-frq-13",
        distractors: [
          { choiceId: "zero-point-seven-13", misconceptionId: "frac-decimal.compare.compare-visible-digits-only", signalIds: ["frac-decimal.compare"], derivation: "0.7의 7이 분수의 분자 4와 3보다 크다는 이유로 0.7을 고른다.", rationale: "겉으로 보이는 숫자만 비교하지 말고 4/5를 0.8로, 3/4를 0.75로 바꾸면 4/5가 가장 큽니다." },
          { choiceId: "three-fourths-13", misconceptionId: "frac-decimal.compare.compare-denominators-only", signalIds: ["frac-decimal.compare"], derivation: "분수 중 분모 4가 가장 작다는 이유로 3/4를 고른다.", rationale: "분모만 비교할 수 없습니다. 모두 소수로 바꾸면 0.8인 4/5가 가장 큽니다." }
        ]
      },
      {
        judgmentId: "g5s1-frq-14",
        distractors: [
          { choiceId: "two-fifths-14", misconceptionId: "frac-decimal.compare.compare-visible-digits-only", signalIds: ["frac-decimal.compare"], derivation: "분자 2가 가장 작다는 이유로 2/5를 고른다.", rationale: "분자 숫자만 보지 말고 2/5를 0.4로 바꾸어 비교하면 0.3이 가장 작습니다." },
          { choiceId: "three-eighths-14", misconceptionId: "frac-decimal.compare.compare-denominators-only", signalIds: ["frac-decimal.compare"], derivation: "분모 8이 가장 크다는 이유로 3/8을 가장 작다고 고른다.", rationale: "분모만 보고 판단하지 말고 3/8을 0.375로 바꾸어 비교하면 0.3이 가장 작습니다." }
        ]
      }
    ]
  },
  {
    stageId: "fa.add-unlike",
    misconceptionTitles: {
      "fa.add-unlike.add-numerators-denominators": "분자끼리와 분모끼리를 각각 더함",
      "fa.add-unlike.keep-original-numerators": "공통분모만 만들고 원래 분자를 더함"
    },
    sharedSignalRationale: "분모가 다른 분수를 더할 때 공통분모를 만들고 각 분자도 같은 배수로 바꾸었는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-fa-01",
        distractors: [
          { choiceId: "two-sevenths-fa01", misconceptionId: "fa.add-unlike.add-numerators-denominators", signalIds: ["fa.add-unlike"], derivation: "분자 1과 1을 더하고 분모 4와 3을 더해 2/7을 고른다.", rationale: "분모가 다른 분수는 분자와 분모를 각각 더할 수 없습니다. 3/12와 4/12로 통분해 더해야 합니다." },
          { choiceId: "two-twelfths-fa01", misconceptionId: "fa.add-unlike.keep-original-numerators", signalIds: ["fa.add-unlike"], derivation: "공통분모 12만 만든 뒤 원래 분자 1과 1을 더해 2/12를 고른다.", rationale: "분모를 12로 바꿀 때 분자도 각각 3과 4로 바꾸어 7/12를 구해야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-fa-02",
        distractors: [
          { choiceId: "three-sevenths-fa02", misconceptionId: "fa.add-unlike.add-numerators-denominators", signalIds: ["fa.add-unlike"], derivation: "분자 2와 1을 더하고 분모 5와 2를 더해 3/7을 고른다.", rationale: "분자와 분모를 각각 더하지 말고 4/10과 5/10으로 통분한 뒤 분자를 더해야 합니다." },
          { choiceId: "three-tenths-fa02", misconceptionId: "fa.add-unlike.keep-original-numerators", signalIds: ["fa.add-unlike"], derivation: "공통분모 10만 만든 뒤 원래 분자 2와 1을 더해 3/10을 고른다.", rationale: "통분하면 분자도 4와 5로 바뀌므로 9/10이 됩니다." }
        ]
      }
    ]
  },
  {
    stageId: "fa.sub-unlike",
    misconceptionTitles: {
      "fa.sub-unlike.subtract-parts": "분자와 분모에서 큰 수끼리 따로 뺌",
      "fa.sub-unlike.keep-original-numerators": "공통분모만 만들고 원래 분자를 뺌"
    },
    sharedSignalRationale: "분모가 다른 분수를 뺄 때 두 분수를 같은 분모로 바꾸고 새 분자끼리 뺐는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-fa-03",
        distractors: [
          { choiceId: "two-halves-fa03", misconceptionId: "fa.sub-unlike.subtract-parts", signalIds: ["fa.sub-unlike"], derivation: "분자에서 3과 1을 빼고 분모에서 큰 수 6과 작은 수 4를 빼 2/2를 고른다.", rationale: "분자와 분모를 따로 뺄 수 없습니다. 9/12와 2/12로 통분한 뒤 분자를 빼야 합니다." },
          { choiceId: "two-twelfths-fa03", misconceptionId: "fa.sub-unlike.keep-original-numerators", signalIds: ["fa.sub-unlike"], derivation: "공통분모 12만 만든 뒤 원래 분자 3과 1을 빼 2/12를 고른다.", rationale: "통분하면 분자는 9와 2로 바뀌므로 7/12이 됩니다." }
        ]
      },
      {
        judgmentId: "g5s1-fa-04",
        distractors: [
          { choiceId: "four-halves-fa04", misconceptionId: "fa.sub-unlike.subtract-parts", signalIds: ["fa.sub-unlike"], derivation: "분자에서 5와 1을 빼고 분모에서 6과 4를 빼 4/2를 고른다.", rationale: "분자와 분모를 각각 빼지 말고 10/12와 3/12로 통분한 뒤 분자를 빼야 합니다." },
          { choiceId: "four-twelfths-fa04", misconceptionId: "fa.sub-unlike.keep-original-numerators", signalIds: ["fa.sub-unlike"], derivation: "공통분모 12만 만든 뒤 원래 분자 5와 1을 빼 4/12를 고른다.", rationale: "통분하면 분자는 10과 3으로 바뀌므로 7/12이 됩니다." }
        ]
      }
    ]
  },
  {
    stageId: "fa.reduce-result",
    misconceptionTitles: {
      "fa.reduce-result.reduce-one-side": "분자나 분모 한쪽만 나누어 약분함",
      "fa.reduce-result.operate-parts": "분자끼리와 분모끼리를 각각 계산함"
    },
    sharedSignalRationale: "분수 계산 방법이 맞는지와 계산 결과를 기약분수까지 약분했는지를 나누어 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-fa-05",
        distractors: [
          { choiceId: "four-thirtieths-fa05", misconceptionId: "fa.reduce-result.reduce-one-side", signalIds: ["fa.reduce-result"], derivation: "두 분수를 더해 8/30을 만든 뒤 분자 8만 2로 나누고 분모 30은 그대로 두어 4/30을 고른다.", rationale: "8/30에서는 분자 8과 분모 30을 모두 2로 나누어 4/15로 나타냅니다." },
          { choiceId: "two-sixteenths-fa05", misconceptionId: "fa.reduce-result.operate-parts", signalIds: ["fa.reduce-result"], derivation: "분자 1과 1을 더하고 분모 6과 10을 더해 2/16을 고른다.", rationale: "분자와 분모를 각각 더하지 말고 먼저 두 분수를 통분해야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-fa-06",
        distractors: [
          { choiceId: "one-twelfth-fa06", misconceptionId: "fa.reduce-result.reduce-one-side", signalIds: ["fa.reduce-result"], derivation: "1/4을 3/12로 통분해 4/12를 만든 뒤 분자 4만 4로 나누고 분모 12는 그대로 두어 1/12을 고른다.", rationale: "4/12에서는 분자 4와 분모 12를 모두 4로 나누어 1/3로 나타냅니다." },
          { choiceId: "six-eighths-fa06", misconceptionId: "fa.reduce-result.operate-parts", signalIds: ["fa.reduce-result"], derivation: "분자 7에서 1을 빼고 분모 12에서 4를 빼 6/8을 고른다.", rationale: "분자와 분모를 각각 빼지 말고 먼저 같은 분모로 통분해야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "fa.mixed-add",
    misconceptionTitles: {
      "fa.mixed-add.omit-second-whole": "둘째 대분수의 자연수 부분을 빠뜨림",
      "fa.mixed-add.add-fraction-parts": "분수 부분의 분자와 분모를 각각 더함"
    },
    sharedSignalRationale: "대분수를 더할 때 두 자연수 부분을 모두 더하고 분수 부분은 통분했는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-fa-07",
        distractors: [
          { choiceId: "one-eleven-twelfths-fa07", misconceptionId: "fa.mixed-add.omit-second-whole", signalIds: ["fa.mixed-add"], derivation: "분수 부분은 3/12와 8/12로 통분해 더하지만 둘째 자연수 2를 빠뜨려 1 11/12를 고른다.", rationale: "분수 부분뿐 아니라 자연수 부분 1과 2도 더해야 합니다." },
          { choiceId: "three-three-sevenths-fa07", misconceptionId: "fa.mixed-add.add-fraction-parts", signalIds: ["fa.mixed-add"], derivation: "자연수 1과 2는 더하고 분수 부분은 분자 1과 2, 분모 4와 3을 각각 더해 3 3/7을 고른다.", rationale: "분수 부분은 분자와 분모를 각각 더하지 말고 통분해야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-fa-08",
        distractors: [
          { choiceId: "two-five-twelfths-fa08", misconceptionId: "fa.mixed-add.omit-second-whole", signalIds: ["fa.mixed-add"], derivation: "분수 부분은 2/12와 3/12로 통분해 더하지만 둘째 자연수 1을 빠뜨려 2 5/12를 고른다.", rationale: "두 대분수의 자연수 부분 2와 1을 모두 더해야 합니다." },
          { choiceId: "three-two-tenths-fa08", misconceptionId: "fa.mixed-add.add-fraction-parts", signalIds: ["fa.mixed-add"], derivation: "자연수 2와 1은 더하고 분수 부분은 분자 1과 1, 분모 6과 4를 각각 더해 3 2/10을 고른다.", rationale: "분수 부분은 2/12와 3/12로 통분해 5/12를 구해야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "fa.carry",
    misconceptionTitles: {
      "fa.carry.remove-whole-without-carrying": "분수에서 한 덩이를 빼고 자연수를 올리지 않음",
      "fa.carry.raise-whole-without-reducing-fraction": "자연수만 올리고 가분수는 그대로 둠"
    },
    sharedSignalRationale: "분수 부분이 가분수가 되면 분모만큼을 자연수 1로 옮기고 남은 분수만 적었는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-fa-09",
        distractors: [
          { choiceId: "one-one-fourth-fa09", misconceptionId: "fa.carry.remove-whole-without-carrying", signalIds: ["fa.carry"], derivation: "분수 5/4에서 4/4를 덜어 1/4만 남기고 자연수는 올리지 않아 1 1/4을 고른다.", rationale: "분수에서 덜어 낸 4/4는 자연수 1이므로 자연수 부분도 2로 올려야 합니다." },
          { choiceId: "two-five-fourths-fa09", misconceptionId: "fa.carry.raise-whole-without-reducing-fraction", signalIds: ["fa.carry"], derivation: "자연수는 1에서 2로 올리지만 분수 5/4에서 4/4를 덜어내지 않아 2 5/4를 고른다.", rationale: "자연수 1을 받아올렸다면 분수 부분에는 남은 1/4만 써야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-fa-10",
        distractors: [
          { choiceId: "two-one-sixth-fa10", misconceptionId: "fa.carry.remove-whole-without-carrying", signalIds: ["fa.carry"], derivation: "분수 7/6에서 6/6을 덜어 1/6만 남기고 자연수는 올리지 않아 2 1/6을 고른다.", rationale: "분수에서 덜어 낸 6/6은 자연수 1이므로 자연수 부분도 3으로 올려야 합니다." },
          { choiceId: "three-seven-sixths-fa10", misconceptionId: "fa.carry.raise-whole-without-reducing-fraction", signalIds: ["fa.carry"], derivation: "자연수는 2에서 3으로 올리지만 분수 7/6에서 6/6을 덜어내지 않아 3 7/6을 고른다.", rationale: "자연수로 옮긴 6/6을 분수 부분에서 빼고 1/6만 남겨야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "fa.borrow",
    misconceptionTitles: {
      "fa.borrow.stop-when-fraction-too-small": "분수 부분을 바로 뺄 수 없어 처음 수에서 멈춤",
      "fa.borrow.subtract-wholes-only": "자연수 부분만 빼고 분수 부분을 그대로 둠"
    },
    sharedSignalRationale: "분수 부분이 더 작을 때 자연수 하나를 같은 분모의 분수로 바꾸어 받아내린 뒤 자연수와 분수를 모두 뺐는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-fa-11",
        distractors: [
          { choiceId: "three-one-fourth-fa11", misconceptionId: "fa.borrow.stop-when-fraction-too-small", signalIds: ["fa.borrow"], derivation: "분수 1/4에서 1/2을 바로 뺄 수 없다고 보고 계산을 멈춰 처음 수 3 1/4을 고른다.", rationale: "자연수 3에서 1을 받아내려 2 5/4로 바꾼 뒤 1 1/2을 빼야 합니다." },
          { choiceId: "two-one-fourth-fa11", misconceptionId: "fa.borrow.subtract-wholes-only", signalIds: ["fa.borrow"], derivation: "자연수 3에서 1만 빼고 분수 1/4은 그대로 두어 2 1/4을 고른다.", rationale: "분수 부분도 빼야 하므로 자연수 하나를 분수 부분으로 받아내려야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-fa-12",
        distractors: [
          { choiceId: "four-one-sixth-fa12", misconceptionId: "fa.borrow.stop-when-fraction-too-small", signalIds: ["fa.borrow"], derivation: "분수 1/6에서 1/2을 바로 뺄 수 없다고 보고 계산을 멈춰 처음 수 4 1/6을 고른다.", rationale: "자연수 4에서 1을 받아내려 3 7/6으로 바꾼 뒤 2 1/2을 빼야 합니다." },
          { choiceId: "two-one-sixth-fa12", misconceptionId: "fa.borrow.subtract-wholes-only", signalIds: ["fa.borrow"], derivation: "자연수 4에서 2만 빼고 분수 1/6은 그대로 두어 2 1/6을 고른다.", rationale: "분수 부분도 빼야 하므로 자연수 하나를 분수 부분으로 받아내야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "pa.perimeter",
    misconceptionTitles: {
      "pa.perimeter.count-two-directions-once": "서로 다른 두 방향의 변만 한 번씩 셈",
      "pa.perimeter.use-area-formula": "둘레 대신 넓이를 계산함"
    },
    sharedSignalRationale: "도형의 테두리를 이루는 모든 변을 더하는지와 가로·세로를 곱해 넓이를 구하지 않는지 함께 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-pa-01",
        distractors: [
          { choiceId: "thirteen-cm-pa01", misconceptionId: "pa.perimeter.count-two-directions-once", signalIds: ["pa.perimeter"], derivation: "가로와 세로를 한 번씩만 더해 8+5=13 cm를 고른다.", rationale: "직사각형의 마주 보는 변도 더해야 하므로 8+5를 두 번 더해야 합니다." },
          { choiceId: "forty-cm-pa01", misconceptionId: "pa.perimeter.use-area-formula", signalIds: ["pa.perimeter"], derivation: "가로와 세로를 곱해 8×5=40 cm를 고른다.", rationale: "40은 넓이를 구하는 계산입니다. 둘레는 네 변의 길이를 모두 더해야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-pa-02",
        distractors: [
          { choiceId: "twelve-cm-pa02", misconceptionId: "pa.perimeter.count-two-directions-once", signalIds: ["pa.perimeter"], derivation: "정사각형의 두 방향만 센다고 보고 6×2=12 cm를 고른다.", rationale: "정사각형에는 길이가 6 cm인 변이 네 개이므로 네 변을 모두 더해야 합니다." },
          { choiceId: "thirty-six-cm-pa02", misconceptionId: "pa.perimeter.use-area-formula", signalIds: ["pa.perimeter"], derivation: "한 변을 두 번 곱해 6×6=36 cm를 고른다.", rationale: "36은 정사각형의 넓이입니다. 둘레는 한 변의 길이를 네 번 더해야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "pa.area-unit",
    misconceptionTitles: {
      "pa.area-unit.wrong-scale": "대상의 크기와 맞지 않는 넓이 단위를 고름",
      "pa.area-unit.use-length-unit": "제곱 단위 대신 길이 단위를 고름"
    },
    sharedSignalRationale: "넓이를 나타내는 제곱 단위인지 먼저 확인하고 대상의 크기에 맞게 cm²와 m²를 구별하는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-pa-03",
        distractors: [
          { choiceId: "square-centimeter-pa03", misconceptionId: "pa.area-unit.wrong-scale", signalIds: ["pa.area-unit"], derivation: "대상의 크기를 따지지 않고 교실 바닥의 넓이 단위도 cm²로 판단해 cm²를 고른다.", rationale: "교실 바닥처럼 넓은 곳은 1 m² 크기의 단위를 사용하는 것이 알맞습니다." },
          { choiceId: "meter-pa03", misconceptionId: "pa.area-unit.use-length-unit", signalIds: ["pa.area-unit"], derivation: "넓이 단위도 한 방향의 길이라고 판단해 m를 그대로 고른다.", rationale: "m는 길이 단위입니다. 넓이는 한 변이 1 m인 정사각형의 넓이인 m²로 나타냅니다." }
        ]
      },
      {
        judgmentId: "g5s1-pa-04",
        distractors: [
          { choiceId: "square-meter-pa04", misconceptionId: "pa.area-unit.wrong-scale", signalIds: ["pa.area-unit"], derivation: "대상의 크기를 따지지 않고 공책 표지의 넓이 단위도 m²로 판단해 m²를 고른다.", rationale: "공책 표지처럼 작은 넓이는 1 cm² 크기의 단위를 사용하는 것이 알맞습니다." },
          { choiceId: "centimeter-pa04", misconceptionId: "pa.area-unit.use-length-unit", signalIds: ["pa.area-unit"], derivation: "넓이 단위도 한 방향의 길이라고 판단해 cm를 그대로 고른다.", rationale: "cm는 길이 단위입니다. 넓이는 한 변이 1 cm인 정사각형의 넓이인 cm²로 나타냅니다." }
        ]
      }
    ]
  },
  {
    stageId: "pa.rectangle-square-area",
    misconceptionTitles: {
      "pa.rectangle-square-area.calculate-perimeter": "넓이 대신 둘레를 계산함",
      "pa.rectangle-square-area.add-dimensions": "가로와 세로를 곱하지 않고 더함"
    },
    sharedSignalRationale: "직사각형과 정사각형의 넓이를 구할 때 한 줄의 칸 수와 줄 수를 곱하는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-pa-05",
        distractors: [
          { choiceId: "twenty-four-square-cm-pa05", misconceptionId: "pa.rectangle-square-area.calculate-perimeter", signalIds: ["pa.rectangle-square-area"], derivation: "넓이 대신 둘레를 계산해 (8+4)×2=24 cm²를 고른다.", rationale: "24는 둘레를 구하는 계산입니다. 넓이는 가로 8과 세로 4를 곱해야 합니다." },
          { choiceId: "twelve-square-cm-pa05", misconceptionId: "pa.rectangle-square-area.add-dimensions", signalIds: ["pa.rectangle-square-area"], derivation: "가로와 세로를 더해 8+4=12 cm²를 고른다.", rationale: "넓이는 가로 방향의 칸 수와 세로 방향의 줄 수를 곱해 구해야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-pa-06",
        distractors: [
          { choiceId: "twenty-eight-square-cm-pa06", misconceptionId: "pa.rectangle-square-area.calculate-perimeter", signalIds: ["pa.rectangle-square-area"], derivation: "넓이 대신 둘레를 계산해 7×4=28 cm²를 고른다.", rationale: "28은 네 변의 길이를 더한 둘레입니다. 넓이는 7×7로 구해야 합니다." },
          { choiceId: "fourteen-square-cm-pa06", misconceptionId: "pa.rectangle-square-area.add-dimensions", signalIds: ["pa.rectangle-square-area"], derivation: "한 변의 길이를 두 번 더해 7+7=14 cm²를 고른다.", rationale: "정사각형의 넓이는 한 변의 길이 7을 두 번 곱해야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "pa.parallelogram-area",
    misconceptionTitles: {
      "pa.parallelogram-area.add-base-height": "밑변과 높이를 곱하지 않고 더함",
      "pa.parallelogram-area.square-base": "높이를 쓰지 않고 밑변을 제곱함"
    },
    sharedSignalRationale: "평행사변형의 넓이를 구할 때 밑변과 그 밑변에 수직인 높이를 정확히 골라 곱하는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-pa-07",
        distractors: [
          { choiceId: "thirteen-square-cm-pa07", misconceptionId: "pa.parallelogram-area.add-base-height", signalIds: ["pa.parallelogram-area"], derivation: "밑변과 높이를 더해 9+4=13 cm²를 고른다.", rationale: "넓이는 밑변과 높이를 더하지 않고 곱해 구해야 합니다." },
          { choiceId: "eighty-one-square-cm-pa07", misconceptionId: "pa.parallelogram-area.square-base", signalIds: ["pa.parallelogram-area"], derivation: "높이 4를 쓰지 않고 밑변만 두 번 곱해 9×9=81 cm²를 고른다.", rationale: "밑변을 두 번 곱하지 말고 수직으로 표시된 높이 4를 곱해야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-pa-08",
        distractors: [
          { choiceId: "twelve-square-cm-pa08", misconceptionId: "pa.parallelogram-area.add-base-height", signalIds: ["pa.parallelogram-area"], derivation: "밑변과 높이를 더해 7+5=12 cm²를 고른다.", rationale: "평행사변형의 넓이는 밑변 7과 높이 5를 곱해야 합니다." },
          { choiceId: "forty-nine-square-cm-pa08", misconceptionId: "pa.parallelogram-area.square-base", signalIds: ["pa.parallelogram-area"], derivation: "높이 5를 쓰지 않고 밑변만 두 번 곱해 7×7=49 cm²를 고른다.", rationale: "밑변과 같은 수를 다시 쓰지 말고 직각 표시가 있는 높이를 사용해야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "pa.triangle-area",
    misconceptionTitles: {
      "pa.triangle-area.omit-half": "밑변과 높이를 곱한 뒤 2로 나누지 않음",
      "pa.triangle-area.add-base-height": "밑변과 높이를 곱하지 않고 더함"
    },
    sharedSignalRationale: "삼각형이 같은 밑변과 높이의 평행사변형 넓이의 절반임을 적용하는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-pa-09",
        distractors: [
          { choiceId: "sixty-square-cm-pa09", misconceptionId: "pa.triangle-area.omit-half", signalIds: ["pa.triangle-area"], derivation: "밑변과 높이만 곱하고 2로 나누지 않아 10×6=60 cm²를 고른다.", rationale: "삼각형은 같은 밑변과 높이의 평행사변형 절반이므로 60을 2로 나누어야 합니다." },
          { choiceId: "sixteen-square-cm-pa09", misconceptionId: "pa.triangle-area.add-base-height", signalIds: ["pa.triangle-area"], derivation: "밑변과 높이를 더해 10+6=16 cm²를 고른다.", rationale: "삼각형의 넓이는 밑변과 높이를 먼저 곱한 뒤 2로 나누어야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-pa-10",
        distractors: [
          { choiceId: "fifty-six-square-cm-pa10", misconceptionId: "pa.triangle-area.omit-half", signalIds: ["pa.triangle-area"], derivation: "밑변과 높이만 곱하고 2로 나누지 않아 8×7=56 cm²를 고른다.", rationale: "같은 삼각형 두 개가 56 cm²이므로 삼각형 한 개는 그 절반입니다." },
          { choiceId: "fifteen-square-cm-pa10", misconceptionId: "pa.triangle-area.add-base-height", signalIds: ["pa.triangle-area"], derivation: "밑변과 높이를 더해 8+7=15 cm²를 고른다.", rationale: "두 길이를 더하지 말고 곱한 뒤 2로 나누어야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "pa.trapezoid-area",
    misconceptionTitles: {
      "pa.trapezoid-area.omit-half": "두 밑변의 합과 높이를 곱한 뒤 2로 나누지 않음",
      "pa.trapezoid-area.replace-base-with-height": "한 밑변 대신 높이를 두 번 사용함"
    },
    sharedSignalRationale: "사다리꼴의 윗변과 아랫변을 모두 더하고 높이를 곱한 뒤 같은 사다리꼴 두 개 중 하나의 넓이를 구하는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-pa-11",
        distractors: [
          { choiceId: "eighty-square-cm-pa11", misconceptionId: "pa.trapezoid-area.omit-half", signalIds: ["pa.trapezoid-area"], derivation: "(6+10)×5=80에서 2로 나누지 않아 80 cm²를 고른다.", rationale: "같은 사다리꼴 두 개로 만든 넓이이므로 80을 2로 나누어야 합니다." },
          { choiceId: "fifty-five-square-cm-pa11", misconceptionId: "pa.trapezoid-area.replace-base-with-height", signalIds: ["pa.trapezoid-area"], derivation: "아랫변 10 대신 높이 5를 넣어 (6+5)×5=55 cm²를 고른다.", rationale: "윗변 6과 아랫변 10을 먼저 더한 뒤 높이 5를 곱해야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-pa-12",
        distractors: [
          { choiceId: "eighty-eight-square-cm-pa12", misconceptionId: "pa.trapezoid-area.omit-half", signalIds: ["pa.trapezoid-area"], derivation: "(8+14)×4=88에서 2로 나누지 않아 88 cm²를 고른다.", rationale: "88은 같은 사다리꼴 두 개의 넓이이므로 절반으로 나누어야 합니다." },
          { choiceId: "forty-eight-square-cm-pa12", misconceptionId: "pa.trapezoid-area.replace-base-with-height", signalIds: ["pa.trapezoid-area"], derivation: "아랫변 14 대신 높이 4를 넣어 (8+4)×4=48 cm²를 고른다.", rationale: "두 평행한 변인 8과 14를 더하고 수직 높이 4를 사용해야 합니다." }
        ]
      }
    ]
  },
  {
    stageId: "pa.rhombus-area",
    misconceptionTitles: {
      "pa.rhombus-area.omit-half": "두 대각선을 곱한 뒤 2로 나누지 않음",
      "pa.rhombus-area.add-diagonals": "두 대각선의 길이를 더함"
    },
    sharedSignalRationale: "마름모가 두 대각선을 가로와 세로로 하는 직사각형 넓이의 절반임을 적용하는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g5s1-pa-13",
        distractors: [
          { choiceId: "sixty-square-cm-pa13", misconceptionId: "pa.rhombus-area.omit-half", signalIds: ["pa.rhombus-area"], derivation: "두 대각선을 곱하고 2로 나누지 않아 10×6=60 cm²를 고른다.", rationale: "두 대각선을 곱한 값은 마름모 두 개의 넓이이므로 2로 나누어야 합니다." },
          { choiceId: "sixteen-square-cm-pa13", misconceptionId: "pa.rhombus-area.add-diagonals", signalIds: ["pa.rhombus-area"], derivation: "두 대각선의 길이를 더해 10+6=16 cm²를 고른다.", rationale: "대각선의 길이는 더하지 않고 서로 곱한 뒤 2로 나누어야 합니다." }
        ]
      },
      {
        judgmentId: "g5s1-pa-14",
        distractors: [
          { choiceId: "ninety-six-square-cm-pa14", misconceptionId: "pa.rhombus-area.omit-half", signalIds: ["pa.rhombus-area"], derivation: "두 대각선을 곱하고 2로 나누지 않아 12×8=96 cm²를 고른다.", rationale: "96은 두 대각선으로 만든 직사각형의 넓이이므로 마름모는 그 절반입니다." },
          { choiceId: "twenty-square-cm-pa14", misconceptionId: "pa.rhombus-area.add-diagonals", signalIds: ["pa.rhombus-area"], derivation: "두 대각선의 길이를 더해 12+8=20 cm²를 고른다.", rationale: "마름모의 넓이는 두 대각선을 곱하고 2로 나누어 구해야 합니다." }
        ]
      }
    ]
  }
];

export const grade5Semester1MisconceptionTitles = Object.freeze(
  Object.fromEntries(stages.flatMap((entry) =>
    Object.entries(entry.misconceptionTitles)
  ))
);

export const grade5Semester1DistractorRationales: DistractorRationale[] =
  stages.flatMap((entry) => entry.entries.flatMap((item) =>
    item.distractors.map((distractor) => ({
      judgmentId: item.judgmentId,
      ...distractor,
      sharedSignalRationale: entry.sharedSignalRationale
    }))
  ));
