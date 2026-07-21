(function () {
  const choice = (id, label, correct, signal, misconception, teacherNote) => ({
    id,
    label,
    correct,
    signal,
    misconception,
    teacherNote,
  });

  const objectSet = (items, layout = "ordered", instruction = "그림을 하나씩 눌러 세어 보세요.") => ({
    type: "object-set",
    layout,
    instruction,
    items: items.map((symbol, index) => ({ id: `object-${index + 1}`, symbol })),
  });

  const sequence = (values) => ({ type: "number-sequence", values });

  const numberLine = (min, max, choices) => ({
    type: "number-line",
    min,
    max,
    choices,
  });

  const displaySet = (items, layout = "ordered") => ({
    type: "object-display",
    layout,
    items: items.map((symbol, index) => ({ id: `display-${index + 1}`, symbol })),
  });

  const CURRICULUM_ANCHOR_01 = "kr-2022-elem-math:[2수01-01]";
  const CURRICULUM_ANCHOR_03 = "kr-2022-elem-math:[2수01-03]";
  const TOPIC_01_CONCEPT = "kr.mt.math.number-operations.g1-2.s2-01-01.concept";
  const TOPIC_01_REPRESENTATION = "kr.mt.math.number-operations.g1-2.s2-01-01.representation";
  const TOPIC_01_APPLICATION = "kr.mt.math.number-operations.g1-2.s2-01-01.application";
  const TOPIC_03_CONCEPT = "kr.mt.math.number-operations.g1-2.s2-01-03.concept";
  const TOPIC_03_REPRESENTATION = "kr.mt.math.number-operations.g1-2.s2-01-03.representation";
  const TOPIC_03_APPLICATION = "kr.mt.math.number-operations.g1-2.s2-01-03.application";

  window.MOM_COUNTING_CURRICULUM = {
    source: {
      id: "DECK6/korean-elementary-learning-map",
      label: "Korean Elementary Curriculum Learning Ontology",
      url: "https://github.com/DECK6/korean-elementary-learning-map",
      referenceCommit: "3ef0563084aa2a9baaa47da2c1ec0ebf5d7edc5c",
      dataVersion: "kr-full-depth-v0.4",
      ontologyVersion: "0.3.0-p3",
      note: "2022 개정 교육과정 코드와 위치를 연결하는 참고 자료이며, 이 MVP와 학습 단계는 공식 승인 자료가 아닙니다.",
    },
    anchors: [
      {
        id: CURRICULUM_ANCHOR_01,
        code: "[2수01-01]",
        gradeBand: "1~2학년군",
        domain: "수와 연산",
        module: "네 자리 이하의 수",
        summary: "수를 세고 읽고 쓰며, 수와 양을 연결하는 범위를 참고합니다.",
        topicIds: [TOPIC_01_CONCEPT, TOPIC_01_REPRESENTATION, TOPIC_01_APPLICATION],
      },
      {
        id: CURRICULUM_ANCHOR_03,
        code: "[2수01-03]",
        gradeBand: "1~2학년군",
        domain: "수와 연산",
        module: "네 자리 이하의 수",
        summary: "수의 차례를 알고 수의 크기를 비교하는 범위를 참고합니다.",
        topicIds: [TOPIC_03_CONCEPT, TOPIC_03_REPRESENTATION, TOPIC_03_APPLICATION],
      },
    ],
  };

  window.MOM_COUNTING_STAGES = [
    {
      id: "count.stage.1.count-each",
      order: 1,
      title: "수 이름을 붙여 하나씩 세기",
      shortTitle: "하나씩 세기",
      description: "사물 하나에 수 이름 하나를 붙이며 셉니다.",
      prerequisiteStageIds: [],
      curriculumAnchorId: CURRICULUM_ANCHOR_01,
      curriculumTopicIds: [TOPIC_01_CONCEPT, TOPIC_01_APPLICATION],
    },
    {
      id: "count.stage.2.total",
      order: 2,
      title: "센 수를 전체 개수로 알기",
      shortTitle: "전체 개수 알기",
      description: "다 세고 난 수를 전체 개수와 연결합니다.",
      prerequisiteStageIds: ["count.stage.1.count-each"],
      curriculumAnchorId: CURRICULUM_ANCHOR_01,
      curriculumTopicIds: [TOPIC_01_CONCEPT],
    },
    {
      id: "count.stage.3.same-total",
      order: 3,
      title: "순서와 놓인 모양이 달라도 개수 알기",
      shortTitle: "같은 개수 알기",
      description: "세는 순서나 놓인 모양이 달라도 개수가 같음을 살펴봅니다.",
      prerequisiteStageIds: ["count.stage.2.total"],
      curriculumAnchorId: CURRICULUM_ANCHOR_01,
      curriculumTopicIds: [TOPIC_01_APPLICATION],
    },
    {
      id: "count.stage.4.represent",
      order: 4,
      title: "개수와 숫자 연결하기",
      shortTitle: "개수와 숫자 잇기",
      description: "같은 수를 그림, 점, 손가락, 숫자로 연결합니다.",
      prerequisiteStageIds: ["count.stage.3.same-total"],
      curriculumAnchorId: CURRICULUM_ANCHOR_01,
      curriculumTopicIds: [TOPIC_01_REPRESENTATION],
    },
    {
      id: "count.stage.5.compare",
      order: 5,
      title: "두 수의 많고 적음 비교하기",
      shortTitle: "수 비교하기",
      description: "두 모임과 두 숫자의 크기를 비교합니다.",
      prerequisiteStageIds: ["count.stage.4.represent"],
      curriculumAnchorId: CURRICULUM_ANCHOR_03,
      curriculumTopicIds: [TOPIC_03_CONCEPT, TOPIC_03_REPRESENTATION],
    },
    {
      id: "count.stage.6.sequence",
      order: 6,
      title: "앞뒤 수를 이어 세기",
      shortTitle: "이어 세기",
      description: "하나 더·덜을 알고 앞이나 뒤로 이어 셉니다.",
      prerequisiteStageIds: ["count.stage.5.compare"],
      curriculumAnchorId: CURRICULUM_ANCHOR_03,
      curriculumTopicIds: [TOPIC_03_CONCEPT, TOPIC_03_APPLICATION],
    },
    {
      id: "count.stage.7.skip",
      order: 7,
      title: "같은 수만큼 뛰어 세기",
      shortTitle: "뛰어 세기",
      description: "2, 5, 10씩 같은 수만큼 커지는 차례를 이어갑니다.",
      prerequisiteStageIds: ["count.stage.6.sequence"],
      curriculumAnchorId: CURRICULUM_ANCHOR_03,
      curriculumTopicIds: [TOPIC_03_APPLICATION],
    },
  ];

  window.MOM_COUNTING_CONCEPTS = [
    { id: "count.number_words_to_20", title: "20까지 수 이름 순서", axis: "number-sequence", stageId: "count.stage.1.count-each", curriculumAnchorId: CURRICULUM_ANCHOR_01, curriculumTopicId: TOPIC_01_CONCEPT },
    { id: "count.one_to_one", title: "사물과 수 이름의 일대일 대응", axis: "one-to-one", stageId: "count.stage.1.count-each", curriculumAnchorId: CURRICULUM_ANCHOR_01, curriculumTopicId: TOPIC_01_APPLICATION },
    { id: "count.cardinality", title: "마지막 수와 전체 개수", axis: "cardinality", stageId: "count.stage.2.total", curriculumAnchorId: CURRICULUM_ANCHOR_01, curriculumTopicId: TOPIC_01_CONCEPT },
    { id: "count.order_irrelevance", title: "세는 순서와 무관한 개수", axis: "cardinality", stageId: "count.stage.3.same-total", curriculumAnchorId: CURRICULUM_ANCHOR_01, curriculumTopicId: TOPIC_01_APPLICATION },
    { id: "count.conservation", title: "배열이 바뀌어도 같은 개수", axis: "cardinality", stageId: "count.stage.3.same-total", curriculumAnchorId: CURRICULUM_ANCHOR_01, curriculumTopicId: TOPIC_01_APPLICATION },
    { id: "count.numeral_quantity", title: "숫자와 수량 연결", axis: "representation", stageId: "count.stage.4.represent", curriculumAnchorId: CURRICULUM_ANCHOR_01, curriculumTopicId: TOPIC_01_REPRESENTATION },
    { id: "count.multiple_representations", title: "수량의 여러 표상", axis: "representation", stageId: "count.stage.4.represent", curriculumAnchorId: CURRICULUM_ANCHOR_01, curriculumTopicId: TOPIC_01_REPRESENTATION },
    { id: "count.compare_sets", title: "두 모임의 많고 적음", axis: "comparison-patterns", stageId: "count.stage.5.compare", curriculumAnchorId: CURRICULUM_ANCHOR_03, curriculumTopicId: TOPIC_03_REPRESENTATION },
    { id: "count.compare_numerals", title: "두 수의 크기 비교", axis: "comparison-patterns", stageId: "count.stage.5.compare", curriculumAnchorId: CURRICULUM_ANCHOR_03, curriculumTopicId: TOPIC_03_CONCEPT },
    { id: "count.one_more_less", title: "하나 더와 하나 덜", axis: "comparison-patterns", stageId: "count.stage.6.sequence", curriculumAnchorId: CURRICULUM_ANCHOR_03, curriculumTopicId: TOPIC_03_CONCEPT },
    { id: "count.count_on", title: "임의의 수에서 이어 세기", axis: "number-sequence", stageId: "count.stage.6.sequence", curriculumAnchorId: CURRICULUM_ANCHOR_03, curriculumTopicId: TOPIC_03_APPLICATION },
    { id: "count.count_back", title: "거꾸로 세기", axis: "number-sequence", stageId: "count.stage.6.sequence", curriculumAnchorId: CURRICULUM_ANCHOR_03, curriculumTopicId: TOPIC_03_APPLICATION },
    { id: "count.skip_2_5_10", title: "2·5·10씩 뛰어 세기", axis: "comparison-patterns", stageId: "count.stage.7.skip", curriculumAnchorId: CURRICULUM_ANCHOR_03, curriculumTopicId: TOPIC_03_APPLICATION },
    { id: "count.skip_extended", title: "여러 간격으로 뛰어 세기", axis: "comparison-patterns", stageId: "count.stage.7.skip", curriculumAnchorId: CURRICULUM_ANCHOR_03, curriculumTopicId: TOPIC_03_APPLICATION, extension: true },
  ];

  window.MOM_COUNTING_QUESTIONS = [
    {
      id: "c1",
      title: "사과 세기",
      stem: "사과를 세어 봅니다.",
      focus: "하나씩 세기",
      steps: [
        {
          id: "c1-touch",
          title: "사과는 몇 개일까",
          prompt: "사과는 모두 몇 개인가요?",
          skillIds: ["count.one_to_one", "count.number_words_to_20"],
          axis: "one-to-one",
          interaction: objectSet(["🍎", "🍎", "🍎", "🍎", "🍎", "🍎", "🍎"], "ordered", "사과를 하나씩 눌러 세어 보세요."),
          choices: [
            choice("seven", "7개", true, "count-secure-one-to-one", null, "일대일 대응으로 7개를 셌습니다."),
            choice("six", "6개", false, "count-omission", "사물을 빠뜨려 셀 가능성", "누른 순서에서 빠뜨린 사물이 있는지 확인해 주세요."),
            choice("eight", "8개", false, "count-duplicate", "같은 사물을 두 번 셀 가능성", "센 사물을 옮기거나 표시하며 한 번씩 세어 보게 해주세요."),
          ],
        },
        {
          id: "c1-cardinality",
          title: "사과는 모두 몇 개",
          prompt: "사과는 모두 몇 개인가요?",
          skillIds: ["count.cardinality"],
          axis: "cardinality",
          interaction: displaySet(["🍎", "🍎", "🍎", "🍎", "🍎", "🍎", "🍎"]),
          choices: [
            choice("seven", "7개", true, "count-secure-cardinality", null, "마지막 수를 전체 개수와 연결합니다."),
            choice("six", "6개", false, "count-sequence-offset", "수 이름과 사물 대응이 한 칸 어긋남", "사물을 짚는 순간과 수를 말하는 순간을 맞춰주세요."),
            choice("eight", "8개", false, "count-sequence-offset", "수 이름과 사물 대응이 한 칸 어긋남", "사물 하나에 수 이름 하나를 붙여 보게 해주세요."),
          ],
        },
      ],
    },
    {
      id: "c2",
      title: "별 세기",
      stem: "별을 세어 봅니다.",
      focus: "하나씩 세기",
      steps: [
        {
          id: "c2-touch",
          title: "별은 몇 개일까",
          prompt: "별은 모두 몇 개인가요?",
          skillIds: ["count.one_to_one"],
          axis: "one-to-one",
          interaction: objectSet(["★", "★", "★", "★", "★", "★", "★", "★", "★"], "scattered", "별을 하나씩 눌러 세어 보세요."),
          choices: [
            choice("nine", "9개", true, "count-secure-one-to-one", null, "흩어진 사물을 빠뜨리지 않고 셌습니다."),
            choice("eight", "8개", false, "count-omission", "흩어진 사물을 빠뜨림", "한쪽에서 시작해 센 사물을 표시하는 전략을 안내해 주세요."),
            choice("ten", "10개", false, "count-duplicate", "흩어진 사물을 중복해 셈", "센 그림과 아직 세지 않은 그림을 구분하게 해주세요."),
          ],
        },
      ],
    },
    {
      id: "c3",
      title: "공 세기",
      stem: "공을 세어 봅니다.",
      focus: "공 세기",
      steps: [
        {
          id: "c3-total",
          title: "공은 모두 몇 개",
          prompt: "공은 모두 몇 개인가요?",
          skillIds: ["count.cardinality"],
          axis: "cardinality",
          interaction: displaySet(["●", "●", "●", "●", "●", "●"]),
          choices: [
            choice("six", "6개", true, "count-secure-cardinality", null, "마지막 수를 전체 개수로 이해합니다."),
            choice("five", "5개", false, "count-sequence-offset", "수 이름과 사물 대응이 한 칸 어긋남", "사물을 짚는 순간과 수를 말하는 순간을 맞춰주세요."),
            choice("seven", "7개", false, "count-sequence-offset", "수 이름과 사물 대응이 한 칸 어긋남", "마지막에 말한 수가 모두의 개수라는 점을 연결해 주세요."),
          ],
        },
        {
          id: "c3-order",
          title: "오른쪽부터 세기",
          prompt: "오른쪽 공부터 세면 모두 몇 개인가요?",
          skillIds: ["count.order_irrelevance", "count.cardinality"],
          axis: "cardinality",
          interaction: displaySet(["●", "●", "●", "●", "●", "●"]),
          choices: [
            choice("six", "6개", true, "count-secure-order", null, "세는 순서가 달라도 개수는 같음을 압니다."),
            choice("seven", "7개", false, "count-order-dependent", "세는 순서에 따라 개수가 바뀐다고 봄", "같은 물건을 다른 순서로 세어 결과를 비교해 주세요."),
            choice("five", "5개", false, "count-order-dependent", "세는 순서가 달라지며 하나를 놓침", "어느 사물부터 시작해도 하나씩 대응할 수 있게 해주세요."),
          ],
        },
      ],
    },
    {
      id: "c4",
      title: "줄을 바꾼 단추",
      stem: "단추를 세어 봅니다.",
      focus: "단추 세기",
      steps: [
        {
          id: "c4-conservation",
          title: "두 줄의 단추",
          prompt: "두 줄의 단추 수는 같은가요?",
          skillIds: ["count.conservation"],
          axis: "cardinality",
          interaction: { type: "object-rows", rows: [["●", "●", "●", "●", "●", "●", "●", "●"], ["●", "●", "●", "●", "●", "●", "●", "●"]] },
          choices: [
            choice("eight", "둘 다 8개예요", true, "count-secure-conservation", null, "배열과 간격이 달라도 개수는 같다고 봅니다."),
            choice("more", "아랫줄이 더 많아요", false, "count-spacing-bias", "간격이 넓으면 더 많다고 봄", "같은 사물을 직접 옮겨 간격만 바뀌는 장면을 보여주세요."),
            choice("less", "윗줄이 더 많아요", false, "count-length-bias", "줄의 모양을 개수로 판단함", "줄 길이와 사물 개수를 따로 비교하게 해주세요."),
          ],
        },
        {
          id: "c4-rearrange",
          title: "둥글게 놓은 단추",
          prompt: "단추는 모두 몇 개인가요?",
          skillIds: ["count.conservation"],
          axis: "cardinality",
          interaction: displaySet(["●", "●", "●", "●", "●", "●", "●", "●"], "circle"),
          choices: [
            choice("same", "8개", true, "count-secure-conservation", null, "배치 변화와 수량 변화를 구분합니다."),
            choice("seven", "7개", false, "count-arrangement-bias", "배열이 바뀌며 하나를 놓침", "물건을 더하거나 빼지 않으면 개수는 유지됨을 확인해 주세요."),
            choice("nine", "9개", false, "count-whole-shape-bias", "배열에서 같은 사물을 거듭 셈", "모양 안의 낱개를 하나씩 대응해 보게 해주세요."),
          ],
        },
      ],
    },
    {
      id: "c5",
      title: "숫자와 그림 잇기",
      stem: "같은 수를 찾아봅니다.",
      focus: "같은 수 찾기",
      steps: [
        {
          id: "c5-numeral",
          title: "점 7개 찾기",
          prompt: "점이 7개인 것을 고르세요.",
          skillIds: ["count.numeral_quantity"],
          axis: "representation",
          choices: [
            choice("seven-dots", "● ● ● ● ● ● ●", true, "count-secure-representation", null, "숫자 7을 수량과 연결합니다."),
            choice("six-dots", "● ● ● ● ● ●", false, "count-symbol-quantity-mismatch", "숫자와 수량 연결이 한 칸 어긋남", "숫자를 읽고 그만큼만 대상을 놓아보게 해주세요."),
            choice("eight-dots", "● ● ● ● ● ● ● ●", false, "count-symbol-quantity-mismatch", "숫자와 수량 연결이 한 칸 어긋남", "마지막 수와 숫자 기호를 함께 짚어주세요."),
          ],
        },
        {
          id: "c5-fingers",
          title: "펴진 손가락 세기",
          prompt: "펴진 손가락은 몇 개인가요?",
          skillIds: ["count.multiple_representations", "count.numeral_quantity"],
          axis: "representation",
          interaction: displaySet(["🖐️"]),
          choices: [
            choice("five", "5", true, "count-secure-representation", null, "손가락 수량을 숫자 5와 연결합니다."),
            choice("four", "4", false, "count-representation-mismatch", "표상 사이 수량 연결이 어긋남", "손가락을 하나씩 숫자 이름과 대응해 주세요."),
            choice("ten", "10", false, "count-two-hands-default", "손 전체를 항상 10으로 봄", "펴진 손가락만 세어 수량을 정하게 해주세요."),
          ],
        },
        {
          id: "c5-number-line",
          title: "줄에서 6 찾기",
          prompt: "줄에서 6을 누르세요.",
          skillIds: ["count.numeral_quantity", "count.compare_numerals"],
          axis: "representation",
          interaction: numberLine(0, 10, [4, 6, 8]),
          choices: [
            choice("4", "4", false, "count-number-line-position", "수직선 위치와 숫자 연결이 어긋남", "0부터 한 칸씩 이동하며 수와 위치를 연결해 주세요."),
            choice("6", "6", true, "count-secure-number-line", null, "수직선의 위치와 숫자 6을 연결합니다."),
            choice("8", "8", false, "count-number-line-position", "수직선 위치와 숫자 연결이 어긋남", "칸과 눈금을 구분해 하나씩 짚어주세요."),
          ],
        },
      ],
    },
    {
      id: "c6",
      title: "어느 쪽이 더 많을까",
      stem: "별이 더 많은 쪽을 찾습니다.",
      focus: "더 많은 쪽",
      steps: [
        {
          id: "c6-groups",
          title: "별이 더 많은 쪽",
          prompt: "어느 쪽에 별이 더 많나요?",
          skillIds: ["count.compare_sets"],
          axis: "comparison-patterns",
          interaction: { type: "comparison-sets", groups: [{ label: "가", items: ["★", "★", "★", "★", "★", "★"] }, { label: "나", items: ["★", "★", "★", "★", "★", "★", "★", "★"] }] },
          choices: [
            choice("b", "나 쪽", true, "count-secure-compare", null, "두 모임의 수량을 비교합니다."),
            choice("a", "가 쪽", false, "count-visual-length-bias", "모임의 겉모양으로 많고 적음을 판단함", "두 모임을 하나씩 짝지어 남는 쪽을 찾게 해주세요."),
            choice("same", "같아요", false, "count-compare-uncertain", "수량 차이를 구분하지 못함", "하나씩 짝지어 남는 별을 직접 보게 해주세요."),
          ],
        },
        {
          id: "c6-numerals",
          title: "두 수 비교하기",
          prompt: "9와 6 중 더 큰 수를 고르세요.",
          skillIds: ["count.compare_numerals"],
          axis: "comparison-patterns",
          choices: [
            choice("nine", "9", true, "count-secure-compare", null, "두 숫자의 크기를 비교합니다."),
            choice("six", "6", false, "count-numeral-shape-bias", "숫자 모양으로 크기를 판단함", "각 숫자만큼 물건을 놓아 수량으로 비교해 주세요."),
            choice("same", "같아요", false, "count-compare-uncertain", "두 숫자의 크기 차이를 구분하지 못함", "수직선에서 두 수의 위치를 비교해 주세요."),
          ],
        },
      ],
    },
    {
      id: "c7",
      title: "하나 더, 하나 덜",
      stem: "수에서 하나가 늘거나 줄 때의 변화를 봅니다.",
      focus: "이웃한 수",
      steps: [
        {
          id: "c7-more",
          title: "8보다 하나 더",
          prompt: "8보다 하나 더 큰 수는 무엇인가요?",
          skillIds: ["count.one_more_less", "count.count_on"],
          axis: "comparison-patterns",
          choices: [
            choice("nine", "9", true, "count-secure-one-more", null, "하나 더와 다음 수를 연결합니다."),
            choice("seven", "7", false, "count-more-less-reversed", "하나 더와 하나 덜을 반대로 적용함", "수직선에서 오른쪽 한 칸과 하나 더를 연결해 주세요."),
            choice("ten", "10", false, "count-skip-neighbor", "이웃한 수를 한 칸 건너뜀", "8에서 한 개만 추가해 다시 세어 보게 해주세요."),
          ],
        },
        {
          id: "c7-less",
          title: "12보다 하나 덜",
          prompt: "12보다 하나 작은 수는 무엇인가요?",
          skillIds: ["count.one_more_less", "count.count_back"],
          axis: "comparison-patterns",
          choices: [
            choice("eleven", "11", true, "count-secure-one-less", null, "하나 덜과 앞의 수를 연결합니다."),
            choice("thirteen", "13", false, "count-more-less-reversed", "하나 더와 하나 덜을 반대로 적용함", "12에서 하나를 없애는 구체물 활동으로 연결해 주세요."),
            choice("ten", "10", false, "count-skip-neighbor", "이웃한 수를 한 칸 건너뜀", "거꾸로 한 칸만 이동하게 해주세요."),
          ],
        },
      ],
    },
    {
      id: "c8",
      title: "23부터 이어 세기",
      stem: "수를 이어서 세어 봅니다.",
      focus: "이어 세기",
      steps: [
        {
          id: "c8-next",
          title: "다음 수 찾기",
          prompt: "23, 24 다음에 오는 수는 무엇인가요?",
          skillIds: ["count.count_on"],
          axis: "number-sequence",
          interaction: sequence([23, 24, null]),
          choices: [
            choice("25", "25", true, "count-secure-count-on", null, "임의의 수에서 한 칸씩 이어 셉니다."),
            choice("23", "23", false, "count-restart-loop", "시작 수를 반복함", "마지막으로 말한 수 다음부터 이어 세게 해주세요."),
            choice("26", "26", false, "count-sequence-skip", "수 이름을 하나 건너뜀", "수직선에서 한 칸씩 이동하며 말하게 해주세요."),
          ],
        },
        {
          id: "c8-boundary",
          title: "29 다음 수",
          prompt: "28, 29 다음에 오는 수는 무엇인가요?",
          skillIds: ["count.count_on"],
          axis: "number-sequence",
          interaction: sequence([28, 29, null]),
          choices: [
            choice("30", "30", true, "count-secure-decade", null, "십의 경계를 넘어 이어 셉니다."),
            choice("20", "20", false, "count-decade-reset", "십의 경계에서 일의 자릿수만 바꿈", "29 다음에는 새로운 십 3개가 됨을 묶음으로 보여주세요."),
            choice("210", "210", false, "count-place-concatenation", "2와 다음 수 10을 이어 붙임", "29 다음 수를 수 모형과 숫자로 함께 확인해 주세요."),
          ],
        },
        {
          id: "c8-middle",
          title: "빈칸 채우기",
          prompt: "빈칸에 알맞은 수를 고르세요.",
          skillIds: ["count.count_on"],
          axis: "number-sequence",
          interaction: sequence([41, 42, null, 44]),
          choices: [
            choice("43", "43", true, "count-secure-count-on", null, "수열의 중간 수를 정확히 찾습니다."),
            choice("40", "40", false, "count-restart-decade", "십의 시작으로 돌아감", "42 다음 수를 한 칸만 이어 말하게 해주세요."),
            choice("45", "45", false, "count-sequence-skip", "빈칸 뒤의 수 다음을 고름", "빈칸 앞뒤 수를 함께 읽어 위치를 확인하게 해주세요."),
          ],
        },
      ],
    },
    {
      id: "c9",
      title: "거꾸로 세기",
      stem: "큰 수에서 하나씩 줄여 가며 셉니다.",
      focus: "거꾸로 세기",
      steps: [
        {
          id: "c9-back",
          title: "20에서 거꾸로",
          prompt: "20, 19 다음에 오는 수는 무엇인가요?",
          skillIds: ["count.count_back"],
          axis: "number-sequence",
          interaction: sequence([20, 19, null]),
          choices: [
            choice("18", "18", true, "count-secure-count-back", null, "하나씩 줄여 거꾸로 셉니다."),
            choice("21", "21", false, "count-direction-confusion", "거꾸로 세기에서 수를 늘림", "수직선에서 왼쪽 한 칸과 하나 덜을 연결해 주세요."),
            choice("17", "17", false, "count-sequence-skip", "거꾸로 셀 때 수를 하나 건너뜀", "손가락을 하나씩 접으며 한 칸씩 줄여 보게 해주세요."),
          ],
        },
        {
          id: "c9-boundary",
          title: "10 앞의 수",
          prompt: "11, 10 다음에 오는 수는 무엇인가요?",
          skillIds: ["count.count_back"],
          axis: "number-sequence",
          interaction: sequence([11, 10, null]),
          choices: [
            choice("9", "9", true, "count-secure-count-back", null, "십의 경계를 거꾸로 넘습니다."),
            choice("0", "0", false, "count-decade-drop", "10에서 십만 없앰", "10을 낱개 10개로 풀어 하나를 덜어 보게 해주세요."),
            choice("12", "12", false, "count-direction-confusion", "거꾸로 세기에서 수를 늘림", "거꾸로는 수가 하나씩 작아짐을 확인해 주세요."),
          ],
        },
        {
          id: "c9-number-line",
          title: "왼쪽 한 칸",
          prompt: "줄에서 7보다 하나 작은 수를 누르세요.",
          skillIds: ["count.count_back", "count.one_more_less"],
          axis: "number-sequence",
          interaction: numberLine(3, 9, [5, 6, 8]),
          choices: [
            choice("5", "5", false, "count-skip-neighbor", "왼쪽으로 두 칸 이동함", "7에서 왼쪽으로 한 칸만 이동하게 해주세요."),
            choice("6", "6", true, "count-secure-count-back", null, "수직선에서 하나 작은 수를 찾습니다."),
            choice("8", "8", false, "count-direction-confusion", "작은 수를 찾을 때 오른쪽으로 이동함", "왼쪽은 작아지는 방향임을 몸 움직임과 연결해 주세요."),
          ],
        },
      ],
    },
    {
      id: "c10",
      title: "2씩, 5씩, 10씩 세기",
      stem: "수를 2씩, 5씩, 10씩 세어 봅니다.",
      focus: "뛰어 세기",
      steps: [
        {
          id: "c10-twos",
          title: "2씩 세기",
          prompt: "2, 4, 6 다음에 오는 수는 무엇인가요?",
          skillIds: ["count.skip_2_5_10"],
          axis: "comparison-patterns",
          interaction: sequence([2, 4, 6, null]),
          choices: [
            choice("8", "8", true, "count-secure-skip", null, "2씩 커지는 규칙을 이어갑니다."),
            choice("7", "7", false, "count-skip-to-ones", "뛰어 세다가 1씩 셈", "매번 2만큼 이동하는 것을 수직선에서 확인해 주세요."),
            choice("10", "10", false, "count-skip-double", "간격을 한 번 더 건너뜀", "한 번 이동할 때 더하는 수가 2임을 말하게 해주세요."),
          ],
        },
        {
          id: "c10-fives",
          title: "5씩 세기",
          prompt: "5, 10, 15 다음에 오는 수는 무엇인가요?",
          skillIds: ["count.skip_2_5_10"],
          axis: "comparison-patterns",
          interaction: sequence([5, 10, 15, null]),
          choices: [
            choice("20", "20", true, "count-secure-skip", null, "5씩 커지는 규칙을 이어갑니다."),
            choice("16", "16", false, "count-skip-to-ones", "뛰어 세다가 1씩 셈", "5개 묶음을 하나 더 놓아 보게 해주세요."),
            choice("25", "25", false, "count-skip-double", "5를 두 번 더함", "한 단계마다 5씩만 커짐을 확인해 주세요."),
          ],
        },
        {
          id: "c10-tens",
          title: "10씩 세기",
          prompt: "30, 40, 50 다음에 오는 수는 무엇인가요?",
          skillIds: ["count.skip_2_5_10"],
          axis: "comparison-patterns",
          interaction: sequence([30, 40, 50, null]),
          choices: [
            choice("60", "60", true, "count-secure-skip", null, "10씩 커지는 규칙을 이어갑니다."),
            choice("51", "51", false, "count-skip-to-ones", "뛰어 세다가 1씩 셈", "십 묶음 하나가 늘어날 때 십의 자리만 변함을 보여주세요."),
            choice("70", "70", false, "count-skip-double", "10을 두 번 더함", "한 단계의 간격이 10임을 수 모형으로 확인해 주세요."),
          ],
        },
        {
          id: "c10-start",
          title: "다른 수에서 10씩",
          prompt: "13에서 시작해 10씩 세면 다음 수는 무엇인가요?",
          skillIds: ["count.skip_2_5_10"],
          axis: "comparison-patterns",
          choices: [
            choice("23", "23", true, "count-secure-skip-start", null, "임의의 수에서도 10씩 더합니다."),
            choice("20", "20", false, "count-skip-rounding", "다음 십의 수로 이동함", "13에 십 묶음 하나를 더해 일의 자리 3이 유지됨을 보여주세요."),
            choice("14", "14", false, "count-skip-to-ones", "10씩 대신 1씩 셈", "10만큼 이동하는 것과 다음 수를 말하는 것을 구분해 주세요."),
          ],
        },
      ],
    },
  ];

  window.MOM_DIAGNOSTIC_SETS = [
    {
      id: "counting-primary",
      title: "초등 수 세기",
      shortTitle: "수 세기",
      gradeLabel: "초등 1~2학년",
      description: "하나씩 세기, 전체 개수, 수 표현, 비교, 이어·거꾸로·뛰어 세기를 살펴봅니다.",
      questionCountLabel: "10문항 · 24개 판단",
      questions: window.MOM_COUNTING_QUESTIONS,
      concepts: window.MOM_COUNTING_CONCEPTS,
      curriculum: window.MOM_COUNTING_CURRICULUM,
      learnerStages: window.MOM_COUNTING_STAGES,
      teacherMode: "counting-axes",
    },
    {
      id: "fraction-grade5",
      title: "5학년 분수",
      shortTitle: "분수",
      gradeLabel: "초등 5학년",
      description: "동치분수, 통분, 분모가 다른 분수의 덧셈과 뺄셈 과정을 살펴봅니다.",
      questionCountLabel: "10문항 · 34개 판단",
      questions: window.MOM_QUESTIONS || [],
      concepts: [],
      teacherMode: "signals",
    },
  ];
})();
