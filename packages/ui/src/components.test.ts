import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChoiceOption, ReadableText, VisualAid } from "./components";

describe("ReadableText", () => {
  it("keeps every Korean eojeol in an atomic token without manual line breaks", () => {
    const markup = renderToStaticMarkup(
      createElement(ReadableText, {
        text: "그림그래프에 나타낸 책은 모두 몇 권일까요?"
      })
    );

    expect(markup.match(/class="mom-readable-token"/g)).toHaveLength(6);
    expect(markup).toContain("그림그래프에");
    expect(markup).toContain("권일까요?");
    expect(markup).not.toContain("<br");
  });

  it("keeps sentences together when they fit and attaches a connector to the next word", () => {
    const markup = renderToStaticMarkup(
      createElement(ReadableText, {
        text: "24×3을 계산하려고 해요. 먼저 20×3은 얼마일까요?"
      })
    );

    expect(markup.match(/class="mom-readable-sentence"/g)).toHaveLength(2);
    expect(markup.match(/class="mom-readable-token"/g)).toHaveLength(6);
    expect(markup).toContain(
      '<span class="mom-readable-keep"><span class="mom-readable-token">먼저</span> <span class="mom-readable-token">20×3은</span></span>'
    );
    expect(markup).not.toContain("<br");
  });

  it("uses the same readable tokens inside answer choices", () => {
    const markup = renderToStaticMarkup(
      createElement(ChoiceOption, {
        label: "두 분수는 같아요",
        selected: false,
        onSelect: () => undefined
      })
    );

    expect(markup.match(/class="mom-readable-token"/g)).toHaveLength(3);
    expect(markup).toContain("mom-readable-text");
  });
});

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

describe("VisualAid source data", () => {
  it("renders unsorted items without pre-counting them", () => {
    const markup = renderToStaticMarkup(
      createElement(VisualAid, {
        visual: {
          kind: "item-collection",
          ariaLabel: "빨간색 공, 파란색 공, 빨간색 공",
          items: ["🔴", "🔵", "🔴"]
        }
      })
    );

    expect(markup).toContain("mom-item-collection");
    expect(markup.match(/<span/g)).toHaveLength(3);
    expect(markup).toContain("빨간색 공, 파란색 공, 빨간색 공");
  });

  it("renders an unknown table value as a question mark", () => {
    const markup = renderToStaticMarkup(
      createElement(VisualAid, {
        visual: {
          kind: "data-table",
          title: "좋아하는 동물 조사",
          rows: [
            { label: "고양이", value: "3" },
            { label: "토끼", value: "?" }
          ]
        }
      })
    );

    expect(markup).toContain("<table");
    expect(markup).toContain("좋아하는 동물 조사");
    expect(markup).toContain('class="is-unknown">?</td>');
  });
});
