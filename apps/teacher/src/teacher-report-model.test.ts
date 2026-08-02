import { describe, expect, it } from "vitest";
import type {
  ClassSummary,
  DiagnosisSet,
  EvidenceItem,
  TeacherStudentReport,
  TeacherDistractorNote
} from "@middle-of-math/domain";
import {
  buildTeacherReportView,
  findChoiceNote,
  groupSummaryByUnit
} from "./teacher-report-model";

const evidence: EvidenceItem = {
  eventId: "event-1",
  judgmentId: "g4s1-bar-05",
  learnerStageId: "bar-graph.compare",
  curriculumAnchorIds: ["[4수04-01]"],
  selectedChoiceId: "two-more",
  selectedChoiceLabel: "2명",
  durationBand: "steady",
  firstSelectionMs: 3_000,
  confirmationMs: 1_000,
  selectionChanges: 0,
  uncertainty: false
};

const note: TeacherDistractorNote = {
  setKey: "grade4-semester1",
  version: "1.3.0",
  judgmentId: "g4s1-bar-05",
  choiceId: "two-more",
  signalIds: ["bar-graph.compare"],
  misconceptionKey: "bar-graph.compare.tick-difference-only",
  misconceptionTitle: "두 막대의 칸 수 차를 실제 값으로 바꾸지 않고 답함",
  teacherNote: "축구 4칸과 야구 2칸의 차 2칸을 실제 학생 수로 바꾸지 않았습니다."
};

describe("teacher report model", () => {
  it("finds a teacher-only note by the exact judgment and choice", () => {
    expect(findChoiceNote([note], evidence)).toEqual({
      title: note.misconceptionTitle,
      text: note.teacherNote
    });
    expect(findChoiceNote([note], { ...evidence, selectedChoiceId: "other" }))
      .toBeUndefined();
  });

  it("groups every summary item by curriculum unit without truncation", () => {
    const base = {
      severity: "medium" as const,
      studentCount: 1,
      evidenceCount: 1,
      studentIds: ["student-1"],
      confirmedStudentCount: 0,
      tentativeStudentCount: 1,
      confirmedStudentIds: [],
      interpretation: "해석",
      teachingMove: "수업"
    };
    const summary: ClassSummary = {
      completedStudents: 1,
      inProgressStudents: 0,
      items: [
        { ...base, signalId: "bar-2", title: "둘", unitId: "bar", unitTitle: "막대그래프", unitOrder: 5 },
        { ...base, signalId: "number-1", title: "하나", unitId: "number", unitTitle: "큰 수", unitOrder: 1 },
        { ...base, signalId: "bar-1", title: "셋", unitId: "bar", unitTitle: "막대그래프", unitOrder: 5 }
      ]
    };

    expect(groupSummaryByUnit(summary).map((group) => ({
      title: group.unitTitle,
      signals: group.items.map((item) => item.signalId)
    }))).toEqual([
      { title: "큰 수", signals: ["number-1"] },
      { title: "막대그래프", signals: ["bar-2", "bar-1"] }
    ]);
  });

  it("builds a bounded learning path and keeps repeated and counter evidence together", () => {
    const activeSet = reportDiagnosisSet();
    const priorSet: DiagnosisSet = {
      manifest: { ...activeSet.manifest, id: "prior-set", title: "이전 진단" },
      curriculumAnchors: [{ id: "prior-anchor", label: "이전 기준", source: "fixture" }],
      learnerStages: [{ id: "prior-stage", order: 1, unitId: "prior", title: "이전 단계", shortTitle: "이전 단계를 확인함", curriculumAnchorIds: ["prior-anchor"], prerequisiteStageIds: [] }],
      signals: [],
      judgments: []
    };
    const report = reportFixture();
    const view = buildTeacherReportView(report, activeSet, [priorSet, activeSet], [{
      fromSetKey: "prior-set",
      fromStageId: "prior-stage",
      toSetKey: activeSet.manifest.id,
      toStageId: "current-stage"
    }]);

    expect(view.findings).toHaveLength(1);
    expect(view.findings[0]).toMatchObject({
      statusLabel: "같은 생각이 반복됨",
      currentStages: [{ stage: { id: "current-stage" } }],
      prerequisiteStages: [
        { stage: { id: "local-prerequisite" } },
        { setKey: "prior-set", stage: { id: "prior-stage" } }
      ],
      nextStages: [{ stage: { id: "next-stage" } }]
    });
    expect(view.findings[0].observedEvidence.map((item) => item.evidence.judgmentId))
      .toEqual(["wrong-1", "wrong-2"]);
    expect(view.findings[0].counterEvidence.map((item) => item.evidence.judgmentId))
      .toEqual(["counter-1"]);
    expect(view.unobservedSignals.map((signal) => signal.id)).toEqual(["not-observed"]);
  });

  it("labels a single observation as additional observation and separates response style from level", () => {
    const report = reportFixture();
    report.findings[0] = {
      ...report.findings[0],
      confidence: "tentative",
      tentativeReasons: ["single_observation"],
      evidenceCount: 1,
      evidence: [report.findings[0].evidence[0]],
      observedJudgmentIds: ["wrong-1"]
    };
    report.responseStyle.positionStyleSuspected = true;
    const view = buildTeacherReportView(report, reportDiagnosisSet());

    expect(view.findings[0].statusLabel).toBe("한 번 더 확인 필요");
    expect(view.dataQualityNotice).toContain("응답 기록을 살펴보는 참고 정보");
  });
});

