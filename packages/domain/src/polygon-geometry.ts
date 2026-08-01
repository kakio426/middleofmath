import type {
  LatticePoint,
  PolygonOutline,
  PolygonSideCount
} from "./types";

export type PolygonPoint = readonly [number, number];

function samePoint(left: PolygonPoint, right: PolygonPoint): boolean {
  return left[0] === right[0] && left[1] === right[1];
}

function cross(a: PolygonPoint, b: PolygonPoint, c: PolygonPoint): number {
  return (b[0] - a[0]) * (c[1] - a[1])
    - (b[1] - a[1]) * (c[0] - a[0]);
}

function onSegment(a: PolygonPoint, b: PolygonPoint, point: PolygonPoint): boolean {
  return cross(a, b, point) === 0
    && point[0] >= Math.min(a[0], b[0])
    && point[0] <= Math.max(a[0], b[0])
    && point[1] >= Math.min(a[1], b[1])
    && point[1] <= Math.max(a[1], b[1]);
}

function segmentsIntersect(
  firstStart: PolygonPoint,
  firstEnd: PolygonPoint,
  secondStart: PolygonPoint,
  secondEnd: PolygonPoint
): boolean {
  const c1 = cross(firstStart, firstEnd, secondStart);
  const c2 = cross(firstStart, firstEnd, secondEnd);
  const c3 = cross(secondStart, secondEnd, firstStart);
  const c4 = cross(secondStart, secondEnd, firstEnd);
  if (((c1 > 0 && c2 < 0) || (c1 < 0 && c2 > 0))
    && ((c3 > 0 && c4 < 0) || (c3 < 0 && c4 > 0))) {
    return true;
  }
  return (c1 === 0 && onSegment(firstStart, firstEnd, secondStart))
    || (c2 === 0 && onSegment(firstStart, firstEnd, secondEnd))
    || (c3 === 0 && onSegment(secondStart, secondEnd, firstStart))
    || (c4 === 0 && onSegment(secondStart, secondEnd, firstEnd));
}

function hasNonAdjacentIntersection(
  vertices: readonly PolygonPoint[],
  closed: boolean
): boolean {
  const edgeCount = closed ? vertices.length : vertices.length - 1;
  for (let left = 0; left < edgeCount; left += 1) {
    const leftNext = (left + 1) % vertices.length;
    for (let right = left + 1; right < edgeCount; right += 1) {
      const rightNext = (right + 1) % vertices.length;
      const adjacent = left === right
        || leftNext === right
        || rightNext === left;
      if (adjacent) continue;
      if (segmentsIntersect(
        vertices[left],
        vertices[leftNext],
        vertices[right],
        vertices[rightNext]
      )) return true;
    }
  }
  return false;
}

function basicVertexIssues(
  vertices: readonly LatticePoint[],
  minimum: number,
  maximum: number,
  closed: boolean
): string[] {
  const issues: string[] = [];
  if (vertices.length < minimum || vertices.length > maximum) {
    issues.push(`꼭짓점 수는 ${minimum}개 이상 ${maximum}개 이하여야 합니다.`);
  }
  if (vertices.some(([x, y]) =>
    !Number.isInteger(x) || !Number.isInteger(y)
    || x < 0 || x > 24 || y < 0 || y > 24
  )) issues.push("꼭짓점은 0부터 24 사이의 정수 격자점이어야 합니다.");
  if (new Set(vertices.map(([x, y]) => `${x}:${y}`)).size !== vertices.length) {
    issues.push("같은 꼭짓점을 두 번 사용할 수 없습니다.");
  }
  const turnCount = closed ? vertices.length : Math.max(0, vertices.length - 2);
  for (let index = 0; index < turnCount; index += 1) {
    const previous = closed
      ? vertices[(index + vertices.length - 1) % vertices.length]
      : vertices[index];
    const current = closed ? vertices[index] : vertices[index + 1];
    const next = closed
      ? vertices[(index + 1) % vertices.length]
      : vertices[index + 2];
    if (samePoint(previous, current) || samePoint(current, next)) {
      issues.push("길이가 0인 선분을 사용할 수 없습니다.");
      break;
    }
    if (cross(previous, current, next) === 0) {
      issues.push("연속한 세 꼭짓점은 한 직선 위에 놓일 수 없습니다.");
      break;
    }
  }
  return issues;
}

