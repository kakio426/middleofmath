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
    ...grade4Semester1AnchorRegistry
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
