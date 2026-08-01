import { buildPairedStages, type PairStageInput } from "./paired-stage-authoring";
import { buildUpperGradeSemester } from "./upper-grade-content-builder";

const SOURCE = "2022 개정 수학과 교육과정 및 2026 경기도교육청 6학년 단원 배치표";

const stageInputs: PairStageInput[] = [
  {
    id: "fd2.natural-divisor", unitId: "fraction-division", title: "분수와 대분수를 자연수로 나누기", shortTitle: "분수를 자연수로 나눔", anchorIds: ["[6수01-11]"],
    mistakes: [
      { id: "fd2.natural-divisor.multiply", title: "나눗셈을 곱셈으로 계산함", derivation: "나누는 자연수를 분자에 곱하여 전체 양을 더 크게 만든다.", rationale: "자연수로 나누면 같은 크기의 묶음 수만큼 양을 똑같이 나눕니다." },
      { id: "fd2.natural-divisor.ignore-divisor", title: "나누는 자연수를 계산에 반영하지 않음", derivation: "나누는 자연수를 무시하고 나누어지는 분수나 대분수를 그대로 답한다.", rationale: "자연수로 나눈다는 것은 전체 양을 그 수만큼 똑같이 나누는 뜻입니다." }
    ],
    cases: [
      { context: "계산 결과를 기약분수로 나타냅니다.", prompt: "7/8 ÷ 3은 얼마인가요?", correct: "7/24", wrong: [{ label: "21/8", misconceptionId: "fd2.natural-divisor.multiply" }, { label: "7/8", misconceptionId: "fd2.natural-divisor.ignore-divisor" }] },
      { context: "2와 1/2 L의 주스를 5병에 똑같이 담습니다.", prompt: "한 병에는 몇 L씩 담나요?", correct: "1/2 L", wrong: [{ label: "12와 1/2 L", misconceptionId: "fd2.natural-divisor.multiply" }, { label: "2와 1/2 L", misconceptionId: "fd2.natural-divisor.ignore-divisor" }] }
    ]
  },
  {
    id: "fd2.fraction-divisor", unitId: "fraction-division", title: "분수로 나누는 계산 원리 적용하기", shortTitle: "나누는 분수의 역수를 씀", anchorIds: ["[6수01-11]"], prerequisiteStageIds: ["fd2.natural-divisor"],
    mistakes: [
      { id: "fd2.fraction-divisor.no-reciprocal", title: "나누는 분수를 그대로 곱함", derivation: "나누는 분수의 분자와 분모를 바꾸지 않고 그대로 곱한다.", rationale: "나누는 분수만 역수로 바꾸어 곱합니다." },
      { id: "fd2.fraction-divisor.flip-first", title: "첫 번째 분수만 뒤집고 그대로 곱함", derivation: "나누어지는 첫 번째 분수만 뒤집고 두 번째 분수는 그대로 곱한다.", rationale: "첫 번째 분수는 그대로 두고 나눗셈 기호 뒤의 분수만 역수로 바꿉니다." }
    ],
    cases: [
      { context: "분수 나눗셈을 곱셈으로 바꾸어 계산하세요.", prompt: "4/9 ÷ 2/3은 얼마인가요?", correct: "2/3", wrong: [{ label: "8/27", misconceptionId: "fd2.fraction-divisor.no-reciprocal" }, { label: "3/2", misconceptionId: "fd2.fraction-divisor.flip-first" }] },
      { context: "색종이 5/6장을 한 작품에 5/12장씩 씁니다.", prompt: "몇 작품 분량인가요?", correct: "2작품", wrong: [{ label: "25/72작품", misconceptionId: "fd2.fraction-divisor.no-reciprocal" }, { label: "1/2작품", misconceptionId: "fd2.fraction-divisor.flip-first" }] }
    ]
  },
  {
    id: "fd2.mixed-divisor", unitId: "fraction-division", title: "대분수가 있는 분수 나눗셈 하기", shortTitle: "대분수를 바꾸어 나눔", anchorIds: ["[6수01-11]"], prerequisiteStageIds: ["fd2.fraction-divisor"],
    mistakes: [
      { id: "fd2.mixed-divisor.bad-improper", title: "대분수를 가분수로 잘못 바꿈", derivation: "자연수와 분자를 더하여 가분수의 분자를 만든다.", rationale: "자연수×분모+분자로 가분수의 분자를 구합니다." },
      { id: "fd2.mixed-divisor.no-reciprocal", title: "가분수로만 바꾸고 역수를 쓰지 않음", derivation: "대분수는 가분수로 바꾸지만 나누는 분수를 그대로 곱한다.", rationale: "대분수를 가분수로 바꾼 뒤 나누는 수의 역수를 곱합니다." }
    ],
    cases: [
      { context: "두 대분수를 가분수로 바꾸어 계산합니다.", prompt: "1과 1/2 ÷ 2와 1/4은 얼마인가요?", correct: "2/3", wrong: [{ label: "1과 1/3", misconceptionId: "fd2.mixed-divisor.bad-improper", derivation: "1과 1/2을 2/2로, 2와 1/4을 3/4로 잘못 바꾸어 2/2÷3/4=4/3으로 계산한다." }, { label: "27/8", misconceptionId: "fd2.mixed-divisor.no-reciprocal" }] },
      { context: "리본 3과 1/3 m를 1과 2/3 m씩 나눕니다.", prompt: "몇 도막 분량인가요?", correct: "2도막", wrong: [{ label: "1과 1/3도막", misconceptionId: "fd2.mixed-divisor.bad-improper", derivation: "3과 1/3을 4/3으로, 1과 2/3을 3/3으로 잘못 바꾸어 4/3÷3/3=4/3으로 계산한다." }, { label: "5와 5/9도막", misconceptionId: "fd2.mixed-divisor.no-reciprocal" }] }
    ]
  },
  {
    id: "fd2.application", unitId: "fraction-division", title: "분수 나눗셈으로 단위량 구하기", shortTitle: "분수 나눗셈으로 단위량을 구함", anchorIds: ["[6수01-11]"], prerequisiteStageIds: ["fd2.mixed-divisor"],
    mistakes: [
      { id: "fd2.application.reverse", title: "나눗셈 순서를 바꾸고 문제의 단위를 붙임", derivation: "단위량을 구하면서 기준량을 전체 양으로 나눈 뒤, 나온 수에 문제에서 요구한 단위를 그대로 붙인다.", rationale: "1만큼의 양을 구하려면 전체 양을 기준량으로 나누고, 계산식이 나타내는 단위도 함께 확인합니다." },
      { id: "fd2.application.multiply", title: "단위량을 구할 때 두 양을 곱함", derivation: "1에 해당하는 양을 묻는데 전체와 기준량을 곱한다.", rationale: "몇 배의 양에서 1배의 양을 찾는 과정은 나눗셈입니다." }
    ],
    cases: [
      { context: "3/4시간 동안 2와 1/4 km를 걸었습니다.", prompt: "1시간 동안 같은 빠르기로 몇 km를 걷나요?", correct: "3 km", wrong: [{ label: "1/3 km", misconceptionId: "fd2.application.reverse", derivation: "3/4÷2와 1/4=1/3으로 순서를 바꾸어 계산한 뒤, 묻는 단위 km를 그대로 붙인다." }, { label: "1과 11/16 km", misconceptionId: "fd2.application.multiply" }] },
      { context: "2/5 kg의 과일 가격이 3,000원입니다.", prompt: "1 kg의 가격은 얼마인가요?", correct: "7,500원", wrong: [{ label: "1,200원", misconceptionId: "fd2.application.multiply", derivation: "3,000×2/5=1,200으로 계산한다." }, { label: "1/7500원", misconceptionId: "fd2.application.reverse", derivation: "2/5÷3,000=1/7500으로 순서를 바꾸어 계산한 뒤, 묻는 단위 원을 그대로 붙인다." }] }
    ]
  },

  {
    id: "space.top-view", unitId: "space-solids", title: "쌓기나무를 위에서 본 모양 파악하기", shortTitle: "위에서 본 모양을 파악함", anchorIds: ["[6수03-09]"],
    mistakes: [
      { id: "space.top-view.count-all", title: "전체 쌓기나무 수를 위에서 본 칸 수로 씀", derivation: "같은 자리에 위아래로 쌓인 나무를 각각 한 칸으로 센다.", rationale: "위에서 보면 같은 세로줄의 가장 위 쌓기나무 하나만 보입니다." },
      { id: "space.top-view.visible-front", title: "앞에서 보이는 개수와 혼동함", derivation: "위가 아니라 앞에서 보이는 윤곽의 칸 수를 센다.", rationale: "화살표 방향과 관계없이 위에서 내려다본 바닥 위치를 표시합니다." }
    ],
    cases: [
      { context: "쌓기나무를 그림처럼 놓았습니다. 같은 자리에 위아래로 쌓인 나무는 위에서 한 칸으로 보입니다.", prompt: "위에서 본 모양은 몇 칸인가요?", correct: "3칸", wrong: [{ label: "5칸", misconceptionId: "space.top-view.count-all" }, { label: "4칸", misconceptionId: "space.top-view.visible-front" }], visual: { kind: "solid-diagram", mode: "unit-stack", shape: "unit-cubes", cubes: [[0,0,0],[1,0,0],[1,0,1],[0,1,0],[0,1,1]], frontDirection: "right" } },
      { context: "쌓기나무를 그림처럼 놓고 위에서 내려다봅니다.", prompt: "위에서 보이는 칸 수를 고르세요.", correct: "4칸", wrong: [{ label: "5칸", misconceptionId: "space.top-view.count-all" }, { label: "3칸", misconceptionId: "space.top-view.visible-front" }], visual: { kind: "solid-diagram", mode: "unit-stack", shape: "unit-cubes", cubes: [[0,0,0],[1,0,0],[0,1,0],[1,1,0],[1,1,1]], frontDirection: "left" } }
    ]
  },
  {
    id: "space.front-view", unitId: "space-solids", title: "앞에서 본 쌓기나무의 높이 파악하기", shortTitle: "앞에서 본 높이를 파악함", anchorIds: ["[6수03-09]"], prerequisiteStageIds: ["space.top-view"],
    mistakes: [
      { id: "space.front-view.sum-depth", title: "앞뒤 줄의 높이를 더함", derivation: "같은 가로 위치에서 앞뒤로 겹치는 기둥 높이를 모두 더한다.", rationale: "앞에서 보면 같은 가로 위치의 기둥 중 가장 높은 윤곽만 보입니다." },
      { id: "space.front-view.use-top", title: "바닥 자리 수를 높이로 답함", derivation: "위에서 본 모양의 칸 수를 앞에서 본 높이로 사용한다.", rationale: "앞 방향을 확인하고 가로 위치마다 보이는 최고 높이를 살핍니다." }
    ],
    cases: [
      { context: "앞 화살표 쪽에서 쌓기나무의 가장 높은 기둥을 봅니다.", prompt: "가장 높은 곳은 몇 층인가요?", correct: "2층", wrong: [{ label: "3층", misconceptionId: "space.front-view.sum-depth" }, { label: "3칸", misconceptionId: "space.front-view.use-top", derivation: "위에서 보이는 바닥 자리 세 칸을 앞에서 본 최고 높이로 그대로 답한다." }], visual: { kind: "solid-diagram", mode: "unit-stack", shape: "unit-cubes", cubes: [[0,0,0],[0,0,1],[0,1,0],[1,0,0]], frontDirection: "right" } },
      { context: "앞 화살표 쪽에서 서로 겹쳐 보이는 두 기둥을 살펴봅니다.", prompt: "앞에서 본 그 위치의 높이는 몇 칸인가요?", correct: "3칸", wrong: [{ label: "4칸", misconceptionId: "space.front-view.sum-depth" }, { label: "2칸", misconceptionId: "space.front-view.use-top" }], visual: { kind: "solid-diagram", mode: "unit-stack", shape: "unit-cubes", cubes: [[0,0,0],[0,0,1],[0,0,2],[0,1,0]], frontDirection: "left" } }
    ]
  },
  {
    id: "space.hidden", unitId: "space-solids", title: "그림에서 가려진 쌓기나무 추론하기", shortTitle: "가려진 쌓기나무를 추론함", anchorIds: ["[6수03-10]"], prerequisiteStageIds: ["space.front-view"],
    mistakes: [
      { id: "space.hidden.visible-tops", title: "맨 위에 보이는 나무만 셈", derivation: "각 기둥의 맨 위 쌓기나무만 세고 아래 받침을 빼먹는다.", rationale: "위층 나무 아래에는 같은 위치의 받치는 나무가 반드시 있습니다." },
      { id: "space.hidden.raise-columns", title: "모든 기둥을 가장 높은 기둥과 같게 채움", derivation: "낮은 기둥도 가장 높은 층까지 쌓였다고 가정해 개수를 센다.", rationale: "그림과 여러 방향의 정보에서 확인되는 실제 기둥 높이를 각각 사용합니다." }
    ],
    cases: [
      { context: "그림에서 위층 나무 아래에 가려진 받침까지 생각합니다.", prompt: "이 모양을 만드는 데 쌓기나무는 모두 몇 개인가요?", correct: "5개", wrong: [{ label: "3개", misconceptionId: "space.hidden.visible-tops" }, { label: "6개", misconceptionId: "space.hidden.raise-columns" }], visual: { kind: "solid-diagram", mode: "unit-stack", shape: "unit-cubes", cubes: [[0,0,0],[0,0,1],[1,0,0],[1,1,0],[1,1,1]], frontDirection: "right" } },
      { context: "그림의 가장 높은 나무 아래에 가려진 받침과 낮은 기둥도 살펴봅니다.", prompt: "이 모양에 필요한 쌓기나무 수를 고르세요.", correct: "5개", wrong: [{ label: "3개", misconceptionId: "space.hidden.visible-tops" }, { label: "9개", misconceptionId: "space.hidden.raise-columns" }], visual: { kind: "solid-diagram", mode: "unit-stack", shape: "unit-cubes", cubes: [[0,0,0],[0,0,1],[0,0,2],[1,0,0],[0,1,0]], frontDirection: "left" } }
    ]
  },
  {
    id: "space.layer-count", unitId: "space-solids", title: "층별 쌓기나무 수로 전체 구하기", shortTitle: "층별 개수를 더함", anchorIds: ["[6수03-10]"], prerequisiteStageIds: ["space.hidden"],
    mistakes: [
      { id: "space.layer-count.top-only", title: "가장 위층 수만 사용함", derivation: "층별 자료에서 마지막 층의 개수만 전체로 답한다.", rationale: "각 층에 있는 쌓기나무 수를 모두 더해야 합니다." },
      { id: "space.layer-count.multiply", title: "층 수와 한 층의 수를 무조건 곱함", derivation: "층마다 개수가 다른데 한 층의 수에 층 수를 곱한다.", rationale: "층별 개수가 다르면 각 층의 수를 따로 더합니다." }
    ],
    cases: [
      { context: "1층 6개, 2층 3개, 3층 1개로 쌓았습니다.", prompt: "쌓기나무는 모두 몇 개인가요?", correct: "10개", wrong: [{ label: "1개", misconceptionId: "space.layer-count.top-only" }, { label: "18개", misconceptionId: "space.layer-count.multiply" }], visual: { kind: "data-table", title: "층별 쌓기나무", rows: [{ label: "1층", value: "6개" }, { label: "2층", value: "3개" }, { label: "3층", value: "1개" }] } },
      { context: "바닥층 8개 위에 둘째 층 5개와 셋째 층 2개를 놓았습니다.", prompt: "전체 개수를 구하세요.", correct: "15개", wrong: [{ label: "2개", misconceptionId: "space.layer-count.top-only" }, { label: "24개", misconceptionId: "space.layer-count.multiply" }] }
    ]
  },
  {
    id: "space.build-condition", unitId: "space-solids", title: "여러 방향의 조건에 맞게 쌓기", shortTitle: "조건에 맞는 쌓기 모양을 찾음", anchorIds: ["[6수03-10]"], prerequisiteStageIds: ["space.layer-count"],
    mistakes: [
      { id: "space.build-condition.ignore-view", title: "한 방향의 조건을 무시함", derivation: "위·앞·옆 조건 중 하나만 맞는 모양을 선택한다.", rationale: "각 후보를 위·앞·옆에서 차례로 보며 세 조건을 모두 확인합니다." },
      { id: "space.build-condition.extra-only", title: "바닥층을 빼고 위에 더 놓은 나무만 셈", derivation: "바닥층의 모든 나무를 빼고 2층 이상에 더 놓은 나무 수만 전체 개수로 답한다.", rationale: "전체 개수에는 바닥층의 모든 자리와 그 위에 더 쌓은 나무를 함께 넣어야 합니다." }
    ],
    cases: [
      { context: "위에서 보면 3칸이고 가장 높은 곳이 2층인 모양을 찾습니다.", prompt: "조건을 모두 만족하는 쌓기나무 수는 최소 몇 개인가요?", correct: "4개", wrong: [{ label: "3개", misconceptionId: "space.build-condition.ignore-view" }, { label: "1개", misconceptionId: "space.build-condition.extra-only" }] },
      { context: "위에서 보면 4칸이고 그중 두 자리가 2층입니다.", prompt: "조건에 맞는 전체 개수를 고르세요.", correct: "6개", wrong: [{ label: "4개", misconceptionId: "space.build-condition.ignore-view" }, { label: "2개", misconceptionId: "space.build-condition.extra-only" }] }
    ]
  },

  {
    id: "dd2.decimal-dividend", unitId: "decimal-division", title: "소수를 자연수와 소수로 나누기", shortTitle: "소수 나눗셈을 계산함", anchorIds: ["[6수01-15]"],
    mistakes: [
      { id: "dd2.decimal-dividend.point", title: "몫의 소수점 위치를 잘못 정함", derivation: "자릿값을 맞추지 않고 몫의 소수점을 한 자리 어긋나게 찍는다.", rationale: "두 수의 소수점을 같은 칸 수만큼 옮긴 뒤 몫의 자리를 확인합니다." },
      { id: "dd2.decimal-dividend.reverse", title: "나누는 순서를 거꾸로 함", derivation: "나누어지는 수와 나누는 수의 순서를 바꾸어 계산한다.", rationale: "나눗셈 기호 앞의 수를 뒤의 수로 나눕니다." }
    ],
    cases: [
      { context: "나누는 수를 자연수로 바꾸어 계산합니다.", prompt: "5.04 ÷ 0.7은 얼마인가요?", correct: "7.2", wrong: [{ label: "0.72", misconceptionId: "dd2.decimal-dividend.point" }, { label: "0.138…", misconceptionId: "dd2.decimal-dividend.reverse" }] },
      { context: "길이 6.6 m인 줄을 1.2 m씩 나눕니다.", prompt: "몇 도막 분량인가요?", correct: "5.5도막", wrong: [{ label: "0.55도막", misconceptionId: "dd2.decimal-dividend.point" }, { label: "0.18…도막", misconceptionId: "dd2.decimal-dividend.reverse" }] }
    ]
  },
  {
    id: "dd2.quotient-zero", unitId: "decimal-division", title: "몫의 중간 또는 끝에 0 쓰기", shortTitle: "몫의 필요한 자리에 0을 씀", anchorIds: ["[6수01-15]"], prerequisiteStageIds: ["dd2.decimal-dividend"],
    mistakes: [
      { id: "dd2.quotient-zero.omit", title: "몫의 0을 생략함", derivation: "나누어지지 않는 자리에 0을 쓰지 않아 뒷자리 값이 바뀐다.", rationale: "해당 자리에서 몫이 없으면 0을 써 자리를 지킵니다." },
      { id: "dd2.quotient-zero.shift", title: "0을 잘못된 자리에 씀", derivation: "몫의 0을 실제보다 앞이나 뒤 자리에 놓는다.", rationale: "나누어지는 수의 각 자릿값과 몫의 자리를 세로로 맞춥니다." }
    ],
    cases: [
      { context: "몫의 각 자리를 빠뜨리지 않고 계산하세요.", prompt: "4.08 ÷ 4는 얼마인가요?", correct: "1.02", wrong: [{ label: "1.2", misconceptionId: "dd2.quotient-zero.omit" }, { label: "10.2", misconceptionId: "dd2.quotient-zero.shift" }] },
      { context: "10.05 kg을 5상자에 똑같이 나눕니다.", prompt: "한 상자에 몇 kg씩 담나요?", correct: "2.01 kg", wrong: [{ label: "2.1 kg", misconceptionId: "dd2.quotient-zero.omit" }, { label: "20.1 kg", misconceptionId: "dd2.quotient-zero.shift" }] }
    ]
  },
  {
    id: "dd2.remainder", unitId: "decimal-division", title: "소수 나눗셈의 나머지 해석하기", shortTitle: "소수 나눗셈의 나머지를 해석함", anchorIds: ["[6수01-15]"], prerequisiteStageIds: ["dd2.decimal-dividend"],
    mistakes: [
      { id: "dd2.remainder.raw-digit", title: "옮긴 소수점의 나머지를 그대로 씀", derivation: "계산하려고 수를 10배 한 뒤 나온 나머지를 원래 단위로 되돌리지 않는다.", rationale: "나머지는 원래 나누어지는 수의 자릿값으로 되돌려 나타냅니다." },
      { id: "dd2.remainder.round", title: "나머지를 몫에 임의로 반올림함", derivation: "몫과 나머지를 구하는 문제에서 나머지를 버리고 몫을 올린다.", rationale: "몫을 요구한 자리까지 구한 뒤 남은 양을 원래 단위의 나머지로 씁니다." }
    ],
    cases: [
      { context: "7.4 ÷ 2의 몫을 자연수까지 구합니다.", prompt: "몫과 나머지는 무엇인가요?", correct: "몫 3, 나머지 1.4", wrong: [{ label: "몫 3, 나머지 14", misconceptionId: "dd2.remainder.raw-digit" }, { label: "몫 4, 나머지 0", misconceptionId: "dd2.remainder.round" }] },
      { context: "5.8 m를 1.5 m씩 자릅니다.", prompt: "완전한 도막 수와 남는 길이를 고르세요.", correct: "3도막, 1.3 m", wrong: [{ label: "3도막, 13 m", misconceptionId: "dd2.remainder.raw-digit" }, { label: "4도막, 0 m", misconceptionId: "dd2.remainder.round" }] }
    ]
  },
  {
    id: "dd2.application", unitId: "decimal-division", title: "소수 나눗셈의 몫을 상황에 맞게 처리하기", shortTitle: "몫을 상황에 맞게 해석함", anchorIds: ["[6수01-15]"], prerequisiteStageIds: ["dd2.remainder"],
    mistakes: [
      { id: "dd2.application.ignore-whole", title: "온전한 묶음 수에서 소수 몫을 그대로 씀", derivation: "완성할 수 있는 개수를 묻는데 소수 몫 전체를 답한다.", rationale: "완성품 수는 몫의 자연수 부분만 사용하고 남은 양은 따로 봅니다." },
      { id: "dd2.application.round-up", title: "필요 개수와 완성 개수를 혼동함", derivation: "만들 수 있는 개수를 묻는데 필요한 용기처럼 몫을 올림한다.", rationale: "만들 수 있는 완성 묶음 수는 부족한 마지막 묶음을 포함하지 않습니다." }
    ],
    cases: [
      { context: "철사 9.7 m로 한 변이 1.2 m인 정사각형 틀을 만듭니다.", prompt: "완전한 틀을 몇 개 만들 수 있나요?", correct: "2개", wrong: [{ label: "2.02…개", misconceptionId: "dd2.application.ignore-whole" }, { label: "3개", misconceptionId: "dd2.application.round-up" }] },
      { context: "음료 11.3 L를 한 통에 2.5 L씩 가득 담아 판매합니다.", prompt: "가득 찬 통은 몇 개인가요?", correct: "4개", wrong: [{ label: "4.52개", misconceptionId: "dd2.application.ignore-whole" }, { label: "5개", misconceptionId: "dd2.application.round-up" }] }
    ]
  },

  {
    id: "prop.equivalent", unitId: "proportion", title: "비의 성질로 같은 비 만들기", shortTitle: "비의 성질을 이용함", anchorIds: ["[6수02-04]"],
    mistakes: [
      { id: "prop.equivalent.add", title: "비의 두 항에 같은 수를 더함", derivation: "전항과 후항에 같은 수를 더해도 같은 비라고 생각한다.", rationale: "같은 비는 두 항에 같은 0이 아닌 수를 곱하거나 나누어 만듭니다." },
      { id: "prop.equivalent.one-side", title: "한 항만 배로 바꿈", derivation: "전항 또는 후항 한쪽에만 배수를 적용한다.", rationale: "전항과 후항을 반드시 같은 배수로 바꿉니다." }
    ],
    cases: [
      { context: "3:5와 같은 비를 찾습니다.", prompt: "알맞은 비는 어느 것인가요?", correct: "12:20", wrong: [{ label: "6:8", misconceptionId: "prop.equivalent.add" }, { label: "12:5", misconceptionId: "prop.equivalent.one-side" }] },
      { context: "물감 빨강:파랑의 비 2:7을 유지합니다.", prompt: "빨강이 6컵이면 파랑은 몇 컵인가요?", correct: "21컵", wrong: [{ label: "11컵", misconceptionId: "prop.equivalent.add" }, { label: "7컵", misconceptionId: "prop.equivalent.one-side" }] }
    ]
  },
  {
    id: "prop.property", unitId: "proportion", title: "비례식의 성질 이해하기", shortTitle: "내항의 곱과 외항의 곱을 비교함", anchorIds: ["[6수02-04]"], prerequisiteStageIds: ["prop.equivalent"],
    mistakes: [
      { id: "prop.property.add", title: "내항과 외항을 더해 비교함", derivation: "비례식의 성질을 곱이 아니라 합으로 확인한다.", rationale: "비례식에서는 내항의 곱과 외항의 곱이 같습니다." },
      { id: "prop.property.adjacent", title: "이웃한 항끼리 곱함", derivation: "내항과 외항을 구별하지 않고 같은 쪽의 두 항을 곱한다.", rationale: "가운데 두 항이 내항, 양끝 두 항이 외항입니다." }
    ],
    cases: [
      { context: "비례식 3:4=9:12를 확인합니다.", prompt: "서로 같은 두 곱은 무엇인가요?", correct: "3×12와 4×9", wrong: [{ label: "3+12와 4+9", misconceptionId: "prop.property.add" }, { label: "3×4와 9×12", misconceptionId: "prop.property.adjacent" }] },
      { context: "비례식 5:8=15:24에서 내항과 외항을 찾습니다.", prompt: "내항의 곱을 고르세요.", correct: "8×15", wrong: [{ label: "8+15", misconceptionId: "prop.property.add" }, { label: "5×8", misconceptionId: "prop.property.adjacent" }] }
    ]
  },
  {
    id: "prop.missing", unitId: "proportion", title: "비례식의 미지항 구하기", shortTitle: "비례식의 빈 항을 구함", anchorIds: ["[6수02-04]"], prerequisiteStageIds: ["prop.property"],
    mistakes: [
      { id: "prop.missing.additive", title: "항 사이의 차를 사용함", derivation: "비의 곱셈 관계 대신 두 항 사이의 덧셈 차이를 적용한다.", rationale: "비례식은 같은 배수 관계 또는 내항과 외항의 곱으로 풉니다." },
      { id: "prop.missing.use-scale-factor", title: "구한 배수를 빈 항의 값으로 답함", derivation: "서로 대응하는 두 수가 몇 배인지 구한 뒤, 그 배수를 나머지 항에 적용하지 않고 빈 항의 값으로 그대로 답한다.", rationale: "대응하는 수의 배수를 구했으면 다른 쪽 항에도 같은 배수를 곱해야 합니다." }
    ],
    cases: [
      { context: "비례식의 성질을 이용하세요.", prompt: "4:7=12:□에서 □는 얼마인가요?", correct: "21", wrong: [{ label: "15", misconceptionId: "prop.missing.additive" }, { label: "3", misconceptionId: "prop.missing.use-scale-factor", derivation: "12÷4=3으로 대응하는 수의 배수만 구하고 7에 적용하지 않은 채 3을 답한다." }] },
      { context: "지도에서 2 cm가 실제 6 km를 뜻합니다.", prompt: "지도 5 cm는 실제 몇 km인가요?", correct: "15 km", wrong: [{ label: "9 km", misconceptionId: "prop.missing.additive" }, { label: "3 km", misconceptionId: "prop.missing.use-scale-factor", derivation: "6÷2=3으로 1 cm당 배수만 구하고 5 cm에 적용하지 않은 채 3 km를 답한다." }] }
    ]
  },
  {
    id: "prop.distribute", unitId: "proportion", title: "주어진 비로 비례배분하기", shortTitle: "전체를 주어진 비로 나눔", anchorIds: ["[6수02-05]"], prerequisiteStageIds: ["prop.equivalent"],
    mistakes: [
      { id: "prop.distribute.divide-one", title: "전체를 비의 한 항으로만 나눔", derivation: "비의 두 항의 합이 아니라 한쪽 항으로 전체를 나눈다.", rationale: "먼저 비의 두 항을 더해 전체를 몇 몫으로 나눌지 구합니다." },
      { id: "prop.distribute.use-ratio", title: "비의 수를 실제 양으로 답함", derivation: "한 몫의 크기를 곱하지 않고 비의 항 자체를 나눈 결과로 쓴다.", rationale: "한 몫의 크기를 구한 뒤 각 비의 항만큼 곱합니다." }
    ],
    cases: [
      { context: "사탕 42개를 두 모둠에 2:5로 나눕니다.", prompt: "첫째 모둠은 몇 개를 받나요?", correct: "12개", wrong: [{ label: "21개", misconceptionId: "prop.distribute.divide-one" }, { label: "2개", misconceptionId: "prop.distribute.use-ratio" }] },
      { context: "리본 48 m를 빨강과 파랑에 3:5로 나눕니다.", prompt: "파랑 리본은 몇 m인가요?", correct: "30 m", wrong: [{ label: "9.6 m", misconceptionId: "prop.distribute.divide-one" }, { label: "5 m", misconceptionId: "prop.distribute.use-ratio" }] }
    ]
  },
  {
    id: "prop.application", unitId: "proportion", title: "비례배분을 생활 상황에 적용하기", shortTitle: "비례배분을 적용함", anchorIds: ["[6수02-05]"], prerequisiteStageIds: ["prop.distribute", "prop.missing"],
    mistakes: [
      { id: "prop.application.equal", title: "비와 관계없이 똑같이 나눔", derivation: "주어진 기여도나 비를 무시하고 전체를 사람 수로 똑같이 나눈다.", rationale: "각 몫은 주어진 비에 맞게 달라져야 합니다." },
      { id: "prop.application.reverse", title: "큰 비와 작은 몫을 연결함", derivation: "비의 순서를 거꾸로 연결하여 큰 비를 가진 쪽에 작은 몫을 준다.", rationale: "상황에 나온 대상 순서와 비의 항 순서를 먼저 대응합니다." }
    ],
    cases: [
      { context: "두 사람이 3:2로 일하고 받은 50,000원을 나눕니다.", prompt: "더 많이 일한 사람의 몫은 얼마인가요?", correct: "30,000원", wrong: [{ label: "25,000원", misconceptionId: "prop.application.equal" }, { label: "20,000원", misconceptionId: "prop.application.reverse" }] },
      { context: "두 반의 학생 수 비가 4:5이고 간식이 180개입니다.", prompt: "학생이 더 많은 반은 몇 개를 받나요?", correct: "100개", wrong: [{ label: "90개", misconceptionId: "prop.application.equal" }, { label: "80개", misconceptionId: "prop.application.reverse" }] }
    ]
  },

  {
    id: "circle.pi", unitId: "circle-measure", title: "원주율의 뜻 이해하기", shortTitle: "원주율을 이해함", anchorIds: ["[6수03-15]"],
    mistakes: [
      { id: "circle.pi.radius", title: "원주를 반지름으로 나눔", derivation: "지름 대신 반지름을 기준으로 원주율을 계산한다.", rationale: "원주율은 원주를 지름으로 나눈 값입니다." },
      { id: "circle.pi.difference", title: "원주와 지름의 차를 구함", derivation: "두 길이의 비가 아니라 원주에서 지름을 뺀다.", rationale: "원주율은 길이의 차가 아니라 원주÷지름의 몫입니다." }
    ],
    cases: [
      { context: "원주가 31.4 cm, 지름이 10 cm인 원입니다.", prompt: "원주율은 얼마인가요?", correct: "3.14", wrong: [{ label: "6.28", misconceptionId: "circle.pi.radius" }, { label: "21.4", misconceptionId: "circle.pi.difference" }] },
      { context: "원주 62.8 cm, 반지름 10 cm인 원을 살펴봅니다.", prompt: "원주를 지름으로 나눈 값은 얼마인가요?", correct: "3.14", wrong: [{ label: "6.28", misconceptionId: "circle.pi.radius" }, { label: "42.8", misconceptionId: "circle.pi.difference" }] }
    ]
  },
  {
    id: "circle.circumference", unitId: "circle-measure", title: "원의 둘레 구하기", shortTitle: "원주를 구함", anchorIds: ["[6수03-15]"], prerequisiteStageIds: ["circle.pi"],
    mistakes: [
      { id: "circle.circumference.use-radius", title: "반지름에 원주율만 곱함", derivation: "지름을 구하지 않고 반지름에 원주율을 한 번만 곱한다.", rationale: "원주는 지름×원주율, 또는 반지름×2×원주율입니다." },
      { id: "circle.circumference.area", title: "원의 넓이 공식을 사용함", derivation: "둘레를 묻는데 반지름×반지름×원주율로 계산한다.", rationale: "테두리 길이는 원주 공식으로 구하고 제곱 단위를 쓰지 않습니다." }
    ],
    cases: [
      { context: "반지름이 5 cm인 원입니다. 원주율은 3.14로 계산합니다.", prompt: "원의 둘레는 몇 cm인가요?", correct: "31.4 cm", wrong: [{ label: "15.7 cm", misconceptionId: "circle.circumference.use-radius" }, { label: "78.5 cm²", misconceptionId: "circle.circumference.area" }], visual: { kind: "circle", mode: "radius", radiusValue: 5, showCenter: true, showRadius: true } },
      { context: "지름이 20 m인 원 모양 화단입니다. 원주율은 3.14입니다.", prompt: "화단의 둘레는 몇 m인가요?", correct: "62.8 m", wrong: [{ label: "31.4 m", misconceptionId: "circle.circumference.use-radius" }, { label: "314 m²", misconceptionId: "circle.circumference.area" }], visual: { kind: "circle", mode: "diameter", diameterValue: 20, measurementUnit: "m", showCenter: true, showDiameter: true } }
    ]
  },
  {
    id: "circle.find-diameter", unitId: "circle-measure", title: "원주로 지름과 반지름 구하기", shortTitle: "원주에서 지름을 구함", anchorIds: ["[6수03-15]"], prerequisiteStageIds: ["circle.circumference"],
    mistakes: [
      { id: "circle.find-diameter.multiply", title: "원주에 원주율을 곱함", derivation: "원주에서 지름을 구하면서 나누지 않고 원주율을 곱한다.", rationale: "지름은 원주를 원주율로 나누어 구합니다." },
      { id: "circle.find-diameter.confuse-radius", title: "지름과 반지름을 바꾸어 답함", derivation: "원주÷원주율로 지름을 구한 뒤, 묻는 것이 지름인지 반지름인지 확인하지 않고 2로 나누거나 그대로 답한다.", rationale: "지름을 물으면 원주÷원주율 값을 쓰고, 반지름을 물으면 그 지름을 다시 2로 나눕니다." }
    ],
    cases: [
      { context: "원주가 37.68 cm이고 원주율은 3.14입니다.", prompt: "지름은 몇 cm인가요?", correct: "12 cm", wrong: [{ label: "118.3152 cm", misconceptionId: "circle.find-diameter.multiply" }, { label: "6 cm", misconceptionId: "circle.find-diameter.confuse-radius", derivation: "37.68÷3.14=12로 지름을 구하고도 지름을 묻는 문항에서 다시 2로 나누어 6 cm를 답한다." }] },
      { context: "원주가 62.8 m인 원 모양 트랙입니다.", prompt: "반지름은 몇 m인가요?", correct: "10 m", wrong: [{ label: "197.192 m", misconceptionId: "circle.find-diameter.multiply" }, { label: "20 m", misconceptionId: "circle.find-diameter.confuse-radius", derivation: "62.8÷3.14=20으로 지름을 구한 뒤 반지름을 묻는데도 2로 나누지 않고 20 m를 답한다." }] }
    ]
  },
  {
    id: "circle.area", unitId: "circle-measure", title: "원의 넓이 구하기", shortTitle: "원의 넓이를 구함", anchorIds: ["[6수03-16]"], prerequisiteStageIds: ["circle.pi"],
    mistakes: [
      { id: "circle.area.no-square", title: "반지름을 한 번만 곱함", derivation: "반지름×원주율로 계산해 반지름을 두 번 곱하지 않는다.", rationale: "원의 넓이는 반지름×반지름×원주율입니다." },
      { id: "circle.area.use-diameter", title: "지름을 두 번 곱함", derivation: "반지름 대신 지름을 제곱해 넓이를 네 배로 만든다.", rationale: "지름이 주어지면 먼저 2로 나누어 반지름을 구합니다." }
    ],
    cases: [
      { context: "반지름이 4 cm인 원입니다. 원주율은 3.14입니다.", prompt: "원의 넓이는 몇 cm²인가요?", correct: "50.24 cm²", wrong: [{ label: "12.56 cm²", misconceptionId: "circle.area.no-square" }, { label: "200.96 cm²", misconceptionId: "circle.area.use-diameter" }], visual: { kind: "circle", mode: "radius", radiusValue: 4, showCenter: true, showRadius: true } },
      { context: "지름이 10 m인 원 모양 잔디밭입니다.", prompt: "잔디밭의 넓이는 몇 m²인가요?", correct: "78.5 m²", wrong: [{ label: "15.7 m²", misconceptionId: "circle.area.no-square" }, { label: "314 m²", misconceptionId: "circle.area.use-diameter" }], visual: { kind: "circle", mode: "diameter", diameterValue: 10, measurementUnit: "m", showCenter: true, showDiameter: true } }
    ]
  },
  {
    id: "circle.application", unitId: "circle-measure", title: "원주와 넓이를 상황에 맞게 구별하기", shortTitle: "원주와 넓이를 구별해 적용함", anchorIds: ["[6수03-15]", "[6수03-16]"], prerequisiteStageIds: ["circle.circumference", "circle.area"],
    mistakes: [
      { id: "circle.application.swap", title: "둘레와 넓이 공식을 바꿈", derivation: "테두리에는 넓이 공식을, 채우는 면에는 원주 공식을 적용한다.", rationale: "경계 길이는 원주, 안쪽 면의 크기는 넓이로 구별합니다." },
      { id: "circle.application.unit", title: "길이와 넓이 단위를 혼동함", derivation: "계산값이 맞아도 둘레에 제곱 단위 또는 넓이에 길이 단위를 쓴다.", rationale: "둘레는 cm, m이고 넓이는 cm², m²로 나타냅니다." }
    ],
    cases: [
      { context: "반지름 3 m인 원형 화단 가장자리에 울타리를 두릅니다.", prompt: "원주율 3.14일 때 필요한 울타리 길이는 얼마인가요?", correct: "18.84 m", wrong: [{ label: "28.26 m²", misconceptionId: "circle.application.swap" }, { label: "18.84 m²", misconceptionId: "circle.application.unit" }] },
      { context: "지름 8 cm인 원판 한 면을 색칠합니다.", prompt: "원주율 3.14일 때 색칠한 넓이는 얼마인가요?", correct: "50.24 cm²", wrong: [{ label: "25.12 cm", misconceptionId: "circle.application.swap" }, { label: "50.24 cm", misconceptionId: "circle.application.unit" }] }
    ]
  },

  {
    id: "round-solids.identify", unitId: "cylinder-cone-sphere", title: "원기둥·원뿔·구 구별하기", shortTitle: "둥근 입체도형을 구별함", anchorIds: ["[6수03-07]"],
    mistakes: [
      { id: "round-solids.identify.base-count", title: "평평한 원 모양 밑면 수를 잘못 판단함", derivation: "평평한 원 모양 밑면이 한 개인지 두 개인지 또는 없는지를 바꾸어 분류한다.", rationale: "원기둥은 원 모양 밑면 두 개, 원뿔은 밑면 하나, 구는 평평한 밑면이 없습니다." },
      { id: "round-solids.identify.structure", title: "평평한 면과 꼭짓점 구조를 확인하지 않음", derivation: "굽은 면만 보고 평평한 면과 꼭짓점의 유무를 확인하지 않은 채 다른 도형으로 분류한다.", rationale: "밑면 수와 꼭짓점 유무를 함께 살펴 원기둥·원뿔·구를 구별합니다." }
    ],
    cases: [
      { context: "합동인 원 두 개가 평행하게 마주 보는 입체도형입니다.", prompt: "이 도형의 이름은 무엇인가요?", correct: "원기둥", wrong: [{ label: "원뿔", misconceptionId: "round-solids.identify.base-count" }, { label: "구", misconceptionId: "round-solids.identify.structure" }], visual: { kind: "solid-diagram", mode: "structure", shape: "cylinder" } },
      { context: "어느 방향에서 보아도 원 모양이고 평평한 면이 없습니다.", prompt: "알맞은 입체도형을 고르세요.", correct: "구", wrong: [{ label: "원기둥", misconceptionId: "round-solids.identify.base-count" }, { label: "원뿔", misconceptionId: "round-solids.identify.structure" }], visual: { kind: "solid-diagram", mode: "structure", shape: "sphere" } }
    ]
  },
  {
    id: "round-solids.cylinder-elements", unitId: "cylinder-cone-sphere", title: "원기둥의 구성 요소와 성질 알기", shortTitle: "원기둥의 구성 요소를 앎", anchorIds: ["[6수03-07]"], prerequisiteStageIds: ["round-solids.identify"],
    mistakes: [
      { id: "round-solids.cylinder-elements.one-base", title: "원기둥의 밑면을 하나만 셈", derivation: "바닥에 놓인 원 하나만 밑면으로 생각한다.", rationale: "원기둥에는 서로 평행하고 합동인 원 모양 밑면이 두 개 있습니다." },
      { id: "round-solids.cylinder-elements.vertex", title: "곡선 경계를 꼭짓점으로 셈", derivation: "밑면의 원과 옆면이 만나는 둥근 경계에 꼭짓점이 있다고 본다.", rationale: "원기둥에는 뾰족하게 만나는 꼭짓점이 없습니다." }
    ],
    cases: [
      { context: "원기둥의 원 모양 밑면과 뾰족한 꼭짓점을 함께 셉니다.", prompt: "밑면 수와 꼭짓점 수를 바르게 짝지은 것은 무엇인가요?", correct: "밑면 2개, 꼭짓점 0개", wrong: [{ label: "밑면 1개, 꼭짓점 0개", misconceptionId: "round-solids.cylinder-elements.one-base" }, { label: "밑면 2개, 꼭짓점 2개", misconceptionId: "round-solids.cylinder-elements.vertex" }], visual: { kind: "solid-diagram", mode: "structure", shape: "cylinder" } },
      { context: "캔 모양 원기둥의 위아래 면과 뾰족한 점을 확인합니다.", prompt: "구성 요소를 바르게 나타낸 것을 고르세요.", correct: "밑면 2개, 꼭짓점 0개", wrong: [{ label: "밑면 1개, 꼭짓점 0개", misconceptionId: "round-solids.cylinder-elements.one-base" }, { label: "밑면 2개, 꼭짓점 2개", misconceptionId: "round-solids.cylinder-elements.vertex" }], visual: { kind: "solid-diagram", mode: "structure", shape: "cylinder" } }
    ]
  },
  {
    id: "round-solids.cone-elements", unitId: "cylinder-cone-sphere", title: "원뿔의 구성 요소와 성질 알기", shortTitle: "원뿔의 구성 요소를 앎", anchorIds: ["[6수03-07]"], prerequisiteStageIds: ["round-solids.identify"],
    mistakes: [
      { id: "round-solids.cone-elements.two-bases", title: "원뿔의 밑면을 두 개로 셈", derivation: "원기둥처럼 위쪽에도 원 모양 밑면이 있다고 생각한다.", rationale: "원뿔은 원 모양 밑면이 하나이고 옆면이 한 꼭짓점으로 모입니다." },
      { id: "round-solids.cone-elements.no-vertex", title: "원뿔의 꼭짓점을 세지 않음", derivation: "둥근 입체도형에는 꼭짓점이 없다고 모두 같은 성질로 판단한다.", rationale: "원뿔의 옆면이 모이는 뾰족한 점 하나가 꼭짓점입니다." }
    ],
    cases: [
      { context: "원뿔의 평평한 원 모양 밑면과 옆면이 모이는 점을 함께 셉니다.", prompt: "밑면 수와 꼭짓점 수를 바르게 짝지은 것은 무엇인가요?", correct: "밑면 1개, 꼭짓점 1개", wrong: [{ label: "밑면 2개, 꼭짓점 1개", misconceptionId: "round-solids.cone-elements.two-bases" }, { label: "밑면 1개, 꼭짓점 0개", misconceptionId: "round-solids.cone-elements.no-vertex" }], visual: { kind: "solid-diagram", mode: "structure", shape: "cone" } },
      { context: "고깔 모양 원뿔의 바닥 면과 뾰족한 점을 확인합니다.", prompt: "구성 요소를 바르게 나타낸 것을 고르세요.", correct: "밑면 1개, 꼭짓점 1개", wrong: [{ label: "밑면 2개, 꼭짓점 1개", misconceptionId: "round-solids.cone-elements.two-bases" }, { label: "밑면 1개, 꼭짓점 0개", misconceptionId: "round-solids.cone-elements.no-vertex" }], visual: { kind: "solid-diagram", mode: "structure", shape: "cone" } }
    ]
  },
  {
    id: "round-solids.sphere", unitId: "cylinder-cone-sphere", title: "구의 성질 이해하기", shortTitle: "구의 성질을 이해함", anchorIds: ["[6수03-07]"], prerequisiteStageIds: ["round-solids.identify"],
    mistakes: [
      { id: "round-solids.sphere.circle-base", title: "보이는 원을 구의 밑면으로 판단함", derivation: "평면 그림의 원 윤곽을 실제 입체의 평평한 면으로 생각한다.", rationale: "구는 하나의 굽은 면으로 이루어지고 평평한 밑면이 없습니다." },
      { id: "round-solids.sphere.cylinder", title: "구를 원기둥처럼 평평한 면이 있는 도형으로 판단함", derivation: "구를 원기둥처럼 생각해 평평한 면 두 개와 옆에서 본 직사각형이 있다고 판단한다.", rationale: "구는 평평한 면이 없고 어느 방향에서 보아도 원 모양으로 보입니다." }
    ],
    cases: [
      { context: "구의 평평한 면 수와 여러 방향에서 보이는 모양을 함께 살펴봅니다.", prompt: "구의 성질을 바르게 나타낸 것은 무엇인가요?", correct: "평평한 면 0개, 어느 방향에서도 원 모양", wrong: [{ label: "평평한 면 1개, 위에서만 원 모양", misconceptionId: "round-solids.sphere.circle-base" }, { label: "평평한 면 2개, 옆에서는 직사각형", misconceptionId: "round-solids.sphere.cylinder" }], visual: { kind: "solid-diagram", mode: "structure", shape: "sphere" } },
      { context: "공 모양의 구를 돌려 보며 겉면과 보이는 모양을 확인합니다.", prompt: "알맞게 설명한 것을 고르세요.", correct: "평평한 면 0개, 어느 방향에서도 원 모양", wrong: [{ label: "평평한 면 1개, 한쪽에서만 원 모양", misconceptionId: "round-solids.sphere.circle-base" }, { label: "평평한 면 2개, 앞에서는 직사각형", misconceptionId: "round-solids.sphere.cylinder" }] }
    ]
  },
  {
    id: "round-solids.nets", unitId: "cylinder-cone-sphere", title: "원기둥과 원뿔의 전개도 이해하기", shortTitle: "둥근 입체도형의 전개도를 이해함", anchorIds: ["[6수03-08]"], prerequisiteStageIds: ["round-solids.cylinder-elements", "round-solids.cone-elements"],
    mistakes: [
      { id: "round-solids.nets.flat-faces", title: "필요한 밑면 수를 확인하지 않음", derivation: "입체도형의 밑면 개수와 전개도의 원 개수를 맞추지 않는다.", rationale: "원기둥에는 원 두 개, 원뿔에는 원 한 개가 밑면으로 필요합니다." },
      { id: "round-solids.nets.sphere", title: "구도 잘라서 전개도로 만들 수 있다고 판단함", derivation: "평평하게 펼칠 수 없는 구의 굽은 겉면도 전개도로 만들 수 있다고 생각한다.", rationale: "구의 겉면은 평면에 겹치거나 늘어나지 않게 펼칠 수 없습니다." }
    ],
    cases: [
      { context: "직사각형 한 개와 합동인 원 두 개로 된 전개도입니다.", prompt: "만들어지는 입체도형은 무엇인가요?", correct: "원기둥", wrong: [{ label: "원뿔", misconceptionId: "round-solids.nets.flat-faces" }, { label: "구", misconceptionId: "round-solids.nets.sphere" }], visual: { kind: "solid-diagram", mode: "net", shape: "cylinder" } },
      { context: "부채꼴 한 개와 원 한 개로 된 전개도를 접습니다.", prompt: "만들어지는 도형을 고르세요.", correct: "원뿔", wrong: [{ label: "원기둥", misconceptionId: "round-solids.nets.flat-faces" }, { label: "구", misconceptionId: "round-solids.nets.sphere" }], visual: { kind: "solid-diagram", mode: "net", shape: "cone" } }
    ]
  }
];

