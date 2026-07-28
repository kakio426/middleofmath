import { describe, expect, it } from "vitest";
import { grade3Semester2Diagnosis } from "./grade3-semester2";
import { parseDiagnosisSet, SUPPORTED_INTERACTIONS, validateDiagnosisSet } from "./schema";

function cloneContent() {
  return structuredClone(grade3Semester2Diagnosis);
}

describe("content studio diagnosis validation", () => {
  it("accepts the existing 3학년 2학기 published baseline", () => {
    const result = validateDiagnosisSet(cloneContent());
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(SUPPORTED_INTERACTIONS).toEqual([
      "choice@1",
      "fraction-bar@1",
      "measurement@1",
      "pictograph@1"
    ]);
  });

  it.each([1, 2, 3, 4, 5, 6] as const)("supports elementary grade %s", (grade) => {
    const content = cloneContent();
    content.manifest.grade = grade;
    expect(validateDiagnosisSet(content).valid).toBe(true);
  });

  it("rejects grades outside 1-6 and unsupported interactions", () => {
    const invalidGrade = cloneContent() as any;
    invalidGrade.manifest.grade = 7;
    expect(validateDiagnosisSet(invalidGrade).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "SCHEMA_INVALID", path: "/manifest/grade" })
    ]));

    const unsupported = cloneContent();
    unsupported.judgments[0].interaction = { type: "number-line", version: 1 };
    const result = validateDiagnosisSet(unsupported);
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "UNSUPPORTED_INTERACTION", path: "/judgments/0/interaction" })
    ]));
  });

  it("rejects broken references, prerequisite cycles, and ambiguous answers", () => {
    const content = cloneContent();
    content.learnerStages[0].prerequisiteStageIds = [content.learnerStages[1].id];
    content.learnerStages[1].prerequisiteStageIds = [content.learnerStages[0].id];
    content.judgments[0].curriculumAnchorIds = ["missing-anchor"];
    content.judgments[0].choices[1].correct = true;
    content.judgments[0].choices[2].signalIds = undefined;

    const result = validateDiagnosisSet(content);
    expect(result.valid).toBe(false);
    expect(result.issues.map((item) => item.code)).toEqual(expect.arrayContaining([
      "PREREQUISITE_CYCLE",
      "UNKNOWN_ANCHOR",
      "SINGLE_CORRECT_REQUIRED",
      "WRONG_CHOICE_SIGNAL_REQUIRED"
    ]));
  });

  it("rejects missing or answer-revealing visual evidence", () => {
    const missingPictograph = cloneContent();
    const pictograph = missingPictograph.judgments.find(
      (judgment) => judgment.interaction.type === "pictograph"
    );
    if (!pictograph) throw new Error("그림그래프 문항이 필요합니다.");
    pictograph.visual = { kind: "none" };
    expect(validateDiagnosisSet(missingPictograph).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "PICTOGRAPH_VISUAL_REQUIRED" })
    ]));

    const revealedGroups = cloneContent();
    const division = revealedGroups.judgments.find(
      (judgment) => judgment.visual.kind === "division-groups"
    );
    if (!division) throw new Error("나눗셈 묶음 문항이 필요합니다.");
    division.prompt = "몇 묶음일까요?";
    expect(validateDiagnosisSet(revealedGroups).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "ANSWER_REVEALING_VISUAL" })
    ]));
  });

  it("keeps IDs from a previously published base immutable", () => {
    const content = cloneContent();
    content.judgments.shift();
    const result = validateDiagnosisSet(content, { baseContent: grade3Semester2Diagnosis });
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "STABLE_ID_REMOVED", path: "/judgments" })
    ]));
  });

  it("keeps teacher and guardian signal copy independently required", () => {
    const teacherMissing = cloneContent();
    teacherMissing.signals[0].teacherInterpretation = "";
    expect(validateDiagnosisSet(teacherMissing).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "SCHEMA_INVALID", path: "/signals/0/teacherInterpretation" })
    ]));

    const guardianMissing = cloneContent();
    guardianMissing.signals[0].parentSummary = "";
    expect(validateDiagnosisSet(guardianMissing).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "SCHEMA_INVALID", path: "/signals/0/parentSummary" })
    ]));
  });

  it("rejects unknown fields and does not normalize checksum-bearing strings", () => {
    const unknownTopLevel = cloneContent() as any;
    unknownTopLevel.debug = true;
    expect(validateDiagnosisSet(unknownTopLevel).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "SCHEMA_INVALID", path: "/" })
    ]));

    const unknownNested = cloneContent() as any;
    unknownNested.judgments[0].choices[0].debug = true;
    expect(validateDiagnosisSet(unknownNested).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "SCHEMA_INVALID", path: "/judgments/0/choices/0" })
    ]));

    const padded = cloneContent();
    padded.judgments[0].prompt = `  ${padded.judgments[0].prompt}  `;
    expect(parseDiagnosisSet(padded).judgments[0].prompt).toBe(padded.judgments[0].prompt);
  });
});
