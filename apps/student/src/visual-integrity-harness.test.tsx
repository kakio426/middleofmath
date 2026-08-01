import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  grade3Semester1Diagnosis,
  grade3Semester2Diagnosis,
  grade3Semester2CompleteDiagnosis,
  grade4Semester1Diagnosis,
  grade4Semester2Diagnosis,
  grade5Semester1Diagnosis,
  grade5Semester2Diagnosis,
  grade6Semester1Diagnosis,
  grade6Semester2Diagnosis
} from "@middle-of-math/content/runtime";
import type {
  Judgment,
  JudgmentVisual,
  PolygonOutline
} from "@middle-of-math/domain";
import {
  patternBlockCells,
  patternBlockKoreanNames
} from "@middle-of-math/domain";
import {
  describeVisual,
  quadrilateralFigureLabelPoints,
  ReadableText,
  VisualAid
} from "@middle-of-math/ui";

const activeSets = [
  grade3Semester1Diagnosis,
  grade3Semester2CompleteDiagnosis,
  grade4Semester1Diagnosis,
  grade4Semester2Diagnosis,
  grade5Semester1Diagnosis
];

const allStudentSets = [
  grade3Semester1Diagnosis,
  grade3Semester2Diagnosis,
  grade3Semester2CompleteDiagnosis,
  grade4Semester1Diagnosis,
  grade4Semester2Diagnosis,
  grade5Semester1Diagnosis,
  grade5Semester2Diagnosis,
  grade6Semester1Diagnosis,
  grade6Semester2Diagnosis
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

function answerTokenPattern(label: string): RegExp {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, "u");
}

function renderVisual(visual: JudgmentVisual): string {
  return renderToStaticMarkup(createElement(VisualAid, { visual }));
}

