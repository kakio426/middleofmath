import { describe, expect, it } from "vitest";
import {
  presentedChoiceIds,
  type DiagnosisSet
} from "@middle-of-math/domain";
import { validateCoverageBlueprint } from "./coverage";
import {
  passingDiagnosticIntegrityBlueprint,
  passingDiagnosticIntegritySet
} from "./diagnostic-integrity.fixture";
import {
  DIAGNOSTIC_INTEGRITY_GATE_VERSION,
  inspectDiagnosticIntegrity
} from "./diagnostic-integrity";
import { diagnosisSetSchema } from "./schema";

function passingInput() {
  return {
    content: structuredClone(passingDiagnosticIntegritySet),
    setKey: passingDiagnosticIntegritySet.manifest.id,
    targetVersion: "1.0.0"
  };
}

function passingBlueprint() {
  return structuredClone(passingDiagnosticIntegrityBlueprint);
}

function inspect(
  content = passingInput().content,
  blueprint = passingBlueprint(),
  presentationSampleCount?: number
) {
  return inspectDiagnosticIntegrity(
    {
      content,
      setKey: content.manifest.id,
      targetVersion: "1.0.0"
    },
    { blueprint, presentationSampleCount }
  );
}

function expectIssue(
  result: ReturnType<typeof inspectDiagnosticIntegrity>,
  code: string,
  path: string,
  severity: "error" | "warning" = "error"
) {
  expect(result.issues).toEqual(expect.arrayContaining([
    expect.objectContaining({ code, path, severity })
  ]));
}

