import type { CurriculumAnchor } from "@middle-of-math/domain";

export const GRADE3_SEMESTER2_CURRICULUM_SOURCE =
  "교육부 고시 제2022-33호 [별책 8] 수학과 교육과정";

export interface CurriculumAnchorRegistryEntry {
  id: string;
  grade: 1 | 2 | 3 | 4 | 5 | 6;
  semester: 1 | 2;
  gradeBand?: "1-2" | "3-4" | "5-6";
  sharedAcrossSemesters?: boolean;
  sharedAcrossGradeBand?: boolean;
  label: string;
  v1Label?: string;
  source: string;
}

export interface CurriculumAnchorSetAllowance {
  anchorId: string;
  setKey: string;
  canonical: boolean;
  coverage: "exact" | "partial";
}

export const GRADE3_SEMESTER1_CURRICULUM_SOURCE =
  GRADE3_SEMESTER2_CURRICULUM_SOURCE;
export const GRADE4_SEMESTER1_CURRICULUM_SOURCE =
  GRADE3_SEMESTER2_CURRICULUM_SOURCE;
export const GRADE4_SEMESTER2_CURRICULUM_SOURCE =
  GRADE3_SEMESTER2_CURRICULUM_SOURCE;
export const GRADE5_SEMESTER1_CURRICULUM_SOURCE =
  GRADE3_SEMESTER2_CURRICULUM_SOURCE;
export const GRADE5_SEMESTER2_CURRICULUM_SOURCE =
  GRADE3_SEMESTER2_CURRICULUM_SOURCE;
export const GRADE6_SEMESTER1_CURRICULUM_SOURCE =
  GRADE3_SEMESTER2_CURRICULUM_SOURCE;
export const GRADE6_SEMESTER2_CURRICULUM_SOURCE =
  GRADE3_SEMESTER2_CURRICULUM_SOURCE;

const GRADE3_SHARED_SEMESTER_ANCHOR_IDS = new Set([
  "[4수01-04]",
  "[4수01-05]",
  "[4수01-06]",
  "[4수01-09]"
]);

function withGrade34Scope<T extends CurriculumAnchorRegistryEntry>(
  entries: readonly T[]
): ReadonlyArray<T & {
  gradeBand: "3-4";
  sharedAcrossSemesters: boolean;
  sharedAcrossGradeBand: false;
}> {
  return Object.freeze(entries.map((entry) => Object.freeze({
    ...entry,
    gradeBand: "3-4" as const,
    sharedAcrossSemesters: GRADE3_SHARED_SEMESTER_ANCHOR_IDS.has(entry.id),
    // 학년군 표시는 출처 범위일 뿐, 4학년 사용 승인이 아니다.
    sharedAcrossGradeBand: false as const
  })));
}

