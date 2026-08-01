import { describe, expect, it } from "vitest";
import type { Judgment } from "@middle-of-math/domain";
import { grade5Semester1Diagnosis } from "./grade5-semester1";
import { grade5Semester1DistractorRationales } from "./grade5-semester1-rationales";

const judgments = grade5Semester1Diagnosis.judgments.filter(
  (judgment) => judgment.unitId === "polygon-perimeter-area"
);

function numericLabel(label: string): number {
  return Number(label.match(/^\d+/)?.[0]);
}

function expectedValue(judgment: Judgment): number | null {
  const visual = judgment.visual;
  if (visual.kind !== "perimeter-area-diagram") return null;
  if (visual.shape === "rectangle") {
    return judgment.learnerStageId === "pa.perimeter"
      ? (visual.width + visual.height) * 2
      : visual.width * visual.height;
  }
  if (visual.shape === "square") {
    return judgment.learnerStageId === "pa.perimeter"
      ? visual.side * 4
      : visual.side * visual.side;
  }
  if (visual.shape === "parallelogram") return visual.base * visual.height;
  if (visual.shape === "triangle") return visual.base * visual.height / 2;
  if (visual.shape === "trapezoid") {
    return (visual.topBase + visual.bottomBase) * visual.height / 2;
  }
  if (visual.shape === "rhombus") {
    return visual.diagonal1 * visual.diagonal2 / 2;
  }
  return null;
}

function expectedDistractorLabel(
  judgment: Judgment,
  misconceptionId: string
): string {
  if (judgment.learnerStageId === "pa.area-unit") {
    const unitLabels: Record<string, Record<string, string>> = {
      "g5s1-pa-03": {
        "pa.area-unit.wrong-scale": "cm²",
        "pa.area-unit.use-length-unit": "m"
      },
      "g5s1-pa-04": {
        "pa.area-unit.wrong-scale": "m²",
        "pa.area-unit.use-length-unit": "cm"
      }
    };
    const label = unitLabels[judgment.id]?.[misconceptionId];
    if (!label) throw new Error(`Missing unit oracle for ${judgment.id}`);
    return label;
  }

  const visual = judgment.visual;
  if (visual.kind !== "perimeter-area-diagram") {
    throw new Error(`Missing area diagram for ${judgment.id}`);
  }
  const unit = judgment.learnerStageId === "pa.perimeter" ? "cm" : "cm²";
  let value: number;
  if (visual.shape === "rectangle") {
    value = misconceptionId.endsWith("use-area-formula")
      ? visual.width * visual.height
      : misconceptionId.endsWith("calculate-perimeter")
        ? (visual.width + visual.height) * 2
        : visual.width + visual.height;
  } else if (visual.shape === "square") {
    value = misconceptionId.endsWith("use-area-formula")
      ? visual.side * visual.side
      : misconceptionId.endsWith("calculate-perimeter")
        ? visual.side * 4
        : visual.side * 2;
  } else if (visual.shape === "parallelogram") {
    value = misconceptionId.endsWith("square-base")
      ? visual.base * visual.base
      : visual.base + visual.height;
  } else if (visual.shape === "triangle") {
    value = misconceptionId.endsWith("omit-half")
      ? visual.base * visual.height
      : visual.base + visual.height;
  } else if (visual.shape === "trapezoid") {
    value = misconceptionId.endsWith("omit-half")
      ? (visual.topBase + visual.bottomBase) * visual.height
      : (visual.topBase + visual.height) * visual.height;
  } else if (visual.shape === "rhombus") {
    value = misconceptionId.endsWith("omit-half")
      ? visual.diagonal1 * visual.diagonal2
      : visual.diagonal1 + visual.diagonal2;
  } else {
    throw new Error(`Unsupported visual for ${judgment.id}`);
  }
  return `${value} ${unit}`;
}

describe("A4-6 다각형의 둘레와 넓이 오라클", () => {
  it("7단계 14문항이 각 2문항으로 구성된다", () => {
    expect(judgments).toHaveLength(14);
    const counts = judgments.reduce((result, judgment) => {
      result.set(
        judgment.learnerStageId,
        (result.get(judgment.learnerStageId) ?? 0) + 1
      );
      return result;
    }, new Map<string, number>());
    expect([...counts.values()]).toEqual([2, 2, 2, 2, 2, 2, 2]);
  });

  it("표시된 길이로 다시 계산한 값이 유일한 정답이다", () => {
    for (const judgment of judgments) {
      const expected = expectedValue(judgment);
      if (expected === null) continue;
      const matching = judgment.choices.filter(
        (choice) => numericLabel(choice.label) === expected
      );
      expect(matching, judgment.id).toHaveLength(1);
      expect(matching[0].correct, judgment.id).toBe(true);
    }
  });

  it("넓이 단위 문항은 제곱 단위와 대상 크기를 함께 구별한다", () => {
    const units = judgments.filter(
      (judgment) => judgment.learnerStageId === "pa.area-unit"
    );
    expect(units.map((judgment) =>
      judgment.choices.find((choice) => choice.correct)?.label
    )).toEqual(["m²", "cm²"]);
    for (const judgment of units) {
      expect(judgment.visual.kind, judgment.id).toBe("none");
      expect(judgment.choices.filter((choice) => !choice.correct).some(
        (choice) => !choice.label.includes("²")
      ), judgment.id).toBe(true);
      expect(judgment.choices.filter((choice) => !choice.correct).some(
        (choice) => choice.label.includes("²")
      ), judgment.id).toBe(true);
    }
  });

  it("도형 접근성 정보에는 보이는 길이만 있고 정답은 없다", () => {
    for (const judgment of judgments) {
      if (judgment.visual.kind !== "perimeter-area-diagram") continue;
      const serialized = JSON.stringify(judgment.visual);
      const answer = judgment.choices.find((choice) => choice.correct)!.label;
      expect(serialized, judgment.id).not.toMatch(/answer|result|areaValue/);
      expect(serialized, judgment.id).not.toContain(answer);
    }
  });

  it("28개 오답은 의미 ID의 실제 오개념 식으로 다시 계산된다", () => {
    const rationales = grade5Semester1DistractorRationales.filter(
      (entry) => entry.judgmentId.startsWith("g5s1-pa-")
    );
    expect(rationales).toHaveLength(28);
    expect(rationales.every((entry) => entry.misconceptionId.startsWith("pa.")))
      .toBe(true);
    expect(rationales.every((entry) => !/\.(?:a|b)$/.test(
      entry.misconceptionId
    ))).toBe(true);
    expect(rationales.every((entry) => entry.derivation.length >= 20)).toBe(true);
    for (const entry of rationales) {
      const judgment = judgments.find((item) => item.id === entry.judgmentId)!;
      const choice = judgment.choices.find((item) => item.id === entry.choiceId)!;
      expect(choice.correct, `${entry.judgmentId}/${entry.choiceId}`).toBe(false);
      expect(choice.label, `${entry.judgmentId}/${entry.misconceptionId}`).toBe(
        expectedDistractorLabel(judgment, entry.misconceptionId)
      );
    }
  });
});
