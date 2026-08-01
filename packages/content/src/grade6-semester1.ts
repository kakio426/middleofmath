import { buildPairedStages, type PairStageInput } from "./paired-stage-authoring";
import { buildUpperGradeSemester } from "./upper-grade-content-builder";

const SOURCE = "2022 개정 수학과 교육과정 및 2026 경기도교육청 6학년 단원 배치표";

const stageInputs: PairStageInput[] = [
  {
    id: "fd.fraction-by-natural", unitId: "fraction-division", title: "분수를 자연수로 나누기", shortTitle: "분수를 자연수로 나눔", anchorIds: ["[6수01-10]"],
    mistakes: [
      { id: "fd.fraction-by-natural.multiply", title: "나눗셈을 곱셈으로 계산함", derivation: "나누는 자연수를 분모에 곱하지 않고 분자에 곱한다.", rationale: "분수를 자연수로 나눌 때에는 분모에 그 자연수를 곱해 생각할 수 있습니다." },
      { id: "fd.fraction-by-natural.divide-both", title: "분자와 분모를 모두 나눔", derivation: "분자와 분모를 같은 자연수로 나누어 값이 그대로라고 생각한다.", rationale: "약분과 나눗셈을 구별하고 전체 양을 자연수만큼 똑같이 나누어야 합니다." }
    ],
    cases: [
      { context: "계산 결과를 기약분수로 나타내세요.", prompt: "3/5 ÷ 2는 얼마인가요?", correct: "3/10", wrong: [{ label: "6/5", misconceptionId: "fd.fraction-by-natural.multiply" }, { label: "3/5", misconceptionId: "fd.fraction-by-natural.divide-both" }] },
      { context: "물 5/6 L를 두 병에 똑같이 나눕니다.", prompt: "한 병에 몇 L씩 담나요?", correct: "5/12 L", wrong: [{ label: "5/3 L", misconceptionId: "fd.fraction-by-natural.multiply" }, { label: "5/6 L", misconceptionId: "fd.fraction-by-natural.divide-both" }] }
    ]
  },
  {
    id: "fd.mixed-by-natural", unitId: "fraction-division", title: "대분수를 자연수로 나누기", shortTitle: "대분수를 자연수로 나눔", anchorIds: ["[6수01-10]"], prerequisiteStageIds: ["fd.fraction-by-natural"],
    mistakes: [
      { id: "fd.mixed-by-natural.keep-whole", title: "자연수 부분은 그대로 두고 분수 부분만 나눔", derivation: "대분수의 자연수 부분은 그대로 두고 분수 부분만 자연수로 나눈다.", rationale: "대분수 전체를 가분수로 고친 뒤 한 수 전체를 나누어야 합니다." },
      { id: "fd.mixed-by-natural.bad-improper", title: "가분수로 잘못 바꿈", derivation: "자연수와 분자를 더해 가분수의 분자를 만든다.", rationale: "자연수에 분모를 곱한 뒤 분자를 더해 가분수로 나타냅니다." }
    ],
    cases: [
      { context: "대분수를 가분수로 고쳐 계산합니다.", prompt: "1과 1/2 ÷ 2는 얼마인가요?", correct: "3/4", wrong: [{ label: "1과 1/4", misconceptionId: "fd.mixed-by-natural.keep-whole" }, { label: "1/2", misconceptionId: "fd.mixed-by-natural.bad-improper", derivation: "1과 1/2를 (1+1)/2=2/2로 잘못 바꾼 뒤 2로 나누어 1/2를 구한다." }] },
      { context: "2와 2/3 m인 끈을 2명에게 똑같이 나눕니다.", prompt: "한 명이 받는 끈은 몇 m인가요?", correct: "1과 1/3 m", wrong: [{ label: "2와 1/3 m", misconceptionId: "fd.mixed-by-natural.keep-whole" }, { label: "2/3 m", misconceptionId: "fd.mixed-by-natural.bad-improper", derivation: "2와 2/3을 (2+2)/3=4/3으로 잘못 바꾼 뒤 2로 나누어 2/3을 구한다." }] }
    ]
  },
  {
    id: "fd.natural-by-fraction", unitId: "fraction-division", title: "자연수를 분수로 나누기", shortTitle: "자연수를 분수로 나눔", anchorIds: ["[6수01-11]"],
    mistakes: [
      { id: "fd.natural-by-fraction.keep-divisor", title: "나누는 분수를 그대로 곱함", derivation: "분수의 나눗셈에서 역수를 쓰지 않고 그대로 곱한다.", rationale: "나누는 분수의 분자와 분모를 바꾸어 곱합니다." },
      { id: "fd.natural-by-fraction.flip-dividend-too", title: "나누어지는 자연수까지 함께 뒤집음", derivation: "나누는 분수를 역수로 바꾸면서 나누어지는 자연수까지 역수로 바꾼다.", rationale: "나누는 분수만 역수로 바꾸고 나누어지는 자연수는 그대로 둡니다." }
    ],
    cases: [
      { context: "한 칸이 2/3만큼일 때 4 안에 몇 칸이 들어가는지 생각합니다.", prompt: "4 ÷ 2/3은 얼마인가요?", correct: "6", wrong: [{ label: "2와 2/3", misconceptionId: "fd.natural-by-fraction.keep-divisor" }, { label: "3/8", misconceptionId: "fd.natural-by-fraction.flip-dividend-too" }] },
      { context: "주스 3 L를 한 병에 3/4 L씩 담습니다.", prompt: "몇 병 분량인가요?", correct: "4병", wrong: [{ label: "2와 1/4병", misconceptionId: "fd.natural-by-fraction.keep-divisor", derivation: "나누는 3/4을 뒤집지 않고 3×3/4=2와 1/4로 계산한다." }, { label: "4/9병", misconceptionId: "fd.natural-by-fraction.flip-dividend-too", derivation: "나누어지는 3까지 1/3로 뒤집고 나누는 수의 역수 4/3을 곱해 4/9로 계산한다." }] }
    ]
  },
  {
    id: "fd.fraction-by-fraction", unitId: "fraction-division", title: "분수를 분수로 나누기", shortTitle: "분수를 분수로 나눔", anchorIds: ["[6수01-11]"], prerequisiteStageIds: ["fd.natural-by-fraction"],
    mistakes: [
      { id: "fd.fraction-by-fraction.no-reciprocal", title: "나누는 분수를 뒤집지 않음", derivation: "두 분수를 그대로 곱하여 몫을 구한다.", rationale: "나누는 분수만 역수로 바꾼 뒤 곱합니다." },
      { id: "fd.fraction-by-fraction.flip-first", title: "첫 번째 분수만 뒤집고 그대로 곱함", derivation: "나누어지는 첫 번째 분수만 뒤집고 두 번째 분수는 그대로 곱한다.", rationale: "첫 번째 분수는 그대로 두고 두 번째 분수만 역수로 바꿉니다." }
    ],
    cases: [
      { context: "계산한 결과를 고르세요.", prompt: "3/5 ÷ 2/7은 얼마인가요?", correct: "2와 1/10", wrong: [{ label: "6/35", misconceptionId: "fd.fraction-by-fraction.no-reciprocal" }, { label: "10/21", misconceptionId: "fd.fraction-by-fraction.flip-first" }] },
      { context: "색 테이프 5/6 m를 한 조각에 1/4 m씩 자릅니다.", prompt: "몇 조각 분량인가요?", correct: "3과 1/3조각", wrong: [{ label: "5/24조각", misconceptionId: "fd.fraction-by-fraction.no-reciprocal" }, { label: "3/10조각", misconceptionId: "fd.fraction-by-fraction.flip-first" }] }
    ]
  },
  {
    id: "fd.application", unitId: "fraction-division", title: "분수 나눗셈을 상황에 적용하기", shortTitle: "분수 나눗셈을 적용함", anchorIds: ["[6수01-11]"], prerequisiteStageIds: ["fd.fraction-by-fraction"],
    mistakes: [
      { id: "fd.application.reverse-order", title: "나누는 순서를 바꿈", derivation: "한 묶음의 양을 전체 양으로 나누어 식의 순서를 거꾸로 쓴다.", rationale: "몇 묶음인지 구할 때에는 전체 양을 한 묶음의 양으로 나눕니다." },
      { id: "fd.application.choose-multiply", title: "묶음 수 상황에서 곱함", derivation: "전체 안에 몇 번 들어가는지 묻는데 두 양을 곱한다.", rationale: "같은 크기의 양이 몇 번 들어가는지 묻는 상황은 나눗셈입니다." }
    ],
    cases: [
      { context: "밀가루 2와 1/4 kg을 한 봉지에 3/8 kg씩 담습니다.", prompt: "몇 봉지 분량인가요?", correct: "6봉지", wrong: [{ label: "1/6봉지", misconceptionId: "fd.application.reverse-order" }, { label: "27/32봉지", misconceptionId: "fd.application.choose-multiply" }] },
      { context: "9/10 L의 음료를 한 컵에 3/20 L씩 나눕니다.", prompt: "몇 컵 분량인가요?", correct: "6컵", wrong: [{ label: "1/6컵", misconceptionId: "fd.application.reverse-order" }, { label: "27/200컵", misconceptionId: "fd.application.choose-multiply" }] }
    ]
  },

  {
    id: "solid.identify", unitId: "prisms-pyramids", title: "각기둥과 각뿔 구별하기", shortTitle: "각기둥과 각뿔을 구별함", anchorIds: ["[6수03-05]"],
    mistakes: [
      { id: "solid.identify.base-count", title: "각기둥과 각뿔의 밑면 수를 반대로 판단함", derivation: "각기둥의 두 밑면을 하나로, 각뿔의 한 밑면을 둘로 바꾸어 분류한다.", rationale: "평행하고 합동인 밑면이 두 개면 각기둥이고, 밑면이 하나이며 옆면이 한 꼭짓점으로 모이면 각뿔입니다." },
      { id: "solid.identify.base-shape", title: "밑면의 모양을 다른 다각형으로 판단함", derivation: "입체의 기둥·뿔 구조는 유지하지만 밑면의 다각형 이름을 바꾸어 부른다.", rationale: "각기둥과 각뿔의 이름은 밑면의 다각형 모양에 따라 정합니다." }
    ],
    cases: [
      { context: "서로 평행하고 합동인 삼각형 두 개가 밑면인 도형입니다.", prompt: "이 입체도형의 이름은 무엇인가요?", correct: "삼각기둥", wrong: [{ label: "삼각뿔", misconceptionId: "solid.identify.base-count" }, { label: "사각기둥", misconceptionId: "solid.identify.base-shape" }], visual: { kind: "solid-diagram", mode: "structure", shape: "triangular-prism" } },
      { context: "사각형 밑면의 네 꼭짓점에서 선분이 한 꼭짓점으로 모입니다.", prompt: "도형을 바르게 부른 것을 고르세요.", correct: "사각뿔", wrong: [{ label: "사각기둥", misconceptionId: "solid.identify.base-count" }, { label: "삼각뿔", misconceptionId: "solid.identify.base-shape" }], visual: { kind: "solid-diagram", mode: "structure", shape: "square-pyramid" } }
    ]
  },
  {
    id: "solid.bases", unitId: "prisms-pyramids", title: "각기둥과 각뿔의 밑면 찾기", shortTitle: "입체도형의 밑면을 찾음", anchorIds: ["[6수03-05]"], prerequisiteStageIds: ["solid.identify"],
    mistakes: [
      { id: "solid.bases.count-all-sides", title: "모든 옆면을 밑면으로 셈", derivation: "밑면의 조건을 확인하지 않고 입체도형의 옆면을 모두 밑면으로 센다.", rationale: "각기둥의 밑면은 서로 평행하고 합동인 두 면이고, 각뿔의 밑면은 한 면입니다." },
      { id: "solid.bases.swap-count", title: "각기둥과 각뿔의 밑면 수를 서로 바꿈", derivation: "각기둥은 밑면 하나, 각뿔은 밑면 두 개라고 반대로 센다.", rationale: "각기둥의 밑면은 두 개이고 각뿔의 밑면은 한 개입니다." }
    ],
    cases: [
      { context: "삼각기둥을 옆으로 눕혀 놓았습니다.", prompt: "밑면은 모두 몇 개인가요?", correct: "2개", wrong: [{ label: "3개", misconceptionId: "solid.bases.count-all-sides" }, { label: "1개", misconceptionId: "solid.bases.swap-count" }], visual: { kind: "solid-diagram", mode: "structure", shape: "triangular-prism" } },
      { context: "사각뿔에서 한 꼭짓점으로 모이지 않는 면을 살펴봅니다.", prompt: "밑면은 모두 몇 개인가요?", correct: "1개", wrong: [{ label: "4개", misconceptionId: "solid.bases.count-all-sides" }, { label: "2개", misconceptionId: "solid.bases.swap-count" }], visual: { kind: "solid-diagram", mode: "structure", shape: "square-pyramid" } }
    ]
  },
  {
    id: "solid.elements", unitId: "prisms-pyramids", title: "각기둥과 각뿔의 면·모서리·꼭짓점 세기", shortTitle: "입체도형의 구성 요소를 셈", anchorIds: ["[6수03-05]"], prerequisiteStageIds: ["solid.bases"],
    mistakes: [
      { id: "solid.elements.omit-one", title: "구성 요소 하나를 빠뜨림", derivation: "꼭짓점이나 면을 차례로 세는 과정에서 하나를 빠뜨린다.", rationale: "이미 센 곳을 표시하며 모든 꼭짓점이나 면을 빠짐없이 한 번씩 세어야 합니다." },
      { id: "solid.elements.confuse", title: "면·모서리·꼭짓점 수를 서로 바꿈", derivation: "묻는 구성 요소 대신 다른 구성 요소의 개수를 답한다.", rationale: "면은 평평한 부분, 모서리는 두 면이 만나는 선분, 꼭짓점은 모서리가 만나는 점입니다." }
    ],
    cases: [
      { context: "삼각기둥의 모든 꼭짓점을 셉니다.", prompt: "꼭짓점은 몇 개인가요?", correct: "6개", wrong: [{ label: "5개", misconceptionId: "solid.elements.omit-one" }, { label: "9개", misconceptionId: "solid.elements.confuse" }], visual: { kind: "solid-diagram", mode: "structure", shape: "triangular-prism" } },
      { context: "사각뿔의 평평한 부분을 빠짐없이 셉니다.", prompt: "면은 몇 개인가요?", correct: "5개", wrong: [{ label: "4개", misconceptionId: "solid.elements.omit-one" }, { label: "8개", misconceptionId: "solid.elements.confuse" }], visual: { kind: "solid-diagram", mode: "structure", shape: "square-pyramid" } }
    ]
  },
  {
    id: "solid.net", unitId: "prisms-pyramids", title: "전개도의 면 구성으로 입체도형 찾기", shortTitle: "전개도에서 입체도형을 찾음", anchorIds: ["[6수03-06]"], prerequisiteStageIds: ["solid.elements"],
    mistakes: [
      { id: "solid.net.swap-prism-pyramid", title: "밑면 모양은 유지하고 각기둥과 각뿔을 바꿈", derivation: "밑면의 다각형은 맞게 보지만 옆면 구조를 무시해 각기둥과 각뿔을 바꾸어 부른다.", rationale: "옆면이 직사각형으로 이어지면 각기둥이고, 삼각형 옆면이 한 꼭짓점으로 모이면 각뿔입니다." },
      { id: "solid.net.name-from-side-face", title: "밑면 대신 옆면 모양으로 이름 붙임", derivation: "입체도형의 이름을 밑면이 아니라 옆면의 다각형 모양으로 정한다.", rationale: "각기둥과 각뿔의 이름은 옆면이 아니라 밑면의 다각형 모양에 따라 정합니다." }
    ],
    cases: [
      { context: "삼각형 2개와 직사각형 3개로 된 전개도를 접습니다.", prompt: "만들 수 있는 입체도형은 무엇인가요?", correct: "삼각기둥", wrong: [{ label: "삼각뿔", misconceptionId: "solid.net.swap-prism-pyramid" }, { label: "사각기둥", misconceptionId: "solid.net.name-from-side-face" }], visual: { kind: "solid-diagram", mode: "net", shape: "triangular-prism" } },
      { context: "정사각형 1개 둘레에 삼각형 4개가 이어진 전개도입니다.", prompt: "접었을 때 만들어지는 도형을 고르세요.", correct: "사각뿔", wrong: [{ label: "사각기둥", misconceptionId: "solid.net.swap-prism-pyramid" }, { label: "삼각뿔", misconceptionId: "solid.net.name-from-side-face" }], visual: { kind: "solid-diagram", mode: "net", shape: "square-pyramid" } }
    ]
  },
  {
    id: "solid.side-faces", unitId: "prisms-pyramids", title: "밑면의 변 수와 옆면 수 관계 알기", shortTitle: "밑면과 옆면의 관계를 앎", anchorIds: ["[6수03-06]"], prerequisiteStageIds: ["solid.bases"],
    mistakes: [
      { id: "solid.side-faces.add-bases", title: "밑면까지 옆면 수에 더함", derivation: "밑면 두 개 또는 한 개를 옆면의 수에 포함한다.", rationale: "옆면 수는 밑면의 변 수와 같고 밑면 자체는 포함하지 않습니다." },
      { id: "solid.side-faces.omit-two", title: "옆면 두 개를 빠뜨림", derivation: "밑면의 변마다 이어지는 옆면을 세면서 두 면을 빠뜨린다.", rationale: "밑면의 모든 변마다 옆면 하나가 이어지므로 변 수만큼 옆면을 세어야 합니다." }
    ],
    cases: [
      { context: "오각형을 밑면으로 하는 각기둥을 생각합니다.", prompt: "옆면은 몇 개인가요?", correct: "5개", wrong: [{ label: "7개", misconceptionId: "solid.side-faces.add-bases" }, { label: "3개", misconceptionId: "solid.side-faces.omit-two" }] },
      { context: "육각형을 밑면으로 하는 각뿔을 위에서 살펴봅니다.", prompt: "삼각형 옆면은 몇 개인가요?", correct: "6개", wrong: [{ label: "7개", misconceptionId: "solid.side-faces.add-bases" }, { label: "4개", misconceptionId: "solid.side-faces.omit-two" }] }
    ]
  },

  {
    id: "dd.decimal-by-natural", unitId: "decimal-division", title: "소수를 자연수로 나누기", shortTitle: "소수를 자연수로 나눔", anchorIds: ["[6수01-14]"],
    mistakes: [
      { id: "dd.decimal-by-natural.ignore-point", title: "몫의 소수점을 빠뜨림", derivation: "자연수 나눗셈처럼 계산한 뒤 몫에 소수점을 표시하지 않는다.", rationale: "나누어지는 수의 소수점과 같은 위치에서 몫의 소수점을 올려 찍습니다." },
      { id: "dd.decimal-by-natural.shift", title: "몫의 소수점을 한 자리 어긋나게 찍음", derivation: "몫의 소수점을 실제 위치보다 한 자리 왼쪽에 찍는다.", rationale: "자릿값을 맞추어 몫의 소수점 위치를 확인해야 합니다." }
    ],
    cases: [
      { context: "계산한 뒤 몫의 소수점 위치를 확인하세요.", prompt: "8.4 ÷ 4는 얼마인가요?", correct: "2.1", wrong: [{ label: "21", misconceptionId: "dd.decimal-by-natural.ignore-point" }, { label: "0.21", misconceptionId: "dd.decimal-by-natural.shift" }] },
      { context: "길이 7.5 m인 줄을 3도막으로 똑같이 자릅니다.", prompt: "한 도막의 길이는 몇 m인가요?", correct: "2.5 m", wrong: [{ label: "25 m", misconceptionId: "dd.decimal-by-natural.ignore-point" }, { label: "0.25 m", misconceptionId: "dd.decimal-by-natural.shift" }] }
    ]
  },
  {
    id: "dd.zero-quotient", unitId: "decimal-division", title: "몫이 1보다 작은 소수 나눗셈 하기", shortTitle: "몫의 일의 자리에 0을 씀", anchorIds: ["[6수01-14]"], prerequisiteStageIds: ["dd.decimal-by-natural"],
    mistakes: [
      { id: "dd.zero-quotient.omit-zero", title: "몫의 일의 자리 0을 생략함", derivation: "몫이 1보다 작은데 0과 소수점을 쓰지 않고 숫자만 이어 쓴다.", rationale: "몫이 1보다 작으면 일의 자리에 0을 쓰고 소수점을 표시합니다." },
      { id: "dd.zero-quotient.extra-left-shift", title: "몫의 소수점을 한 자리 더 왼쪽에 찍음", derivation: "맞게 구한 몫의 소수점을 실제 위치보다 한 자리 더 왼쪽에 찍어 값을 10분의 1로 만든다.", rationale: "몫의 자릿값을 확인해 소수점을 한 자리 더 옮기지 않도록 합니다." }
    ],
    cases: [
      { context: "몫은 1보다 작습니다.", prompt: "2.4 ÷ 6의 값을 고르세요.", correct: "0.4", wrong: [{ label: "4", misconceptionId: "dd.zero-quotient.omit-zero" }, { label: "0.04", misconceptionId: "dd.zero-quotient.extra-left-shift" }] },
      { context: "주스 3.5 L를 5통에 똑같이 나누어 담습니다.", prompt: "한 통에 몇 L씩 담나요?", correct: "0.7 L", wrong: [{ label: "7 L", misconceptionId: "dd.zero-quotient.omit-zero" }, { label: "0.07 L", misconceptionId: "dd.zero-quotient.extra-left-shift" }] }
    ]
  },
  {
    id: "dd.natural-by-decimal", unitId: "decimal-division", title: "자연수를 소수로 나누기", shortTitle: "자연수를 소수로 나눔", anchorIds: ["[6수01-15]"],
    mistakes: [
      { id: "dd.natural-by-decimal.no-scale", title: "나누는 수만 자연수로 바꿈", derivation: "나누는 수에만 10을 곱하고 나누어지는 수는 그대로 둔다.", rationale: "나누는 수와 나누어지는 수에 같은 수를 곱해야 몫이 같습니다." },
      { id: "dd.natural-by-decimal.multiply", title: "나눗셈 대신 곱셈함", derivation: "몇 묶음인지 묻는 상황에서 두 수를 곱한다.", rationale: "전체 안에 한 묶음이 몇 번 들어가는지 구하려면 나눕니다." }
    ],
    cases: [
      { context: "나누는 수를 자연수로 바꾸어 계산하세요.", prompt: "6 ÷ 0.3은 얼마인가요?", correct: "20", wrong: [{ label: "2", misconceptionId: "dd.natural-by-decimal.no-scale" }, { label: "1.8", misconceptionId: "dd.natural-by-decimal.multiply" }] },
      { context: "끈 4 m를 0.8 m씩 자릅니다.", prompt: "몇 도막으로 자를 수 있나요?", correct: "5도막", wrong: [{ label: "0.5도막", misconceptionId: "dd.natural-by-decimal.no-scale" }, { label: "3.2도막", misconceptionId: "dd.natural-by-decimal.multiply" }] }
    ]
  },
  {
    id: "dd.decimal-by-decimal", unitId: "decimal-division", title: "소수를 소수로 나누기", shortTitle: "소수를 소수로 나눔", anchorIds: ["[6수01-15]"], prerequisiteStageIds: ["dd.natural-by-decimal"],
    mistakes: [
      { id: "dd.decimal-by-decimal.scale-one", title: "두 수의 소수점을 다르게 옮김", derivation: "나누는 수와 나누어지는 수에 서로 다른 배수를 적용한다.", rationale: "두 수의 소수점을 같은 칸 수만큼 오른쪽으로 옮깁니다." },
      { id: "dd.decimal-by-decimal.reverse", title: "나누는 순서를 거꾸로 함", derivation: "나누어지는 수와 나누는 수의 자리를 바꾸어 계산한다.", rationale: "나눗셈 기호 앞의 수를 뒤의 수로 나눕니다." }
    ],
    cases: [
      { context: "두 수에 같은 수를 곱해 자연수 나눗셈으로 바꾸세요.", prompt: "4.2 ÷ 0.6은 얼마인가요?", correct: "7", wrong: [{ label: "0.7", misconceptionId: "dd.decimal-by-decimal.scale-one" }, { label: "1/7", misconceptionId: "dd.decimal-by-decimal.reverse" }] },
      { context: "리본 3.75 m를 1.5 m씩 묶음으로 만듭니다.", prompt: "몇 묶음 분량인가요?", correct: "2.5묶음", wrong: [{ label: "0.25묶음", misconceptionId: "dd.decimal-by-decimal.scale-one" }, { label: "0.4묶음", misconceptionId: "dd.decimal-by-decimal.reverse" }] }
    ]
  },
  {
    id: "dd.application", unitId: "decimal-division", title: "소수 나눗셈을 상황에 적용하기", shortTitle: "소수 나눗셈을 적용함", anchorIds: ["[6수01-15]"], prerequisiteStageIds: ["dd.decimal-by-decimal"],
    mistakes: [
      { id: "dd.application.reverse-order", title: "나누어지는 양과 나누는 양의 순서를 바꿈", derivation: "기준이 되는 양을 전체 양으로 나누어 나눗셈 순서를 거꾸로 계산한다.", rationale: "전체 양을 기준이 되는 한 단위의 양으로 나누어야 합니다." },
      { id: "dd.application.round-too-early", title: "계산 전에 수를 어림함", derivation: "정확한 몫을 구하기 전에 소수를 자연수로 바꾸어 계산한다.", rationale: "정확히 계산한 뒤 문제에서 요구할 때만 어림합니다." }
    ],
    cases: [
      { context: "자동차가 12.6 L로 50.4 km를 갔습니다.", prompt: "휘발유 1 L당 몇 km를 간 셈인가요?", correct: "4 km", wrong: [{ label: "0.25 km", misconceptionId: "dd.application.reverse-order", derivation: "12.6÷50.4로 순서를 바꾸어 0.25를 구한다." }, { label: "3.8 km", misconceptionId: "dd.application.round-too-early", derivation: "50.4를 50으로, 12.6을 13으로 먼저 어림해 약 3.8을 구한다." }] },
      { context: "철사 6.25 m와 기준 철사 1.25 m의 길이를 비교합니다.", prompt: "6.25 m는 1.25 m의 몇 배인가요?", correct: "5배", wrong: [{ label: "0.2배", misconceptionId: "dd.application.reverse-order", derivation: "1.25÷6.25로 순서를 바꾸어 0.2를 구한다." }, { label: "6배", misconceptionId: "dd.application.round-too-early", derivation: "6.25를 6으로, 1.25를 1로 먼저 어림한 뒤 6÷1=6으로 계산한다." }] }
    ]
  },

  {
    id: "ratio.meaning", unitId: "ratio-rate", title: "두 양의 관계를 비로 나타내기", shortTitle: "두 양의 관계를 비로 나타냄", anchorIds: ["[6수02-02]"],
    mistakes: [
      { id: "ratio.meaning.add", title: "두 양을 더한 전체로 나타냄", derivation: "두 수의 덧셈 결과를 비라고 생각한다.", rationale: "비는 두 양을 나눗셈으로 비교하는 표현입니다." },
      { id: "ratio.meaning.reverse", title: "기준량과 비교하는 양을 바꿈", derivation: "말한 순서와 반대로 두 수를 놓는다.", rationale: "‘가에 대한 나의 비’는 나:가의 순서로 씁니다." }
    ],
    cases: [
      { context: "빨간 공 3개와 파란 공 5개가 있습니다.", prompt: "빨간 공 수와 파란 공 수의 비를 쓰세요.", correct: "3:5", wrong: [{ label: "8", misconceptionId: "ratio.meaning.add" }, { label: "5:3", misconceptionId: "ratio.meaning.reverse" }] },
      { context: "남학생 12명에 대한 여학생 15명의 비를 나타냅니다.", prompt: "알맞은 비를 고르세요.", correct: "15:12", wrong: [{ label: "27", misconceptionId: "ratio.meaning.add" }, { label: "12:15", misconceptionId: "ratio.meaning.reverse" }] }
    ]
  },
  {
    id: "ratio.equivalent", unitId: "ratio-rate", title: "같은 비 찾기", shortTitle: "같은 비를 찾음", anchorIds: ["[6수02-02]"], prerequisiteStageIds: ["ratio.meaning"],
    mistakes: [
      { id: "ratio.equivalent.add-same", title: "두 항에 같은 수를 더함", derivation: "비의 두 수에 같은 수를 더해도 같은 비라고 생각한다.", rationale: "같은 비를 만들려면 두 항에 같은 0이 아닌 수를 곱하거나 나눕니다." },
      { id: "ratio.equivalent.change-one", title: "한 항만 바꿈", derivation: "비의 한쪽 수에만 배수를 적용한다.", rationale: "전항과 후항을 같은 배수로 바꾸어야 비율이 같습니다." }
    ],
    cases: [
      { context: "2:3과 같은 비를 찾습니다.", prompt: "알맞은 비는 어느 것인가요?", correct: "6:9", wrong: [{ label: "4:5", misconceptionId: "ratio.equivalent.add-same" }, { label: "6:3", misconceptionId: "ratio.equivalent.change-one" }] },
      { context: "주스 원액과 물의 비 4:5를 그대로 유지합니다.", prompt: "원액이 12컵일 때 물은 몇 컵인가요?", correct: "15컵", wrong: [{ label: "13컵", misconceptionId: "ratio.equivalent.add-same" }, { label: "5컵", misconceptionId: "ratio.equivalent.change-one" }] }
    ]
  },
  {
    id: "rate.unit", unitId: "ratio-rate", title: "기준량을 1로 만든 비율 구하기", shortTitle: "기준량 1당 크기를 구함", anchorIds: ["[6수02-03]"], prerequisiteStageIds: ["ratio.meaning"],
    mistakes: [
      { id: "rate.unit.reverse", title: "비교하는 양과 기준량을 거꾸로 나눔", derivation: "기준량을 비교하는 양으로 나누어 역수 비율을 구한다.", rationale: "비율은 비교하는 양을 기준량으로 나눈 값입니다." },
      { id: "rate.unit.difference", title: "나눗셈 대신 차를 구함", derivation: "두 양을 나누지 않고 큰 수에서 작은 수를 뺀다.", rationale: "비율은 차이가 아니라 기준량에 대한 비교하는 양의 몫입니다." }
    ],
    cases: [
      { context: "전체 20명 중 안경을 쓴 학생이 5명입니다.", prompt: "전체 학생 수에 대한 안경 쓴 학생 수의 비율을 분수로 나타내면 얼마인가요?", correct: "1/4", wrong: [{ label: "4/1", misconceptionId: "rate.unit.reverse" }, { label: "15/1", misconceptionId: "rate.unit.difference" }] },
      { context: "거리 180 km를 3시간 동안 이동했습니다.", prompt: "1시간당 이동 거리는 얼마인가요?", correct: "60 km", wrong: [{ label: "1/60 km", misconceptionId: "rate.unit.reverse" }, { label: "177 km", misconceptionId: "rate.unit.difference" }] }
    ]
  },
  {
    id: "rate.percent", unitId: "ratio-rate", title: "비율을 백분율로 나타내기", shortTitle: "비율을 백분율로 나타냄", anchorIds: ["[6수02-03]"], prerequisiteStageIds: ["rate.unit"],
    mistakes: [
      { id: "rate.percent.no-times100", title: "비율에 100을 곱하지 않음", derivation: "소수 비율에 퍼센트 기호만 붙인다.", rationale: "백분율은 비율에 100을 곱하고 %를 붙여 나타냅니다." },
      { id: "rate.percent.times10", title: "10만 곱해 백분율을 구함", derivation: "소수점을 한 자리만 옮겨 백분율을 만든다.", rationale: "백분율은 기준량을 100으로 본 값이므로 100을 곱합니다." }
    ],
    cases: [
      { context: "비율 0.35를 백분율로 바꿉니다.", prompt: "알맞은 백분율은 얼마인가요?", correct: "35%", wrong: [{ label: "0.35%", misconceptionId: "rate.percent.no-times100" }, { label: "3.5%", misconceptionId: "rate.percent.times10" }] },
      { context: "40명 중 12명이 자전거로 등교합니다.", prompt: "자전거 등교 학생의 백분율을 구하세요.", correct: "30%", wrong: [{ label: "0.3%", misconceptionId: "rate.percent.no-times100" }, { label: "3%", misconceptionId: "rate.percent.times10" }] }
    ]
  },
  {
    id: "rate.application", unitId: "ratio-rate", title: "백분율을 생활 상황에 적용하기", shortTitle: "백분율을 적용함", anchorIds: ["[6수02-03]"], prerequisiteStageIds: ["rate.percent"],
    mistakes: [
      { id: "rate.application.use-percent-number", title: "퍼센트 수를 그대로 곱함", derivation: "20%를 0.2가 아니라 20으로 보고 기준량에 곱한다.", rationale: "백분율을 계산에 쓸 때에는 100으로 나눈 비율로 바꿉니다." },
      { id: "rate.application.subtract-wrong", title: "할인액과 판매가를 혼동함", derivation: "할인한 금액을 구하고도 그것을 판매 가격으로 답한다.", rationale: "판매가는 원래 가격에서 할인액을 뺀 값입니다." }
    ],
    cases: [
      { context: "30,000원짜리 가방을 20% 할인합니다.", prompt: "할인액은 얼마인가요?", correct: "6,000원", wrong: [{ label: "600,000원", misconceptionId: "rate.application.use-percent-number" }, { label: "24,000원", misconceptionId: "rate.application.subtract-wrong", derivation: "할인액 6,000원을 구한 뒤 원래 가격에서 빼 24,000원인 판매 가격을 답한다." }] },
      { context: "정가 50,000원인 옷을 10% 할인해 판매합니다.", prompt: "판매 가격은 얼마인가요?", correct: "45,000원", wrong: [{ label: "500,000원", misconceptionId: "rate.application.use-percent-number" }, { label: "5,000원", misconceptionId: "rate.application.subtract-wrong" }] }
    ]
  },

  {
    id: "graph.strip-read", unitId: "data-graphs", title: "띠그래프에서 비율 읽기", shortTitle: "띠그래프의 비율을 읽음", anchorIds: ["[6수04-02]"],
    mistakes: [
      { id: "graph.strip-read.parts-as-percent", title: "조각 수를 그대로 퍼센트로 읽음", derivation: "전체 칸 수를 확인하지 않고 조각 개수에 %를 붙인다.", rationale: "항목의 조각 수를 전체 조각 수로 나눈 뒤 백분율로 나타냅니다." },
      { id: "graph.strip-read.remainder", title: "나머지 부분의 비율을 답함", derivation: "묻는 항목 대신 다른 항목을 합한 나머지를 고른다.", rationale: "범례에서 묻는 항목의 색과 칸을 정확히 대응해 읽습니다." }
    ],
    cases: [
      { context: "띠 전체 20칸 중 독서가 8칸입니다.", prompt: "독서의 비율은 몇 %인가요?", correct: "40%", wrong: [{ label: "8%", misconceptionId: "graph.strip-read.parts-as-percent" }, { label: "60%", misconceptionId: "graph.strip-read.remainder" }], visual: { kind: "part-chart-diagram", mode: "strip", totalParts: 20, segments: [{ label: "독서", parts: 8 }, { label: "운동", parts: 7 }, { label: "음악", parts: 5 }] } },
      { context: "학급 희망 활동을 10칸 띠그래프로 나타냈습니다.", prompt: "과학 항목의 비율을 고르세요.", correct: "30%", wrong: [{ label: "3%", misconceptionId: "graph.strip-read.parts-as-percent" }, { label: "70%", misconceptionId: "graph.strip-read.remainder" }], visual: { kind: "part-chart-diagram", mode: "strip", totalParts: 10, segments: [{ label: "과학", parts: 3 }, { label: "미술", parts: 4 }, { label: "체육", parts: 3 }] } }
    ]
  },
  {
    id: "graph.circle-read", unitId: "data-graphs", title: "원그래프에서 비율 비교하기", shortTitle: "원그래프의 비율을 비교함", anchorIds: ["[6수04-02]"], prerequisiteStageIds: ["graph.strip-read"],
    mistakes: [
      { id: "graph.circle-read.legend", title: "항목 이름과 원의 나눈 부분을 잘못 연결함", derivation: "범례의 무늬와 원에서 같은 무늬인 부분의 항목 이름을 서로 바꾸어 읽는다.", rationale: "범례의 항목과 원 안의 같은 무늬를 연결해 읽어야 합니다." },
      { id: "graph.circle-read.reverse-size", title: "원의 나눈 부분의 크고 작음을 반대로 판단함", derivation: "원에서 차지한 부분의 크기를 반대로 비교해 묻는 것과 반대 크기의 항목을 고른다.", rationale: "원에서 차지한 부분이 클수록 그 항목의 비율도 큽니다." }
    ],
    cases: [
      { context: "한 원을 20부분으로 나눈 원그래프입니다.", prompt: "가장 비율이 큰 항목은 무엇인가요?", correct: "도보", wrong: [{ label: "버스", misconceptionId: "graph.circle-read.legend", derivation: "원의 가장 큰 부분과 같은 무늬를 도보가 아니라 버스로 잘못 연결한다." }, { label: "자전거", misconceptionId: "graph.circle-read.reverse-size" }], visual: { kind: "part-chart-diagram", mode: "circle", totalParts: 20, segments: [{ label: "도보", parts: 10 }, { label: "버스", parts: 6 }, { label: "자전거", parts: 4 }] } },
      { context: "좋아하는 계절을 원그래프로 나타냈습니다.", prompt: "가장 비율이 작은 항목을 고르세요.", correct: "겨울", wrong: [{ label: "봄", misconceptionId: "graph.circle-read.legend", derivation: "원의 가장 작은 부분과 같은 무늬를 겨울이 아니라 봄으로 잘못 연결한다." }, { label: "여름", misconceptionId: "graph.circle-read.reverse-size" }], visual: { kind: "part-chart-diagram", mode: "circle", totalParts: 10, segments: [{ label: "봄", parts: 3 }, { label: "여름", parts: 5 }, { label: "겨울", parts: 2 }] } }
    ]
  },
  {
    id: "graph.whole-from-part", unitId: "data-graphs", title: "그래프의 비율과 인원으로 전체 구하기", shortTitle: "부분으로 전체를 구함", anchorIds: ["[6수04-02]"], prerequisiteStageIds: ["graph.strip-read"],
    mistakes: [
      { id: "graph.whole-from-part.multiply-percent", title: "부분에 백분율 수를 곱함", derivation: "부분의 인원에 백분율 숫자를 그대로 곱한다.", rationale: "부분의 인원을 비율로 나누어 전체를 구합니다." },
      { id: "graph.whole-from-part.treat-as-whole", title: "부분의 인원을 전체로 답함", derivation: "제시된 항목의 인원을 전체 인원으로 그대로 사용한다.", rationale: "제시된 인원은 그래프의 한 부분이므로 전체와 구별해야 합니다." }
    ],
    cases: [
      { context: "독서가 전체의 25%이고 독서를 고른 학생은 8명입니다.", prompt: "조사한 학생은 모두 몇 명인가요?", correct: "32명", wrong: [{ label: "200명", misconceptionId: "graph.whole-from-part.multiply-percent" }, { label: "8명", misconceptionId: "graph.whole-from-part.treat-as-whole" }] },
      { context: "축구 항목이 전체의 40%이고 축구를 고른 학생은 12명입니다.", prompt: "전체 학생 수를 구하세요.", correct: "30명", wrong: [{ label: "480명", misconceptionId: "graph.whole-from-part.multiply-percent" }, { label: "12명", misconceptionId: "graph.whole-from-part.treat-as-whole" }] }
    ]
  },
  {
    id: "graph.construct", unitId: "data-graphs", title: "자료를 띠그래프와 원그래프로 나타내기", shortTitle: "자료를 그래프로 나타냄", anchorIds: ["[6수04-03]"], prerequisiteStageIds: ["graph.strip-read"],
    mistakes: [
      { id: "graph.construct.choose-other-category", title: "다른 항목의 칸 수를 고름", derivation: "묻는 항목이 아닌 다른 항목의 비율을 칸 수로 바꾼다.", rationale: "그래프에서 묻는 항목의 비율을 먼저 확인해야 합니다." },
      { id: "graph.construct.use-complement", title: "묻는 항목을 제외한 나머지 비율을 사용함", derivation: "묻는 항목의 비율 대신 100%에서 뺀 나머지 비율을 칸 수로 바꾼다.", rationale: "전체의 나머지가 아니라 묻는 항목 자체의 비율을 칸 수로 바꿉니다." }
    ],
    cases: [
      { context: "사과 50%, 배 30%, 감 20%를 20칸 띠그래프로 나타냅니다.", prompt: "배는 몇 칸으로 나타내야 하나요?", correct: "6칸", wrong: [{ label: "10칸", misconceptionId: "graph.construct.choose-other-category", derivation: "배가 아니라 사과의 50%를 20칸의 10칸으로 바꾼다." }, { label: "14칸", misconceptionId: "graph.construct.use-complement", derivation: "배 30%가 아니라 나머지 70%를 20칸의 14칸으로 바꾼다." }] },
      { context: "걷기 40%, 버스 40%, 자전거 20%를 10부분 원그래프로 만듭니다.", prompt: "자전거는 몇 부분으로 나타내나요?", correct: "2부분", wrong: [{ label: "4부분", misconceptionId: "graph.construct.choose-other-category", derivation: "자전거가 아니라 걷기나 버스의 40%를 10부분의 4부분으로 바꾼다." }, { label: "8부분", misconceptionId: "graph.construct.use-complement", derivation: "자전거 20%가 아니라 나머지 80%를 10부분의 8부분으로 바꾼다." }] }
    ]
  },
  {
    id: "graph.choose", unitId: "data-graphs", title: "자료의 목적에 맞는 그래프 고르기", shortTitle: "목적에 맞는 그래프를 고름", anchorIds: ["[6수04-03]"], prerequisiteStageIds: ["graph.construct"],
    mistakes: [
      { id: "graph.choose.swap-purpose", title: "시간 변화와 부분 비율의 그래프를 서로 바꿈", derivation: "시간 변화에는 부분 비율 그래프를, 부분 비율에는 꺾은선그래프를 반대로 선택한다.", rationale: "시간 변화는 꺾은선그래프, 전체에 대한 부분 비율은 띠그래프나 원그래프가 알맞습니다." },
      { id: "graph.choose.one-type", title: "자료 목적을 구별하지 않고 한 그래프만 사용함", derivation: "두 자료의 목적이 다른데도 같은 종류의 그래프로 모두 나타낸다.", rationale: "각 자료가 변화인지 구성 비율인지 먼저 확인해 서로 알맞은 그래프를 선택합니다." }
    ],
    cases: [
      { context: "한 달 동안의 기온 변화와 한 시점의 운동 종목별 비율을 각각 나타냅니다.", prompt: "두 자료에 알맞은 그래프를 순서대로 고르세요.", correct: "꺾은선그래프, 원그래프", wrong: [{ label: "원그래프, 꺾은선그래프", misconceptionId: "graph.choose.swap-purpose", derivation: "시간 변화와 부분 비율의 목적을 서로 바꾸어 그래프를 선택한다." }, { label: "원그래프, 원그래프", misconceptionId: "graph.choose.one-type", derivation: "자료의 목적을 구별하지 않고 두 자료 모두 원그래프로 나타낸다." }] },
      { context: "날짜별 판매량 변화와 등교 방법별 구성 비율을 각각 나타냅니다.", prompt: "두 자료에 알맞은 그래프를 순서대로 고르세요.", correct: "꺾은선그래프, 띠그래프", wrong: [{ label: "띠그래프, 꺾은선그래프", misconceptionId: "graph.choose.swap-purpose", derivation: "시간 변화와 부분 비율의 목적을 서로 바꾸어 그래프를 선택한다." }, { label: "띠그래프, 띠그래프", misconceptionId: "graph.choose.one-type", derivation: "자료의 목적을 구별하지 않고 두 자료 모두 띠그래프로 나타낸다." }] }
    ]
  },

  {
    id: "volume.unit", unitId: "surface-volume", title: "부피의 단위 이해하기", shortTitle: "부피 단위를 이해함", anchorIds: ["[6수03-18]"],
    mistakes: [
      { id: "volume.unit.square", title: "넓이 단위로 나타냄", derivation: "입체의 크기를 제곱 단위로 표현한다.", rationale: "부피는 한 모서리가 1 cm인 정육면체의 수이므로 cm³를 씁니다." },
      { id: "volume.unit.length", title: "길이 단위로 나타냄", derivation: "부피를 한 방향의 길이처럼 cm로 표현한다.", rationale: "세 방향으로 차지하는 공간의 크기는 세제곱 단위로 나타냅니다." }
    ],
    cases: [
      { context: "한 모서리가 1 cm인 쌓기나무 8개로 만든 입체입니다.", prompt: "부피를 알맞은 단위로 나타내세요.", correct: "8 cm³", wrong: [{ label: "8 cm²", misconceptionId: "volume.unit.square" }, { label: "8 cm", misconceptionId: "volume.unit.length" }], visual: { kind: "solid-diagram", mode: "unit-stack", shape: "unit-cubes", cubes: [[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1]], frontDirection: "right" } },
      { context: "한 모서리가 1 m인 정육면체가 6개 있습니다.", prompt: "전체 부피의 단위와 값을 고르세요.", correct: "6 m³", wrong: [{ label: "6 m²", misconceptionId: "volume.unit.square" }, { label: "6 m", misconceptionId: "volume.unit.length" }] }
    ]
  },
  {
    id: "volume.capacity-relation", unitId: "surface-volume", title: "세제곱미터와 리터의 관계 이해하기", shortTitle: "부피와 들이 단위를 바꿈", anchorIds: ["[6수03-19]"], prerequisiteStageIds: ["volume.unit"],
    mistakes: [
      { id: "volume.capacity-relation.times10", title: "세제곱미터를 리터로 10배만 바꿈", derivation: "미터와 센티미터의 십진 관계만 떠올려 10배 한다.", rationale: "1 m³는 가로·세로·높이가 각각 1 m인 공간으로 1000 L와 같습니다." },
      { id: "volume.capacity-relation.times100", title: "넓이처럼 100배로 바꿈", derivation: "부피 단위를 넓이 단위처럼 생각하여 100배 한다.", rationale: "들이와 부피의 관계 1 m³=1000 L를 기준으로 바꿉니다." }
    ],
    cases: [
      { context: "1 m³와 같은 들이를 리터로 나타냅니다.", prompt: "몇 L인가요?", correct: "1000 L", wrong: [{ label: "10 L", misconceptionId: "volume.capacity-relation.times10" }, { label: "100 L", misconceptionId: "volume.capacity-relation.times100" }] },
      { context: "수조의 부피가 2 m³입니다. 가득 채울 수 있는 물의 들이를 구합니다.", prompt: "몇 L를 채울 수 있나요?", correct: "2000 L", wrong: [{ label: "20 L", misconceptionId: "volume.capacity-relation.times10" }, { label: "200 L", misconceptionId: "volume.capacity-relation.times100" }] }
    ]
  },
  {
    id: "volume.box", unitId: "surface-volume", title: "직육면체의 부피 구하기", shortTitle: "직육면체의 부피를 구함", anchorIds: ["[6수03-18]"], prerequisiteStageIds: ["volume.unit"],
    mistakes: [
      { id: "volume.box.add", title: "세 길이를 더함", derivation: "가로, 세로, 높이를 곱하지 않고 더한다.", rationale: "한 층의 개수와 층 수를 곱해 가로×세로×높이로 구합니다." },
      { id: "volume.box.area", title: "밑면의 넓이만 구함", derivation: "가로와 세로만 곱하고 높이를 반영하지 않는다.", rationale: "밑면의 넓이에 높이를 곱해야 전체 부피가 됩니다." }
    ],
    cases: [
      { context: "가로 5 cm, 세로 3 cm, 높이 4 cm인 직육면체입니다.", prompt: "부피는 얼마인가요?", correct: "60 cm³", wrong: [{ label: "12 cm³", misconceptionId: "volume.box.add" }, { label: "15 cm³", misconceptionId: "volume.box.area" }], visual: { kind: "solid-diagram", mode: "dimensions", shape: "rectangular-prism", width: 5, depth: 3, height: 4 } },
      { context: "상자의 가로는 8 cm, 세로는 3 cm, 높이는 6 cm입니다.", prompt: "상자 안쪽의 부피를 구하세요.", correct: "144 cm³", wrong: [{ label: "17 cm³", misconceptionId: "volume.box.add" }, { label: "24 cm³", misconceptionId: "volume.box.area" }], visual: { kind: "solid-diagram", mode: "dimensions", shape: "rectangular-prism", width: 8, depth: 3, height: 6 } }
    ]
  },
  {
    id: "volume.cube", unitId: "surface-volume", title: "정육면체의 부피 구하기", shortTitle: "정육면체의 부피를 구함", anchorIds: ["[6수03-18]"], prerequisiteStageIds: ["volume.box"],
    mistakes: [
      { id: "volume.cube.times2", title: "한 모서리를 두 번만 곱함", derivation: "정사각형 넓이까지만 구하고 세 번째 길이를 곱하지 않는다.", rationale: "정육면체의 부피는 한 모서리×한 모서리×한 모서리입니다." },
      { id: "volume.cube.times6", title: "면 수 6을 곱함", derivation: "한 면의 넓이에 면의 수 6을 곱해 겉넓이를 구한다.", rationale: "부피는 면의 넓이 합이 아니라 내부 공간의 크기입니다." }
    ],
    cases: [
      { context: "한 모서리가 4 cm인 정육면체입니다.", prompt: "부피는 얼마인가요?", correct: "64 cm³", wrong: [{ label: "16 cm³", misconceptionId: "volume.cube.times2" }, { label: "96 cm³", misconceptionId: "volume.cube.times6" }], visual: { kind: "solid-diagram", mode: "dimensions", shape: "cube", width: 4 } },
      { context: "모든 모서리 길이가 7 cm인 상자입니다.", prompt: "상자의 부피를 구하세요.", correct: "343 cm³", wrong: [{ label: "49 cm³", misconceptionId: "volume.cube.times2" }, { label: "294 cm³", misconceptionId: "volume.cube.times6" }], visual: { kind: "solid-diagram", mode: "dimensions", shape: "cube", width: 7 } }
    ]
  },
  {
    id: "surface.net", unitId: "surface-volume", title: "전개도로 직육면체의 겉넓이 이해하기", shortTitle: "전개도로 겉넓이를 이해함", anchorIds: ["[6수03-17]"],
    mistakes: [
      { id: "surface.net.row-only", title: "전개도의 가운데 줄 면만 셈", derivation: "가운데에 이어진 네 면만 세고 위아래에 붙은 면을 뺀다.", rationale: "전개도에서 가운데 줄뿐 아니라 위와 아래에 붙은 면도 모두 더합니다." },
      { id: "surface.net.omit-one", title: "전개도의 붙은 면 하나를 빠뜨림", derivation: "가운데 네 면과 붙은 면 하나만 세고 나머지 한 면을 빠뜨린다.", rationale: "겉넓이는 전개도를 이루는 여섯 면을 빠짐없이 모두 더한 값입니다." }
    ],
    cases: [
      { context: "직육면체를 모서리를 따라 겹치지 않게 펼쳤습니다.", prompt: "겉넓이를 구할 때 더해야 하는 면은 몇 개인가요?", correct: "6개", wrong: [{ label: "4개", misconceptionId: "surface.net.row-only" }, { label: "5개", misconceptionId: "surface.net.omit-one" }], visual: { kind: "solid-diagram", mode: "net", shape: "rectangular-prism" } },
      { context: "정육면체의 전개도에서 같은 정사각형을 모두 셉니다.", prompt: "정사각형 몇 개의 넓이를 더하나요?", correct: "6개", wrong: [{ label: "4개", misconceptionId: "surface.net.row-only" }, { label: "5개", misconceptionId: "surface.net.omit-one" }], visual: { kind: "solid-diagram", mode: "net", shape: "cube" } }
    ]
  },
  {
    id: "surface.calculate", unitId: "surface-volume", title: "직육면체와 정육면체의 겉넓이 구하기", shortTitle: "입체도형의 겉넓이를 구함", anchorIds: ["[6수03-17]"], prerequisiteStageIds: ["surface.net"],
    mistakes: [
      { id: "surface.calculate.one-each", title: "서로 다른 면 하나씩만 더함", derivation: "가로×세로, 가로×높이, 세로×높이를 한 번씩만 더한다.", rationale: "마주 보는 면이 각각 두 개이므로 세 넓이의 합에 2를 곱합니다." },
      { id: "surface.calculate.volume", title: "겉넓이 대신 부피를 구함", derivation: "세 길이를 모두 곱해 내부 공간의 크기를 계산한다.", rationale: "겉넓이는 여섯 면의 넓이를 더한 값이며 제곱 단위를 씁니다." }
    ],
    cases: [
      { context: "가로 5 cm, 세로 3 cm, 높이 2 cm인 직육면체입니다.", prompt: "겉넓이는 얼마인가요?", correct: "62 cm²", wrong: [{ label: "31 cm²", misconceptionId: "surface.calculate.one-each" }, { label: "30 cm²", misconceptionId: "surface.calculate.volume" }], visual: { kind: "solid-diagram", mode: "dimensions", shape: "rectangular-prism", width: 5, depth: 3, height: 2 } },
      { context: "한 모서리가 5 cm인 정육면체의 모든 면을 포장합니다.", prompt: "필요한 종이의 넓이는 얼마인가요?", correct: "150 cm²", wrong: [{ label: "75 cm²", misconceptionId: "surface.calculate.one-each" }, { label: "125 cm²", misconceptionId: "surface.calculate.volume" }], visual: { kind: "solid-diagram", mode: "dimensions", shape: "cube", width: 5 } }
    ]
  }
];

