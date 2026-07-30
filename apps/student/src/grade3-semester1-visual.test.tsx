import { grade3Semester1Diagnosis } from "@middle-of-math/content/runtime";
import { VisualAid } from "@middle-of-math/ui";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("3학년 1학기 학생 시각 자료", () => {
  it("등분할과 길이 그림을 결정적으로 렌더링하고 정답 문구를 넣지 않는다", () => {
    const judgments = grade3Semester1Diagnosis.judgments.filter(
      (judgment) =>
        judgment.visual.kind === "partition-diagrams"
        || judgment.unitId === "length"
    );
    expect(judgments).toHaveLength(6);

    for (const judgment of judgments) {
      const first = renderToStaticMarkup(
        createElement(VisualAid, { visual: judgment.visual })
      );
      const second = renderToStaticMarkup(
        createElement(VisualAid, { visual: judgment.visual })
      );
      const correct = judgment.choices.find((choice) => choice.correct)?.label;

      expect(first, judgment.id).toBe(second);
      expect(first, judgment.id).toMatch(/role="img"/);
      expect(correct, judgment.id).toBeDefined();
      expect(first, judgment.id).not.toContain(correct);
      expect(first, judgment.id).not.toMatch(
        /정답은|틀렸|오개념|진단 결과|부족/
      );
    }
  });
});
