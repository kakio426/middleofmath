import type { DistractorRationale } from "./coverage";

type AuthoredDistractor = readonly [
  judgmentId: string,
  choiceId: string,
  misconceptionSlug: string,
  rationale: string,
  derivation: string
];

interface StageRationaleAuthoring {
  stageId: string;
  signalId: string;
  sharedSignalRationale: string;
  misconceptionTitles: Record<string, string>;
  entries: AuthoredDistractor[];
}

function authoredStage(
  stageId: string,
  signalId: string,
  sharedSignalRationale: string,
  misconceptionTitles: Record<string, string>,
  entries: AuthoredDistractor[]
): StageRationaleAuthoring {
  return {
    stageId,
    signalId,
    sharedSignalRationale,
    misconceptionTitles,
    entries
  };
}

/**
 * 학생에게 전달하지 않는 검수용 오답 근거.
 *
 * 각 derivation은 실제 선택지가 만들어지는 최소 계산 또는 잘못 적용한
 * 판단 규칙을 적는다. vague한 설명으로 선택지를 정당화하지 않는다.
 */
const stageAuthoring: StageRationaleAuthoring[] = [
  authoredStage(
    "multiplication.place-value",
    "multiplication.place-value-loss",
    "두 오답은 모두 곱셈 전에 자릿값을 보존해 수를 분해하는 단계에서 함께 관찰합니다.",
    {
      "place-weight-lost": "곱해지는 수의 자릿값을 없앰",
      "operation-substituted": "곱셈을 덧셈으로 바꿈"
    },
    [
      [
        "g3s2-mul-01",
        "6",
        "place-weight-lost",
        "20의 십의 자리 값을 없애고 2만 곱해 작은 수를 만들었습니다.",
        "20을 2로 읽고 2×3=6으로 계산했습니다."
      ],
      [
        "g3s2-mul-01",
        "23",
        "operation-substituted",
        "20이 세 묶음이라는 관계를 사용하지 않고 두 수를 더했습니다.",
        "20×3 대신 20+3=23으로 바꾸었습니다."
      ],
      [
        "g3s2-mul-03",
        "90",
        "place-weight-lost",
        "300을 30으로 줄여 백의 자리 한 칸을 빠뜨린 채 곱했습니다.",
        "300에서 0 한 개를 버리고 30×3=90으로 계산했습니다."
      ],
      [
        "g3s2-mul-03",
        "327",
        "operation-substituted",
        "상자 한 개의 전체 수 324와 상자 수 3을 곱하지 않고 더했습니다.",
        "300×3을 300+3=303이 아닌 324+3=327로 바꾸었습니다."
      ]
    ]
  ),
  authoredStage(
    "multiplication.combine",
    "multiplication.partial-product",
    "두 오답은 모두 자릿값별 부분곱을 구한 뒤 한 수로 합치는 단계에서 함께 관찰합니다.",
    {
      "partial-products-combined-without-place-value": "부분곱을 자릿값에 맞게 합치지 못함",
      "partial-product-omitted": "필요한 부분곱을 결과에 반영하지 못함"
    },
    [
      [
        "g3s2-mul-02",
        "612",
        "partial-products-combined-without-place-value",
        "60과 12를 같은 자리끼리 더하지 않고 보이는 숫자 순서대로 붙였습니다.",
        "부분곱 60과 12를 덧셈하지 않고 6|12=612로 이어 썼습니다."
      ],
      [
        "g3s2-mul-02",
        "27",
        "partial-product-omitted",
        "두 부분곱의 값을 합치지 않고 원래 수의 숫자를 다시 더했습니다.",
        "60+12 대신 24+3=27을 답으로 사용했습니다."
      ],
      [
        "g3s2-mul-04",
        "721",
        "partial-products-combined-without-place-value",
        "십의 자리 부분곱 120에서 20을 빠뜨려 바른 답보다 20 작게 합쳤습니다.",
        "600+120+21에서 십의 자리 부분곱 120을 100으로 보고 600+100+21=721로 계산했습니다."
      ],
      [
        "g3s2-mul-04",
        "621",
        "partial-product-omitted",
        "40×3의 부분곱을 빼고 백과 일의 부분곱만 더했습니다.",
        "600+120+21에서 120을 빠뜨려 600+21=621로 계산했습니다."
      ]
    ]
  ),
  authoredStage(
    "multiplication.two-digit",
    "multiplication.two-digit-factor",
    "두 오답은 모두 두 자리 수를 십과 일로 나누어 두 부분곱을 만드는 단계에서 함께 관찰합니다.",
    {
      "partial-products-combined-incorrectly": "부분곱을 합칠 때 자릿값을 보존하지 못함",
      "multiplicative-structure-replaced-by-addition": "두 자리 수의 곱을 부분곱 대신 덧셈으로 바꿈"
    },
    [
      [
        "g3s2-mul-05",
        "2346",
        "partial-products-combined-incorrectly",
        "십의 자리 부분곱 230에서 0을 버리고 23과 일의 자리 부분곱 46을 이어 붙였습니다.",
        "230+46을 계산하지 않고 230의 0을 버린 뒤 23|46=2346으로 적었습니다."
      ],
      [
        "g3s2-mul-05",
        "253",
        "multiplicative-structure-replaced-by-addition",
        "12를 10과 2로 나누지 않고 23에 두 자리 숫자를 한 번 더했습니다.",
        "23×12 대신 23+230=253으로 계산했습니다."
      ],
      [
        "g3s2-mul-06",
        "284",
        "partial-products-combined-incorrectly",
        "14×20과 14×1의 두 부분곱을 더할 때 일의 부분을 4만 더했습니다.",
        "280+14에서 10을 빠뜨려 280+4=284로 계산했습니다."
      ],
      [
        "g3s2-mul-06",
        "35",
        "multiplicative-structure-replaced-by-addition",
        "14가 21묶음이라는 뜻을 사용하지 않고 두 수를 더했습니다.",
        "14×21을 14+21=35로 바꾸었습니다."
      ]
    ]
  ),
  authoredStage(
    "multiplication.estimate",
    "multiplication.estimate",
    "두 오답은 모두 곱의 정확한 계산보다 먼저 자릿수와 가까운 수로 크기를 가늠하는 단계에서 함께 관찰합니다.",
    {
      "one-place-too-small": "곱의 자릿수를 한 자리 작게 어림함",
      "one-place-too-large": "곱의 자릿수를 한 자리 크게 어림함"
    },
    [
      [
        "g3s2-mul-07",
        "30",
        "one-place-too-small",
        "48을 50으로 보면서도 6묶음의 크기를 십의 자리에서 멈췄습니다.",
        "50×6≈300에서 0 하나를 빼 30으로 어림했습니다."
      ],
      [
        "g3s2-mul-07",
        "3000",
        "one-place-too-large",
        "두 자리 수와 한 자리 수의 곱을 천의 자리까지 과대하게 보았습니다.",
        "50×6≈300에 0 하나를 더 붙여 3000으로 어림했습니다."
      ],
      [
        "g3s2-mul-08",
        "about-60",
        "one-place-too-small",
        "약 30개가 약 20줄 있다는 반복을 반영하지 않아 백의 자리를 놓쳤습니다.",
        "30×20≈600에서 0 하나를 빼 약 60개로 보았습니다."
      ],
      [
        "g3s2-mul-08",
        "about-6000",
        "one-place-too-large",
        "30과 20의 곱에 필요하지 않은 0을 하나 더 붙여 크기를 부풀렸습니다.",
        "30×20≈600에 0 하나를 더해 약 6000개로 보았습니다."
      ]
    ]
  ),
  authoredStage(
    "division.meaning",
    "division.meaning",
    "두 오답은 모두 전체를 한 묶음의 크기 또는 묶음 수와 연결해 나눗셈 식으로 읽는 단계에서 함께 관찰합니다.",
    {
      "divisor-as-answer": "나누는 수를 그대로 답으로 삼음",
      "division-replaced": "나눗셈을 뺄셈이나 남은 수로 바꿈"
    },
    [
      [
        "g3s2-div-05",
        "6-groups",
        "divisor-as-answer",
        "한 묶음에 6개라는 정보를 묶음의 개수로 그대로 읽었습니다.",
        "24÷6에서 나누는 수 6을 몫으로 선택했습니다."
      ],
      [
        "g3s2-div-05",
        "18-groups",
        "division-replaced",
        "24에서 한 묶음 6개만 덜고 남은 수를 묶음 수로 보았습니다.",
        "24÷6 대신 24-6=18을 계산했습니다."
      ],
      [
        "g3s2-div-06",
        "35-div-5-wrong",
        "divisor-as-answer",
        "35를 접시 5개로 나눈 몫 대신 접시 수 5를 답으로 삼았습니다.",
        "35÷5의 결과 자리에 나누는 수 5를 그대로 놓았습니다."
      ],
      [
        "g3s2-div-06",
        "35-minus-5",
        "division-replaced",
        "전체를 똑같이 나누지 않고 접시 한 개 분량처럼 5만 뺐습니다.",
        "35÷5를 35-5=30으로 바꾸었습니다."
      ]
    ]
  ),
  authoredStage(
    "division.remainder",
    "division.leftover",
    "두 오답은 모두 먼저 나눈 양과 아직 남은 양을 전체와 연결하는 단계에서 함께 관찰합니다.",
    {
      "component-relation-misapplied": "전체·나눈 양·남은 양의 관계식을 잘못 구성함",
      "partial-value-used-as-result": "계산 결과의 일부나 남은 부분만 답으로 사용함"
    },
    [
      [
        "g3s2-div-01",
        "8",
        "component-relation-misapplied",
        "나누어 준 40개뿐 아니라 사람 수 4도 사탕 수에서 한 번 더 뺐습니다.",
        "52-4×10-4=8로 사람 수를 사탕처럼 중복해 뺐습니다."
      ],
      [
        "g3s2-div-01",
        "2",
        "partial-value-used-as-result",
        "52에서 40을 뺀 십의 자리 1을 버리고 일의 자리만 남겼습니다.",
        "52-40=12에서 십의 자리 1을 빠뜨려 2만 답으로 골랐습니다."
      ],
      [
        "g3s2-div-03",
        "40-total",
        "component-relation-misapplied",
        "상자에 먼저 담은 공만 세고 아직 남아 있는 공을 전체에 합치지 않았습니다.",
        "4×10+28에서 +28을 빼 4×10=40만 계산했습니다."
      ],
      [
        "g3s2-div-03",
        "28-left",
        "partial-value-used-as-result",
        "처음 전체를 묻는데도 아직 남은 28개만 전체라고 판단했습니다.",
        "전체 4×10+28 대신 남은 부분 28만 답으로 사용했습니다."
      ]
    ]
  ),
  authoredStage(
    "division.equal-sharing",
    "division.equal-share",
    "두 오답은 모두 전체와 나누는 묶음 수를 이용해 한 묶음의 수를 찾는 단계에서 함께 관찰합니다.",
    {
      "group-count-as-quotient": "묶음 수를 몫으로 그대로 사용함",
      "division-replaced-by-add-subtract": "나눗셈을 덧셈이나 뺄셈으로 바꿈"
    },
    [
      [
        "g3s2-div-02",
        "4",
        "group-count-as-quotient",
        "4명에게 나눈다는 조건의 사람 수를 한 사람 몫으로 그대로 골랐습니다.",
        "12÷4에서 나누는 수 4를 몫으로 사용했습니다."
      ],
      [
        "g3s2-div-02",
        "8",
        "division-replaced-by-add-subtract",
        "12개를 네 몫으로 나누지 않고 전체에서 사람 수만 뺐습니다.",
        "12÷4 대신 12-4=8로 계산했습니다."
      ],
      [
        "g3s2-div-04",
        "3-boxes",
        "group-count-as-quotient",
        "상자 3개에 나눈다는 조건의 상자 수를 한 상자 몫으로 그대로 골랐습니다.",
        "18÷3의 결과 자리에 나누는 수 3을 그대로 놓았습니다."
      ],
      [
        "g3s2-div-04",
        "21",
        "division-replaced-by-add-subtract",
        "전체를 세 상자로 나누지 않고 전체와 상자 수를 더했습니다.",
        "18÷3을 18+3=21로 바꾸었습니다."
      ]
    ]
  ),
  authoredStage(
    "division.remainder-check",
    "division.remainder-check",
    "두 오답은 모두 나누는 수×몫+나머지=전체의 확인식을 구성하는 단계에서 함께 관찰합니다.",
    {
      "remainder-operation-wrong": "나머지를 더하지 않고 빼거나 위치를 바꿈",
      "confirmation-structure-rebuilt": "나누는 수×몫+나머지 구조를 다른 식으로 바꿈"
    },
    [
      [
        "g3s2-div-07",
        "4x7-minus1",
        "remainder-operation-wrong",
        "전체를 복원할 때 남은 1을 더하지 않고 곱에서 뺐습니다.",
        "4×7+1=29 대신 4×7-1=27로 확인했습니다."
      ],
      [
        "g3s2-div-07",
        "4plus7plus1",
        "confirmation-structure-rebuilt",
        "7묶음에 4개씩이라는 관계를 곱셈으로 묶지 않고 모두 더했습니다.",
        "4×7+1을 4+7+1=12로 바꾸었습니다."
      ],
      [
        "g3s2-div-08",
        "6x5-plus7",
        "remainder-operation-wrong",
        "몫 7과 나머지 5의 자리를 바꾸어 곱셈에 나머지를 사용했습니다.",
        "6×7+5=47 대신 6×5+7=37로 놓았습니다."
      ],
      [
        "g3s2-div-08",
        "6plus7plus5",
        "confirmation-structure-rebuilt",
        "6개씩 7묶음이라는 관계를 곱셈으로 묶지 않고 세 수를 나란히 더했습니다.",
        "6×7+5=47을 6+7+5=18로 바꾸었습니다."
      ]
    ]
  ),
  authoredStage(
    "division.estimate",
    "division.estimate",
    "두 오답은 모두 나누어지는 수와 나누는 수의 크기로 몫의 자릿수를 가늠하는 단계에서 함께 관찰합니다.",
    {
      "quotient-place-too-small": "몫의 자릿수를 한 자리 작게 어림함",
      "quotient-scale-too-large": "몫의 크기를 실제보다 크게 어림함"
    },
    [
      [
        "g3s2-div-09",
        "about-2",
        "quotient-place-too-small",
        "80을 4로 나누는 크기에서 십의 자리를 없애 몫을 너무 작게 잡았습니다.",
        "80÷4≈20에서 0을 빼 약 2로 어림했습니다."
      ],
      [
        "g3s2-div-09",
        "about-200",
        "quotient-scale-too-large",
        "두 자리 수를 4로 나누는데도 몫을 백의 자리로 크게 보았습니다.",
        "80÷4≈20에 0을 더 붙여 약 200으로 어림했습니다."
      ],
      [
        "g3s2-div-10",
        "about-2-each",
        "quotient-place-too-small",
        "160개를 8명에게 나누는 몫에서 십의 자리 크기를 반영하지 않았습니다.",
        "160÷8≈20에서 0을 버려 약 2개로 어림했습니다."
      ],
      [
        "g3s2-div-10",
        "about-200-each",
        "quotient-scale-too-large",
        "세 자리 수를 8명에게 나누는데도 한 사람 몫을 백의 자리로 크게 보았습니다.",
        "160÷8≈20에 0을 하나 더 붙여 약 200개로 어림했습니다."
      ]
    ]
  ),
  authoredStage(
    "circle.parts",
    "circle.center-radius",
    "두 오답은 모두 중심·원 위의 점·두 점을 잇는 선분의 역할과 이름을 연결하는 단계에서 함께 관찰합니다.",
    {
      "radius-diameter-confused": "반지름을 지름으로 부름",
      "line-and-point-confused": "선분을 둘레나 중심점으로 부름"
    },
    [
      [
        "g3s2-circle-01",
        "diameter",
        "radius-diameter-confused",
        "중심에서 원 위까지 한쪽만 이은 선분을 원을 가로지르는 지름으로 보았습니다.",
        "중심→원 위 한 점인 선분을 지름으로 판단했습니다."
      ],
      [
        "g3s2-circle-01",
        "circumference",
        "line-and-point-confused",
        "원의 안쪽 선분과 원의 가장자리를 이루는 굽은 선을 구분하지 못했습니다.",
        "중심과 원 위를 잇는 선분을 원의 둘레로 판단했습니다."
      ],
      [
        "g3s2-circle-03",
        "diameter-oa",
        "radius-diameter-confused",
        "O에서 A까지의 한쪽 선분이 반대쪽 원 위까지 이어진다고 보았습니다.",
        "선분 OA 한 개를 반지름 2개 길이인 지름으로 판단했습니다."
      ],
      [
        "g3s2-circle-03",
        "center-oa",
        "line-and-point-confused",
        "가운데 점 O의 이름을 O와 A를 이은 선분의 이름으로 옮겼습니다.",
        "점 O가 중심이라는 사실로 선분 OA도 중심이라고 판단했습니다."
      ]
    ]
  ),
  authoredStage(
    "circle.equal-radii",
    "circle.equal-radii",
    "두 오답은 모두 같은 중심과 같은 원 위를 잇는 선분들의 길이를 비교하는 단계에서 함께 관찰합니다.",
    {
      "diameter-rule-applied": "반지름에 지름의 두 배 관계를 적용함",
      "direction-changes-length": "방향에 따라 반지름 길이가 달라진다고 봄"
    },
    [
      [
        "g3s2-circle-05",
        "6cm",
        "diameter-rule-applied",
        "다른 반지름을 구하면서 반지름 두 개가 지름이라는 관계를 잘못 적용했습니다.",
        "반지름 3cm를 2배 하여 3×2=6cm로 계산했습니다."
      ],
      [
        "g3s2-circle-05",
        "1cm",
        "direction-changes-length",
        "같은 원에서도 방향이 달라지면 중심에서 가장자리까지의 길이가 달라진다고 보았습니다.",
        "OA=3cm와 무관하게 OB는 더 짧은 1cm라고 판단했습니다."
      ],
      [
        "g3s2-circle-06",
        "all-different",
        "direction-changes-length",
        "중심은 같아도 가장자리의 위치마다 거리가 모두 달라진다고 판단했습니다.",
        "한 원의 여러 반지름을 방향별로 서로 다른 길이라고 판단했습니다."
      ],
      [
        "g3s2-circle-06",
        "one-double",
        "diameter-rule-applied",
        "한 방향의 선분만 반대편까지 이어진 지름처럼 두 배라고 보았습니다.",
        "여러 반지름 중 한 선분만 2×반지름 길이라고 판단했습니다."
      ]
    ]
  ),
  authoredStage(
    "circle.diameter",
    "circle.radius-diameter",
    "두 오답은 모두 중심 양쪽의 반지름 두 개를 이어 지름의 길이를 만드는 단계에서 함께 관찰합니다.",
    {
      "diameter-equals-radius": "지름을 반지름 한 개 길이로 봄",
      "radius-squared": "반지름을 두 배하지 않고 제곱함"
    },
    [
      [
        "g3s2-circle-02",
        "4cm",
        "diameter-equals-radius",
        "지름이 중심의 양쪽 반지름으로 이루어진다는 점을 반영하지 않았습니다.",
        "지름을 반지름과 같은 4cm라고 판단했습니다."
      ],
      [
        "g3s2-circle-02",
        "16cm",
        "radius-squared",
        "반지름을 두 번 더하는 대신 같은 수끼리 곱해 지름을 구했습니다.",
        "4+4=8 대신 4×4=16cm로 계산했습니다."
      ],
      [
        "g3s2-circle-04",
        "6cm",
        "diameter-equals-radius",
        "시계 중심에서 한쪽 가장자리까지의 거리만 지름으로 사용했습니다.",
        "지름을 반지름 한 개 길이인 6cm라고 판단했습니다."
      ],
      [
        "g3s2-circle-04",
        "36cm",
        "radius-squared",
        "중심 양쪽 6cm를 더하지 않고 반지름을 자기 자신과 곱했습니다.",
        "6+6=12 대신 6×6=36cm로 계산했습니다."
      ]
    ]
  ),
  authoredStage(
    "circle.compass",
    "circle.compass",
    "두 오답은 모두 컴퍼스의 고정점과 벌어진 길이를 원의 중심·반지름에 대응하는 단계에서 함께 관찰합니다.",
    {
      "center-radius-roles-confused": "침의 중심 역할과 벌림의 반지름 역할을 혼동함",
      "fixed-opening-condition-lost": "침과 벌림을 고정해야 한다는 조건을 놓침"
    },
    [
      [
        "g3s2-circle-07",
        "pencil",
        "center-radius-roles-confused",
        "원을 따라 움직이는 연필 끝을 움직이지 않는 중심점으로 보았습니다.",
        "회전하는 연필이 닿은 곳을 고정점으로 판단했습니다."
      ],
      [
        "g3s2-circle-07",
        "both-move",
        "fixed-opening-condition-lost",
        "침이 중심에 고정되어야 같은 거리의 원이 된다는 조건을 놓쳤습니다.",
        "침과 연필이 모두 움직여도 같은 원으로 판단했습니다."
      ],
      [
        "g3s2-circle-08",
        "10cm",
        "center-radius-roles-confused",
        "침과 연필 사이의 벌어진 길이를 반지름이 아니라 지름으로 두 배 했습니다.",
        "컴퍼스 벌림 5cm를 5×2=10cm로 계산했습니다."
      ],
      [
        "g3s2-circle-08",
        "opening-varies",
        "fixed-opening-condition-lost",
        "한 번 정한 벌림이 원을 그리는 동안 유지된다는 조건을 놓쳐 반지름이 정해지지 않는다고 보았습니다.",
        "벌림 5cm가 그리는 도중 바뀔 수 있다고 판단해 반지름을 하나로 정하지 않았습니다."
      ]
    ]
  ),
  authoredStage(
    "fraction.part-whole",
    "fraction.part-whole",
    "두 오답은 모두 전체 조각 수와 고른 조각 수를 분모·분자의 자리에 놓는 단계에서 함께 관찰합니다.",
    {
      "numerator-denominator-swapped": "분자와 분모의 자리를 바꿈",
      "whole-count-fixed-to-one": "전체 조각 수를 1로 바꿈"
    },
    [
      [
        "g3s2-frac-01",
        "four-thirds",
        "numerator-denominator-swapped",
        "전체 4칸과 색칠한 3칸을 분수의 위아래에 거꾸로 놓았습니다.",
        "색칠 3/전체 4를 전체 4/색칠 3인 4/3으로 바꾸었습니다."
      ],
      [
        "g3s2-frac-01",
        "three-ones",
        "whole-count-fixed-to-one",
        "막대 하나를 전체 조각 수 4가 아니라 분모 1로 나타냈습니다.",
        "전체 한 막대를 분모 1로 취급하여 색칠 3칸을 3/1로 적었습니다."
      ],
      [
        "g3s2-frac-03",
        "eight-fifths",
        "numerator-denominator-swapped",
        "남은 5조각과 전체 8조각의 역할을 바꾸어 분수를 만들었습니다.",
        "남은 5/전체 8을 전체 8/남은 5인 8/5로 뒤집었습니다."
      ],
      [
        "g3s2-frac-03",
        "five-ones",
        "whole-count-fixed-to-one",
        "초콜릿 한 판이라는 말만 보고 전체 8조각을 분모에서 없앴습니다.",
        "한 판을 분모 1로 취급하여 남은 5조각을 5/1로 나타냈습니다."
      ]
    ]
  ),
  authoredStage(
    "fraction.discrete",
    "fraction.discrete",
    "두 오답은 모두 전체 개수를 분모만큼 나눈 뒤 분자만큼 취하는 두 단계를 연결하는 과정에서 함께 관찰합니다.",
    {
      "one-fraction-number-used": "분모 또는 한 몫만 답으로 사용함",
      "denominator-subtracted": "전체에서 분모를 빼어 계산함"
    },
    [
      [
        "g3s2-frac-05",
        "3-buttons",
        "one-fraction-number-used",
        "12개를 3등분하지 않고 분모 3을 구해야 할 개수로 바로 사용했습니다.",
        "12÷3=4를 계산하지 않고 분모 3을 답으로 골랐습니다."
      ],
      [
        "g3s2-frac-05",
        "9-buttons",
        "denominator-subtracted",
        "전체를 똑같이 나누는 대신 전체 개수에서 분모를 한 번 뺐습니다.",
        "12개의 1/3을 12-3=9개로 계산했습니다."
      ],
      [
        "g3s2-frac-06",
        "4-stickers",
        "one-fraction-number-used",
        "20개의 1/5인 4장만 구하고 분자 3만큼 모으는 단계를 빠뜨렸습니다.",
        "20÷5=4 뒤에 4×3을 하지 않고 4장으로 멈췄습니다."
      ],
      [
        "g3s2-frac-06",
        "15-stickers",
        "denominator-subtracted",
        "20장을 5등분해 세 몫을 취하지 않고 분모 5를 전체에서 뺐습니다.",
        "20×3/5 대신 20-5=15장으로 계산했습니다."
      ]
    ]
  ),
  authoredStage(
    "fraction.unit",
    "fraction.unit",
    "두 오답은 모두 전체를 몇 조각으로 나누었는지와 그중 한 조각을 단위분수로 쓰는 단계에서 함께 관찰합니다.",
    {
      "unit-fraction-inverted": "단위분수의 분자와 분모를 뒤집음",
      "partition-count-shifted": "전체 조각 수를 하나 늘리거나 줄임"
    },
    [
      [
        "g3s2-frac-07",
        "seven-ones",
        "unit-fraction-inverted",
        "한 조각의 1과 전체 조각 수 7의 위치를 거꾸로 놓았습니다.",
        "한 조각 1/전체 7을 7/1로 뒤집었습니다."
      ],
      [
        "g3s2-frac-07",
        "one-sixth",
        "partition-count-shifted",
        "전체 7조각 중 고른 한 조각을 빼고 남은 6을 분모로 사용했습니다.",
        "전체 조각 수를 7-1=6으로 바꾸어 1/6으로 나타냈습니다."
      ],
      [
        "g3s2-frac-08",
        "nine-ones",
        "unit-fraction-inverted",
        "리본 한 도막과 전체 9도막의 위아래 자리를 서로 바꾸었습니다.",
        "한 도막 1/전체 9를 전체 9/한 도막 1인 9/1로 적었습니다."
      ],
      [
        "g3s2-frac-08",
        "one-tenth",
        "partition-count-shifted",
        "9번 자른다고 오해해 도막 수를 실제보다 하나 많은 10으로 보았습니다.",
        "전체 9도막에 1을 더한 10을 분모로 써 1/10으로 판단했습니다."
      ]
    ]
  ),
  authoredStage(
    "fraction.types",
    "fraction.types",
    "두 오답은 모두 분자와 분모의 크기 및 자연수 부분의 유무로 분수의 종류를 구분하는 단계에서 함께 관찰합니다.",
    {
      "proper-fraction-boundary-missed": "진분수의 조건을 전체 표현에 적용하지 못함",
      "form-feature-overgeneralized": "표면의 한 특징만 보고 분수 종류를 정함"
    },
    [
      [
        "g3s2-frac-09",
        "proper",
        "proper-fraction-boundary-missed",
        "분자 7이 분모 5보다 큰데도 진분수의 크기 조건을 반대로 적용했습니다.",
        "7>5인 7/5를 분자<분모인 진분수로 판단했습니다."
      ],
      [
        "g3s2-frac-09",
        "mixed",
        "form-feature-overgeneralized",
        "1보다 큰 분수라는 이유만으로 자연수 부분이 없는 7/5를 대분수로 보았습니다.",
        "자연수+진분수 꼴이 아닌 7/5를 대분수로 판단했습니다."
      ],
      [
        "g3s2-frac-10",
        "proper-number",
        "proper-fraction-boundary-missed",
        "자연수 1을 제외하고 2/3 부분만 보아 전체 표현을 진분수로 불렀습니다.",
        "1과 2/3에서 자연수 1을 무시하고 2/3만 진분수로 판단했습니다."
      ],
      [
        "g3s2-frac-10",
        "unit-number",
        "form-feature-overgeneralized",
        "진분수 부분의 분자가 1이 아닌데도 자연수 1을 보고 단위분수로 보았습니다.",
        "자연수 부분 1을 분자로 취급해 1과 2/3을 단위분수로 판단했습니다."
      ]
    ]
  ),
  authoredStage(
    "fraction.convert",
    "fraction.convert",
    "두 오답은 모두 전체 묶음 수와 남은 조각을 분모 단위로 묶거나 풀어 쓰는 단계에서 함께 관찰합니다.",
    {
      "conversion-components-miscombined": "몫·분모·분자를 잘못 결합함",
      "whole-count-mishandled": "전체 묶음 수를 하나 빠뜨리거나 더함"
    },
    [
      [
        "g3s2-frac-11",
        "one-and-two-thirds",
        "conversion-components-miscombined",
        "몫 2와 남은 1의 역할을 바꾸어 자연수 부분과 분자에 놓았습니다.",
        "7÷3=2…1에서 몫 2와 나머지 1을 바꾸어 1과 2/3으로 적었습니다."
      ],
      [
        "g3s2-frac-11",
        "three-and-one-third",
        "whole-count-mishandled",
        "7조각에서 만들 수 있는 전체 2묶음보다 한 묶음을 더 세었습니다.",
        "7÷3=2…1의 몫 2에 1을 더해 3과 1/3으로 나타냈습니다."
      ],
      [
        "g3s2-frac-12",
        "seven-fourths",
        "conversion-components-miscombined",
        "자연수 3에 분모 4를 곱하지 않고 3과 4를 바로 더했습니다.",
        "3×4+1=13 대신 3+4=7로 계산해 7/4로 적었습니다."
      ],
      [
        "g3s2-frac-12",
        "three-fourths-convert",
        "whole-count-mishandled",
        "자연수 3묶음이 각각 4조각이라는 점을 버리고 3을 그대로 분자로 썼습니다.",
        "3×4+1을 하지 않고 자연수 3만 분자에 놓아 3/4로 적었습니다."
      ]
    ]
  ),
  authoredStage(
    "fraction.compare",
    "fraction.same-denominator",
    "두 오답은 모두 분모가 같을 때 조각 크기는 같고 분자가 고른 조각 수임을 이용하는 단계에서 함께 관찰합니다.",
    {
      "smaller-numerator-chosen": "분자가 작은 분수를 더 크다고 봄",
      "equal-denominator-means-equal": "분모가 같으면 두 분수도 같다고 봄"
    },
    [
      [
        "g3s2-frac-02",
        "two-fifths",
        "smaller-numerator-chosen",
        "같은 크기 조각에서 더 적게 고른 2/5를 더 큰 분수로 선택했습니다.",
        "분모 5가 같을 때 2<4인데도 2/5>4/5로 판단했습니다."
      ],
      [
        "g3s2-frac-02",
        "same",
        "equal-denominator-means-equal",
        "분모가 같다는 사실만 보고 서로 다른 분자 2와 4를 비교하지 않았습니다.",
        "분모 5=5만 확인해 2/5=4/5로 판단했습니다."
      ],
      [
        "g3s2-frac-04",
        "three-sevenths",
        "smaller-numerator-chosen",
        "같은 병과 같은 7등분에서 3조각 든 쪽을 더 많은 양으로 보았습니다.",
        "분모 7이 같고 3<6인데 3/7>6/7로 판단했습니다."
      ],
      [
        "g3s2-frac-04",
        "same-seven",
        "equal-denominator-means-equal",
        "두 분수의 분모 7이 같다는 이유로 주스 양도 같다고 보았습니다.",
        "7=7만 비교하고 분자 3과 6을 무시해 3/7=6/7로 판단했습니다."
      ]
    ]
  ),
  authoredStage(
    "fraction.unit-compare",
    "fraction.unit-compare",
    "두 오답은 모두 같은 전체를 더 많이 나눌수록 한 조각은 작아진다는 단위분수 관계에서 함께 관찰합니다.",
    {
      "larger-denominator-means-larger": "분모가 큰 단위분수를 더 크다고 봄",
      "same-numerator-means-equal": "분자가 같으면 단위분수도 같다고 봄"
    },
    [
      [
        "g3s2-frac-13",
        "one-fifth",
        "larger-denominator-means-larger",
        "분모 5가 3보다 크다는 수의 크기만 보고 한 조각도 더 크다고 보았습니다.",
        "5>3이므로 1/5>1/3이라고 판단했습니다."
      ],
      [
        "g3s2-frac-13",
        "same-unit",
        "same-numerator-means-equal",
        "두 분수의 분자가 모두 1이라는 점만 보고 조각 크기를 같다고 보았습니다.",
        "분자 1=1만 비교해 1/3=1/5로 판단했습니다."
      ],
      [
        "g3s2-frac-14",
        "one-eighth",
        "larger-denominator-means-larger",
        "8조각으로 더 잘게 나눈 떡의 한 조각을 6조각 중 하나보다 크게 보았습니다.",
        "8>6을 그대로 적용해 1/8>1/6으로 판단했습니다."
      ],
      [
        "g3s2-frac-14",
        "same-piece",
        "same-numerator-means-equal",
        "둘 다 한 조각이라는 말만 보고 전체를 나눈 조각 수 차이를 무시했습니다.",
        "한 조각=한 조각으로 취급해 1/8=1/6으로 판단했습니다."
      ]
    ]
  ),
  authoredStage(
    "measurement.capacity-measure",
    "measurement.capacity-measure",
    "두 오답은 모두 물건의 실제 크기와 들이 단위의 크기를 연결해 알맞은 어림값을 고르는 단계에서 함께 관찰합니다.",
    {
      "unit-scale-mismatched": "물건 크기에 맞지 않는 들이 단위를 고름",
      "estimate-magnitude-mismatched": "들이의 수 크기를 지나치게 작거나 크게 어림함"
    },
    [
      [
        "g3s2-measure-05",
        "about-200l",
        "unit-scale-mismatched",
        "작은 종이컵에 쓰는 mL 대신 큰 물통에 쓰는 L를 같은 수 200에 붙였습니다.",
        "종이컵 약 200mL의 단위를 바꾸어 약 200L로 판단했습니다."
      ],
      [
        "g3s2-measure-05",
        "about-2ml",
        "estimate-magnitude-mismatched",
        "종이컵 한 컵이 몇 mL인지 생활 크기와 비교하지 않아 값을 지나치게 작게 잡았습니다.",
        "약 200mL에서 0 두 개를 빼 약 2mL로 어림했습니다."
      ],
      [
        "g3s2-measure-06",
        "about-8ml",
        "unit-scale-mismatched",
        "큰 물통의 들이를 L로 보지 않고 아주 작은 양에 쓰는 mL로 나타냈습니다.",
        "큰 물통 약 8L의 단위를 mL로 바꾸어 약 8mL로 판단했습니다."
      ],
      [
        "g3s2-measure-06",
        "about-800l",
        "estimate-magnitude-mismatched",
        "생활에서 드는 큰 물통보다 백 배 큰 값을 골라 물건 크기와 어림값을 연결하지 못했습니다.",
        "약 8L에 0 두 개를 붙여 약 800L로 어림했습니다."
      ]
    ]
  ),
  authoredStage(
    "measurement.capacity",
    "measurement.capacity-unit",
    "두 오답은 모두 1L=1000mL 관계와 혼합 단위의 자릿값을 한 단위로 바꾸는 단계에서 함께 관찰합니다.",
    {
      "milliliter-place-misread": "mL로 쓸 때 0의 자리 위치를 잘못 놓음",
      "liter-value-underrepresented": "L 부분을 1000mL 크기로 반영하지 못함"
    },
    [
      [
        "g3s2-measure-01",
        "100ml",
        "milliliter-place-misread",
        "1L를 1000mL가 아니라 100mL로 바꾸어 단위 사이의 배수를 한 자리 작게 보았습니다.",
        "1L=1000mL 대신 1L=100mL로 변환했습니다."
      ],
      [
        "g3s2-measure-01",
        "10ml",
        "liter-value-underrepresented",
        "L와 mL의 관계를 열 배로만 생각해 필요한 세 자리 변환을 하지 않았습니다.",
        "1L=1000mL 대신 1L=10mL로 변환했습니다."
      ],
      [
        "g3s2-measure-03",
        "2030ml",
        "milliliter-place-misread",
        "mL 부분을 한 자리 밀어 읽어 300mL를 30mL 크기로 처리했습니다.",
        "2L를 2000mL로 바꾼 뒤 300mL를 30mL로 읽어 2000+30=2030mL로 적었습니다."
      ],
      [
        "g3s2-measure-03",
        "300ml",
        "liter-value-underrepresented",
        "혼합 단위에서 앞의 2L를 mL로 바꾸지 않고 뒤의 300mL만 남겼습니다.",
        "2×1000+300에서 2×1000을 빠뜨려 300mL로 계산했습니다."
      ]
    ]
  ),
  authoredStage(
    "measurement.capacity-arithmetic",
    "measurement.capacity-arithmetic",
    "두 오답은 모두 L끼리와 mL끼리 계산하고 필요할 때 1000mL를 받아내림하는 단계에서 함께 관찰합니다.",
    {
      "same-unit-calculation-wrong": "같은 단위끼리 계산하거나 받아내림을 잘못함",
      "operation-structure-confused": "합과 차의 관계 또는 문제의 양을 바꾸어 사용함"
    },
    [
      [
        "g3s2-measure-07",
        "3l80ml",
        "same-unit-calculation-wrong",
        "300mL와 500mL를 더해 800mL를 구한 뒤 0 하나를 빠뜨렸습니다.",
        "2L+1L=3L, 300mL+500mL=800mL 뒤 800을 80으로 줄여 3L80mL로 적었습니다."
      ],
      [
        "g3s2-measure-07",
        "1l200ml",
        "operation-structure-confused",
        "두 들이를 합해야 하는데 같은 단위끼리 큰 수에서 작은 수를 빼어 차를 구했습니다.",
        "더하지 않고 L끼리 2-1=1, mL끼리 500-300=200을 해 1L200mL로 적었습니다."
      ],
      [
        "g3s2-measure-08",
        "3l250ml",
        "same-unit-calculation-wrong",
        "5L에서 2L를 뺀 3L를 그대로 두고 mL만 1000에서 빼 받아내림을 중복했습니다.",
        "5L-2L=3L와 1000-750=250mL를 따로 써 3L250mL로 계산했습니다."
      ],
      [
        "g3s2-measure-08",
        "2l750ml",
        "operation-structure-confused",
        "남은 양을 구하지 않고 사용한 2L 750mL를 그대로 답으로 옮겼습니다.",
        "5L-2L750mL를 계산하지 않고 뺀 양 2L750mL를 선택했습니다."
      ]
    ]
  ),
  authoredStage(
    "measurement.weight-measure",
    "measurement.weight-measure",
    "두 오답은 모두 물건의 실제 크기와 g·kg 단위의 크기를 연결해 알맞은 어림값을 고르는 단계에서 함께 관찰합니다.",
    {
      "weight-unit-scale-mismatched": "물건 크기에 맞지 않는 무게 단위를 고름",
      "weight-magnitude-mismatched": "무게의 수 크기를 지나치게 크게 어림함"
    },
    [
      [
        "g3s2-measure-09",
        "about-4g",
        "weight-unit-scale-mismatched",
        "수박처럼 손으로 드는 무거운 물건에 kg 대신 작은 물건용 g을 붙였습니다.",
        "수박 약 4kg의 단위를 바꾸어 약 4g으로 판단했습니다."
      ],
      [
        "g3s2-measure-09",
        "about-400kg",
        "weight-magnitude-mismatched",
        "수박 한 통의 생활 무게보다 백 배 큰 값을 골라 크기를 과대하게 보았습니다.",
        "약 4kg에 0 두 개를 붙여 약 400kg으로 어림했습니다."
      ],
      [
        "g3s2-measure-10",
        "about-1kg",
        "weight-unit-scale-mismatched",
        "작은 종이 클립에 알맞은 g 대신 천 배 큰 kg 단위를 사용했습니다.",
        "종이 클립 약 1g의 단위를 kg으로 바꾸어 약 1kg으로 판단했습니다."
      ],
      [
        "g3s2-measure-10",
        "about-100kg",
        "weight-magnitude-mismatched",
        "손톱보다 작은 클립의 무게를 사람보다 무거운 수준으로 크게 어림했습니다.",
        "약 1g의 수에 0 두 개와 kg을 붙여 약 100kg으로 판단했습니다."
      ]
    ]
  ),
  authoredStage(
    "measurement.weight",
    "measurement.weight-unit",
    "두 오답은 모두 1kg=1000g 관계와 혼합 단위의 자릿값을 g으로 바꾸는 단계에서 함께 관찰합니다.",
    {
      "kg-component-misconverted": "kg 부분을 1000g 크기로 반영하지 못함",
      "mixed-weight-place-misread": "kg과 g의 자릿값 위치를 잘못 놓음"
    },
    [
      [
        "g3s2-measure-02",
        "2030g",
        "mixed-weight-place-misread",
        "2kg와 300g을 g으로 더하지 않고 2와 030을 자리 맞춤 없이 이어 썼습니다.",
        "2×1000+300=2300 대신 2|030=2030g으로 적었습니다."
      ],
      [
        "g3s2-measure-02",
        "300g",
        "kg-component-misconverted",
        "2kg를 g으로 바꾸는 부분을 모두 버리고 뒤의 300g만 같은 무게로 보았습니다.",
        "2×1000+300에서 2×1000을 빠뜨려 300g으로 계산했습니다."
      ],
      [
        "g3s2-measure-04",
        "350g",
        "kg-component-misconverted",
        "3kg를 3000g이 아니라 300g으로 바꾸어 변환 배수를 한 자리 작게 사용했습니다.",
        "3×1000+50 대신 3×100+50=350g으로 계산했습니다."
      ],
      [
        "g3s2-measure-04",
        "3005g",
        "mixed-weight-place-misread",
        "50g을 십의 자리 값으로 더하지 않고 05처럼 일의 자리 쪽에 붙였습니다.",
        "3000+50=3050 대신 3000+5=3005g으로 계산했습니다."
      ]
    ]
  ),
  authoredStage(
    "measurement.ton",
    "measurement.ton",
    "두 오답은 모두 1t=1000kg 관계와 t·kg 혼합 무게를 kg으로 바꾸는 단계에서 함께 관찰합니다.",
    {
      "kilogram-place-misread": "kg으로 쓸 때 0의 자리 위치를 잘못 놓음",
      "ton-value-enlarged": "t 부분을 1000kg보다 열 배 크게 바꿈"
    },
    [
      [
        "g3s2-measure-11",
        "100kg",
        "kilogram-place-misread",
        "1t을 1000kg이 아니라 100kg으로 바꾸어 변환 배수를 작게 보았습니다.",
        "1t=1000kg 대신 1t=100kg으로 변환했습니다."
      ],
      [
        "g3s2-measure-11",
        "10000kg",
        "ton-value-enlarged",
        "1t과 kg 사이에 0을 하나 더 붙여 실제보다 열 배 크게 바꾸었습니다.",
        "1t=1000kg 대신 1t=10000kg으로 변환했습니다."
      ],
      [
        "g3s2-measure-12",
        "2050kg",
        "kilogram-place-misread",
        "kg 부분을 한 자리 밀어 읽어 500kg을 50kg 크기로 처리했습니다.",
        "2t을 2000kg으로 바꾼 뒤 500kg을 50kg으로 읽어 2000+50=2050kg으로 적었습니다."
      ],
      [
        "g3s2-measure-12",
        "20500kg",
        "ton-value-enlarged",
        "1t을 10000kg으로 보아 t 부분을 실제보다 열 배 크게 바꾼 뒤 500kg을 더했습니다.",
        "2×1000+500=2500 대신 2×10000+500=20500kg으로 계산했습니다."
      ]
    ]
  ),
  authoredStage(
    "measurement.weight-arithmetic",
    "measurement.weight-arithmetic",
    "두 오답은 모두 kg끼리와 g끼리 계산하고 필요할 때 1000g을 받아내림하는 단계에서 함께 관찰합니다.",
    {
      "same-weight-unit-calculation-wrong": "같은 무게 단위끼리 계산하거나 받아내림을 잘못함",
      "weight-operation-structure-confused": "합과 차의 관계 또는 문제의 양을 바꾸어 사용함"
    },
    [
      [
        "g3s2-measure-13",
        "3kg100g",
        "same-weight-unit-calculation-wrong",
        "kg끼리는 더했지만 g끼리는 더하지 않고 큰 수에서 작은 수를 뺐습니다.",
        "2kg+1kg=3kg으로 더한 뒤 400g-300g=100g으로 연산을 바꾸어 3kg100g을 만들었습니다."
      ],
      [
        "g3s2-measure-13",
        "1kg100g",
        "weight-operation-structure-confused",
        "두 무게를 합해야 하는데 같은 단위끼리 큰 수에서 작은 수를 뺐습니다.",
        "2kg400g+1kg300g 대신 차 1kg100g을 계산했습니다."
      ],
      [
        "g3s2-measure-14",
        "3kg200g",
        "same-weight-unit-calculation-wrong",
        "5kg에서 2kg을 뺀 3kg를 그대로 두고 g만 1000에서 빼 받아내림을 중복했습니다.",
        "5kg-2kg=3kg와 1000-800=200g을 따로 써 3kg200g으로 계산했습니다."
      ],
      [
        "g3s2-measure-14",
        "2kg800g",
        "weight-operation-structure-confused",
        "남은 쌀을 구하지 않고 덜어 낸 2kg 800g을 그대로 답으로 옮겼습니다.",
        "5kg-2kg800g을 계산하지 않고 뺀 양 2kg800g을 선택했습니다."
      ]
    ]
  ),
  authoredStage(
    "pictograph.classify-table",
    "pictograph.classify-table",
    "두 오답은 모두 자료를 종류별로 분류해 해당 범주의 개수와 전체 개수를 구분하는 단계에서 함께 관찰합니다.",
    {
      "wrong-category-counted": "묻지 않은 다른 범주의 수를 셈",
      "all-categories-counted": "해당 범주 대신 전체 자료를 셈"
    },
    [
      [
        "g3s2-graph-05",
        "2-red",
        "wrong-category-counted",
        "빨간 공을 묻는데 파란 공 두 개를 세어 다른 범주의 수를 답했습니다.",
        "빨간 공 3개 대신 파란 공 2개를 해당 범주로 판단했습니다."
      ],
      [
        "g3s2-graph-05",
        "6-red",
        "all-categories-counted",
        "빨간 공만 골라 세지 않고 화면의 모든 공을 합쳐 셌습니다.",
        "빨강 3개 대신 전체 3+2+1=6개를 계산했습니다."
      ],
      [
        "g3s2-graph-06",
        "2-cats-counted",
        "wrong-category-counted",
        "토끼를 묻는데 고양이 두 마리를 세어 다른 종류의 수를 답했습니다.",
        "토끼 4마리 대신 고양이 2마리를 해당 범주로 판단했습니다."
      ],
      [
        "g3s2-graph-06",
        "7-all-animals",
        "all-categories-counted",
        "토끼만 골라 세지 않고 그림의 동물을 종류 구분 없이 모두 셌습니다.",
        "토끼 4마리 대신 전체 4+2+1=7마리를 계산했습니다."
      ]
    ]
  ),
  authoredStage(
    "pictograph.legend",
    "pictograph.legend",
    "두 오답은 모두 그림 개수와 그림 한 개가 나타내는 실제 수를 곱해 한 행의 수량으로 바꾸는 단계에서 함께 관찰합니다.",
    {
      "symbol-count-as-value": "그림 개수만 실제 수량으로 읽음",
      "legend-used-without-multiplication": "그림 수×범례의 곱셈 관계를 만들지 못함"
    },
    [
      [
        "g3s2-graph-01",
        "3",
        "symbol-count-as-value",
        "사과 그림 세 개를 세고 한 그림이 2개라는 범례를 적용하지 않았습니다.",
        "그림 3×범례 2=6 대신 그림 수 3개만 답했습니다."
      ],
      [
        "g3s2-graph-01",
        "5",
        "legend-used-without-multiplication",
        "그림 수와 그림 한 개의 값을 곱하지 않고 두 수를 더했습니다.",
        "그림 3×2 대신 3+2=5개로 계산했습니다."
      ],
      [
        "g3s2-graph-03",
        "4-books",
        "symbol-count-as-value",
        "별 네 개를 책 권수로 바로 읽고 별 한 개가 5권인 범례를 빼먹었습니다.",
        "별 4×범례 5=20 대신 별 수 4권만 답했습니다."
      ],
      [
        "g3s2-graph-03",
        "5-books",
        "legend-used-without-multiplication",
        "별의 개수와 범례 값을 연결하지 않고 범례의 5만 책 수로 사용했습니다.",
        "별 4×5=20 대신 범례 값 5권만 답했습니다."
      ]
    ]
  ),
  authoredStage(
    "pictograph.convert",
    "pictograph.convert",
    "두 오답은 모두 필요한 모든 그림을 세고 범례의 값을 곱해 실제 수량으로 바꾸는 단계에서 함께 관찰합니다.",
    {
      "legend-factor-omitted": "그림 수에 범례 배수를 적용하지 않음",
      "conversion-model-incomplete": "범례 연산이나 자료 행 일부를 빠뜨림"
    },
    [
      [
        "g3s2-graph-07",
        "6-tangerines",
        "conversion-model-incomplete",
        "그림 네 개에 범례 2를 곱하지 않고 서로 다른 두 수를 더했습니다.",
        "4×2=8 대신 4+2=6개로 계산했습니다."
      ],
      [
        "g3s2-graph-07",
        "4-tangerines",
        "legend-factor-omitted",
        "귤 그림 네 개만 세고 그림 한 개가 2개를 뜻하는 배수를 적용하지 않았습니다.",
        "그림 4×범례 2 대신 그림 수 4개만 답했습니다."
      ],
      [
        "g3s2-graph-08",
        "5-trees",
        "legend-factor-omitted",
        "두 공원의 네모 그림 다섯 개를 실제 나무 수로 그대로 읽었습니다.",
        "그림 (3+2)×10=50 대신 그림 수 3+2=5그루로 계산했습니다."
      ],
      [
        "g3s2-graph-08",
        "30-trees",
        "conversion-model-incomplete",
        "공원 A의 그림만 범례로 바꾸고 공원 B의 두 그림은 전체에서 빠뜨렸습니다.",
        "전체 (3+2)×10 대신 A만 3×10=30그루로 계산했습니다."
      ]
    ]
  ),
  authoredStage(
    "pictograph.complete",
    "pictograph.complete",
    "두 오답은 모두 실제 수량을 범례로 나누어 필요한 그림 수와 기존 그림과의 차를 구하는 단계에서 함께 관찰합니다.",
    {
      "legend-operation-reversed": "범례로 나누지 않고 수량을 그대로 쓰거나 곱함",
      "required-symbol-count-miscomputed": "필요한 그림 수를 잘못 구하거나 추가할 수와 혼동함"
    },
    [
      [
        "g3s2-graph-09",
        "6-symbols",
        "required-symbol-count-miscomputed",
        "사과 8개를 그림 수로 바꾸지 않고 범례 2를 수량에서 빼었습니다.",
        "8÷2=4 대신 8-2=6개로 계산했습니다."
      ],
      [
        "g3s2-graph-09",
        "16-symbols",
        "legend-operation-reversed",
        "수량을 범례로 나누어야 하는데 반대로 곱해 그림 수를 늘렸습니다.",
        "8÷2=4 대신 8×2=16개로 계산했습니다."
      ],
      [
        "g3s2-graph-10",
        "5-more-symbols",
        "required-symbol-count-miscomputed",
        "아래 칸에 필요한 별 다섯 개를 구한 뒤 위 칸과의 차를 계산하지 않았습니다.",
        "25÷5=5 뒤 5-3=2를 하지 않고 5개 더로 답했습니다."
      ],
      [
        "g3s2-graph-10",
        "10-more-symbols",
        "legend-operation-reversed",
        "책 권수 차를 구한 뒤 범례로 나누지 않아 권수 10을 그림 수로 사용했습니다.",
        "(25-15)÷5=2 대신 25-15=10개 더로 계산했습니다."
      ]
    ]
  ),
  authoredStage(
    "pictograph.compare",
    "pictograph.difference",
    "두 오답은 모두 비교할 행을 정확히 고르고 그림 수 차이에 범례를 적용해 실제 수량 차이를 구하는 단계에서 함께 관찰합니다.",
    {
      "legend-difference-omitted": "그림 수 차이에 범례를 적용하지 않음",
      "legend-difference-repeated": "그림 수 차이에 범례를 두 번 적용함"
    },
    [
      [
        "g3s2-graph-02",
        "1",
        "legend-difference-omitted",
        "사과와 배의 그림 한 개 차이를 실제 과일 수로 바꾸지 않았습니다.",
        "그림 차 (3-2)×2=2 대신 그림 차 3-2=1개만 답했습니다."
      ],
      [
        "g3s2-graph-02",
        "4",
        "legend-difference-repeated",
        "그림 한 개 차이에 범례 2를 한 번 더 적용해 실제 차를 두 배로 만들었습니다.",
        "(3-2)×2=2에 다시 ×2를 하여 4개로 계산했습니다."
      ],
      [
        "g3s2-graph-04",
        "1-student",
        "legend-difference-omitted",
        "축구 그림 5개와 야구·농구 그림 4개의 차이만 세고 한 그림이 3명이라는 범례를 적용하지 않았습니다.",
        "그림 차 (5-(3+1))×3=3 대신 그림 차 5-(3+1)=1명만 답했습니다."
      ],
      [
        "g3s2-graph-04",
        "9-students",
        "legend-difference-repeated",
        "그림 한 개 차이에 범례 3을 적용해 3명을 구한 뒤 범례를 한 번 더 곱했습니다.",
        "(5-(3+1))×3=3에 다시 ×3을 하여 9명으로 계산했습니다."
      ]
    ]
  )
];

export const grade3Semester2MisconceptionTitles = Object.fromEntries(
  stageAuthoring.flatMap((stage) =>
    Object.entries(stage.misconceptionTitles).map(([slug, title]) => [
      `${stage.stageId}.${slug}`,
      title
    ])
  )
);

export const grade3Semester2DistractorRationales: DistractorRationale[] =
  stageAuthoring.flatMap((stage) =>
    stage.entries.map(([
      judgmentId,
      choiceId,
      misconceptionSlug,
      rationale,
      derivation
    ]) => ({
      judgmentId,
      choiceId,
      signalIds: [stage.signalId],
      misconceptionId: `${stage.stageId}.${misconceptionSlug}`,
      rationale,
      derivation,
      sharedSignalRationale: stage.sharedSignalRationale
    }))
  );