describe("3~6학년 분수 표기 공용 계약", () => {
  const copies = allStudentSets.flatMap((content) =>
    content.judgments.flatMap((judgment) => [
      { id: `${judgment.id}/context`, text: judgment.context ?? "" },
      { id: `${judgment.id}/prompt`, text: judgment.prompt },
      ...judgment.choices.map((choice) => ({
        id: `${judgment.id}/${choice.id}`,
        text: choice.label
      }))
    ])
  ).filter(({ text }) => /\d+\s*\/\s*\d+/.test(text));

  it("모든 학기의 분수 원문을 슬래시 없이 교과서형 분수와 한국어 이름으로 바꾼다", () => {
    expect(copies.length).toBeGreaterThan(150);
    for (const { id, text } of copies) {
      const fractions = [...text.matchAll(/(\d+)\s*\/\s*(\d+)/g)];
      const markup = renderToStaticMarkup(createElement(ReadableText, { text }));
      expect(occurrences(markup, "mom-stacked-fraction\""), id)
        .toBe(fractions.length);
      expect(markup, id).not.toMatch(/\d+\s*\/\s*\d+/);
      for (const [, numerator, denominator] of fractions) {
        expect(markup, id).toContain(
          `aria-label="${denominator}분의 ${numerator}"`
        );
      }
      if (/\d+\s+\d+\s*\/\s*\d+/.test(text)) {
        expect(markup, id).toContain("mom-readable-keep");
      }
    }
  });
});

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
    expect(markup, judgment.id).toContain(
      `>${visual.radiusValue} ${visual.measurementUnit ?? "cm"}</text>`
    );
  }
  if (visual.diameterValue !== undefined) {
    expect(visual.mode, judgment.id).toBe("diameter");
    expect(markup, judgment.id).toContain(
      `>${visual.diameterValue} ${visual.measurementUnit ?? "cm"}</text>`
    );
    expect(markup, judgment.id).not.toContain("mom-circle-radius-highlight");
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
  const correctLabel = judgment.choices.find((choice) => choice.correct)?.label
    ?? "__missing__";
  expect(markup, judgment.id).toContain("mom-relation-pattern");
  expect(markup, judgment.id).not.toMatch(answerTokenPattern(correctLabel));
  expect(describeVisual(visual), judgment.id).not.toMatch(
    answerTokenPattern(correctLabel)
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

function expectTriangleFigureContract(judgment: Judgment, markup: string) {
  if (judgment.visual.kind !== "triangle-figure") return;
  const visual = judgment.visual;
  const forbiddenAnswerLabels =
    /이등변삼각형|정삼각형|직각삼각형|예각삼각형|둔각삼각형|세 변의 길이가 모두 다른 삼각형/;

  expect(markup, judgment.id).toContain("mom-triangle-figure");
  expect(markup, judgment.id).toContain("<polygon");
  expect(occurrences(markup, "mom-triangle-vertex-name"), judgment.id).toBe(3);
  expect(markup, judgment.id).not.toContain("mom-triangle-right-angle-square");
  expect(markup, judgment.id).not.toMatch(forbiddenAnswerLabels);
  expect(describeVisual(visual), judgment.id).not.toMatch(forbiddenAnswerLabels);

  if (visual.sides) {
    expect(occurrences(markup, "mom-triangle-side-value"), judgment.id).toBe(3);
  }
  if (visual.angles) {
    const visibleAngleCount = visual.angles.filter(
      (angle, index) => angle !== null || visual.askIndex === index
    ).length;
    expect(
      occurrences(markup, "mom-triangle-angle-value"),
      judgment.id
    ).toBe(visibleAngleCount);
    expect(occurrences(markup, ">㉠</text>"), judgment.id).toBe(
      visual.askIndex === undefined ? 0 : 1
    );
  }
  if (visual.mode === "side-classify") {
    expect(markup, judgment.id).not.toContain("mom-triangle-angle-value");
    expect(markup, judgment.id).not.toContain("mom-triangle-equal-mark");
  }
  if (visual.mode === "angle-classify") {
    expect(markup, judgment.id).not.toContain("mom-triangle-side-value");
    expect(markup, judgment.id).not.toContain("mom-triangle-equal-mark");
  }
  if (visual.equalSideIndexes) {
    expect(
      occurrences(markup, "mom-triangle-equal-mark"),
      judgment.id
    ).toBe(2);
    const sideNames = ["변 ㄴㄷ", "변 ㄷㄱ", "변 ㄱㄴ"];
    const [firstSide, secondSide] = visual.equalSideIndexes;
    expect(describeVisual(visual), judgment.id).toContain(
      `${sideNames[firstSide]}과 ${sideNames[secondSide]}에 같은 눈금 표시`
    );
  }
  if (visual.askIndex !== undefined) {
    expect(markup, judgment.id).toContain(">㉠</text>");
    expect(
      visual.angles?.filter((angle) => angle === null),
      judgment.id
    ).toHaveLength(2);
  }
}

function expectQuadrilateralFigureContract(
  judgment: Judgment,
  markup: string
) {
  if (judgment.visual.kind !== "quadrilateral-figure") return;
  const visual = judgment.visual;
  const forbiddenShapeNames =
    /사다리꼴|평행사변형|마름모|정사각형|직사각형/;
  const description = describeVisual(visual) ?? "";
  const labelPoints = quadrilateralFigureLabelPoints(visual);

  expect(markup, judgment.id).toContain("mom-quadrilateral-figure");
  expect(markup, judgment.id).toContain("mom-quad-shape");
  expect(occurrences(markup, "mom-quad-vertex-name"), judgment.id).toBe(4);
  expect(markup, judgment.id).not.toMatch(forbiddenShapeNames);
  expect(description, judgment.id).not.toMatch(forbiddenShapeNames);
  expect(
    [judgment.context, judgment.prompt].filter(Boolean).join(" "),
    judgment.id
  ).not.toMatch(/초록색|노란색|파란색|빨간색/);
  for (const [pointIndex, [x, y]] of labelPoints.entries()) {
    expect(x, `${judgment.id} label ${pointIndex} x`).toBeGreaterThanOrEqual(6);
    expect(x, `${judgment.id} label ${pointIndex} x`).toBeLessThanOrEqual(234);
    expect(y, `${judgment.id} label ${pointIndex} y`).toBeGreaterThanOrEqual(8);
    expect(y, `${judgment.id} label ${pointIndex} y`).toBeLessThanOrEqual(172);
    for (
      let otherIndex = pointIndex + 1;
      otherIndex < labelPoints.length;
      otherIndex += 1
    ) {
      const [otherX, otherY] = labelPoints[otherIndex];
      expect(
        Math.hypot(x - otherX, y - otherY),
        `${judgment.id} labels ${pointIndex}/${otherIndex}`
      ).toBeGreaterThanOrEqual(14);
    }
  }

  if ("parallelSidePairs" in visual) {
    expect(
      occurrences(markup, "mom-quad-parallel-arrow"),
      judgment.id
    ).toBe(visual.parallelSidePairs.length * 2);
  } else {
    expect(markup, judgment.id).not.toContain(
      "mom-quad-parallel-arrow"
    );
  }
  if ("rightAngleVertexIndexes" in visual) {
    expect(
      occurrences(markup, "mom-quad-right-angle"),
      judgment.id
    ).toBe(visual.rightAngleVertexIndexes.length);
  }
  if ("equalSideGroups" in visual) {
    expect(
      occurrences(markup, "mom-quad-equal-mark"),
      judgment.id
    ).toBe(visual.equalSideGroups.reduce(
      (count, group, groupIndex) =>
        count + group.length * (groupIndex + 1),
      0
    ));
  }
  if ("sideLengthLabels" in visual) {
    expect(
      occurrences(markup, "mom-quad-side-value"),
      judgment.id
    ).toBe(2);
    expect(
      occurrences(markup, "mom-quad-distance-value"),
      judgment.id
    ).toBe(1);
    expect(
      occurrences(markup, "mom-quad-distance-segment"),
      judgment.id
    ).toBe(1);
  }
  if ("angles" in visual) {
    expect(
      occurrences(markup, "mom-quad-angle-value"),
      judgment.id
    ).toBe(2);
    expect(occurrences(markup, ">㉠</text>"), judgment.id).toBe(1);
    expect(visual.angles.filter((value) => value !== null)).toHaveLength(1);
    const pointsAttribute = markup.match(
      /class="mom-quad-shape" points="([^"]+)"/
    )?.[1];
    expect(pointsAttribute, judgment.id).toBeTruthy();
    const points = pointsAttribute!.split(" ").map((pair) =>
      pair.split(",").map(Number) as [number, number]
    );
    const angleAt = (index: number) => {
      const vertex = points[index];
      const previous = points[(index + 3) % 4];
      const next = points[(index + 1) % 4];
      const before = [
        previous[0] - vertex[0],
        previous[1] - vertex[1]
      ] as const;
      const after = [
        next[0] - vertex[0],
        next[1] - vertex[1]
      ] as const;
      const cosine = (
        before[0] * after[0] + before[1] * after[1]
      ) / (
        Math.hypot(...before) * Math.hypot(...after)
      );
      return Math.acos(cosine) * 180 / Math.PI;
    };
    const givenIndex = visual.angles.findIndex(
      (value) => value !== null
    );
    const given = visual.angles[givenIndex]!;
    expect(angleAt(givenIndex), `${judgment.id} shown angle`)
      .toBeCloseTo(given, 1);
    expect(angleAt(visual.askAngleIndex), `${judgment.id} asked angle`)
      .toBeCloseTo(given, 1);
  }
}

