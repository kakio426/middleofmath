import type {
  DiagnosisSet,
  Judgment,
  SignalDefinition
} from "@middle-of-math/domain";
import { grade3Semester1Anchor } from "./curriculum-anchor-registry";
import { diagnosisSetSchema } from "./schema";

type Answer = { id: string; label: string };
type JudgmentInput = Omit<Judgment, "choices" | "interaction"> & {
  signalId: string;
  answers: Answer[];
};

function judgment(input: JudgmentInput): Judgment {
  const { signalId, answers, ...rest } = input;
  return {
    ...rest,
    interaction: { type: "choice", version: 1 },
    choices: answers.map((answer, index) => ({
      ...answer,
      correct: index === 0,
      ...(index === 0 ? {} : { signalIds: [signalId] })
    }))
  };
}

function signal(
  id: string,
  title: string,
  severity: SignalDefinition["severity"],
  interpretation: string,
  teachingMove: string
): SignalDefinition {
  return {
    id,
    title,
    severity,
    teacherInterpretation: interpretation,
    teachingMove,
    parentSummary: `${title} 생각을 구체물과 식으로 연결하는 연습을 하고 있습니다.`,
    homePrompt: `${teachingMove.replace(/하세요\.?$/, "해 보게 해주세요.")}`
  };
}

const anchors = [
  "[4수01-04]",
  "[4수01-05]",
  "[4수01-06]",
  "[4수01-09]",
  "[4수03-16]"
].map(grade3Semester1Anchor);

const stages: DiagnosisSet["learnerStages"] = [
  {
    id: "multiplication.equal-groups", order: 1, unitId: "multiplication",
    title: "같은 수의 묶음을 곱셈으로 나타내기", shortTitle: "같은 묶음을 곱셈으로 나타냄",
    curriculumAnchorIds: ["[4수01-04]"], prerequisiteStageIds: []
  },
  {
    id: "multiplication.two-digit-by-one", order: 2, unitId: "multiplication",
    title: "두 자리 수에 한 자리 수를 곱하기", shortTitle: "자릿값을 살려 곱함",
    curriculumAnchorIds: ["[4수01-04]"], prerequisiteStageIds: ["multiplication.equal-groups"]
  },
  {
    id: "division.equal-partition", order: 3, unitId: "division",
    title: "전체를 똑같이 나누기", shortTitle: "한 묶음의 수를 구함",
    curriculumAnchorIds: ["[4수01-05]"], prerequisiteStageIds: []
  },
  {
    id: "division.multiplication-link", order: 4, unitId: "division",
    title: "곱셈식과 나눗셈식 연결하기", shortTitle: "곱셈과 나눗셈을 연결함",
    curriculumAnchorIds: ["[4수01-05]", "[4수01-06]"], prerequisiteStageIds: ["division.equal-partition"]
  },
  {
    id: "fraction.equal-partition", order: 5, unitId: "fraction",
    title: "전체를 똑같은 크기로 나누기", shortTitle: "똑같이 나뉜 조각을 찾음",
    curriculumAnchorIds: ["[4수01-09]"], prerequisiteStageIds: []
  },
  {
    id: "fraction.part-of-whole", order: 6, unitId: "fraction",
    title: "전체 중 색칠한 부분을 분수로 나타내기", shortTitle: "부분을 분수로 나타냄",
    curriculumAnchorIds: ["[4수01-09]"], prerequisiteStageIds: ["fraction.equal-partition"]
  },
  {
    id: "length.unit-choice", order: 7, unitId: "length",
    title: "물건에 알맞은 길이 단위 고르기", shortTitle: "알맞은 길이 단위를 고름",
    curriculumAnchorIds: ["[4수03-16]"], prerequisiteStageIds: []
  },
  {
    id: "length.unit-convert", order: 8, unitId: "length",
    title: "길이 단위 사이의 관계 사용하기", shortTitle: "길이 단위를 바꿈",
    curriculumAnchorIds: ["[4수03-16]"], prerequisiteStageIds: ["length.unit-choice"]
  }
];