function hexagonalDirectionsClosure(sideLengths: readonly number[]): boolean {
  const directions = [
    [2, 0], [1, 1], [-1, 1], [-2, 0], [-1, -1], [1, -1]
  ] as const;
  return directions.reduce<[number, number]>(
    ([x, y], [dx, dy], index) => [
      x + dx * sideLengths[index],
      y + dy * sideLengths[index]
    ],
    [0, 0]
  ).every((value) => value === 0);
}

export function polygonOutlineIssues(outline: PolygonOutline): string[] {
  if (outline.form === "regular") {
    const issues: string[] = [];
    if (!Number.isInteger(outline.sideCount)
      || outline.sideCount < 3 || outline.sideCount > 8) {
      issues.push("정다각형의 변은 3개 이상 8개 이하여야 합니다.");
    }
    if (!Number.isInteger(outline.rotationDegrees)
      || outline.rotationDegrees < 0 || outline.rotationDegrees >= 360
      || outline.rotationDegrees % 5 !== 0) {
      issues.push("회전 각도는 0 이상 360 미만인 5의 배수여야 합니다.");
    }
    return issues;
  }
  if (outline.form === "equiangular") {
    const issues: string[] = [];
    if (outline.sideLengths.length !== outline.sideCount) {
      issues.push("변 길이 수는 변의 수와 같아야 합니다.");
    }
    if (outline.sideLengths.some((length) =>
      !Number.isInteger(length) || length < 1 || length > 20
    )) issues.push("변 길이는 1부터 20 사이의 정수여야 합니다.");
    if (new Set(outline.sideLengths).size < 2) {
      issues.push("각만 같은 비정다각형은 서로 다른 변 길이를 포함해야 합니다.");
    }
    const closes = outline.sideCount === 4
      ? outline.sideLengths[0] === outline.sideLengths[2]
        && outline.sideLengths[1] === outline.sideLengths[3]
      : hexagonalDirectionsClosure(outline.sideLengths);
    if (!closes) issues.push("같은 각을 유지한 채 닫히는 변 길이 배열이 아닙니다.");
    return issues;
  }

  const closed = outline.form !== "open";
  const minimum = outline.form === "open" ? 4 : 3;
  const maximum = outline.form === "open" ? 9 : 8;
  const issues = basicVertexIssues(outline.vertices, minimum, maximum, closed);
  const intersects = hasNonAdjacentIntersection(outline.vertices, closed);
  if (outline.form === "crossing") {
    if (!intersects) issues.push("교차 도형에는 실제로 교차하는 두 변이 있어야 합니다.");
  } else if (intersects) {
    issues.push("서로 이웃하지 않은 두 선분이 교차할 수 없습니다.");
  }
  if (outline.form === "curved"
    && (!Number.isInteger(outline.curvedSideIndex)
      || outline.curvedSideIndex < 0
      || outline.curvedSideIndex >= outline.vertices.length)) {
    issues.push("굽은 변 번호가 변의 범위를 벗어났습니다.");
  }
  return issues;
}

export function polygonOutlineSideCount(outline: PolygonOutline): PolygonSideCount {
  if (outline.form === "regular" || outline.form === "equiangular") {
    return outline.sideCount;
  }
  const count = outline.form === "open"
    ? outline.vertices.length - 1
    : outline.vertices.length;
  return count as PolygonSideCount;
}

export function isClosedStraightPolygon(outline: PolygonOutline): boolean {
  return (outline.form === "regular"
    || outline.form === "equiangular"
    || outline.form === "lattice")
    && polygonOutlineIssues(outline).length === 0;
}

function distanceSquared(left: PolygonPoint, right: PolygonPoint): number {
  const x = right[0] - left[0];
  const y = right[1] - left[1];
  return x * x + y * y;
}

function groupedIndexes<T>(
  values: readonly T[],
  equal: (left: T, right: T) => boolean
): number[] {
  const representatives: T[] = [];
  return values.map((value) => {
    const existing = representatives.findIndex((candidate) => equal(value, candidate));
    if (existing >= 0) return existing;
    representatives.push(value);
    return representatives.length - 1;
  });
}

type AngleFingerprint = {
  dot: bigint;
  previousLengthSquared: bigint;
  nextLengthSquared: bigint;
};

