import type { DistractorRationale } from "./coverage";

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
    "multiplication.equal-groups",
    "multiplication.equal-groups",
    "두 오답은 모두 같은 수의 여러 묶음을 전체 수와 연결하는 단계에서 함께 관찰합니다.",
    {
      "addition-used": "같은 묶음의 반복을 덧셈 한 번으로 바꿈",
      "group-count-used-as-total": "묶음 수를 전체 수로 사용함"
    },
    [
      ["g3s1-mul-01", "3plus4", "addition-used", "한 묶음의 수와 묶음 수를 곱하지 않고 한 번씩 더했습니다.", "3×4 대신 3+4=7로 계산했습니다."],
      ["g3s1-mul-01", "4-only", "group-count-used-as-total", "네 묶음 안의 연필을 세지 않고 묶음 수만 전체라고 보았습니다.", "4봉지의 묶음 수 4를 연필 전체 수로 사용했습니다."],
      ["g3s1-mul-02", "11", "addition-used", "다섯 장이 여섯 번 반복되는 관계를 두 수의 합으로 바꾸었습니다.", "5×6 대신 5+6=11로 계산했습니다."],
      ["g3s1-mul-02", "6-only", "group-count-used-as-total", "각 줄의 다섯 장을 반영하지 않고 줄 수만 전체라고 보았습니다.", "6줄의 묶음 수 6을 붙임 딱지 전체 수로 사용했습니다."]
    ]
  ),
  stage(
    "multiplication.two-digit-by-one",
    "multiplication.place-value",
    "두 오답은 모두 두 자리 수의 자릿값과 곱셈 관계를 보존하는 단계에서 함께 관찰합니다.",
    {
      "place-value-dropped": "십의 자리 값을 한 자리 수처럼 줄여 곱함",
      "multiplication-replaced-by-addition": "곱셈을 두 수의 덧셈으로 바꿈"
    },
    [
      ["g3s1-mul-03", "decompose-place-dropped", "place-value-dropped", "23의 20을 2로 줄여 십의 자리 값을 빠뜨린 식을 골랐습니다.", "20×3=60을 2×3=6으로 줄여서 십의 자리 값을 빠뜨렸습니다."],
      ["g3s1-mul-03", "decompose-addition", "multiplication-replaced-by-addition", "23이 세 번 반복되는 관계를 한 번 더하는 식으로 바꾸었습니다.", "23×3을 나누어 곱하지 않고 23+3=26으로 나타냈습니다."],
      ["g3s1-mul-04", "8", "place-value-dropped", "42를 십의 자리 숫자 4로만 줄여 실제 값 40과 일의 자리 2를 반영하지 않았습니다.", "42×2를 4×2=8로 줄여 계산했습니다."],
      ["g3s1-mul-04", "44", "multiplication-replaced-by-addition", "42가 두 묶음이라는 관계를 두 수의 합으로 바꾸었습니다.", "42×2 대신 42+2=44로 계산했습니다."]
    ]
  ),
  stage(
    "division.equal-partition",
    "division.equal-partition",
    "두 오답은 모두 전체와 나누는 묶음 수로 한 묶음의 수를 찾는 단계에서 함께 관찰합니다.",
    {
      "divisor-used-as-quotient": "나누는 묶음 수를 한 묶음의 수로 사용함",
      "single-subtraction-used": "똑같이 나누는 대신 한 번만 뺌"
    },
    [
      ["g3s1-div-01", "3", "divisor-used-as-quotient", "세 명이라는 나누는 수를 한 사람이 받는 수로 그대로 사용했습니다.", "12÷3의 몫 대신 나누는 수 3을 답으로 놓았습니다."],
      ["g3s1-div-01", "9", "single-subtraction-used", "세 사람에게 반복해 나누지 않고 전체에서 사람 수를 한 번 뺐습니다.", "12÷3 대신 12-3=9로 계산했습니다."],
      ["g3s1-div-02", "5", "divisor-used-as-quotient", "5×□=20에서 이미 보이는 상자 수 5를 빈칸의 수로 다시 사용했습니다.", "5×□=20에서 찾아야 할 다른 요인 4 대신 알려진 요인 5를 빈칸에 놓았습니다."],
      ["g3s1-div-02", "15", "single-subtraction-used", "곱해서 20이 되는 수를 찾지 않고 전체에서 상자 수를 한 번 뺐습니다.", "5×□=20의 빈칸 대신 20-5=15로 계산했습니다."]
    ]
  ),
  stage(
    "division.multiplication-link",
    "division.multiplication-link",
    "두 오답은 모두 곱셈식의 전체와 요인을 나눗셈식의 역할로 바꾸는 단계에서 함께 관찰합니다.",
    {
      "known-divisor-used-as-answer": "알고 있는 나누는 수를 몫으로 다시 사용함",
      "division-replaced-by-subtraction": "곱셈의 역관계 대신 한 번 빼기만 함"
    },
    [
      ["g3s1-div-03", "4", "known-divisor-used-as-answer", "24를 4로 나눈 뒤 찾아야 할 다른 요인 대신 4를 다시 사용했습니다.", "4×6=24에서 24÷4의 몫 6 대신 나누는 수 4를 골랐습니다."],
      ["g3s1-div-03", "20", "division-replaced-by-subtraction", "24에서 4가 몇 번 들어가는지 찾지 않고 4를 한 번만 뺐습니다.", "24÷4 대신 24-4=20으로 계산했습니다."],
      ["g3s1-div-04", "5", "known-divisor-used-as-answer", "35를 5로 나눈 뒤 찾아야 할 다른 요인 대신 5를 다시 사용했습니다.", "7×5=35에서 35÷5의 몫 7 대신 나누는 수 5를 골랐습니다."],
      ["g3s1-div-04", "30", "division-replaced-by-subtraction", "35에서 5가 몇 번 들어가는지 찾지 않고 5를 한 번만 뺐습니다.", "35÷5 대신 35-5=30으로 계산했습니다."]
    ]
  ),
  stage(
    "fraction.equal-partition",
    "fraction.equal-partition",
    "두 오답은 모두 단위분수를 만들 때 조각의 수와 같은 크기 조건을 함께 확인하는 단계에서 관찰합니다.",
    {
      "unequal-parts-accepted": "조각 수만 맞으면 크기가 달라도 된다고 봄",
      "denominator-part-count-missed": "분모가 나타내는 전체 조각 수를 다르게 만듦"
    },
    [
      ["g3s1-frac-01", "four-unequal", "unequal-parts-accepted", "나 그림의 네 조각 수만 보고 서로 다른 너비를 확인하지 않았습니다.", "네 조각 조건만 적용해 너비가 1, 2, 1, 2인 나 그림을 1/4로 판단했습니다."],
      ["g3s1-frac-01", "three-equal", "denominator-part-count-missed", "다 그림의 조각 크기는 같지만 분모 4가 나타내는 조각 수를 3으로 바꾸었습니다.", "전체가 같은 너비 3조각인 다 그림을 골라 1/3 구조를 1/4로 판단했습니다."],
      ["g3s1-frac-02", "six-unequal", "unequal-parts-accepted", "민지의 종이띠가 여섯 조각이라는 수만 보고 서로 다른 너비를 그대로 허용했습니다.", "여섯 조각 조건만 적용해 너비가 1, 1, 2, 1, 1, 1인 상태도 1/6이라고 판단했습니다."],
      ["g3s1-frac-02", "five-equal", "denominator-part-count-missed", "조각 크기를 같게 고치면서도 분모 6이 나타내는 조각 수를 5로 바꾸었습니다.", "똑같은 크기 5조각으로 다시 나누면 1/5인데 이를 1/6의 고침으로 판단했습니다."]
    ]
  ),
  stage(
    "fraction.part-of-whole",
    "fraction.part-of-whole",
    "두 오답은 모두 전체 조각 수와 색칠한 조각 수를 분모와 분자에 놓는 단계에서 함께 관찰합니다.",
    {
      "numerator-denominator-reversed": "전체 조각 수와 색칠한 조각 수의 자리를 바꿈",
      "uncolored-count-used-as-denominator": "전체 대신 색칠하지 않은 조각 수를 분모로 사용함"
    },
    [
      ["g3s1-frac-03", "5of2", "numerator-denominator-reversed", "전체 5와 색칠한 2를 분수의 위아래에 반대로 놓았습니다.", "색칠한 수/전체 수인 2/5를 전체 수/색칠한 수인 5/2로 뒤집었습니다."],
      ["g3s1-frac-03", "2of3", "uncolored-count-used-as-denominator", "분모에 전체 5가 아니라 색칠하지 않은 세 조각을 놓았습니다.", "전체 5조각 중 2조각을 색칠해 남은 5-2=3을 분모로 사용했습니다."],
      ["g3s1-frac-04", "8of3", "numerator-denominator-reversed", "전체 피자 8조각과 먹은 3조각을 분수의 위아래에 반대로 놓았습니다.", "먹은 수/전체 수인 3/8을 전체 수/먹은 수인 8/3으로 뒤집었습니다."],
      ["g3s1-frac-04", "3of5", "uncolored-count-used-as-denominator", "분모에 전체 8이 아니라 먹지 않고 남은 다섯 조각을 놓았습니다.", "전체 8조각 중 3조각을 먹어 남은 8-3=5를 분모로 사용했습니다."]
    ]
  ),
  stage(
    "length.unit-choice",
    "length.unit-choice",
    "두 오답은 모두 물건의 실제 크기와 길이 단위의 크기를 연결하는 단계에서 함께 관찰합니다.",
    {
      "unit-too-large": "물건에 비해 지나치게 큰 길이 단위를 고름",
      "unit-too-small": "물건에 비해 지나치게 작은 길이 단위를 고름"
    },
    [
      ["g3s1-len-01", "15m", "unit-too-large", "연필 길이에 쓰는 cm보다 백 배 큰 m를 같은 수에 붙였습니다.", "15cm의 단위를 m로 바꾸어 약 15m로 판단했습니다."],
      ["g3s1-len-01", "15mm", "unit-too-small", "연필 길이에 쓰는 cm보다 열 배 작은 mm를 같은 수에 붙였습니다.", "15cm의 단위를 mm로 바꾸어 약 15mm로 판단했습니다."],
      ["g3s1-len-02", "2km", "unit-too-large", "교실 문 높이에 쓰는 m보다 천 배 큰 km를 같은 수에 붙였습니다.", "약 2m의 단위를 km로 바꾸어 약 2km로 판단했습니다."],
      ["g3s1-len-02", "2cm", "unit-too-small", "교실 문 높이에 쓰는 m보다 백 배 작은 cm를 같은 수에 붙였습니다.", "약 2m의 단위를 cm로 바꾸어 약 2cm로 판단했습니다."]
    ]
  ),
  stage(
    "length.unit-convert",
    "length.unit-convert",
    "두 오답은 모두 길이 단위 사이의 배수를 한 자리 작거나 크게 적용하는 단계에서 함께 관찰합니다.",
    {
      "conversion-factor-too-small": "단위 변환 배수를 한 자리 작게 사용함",
      "conversion-factor-too-large": "단위 변환 배수를 한 자리 크게 사용함"
    },
    [
      ["g3s1-len-03", "10cm", "conversion-factor-too-small", "1m를 100cm가 아니라 10cm로 바꾸어 배수를 한 자리 작게 사용했습니다.", "1m=100cm 대신 1m=10cm로 변환했습니다."],
      ["g3s1-len-03", "1000cm", "conversion-factor-too-large", "1m를 100cm가 아니라 1000cm로 바꾸어 배수를 한 자리 크게 사용했습니다.", "1m=100cm 대신 1m=1000cm로 변환했습니다."],
      ["g3s1-len-04", "200m", "conversion-factor-too-small", "2km에 1000을 곱하지 않고 100만 곱해 배수를 한 자리 작게 사용했습니다.", "2×1000=2000m 대신 2×100=200m로 변환했습니다."],
      ["g3s1-len-04", "20000m", "conversion-factor-too-large", "2km에 1000보다 열 배 큰 10000을 곱했습니다.", "2×1000=2000m 대신 2×10000=20000m로 변환했습니다."]
    ]
  )
] as const;

export const grade3Semester1MisconceptionTitles = Object.freeze(
  Object.fromEntries(
    authoring.flatMap((item) =>
      Object.entries(item.misconceptionTitles).map(([slug, title]) => [
        `${item.stageId}.${slug}`,
        title
      ])
    )
  )
);

export const grade3Semester1DistractorRationales: DistractorRationale[] =
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
