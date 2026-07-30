import { describe, expect, it } from "vitest";
import { grade3Semester1Diagnosis } from "./grade3-semester1";
import { grade3Semester1CoverageBlueprint } from "./grade3-semester1-coverage";
import {
  grade3Semester1DistractorRationales,
  grade3Semester1MisconceptionTitles
} from "./grade3-semester1-rationales";

describe("3학년 1학기 오답 근거 원장", () => {
  it("16개 판단의 오답 32개를 빠짐없이 정확히 한 번씩 설명한다", () => {
    const expected = grade3Semester1Diagnosis.judgments.flatMap((judgment) =>
      judgment.choices
        .filter((choice) => !choice.correct)
        .map((choice) => `${judgment.id}\u0000${choice.id}`)
    );
    const authored = grade3Semester1DistractorRationales.map(
      (entry) => `${entry.judgmentId}\u0000${entry.choiceId}`
    );

    expect(expected).toHaveLength(32);
    expect(authored).toHaveLength(32);
    expect(new Set(authored).size).toBe(32);
    expect(authored.sort()).toEqual(expected.sort());
  });

  it("8개 단계의 오개념 2개를 직접·전이 판단에서 각각 반복 관찰한다", () => {
    for (const stage of grade3Semester1Diagnosis.learnerStages) {
      const entries = grade3Semester1DistractorRationales.filter((entry) =>
        entry.misconceptionId.startsWith(`${stage.id}.`)
      );
      const judgmentsByMisconception = new Map<string, Set<string>>();
      for (const entry of entries) {
        const ids =
          judgmentsByMisconception.get(entry.misconceptionId) ?? new Set<string>();
        ids.add(entry.judgmentId);
        judgmentsByMisconception.set(entry.misconceptionId, ids);
      }

      expect(entries, stage.id).toHaveLength(4);
      expect(judgmentsByMisconception.size, stage.id).toBe(2);
      expect(
        [...judgmentsByMisconception.values()].map((ids) => ids.size).sort(),
        stage.id
      ).toEqual([2, 2]);
    }
    expect(Object.keys(grade3Semester1MisconceptionTitles)).toHaveLength(16);
  });

  it("모든 오개념에 교사용 제목과 단계별 고유 공통 관찰 기준을 둔다", () => {
    const sharedByStage = new Map<string, Set<string>>();
    for (const stage of grade3Semester1Diagnosis.learnerStages) {
      const entries = grade3Semester1DistractorRationales.filter((entry) =>
        entry.misconceptionId.startsWith(`${stage.id}.`)
      );
      const shared = new Set(
        entries.map((entry) => entry.sharedSignalRationale ?? "")
      );
      expect(shared, stage.id).toHaveLength(1);
      expect(shared.has(""), stage.id).toBe(false);
      sharedByStage.set(stage.id, shared);

      for (const entry of entries) {
        expect(
          grade3Semester1MisconceptionTitles[entry.misconceptionId],
          entry.misconceptionId
        ).toBeTruthy();
      }
    }

    expect(sharedByStage.size).toBe(8);
    expect(
      new Set(
        grade3Semester1DistractorRationales.map(
          (entry) => entry.sharedSignalRationale
        )
      ).size
    ).toBe(8);
  });

  it("블루프린트가 검수 원장을 그대로 참조한다", () => {
    expect(grade3Semester1CoverageBlueprint.distractors).toBe(
      grade3Semester1DistractorRationales
    );
    expect(grade3Semester1CoverageBlueprint.misconceptionTitles).toBe(
      grade3Semester1MisconceptionTitles
    );
  });
});
