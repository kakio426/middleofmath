import { describe, expect, it } from "vitest";
import type { PatternBlockName, TriangleCell } from "./types";
import {
  canTileTriangleCells,
  isPatternBlockPlacement,
  patternBlockAreas,
  patternBlockCells,
  patternBlockRotationSignatures,
  patternBlockSupportsOrientation,
  triangleCellBoundaryEdges,
  triangleCellDifference,
  triangleCellSetIssues,
  triangleCellsAreConnected,
  triangleOrientationCounts
} from "./triangular-lattice";

const holeDirect: TriangleCell[] = [
  [1, 1, "up"], [1, 1, "down"], [1, 2, "up"], [2, 1, "up"]
];
const holeTransfer: TriangleCell[] = [
  [1, 1, "up"], [1, 1, "down"], [1, 2, "up"],
  [1, 2, "down"], [1, 3, "up"], [2, 1, "up"]
];

describe("triangular lattice oracle", () => {
  it("모양 조각 넓이와 회전 합동을 정수 칸 집합으로 고정한다", () => {
    const pieces = Object.keys(patternBlockAreas) as PatternBlockName[];
    expect(pieces.map((piece) => patternBlockAreas[piece])).toEqual([1, 2, 3, 6]);
    for (const piece of pieces) {
      const cells = patternBlockCells(piece, 3, 3);
      expect(isPatternBlockPlacement(cells, piece), piece).toBe(true);
      expect(triangleCellsAreConnected(cells), piece).toBe(true);
      expect(patternBlockRotationSignatures(piece).length, piece).toBeGreaterThan(0);
      expect(patternBlockSupportsOrientation(piece, "up"), piece).toBe(true);
      expect(patternBlockSupportsOrientation(piece, "down"), piece).toBe(true);
    }
  });

  it("같은 네 칸이어도 모양에 따라 두 마름모를 거부한다", () => {
    expect(triangleOrientationCounts(holeDirect)).toEqual({ up: 3, down: 1 });
    expect(canTileTriangleCells(holeDirect, ["trapezoid", "triangle"])).toBe(true);
    expect(canTileTriangleCells(holeDirect, ["rhombus", "rhombus"])).toBe(false);
    expect(canTileTriangleCells(holeDirect, ["triangle", "triangle"])).toBe(false);
  });

  it("여섯 칸 전이 모양은 두 사다리꼴만 정확히 덮는다", () => {
    expect(canTileTriangleCells(holeTransfer, ["trapezoid", "trapezoid"])).toBe(true);
    expect(canTileTriangleCells(holeTransfer, ["rhombus", "rhombus", "rhombus"])).toBe(false);
    expect(canTileTriangleCells(holeTransfer, ["hexagon"])).toBe(false);
  });

  it("정육각형 한 개와 두 개 영역의 조각 수를 실제 타일링으로 확인한다", () => {
    const first = patternBlockCells("hexagon", 2, 2);
    const second = patternBlockCells("hexagon", 3, 3);
    const joined = [...first, ...second];
    expect(new Set(joined.map((cell) => cell.join(":"))).size).toBe(12);
    expect(triangleCellsAreConnected(joined)).toBe(true);
    expect(canTileTriangleCells(first, ["rhombus", "rhombus", "rhombus"])).toBe(true);
    expect(canTileTriangleCells(joined, [
      "trapezoid", "trapezoid", "trapezoid", "trapezoid"
    ])).toBe(true);
    expect(canTileTriangleCells(joined, ["hexagon", "hexagon"])).toBe(true);
    expect(canTileTriangleCells(joined, [
      "rhombus", "rhombus", "rhombus", "rhombus", "rhombus", "rhombus"
    ])).toBe(true);
  });

  it("board에서 이미 놓인 조각을 빼 남은 자리를 파생한다", () => {
    const placed = patternBlockCells("rhombus", 0, 1);
    const board = [...placed, ...holeDirect];
    expect(triangleCellDifference(board, placed)).toEqual(holeDirect);
    expect(triangleCellsAreConnected(board)).toBe(true);
    expect(triangleCellBoundaryEdges(board).length).toBeGreaterThan(0);
  });

  it("SQL 검증기와 같은 12칸·12조각 탐색 상한을 적용한다", () => {
    const thirteenCells = Array.from(
      { length: 13 },
      (_, index) => [index, 0, "up"] as TriangleCell
    );
    expect(canTileTriangleCells(
      thirteenCells,
      Array<PatternBlockName>(13).fill("triangle")
    )).toBe(false);
  });

  it("중복·범위 밖·끊어진 칸 집합을 검출한다", () => {
    expect(triangleCellSetIssues([[0, 0, "up"], [0, 0, "up"]])).toContain(
      "같은 삼각형 칸을 두 번 사용할 수 없습니다."
    );
    expect(triangleCellSetIssues([[9, 0, "up"]])).toContain(
      "삼각형 칸은 0부터 8 사이의 정수 위치와 위·아래 방향을 가져야 합니다."
    );
    expect(triangleCellsAreConnected([[0, 0, "up"], [8, 8, "down"]])).toBe(false);
  });
});
