import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { JudgmentVisual } from "@middle-of-math/domain";
import {
  ChoiceOption,
  ConfidenceMark,
  describeVisual,
  ReadableText,
  VisualAid
} from "./components";

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

describe("VisualAid partition diagrams", () => {
  it("shows equal and unequal parts without replacing them with prose choices", () => {
    const visual: JudgmentVisual = {
      kind: "partition-diagrams",
      diagrams: [
        { label: "가", parts: [1, 1, 1, 1], highlightedPart: 0 },
        { label: "나", parts: [1, 2, 1, 2], highlightedPart: 0 },
        { label: "다", parts: [1, 1, 1], highlightedPart: 0 }
      ]
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(markup).toContain("같은 너비 4조각");
    expect(markup).toContain("서로 다른 너비 4조각");
    expect(markup.match(/class="mom-partition-diagram"/g)).toHaveLength(3);
    expect(markup.match(/is-highlighted/g)).toHaveLength(3);
    expect(markup).not.toContain("<img");
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

describe("VisualAid semantic measurement diagrams", () => {
  it("renders an unknown target instead of calculating a unit-relation answer", () => {
    const visual: JudgmentVisual = {
      kind: "unit-relation",
      medium: "weight",
      given: [{ value: 2, unit: "kg" }, { value: 300, unit: "g" }],
      targetUnit: "g"
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(describeVisual(visual)).toBe("2킬로그램 300그램을 그램으로 나타내는 관계. 답은 물음표.");
    expect(markup).toContain("? g");
    expect(markup).not.toContain("2300");
    expect(markup.match(/role="img"/g)).toHaveLength(1);
    expect(markup).toContain('focusable="false"');
    expect(markup).not.toMatch(/<defs|<animate|#[0-9a-f]{3,8}/i);
  });

  it("renders combine operands with a question-mark result and deterministic markup", () => {
    const visual: JudgmentVisual = {
      kind: "quantity-combine",
      medium: "capacity",
      operator: "subtract",
      left: [{ value: 5, unit: "L" }],
      right: [{ value: 2, unit: "L" }, { value: 750, unit: "mL" }]
    };
    const first = renderToStaticMarkup(createElement(VisualAid, { visual }));
    const second = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(first).toBe(second);
    expect(first).toContain("5L");
    expect(first).toContain("2L 750mL");
    expect(first).toContain(">?</text>");
    expect(first).not.toContain("2L 250mL");
    expect(first).not.toMatch(/Math\.random|Date\(|useId|<animate/i);
  });

  it("keeps referent diagrams free of numeric graduations and scale needles", () => {
    const capacity = renderToStaticMarkup(
      createElement(VisualAid, {
        visual: {
          kind: "measure-referent",
          medium: "capacity",
          object: "paper-cup",
          instrument: "beaker"
        }
      })
    );
    const weight = renderToStaticMarkup(
      createElement(VisualAid, {
        visual: {
          kind: "measure-referent",
          medium: "weight",
          object: "watermelon",
          instrument: "scale"
        }
      })
    );

    expect(capacity).toContain("종이컵의 들이를 눈금 없는 비커로 재어 보는 그림");
    expect(weight).toContain("수박의 무게를 바늘이나 눈금이 없는 저울로 재어 보는 그림");
    expect(`${capacity}${weight}`).not.toMatch(/<text[^>]*>[0-9]/);
    expect(`${capacity}${weight}`).not.toMatch(/tick|needle|graduation/i);
  });

  it("neutralizes answer-bearing values from the legacy measurement visual", () => {
    const markup = renderToStaticMarkup(
      createElement(VisualAid, {
        visual: { kind: "measurement", amount: 2300, unit: "g" }
      })
    );

    expect(markup).toContain("무게를 재는 바늘이나 눈금이 없는 저울 그림");
    expect(markup).not.toContain("2300");
    expect(markup.match(/role="img"/g)).toHaveLength(1);
  });

  it("keeps a length conversion result unknown", () => {
    const visual: JudgmentVisual = {
      kind: "length-relation",
      value: 2,
      fromUnit: "km",
      targetUnit: "m"
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(describeVisual(visual)).toBe("2km를 m로 나타내는 관계. 답은 물음표.");
    expect(markup).toContain("2km");
    expect(markup).toContain("? m");
    expect(markup).not.toContain("2000");
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

describe("VisualAid place-value chart", () => {
  it("renders derived place names and highlights without calculating the answer", () => {
    const visual: JudgmentVisual = {
      kind: "place-value-chart",
      digits: [7, 3, 5, 2, 4],
      ask: "value",
      highlightIndexes: [1]
    };
    const first = renderToStaticMarkup(createElement(VisualAid, { visual }));
    const second = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(first).toBe(second);
    expect(first).toContain("<table");
    expect(first).toContain("만의 자리");
    expect(first).toContain("천의 자리");
    expect(first.match(/is-highlighted/g)).toHaveLength(2);
    expect(first).not.toContain("3000");
    expect(first).not.toContain("<img");
  });

  it("does not highlight the answer in a place-name question", () => {
    const markup = renderToStaticMarkup(
      createElement(VisualAid, {
        visual: {
          kind: "place-value-chart",
          digits: [8, 4, 1, 6, 2],
          ask: "place-name"
        }
      })
    );

    expect(markup).toContain("자리표");
    expect(markup).not.toContain("is-highlighted");
  });
});

describe("VisualAid angle diagrams", () => {
  it("renders a bare angle deterministically without naming its size or kind", () => {
    const visual: JudgmentVisual = {
      kind: "angle-figure",
      degrees: 90,
      mode: "bare",
      rayLengths: [42, 88],
      label: "가"
    };
    const first = renderToStaticMarkup(createElement(VisualAid, { visual }));
    const second = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(first).toBe(second);
    expect(first).toContain('class="mom-visual mom-semantic-angle mom-angle-figure"');
    expect(first).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(describeVisual(visual)).toContain("한 변이 다른 변보다 짧습니다");
    expect(describeVisual(visual)).not.toMatch(/90|직각입니다|예각|둔각/);
    expect(first).not.toMatch(/<animate|Math\.random|Date\(|useId/i);
  });

  it("shows both protractor scales but not the keyed measured answer", () => {
    const visual: JudgmentVisual = {
      kind: "angle-figure",
      degrees: 125,
      mode: "protractor",
      protractorPlacement: "aligned",
      label: "가"
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(markup.match(/class="mom-protractor-number"/g)).toHaveLength(11);
    expect(markup.match(/class="mom-protractor-number is-outer"/g)).toHaveLength(11);
    expect(markup.match(/class="mom-protractor-tick/g)).toHaveLength(37);
    expect(markup).toContain(">0</text>");
    expect(markup).toContain(">180</text>");
    expect(markup).not.toMatch(/>125(?:도|°)?<\/text>/);
    expect(describeVisual(visual)).not.toContain("125");
  });

  it("describes an offset baseline as a visible fact without judging it", () => {
    const visual: JudgmentVisual = {
      kind: "angle-figure",
      degrees: 70,
      mode: "protractor",
      protractorPlacement: "baseline-off",
      label: "나"
    };
    const description = describeVisual(visual);
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(description).toContain("0 눈금이 한 변에서 벗어나 있습니다");
    expect(description).not.toMatch(/바르게|잘못|70도/);
    expect(markup).toContain("rotate(12 120 132)");
  });

  it("renders polygon values and a question mark without calculating a missing angle", () => {
    const visual: JudgmentVisual = {
      kind: "polygon-angle-diagram",
      polygon: "triangle",
      mode: "find-missing",
      angles: [
        { label: "가", value: 55 },
        { label: "나", value: 80 },
        { label: "다", value: null }
      ]
    };
    const first = renderToStaticMarkup(createElement(VisualAid, { visual }));
    const second = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(first).toBe(second);
    expect(first).toContain("55°");
    expect(first).toContain("80°");
    expect(first).toContain(">?</text>");
    expect(first).not.toContain('points="30,132 210,132 96,36"');
    expect(`${first} ${describeVisual(visual)}`).not.toMatch(/45도|45°|합은 180/);
  });

  it("marks every verify-claim polygon as a not-to-scale sketch", () => {
    const visual: JudgmentVisual = {
      kind: "polygon-angle-diagram",
      polygon: "triangle",
      mode: "verify-claim",
      angles: [
        { label: "가", value: 60 },
        { label: "나", value: 70 },
        { label: "다", value: 60 }
      ]
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(markup).toContain("그림보다 표시한 수를 보고 판단해요");
    expect(markup).not.toMatch(/190도|그릴 수 없습니다/);
  });

  it("shows a quadrilateral diagonal without stating the sum or correctness", () => {
    const visual: JudgmentVisual = {
      kind: "polygon-angle-diagram",
      polygon: "quadrilateral",
      mode: "verify-claim",
      diagonal: true,
      angles: [
        { label: "가", value: 95 },
        { label: "나", value: 100 },
        { label: "다", value: 80 },
        { label: "라", value: 85 }
      ]
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));
    const description = describeVisual(visual);

    expect(markup).toContain("mom-polygon-diagonal");
    expect(markup).toContain("그림보다 표시한 수를 보고 판단해요");
    expect(description).toContain("대각선 하나로 두 삼각형으로 나뉘어");
    expect(description).not.toMatch(/360|합은|맞습니다|틀립니다/);
  });
});

describe("ConfidenceMark", () => {
  it("labels repeated evidence without diagnostic severity language", () => {
    const markup = renderToStaticMarkup(
      createElement(ConfidenceMark, { confidence: "confirmed" })
    );

    expect(markup).toContain("반복 확인");
    expect(markup).not.toMatch(/우선 확인|관찰됨|근거 더 필요|rules-/);
  });

  it("labels thin evidence as one observation without an engine identifier", () => {
    const markup = renderToStaticMarkup(
      createElement(ConfidenceMark, { confidence: "tentative" })
    );

    expect(markup).toContain("한 번 관찰");
    expect(markup).not.toMatch(/우선 확인|관찰됨|근거 더 필요|rules-/);
  });
});
