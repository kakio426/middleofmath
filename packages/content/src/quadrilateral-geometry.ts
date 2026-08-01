import type {
  LatticePoint,
  QuadrilateralFigure,
  QuadrilateralIndex,
  QuadrilateralVertices
} from "@middle-of-math/domain";

export type Vector = readonly [number, number];

const NEXT: Record<QuadrilateralIndex, QuadrilateralIndex> = {
  0: 1,
  1: 2,
  2: 3,
  3: 0
};

const PREVIOUS: Record<QuadrilateralIndex, QuadrilateralIndex> = {
  0: 3,
  1: 0,
  2: 1,
  3: 2
};

export const QUADRILATERAL_INDEXES =
  [0, 1, 2, 3] as const satisfies readonly QuadrilateralIndex[];

export function vector(from: LatticePoint, to: LatticePoint): Vector {
  return [to[0] - from[0], to[1] - from[1]];
}

export function dot(left: Vector, right: Vector): number {
  return left[0] * right[0] + left[1] * right[1];
}

export function cross(left: Vector, right: Vector): number {
  return left[0] * right[1] - left[1] * right[0];
}

export function squaredLength(value: Vector): number {
  return dot(value, value);
}

export function sideVector(
  vertices: QuadrilateralVertices,
  sideIndex: QuadrilateralIndex
): Vector {
  return vector(vertices[sideIndex], vertices[NEXT[sideIndex]]);
}

export function sideSquaredLength(
  vertices: QuadrilateralVertices,
  sideIndex: QuadrilateralIndex
): number {
  return squaredLength(sideVector(vertices, sideIndex));
}

export function isPerfectSquare(value: number): boolean {
  return Number.isInteger(Math.sqrt(value));
}

export function actualParallelSidePairs(
  vertices: QuadrilateralVertices
): Array<[QuadrilateralIndex, QuadrilateralIndex]> {
  return ([
    [0, 2],
    [1, 3]
  ] as const).filter(([left, right]) =>
    cross(sideVector(vertices, left), sideVector(vertices, right)) === 0
  ).map(([left, right]) => [left, right]);
}

export function actualRightAngleVertexIndexes(
  vertices: QuadrilateralVertices
): QuadrilateralIndex[] {
  return QUADRILATERAL_INDEXES.filter((index) => {
    const before = vector(vertices[index], vertices[PREVIOUS[index]]);
    const after = vector(vertices[index], vertices[NEXT[index]]);
    return dot(before, after) === 0;
  });
}

export function actualEqualSideGroups(
  vertices: QuadrilateralVertices
): QuadrilateralIndex[][] {
  const byLength = new Map<number, QuadrilateralIndex[]>();
  for (const index of QUADRILATERAL_INDEXES) {
    const length = sideSquaredLength(vertices, index);
    byLength.set(length, [...(byLength.get(length) ?? []), index]);
  }
  return [...byLength.values()]
    .filter((indexes) => indexes.length > 1)
    .sort((left, right) => left[0] - right[0]);
}

export function isStrictlyConvexQuadrilateral(
  vertices: QuadrilateralVertices
): boolean {
  const points = new Set(vertices.map(([x, y]) => `${x},${y}`));
  if (points.size !== 4) return false;
  const turns = QUADRILATERAL_INDEXES.map((index) =>
    cross(
      sideVector(vertices, index),
      sideVector(vertices, NEXT[index])
    )
  );
  return turns.every((turn) => turn > 0)
    || turns.every((turn) => turn < 0);
}

function normalizedPairs(
  pairs: Array<[QuadrilateralIndex, QuadrilateralIndex]>
): string[] {
  return pairs.map(([left, right]) =>
    left < right ? `${left}-${right}` : `${right}-${left}`
  ).sort();
}

function normalizedGroups(groups: QuadrilateralIndex[][]): string[] {
  return groups
    .map((group) => [...new Set(group)].sort().join("-"))
    .sort();
}

export function sameParallelPairs(
  left: Array<[QuadrilateralIndex, QuadrilateralIndex]>,
  right: Array<[QuadrilateralIndex, QuadrilateralIndex]>
): boolean {
  return normalizedPairs(left).join("|") === normalizedPairs(right).join("|");
}

