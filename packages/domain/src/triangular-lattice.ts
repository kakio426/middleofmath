import type {
  PatternBlockName,
  TriangleCell,
  TriangleOrientation
} from "./types";

export type LatticeVertex = readonly [number, number];

const PATTERN_BLOCK_TEMPLATES: Record<PatternBlockName, TriangleCell[]> = {
  triangle: [[0, 0, "up"]],
  rhombus: [[0, 0, "up"], [0, 0, "down"]],
  trapezoid: [[0, 0, "up"], [0, 0, "down"], [1, 0, "up"]],
  hexagon: [
    [0, 0, "up"],
    [-1, 0, "up"],
    [0, -1, "up"],
    [-1, -1, "down"],
    [-1, 0, "down"],
    [0, -1, "down"]
  ]
};

export const patternBlockAreas: Readonly<Record<PatternBlockName, number>> =
  Object.freeze({ triangle: 1, rhombus: 2, trapezoid: 3, hexagon: 6 });

export const patternBlockKoreanNames: Readonly<Record<PatternBlockName, string>> =
  Object.freeze({
    triangle: "정삼각형",
    rhombus: "마름모",
    trapezoid: "사다리꼴",
    hexagon: "정육각형"
  });

export function triangleCellKey(cell: TriangleCell): string {
  return `${cell[0]}:${cell[1]}:${cell[2]}`;
}

export function triangleCellVertices(cell: TriangleCell): LatticeVertex[] {
  const [column, row, orientation] = cell;
  return orientation === "up"
    ? [[column, row], [column + 1, row], [column, row + 1]]
    : [[column + 1, row], [column, row + 1], [column + 1, row + 1]];
}

function vertexKey(vertex: LatticeVertex): string {
  return `${vertex[0]}:${vertex[1]}`;
}

function edgeKey(left: LatticeVertex, right: LatticeVertex): string {
  return [vertexKey(left), vertexKey(right)].sort().join("|");
}

export function triangleCellEdgeKeys(cell: TriangleCell): string[] {
  const vertices = triangleCellVertices(cell);
  return [
    edgeKey(vertices[0], vertices[1]),
    edgeKey(vertices[1], vertices[2]),
    edgeKey(vertices[2], vertices[0])
  ];
}

export function triangleCellsAreConnected(cells: readonly TriangleCell[]): boolean {
  if (cells.length === 0) return false;
  const edgeSets = cells.map((cell) => new Set(triangleCellEdgeKeys(cell)));
  const visited = new Set([0]);
  const queue = [0];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (let candidate = 0; candidate < cells.length; candidate += 1) {
      if (visited.has(candidate)) continue;
      if ([...edgeSets[current]].some((edge) => edgeSets[candidate].has(edge))) {
        visited.add(candidate);
        queue.push(candidate);
      }
    }
  }
  return visited.size === cells.length;
}

function rotateVertex([column, row]: LatticeVertex): LatticeVertex {
  return [-row, column + row];
}

function cellFromVertices(vertices: readonly LatticeVertex[]): TriangleCell {
  const columns = vertices.map(([column]) => column);
  const rows = vertices.map(([, row]) => row);
  const minimumColumn = Math.min(...columns);
  const minimumRow = Math.min(...rows);
  const keySet = new Set(vertices.map(vertexKey));
  const candidates: TriangleCell[] = [
    [minimumColumn, minimumRow, "up"],
    [minimumColumn, minimumRow, "down"]
  ];
  const found = candidates.find((cell) => {
    const expected = triangleCellVertices(cell);
    return expected.every((vertex) => keySet.has(vertexKey(vertex)));
  });
  if (!found) throw new Error("회전한 삼각형 칸을 격자에 다시 놓을 수 없습니다.");
  return found;
}

export function rotateTriangleCell(cell: TriangleCell): TriangleCell {
  return cellFromVertices(triangleCellVertices(cell).map(rotateVertex));
}

export function translateTriangleCell(
  cell: TriangleCell,
  columnDelta: number,
  rowDelta: number
): TriangleCell {
  return [cell[0] + columnDelta, cell[1] + rowDelta, cell[2]];
}

function normalizedCellSet(cells: readonly TriangleCell[]): string {
  const minimumColumn = Math.min(...cells.map(([column]) => column));
  const minimumRow = Math.min(...cells.map(([, row]) => row));
  return cells
    .map((cell) => translateTriangleCell(cell, -minimumColumn, -minimumRow))
    .map(triangleCellKey)
    .sort()
    .join(";");
}

function rotatedCellSets(cells: readonly TriangleCell[]): TriangleCell[][] {
  const rotations: TriangleCell[][] = [];
  let current = [...cells];
  for (let turn = 0; turn < 6; turn += 1) {
    rotations.push(current);
    current = current.map(rotateTriangleCell);
  }
  return rotations;
}

export function patternBlockCells(
  piece: PatternBlockName,
  columnDelta = 0,
  rowDelta = 0
): TriangleCell[] {
  return PATTERN_BLOCK_TEMPLATES[piece].map((cell) =>
    translateTriangleCell(cell, columnDelta, rowDelta)
  );
}

