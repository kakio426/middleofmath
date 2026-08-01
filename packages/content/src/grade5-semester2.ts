import type { JudgmentVisual } from "@middle-of-math/domain";
import {
  buildUpperGradeSemester,
  type UpperGradeDistractorSpec,
  type UpperGradeQuestionSpec,
  type UpperGradeStageSpec
} from "./upper-grade-content-builder";

const SOURCE = "2022 개정 수학과 교육과정 및 2026 경기도교육청 5학년 단원 배치표";

function wrong(
  id: string,
  label: string,
  misconceptionId: string,
  derivation: string,
  rationale: string
): UpperGradeDistractorSpec {
  return { id, label, misconceptionId, derivation, rationale };
}

function question(
  id: string,
  context: string,
  prompt: string,
  correctLabel: string,
  distractors: [UpperGradeDistractorSpec, UpperGradeDistractorSpec],
  visual: JudgmentVisual = { kind: "none" }
): UpperGradeQuestionSpec {
  return {
    id,
    context,
    prompt,
    visual,
    correct: { id: `${id}-correct`, label: correctLabel },
    distractors
  };
}

function stage(input: Omit<UpperGradeStageSpec, "teachingMove" | "homePrompt"> & {
  teachingMove?: string;
  homePrompt?: string;
}): UpperGradeStageSpec {
  return {
    ...input,
    teachingMove: input.teachingMove
      ?? "주어진 수와 계산 기준을 표시하고 한 단계씩 판단하게 하세요.",
    homePrompt: input.homePrompt
      ?? "답을 바로 말하기보다 어떤 수와 기준을 사용했는지 먼저 말해 보게 해주세요."
  };
}

