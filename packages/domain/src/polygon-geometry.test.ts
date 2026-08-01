import { describe, expect, it } from "vitest";
import type { PolygonOutline } from "./types";
import {
  isClosedStraightPolygon,
  isConcavePolygonOutline,
  isRegularPolygonOutline,
  polygonConcaveVertexCount,
  polygonMarkClasses,
  polygonOutlineIssues,
  polygonOutlinePoints,
  polygonOutlineSideCount,
  polygonSideLengthRatio
} from "./polygon-geometry";

const concavePentagon: PolygonOutline = {
  form: "lattice",
  vertices: [[0, 0], [10, 0], [10, 6], [5, 3], [0, 6]]
};

describe("polygon geometry oracle", () => {
  it("오목한 도형도 닫힌 곧은선 다각형으로 판정한다", () => {
    expect(polygonOutlineIssues(concavePentagon)).toEqual([]);
    expect(isClosedStraightPolygon(concavePentagon)).toBe(true);
    expect(isConcavePolygonOutline(concavePentagon)).toBe(true);
    expect(polygonConcaveVertexCount(concavePentagon)).toBe(1);
    expect(polygonOutlineSideCount(concavePentagon)).toBe(5);
    expect(polygonSideLengthRatio(concavePentagon)).toBeGreaterThan(1.4);
  });

  it("오목하게 들어간 꼭짓점 수를 도형 좌표에서 계산한다", () => {
    const twoNotches: PolygonOutline = {
      form: "lattice",
      vertices: [[0, 0], [8, 0], [8, 8], [6, 4], [4, 8], [2, 4], [0, 8]]
    };
    expect(polygonOutlineIssues(twoNotches)).toEqual([]);
    expect(polygonConcaveVertexCount(twoNotches)).toBe(2);
  });

  it("열린 선·굽은 선·교차선은 다각형으로 판정하지 않는다", () => {
    const open: PolygonOutline = {
      form: "open",
      vertices: [[0, 0], [5, 0], [7, 4], [3, 7], [0, 4], [1, 1]]
    };
    const curved: PolygonOutline = {
      form: "curved",
      vertices: [[0, 0], [5, 0], [7, 4], [3, 7], [0, 4]],
      curvedSideIndex: 2
    };
    const crossing: PolygonOutline = {
      form: "crossing",
      vertices: [[0, 0], [8, 8], [0, 8], [8, 0]]
    };
    expect(polygonOutlineIssues(open)).toEqual([]);
    expect(polygonOutlineIssues(curved)).toEqual([]);
    expect(polygonOutlineIssues(crossing)).toEqual([]);
    expect([open, curved, crossing].map(isClosedStraightPolygon)).toEqual([
      false,
      false,
      false
    ]);
  });

  it("변만 같은 도형과 각만 같은 도형을 정다각형과 구별한다", () => {
    const rhombus: PolygonOutline = {
      form: "lattice",
      vertices: [[0, 3], [4, 6], [8, 3], [4, 0]]
    };
    const rectangle: PolygonOutline = {
      form: "equiangular",
      sideCount: 4,
      sideLengths: [9, 4, 9, 4]
    };
    const square: PolygonOutline = {
      form: "regular",
      sideCount: 4,
      rotationDegrees: 20
    };
    expect(polygonMarkClasses(rhombus)).toMatchObject({
      sideClasses: [0, 0, 0, 0]
    });
    expect(new Set(polygonMarkClasses(rhombus).angleClasses).size).toBe(2);
    expect(new Set(polygonMarkClasses(rectangle).sideClasses).size).toBe(2);
    expect(polygonMarkClasses(rectangle).angleClasses).toEqual([0, 0, 0, 0]);
    expect([rhombus, rectangle, square].map(isRegularPolygonOutline)).toEqual([
      false,
      false,
      true
    ]);
  });

  it("정육각형과 같은 변·같은 각 육각형을 결정적으로 렌더한다", () => {
    const regular: PolygonOutline = {
      form: "regular",
      sideCount: 6,
      rotationDegrees: 0
    };
    const equiangular: PolygonOutline = {
      form: "equiangular",
      sideCount: 6,
      sideLengths: [2, 3, 2, 3, 2, 3]
    };
    expect(polygonOutlineIssues(equiangular)).toEqual([]);
    expect(polygonOutlinePoints(regular)).toHaveLength(6);
    expect(polygonOutlinePoints(equiangular)).toHaveLength(6);
    expect(isRegularPolygonOutline(equiangular)).toBe(false);
  });

  it("자기교차·일직선 꼭짓점·닫히지 않는 같은각 배열을 거부한다", () => {
    expect(polygonOutlineIssues({
      form: "lattice",
      vertices: [[0, 0], [8, 8], [0, 8], [8, 0]]
    })).toContain("서로 이웃하지 않은 두 선분이 교차할 수 없습니다.");
    expect(polygonOutlineIssues({
      form: "lattice",
      vertices: [[0, 0], [4, 0], [8, 0], [8, 5], [0, 5]]
    })).toContain("연속한 세 꼭짓점은 한 직선 위에 놓일 수 없습니다.");
    expect(polygonOutlineIssues({
      form: "equiangular",
      sideCount: 6,
      sideLengths: [2, 3, 2, 3, 3, 2]
    })).toContain("같은 각을 유지한 채 닫히는 변 길이 배열이 아닙니다.");
  });
});
