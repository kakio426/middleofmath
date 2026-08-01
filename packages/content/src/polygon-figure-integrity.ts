import type {
  PolygonFigure,
  PolygonOutline,
  TileCompositionFigure,
  TriangleCell
} from "@middle-of-math/domain";
import {
  canTileTriangleCells,
  isClosedStraightPolygon,
  isConcavePolygonOutline,
  isPatternBlockPlacement,
  isRegularPolygonOutline,
  patternBlockAreas,
  polygonMarkClasses,
  polygonOutlineIssues,
  polygonOutlineSideCount,
  polygonSideLengthRatio,
  triangleCellDifference,
  triangleCellKey,
  triangleCellSetIssues,
  triangleCellsAreConnected
} from "@middle-of-math/domain";

function candidateIdIssues(
  candidates: readonly { id: string }[]
): string[] {
  const ids = candidates.map((candidate) => candidate.id);
  return ids.length === 3
    && new Set(ids).size === 3
    && ["가", "나", "다"].every((id) => ids.includes(id))
    ? []
    : ["후보는 가·나·다를 한 번씩 사용해야 합니다."];
}

function markTotal(figure: PolygonOutline): number {
  const classes = polygonMarkClasses(figure);
  return [...classes.sideClasses, ...classes.angleClasses]
    .reduce((total, group) => total + group + 1, 0);
}

export function polygonFigureGeometryIssues(visual: PolygonFigure): string[] {
  const issues: string[] = [];
  if (visual.mode === "side-count-name") {
    issues.push(...polygonOutlineIssues(visual.figure));
    if (visual.figure.form !== "lattice") {
      issues.push("변의 수로 이름을 정하는 그림은 격자 다각형이어야 합니다.");
      return issues;
    }
    if (!isConcavePolygonOutline(visual.figure)) {
      issues.push("변의 수 문항은 오목한 꼭짓점을 포함해야 합니다.");
    }
    if (isRegularPolygonOutline(visual.figure)) {
      issues.push("변의 수 문항은 정다각형을 사용할 수 없습니다.");
    }
    if (polygonSideLengthRatio(visual.figure) < 1.4) {
      issues.push("가장 긴 변과 가장 짧은 변은 눈으로 구별될 만큼 달라야 합니다.");
    }
    return issues;
  }

  issues.push(...candidateIdIssues(visual.candidates));
  for (const candidate of visual.candidates) {
    issues.push(...polygonOutlineIssues(candidate.figure).map(
      (issue) => `${candidate.id} 도형: ${issue}`
    ));
    if (candidate.figure.form === "crossing") {
      issues.push(`${candidate.id} 도형: 자기교차 도형은 학생 후보로 사용할 수 없습니다.`);
    }
  }
  const sideCounts = visual.candidates.map((candidate) =>
    polygonOutlineSideCount(candidate.figure)
  );
  if (new Set(sideCounts).size !== 1) {
    issues.push("세 후보의 선분 또는 변의 수는 같아야 합니다.");
  }

  if (visual.mode === "polygon-select") {
    const polygonCount = visual.candidates.filter((candidate) =>
      isClosedStraightPolygon(candidate.figure)
    ).length;
    if (polygonCount !== 1) {
      issues.push("다각형 찾기 후보에는 닫힌 곧은선 다각형이 정확히 하나 있어야 합니다.");
    }
    const nonPolygonForms = visual.candidates
      .filter((candidate) => !isClosedStraightPolygon(candidate.figure))
      .map((candidate) => candidate.figure.form)
      .sort();
    if (nonPolygonForms.join(",") !== "curved,open") {
      issues.push("두 오답은 열린 선과 굽은 선을 하나씩 사용해야 합니다.");
    }
    return issues;
  }

  const regularCandidates = visual.candidates.filter((candidate) =>
    isRegularPolygonOutline(candidate.figure)
  );
  if (regularCandidates.length !== 1) {
    issues.push("정다각형 찾기 후보에는 실제 정다각형이 정확히 하나 있어야 합니다.");
  }
  const distractorKinds = visual.candidates
    .filter((candidate) => !isRegularPolygonOutline(candidate.figure))
    .map((candidate) => {
      const marks = polygonMarkClasses(candidate.figure);
      const sideClassCount = new Set(marks.sideClasses).size;
      const angleClassCount = new Set(marks.angleClasses).size;
      if (sideClassCount === 1 && angleClassCount > 1) return "sides-only";
      if (sideClassCount > 1 && angleClassCount === 1) return "angles-only";
      return "other";
    })
    .sort();
  if (distractorKinds.join(",") !== "angles-only,sides-only") {
    issues.push("두 오답은 변만 같은 도형과 각만 같은 도형이어야 합니다.");
  }
  if (regularCandidates.length === 1) {
    const correctMarks = markTotal(regularCandidates[0].figure);
    const maximumMarks = Math.max(
      ...visual.candidates.map((candidate) => markTotal(candidate.figure))
    );
    if (correctMarks >= maximumMarks) {
      issues.push("정답 후보의 표시 수가 가장 많아서는 안 됩니다.");
    }
  }
  return issues;
}

