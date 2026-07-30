import { describe, expect, it } from "vitest";
import {
  createParentReport,
  type TeacherStudentReport
} from "@middle-of-math/domain";
import { grade3Semester2CompleteDiagnosis } from "./grade3-semester2-complete";
import {
  grade3Semester2DistractorRationales,
  grade3Semester2MisconceptionTitles
} from "./grade3-semester2-rationales";

describe("오답 근거의 학생 콘텐츠 비노출", () => {
  it("DiagnosisSet 직렬화 결과에 편집 원장의 필드와 문구가 들어가지 않는다", () => {
    const serialized = JSON.stringify(grade3Semester2CompleteDiagnosis);

    expect(serialized).not.toContain("misconceptionId");
    expect(serialized).not.toContain("sharedSignalRationale");
    expect(serialized).not.toContain("\"derivation\"");
    expect(serialized).not.toContain("\"rationale\"");
    for (const title of Object.values(grade3Semester2MisconceptionTitles)) {
      expect(serialized).not.toContain(title);
    }
    for (const entry of grade3Semester2DistractorRationales) {
      expect(serialized).not.toContain(entry.derivation);
      expect(serialized).not.toContain(entry.rationale);
      expect(serialized).not.toContain(entry.sharedSignalRationale);
    }
  });

  it("학부모 공유본에도 편집 원장의 오개념 상세를 전달하지 않는다", () => {
    const emptyTeacherReport: TeacherStudentReport = {
      sessionId: "session-leak-check",
      diagnosisSetId: grade3Semester2CompleteDiagnosis.manifest.id,
      diagnosisSetVersion:
        grade3Semester2CompleteDiagnosis.manifest.version,
      engineVersion: "rules-3.0.0",
      generatedAt: "2026-07-30T00:00:00.000Z",
      observedJudgmentCount: 0,
      stableJudgmentCount: 0,
      uncertaintyCount: 0,
      findings: [],
      evidence: [],
      opportunities: [],
      confirmedFindingCount: 0,
      tentativeFindingCount: 0,
      responseStyle: {
        confirmationCount: 0,
        provenanceCount: 0,
        provenanceCoverage: 0,
        dominantPosition: null,
        dominantPositionRate: null,
        positionStyleSuspected: false,
        fastConfirmationCount: 0
      }
    };
    const serialized = JSON.stringify(
      createParentReport(
        grade3Semester2CompleteDiagnosis,
        emptyTeacherReport,
        "별빛"
      )
    );

    expect(serialized).not.toContain("misconception");
    expect(serialized).not.toContain("rationale");
    expect(serialized).not.toContain("derivation");
    for (const title of Object.values(grade3Semester2MisconceptionTitles)) {
      expect(serialized).not.toContain(title);
    }
  });
});
