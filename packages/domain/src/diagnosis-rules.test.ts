import { describe, expect, it } from "vitest";
import {
  DIAGNOSIS_RULES,
  normalizeTeacherReport,
  resolveConfidence,
  summarizeResponseStyle,
  type InterpretedConfirmation
} from "./diagnosis-rules";
import { INTERPRETATION_ENGINE_VERSION } from "./interpretation";
import type { EvidenceItem, ResponseStyleSummary } from "./types";

function evidence(
  judgmentId: string,
  selectedChoicePosition?: number,
  firstSelectionMs: number | null = 4_000
): EvidenceItem {
  return {
    eventId: `event-${judgmentId}`,
    judgmentId,
    learnerStageId: "stage-1",
    curriculumAnchorIds: ["anchor-1"],
    selectedChoiceId: "wrong",
    selectedChoiceLabel: "오답",
    ...(selectedChoicePosition
      ? {
          presentedChoiceIds: ["correct", "wrong", "other"],
          selectedChoicePosition,
          presentedChoiceCount: 3
        }
      : {}),
    durationBand: "steady",
    firstSelectionMs,
    confirmationMs: 2_000,
    selectionChanges: 0,
    uncertainty: false
  };
}

function confirmation(
  judgmentId: string,
  selectedChoicePosition?: number,
  firstSelectionMs: number | null = 4_000,
  durationMs = 8_000
): InterpretedConfirmation {
  return {
    evidence: evidence(
      judgmentId,
      selectedChoicePosition,
      firstSelectionMs
    ),
    durationMs
  };
}

const stableStyle: ResponseStyleSummary = {
  confirmationCount: 2,
  provenanceCount: 2,
  provenanceCoverage: 1,
  dominantPosition: 1,
  dominantPositionRate: 0.5,
  positionStyleSuspected: false,
  fastConfirmationCount: 0
};

function resolution(
  overrides: Partial<Parameters<typeof resolveConfidence>[0]> = {}
) {
  return resolveConfidence({
    signalId: "signal-1",
    opportunityJudgmentIds: ["judgment-1", "judgment-2"],
    observations: [
      confirmation("judgment-1"),
      confirmation("judgment-2")
    ],
    responseStyle: stableStyle,
    ...overrides
  });
}

