import { describe, expect, it } from "vitest";
import {
  grade6PlacementReviewSummary,
  inspectGrade6PlacementApproval,
  inspectGrade6PlacementLedger
} from "./grade6-placement-approval";
import { grade6Semester1Diagnosis } from "./grade6-semester1";
import { grade6Semester2Diagnosis } from "./grade6-semester2";

describe("6학년 공식 단원 배치 승인", () => {
  it("두 학기 12단원의 승인 근거가 일관된다", () => {
    expect(inspectGrade6PlacementLedger()).toEqual([]);
    const summary = grade6PlacementReviewSummary();
    expect(summary).toMatchObject({
      revision: "grade6-placement-2026-08-01.1",
      status: "approved"
    });
    expect(summary.units).toHaveLength(12);
  });

  it("6-1과 6-2의 단원·성취기준 배치를 모두 통과시킨다", () => {
    expect(inspectGrade6PlacementApproval(grade6Semester1Diagnosis)).toEqual([]);
    expect(inspectGrade6PlacementApproval(grade6Semester2Diagnosis)).toEqual([]);
  });
});
