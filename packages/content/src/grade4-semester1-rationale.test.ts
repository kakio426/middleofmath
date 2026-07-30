import { describe, expect, it } from "vitest";
import { grade4Semester1Diagnosis } from "./grade4-semester1";
import {
  grade4Semester1DistractorRationales,
  grade4Semester1MisconceptionTitles
} from "./grade4-semester1-rationales";

describe("4학년 1학기 A1 오답 근거 원장", () => {
  it("24개 판단의 오답 48개를 빠짐없이 정확히 한 번씩 설명한다", () => {
    const expected = grade4Semester1Diagnosis.judgments.flatMap((judgment) =>
      judgment.choices
        .filter((choice) => !choice.correct)
        .map((choice) => `${judgment.id}\u0000${choice.id}`)
    );
    const authored = grade4Semester1DistractorRationales.map(
      (entry) => `${entry.judgmentId}\u0000${entry.choiceId}`
    );

    expect(expected).toHaveLength(48);
    expect(authored).toHaveLength(48);
    expect(new Set(authored).size).toBe(48);
    expect(authored.sort()).toEqual(expected.sort());
  });

  it("12개 단계마다 두 오개념을 direct·transfer에서 반복 관찰한다", () => {
    for (const stage of grade4Semester1Diagnosis.learnerStages) {
      const entries = grade4Semester1DistractorRationales.filter((entry) =>
        entry.misconceptionId.startsWith(`${stage.id}.`)
      );
      const judgmentsByMisconception = new Map<string, Set<string>>();
      for (const entry of entries) {
        const judgmentIds =
          judgmentsByMisconception.get(entry.misconceptionId)
          ?? new Set<string>();
        judgmentIds.add(entry.judgmentId);
        judgmentsByMisconception.set(entry.misconceptionId, judgmentIds);
      }

      expect(entries, stage.id).toHaveLength(4);
      expect(judgmentsByMisconception.size, stage.id).toBe(2);
      expect(
        [...judgmentsByMisconception.values()].map((ids) => ids.size).sort(),
        stage.id
      ).toEqual([2, 2]);
    }
    expect(Object.keys(grade4Semester1MisconceptionTitles)).toHaveLength(24);
  });

  it("단계별 공통 관찰 근거가 고유하며 모든 오개념 제목이 존재한다", () => {
    const sharedByStage = new Set<string>();
    for (const stage of grade4Semester1Diagnosis.learnerStages) {
      const entries = grade4Semester1DistractorRationales.filter((entry) =>
        entry.misconceptionId.startsWith(`${stage.id}.`)
      );
      const shared = new Set(
        entries.map((entry) => entry.sharedSignalRationale ?? "")
      );
      expect(shared, stage.id).toHaveLength(1);
      expect(shared.has(""), stage.id).toBe(false);
      sharedByStage.add([...shared][0]);
      for (const entry of entries) {
        expect(
          grade4Semester1MisconceptionTitles[entry.misconceptionId],
          entry.misconceptionId
        ).toBeTruthy();
      }
    }
    expect(sharedByStage.size).toBe(12);
  });

  it("자리 이동·계열·비교 오답의 표시값을 계산 과정과 정확히 연결한다", () => {
    const byChoice = new Map(
      grade4Semester1DistractorRationales.map((entry) => [
        `${entry.judgmentId}/${entry.choiceId}`,
        entry.derivation
      ])
    );
    expect(byChoice.get("g4s1-large-01/three-hundred")).toContain(
      "3,000÷10=300"
    );
    expect(byChoice.get("g4s1-large-04/hundred-times")).toContain(
      "2,000,000÷2,000=1,000"
    );
    expect(byChoice.get("g4s1-large-07/52410")).toContain(
      "52,400+10=52,410"
    );
    expect(byChoice.get("g4s1-large-10/85720")).toContain(
      "천의 자리 7>5"
    );
  });

  it("각도 오답의 눈금·어림·내각 합 계산을 표시값과 정확히 연결한다", () => {
    const byChoice = new Map(
      grade4Semester1DistractorRationales.map((entry) => [
        `${entry.judgmentId}/${entry.choiceId}`,
        entry.derivation
      ])
    );
    expect(byChoice.get("g4s1-angle-05/55-degrees")).toContain(
      "180−125=55"
    );
    expect(byChoice.get("g4s1-angle-07/about-135")).toContain(
      "90+45=135"
    );
    expect(byChoice.get("g4s1-angle-09/25-degrees")).toContain(
      "80−55=25"
    );
    expect(byChoice.get("g4s1-angle-11/5-degrees")).toContain(
      "180−95−80=5"
    );
  });
});
