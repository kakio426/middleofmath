import { describe, expect, it } from "vitest";
import { grade3Semester2CompleteDiagnosis } from "@middle-of-math/content";
import {
  createUnitAssignmentCards,
  groupAssignmentsByArea,
  judgmentsForAssignment
} from "./assignment-model";

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
});
