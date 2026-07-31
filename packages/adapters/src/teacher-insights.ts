import type {
  ReportRepository,
  TeacherInsightsRepository
} from "@middle-of-math/application";
import type {
  DiagnosisSession,
  InterpretationRunRecord,
  ObservationEvent,
  ParentReport,
  ParentReportExportRecord,
  PrivacySafeDailyAggregate,
  PublishedDiagnosisSet,
  TeacherAssignmentEvidenceBundle,
  TeacherAssignmentSnapshot,
  TeacherClassSnapshot,
  TeacherDistractorNote,
  TeacherSessionEvidence,
  TeacherSessionEvidenceContext,
  TeacherStudentReport,
  TeacherStudentSnapshot
} from "@middle-of-math/domain";
import { normalizeTeacherReport } from "@middle-of-math/domain";
import type { SupabaseClient } from "@supabase/supabase-js";

type JsonRow = Record<string, any>;

export class SupabaseTeacherInsightsRepository implements TeacherInsightsRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getAssignmentBundle(assignmentId: string): Promise<TeacherAssignmentEvidenceBundle | null> {
    const { data: assignmentRow, error: assignmentError } = await this.client
      .from("assignments")
      .select(`
        id, class_id, status, opens_at, closes_at,
        classes(id, name, grade, semester, pilot_ends_at, purge_after),
        diagnosis_sets(id, set_key, version, checksum, status, content, published_at)
      `)
      .eq("id", assignmentId)
      .maybeSingle();
    if (assignmentError) throw assignmentError;
    if (!assignmentRow) return null;

    const classRow = firstRelation(assignmentRow.classes);
    const diagnosisRow = firstRelation(assignmentRow.diagnosis_sets);
    if (!classRow || !diagnosisRow?.content) return null;

    const { data: studentRows, error: studentError } = await this.client
      .from("students")
      .select("id, roster_key, display_alias, active")
      .eq("class_id", assignmentRow.class_id)
      .order("roster_key");
    if (studentError) throw studentError;

    const { data: sessionRows, error: sessionError } = await this.client
      .from("sessions")
      .select("id, assignment_id, student_id, status, started_at, completed_at, last_event_seq")
      .eq("assignment_id", assignmentId)
      .order("started_at");
    if (sessionError) throw sessionError;

    const sessionIds = (sessionRows ?? []).map((row) => String(row.id));
    const eventRows = sessionIds.length === 0 ? [] : await this.loadEvents(sessionIds);
    const runRows = sessionIds.length === 0 ? [] : await this.loadInterpretationRuns(sessionIds);
    const eventsBySession = groupBy(eventRows.map(mapEvent), (event) => event.sessionId);
    const runsBySession = groupBy(runRows.map(mapInterpretationRun), (run) => run.sessionId);
    const sessionsByStudent = groupBy((sessionRows ?? []).map((row) => mapSessionEvidence(
      row,
      diagnosisRow,
      eventsBySession.get(String(row.id)) ?? [],
      runsBySession.get(String(row.id)) ?? []
    )), (evidence) => evidence.session.studentId);