function reportDiagnosisSet(): DiagnosisSet {
  const stage = (id: string, order: number, prerequisiteStageIds: string[] = []) => ({
    id,
    order,
    unitId: "unit",
    title: `${id} 제목`,
    shortTitle: `${id} 짧은 제목`,
    curriculumAnchorIds: ["anchor"],
    prerequisiteStageIds
  });
  const judgment = (id: string) => ({
    id,
    unitId: "unit",
    learnerStageId: "current-stage",
    curriculumAnchorIds: ["anchor"],
    prompt: `${id} 질문`,
    visual: { kind: "none" as const },
    interaction: { type: "single-choice", version: 1 },
    choices: [{ id: "correct", label: "맞는 선택", correct: true }]
  });
  return {
    manifest: {
      id: "active-set",
      version: "1.0.0",
      checksum: "fixture",
      title: "현재 진단",
      shortTitle: "현재",
      grade: 4,
      semester: 2,
      curriculum: "2022-revised",
      status: "published",
      units: [{ id: "unit", order: 1, title: "단원" }],
      interactionTypes: [{ type: "single-choice", version: 1 }],
      estimatedMinutes: 5
    },
    curriculumAnchors: [{ id: "anchor", label: "현재 기준", source: "fixture" }],
    learnerStages: [
      stage("local-prerequisite", 1),
      stage("current-stage", 2, ["local-prerequisite"]),
      stage("next-stage", 3, ["current-stage"])
    ],
    signals: [
      { id: "signal", title: "관찰 신호", severity: "medium", teacherInterpretation: "해석", teachingMove: "확인", parentSummary: "요약", homePrompt: "질문" },
      { id: "not-observed", title: "나타나지 않은 신호", severity: "low", teacherInterpretation: "해석", teachingMove: "확인", parentSummary: "요약", homePrompt: "질문" }
    ],
    judgments: [judgment("wrong-1"), judgment("wrong-2"), judgment("counter-1")]
  };
}

function reportFixture(): TeacherStudentReport {
  const evidenceFor = (eventId: string, judgmentId: string, selectedChoiceLabel: string): EvidenceItem => ({
    eventId,
    judgmentId,
    learnerStageId: "current-stage",
    curriculumAnchorIds: ["anchor"],
    selectedChoiceId: selectedChoiceLabel === "맞는 선택" ? "correct" : "wrong",
    selectedChoiceLabel,
    durationBand: "steady",
    firstSelectionMs: 3_000,
    confirmationMs: 1_000,
    selectionChanges: 0,
    uncertainty: false
  });
  const wrong1 = evidenceFor("event-wrong-1", "wrong-1", "틀린 선택 1");
  const wrong2 = evidenceFor("event-wrong-2", "wrong-2", "틀린 선택 2");
  const counter = evidenceFor("event-counter", "counter-1", "맞는 선택");
  return {
    sessionId: "session",
    diagnosisSetId: "active-set",
    diagnosisSetVersion: "1.0.0",
    engineVersion: "rules-2.1.0",
    generatedAt: "2026-08-01T00:00:00.000Z",
    observedJudgmentCount: 3,
    stableJudgmentCount: 1,
    uncertaintyCount: 0,
    findings: [{
      signalId: "signal",
      title: "관찰 신호",
      severity: "medium",
      evidenceCount: 2,
      confidence: "confirmed",
      tentativeReasons: [],
      opportunityCount: 3,
      observedJudgmentIds: ["wrong-1", "wrong-2"],
      counterJudgmentIds: ["counter-1"],
      confirmationRule: "서로 다른 두 문항에서 비슷한 생각이 반복되었습니다.",
      learnerStageIds: ["current-stage"],
      curriculumAnchorIds: ["anchor"],
      interpretation: "해석",
      teachingMove: "3분 확인",
      parentSummary: "요약",
      homePrompt: "질문",
      evidence: [wrong1, wrong2]
    }],
    evidence: [wrong1, wrong2, counter],
    opportunities: [
      { signalId: "signal", opportunityJudgmentIds: ["wrong-1", "wrong-2", "counter-1"], observedJudgmentIds: ["wrong-1", "wrong-2"], counterJudgmentIds: ["counter-1"] },
      { signalId: "not-observed", opportunityJudgmentIds: ["counter-1"], observedJudgmentIds: [], counterJudgmentIds: ["counter-1"] }
    ],
    confirmedFindingCount: 1,
    tentativeFindingCount: 0,
    responseStyle: { confirmationCount: 3, provenanceCount: 3, provenanceCoverage: 1, dominantPosition: null, dominantPositionRate: null, positionStyleSuspected: false, fastConfirmationCount: 0 }
  };
}
