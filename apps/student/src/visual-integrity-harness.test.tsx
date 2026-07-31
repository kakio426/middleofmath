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

function expectGridTransformContract(judgment: Judgment, markup: string) {
  if (judgment.visual.kind !== "grid-transform-diagram") return;
  const visual = judgment.visual;
  const studentCopy = [
    judgment.context,
    judgment.prompt,
    ...judgment.choices.map((choice) => choice.label)
  ].filter(Boolean).join(" ");
  expect(markup, judgment.id).toContain("mom-transform-grid-background");
  expect(studentCopy, judgment.id).not.toMatch(
    /흰\s*점|검은\s*점|초록색|노란색/
  );
  expect(
    occurrences(markup, "mom-transform-grid-line"),
    judgment.id
  ).toBe(visual.rows + visual.columns + 2);
  if (visual.mode === "point-move") {
    expect(occurrences(markup, 'class="mom-transform-point"'), judgment.id)
      .toBe(2);
    expect(markup, judgment.id).not.toContain("mom-transform-source-cell");
  } else {
    expect(
      occurrences(markup, "mom-transform-source-cell"),
      judgment.id
    ).toBe((visual.sourceCells?.length ?? 0) + 1);
    expect(
      occurrences(markup, "mom-transform-target-cell"),
      judgment.id
    ).toBe((visual.targetCells?.length ?? 0) + 1);
  }
  expect(describeVisual(visual), judgment.id).not.toMatch(
    /오른쪽으로|왼쪽으로|위쪽으로|아래쪽으로|시계 방향|시계 반대 방향|좌우를 뒤집|위아래를 뒤집/
  );
}

function expectRelationPatternContract(judgment: Judgment, markup: string) {
  if (judgment.visual.kind !== "relation-pattern-diagram") return;
  const visual = judgment.visual;
  expect(markup, judgment.id).toContain("mom-relation-pattern");
  expect(markup, judgment.id).not.toContain(
    judgment.choices.find((choice) => choice.correct)?.label ?? "__missing__"
  );
  expect(describeVisual(visual), judgment.id).not.toContain(
    judgment.choices.find((choice) => choice.correct)?.label ?? "__missing__"
  );
  if (visual.mode === "number-sequence") {
    expect(occurrences(markup, "mom-relation-arrow"), judgment.id)
      .toBe((visual.terms?.length ?? 1) - 1);
    expect(markup, judgment.id).toContain("is-unknown");
  }
  if (visual.mode === "figure-sequence") {
    expect(occurrences(markup, "mom-relation-figure-card"), judgment.id)
      .toBe(visual.counts?.length ?? 0);
  }
  if (visual.mode === "rule-table") {
    expect(occurrences(markup, "<tbody>"), judgment.id).toBe(1);
    expect(occurrences(markup, "<tr>"), judgment.id)
      .toBe((visual.rows?.length ?? 0) + 1);
  }
  if (visual.mode === "calculation-array") {
    expect(occurrences(markup, "<p>"), judgment.id)
      .toBe(visual.calculations?.length ?? 0);
  }
  if (visual.mode === "equal-sign-balance") {
    expect(markup, judgment.id).toContain("mom-relation-equation");
    expect(markup, judgment.id).toContain("is-unknown");
  }
}

function expectBarChartContract(judgment: Judgment, markup: string) {
  if (judgment.visual.kind !== "bar-chart-diagram") return;
  const visual = judgment.visual;
  expect(markup, judgment.id).toContain("mom-bar-chart");
  expect(markup, judgment.id).toContain('role="img"');
  const expectedBars = visual.mode === "table-match"
    ? visual.candidates!.reduce(
        (count, candidate) => count + candidate.bars.length,
        0
      )
    : visual.bars!.length;
  expect(occurrences(markup, "mom-bar-mark"), judgment.id).toBe(expectedBars);
  expect(occurrences(markup, "mom-bar-axis-line"), judgment.id).toBe(
    visual.mode === "table-match" ? 6 : 2
  );
  expect(
    [
      judgment.context,
      judgment.prompt,
      ...judgment.choices.map((choice) => choice.label)
    ].filter(Boolean).join(" "),
    judgment.id
  ).not.toMatch(/초록색|노란색|파란색|빨간색/);
  if (visual.mode !== "table-match") {
    const correctLabel =
      judgment.choices.find((choice) => choice.correct)?.label ?? "__missing__";
    expect(markup, judgment.id).not.toContain(correctLabel);
    expect(describeVisual(visual), judgment.id).not.toContain(correctLabel);
  }
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
      66
    ]);
    expect(activeJudgments).toHaveLength(146);
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
      expectGridTransformContract(judgment, first);
      expectRelationPatternContract(judgment, first);
      expectBarChartContract(judgment, first);
      expectPictographContract(judgment, first);
    }
  });
});