const artifacts = buildUpperGradeSemester({
  id: "grade6-semester2",
  version: "1.0.0",
  grade: 6,
  semester: 2,
  title: "6학년 2학기 수학 생각 지도",
  shortTitle: "6-2 수학 생각 지도",
  blueprintRevision: "2026-08-01.1",
  anchors: [
    ["[6수01-11]", "분수의 나눗셈 원리를 이해하고 계산하기"],
    ["[6수03-09]", "쌓기나무로 만든 입체도형을 여러 방향에서 보기"],
    ["[6수03-10]", "쌓기나무 모양을 추측하고 필요한 개수 구하기"],
    ["[6수01-15]", "소수의 나눗셈 원리를 이해하고 계산하기"],
    ["[6수02-04]", "비의 성질과 비례식의 성질 이해하기"],
    ["[6수02-05]", "비례배분하고 문제 해결하기"],
    ["[6수03-15]", "원주와 원주율의 관계 이해하기"],
    ["[6수03-16]", "원의 넓이 구하기"],
    ["[6수03-07]", "원기둥·원뿔·구와 구성 요소 이해하기"],
    ["[6수03-08]", "원기둥과 원뿔의 전개도 이해하기"]
  ].map(([id, label]) => ({ id, label, source: SOURCE })),
  units: [
    { id: "fraction-division", title: "분수의 나눗셈" },
    { id: "space-solids", title: "공간과 입체" },
    { id: "decimal-division", title: "소수의 나눗셈" },
    { id: "proportion", title: "비례식과 비례배분" },
    { id: "circle-measure", title: "원의 둘레와 넓이" },
    { id: "cylinder-cone-sphere", title: "원기둥, 원뿔, 구" }
  ],
  stages: buildPairedStages("g6s2", stageInputs)
});

export const grade6Semester2Diagnosis = artifacts.diagnosis;
export const grade6Semester2CoverageBlueprint = artifacts.coverageBlueprint;
export const grade6Semester2DistractorRationales = artifacts.distractorRationales;
export const grade6Semester2MisconceptionTitles = artifacts.misconceptionTitles;
