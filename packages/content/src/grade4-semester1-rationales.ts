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
  return {
    stageId,
    signalId,
    sharedSignalRationale,
    misconceptionTitles,
    entries
  };
}

const authoring = [
  stage(
    "large-number.place-value",
    "large-number.place-value",
    "두 오답은 모두 자리표에서 한 칸 이동할 때 값이 10배씩 달라지는 관계를 어느 방향으로 적용하는지 확인합니다.",
    {
      "place-shifted-right": "목표 자리를 한 칸 오른쪽의 작은 자리로 옮김",
      "place-shifted-left": "목표 자리를 한 칸 왼쪽의 큰 자리로 옮김"
    },
    [
      [
        "g4s1-large-01",
        "three-hundred",
        "place-shifted-right",
        "천의 자리의 3을 한 칸 오른쪽인 백의 자리 값으로 읽었습니다.",
        "3,000에서 자리를 한 칸 오른쪽으로 옮겨 3,000÷10=300으로 판단했습니다."
      ],
      [
        "g4s1-large-01",
        "thirty-thousand",
        "place-shifted-left",
        "천의 자리의 3을 한 칸 왼쪽인 만의 자리 값으로 읽었습니다.",
        "3,000에서 자리를 한 칸 왼쪽으로 옮겨 3,000×10=30,000으로 판단했습니다."
      ],
      [
        "g4s1-large-02",
        "thousands-place",
        "place-shifted-right",
        "자리표의 숫자 4를 한 칸 오른쪽의 작은 자리로 읽었습니다.",
        "40,000을 10으로 나눈 4,000이 놓이는 천의 자리라고 판단했습니다."
      ],
      [
        "g4s1-large-02",
        "hundred-thousands-place",
        "place-shifted-left",
        "자리표의 숫자 4를 한 칸 왼쪽의 큰 자리로 읽었습니다.",
        "40,000에 10을 곱한 400,000이 놓이는 십만의 자리라고 판단했습니다."
      ]
    ]
  ),
  stage(
    "large-number.positional-notation",
    "large-number.positional-notation",
    "두 오답은 모두 같은 숫자의 자리 사이 거리와 한 칸마다 10배가 되는 관계를 연결하는 과정에서 관찰합니다.",
    {
      "place-gap-under-counted": "자리 사이 간격을 한 단계 적게 세어 계산함",
      "same-digit-same-value": "숫자가 같으면 자리와 관계없이 값도 같다고 봄"
    },
    [
      [
        "g4s1-large-03",
        "ten-times",
        "place-gap-under-counted",
        "만의 자리와 백의 자리 사이의 두 단계 차이를 한 단계로 줄였습니다.",
        "50,000÷500=100을 구하지 않고 한 자리 이동의 배수인 10배로 판단했습니다."
      ],
      [
        "g4s1-large-03",
        "same-value",
        "same-digit-same-value",
        "두 자리에 적힌 숫자가 모두 5라는 겉모습만 보고 값도 같다고 보았습니다.",
        "50,000과 500의 자리값을 계산하지 않고 5=5이므로 같은 값이라고 판단했습니다."
      ],
      [
        "g4s1-large-04",
        "hundred-times",
        "place-gap-under-counted",
        "천의 자리에서 백만의 자리까지 세 칸 옮기는 것을 두 칸으로 줄였습니다.",
        "2,000,000÷2,000=1,000 대신 두 자리 이동만 적용해 100배로 판단했습니다."
      ],
      [
        "g4s1-large-04",
        "same-value",
        "same-digit-same-value",
        "숫자 카드가 같은 2라는 이유로 옮긴 뒤에도 값이 그대로라고 보았습니다.",
        "백만의 자리 2와 천의 자리 2의 값을 계산하지 않고 2=2만 적용했습니다."
      ]
    ]
  ),
  stage(
    "large-number.read-write",
    "large-number.read-write",
    "두 오답은 모두 만 단위와 0이 놓인 자리를 보존하여 숫자와 한글 읽기를 서로 바꾸는 과정에서 관찰합니다.",
    {
      "ten-thousands-read-as-thousands": "만 단위를 천 단위로 한 자리 낮춰 나타냄",
      "nonzero-place-omitted": "0이 아닌 한 자리의 값을 읽거나 쓸 때 빠뜨림"
    },
    [
      [
        "g4s1-large-05",
        "thousands-reading",
        "ten-thousands-read-as-thousands",
        "70,000의 7을 만의 자리 대신 천의 자리로 낮추어 읽었습니다.",
        "70,306에서 70,000을 7,000으로 바꾸어 7,306인 칠천 삼백육으로 읽었습니다."
      ],
      [
        "g4s1-large-05",
        "hundreds-omitted",
        "nonzero-place-omitted",
        "백의 자리 숫자 3이 나타내는 300을 읽지 않았습니다.",
        "70,306에서 300을 빼고 70,006만 남겨 칠만 육으로 읽었습니다."
      ],
      [
        "g4s1-large-06",
        "8530",
        "ten-thousands-read-as-thousands",
        "팔만의 80,000을 8,000으로 한 자리 낮추어 숫자로 썼습니다.",
        "80,000+500+30 대신 8,000+500+30=8,530으로 계산했습니다."
      ],
      [
        "g4s1-large-06",
        "80030",
        "nonzero-place-omitted",
        "오백이 나타내는 백의 자리 값 500을 숫자에서 빠뜨렸습니다.",
        "80,000+500+30에서 500을 빼고 80,000+30=80,030으로 썼습니다."
      ]
    ]
  ),
  stage(
    "large-number.sequence",
    "large-number.sequence",
    "두 오답은 모두 이웃한 큰 수의 차와 수가 커지는지 작아지는지를 함께 확인하는 과정에서 관찰합니다.",
    {
      "step-size-one-place-too-small": "뛰어 세는 크기를 한 자리 작게 사용함",
      "sequence-direction-reversed": "커지는 규칙과 작아지는 규칙의 방향을 바꿈"
    },
    [
      [
        "g4s1-large-07",
        "52410",
        "step-size-one-place-too-small",
        "100씩 커지는 계열을 10씩 커지는 계열로 줄여 이어 썼습니다.",
        "52,400+100=52,500 대신 52,400+10=52,410으로 계산했습니다."
      ],
      [
        "g4s1-large-07",
        "52300",
        "sequence-direction-reversed",
        "앞의 수보다 커져야 하는데 100을 거꾸로 빼었습니다.",
        "52,400+100 대신 52,400-100=52,300으로 계산했습니다."
      ],
      [
        "g4s1-large-08",
        "minus-50",
        "step-size-one-place-too-small",
        "이웃한 수의 차 500을 한 자리 작은 50으로 보았습니다.",
        "67,500-67,000=500을 구하지 않고 차를 50으로 판단했습니다."
      ],
      [
        "g4s1-large-08",
        "plus-500",
        "sequence-direction-reversed",
        "수가 실제로 작아지는 순서를 커지는 순서로 반대로 설명했습니다.",
        "67,500-500=67,000인데 67,500+500처럼 500씩 커진다고 판단했습니다."
      ]
    ]
  ),
  stage(
    "large-number.compare",
    "large-number.compare",
    "두 오답은 모두 가장 높은 자리부터 처음 다른 자리를 찾아야 하는 비교 순서를 지키는지 확인합니다.",
    {
      "first-different-place-skipped": "처음 다른 자리를 건너뛰고 더 낮은 자리를 먼저 비교함",
      "highest-place-only": "가장 높은 한 자리만 같으면 두 수 전체도 같다고 봄"
    },
    [
      [
        "g4s1-large-09",
        "64208",
        "first-different-place-skipped",
        "처음 다른 백의 자리를 건너뛰고 일의 자리 숫자를 먼저 비교했습니다.",
        "백의 자리 2<8을 쓰지 않고 일의 자리 8>0만 적용해 64,208을 골랐습니다."
      ],
      [
        "g4s1-large-09",
        "same",
        "highest-place-only",
        "만의 자리 숫자 6이 같다는 사실만 보고 나머지 자리를 비교하지 않았습니다.",
        "64,208과 64,820의 만의 자리 6=6만 확인해 두 수가 같다고 판단했습니다."
      ],
      [
        "g4s1-large-10",
        "85720",
        "first-different-place-skipped",
        "87,250과 85,720에서 처음 다른 천의 자리를 건너뛰고 백의 자리를 비교했습니다.",
        "천의 자리 7>5를 쓰지 않고 백의 자리 2<7을 적용해 85,720을 골랐습니다."
      ],
      [
        "g4s1-large-10",
        "same",
        "highest-place-only",
        "세 수의 만의 자리 숫자 8이 같다는 사실만 보고 모두 같은 수라고 보았습니다.",
        "87,250, 85,720, 87,205에서 만의 자리 8=8=8만 확인했습니다."
      ]
    ]
  ),
  stage(
    "large-number.compare-reasoning",
    "large-number.compare-reasoning",
    "두 오답은 모두 수의 크기를 설명할 때 처음 다른 자리와 그 자리 숫자의 대소 관계를 근거로 사용하는지 확인합니다.",
    {
      "lower-place-used-as-reason": "처음 다른 자리보다 낮은 자리를 비교 근거로 사용함",
      "digit-order-reversed": "처음 다른 자리에서 작은 숫자가 있는 수를 더 크다고 설명함"
    },
    [
      [
        "g4s1-large-11",
        "ones-first",
        "lower-place-used-as-reason",
        "처음 다른 백의 자리보다 낮은 일의 자리를 비교 근거로 사용했습니다.",
        "백의 자리 9>6을 쓰지 않고 일의 자리 9>2를 적용해 47,699가 더 크다고 설명했습니다."
      ],
      [
        "g4s1-large-11",
        "reversed-order",
        "digit-order-reversed",
        "처음 다른 백의 자리에서 작은 숫자 6이 있는 수를 더 크다고 설명했습니다.",
        "백의 자리 9>6인데 대소 방향을 뒤집어 47,699>47,902로 판단했습니다."
      ],
      [
        "g4s1-large-12",
        "ones-first",
        "lower-place-used-as-reason",
        "결과는 바로 고쳤지만 처음 다른 백의 자리 대신 일의 자리를 근거로 들었습니다.",
        "백의 자리 4>1을 쓰지 않고 일의 자리 5>4만 적용해 83,415가 더 크다고 설명했습니다."
      ],
      [
        "g4s1-large-12",
        "reversed-order",
        "digit-order-reversed",
        "처음 다른 백의 자리에서 4가 더 큰데도 그 수가 더 작다고 설명했습니다.",
        "백의 자리 4>1을 확인하고도 대소 방향을 뒤집어 83,415<83,154로 판단했습니다."
      ]
    ]
  ),
  stage(
    "angle.right-angle",
    "angle.right-angle",
    "두 오답은 모두 각의 크기를 변의 길이가 아니라 두 변이 벌어진 정도로 보는지 함께 확인합니다.",
    {
      "ray-length-as-size": "변의 길이를 각의 크기나 자격으로 봄",
      "unequal-rays-block-right-angle": "두 변의 길이가 달라야 하거나 같아야 한다는 조건을 덧붙임"
    },
    [
      [
        "g4s1-angle-01",
        "ray-length-large",
        "ray-length-as-size",
        "긴 변이 있으면 각이 커진다고 보아 직각을 직각보다 큰 각으로 판단했습니다.",
        "42와 88의 길이 차이를 각의 크기 차이로 옮겨 90도를 90도보다 큰 각으로 판단했습니다."
      ],
      [
        "g4s1-angle-01",
        "unequal-rays",
        "unequal-rays-block-right-angle",
        "두 변의 길이가 같을 때만 직각이라는 조건을 덧붙였습니다.",
        "42≠88이므로 직각 조건이 깨진다고 판단했습니다."
      ],
      [
        "g4s1-angle-02",
        "long-ray-only",
        "ray-length-as-size",
        "길이가 긴 반직선만 변으로 인정했습니다.",
        "96과 40 중 96쪽만 변으로 세어 변이 하나라고 판단했습니다."
      ],
      [
        "g4s1-angle-02",
        "equal-rays-required",
        "unequal-rays-block-right-angle",
        "꼭짓점의 정의에 두 변의 길이가 같아야 한다는 조건을 붙였습니다.",
        "96≠40이므로 꼭짓점이 아니라고 판단했습니다."
      ]
    ]
  ),
  stage(
    "angle.classify",
    "angle.classify",
    "두 오답은 모두 직각을 기준으로 더 벌어졌는지 덜 벌어졌는지 판단하는 과정에서 함께 관찰합니다.",
    {
      "right-angle-comparison-reversed": "직각 기준과의 크고 작음을 반대로 판단함",
      "near-right-angle-called-right": "직각에 가까우면 모두 직각으로 처리함"
    },
    [
      [
        "g4s1-angle-03",
        "acute",
        "right-angle-comparison-reversed",
        "직각 기준선보다 더 벌어진 각을 덜 벌어진 것으로 반대로 읽었습니다.",
        "125>90인데 125<90처럼 보아 예각으로 판단했습니다."
      ],
      [
        "g4s1-angle-03",
        "right",
        "near-right-angle-called-right",
        "직각보다 35도 큰 각을 직각에 가깝다고 보아 직각으로 처리했습니다.",
        "125−90=35의 차이를 무시해 90도로 판단했습니다."
      ],
      [
        "g4s1-angle-04",
        "more-than-right",
        "right-angle-comparison-reversed",
        "기준선보다 덜 벌어진 각을 더 벌어진 것으로 반대로 읽었습니다.",
        "85<90인데 85>90처럼 보아 둔각으로 판단했습니다."
      ],
      [
        "g4s1-angle-04",
        "almost-right",
        "near-right-angle-called-right",
        "직각보다 5도 작은 각을 차이가 작다는 이유로 직각으로 처리했습니다.",
        "90−85=5를 무시해 직각으로 판단했습니다."
      ]
    ]
  ),
  stage(
    "angle.protractor-measure",
    "angle.protractor-measure",
    "두 오답은 모두 각도기의 0 눈금 정렬과 읽어야 할 눈금 방향을 함께 확인하는 과정에서 관찰합니다.",
    {
      "inner-outer-scale-confused": "안쪽·바깥쪽 눈금 방향을 바꾸어 읽음",
      "baseline-alignment-misjudged": "0 눈금 정렬 상태를 반대로 판단함"
    },
    [
      [
        "g4s1-angle-05",
        "55-degrees",
        "inner-outer-scale-confused",
        "안쪽 눈금 대신 바깥쪽 눈금을 읽었습니다.",
        "180−125=55로 반대쪽 눈금 값을 답했습니다."
      ],
      [
        "g4s1-angle-05",
        "cannot-measure",
        "baseline-alignment-misjudged",
        "0 눈금이 한 변에 맞게 놓여 있는데 어긋났다고 반대로 판단했습니다.",
        "정렬된 각도기를 어긋난 상태로 보아 측정 불가로 판단했습니다."
      ],
      [
        "g4s1-angle-06",
        "read-other-scale",
        "inner-outer-scale-confused",
        "0 눈금을 다시 맞추지 않고 반대쪽 눈금을 읽어 해결하려 했습니다.",
        "기준선이 어긋난 그림에서 180−70=110처럼 반대 눈금으로 대신 읽으려 했습니다."
      ],
      [
        "g4s1-angle-06",
        "center-only",
        "baseline-alignment-misjudged",
        "0 눈금이 어긋났는데 중심만 맞으면 된다고 반대로 판단했습니다.",
        "기준선 정렬 조건을 빼고 중심 일치만으로 바른 배치로 판단했습니다."
      ]
    ]
  ),
  stage(
    "angle.estimate",
    "angle.estimate",
    "두 오답은 모두 직각 90도를 기준점으로 삼아 크기를 어느 방향으로 어림하는지 함께 관찰합니다.",
    {
      "right-angle-value-mistaken": "직각을 기준으로 삼지 못하고 크기를 90도 쪽으로 끌어당김",
      "estimate-direction-reversed": "직각보다 크고 작음의 방향을 반대로 어림함"
    },
    [
      [
        "g4s1-angle-07",
        "about-90",
        "right-angle-value-mistaken",
        "직각 기준선과 겹치지 않는 각을 직각으로 끌어당겼습니다.",
        "45도를 기준선 값 90도로 판단했습니다."
      ],
      [
        "g4s1-angle-07",
        "about-135",
        "estimate-direction-reversed",
        "직각보다 작은 각을 큰 쪽으로 뒤집어 어림했습니다.",
        "90−45=45를 90+45=135로 방향을 바꾸어 어림했습니다."
      ],
      [
        "g4s1-angle-08",
        "about-100",
        "right-angle-value-mistaken",
        "직각에 가까운 값으로 끌어당겨 어림했습니다.",
        "150도를 90도에 가까운 100도로 어림했습니다."
      ],
      [
        "g4s1-angle-08",
        "about-30",
        "estimate-direction-reversed",
        "직각보다 큰 각을 작은 쪽으로 뒤집어 어림했습니다.",
        "180−150=30을 각의 크기로 삼아 30도쯤으로 어림했습니다."
      ]
    ]
  ),
  stage(
    "angle.triangle-angle-sum",
    "angle.triangle-angle-sum",
    "두 오답은 모두 세 각의 합이라는 관계를 쓰지 않고 다른 근거로 대신하는 과정에서 관찰합니다.",
    {
      "right-angle-assumed": "삼각형에 직각이 있다고 가정함",
      "known-angle-difference-used": "알려진 두 각의 차를 근거로 사용함"
    },
    [
      [
        "g4s1-angle-09",
        "90-degrees",
        "right-angle-assumed",
        "삼각형에 직각이 있다고 가정했습니다.",
        "180−55−80=45를 구하지 않고 직각이라고 보아 90도로 판단했습니다."
      ],
      [
        "g4s1-angle-09",
        "25-degrees",
        "known-angle-difference-used",
        "알려진 두 각의 차를 나머지 각으로 사용했습니다.",
        "80−55=25를 나머지 각으로 판단했습니다."
      ],
      [
        "g4s1-angle-10",
        "no-right-angle-needed",
        "right-angle-assumed",
        "직각이 없으면 세 각의 합 조건을 확인하지 않아도 된다고 보았습니다.",
        "60+70+60=190을 계산하지 않고 직각 유무만 확인해 그릴 수 있다고 판단했습니다."
      ],
      [
        "g4s1-angle-10",
        "difference-is-enough",
        "known-angle-difference-used",
        "세 각의 합 대신 가장 큰 각과 작은 각의 차를 근거로 삼았습니다.",
        "70−60=10만 확인해 190도라는 합을 확인하지 않았습니다."
      ]
    ]
  ),
  stage(
    "angle.quadrilateral-angle-sum",
    "angle.quadrilateral-angle-sum",
    "두 오답은 모두 사각형을 삼각형으로 나누어 합을 구하는 관계를 어떻게 확장하는지 함께 관찰합니다.",
    {
      "triangle-rule-applied-to-quadrilateral": "사각형에 삼각형의 합 규칙을 그대로 적용함",
      "quadrilateral-treated-as-right-angles": "사각형의 네 각을 모두 직각으로 가정함"
    },
    [
      [
        "g4s1-angle-11",
        "90-degrees",
        "quadrilateral-treated-as-right-angles",
        "사각형의 네 각을 모두 직각으로 가정했습니다.",
        "360−(95+100+80)=85를 구하지 않고 90도로 판단했습니다."
      ],
      [
        "g4s1-angle-11",
        "5-degrees",
        "triangle-rule-applied-to-quadrilateral",
        "사각형에 삼각형의 합 규칙을 적용했습니다.",
        "180−95−80=5로 계산해 5도로 판단했습니다."
      ],
      [
        "g4s1-angle-12",
        "one-triangle-sum",
        "triangle-rule-applied-to-quadrilateral",
        "삼각형이 두 개인데 하나 몫만 더했습니다.",
        "삼각형 두 개의 합을 삼각형 한 개의 합으로 취급했습니다."
      ],
      [
        "g4s1-angle-12",
        "all-right-angles",
        "quadrilateral-treated-as-right-angles",
        "네 각을 모두 직각으로 가정해 90도를 네 번 더하려 했습니다.",
        "90×4로 대신 계산하려고 판단했습니다."
      ]
    ]
  )
] as const;

export const grade4Semester1MisconceptionTitles = Object.freeze(
  Object.fromEntries(
    authoring.flatMap((item) =>
      Object.entries(item.misconceptionTitles).map(([slug, title]) => [
        `${item.stageId}.${slug}`,
        title
      ])
    )
  )
);

export const grade4Semester1DistractorRationales: DistractorRationale[] =
  authoring.flatMap((item) =>
    item.entries.map(
      ([judgmentId, choiceId, slug, rationale, derivation]) => ({
        judgmentId,
        choiceId,
        signalIds: [item.signalId],
        misconceptionId: `${item.stageId}.${slug}`,
        rationale,
        derivation,
        sharedSignalRationale: item.sharedSignalRationale
      })
    )
  );