function cellSetInside(
  inner: readonly TriangleCell[],
  outer: readonly TriangleCell[]
): boolean {
  const outerKeys = new Set(outer.map(triangleCellKey));
  return inner.every((cell) => outerKeys.has(triangleCellKey(cell)));
}

export function tileCompositionGeometryIssues(
  visual: TileCompositionFigure
): string[] {
  const issues: string[] = [];
  const region = visual.mode === "fill-remaining" ? visual.board : visual.region;
  issues.push(...triangleCellSetIssues(region));
  if (region.length < 3 || region.length > 12) {
    issues.push("채울 영역은 3칸 이상 12칸 이하여야 합니다.");
  }
  if (!triangleCellsAreConnected(region)) {
    issues.push("채울 영역의 삼각형 칸은 서로 이어져야 합니다.");
  }

  if (visual.mode === "tile-count") {
    const area = patternBlockAreas[visual.piece];
    if (region.length % area !== 0) {
      issues.push("영역의 칸 수는 주어진 조각의 칸 수로 나누어떨어져야 합니다.");
    } else {
      const count = region.length / area;
      if (!canTileTriangleCells(region, Array(count).fill(visual.piece))) {
        issues.push("주어진 조각으로 영역을 빈틈없이 채울 수 없습니다.");
      }
    }
    return issues;
  }

  issues.push(...candidateIdIssues(visual.candidates));
  const placedCells = visual.placed.flatMap((placed) => placed.cells);
  if (visual.placed.length === 0) {
    issues.push("남은 자리 문항에는 이미 놓인 조각이 하나 이상 필요합니다.");
  }
  for (const placed of visual.placed) {
    issues.push(...triangleCellSetIssues(placed.cells).map(
      (issue) => `${placed.piece} 놓인 조각: ${issue}`
    ));
    if (!isPatternBlockPlacement(placed.cells, placed.piece)) {
      issues.push(`놓인 ${placed.piece} 칸은 실제 그 조각과 합동이어야 합니다.`);
    }
    if (!cellSetInside(placed.cells, visual.board)) {
      issues.push(`놓인 ${placed.piece} 조각은 board 안에 있어야 합니다.`);
    }
  }
  if (new Set(placedCells.map(triangleCellKey)).size !== placedCells.length) {
    issues.push("이미 놓인 조각끼리 겹칠 수 없습니다.");
  }
  const hole = triangleCellDifference(visual.board, placedCells);
  if (hole.length === 0 || !triangleCellsAreConnected(hole)) {
    issues.push("파생된 남은 자리는 비어 있지 않고 서로 이어져야 합니다.");
  }
  const candidateResults = visual.candidates.map((candidate) => ({
    id: candidate.id,
    area: candidate.pieces.reduce(
      (total, piece) => total + patternBlockAreas[piece],
      0
    ),
    fits: canTileTriangleCells(hole, candidate.pieces)
  }));
  if (visual.candidates.some((candidate) =>
    candidate.pieces.length < 1 || candidate.pieces.length > 3
  )) issues.push("후보 묶음은 1개 이상 3개 이하의 조각으로 구성해야 합니다.");
  if (candidateResults.filter(({ fits }) => fits).length !== 1) {
    issues.push("남은 자리를 빈틈없이 덮는 후보 묶음은 정확히 하나여야 합니다.");
  }
  if (!candidateResults.some(({ fits, area }) => !fits && area === hole.length)) {
    issues.push("오답 중 하나는 칸 수는 같지만 모양이 맞지 않아야 합니다.");
  }
  if (!candidateResults.some(({ fits, area }) => !fits && area < hole.length)) {
    issues.push("오답 중 하나는 남은 자리보다 작은 조각 묶음이어야 합니다.");
  }
  return issues;
}

const polygonNames: Readonly<Record<number, string>> = Object.freeze({
  3: "삼각형",
  4: "사각형",
  5: "오각형",
  6: "육각형",
  7: "칠각형",
  8: "팔각형"
});

export function polygonFigureExpectedAnswer(
  visual: PolygonFigure
): string | undefined {
  if (visual.mode === "side-count-name") {
    return polygonNames[polygonOutlineSideCount(visual.figure)];
  }
  const candidate = visual.candidates.find(({ figure }) =>
    visual.mode === "polygon-select"
      ? isClosedStraightPolygon(figure)
      : isRegularPolygonOutline(figure)
  );
  return candidate ? `${candidate.id} 도형` : undefined;
}

export function tileCompositionExpectedAnswer(
  visual: TileCompositionFigure
): string | undefined {
  if (visual.mode === "tile-count") {
    const area = patternBlockAreas[visual.piece];
    return visual.region.length % area === 0
      ? `${visual.region.length / area}개`
      : undefined;
  }
  const placedCells = visual.placed.flatMap((placed) => placed.cells);
  const hole = triangleCellDifference(visual.board, placedCells);
  const candidate = visual.candidates.find(({ pieces }) =>
    canTileTriangleCells(hole, pieces)
  );
  return candidate ? `${candidate.id} 묶음` : undefined;
}