export const grade3Semester2AnchorRegistry = withGrade34Scope([
  { id: "[4수01-04]", grade: 3, semester: 2, label: "한 자리 수 또는 두 자리 수를 곱하는 곱셈", source: GRADE3_SEMESTER2_CURRICULUM_SOURCE },
  { id: "[4수01-05]", grade: 3, semester: 2, label: "나눗셈의 의미와 곱셈과의 관계", source: GRADE3_SEMESTER2_CURRICULUM_SOURCE },
  { id: "[4수01-06]", grade: 3, semester: 2, label: "한 자리 수로 나누는 나눗셈", source: GRADE3_SEMESTER2_CURRICULUM_SOURCE },
  { id: "[4수01-08]", grade: 3, semester: 2, label: "자연수의 사칙계산이 필요한 상황에서 어림셈하기", source: GRADE3_SEMESTER2_CURRICULUM_SOURCE },
  { id: "[4수01-09]", grade: 3, semester: 2, label: "등분할과 분수", source: GRADE3_SEMESTER2_CURRICULUM_SOURCE },
  { id: "[4수01-10]", grade: 3, semester: 2, label: "단위분수, 진분수, 가분수, 대분수", source: GRADE3_SEMESTER2_CURRICULUM_SOURCE },
  { id: "[4수01-11]", grade: 3, semester: 2, label: "분모가 같은 분수와 단위분수의 크기 비교", source: GRADE3_SEMESTER2_CURRICULUM_SOURCE },
  { id: "[4수03-06]", grade: 3, semester: 2, label: "원의 중심, 반지름, 지름", source: GRADE3_SEMESTER2_CURRICULUM_SOURCE },
  { id: "[4수03-07]", grade: 3, semester: 2, label: "컴퍼스로 원 그리기", source: GRADE3_SEMESTER2_CURRICULUM_SOURCE },
  {
    id: "[4수03-17]",
    grade: 3,
    semester: 2,
    label: "들이의 단위를 알고 들이를 어림하고 재기",
    v1Label: "L와 mL의 관계와 들이 측정",
    source: GRADE3_SEMESTER2_CURRICULUM_SOURCE
  },
  { id: "[4수03-18]", grade: 3, semester: 2, label: "1L와 1mL의 관계를 알고 들이를 두 가지 방식으로 나타내기", source: GRADE3_SEMESTER2_CURRICULUM_SOURCE },
  { id: "[4수03-19]", grade: 3, semester: 2, label: "들이의 덧셈과 뺄셈", source: GRADE3_SEMESTER2_CURRICULUM_SOURCE },
  {
    id: "[4수03-20]",
    grade: 3,
    semester: 2,
    label: "무게의 단위를 알고 무게를 어림하고 재기",
    v1Label: "g과 kg의 관계와 무게 측정",
    source: GRADE3_SEMESTER2_CURRICULUM_SOURCE
  },
  { id: "[4수03-21]", grade: 3, semester: 2, label: "1kg과 1g의 관계를 알고 무게를 두 가지 방식으로 나타내기", source: GRADE3_SEMESTER2_CURRICULUM_SOURCE },
  { id: "[4수03-22]", grade: 3, semester: 2, label: "1t을 알고 1t과 1kg의 관계 이해하기", source: GRADE3_SEMESTER2_CURRICULUM_SOURCE },
  { id: "[4수03-23]", grade: 3, semester: 2, label: "실생활과 연결하여 무게의 덧셈과 뺄셈하기", source: GRADE3_SEMESTER2_CURRICULUM_SOURCE },
  { id: "[4수04-01]", grade: 3, semester: 2, label: "실생활 자료와 그림그래프", source: GRADE3_SEMESTER2_CURRICULUM_SOURCE }
] satisfies readonly CurriculumAnchorRegistryEntry[]);

export const grade3Semester1AnchorRegistry = withGrade34Scope([
  { id: "[4수01-04]", grade: 3, semester: 1, label: "세 자리 수 범위의 곱셈", source: GRADE3_SEMESTER1_CURRICULUM_SOURCE },
  { id: "[4수01-05]", grade: 3, semester: 1, label: "세 자리 수 범위의 나눗셈", source: GRADE3_SEMESTER1_CURRICULUM_SOURCE },
  { id: "[4수01-06]", grade: 3, semester: 1, label: "세 자리 수 범위의 나눗셈", source: GRADE3_SEMESTER1_CURRICULUM_SOURCE },
  { id: "[4수01-09]", grade: 3, semester: 1, label: "분수", source: GRADE3_SEMESTER1_CURRICULUM_SOURCE },
  { id: "[4수03-16]", grade: 3, semester: 1, label: "길이", source: GRADE3_SEMESTER1_CURRICULUM_SOURCE }
] satisfies readonly CurriculumAnchorRegistryEntry[]);

