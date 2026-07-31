import { describe, expect, it } from "vitest";
import type {
  InterpretationRunRecord,
  ObservationEvent,
  ParentReportExportRecord,
  TeacherAssignmentEvidenceBundle,
  TeacherDistractorNote,
  TeacherSessionEvidence,
  TeacherSessionEvidenceContext,
  TeacherStudentReport
} from "@middle-of-math/domain";
import { grade3Semester2Diagnosis } from "../../content/src";
import type { ReportRepository, TeacherInsightsRepository } from "./ports";
import {
  ExportParentReport,
  GenerateAssignmentInsights,
  LoadClassInsights,
  selectLatestCompletedAttempt
} from "./use-cases";

const clock = { now: () => new Date("2026-07-22T03:00:00.000Z") };

function event(sessionId: string, choiceId = "6"): ObservationEvent {
  return {
    id: `event-${sessionId}`,
    clientEventId: `client-${sessionId}`,
    clientSeq: 2,
    sessionId,
    diagnosisSetId: "grade3-semester2",
    diagnosisSetVersion: "1.0.0",
    eventType: "judgment_confirmed",
    judgmentId: "g3s2-mul-01",
    interaction: { type: "choice", version: 1 },
    payload: {
      choiceId,
      durationMs: 10_000,
      firstSelectionMs: 4_000,
      confirmationMs: 6_000,
      selectionChanges: 0,
      uncertainty: false
    },
    occurredAt: "2026-07-22T02:30:00.000Z"
  };
}

function attempt(
  id: string,
  completedAt: string | undefined,
  startedAt: string,
  status: "completed" | "in_progress" | "sync_pending" = completedAt ? "completed" : "in_progress"
): TeacherSessionEvidence {
  return {
    session: {
      id,
      assignmentId: "assignment-1",
      studentId: "student-1",
      diagnosisSetId: "grade3-semester2",
      diagnosisSetVersion: "1.0.0",
      status,
      startedAt,
      completedAt,
      lastEventSeq: 2
    },
    events: completedAt ? [event(id)] : [],
    interpretationRuns: []
  };
}

function bundle(): TeacherAssignmentEvidenceBundle {
  return {
    class: {
      id: "class-1",
      name: "파일럿반",
      grade: 3,
      semester: 2,
      pilotEndsAt: "2026-10-20T00:00:00.000Z",
      purgeAfter: "2026-10-20T00:00:00.000Z"
    },
    assignment: {
      id: "assignment-1",
      classId: "class-1",
      status: "active",
      opensAt: "2026-07-20T00:00:00.000Z"
    },
    diagnosisSet: {
      id: "diagnosis-1",
      setKey: "grade3-semester2",
      version: "1.0.0",
      checksum: grade3Semester2Diagnosis.manifest.checksum,
      status: "published",
      content: structuredClone(grade3Semester2Diagnosis),
      publishedAt: "2026-07-20T00:00:00.000Z"
    },
    students: [{
      student: { id: "student-1", rosterKey: "12", displayAlias: "별빛", active: true },
      sessions: [
        attempt("session-old", "2026-07-21T01:00:00.000Z", "2026-07-21T00:00:00.000Z"),
        attempt("session-latest", "2026-07-22T02:00:00.000Z", "2026-07-22T01:00:00.000Z")
      ]
    }]
  };
}

function withTwoHitStage(
  source: TeacherAssignmentEvidenceBundle,
  studentIndex = 0
): TeacherAssignmentEvidenceBundle {
  const direct = source.diagnosisSet.content.judgments.find(
    (judgment) => judgment.id === "g3s2-mul-01"
  )!;
  source.diagnosisSet.content.judgments.push({
    ...structuredClone(direct),
    id: "g3s2-mul-01-transfer",
    prompt: "24×3과 같은 생각으로 32×2를 먼저 나누어 보세요."
  });
  const latest = source.students[studentIndex].sessions.find(
    (item) => item.session.id === "session-latest"
  ) ?? source.students[studentIndex].sessions.at(-1)!;
  latest.events.push({
    ...event(latest.session.id),
    id: `event-${latest.session.id}-transfer`,
    clientEventId: `client-${latest.session.id}-transfer`,
    clientSeq: 3,
    judgmentId: "g3s2-mul-01-transfer"
  });
  latest.session.lastEventSeq = 3;
  return source;
}