function expectPolygonFigureContract(judgment: Judgment, markup: string) {
  if (judgment.visual.kind !== "polygon-figure") return;
  const visual = judgment.visual;
  expect(markup, judgment.id).toContain("mom-polygon-figure");
  expect(markup, judgment.id).toContain("mom-polygon-outline");
  expect(markup, judgment.id).not.toContain("<text");
  const description = describeVisual(visual) ?? "";
  expect(description, judgment.id).not.toContain("정답");
  if (visual.mode === "side-count-name") {
    expect(occurrences(markup, "mom-polygon-outline"), judgment.id).toBe(1);
    const sideCount = visual.figure.form === "regular"
      || visual.figure.form === "equiangular"
      ? visual.figure.sideCount
      : visual.figure.form === "open"
        ? visual.figure.vertices.length - 1
        : visual.figure.vertices.length;
    expect(description, judgment.id).toContain(`곧은 변 ${sideCount}개`);
    expect(description, judgment.id).toContain(`꼭짓점 ${sideCount}개`);
    expect(description, judgment.id).not.toMatch(/[삼사오육칠팔]각형/);
  } else {
    expect(occurrences(markup, "mom-polygon-candidate"), judgment.id).toBe(3);
    for (const label of ["가", "나", "다"]) {
      expect(markup, judgment.id).toContain(`>${label}</strong>`);
    }
    if (visual.mode === "polygon-select") {
      expect(markup, judgment.id).toContain("mom-polygon-open-end");
      expect(description, judgment.id).not.toContain("다각형");
      for (const candidate of visual.candidates) {
        expect(description, judgment.id).toContain(`${candidate.id}:`);
      }
    } else {
      expect(markup, judgment.id).toContain("mom-polygon-side-mark");
      expect(markup, judgment.id).toContain("mom-polygon-angle-mark");
      expect(description, judgment.id).not.toContain("정다각형");
    }
  }
}

