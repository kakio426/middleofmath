import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  grade3Semester1Diagnosis,
  grade3Semester2CompleteDiagnosis,
  grade4Semester1Diagnosis
} from "@middle-of-math/content/runtime";
import type { Judgment, JudgmentVisual } from "@middle-of-math/domain";
import { describeVisual, VisualAid } from "@middle-of-math/ui";

const activeSets = [
  grade3Semester1Diagnosis,
  grade3Semester2CompleteDiagnosis,
  grade4Semester1Diagnosis
];

const activeJudgments = activeSets.flatMap((content) =>
  content.judgments.map((judgment) => ({
    setId: content.manifest.id,
    judgment
  }))
);

function occurrences(markup: string, token: string): number {
  return markup.split(token).length - 1;
}

function renderVisual(visual: JudgmentVisual): string {
  return renderToStaticMarkup(createElement(VisualAid, { visual }));
}

function expectCircleContract(judgment: Judgment, markup: string) {
  if (judgment.visual.kind !== "circle") return;
  const visual = judgment.visual;
  expect(visual.mode, judgment.id).toBeDefined();
  expect(markup, judgment.id).toContain("mom-circle-diagram");
  expect(markup, judgment.id).toContain("mom-circle-outline");
  expect(markup, judgment.id).not.toContain("mom-circle-wrap");
  expect(markup, judgment.id).not.toContain("mom-circle-center");
  expect(markup, judgment.id).toContain(">O</text>");

  if (visual.mode === "radius") {
    expect(occurrences(markup, "mom-circle-radius-segment"), judgment.id).toBe(1);
    expect(markup, judgment.id).toContain(">A</text>");
  }
  if (visual.mode === "diameter") {
    expect(occurrences(markup, "mom-circle-diameter-segment"), judgment.id).toBe(1);
    expect(markup, judgment.id).toContain(">A</text>");
    expect(markup, judgment.id).toContain(">B</text>");
  }
  if (visual.mode === "equal-radii") {
    expect(occurrences(markup, "mom-circle-radius-segment"), judgment.id).toBe(3);
    for (const label of ["A", "B", "C"]) {
      expect(markup, judgment.id).toContain(`>${label}</text>`);
    }
  }
  if (visual.mode === "compass-center" || visual.mode === "compass-radius") {
    expect(occurrences(markup, "mom-compass-leg"), judgment.id).toBe(2);
    expect(markup, judgment.id).toContain("mom-compass-hinge");
    expect(markup, judgment.id).toContain("mom-compass-needle");
    expect(markup, judgment.id).toContain("mom-compass-pencil");
    expect(markup, judgment.id).toContain(">A</text>");
  }
  if (visual.radiusValue !== undefined) {
    expect(markup, judgment.id).toContain(`>${visual.radiusValue} cm</text>`);
  }

  const description = describeVisual(visual) ?? "";
  if (judgment.choices.some((choice) => choice.correct && choice.label === "반지름")) {
    expect(description, judgment.id).not.toContain("반지름");
  }
  if (judgment.choices.some((choice) => choice.correct && choice.label === "지름")) {
    expect(description, judgment.id).not.toContain("지름");
  }
}

function expectPolygonContract(judgment: Judgment, markup: string) {
  if (judgment.visual.kind !== "polygon-angle-diagram") return;
  const visual = judgment.visual;
  expect(
    occurrences(markup, "mom-polygon-angle-arc"),
    judgment.id
  ).toBe(visual.angles.length);
  expect(
    occurrences(markup, "mom-polygon-vertex-name"),
    judgment.id
  ).toBe(visual.angles.length);
  expect(
    occurrences(markup, "mom-polygon-angle-value"),
    judgment.id
  ).toBe(visual.angles.length);
  expect(markup, judgment.id).not.toContain("mom-polygon-angle-label");
  expect(markup, judgment.id).not.toContain("<circle");
}

function expectAngleFigureContract(judgment: Judgment, markup: string) {
  if (judgment.visual.kind !== "angle-figure") return;
  expect(occurrences(markup, "mom-angle-ray"), judgment.id).toBe(2);
  expect(occurrences(markup, "mom-angle-arc"), judgment.id).toBe(1);
  expect(occurrences(markup, "mom-angle-vertex"), judgment.id).toBe(1);
}

function expectPictographContract(judgment: Judgment, markup: string) {
  if (judgment.visual.kind !== "pictograph") return;
  expect(occurrences(markup, "mom-legend"), judgment.id).toBe(1);
  expect(
    occurrences(markup, "mom-pictograph-row"),
    judgment.id
  ).toBe(judgment.visual.rows.length);
  for (const row of judgment.visual.rows) {
    expect(markup, judgment.id).toContain(`<strong>${row.label}</strong>`);
  }
}

describe("active question-bank visual integrity harness", () => {
  it("renders the complete active bank instead of sampling a few visuals", () => {
    expect(activeSets.map((content) => content.judgments.length)).toEqual([
      16,
      64,
      24
    ]);
    expect(activeJudgments).toHaveLength(104);
  });

  it("renders every visual deterministically with no retired overlay renderer", () => {
    for (const { setId, judgment } of activeJudgments) {
      const first = renderVisual(judgment.visual);
      const second = renderVisual(judgment.visual);
      expect(first, `${setId}/${judgment.id}`).toBe(second);

      if (judgment.visual.kind === "none") {
        expect(first, `${setId}/${judgment.id}`).toBe("");
        continue;
      }

      expect(first, `${setId}/${judgment.id}`).toContain("mom-visual");
      expect(first, `${setId}/${judgment.id}`).not.toMatch(
        /<animate|Math\.random|Date\(|useId/i
      );
      expect(first, `${setId}/${judgment.id}`).not.toContain(
        "그림보다 표시한 수를 보고 판단해요"
      );
      expectCircleContract(judgment, first);
      expectPolygonContract(judgment, first);
      expectAngleFigureContract(judgment, first);
      expectPictographContract(judgment, first);
    }
  });
});