function angleFingerprint(
  previous: PolygonPoint,
  vertex: PolygonPoint,
  next: PolygonPoint
): AngleFingerprint {
  const first = [previous[0] - vertex[0], previous[1] - vertex[1]] as const;
  const second = [next[0] - vertex[0], next[1] - vertex[1]] as const;
  return {
    dot: BigInt(first[0] * second[0] + first[1] * second[1]),
    previousLengthSquared: BigInt(first[0] ** 2 + first[1] ** 2),
    nextLengthSquared: BigInt(second[0] ** 2 + second[1] ** 2)
  };
}

function sameAngle(left: AngleFingerprint, right: AngleFingerprint): boolean {
  if ((left.dot < 0n) !== (right.dot < 0n)) return false;
  return left.dot * left.dot
      * right.previousLengthSquared * right.nextLengthSquared
    === right.dot * right.dot
      * left.previousLengthSquared * left.nextLengthSquared;
}

export function polygonOutlinePoints(outline: PolygonOutline): PolygonPoint[] {
  if ("vertices" in outline) {
    return outline.vertices.map(([x, y]) => [x, y] as const);
  }
  const directionCount = outline.sideCount;
  if (outline.form === "regular") {
    const radius = 10;
    return Array.from({ length: directionCount }, (_, index) => {
      const angle = (outline.rotationDegrees - 90 + index * 360 / directionCount)
        * Math.PI / 180;
      return [
        Math.round(Math.cos(angle) * radius * 100) / 100,
        Math.round(Math.sin(angle) * radius * 100) / 100
      ] as const;
    });
  }
  const points: PolygonPoint[] = [[0, 0]];
  for (let index = 0; index < outline.sideCount - 1; index += 1) {
    const previous = points[points.length - 1];
    const angle = index * 2 * Math.PI / outline.sideCount;
    points.push([
      previous[0] + Math.cos(angle) * outline.sideLengths[index],
      previous[1] + Math.sin(angle) * outline.sideLengths[index]
    ]);
  }
  return points;
}

export function polygonMarkClasses(outline: PolygonOutline): {
  sideClasses: number[];
  angleClasses: number[];
} {
  if (outline.form === "regular") {
    return {
      sideClasses: Array(outline.sideCount).fill(0),
      angleClasses: Array(outline.sideCount).fill(0)
    };
  }
  if (outline.form === "equiangular") {
    return {
      sideClasses: groupedIndexes(outline.sideLengths, (left, right) => left === right),
      angleClasses: Array(outline.sideCount).fill(0)
    };
  }
  if (outline.form !== "lattice") return { sideClasses: [], angleClasses: [] };
  const points = polygonOutlinePoints(outline);
  const sideLengths = points.map((point, index) =>
    distanceSquared(point, points[(index + 1) % points.length])
  );
  const angles = points.map((point, index) => angleFingerprint(
    points[(index + points.length - 1) % points.length],
    point,
    points[(index + 1) % points.length]
  ));
  return {
    sideClasses: groupedIndexes(sideLengths, (left, right) => left === right),
    angleClasses: groupedIndexes(angles, sameAngle)
  };
}

export function isRegularPolygonOutline(outline: PolygonOutline): boolean {
  if (!isClosedStraightPolygon(outline)) return false;
  const marks = polygonMarkClasses(outline);
  return new Set(marks.sideClasses).size === 1
    && new Set(marks.angleClasses).size === 1;
}

export function polygonConcaveVertexCount(outline: PolygonOutline): number {
  if (outline.form !== "lattice" || polygonOutlineIssues(outline).length > 0) {
    return 0;
  }
  const signedAreaTwice = outline.vertices.reduce((total, point, index) => {
    const next = outline.vertices[(index + 1) % outline.vertices.length];
    return total + point[0] * next[1] - next[0] * point[1];
  }, 0);
  const orientation = Math.sign(signedAreaTwice);
  return outline.vertices.filter((point, index) => Math.sign(cross(
    outline.vertices[(index + outline.vertices.length - 1) % outline.vertices.length],
    point,
    outline.vertices[(index + 1) % outline.vertices.length]
  )) !== orientation).length;
}

export function isConcavePolygonOutline(outline: PolygonOutline): boolean {
  return polygonConcaveVertexCount(outline) > 0;
}

export function polygonSideLengthRatio(outline: PolygonOutline): number {
  if (outline.form !== "lattice") return 1;
  const points = polygonOutlinePoints(outline);
  const lengths = points.map((point, index) => Math.sqrt(
    distanceSquared(point, points[(index + 1) % points.length])
  ));
  return Math.max(...lengths) / Math.min(...lengths);
}