const stages: UpperGradeStageSpec[] = [
  stage({
    id: "nr.range-terms", unitId: "number-range-rounding",
    title: "이상·이하·초과·미만의 경계 포함 여부 구별하기", shortTitle: "수 범위의 경계를 구별함",
    anchorIds: ["[6수01-02]"],
    misconceptions: [
      { id: "nr.range-terms.include-boundary-wrongly", title: "경계 수의 포함 여부를 반대로 판단함" },
      { id: "nr.range-terms.reverse-direction", title: "큰 쪽과 작은 쪽 범위를 반대로 판단함" }
    ],
    questions: [
      question("g5s2-nr-01", "37을 포함하면서 37보다 큰 수도 모두 나타내세요.", "알맞은 표현은 어느 것인가요?", "37 이상", [
        wrong("g5s2-nr-01-d1", "37 초과", "nr.range-terms.include-boundary-wrongly", "경계 수 37을 빼고 37 초과를 고른다.", "이상은 경계 수 37을 포함합니다."),
        wrong("g5s2-nr-01-d2", "37 이하", "nr.range-terms.reverse-direction", "37보다 큰 쪽 대신 작은 쪽인 37 이하를 고른다.", "37보다 큰 수를 나타내므로 이하가 아니라 이상입니다.")
      ]),
      question("g5s2-nr-02", "놀이 기구는 키가 62 cm보다 작은 인형만 탈 수 있고, 62 cm인 인형은 탈 수 없습니다.", "탈 수 있는 인형의 키 범위를 고르세요.", "62 미만", [
        wrong("g5s2-nr-02-d1", "62 이하", "nr.range-terms.include-boundary-wrongly", "경계 수 62도 넣어 62 이하를 고른다.", "미만은 경계 수 62를 포함하지 않습니다."),
        wrong("g5s2-nr-02-d2", "62 초과", "nr.range-terms.reverse-direction", "62보다 작은 쪽 대신 큰 쪽인 62 초과를 고른다.", "62보다 작은 수를 나타내므로 초과가 아니라 미만입니다.")
      ])
    ]
  }),
  stage({
    id: "nr.range-list", unitId: "number-range-rounding",
    title: "주어진 범위에 들어가는 자연수 빠짐없이 찾기", shortTitle: "범위 안의 자연수를 찾음",
    anchorIds: ["[6수01-02]"], prerequisiteStageIds: ["nr.range-terms"],
    misconceptions: [
      { id: "nr.range-list.include-open-end", title: "포함하지 않는 경계 수를 넣음" },
      { id: "nr.range-list.exclude-closed-end", title: "포함하는 경계 수를 뺌" }
    ],
    questions: [
      question("g5s2-nr-03", "20 이상 25 미만인 자연수를 찾으세요.", "범위에 들어가는 수를 모두 쓴 것은 어느 것인가요?", "20, 21, 22, 23, 24", [
        wrong("g5s2-nr-03-d1", "20, 21, 22, 23, 24, 25", "nr.range-list.include-open-end", "25 미만인데 끝 수 25까지 포함한다.", "미만인 25는 범위에 들어가지 않습니다."),
        wrong("g5s2-nr-03-d2", "21, 22, 23, 24", "nr.range-list.exclude-closed-end", "20 이상인데 시작 수 20을 제외한다.", "이상인 20은 범위에 들어갑니다.")
      ]),
      question("g5s2-nr-04", "48 초과 52 이하인 자연수를 찾으세요.", "범위에 들어가는 수를 모두 쓴 것은 어느 것인가요?", "49, 50, 51, 52", [
        wrong("g5s2-nr-04-d1", "48, 49, 50, 51, 52", "nr.range-list.include-open-end", "48 초과인데 시작 수 48도 포함한다.", "초과인 48은 범위에 들어가지 않습니다."),
        wrong("g5s2-nr-04-d2", "49, 50, 51", "nr.range-list.exclude-closed-end", "52 이하인데 끝 수 52를 제외한다.", "이하인 52는 범위에 들어갑니다.")
      ])
    ]
  }),
  stage({
    id: "nr.round-up", unitId: "number-range-rounding",
    title: "정해진 자리에서 올림하기", shortTitle: "정해진 자리에서 올림함",
    anchorIds: ["[6수01-03]"],
    misconceptions: [
      { id: "nr.round-up.use-rounding", title: "올림 대신 반올림함" },
      { id: "nr.round-up.wrong-place", title: "요구한 자리보다 한 자리 아래에서 처리함" }
    ],
    questions: [
      question("g5s2-nr-05", "3,241을 백의 자리까지 올림하세요.", "어림한 수는 얼마인가요?", "3,300", [
        wrong("g5s2-nr-05-d1", "3,200", "nr.round-up.use-rounding", "십의 자리 4를 보고 반올림하여 3,200을 고른다.", "올림은 버리는 수가 있으면 백의 자리 수를 1 크게 합니다."),
        wrong("g5s2-nr-05-d2", "3,250", "nr.round-up.wrong-place", "백의 자리 대신 십의 자리까지 올림하여 3,250을 고른다.", "백의 자리까지 나타내므로 십의 자리 이하는 0이 됩니다.")
      ]),
      question("g5s2-nr-06", "76,102를 천의 자리까지 올림하세요.", "어림한 수는 얼마인가요?", "77,000", [
        wrong("g5s2-nr-06-d1", "76,000", "nr.round-up.use-rounding", "백의 자리 1을 보고 반올림하여 76,000을 고른다.", "올림은 버리는 수 102가 있으므로 천의 자리 수를 1 크게 합니다."),
        wrong("g5s2-nr-06-d2", "76,200", "nr.round-up.wrong-place", "천의 자리 대신 백의 자리까지 올림하여 76,200을 고른다.", "천의 자리까지 나타내므로 백의 자리 이하는 0이 됩니다.")
      ])
    ]
  }),
  stage({
    id: "nr.round-down", unitId: "number-range-rounding",
    title: "정해진 자리에서 버림하기", shortTitle: "정해진 자리에서 버림함",
    anchorIds: ["[6수01-03]"],
    misconceptions: [
      { id: "nr.round-down.use-rounding", title: "버림 대신 반올림함" },
      { id: "nr.round-down.wrong-place", title: "요구한 자리보다 한 자리 아래에서 처리함" }
    ],
    questions: [
      question("g5s2-nr-07", "6,875를 백의 자리까지 버림하세요.", "어림한 수는 얼마인가요?", "6,800", [
        wrong("g5s2-nr-07-d1", "6,900", "nr.round-down.use-rounding", "십의 자리 7을 올려 반올림한 6,900을 고른다.", "버림은 백의 자리 아래 수를 모두 0으로 바꿉니다."),
        wrong("g5s2-nr-07-d2", "6,870", "nr.round-down.wrong-place", "백의 자리 대신 십의 자리까지 버림하여 6,870을 고른다.", "백의 자리까지 나타내므로 십의 자리 이하는 0입니다.")
      ]),
      question("g5s2-nr-08", "43,968을 천의 자리까지 버림하세요.", "어림한 수는 얼마인가요?", "43,000", [
        wrong("g5s2-nr-08-d1", "44,000", "nr.round-down.use-rounding", "백의 자리 9를 올려 반올림한 44,000을 고른다.", "버림은 천의 자리 아래 수를 올리지 않습니다."),
        wrong("g5s2-nr-08-d2", "43,900", "nr.round-down.wrong-place", "천의 자리 대신 백의 자리까지 버림하여 43,900을 고른다.", "천의 자리까지 나타내므로 백의 자리 이하는 0입니다.")
      ])
    ]
  }),
  stage({
    id: "nr.round-nearest", unitId: "number-range-rounding",
    title: "정해진 자리에서 반올림하기", shortTitle: "정해진 자리에서 반올림함",
    anchorIds: ["[6수01-03]"],
    misconceptions: [
      { id: "nr.round-nearest.reverse-five-rule", title: "다음 자리 수가 5 이상인지 반대로 판단함" },
      { id: "nr.round-nearest.wrong-place", title: "요구한 자리보다 한 자리 아래에서 반올림함" }
    ],
    questions: [
      question("g5s2-nr-09", "5,748을 백의 자리까지 반올림하세요.", "어림한 수는 얼마인가요?", "5,700", [
        wrong("g5s2-nr-09-d1", "5,800", "nr.round-nearest.reverse-five-rule", "십의 자리 4를 5 이상으로 잘못 보고 백의 자리 수를 올려 5,800을 고른다.", "십의 자리 수가 4이므로 버려 5,700이 됩니다."),
        wrong("g5s2-nr-09-d2", "5,750", "nr.round-nearest.wrong-place", "백의 자리 대신 십의 자리까지 반올림하여 5,750을 고른다.", "백의 자리까지 나타내므로 십의 자리 이하는 0입니다.")
      ]),
      question("g5s2-nr-10", "26,551을 천의 자리까지 반올림하세요.", "어림한 수는 얼마인가요?", "27,000", [
        wrong("g5s2-nr-10-d1", "26,000", "nr.round-nearest.reverse-five-rule", "백의 자리 5를 5보다 작은 수로 잘못 보고 버려 26,000을 고른다.", "백의 자리 수가 5이므로 천의 자리 수를 1 크게 합니다."),
        wrong("g5s2-nr-10-d2", "26,600", "nr.round-nearest.wrong-place", "천의 자리 대신 백의 자리까지 반올림하여 26,600을 고른다.", "천의 자리까지 나타내므로 백의 자리 이하는 0입니다.")
      ])
    ]
  }),
  stage({
    id: "nr.round-apply", unitId: "number-range-rounding",
    title: "상황에 맞는 어림 방법과 자리 적용하기", shortTitle: "상황에 맞게 어림함",
    anchorIds: ["[6수01-03]"], prerequisiteStageIds: ["nr.round-up", "nr.round-down", "nr.round-nearest"],
    misconceptions: [
      { id: "nr.round-apply.ignore-situation-direction", title: "상황이 요구한 어림 방향을 무시함" },
      { id: "nr.round-apply.choose-wrong-place", title: "상황에서 요구한 어림 자리를 잘못 고름" }
    ],
    questions: [
      question("g5s2-nr-11", "사과가 4,762개 있습니다. 몇 천 개인지 가장 가깝게 말하려고 해요.", "약 몇 천 개인가요?", "약 5,000개", [
        wrong("g5s2-nr-11-d1", "약 4,000개", "nr.round-apply.ignore-situation-direction", "'가장 가깝게'라는 조건을 무시하고 천의 자리 아래를 버려 약 4,000개로 말한다.", "가장 가까운 천의 자리 수는 5,000입니다."),
        wrong("g5s2-nr-11-d2", "약 4,800개", "nr.round-apply.choose-wrong-place", "천의 자리 대신 백의 자리까지 반올림하여 약 4,800개로 말한다.", "몇 천 개인지 묻고 있으므로 천의 자리까지 어림합니다.")
      ]),
      question("g5s2-nr-12", "42,031원보다 모자라지 않게 만 원 단위로 준비하려고 해요.", "얼마를 준비해야 하나요?", "50,000원", [
        wrong("g5s2-nr-12-d1", "40,000원", "nr.round-apply.ignore-situation-direction", "'모자라지 않게'라는 조건을 무시하고 금액을 40,000원으로 줄여 준비한다.", "모자라지 않게 준비하려면 만 원 단위로 올림해야 합니다."),
        wrong("g5s2-nr-12-d2", "43,000원", "nr.round-apply.choose-wrong-place", "만 원 단위 대신 천 원 단위로 올림하여 43,000원을 고른다.", "만 원 단위로 준비하므로 천 원 이하는 0이 됩니다.")
      ])
    ]
  }),

  stage({
    id: "fm.natural-times-fraction", unitId: "fraction-multiplication",
    title: "자연수와 분수의 곱 계산하기", shortTitle: "자연수와 분수를 곱함",
    anchorIds: ["[6수01-09]"],
    misconceptions: [
      { id: "fm.natural-times-fraction.multiply-denominator", title: "자연수를 분모에도 곱함" },
      { id: "fm.natural-times-fraction.add-numerator", title: "곱셈 대신 분자에 자연수를 더함" }
    ],
    questions: [
      question("g5s2-fm-01", "계산한 결과를 고르세요.", "3 × 2/5 = ?", "1 1/5", [
        wrong("g5s2-fm-01-d1", "2/15", "fm.natural-times-fraction.multiply-denominator", "자연수 3을 분모 5에만 곱해 2/15를 만든다.", "자연수는 분자 2에 곱해야 합니다."),
        wrong("g5s2-fm-01-d2", "1", "fm.natural-times-fraction.add-numerator", "분자 2와 자연수 3을 더해 5/5=1을 만든다.", "곱셈이므로 분자 2에 3을 곱해야 합니다.")
      ]),
      question("g5s2-fm-02", "계산하고 기약분수나 대분수로 나타내세요.", "4 × 3/8 = ?", "1 1/2", [
        wrong("g5s2-fm-02-d1", "3/32", "fm.natural-times-fraction.multiply-denominator", "자연수 4를 분모 8에만 곱해 3/32를 만든다.", "자연수는 분모가 아니라 분자 3에 곱해야 합니다."),
        wrong("g5s2-fm-02-d2", "7/8", "fm.natural-times-fraction.add-numerator", "분자 3과 자연수 4를 더해 7/8을 만든다.", "4배는 분자 3에 4를 곱해 나타냅니다.")
      ])
    ]
  }),
  stage({
    id: "fm.fraction-times-natural", unitId: "fraction-multiplication",
    title: "분수와 자연수의 곱 계산하기", shortTitle: "분수에 자연수를 곱함",
    anchorIds: ["[6수01-09]"], prerequisiteStageIds: ["fm.natural-times-fraction"],
    misconceptions: [
      { id: "fm.fraction-times-natural.multiply-denominator", title: "자연수를 분모에 곱함" },
      { id: "fm.fraction-times-natural.add-numerator", title: "곱셈 대신 분자에 자연수를 더함" }
    ],
    questions: [
      question("g5s2-fm-03", "계산하세요.", "2/7 × 3 = ?", "6/7", [
        wrong("g5s2-fm-03-d1", "2/21", "fm.fraction-times-natural.multiply-denominator", "자연수 3을 분모 7에 곱해 2/21을 만든다.", "자연수 3은 분자 2에 곱합니다."),
        wrong("g5s2-fm-03-d2", "5/7", "fm.fraction-times-natural.add-numerator", "분자 2와 자연수 3을 더해 5/7을 만든다.", "곱셈이므로 2를 세 번 더한 6이 분자가 됩니다.")
      ]),
      question("g5s2-fm-04", "계산한 결과를 고르세요.", "5/9 × 4 = ?", "2 2/9", [
        wrong("g5s2-fm-04-d1", "5/36", "fm.fraction-times-natural.multiply-denominator", "자연수 4를 분모 9에 곱해 5/36을 만든다.", "자연수는 분자 5에 곱해야 합니다."),
        wrong("g5s2-fm-04-d2", "1", "fm.fraction-times-natural.add-numerator", "분자 5와 자연수 4를 더해 9/9=1을 만든다.", "분자 5에 4를 곱한 뒤 대분수로 바꿉니다.")
      ])
    ]
  }),
  stage({
    id: "fm.fraction-times-fraction", unitId: "fraction-multiplication",
    title: "분수끼리 곱하기", shortTitle: "분자끼리 분모끼리 곱함",
    anchorIds: ["[6수01-09]"], prerequisiteStageIds: ["fm.fraction-times-natural"],
    misconceptions: [
      { id: "fm.fraction-times-fraction.add-parts", title: "분자와 분모를 각각 더함" },
      { id: "fm.fraction-times-fraction.cross-pairs", title: "분자와 분모를 엇갈려 곱함" }
    ],
    questions: [
      question("g5s2-fm-05", "계산하고 기약분수로 나타내세요.", "2/3 × 4/5 = ?", "8/15", [
        wrong("g5s2-fm-05-d1", "3/4", "fm.fraction-times-fraction.add-parts", "분자끼리 2+4=6, 분모끼리 3+5=8로 계산한 뒤 6/8을 3/4로 약분한다.", "분수의 곱은 분자끼리, 분모끼리 곱하므로 8/15입니다."),
        wrong("g5s2-fm-05-d2", "5/6", "fm.fraction-times-fraction.cross-pairs", "2×5와 3×4를 엇갈려 곱해 10/12=5/6으로 만든다.", "같은 위치의 분자끼리와 분모끼리를 곱해야 합니다.")
      ]),
      question("g5s2-fm-06", "전체 길이가 3/4 m인 끈에서 그 길이의 2/7만큼을 사용합니다.", "사용한 끈은 몇 m인가요?", "3/14 m", [
        wrong("g5s2-fm-06-d1", "5/11 m", "fm.fraction-times-fraction.add-parts", "분자끼리 3+2=5, 분모끼리 4+7=11로 계산한다.", "분수의 곱셈은 더하지 않고 곱합니다."),
        wrong("g5s2-fm-06-d2", "21/8 m", "fm.fraction-times-fraction.cross-pairs", "3×7과 4×2를 엇갈려 곱해 21/8을 만든다.", "분자 3과 2, 분모 4와 7을 각각 곱합니다.")
      ])
    ]
  }),
  stage({
    id: "fm.reduce-product", unitId: "fraction-multiplication",
    title: "분수의 곱을 기약분수로 나타내기", shortTitle: "곱한 결과를 끝까지 약분함",
    anchorIds: ["[6수01-09]"], prerequisiteStageIds: ["fm.fraction-times-fraction"],
    misconceptions: [
      { id: "fm.reduce-product.reduce-numerator-only", title: "분자만 나누어 약분함" },
      { id: "fm.reduce-product.add-parts", title: "곱셈 대신 분자와 분모를 더함" }
    ],
    questions: [
      question("g5s2-fm-07", "계산하고 기약분수로 나타내세요.", "3/8 × 4/9 = ?", "1/6", [
        wrong("g5s2-fm-07-d1", "1/72", "fm.reduce-product.reduce-numerator-only", "12/72에서 분자 12만 12로 나누고 분모 72는 그대로 둔다.", "약분할 때는 분자와 분모를 같은 수로 함께 나누어야 합니다."),
        wrong("g5s2-fm-07-d2", "7/17", "fm.reduce-product.add-parts", "분자 3+4=7, 분모 8+9=17로 더한다.", "분수의 곱셈은 분자끼리와 분모끼리를 곱합니다.")
      ]),
      question("g5s2-fm-08", "물통에 5/12 L가 들어 있고, 그중 6/25를 컵에 옮깁니다.", "컵에 옮긴 물은 몇 L인가요? 기약분수로 답하세요.", "1/10 L", [
        wrong("g5s2-fm-08-d1", "1/300 L", "fm.reduce-product.reduce-numerator-only", "30/300에서 분자 30만 30으로 나누고 분모 300은 그대로 둔다.", "약분할 때는 분자와 분모를 같은 수로 함께 나누어야 합니다."),
        wrong("g5s2-fm-08-d2", "11/37 L", "fm.reduce-product.add-parts", "분자 5+6=11, 분모 12+25=37로 더한다.", "분자끼리와 분모끼리를 각각 곱해야 합니다.")
      ])
    ]
  }),
  stage({
    id: "fm.mixed-number", unitId: "fraction-multiplication",
    title: "대분수를 가분수로 바꾸어 곱하기", shortTitle: "대분수를 바꾸어 곱함",
    anchorIds: ["[6수01-09]"], prerequisiteStageIds: ["fm.reduce-product"],
    misconceptions: [
      { id: "fm.mixed-number.drop-whole", title: "대분수의 자연수 부분을 빼고 분수 부분만 곱함" },
      { id: "fm.mixed-number.wrong-improper", title: "대분수를 가분수로 잘못 바꿈" }
    ],
    questions: [
      question("g5s2-fm-09", "대분수를 가분수로 바꾸어 계산하세요.", "1 1/2 × 2/3 = ?", "1", [
        wrong("g5s2-fm-09-d1", "1/3", "fm.mixed-number.drop-whole", "자연수 부분 1을 빼고 분수 부분 1/2×2/3=1/3만 계산한다.", "1 1/2 전체를 3/2로 바꾼 뒤 곱해야 합니다."),
        wrong("g5s2-fm-09-d2", "2/3", "fm.mixed-number.wrong-improper", "1 1/2을 2/2로 잘못 바꾸어 2/2×2/3=2/3으로 계산한다.", "1 1/2은 3/2입니다.")
      ]),
      question("g5s2-fm-10", "한 통에 2와 1/4 L가 듭니다. 통의 4/5만 채웁니다.", "넣는 물의 양은 몇 L인가요?", "1과 4/5 L", [
        wrong("g5s2-fm-10-d1", "1/5 L", "fm.mixed-number.drop-whole", "자연수 부분 2를 빼고 1/4×4/5=1/5만 계산한다.", "2 1/4 전체를 가분수 9/4로 바꾸어야 합니다."),
        wrong("g5s2-fm-10-d2", "3/5 L", "fm.mixed-number.wrong-improper", "2 1/4을 3/4로 잘못 바꾸어 3/4×4/5=3/5로 계산한다.", "2 1/4은 9/4입니다.")
      ])
    ]
  }),

  stage({
    id: "cs.congruence-identify", unitId: "congruence-symmetry",
    title: "움직여 완전히 겹쳐지는 합동 관계 알아보기", shortTitle: "합동인 두 도형을 알아봄",
    anchorIds: ["[6수03-01]"],
    misconceptions: [
      { id: "cs.congruence-identify.shape-only", title: "모양만 같으면 합동이라고 판단함" },
      { id: "cs.congruence-identify.size-only", title: "크기만 같으면 합동이라고 판단함" }
    ],
    questions: [
      question("g5s2-cs-01", "처음 도형을 오른쪽으로 옮기면 나중 도형과 완전히 겹쳐집니다.", "두 도형의 관계는 무엇인가요?", "합동입니다", [
        wrong("g5s2-cs-01-d1", "모양만 같습니다", "cs.congruence-identify.shape-only", "완전히 겹친다는 크기 조건을 빼고 모양만 같다고 판단한다.", "완전히 겹치므로 모양과 크기가 모두 같습니다."),
        wrong("g5s2-cs-01-d2", "크기만 같습니다", "cs.congruence-identify.size-only", "완전히 겹친다는 모양 조건을 빼고 크기만 같다고 판단한다.", "완전히 겹치므로 크기뿐 아니라 모양도 같습니다.")
      ], { kind: "grid-transform-diagram", mode: "slide", rows: 6, columns: 8, sourceCells: [{row:1,column:1},{row:2,column:1},{row:2,column:2}], targetCells: [{row:1,column:5},{row:2,column:5},{row:2,column:6}], direction: "right", amount: 4 }),
      question("g5s2-cs-02", "처음 도형을 돌리면 나중 도형과 완전히 겹쳐집니다.", "두 도형의 관계는 무엇인가요?", "합동입니다", [
        wrong("g5s2-cs-02-d1", "모양만 같습니다", "cs.congruence-identify.shape-only", "회전 뒤 같은 크기라는 조건을 빼고 모양만 같다고 판단한다.", "돌려서 완전히 겹치므로 모양과 크기가 모두 같습니다."),
        wrong("g5s2-cs-02-d2", "크기만 같습니다", "cs.congruence-identify.size-only", "회전 뒤 같은 모양이라는 조건을 빼고 크기만 같다고 판단한다.", "합동은 모양과 크기가 모두 같은 관계입니다.")
      ], { kind: "grid-transform-diagram", mode: "rotate", rows: 7, columns: 7, sourceCells: [{row:1,column:2},{row:2,column:2},{row:2,column:3}], targetCells: [{row:2,column:5},{row:2,column:4},{row:3,column:4}], center: {row:3,column:3}, turn: "clockwise", quarterTurns: 1 })
    ]
  }),
  stage({
    id: "cs.congruence-correspondence", unitId: "congruence-symmetry",
    title: "합동인 도형의 대응변과 대응각 성질 사용하기", shortTitle: "합동의 대응 요소를 찾음",
    anchorIds: ["[6수03-01]"], prerequisiteStageIds: ["cs.congruence-identify"],
    misconceptions: [
      { id: "cs.congruence-correspondence.double-corresponding-value", title: "도형이 두 개라 대응값을 두 배로 바꿈" },
      { id: "cs.congruence-correspondence.use-neighbor", title: "대응하지 않는 이웃 요소의 값을 사용함" }
    ],
    questions: [
      question("g5s2-cs-03", "합동인 두 삼각형에서 변 ㄱㄴ과 변 ㄹㅁ이 서로 대응합니다. 변 ㄱㄴ은 5 cm이고 이웃한 변 ㄱㄷ은 7 cm입니다.", "변 ㄹㅁ은 몇 cm인가요?", "5 cm", [
        wrong("g5s2-cs-03-d1", "10 cm", "cs.congruence-correspondence.double-corresponding-value", "합동인 도형이 두 개라는 이유로 대응변 5 cm를 두 배로 한다.", "합동인 도형의 대응변 길이는 서로 같습니다."),
        wrong("g5s2-cs-03-d2", "7 cm", "cs.congruence-correspondence.use-neighbor", "이웃한 다른 변의 길이 7 cm를 대응변 값으로 옮긴다.", "서로 대응한다고 한 변 ㄱㄴ과 변 ㄹㅁ의 길이를 비교해야 합니다.")
      ]),
      question("g5s2-cs-04", "합동인 두 사각형에서 각 ㄱ과 각 ㅁ이 서로 대응합니다. 각 ㄱ은 70°이고 이웃한 각은 110°입니다.", "각 ㅁ은 몇 도인가요?", "70°", [
        wrong("g5s2-cs-04-d1", "140°", "cs.congruence-correspondence.double-corresponding-value", "도형이 두 개라는 이유로 대응각 70°를 두 배로 한다.", "합동인 도형의 대응각 크기는 서로 같습니다."),
        wrong("g5s2-cs-04-d2", "110°", "cs.congruence-correspondence.use-neighbor", "대응각이 아닌 이웃한 각 110°를 옮긴다.", "각 ㄱ과 서로 대응하는 각 ㅁ의 크기는 70°입니다.")
      ])
    ]
  }),
  stage({
    id: "cs.line-symmetry-identify", unitId: "congruence-symmetry",
    title: "대칭축을 따라 접어 겹치는 선대칭 관계 알아보기", shortTitle: "선대칭 관계를 알아봄",
    anchorIds: ["[6수03-02]"],
    misconceptions: [
      { id: "cs.line-symmetry-identify.call-slide", title: "대칭축을 기준으로 뒤집은 것을 밀기라고 판단함" },
      { id: "cs.line-symmetry-identify.call-point", title: "선대칭을 점대칭으로 판단함" }
    ],
    questions: [
      question("g5s2-cs-05", "점선을 따라 접으면 두 도형이 완전히 겹칩니다.", "어떤 대칭 관계인가요?", "선대칭", [
        wrong("g5s2-cs-05-d1", "밀기", "cs.line-symmetry-identify.call-slide", "대칭축을 기준으로 뒤집은 이동을 단순히 민 것으로 판단한다.", "점선을 따라 접어 겹치므로 선대칭입니다."),
        wrong("g5s2-cs-05-d2", "점대칭", "cs.line-symmetry-identify.call-point", "대칭축이 보이는데 중심점을 기준으로 한 점대칭이라고 판단한다.", "한 직선을 따라 접어 겹치는 관계는 선대칭입니다.")
      ], { kind: "grid-transform-diagram", mode: "flip-left-right", rows: 6, columns: 8, sourceCells: [{row:1,column:1},{row:2,column:1},{row:2,column:2}], targetCells: [{row:1,column:6},{row:2,column:6},{row:2,column:5}], axisIndex: 4 }),
      question("g5s2-cs-06", "가로 점선을 따라 접으면 두 도형이 완전히 겹칩니다.", "어떤 대칭 관계인가요?", "선대칭", [
        wrong("g5s2-cs-06-d1", "밀기", "cs.line-symmetry-identify.call-slide", "위아래가 뒤집힌 도형을 아래로 민 것으로만 판단한다.", "가로 점선을 따라 접어 겹치므로 선대칭입니다."),
        wrong("g5s2-cs-06-d2", "점대칭", "cs.line-symmetry-identify.call-point", "대칭축 대신 중심점을 기준으로 돌린 점대칭이라고 판단한다.", "직선을 따라 접어 겹치는 관계는 선대칭입니다.")
      ], { kind: "grid-transform-diagram", mode: "flip-up-down", rows: 8, columns: 6, sourceCells: [{row:1,column:2},{row:1,column:3},{row:2,column:2}], targetCells: [{row:6,column:2},{row:6,column:3},{row:5,column:2}], axisIndex: 4 })
    ]
  }),
  stage({
    id: "cs.line-symmetry-distance", unitId: "congruence-symmetry",
    title: "대칭축과 대응점 사이의 같은 거리 사용하기", shortTitle: "대칭축에서 같은 거리를 찾음",
    anchorIds: ["[6수03-02]"], prerequisiteStageIds: ["cs.line-symmetry-identify"],
    misconceptions: [
      { id: "cs.line-symmetry-distance.half-distance", title: "대칭축까지의 거리를 절반으로 줄임" },
      { id: "cs.line-symmetry-distance.double-distance", title: "대칭축 양쪽 전체 거리를 대응점 거리로 씀" }
    ],
    questions: [
      question("g5s2-cs-07", "점 ㄱ은 대칭축에서 왼쪽으로 2칸 떨어져 있습니다.", "대응점은 대칭축에서 오른쪽으로 몇 칸 떨어져 있나요?", "2칸", [
        wrong("g5s2-cs-07-d1", "1칸", "cs.line-symmetry-distance.half-distance", "축까지의 거리 2칸을 절반으로 줄여 1칸을 고른다.", "대응하는 두 점은 대칭축에서 같은 거리만큼 떨어져 있습니다."),
        wrong("g5s2-cs-07-d2", "4칸", "cs.line-symmetry-distance.double-distance", "양쪽 점 사이 전체 거리 4칸을 대응점의 축 거리로 고른다.", "대응점에서 대칭축까지의 거리는 2칸입니다.")
      ]),
      question("g5s2-cs-08", "점 ㄴ은 대칭축에서 위로 3칸 떨어져 있습니다.", "대응점은 대칭축에서 아래로 몇 칸 떨어져 있나요?", "3칸", [
        wrong("g5s2-cs-08-d1", "1.5칸", "cs.line-symmetry-distance.half-distance", "축까지의 거리 3칸을 절반으로 줄여 1.5칸을 고른다.", "대응점도 대칭축에서 3칸 떨어집니다."),
        wrong("g5s2-cs-08-d2", "6칸", "cs.line-symmetry-distance.double-distance", "두 점 사이 전체 거리 6칸을 대응점의 축 거리로 고른다.", "대칭축에서 대응점까지의 한쪽 거리는 3칸입니다.")
      ])
    ]
  }),
  stage({
    id: "cs.point-symmetry-identify", unitId: "congruence-symmetry",
    title: "한 점을 중심으로 반 바퀴 돌려 겹치는 점대칭 관계 알아보기", shortTitle: "점대칭 관계를 알아봄",
    anchorIds: ["[6수03-02]"],
    misconceptions: [
      { id: "cs.point-symmetry-identify.call-line", title: "점대칭을 선대칭으로 판단함" },
      { id: "cs.point-symmetry-identify.call-quarter-turn", title: "반 바퀴 대신 4분의 1바퀴 돌림으로 판단함" }
    ],
    questions: [
      question("g5s2-cs-09", "중심점을 기준으로 반 바퀴 돌리면 두 도형이 완전히 겹칩니다.", "어떤 대칭 관계인가요?", "점대칭", [
        wrong("g5s2-cs-09-d1", "선대칭", "cs.point-symmetry-identify.call-line", "중심점이 있는데도 접는 선을 기준으로 한 선대칭이라고 판단한다.", "한 점을 중심으로 반 바퀴 돌려 겹치므로 점대칭입니다."),
        wrong("g5s2-cs-09-d2", "4분의 1바퀴 돌리기", "cs.point-symmetry-identify.call-quarter-turn", "반 바퀴를 4분의 1바퀴로 잘못 판단한다.", "점대칭도형은 중심을 기준으로 반 바퀴 돌려 겹칩니다.")
      ], { kind: "grid-transform-diagram", mode: "rotate", rows: 7, columns: 7, sourceCells: [{row:1,column:1},{row:1,column:2},{row:2,column:1}], targetCells: [{row:5,column:5},{row:5,column:4},{row:4,column:5}], center: {row:3,column:3}, turn: "clockwise", quarterTurns: 2 }),
      question("g5s2-cs-10", "중심점을 기준으로 180° 돌리면 두 도형이 겹칩니다.", "어떤 대칭 관계인가요?", "점대칭", [
        wrong("g5s2-cs-10-d1", "선대칭", "cs.point-symmetry-identify.call-line", "180° 돌림을 직선을 따라 접는 선대칭으로 판단한다.", "중심점을 기준으로 180° 돌려 겹치는 관계는 점대칭입니다."),
        wrong("g5s2-cs-10-d2", "90° 돌리기", "cs.point-symmetry-identify.call-quarter-turn", "180°를 90°로 줄여 4분의 1바퀴 돌림이라고 판단한다.", "180°는 반 바퀴이며 점대칭의 조건입니다.")
      ], { kind: "grid-transform-diagram", mode: "rotate", rows: 8, columns: 8, sourceCells: [{row:1,column:2},{row:2,column:2},{row:2,column:3}], targetCells: [{row:5,column:4},{row:4,column:4},{row:4,column:3}], center: {row:3,column:3}, turn: "counterclockwise", quarterTurns: 2 })
    ]
  }),
  stage({
    id: "cs.symmetry-center", unitId: "congruence-symmetry",
    title: "점대칭 대응점의 한가운데에서 대칭 중심 찾기", shortTitle: "점대칭의 중심을 찾음",
    anchorIds: ["[6수03-02]"], prerequisiteStageIds: ["cs.point-symmetry-identify"],
    misconceptions: [
      { id: "cs.symmetry-center.choose-endpoint", title: "대응점 가운데가 아니라 한 끝점을 중심으로 고름" },
      { id: "cs.symmetry-center.off-by-one", title: "두 점의 한가운데에서 한 칸 벗어남" }
    ],
    questions: [
      question("g5s2-cs-11", "격자의 A점과 B점은 점대칭으로 대응합니다.", "대칭의 중심은 어디인가요?", "위에서 4번째, 왼쪽에서 4번째 칸의 중심", [
        wrong("g5s2-cs-11-d1", "A점", "cs.symmetry-center.choose-endpoint", "대응하는 두 점의 가운데가 아니라 A점을 중심으로 고른다.", "대칭의 중심은 A점과 B점을 이은 선분의 한가운데입니다."),
        wrong("g5s2-cs-11-d2", "위에서 3번째, 왼쪽에서 4번째 칸의 중심", "cs.symmetry-center.off-by-one", "두 점의 한가운데에서 위로 한 칸 벗어난 곳을 고른다.", "행과 열을 각각 반으로 나눈 정확한 가운데를 찾아야 합니다.")
      ], { kind: "grid-transform-diagram", mode: "point-move", rows: 7, columns: 7, points: [{row:1,column:1,label:"A"},{row:5,column:5,label:"B"}] }),
      question("g5s2-cs-12", "A점을 반 바퀴 돌렸더니 B점의 자리에 왔다고 합니다.", "회전의 중심이 되는 칸을 고르세요.", "위에서 4번째, 왼쪽에서 5번째 칸의 중심", [
        wrong("g5s2-cs-12-d1", "B점", "cs.symmetry-center.choose-endpoint", "두 대응점의 가운데가 아니라 B점을 중심으로 고른다.", "점대칭의 중심은 A점과 B점에서 같은 거리에 있습니다."),
        wrong("g5s2-cs-12-d2", "위에서 4번째, 왼쪽에서 4번째 칸의 중심", "cs.symmetry-center.off-by-one", "두 점의 한가운데에서 왼쪽으로 한 칸 벗어난 곳을 고른다.", "두 점의 행과 열 위치를 각각 반으로 나누어 가운데를 찾습니다.")
      ], { kind: "grid-transform-diagram", mode: "point-move", rows: 7, columns: 8, points: [{row:1,column:2,label:"A"},{row:5,column:6,label:"B"}] })
    ]
  }),

  stage({
    id: "dm.decimal-times-natural", unitId: "decimal-multiplication",
    title: "소수와 자연수의 곱 계산하기", shortTitle: "소수에 자연수를 곱함",
    anchorIds: ["[6수01-13]"],
    misconceptions: [
      { id: "dm.decimal-times-natural.shift-too-far", title: "소수점을 한 자리 더 왼쪽에 찍음" },
      { id: "dm.decimal-times-natural.add-operands", title: "곱셈 대신 두 수를 더함" }
    ],
    questions: [
      question("g5s2-dm-01", "계산하세요.", "1.2 × 3 = ?", "3.6", [
        wrong("g5s2-dm-01-d1", "0.36", "dm.decimal-times-natural.shift-too-far", "12×3=36 뒤 소수점을 두 자리 옮겨 0.36으로 쓴다.", "1.2에는 소수 한 자리가 있으므로 답은 3.6입니다."),
        wrong("g5s2-dm-01-d2", "4.2", "dm.decimal-times-natural.add-operands", "곱하지 않고 1.2+3=4.2로 계산한다.", "3배는 1.2를 세 번 더한 3.6입니다.")
      ]),
      question("g5s2-dm-02", "리본 한 도막이 2.35 m이고 같은 도막이 4개 있습니다.", "리본의 전체 길이는 몇 m인가요?", "9.4 m", [
        wrong("g5s2-dm-02-d1", "0.94 m", "dm.decimal-times-natural.shift-too-far", "235×4=940 뒤 소수점을 세 자리 옮겨 0.940으로 쓴다.", "2.35에는 소수 두 자리가 있으므로 9.40, 곧 9.4입니다."),
        wrong("g5s2-dm-02-d2", "6.35 m", "dm.decimal-times-natural.add-operands", "곱하지 않고 2.35+4=6.35로 계산한다.", "4배는 같은 수를 네 번 더하는 곱셈입니다.")
      ])
    ]
  }),
  stage({
    id: "dm.natural-times-decimal", unitId: "decimal-multiplication",
    title: "자연수와 소수의 곱 계산하기", shortTitle: "자연수에 소수를 곱함",
    anchorIds: ["[6수01-13]"], prerequisiteStageIds: ["dm.decimal-times-natural"],
    misconceptions: [
      { id: "dm.natural-times-decimal.shift-too-far", title: "소수점을 한 자리 더 왼쪽에 찍음" },
      { id: "dm.natural-times-decimal.add-operands", title: "곱셈 대신 두 수를 더함" }
    ],
    questions: [
      question("g5s2-dm-03", "계산하세요.", "6 × 0.7 = ?", "4.2", [
        wrong("g5s2-dm-03-d1", "0.42", "dm.natural-times-decimal.shift-too-far", "6×7=42 뒤 소수점을 두 자리 옮겨 0.42로 쓴다.", "0.7에는 소수 한 자리가 있으므로 4.2입니다."),
        wrong("g5s2-dm-03-d2", "6.7", "dm.natural-times-decimal.add-operands", "곱하지 않고 6+0.7=6.7로 계산한다.", "0.7을 6번 더한 값은 4.2입니다.")
      ]),
      question("g5s2-dm-04", "한 병에 물이 1.25 L씩 들어 있습니다. 이런 병이 8개 있습니다.", "물은 모두 몇 L인가요?", "10 L", [
        wrong("g5s2-dm-04-d1", "1 L", "dm.natural-times-decimal.shift-too-far", "8×125=1000 뒤 소수점을 세 자리 옮겨 1.000으로 쓴다.", "1.25에는 소수 두 자리가 있으므로 10.00입니다."),
        wrong("g5s2-dm-04-d2", "9.25 L", "dm.natural-times-decimal.add-operands", "곱하지 않고 8+1.25=9.25로 계산한다.", "8배는 1.25를 여덟 번 더한 10입니다.")
      ])
    ]
  }),
  stage({
    id: "dm.decimal-times-decimal", unitId: "decimal-multiplication",
    title: "소수끼리 곱하기", shortTitle: "소수끼리 곱함",
    anchorIds: ["[6수01-13]"], prerequisiteStageIds: ["dm.natural-times-decimal"],
    misconceptions: [
      { id: "dm.decimal-times-decimal.ignore-one-decimal", title: "한 수의 소수 자리만 셈" },
      { id: "dm.decimal-times-decimal.add-operands", title: "곱셈 대신 두 소수를 더함" }
    ],
    questions: [
      question("g5s2-dm-05", "계산하세요.", "1.2 × 0.4 = ?", "0.48", [
        wrong("g5s2-dm-05-d1", "4.8", "dm.decimal-times-decimal.ignore-one-decimal", "12×4=48에서 한 수의 소수 자리만 세어 4.8로 쓴다.", "두 수의 소수 자리는 모두 두 자리이므로 0.48입니다."),
        wrong("g5s2-dm-05-d2", "1.6", "dm.decimal-times-decimal.add-operands", "곱하지 않고 1.2+0.4=1.6으로 계산한다.", "소수의 곱셈이므로 두 수를 더하지 않습니다.")
      ]),
      question("g5s2-dm-06", "가로가 2.5 m, 세로가 1.4 m인 직사각형 돗자리가 있습니다.", "돗자리의 넓이는 몇 m²인가요?", "3.5 m²", [
        wrong("g5s2-dm-06-d1", "35 m²", "dm.decimal-times-decimal.ignore-one-decimal", "25×14=350에서 소수 한 자리만 옮겨 35로 쓴다.", "두 수의 소수 자리를 합한 두 자리만큼 옮기면 3.50입니다."),
        wrong("g5s2-dm-06-d2", "3.9 m²", "dm.decimal-times-decimal.add-operands", "곱하지 않고 2.5+1.4=3.9로 계산한다.", "곱셈식 2.5×1.4를 계산해야 합니다.")
      ])
    ]
  }),
  stage({
    id: "dm.decimal-place", unitId: "decimal-multiplication",
    title: "곱의 소수점 위치 정하기", shortTitle: "곱의 소수점을 바르게 찍음",
    anchorIds: ["[6수01-13]"], prerequisiteStageIds: ["dm.decimal-times-decimal"],
    misconceptions: [
      { id: "dm.decimal-place.one-fewer", title: "소수 자리를 한 자리 적게 셈" },
      { id: "dm.decimal-place.one-more", title: "소수 자리를 한 자리 많게 셈" }
    ],
    questions: [
      question("g5s2-dm-07", "소수 자릿수를 확인해 계산하세요.", "0.36 × 0.2 = ?", "0.072", [
        wrong("g5s2-dm-07-d1", "0.72", "dm.decimal-place.one-fewer", "36×2=72에서 소수 자리를 두 자리만 세어 0.72로 쓴다.", "두 수의 소수 자리를 합하면 세 자리입니다."),
        wrong("g5s2-dm-07-d2", "0.0072", "dm.decimal-place.one-more", "소수 자리를 네 자리로 한 자리 더 세어 0.0072로 쓴다.", "0.36의 두 자리와 0.2의 한 자리를 합한 세 자리입니다.")
      ]),
      question("g5s2-dm-08", "1.25 kg의 0.08배만큼 재료를 덜어 냅니다.", "덜어 낸 재료는 몇 kg인가요?", "0.1 kg", [
        wrong("g5s2-dm-08-d1", "1 kg", "dm.decimal-place.one-fewer", "125×8=1000에서 소수 자리를 세 자리만 세어 1.000으로 쓴다.", "두 수의 소수 자리를 합하면 네 자리이므로 0.1000입니다."),
        wrong("g5s2-dm-08-d2", "0.01 kg", "dm.decimal-place.one-more", "소수 자리를 다섯 자리로 한 자리 더 세어 0.01000으로 쓴다.", "소수 자리는 모두 네 자리이므로 값은 0.1입니다.")
      ])
    ]
  }),
  stage({
    id: "dm.estimate-check", unitId: "decimal-multiplication",
    title: "어림으로 소수 곱의 크기 확인하기", shortTitle: "어림으로 곱의 크기를 확인함",
    anchorIds: ["[6수01-13]"], prerequisiteStageIds: ["dm.decimal-place"],
    misconceptions: [
      { id: "dm.estimate-check.ten-times", title: "소수점 위치가 한 자리 커짐" },
      { id: "dm.estimate-check.add-operands", title: "곱 대신 합으로 답을 확인함" }
    ],
    questions: [
      question("g5s2-dm-09", "4.8은 약 5, 2.1은 약 2입니다. 곱은 약 10인지 확인하세요.", "4.8 × 2.1 = ?", "10.08", [
        wrong("g5s2-dm-09-d1", "100.8", "dm.estimate-check.ten-times", "정확한 곱 1008에 소수점을 한 자리만 옮겨 100.8로 쓴다.", "약 5×2=10이므로 100.8은 어림값과 맞지 않습니다."),
        wrong("g5s2-dm-09-d2", "6.9", "dm.estimate-check.add-operands", "곱하지 않고 4.8+2.1=6.9를 답으로 고른다.", "곱셈의 결과를 구하고 어림한 10과 비교해야 합니다.")
      ]),
      question("g5s2-dm-10", "0.63은 약 0.6, 5.2는 약 5입니다. 곱은 약 3인지 확인하세요.", "0.63 × 5.2 = ?", "3.276", [
        wrong("g5s2-dm-10-d1", "32.76", "dm.estimate-check.ten-times", "정확한 곱 3276에 소수점을 두 자리만 옮겨 32.76으로 쓴다.", "약 0.6×5=3이므로 32.76은 너무 큽니다."),
        wrong("g5s2-dm-10-d2", "5.83", "dm.estimate-check.add-operands", "곱하지 않고 0.63+5.2=5.83으로 계산한다.", "덧셈이 아니라 곱셈의 결과를 구해야 합니다.")
      ])
    ]
  }),

  stage({
    id: "rp.faces", unitId: "rectangular-prisms-cubes",
    title: "직육면체와 정육면체의 면 알아보기", shortTitle: "입체도형의 면을 찾음",
    anchorIds: ["[6수03-03]"],
    misconceptions: [
      { id: "rp.faces.count-visible", title: "그림에서 보이는 면만 셈" },
      { id: "rp.faces.confuse-vertices", title: "면의 수와 꼭짓점 수를 혼동함" }
    ],
    questions: [
      question("g5s2-rp-01", "보이지 않는 뒤쪽 면도 생각하세요.", "직육면체의 면은 모두 몇 개인가요?", "6개", [
        wrong("g5s2-rp-01-d1", "3개", "rp.faces.count-visible", "그림에서 바로 보이는 앞·옆·윗면 3개만 센다.", "뒤쪽의 보이지 않는 면까지 모두 세면 6개입니다."),
        wrong("g5s2-rp-01-d2", "8개", "rp.faces.confuse-vertices", "직육면체의 꼭짓점 수 8을 면의 수로 고른다.", "8은 꼭짓점 수이고 면은 6개입니다.")
      ], { kind: "solid-diagram", mode: "structure", shape: "rectangular-prism" }),
      question("g5s2-rp-02", "보이지 않는 뒤쪽 면도 생각하세요.", "정육면체의 면은 모두 몇 개인가요?", "6개", [
        wrong("g5s2-rp-02-d1", "3개", "rp.faces.count-visible", "그림에서 보이는 세 면만 세어 3개를 고른다.", "보이지 않는 반대쪽 세 면도 있어 모두 6개입니다."),
        wrong("g5s2-rp-02-d2", "8개", "rp.faces.confuse-vertices", "정육면체의 꼭짓점 수 8을 면의 수로 고른다.", "꼭짓점은 8개이고 면은 6개입니다.")
      ], { kind: "solid-diagram", mode: "structure", shape: "cube" })
    ]
  }),
  stage({
    id: "rp.edges-vertices", unitId: "rectangular-prisms-cubes",
    title: "직육면체와 정육면체의 모서리와 꼭짓점 세기", shortTitle: "모서리와 꼭짓점을 셈",
    anchorIds: ["[6수03-03]"], prerequisiteStageIds: ["rp.faces"],
    misconceptions: [
      { id: "rp.edges-vertices.use-face-count", title: "면의 수를 모서리나 꼭짓점 수로 씀" },
      { id: "rp.edges-vertices.swap-edge-vertex", title: "모서리 수와 꼭짓점 수를 서로 바꿈" }
    ],
    questions: [
      question("g5s2-rp-03", "직육면체의 꼭짓점을 빠짐없이 세어 보세요.", "꼭짓점은 모두 몇 개인가요?", "8개", [
        wrong("g5s2-rp-03-d1", "6개", "rp.edges-vertices.use-face-count", "면의 수 6을 꼭짓점 수로 고른다.", "6은 면의 수이고 꼭짓점은 8개입니다."),
        wrong("g5s2-rp-03-d2", "12개", "rp.edges-vertices.swap-edge-vertex", "모서리 수 12를 꼭짓점 수로 고른다.", "12는 모서리 수이고 꼭짓점은 8개입니다.")
      ], { kind: "solid-diagram", mode: "structure", shape: "rectangular-prism" }),
      question("g5s2-rp-04", "정육면체의 모서리를 빠짐없이 세어 보세요.", "모서리는 모두 몇 개인가요?", "12개", [
        wrong("g5s2-rp-04-d1", "6개", "rp.edges-vertices.use-face-count", "면의 수 6을 모서리 수로 고른다.", "면은 6개이고 모서리는 12개입니다."),
        wrong("g5s2-rp-04-d2", "8개", "rp.edges-vertices.swap-edge-vertex", "꼭짓점 수 8을 모서리 수로 고른다.", "8은 꼭짓점 수이고 모서리는 12개입니다.")
      ], { kind: "solid-diagram", mode: "structure", shape: "cube" })
    ]
  }),
  stage({
    id: "rp.edge-properties", unitId: "rectangular-prisms-cubes",
    title: "평행한 모서리의 길이 관계 판단하기", shortTitle: "평행한 모서리 길이를 비교함",
    anchorIds: ["[6수03-03]"], prerequisiteStageIds: ["rp.edges-vertices"],
    misconceptions: [
      { id: "rp.edge-properties.call-different", title: "평행한 모서리의 길이가 서로 다르다고 판단함" },
      { id: "rp.edge-properties.call-double", title: "반대쪽 모서리의 길이가 두 배라고 판단함" }
    ],
    questions: [
      question("g5s2-rp-05", "직육면체에는 같은 방향으로 뻗은 서로 평행한 모서리들이 있습니다.", "평행한 모서리의 길이는 서로 어떤가요?", "서로 같습니다", [
        wrong("g5s2-rp-05-d1", "서로 다릅니다", "rp.edge-properties.call-different", "서로 다른 자리에 있다는 이유로 평행한 모서리의 길이도 다르다고 판단한다.", "직육면체에서 같은 방향으로 뻗은 평행한 모서리의 길이는 서로 같습니다."),
        wrong("g5s2-rp-05-d2", "반대쪽이 두 배입니다", "rp.edge-properties.call-double", "반대쪽에 있는 모서리의 길이가 두 배라고 판단한다.", "반대쪽에 있어도 같은 방향의 평행한 모서리 길이는 같습니다.")
      ], { kind: "solid-diagram", mode: "structure", shape: "rectangular-prism" }),
      question("g5s2-rp-06", "정육면체에는 서로 마주 보는 같은 방향의 모서리들이 있습니다.", "마주 보는 모서리의 길이는 서로 어떤가요?", "서로 같습니다", [
        wrong("g5s2-rp-06-d1", "서로 다릅니다", "rp.edge-properties.call-different", "서로 마주 보는 다른 자리에 있다는 이유로 길이도 다르다고 판단한다.", "정육면체의 모든 모서리는 길이가 같고, 마주 보는 같은 방향의 모서리도 같습니다."),
        wrong("g5s2-rp-06-d2", "반대쪽이 두 배입니다", "rp.edge-properties.call-double", "마주 보는 모서리의 길이가 두 배라고 판단한다.", "마주 보는 위치는 길이를 바꾸지 않습니다. 두 모서리의 길이는 같습니다.")
      ], { kind: "solid-diagram", mode: "structure", shape: "cube" })
    ]
  }),
  stage({
    id: "rp.net-face-count", unitId: "rectangular-prisms-cubes",
    title: "전개도에서 여섯 면 빠짐없이 확인하기", shortTitle: "전개도의 여섯 면을 확인함",
    anchorIds: ["[6수03-04]"], prerequisiteStageIds: ["rp.faces"],
    misconceptions: [
      { id: "rp.net-face-count.count-row-only", title: "전개도의 가운데 줄 면만 셈" },
      { id: "rp.net-face-count.add-fold-lines", title: "접는 선을 면으로 더 셈" }
    ],
    questions: [
      question("g5s2-rp-07", "정육면체 전개도의 네모를 빠짐없이 세어 보세요.", "면은 모두 몇 개인가요?", "6개", [
        wrong("g5s2-rp-07-d1", "4개", "rp.net-face-count.count-row-only", "가운데 가로줄에 있는 네 면만 세어 4개를 고른다.", "가운데 줄 위와 아래의 면도 하나씩 세어야 합니다."),
        wrong("g5s2-rp-07-d2", "11개", "rp.net-face-count.add-fold-lines", "면 6개에 접는 선 5개를 더해 11개를 고른다.", "접는 선은 면이 아니므로 네모만 셉니다.")
      ], { kind: "solid-diagram", mode: "net", shape: "cube" }),
      question("g5s2-rp-08", "직육면체 전개도의 네모를 빠짐없이 세어 보세요.", "면은 모두 몇 개인가요?", "6개", [
        wrong("g5s2-rp-08-d1", "4개", "rp.net-face-count.count-row-only", "가운데에 이어진 네 면만 세어 4개를 고른다.", "위와 아래에 붙은 두 면도 포함해야 합니다."),
        wrong("g5s2-rp-08-d2", "11개", "rp.net-face-count.add-fold-lines", "면 6개에 서로 붙은 접는 선 5개를 더해 11개를 고른다.", "접는 선은 면이 아니므로 직사각형 여섯 개만 셉니다.")
      ], { kind: "solid-diagram", mode: "net", shape: "rectangular-prism" })
    ]
  }),
  stage({
    id: "rp.net-match", unitId: "rectangular-prisms-cubes",
    title: "전개도를 접었을 때 만들어지는 입체도형 판단하기", shortTitle: "전개도와 입체도형을 연결함",
    anchorIds: ["[6수03-04]"], prerequisiteStageIds: ["rp.net-face-count"],
    misconceptions: [
      { id: "rp.net-match.use-face-shape-only", title: "한 면의 모양만 보고 입체를 고름" },
      { id: "rp.net-match.ignore-face-count", title: "면의 수를 확인하지 않고 입체를 고름" }
    ],
    questions: [
      question("g5s2-rp-09", "같은 크기의 정사각형 여섯 개로 된 전개도입니다.", "접어서 만들 수 있는 입체도형은 무엇인가요?", "정육면체", [
        wrong("g5s2-rp-09-d1", "사각뿔", "rp.net-match.use-face-shape-only", "밑면이 정사각형일 수 있다는 한 면만 보고 사각뿔을 고른다.", "사각뿔에는 삼각형 옆면이 필요하지만 이 전개도는 모두 정사각형입니다."),
        wrong("g5s2-rp-09-d2", "삼각기둥", "rp.net-match.ignore-face-count", "면의 모양과 수를 확인하지 않고 삼각기둥을 고른다.", "정사각형 여섯 면이 모두 같은 입체는 정육면체입니다.")
      ], { kind: "solid-diagram", mode: "net", shape: "cube" }),
      question("g5s2-rp-10", "서로 마주 보는 면끼리 같은 크기인 직사각형 여섯 개로 된 전개도입니다.", "접어서 만들 수 있는 입체도형은 무엇인가요?", "직육면체", [
        wrong("g5s2-rp-10-d1", "원기둥", "rp.net-match.use-face-shape-only", "직사각형 한 면만 보고 옆면이 직사각형인 원기둥을 고른다.", "원기둥 전개도에는 원 두 개가 필요합니다."),
        wrong("g5s2-rp-10-d2", "사각뿔", "rp.net-match.ignore-face-count", "여섯 직사각형 면의 수와 모양을 확인하지 않고 사각뿔을 고른다.", "직사각형 여섯 면으로 이루어진 입체는 직육면체입니다.")
      ], { kind: "solid-diagram", mode: "net", shape: "rectangular-prism" })
    ]
  }),

  stage({
    id: "ap.mean-calculate", unitId: "average-probability",
    title: "자료의 합을 자료 수로 나누어 평균 구하기", shortTitle: "자료의 평균을 구함",
    anchorIds: ["[6수04-01]"],
    misconceptions: [
      { id: "ap.mean-calculate.use-total", title: "자료의 합을 평균으로 고름" },
      { id: "ap.mean-calculate.use-range", title: "가장 큰 값과 작은 값의 차를 평균으로 고름" }
    ],
    questions: [
      question("g5s2-ap-01", "세 날의 독서 시간은 6분, 7분, 11분입니다.", "하루 평균 독서 시간은 몇 분인가요?", "8분", [
        wrong("g5s2-ap-01-d1", "24분", "ap.mean-calculate.use-total", "6+7+11=24를 자료 수 3으로 나누지 않는다.", "자료의 합 24를 세 날로 나누어야 합니다."),
        wrong("g5s2-ap-01-d2", "5분", "ap.mean-calculate.use-range", "가장 큰 값 11에서 가장 작은 값 6을 빼 5를 고른다.", "평균은 범위가 아니라 합을 자료 수로 나눈 값입니다.")
      ], { kind: "item-collection", ariaLabel: "독서 시간 6분, 7분, 11분", items: ["6분", "7분", "11분"] }),
      question("g5s2-ap-02", "네 번의 줄넘기 기록은 4회, 6회, 8회, 10회입니다.", "한 번 평균 기록은 몇 회인가요?", "7회", [
        wrong("g5s2-ap-02-d1", "28회", "ap.mean-calculate.use-total", "4+6+8+10=28을 자료 수 4로 나누지 않는다.", "전체 28회를 네 번으로 나누면 평균은 7회입니다."),
        wrong("g5s2-ap-02-d2", "6회", "ap.mean-calculate.use-range", "가장 큰 값 10에서 가장 작은 값 4를 빼 6을 고른다.", "평균은 자료의 차가 아니라 고르게 나눈 값입니다.")
      ], { kind: "item-collection", ariaLabel: "줄넘기 기록 4회, 6회, 8회, 10회", items: ["4회", "6회", "8회", "10회"] })
    ]
  }),
  stage({
    id: "ap.mean-missing", unitId: "average-probability",
    title: "평균과 자료 수로 빠진 자료 찾기", shortTitle: "평균에서 빠진 자료를 찾음",
    anchorIds: ["[6수04-01]"], prerequisiteStageIds: ["ap.mean-calculate"],
    misconceptions: [
      { id: "ap.mean-missing.subtract-average", title: "알려진 합에서 평균만 한 번 뺌" },
      { id: "ap.mean-missing.use-known-mean", title: "알려진 자료끼리의 평균을 빠진 값으로 씀" }
    ],
    questions: [
      question("g5s2-ap-03", "세 수 7, 9, □의 평균은 10입니다.", "□에 들어갈 수는 얼마인가요?", "14", [
        wrong("g5s2-ap-03-d1", "6", "ap.mean-missing.subtract-average", "알려진 합 16에서 평균 10을 한 번 빼 6을 고른다.", "세 수의 합은 10×3=30이므로 30−16을 해야 합니다."),
        wrong("g5s2-ap-03-d2", "8", "ap.mean-missing.use-known-mean", "알려진 두 수 7과 9의 평균 8을 빠진 수로 고른다.", "전체 세 수의 평균이 10이 되도록 합을 먼저 구해야 합니다.")
      ]),
      question("g5s2-ap-04", "네 수 6, 8, 10, □의 평균은 9입니다.", "□에 들어갈 수는 얼마인가요?", "12", [
        wrong("g5s2-ap-04-d1", "15", "ap.mean-missing.subtract-average", "알려진 합 24에서 평균 9를 한 번 빼 15를 고른다.", "네 수의 합 9×4=36에서 알려진 합 24를 빼야 합니다."),
        wrong("g5s2-ap-04-d2", "8", "ap.mean-missing.use-known-mean", "알려진 세 수 6, 8, 10의 평균 8을 빠진 수로 고른다.", "빠진 수를 포함한 네 수의 평균이 9여야 합니다.")
      ])
    ]
  }),
  stage({
    id: "ap.mean-compare", unitId: "average-probability",
    title: "자료 수가 다른 두 모둠의 평균 비교하기", shortTitle: "두 모둠의 평균을 비교함",
    anchorIds: ["[6수04-01]"], prerequisiteStageIds: ["ap.mean-calculate"],
    misconceptions: [
      { id: "ap.mean-compare.compare-total", title: "평균 대신 자료의 합을 비교함" },
      { id: "ap.mean-compare.compare-maximum", title: "평균 대신 가장 큰 값만 비교함" }
    ],
    questions: [
      question("g5s2-ap-05", "가 모둠은 9, 9점이고 나 모둠은 9, 8, 7점입니다.", "평균이 더 큰 모둠은 어디인가요?", "가 모둠", [
        wrong("g5s2-ap-05-d1", "나 모둠", "ap.mean-compare.compare-total", "나 모둠의 합 24가 가 모둠의 합 18보다 크다는 이유로 나를 고른다.", "자료 수가 다르므로 합이 아니라 가의 평균 9와 나의 평균 8을 비교해야 합니다."),
        wrong("g5s2-ap-05-d2", "두 모둠이 같습니다", "ap.mean-compare.compare-maximum", "두 모둠의 가장 큰 값이 모두 9라는 이유로 평균도 같다고 판단한다.", "가장 큰 값이 아니라 모든 자료의 평균을 비교해야 합니다.")
      ]),
      question("g5s2-ap-06", "가 모둠은 8, 8, 4, 4점이고 나 모둠은 8, 8점입니다.", "평균이 더 큰 모둠은 어디인가요?", "나 모둠", [
        wrong("g5s2-ap-06-d1", "가 모둠", "ap.mean-compare.compare-total", "가 모둠의 합 24가 나 모둠의 합 16보다 크다는 이유로 가를 고른다.", "자료 수가 다르므로 합이 아니라 가의 평균 6과 나의 평균 8을 비교해야 합니다."),
        wrong("g5s2-ap-06-d2", "두 모둠이 같습니다", "ap.mean-compare.compare-maximum", "두 모둠의 가장 큰 값이 모두 8이라는 이유로 평균도 같다고 판단한다.", "가장 큰 값이 아니라 모든 자료의 평균을 각각 구해야 합니다.")
      ])
    ]
  }),
  stage({
    id: "ap.likelihood-words", unitId: "average-probability",
    title: "사건이 일어날 가능성을 말로 비교하기", shortTitle: "가능성을 말로 비교함",
    anchorIds: ["[6수04-04]"],
    misconceptions: [
      { id: "ap.likelihood-words.reverse-certain-impossible", title: "확실한 일과 불가능한 일을 바꿈" },
      { id: "ap.likelihood-words.ignore-information", title: "주어진 조건을 무시하고 반반이라고 판단함" }
    ],
    questions: [
      question("g5s2-ap-07", "주머니에는 빨간 공만 5개 들어 있습니다.", "공 하나를 꺼낼 때 빨간 공이 나올 가능성은 어떤가요?", "확실합니다", [
        wrong("g5s2-ap-07-d1", "불가능합니다", "ap.likelihood-words.reverse-certain-impossible", "빨간 공만 있다는 조건을 반대로 보아 불가능하다고 판단한다.", "모든 공이 빨간색이므로 빨간 공이 나오는 것은 확실합니다."),
        wrong("g5s2-ap-07-d2", "반반입니다", "ap.likelihood-words.ignore-information", "공의 색이 한 종류뿐이라는 정보를 무시하고 반반이라고 판단한다.", "빨간 공 이외의 공이 없으므로 반반이 아닙니다.")
      ]),
      question("g5s2-ap-08", "1부터 6까지 적힌 주사위를 한 번 던집니다.", "8이 나올 가능성은 어떤가요?", "불가능합니다", [
        wrong("g5s2-ap-08-d1", "확실합니다", "ap.likelihood-words.reverse-certain-impossible", "나올 수 없는 8을 반드시 나온다고 반대로 판단한다.", "주사위에는 8이 없으므로 나올 수 없습니다."),
        wrong("g5s2-ap-08-d2", "반반입니다", "ap.likelihood-words.ignore-information", "주사위에 적힌 수를 확인하지 않고 반반이라고 판단한다.", "가능한 눈은 1부터 6까지이므로 8의 가능성은 없습니다.")
      ])
    ]
  }),
  stage({
    id: "ap.likelihood-number", unitId: "average-probability",
    title: "가능성을 0부터 1 사이의 수로 나타내기", shortTitle: "가능성을 수로 나타냄",
    anchorIds: ["[6수04-05]"], prerequisiteStageIds: ["ap.likelihood-words"],
    misconceptions: [
      { id: "ap.likelihood-number.use-favorable-count", title: "가능한 경우의 수를 그대로 씀" },
      { id: "ap.likelihood-number.reverse-fraction", title: "가능한 경우와 전체 경우를 거꾸로 씀" }
    ],
    questions: [
      question("g5s2-ap-09", "빨간 공 2개와 파란 공 4개 중 하나를 꺼냅니다.", "빨간 공이 나올 가능성을 수로 나타내면 얼마인가요?", "1/3", [
        wrong("g5s2-ap-09-d1", "2", "ap.likelihood-number.use-favorable-count", "빨간 공의 개수 2를 전체와 비교하지 않고 그대로 쓴다.", "빨간 공 2개를 전체 6개와 비교해 2/6=1/3로 나타냅니다."),
        wrong("g5s2-ap-09-d2", "6/2", "ap.likelihood-number.reverse-fraction", "전체 6을 분자, 빨간 공 2개를 분모에 거꾸로 써 6/2를 고른다.", "가능한 경우를 분자, 전체 경우를 분모에 씁니다.")
      ]),
      question("g5s2-ap-10", "1부터 5까지 적힌 카드 중 하나를 뽑습니다.", "짝수가 나올 가능성을 수로 나타내면 얼마인가요?", "2/5", [
        wrong("g5s2-ap-10-d1", "2", "ap.likelihood-number.use-favorable-count", "짝수 카드 2개를 전체 카드 수와 비교하지 않고 그대로 쓴다.", "짝수 카드 2개를 전체 5개와 비교하여 2/5입니다."),
        wrong("g5s2-ap-10-d2", "5/2", "ap.likelihood-number.reverse-fraction", "전체 5를 분자, 짝수 카드 2를 분모에 거꾸로 쓴다.", "가능한 짝수 카드 수가 분자이고 전체 카드 수가 분모입니다.")
      ])
    ]
  }),
  stage({
    id: "ap.data-predict", unitId: "average-probability",
    title: "반복한 자료를 이용해 다음 가능성 예상하기", shortTitle: "자료로 가능성을 예상함",
    anchorIds: ["[6수04-06]"], prerequisiteStageIds: ["ap.likelihood-number"],
    misconceptions: [
      { id: "ap.data-predict.choose-rare", title: "적게 나타난 결과를 더 가능하다고 판단함" },
      { id: "ap.data-predict.claim-certain", title: "많이 나타난 결과를 반드시 일어난다고 판단함" }
    ],
    questions: [
      question("g5s2-ap-11", "팽이를 20번 돌렸더니 빨강 14번, 파랑 6번이 나왔습니다.", "다음에 더 나올 가능성이 큰 색은 무엇인가요?", "빨강", [
        wrong("g5s2-ap-11-d1", "파랑", "ap.data-predict.choose-rare", "6번 나온 파랑을 14번 나온 빨강보다 더 가능하다고 판단한다.", "지금까지 더 자주 나온 빨강의 가능성을 더 크게 예상할 수 있습니다."),
        wrong("g5s2-ap-11-d2", "빨강이 반드시 나옵니다", "ap.data-predict.claim-certain", "빨강이 더 자주 나왔다는 자료를 반드시 나온다는 뜻으로 바꾼다.", "자료로 가능성을 예상할 수 있지만 다음 결과를 확정할 수는 없습니다.")
      ], { kind: "data-table", title: "팽이 결과", rows: [{label:"빨강",value:"14번"},{label:"파랑",value:"6번"}] }),
      question("g5s2-ap-12", "상자에서 공을 넣어 두고 30번 뽑았더니 초록 9번, 노랑 18번, 보라 3번이 나왔습니다.", "다음에 가장 나올 가능성이 큰 색은 무엇인가요?", "노랑", [
        wrong("g5s2-ap-12-d1", "보라", "ap.data-predict.choose-rare", "가장 적게 나온 보라 3번을 가장 가능성이 크다고 판단한다.", "지금까지 가장 자주 나온 노랑을 가장 가능성이 크다고 예상합니다."),
        wrong("g5s2-ap-12-d2", "노랑이 반드시 나옵니다", "ap.data-predict.claim-certain", "노랑이 많이 나왔다는 자료를 다음에도 반드시 나온다고 단정한다.", "노랑의 가능성이 크지만 반드시 나온다는 뜻은 아닙니다.")
      ], { kind: "data-table", title: "공 뽑기 결과", rows: [{label:"초록",value:"9번"},{label:"노랑",value:"18번"},{label:"보라",value:"3번"}] })
    ]
  })
];

