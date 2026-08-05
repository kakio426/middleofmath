import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { JudgmentVisual } from "@middle-of-math/domain";
import {
  ChoiceOption,
  ConfidenceMark,
  describeVisual,
  EvidenceRail,
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

  it("keeps a spaced arithmetic expression in one line-break group", () => {
    const markup = renderToStaticMarkup(
      createElement(ReadableText, {
        text: "20 + 24 ÷ (8 − 4) = ?"
      })
    );

    expect(markup.match(/class="mom-readable-token"/g)).toHaveLength(9);
    expect(markup).toContain(
      '<span class="mom-readable-keep"><span class="mom-readable-token">20</span> '
      + '<span class="mom-readable-token">+</span> '
      + '<span class="mom-readable-token">24</span> '
      + '<span class="mom-readable-token">÷</span>'
    );
    expect(markup).not.toContain("<br");
  });

  it("keeps each number and comma together while allowing a long list to wrap", () => {
    const markup = renderToStaticMarkup(
      createElement(ReadableText, {
        text: "1, 2, 3, 4, 6, 8, 12, 24"
      })
    );

    expect(markup.match(/class="mom-readable-token"/g)).toHaveLength(8);
    expect(markup).toContain('<span class="mom-readable-token">1,</span>');
    expect(markup).toContain('<span class="mom-readable-token">12,</span>');
    expect(markup).toContain('<span class="mom-readable-token">24</span>');
    expect(markup).not.toContain("mom-readable-keep");
    expect(markup).not.toContain("<br");
  });

  it("renders slash fractions as stacked textbook fractions", () => {
    const markup = renderToStaticMarkup(
      createElement(ReadableText, {
        text: "1/4 + 1/3 = ?"
      })
    );

    expect(markup.match(/class="mom-stacked-fraction"/g)).toHaveLength(2);
    expect(markup).toContain('aria-label="4분의 1"');
    expect(markup).toContain('aria-label="3분의 1"');
    expect(markup).toContain(
      '<span class="mom-stacked-fraction-numerator" aria-hidden="true">1</span>'
    );
    expect(markup).toContain(
      '<span class="mom-stacked-fraction-denominator" aria-hidden="true">4</span>'
    );
  });

  it("keeps a whole number and stacked fraction together as one mixed number", () => {
    const markup = renderToStaticMarkup(
      createElement(ReadableText, {
        text: "2 1/3"
      })
    );

    expect(markup).toContain(
      '<span class="mom-readable-keep"><span class="mom-readable-token">2</span> '
    );
    expect(markup).toContain('aria-label="3분의 1"');
  });

  it("keeps a mixed number attached when the fraction has a Korean ending", () => {
    const markup = renderToStaticMarkup(
      createElement(ReadableText, {
        text: "2 1/3과 같은 수"
      })
    );

    expect(markup.match(/class="mom-readable-keep"/g)).toHaveLength(1);
    expect(markup).toMatch(
      /mom-readable-keep[\s\S]*?>2<\/[\s\S]*?aria-label="3분의 1"[\s\S]*?<\/span>과/
    );
  });

  it("keeps Korean mixed numbers and the operator in one line-break group", () => {
    const markup = renderToStaticMarkup(
      createElement(ReadableText, {
        text: "1과 2/7 + 2와 3/7을 대분수로 나타내면 얼마일까요?"
      })
    );

    expect(markup.match(/class="mom-readable-keep"/g)).toHaveLength(1);
    expect(markup).toMatch(
      /mom-readable-keep[\s\S]*?1과[\s\S]*?aria-label="7분의 2"[\s\S]*?>\+<[\s\S]*?2와[\s\S]*?aria-label="7분의 3"/
    );
  });

  it("renders fractions inside Korean eojeol without losing the ending", () => {
    const markup = renderToStaticMarkup(
      createElement(ReadableText, {
        text: "3/5와 크기가 같은 분수"
      })
    );

    expect(markup).toContain('aria-label="5분의 3"');
    expect(markup).toContain("</span>와</span>");
  });
});

