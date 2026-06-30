(function () {
  const choice = (id, label, sublabel, correct, signal, misconception, teacherNote) => ({
    id,
    label,
    sublabel,
    correct,
    signal,
    misconception,
    teacherNote,
  });

  window.MOM_QUESTIONS = [
    {
      id: "q1",
      title: "1/2와 같은 크기의 분수",
      stem: "1/2와 같은 크기의 분수를 고르는 문제입니다.",
      focus: "동치분수",
      steps: [
        {
          id: "q1-meaning",
          title: "분수의 크기 보기",
          prompt: "아래 분수막대에서 1/2은 어떤 뜻일까요?",
          bars: [{ label: "1/2", numerator: 1, denominator: 2 }],
          choices: [
            choice("half", "2칸 중 1칸", "전체를 2칸으로 나눈 뒤 1칸을 본다", true, "secure-meaning", null, "1/2의 전체-부분 관계를 안정적으로 봅니다."),
            choice("one-of-three", "3칸 중 1칸", "분자를 전체 조각 수로 본다", false, "part-whole-confusion", "분자와 분모의 역할이 흔들림", "분자와 분모가 각각 무엇을 뜻하는지 다시 확인해야 합니다."),
            choice("two-of-one", "1칸 중 2칸", "분자와 분모 위치를 바꾼다", false, "reversed-fraction", "분자와 분모를 뒤집어 해석함", "분수 표기에서 위아래 수의 의미를 연결할 필요가 있습니다."),
          ],
        },
        {
          id: "q1-equivalent",
          title: "같은 크기 찾기",
          prompt: "1/2와 같은 크기의 분수를 고르세요.",
          bars: [{ label: "1/2", numerator: 1, denominator: 2 }],
          choices: [
            choice("two-fourths", "2/4", "같은 막대를 더 잘게 나누면 4칸 중 2칸", true, "secure-equivalent", null, "동치분수의 시각적 크기를 잘 연결합니다."),
            choice("two-thirds", "2/3", "분자가 2라서 고른 선택", false, "numerator-only", "분자만 보고 크기를 판단함", "전체 조각 수가 달라지면 한 조각의 크기도 달라진다는 점을 다뤄야 합니다."),
            choice("one-fourth", "1/4", "분자가 같아서 고른 선택", false, "numerator-only", "분자만 보고 크기를 판단함", "같은 1칸이라도 전체를 몇 칸으로 나눴는지가 중요합니다."),
            choice("three-fourths", "3/4", "분모가 4인 더 큰 분수", false, "size-order", "동치와 크기 비교가 섞임", "같은 크기와 더 큰 크기를 구분하는 활동이 필요합니다."),
          ],
        },
        {
          id: "q1-reason",
          title: "같은 이유 고르기",
          prompt: "2/4가 1/2와 같은 이유로 가장 알맞은 것을 고르세요.",
          choices: [
            choice("split", "1/2의 한 칸을 둘로 나누면 2/4가 됩니다.", "전체 크기는 그대로입니다", true, "secure-equivalent-reason", null, "동치분수의 분할 관점을 설명할 수 있습니다."),
            choice("add-two", "1과 2를 더하면 3이 아니라서 같습니다.", "계산 규칙을 임의로 만듭니다", false, "rule-guessing", "동치분수 규칙을 임의로 추측함", "규칙 암기보다 같은 전체를 더 잘게 나누는 경험이 필요합니다."),
            choice("same-two", "두 분수에 모두 2가 있어서 같습니다.", "공통 숫자만 찾습니다", false, "surface-number", "보이는 숫자만 연결함", "숫자 모양이 아니라 전체 대비 차지한 양을 보게 해야 합니다."),
          ],
        },
      ],
    },
    {
      id: "q2",
      title: "2/3 = ?/9",
      stem: "2/3와 같은 크기가 되도록 빈칸에 들어갈 수를 찾습니다.",
      focus: "동치분수",
      steps: [
        {
          id: "q2-denominator",
          title: "분모 변화 보기",
          prompt: "분모 3이 9가 되려면 어떤 변화가 필요할까요?",
          choices: [
            choice("times-three", "3배", "3 x 3 = 9", true, "same-multiplier", null, "분모 변화의 배수를 정확히 봅니다."),
            choice("plus-six", "6을 더하기", "3 + 6 = 9", false, "additive-equivalence", "동치분수를 덧셈 변화로 봄", "동치분수는 같은 수를 곱하거나 나누는 구조임을 강조해야 합니다."),
            choice("times-two", "2배", "3 x 2 = 6", false, "multiplier-miscalculation", "배수 계산이 흔들림", "분모 변화의 배수를 먼저 안정화할 필요가 있습니다."),
          ],
        },
        {
          id: "q2-numerator",
          title: "분자 변화 맞추기",
          prompt: "분모에 3배를 했다면 분자 2에는 무엇을 해야 할까요?",
          choices: [
            choice("also-times-three", "2에도 3배", "2 x 3 = 6", true, "same-multiplier", null, "분자와 분모에 같은 배수를 적용합니다."),
            choice("plus-six", "2에도 6을 더하기", "분모에서 늘어난 만큼 더합니다", false, "additive-equivalence", "분자와 분모를 같은 덧셈 변화로 맞춤", "같은 크기를 유지하려면 곱셈 배수가 같아야 합니다."),
            choice("leave-two", "2는 그대로 두기", "분모만 바꿉니다", false, "denominator-only", "분모만 바꾸면 된다고 봄", "분모 변화가 한 조각의 크기를 바꾸므로 분자도 함께 조정해야 합니다."),
          ],
        },
        {
          id: "q2-answer",
          title: "빈칸 결정하기",
          prompt: "2/3 = ?/9 에서 빈칸에 들어갈 수를 고르세요.",
          bars: [
            { label: "2/3", numerator: 2, denominator: 3 },
            { label: "?/9", numerator: 0, denominator: 9 },
          ],
          choices: [
            choice("six", "6", "2 x 3", true, "secure-equivalent", null, "동치분수 절차를 결과까지 연결했습니다."),
            choice("eight", "8", "2 + 6", false, "additive-equivalence", "분모 증가량을 분자에 더함", "증가량이 아니라 배수를 보게 하는 피드백이 필요합니다."),
            choice("two", "2", "분자는 그대로 둠", false, "denominator-only", "분모만 바꿈", "분모 변화가 크기에 미치는 영향을 시각화해야 합니다."),
          ],
        },
      ],
    },
    {
      id: "q3",
      title: "1/2와 1/3의 같은 기준",
      stem: "1/2와 1/3을 같은 크기 조각으로 바꿉니다.",
      focus: "통분",
      steps: [
        {
          id: "q3-common",
          title: "공통 조각 수 찾기",
          prompt: "1/2와 1/3을 같은 크기 조각으로 보려면 전체를 몇 조각 기준으로 나누면 좋을까요?",
          bars: [
            { label: "1/2", numerator: 1, denominator: 2 },
            { label: "1/3", numerator: 1, denominator: 3 },
          ],
          choices: [
            choice("six", "6조각", "2와 3이 모두 나누어지는 기준", true, "common-denominator", null, "공통분모의 기준을 잘 찾습니다."),
            choice("five", "5조각", "2 + 3", false, "add-denominators", "분모를 더해서 통분 기준을 만듦", "통분 기준은 두 분모의 합이 아니라 공통으로 나누어지는 수입니다."),
            choice("three", "3조각", "큰 분모를 그대로 사용", false, "larger-denominator-only", "큰 분모만 기준으로 삼음", "두 분모가 모두 표현되는 공통 기준인지 확인해야 합니다."),
          ],
        },
        {
          id: "q3-half",
          title: "1/2 바꾸기",
          prompt: "전체를 6조각으로 보면 1/2은 몇 조각일까요?",
          bars: [
            { label: "1/2", numerator: 1, denominator: 2 },
            { label: "?/6", numerator: 0, denominator: 6 },
          ],
          choices: [
            choice("three-sixths", "3/6", "6조각 중 절반", true, "conversion", null, "1/2을 공통분모 6으로 정확히 바꿉니다."),
            choice("one-sixth", "1/6", "분자만 그대로 둠", false, "denominator-only", "분모만 바꾸고 분자를 유지함", "같은 크기를 유지하려면 차지하는 조각 수도 바뀌어야 합니다."),
            choice("two-sixths", "2/6", "분모 2를 분자로 옮김", false, "part-whole-confusion", "부분과 전체 수를 혼동함", "분수막대로 절반이 전체의 몇 조각인지 다시 보게 해야 합니다."),
          ],
        },
        {
          id: "q3-third",
          title: "1/3 바꾸기",
          prompt: "전체를 6조각으로 보면 1/3은 몇 조각일까요?",
          bars: [
            { label: "1/3", numerator: 1, denominator: 3 },
            { label: "?/6", numerator: 0, denominator: 6 },
          ],
          choices: [
            choice("two-sixths", "2/6", "6조각 중 2조각", true, "conversion", null, "1/3을 공통분모 6으로 정확히 바꿉니다."),
            choice("one-sixth", "1/6", "분자만 그대로 둠", false, "denominator-only", "분모만 바꾸고 분자를 유지함", "같은 크기를 유지하려면 분자도 함께 바뀌어야 합니다."),
            choice("three-sixths", "3/6", "3이라는 숫자를 분자로 사용", false, "surface-number", "보이는 숫자를 그대로 옮김", "숫자 표면보다 막대의 실제 양을 확인해야 합니다."),
          ],
        },
      ],
    },
    {
      id: "q4",
      title: "3/4와 5/6의 같은 기준",
      stem: "3/4와 5/6을 같은 분모로 바꿉니다.",
      focus: "통분",
      steps: [
        {
          id: "q4-common",
          title: "공통분모 찾기",
          prompt: "4와 6이 함께 맞는 공통 기준으로 알맞은 것은 무엇일까요?",
          choices: [
            choice("twelve", "12", "4와 6의 공통 기준", true, "common-denominator", null, "공통분모 12를 찾았습니다."),
            choice("ten", "10", "4 + 6", false, "add-denominators", "분모를 더해서 통분 기준을 만듦", "공통 기준은 덧셈 결과가 아니라 두 분모가 모두 나누어지는 수입니다."),
            choice("six", "6", "큰 분모를 그대로 사용", false, "larger-denominator-only", "큰 분모만 기준으로 삼음", "4분의 몇도 표현되는 기준인지 확인해야 합니다."),
          ],
        },
        {
          id: "q4-three-fourths",
          title: "3/4 바꾸기",
          prompt: "3/4을 12분의 몇으로 바꾸면 될까요?",
          bars: [
            { label: "3/4", numerator: 3, denominator: 4 },
            { label: "?/12", numerator: 0, denominator: 12 },
          ],
          choices: [
            choice("nine", "9/12", "분자와 분모에 3배", true, "conversion", null, "분모 변화 배수를 분자에도 적용합니다."),
            choice("three", "3/12", "분자만 그대로 둠", false, "denominator-only", "분모만 바꾸고 분자를 유지함", "같은 크기를 유지하려면 분자도 함께 조정해야 합니다."),
            choice("seven", "7/12", "3과 4를 더함", false, "rule-guessing", "임의 계산 규칙을 만듦", "분자와 분모를 따로 더하는 접근을 점검해야 합니다."),
          ],
        },
        {
          id: "q4-five-sixths",
          title: "5/6 바꾸기",
          prompt: "5/6을 12분의 몇으로 바꾸면 될까요?",
          choices: [
            choice("ten", "10/12", "분자와 분모에 2배", true, "conversion", null, "5/6을 12분모로 정확히 바꿉니다."),
            choice("five", "5/12", "분자만 그대로 둠", false, "denominator-only", "분모만 바꾸고 분자를 유지함", "같은 크기를 보존하는 변환을 다시 다뤄야 합니다."),
            choice("eleven", "11/12", "5와 6을 더함", false, "rule-guessing", "임의 계산 규칙을 만듦", "분수 변환에서 더하기 규칙을 만들고 있는지 확인해야 합니다."),
          ],
        },
      ],
    },
    {
      id: "q5",
      title: "1/2 + 1/3",
      stem: "분모가 다른 두 분수를 더합니다.",
      focus: "분수 덧셈",
      steps: [
        {
          id: "q5-common",
          title: "덧셈 기준 세우기",
          prompt: "1/2와 1/3을 더하려면 먼저 어떤 기준으로 맞추면 좋을까요?",
          choices: [
            choice("six", "6분의 몇", "2와 3의 공통 기준", true, "common-denominator", null, "덧셈 전 공통 기준을 세웁니다."),
            choice("five", "5분의 몇", "2 + 3", false, "add-denominators", "분모를 더해서 통분 기준을 만듦", "분모끼리 더하는 접근이 덧셈 과정에 끼어들고 있습니다."),
            choice("three", "3분의 몇", "큰 분모만 사용", false, "larger-denominator-only", "큰 분모만 기준으로 삼음", "두 분수 모두 표현 가능한 기준인지 점검해야 합니다."),
          ],
        },
        {
          id: "q5-half",
          title: "1/2 변환",
          prompt: "1/2은 6분의 몇으로 바뀔까요?",
          bars: [
            { label: "1/2", numerator: 1, denominator: 2 },
            { label: "?/6", numerator: 0, denominator: 6 },
          ],
          choices: [
            choice("three", "3/6", "절반은 6조각 중 3조각", true, "conversion", null, "1/2 변환이 안정적입니다."),
            choice("one", "1/6", "분자만 유지", false, "denominator-only", "분모만 바꾸고 분자를 유지함", "분모 변화와 조각 크기의 관계를 확인해야 합니다."),
            choice("two", "2/6", "분모 2를 분자로 사용", false, "part-whole-confusion", "분자와 분모 역할이 흔들림", "분수막대에서 절반이 몇 조각인지 직접 세어보는 활동이 필요합니다."),
          ],
        },
        {
          id: "q5-third",
          title: "1/3 변환",
          prompt: "1/3은 6분의 몇으로 바뀔까요?",
          bars: [
            { label: "1/3", numerator: 1, denominator: 3 },
            { label: "?/6", numerator: 0, denominator: 6 },
          ],
          choices: [
            choice("two", "2/6", "6조각 중 2조각", true, "conversion", null, "1/3 변환이 안정적입니다."),
            choice("one", "1/6", "분자만 유지", false, "denominator-only", "분모만 바꾸고 분자를 유지함", "동치분수에서 같은 크기 보존을 다시 다뤄야 합니다."),
            choice("three", "3/6", "분모 3을 분자로 사용", false, "surface-number", "보이는 숫자를 그대로 옮김", "숫자 표면보다 막대의 실제 양을 확인해야 합니다."),
          ],
        },
        {
          id: "q5-numerators",
          title: "분자 더하기",
          prompt: "3/6 + 2/6에서 더해야 하는 조각 수는 무엇일까요?",
          choices: [
            choice("three-plus-two", "3 + 2", "같은 6조각 기준에서 칠해진 조각 수", true, "add-numerators", null, "공통 기준에서 부분 조각을 더합니다."),
            choice("six-plus-six", "6 + 6", "분모끼리 더함", false, "add-denominators", "분모도 함께 더함", "분모는 기준이므로 덧셈 대상이 아니라는 점을 강조해야 합니다."),
            choice("three-plus-six", "3 + 6", "첫 분자와 분모를 더함", false, "rule-guessing", "분자와 분모를 임의로 섞어 계산함", "무엇을 더하는지 말로 확인하는 과정이 필요합니다."),
          ],
        },
        {
          id: "q5-denominator",
          title: "분모 유지하기",
          prompt: "3/6 + 2/6의 결과에서 분모는 어떻게 될까요?",
          choices: [
            choice("stay-six", "6으로 유지", "6조각 기준은 그대로입니다", true, "denominator-stays", null, "분모가 기준이라는 점을 이해합니다."),
            choice("becomes-twelve", "12가 됩니다", "6 + 6", false, "add-denominators", "분모를 더함", "같은 단위끼리 더할 때 단위 이름은 유지된다는 비유가 도움이 됩니다."),
            choice("becomes-five", "5가 됩니다", "3 + 2", false, "numerator-denominator-mix", "분자 합을 분모로 옮김", "분자와 분모가 맡는 역할을 분리해야 합니다."),
          ],
        },
        {
          id: "q5-answer",
          title: "결과 고르기",
          prompt: "1/2 + 1/3의 결과를 고르세요.",
          choices: [
            choice("five-sixths", "5/6", "3/6 + 2/6", true, "secure-addition", null, "통분부터 결과까지 연결했습니다."),
            choice("two-fifths", "2/5", "분자끼리, 분모끼리 더함", false, "add-across", "분자끼리 분모끼리 각각 더함", "분모가 다른 분수 덧셈에서 가장 먼저 다룰 오개념입니다."),
            choice("five-twelfths", "5/12", "분자는 맞지만 분모도 더함", false, "add-denominators", "분모를 더함", "공통 기준을 유지한다는 감각을 다시 잡아야 합니다."),
          ],
        },
      ],
    },
    {
      id: "q6",
      title: "2/3 + 1/6",
      stem: "한 분수만 바꾸면 되는 덧셈입니다.",
      focus: "분수 덧셈",
      steps: [
        {
          id: "q6-common",
          title: "기준 정하기",
          prompt: "2/3와 1/6을 더할 때 알맞은 공통 기준은 무엇일까요?",
          choices: [
            choice("six", "6분의 몇", "3과 6의 공통 기준", true, "common-denominator", null, "한쪽 분모가 이미 공통 기준임을 봅니다."),
            choice("nine", "9분의 몇", "3 + 6", false, "add-denominators", "분모를 더함", "분모의 합을 기준으로 잡는 경향이 보입니다."),
            choice("three", "3분의 몇", "작은 분모만 사용", false, "smaller-denominator-only", "작은 분모만 기준으로 삼음", "1/6을 3분모로 표현할 수 있는지 확인해야 합니다."),
          ],
        },
        {
          id: "q6-convert",
          title: "2/3 변환",
          prompt: "2/3은 6분의 몇으로 바뀔까요?",
          choices: [
            choice("four", "4/6", "분자와 분모에 2배", true, "conversion", null, "2/3을 6분모로 정확히 바꿉니다."),
            choice("two", "2/6", "분자만 유지", false, "denominator-only", "분모만 바꾸고 분자를 유지함", "같은 크기를 유지하는 변환을 다시 봐야 합니다."),
            choice("five", "5/6", "2와 3을 더함", false, "rule-guessing", "임의 계산 규칙을 만듦", "변환과 덧셈 절차가 섞여 있습니다."),
          ],
        },
        {
          id: "q6-answer",
          title: "결과 고르기",
          prompt: "2/3 + 1/6의 결과를 고르세요.",
          choices: [
            choice("five-sixths", "5/6", "4/6 + 1/6", true, "secure-addition", null, "분수 덧셈 절차가 안정적입니다."),
            choice("three-ninths", "3/9", "분자끼리, 분모끼리 더함", false, "add-across", "분자끼리 분모끼리 각각 더함", "통분 전 바로 더하는 습관을 확인해야 합니다."),
            choice("three-sixths", "3/6", "2 + 1만 더함", false, "conversion-missed", "2/3을 변환하지 않음", "2/3을 6분모로 바꾸는 중간 단계가 필요합니다."),
          ],
        },
      ],
    },
    {
      id: "q7",
      title: "3/4 + 1/8",
      stem: "3/4을 8분모로 바꾼 뒤 더합니다.",
      focus: "분수 덧셈",
      steps: [
        {
          id: "q7-common",
          title: "공통 기준",
          prompt: "3/4와 1/8을 더할 때 공통 기준으로 가장 알맞은 것은 무엇일까요?",
          choices: [
            choice("eight", "8분의 몇", "4와 8의 공통 기준", true, "common-denominator", null, "8분모 기준을 선택했습니다."),
            choice("twelve", "12분의 몇", "4 + 8", false, "add-denominators", "분모를 더함", "분모를 더해서 기준을 정하는 경향이 있습니다."),
            choice("four", "4분의 몇", "작은 분모 기준", false, "smaller-denominator-only", "작은 분모만 기준으로 삼음", "1/8을 4분모로 표현할 수 있는지 확인해야 합니다."),
          ],
        },
        {
          id: "q7-convert",
          title: "3/4 변환",
          prompt: "3/4은 8분의 몇으로 바뀔까요?",
          choices: [
            choice("six", "6/8", "분자와 분모에 2배", true, "conversion", null, "3/4 변환이 안정적입니다."),
            choice("three", "3/8", "분자만 유지", false, "denominator-only", "분모만 바꾸고 분자를 유지함", "분모 변화에 따라 분자도 바뀌어야 합니다."),
            choice("seven", "7/8", "3과 4를 더함", false, "rule-guessing", "임의 계산 규칙을 만듦", "변환 전에 수를 더하는지 살펴봐야 합니다."),
          ],
        },
        {
          id: "q7-answer",
          title: "결과",
          prompt: "3/4 + 1/8의 결과를 고르세요.",
          choices: [
            choice("seven-eighths", "7/8", "6/8 + 1/8", true, "secure-addition", null, "통분 뒤 분자만 더합니다."),
            choice("four-twelfths", "4/12", "분자끼리, 분모끼리 더함", false, "add-across", "분자끼리 분모끼리 각각 더함", "분모가 다른 분수를 바로 더하고 있습니다."),
            choice("four-eighths", "4/8", "3/4를 변환하지 않음", false, "conversion-missed", "통분 없이 분자만 더함", "3/4을 6/8로 바꾸는 중간 단계가 빠졌습니다."),
          ],
        },
      ],
    },
    {
      id: "q8",
      title: "5/6 - 1/3",
      stem: "분모를 맞춘 뒤 빼는 문제입니다.",
      focus: "분수 뺄셈",
      steps: [
        {
          id: "q8-common",
          title: "뺄셈 기준",
          prompt: "5/6와 1/3을 빼려면 어떤 기준으로 맞추면 좋을까요?",
          choices: [
            choice("six", "6분의 몇", "3과 6의 공통 기준", true, "common-denominator", null, "공통 기준을 잡았습니다."),
            choice("nine", "9분의 몇", "6 + 3", false, "add-denominators", "분모를 더함", "뺄셈에서도 분모 합을 기준으로 잡는지 확인해야 합니다."),
            choice("three", "3분의 몇", "작은 분모 기준", false, "smaller-denominator-only", "작은 분모만 기준으로 삼음", "5/6을 3분모로 정확히 표현할 수 있는지 점검해야 합니다."),
          ],
        },
        {
          id: "q8-convert",
          title: "1/3 변환",
          prompt: "1/3은 6분의 몇으로 바뀔까요?",
          choices: [
            choice("two", "2/6", "분자와 분모에 2배", true, "conversion", null, "1/3 변환이 안정적입니다."),
            choice("one", "1/6", "분자만 유지", false, "denominator-only", "분모만 바꾸고 분자를 유지함", "같은 크기를 유지하는 동치 변환이 필요합니다."),
            choice("three", "3/6", "분모 3을 분자로 옮김", false, "surface-number", "보이는 숫자를 그대로 옮김", "막대의 실제 양과 숫자를 연결해야 합니다."),
          ],
        },
        {
          id: "q8-answer",
          title: "결과",
          prompt: "5/6 - 1/3의 결과를 고르세요.",
          choices: [
            choice("one-half", "1/2", "5/6 - 2/6 = 3/6 = 1/2", true, "secure-subtraction", null, "뺄셈과 약분까지 연결했습니다."),
            choice("four-thirds", "4/3", "분자끼리, 분모끼리 뺌", false, "subtract-across", "분자와 분모를 각각 뺌", "분모가 단위라는 점을 다시 확인해야 합니다."),
            choice("four-sixths", "4/6", "1/3을 1/6로 봄", false, "denominator-only", "분모만 바꾸고 분자를 유지함", "1/3을 2/6으로 바꾸는 과정이 필요합니다."),
          ],
        },
      ],
    },
    {
      id: "q9",
      title: "3/4 - 1/6",
      stem: "두 분수를 12분모로 바꿔 뺍니다.",
      focus: "분수 뺄셈",
      steps: [
        {
          id: "q9-common",
          title: "공통 기준",
          prompt: "3/4와 1/6을 빼려면 공통 기준으로 무엇이 알맞을까요?",
          choices: [
            choice("twelve", "12분의 몇", "4와 6의 공통 기준", true, "common-denominator", null, "공통분모 12를 선택했습니다."),
            choice("ten", "10분의 몇", "4 + 6", false, "add-denominators", "분모를 더함", "분모 합을 통분 기준으로 보는 경향입니다."),
            choice("six", "6분의 몇", "큰 분모 기준", false, "larger-denominator-only", "큰 분모만 기준으로 삼음", "3/4도 표현 가능한 기준인지 확인해야 합니다."),
          ],
        },
        {
          id: "q9-convert",
          title: "두 분수 바꾸기",
          prompt: "3/4와 1/6을 12분모로 바꾼 것으로 맞는 것은 무엇일까요?",
          choices: [
            choice("nine-and-two", "9/12와 2/12", "각각 3배, 2배", true, "conversion", null, "두 분수의 동치 변환을 모두 처리했습니다."),
            choice("three-and-one", "3/12와 1/12", "분자만 유지", false, "denominator-only", "분모만 바꾸고 분자를 유지함", "같은 크기 보존이 빠져 있습니다."),
            choice("seven-and-seven", "7/12와 7/12", "분자와 분모를 더함", false, "rule-guessing", "임의 계산 규칙을 만듦", "변환 과정에서 더하기 규칙을 쓰는지 점검해야 합니다."),
          ],
        },
        {
          id: "q9-answer",
          title: "결과",
          prompt: "3/4 - 1/6의 결과를 고르세요.",
          choices: [
            choice("seven-twelfths", "7/12", "9/12 - 2/12", true, "secure-subtraction", null, "통분 뒤 분자만 뺍니다."),
            choice("two-two", "2/2", "분자끼리, 분모끼리 뺌", false, "subtract-across", "분자와 분모를 각각 뺌", "분모가 계산 대상이 아니라 기준이라는 점이 필요합니다."),
            choice("two-tenths", "2/10", "분모도 뺌", false, "subtract-denominators", "분모를 뺌", "뺄셈에서도 공통 기준은 유지된다는 점을 확인해야 합니다."),
          ],
        },
      ],
    },
    {
      id: "q10",
      title: "리본 2/3m에서 1/4m 사용",
      stem: "문장제에서 남은 리본의 길이를 구합니다.",
      focus: "문장제",
      steps: [
        {
          id: "q10-operation",
          title: "상황 해석",
          prompt: "리본 2/3m 중 1/4m를 사용했습니다. 어떤 계산이 어울릴까요?",
          choices: [
            choice("subtract", "2/3 - 1/4", "사용한 만큼 빼기", true, "word-operation", null, "문장 상황을 뺄셈으로 해석합니다."),
            choice("add", "2/3 + 1/4", "두 길이를 더하기", false, "word-operation-confusion", "문장 상황의 연산 선택이 흔들림", "남은 양인지 전체 양인지 상황 언어를 구분해야 합니다."),
            choice("multiply", "2/3 x 1/4", "두 분수를 곱하기", false, "operation-guessing", "문제 단서 없이 연산을 추측함", "문장 속 행동을 수식으로 바꾸는 연습이 필요합니다."),
          ],
        },
        {
          id: "q10-common",
          title: "같은 단위 만들기",
          prompt: "2/3와 1/4을 빼기 위해 공통 기준으로 무엇이 알맞을까요?",
          choices: [
            choice("twelve", "12분의 몇", "3과 4의 공통 기준", true, "common-denominator", null, "문장제에서도 통분 기준을 잡았습니다."),
            choice("seven", "7분의 몇", "3 + 4", false, "add-denominators", "분모를 더해서 통분 기준을 만듦", "문장제에서도 분모 합을 기준으로 보는지 확인해야 합니다."),
            choice("four", "4분의 몇", "큰 분모 기준", false, "larger-denominator-only", "큰 분모만 기준으로 삼음", "2/3도 표현되는 기준인지 확인해야 합니다."),
          ],
        },
        {
          id: "q10-convert",
          title: "두 길이 바꾸기",
          prompt: "2/3m와 1/4m를 12분모로 바꾸면 어떻게 될까요?",
          choices: [
            choice("eight-and-three", "8/12m와 3/12m", "각각 4배, 3배", true, "conversion", null, "두 길이를 같은 단위로 바꿉니다."),
            choice("two-and-one", "2/12m와 1/12m", "분자만 유지", false, "denominator-only", "분모만 바꾸고 분자를 유지함", "길이의 크기가 달라지는 변환입니다."),
            choice("five-and-five", "5/12m와 5/12m", "분자와 분모를 더함", false, "rule-guessing", "임의 계산 규칙을 만듦", "동치 변환과 덧셈이 섞이고 있습니다."),
          ],
        },
        {
          id: "q10-answer",
          title: "남은 길이",
          prompt: "남은 리본의 길이를 고르세요.",
          choices: [
            choice("five-twelfths", "5/12m", "8/12m - 3/12m", true, "secure-word-problem", null, "문장 해석과 분수 뺄셈을 연결했습니다."),
            choice("three-sevenths", "3/7m", "분자끼리, 분모끼리 뺌", false, "subtract-across", "분자와 분모를 각각 뺌", "문장제에서 절차적 오개념이 함께 나타납니다."),
            choice("one-half", "1/2m", "대략 반으로 판단", false, "estimation-overprocedure", "정확한 통분 절차 없이 어림함", "어림이 아니라 정확한 기준 변환으로 이어가야 합니다."),
          ],
        },
      ],
    },
  ];

})();
