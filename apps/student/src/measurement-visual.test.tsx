import { grade3Semester2CompleteDiagnosis } from "@middle-of-math/content/runtime";
import { VisualAid } from "@middle-of-math/ui";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("3학년 2학기 측정 시각 자료 통합", () => {
  const judgments = grade3Semester2CompleteDiagnosis.judgments.filter(
    (judgment) => judgment.unitId === "measurement"
  );

  it("renders all 14 diagrams without exposing their correct answer", () => {
    expect(judgments).toHaveLength(14);
    for (const judgment of judgments) {
      const markup = renderToStaticMarkup(
        createElement(VisualAid, { visual: judgment.visual })
      );
      const correctLabel = judgment.choices.find((choice) => choice.correct)?.label;

      expect(correctLabel, judgment.id).toBeDefined();
      expect(markup, judgment.id).not.toContain(correctLabel);
      expect(markup.match(/role="img"/g), judgment.id).toHaveLength(1);
      expect(markup, judgment.id).toContain('focusable="false"');
      expect(markup, judgment.id).not.toMatch(
        /오개념|진단 결과|정답은|틀렸|부족|교사용|학부모용/
      );
    }
  });

  it("gives every diagram stable Korean accessibility copy", () => {
    for (const judgment of judgments) {
      const first = renderToStaticMarkup(
        createElement(VisualAid, { visual: judgment.visual })
      );
      const second = renderToStaticMarkup(
        createElement(VisualAid, { visual: judgment.visual })
      );

      expect(first, judgment.id).toBe(second);
      expect(first, judgment.id).toMatch(/aria-label="[^"]+[가-힣][^"]*"/);
      expect(first, judgment.id).toContain('aria-hidden="true"');
    }
  });
});
