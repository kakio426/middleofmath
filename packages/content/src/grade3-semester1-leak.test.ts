import { describe, expect, it } from "vitest";
import { grade3Semester1Diagnosis } from "./grade3-semester1";
import {
  grade3Semester1DistractorRationales,
  grade3Semester1MisconceptionTitles
} from "./grade3-semester1-rationales";

describe("3학년 1학기 편집 근거의 학생 콘텐츠 비노출", () => {
  it("DiagnosisSet에 오개념 원장의 필드·제목·근거·도출 과정을 넣지 않는다", () => {
    const serialized = JSON.stringify(grade3Semester1Diagnosis);

    expect(serialized).not.toContain("misconceptionId");
    expect(serialized).not.toContain("sharedSignalRationale");
    expect(serialized).not.toContain("\"derivation\"");
    expect(serialized).not.toContain("\"rationale\"");
    for (const title of Object.values(grade3Semester1MisconceptionTitles)) {
      expect(serialized).not.toContain(title);
    }
    for (const entry of grade3Semester1DistractorRationales) {
      expect(serialized).not.toContain(entry.derivation);
      expect(serialized).not.toContain(entry.rationale);
      expect(serialized).not.toContain(entry.sharedSignalRationale);
    }
  });
});