class Insights implements TeacherInsightsRepository {
  constructor(
    readonly value: TeacherAssignmentEvidenceBundle,
    readonly notes: TeacherDistractorNote[] = [],
    readonly noteError = false
  ) {}
  async getAssignmentBundle(id: string) { return id === this.value.assignment.id ? this.value : null; }
  async listClassAssignmentBundles() { return [this.value]; }
  async getSessionEvidence(sessionId: string): Promise<TeacherSessionEvidenceContext | null> {
    const student = this.value.students[0];
    const evidence = student.sessions.find((item) => item.session.id === sessionId);
    return evidence ? {
      class: this.value.class,
      assignment: this.value.assignment,
      diagnosisSet: this.value.diagnosisSet,
      student: student.student,
      evidence
    } : null;
  }
  async listDailyAggregates() { return []; }
  async listDistractorNotes() {
    if (this.noteError) throw new Error("notes unavailable");
    return this.notes;
  }
}

class Reports implements ReportRepository {
  runs = new Map<string, InterpretationRunRecord>();
  exports: ParentReportExportRecord[] = [];
  getRunCalls = 0;
  saveRunCalls = 0;
  async saveInterpretationRun(report: TeacherStudentReport) {
    this.saveRunCalls += 1;
    const value: InterpretationRunRecord = {
      id: `run-${report.sessionId}`,
      sessionId: report.sessionId,
      engineVersion: report.engineVersion,
      diagnosisSetVersion: report.diagnosisSetVersion,
      generatedAt: report.generatedAt,
      report
    };
    this.runs.set(report.sessionId, value);
    return value;
  }
  async getInterpretationRun(input: { sessionId: string }) {
    this.getRunCalls += 1;
    return this.runs.get(input.sessionId) ?? null;
  }
  async saveParentReportExport(input: Parameters<ReportRepository["saveParentReportExport"]>[0]) {
    const value: ParentReportExportRecord = {
      ...input,
      generatedAt: "2026-07-22T03:00:00.000Z"
    };
    this.exports.push(value);
    return value;
  }
}

