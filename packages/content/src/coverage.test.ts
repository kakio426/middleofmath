import { describe, expect, it } from "vitest";
import type { DiagnosisCoverageBlueprint } from "./coverage";
import { validateCoverageBlueprint } from "./coverage";
import { grade3Semester2CompleteDiagnosis } from "./grade3-semester2-complete";
import { grade3Semester2CoverageBlueprint } from "./grade3-semester2-coverage";

function cloneBlueprint(): DiagnosisCoverageBlueprint {
  return structuredClone(grade3Semester2CoverageBlueprint);
}

describe("diagnosis coverage validator", () => {
  it("rejects a stage without both direct and transfer evidence", () => {
    const blueprint = cloneBlueprint();
    blueprint.stages[0].evidence = blueprint.stages[0].evidence.slice(0, 1);

    const result = validateCoverageBlueprint(grade3Semester2CompleteDiagnosis, blueprint);
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "DIRECT_AND_TRANSFER_REQUIRED", path: "/stages/0/evidence" }),
      expect.objectContaining({ code: "JUDGMENT_COVERAGE_REQUIRED" })
    ]));
  });

  it("rejects missing stage, anchor, signal, and judgment coverage", () => {
    const blueprint = cloneBlueprint();
    blueprint.stages.pop();
    blueprint.fallbackSignalIds.pop();

    const result = validateCoverageBlueprint(grade3Semester2CompleteDiagnosis, blueprint);
    expect(result.valid).toBe(false);
    expect(result.issues.map((item) => item.code)).toEqual(expect.arrayContaining([
      "STAGE_COVERAGE_REQUIRED",
      "SIGNAL_COVERAGE_REQUIRED",
      "JUDGMENT_COVERAGE_REQUIRED"
    ]));
  });

  it("rejects stage, anchor, and signal reference mismatches", () => {
    const blueprint = cloneBlueprint();
    blueprint.stages[0].curriculumAnchorIds = ["[4수01-08]"];
    blueprint.stages[0].signalIds = ["multiplication.estimate"];

    const result = validateCoverageBlueprint(grade3Semester2CompleteDiagnosis, blueprint);
    expect(result.valid).toBe(false);
    expect(result.issues.map((item) => item.code)).toEqual(expect.arrayContaining([
      "STAGE_ANCHOR_COVERAGE_MISMATCH",
      "JUDGMENT_ANCHOR_COVERAGE_MISMATCH",
      "STAGE_SIGNAL_COVERAGE_MISMATCH"
    ]));
  });

  it("does not count repeated student copy as independent evidence", () => {
    const content = structuredClone(grade3Semester2CompleteDiagnosis);
    const direct = content.judgments.find((item) => item.id === "g3s2-mul-01");
    const transfer = content.judgments.find((item) => item.id === "g3s2-mul-03");
    expect(direct).toBeDefined();
    expect(transfer).toBeDefined();
    if (!direct || !transfer) return;
    transfer.context = direct.context;
    transfer.prompt = direct.prompt;

    const result = validateCoverageBlueprint(content, cloneBlueprint());
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "INDEPENDENT_EVIDENCE_REQUIRED" })
    ]));
  });

  it("does not count a numbers-only rewrite as transfer evidence", () => {
    const content = structuredClone(grade3Semester2CompleteDiagnosis);
    const direct = content.judgments.find((item) => item.id === "g3s2-mul-01");
    const transfer = content.judgments.find((item) => item.id === "g3s2-mul-03");
    expect(direct).toBeDefined();
    expect(transfer).toBeDefined();
    if (!direct || !transfer) return;
    transfer.context = direct.context;
    transfer.prompt = direct.prompt.replaceAll("24", "32").replaceAll("20", "30");

    const result = validateCoverageBlueprint(content, cloneBlueprint());
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "NUMERIC_COPY_NOT_TRANSFER" })
    ]));
  });

  it("rejects evidence connected to the wrong stage", () => {
    const blueprint = cloneBlueprint();
    blueprint.stages[0].evidence[1].judgmentId = "g3s2-mul-04";

    const result = validateCoverageBlueprint(grade3Semester2CompleteDiagnosis, blueprint);
    expect(result.valid).toBe(false);
    expect(result.issues.map((item) => item.code)).toEqual(expect.arrayContaining([
      "JUDGMENT_STAGE_COVERAGE_MISMATCH",
      "DUPLICATE_JUDGMENT_COVERAGE",
      "JUDGMENT_COVERAGE_REQUIRED"
    ]));
  });
});