describe("EvidenceRail", () => {
  const evidence = {
    eventId: "event-1",
    judgmentId: "judgment-1",
    learnerStageId: "stage-1",
    curriculumAnchorIds: ["anchor-1"],
    selectedChoiceId: "wrong",
    selectedChoiceLabel: "5명",
    durationBand: "steady" as const,
    firstSelectionMs: 3_000,
    confirmationMs: 1_000,
    selectionChanges: 0,
    uncertainty: false
  };

  it("adds a fourth teacher-only choice interpretation when supplied", () => {
    const markup = renderToStaticMarkup(createElement(EvidenceRail, {
      anchor: "[4수04-01]",
      stage: "눈금 한 칸의 값 읽기",
      evidence,
      choiceNote: { title: "눈금 수를 값으로 읽음", text: "한 칸의 값을 다시 확인합니다." }
    }));
    expect(markup.match(/<li>/g)).toHaveLength(4);
    expect(markup).toContain("이 선택에서 확인할 생각");
  });

  it("keeps the legacy three-step rail when no choice interpretation exists", () => {
    const markup = renderToStaticMarkup(createElement(EvidenceRail, {
      anchor: "[4수04-01]",
      stage: "눈금 한 칸의 값 읽기",
      evidence
    }));
    expect(markup.match(/<li>/g)).toHaveLength(3);
    expect(markup).not.toContain("이 선택에서 확인할 생각");
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

describe("VisualAid circle diagrams", () => {
  it("uses point labels and a real center-to-circle segment for a radius task", () => {
    const visual: JudgmentVisual = {
      kind: "circle",
      mode: "radius"
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(markup).toContain("mom-circle-outline");
    expect(markup).toContain("mom-circle-radius-segment");
    expect(markup).toContain(">O</text>");
    expect(markup).toContain(">A</text>");
    expect(markup).not.toContain("mom-circle-wrap");
    expect(describeVisual(visual)).not.toMatch(/반지름|정답/);
  });

  it("shows a diameter through O while labeling only the given half length", () => {
    const visual: JudgmentVisual = {
      kind: "circle",
      mode: "diameter",
      radiusValue: 6
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(markup).toContain("mom-circle-diameter-segment");
    expect(markup).toContain("mom-circle-radius-highlight");
    expect(markup).toContain(">6 cm</text>");
    expect(markup).not.toContain("12 cm");
    expect(markup.match(/mom-circle-point-label/g)).toHaveLength(3);
  });

  it("labels a given diameter across the whole segment in metres", () => {
    const visual: JudgmentVisual = {
      kind: "circle",
      mode: "diameter",
      diameterValue: 20,
      measurementUnit: "m"
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(markup).toContain(">20 m</text>");
    expect(markup).not.toContain("mom-circle-radius-highlight");
    expect(describeVisual(visual)).toContain("선분 AB의 길이는 20미터");
  });

  it("draws three separately labeled radii for equal-radius comparisons", () => {
    const visual: JudgmentVisual = {
      kind: "circle",
      mode: "equal-radii",
      radiusValue: 3
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(markup.match(/mom-circle-radius-segment/g)).toHaveLength(3);
    for (const label of ["O", "A", "B", "C"]) {
      expect(markup).toContain(`>${label}</text>`);
    }
    expect(markup).toContain(">3 cm</text>");
  });

  it("renders the compass legs, hinge, needle, pencil, and opening measure", () => {
    const visual: JudgmentVisual = {
      kind: "circle",
      mode: "compass-radius",
      radiusValue: 5
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(markup.match(/mom-compass-leg/g)).toHaveLength(2);
    expect(markup).toContain("mom-compass-hinge");
    expect(markup).toContain("mom-compass-needle");
    expect(markup).toContain("mom-compass-pencil");
    expect(markup).toContain(">5 cm</text>");
  });

  it("keeps the immutable legacy circle payload compatible with the new renderer", () => {
    const markup = renderToStaticMarkup(
      createElement(VisualAid, {
        visual: {
          kind: "circle",
          showCenter: true,
          showDiameter: true
        }
      })
    );

    expect(markup).toContain("mom-circle-diameter-segment");
    expect(markup).not.toContain("mom-circle-wrap");
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

describe("VisualAid upper-grade semantic diagrams", () => {
  function renderedNet(shape: "cube" | "rectangular-prism" | "cylinder" | "cone") {
    return renderToStaticMarkup(createElement(VisualAid, {
      visual: { kind: "solid-diagram", mode: "net", shape }
    }));
  }

  function netRectangles(markup: string, prefix: "cube" | "box") {
    return [...markup.matchAll(new RegExp(`<rect[^>]*data-net-face="${prefix}-\\d+"[^>]*>`, "g"))]
      .map(([tag]) => {
        const value = (name: string) => Number(tag.match(new RegExp(`${name}="([^"]+)"`))?.[1]);
        return { x: value("x"), y: value("y"), width: value("width"), height: value("height") };
      });
  }

  function rectanglesShareEdge(
    left: { x: number; y: number; width: number; height: number },
    right: { x: number; y: number; width: number; height: number }
  ) {
    const vertical = (left.x + left.width === right.x || right.x + right.width === left.x)
      && Math.min(left.y + left.height, right.y + right.height) > Math.max(left.y, right.y);
    const horizontal = (left.y + left.height === right.y || right.y + right.height === left.y)
      && Math.min(left.x + left.width, right.x + right.width) > Math.max(left.x, right.x);
    return vertical || horizontal;
  }

  it.each(["cube", "rectangular-prism"] as const)(
    "%s net has six non-overlapping faces joined by full fold edges",
    (shape) => {
      const faces = netRectangles(renderedNet(shape), shape === "cube" ? "cube" : "box");
      expect(faces).toHaveLength(6);
      const visited = new Set([0]);
      while (true) {
        const next = faces.findIndex((face, index) => !visited.has(index)
          && [...visited].some((visitedIndex) => rectanglesShareEdge(face, faces[visitedIndex]!)));
        if (next < 0) break;
        visited.add(next);
      }
      expect(visited.size).toBe(6);
      for (let left = 0; left < faces.length; left += 1) {
        for (let right = left + 1; right < faces.length; right += 1) {
          const overlapWidth = Math.min(faces[left]!.x + faces[left]!.width, faces[right]!.x + faces[right]!.width)
            - Math.max(faces[left]!.x, faces[right]!.x);
          const overlapHeight = Math.min(faces[left]!.y + faces[left]!.height, faces[right]!.y + faces[right]!.height)
            - Math.max(faces[left]!.y, faces[right]!.y);
          expect(overlapWidth > 0 && overlapHeight > 0).toBe(false);
        }
      }
    }
  );

  it("joins circular bases to the correct edges of cylinder and cone nets", () => {
    const cylinder = renderedNet("cylinder");
    expect(cylinder).toContain('data-net-face="top-base" r="25"');
    expect(cylinder).toContain('cx="180" cy="47"');
    expect(cylinder).toContain('cx="180" cy="177"');
    expect(cylinder).toContain('height="80" width="157.079633" x="101.460184" y="72"');

    const cone = renderedNet("cone");
    expect(cone).toContain('d="M80 150 A100 100 0 0 1 180 50 L180 150 Z"');
    expect(cone).toContain('cx="55" cy="150" data-net-face="base" r="25"');
  });

  it("renders supported unit cubes and an explicit front direction", () => {
    const visual: JudgmentVisual = {
      kind: "solid-diagram",
      mode: "unit-stack",
      shape: "unit-cubes",
      cubes: [[0, 0, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]],
      frontDirection: "right"
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(markup.match(/class="mom-unit-cube"/g)).toHaveLength(4);
    expect(markup).toContain("mom-solid-front-arrow");
    expect(markup).toContain(">앞</text>");
    const [, viewBox] = markup.match(/viewBox="([^"]+)"/) ?? [];
    const [left, top, width, height] = viewBox!.split(" ").map(Number);
    const pointPairs = [...markup.matchAll(/points="([^"]+)"/g)].flatMap(
      (match) => match[1].split(" ").map((pair) => pair.split(",").map(Number))
    );
    for (const [x, y] of pointPairs) {
      expect(x).toBeGreaterThanOrEqual(left);
      expect(x).toBeLessThanOrEqual(left + width);
      expect(y).toBeGreaterThanOrEqual(top);
      expect(y).toBeLessThanOrEqual(top + height);
    }
  });

  it("describes a solid without exposing its textbook name", () => {
    const visual: JudgmentVisual = {
      kind: "solid-diagram",
      mode: "structure",
      shape: "triangular-prism"
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(markup).toContain("mom-solid-diagram");
    expect(describeVisual(visual)).toContain("서로 평행한 삼각형 면");
    expect(describeVisual(visual)).not.toContain("삼각기둥");
  });

  it("keeps every triangular-prism net edge at the same fold length", () => {
    const visual: JudgmentVisual = {
      kind: "solid-diagram",
      mode: "net",
      shape: "triangular-prism"
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));
    const polygons = [...markup.matchAll(/<polygon[^>]+points="([^"]+)"/g)]
      .map((match) => match[1].split(" ").map((pair) => pair.split(",").map(Number)));

    expect(polygons).toHaveLength(2);
    for (const triangle of polygons) {
      const sideLengths = triangle.map(([x1, y1], index) => {
        const [x2, y2] = triangle[(index + 1) % triangle.length];
        return Math.hypot(x2 - x1, y2 - y1);
      });
      for (const sideLength of sideLengths) {
        expect(sideLength).toBeCloseTo(42, 5);
      }
    }
    expect(markup.match(/<rect[^>]+height="42"[^>]+width="150"/g)).toHaveLength(3);
  });

  it("matches a cylinder net side length to the base circumference", () => {
    const visual: JudgmentVisual = {
      kind: "solid-diagram",
      mode: "net",
      shape: "cylinder"
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));
    const width = Number(markup.match(/data-net-face="side"[^>]+width="([^"]+)"/)?.[1]);
    const radius = Number(markup.match(/data-net-face="top-base"[^>]+r="([^"]+)"/)?.[1]);

    expect(width).toBeCloseTo(2 * Math.PI * radius, 5);
  });

  it("matches a cone sector arc length to the base circumference", () => {
    const visual: JudgmentVisual = {
      kind: "solid-diagram",
      mode: "net",
      shape: "cone"
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));
    const radius = Number(markup.match(/data-net-face="base"[^>]+r="([^"]+)"/)?.[1]);
    const sectorRadius = 100;
    const sectorAngle = Math.PI / 2;

    expect(markup).toContain('d="M80 150 A100 100 0 0 1 180 50 L180 150 Z"');
    expect(sectorRadius * sectorAngle).toBeCloseTo(2 * Math.PI * radius, 10);
  });

  it("renders raw equal parts in a chart without precomputing percentages", () => {
    const visual: JudgmentVisual = {
      kind: "part-chart-diagram",
      mode: "strip",
      totalParts: 10,
      segments: [
        { label: "독서", parts: 4 },
        { label: "운동", parts: 6 }
      ]
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(markup.match(/mom-part-chart-piece/g)).toHaveLength(10);
    expect(markup.match(/data-part-pattern="\d"/g)).toHaveLength(14);
    const patternIds = [...markup.matchAll(/id="([^"]*mom-part-chart-[^"]*-pattern-\d+)"/g)]
      .map((match) => match[1]);
    expect(patternIds).toHaveLength(2);
    for (const patternId of patternIds) {
      expect(markup).toContain(`fill="url(#${patternId})"`);
    }
    expect(markup).toContain("mom-part-chart-pattern-dot");
    expect(markup).toContain("mom-part-chart-pattern-mark");
    expect(markup).toContain("전체 10칸");
    expect(markup).not.toMatch(/%|퍼센트/);
  });

  it("keeps all six chart patterns distinct across multiple chart instances", () => {
    const visual: JudgmentVisual = {
      kind: "part-chart-diagram",
      mode: "circle",
      totalParts: 10,
      segments: ["가", "나", "다", "라", "마", "바"].map((label, index) => ({
        label,
        parts: index < 2 ? 1 : 2
      }))
    };
    const markup = renderToStaticMarkup(createElement(Fragment, null,
      createElement(VisualAid, { visual }),
      createElement(VisualAid, { visual })
    ));
    const patternIds = [...markup.matchAll(/id="([^"]*mom-part-chart-[^"]*-pattern-\d+)"/g)]
      .map((match) => match[1]);

    expect(patternIds).toHaveLength(12);
    expect(new Set(patternIds).size).toBe(12);
    for (const patternId of patternIds) {
      expect(markup).toContain(`fill="url(#${patternId})"`);
    }
    for (const patternClass of ["is-a", "is-b", "is-c", "is-d", "is-e", "is-f"]) {
      expect(markup).toContain(`mom-part-chart-pattern-background ${patternClass}`);
    }
    expect(markup.match(/mom-part-chart-pattern-dot/g)).toHaveLength(2);
    expect(markup.match(/mom-part-chart-pattern-mark/g)).toHaveLength(10);
    expect(markup).toContain("전체 10부분");
    expect(markup).toContain("원그래프. 전체 10부분 가운데");
    expect(markup).not.toContain("전체 10칸");
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
    expect(first.match(/mom-polygon-angle-arc/g)).toHaveLength(3);
    expect(first).toContain("mom-polygon-vertex-name");
    expect(first).toContain("mom-polygon-angle-value");
    expect(first).not.toContain("mom-polygon-angle-label");
    expect(first).not.toContain("<circle");
    expect(first).not.toContain('points="30,132 210,132 96,36"');
    expect(`${first} ${describeVisual(visual)}`).not.toMatch(/45도|45°|합은 180/);
  });

  it("marks every polygon as a not-to-scale sketch", () => {
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

    expect(markup).toContain("※ 그림은 실제 모양과 다를 수 있어요.");
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
    expect(markup).toContain("※ 그림은 실제 모양과 다를 수 있어요.");
    expect(markup.match(/mom-polygon-angle-arc/g)).toHaveLength(4);
    expect(description).toContain("대각선 하나로 두 삼각형으로 나뉘어");
    expect(description).not.toMatch(/360|합은|맞습니다|틀립니다/);
  });
});

describe("VisualAid line, segment, and ray figures", () => {
  it("draws each end as a point or an arrow without naming the figure kind", () => {
    const visual: JudgmentVisual = {
      kind: "line-segment-ray",
      figures: [
        { label: "가", type: "line" },
        { label: "나", type: "ray" },
        { label: "다", type: "segment" }
      ]
    };
    const first = renderToStaticMarkup(createElement(VisualAid, { visual }));
    const second = renderToStaticMarkup(createElement(VisualAid, { visual }));
    const description = describeVisual(visual) ?? "";

    expect(first).toBe(second);
    expect(first).toContain('class="mom-visual mom-line-segment-ray"');
    // 직선 2개 + 반직선 1개 = 화살촉 3개, 반직선 1개 + 선분 2개 = 끝점 3개
    expect(first.match(/class="mom-line-figure-arrow"/g)).toHaveLength(3);
    expect(first.match(/class="mom-line-figure-endpoint"/g)).toHaveLength(3);
    expect(description).toContain("가: 곧은 선의 왼쪽 끝은 화살표로 계속 이어지고");
    expect(description).toContain("다: 곧은 선의 왼쪽 끝은 점으로 막혀 있고");
    expect(description).not.toMatch(/선분|반직선|직선|정답/);
    expect(first).not.toMatch(/<animate|Math\.random|Date\(/i);
  });

  it("keeps a single figure readable and leaves its ends unlabelled", () => {
    const visual: JudgmentVisual = {
      kind: "line-segment-ray",
      figures: [{ label: "반직선", type: "ray" }]
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(markup.match(/class="mom-line-figure-stroke"/g)).toHaveLength(1);
    expect(markup.match(/class="mom-line-figure-arrow"/g)).toHaveLength(1);
    expect(markup.match(/class="mom-line-figure-endpoint"/g)).toHaveLength(1);
    // 끝점 개수를 묻는 문항이므로 개수를 글자로 알려주면 안 된다.
    expect(describeVisual(visual) ?? "").not.toMatch(/1개|한 개|2개|정답/);
  });
});

describe("VisualAid clock faces", () => {
  it("places both hands from the hour and minute without printing the time", () => {
    const visual: JudgmentVisual = { kind: "clock-face", hour: 4, minute: 25 };
    const first = renderToStaticMarkup(createElement(VisualAid, { visual }));
    const second = renderToStaticMarkup(createElement(VisualAid, { visual }));
    const description = describeVisual(visual) ?? "";

    expect(first).toBe(second);
    expect(first).toContain('class="mom-visual mom-clock-face"');
    expect(first.match(/class="mom-clock-tick/g)).toHaveLength(60);
    expect(first.match(/class="mom-clock-hour-number"/g)).toHaveLength(12);
    expect(first).toContain('class="mom-clock-hand is-hour"');
    expect(first).toContain('class="mom-clock-hand is-minute"');
    expect(description).toContain("짧은바늘은 4와 5 사이에 있고");
    expect(description).toContain("긴바늘은 5를 정확히 가리킵니다");
    expect(description).not.toMatch(/25분|4시|정답/);
  });

  it("moves the hour hand with the minutes so 4:25 and 4:05 are not the same picture", () => {
    const quarterPast = renderToStaticMarkup(
      createElement(VisualAid, { visual: { kind: "clock-face", hour: 4, minute: 25 } })
    );
    const justAfter = renderToStaticMarkup(
      createElement(VisualAid, { visual: { kind: "clock-face", hour: 4, minute: 5 } })
    );

    expect(quarterPast).not.toBe(justAfter);
  });

  it("picks the Korean particle that matches each clock mark", () => {
    expect(describeVisual({ kind: "clock-face", hour: 3, minute: 45 }) ?? "")
      .toContain("짧은바늘은 3과 4 사이에 있고");
    expect(describeVisual({ kind: "clock-face", hour: 3, minute: 45 }) ?? "")
      .toContain("긴바늘은 9를 정확히 가리킵니다");
    expect(describeVisual({ kind: "clock-face", hour: 12, minute: 0 }) ?? "")
      .toContain("짧은바늘은 12를 정확히 가리키고");
    expect(describeVisual({ kind: "clock-face", hour: 1, minute: 0 }) ?? "")
      .toContain("짧은바늘은 1을 정확히 가리키고");
    // 정각이면 긴바늘은 12 눈금 위에 있다
    expect(describeVisual({ kind: "clock-face", hour: 1, minute: 0 }) ?? "")
      .toContain("긴바늘은 12를 정확히 가리킵니다");
    // 5의 배수가 아닌 분은 두 눈금 사이로 말한다
    expect(describeVisual({ kind: "clock-face", hour: 8, minute: 3 }) ?? "")
      .toContain("긴바늘은 12와 1 사이에 있습니다");
  });
});

describe("VisualAid grid transformation diagrams", () => {
  it("renders exact source and target cells with a marker but no answer wording", () => {
    const visual: JudgmentVisual = {
      kind: "grid-transform-diagram",
      mode: "slide",
      rows: 6,
      columns: 8,
      sourceCells: [
        { row: 1, column: 1 },
        { row: 2, column: 1 },
        { row: 2, column: 2 }
      ],
      targetCells: [
        { row: 1, column: 4 },
        { row: 2, column: 4 },
        { row: 2, column: 5 }
      ],
      sourceMarker: { row: 1, column: 1 },
      targetMarker: { row: 1, column: 4 },
      direction: "right",
      amount: 3
    };
    const first = renderToStaticMarkup(createElement(VisualAid, { visual }));
    const second = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(first).toBe(second);
    expect(first.match(/mom-transform-source-cell/g)).toHaveLength(4);
    expect(first.match(/mom-transform-target-cell/g)).toHaveLength(4);
    expect(first).toContain("mom-transform-source-marker");
    expect(first).toContain("mom-transform-target-marker");
    expect(`${first} ${describeVisual(visual)}`).not.toMatch(
      /오른쪽으로 3칸|밀었습니다|정답/
    );
  });

  it("shows A and B as points rather than turning them into a figure", () => {
    const visual: JudgmentVisual = {
      kind: "grid-transform-diagram",
      mode: "point-move",
      rows: 6,
      columns: 8,
      points: [
        { label: "A", row: 4, column: 1 },
        { label: "B", row: 1, column: 5 }
      ]
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(markup.match(/class="mom-transform-point"/g)).toHaveLength(2);
    expect(markup).toContain(">A</text>");
    expect(markup).toContain(">B</text>");
    expect(markup).not.toContain("mom-transform-source-cell");
    expect(describeVisual(visual)).toContain("A점은");
    expect(describeVisual(visual)).not.toMatch(
      /오른쪽으로|왼쪽으로|위쪽으로|아래쪽으로/
    );
  });
});

describe("VisualAid relation pattern diagrams", () => {
  it("renders a number sequence without inferring the missing answer", () => {
    const visual: JudgmentVisual = {
      kind: "relation-pattern-diagram",
      mode: "number-sequence",
      terms: [2, 6, 18, null, 162]
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(markup).toContain("mom-relation-number-sequence");
    expect(markup.match(/mom-relation-arrow/g)).toHaveLength(4);
    expect(markup).toContain("is-unknown");
    expect(`${markup} ${describeVisual(visual)}`).not.toContain("54");
  });

  it("renders each figure count and keeps the next count out of visual and accessibility copy", () => {
    const visual: JudgmentVisual = {
      kind: "relation-pattern-diagram",
      mode: "figure-sequence",
      figure: "triangle",
      counts: [2, 5, 8, 11],
      askOrder: 5
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(markup.match(/mom-relation-figure-card/g)).toHaveLength(4);
    expect(markup.match(/mom-relation-figure-shape/g)).toHaveLength(26);
    expect(`${markup} ${describeVisual(visual)}`).not.toContain("14개");
  });

  it("renders the equal sign as a relation with one visible blank", () => {
    const visual: JudgmentVisual = {
      kind: "relation-pattern-diagram",
      mode: "equal-sign-balance",
      equation: {
        operator: "add",
        left: [53, 18],
        right: [null, 26]
      }
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(markup).toContain("mom-relation-equation");
    expect(markup.match(/is-unknown/g)).toHaveLength(1);
    expect(`${markup} ${describeVisual(visual)}`).not.toContain("45");
    expect(describeVisual(visual)).not.toMatch(/18는|26와|빈칸와/);
    expect(describeVisual(visual)).toContain(
      "오른쪽 식은 빈칸 더하기 26"
    );
  });

  it("uses particle-safe accessibility copy for relation tables and calculation arrays", () => {
    const table: JudgmentVisual = {
      kind: "relation-pattern-diagram",
      mode: "rule-table",
      leftLabel: "순서",
      rightLabel: "개수",
      rows: [
        { left: 1, right: 4 },
        { left: 2, right: 8 },
        { left: 3, right: 12 }
      ]
    };
    const calculations: JudgmentVisual = {
      kind: "relation-pattern-diagram",
      mode: "calculation-array",
      calculations: [
        { a: 11, operator: "multiply", b: 11, result: 121 },
        { a: 11, operator: "multiply", b: 12, result: 132 },
        { a: 11, operator: "multiply", b: 13, result: null }
      ]
    };

    expect(describeVisual(table)).toContain(
      "순서, 개수 대응표. 1의 짝은 4, 2의 짝은 8, 3의 짝은 12."
    );
    expect(describeVisual(table)).not.toMatch(/순서과|8가/);
    expect(describeVisual(calculations)).toContain(
      "11 곱하기 13, 결과 빈칸"
    );
    expect(describeVisual(calculations)).not.toMatch(/11는|12는|13는/);
  });
});

describe("VisualAid bar chart diagrams", () => {
  const axis = {
    orientation: "vertical" as const,
    tickCount: 6,
    labeledTicks: [
      { index: 0, value: 0 },
      { index: 6, value: 30 }
    ],
    unitLabel: "개"
  };

  it("renders a deterministic chart with one grid line per tick and no answer field", () => {
    const visual: JudgmentVisual = {
      kind: "bar-chart-diagram",
      mode: "bar-value",
      axis,
      bars: [
        { category: "사과", ticks: 4 },
        { category: "배", ticks: 2 }
      ],
      target: "사과"
    };
    const first = renderToStaticMarkup(createElement(VisualAid, { visual }));
    const second = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(first).toBe(second);
    expect(first.match(/mom-bar-grid-line/g)).toHaveLength(7);
    expect(first.match(/mom-bar-mark/g)).toHaveLength(2);
    expect(first).toMatch(
      /class="mom-bar-unit-label" text-anchor="start" x="4" y="14"/
    );
    expect(first).not.toMatch(
      /class="mom-bar-axis-label"[^>]*x="4" y="14"/
    );
    expect(first).toContain("사과");
    expect(first).toContain("배");
    expect(`${first} ${describeVisual(visual)}`).not.toContain("20개");
  });

  it("renders a data table and exactly three candidate graphs on one neutral visual", () => {
    const visual: JudgmentVisual = {
      kind: "bar-chart-diagram",
      mode: "table-match",
      axis,
      table: [
        { category: "사과", count: 20 },
        { category: "배", count: 10 }
      ],
      candidates: [
        {
          id: "가",
          bars: [
            { category: "사과", ticks: 4 },
            { category: "배", ticks: 2 }
          ]
        },
        {
          id: "나",
          bars: [
            { category: "사과", ticks: 5 },
            { category: "배", ticks: 2 }
          ]
        },
        {
          id: "다",
          bars: [
            { category: "사과", ticks: 4 },
            { category: "배", ticks: 3 }
          ]
        }
      ]
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(markup).toContain("mom-bar-data-table");
    expect(markup.match(/mom-bar-candidate"/g)).toHaveLength(3);
    expect(markup.match(/mom-bar-chart-svg/g)).toHaveLength(3);
    expect(markup).not.toMatch(/정답|알맞은 그래프/);
  });
});

describe("VisualAid shape accessibility descriptions", () => {
  it("names the two triangle sides carrying equal-length marks", () => {
    const visual: JudgmentVisual = {
      kind: "triangle-figure",
      mode: "side-angle",
      angles: [50, null, null],
      askIndex: 1,
      equalSideIndexes: [0, 2]
    };

    const description = describeVisual(visual) ?? "";

    expect(description).toContain("변 ㄴㄷ과 변 ㄱㄴ에 같은 눈금 표시");
    expect(description).not.toMatch(/이등변삼각형|정답/);
  });

  it("states raw side and vertex counts without naming the polygon", () => {
    const visual: JudgmentVisual = {
      kind: "polygon-figure",
      mode: "side-count-name",
      figure: {
        form: "lattice",
        vertices: [[0, 0], [4, 0], [5, 2], [4, 4], [2, 3], [0, 4]]
      }
    };

    const description = describeVisual(visual) ?? "";

    expect(description).toContain("곧은 변 6개와 꼭짓점 6개");
    expect(description).not.toMatch(/육각형|정답/);
  });

  it("describes every board cell, placed cell, and candidate piece group", () => {
    const visual: JudgmentVisual = {
      kind: "tile-composition",
      mode: "fill-remaining",
      board: [
        [0, 1, "up"], [0, 1, "down"], [1, 1, "up"], [1, 1, "down"]
      ],
      placed: [{
        piece: "rhombus",
        cells: [[0, 1, "up"], [0, 1, "down"]]
      }],
      candidates: [
        { id: "가", pieces: ["rhombus"] },
        { id: "나", pieces: ["triangle", "triangle"] },
        { id: "다", pieces: ["trapezoid"] }
      ]
    };

    const description = describeVisual(visual) ?? "";

    expect(description).toContain("전체 삼각형 격자의 각 칸 위치");
    expect(description).toContain("가로 0, 세로 1, 위 방향");
    expect(description).toContain("1번째 마름모 조각이 차지한 칸");
    expect(description).toContain("가 묶음: 마름모");
    expect(description).toContain("나 묶음: 정삼각형, 정삼각형");
    expect(description).toContain("다 묶음: 사다리꼴");
    expect(description).not.toMatch(/꼭 맞|정답/);
  });

  it("states tile-count source quantities without calculating the answer", () => {
    const visual: JudgmentVisual = {
      kind: "tile-composition",
      mode: "tile-count",
      region: [
        [0, 1, "up"], [0, 1, "down"], [1, 1, "up"], [1, 1, "down"]
      ],
      piece: "rhombus"
    };

    const description = describeVisual(visual) ?? "";

    expect(description).toContain("큰 모양은 작은 삼각형 4칸");
    expect(description).toContain("마름모 조각 한 개는 작은 삼각형 2칸");
    expect(description).not.toMatch(/마름모 (?:2개|두 개)|정답/);
  });
});

describe("VisualAid perimeter and area diagrams", () => {
  const activeDiagrams: Array<Extract<
    JudgmentVisual,
    { kind: "perimeter-area-diagram" }
  >> = [
    { kind: "perimeter-area-diagram", shape: "rectangle", width: 8, height: 5 },
    { kind: "perimeter-area-diagram", shape: "square", side: 6 },
    { kind: "perimeter-area-diagram", shape: "rectangle", width: 8, height: 4 },
    { kind: "perimeter-area-diagram", shape: "square", side: 7 },
    { kind: "perimeter-area-diagram", shape: "parallelogram", base: 9, height: 4 },
    { kind: "perimeter-area-diagram", shape: "parallelogram", base: 7, height: 5 },
    { kind: "perimeter-area-diagram", shape: "triangle", base: 10, height: 6 },
    { kind: "perimeter-area-diagram", shape: "triangle", base: 8, height: 7 },
    { kind: "perimeter-area-diagram", shape: "trapezoid", topBase: 6, bottomBase: 10, height: 5 },
    { kind: "perimeter-area-diagram", shape: "trapezoid", topBase: 8, bottomBase: 14, height: 4 },
    { kind: "perimeter-area-diagram", shape: "rhombus", diagonal1: 10, diagonal2: 6 },
    { kind: "perimeter-area-diagram", shape: "rhombus", diagonal1: 12, diagonal2: 8 }
  ];

  function elementWithClass(markup: string, className: string, index = 0): string {
    const matches = [...markup.matchAll(new RegExp(
      `<(?:rect|polygon|line|path)[^>]*class="${className}"[^>]*>`,
      "g"
    ))];
    const element = matches[index]?.[0];
    if (!element) throw new Error(`Missing ${className} element ${index}`);
    return element;
  }

  function numericAttribute(element: string, name: string): number {
    const value = element.match(new RegExp(`${name}="([^"]+)"`))?.[1];
    if (value === undefined) throw new Error(`Missing ${name} in ${element}`);
    return Number(value);
  }

  function polygonPoints(markup: string): Array<[number, number]> {
    const element = elementWithClass(markup, "mom-area-shape");
    const value = element.match(/points="([^"]+)"/)?.[1];
    if (!value) throw new Error("Missing polygon points");
    return value.split(" ").map((pair) => pair.split(",").map(Number) as [number, number]);
  }

  it("keeps all 12 active diagrams proportional and every height perpendicular", () => {
    for (const visual of activeDiagrams) {
      const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));
      if (visual.shape === "rectangle" || visual.shape === "square") {
        const rect = elementWithClass(markup, "mom-area-shape");
        const width = numericAttribute(rect, "width");
        const height = numericAttribute(rect, "height");
        const expectedRatio = visual.shape === "square"
          ? 1
          : visual.width / visual.height;
        expect(width / height, JSON.stringify(visual)).toBeCloseTo(expectedRatio, 5);
        continue;
      }

      const points = polygonPoints(markup);
      if (visual.shape === "rhombus") {
        const [top, right, bottom, left] = points;
        expect((right![0] - left![0]) / (bottom![1] - top![1]))
          .toBeCloseTo(visual.diagonal1 / visual.diagonal2, 5);
        const horizontal = elementWithClass(markup, "mom-area-diagonal", 0);
        const vertical = elementWithClass(markup, "mom-area-diagonal", 1);
        expect(numericAttribute(horizontal, "y1")).toBe(numericAttribute(horizontal, "y2"));
        expect(numericAttribute(vertical, "x1")).toBe(numericAttribute(vertical, "x2"));
        expect(elementWithClass(markup, "mom-area-right-angle")).toContain('d="M 150 94 h 11 v 11"');
        continue;
      }

      const heightLine = elementWithClass(markup, "mom-area-height");
      const guideX = numericAttribute(heightLine, "x1");
      const guideTop = numericAttribute(heightLine, "y1");
      const guideBottom = numericAttribute(heightLine, "y2");
      expect(numericAttribute(heightLine, "x2"), JSON.stringify(visual)).toBe(guideX);
      const rightAngle = elementWithClass(markup, "mom-area-right-angle");
      expect(rightAngle, JSON.stringify(visual)).toContain(
        `d="M ${guideX} ${guideBottom - 11} h 11 v 11"`
      );

      if (visual.shape === "parallelogram") {
        const [topLeft, topRight, bottomRight, bottomLeft] = points;
        expect(guideX).toBe(topLeft![0]);
        expect(guideTop).toBe(topLeft![1]);
        expect(guideBottom).toBe(bottomLeft![1]);
        expect((topRight![0] - topLeft![0]) / (bottomLeft![1] - topLeft![1]))
          .toBeCloseTo(visual.base / visual.height, 3);
      } else if (visual.shape === "triangle") {
        const [left, right, apex] = points;
        expect(guideX).toBe(apex![0]);
        expect(guideTop).toBe(apex![1]);
        expect(guideBottom).toBe(left![1]);
        expect((right![0] - left![0]) / (left![1] - apex![1]))
          .toBeCloseTo(visual.base / visual.height, 3);
      } else if (visual.shape === "trapezoid") {
        const [topLeft, topRight, bottomRight, bottomLeft] = points;
        const topWidth = topRight![0] - topLeft![0];
        const bottomWidth = bottomRight![0] - bottomLeft![0];
        const height = bottomLeft![1] - topLeft![1];
        expect(guideX).toBe(topLeft![0]);
        expect(guideTop).toBe(topLeft![1]);
        expect(guideBottom).toBe(bottomLeft![1]);
        expect(topWidth / bottomWidth).toBeCloseTo(visual.topBase / visual.bottomBase, 3);
        expect(bottomWidth / height).toBeCloseTo(visual.bottomBase / visual.height, 3);
      }
    }
  });

  it("draws a rectangle in the same proportion as its labeled sides", () => {
    const visual: JudgmentVisual = {
      kind: "perimeter-area-diagram",
      shape: "rectangle",
      width: 8,
      height: 4
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(markup).toContain('height="90"');
    expect(markup).toContain('width="180"');
  });

  it("shows a perpendicular height without exposing the area", () => {
    const visual: JudgmentVisual = {
      kind: "perimeter-area-diagram",
      shape: "triangle",
      base: 10,
      height: 6
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(markup).toContain("mom-perimeter-area is-triangle");
    expect(markup).toContain("mom-area-height");
    expect(markup).toContain("mom-area-right-angle");
    expect(markup).toContain('points="50,165 250,165 136,45"');
    expect(markup).toContain("10 cm");
    expect(markup).toContain("6 cm");
    expect(describeVisual(visual)).toBe(
      "밑변 10센티미터, 높이 6센티미터인 삼각형"
    );
    expect(`${markup} ${describeVisual(visual)}`).not.toContain("30 cm²");
  });

  it("shows both rhombus diagonals and their right angle", () => {
    const visual: JudgmentVisual = {
      kind: "perimeter-area-diagram",
      shape: "rhombus",
      diagonal1: 12,
      diagonal2: 8
    };
    const markup = renderToStaticMarkup(createElement(VisualAid, { visual }));

    expect(markup.match(/mom-area-diagonal/g)).toHaveLength(2);
    expect(markup).toContain("mom-area-right-angle");
    expect(markup).toContain('points="150,35 255,105 150,175 45,105"');
    expect(describeVisual(visual)).toContain("12센티미터와 8센티미터");
    expect(`${markup} ${describeVisual(visual)}`).not.toContain("48 cm²");
  });
});

describe("ConfidenceMark", () => {
  it("labels repeated evidence without diagnostic severity language", () => {
    const markup = renderToStaticMarkup(
      createElement(ConfidenceMark, { confidence: "confirmed" })
    );

    expect(markup).toContain("같은 생각이 반복됨");
    expect(markup).not.toMatch(/먼저 확인|계속 살펴보기|응답 더 필요|rules-/);
  });

  it("labels thin evidence as one observation without an engine identifier", () => {
    const markup = renderToStaticMarkup(
      createElement(ConfidenceMark, { confidence: "tentative" })
    );

    expect(markup).toContain("한 번 더 확인 필요");
    expect(markup).not.toMatch(/먼저 확인|계속 살펴보기|응답 더 필요|rules-/);
  });
});
