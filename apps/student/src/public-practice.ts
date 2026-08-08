import {
  grade3Semester1Diagnosis,
  grade3Semester2CompleteDiagnosis
} from "@middle-of-math/content/runtime";
import type { DiagnosisSet } from "@middle-of-math/domain";
import { createUnitAssignmentCards, type AssignmentCard } from "./assignment-model";

type PracticeDefinition = {
  title: string;
  content: DiagnosisSet;
  unitId: string;
  judgmentIds: readonly string[];
};

export const PUBLIC_PRACTICE_DEFINITIONS = {
  "g3s2-pictograph-legend": {
    title: "그림 하나에 숨은 수",
    content: grade3Semester2CompleteDiagnosis,
    unitId: "pictograph",
    judgmentIds: ["g3s2-graph-01", "g3s2-graph-03"]
  },
  "g3s1-multiplication-groups-model": {
    title: "같은 묶음은 곱셈으로",
    content: grade3Semester1Diagnosis,
    unitId: "multiplication",
    judgmentIds: ["g3s1-mul-01", "g3s1-mul-02"]
  },
  "g3s1-multiplication-array-transfer": {
    title: "줄과 칸으로 전체 수 찾기",
    content: grade3Semester1Diagnosis,
    unitId: "multiplication",
    judgmentIds: ["g3s1-mul-01", "g3s1-mul-02"]
  },
  "g3s1-multiplication-place-value-model": {
    title: "34×2를 두 부분으로",
    content: grade3Semester1Diagnosis,
    unitId: "multiplication",
    judgmentIds: ["g3s1-mul-03", "g3s1-mul-04"]
  },
  "g3s1-multiplication-place-value-context": {
    title: "상자 수를 자릿값으로 곱하기",
    content: grade3Semester1Diagnosis,
    unitId: "multiplication",
    judgmentIds: ["g3s1-mul-03", "g3s1-mul-04"]
  },
  "g3s1-division-equal-sharing": {
    title: "18개를 똑같이 나누면",
    content: grade3Semester1Diagnosis,
    unitId: "division",
    judgmentIds: ["g3s1-div-01", "g3s1-div-02"]
  },
  "g3s1-division-missing-factor": {
    title: "곱셈의 빈칸으로 몫 찾기",
    content: grade3Semester1Diagnosis,
    unitId: "division",
    judgmentIds: ["g3s1-div-02", "g3s1-div-03"]
  },
  "g3s1-division-fact-family": {
    title: "한 곱셈식에서 두 나눗셈식",
    content: grade3Semester1Diagnosis,
    unitId: "division",
    judgmentIds: ["g3s1-div-03", "g3s1-div-04"]
  },
  "g3s1-division-group-count": {
    title: "몇 묶음인지 곱셈으로 확인하기",
    content: grade3Semester1Diagnosis,
    unitId: "division",
    judgmentIds: ["g3s1-div-03", "g3s1-div-04"]
  },
  "g3s1-fraction-equal-parts": {
    title: "분수의 첫 조건, 똑같이",
    content: grade3Semester1Diagnosis,
    unitId: "fraction",
    judgmentIds: ["g3s1-frac-01", "g3s1-frac-02"]
  },
  "g3s1-fraction-fix-partition": {
    title: "같지 않은 조각을 고쳐 나누기",
    content: grade3Semester1Diagnosis,
    unitId: "fraction",
    judgmentIds: ["g3s1-frac-01", "g3s1-frac-02"]
  },
  "g3s1-fraction-part-whole": {
    title: "전체와 부분을 분수로 읽기",
    content: grade3Semester1Diagnosis,
    unitId: "fraction",
    judgmentIds: ["g3s1-frac-03", "g3s1-frac-04"]
  },
  "g3s1-fraction-pizza-context": {
    title: "피자에서 분모와 분자 찾기",
    content: grade3Semester1Diagnosis,
    unitId: "fraction",
    judgmentIds: ["g3s1-frac-03", "g3s1-frac-04"]
  },
  "g3s1-length-centimeter-meter": {
    title: "연필에는 cm, 문에는 m",
    content: grade3Semester1Diagnosis,
    unitId: "length",
    judgmentIds: ["g3s1-len-01", "g3s1-len-02"]
  },
  "g3s1-length-real-world-units": {
    title: "크기에 맞는 길이 단위",
    content: grade3Semester1Diagnosis,
    unitId: "length",
    judgmentIds: ["g3s1-len-01", "g3s1-len-02"]
  },
  "g3s1-length-unit-conversion": {
    title: "m·cm, km·m 연결하기",
    content: grade3Semester1Diagnosis,
    unitId: "length",
    judgmentIds: ["g3s1-len-03", "g3s1-len-04"]
  },
  "g3s2-multiplication-place-value": {
    title: "자릿값을 살려 먼저 곱하기",
    content: grade3Semester2CompleteDiagnosis,
    unitId: "multiplication",
    judgmentIds: ["g3s2-mul-01", "g3s2-mul-03"]
  },
  "g3s2-multiplication-combine": {
    title: "부분곱을 빠짐없이 더하기",
    content: grade3Semester2CompleteDiagnosis,
    unitId: "multiplication",
    judgmentIds: ["g3s2-mul-02", "g3s2-mul-04"]
  },
  "g3s2-multiplication-two-digit": {
    title: "두 자리 수를 나누어 곱하기",
    content: grade3Semester2CompleteDiagnosis,
    unitId: "multiplication",
    judgmentIds: ["g3s2-mul-05", "g3s2-mul-06"]
  },
  "g3s2-division-meaning": {
    title: "나눗셈이 묻는 두 가지",
    content: grade3Semester2CompleteDiagnosis,
    unitId: "division",
    judgmentIds: ["g3s2-div-05", "g3s2-div-06"]
  },
  "g3s2-division-remainder": {
    title: "먼저 나누고 남은 수 찾기",
    content: grade3Semester2CompleteDiagnosis,
    unitId: "division",
    judgmentIds: ["g3s2-div-01", "g3s2-div-03"]
  },
  "g3s2-division-remainder-check": {
    title: "몫과 나머지로 처음 수 확인하기",
    content: grade3Semester2CompleteDiagnosis,
    unitId: "division",
    judgmentIds: ["g3s2-div-07", "g3s2-div-08"]
  },
  "g3s2-circle-parts": {
    title: "원의 중심과 반지름 찾기",
    content: grade3Semester2CompleteDiagnosis,
    unitId: "circle",
    judgmentIds: ["g3s2-circle-01", "g3s2-circle-03"]
  },
  "g3s2-circle-diameter": {
    title: "반지름 두 개가 만드는 지름",
    content: grade3Semester2CompleteDiagnosis,
    unitId: "circle",
    judgmentIds: ["g3s2-circle-02", "g3s2-circle-04"]
  },
  "g3s2-fraction-part-whole": {
    title: "색칠한 부분을 분수로",
    content: grade3Semester2CompleteDiagnosis,
    unitId: "fraction",
    judgmentIds: ["g3s2-frac-01", "g3s2-frac-03"]
  },
  "g3s2-fraction-convert": {
    title: "가분수를 대분수로 바꾸기",
    content: grade3Semester2CompleteDiagnosis,
    unitId: "fraction",
    judgmentIds: ["g3s2-frac-11", "g3s2-frac-12"]
  },
  "g3s2-fraction-compare": {
    title: "분모가 같은 분수 비교하기",
    content: grade3Semester2CompleteDiagnosis,
    unitId: "fraction",
    judgmentIds: ["g3s2-frac-02", "g3s2-frac-04"]
  },
  "g3s2-capacity-unit": {
    title: "L를 mL로 정확히 바꾸기",
    content: grade3Semester2CompleteDiagnosis,
    unitId: "measurement",
    judgmentIds: ["g3s2-measure-01", "g3s2-measure-03"]
  },
  "g3s2-weight-unit": {
    title: "kg을 g으로 정확히 바꾸기",
    content: grade3Semester2CompleteDiagnosis,
    unitId: "measurement",
    judgmentIds: ["g3s2-measure-02", "g3s2-measure-04"]
  },
  "g3s2-pictograph-compare": {
    title: "그림그래프의 실제 차이 구하기",
    content: grade3Semester2CompleteDiagnosis,
    unitId: "pictograph",
    judgmentIds: ["g3s2-graph-02", "g3s2-graph-04"]
  }
} as const satisfies Record<string, PracticeDefinition>;

