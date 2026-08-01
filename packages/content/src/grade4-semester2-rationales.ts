import type { DistractorRationale } from "./coverage";

type StageRationale = {
  stageId: string;
  titleA: string;
  titleB: string;
  sharedSignalRationale: string;
  entries: Array<{
    judgmentId: string;
    choiceA: string;
    misconceptionA: "a" | "b";
    derivationA: string;
    rationaleA: string;
    choiceB: string;
    misconceptionB: "a" | "b";
    derivationB: string;
    rationaleB: string;
  }>;
};

const stages: StageRationale[] = [
  {
    stageId: "triangles.classify-isosceles",
    titleA: "같은 두 변을 세 변 모두 같다고 봄",
    titleB: "같은 길이인 두 변을 놓침",
    sharedSignalRationale: "세 변의 길이 중 같은 값이 몇 개인지 구분하는 근거를 함께 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-tri-01",
        choiceA: "equilateral-558",
        misconceptionA: "a",
        derivationA: "5 cm인 변 두 개를 보고 3개 모두 5 cm라고 넓혀 생각한다.",
        rationaleA: "같은 두 변을 찾았지만 세 번째 8 cm까지 같은지 확인하지 않았습니다.",
        choiceB: "scalene-558",
        misconceptionB: "b",
        derivationB: "5, 5, 8에서 8만 다르다는 점에 주목해 세 값이 모두 다르다고 판단한다.",
        rationaleB: "5 cm인 변이 두 개라는 반복을 놓쳤습니다."
      },
      {
        judgmentId: "g4s2-tri-02",
        choiceA: "equilateral-994",
        misconceptionA: "a",
        derivationA: "9 cm인 변 두 개를 보고 4 cm인 변도 9 cm라고 간주한다.",
        rationaleA: "같은 두 변과 세 변 모두 같음을 구분하지 않았습니다.",
        choiceB: "scalene-994",
        misconceptionB: "b",
        derivationB: "9, 9, 4에서 모양이 기울어진 것에 의존해 세 길이가 다르다고 본다.",
        rationaleB: "두 변에 적힌 9 cm를 서로 비교하지 않았습니다."
      }
    ]
  },
  {
    stageId: "triangles.classify-equilateral",
    titleA: "같은 변을 두 개만 확인함",
    titleB: "세 변의 같은 길이 표시를 놓침",
    sharedSignalRationale: "세 변을 빠짐없이 비교했는지와 같은 표시를 읽었는지를 나누어 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-tri-03",
        choiceA: "only-two-equal-666",
        misconceptionA: "a",
        derivationA: "6 cm와 6 cm 한 쌍만 비교하고 남은 6 cm는 확인하지 않는다.",
        rationaleA: "같은 길이인 변 세 개 중 두 개만 확인했습니다.",
        choiceB: "scalene-666",
        misconceptionB: "b",
        derivationB: "6, 6, 6의 반복을 읽지 않고 세 변이 서로 다르다고 판단한다.",
        rationaleB: "세 변에 적힌 길이가 모두 6 cm임을 연결하지 않았습니다."
      },
      {
        judgmentId: "g4s2-tri-04",
        choiceA: "only-two-equal-888",
        misconceptionA: "a",
        derivationA: "8 cm인 첫째와 둘째 변만 비교하고 셋째 8 cm를 확인 대상에서 뺀다.",
        rationaleA: "세 번째 변까지 같은지 확인하는 순서가 빠졌습니다.",
        choiceB: "scalene-888",
        misconceptionB: "b",
        derivationB: "8 cm가 3번 표시되어 있어도 변의 방향이 다르다는 이유로 길이도 다르다고 본다.",
        rationaleB: "변의 방향과 변의 길이를 같은 기준으로 보았습니다."
      }
    ]
  },
  {
    stageId: "triangles.isosceles-equal-angles",
    titleA: "180도에서 주어진 각을 한 번만 뺌",
    titleB: "주어진 한 각을 같은 두 각의 합으로 봄",
    sharedSignalRationale: "같은 눈금이 있는 두 변의 맞은편 각이 서로 같다는 성질을 적용했는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-tri-05",
        choiceA: "angle-110",
        misconceptionA: "a",
        derivationA: "180°-70°=110°를 계산하여 나머지 두 각의 합을 ㉠ 한 각의 크기로 적는다.",
        rationaleA: "같은 눈금이 있는 두 변의 맞은편 각은 서로 같으므로 ㉠도 주어진 각과 같은 70°입니다.",
        choiceB: "angle-35",
        misconceptionB: "b",
        derivationB: "주어진 70°를 같은 두 각의 합으로 보고 70°÷2=35°로 계산한다.",
        rationaleB: "70°는 두 각을 합한 값이 아니라 그림에 표시된 한 각의 크기입니다."
      },
      {
        judgmentId: "g4s2-tri-06",
        choiceA: "angle-116",
        misconceptionA: "a",
        derivationA: "180°-64°=116°를 계산하여 나머지 두 각의 합을 ㉠ 한 각의 크기로 적는다.",
        rationaleA: "눈금 표시가 같은 두 변의 맞은편 각은 서로 같으므로 ㉠도 64°입니다.",
        choiceB: "angle-32",
        misconceptionB: "b",
        derivationB: "주어진 64°를 같은 두 각의 합으로 보고 64°÷2=32°로 계산한다.",
        rationaleB: "64°는 그림에 보이는 한 각의 크기이며 두 각을 합한 값이 아닙니다."
      }
    ]
  },
  {
    stageId: "triangles.classify-right",
    titleA: "90도를 예각으로 분류함",
    titleB: "90도를 둔각으로 분류함",
    sharedSignalRationale: "90도가 직각이라는 경계를 어느 쪽으로 분류했는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-tri-07",
        choiceA: "acute-355590",
        misconceptionA: "a",
        derivationA: "35°와 55°가 예각이라는 이유로 90°까지 예각으로 묶는다.",
        rationaleA: "세 각 중 하나가 정확히 90°이면 직각이 있는 삼각형입니다.",
        choiceB: "obtuse-355590",
        misconceptionB: "b",
        derivationB: "90°를 직각보다 큰 각으로 보고 둔각으로 분류한다.",
        rationaleB: "90°는 직각보다 큰 각이 아니라 직각 그 자체입니다."
      },
      {
        judgmentId: "g4s2-tri-08",
        choiceA: "acute-2565",
        misconceptionA: "a",
        derivationA: "25°와 65°가 예각이라는 이유로 표시된 90°까지 예각으로 묶는다.",
        rationaleA: "도형의 방향과 관계없이 90°인 각이 하나 있으면 직각삼각형입니다.",
        choiceB: "obtuse-2565",
        misconceptionB: "b",
        derivationB: "기울어진 모양을 보고 표시된 90°를 직각보다 큰 각으로 판단한다.",
        rationaleB: "도형을 돌려 놓아도 표시한 90°는 직각의 기준입니다."
      }
    ]
  },
  {
    stageId: "triangles.classify-acute-obtuse",
    titleA: "직각과의 크기 비교 방향을 바꿈",
    titleB: "가장 큰 각을 모두 직각으로 봄",
    sharedSignalRationale: "가장 큰 각을 찾았는지와 그 각을 90도와 어느 방향으로 비교했는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-tri-09",
        choiceA: "obtuse-406080",
        misconceptionA: "a",
        derivationA: "가장 큰 각 80°를 90°보다 크다고 반대로 비교한다.",
        rationaleA: "80°는 직각보다 작으므로 세 각이 모두 예각입니다.",
        choiceB: "right-406080",
        misconceptionB: "b",
        derivationB: "가장 큰 각이라는 이유만으로 80°를 90°로 바꾸어 본다.",
        rationaleB: "가장 큰 각도 실제로 90°인지 수치를 확인해야 합니다."
      },
      {
        judgmentId: "g4s2-tri-10",
        choiceA: "acute-3040110",
        misconceptionA: "a",
        derivationA: "가장 큰 각 110°를 90°보다 작다고 반대로 비교한다.",
        rationaleA: "110°는 직각보다 크므로 둔각이 하나 있습니다.",
        choiceB: "right-3040110",
        misconceptionB: "b",
        derivationB: "가장 큰 각 110°를 직각 90°와 같은 값으로 간주한다.",
        rationaleB: "110°와 90°의 차이 20°를 비교에서 반영하지 않았습니다."
      }
    ]
  },
  {
    stageId: "frac-ops.add-same-denominator",
    titleA: "분자와 분모를 함께 더해 버림",
    titleB: "덧셈을 뺄셈으로 바꾸어 계산함",
    sharedSignalRationale: "같은 분모를 유지했는지와 분자에 알맞은 연산을 했는지를 나누어 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-frac-01",
        choiceA: "five-fourteenths-237",
        misconceptionA: "a",
        derivationA: "2+3=5와 7+7=14를 각각 계산하여 5/14로 나타낸다.",
        rationaleA: "같은 크기의 조각을 더할 때 전체를 나눈 수는 바뀌지 않습니다.",
        choiceB: "one-seventh-237",
        misconceptionB: "b",
        derivationB: "3-2=1로 계산하여 덧셈식을 1/7로 바꾼다.",
        rationaleB: "두 양을 합하는 식이므로 분자에는 덧셈을 적용해야 합니다."
      },
      {
        judgmentId: "g4s2-frac-02",
        choiceA: "eight-eighteenths-359",
        misconceptionA: "a",
        derivationA: "3+5=8과 9+9=18을 함께 계산하여 8/18 L로 나타낸다.",
        rationaleA: "오전과 오후의 주스는 같은 크기인 아홉 등분 조각으로 더합니다.",
        choiceB: "two-ninths-359",
        misconceptionB: "b",
        derivationB: "5-3=2로 계산하여 마신 양의 합을 2/9 L로 나타낸다.",
        rationaleB: "모두 마신 양을 묻고 있으므로 두 분자를 더해야 합니다."
      }
    ]
  },
  {
    stageId: "frac-ops.sum-to-mixed",
    titleA: "몫과 나머지의 자리를 바꾸어 적음",
    titleB: "합을 구하며 분모까지 더해 버림",
    sharedSignalRationale: "분수의 합을 먼저 구했는지와 몫·나머지를 대분수의 알맞은 자리에 놓았는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-frac-03",
        choiceA: "three-and-one-sixth-546",
        misconceptionA: "a",
        derivationA: "9÷6=1…3에서 나머지 3을 자연수 부분에, 몫 1을 분자에 놓는다.",
        rationaleA: "몫은 자연수 부분에 쓰고 나머지는 원래 분모 위에 써야 합니다.",
        choiceB: "nine-twelfths-546",
        misconceptionB: "b",
        derivationB: "5+4=9와 6+6=12를 계산하여 합을 9/12로 나타낸다.",
        rationaleB: "같은 크기의 여섯 등분 조각을 더하므로 분모 6은 유지됩니다."
      },
      {
        judgmentId: "g4s2-frac-04",
        choiceA: "three-and-one-eighth-568",
        misconceptionA: "a",
        derivationA: "11÷8=1…3에서 나머지 3과 몫 1의 위치를 바꾸어 3과 1/8 m로 적는다.",
        rationaleA: "한 묶음이 된 수는 자연수 부분이고 남은 세 조각이 분자가 됩니다.",
        choiceB: "eleven-sixteenths-568",
        misconceptionB: "b",
        derivationB: "5+6=11과 8+8=16을 계산하여 11/16 m로 나타낸다.",
        rationaleB: "두 리본은 모두 여덟 등분 조각이므로 조각의 크기는 그대로입니다."
      }
    ]
  },
  {
    stageId: "frac-ops.subtract-same-denominator",
    titleA: "분모를 두 배로 늘려 적음",
    titleB: "뺄셈을 덧셈으로 바꾸어 계산함",
    sharedSignalRationale: "같은 분모를 유지했는지와 두 분자 사이에 뺄셈을 적용했는지를 구분해 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-frac-05",
        choiceA: "three-eighteenths-859",
        misconceptionA: "a",
        derivationA: "8-5=3을 구한 뒤 9+9=18을 분모에 적어 3/18로 나타낸다.",
        rationaleA: "같은 아홉 등분 조각끼리 빼므로 분모를 더하지 않습니다.",
        choiceB: "thirteen-ninths-859",
        misconceptionB: "b",
        derivationB: "8+5=13으로 계산하여 뺄셈의 결과를 13/9로 나타낸다.",
        rationaleB: "처음 양에서 덜어 내는 식이므로 두 분자를 빼야 합니다."
      },
      {
        judgmentId: "g4s2-frac-06",
        choiceA: "three-twentieths-7410",
        misconceptionA: "a",
        derivationA: "7-4=3을 계산하고 10+10=20을 분모에 적어 3/20 kg으로 나타낸다.",
        rationaleA: "찰흙은 같은 열 등분 조각으로 재었으므로 분모 10을 유지합니다.",
        choiceB: "eleven-tenths-7410",
        misconceptionB: "b",
        derivationB: "7+4=11로 계산하여 사용하고 남은 양을 11/10 kg으로 나타낸다.",
        rationaleB: "사용한 양을 처음 양에서 빼야 남은 양을 구할 수 있습니다."
      }
    ]
  },
  {
    stageId: "frac-ops.whole-minus-fraction",
    titleA: "1을 단위분수 한 조각으로 해석함",
    titleB: "빼지 않고 두 수를 나란히 적음",
    sharedSignalRationale: "1을 주어진 분모의 가분수로 바꾸었는지와 그 뒤에 실제로 뺄셈을 했는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-frac-07",
        choiceA: "two-eighths-138",
        misconceptionA: "a",
        derivationA: "1을 1/8로 보고 3/8-1/8=2/8로 순서를 바꾸어 계산한다.",
        rationaleA: "1은 여덟 등분 조각 한 개가 아니라 8/8입니다.",
        choiceB: "one-and-three-eighths-138",
        misconceptionB: "b",
        derivationB: "1과 3/8을 계산하지 않고 이어 적어 1과 3/8로 나타낸다.",
        rationaleB: "1에서 세 조각을 덜어 낸 뒤 남은 조각 수를 구해야 합니다."
      },
      {
        judgmentId: "g4s2-frac-08",
        choiceA: "two-sevenths-137",
        misconceptionA: "a",
        derivationA: "1을 1/7로 보고 3/7-1/7=2/7 m로 순서를 바꾸어 계산한다.",
        rationaleA: "테이프 1 m 전체는 일곱 등분 조각 7/7 m입니다.",
        choiceB: "one-and-three-sevenths-137",
        misconceptionB: "b",
        derivationB: "1 m와 3/7 m를 빼지 않고 이어 적어 1과 3/7 m로 나타낸다.",
        rationaleB: "잘라 쓴 부분을 전체에서 덜어 내야 남은 길이가 됩니다."
      }
    ]
  },
  {
    stageId: "frac-ops.mixed-add",
    titleA: "분수 부분의 분모까지 더함",
    titleB: "자연수의 합을 분자에 넣음",
    sharedSignalRationale: "자연수 부분과 분수 부분을 나누어 더했는지와 같은 분모를 유지했는지 함께 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-frac-09",
        choiceA: "three-and-five-fourteenths-127237",
        misconceptionA: "a",
        derivationA: "1+2=3, 2+3=5, 7+7=14로 계산하여 3과 5/14로 나타낸다.",
        rationaleA: "분수 부분은 같은 일곱 등분 조각이므로 분모 7을 유지합니다.",
        choiceB: "eight-sevenths-127237",
        misconceptionB: "b",
        derivationB: "자연수 합 1+2=3과 분자 합 2+3=5를 다시 더해 8/7로 나타낸다.",
        rationaleB: "자연수 부분의 합은 분자에 넣지 않고 자연수 자리에 둡니다."
      },
      {
        judgmentId: "g4s2-frac-10",
        choiceA: "three-and-three-tenths-11225",
        misconceptionA: "a",
        derivationA: "1+2=3, 1+2=3, 5+5=10으로 계산하여 3과 3/10 L로 나타낸다.",
        rationaleA: "분수 부분은 같은 다섯 등분 조각이므로 분모 5를 유지합니다.",
        choiceB: "six-fifths-11225",
        misconceptionB: "b",
        derivationB: "자연수 합 1+2=3과 분자 합 1+2=3을 더해 6/5 L로 나타낸다.",
        rationaleB: "자연수 부분과 분수 부분은 각각의 자리에 나누어 적어야 합니다."
      }
    ]
  },
  {
    stageId: "quad.perpendicular-side",
    titleA: "만나기만 하면 수직이라고 봄",
    titleB: "기준 변과 만나지 않는 변을 고름",
    sharedSignalRationale: "기준 변을 먼저 찾고, 그 변과 직각 표시에서 만나는 변만 수직인 변으로 읽는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-quad-01",
        choiceA: "side-nd-touching-01",
        misconceptionA: "a",
        derivationA: "변 ㄱㄴ과 꼭짓점 ㄴ에서 만나지만 직각 표시가 없는 변 ㄴㄷ을 수직이라고 판단한다.",
        rationaleA: "두 변이 만나는 것만으로 수직이라고 할 수 없고, 만나는 각이 직각인지 확인해야 합니다.",
        choiceB: "side-dr-not-touching-01",
        misconceptionB: "b",
        derivationB: "변 ㄱㄴ과 만나지 않는 변 ㄷㄹ을 수직인 변이라고 판단한다.",
        rationaleB: "수직인 두 변은 서로 만나 직각을 이루어야 합니다."
      },
      {
        judgmentId: "g4s2-quad-02",
        choiceA: "side-dr-touching-02",
        misconceptionA: "a",
        derivationA: "변 ㄹㄱ과 꼭짓점 ㄹ에서 만나기만 한 변 ㄷㄹ도 수직이라고 판단한다.",
        rationaleA: "기준 변과 만나면서 직각 표시가 있는 변은 변 ㄱㄴ입니다.",
        choiceB: "side-nd-not-touching-02",
        misconceptionB: "b",
        derivationB: "변 ㄹㄱ과 만나지 않는 변 ㄴㄷ을 수직인 변이라고 판단한다.",
        rationaleB: "기준 변 ㄹㄱ과 실제로 만나면서 직각 표시가 있는 변을 찾아야 합니다."
      }
    ]
  },
  {
    stageId: "quad.parallel-side-distance",
    titleA: "기울어진 변의 길이를 거리로 읽음",
    titleB: "평행한 변 자체의 길이를 거리로 읽음",
    sharedSignalRationale: "두 평행한 변을 직각으로 잇는 선분의 길이와 사각형의 변 길이를 구분해 읽는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-quad-03",
        choiceA: "slanted-ten-03",
        misconceptionA: "a",
        derivationA: "두 평행한 변을 비스듬히 잇는 변 ㄱㄴ의 10 cm를 사이의 거리로 읽는다.",
        rationaleA: "평행한 두 변 사이의 거리는 두 변을 직각으로 잇는 8 cm 선분의 길이입니다.",
        choiceB: "parallel-fourteen-03",
        misconceptionB: "b",
        derivationB: "평행한 변 ㄴㄷ 자체의 길이 14 cm를 두 변 사이의 거리로 읽는다.",
        rationaleB: "변의 길이와 두 평행한 변 사이의 거리는 서로 다른 양입니다."
      },
      {
        judgmentId: "g4s2-quad-04",
        choiceA: "slanted-fifteen-04",
        misconceptionA: "a",
        derivationA: "기울어진 변 ㄷㄹ의 15 cm를 두 평행한 변 사이의 거리로 읽는다.",
        rationaleA: "기울어진 변이 아니라 두 평행한 변을 직각으로 잇는 12 cm 선분을 읽어야 합니다.",
        choiceB: "parallel-four-04",
        misconceptionB: "b",
        derivationB: "평행한 변 ㄹㄱ 자체의 길이 4 cm를 두 변 사이의 거리로 읽는다.",
        rationaleB: "평행한 변의 길이가 짧아도 두 변 사이의 거리는 수직인 선분으로 정합니다."
      }
    ]
  },
  {
    stageId: "quad.trapezoid-parallel-pair",
    titleA: "마주 보는 두 쌍이 모두 평행하다고 봄",
    titleB: "평행 화살표를 같은 길이 눈금으로 읽음",
    sharedSignalRationale: "마주 보는 변이라는 위치만 보지 않고 실제 화살표의 종류와 평행한 쌍의 수를 확인하는지 살펴야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-quad-05",
        choiceA: "parallelogram-05",
        misconceptionA: "a",
        derivationA: "마주 보는 변은 모두 평행하다고 가정하여 이 도형을 평행사변형이라고 판단한다.",
        rationaleA: "그림에는 같은 화살표가 있는 평행한 변이 한 쌍만 있습니다.",
        choiceB: "rhombus-05",
        misconceptionB: "b",
        derivationB: "두 변의 같은 화살표를 네 변의 길이가 같은 표시로 취급하고 마름모라고 판단한다.",
        rationaleB: "화살표는 평행 관계이고, 변의 길이가 같다는 눈금은 표시되어 있지 않습니다."
      },
      {
        judgmentId: "g4s2-quad-06",
        choiceA: "parallelogram-06",
        misconceptionA: "a",
        derivationA: "도형이 세로로 놓여 있다는 모양만 보고 마주 보는 두 쌍을 모두 평행한 관계라고 판단한다.",
        rationaleA: "도형을 돌려 놓아도 같은 화살표가 있는 평행한 변은 한 쌍입니다.",
        choiceB: "rhombus-06",
        misconceptionB: "b",
        derivationB: "세로인 두 변의 같은 화살표를 네 변이 같은 눈금으로 취급하고 마름모라고 판단한다.",
        rationaleB: "평행 표시와 같은 길이 표시는 모양과 뜻이 다릅니다."
      }
    ]
  },
  {
    stageId: "quad.rhombus-equal-sides",
    titleA: "네 변이 같으면 정사각형이라고 봄",
    titleB: "마주 보는 변만 같으면 직사각형이라고 봄",
    sharedSignalRationale: "네 변의 같은 눈금과 네 직각 조건을 따로 확인하여 마름모, 정사각형, 직사각형을 구분하는지 살펴야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-quad-07",
        choiceA: "square-07",
        misconceptionA: "a",
        derivationA: "네 변의 길이가 같다는 조건만으로 직각 표시가 없어도 정사각형이라고 판단한다.",
        rationaleA: "정사각형은 네 변이 같을 뿐 아니라 네 각이 모두 직각이어야 합니다.",
        choiceB: "rectangle-07",
        misconceptionB: "b",
        derivationB: "마주 보는 변끼리 같은 것으로만 묶고 직각 표시 없이도 직사각형이라고 판단한다.",
        rationaleB: "직사각형은 네 각이 모두 직각이라는 조건이 필요합니다."
      },
      {
        judgmentId: "g4s2-quad-08",
        choiceA: "square-08",
        misconceptionA: "a",
        derivationA: "길쭉한 모양에서도 네 변의 같은 눈금만 보고 정사각형이라고 판단한다.",
        rationaleA: "네 변이 같아도 직각 표시가 없으므로 정사각형으로 분류할 근거가 없습니다.",
        choiceB: "rectangle-08",
        misconceptionB: "b",
        derivationB: "네 변 중 마주 보는 쌍만 확인하고 네 직각 조건 없이 직사각형이라고 판단한다.",
        rationaleB: "네 변의 같은 눈금은 마름모의 조건이며 직사각형의 직각 조건과 다릅니다."
      }
    ]
  },
  {
    stageId: "quad.parallelogram-opposite-angle",
    titleA: "이웃한 각의 크기를 마주 보는 각으로 씀",
    titleB: "네 각을 모두 90도로 봄",
    sharedSignalRationale: "평행사변형에서 마주 보는 꼭짓점을 찾았는지와 모든 각이 직각이라고 가정하지 않았는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-quad-09",
        choiceA: "neighbor-one-ten-09",
        misconceptionA: "a",
        derivationA: "주어진 70°의 이웃한 각 180°-70°=110°를 마주 보는 ㉠의 크기로 쓴다.",
        rationaleA: "㉠은 70°와 마주 보는 각이므로 같은 70°입니다.",
        choiceB: "all-right-ninety-09",
        misconceptionB: "b",
        derivationB: "사각형 네 각의 합 360°를 4로 똑같이 나누어 360°÷4=90°로 계산한다.",
        rationaleB: "평행사변형의 네 각이 모두 같은 것은 아니며 마주 보는 두 각끼리 같습니다."
      },
      {
        judgmentId: "g4s2-quad-10",
        choiceA: "neighbor-sixty-five-10",
        misconceptionA: "a",
        derivationA: "주어진 115°의 이웃한 각 180°-115°=65°를 마주 보는 ㉠의 크기로 쓴다.",
        rationaleA: "㉠은 115°와 마주 보는 각이므로 같은 115°입니다.",
        choiceB: "all-right-ninety-10",
        misconceptionB: "b",
        derivationB: "사각형 네 각의 합을 모두 같은 각으로 나누어 360°÷4=90°로 계산한다.",
        rationaleB: "모든 평행사변형이 네 직각을 가지는 것은 아닙니다."
      }
    ]
  },
  {
    stageId: "decimal.read-write",
    titleA: "소수점 아래의 0을 건너뜀",
    titleB: "소수점을 오른쪽으로 한 자리 옮김",
    sharedSignalRationale: "소수점 아래의 빈 자리도 0으로 나타내는지와 소수점 위치를 그대로 지키는지를 나누어 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-dec-01",
        choiceA: "one-point-five-seven-01",
        misconceptionA: "a",
        derivationA: "1.057에서 소수 첫째 자리의 0을 지우고 뒤의 5와 7만 이어 1.57로 쓴다.",
        rationaleA: "영은 소수 첫째 자리를 나타내므로 숫자로 쓸 때도 그 자리에 0이 있어야 합니다.",
        choiceB: "ten-point-five-seven-01",
        misconceptionB: "b",
        derivationB: "1.057의 소수점을 오른쪽으로 한 자리 옮겨 10.57로 쓴다.",
        rationaleB: "읽어 준 소수점의 위치를 옮기면 수가 열 배로 달라집니다."
      },
      {
        judgmentId: "g4s2-dec-02",
        choiceA: "three-point-nine-02",
        misconceptionA: "a",
        derivationA: "3.009에서 소수점 뒤의 0 두 개를 건너뛰고 3과 9만 읽는다.",
        rationaleA: "소수점 아래의 0 두 개도 각각 소수 첫째 자리와 둘째 자리를 나타냅니다.",
        choiceB: "thirty-point-zero-nine-02",
        misconceptionB: "b",
        derivationB: "3.009의 소수점을 오른쪽으로 한 자리 옮긴 30.09처럼 읽는다.",
        rationaleB: "3 뒤에 바로 소수점이 있으므로 정수 부분은 삼십이 아니라 삼입니다."
      }
    ]
  },
  {
    stageId: "decimal.compose-place-value",
    titleA: "0.1과 0.01의 자리를 뒤바꿈",
    titleB: "각 개수를 한 자리 크게 나타냄",
    sharedSignalRationale: "0.1의 개수와 0.01의 개수를 각각 어느 자리에 놓았는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-dec-03",
        choiceA: "zero-point-four-three-03",
        misconceptionA: "a",
        derivationA: "0.1이 3개와 0.01이 4개를 반대 자리에 놓아 3×10+4=34 대신 4×10+3=43으로 나타낸다.",
        rationaleA: "0.1의 개수 3은 소수 첫째 자리에, 0.01의 개수 4는 둘째 자리에 놓아야 합니다.",
        choiceB: "three-point-four-03",
        misconceptionB: "b",
        derivationB: "34개의 0.01을 340개의 0.01처럼 한 자리 크게 나타내어 3.4로 쓴다.",
        rationaleB: "0.01이 34개이면 1보다 작은 0.34이고 3.4는 0.01이 340개인 수입니다."
      },
      {
        judgmentId: "g4s2-dec-04",
        choiceA: "zero-point-two-six-kilograms-04",
        misconceptionA: "a",
        derivationA: "0.1이 6개와 0.01이 2개를 반대 자리에 놓아 6×10+2=62 대신 2×10+6=26으로 나타낸다.",
        rationaleA: "0.1의 개수 6은 소수 첫째 자리에, 0.01의 개수 2는 둘째 자리에 놓아야 합니다.",
        choiceB: "six-point-two-kilograms-04",
        misconceptionB: "b",
        derivationB: "0.1이 6개와 0.01이 2개인 수를 각각 한 자리 크게 놓아 0.62 kg 대신 6.2 kg로 쓴다.",
        rationaleB: "0.1이 6개와 0.01이 2개인 무게는 0.62 kg이며 6.2 kg는 그 열 배입니다."
      }
    ]
  },
  {
    stageId: "decimal.compare",
    titleA: "소수점을 지우고 정수처럼 비교함",
    titleB: "정수 부분을 빼고 소수 부분만 비교함",
    sharedSignalRationale: "정수 부분부터 같은 자리끼리 차례로 비교했는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-dec-05",
        choiceA: "one-point-two-five-05",
        misconceptionA: "a",
        derivationA: "1.4, 1.25, 0.98에서 소수점을 지운 14, 125, 98을 비교해 125를 고른다.",
        rationaleA: "1.4를 1.40으로 나타내면 140개의 0.01이므로 125개의 0.01보다 큽니다.",
        choiceB: "zero-point-nine-eight-05",
        misconceptionB: "b",
        derivationB: "정수 부분을 빼고 소수점 뒤의 4, 25, 98만 비교해 98을 고른다.",
        rationaleB: "0.98은 정수 부분이 0이므로 정수 부분이 1인 두 수보다 작습니다."
      },
      {
        judgmentId: "g4s2-dec-06",
        choiceA: "nayeon-06",
        misconceptionA: "a",
        derivationA: "2.7 m, 2.65 m, 1.98 m의 소수점을 지운 27, 265, 198을 비교해 나연을 고른다.",
        rationaleA: "2.7 m를 2.70 m로 나타내면 2.65 m보다 0.05 m 더 깁니다.",
        choiceB: "junseo-06",
        misconceptionB: "b",
        derivationB: "정수 부분을 빼고 7, 65, 98만 비교해 소수 부분 숫자가 큰 준서를 고른다.",
        rationaleB: "준서의 기록은 정수 부분이 1이어서 정수 부분이 2인 두 기록보다 작습니다."
      }
    ]
  },
  {
    stageId: "decimal.add",
    titleA: "소수점 대신 오른쪽 끝을 맞추어 더함",
    titleB: "받아올림을 다음 자리에 더하지 않음",
    sharedSignalRationale: "소수점을 맞추어 같은 자리끼리 더했는지와 받아올림을 다음 자리에 반영했는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-dec-07",
        choiceA: "zero-point-five-two-07",
        misconceptionA: "a",
        derivationA: "0.7을 7, 0.45를 45로 보고 오른쪽 끝을 맞춰 7+45=52를 0.52로 쓴다.",
        rationaleA: "0.7은 0.70이므로 70개의 0.01과 45개의 0.01을 더해야 합니다.",
        choiceB: "zero-point-one-five-07",
        misconceptionB: "b",
        derivationB: "70+45=115에서 백의 자리로 올라간 1을 버리고 15만 남겨 0.15로 쓴다.",
        rationaleB: "0.1이 10개 모이면 1이 되므로 받아올린 1도 답에 포함해야 합니다."
      },
      {
        judgmentId: "g4s2-dec-08",
        choiceA: "zero-point-nine-one-liters-08",
        misconceptionA: "a",
        derivationA: "0.85를 85, 0.6을 6으로 보고 오른쪽 끝을 맞춰 85+6=91을 0.91 L로 쓴다.",
        rationaleA: "0.6 L는 0.60 L이므로 85개의 0.01과 60개의 0.01을 더해야 합니다.",
        choiceB: "zero-point-four-five-liters-08",
        misconceptionB: "b",
        derivationB: "85+60=145에서 100개의 0.01이 만든 1을 버리고 45만 남겨 0.45 L로 쓴다.",
        rationaleB: "합이 100개의 0.01을 넘으므로 받아올린 1 L를 함께 나타내야 합니다."
      }
    ]
  },
  {
    stageId: "decimal.subtract",
    titleA: "받아내림 없이 자리별 큰 수에서 작은 수를 뺌",
    titleB: "받아내림한 뒤 윗자리를 줄이지 않음",
    sharedSignalRationale: "받아내림이 필요한 자리에서 빌려 왔는지와 빌려 준 윗자리를 1만큼 줄였는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-dec-09",
        choiceA: "one-point-three-eight-09",
        misconceptionA: "a",
        derivationA: "1.50-0.28에서 자리마다 큰 숫자에서 작은 숫자를 빼 8-0=8, 5-2=3으로 1.38을 쓴다.",
        rationaleA: "소수 둘째 자리에서는 0에서 8을 바로 뺄 수 없으므로 받아내림이 필요합니다.",
        choiceB: "one-point-three-two-09",
        misconceptionB: "b",
        derivationB: "1.50-0.28에서 10-8=2로 계산한 뒤 빌려 준 5를 4로 줄이지 않고 5-2=3으로 계산한다.",
        rationaleB: "소수 둘째 자리에 1을 빌려 주면 소수 첫째 자리의 5는 4로 줄어듭니다."
      },
      {
        judgmentId: "g4s2-dec-10",
        choiceA: "two-point-four-five-meters-10",
        misconceptionA: "a",
        derivationA: "2.30-0.75에서 자리마다 큰 숫자에서 작은 숫자를 빼 5-0=5, 7-3=4로 2.45 m를 쓴다.",
        rationaleA: "0에서 5를 빼고 3에서 7을 빼려면 두 자리에서 차례로 받아내림해야 합니다.",
        choiceB: "two-point-six-five-meters-10",
        misconceptionB: "b",
        derivationB: "2.30-0.75에서 10-5=5와 13-7=6을 계산하면서 빌려 준 3과 2를 줄이지 않아 2.65 m를 쓴다.",
        rationaleB: "아래 자리로 1을 빌려 줄 때마다 빌려 준 윗자리는 1만큼 줄어야 합니다."
      }
    ]
  },
  {
    stageId: "polygon.identify-closed-straight",
    titleA: "굽은 선이 있어도 둘러싸이면 다각형이라고 봄",
    titleB: "끝이 열려 있어도 곧은 선이면 다각형이라고 봄",
    sharedSignalRationale: "다각형의 두 조건인 곧은 선과 완전히 둘러싸임을 각각 확인했는지 살펴야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-poly-01",
        choiceA: "curved-ga-01",
        misconceptionA: "a",
        derivationA: "가 도형이 닫혀 있다는 한 조건만 확인하고 굽은 선 한 곳을 곧은 변으로 취급한다.",
        rationaleA: "다각형은 모든 부분이 곧은 선이어야 하므로 굽은 선이 있는 가 도형은 다각형이 아닙니다.",
        choiceB: "open-da-01",
        misconceptionB: "b",
        derivationB: "다 도형의 선들이 곧다는 점만 확인하고 끝이 열린 모양도 다각형이라고 판단한다.",
        rationaleB: "곧은 선들이 이어져 모양을 완전히 둘러싸야 다각형입니다. 다 도형은 한 곳이 열려 있습니다."
      },
      {
        judgmentId: "g4s2-poly-02",
        choiceA: "open-ga-02",
        misconceptionA: "b",
        derivationA: "가 도형의 선분 수만 보고 시작점과 끝점이 이어지지 않아도 다각형이라고 판단한다.",
        rationaleA: "가 도형은 곧은 선으로 이루어졌지만 한 곳이 열려 있어 다각형이 아닙니다.",
        choiceB: "curved-na-02",
        misconceptionB: "a",
        derivationB: "나 도형이 둘러싸였다는 이유로 굽은 선이 포함되어도 다각형이라고 판단한다.",
        rationaleB: "나 도형에는 굽은 선이 있으므로 곧은 선으로만 둘러싸인 다각형의 조건에 맞지 않습니다."
      }
    ]
  },
  {
    stageId: "polygon.name-by-side-count",
    titleA: "오목하게 들어간 변 하나를 세지 않음",
    titleB: "한 변을 두 번 세어 변의 수를 하나 많게 셈",
    sharedSignalRationale: "한 꼭짓점에서 시작해 오목한 곳을 포함한 모든 변을 빠뜨리거나 겹치지 않게 한 번씩 세었는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-poly-03",
        choiceA: "pentagon-missed-notch-03",
        misconceptionA: "a",
        derivationA: "안쪽으로 들어간 꼭짓점의 양쪽 변 중 1개를 건너뛰어 6개인 변을 5개로 센다.",
        rationaleA: "들어간 곳의 두 변도 각각 한 변이므로 모두 세면 여섯 변인 육각형입니다.",
        choiceB: "heptagon-extra-corner-03",
        misconceptionB: "b",
        derivationB: "오목하게 꺾인 곳의 한 변을 앞뒤에서 두 번 세어 6개인 변을 7개라고 판단한다.",
        rationaleB: "시작한 꼭짓점으로 돌아올 때 같은 변을 다시 세지 않으면 모두 여섯 변인 육각형입니다."
      },
      {
        judgmentId: "g4s2-poly-04",
        choiceA: "quadrilateral-missed-notch-04",
        misconceptionA: "a",
        derivationA: "가운데 들어간 꼭짓점의 변 1개를 건너뛰어 5개인 변을 4개로 센다.",
        rationaleA: "안쪽 꼭짓점에서 방향이 바뀌므로 그 양쪽 선은 서로 다른 변입니다. 모두 다섯 변입니다.",
        choiceB: "hexagon-extra-corner-04",
        misconceptionB: "b",
        derivationB: "가운데 들어간 곳에서 같은 변을 두 번 세어 5개인 변을 6개라고 판단한다.",
        rationaleB: "한 변씩 따라가며 이미 센 변을 다시 세지 않으면 모두 다섯 변인 오각형입니다."
      }
    ]
  },
  {
    stageId: "polygon.regular-two-conditions",
    titleA: "모든 변만 같으면 정다각형이라고 봄",
    titleB: "모든 각만 같으면 정다각형이라고 봄",
    sharedSignalRationale: "정다각형은 모든 변의 길이와 모든 각의 크기가 각각 같아야 한다는 두 조건을 모두 확인하는지 살펴야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-poly-05",
        choiceA: "equal-sides-only-ga-05",
        misconceptionA: "a",
        derivationA: "가 도형의 4개 변에 같은 눈금이 있으면 각이 달라도 정다각형이라고 판단한다.",
        rationaleA: "가 도형은 변은 모두 같지만 각은 모두 같지 않습니다. 정다각형은 두 조건이 모두 필요합니다.",
        choiceB: "equal-angles-only-na-05",
        misconceptionB: "b",
        derivationB: "나 도형의 4개 각이 같으면 긴 변과 짧은 변이 있어도 정다각형이라고 판단한다.",
        rationaleB: "나 도형은 각은 모두 같지만 변의 길이가 모두 같지 않아 정다각형이 아닙니다."
      },
      {
        judgmentId: "g4s2-poly-06",
        choiceA: "equal-sides-only-na-06",
        misconceptionA: "a",
        derivationA: "나 도형의 6개 변이 같으면 두 종류인 각의 크기를 확인하지 않아도 정다각형이라고 판단한다.",
        rationaleA: "나 도형은 변만 모두 같고 각은 모두 같지 않습니다. 가 도형만 두 조건을 모두 만족합니다.",
        choiceB: "equal-angles-only-da-06",
        misconceptionB: "b",
        derivationB: "다 도형의 6개 각이 같으면 변의 길이가 번갈아 달라도 정다각형이라고 판단한다.",
        rationaleB: "다 도형은 각만 모두 같고 변의 길이는 모두 같지 않아 정다각형이 아닙니다."
      }
    ]
  },
  {
    stageId: "polygon.fill-remaining-space",
    titleA: "조각의 전체 칸 수만 맞으면 들어간다고 봄",
    titleB: "남은 칸보다 작은 조각 묶음도 채울 수 있다고 봄",
    sharedSignalRationale: "조각 묶음의 칸 수를 맞춘 뒤 남은 자리의 방향과 테두리까지 맞는지 다시 확인하는지 살펴야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-poly-07",
        choiceA: "two-rhombi-ga-07",
        misconceptionA: "a",
        derivationA: "마름모 2개의 넓이 4칸이 남은 4칸과 같으면 테두리도 맞는다고 판단한다.",
        rationaleA: "칸 수는 같지만 마름모 두 개의 테두리는 남은 자리와 맞지 않습니다. 사다리꼴과 삼각형 묶음은 모양까지 맞습니다.",
        choiceB: "two-triangles-da-07",
        misconceptionB: "b",
        derivationB: "삼각형 2개가 자리 일부에 놓이는 것을 보고 2칸으로 남은 4칸 전체를 덮는다고 판단한다.",
        rationaleB: "삼각형 두 개는 두 칸만 덮으므로 네 칸인 남은 자리를 모두 채울 수 없습니다."
      },
      {
        judgmentId: "g4s2-poly-08",
        choiceA: "three-rhombi-na-08",
        misconceptionA: "a",
        derivationA: "마름모 3개의 넓이 6칸이 남은 6칸과 같으면 안쪽으로 꺾인 테두리도 맞는다고 판단한다.",
        rationaleA: "넓이는 같아도 마름모 세 개로는 남은 모양의 테두리를 만들 수 없습니다. 사다리꼴 두 개가 맞습니다.",
        choiceB: "two-rhombi-da-08",
        misconceptionB: "b",
        derivationB: "마름모 2개가 자리 일부에 놓이는 것을 보고 4칸으로 남은 6칸 전체를 덮는다고 판단한다.",
        rationaleB: "마름모 두 개는 네 칸만 덮으므로 여섯 칸인 남은 자리를 모두 채울 수 없습니다."
      }
    ]
  },
  {
    stageId: "polygon.tile-count-pieces",
    titleA: "주어진 조각보다 큰 묶음을 조각 하나로 세어 개수를 적게 셈",
    titleB: "전체 삼각형 칸 수를 그대로 조각 수로 씀",
    sharedSignalRationale: "전체 삼각형 칸 수를 주어진 조각 한 개의 칸 수만큼 같은 묶음으로 나누었는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-poly-09",
        choiceA: "three-large-groups-09",
        misconceptionA: "a",
        derivationA: "작은 삼각형 12칸을 4칸짜리 큰 묶음 3개로 나눈 뒤, 각 묶음을 마름모 조각 한 개로 잘못 세어 3개라고 답한다.",
        rationaleA: "큰 모양은 작은 삼각형 열두 칸이고 마름모 하나는 두 칸이므로 12÷2=6개가 필요합니다.",
        choiceB: "twelve-rhombi-09",
        misconceptionB: "b",
        derivationB: "작은 삼각형 12칸을 센 뒤 2칸짜리 마름모로 묶지 않고 그대로 12개라고 답한다.",
        rationaleB: "마름모 한 개가 작은 삼각형 두 칸을 덮으므로 열두 칸은 여섯 묶음입니다."
      },
      {
        judgmentId: "g4s2-poly-10",
        choiceA: "two-trapezoids-10",
        misconceptionA: "a",
        derivationA: "작은 삼각형 12칸을 6칸짜리 큰 묶음 2개로 나눈 뒤, 각 묶음을 사다리꼴 조각 한 개로 잘못 세어 2개라고 답한다.",
        rationaleA: "전체는 작은 삼각형 열두 칸이고 사다리꼴 하나는 세 칸이므로 12÷3=4개가 필요합니다.",
        choiceB: "twelve-trapezoids-10",
        misconceptionB: "b",
        derivationB: "작은 삼각형 12칸을 센 뒤 3칸짜리 사다리꼴로 묶지 않고 그대로 12개라고 답한다.",
        rationaleB: "사다리꼴 한 개는 작은 삼각형 세 칸이므로 열두 칸은 네 묶음입니다."
      }
    ]
  },
  {
    stageId: "line-graph.tick-unit",
    titleA: "눈금 한 칸을 언제나 1로 봄",
    titleB: "전체 눈금 칸 수를 한 칸의 값으로 봄",
    sharedSignalRationale: "표시된 두 눈금값의 차이를 그 사이 칸 수로 나누었는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-line-01",
        choiceA: "one-degree-01",
        misconceptionA: "a",
        derivationA: "눈금선이 한 칸씩 나뉘어 있다는 이유로 단위를 1도로 정한다.",
        rationaleA: "0도부터 18도까지 여섯 칸이므로 한 칸은 18÷6=3도입니다.",
        choiceB: "six-degrees-01",
        misconceptionB: "b",
        derivationB: "세로축의 6칸을 세고 그 수를 한 칸의 값으로 쓴다.",
        rationaleB: "6은 칸 수이며, 한 칸의 값은 전체 값의 차이를 칸 수로 나누어 구합니다."
      },
      {
        judgmentId: "g4s2-line-02",
        choiceA: "one-centimeter-02",
        misconceptionA: "a",
        derivationA: "물결선 위 첫 눈금을 1센티미터로 보고 기준값 20을 반영하지 않는다.",
        rationaleA: "20센티미터부터 60센티미터까지 40센티미터가 다섯 칸이므로 한 칸은 8센티미터입니다.",
        choiceB: "five-centimeters-02",
        misconceptionB: "b",
        derivationB: "눈금 5칸을 세고 그 수를 한 칸의 값으로 쓴다.",
        rationaleB: "5는 칸 수입니다. 값의 차이 40을 다섯 칸으로 나누어야 합니다."
      }
    ]
  },
  {
    stageId: "line-graph.point-value",
    titleA: "점이 놓인 눈금 번호를 값으로 씀",
    titleB: "묻는 점 대신 이웃한 점을 읽음",
    sharedSignalRationale: "기준값에서 묻는 점까지의 칸 수에 한 칸의 값을 적용했는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-line-03",
        choiceA: "four-degrees-03",
        misconceptionA: "a",
        derivationA: "오후 3시 점이 네 번째 눈금에 있어 4도라고 쓴다.",
        rationaleA: "한 칸은 5도이고 오후 3시 점은 네 칸 높이이므로 20도입니다.",
        choiceB: "fifteen-degrees-03",
        misconceptionB: "b",
        derivationB: "오후 3시 점 대신 바로 다음 오후 5시 점의 세 칸 값 15도를 읽는다.",
        rationaleB: "묻는 시각은 오후 3시이며 그 점은 한 칸에 5도씩 네 칸 높이인 20도입니다."
      },
      {
        judgmentId: "g4s2-line-04",
        choiceA: "six-degrees-04",
        misconceptionA: "a",
        derivationA: "넷째 주 점의 눈금 번호 6을 그대로 기온으로 쓴다.",
        rationaleA: "기준값 4도에서 한 칸에 2도씩 여섯 칸 올라가므로 16도입니다.",
        choiceB: "twenty-two-degrees-04",
        misconceptionB: "b",
        derivationB: "넷째 주 점 대신 바로 앞 셋째 주 점의 값 22도를 읽는다.",
        rationaleB: "22도는 셋째 주 점의 값이며 넷째 주 점은 여섯 칸 높이입니다."
      }
    ]
  },
  {
    stageId: "line-graph.step-change",
    titleA: "변한 눈금 칸 수를 그대로 변화량으로 씀",
    titleB: "나중 시점의 값을 변화량으로 씀",
    sharedSignalRationale: "두 점의 눈금 차이에 한 칸의 값을 적용했는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-line-05",
        choiceA: "four-degrees-05",
        misconceptionA: "a",
        derivationA: "네 칸 올라간 것을 보고 한 칸의 값 5도를 적용하지 않고 4도라고 쓴다.",
        rationaleA: "네 칸에 한 칸의 값 5도를 곱하면 20도 변했습니다.",
        choiceB: "thirty-degrees-05",
        misconceptionB: "b",
        derivationB: "오전 11시의 물 온도 30도를 두 시점 사이 변화량으로 쓴다.",
        rationaleB: "변화량은 나중 값 30도에서 처음 값 10도를 빼어 구합니다."
      },
      {
        judgmentId: "g4s2-line-06",
        choiceA: "four-degrees-06",
        misconceptionA: "a",
        derivationA: "네 칸 내려간 것을 보고 한 칸의 값 10도를 적용하지 않고 4도라고 쓴다.",
        rationaleA: "네 칸에 한 칸의 값 10도를 곱하면 40도 낮아졌습니다.",
        choiceB: "thirty-degrees-06",
        misconceptionB: "b",
        derivationB: "25분의 물 온도 30도를 두 시점 사이 변화량으로 쓴다.",
        rationaleB: "70도에서 30도로 내려갔으므로 40도 낮아졌습니다."
      }
    ]
  },
  {
    stageId: "line-graph.largest-rise",
    titleA: "방향을 무시하고 가장 크게 변한 구간을 고름",
    titleB: "가장 높은 점이 들어 있는 구간을 고름",
    sharedSignalRationale: "올라가는 구간만 찾은 뒤 각 구간의 눈금 차이를 비교했는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-line-07",
        choiceA: "three-to-six-07",
        misconceptionA: "a",
        derivationA: "오후 3시부터 6시까지가 가장 크게 변했지만 내려간 방향을 확인하지 않는다.",
        rationaleA: "그 구간은 크게 내려갔습니다. 가장 크게 올라간 구간은 오전 9시부터 낮 12시까지입니다.",
        choiceB: "noon-to-three-07",
        misconceptionB: "b",
        derivationB: "그래프에서 가장 높은 오후 3시 점이 들어 있는 구간을 고른다.",
        rationaleB: "높이가 가장 높은 점이 아니라 앞 점보다 가장 많이 올라간 구간을 찾아야 합니다."
      },
      {
        judgmentId: "g4s2-line-08",
        choiceA: "july-to-august-08",
        misconceptionA: "a",
        derivationA: "7월부터 8월까지의 가장 큰 변화에서 내려간 방향을 확인하지 않는다.",
        rationaleA: "그 구간은 물 높이가 내려갔습니다. 5월부터 6월까지가 네 칸 올라갔습니다.",
        choiceB: "june-to-july-08",
        misconceptionB: "b",
        derivationB: "가장 높은 7월 점이 들어 있는 구간을 고른다.",
        rationaleB: "6월부터 7월까지는 한 칸만 올라갔고 5월부터 6월까지는 네 칸 올라갔습니다."
      }
    ]
  },
  {
    stageId: "line-graph.between-estimate",
    titleA: "앞 시점의 값을 중간 시점에도 그대로 씀",
    titleB: "중간 높이의 눈금 번호를 값으로 씀",
    sharedSignalRationale: "두 점을 이은 선의 중간 높이를 찾고 세로축의 실제 값으로 바꾸었는지 확인해야 합니다.",
    entries: [
      {
        judgmentId: "g4s2-line-09",
        choiceA: "about-nine-degrees-09",
        misconceptionA: "a",
        derivationA: "오전 10시를 앞 시점인 오전 9시의 9도와 같다고 본다.",
        rationaleA: "오전 10시는 오전 9시와 11시의 중간이며 선의 높이도 9도와 15도의 중간인 약 12도입니다.",
        choiceB: "about-four-degrees-09",
        misconceptionB: "b",
        derivationB: "선의 중간 높이가 네 번째 눈금이라서 눈금 번호 4를 그대로 답으로 쓴다.",
        rationaleB: "네 번째 눈금은 눈금 번호가 아니라 3도씩 네 칸인 약 12도를 나타냅니다."
      },
      {
        judgmentId: "g4s2-line-10",
        choiceA: "about-seventy-degrees-10",
        misconceptionA: "a",
        derivationA: "30분을 앞 시점인 20분의 70도와 같다고 본다.",
        rationaleA: "30분은 20분과 40분의 중간이며 선의 높이는 70도와 30도의 중간인 약 50도입니다.",
        choiceB: "about-two-degrees-10",
        misconceptionB: "b",
        derivationB: "선의 중간 높이가 두 번째 눈금이라서 2도를 답으로 쓴다.",
        rationaleB: "두 번째 눈금은 기준값 10도에서 한 칸 20도씩 두 칸 올라간 약 50도를 나타냅니다."
      }
    ]
  }
];

export const grade4Semester2MisconceptionTitles = Object.freeze(
  Object.fromEntries(stages.flatMap((entry) => [
    [`${entry.stageId}.a`, entry.titleA],
    [`${entry.stageId}.b`, entry.titleB]
  ]))
);

export const grade4Semester2DistractorRationales: DistractorRationale[] =
  stages.flatMap((entry) => entry.entries.flatMap((item) => [
    {
      judgmentId: item.judgmentId,
      choiceId: item.choiceA,
      signalIds: [entry.stageId],
      misconceptionId: `${entry.stageId}.${item.misconceptionA}`,
      derivation: item.derivationA,
      rationale: item.rationaleA,
      sharedSignalRationale: entry.sharedSignalRationale
    },
    {
      judgmentId: item.judgmentId,
      choiceId: item.choiceB,
      signalIds: [entry.stageId],
      misconceptionId: `${entry.stageId}.${item.misconceptionB}`,
      derivation: item.derivationB,
      rationale: item.rationaleB,
      sharedSignalRationale: entry.sharedSignalRationale
    }
  ]));