export function isPatternBlockPlacement(
  cells: readonly TriangleCell[],
  piece: PatternBlockName
): boolean {
  if (cells.length !== patternBlockAreas[piece]) return false;
  const wanted = normalizedCellSet(cells);
  return rotatedCellSets(PATTERN_BLOCK_TEMPLATES[piece])
    .some((rotation) => normalizedCellSet(rotation) === wanted);
}

export function triangleCellSetIssues(cells: readonly TriangleCell[]): string[] {
  const issues: string[] = [];
  if (cells.length === 0) issues.push("삼각형 칸 집합은 비어 있을 수 없습니다.");
  if (cells.some(([column, row, orientation]) =>
    !Number.isInteger(column) || !Number.isInteger(row)
    || column < 0 || column > 8 || row < 0 || row > 8
    || (orientation !== "up" && orientation !== "down")
  )) issues.push("삼각형 칸은 0부터 8 사이의 정수 위치와 위·아래 방향을 가져야 합니다.");
  if (new Set(cells.map(triangleCellKey)).size !== cells.length) {
    issues.push("같은 삼각형 칸을 두 번 사용할 수 없습니다.");
  }
  return issues;
}

function placementsInsideRegion(
  region: readonly TriangleCell[],
  piece: PatternBlockName
): TriangleCell[][] {
  const regionKeys = new Set(region.map(triangleCellKey));
  const placements = new Map<string, TriangleCell[]>();
  for (const rotation of rotatedCellSets(PATTERN_BLOCK_TEMPLATES[piece])) {
    for (const target of region) {
      for (const source of rotation) {
        if (source[2] !== target[2]) continue;
        const translated = rotation.map((cell) => translateTriangleCell(
          cell,
          target[0] - source[0],
          target[1] - source[1]
        ));
        if (translated.every((cell) => regionKeys.has(triangleCellKey(cell)))) {
          const key = translated.map(triangleCellKey).sort().join(";");
          placements.set(key, translated);
        }
      }
    }
  }
  return [...placements.values()];
}

export function canTileTriangleCells(
  region: readonly TriangleCell[],
  pieces: readonly PatternBlockName[]
): boolean {
  if (region.length > 12 || pieces.length > 12) return false;
  if (region.length !== pieces.reduce(
    (total, piece) => total + patternBlockAreas[piece],
    0
  )) return false;
  const regionKeys = new Set(region.map(triangleCellKey));
  if (regionKeys.size !== region.length) return false;
  const placementsByPiece = pieces.map((piece) => placementsInsideRegion(region, piece));
  const search = (pieceIndex: number, remaining: Set<string>): boolean => {
    if (pieceIndex === pieces.length) return remaining.size === 0;
    return placementsByPiece[pieceIndex].some((placement) => {
      const keys = placement.map(triangleCellKey);
      if (keys.some((key) => !remaining.has(key))) return false;
      const next = new Set(remaining);
      keys.forEach((key) => next.delete(key));
      return search(pieceIndex + 1, next);
    });
  };
  return search(0, regionKeys);
}

export function triangleCellDifference(
  whole: readonly TriangleCell[],
  removed: readonly TriangleCell[]
): TriangleCell[] {
  const removedKeys = new Set(removed.map(triangleCellKey));
  return whole.filter((cell) => !removedKeys.has(triangleCellKey(cell)));
}

export function triangleCellBoundaryEdges(
  cells: readonly TriangleCell[]
): Array<readonly [LatticeVertex, LatticeVertex]> {
  const edges = new Map<string, { count: number; edge: readonly [LatticeVertex, LatticeVertex] }>();
  for (const cell of cells) {
    const vertices = triangleCellVertices(cell);
    const cellEdges = [
      [vertices[0], vertices[1]],
      [vertices[1], vertices[2]],
      [vertices[2], vertices[0]]
    ] as const;
    for (const edge of cellEdges) {
      const key = edgeKey(edge[0], edge[1]);
      const found = edges.get(key);
      edges.set(key, { count: (found?.count ?? 0) + 1, edge });
    }
  }
  return [...edges.values()].filter(({ count }) => count === 1).map(({ edge }) => edge);
}

export function triangleOrientationCounts(cells: readonly TriangleCell[]): {
  up: number;
  down: number;
} {
  return cells.reduce(
    (counts, cell) => ({
      up: counts.up + (cell[2] === "up" ? 1 : 0),
      down: counts.down + (cell[2] === "down" ? 1 : 0)
    }),
    { up: 0, down: 0 }
  );
}

export function patternBlockRotationSignatures(piece: PatternBlockName): string[] {
  return [...new Set(rotatedCellSets(PATTERN_BLOCK_TEMPLATES[piece])
    .map(normalizedCellSet))];
}

export function patternBlockSupportsOrientation(
  piece: PatternBlockName,
  orientation: TriangleOrientation
): boolean {
  return rotatedCellSets(PATTERN_BLOCK_TEMPLATES[piece]).some((cells) =>
    cells.some((cell) => cell[2] === orientation)
  );
}