export const grade4Semester1AnchorRegistry = Object.freeze([
  {
    id: "[4수01-01]",
    grade: 4,
    semester: 1,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "10000 이상의 큰 수를 읽고 쓰며 자릿값과 위치적 기수법 이해하기",
    source: GRADE4_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[4수01-02]",
    grade: 4,
    semester: 1,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "큰 수의 계열을 이해하고 크기를 비교하며 비교 방법 설명하기",
    source: GRADE4_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[4수01-04]",
    grade: 4,
    semester: 1,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "곱하는 수가 두 자리 수인 곱셈의 계산 원리를 이해하고 계산하기",
    source: GRADE4_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[4수01-05]",
    grade: 4,
    semester: 1,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "나눗셈의 의미를 알고 곱셈과 나눗셈의 관계를 이해하기",
    source: GRADE4_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[4수01-07]",
    grade: 4,
    semester: 1,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "나누는 수가 두 자리 수인 나눗셈의 계산 원리를 이해하고 계산하기",
    source: GRADE4_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[4수01-08]",
    grade: 4,
    semester: 1,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "자연수의 사칙계산 결과를 어림하고 어림한 과정 설명하기",
    source: GRADE4_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[4수03-02]",
    grade: 4,
    semester: 1,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "각과 직각을 이해하고 직각과 비교하여 예각과 둔각 구별하기",
    source: GRADE4_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[4수03-24]",
    grade: 4,
    semester: 1,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "1도와 각도기를 이용하여 각의 크기를 재고 어림하기",
    source: GRADE4_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[4수03-25]",
    grade: 4,
    semester: 1,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "삼각형과 사각형의 내각의 크기의 합을 추론하고 설명하기",
    source: GRADE4_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[4수03-04]",
    grade: 4,
    semester: 1,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "구체물이나 평면도형의 밀기, 뒤집기, 돌리기 활동을 통하여 그 변화 이해하기",
    source: GRADE4_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[4수03-05]",
    grade: 4,
    semester: 1,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "평면에서 점의 이동을 위치와 방향을 이용하여 설명하기",
    source: GRADE4_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[4수02-01]",
    grade: 4,
    semester: 1,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "다양한 변화 규칙을 찾아 설명하고, 그 규칙을 수나 식으로 나타내기",
    source: GRADE4_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[4수02-02]",
    grade: 4,
    semester: 1,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "계산식의 배열에서 규칙을 찾고, 계산 결과를 추측하기",
    source: GRADE4_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[4수02-03]",
    grade: 4,
    semester: 1,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "등호를 사용하여 크기가 같은 두 양의 관계를 식으로 나타내기",
    source: GRADE4_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[4수04-01]",
    grade: 4,
    semester: 1,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "자료를 수집하여 막대그래프로 나타내고 해석하기",
    source: GRADE4_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[4수04-03]",
    grade: 4,
    semester: 1,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "탐구 문제를 위한 자료를 수집·정리하여 막대그래프로 나타내고 해석하기",
    source: GRADE4_SEMESTER1_CURRICULUM_SOURCE
  }
] as const satisfies readonly CurriculumAnchorRegistryEntry[]);

export const grade4Semester2AnchorRegistry = Object.freeze([
  {
    id: "[4수04-02]",
    grade: 4,
    semester: 2,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "연속적으로 변하는 자료를 꺾은선그래프로 나타내고 해석하기",
    source: GRADE4_SEMESTER2_CURRICULUM_SOURCE
  },
  {
    id: "[4수03-08]",
    grade: 4,
    semester: 2,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "변의 길이에 따라 이등변삼각형과 정삼각형을 분류하고 성질을 설명하기",
    source: GRADE4_SEMESTER2_CURRICULUM_SOURCE
  },
  {
    id: "[4수03-09]",
    grade: 4,
    semester: 2,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "각의 크기에 따라 직각삼각형, 예각삼각형, 둔각삼각형을 분류하기",
    source: GRADE4_SEMESTER2_CURRICULUM_SOURCE
  },
  {
    id: "[4수01-15]",
    grade: 4,
    semester: 2,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "분모가 같은 분수의 덧셈과 뺄셈 원리를 이해하고 계산하기",
    source: GRADE4_SEMESTER2_CURRICULUM_SOURCE
  },
  {
    id: "[4수03-03]",
    grade: 4,
    semester: 2,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "수선과 평행선을 구별하고 평행선 사이의 거리 구하기",
    source: GRADE4_SEMESTER2_CURRICULUM_SOURCE
  },
  {
    id: "[4수03-10]",
    grade: 4,
    semester: 2,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "여러 가지 사각형을 분류하고 그 성질을 탐구하기",
    source: GRADE4_SEMESTER2_CURRICULUM_SOURCE
  },
  {
    id: "[4수01-13]",
    grade: 4,
    semester: 2,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "자릿값의 원리로 소수 두 자리 수와 소수 세 자리 수를 이해하고 읽고 쓰기",
    source: GRADE4_SEMESTER2_CURRICULUM_SOURCE
  },
  {
    id: "[4수01-14]",
    grade: 4,
    semester: 2,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "소수의 크기를 비교하고 그 방법을 설명하기",
    source: GRADE4_SEMESTER2_CURRICULUM_SOURCE
  },
  {
    id: "[4수01-16]",
    grade: 4,
    semester: 2,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "소수 두 자리 수 범위에서 소수의 덧셈과 뺄셈 원리를 이해하고 계산하기",
    source: GRADE4_SEMESTER2_CURRICULUM_SOURCE
  },
  {
    id: "[4수03-11]",
    grade: 4,
    semester: 2,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "다각형과 정다각형을 이해하기",
    source: GRADE4_SEMESTER2_CURRICULUM_SOURCE
  },
  {
    id: "[4수03-12]",
    grade: 4,
    semester: 2,
    gradeBand: "3-4",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "주어진 도형으로 여러 가지 모양을 만들거나 채우고 방법을 설명하기",
    source: GRADE4_SEMESTER2_CURRICULUM_SOURCE
  }
] as const satisfies readonly CurriculumAnchorRegistryEntry[]);

