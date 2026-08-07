import { describe, expect, it } from "vitest";
import { grade3Semester2CompleteDiagnosis } from "./grade3-semester2-complete";
import { grade3Semester2CoverageBlueprint } from "./grade3-semester2-coverage";
import {
  grade3Semester2DistractorRationales,
  grade3Semester2MisconceptionTitles
} from "./grade3-semester2-rationales";

describe("3학년 2학기 오답 근거 원장", () => {
  it("64개 문항의 128개 오답을 빠짐없이 한 번씩 설명한다", () => {
    const expectedKeys = grade3Semester2CompleteDiagnosis.judgments.flatMap(
      (judgment) =>
        judgment.choices
          .filter((choice) => !choice.correct)
          .map((choice) => `${judgment.id}\u0000${choice.id}`)
    );
    const authoredKeys = grade3Semester2DistractorRationales.map(
      (entry) => `${entry.judgmentId}\u0000${entry.choiceId}`
    );

    expect(expectedKeys).toHaveLength(128);
    expect(authoredKeys).toHaveLength(128);
    expect(new Set(authoredKeys).size).toBe(128);
    expect(authoredKeys.sort()).toEqual(expectedKeys.sort());
  });

  it("32개 단계마다 서로 다른 오개념 2개를 두 문항에서 반복 관찰한다", () => {
    for (const stage of grade3Semester2CompleteDiagnosis.learnerStages) {
      const entries = grade3Semester2DistractorRationales.filter((entry) =>
        entry.misconceptionId.startsWith(`${stage.id}.`)
      );
      const judgmentIds = new Map<string, Set<string>>();
      entries.forEach((entry) => {
        const ids =
          judgmentIds.get(entry.misconceptionId) ?? new Set<string>();
        ids.add(entry.judgmentId);
        judgmentIds.set(
          entry.misconceptionId,
          ids
        );
      });

      expect(entries, stage.id).toHaveLength(4);
      expect([...judgmentIds.values()].map(
        (ids) => ids.size
      ).sort(), stage.id).toEqual([2, 2]);
    }
    expect(Object.keys(grade3Semester2MisconceptionTitles)).toHaveLength(64);
  });

  it("모든 오개념에 사람이 읽을 제목과 단계별 고유 공통 관찰 기준이 있다", () => {
    const sharedByStage = new Map<string, Set<string>>();
    for (const entry of grade3Semester2DistractorRationales) {
      expect(
        grade3Semester2MisconceptionTitles[entry.misconceptionId],
        entry.misconceptionId
      ).toBeTruthy();
      const stageId = entry.misconceptionId.split(".").slice(0, 2).join(".");
      const values = sharedByStage.get(stageId) ?? new Set<string>();
      values.add(entry.sharedSignalRationale ?? "");
      sharedByStage.set(stageId, values);
    }

    expect(sharedByStage.size).toBe(32);
    expect([...sharedByStage.values()].every(
      (values) => values.size === 1 && !values.has("")
    )).toBe(true);
    expect(
      new Set(
        grade3Semester2DistractorRationales.map(
          (entry) => entry.sharedSignalRationale
        )
      ).size
    ).toBe(32);
  });

  it("블루프린트가 별도 복사본이 아니라 검수 원장을 그대로 참조한다", () => {
    expect(grade3Semester2CoverageBlueprint.distractors).toBe(
      grade3Semester2DistractorRationales
    );
    expect(grade3Semester2CoverageBlueprint.misconceptionTitles).toBe(
      grade3Semester2MisconceptionTitles
    );
  });

  it("Kiro 내용 검수에서 발견한 오답 분류를 정확한 생성 규칙으로 고정한다", () => {
    const expectedMisconceptions = {
      "g3s2-mul-04\u0000721":
        "multiplication.combine.partial-products-combined-without-place-value",
      "g3s2-mul-06\u0000284":
        "multiplication.two-digit.partial-products-combined-incorrectly",
      "g3s2-div-04\u00003-boxes":
        "division.equal-sharing.group-count-as-quotient",
      "g3s2-div-08\u00006plus7plus5":
        "division.remainder-check.confirmation-structure-rebuilt",
      "g3s2-div-10\u0000about-200-each":
        "division.estimate.quotient-scale-too-large",
      "g3s2-frac-10\u0000proper-number":
        "fraction.types.proper-fraction-boundary-missed",
      "g3s2-measure-02\u0000300g":
        "measurement.weight.kg-component-misconverted",
      "g3s2-graph-03\u00005-books":
        "pictograph.legend.legend-used-without-multiplication",
      "g3s2-graph-09\u00006-symbols":
        "pictograph.complete.required-symbol-count-miscomputed",
      "g3s2-graph-10\u000010-more-symbols":
        "pictograph.complete.legend-operation-reversed"
    };
    const entries = new Map(
      grade3Semester2DistractorRationales.map((entry) => [
        `${entry.judgmentId}\u0000${entry.choiceId}`,
        entry
      ])
    );

    for (const [key, misconceptionId] of Object.entries(
      expectedMisconceptions
    )) {
      expect(entries.get(key)?.misconceptionId, key).toBe(misconceptionId);
    }
    expect(
      grade3Semester2DistractorRationales.some((entry) =>
        entry.derivation.includes("300+500=700")
        || entry.derivation.includes("400+300을 100g")
      )
    ).toBe(false);
  });

  it("그림그래프 전이 문항은 0 차이를 피하고 범례 적용을 반드시 요구한다", () => {
    const judgment = grade3Semester2CompleteDiagnosis.judgments.find(
      (item) => item.id === "g3s2-graph-04"
    )!;
    expect(judgment.visual).toMatchObject({
      kind: "pictograph",
      value: 3,
      rows: [
        { label: "축구", count: 5 },
        { label: "야구", count: 3 },
        { label: "농구", count: 1 }
      ]
    });
    expect(judgment.choices).toEqual([
      expect.objectContaining({
        id: "3-students",
        label: "3명",
        correct: true
      }),
      expect.objectContaining({
        id: "1-student",
        label: "1명",
        correct: false
      }),
      expect.objectContaining({
        id: "9-students",
        label: "9명",
        correct: false
      })
    ]);
  });
});
