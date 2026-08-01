import { describe, expect, it } from "vitest";
import {
  grade3Semester1Diagnosis,
  grade3Semester2CompleteDiagnosis,
  grade4Semester1Diagnosis,
  grade4Semester2Diagnosis,
  grade5Semester1Diagnosis,
  grade5Semester2Diagnosis,
  grade6Semester1Diagnosis,
  grade6Semester2Diagnosis
} from "@middle-of-math/content/runtime";
import {
  createUnitAssignmentCards,
  groupAssignmentsByArea,
  judgmentsForAssignment
} from "./assignment-model";

describe("3학년 1학기 학생 활동 묶음", () => {
  it("네 단원을 수와 연산·측정 영역의 독립 활동으로 나눈다", () => {
    const assignments = createUnitAssignmentCards(grade3Semester1Diagnosis);
    const groups = groupAssignmentsByArea(assignments);

    expect(assignments).toHaveLength(4);
    expect(assignments.map((item) => item.judgmentCount)).toEqual([4, 4, 4, 4]);
    expect(groups.map((group) => [group.title, group.assignments.length])).toEqual([
      ["수와 연산", 3],
      ["측정", 1]
    ]);
    expect(assignments[3]).toMatchObject({
      id: "grade3-semester1-length",
      areaId: "measurement",
      areaTitle: "측정",
      symbol: "cm",
      judgmentCount: 4,
      estimatedMinutes: 3
    });
  });
});