describe("diagnosis rules v3", () => {
  it("freezes every threshold behind the interpretation engine version", () => {
    expect(Object.isFrozen(DIAGNOSIS_RULES)).toBe(true);
    expect(Object.isFrozen(DIAGNOSIS_RULES.fallbackSignalIds)).toBe(true);
    expect(DIAGNOSIS_RULES.version).toBe("rules-3.0.0");
    expect(INTERPRETATION_ENGINE_VERSION).toBe(DIAGNOSIS_RULES.version);
  });

  it("reports no position style when presentation provenance is absent", () => {
    const summary = summarizeResponseStyle(
      Array.from({ length: 5 }, (_, index) =>
        confirmation(`judgment-${index}`)
      )
    );
    expect(summary).toMatchObject({
      confirmationCount: 5,
      provenanceCount: 0,
      provenanceCoverage: 0,
      dominantPosition: null,
      dominantPositionRate: null,
      positionStyleSuspected: false
    });
  });

  it("does not infer a position style from sixty-percent provenance", () => {
    const summary = summarizeResponseStyle([
      confirmation("judgment-1", 1),
      confirmation("judgment-2", 1),
      confirmation("judgment-3", 1),
      confirmation("judgment-4"),
      confirmation("judgment-5")
    ]);
    expect(summary.provenanceCoverage).toBe(0.6);
    expect(summary.positionStyleSuspected).toBe(false);
    expect(resolution({ responseStyle: summary }).confidence).toBe("confirmed");
  });

  it("flags five confirmations concentrated at one presented position", () => {
    const summary = summarizeResponseStyle(
      Array.from({ length: 5 }, (_, index) =>
        confirmation(`judgment-${index}`, 1)
      )
    );
    expect(summary).toMatchObject({
      dominantPosition: 1,
      dominantPositionRate: 1,
      positionStyleSuspected: true
    });
  });

  it("keeps a spread of presented positions below the style threshold", () => {
    const summary = summarizeResponseStyle(
      [1, 2, 3, 1, 2].map((position, index) =>
        confirmation(`judgment-${index}`, position)
      )
    );
    expect(summary.dominantPositionRate).toBe(0.4);
    expect(summary.positionStyleSuspected).toBe(false);
  });

  it("chooses the lowest presented position when counts tie", () => {
    const summary = summarizeResponseStyle(
      [2, 1, 2, 1, 3].map((position, index) =>
        confirmation(`judgment-${index}`, position)
      )
    );
    expect(summary.dominantPosition).toBe(1);
  });

  it("never confirms the uncertainty fallback signal", () => {
    expect(resolution({ signalId: "needs-scaffold" })).toMatchObject({
      confidence: "tentative",
      tentativeReasons: ["uncertainty_only"]
    });
  });

  it("never confirms the data-quality fallback signal", () => {
    expect(resolution({ signalId: "needs-review" })).toMatchObject({
      confidence: "tentative",
      tentativeReasons: ["data_quality"]
    });
  });

  it("records both missing opportunity and one observation", () => {
    expect(resolution({
      opportunityJudgmentIds: ["judgment-1"],
      observations: [confirmation("judgment-1")]
    })).toMatchObject({
      confidence: "tentative",
      tentativeReasons: [
        "insufficient_opportunity",
        "single_observation"
      ]
    });
  });

  it("keeps one hit tentative even when two opportunities existed", () => {
    expect(resolution({
      observations: [confirmation("judgment-1")]
    })).toMatchObject({
      confidence: "tentative",
      tentativeReasons: ["single_observation"]
    });
  });

  it("demotes repeated hits when the session shows a position style", () => {
    expect(resolution({
      responseStyle: {
        ...stableStyle,
        confirmationCount: 5,
        provenanceCount: 5,
        dominantPositionRate: 1,
        positionStyleSuspected: true
      }
    })).toMatchObject({
      confidence: "tentative",
      tentativeReasons: ["position_style"]
    });
  });

  it("demotes repeated hits when every confirming response is too fast", () => {
    expect(resolution({
      observations: [
        confirmation("judgment-1", 1, 1_000, 2_000),
        confirmation("judgment-2", 2, 1_200, 2_500)
      ]
    })).toMatchObject({
      confidence: "tentative",
      tentativeReasons: ["too_fast"]
    });
  });

  it("confirms only two deliberate hits from distinct judgments", () => {
    expect(resolution()).toEqual({
      confidence: "confirmed",
      tentativeReasons: [],
      confirmationRule: "서로 다른 두 문항에서 같은 신호가 나타났습니다."
    });
  });

  it("normalizes a legacy rules-2 report as tentative without inventing provenance", () => {
    const report = normalizeTeacherReport({
      sessionId: "session-1",
      diagnosisSetId: "set-1",
      diagnosisSetVersion: "1.0.0",
      engineVersion: "rules-2.0.0",
      generatedAt: "2026-07-22T00:00:00.000Z",
      observedJudgmentCount: 1,
      stableJudgmentCount: 0,
      uncertaintyCount: 0,
      findings: [{
        signalId: "signal-1",
        title: "한 번 관찰",
        severity: "medium",
        evidenceCount: 1,
        learnerStageIds: ["stage-1"],
        curriculumAnchorIds: ["anchor-1"],
        interpretation: "관찰",
        teachingMove: "다시 확인",
        parentSummary: "연습",
        homePrompt: "질문",
        evidence: [evidence("judgment-1")]
      }],
      evidence: [evidence("judgment-1")]
    });

    expect(report.findings[0]).toMatchObject({
      confidence: "tentative",
      tentativeReasons: ["data_quality"],
      opportunityCount: 1,
      observedJudgmentIds: ["judgment-1"],
      counterJudgmentIds: []
    });
    expect(report.confirmedFindingCount).toBe(0);
    expect(report.tentativeFindingCount).toBe(1);
    expect(report.responseStyle.dominantPosition).toBeNull();
  });
});