function expectTileCompositionContract(judgment: Judgment, markup: string) {
  if (judgment.visual.kind !== "tile-composition") return;
  const visual = judgment.visual;
  expect(markup, judgment.id).toContain("mom-tile-composition");
  expect(markup, judgment.id).toContain("mom-tile-cell");
  const description = describeVisual(visual) ?? "";
  if (visual.mode === "fill-remaining") {
    expect(occurrences(markup, "class=\"mom-tile-candidate\""), judgment.id).toBe(3);
    expect(markup, judgment.id).toContain("is-placed");
    expect(markup, judgment.id).not.toMatch(/빈자리 \d+칸/);
    for (const [column, row, orientation] of visual.board) {
      expect(description, judgment.id).toContain(
        `가로 ${column}, 세로 ${row}, ${orientation === "up" ? "위" : "아래"} 방향`
      );
    }
    for (const candidate of visual.candidates) {
      expect(description, judgment.id).toContain(`${candidate.id} 묶음:`);
      for (const piece of candidate.pieces) {
        expect(description, judgment.id).toContain(
          patternBlockKoreanNames[piece]
        );
      }
    }
  } else {
    expect(markup, judgment.id).toContain("기준 조각 1개");
    expect(markup, judgment.id).toContain("mom-tile-key");
    expect(description, judgment.id).toContain(
      `큰 모양은 작은 삼각형 ${visual.region.length}칸`
    );
    expect(description, judgment.id).toContain(
      `${patternBlockKoreanNames[visual.piece]} 조각 한 개는 작은 삼각형 ${patternBlockCells(visual.piece).length}칸`
    );
  }
  expect(description, judgment.id).not.toContain("정답");
}

function expectLineChartContract(judgment: Judgment, markup: string) {
  if (judgment.visual.kind !== "line-chart-diagram") return;
  const visual = judgment.visual;
  const description = describeVisual(visual) ?? "";
  expect(markup, judgment.id).toContain("mom-line-chart-svg");
  expect(occurrences(markup, "mom-line-point"), judgment.id).toBe(
    visual.points.length
  );
  expect(occurrences(markup, "mom-line-series"), judgment.id).toBe(1);
  expect(occurrences(markup, "mom-line-axis-label"), judgment.id).toBe(2);
  expect(occurrences(markup, "mom-line-unit-label"), judgment.id).toBe(1);
  expect(occurrences(markup, "mom-line-time-label"), judgment.id).toBe(1);
  expect(occurrences(markup, "mom-line-target-ring"), judgment.id).toBe(
    visual.target?.kind === "point" ? 1 : 0
  );
  expect(markup, judgment.id).not.toContain("mom-line-value-label");
  for (const category of visual.timeAxis.categories) {
    expect(description, judgment.id).toContain(category);
  }
  for (const point of visual.points) {
    expect(description, judgment.id).toContain(`${point.tick}칸`);
  }
  const correct = judgment.choices.find((choice) => choice.correct)!.label;
  expect(description, judgment.id).not.toContain(correct);
  expect(description, judgment.id).not.toContain("약");
  if (visual.axis.baselineValue > 0) {
    expect(markup, judgment.id).toContain("mom-line-wave");
    expect(description, judgment.id).toContain("물결선");
  }
}

function expectPerimeterAreaContract(judgment: Judgment, markup: string) {
  if (judgment.visual.kind !== "perimeter-area-diagram") return;
  const description = describeVisual(judgment.visual) ?? "";
  expect(markup, judgment.id).toContain("mom-perimeter-area");
  expect(markup, judgment.id).toContain("mom-area-shape");
  expect(description, judgment.id).toMatch(/센티미터/);
  expect(description, judgment.id).not.toContain(
    judgment.choices.find((choice) => choice.correct)!.label
  );
  if (["parallelogram", "triangle", "trapezoid"].includes(
    judgment.visual.shape
  )) {
    expect(markup, judgment.id).toContain("mom-area-height");
    expect(markup, judgment.id).toContain("mom-area-right-angle");
  }
  if (judgment.visual.shape === "rhombus") {
    expect(markup.match(/mom-area-diagonal/g), judgment.id).toHaveLength(2);
  }
}