const signals: SignalDefinition[] = [
  signal("multiplication.equal-groups", "같은 묶음과 곱셈", "medium", "묶음 수와 한 묶음의 수를 전체와 연결하는 과정이 흔들립니다.", "그림에서 묶음 수와 한 묶음의 수를 각각 짚어 식을 쓰게 하세요."),
  signal("multiplication.place-value", "곱셈의 자릿값", "high", "두 자리 수를 십과 일로 나누어 곱하는 과정이 흔들립니다.", "십의 자리 수가 나타내는 값을 말한 뒤 곱하게 하세요."),
  signal("division.equal-partition", "똑같이 나누기", "high", "전체와 묶음 수를 이용해 한 묶음의 수를 찾는 과정이 흔들립니다.", "전체를 실제로 같은 묶음에 하나씩 나누어 놓게 하세요."),
  signal("division.multiplication-link", "곱셈과 나눗셈의 관계", "high", "곱셈식의 세 수를 나눗셈식으로 바꾸는 과정이 흔들립니다.", "곱셈식에서 전체와 두 요인을 표시하고 나눗셈식으로 바꾸게 하세요."),
  signal("fraction.equal-partition", "분수의 등분할", "medium", "분수로 나타내려면 전체를 똑같이 나누어야 한다는 조건이 흔들립니다.", "조각을 겹쳐 보며 크기가 모두 같은지 먼저 확인하게 하세요."),
  signal("fraction.part-of-whole", "부분과 전체의 분수", "medium", "분모에 전체 조각 수, 분자에 고른 조각 수를 놓는 과정이 흔들립니다.", "전체 조각과 색칠한 조각을 다른 색으로 세어 분수에 놓게 하세요."),
  signal("length.unit-choice", "길이 단위 선택", "low", "물건 크기에 맞는 mm·cm·m·km 단위를 고르는 근거가 더 필요합니다.", "손가락, 문, 학교 사이 거리와 단위를 짝지어 보세요."),
  signal("length.unit-convert", "길이 단위 관계", "medium", "m와 cm, km와 m 사이의 배수를 적용하는 과정이 흔들립니다.", "1m=100cm와 1km=1000m를 단위표에 놓고 바꾸게 하세요."),
  signal("needs-scaffold", "구체물 지원 필요", "low", "한 번 더 구체물로 확인하면 생각을 드러낼 수 있습니다.", "수나 식을 바로 요구하기 전에 구체물을 움직이게 하세요."),
  signal("needs-review", "추가 관찰 필요", "low", "현재 근거만으로는 한 가지 생각으로 확정하기 어렵습니다.", "다른 수와 상황으로 같은 생각을 한 번 더 확인하세요.")
];