const artifacts = buildUpperGradeSemester({
  id: "grade6-semester1",
  version: "1.0.0",
  grade: 6,
  semester: 1,
  title: "6학년 1학기 수학 생각 지도",
  shortTitle: "6-1 수학 생각 지도",
  blueprintRevision: "2026-08-01.1",
  anchors: [
    ["[6수01-10]", "분수를 자연수로 나누기"],
    ["[6수01-11]", "분수의 나눗셈 원리를 이해하고 계산하기"],
    ["[6수03-05]", "각기둥과 각뿔을 알고 구성 요소와 성질 이해하기"],
    ["[6수03-06]", "각기둥과 각뿔의 전개도 이해하기"],
    ["[6수01-14]", "소수를 자연수로 나누기"],
    ["[6수01-15]", "소수의 나눗셈 원리를 이해하고 계산하기"],
    ["[6수02-02]", "두 양의 크기를 비교하는 상황에서 비 이해하기"],
    ["[6수02-03]", "비율을 이해하고 백분율로 나타내기"],
    ["[6수04-02]", "띠그래프와 원그래프를 해석하기"],
    ["[6수04-03]", "자료를 띠그래프와 원그래프로 나타내기"],
    ["[6수03-17]", "직육면체와 정육면체의 겉넓이 구하기"],
    ["[6수03-18]", "부피 단위와 직육면체·정육면체 부피 구하기"],
    ["[6수03-19]", "부피와 들이 단위의 관계 이해하기"]
  ].map(([id, label]) => ({ id, label, source: SOURCE })),
  units: [
    { id: "fraction-division", title: "분수의 나눗셈" },
    { id: "prisms-pyramids", title: "각기둥과 각뿔" },
    { id: "decimal-division", title: "소수의 나눗셈" },
    { id: "ratio-rate", title: "비와 비율" },
    { id: "data-graphs", title: "여러 가지 그래프" },
    { id: "surface-volume", title: "직육면체의 겉넓이와 부피" }
  ],
  stages: buildPairedStages("g6s1", stageInputs)
});

export const grade6Semester1Diagnosis = artifacts.diagnosis;
export const grade6Semester1CoverageBlueprint = artifacts.coverageBlueprint;
export const grade6Semester1DistractorRationales = artifacts.distractorRationales;
export const grade6Semester1MisconceptionTitles = artifacts.misconceptionTitles;
