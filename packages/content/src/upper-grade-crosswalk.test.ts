import { describe, expect, it } from "vitest";
import { inspectCurriculumCrosswalk } from "./curriculum-crosswalk";
import { inspectDiagnosticIntegrity } from "./diagnostic-integrity";
import { grade5Semester2Diagnosis } from "./grade5-semester2";
import { grade6Semester1Diagnosis } from "./grade6-semester1";
import { grade6Semester2Diagnosis } from "./grade6-semester2";

const sets = [
  grade5Semester2Diagnosis,
  grade6Semester1Diagnosis,
  grade6Semester2Diagnosis
];

describe("5-2부터 6-2까지 교육과정 교차검증", () => {
  it("모든 성취기준과 진단 단계가 고정 DECK6 스냅숏에 교차 연결된다", () => {
    for (const content of sets) {
      const inspection = inspectCurriculumCrosswalk({
        content,
        setKey: content.manifest.id,
        targetVersion: content.manifest.version
      });
      expect(inspection.issues.filter((issue) => issue.severity === "error"),
        content.manifest.id).toEqual([]);
    }
  });

  it("발행 무결성 게이트에 오류가 없다", () => {
    for (const content of sets) {
      const result = inspectDiagnosticIntegrity({
        content,
        setKey: content.manifest.id,
        targetVersion: content.manifest.version
      }, { presentationSampleCount: 256 });
      expect(result.issues.filter((issue) => issue.severity === "error"),
        content.manifest.id).toEqual([]);
    }
  });
});