const artifacts = buildUpperGradeSemester({
  id: "grade5-semester2",
  version: "1.0.0",
  grade: 5,
  semester: 2,
  title: "5학년 2학기 수학 생각 지도",
  shortTitle: "5-2 수학 생각 지도",
  blueprintRevision: "2026-08-01.1",
  anchors: [
    ["[6수01-02]", "이상·이하·초과·미만으로 수의 범위 나타내기"],
    ["[6수01-03]", "올림·버림·반올림을 이해하고 활용하기"],
    ["[6수01-09]", "분수의 곱셈 원리를 이해하고 계산하기"],
    ["[6수03-01]", "도형의 합동과 대응 성질 이해하기"],
    ["[6수03-02]", "선대칭도형과 점대칭도형 이해하기"],
    ["[6수01-13]", "소수의 곱셈 원리를 이해하고 계산하기"],
    ["[6수03-03]", "직육면체와 정육면체의 구성 요소와 성질 이해하기"],
    ["[6수03-04]", "직육면체와 정육면체의 전개도 이해하기"],
    ["[6수04-01]", "평균을 구하고 해석하기"],
    ["[6수04-04]", "사건의 가능성을 말로 표현하고 비교하기"],
    ["[6수04-05]", "사건의 가능성을 수로 나타내기"],
    ["[6수04-06]", "자료로 가능성을 예상하고 판단하기"]
  ].map(([id, label]) => ({ id, label, source: SOURCE })),
  units: [
    { id: "number-range-rounding", title: "수의 범위와 올림, 버림, 반올림" },
    { id: "fraction-multiplication", title: "분수의 곱셈" },
    { id: "congruence-symmetry", title: "합동과 대칭" },
    { id: "decimal-multiplication", title: "소수의 곱셈" },
    { id: "rectangular-prisms-cubes", title: "직육면체와 정육면체" },
    { id: "average-probability", title: "평균과 가능성" }
  ],
  stages
});

export const grade5Semester2Diagnosis = artifacts.diagnosis;
export const grade5Semester2CoverageBlueprint = artifacts.coverageBlueprint;
export const grade5Semester2DistractorRationales = artifacts.distractorRationales;
export const grade5Semester2MisconceptionTitles = artifacts.misconceptionTitles;
