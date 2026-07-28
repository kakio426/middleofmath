import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { VisualAid } from "./components";

describe("VisualAid fraction bars", () => {
  it("renders improper fractions across enough whole bars", () => {
    const markup = renderToStaticMarkup(
      createElement(VisualAid, {
        visual: { kind: "fraction-bar", numerator: 7, denominator: 5 }
      })
    );

    expect(markup.match(/class="mom-fraction-row"/g)).toHaveLength(2);
    expect(markup.match(/class="is-filled"/g)).toHaveLength(7);
  });

  it("keeps an unknown numerator as one empty reference bar", () => {
    const markup = renderToStaticMarkup(
      createElement(VisualAid, {
        visual: {
          kind: "fraction-bar",
          numerator: 0,
          denominator: 6,
          unknown: "numerator"
        }
      })
    );

    expect(markup.match(/class="mom-fraction-row"/g)).toHaveLength(1);
    expect(markup).not.toContain('class="is-filled"');
  });

  it("does not reveal an unknown denominator through cells or accessibility copy", () => {
    const markup = renderToStaticMarkup(
      createElement(VisualAid, {
        visual: {
          kind: "fraction-bar",
          numerator: 3,
          denominator: 6,
          unknown: "denominator"
        }
      })
    );

    expect(markup).toContain("분모는 물음표");
    expect(markup).not.toContain("6칸");
    expect(markup).not.toContain("mom-fraction-row");
  });
});

describe("VisualAid division groups", () => {
  it("uses neutral group labels for different sharing contexts", () => {
    const markup = renderToStaticMarkup(
      createElement(VisualAid, {
        visual: { kind: "division-groups", total: 35, groups: 5 }
      })
    );

    expect(markup.match(/묶음 [1-5]/g)).toHaveLength(5);
    expect(markup).not.toContain("한 사람");
  });
});