    return {
      class: mapClass(classRow),
      assignment: mapAssignment(assignmentRow),
      diagnosisSet: mapPublishedDiagnosisSet(diagnosisRow),
      students: (studentRows ?? []).map((row) => ({
        student: mapStudent(row),
        sessions: sessionsByStudent.get(String(row.id)) ?? []
      }))
    };
  }

  async listClassAssignmentBundles(classId: string): Promise<TeacherAssignmentEvidenceBundle[]> {
    const { data, error } = await this.client
      .from("assignments")
      .select("id")
      .eq("class_id", classId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const bundles = await Promise.all((data ?? []).map((row) => this.getAssignmentBundle(String(row.id))));
    return bundles.filter((bundle): bundle is TeacherAssignmentEvidenceBundle => Boolean(bundle));
  }

  async getSessionEvidence(sessionId: string): Promise<TeacherSessionEvidenceContext | null> {
    const { data, error } = await this.client
      .from("sessions")
      .select("assignment_id, student_id")
      .eq("id", sessionId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const bundle = await this.getAssignmentBundle(String(data.assignment_id));
    if (!bundle) return null;
    const student = bundle.students.find((candidate) => candidate.student.id === String(data.student_id));
    const evidence = student?.sessions.find((candidate) => candidate.session.id === sessionId);
    if (!student || !evidence) return null;
    return {
      class: bundle.class,
      assignment: bundle.assignment,
      diagnosisSet: bundle.diagnosisSet,
      student: student.student,
      evidence
    };
  }

  async listDistractorNotes(input: {
    setKey: string;
    version: string;
  }): Promise<TeacherDistractorNote[]> {
    const { data, error } = await this.client
      .from("diagnosis_distractor_notes")
      .select(`
        set_key, version, judgment_id, choice_id, signal_ids,
        misconception_key, misconception_title, teacher_note
      `)
      .eq("set_key", input.setKey)
      .eq("version", input.version)
      .order("judgment_id")
      .order("choice_id");
    if (error) throw error;
    return (data ?? []).map(mapTeacherDistractorNote);
  }

  async listDailyAggregates(from: string, to: string): Promise<PrivacySafeDailyAggregate[]> {
    const { data, error } = await this.client.rpc("teacher_daily_pilot_aggregates", {
      p_from: from,
      p_to: to
    });
    if (error) throw error;
    return (data ?? []).map((row: JsonRow) => ({
      day: String(row.day),
      classesCreated: Number(row.classes_created),
      studentsAdded: Number(row.students_added),
      sessionsStarted: Number(row.sessions_started),
      sessionsCompleted: Number(row.sessions_completed),
      observationEventsReceived: Number(row.observation_events_received),
      parentExportsGenerated: Number(row.parent_exports_generated)
    }));
  }

  private async loadEvents(sessionIds: string[]): Promise<JsonRow[]> {
    const { data, error } = await this.client
      .from("observation_events")
      .select("*")
      .in("session_id", sessionIds)
      .order("client_seq");
    if (error) throw error;
    return data ?? [];
  }

  private async loadInterpretationRuns(sessionIds: string[]): Promise<JsonRow[]> {
    const { data, error } = await this.client
      .from("interpretation_runs")
      .select("id, session_id, engine_version, diagnosis_set_version, generated_at, report")
      .in("session_id", sessionIds)
      .order("generated_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
}

export class SupabaseReportRepository implements ReportRepository {
  constructor(private readonly client: SupabaseClient) {}

  async saveInterpretationRun(report: TeacherStudentReport): Promise<InterpretationRunRecord> {
    const { data, error } = await this.client.from("interpretation_runs").upsert({
      session_id: report.sessionId,
      engine_version: report.engineVersion,
      diagnosis_set_version: report.diagnosisSetVersion,
      generated_at: report.generatedAt,
      report
    }, { onConflict: "session_id,engine_version,diagnosis_set_version", ignoreDuplicates: true })
      .select("id, session_id, engine_version, diagnosis_set_version, generated_at, report")
      .maybeSingle();
    if (error) throw error;
    if (data) return mapInterpretationRun(data);
    const existing = await this.getInterpretationRun({
      sessionId: report.sessionId,
      engineVersion: report.engineVersion,
      diagnosisSetVersion: report.diagnosisSetVersion
    });
    if (!existing) throw new Error("해석 실행 결과를 저장하지 못했습니다.");
    return existing;
  }

  async getInterpretationRun(input: {
    sessionId: string;
    engineVersion: string;
    diagnosisSetVersion: string;
  }): Promise<InterpretationRunRecord | null> {
    const { data, error } = await this.client
      .from("interpretation_runs")
      .select("id, session_id, engine_version, diagnosis_set_version, generated_at, report")
      .eq("session_id", input.sessionId)
      .eq("engine_version", input.engineVersion)
      .eq("diagnosis_set_version", input.diagnosisSetVersion)
      .maybeSingle();
    if (error) throw error;
    return data ? mapInterpretationRun(data) : null;
  }

  async saveParentReportExport(input: {
    id: string;
    sessionId: string;
    interpretationRunId: string;
    reviewedBy: string;
    report: ParentReport;
  }): Promise<ParentReportExportRecord> {
    const { data, error } = await this.client.from("parent_report_exports").insert({
      id: input.id,
      session_id: input.sessionId,
      interpretation_run_id: input.interpretationRunId,
      reviewed_by: input.reviewedBy,
      report: input.report
    }).select("id, session_id, interpretation_run_id, reviewed_by, report, generated_at").single();
    if (error) throw error;
    return mapParentExport(data);
  }
}

function firstRelation(value: any): JsonRow | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function groupBy<T>(values: T[], key: (value: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const value of values) groups.set(key(value), [...(groups.get(key(value)) ?? []), value]);
  return groups;
}

function mapClass(row: JsonRow): TeacherClassSnapshot {
  return {
    id: String(row.id),
    name: String(row.name),
    grade: Number(row.grade),
    semester: Number(row.semester) as 1 | 2,
    pilotEndsAt: String(row.pilot_ends_at),
    purgeAfter: String(row.purge_after)
  };
}

function mapAssignment(row: JsonRow): TeacherAssignmentSnapshot {
  return {
    id: String(row.id),
    classId: String(row.class_id),
    status: row.status,
    opensAt: String(row.opens_at),
    closesAt: row.closes_at ? String(row.closes_at) : undefined
  };
}

function mapStudent(row: JsonRow): TeacherStudentSnapshot {
  return {
    id: String(row.id),
    rosterKey: String(row.roster_key),
    displayAlias: row.display_alias ? String(row.display_alias) : null,
    active: Boolean(row.active)
  };
}

function mapPublishedDiagnosisSet(row: JsonRow): PublishedDiagnosisSet {
  return {
    id: String(row.id),
    setKey: String(row.set_key),
    version: String(row.version),
    checksum: String(row.checksum),
    status: row.status,
    content: row.content,
    publishedAt: String(row.published_at)
  };
}

export function mapTeacherDistractorNote(row: JsonRow): TeacherDistractorNote {
  return {
    setKey: String(row.set_key),
    version: String(row.version),
    judgmentId: String(row.judgment_id),
    choiceId: String(row.choice_id),
    signalIds: Array.isArray(row.signal_ids)
      ? row.signal_ids.map(String)
      : [],
    misconceptionKey: String(row.misconception_key),
    misconceptionTitle: String(row.misconception_title),
    teacherNote: String(row.teacher_note)
  };
}

function mapSessionEvidence(
  row: JsonRow,
  diagnosisSet: JsonRow,
  events: ObservationEvent[],
  interpretationRuns: InterpretationRunRecord[]
): TeacherSessionEvidence {
  const session: DiagnosisSession = {
    id: String(row.id),
    assignmentId: String(row.assignment_id),
    studentId: String(row.student_id),
    diagnosisSetId: String(diagnosisSet.set_key),
    diagnosisSetVersion: String(diagnosisSet.version),
    status: row.status,
    startedAt: String(row.started_at),
    completedAt: row.completed_at ? String(row.completed_at) : undefined,
    lastEventSeq: Number(row.last_event_seq)
  };
  return { session, events, interpretationRuns };
}

function mapEvent(row: JsonRow): ObservationEvent {
  return {
    id: String(row.id),
    clientEventId: String(row.client_event_id),
    clientSeq: Number(row.client_seq),
    sessionId: String(row.session_id),
    diagnosisSetId: String(row.diagnosis_set_key),
    diagnosisSetVersion: String(row.diagnosis_set_version),
    eventType: row.event_type,
    judgmentId: row.judgment_id ? String(row.judgment_id) : undefined,
    interaction: { type: String(row.interaction_type), version: Number(row.interaction_version) },
    payload: row.payload,
    occurredAt: String(row.occurred_at),
    receivedAt: String(row.received_at)
  };
}

export function mapInterpretationRun(row: JsonRow): InterpretationRunRecord {
  return {
    id: String(row.id),
    sessionId: String(row.session_id),
    engineVersion: String(row.engine_version),
    diagnosisSetVersion: String(row.diagnosis_set_version),
    generatedAt: String(row.generated_at),
    report: normalizeTeacherReport(row.report)
  };
}

function mapParentExport(row: JsonRow): ParentReportExportRecord {
  return {
    id: String(row.id),
    sessionId: String(row.session_id),
    interpretationRunId: String(row.interpretation_run_id),
    reviewedBy: String(row.reviewed_by),
    generatedAt: String(row.generated_at),
    report: row.report as ParentReport
  };
}