describe("active question-bank visual integrity harness", () => {
  it("renders the complete active bank instead of sampling a few visuals", () => {
    expect(activeSets.map((content) => content.judgments.length)).toEqual([
      16,
      64,
      66,
      60,
      70
    ]);
    expect(activeJudgments).toHaveLength(276);
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
      expectTriangleFigureContract(judgment, first);
      expectQuadrilateralFigureContract(judgment, first);
      expectPolygonFigureContract(judgment, first);
      expectTileCompositionContract(judgment, first);
      expectLineChartContract(judgment, first);
      expectPerimeterAreaContract(judgment, first);
    }
  });

  it("후보 역할의 순서를 바꾸어도 다각형 접근성 설명이 실제 도형을 따라간다", () => {
    const outlines: Record<"closed" | "curved" | "open", PolygonOutline> = {
      closed: {
        form: "lattice",
        vertices: [[1, 1], [8, 1], [10, 5], [6, 9], [1, 6]]
      },
      curved: {
        form: "curved",
        vertices: [[1, 1], [8, 1], [10, 5], [6, 9], [1, 6]],
        curvedSideIndex: 2
      },
      open: {
        form: "open",
        vertices: [[1, 1], [8, 1], [10, 5], [6, 9], [1, 6], [3, 3]]
      }
    };
    const first: JudgmentVisual = {
      kind: "polygon-figure",
      mode: "polygon-select",
      candidates: [
        { id: "가", figure: outlines.curved },
        { id: "나", figure: outlines.closed },
        { id: "다", figure: outlines.open }
      ]
    };
    const swapped: JudgmentVisual = {
      kind: "polygon-figure",
      mode: "polygon-select",
      candidates: [
        { id: "가", figure: outlines.open },
        { id: "나", figure: outlines.curved },
        { id: "다", figure: outlines.closed }
      ]
    };
    const firstDescription = describeVisual(first) ?? "";
    const swappedDescription = describeVisual(swapped) ?? "";

    expect(firstDescription).toMatch(/가:.*굽은 선/);
    expect(firstDescription).toMatch(/나:.*닫힌 모양/);
    expect(firstDescription).toMatch(/다:.*두 끝은 만나지 않음/);
    expect(swappedDescription).toMatch(/가:.*두 끝은 만나지 않음/);
    expect(swappedDescription).toMatch(/나:.*굽은 선/);
    expect(swappedDescription).toMatch(/다:.*닫힌 모양/);
    expect(`${firstDescription} ${swappedDescription}`).not.toContain("다각형");
  });

  it("변 수 문항의 오목 꼭짓점 접근성 설명을 실제 좌표에서 계산한다", () => {
    const visual: JudgmentVisual = {
      kind: "polygon-figure",
      mode: "side-count-name",
      figure: {
        form: "lattice",
        vertices: [[0, 0], [8, 0], [8, 8], [6, 4], [4, 8], [2, 4], [0, 8]]
      }
    };

    expect(describeVisual(visual)).toContain("꼭짓점이 두 곳");
    expect(describeVisual(visual)).not.toContain("한 곳");
  });
});

describe("5-2~6-2 focused semantic visual harness", () => {
  const upperGradeSets = [
    grade5Semester2Diagnosis,
    grade6Semester1Diagnosis,
    grade6Semester2Diagnosis
  ];
  const semanticKinds = new Set<JudgmentVisual["kind"]>([
    "solid-diagram",
    "part-chart-diagram",
    "grid-transform-diagram",
    "circle"
  ]);

  it("keeps the three semester banks at the approved size", () => {
    expect(upperGradeSets.map((content) => content.judgments.length)).toEqual([
      66,
      62,
      56
    ]);
  });

  it("renders every new semantic visual once without answer leakage", () => {
    const questions = upperGradeSets.flatMap((content) =>
      content.judgments.filter((judgment) => semanticKinds.has(judgment.visual.kind))
    );
    expect(questions.length).toBeGreaterThan(20);

    for (const judgment of questions) {
      const markup = renderVisual(judgment.visual);
      const correct = judgment.choices.find((choice) => choice.correct)!.label;
      expect(markup, judgment.id).toContain("mom-visual");
      expectCircleContract(judgment, markup);
      expectGridTransformContract(judgment, markup);
      if (judgment.visual.kind === "solid-diagram") {
        expect(markup, judgment.id).toContain("mom-solid-diagram");
        if (["structure", "net"].includes(judgment.visual.mode)) {
          expect(markup, judgment.id).not.toContain(correct);
        }
      }
      if (judgment.visual.kind === "part-chart-diagram") {
        expect(markup, judgment.id).toContain("mom-part-chart");
        expect(markup, judgment.id).not.toMatch(/%|퍼센트/);
        for (const [index] of judgment.visual.segments.entries()) {
          const patternId = markup.match(
            new RegExp(`id="([^"]*mom-part-chart-[^"]*-pattern-${index})"`)
          )?.[1];
          expect(patternId, judgment.id).toBeTruthy();
          expect(markup, judgment.id).toContain(`fill="url(#${patternId})"`);
          expect(markup, judgment.id).toContain(`data-part-pattern="${index}"`);
        }
      }
    }
  });
});
