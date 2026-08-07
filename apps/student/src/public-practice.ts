import {
  grade3Semester1Diagnosis,
  grade3Semester2CompleteDiagnosis
} from "@middle-of-math/content/runtime";
import type { DiagnosisSet } from "@middle-of-math/domain";
import { createUnitAssignmentCards, type AssignmentCard } from "./assignment-model";

export type PublicPracticeKey = "g3s1-multiplication" | "g3s2-pictograph";

export interface PublicPractice {
  key: PublicPracticeKey;
  title: string;
  content: DiagnosisSet;
  assignments: AssignmentCard[];
}

const PRACTICE_DEFINITIONS = {
  "g3s1-multiplication": {
    title: "같은 묶음은 곱셈으로",
    content: grade3Semester1Diagnosis,
    unitId: "multiplication",
    judgmentIds: ["g3s1-mul-01", "g3s1-mul-02"]
  },
  "g3s2-pictograph": {
    title: "범례로 그림그래프 읽기",
    content: grade3Semester2CompleteDiagnosis,
    unitId: "pictograph",
    judgmentIds: ["g3s2-graph-03", "g3s2-graph-04", "g3s2-graph-07", "g3s2-graph-08"]
  }
} as const;

export function createPublicPractice(value: string | null): PublicPractice | null {
  if (!value || !(value in PRACTICE_DEFINITIONS)) return null;
  const key = value as PublicPracticeKey;
  const definition = PRACTICE_DEFINITIONS[key];
  const judgmentIds = new Set<string>(definition.judgmentIds);
  const content: DiagnosisSet = {
    ...definition.content,
    judgments: definition.content.judgments.filter((judgment) => judgmentIds.has(judgment.id))
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
      description: "수업에서 다룬 생각을 짧은 문제로 다시 확인해요."
    }]
  };
}