const judgments: Judgment[] = [
  judgment({
    id: "g3s1-mul-01", unitId: "multiplication", learnerStageId: "multiplication.equal-groups",
    curriculumAnchorIds: ["[4수01-04]"], context: "연필이 한 봉지에 3자루씩 4봉지 있어요.",
    prompt: "연필 수를 나타내는 식과 답은 무엇일까요?", visual: { kind: "array", rows: 4, columns: 3, label: "연필" },
    signalId: "multiplication.equal-groups",
    answers: [{ id: "3x4", label: "3×4=12" }, { id: "3plus4", label: "3+4=7" }, { id: "4-only", label: "4" }]
  }),
  judgment({
    id: "g3s1-mul-02", unitId: "multiplication", learnerStageId: "multiplication.equal-groups",
    curriculumAnchorIds: ["[4수01-04]"], context: "붙임 딱지를 한 줄에 5장씩 6줄 붙였어요.",
    prompt: "붙임 딱지는 모두 몇 장일까요?", visual: { kind: "array", rows: 6, columns: 5, label: "붙임 딱지" },
    signalId: "multiplication.equal-groups",
    answers: [{ id: "30", label: "30장" }, { id: "11", label: "11장" }, { id: "6-only", label: "6장" }]
  }),
  judgment({
    id: "g3s1-mul-03", unitId: "multiplication", learnerStageId: "multiplication.two-digit-by-one",
    curriculumAnchorIds: ["[4수01-04]"], prompt: "23×3을 자릿값에 맞게 나누어 계산한 식은 어느 것일까요?", visual: { kind: "none" },
    signalId: "multiplication.place-value",
    answers: [
      { id: "decompose-correct", label: "(20×3)+(3×3)" },
      { id: "decompose-place-dropped", label: "(2×3)+(3×3)" },
      { id: "decompose-addition", label: "23+3" }
    ]
  }),
  judgment({
    id: "g3s1-mul-04", unitId: "multiplication", learnerStageId: "multiplication.two-digit-by-one",
    curriculumAnchorIds: ["[4수01-04]"], context: "공책이 42권씩 든 상자가 2개 있어요.",
    prompt: "공책은 모두 몇 권일까요?", visual: { kind: "none" },
    signalId: "multiplication.place-value",
    answers: [{ id: "84", label: "84권" }, { id: "8", label: "8권" }, { id: "44", label: "44권" }]
  }),
  judgment({
    id: "g3s1-div-01", unitId: "division", learnerStageId: "division.equal-partition",
    curriculumAnchorIds: ["[4수01-05]"], context: "쿠키 12개를 3명에게 똑같이 나누어 줘요.",
    prompt: "한 사람은 몇 개씩 받을까요?", visual: { kind: "division-groups", total: 12, groups: 3 },
    signalId: "division.equal-partition",
    answers: [{ id: "4", label: "4개" }, { id: "3", label: "3개" }, { id: "9", label: "9개" }]
  }),
  judgment({
    id: "g3s1-div-02", unitId: "division", learnerStageId: "division.equal-partition",
    curriculumAnchorIds: ["[4수01-05]"], context: "색연필 20자루를 상자 5개에 같은 수씩 담은 모습이에요.",
    prompt: "5×□=20에서 □에 알맞은 수는 무엇일까요?",
    visual: { kind: "array", rows: 5, columns: 4, label: "색연필을 같은 수씩 놓은 다섯 줄" },
    signalId: "division.equal-partition",
    answers: [{ id: "missing-factor-4", label: "4자루" }, { id: "5", label: "5자루" }, { id: "15", label: "15자루" }]
  }),
  judgment({
    id: "g3s1-div-03", unitId: "division", learnerStageId: "division.multiplication-link",
    curriculumAnchorIds: ["[4수01-05]", "[4수01-06]"], context: "4×6=24예요.",
    prompt: "24÷4의 몫은 얼마일까요?", visual: { kind: "none" },
    signalId: "division.multiplication-link",
    answers: [{ id: "6", label: "6" }, { id: "4", label: "4" }, { id: "20", label: "20" }]
  }),
  judgment({
    id: "g3s1-div-04", unitId: "division", learnerStageId: "division.multiplication-link",
    curriculumAnchorIds: ["[4수01-05]", "[4수01-06]"], context: "붙임 딱지 35장을 5장씩 한 묶음으로 만들어요.",
    prompt: "몇 묶음이 되는지 곱셈을 떠올려 구해 보세요.", visual: { kind: "none" },
    signalId: "division.multiplication-link",
    answers: [{ id: "7", label: "7" }, { id: "5", label: "5" }, { id: "30", label: "30" }]
  }),
  judgment({
    id: "g3s1-frac-01", unitId: "fraction", learnerStageId: "fraction.equal-partition",
    curriculumAnchorIds: ["[4수01-09]"], prompt: "색칠한 한 조각이 전체의 1/4인 그림은 어느 것일까요?",
    visual: {
      kind: "partition-diagrams",
      diagrams: [
        { label: "가", parts: [1, 1, 1, 1], highlightedPart: 0 },
        { label: "나", parts: [1, 2, 1, 2], highlightedPart: 0 },
        { label: "다", parts: [1, 1, 1], highlightedPart: 0 }
      ]
    },
    signalId: "fraction.equal-partition",
    answers: [{ id: "four-equal", label: "가 그림" }, { id: "four-unequal", label: "나 그림" }, { id: "three-equal", label: "다 그림" }]
  }),
  judgment({
    id: "g3s1-frac-02", unitId: "fraction", learnerStageId: "fraction.equal-partition",
    curriculumAnchorIds: ["[4수01-09]"], context: "민지는 종이띠를 1/6씩 나누었다고 말했어요.",
    prompt: "그림을 보고 바르게 고쳐 말한 것은 어느 것일까요?",
    visual: {
      kind: "partition-diagrams",
      diagrams: [
        { label: "민지의 종이띠", parts: [1, 1, 2, 1, 1, 1], highlightedPart: 0 }
      ]
    },
    signalId: "fraction.equal-partition",
    answers: [
      { id: "six-equal", label: "똑같은 크기 6조각으로 다시 나눠요" },
      { id: "six-unequal", label: "지금처럼 크기가 달라도 6조각이면 돼요" },
      { id: "five-equal", label: "똑같은 크기 5조각으로 다시 나눠요" }
    ]
  }),
  judgment({
    id: "g3s1-frac-03", unitId: "fraction", learnerStageId: "fraction.part-of-whole",
    curriculumAnchorIds: ["[4수01-09]"], prompt: "전체 5조각 중 2조각을 색칠했어요. 색칠한 부분은 얼마일까요?",
    visual: { kind: "fraction-bar", numerator: 2, denominator: 5 }, signalId: "fraction.part-of-whole",
    answers: [{ id: "2of5", label: "2/5" }, { id: "5of2", label: "5/2" }, { id: "2of3", label: "2/3" }]
  }),
  judgment({
    id: "g3s1-frac-04", unitId: "fraction", learnerStageId: "fraction.part-of-whole",
    curriculumAnchorIds: ["[4수01-09]"], context: "피자 한 판을 똑같이 8조각으로 나누어 3조각을 먹었어요.",
    prompt: "먹은 양을 분수로 나타내면 얼마일까요?",
    visual: { kind: "fraction-bar", numerator: 3, denominator: 8 }, signalId: "fraction.part-of-whole",
    answers: [{ id: "3of8", label: "3/8" }, { id: "8of3", label: "8/3" }, { id: "3of5", label: "3/5" }]
  }),
  judgment({
    id: "g3s1-len-01", unitId: "length", learnerStageId: "length.unit-choice",
    curriculumAnchorIds: ["[4수03-16]"], prompt: "연필 한 자루의 길이로 알맞은 것은 무엇일까요?",
    visual: { kind: "item-collection", ariaLabel: "연필 한 자루", items: ["✏️"] },
    signalId: "length.unit-choice",
    answers: [{ id: "15cm", label: "약 15cm" }, { id: "15m", label: "약 15m" }, { id: "15mm", label: "약 15mm" }]
  }),
  judgment({
    id: "g3s1-len-02", unitId: "length", learnerStageId: "length.unit-choice",
    curriculumAnchorIds: ["[4수03-16]"], prompt: "교실 문의 높이로 알맞은 것은 무엇일까요?",
    visual: { kind: "item-collection", ariaLabel: "교실 문 한 개", items: ["🚪"] },
    signalId: "length.unit-choice",
    answers: [{ id: "2m", label: "약 2m" }, { id: "2km", label: "약 2km" }, { id: "2cm", label: "약 2cm" }]
  }),
  judgment({
    id: "g3s1-len-03", unitId: "length", learnerStageId: "length.unit-convert",
    curriculumAnchorIds: ["[4수03-16]"], prompt: "1m는 몇 cm일까요?",
    visual: { kind: "length-relation", value: 1, fromUnit: "m", targetUnit: "cm" },
    signalId: "length.unit-convert",
    answers: [{ id: "100cm", label: "100cm" }, { id: "10cm", label: "10cm" }, { id: "1000cm", label: "1000cm" }]
  }),
  judgment({
    id: "g3s1-len-04", unitId: "length", learnerStageId: "length.unit-convert",
    curriculumAnchorIds: ["[4수03-16]"], prompt: "2km는 몇 m일까요?",
    visual: { kind: "length-relation", value: 2, fromUnit: "km", targetUnit: "m" },
    signalId: "length.unit-convert",
    answers: [{ id: "2000m", label: "2000m" }, { id: "200m", label: "200m" }, { id: "20000m", label: "20000m" }]
  })
];

const unsigned: DiagnosisSet = {
  manifest: {
    id: "grade3-semester1",
    version: "1.0.0",
    checksum: "36075f86f51e8b7c19f5df87b681a1b98fc9db84d2d0415d6fcd48d11aa1d56d",
    title: "3학년 1학기 수학 생각 지도",
    shortTitle: "3-1 수학 생각 지도",
    grade: 3,
    semester: 1,
    curriculum: "2022-revised",
    status: "review",
    units: [
      { id: "multiplication", order: 1, title: "곱셈" },
      { id: "division", order: 2, title: "나눗셈" },
      { id: "fraction", order: 3, title: "분수" },
      { id: "length", order: 4, title: "길이" }
    ],
    interactionTypes: [{ type: "choice", version: 1 }],
    estimatedMinutes: 12
  },
  curriculumAnchors: anchors,
  learnerStages: stages,
  signals,
  judgments
};

export const grade3Semester1Diagnosis =
  diagnosisSetSchema.parse(unsigned) as DiagnosisSet;
