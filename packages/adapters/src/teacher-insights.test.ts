import { describe, expect, it } from "vitest";
import {
  mapInterpretationRun,
  mapTeacherDistractorNote
} from "./teacher-insights";

const rowBase = {
  id: "run-1",
  session_id: "session-1",
  engine_version: "rules-2.0.0",
  diagnosis_set_version: "1.0.0",
  generated_at: "2026-07-22T00:00:00.000Z"
};

const legacyEvidence = {
  eventId: "event-1",
  judgmentId: "judgment-1",
  learnerStageId: "stage-1",
  curriculumAnchorIds: ["anchor-1"],
  selectedChoiceId: "wrong",
  selectedChoiceLabel: "오답",
  durationBand: "steady",
  firstSelectionMs: 4_000,
  confirmationMs: 2_000,
  selectionChanges: 0,
  uncertainty: false
};

function legacyReport(findings: unknown[] = []) {
  return {
    sessionId: "session-1",
    diagnosisSetId: "grade3-semester2",
    diagnosisSetVersion: "1.0.0",
    engineVersion: "rules-2.0.0",
    generatedAt: "2026-07-22T00:00:00.000Z",
    observedJudgmentCount: findings.length,
    stableJudgmentCount: 0,
    uncertaintyCount: 0,
    findings,
    evidence: findings.length ? [legacyEvidence] : []
  };
}

describe("teacher insight row mapping", () => {
  it("maps a teacher-only choice note from snake case", () => {
    expect(mapTeacherDistractorNote({
      set_key: "grade4-semester1",
      version: "1.3.0",
      judgment_id: "g4s1-bar-05",
      choice_id: "five",
      signal_ids: ["bar-graph.unit-value"],
      misconception_key: "bar-graph.unit-value.tick-count",
      misconception_title: "눈금 수를 값으로 읽음",
      teacher_note: "한 칸이 나타내는 수를 먼저 확인해 주세요."
    })).toEqual({
      setKey: "grade4-semester1",
      version: "1.3.0",
      judgmentId: "g4s1-bar-05",
      choiceId: "five",
      signalIds: ["bar-graph.unit-value"],
      misconceptionKey: "bar-graph.unit-value.tick-count",
      misconceptionTitle: "눈금 수를 값으로 읽음",
      teacherNote: "한 칸이 나타내는 수를 먼저 확인해 주세요."
    });
  });

  it("normalizes a stored rules-2 finding without treating it as confirmed", () => {
    const mapped = mapInterpretationRun({
      ...rowBase,
      report: legacyReport([{
        signalId: "signal-1",
        title: "이전 신호",
        severity: "medium",
        evidenceCount: 1,
        learnerStageIds: ["stage-1"],
        curriculumAnchorIds: ["anchor-1"],
        interpretation: "관찰",
        teachingMove: "다시 확인",
        parentSummary: "연습",
        homePrompt: "질문",
        evidence: [legacyEvidence]
      }])
    });

    expect(mapped.report.findings[0]).toMatchObject({
      confidence: "tentative",
      tentativeReasons: ["data_quality"],
      confirmationRule:
        "이전 엔진(rules-2.0.0) 해석입니다. 새 기준으로 다시 해석해야 합니다."
    });
    expect(mapped.report.confirmedFindingCount).toBe(0);
  });

  it("passes a complete rules-3 report through unchanged", () => {
    const report = {
      ...legacyReport(),
      engineVersion: "rules-3.0.0",
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
    const mapped = mapInterpretationRun({
      ...rowBase,
      engine_version: "rules-3.0.0",
      report
    });

    expect(mapped.report).toEqual(report);
  });

  it("fills zero v3 counts for an empty legacy report", () => {
    const mapped = mapInterpretationRun({
      ...rowBase,
      report: legacyReport()
    });

    expect(mapped.report).toMatchObject({
      opportunities: [],
      confirmedFindingCount: 0,
      tentativeFindingCount: 0,
      findings: []
    });
  });
});
