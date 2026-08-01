import { describe, expect, it } from "vitest";
import {
  grade5Semester2Diagnosis as authoredGrade5Semester2,
  grade6Semester1Diagnosis as authoredGrade6Semester1,
  grade6Semester2Diagnosis as authoredGrade6Semester2
} from "./index";
import {
  grade5Semester2Diagnosis,
  grade6Semester1Diagnosis,
  grade6Semester2Diagnosis
} from "./upper-grade-runtime";
import { validateDiagnosisSet } from "./schema";

describe("5-2~6-2 런타임 전용 스냅숏", () => {
  it.each([
    [grade5Semester2Diagnosis, authoredGrade5Semester2],
    [grade6Semester1Diagnosis, authoredGrade6Semester1],
    [grade6Semester2Diagnosis, authoredGrade6Semester2]
  ])("제작 원본과 완전히 같고 런타임 스키마를 통과한다", (runtime, authored) => {
    expect(runtime).toEqual(authored);
    expect(validateDiagnosisSet(runtime)).toEqual({ valid: true, issues: [] });
  });
});
