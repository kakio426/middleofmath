import type { DiagnosisSet } from "@middle-of-math/domain";

export type DemoChoiceProfiles = Record<string, Record<string, number>>;

/**
 * 새 학기 데모에서도 한 번 관찰과 두 번 반복 관찰을 모두 보여 준다.
 * 숫자는 제작 순서의 첫 오답 선택지이며 실제 학생 제시 순서는 별도 섞는다.
 */
export function createPairedEvidenceDemoProfiles(
  content: DiagnosisSet
): DemoChoiceProfiles {
  const stages = content.learnerStages.slice(0, 2).map((stage) =>
    content.judgments.filter((judgment) => judgment.learnerStageId === stage.id)
  );
  if (stages.some((questions) => questions.length < 2)) {
    throw new Error("데모 근거에는 두 문항으로 된 단계가 두 개 필요합니다.");
  }
  return {
    "student-03": {
      [stages[0][0].id]: 1,
      [stages[0][1].id]: 1
    },
    "student-07": {
      [stages[0][0].id]: 1
    },
    "student-12": {
      [stages[1][0].id]: 1,
      [stages[1][1].id]: 1
    },
    "student-18": {}
  };
}