export function sameEqualSideGroups(
  left: QuadrilateralIndex[][],
  right: QuadrilateralIndex[][]
): boolean {
  return normalizedGroups(left).join("|") === normalizedGroups(right).join("|");
}

export function distanceSegmentIsValid(
  vertices: QuadrilateralVertices,
  segment: Extract<
    QuadrilateralFigure,
    { mode: "side-parallel-distance" }
  >["distanceSegment"]
): boolean {
  const point = vertices[segment.fromVertexIndex];
  const sideStart = vertices[segment.toSideIndex];
  const side = sideVector(vertices, segment.toSideIndex);
  const startToPoint = vector(sideStart, point);
  const sideLengthSquared = squaredLength(side);
  const projection = dot(startToPoint, side);
  const area = Math.abs(cross(side, startToPoint));
  const footIsInside = projection > 0 && projection < sideLengthSquared;
  const lengthMatches =
    area * area
    === segment.lengthCm * segment.lengthCm * sideLengthSquared;
  const oppositeSide = (
    segment.toSideIndex + 2
  ) % 4 as QuadrilateralIndex;
  const sourceOnOppositeSide = segment.fromVertexIndex === oppositeSide
    || segment.fromVertexIndex === NEXT[oppositeSide];
  return footIsInside && lengthMatches && sourceOnOppositeSide;
}