describe("teacher assignment insights", () => {
  it("loads a class through the insights repository boundary", async () => {
    const source = bundle();
    await expect(new LoadClassInsights(new Insights(source)).execute("class-1")).resolves.toEqual([source]);
  });

  it("selects the latest completed attempt deterministically", () => {
    const attempts = [
      attempt("a", "2026-07-22T02:00:00.000Z", "2026-07-22T01:00:00.000Z"),
      attempt("c", "2026-07-22T02:00:00.000Z", "2026-07-22T01:30:00.000Z"),
      attempt("b", "2026-07-22T02:00:00.000Z", "2026-07-22T01:30:00.000Z"),
      attempt("active", undefined, "2026-07-22T02:30:00.000Z")
    ];
    expect(selectLatestCompletedAttempt(attempts)?.session.id).toBe("c");
  });

  it("interprets and persists only the latest completed attempt", async () => {
    const source = bundle();
    const reports = new Reports();
    const result = await new GenerateAssignmentInsights(new Insights(source), reports, clock).execute("assignment-1");
    expect(result.students[0]).toMatchObject({
      interpretationStatus: "ready",
      latestCompletedSessionId: "session-latest"
    });
    expect([...reports.runs.keys()]).toEqual(["session-latest"]);
    expect(reports.saveRunCalls).toBe(1);
    expect(result.classSummary.completedStudents).toBe(1);
    expect(result.students[0].report?.findings[0]).toMatchObject({
      confidence: "tentative",
      tentativeReasons: ["insufficient_opportunity", "single_observation"]
    });
    expect(reports.exports).toHaveLength(0);
  });

  it("returns exact teacher notes and degrades safely when note retrieval fails", async () => {
    const source = bundle();
    const note: TeacherDistractorNote = {
      setKey: "grade3-semester2",
      version: "1.0.0",
      judgmentId: "g3s2-mul-01",
      choiceId: "6",
      signalIds: ["multiplication.place-value-loss"],
      misconceptionKey: "multiplication.place-value-loss.partial-product",
      misconceptionTitle: "부분곱만 사용함",
      teacherNote: "십의 자리 부분곱을 확인해 주세요."
    };
    const ready = await new GenerateAssignmentInsights(
      new Insights(source, [note]),
      new Reports(),
      clock
    ).execute("assignment-1");
    expect(ready.distractorNotes).toEqual([note]);

    const degraded = await new GenerateAssignmentInsights(
      new Insights(bundle(), [], true),
      new Reports(),
      clock
    ).execute("assignment-1");
    expect(degraded.distractorNotes).toEqual([]);
  });

  it("counts each student with active attempts once while keeping completed insights", async () => {
    const source = bundle();
    source.students[0].sessions.push(
      attempt("session-active-after-completion", undefined, "2026-07-22T02:30:00.000Z")
    );
    source.students.push({
      student: { id: "student-2", rosterKey: "15", displayAlias: "구름", active: true },
      sessions: [
        attempt("student-2-active-a", undefined, "2026-07-22T01:00:00.000Z"),
        attempt("student-2-active-b", undefined, "2026-07-22T02:00:00.000Z", "sync_pending")
      ]
    });

    const result = await new GenerateAssignmentInsights(
      new Insights(source),
      new Reports(),
      clock
    ).execute("assignment-1");

    expect(result.classSummary).toMatchObject({ completedStudents: 1, inProgressStudents: 2 });
    expect(result.students[0]).toMatchObject({
      interpretationStatus: "ready",
      latestCompletedSessionId: "session-latest"
    });
    expect(result.students[1]).toMatchObject({ interpretationStatus: "in_progress" });
  });

  it("reuses the current interpretation run instead of persisting it again", async () => {
    const source = bundle();
    const reports = new Reports();
    const useCase = new GenerateAssignmentInsights(new Insights(source), reports, clock);

    const first = await useCase.execute("assignment-1");
    const second = await useCase.execute("assignment-1");

    expect(first.students[0].report).toEqual(second.students[0].report);
    expect(reports.getRunCalls).toBe(2);
    expect(reports.saveRunCalls).toBe(1);
    expect(reports.runs.size).toBe(1);
  });

  it("marks checksum and interaction incompatibility as interpretation pending", async () => {
    const checksum = bundle();
    checksum.diagnosisSet.checksum = "different";
    const checksumResult = await new GenerateAssignmentInsights(new Insights(checksum), new Reports(), clock).execute("assignment-1");
    expect(checksumResult.students[0]).toMatchObject({
      interpretationStatus: "interpretation_pending",
      pendingReason: "checksum_mismatch"
    });

    const interaction = bundle();
    interaction.diagnosisSet.content.judgments[0].interaction.version = 99;
    const interactionResult = await new GenerateAssignmentInsights(new Insights(interaction), new Reports(), clock).execute("assignment-1");
    expect(interactionResult.students[0]).toMatchObject({
      interpretationStatus: "interpretation_pending",
      pendingReason: "unsupported_interaction_version"
    });
  });

  it("persists a parent snapshot only through explicit export", async () => {
    const source = bundle();
    const reports = new Reports();
    await new GenerateAssignmentInsights(new Insights(source), reports, clock).execute("assignment-1");
    expect(reports.exports).toHaveLength(0);
    const exported = await new ExportParentReport(
      new Insights(source),
      reports,
      { next: () => "parent-export-1" },
      clock
    ).execute({ sessionId: "session-latest", reviewedBy: "teacher-1" });
    expect(exported.report.studentLabel).toBe("별빛");
    expect(reports.saveRunCalls).toBe(1);
    expect(reports.exports).toHaveLength(1);
    expect(JSON.stringify(exported.report)).not.toContain("event-session-latest");
    expect(JSON.stringify(exported.report)).not.toContain("teacherNote");
  });

  it("confirms a signal after two distinct hits in one stage", async () => {
    const source = withTwoHitStage(bundle());
    const result = await new GenerateAssignmentInsights(
      new Insights(source),
      new Reports(),
      clock
    ).execute("assignment-1");

    expect(result.students[0].report).toMatchObject({
      confirmedFindingCount: 1,
      tentativeFindingCount: 0,
      findings: [
        expect.objectContaining({
          signalId: "multiplication.place-value-loss",
          confidence: "confirmed",
          evidenceCount: 2
        })
      ]
    });
  });

  it("separates confirmed and tentative students in the class summary", async () => {
    const source = withTwoHitStage(bundle());
    source.students.push({
      student: {
        id: "student-2",
        rosterKey: "15",
        displayAlias: "구름",
        active: true
      },
      sessions: [
        {
          ...attempt(
            "student-2-latest",
            "2026-07-22T02:10:00.000Z",
            "2026-07-22T01:10:00.000Z"
          ),
          session: {
            ...attempt(
              "student-2-latest",
              "2026-07-22T02:10:00.000Z",
              "2026-07-22T01:10:00.000Z"
            ).session,
            studentId: "student-2"
          }
        }
      ]
    });

    const result = await new GenerateAssignmentInsights(
      new Insights(source),
      new Reports(),
      clock
    ).execute("assignment-1");
    const item = result.classSummary.items.find(
      (candidate) => candidate.signalId === "multiplication.place-value-loss"
    );

    expect(item).toMatchObject({
      studentCount: 2,
      confirmedStudentCount: 1,
      tentativeStudentCount: 1,
      confirmedStudentIds: ["student-1"]
    });
  });
});