export const grade5Semester1AnchorRegistry = Object.freeze([
  {
    id: "[6수01-01]",
    grade: 5,
    semester: 1,
    gradeBand: "5-6",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "덧셈, 뺄셈, 곱셈, 나눗셈이 섞인 식의 계산 순서를 알고 계산하기",
    source: GRADE5_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[6수01-04]",
    grade: 5,
    semester: 1,
    gradeBand: "5-6",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "약수, 공약수, 최대공약수를 이해하고 구하기",
    source: GRADE5_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[6수01-05]",
    grade: 5,
    semester: 1,
    gradeBand: "5-6",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "배수, 공배수, 최소공배수를 이해하고 구하기",
    source: GRADE5_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[6수02-01]",
    grade: 5,
    semester: 1,
    gradeBand: "5-6",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "대응표에서 두 양의 규칙을 찾아 기호식으로 나타내기",
    source: GRADE5_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[6수01-06]",
    grade: 5,
    semester: 1,
    gradeBand: "5-6",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "크기가 같은 분수를 만들고 약분·통분하기",
    source: GRADE5_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[6수01-07]",
    grade: 5,
    semester: 1,
    gradeBand: "5-6",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "분모가 다른 분수의 크기를 비교하기",
    source: GRADE5_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[6수01-12]",
    grade: 5,
    semester: 1,
    gradeBand: "5-6",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "분수와 소수의 관계를 이해하고 크기를 비교하기",
    source: GRADE5_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[6수01-08]",
    grade: 5,
    semester: 1,
    gradeBand: "5-6",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "분모가 다른 분수의 덧셈과 뺄셈을 계산하기",
    source: GRADE5_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[6수03-11]",
    grade: 5,
    semester: 1,
    gradeBand: "5-6",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "다각형의 둘레를 구하기",
    source: GRADE5_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[6수03-12]",
    grade: 5,
    semester: 1,
    gradeBand: "5-6",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "넓이의 표준 단위를 알고 단위를 선택하기",
    source: GRADE5_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[6수03-13]",
    grade: 5,
    semester: 1,
    gradeBand: "5-6",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "직사각형과 정사각형의 넓이를 구하기",
    source: GRADE5_SEMESTER1_CURRICULUM_SOURCE
  },
  {
    id: "[6수03-14]",
    grade: 5,
    semester: 1,
    gradeBand: "5-6",
    sharedAcrossSemesters: false,
    sharedAcrossGradeBand: false,
    label: "평행사변형, 삼각형, 사다리꼴, 마름모의 넓이를 구하기",
    source: GRADE5_SEMESTER1_CURRICULUM_SOURCE
  }
] as const satisfies readonly CurriculumAnchorRegistryEntry[]);