export function quadrilateralFigureGeometryIssues(
  visual: QuadrilateralFigure
): string[] {
  const issues: string[] = [];
  if (visual.mode === "opposite-angle") {
    const knownIndexes = visual.angles.flatMap((value, index) =>
      value === null ? [] : [index as QuadrilateralIndex]
    );
    const givenIndex = knownIndexes[0];
    const givenValue =
      givenIndex === undefined ? null : visual.angles[givenIndex];
    if (
      knownIndexes.length !== 1
      || givenIndex === undefined
      || givenValue === null
      || visual.askAngleIndex !== (givenIndex + 2) % 4
      || visual.angles[visual.askAngleIndex] !== null
      || givenValue === 90
      || givenValue < 20
      || givenValue > 160
    ) {
      issues.push("마주 보는 각 문항의 수치와 물음표 위치가 맞지 않습니다.");
    }
    if (
      !sameParallelPairs(visual.parallelSidePairs, [[0, 2], [1, 3]])
    ) {
      issues.push("마주 보는 각 문항에는 마주 보는 두 변의 두 평행 쌍이 필요합니다.");
    }
    return issues;
  }

  const vertices = visual.vertices;
  if (
    vertices.some(([x, y]) =>
      !Number.isInteger(x)
      || !Number.isInteger(y)
      || x < 0
      || x > 24
      || y < 0
      || y > 24
    )
  ) {
    issues.push("사각형 꼭짓점은 0부터 24 사이의 정수 격자점이어야 합니다.");
  }
  if (!isStrictlyConvexQuadrilateral(vertices)) {
    issues.push("사각형은 겹치거나 일직선인 꼭짓점이 없는 볼록한 도형이어야 합니다.");
  }

  const actualParallel = actualParallelSidePairs(vertices);
  const actualRightAngles = actualRightAngleVertexIndexes(vertices);

  if (
    "parallelSidePairs" in visual
    && !sameParallelPairs(visual.parallelSidePairs, actualParallel)
  ) {
    issues.push("평행 표시는 실제 마주 보는 평행한 변을 빠짐없이 나타내야 합니다.");
  }

  if (visual.mode === "side-perpendicular") {
    const rightAngleSet = new Set(visual.rightAngleVertexIndexes);
    if (
      rightAngleSet.size
      !== visual.rightAngleVertexIndexes.length
    ) {
      issues.push("직각 표시 위치는 중복될 수 없습니다.");
    }
    const shownRightAngles = [...new Set(
      visual.rightAngleVertexIndexes
    )].sort();
    if (
      shownRightAngles.join(",") !== [...actualRightAngles].sort().join(",")
    ) {
      issues.push("직각 표시는 실제 직각을 빠짐없이 나타내야 합니다.");
    }
    const base = visual.baseSideIndex;
    const marksAreOpposite = (
      visual.rightAngleVertexIndexes.length === 2
      && Math.abs(
        visual.rightAngleVertexIndexes[0]
        - visual.rightAngleVertexIndexes[1]
      ) === 2
    );
    const allCandidateSidesTouchAMark = QUADRILATERAL_INDEXES
      .filter((index) => index !== base)
      .every((index) =>
        rightAngleSet.has(index) || rightAngleSet.has(NEXT[index])
      );
    if (!marksAreOpposite || !allCandidateSidesTouchAMark) {
      issues.push("수직 문항은 서로 마주 보는 두 꼭짓점에 직각을 표시하고 모든 선택 대상 변이 표시 하나에 닿아야 합니다.");
    }
    const unmarkedAnglesAreDistinct = QUADRILATERAL_INDEXES
      .filter((index) => !rightAngleSet.has(index))
      .every((index) => {
        const before = vector(
          vertices[index],
          vertices[PREVIOUS[index]]
        );
        const after = vector(vertices[index], vertices[NEXT[index]]);
        const angleDot = dot(before, after);
        return (
          angleDot * angleDot * 100
          >= 7 * squaredLength(before) * squaredLength(after)
        );
      });
    if (!unmarkedAnglesAreDistinct) {
      issues.push("직각 표시가 없는 각은 화면에서 직각과 분명히 달라 보여야 합니다.");
    }
    const perpendicularSides = QUADRILATERAL_INDEXES.filter((index) =>
      index !== base
      && dot(sideVector(vertices, base), sideVector(vertices, index)) === 0
    );
    const parallelSides = QUADRILATERAL_INDEXES.filter((index) =>
      index !== base
      && cross(sideVector(vertices, base), sideVector(vertices, index)) === 0
    );
    const touchingNonPerpendicular = [
      PREVIOUS[base],
      NEXT[base]
    ].filter((index) =>
      dot(sideVector(vertices, base), sideVector(vertices, index)) !== 0
    );
    if (
      perpendicularSides.length !== 1
      || parallelSides.length !== 0
      || touchingNonPerpendicular.length !== 1
    ) {
      issues.push("기준 변에는 수직인 변이 하나, 만나지만 수직이 아닌 변이 하나 있어야 하며 평행한 변은 없어야 합니다.");
    }
  }

  if (visual.mode === "side-parallel-distance") {
    if (!distanceSegmentIsValid(vertices, visual.distanceSegment)) {
      issues.push("거리 선분은 두 평행한 변에 수직이고 실제 거리와 같아야 합니다.");
    }
    const labelIndexes = visual.sideLengthLabels.map(
      (label) => label.sideIndex
    );
    if (
      visual.sideLengthLabels.length !== 2
      || new Set(labelIndexes).size !== 2
    ) {
      issues.push("거리 문항에는 서로 다른 두 변의 길이 라벨이 필요합니다.");
    }
    for (const label of visual.sideLengthLabels) {
      const squared = sideSquaredLength(vertices, label.sideIndex);
      if (
        !Number.isInteger(label.lengthCm)
        || label.lengthCm <= 0
        || !isPerfectSquare(squared)
        || label.lengthCm * label.lengthCm !== squared
      ) {
        issues.push("변의 길이 라벨은 좌표에서 계산한 정수 길이와 같아야 합니다.");
      }
    }
  }

  if (visual.mode === "parallel-classify") {
    if (actualParallel.length !== 1) {
      issues.push("사다리꼴 분류 문항에는 평행한 변이 정확히 한 쌍이어야 합니다.");
    }
    if (actualRightAngles.length > 0) {
      issues.push("사다리꼴 분류 문항에는 직각이 없어야 합니다.");
    }
  }

  if (visual.mode === "equal-side-classify") {
    const actualGroups = actualEqualSideGroups(vertices);
    if (
      !sameEqualSideGroups(visual.equalSideGroups, actualGroups)
      || actualGroups.length !== 1
      || actualGroups[0].length !== 4
    ) {
      issues.push("마름모 분류 문항에는 실제로 같은 네 변의 표시가 필요합니다.");
    }
    if (actualRightAngles.length > 0) {
      issues.push("마름모 분류 문항에는 직각이 없어야 합니다.");
    }
  }

  return issues;
}

export function quadrilateralSideName(index: QuadrilateralIndex): string {
  return ["변 ㄱㄴ", "변 ㄴㄷ", "변 ㄷㄹ", "변 ㄹㄱ"][index];
}