describe("3학년 2학기 학생 활동 묶음", () => {
  it("전체 문제은행을 4개 영역 아래 6개 단원 활동으로 나눈다", () => {
    const assignments = createUnitAssignmentCards(grade3Semester2CompleteDiagnosis);
    const groups = groupAssignmentsByArea(assignments);

    expect(assignments.map((item) => item.title)).toEqual([
      "1단원 · 곱셈",
      "2단원 · 나눗셈",
      "3단원 · 원",
      "4단원 · 분수",
      "5단원 · 들이와 무게",
      "6단원 · 그림그래프"
    ]);
    expect(assignments.map((item) => item.judgmentCount)).toEqual([8, 10, 8, 14, 14, 10]);
    expect(assignments.map((item) => item.estimatedMinutes)).toEqual([4, 5, 4, 7, 7, 5]);
    expect(groups.map((group) => [group.title, group.assignments.length])).toEqual([
      ["수와 연산", 3],
      ["도형", 1],
      ["측정", 1],
      ["자료와 가능성", 1]
    ]);
  });

  it("각 활동은 자기 단원의 문제만 재생하고 전체 합계는 64문제다", () => {
    const assignments = createUnitAssignmentCards(grade3Semester2CompleteDiagnosis);
    const scoped = assignments.map((assignment) => judgmentsForAssignment(assignment));

    for (const [index, judgments] of scoped.entries()) {
      expect(judgments).toHaveLength(assignments[index].judgmentCount);
      expect(new Set(judgments.map((judgment) => judgment.unitId))).toEqual(
        new Set([assignments[index].unitId])
      );
      expect(judgments.length).toBeLessThanOrEqual(14);
      expect(assignments[index].estimatedMinutes).toBeLessThanOrEqual(7);
    }
    expect(scoped.flat()).toHaveLength(64);
    expect(new Set(assignments.map((assignment) => assignment.id)).size).toBe(6);
  });

  it("4학년 1학기 여섯 단원을 독립 활동으로 만들고 단원별 문제 수를 표시한다", () => {
    const assignments = createUnitAssignmentCards(
      grade4Semester1Diagnosis
    );

    expect(assignments).toHaveLength(6);
    expect(assignments[0]).toMatchObject({
      id: "grade4-semester1-large-numbers",
      title: "1단원 · 큰 수",
      areaId: "number-operations",
      areaTitle: "수와 연산",
      symbol: "만",
      judgmentCount: 12,
      estimatedMinutes: 6,
      unitId: "large-numbers"
    });
    expect(assignments[1]).toMatchObject({
      id: "grade4-semester1-angles",
      title: "2단원 · 각도",
      areaId: "geometry",
      areaTitle: "도형",
      symbol: "∠",
      judgmentCount: 12,
      estimatedMinutes: 6,
      unitId: "angles"
    });
    expect(assignments[2]).toMatchObject({
      id: "grade4-semester1-multiplication-division",
      title: "3단원 · 곱셈과 나눗셈",
      areaId: "number-operations",
      areaTitle: "수와 연산",
      symbol: "×",
      judgmentCount: 12,
      estimatedMinutes: 6,
      unitId: "multiplication-division"
    });
    expect(assignments[3]).toMatchObject({
      id: "grade4-semester1-figure-transform",
      title: "4단원 · 평면도형의 이동",
      areaId: "geometry",
      areaTitle: "도형",
      symbol: "↻",
      judgmentCount: 10,
      estimatedMinutes: 5,
      unitId: "figure-transform"
    });
    expect(assignments[4]).toMatchObject({
      id: "grade4-semester1-bar-graphs",
      title: "5단원 · 막대그래프",
      areaId: "data-probability",
      areaTitle: "자료와 가능성",
      symbol: "▥",
      judgmentCount: 10,
      estimatedMinutes: 5,
      unitId: "bar-graphs"
    });
    expect(assignments[5]).toMatchObject({
      id: "grade4-semester1-patterns-relations",
      title: "6단원 · 규칙과 관계",
      areaId: "change-relationships",
      areaTitle: "변화와 관계",
      symbol: "□",
      judgmentCount: 10,
      estimatedMinutes: 5,
      unitId: "patterns-relations"
    });
    expect(judgmentsForAssignment(assignments[0])).toHaveLength(12);
    expect(judgmentsForAssignment(assignments[1])).toHaveLength(12);
    expect(judgmentsForAssignment(assignments[2])).toHaveLength(12);
    expect(judgmentsForAssignment(assignments[3])).toHaveLength(10);
    expect(judgmentsForAssignment(assignments[4])).toHaveLength(10);
    expect(judgmentsForAssignment(assignments[5])).toHaveLength(10);
  });

  it("4학년 2학기 여섯 단원을 영역별 독립 진단 활동으로 만든다", () => {
    const assignments = createUnitAssignmentCards(grade4Semester2Diagnosis);

    expect(assignments).toHaveLength(6);
    expect(assignments[0]).toMatchObject({
      id: "grade4-semester2-triangles",
      title: "1단원 · 삼각형",
      areaId: "geometry",
      areaTitle: "도형",
      symbol: "△",
      judgmentCount: 10,
      estimatedMinutes: 5,
      unitId: "triangles"
    });
    expect(assignments[1]).toMatchObject({
      id: "grade4-semester2-fraction-add-subtract",
      title: "2단원 · 분수의 덧셈과 뺄셈",
      areaId: "number-operations",
      areaTitle: "수와 연산",
      symbol: "½",
      judgmentCount: 10,
      estimatedMinutes: 5,
      unitId: "fraction-add-subtract"
    });
    expect(assignments[2]).toMatchObject({
      id: "grade4-semester2-quadrilaterals",
      title: "3단원 · 사각형",
      areaId: "geometry",
      areaTitle: "도형",
      symbol: "▱",
      judgmentCount: 10,
      estimatedMinutes: 5,
      unitId: "quadrilaterals"
    });
    expect(assignments[3]).toMatchObject({
      id: "grade4-semester2-decimal-add-subtract",
      title: "4단원 · 소수의 덧셈과 뺄셈",
      areaId: "number-operations",
      areaTitle: "수와 연산",
      symbol: "0.1",
      judgmentCount: 10,
      estimatedMinutes: 5,
      unitId: "decimal-add-subtract"
    });
    expect(assignments[4]).toMatchObject({
      id: "grade4-semester2-polygons",
      title: "5단원 · 다각형",
      areaId: "geometry",
      areaTitle: "도형",
      symbol: "⬠",
      judgmentCount: 10,
      estimatedMinutes: 5,
      unitId: "polygons"
    });
    expect(assignments[5]).toMatchObject({
      id: "grade4-semester2-line-graphs",
      title: "6단원 · 꺾은선그래프",
      areaId: "data-probability",
      areaTitle: "자료와 가능성",
      symbol: "⌁",
      judgmentCount: 10,
      estimatedMinutes: 5,
      unitId: "line-graphs"
    });
    expect(judgmentsForAssignment(assignments[0])).toHaveLength(10);
    expect(judgmentsForAssignment(assignments[1])).toHaveLength(10);
    expect(judgmentsForAssignment(assignments[2])).toHaveLength(10);
    expect(judgmentsForAssignment(assignments[3])).toHaveLength(10);
    expect(judgmentsForAssignment(assignments[4])).toHaveLength(10);
    expect(judgmentsForAssignment(assignments[5])).toHaveLength(10);
  });

  it("5학년 1학기 여섯 단원을 영역별 독립 활동으로 만든다", () => {
    const assignments = createUnitAssignmentCards(grade5Semester1Diagnosis);
    expect(assignments).toEqual([
      expect.objectContaining({
        id: "grade5-semester1-mixed-operations",
        title: "1단원 · 자연수의 혼합 계산",
        areaId: "number-operations",
        areaTitle: "수와 연산",
        symbol: "＋×",
        judgmentCount: 10,
        estimatedMinutes: 5,
        unitId: "mixed-operations"
      }),
      expect.objectContaining({
        id: "grade5-semester1-factors-multiples",
        title: "2단원 · 약수와 배수",
        areaId: "number-operations",
        areaTitle: "수와 연산",
        symbol: "약·배",
        judgmentCount: 10,
        estimatedMinutes: 5,
        unitId: "factors-multiples"
      }),
      expect.objectContaining({
        id: "grade5-semester1-correspondence",
        title: "3단원 · 대응 관계",
        areaId: "change-relationships",
        areaTitle: "변화와 관계",
        symbol: "□△",
        judgmentCount: 10,
        estimatedMinutes: 5,
        unitId: "correspondence"
      }),
      expect.objectContaining({
        id: "grade5-semester1-fraction-reduction-common-denominator",
        title: "4단원 · 약분과 통분",
        areaId: "number-operations",
        areaTitle: "수와 연산",
        symbol: "약·통",
        judgmentCount: 14,
        estimatedMinutes: 7,
        unitId: "fraction-reduction-common-denominator"
      }),
      expect.objectContaining({
        id: "grade5-semester1-fraction-add-subtract",
        title: "5단원 · 분수의 덧셈과 뺄셈",
        areaId: "number-operations",
        areaTitle: "수와 연산",
        symbol: "½",
        judgmentCount: 12,
        estimatedMinutes: 6,
        unitId: "fraction-add-subtract"
      }),
      expect.objectContaining({
        id: "grade5-semester1-polygon-perimeter-area",
        title: "6단원 · 다각형의 둘레와 넓이",
        areaId: "geometry",
        areaTitle: "도형",
        symbol: "cm²",
        judgmentCount: 14,
        estimatedMinutes: 7,
        unitId: "polygon-perimeter-area"
      })
    ]);
    expect(judgmentsForAssignment(assignments[0])).toHaveLength(10);
    expect(judgmentsForAssignment(assignments[1])).toHaveLength(10);
    expect(judgmentsForAssignment(assignments[2])).toHaveLength(10);
    expect(judgmentsForAssignment(assignments[3])).toHaveLength(14);
    expect(judgmentsForAssignment(assignments[4])).toHaveLength(12);
    expect(judgmentsForAssignment(assignments[5])).toHaveLength(14);
  });

  it.each([
    [grade5Semester2Diagnosis, 66],
    [grade6Semester1Diagnosis, 62],
    [grade6Semester2Diagnosis, 56]
  ] as const)("$manifest.id 전체 은행을 여섯 개 독립 단원 활동으로 나눈다", (content, total) => {
    const assignments = createUnitAssignmentCards(content);
    const scoped = assignments.flatMap((assignment) => judgmentsForAssignment(assignment));

    expect(assignments).toHaveLength(6);
    expect(scoped).toHaveLength(total);
    expect(new Set(scoped.map((judgment) => judgment.id)).size).toBe(total);
    for (const assignment of assignments) {
      expect(assignment.id).toBe(`${content.manifest.id}-${assignment.unitId}`);
      expect(assignment.judgmentCount).toBeGreaterThanOrEqual(8);
      expect(assignment.estimatedMinutes).toBeLessThanOrEqual(7);
      expect(new Set(judgmentsForAssignment(assignment).map((judgment) => judgment.unitId)))
        .toEqual(new Set([assignment.unitId]));
    }
  });
});