function grade56Entries(
  grade: 5 | 6,
  semester: 1 | 2,
  source: string,
  entries: ReadonlyArray<{ id: string; label: string; sharedAcrossSemesters?: boolean }>
): readonly CurriculumAnchorRegistryEntry[] {
  return Object.freeze(entries.map((entry) => Object.freeze({
    ...entry,
    grade,
    semester,
    gradeBand: "5-6" as const,
    sharedAcrossSemesters: entry.sharedAcrossSemesters ?? false,
    sharedAcrossGradeBand: false as const,
    source
  })));
}

export const grade5Semester2AnchorRegistry = grade56Entries(
  5,
  2,
  GRADE5_SEMESTER2_CURRICULUM_SOURCE,
  [
    { id: "[6수01-02]", label: "이상·이하·초과·미만으로 수의 범위 나타내기" },
    { id: "[6수01-03]", label: "올림·버림·반올림을 이해하고 활용하기" },
    { id: "[6수01-09]", label: "분수의 곱셈 원리를 이해하고 계산하기" },
    { id: "[6수03-01]", label: "도형의 합동과 대응 성질 이해하기" },
    { id: "[6수03-02]", label: "선대칭도형과 점대칭도형 이해하기" },
    { id: "[6수01-13]", label: "소수의 곱셈 원리를 이해하고 계산하기" },
    { id: "[6수03-03]", label: "직육면체와 정육면체의 구성 요소와 성질 이해하기" },
    { id: "[6수03-04]", label: "직육면체와 정육면체의 전개도 이해하기" },
    { id: "[6수04-01]", label: "평균을 구하고 해석하기" },
    { id: "[6수04-04]", label: "사건의 가능성을 말로 표현하고 비교하기" },
    { id: "[6수04-05]", label: "사건의 가능성을 수로 나타내기" },
    { id: "[6수04-06]", label: "자료로 가능성을 예상하고 판단하기" }
  ]
);

export const grade6Semester1AnchorRegistry = grade56Entries(
  6,
  1,
  GRADE6_SEMESTER1_CURRICULUM_SOURCE,
  [
    { id: "[6수01-10]", label: "분수를 자연수로 나누기" },
    { id: "[6수01-11]", label: "분수의 나눗셈 원리를 이해하고 계산하기", sharedAcrossSemesters: true },
    { id: "[6수03-05]", label: "각기둥과 각뿔을 알고 구성 요소와 성질 이해하기" },
    { id: "[6수03-06]", label: "각기둥과 각뿔의 전개도 이해하기" },
    { id: "[6수01-14]", label: "소수를 자연수로 나누기" },
    { id: "[6수01-15]", label: "소수의 나눗셈 원리를 이해하고 계산하기", sharedAcrossSemesters: true },
    { id: "[6수02-02]", label: "두 양의 크기를 비교하는 상황에서 비 이해하기" },
    { id: "[6수02-03]", label: "비율을 이해하고 백분율로 나타내기" },
    { id: "[6수04-02]", label: "띠그래프와 원그래프를 해석하기" },
    { id: "[6수04-03]", label: "자료를 띠그래프와 원그래프로 나타내기" },
    { id: "[6수03-17]", label: "직육면체와 정육면체의 겉넓이 구하기" },
    { id: "[6수03-18]", label: "부피 단위와 직육면체·정육면체 부피 구하기" },
    { id: "[6수03-19]", label: "부피와 들이 단위의 관계 이해하기" }
  ]
);

export const grade6Semester2AnchorRegistry = grade56Entries(
  6,
  2,
  GRADE6_SEMESTER2_CURRICULUM_SOURCE,
  [
    { id: "[6수01-11]", label: "분수의 나눗셈 원리를 이해하고 계산하기", sharedAcrossSemesters: true },
    { id: "[6수03-09]", label: "쌓기나무로 만든 입체도형을 여러 방향에서 보기" },
    { id: "[6수03-10]", label: "쌓기나무 모양을 추측하고 필요한 개수 구하기" },
    { id: "[6수01-15]", label: "소수의 나눗셈 원리를 이해하고 계산하기", sharedAcrossSemesters: true },
    { id: "[6수02-04]", label: "비의 성질과 비례식의 성질 이해하기" },
    { id: "[6수02-05]", label: "비례배분하고 문제 해결하기" },
    { id: "[6수03-15]", label: "원주와 원주율의 관계 이해하기" },
    { id: "[6수03-16]", label: "원의 넓이 구하기" },
    { id: "[6수03-07]", label: "원기둥·원뿔·구와 구성 요소 이해하기" },
    { id: "[6수03-08]", label: "원기둥과 원뿔의 전개도 이해하기" }
  ]
);

