import { describe, expect, it } from "vitest";
import { grade3Semester2Diagnosis } from "./grade3-semester2";
import { diagnosisSetSchema } from "./schema";

describe("3학년 2학기 진단 콘텐츠", () => {
  it("publishes six units and twelve direct judgments", () => {
    expect(grade3Semester2Diagnosis.manifest.units.map((unit) => unit.title)).toEqual([
      "곱셈", "나눗셈", "원", "분수", "들이와 무게", "그림그래프"
    ]);
    expect(grade3Semester2Diagnosis.judgments).toHaveLength(12);
    expect(() => diagnosisSetSchema.parse(grade3Semester2Diagnosis)).not.toThrow();
  });

  it("keeps stable IDs and references valid", () => {
    const stageIds = new Set(grade3Semester2Diagnosis.learnerStages.map((stage) => stage.id));
    const anchorIds = new Set(grade3Semester2Diagnosis.curriculumAnchors.map((anchor) => anchor.id));
    const signalIds = new Set(grade3Semester2Diagnosis.signals.map((signal) => signal.id));
    const judgmentIds = grade3Semester2Diagnosis.judgments.map((judgment) => judgment.id);

    expect(new Set(judgmentIds).size).toBe(judgmentIds.length);
    for (const judgment of grade3Semester2Diagnosis.judgments) {
      expect(stageIds.has(judgment.learnerStageId)).toBe(true);
      expect(judgment.curriculumAnchorIds.every((id) => anchorIds.has(id))).toBe(true);
      expect(judgment.choices.filter((choice) => choice.correct)).toHaveLength(1);
      expect(judgment.choices.flatMap((choice) => choice.signalIds ?? []).every((id) => signalIds.has(id))).toBe(true);
    }
  });

  it("does not leak teacher diagnostic language into student choices", () => {
    const forbidden = /오개념|진단|피드백|부족|흔들|확인해야|고른 선택/;
    for (const choice of grade3Semester2Diagnosis.judgments.flatMap((judgment) => judgment.choices)) {
      expect(choice.label).not.toMatch(forbidden);
    }
  });
});