describe("diagnostic integrity publication gate", () => {
  it("has a structurally and diagnostically satisfiable fixture", () => {
    expect(() => diagnosisSetSchema.parse(passingDiagnosticIntegritySet)).not.toThrow();
    expect(
      validateCoverageBlueprint(
        passingDiagnosticIntegritySet,
        passingDiagnosticIntegrityBlueprint
      )
    ).toEqual({ valid: true, issues: [] });

    const result = inspect();
    expect(result).toEqual({
      valid: true,
      issues: [],
      gates: [{
        gate: "diagnostic-integrity",
        gateVersion: DIAGNOSTIC_INTEGRITY_GATE_VERSION,
        policy: "enforce",
        enforced: true,
        setKey: "diagnostic-integrity-fixture",
        targetVersion: "1.0.0",
        blueprintRevision: "fixture-1",
        valid: true,
        errorCount: 0,
        warningCount: 0
      }]
    });
  });

  it("is deterministic at both studio and full audit sample sizes", () => {
    expect(inspect(undefined, undefined, 128)).toEqual(
      inspect(undefined, undefined, 128)
    );
    expect(inspect(undefined, undefined, 2_000).issues).toEqual([]);
  });

  it("requires a registered blueprint once the registered floor applies", () => {
    const content = structuredClone(passingDiagnosticIntegritySet);
    content.manifest.id = "grade3-semester2";
    const result = inspectDiagnosticIntegrity(
      { content, setKey: "grade3-semester2", targetVersion: "2.1.0" },
      { blueprint: undefined }
    );
    expectIssue(result, "DI_BLUEPRINT_MISSING", "/");
  });

  it("requires a blueprint revision", () => {
    const blueprint = passingBlueprint();
    blueprint.blueprintRevision = " ";
    expectIssue(
      inspect(undefined, blueprint),
      "DI_BLUEPRINT_REVISION_MISSING",
      "/blueprint/blueprintRevision"
    );
  });

  it("requires a rationale for every distractor", () => {
    const blueprint = passingBlueprint();
    blueprint.distractors.shift();
    expectIssue(
      inspect(undefined, blueprint),
      "DI_DISTRACTOR_RATIONALE_REQUIRED",
      "/judgments/0/choices/1/signalIds"
    );
  });

  it("rejects orphaned and duplicate rationale entries", () => {
    const blueprint = passingBlueprint();
    blueprint.distractors.push(structuredClone(blueprint.distractors[0]));
    expectIssue(
      inspect(undefined, blueprint),
      "DI_DISTRACTOR_RATIONALE_ORPHAN",
      "/blueprint/distractors/4"
    );
  });

  it("keeps rationale signals equal to the authored choice signals", () => {
    const blueprint = passingBlueprint();
    blueprint.distractors[0].signalIds = ["counting.tens-only"];
    expectIssue(
      inspect(undefined, blueprint),
      "DI_DISTRACTOR_SIGNAL_MISMATCH",
      "/blueprint/distractors/0/signalIds"
    );
  });

  it("requires normalized misconception IDs and substantive audit copy", () => {
    const blueprint = passingBlueprint();
    blueprint.distractors[0].misconceptionId = "Bad ID";
    blueprint.distractors[1].rationale = "짧음";
    blueprint.distractors[2].derivation = "짧음";
    const result = inspect(undefined, blueprint);
    expectIssue(
      result,
      "DI_MISCONCEPTION_ID_REQUIRED",
      "/blueprint/distractors/0/misconceptionId"
    );
    expectIssue(
      result,
      "DI_RATIONALE_TOO_SHORT",
      "/blueprint/distractors/1/rationale"
    );
    expectIssue(
      result,
      "DI_DERIVATION_TOO_SHORT",
      "/blueprint/distractors/2/derivation"
    );
  });

  it("scopes every misconception ID to its learner stage", () => {
    const blueprint = passingBlueprint();
    blueprint.distractors[0].misconceptionId = "other.stage.ones-only";
    expectIssue(
      inspect(undefined, blueprint),
      "DI_MISCONCEPTION_ID_SCOPE",
      "/blueprint/distractors/0/misconceptionId"
    );
  });

  it("requires an educator-facing title for every misconception", () => {
    const blueprint = passingBlueprint();
    delete blueprint.misconceptionTitles[
      blueprint.distractors[0].misconceptionId
    ];
    expectIssue(
      inspect(undefined, blueprint),
      "DI_MISCONCEPTION_TITLE_MISSING",
      "/blueprint/distractors/0/misconceptionId"
    );
  });

  it("rejects copied rationale or derivation prose", () => {
    const blueprint = passingBlueprint();
    blueprint.distractors[1].rationale =
      blueprint.distractors[0].rationale;
    expectIssue(
      inspect(undefined, blueprint),
      "DI_RATIONALE_DUPLICATED",
      "/blueprint/distractors/1"
    );
  });

  it("requires a calculation or an explicit mistaken judgment rule", () => {
    const blueprint = passingBlueprint();
    blueprint.distractors[0].derivation =
      "십 묶음과 낱개를 제대로 구분하지 못했습니다.";
    expectIssue(
      inspect(undefined, blueprint),
      "DI_DERIVATION_NOT_MECHANISTIC",
      "/blueprint/distractors/0/derivation"
    );
  });

  it("does not accept rationale copied from the signal interpretation", () => {
    const content = structuredClone(passingDiagnosticIntegritySet);
    const blueprint = passingBlueprint();
    blueprint.distractors[0].rationale =
      content.signals[0].teacherInterpretation;
    expectIssue(
      inspect(content, blueprint),
      "DI_RATIONALE_COPIED_FROM_SIGNAL",
      "/blueprint/distractors/0/rationale"
    );
  });

  it("does not accept a rationale that merely repeats the choice", () => {
    const blueprint = passingBlueprint();
    blueprint.distractors[0].rationale = "선택지는 6 입니다";
    expectIssue(
      inspect(undefined, blueprint),
      "DI_RATIONALE_RESTATES_CHOICE",
      "/blueprint/distractors/0/rationale"
    );
  });

  it("keeps one shared-signal explanation per stage and prevents cross-stage reuse", () => {
    const blueprint = passingBlueprint();
    blueprint.distractors.forEach((entry) => {
      entry.sharedSignalRationale =
        "이 단계의 두 반응은 묶음과 낱개를 구분하는 판단으로 함께 관찰합니다.";
    });
    blueprint.distractors[1].sharedSignalRationale =
      "같은 단계이지만 서로 다른 공통 설명을 잘못 넣었습니다.";
    expectIssue(
      inspect(undefined, blueprint),
      "DI_SHARED_RATIONALE_INCONSISTENT",
      "/blueprint/distractors"
    );
  });

  it("requires an explanation when one signal represents different misconceptions", () => {
    const content = structuredClone(passingDiagnosticIntegritySet);
    const blueprint = passingBlueprint();
    content.judgments[0].choices[2].signalIds = ["counting.ones-only"];
    blueprint.distractors[1].signalIds = ["counting.ones-only"];
    expectIssue(
      inspect(content, blueprint),
      "DI_SIGNAL_CANNOT_SEPARATE_MISCONCEPTIONS",
      "/judgments/0/choices"
    );

    blueprint.distractors[1].sharedSignalRationale =
      "두 오답 모두 자릿값 구성 전의 묶음 세기 반응으로 먼저 관찰합니다.";
    expect(
      inspect(content, blueprint).issues.some(
        (item) => item.code === "DI_SIGNAL_CANNOT_SEPARATE_MISCONCEPTIONS"
      )
    ).toBe(false);
  });

  it("rejects duplicate distractors made by the same reasoning", () => {
    const blueprint = passingBlueprint();
    blueprint.distractors[1].misconceptionId =
      blueprint.distractors[0].misconceptionId;
    blueprint.distractors[1].derivation =
      blueprint.distractors[0].derivation;
    expectIssue(
      inspect(undefined, blueprint),
      "DI_UNJUSTIFIED_DUPLICATE_DISTRACTOR",
      "/judgments/0/choices"
    );
  });

  it("requires two distinguishable misconceptions per learner stage", () => {
    const blueprint = passingBlueprint();
    blueprint.distractors.forEach((entry) => {
      entry.misconceptionId = "counting.single-pattern";
    });
    expectIssue(
      inspect(undefined, blueprint),
      "DI_STAGE_MISCONCEPTION_DISCRIMINATION_REQUIRED",
      "/learnerStages/0"
    );
  });

  it("requires every misconception to repeat across distinct evidence judgments", () => {
    const blueprint = passingBlueprint();
    blueprint.distractors[3].misconceptionId =
      blueprint.distractors[2].misconceptionId;
    expectIssue(
      inspect(undefined, blueprint),
      "DI_MISCONCEPTION_EVIDENCE_REPETITION_REQUIRED",
      "/learnerStages/0"
    );
  });

  it("keeps engine fallback signals off authored distractors", () => {
    const content = structuredClone(passingDiagnosticIntegritySet);
    const blueprint = passingBlueprint();
    content.judgments[0].choices[1].signalIds = ["needs-review"];
    blueprint.distractors[0].signalIds = ["needs-review"];
    expectIssue(
      inspect(content, blueprint),
      "DI_FALLBACK_SIGNAL_REFERENCED",
      "/judgments/0/choices/1/signalIds"
    );
  });

  it("rejects duplicate choice labels after whitespace normalization", () => {
    const content = structuredClone(passingDiagnosticIntegritySet);
    content.judgments[0].choices[2].label = "  6  ";
    expectIssue(
      inspect(content),
      "DI_DUPLICATE_CHOICE_LABEL",
      "/judgments/0/choices"
    );
  });

  it("emits the presentation position imbalance tripwire", () => {
    expectIssue(
      inspect(undefined, undefined, 1),
      "DI_PRESENTATION_POSITION_IMBALANCE",
      "/judgments"
    );
  });

  it("emits the degenerate-session tripwire", () => {
    const content = structuredClone(passingDiagnosticIntegritySet);
    content.judgments = Array.from({ length: 5 }, (_, index) => {
      const judgment = structuredClone(content.judgments[index % 2]);
      judgment.id = `degenerate-${index}`;
      judgment.choices = judgment.choices.map((choice, choiceIndex) => ({
        ...choice,
        id: `${judgment.id}-choice-${choiceIndex}`,
        correct: false
      }));
      const order = presentedChoiceIds(
        { sessionId: "gate-sample-00000000", judgmentId: judgment.id },
        judgment.choices.map((choice) => choice.id)
      );
      judgment.choices.find((choice) => choice.id === order[0])!.correct = true;
      return judgment;
    });
    expectIssue(
      inspect(content, passingBlueprint(), 1),
      "DI_PRESENTATION_SESSION_DEGENERATE",
      "/judgments"
    );
  });

  it("warns when a signal has fewer than two judgment opportunities", () => {
    const content = structuredClone(passingDiagnosticIntegritySet);
    const blueprint = passingBlueprint();
    content.judgments[1].choices[2].signalIds = ["counting.ones-only"];
    blueprint.distractors[3].signalIds = ["counting.ones-only"];
    expectIssue(
      inspect(content, blueprint),
      "DI_SIGNAL_NOT_CONFIRMABLE",
      "/signals/1",
      "warning"
    );
  });

  it("warns when one misconception is split across signal sets", () => {
    const blueprint = passingBlueprint();
    blueprint.distractors[2].misconceptionId =
      blueprint.distractors[1].misconceptionId;
    expectIssue(
      inspect(undefined, blueprint),
      "DI_MISCONCEPTION_SIGNAL_SPLIT",
      "/blueprint/distractors/1/signalIds",
      "warning"
    );
  });

  it("warns when more than eighty percent of diagnostic severities are equal", () => {
    const content = structuredClone(passingDiagnosticIntegritySet);
    content.signals[0].severity = "medium";
    content.signals[1].severity = "medium";
    expectIssue(
      inspect(content),
      "DI_SEVERITY_UNDIFFERENTIATED",
      "/signals",
      "warning"
    );
  });

  it("skips all semantic checks below the enforcement floor", () => {
    const result = inspectDiagnosticIntegrity({
      content: structuredClone(passingDiagnosticIntegritySet),
      setKey: "grade3-semester2",
      targetVersion: "1.0.1"
    });
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "DI_GATE_NOT_ENFORCED",
        path: "/",
        severity: "warning"
      })
    ]);
    expect(result.gates?.[0]).toMatchObject({
      policy: "warn",
      enforced: false,
      blueprintRevision: "2026-07-30.2",
      valid: true,
      errorCount: 0,
      warningCount: 1
    });
  });

  it("does not duplicate coverage-validator issues", () => {
    const blueprint = passingBlueprint();
    blueprint.stages = [];
    const result = inspect(undefined, blueprint);
    expect(
      result.issues.filter((item) => item.code === "STAGE_COVERAGE_REQUIRED")
    ).toHaveLength(1);
  });

  it("accepts legitimate same-misconception distractors with different derivations", () => {
    const blueprint = passingBlueprint();
    blueprint.distractors[1].misconceptionId =
      blueprint.distractors[0].misconceptionId;
    expect(
      inspect(undefined, blueprint).issues.some(
        (item) => item.code === "DI_UNJUSTIFIED_DUPLICATE_DISTRACTOR"
      )
    ).toBe(false);
  });
});