export const curriculumAnchorSetAllowList = Object.freeze([
  {
    anchorId: "[4수01-04]",
    setKey: "grade3-semester1",
    canonical: false,
    coverage: "partial"
  },
  {
    anchorId: "[4수01-04]",
    setKey: "grade3-semester2",
    canonical: true,
    coverage: "partial"
  },
  {
    anchorId: "[4수01-04]",
    setKey: "grade4-semester1",
    canonical: false,
    coverage: "partial"
  },
  {
    anchorId: "[4수01-05]",
    setKey: "grade3-semester1",
    canonical: false,
    coverage: "partial"
  },
  {
    anchorId: "[4수01-05]",
    setKey: "grade3-semester2",
    canonical: true,
    coverage: "partial"
  },
  {
    anchorId: "[4수01-05]",
    setKey: "grade4-semester1",
    canonical: false,
    coverage: "partial"
  },
  {
    anchorId: "[4수01-07]",
    setKey: "grade4-semester1",
    canonical: true,
    coverage: "partial"
  },
  {
    anchorId: "[4수01-08]",
    setKey: "grade3-semester2",
    canonical: true,
    coverage: "partial"
  },
  {
    anchorId: "[4수01-08]",
    setKey: "grade4-semester1",
    canonical: false,
    coverage: "partial"
  },
  {
    anchorId: "[4수04-01]",
    setKey: "grade3-semester2",
    canonical: true,
    coverage: "partial"
  },
  {
    anchorId: "[4수04-01]",
    setKey: "grade4-semester1",
    canonical: false,
    coverage: "partial"
  },
  {
    anchorId: "[4수04-03]",
    setKey: "grade4-semester1",
    canonical: true,
    coverage: "partial"
  },
  {
    anchorId: "[4수04-03]",
    setKey: "grade4-semester2",
    canonical: false,
    coverage: "partial"
  }
] as const satisfies readonly CurriculumAnchorSetAllowance[]);

const semester2RegistryById = new Map(
  grade3Semester2AnchorRegistry.map((anchor) => [anchor.id, anchor])
);
const semester1RegistryById = new Map(
  grade3Semester1AnchorRegistry.map((anchor) => [anchor.id, anchor])
);
const grade4Semester1RegistryById = new Map<string, CurriculumAnchorRegistryEntry>(
  grade4Semester1AnchorRegistry.map((anchor) => [anchor.id, anchor])
);
const grade4Semester2RegistryById = new Map<string, CurriculumAnchorRegistryEntry>(
  grade4Semester2AnchorRegistry.map((anchor) => [anchor.id, anchor])
);
const grade5Semester1RegistryById = new Map<string, CurriculumAnchorRegistryEntry>(
  grade5Semester1AnchorRegistry.map((anchor) => [anchor.id, anchor])
);

export function findGrade3Semester2Anchor(
  id: string
): CurriculumAnchorRegistryEntry | undefined {
  return semester2RegistryById.get(id);
}

function parseSetScope(
  setKey: string
): { grade: CurriculumAnchorRegistryEntry["grade"]; semester: 1 | 2 } | null {
  const match = /^grade([1-6])-semester([12])$/.exec(setKey);
  if (!match) return null;
  return {
    grade: Number(match[1]) as CurriculumAnchorRegistryEntry["grade"],
    semester: Number(match[2]) as 1 | 2
  };
}

function gradeIsInBand(
  grade: number,
  gradeBand: CurriculumAnchorRegistryEntry["gradeBand"]
): boolean {
  if (!gradeBand) return false;
  const [start, end] = gradeBand.split("-").map(Number);
  return grade >= start && grade <= end;
}

