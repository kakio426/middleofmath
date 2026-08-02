import { describe, expect, it } from "vitest";
import { grade3Semester2CompleteDiagnosis } from "@middle-of-math/content/runtime";
import type { StudentAssignmentRecord } from "@middle-of-math/adapters";
import { judgmentsForAssignment } from "./assignment-model";
import { mapAssignmentRecord } from "./student-app";

function assignment(unitId?: string): StudentAssignmentRecord {
  return {
    id: "assignment-1",
    unitId,
    opensAt: "2026-08-02T00:00:00.000Z",
    status: "active",
    diagnosisSet: {
      id: "published-1",
      setKey: grade3Semester2CompleteDiagnosis.manifest.id,
      version: grade3Semester2CompleteDiagnosis.manifest.version,
      checksum: grade3Semester2CompleteDiagnosis.manifest.checksum,
      status: "published",
      content: grade3Semester2CompleteDiagnosis
    }
  };
}

describe("실제 학생 단원 배정 매핑", () => {
  it("배정된 단원의 제목과 문항만 학생에게 보여 준다", () => {
    const card = mapAssignmentRecord(assignment("fraction"));

    expect(card).toMatchObject({
      title: "4단원 · 분수",
      unitId: "fraction",
      judgmentCount: 14,
      estimatedMinutes: 7
    });
    expect(judgmentsForAssignment(card!)).toHaveLength(14);
    expect(new Set(
      judgmentsForAssignment(card!).map((judgment) => judgment.unitId)
    )).toEqual(new Set(["fraction"]));
  });

  it("발행 콘텐츠에 없는 단원 배정은 열지 않는다", () => {
    expect(mapAssignmentRecord(assignment("missing-unit"))).toBeNull();
  });
});