const PUBLIC_PRACTICE_ALIASES = {
  "g3s2-multiplication": {
    title: "곱셈 생각 확인하기",
    content: grade3Semester2CompleteDiagnosis,
    unitId: "multiplication",
    judgmentIds: [
      "g3s2-mul-01",
      "g3s2-mul-02"
    ]
  }
} as const satisfies Record<string, PracticeDefinition>;

const PUBLIC_PRACTICE_ROUTES = {
  ...PUBLIC_PRACTICE_DEFINITIONS,
  ...PUBLIC_PRACTICE_ALIASES
} as const satisfies Record<string, PracticeDefinition>;

export type PublicPracticeKey = keyof typeof PUBLIC_PRACTICE_ROUTES;

export interface PublicPractice {
  key: PublicPracticeKey;
  title: string;
  content: DiagnosisSet;
  assignments: AssignmentCard[];
}

export function createPublicPractice(value: string | null): PublicPractice | null {
  if (!value || !(value in PUBLIC_PRACTICE_ROUTES)) return null;
  const key = value as PublicPracticeKey;
  const definition: PracticeDefinition = PUBLIC_PRACTICE_ROUTES[key];
  const judgmentIds = new Set<string>(definition.judgmentIds);
  const judgments = definition.content.judgments.filter((judgment) => judgmentIds.has(judgment.id));
  if (judgments.length !== judgmentIds.size) return null;
  const content: DiagnosisSet = {
    ...definition.content,
    judgments
  };
  const assignment = createUnitAssignmentCards(content).find((card) => card.unitId === definition.unitId);
  if (!assignment || assignment.judgmentCount !== judgmentIds.size) return null;
  return {
    key,
    title: definition.title,
    content,
    assignments: [{
      ...assignment,
      id: `public-practice-${key}`,
      title: definition.title,
      description: "수업에서 다룬 생각을 두 문제로 다시 확인해요."
    }]
  };
}