export function findAnchorForSet(
  setKey: string,
  anchorId: string
): CurriculumAnchorRegistryEntry | undefined {
  const scope = parseSetScope(setKey);
  if (!scope) return undefined;
  const candidates = [
    ...grade3Semester1AnchorRegistry,
    ...grade3Semester2AnchorRegistry,
    ...grade4Semester1AnchorRegistry,
    ...grade4Semester2AnchorRegistry,
    ...grade5Semester1AnchorRegistry,
    ...grade5Semester2AnchorRegistry,
    ...grade6Semester1AnchorRegistry,
    ...grade6Semester2AnchorRegistry
  ].filter((anchor) => anchor.id === anchorId);
  const scopedAllowances = curriculumAnchorSetAllowList.filter(
    (allowance) => allowance.anchorId === anchorId
  );
  if (scopedAllowances.length > 0) {
    if (!scopedAllowances.some((allowance) => allowance.setKey === setKey)) {
      return undefined;
    }
    const exactAllowed = candidates.find((anchor) =>
      anchor.grade === scope.grade
      && anchor.semester === scope.semester
    );
    if (exactAllowed) return exactAllowed;
    const canonical = scopedAllowances.find(
      (allowance) => allowance.canonical
    );
    return candidates.find((anchor) =>
      canonical?.setKey
        === `grade${anchor.grade}-semester${anchor.semester}`
    );
  }
  const exact = candidates.find((anchor) =>
    anchor.grade === scope.grade
    && anchor.semester === scope.semester
  );
  if (exact) return exact;
  const sharedAcrossSemester = candidates.find((anchor) =>
    anchor.grade === scope.grade
    && anchor.sharedAcrossSemesters
  );
  if (sharedAcrossSemester) return sharedAcrossSemester;

  const sharedAcrossGradeBand = candidates.filter((anchor) =>
    anchor.sharedAcrossGradeBand
    && gradeIsInBand(scope.grade, anchor.gradeBand)
    && anchor.semester === scope.semester
  );
  if (sharedAcrossGradeBand.length === 1) {
    return sharedAcrossGradeBand[0];
  }
  const sharedAcrossGradeAndSemester = candidates.filter((anchor) =>
    anchor.sharedAcrossGradeBand
    && anchor.sharedAcrossSemesters
    && gradeIsInBand(scope.grade, anchor.gradeBand)
  );
  // 서로 다른 라벨이 같은 학년군에 겹치면 추측하지 않고 닫힌다.
  return sharedAcrossGradeAndSemester.length === 1
    ? sharedAcrossGradeAndSemester[0]
    : undefined;
}

export function grade3Semester1Anchor(id: string): CurriculumAnchor {
  const anchor = semester1RegistryById.get(id);
  if (!anchor) throw new Error(`등록되지 않은 3학년 1학기 성취기준입니다: ${id}`);
  return { id: anchor.id, label: anchor.label, source: anchor.source };
}

export function grade5Semester1Anchor(id: string): CurriculumAnchor {
  const anchor = grade5Semester1RegistryById.get(id);
  if (!anchor) throw new Error(`등록되지 않은 5학년 1학기 성취기준입니다: ${id}`);
  return { id: anchor.id, label: anchor.label, source: anchor.source };
}

export function grade3Semester2Anchor(
  id: string,
  revision: "v1" | "v2" = "v2"
): CurriculumAnchor {
  const anchor = findGrade3Semester2Anchor(id);
  if (!anchor) throw new Error(`등록되지 않은 3학년 2학기 성취기준입니다: ${id}`);
  return {
    id: anchor.id,
    label: revision === "v1" ? anchor.v1Label ?? anchor.label : anchor.label,
    source: anchor.source
  };
}

export function grade4Semester1Anchor(id: string): CurriculumAnchor {
  const anchor = grade4Semester1RegistryById.get(id);
  if (!anchor) {
    throw new Error(`등록되지 않은 4학년 1학기 성취기준입니다: ${id}`);
  }
  return { id: anchor.id, label: anchor.label, source: anchor.source };
}

export function grade4Semester2Anchor(id: string): CurriculumAnchor {
  const anchor = grade4Semester2RegistryById.get(id);
  if (!anchor) {
    throw new Error(`등록되지 않은 4학년 2학기 성취기준입니다: ${id}`);
  }
  return { id: anchor.id, label: anchor.label, source: anchor.source };
}
