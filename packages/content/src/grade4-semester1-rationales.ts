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
  ),
  stage(
    "figure-transform.slide",
    "figure-transform.slide",
    "두 오답은 모두 도형의 모든 점을 같은 방향으로 같은 칸 수만큼 옮기는 밀기 규칙을 확인하는 과정에서 관찰합니다.",
    {
      "slide-direction-reversed": "도형을 민 방향을 반대로 판단함",
      "start-cell-counted": "출발 칸을 포함하여 이동 칸 수를 하나 크게 셈"
    },
    [
      [
        "g4s1-transform-01",
        "left-three",
        "slide-direction-reversed",
        "처음 도형에서 나중 도형으로 간 가로 방향을 반대로 읽었습니다.",
        "열 번호가 1→4처럼 3칸 커졌는데 오른쪽이 아니라 왼쪽으로 3칸 밀었다고 판단했습니다."
      ],
      [
        "g4s1-transform-01",
        "right-four",
        "start-cell-counted",
        "출발 칸을 첫 칸으로 포함해 실제 이동보다 한 칸 크게 세었습니다.",
        "열 번호의 차 4−1=3 대신 출발 칸까지 세어 오른쪽으로 4칸이라고 판단했습니다."
      ],
      [
        "g4s1-transform-02",
        "up-three",
        "slide-direction-reversed",
        "처음 도형에서 나중 도형으로 간 세로 방향을 반대로 읽었습니다.",
        "행 번호가 0→3처럼 3칸 커졌는데 아래쪽이 아니라 위쪽으로 3칸 밀었다고 판단했습니다."
      ],
      [
        "g4s1-transform-02",
        "down-four",
        "start-cell-counted",
        "세로 이동에서 시작 행까지 세어 실제보다 한 칸 더 움직였다고 보았습니다.",
        "행 번호의 차 3−0=3 대신 출발 칸까지 세어 아래쪽으로 4칸이라고 판단했습니다."
      ]
    ]
  ),
  stage(
    "figure-transform.flip-left-right",
    "figure-transform.flip-left-right",
    "두 오답은 모두 세로 기준선을 사이에 둔 대응 위치와 도형 안 표식의 좌우 변화를 확인하는 과정에서 관찰합니다.",
    {
      "flip-treated-as-slide": "좌우가 바뀐 도형을 방향 그대로 옮긴 것으로 판단함",
      "wrong-flip-axis": "세로 기준선 대신 가로 기준선으로 뒤집었다고 판단함"
    },
    [
      [
        "g4s1-transform-03",
        "slide-right",
        "flip-treated-as-slide",
        "도형의 꺾인 방향과 표식 위치가 좌우로 바뀐 사실을 무시했습니다.",
        "세로선 양쪽의 대응 칸을 확인하지 않고 도형의 방향을 유지한 밀기로 판단했습니다."
      ],
      [
        "g4s1-transform-03",
        "flip-up-down",
        "wrong-flip-axis",
        "그림에 표시된 세로 기준선을 가로 기준선으로 바꾸어 생각했습니다.",
        "행 위치는 그대로이고 열 위치가 1↔6, 2↔5로 바뀌었는데 위아래 뒤집기라고 판단했습니다."
      ],
      [
        "g4s1-transform-04",
        "same-shape-slide",
        "flip-treated-as-slide",
        "도형 안 표식이 반대쪽으로 간 사실을 무시하고 모양과 방향이 그대로라고 보았습니다.",
        "표식 열이 2→5로 대응해 바뀌었는데 처음 방향 그대로 오른쪽으로 밀었다고 판단했습니다."
      ],
      [
        "g4s1-transform-04",
        "mirror-on-horizontal",
        "wrong-flip-axis",
        "세로 점선을 보면서도 가로선을 기준으로 뒤집었다고 판단했습니다.",
        "행은 0·1·2로 유지되고 열만 1↔6, 2↔5로 바뀌었는데 위아래 뒤집기라고 판단했습니다."
      ]
    ]
  ),
  stage(
    "figure-transform.flip-up-down",
    "figure-transform.flip-up-down",
    "두 오답은 모두 가로 기준선을 사이에 둔 대응 위치와 도형 안 표식의 위아래 변화를 확인하는 과정에서 관찰합니다.",
    {
      "flip-treated-as-slide": "위아래가 바뀐 도형을 방향 그대로 옮긴 것으로 판단함",
      "wrong-flip-axis": "가로 기준선 대신 세로 기준선으로 뒤집었다고 판단함"
    },
    [
      [
        "g4s1-transform-05",
        "slide-down",
        "flip-treated-as-slide",
        "도형의 꺾인 방향과 표식 위치가 위아래로 바뀐 사실을 무시했습니다.",
        "가로선 양쪽의 대응 칸을 확인하지 않고 도형의 방향을 유지한 밀기로 판단했습니다."
      ],
      [
        "g4s1-transform-05",
        "flip-left-right",
        "wrong-flip-axis",
        "그림에 표시된 가로 기준선을 세로 기준선으로 바꾸어 생각했습니다.",
        "열 위치는 그대로이고 행 위치가 1↔4, 2↔3으로 바뀌었는데 좌우 뒤집기라고 판단했습니다."
      ],
      [
        "g4s1-transform-06",
        "same-shape-down",
        "flip-treated-as-slide",
        "표식의 위아래 위치가 달라진 사실을 빼고 도형을 통째로 내린 것으로 보았습니다.",
        "표식 행이 1→4로 대응해 바뀌었는데 처음 방향 그대로 아래쪽으로 밀었다고 판단했습니다."
      ],
      [
        "g4s1-transform-06",
        "mirror-on-vertical",
        "wrong-flip-axis",
        "가로 점선을 보면서도 세로선을 기준으로 뒤집었다고 판단했습니다.",
        "열은 2·3으로 유지되고 행만 0↔5, 1↔4, 2↔3으로 바뀌었는데 좌우 뒤집기라고 판단했습니다."
      ]
    ]
  ),
  stage(
    "figure-transform.rotate",
    "figure-transform.rotate",
    "두 오답은 모두 회전 중심을 고정하고 도형의 각 점이 어느 회전 방향으로 옮겨지는지 확인하는 과정에서 관찰합니다.",
    {
      "turn-direction-reversed": "시계 방향과 시계 반대 방향을 바꾸어 판단함",
      "rotation-treated-as-slide": "중심을 고정한 돌리기를 도형 전체의 밀기로 판단함"
    },
    [
      [
        "g4s1-transform-07",
        "counterclockwise-quarter",
        "turn-direction-reversed",
        "중심 위쪽의 표식이 중심 오른쪽으로 간 회전 방향을 반대로 읽었습니다.",
        "표식이 (1,3)→(3,5)로 갔는데 시계 방향 90도가 아니라 시계 반대 방향 90도라고 판단했습니다."
      ],
      [
        "g4s1-transform-07",
        "slide-right-two",
        "rotation-treated-as-slide",
        "중심과의 위치 관계와 도형의 방향 변화를 무시하고 가로 이동으로 보았습니다.",
        "각 칸의 이동량이 서로 다른데도 도형 전체를 오른쪽으로 2칸 밀었다고 판단했습니다."
      ],
      [
        "g4s1-transform-08",
        "clockwise-quarter",
        "turn-direction-reversed",
        "중심 오른쪽 아래의 표식이 중심 위쪽으로 간 회전 방향을 반대로 읽었습니다.",
        "표식이 (4,5)→(1,4)로 갔는데 시계 반대 방향 90도가 아니라 시계 방향 90도라고 판단했습니다."
      ],
      [
        "g4s1-transform-08",
        "slide-left-two",
        "rotation-treated-as-slide",
        "중심을 둘러싼 위치 변화와 도형 방향의 변화를 무시했습니다.",
        "각 칸의 행과 열 변화가 다른데도 도형 전체를 왼쪽으로 2칸 밀었다고 판단했습니다."
      ]
    ]
  ),
  stage(
    "figure-transform.point-move",
    "figure-transform.point-move",
    "두 오답은 모두 출발점과 도착점의 행·열 차이를 방향과 칸 수로 나누어 설명하는 과정에서 관찰합니다.",
    {
      "point-direction-reversed": "출발점과 도착점을 바꾸어 이동 방향을 반대로 설명함",
      "start-cell-counted": "출발 위치를 포함하여 이동 칸 수를 하나 크게 셈"
    },
    [
      [
        "g4s1-transform-09",
        "left-four",
        "point-direction-reversed",
        "A점과 B점의 출발·도착 순서를 바꾸어 가로 방향을 반대로 설명했습니다.",
        "열이 1→5로 4만큼 커졌는데 오른쪽이 아니라 왼쪽으로 4칸이라고 판단했습니다."
      ],
      [
        "g4s1-transform-09",
        "right-five",
        "start-cell-counted",
        "A점이 있는 출발 칸을 첫 칸으로 포함해 한 칸 크게 세었습니다.",
        "열 번호의 차 5−1=4 대신 두 끝 위치를 모두 세어 오른쪽으로 5칸이라고 판단했습니다."
      ],
      [
        "g4s1-transform-10",
        "right-two-down-three",
        "point-direction-reversed",
        "A점과 B점의 출발·도착 순서를 바꾸어 두 방향을 모두 반대로 설명했습니다.",
        "열은 5→3, 행은 4→1인데 이를 거꾸로 읽어 오른쪽 2칸, 아래쪽 3칸이라고 판단했습니다."
      ],
      [
        "g4s1-transform-10",
        "left-three-up-four",
        "start-cell-counted",
        "가로와 세로에서 출발 위치를 각각 포함해 두 칸 수를 모두 하나 크게 셌습니다.",
        "열 차 |3−5|=2와 행 차 |1−4|=3 대신 왼쪽 3칸, 위쪽 4칸이라고 판단했습니다."
      ]
    ]
  ),
  stage(
    "patterns-relations.number-rule",
    "patterns-relations.number-rule",
    "두 오답은 모두 이웃한 수 사이의 같은 곱셈 관계를 찾지 않고, 눈에 띄는 수를 덧셈이나 곱으로 잘못 사용하는지 관찰합니다.",
    {
      "rule-as-addition": "곱셈 규칙 대신 직전에 늘어난 수만큼 더함",
      "first-term-as-factor": "반복되는 배수 대신 첫째 수를 곱하는 수로 사용함"
    },
    [
      [
        "g4s1-pattern-01",
        "thirty",
        "rule-as-addition",
        "6에서 18로 늘어난 12를 다음에도 한 번 더 더했습니다.",
        "18×3을 하지 않고 직전 증가량 18−6=12를 써서 18+12=30으로 판단했습니다."
      ],
      [
        "g4s1-pattern-01",
        "thirty-six",
        "first-term-as-factor",
        "매번 3을 곱하는 규칙 대신 배열의 첫째 수 2를 곱했습니다.",
        "18×3=54 대신 첫째 수를 곱하는 수로 써서 18×2=36으로 판단했습니다."
      ],
      [
        "g4s1-pattern-02",
        "one-hundred-eighty",
        "rule-as-addition",
        "36에서 108로 늘어난 72를 다음에도 한 번 더 더했습니다.",
        "108×3을 하지 않고 직전 증가량 108−36=72를 써서 108+72=180으로 판단했습니다."
      ],
      [
        "g4s1-pattern-02",
        "four-hundred-thirty-two",
        "first-term-as-factor",
        "매번 3을 곱하는 규칙 대신 배열의 첫째 수 4를 곱했습니다.",
        "108×3=324 대신 첫째 수를 곱하는 수로 써서 108×4=432로 판단했습니다."
      ]
    ]
  ),
  stage(
    "patterns-relations.figure-rule",
    "patterns-relations.figure-rule",
    "두 오답은 모두 모양의 순서, 현재 도형 수, 한 단계마다 늘어나는 도형 수를 서로 구분하는지 관찰합니다.",
    {
      "increment-only": "다음 전체 개수 대신 한 단계마다 늘어나는 개수만 답함",
      "order-as-count": "모양의 순서를 도형의 개수로 그대로 답함"
    },
    [
      [
        "g4s1-pattern-03",
        "two",
        "increment-only",
        "정사각형이 2개씩 늘어나는 것을 찾았지만 다음 모양의 전체 개수 대신 2만 답했습니다.",
        "7+2=9를 계산하지 않고 이웃한 개수의 차 5−3=2만 답으로 판단했습니다."
      ],
      [
        "g4s1-pattern-03",
        "four",
        "order-as-count",
        "네 번째 모양이라는 순서를 정사각형의 개수로 보았습니다.",
        "모양의 순서 4와 그 모양에 놓일 정사각형 수 9를 구분하지 못했습니다."
      ],
      [
        "g4s1-pattern-04",
        "three",
        "increment-only",
        "삼각형이 3개씩 늘어나는 것을 찾았지만 다음 모양의 전체 개수 대신 3만 답했습니다.",
        "11+3=14를 계산하지 않고 이웃한 개수의 차 5−2=3만 답으로 판단했습니다."
      ],
      [
        "g4s1-pattern-04",
        "five",
        "order-as-count",
        "다섯 번째 모양이라는 순서를 삼각형의 개수로 보았습니다.",
        "모양의 순서 5와 그 모양에 놓일 삼각형 수 14를 구분하지 못했습니다."
      ]
    ]
  ),
  stage(
    "patterns-relations.rule-as-expression",
    "patterns-relations.rule-as-expression",
    "두 오답은 모두 표의 첫째 줄에만 맞는 식을 고르거나 두 양의 역할을 바꾸어 쓰는지 관찰합니다.",
    {
      "additive-fits-first-row": "표의 첫째 줄에만 맞는 덧셈식을 전체 규칙으로 정함",
      "two-quantities-swapped": "식에서 두 양의 역할과 계산 방향을 바꾸어 씀"
    },
    [
      [
        "g4s1-pattern-05",
        "count-equals-order-plus-three",
        "additive-fits-first-row",
        "1+3=4인 첫째 줄만 확인하고 나머지 줄에는 맞지 않는 식을 골랐습니다.",
        "둘째 줄에서 2+3=5가 8과 다르고 셋째 줄에서도 3+3=6이 12와 다름을 확인하지 않았습니다."
      ],
      [
        "g4s1-pattern-05",
        "order-equals-count-times-four",
        "two-quantities-swapped",
        "순서에 4를 곱해 개수를 구하는 방향을 반대로 나타냈습니다.",
        "1×4=4인 관계를 개수 4에 4를 곱하면 순서 1이 된다는 식으로 바꾸어 썼습니다."
      ],
      [
        "g4s1-pattern-06",
        "ddakji-equals-paper-minus-six",
        "additive-fits-first-row",
        "8−6=2인 첫째 줄만 확인하고 다른 줄에는 맞지 않는 식을 골랐습니다.",
        "둘째 줄에서 16−6=10이 4와 다르고 셋째 줄에서도 24−6=18이 6과 다름을 확인하지 않았습니다."
      ],
      [
        "g4s1-pattern-06",
        "paper-equals-ddakji-divide-four",
        "two-quantities-swapped",
        "색종이 수를 4로 나누어 딱지 수를 구하는 방향을 반대로 나타냈습니다.",
        "8÷4=2인 관계에서 색종이 수와 딱지 수의 자리를 바꾸어 썼습니다."
      ]
    ]
  ),
  stage(
    "patterns-relations.calc-array-rule",
    "patterns-relations.calc-array-rule",
    "두 오답은 모두 계산식에서 바뀌는 수의 변화와 계산 결과의 변화를 같은 것으로 보거나, 결과가 늘 일정한 수만큼 변한다고 보는지 관찰합니다.",
    {
      "change-copied-from-operand": "계산에 쓰는 수의 변화량을 결과에 그대로 적용함",
      "change-fixed-as-ten": "계산 결과가 언제나 10씩 변한다고 생각함"
    },
    [
      [
        "g4s1-pattern-07",
        "one-hundred-forty-four",
        "change-copied-from-operand",
        "곱하는 수가 13에서 14로 1 커졌으므로 결과도 1만 커진다고 보았습니다.",
        "11×14를 계산하지 않고 11×13의 결과 143에 변화량 1을 더해 144로 판단했습니다."
      ],
      [
        "g4s1-pattern-07",
        "one-hundred-fifty-three",
        "change-fixed-as-ten",
        "곱셈 결과가 매번 10씩 커진다고 보았습니다.",
        "11을 한 번 더 더해야 하는데 143+10=153으로 판단했습니다."
      ],
      [
        "g4s1-pattern-08",
        "eighteen",
        "change-copied-from-operand",
        "나누는 수가 6에서 8로 2 커졌으므로 결과는 20에서 2 작아진다고 보았습니다.",
        "120÷8을 계산하지 않고 20−2=18로 판단했습니다."
      ],
      [
        "g4s1-pattern-08",
        "ten",
        "change-fixed-as-ten",
        "앞의 두 결과 30과 20만 보고 다음 결과도 10 작아진다고 보았습니다.",
        "120÷8=15를 계산하지 않고 20−10=10으로 판단했습니다."
      ]
    ]
  ),
  stage(
    "patterns-relations.equal-sign",
    "patterns-relations.equal-sign",
    "두 오답은 모두 등호를 양쪽의 값이 같다는 관계로 보지 않고 왼쪽 계산의 결과 표시로만 보거나, 보정할 수의 방향을 반대로 적용하는지 관찰합니다.",
    {
      "equals-as-result": "등호 오른쪽 첫 칸에 왼쪽 계산 결과를 그대로 씀",
      "compensation-reversed": "양쪽 합을 같게 만드는 차이를 반대 방향으로 적용함"
    },
    [
      [
        "g4s1-pattern-09",
        "sixty-three",
        "equals-as-result",
        "등호 뒤의 39를 포함한 식을 보지 않고 왼쪽 합 63을 그대로 답했습니다.",
        "45+18=63을 구한 뒤 39+□도 63이 되어야 한다는 관계를 확인하지 않았습니다."
      ],
      [
        "g4s1-pattern-09",
        "twelve",
        "compensation-reversed",
        "45보다 39가 6 작으므로 18에서도 6을 빼야 한다고 생각했습니다.",
        "39가 45보다 6 작아 다른 수에는 6을 더해야 하는데 18−6=12로 판단했습니다."
      ],
      [
        "g4s1-pattern-10",
        "seventy-one",
        "equals-as-result",
        "등호 뒤의 26을 포함한 식을 보지 않고 왼쪽 합 71을 그대로 답했습니다.",
        "53+18=71을 구한 뒤 □+26도 71이 되어야 한다는 관계를 확인하지 않았습니다."
      ],
      [
        "g4s1-pattern-10",
        "sixty-one",
        "compensation-reversed",
        "26이 18보다 8 크므로 53에도 8을 더해야 한다고 생각했습니다.",
        "한쪽 수가 8 커졌으므로 다른 수에서는 8을 빼야 하는데 53+8=61로 판단했습니다."
      ]
    ]
  ),
  stage(
    "bar-graph.scale",
    "bar-graph.scale",
    "두 오답은 모두 눈금 칸 수, 마지막 눈금값, 눈금 한 칸의 값을 서로 구분하는지 관찰합니다.",
    {
      "interval-count-as-unit": "눈금의 전체 칸 수를 한 칸이 나타내는 값으로 답함",
      "endpoint-as-unit": "마지막 눈금값을 한 칸이 나타내는 값으로 답함"
    },
    [
      [
        "g4s1-bar-01",
        "five-people",
        "interval-count-as-unit",
        "0부터 50까지 나뉜 5칸을 세고, 칸 수 5를 한 칸의 값으로 답했습니다.",
        "50÷5=10을 계산하지 않고 전체 눈금의 칸 수 5를 그대로 답으로 판단했습니다."
      ],
      [
        "g4s1-bar-01",
        "fifty-people",
        "endpoint-as-unit",
        "마지막 눈금에 적힌 50을 눈금 한 칸의 값으로 보았습니다.",
        "50은 5칸 전체가 나타내는 값인데 이를 한 칸의 값으로 판단했습니다."
      ],
      [
        "g4s1-bar-02",
        "six-books",
        "interval-count-as-unit",
        "0부터 30까지 나뉜 6칸을 세고, 칸 수 6을 한 칸의 값으로 답했습니다.",
        "30÷6=5를 계산하지 않고 전체 눈금의 칸 수 6을 그대로 답으로 판단했습니다."
      ],
      [
        "g4s1-bar-02",
        "thirty-books",
        "endpoint-as-unit",
        "마지막 눈금에 적힌 30을 눈금 한 칸의 값으로 보았습니다.",
        "30은 6칸 전체가 나타내는 값인데 이를 한 칸의 값으로 판단했습니다."
      ]
    ]
  ),
  stage(
    "bar-graph.read-value",
    "bar-graph.read-value",
    "두 오답은 모두 막대의 칸 수를 실제 값으로 바꾸거나 막대 끝의 위치를 정확히 읽는지 관찰합니다.",
    {
      "ticks-as-value": "막대의 칸 수를 눈금값으로 바꾸지 않고 그대로 답함",
      "adjacent-grid-read": "막대 끝과 이웃한 다른 눈금 위치를 읽음"
    },
    [
      [
        "g4s1-bar-03",
        "three-people",
        "ticks-as-value",
        "사과 막대가 3칸인 것을 세고 한 칸의 값 10을 적용하지 않았습니다.",
        "3×10=30을 계산하지 않고 막대의 칸 수 3을 그대로 답으로 판단했습니다."
      ],
      [
        "g4s1-bar-03",
        "twenty-people",
        "adjacent-grid-read",
        "사과 막대가 닿은 셋째 칸보다 한 칸 아래인 둘째 칸을 읽었습니다.",
        "3×10=30 대신 이웃한 눈금 2×10=20을 막대의 값으로 판단했습니다."
      ],
      [
        "g4s1-bar-04",
        "seven-books",
        "ticks-as-value",
        "3월 막대가 7칸인 것을 세고 한 칸의 값 5를 적용하지 않았습니다.",
        "7×5=35를 계산하지 않고 막대의 칸 수 7을 그대로 답으로 판단했습니다."
      ],
      [
        "g4s1-bar-04",
        "forty-books",
        "adjacent-grid-read",
        "3월 막대가 닿은 일곱째 칸보다 한 칸 뒤인 마지막 눈금을 읽었습니다.",
        "7×5=35 대신 이웃한 눈금 8×5=40을 막대의 값으로 판단했습니다."
      ]
    ]
  ),
  stage(
    "bar-graph.compare",
    "bar-graph.compare",
    "두 오답은 모두 막대 칸 수를 실제 값으로 바꾼 뒤 차를 구하는지, 두 값을 더하지 않는지 관찰합니다.",
    {
      "tick-difference-only": "두 막대의 칸 수 차를 실제 값으로 바꾸지 않고 답함",
      "values-added": "두 막대의 값의 차 대신 합을 구함"
    },
    [
      [
        "g4s1-bar-05",
        "two-more",
        "tick-difference-only",
        "축구 4칸과 야구 2칸의 차 2칸을 실제 학생 수로 바꾸지 않았습니다.",
        "(4−2)×10=20을 계산하지 않고 칸 수의 차 2를 답으로 판단했습니다."
      ],
      [
        "g4s1-bar-05",
        "sixty-total",
        "values-added",
        "축구 40명과 야구 20명의 차 대신 두 값을 더했습니다.",
        "40−20=20 대신 40+20=60을 계산해 답으로 판단했습니다."
      ],
      [
        "g4s1-bar-06",
        "seven-items",
        "tick-difference-only",
        "가장 긴 막대 12칸과 가장 짧은 막대 5칸의 차 7칸을 실제 개수로 바꾸지 않았습니다.",
        "(12−5)×5=35를 계산하지 않고 칸 수의 차 7을 답으로 판단했습니다."
      ],
      [
        "g4s1-bar-06",
        "eighty-five-items",
        "values-added",
        "연필 60개와 자 25개의 차 대신 두 값을 더했습니다.",
        "60−25=35 대신 60+25=85를 계산해 답으로 판단했습니다."
      ]
    ]
  ),
  stage(
    "bar-graph.table-match",
    "bar-graph.table-match",
    "두 오답은 모두 표의 수를 눈금 한 칸의 값으로 나누어 막대의 칸 수로 바꾸고 0에서 시작하는지 관찰합니다.",
    {
      "table-count-as-ticks": "표의 수를 막대의 칸 수로 그대로 사용함",
      "one-extra-tick": "모든 막대를 0이 아닌 첫째 칸에서 시작해 한 칸씩 길게 그림"
    },
    [
      [
        "g4s1-bar-07",
        "candidate-na",
        "table-count-as-ticks",
        "표의 6, 9, 3, 12를 한 칸의 값 3으로 나누지 않고 각각 막대의 칸 수로 사용했습니다.",
        "6÷3=2, 9÷3=3, 3÷3=1, 12÷3=4 대신 6, 9, 3, 12칸으로 판단했습니다."
      ],
      [
        "g4s1-bar-07",
        "candidate-da",
        "one-extra-tick",
        "표에 맞는 2, 3, 1, 4칸보다 모든 막대를 한 칸씩 길게 골랐습니다.",
        "막대를 0에서 시작하지 않고 첫째 칸부터 세어 3, 4, 2, 5칸으로 판단했습니다."
      ],
      [
        "g4s1-bar-08",
        "candidate-ga",
        "table-count-as-ticks",
        "표의 8, 4, 10, 6을 한 칸의 값 2로 나누지 않고 각각 막대의 칸 수로 사용했습니다.",
        "8÷2=4, 4÷2=2, 10÷2=5, 6÷2=3 대신 8, 4, 10, 6칸으로 판단했습니다."
      ],
      [
        "g4s1-bar-08",
        "candidate-da",
        "one-extra-tick",
        "표에 맞는 4, 2, 5, 3칸보다 모든 막대를 한 칸씩 길게 골랐습니다.",
        "막대를 0에서 시작하지 않고 첫째 칸부터 세어 5, 3, 6, 4칸으로 판단했습니다."
      ]
    ]
  ),
  stage(
    "bar-graph.inquiry",
    "bar-graph.inquiry",
    "두 오답은 모두 탐구 질문에 맞는 항목을 찾고 가장 긴 막대를 자료의 근거로 사용하는지 관찰합니다.",
    {
      "second-largest-as-largest": "두 번째로 긴 막대를 가장 긴 막대로 판단함",
      "graph-evidence-dismissed": "막대 길이의 차이를 결론의 근거로 사용하지 않음"
    },
    [
      [
        "g4s1-bar-09",
        "jump-rope-most",
        "second-largest-as-largest",
        "5칸인 축구 막대보다 한 칸 짧은 4칸 줄넘기 막대를 가장 길다고 보았습니다.",
        "축구 20명과 줄넘기 16명을 비교하지 않고 두 번째로 긴 줄넘기 막대를 골랐습니다."
      ],
      [
        "g4s1-bar-09",
        "all-similar",
        "graph-evidence-dismissed",
        "막대 길이가 5, 3, 4, 2칸으로 다른데도 학생 수가 모두 비슷하다고 보았습니다.",
        "가장 긴 5칸과 가장 짧은 2칸의 차 3칸을 결론의 근거로 사용하지 않았습니다."
      ],
      [
        "g4s1-bar-10",
        "colored-pencils-most",
        "second-largest-as-largest",
        "7칸인 공책 막대보다 짧은 4칸 색연필 막대를 가장 길다고 보았습니다.",
        "공책 35명과 색연필 20명을 비교하지 않고 두 번째로 긴 색연필 막대를 골랐습니다."
      ],
      [
        "g4s1-bar-10",
        "cannot-tell",
        "graph-evidence-dismissed",
        "막대그래프에 준비물별 학생 수가 나타나 있는데도 결론을 낼 수 없다고 보았습니다.",
        "가장 긴 공책 7칸이 가장 많은 35명을 나타낸다는 자료를 근거로 사용하지 않았습니다."
      ]
    ]
  ),
  stage(
    "mul-div.partial-product-place",
    "mul-div.partial-product-place",
    "두 오답은 두 자리 수의 십의 자리 숫자를 몇십으로 해석하고 필요한 자리 숫자로 곱하는지 서로 다른 방향에서 확인합니다.",
    {
      "tens-as-ones": "십의 자리 숫자를 일의 자리 값으로 계산함",
      "other-digit-multiplied": "필요한 자리 대신 다른 자리 숫자로 곱함"
    },
    [
      [
        "g4s1-muldiv-01",
        "426",
        "tens-as-ones",
        "곱하는 수 24의 2가 20을 나타내는 점을 빼고 213에 2만 곱했습니다.",
        "213×20=4,260 대신 213×2=426으로 계산했습니다."
      ],
      [
        "g4s1-muldiv-01",
        "852",
        "other-digit-multiplied",
        "십의 자리 2가 아니라 일의 자리 4를 골라 213과 곱했습니다.",
        "213×20을 구해야 하는데 213×4=852로 계산했습니다."
      ],
      [
        "g4s1-muldiv-02",
        "296-books",
        "tens-as-ones",
        "상자 20개를 상자 2개로 줄여 공책 수를 구했습니다.",
        "148×20=2,960 대신 148×2=296으로 계산했습니다."
      ],
      [
        "g4s1-muldiv-02",
        "888-books",
        "other-digit-multiplied",
        "상자 20개가 아니라 전체 26개의 일의 자리 6으로 곱했습니다.",
        "148×20을 구해야 하는데 148×6=888로 계산했습니다."
      ]
    ]
  ),
  stage(
    "mul-div.product-combine",
    "mul-div.product-combine",
    "두 오답은 몇십으로 곱한 값의 자리를 보존하고 두 번 곱한 값을 모두 합하는지 각각 확인합니다.",
    {
      "tens-part-shifted-right": "몇십으로 곱한 값을 한 자리 작게 놓아 더함",
      "one-part-only": "두 번 곱한 값 중 하나만 전체 답으로 사용함"
    },
    [
      [
        "g4s1-muldiv-03",
        "1184",
        "tens-part-shifted-right",
        "148×20의 값 2,960을 296으로 한 자리 작게 바꾸어 더했습니다.",
        "888+2,960=3,848 대신 888+296=1,184로 계산했습니다."
      ],
      [
        "g4s1-muldiv-03",
        "2960",
        "one-part-only",
        "148×20의 값만 남기고 148×6의 값 888을 합하지 않았습니다.",
        "2,960+888을 계산하지 않고 한 번 곱한 값 2,960만 답으로 사용했습니다."
      ],
      [
        "g4s1-muldiv-04",
        "1175-chairs",
        "tens-part-shifted-right",
        "235×30을 235×3으로 줄여 235×2의 값과 더했습니다.",
        "235×30=7,050과 235×2=470 대신 705+470=1,175로 계산했습니다."
      ],
      [
        "g4s1-muldiv-04",
        "7050-chairs",
        "one-part-only",
        "32줄 가운데 30줄의 의자만 세고 나머지 2줄을 빠뜨렸습니다.",
        "7,050+470=7,520을 계산하지 않고 235×30=7,050만 답으로 사용했습니다."
      ]
    ]
  ),
  stage(
    "mul-div.quotient-place",
    "mul-div.quotient-place",
    "두 오답은 나누어지는 수의 앞부분과 나누는 수를 비교하여 몫의 자리 수를 정하는 과정을 반대 방향에서 확인합니다.",
    {
      "aligned-to-dividend": "나누어지는 수의 첫 자리와 몫의 자리를 그대로 맞춤",
      "quotient-treated-as-one-digit": "몫을 계산 전에 한 자리 수로 단정함"
    },
    [
      [
        "g4s1-muldiv-05",
        "hundreds-place",
        "aligned-to-dividend",
        "384의 첫 숫자가 백의 자리에 있다는 이유만으로 몫의 첫 숫자도 백의 자리에 놓았습니다.",
        "38÷16에서 몫의 첫 숫자 2를 십의 자리에 써야 하는데 384의 3과 자리를 맞췄습니다."
      ],
      [
        "g4s1-muldiv-05",
        "ones-place",
        "quotient-treated-as-one-digit",
        "384가 16보다 여러 번 큰지 비교하지 않고 몫을 한 자리 수로 보았습니다.",
        "16×20=320이 384보다 작다는 비교를 생략하고 몫의 첫 숫자를 일의 자리에 놓았습니다."
      ],
      [
        "g4s1-muldiv-06",
        "three-digit",
        "aligned-to-dividend",
        "나누어지는 수 552가 세 자리 수라는 이유로 상자 수도 세 자리 수라고 보았습니다.",
        "24×20=480과 24×30=720을 비교하지 않고 552의 자리 수를 그대로 적용했습니다."
      ],
      [
        "g4s1-muldiv-06",
        "one-digit",
        "quotient-treated-as-one-digit",
        "24를 한 번씩 빼는 횟수가 10번을 넘는지 확인하지 않고 한 자리 몫으로 보았습니다.",
        "24×9=216이 552보다 훨씬 작다는 사실을 확인하지 않고 한 자리 수라고 판단했습니다."
      ]
    ]
  ),
  stage(
    "mul-div.quotient-adjust",
    "mul-div.quotient-adjust",
    "두 오답은 어림한 몫으로 곱한 값과 남은 수가 나눗셈 조건에 맞는지 확인하고 고치는 방향을 정하는지 관찰합니다.",
    {
      "check-condition-ignored": "곱한 값이나 남은 수의 조건을 확인하지 않음",
      "adjusted-in-wrong-direction": "확인 결과와 반대 방향으로 몫을 고침"
    },
    [
      [
        "g4s1-muldiv-07",
        "keep-13",
        "check-condition-ignored",
        "남은 수 18이 나누는 수 18보다 작아야 한다는 조건을 확인하지 않았습니다.",
        "252−234=18이므로 18을 한 번 더 뺄 수 있는데도 몫 13을 그대로 두었습니다."
      ],
      [
        "g4s1-muldiv-07",
        "lower-to-12",
        "adjusted-in-wrong-direction",
        "남은 수가 커서 몫을 늘려야 하는 상황에서 오히려 몫을 줄였습니다.",
        "18×14=252로 몫을 14로 높여야 하는데 18×12=216이 되는 쪽으로 고쳤습니다."
      ],
      [
        "g4s1-muldiv-08",
        "keep-16",
        "check-condition-ignored",
        "27×16의 값 432가 나누어지는 수 425보다 큰데도 몫을 그대로 두었습니다.",
        "432−425=7만큼 넘는다는 비교를 확인하지 않고 몫 16을 유지했습니다."
      ],
      [
        "g4s1-muldiv-08",
        "raise-to-17",
        "adjusted-in-wrong-direction",
        "곱한 값이 너무 커서 몫을 줄여야 하는 상황에서 몫을 더 늘렸습니다.",
        "27×15=405로 낮춰야 하는데 27×17=459가 되는 반대 방향으로 고쳤습니다."
      ]
    ]
  ),
  stage(
    "mul-div.multiplication-check",
    "mul-div.multiplication-check",
    "두 오답은 나누는 수와 몫을 곱한 뒤 남은 수를 더하는 확인 관계에서 빠뜨림과 역할 교환을 나누어 관찰합니다.",
    {
      "remainder-dropped": "나눗셈을 확인할 때 남은 수를 더하지 않음",
      "quotient-remainder-swapped": "몫과 남은 수의 역할을 서로 바꿈"
    },
    [
      [
        "g4s1-muldiv-09",
        "drop-remainder-295",
        "remainder-dropped",
        "나누는 수 23과 몫 12만 곱하고 남은 수 19를 더하지 않았습니다.",
        "23×12=276에 19를 더해야 295가 되는데 276=295로 놓았습니다."
      ],
      [
        "g4s1-muldiv-09",
        "swap-295",
        "quotient-remainder-swapped",
        "몫 12와 남은 수 19의 자리를 바꾸어 23에 19를 곱했습니다.",
        "23×12+19=295 대신 23×19+12=449를 왼쪽 식으로 사용했습니다."
      ],
      [
        "g4s1-muldiv-10",
        "drop-remainder-500",
        "remainder-dropped",
        "32장씩 15명에게 준 480장만 계산하고 남은 20장을 합하지 않았습니다.",
        "32×15=480에 20을 더해야 500이 되는데 남은 수를 식에서 빠뜨렸습니다."
      ],
      [
        "g4s1-muldiv-10",
        "swap-500",
        "quotient-remainder-swapped",
        "사람 수 15와 남은 장수 20을 서로 바꾸어 곱셈식에 넣었습니다.",
        "32×15+20=500 대신 32×20+15=655로 역할을 바꾸어 계산했습니다."
      ]
    ]
  ),
  stage(
    "mul-div.estimate",
    "mul-div.estimate",
    "두 오답은 계산하기 쉬운 가까운 수를 고를 때 한 수를 지나치게 낮추는 경우와 자릿값을 키우는 경우를 분리해 확인합니다.",
    {
      "rounded-down-too-far": "가까운 수보다 지나치게 작은 수로 바꿈",
      "place-inflated": "어림할 수의 자릿값을 한 자리 크게 바꿈"
    },
    [
      [
        "g4s1-muldiv-11",
        "about-4000",
        "rounded-down-too-far",
        "19를 가까운 20이 아니라 10으로 지나치게 낮춰 곱의 크기를 줄였습니다.",
        "412×19를 400×20=8,000으로 보지 않고 400×10=4,000으로 어림했습니다."
      ],
      [
        "g4s1-muldiv-11",
        "about-80000",
        "place-inflated",
        "412를 가까운 400이 아니라 한 자리 큰 4,000으로 바꾸었습니다.",
        "400×20=8,000 대신 4,000×20=80,000으로 자릿값을 키워 어림했습니다."
      ],
      [
        "g4s1-muldiv-12",
        "about-30-bags",
        "rounded-down-too-far",
        "한 봉지에 담는 29개를 가까운 30이 아니라 20으로 지나치게 낮췄습니다.",
        "612÷29를 600÷30=20으로 보지 않고 600÷20=30으로 어림했습니다."
      ],
      [
        "g4s1-muldiv-12",
        "about-200-bags",
        "place-inflated",
        "귤 612개를 가까운 600이 아니라 한 자리 큰 6,000으로 바꾸었습니다.",
        "600÷30=20 대신 6,000÷30=200으로 자릿값을 키워 어림했습니다."
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
