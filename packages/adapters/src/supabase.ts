import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  AssignmentRepository,
  RemoteEventRepository,
  SessionRepository
} from "@middle-of-math/application";
import type { DiagnosisSession, DiagnosisSet, ObservationEvent, SessionStatus } from "@middle-of-math/domain";

export interface SupabasePublicConfig {
  url: string;
  publishableKey: string;
}

export type PilotOperation =
  | { app: "student"; event: "sync.failed" }
  | { app: "teacher"; event: "interpretation.checksum_failed" | "interpretation.unsupported" | "interpretation.failed" };

export interface StudentAssignmentRecord {
  id: string;
  unitId?: string;
  opensAt: string;
  closesAt?: string;
  status: string;
  diagnosisSet: {
    id: string;
    setKey: string;
    version: string;
    checksum: string;
    status: "published" | "retired";
    content: DiagnosisSet;
  };
}

export interface TeacherClassRecord {
  id: string;
  name: string;
  grade: number;
  semester: number;
  pilotEndsAt: string;
  purgeAfter: string;
  joinCode?: string;
}

export interface TeacherStudentRecord {
  id: string;
  rosterKey: string;
  displayAlias: string | null;
  active: boolean;
  joinSecret?: string;
}

export interface TeacherProfileRecord {
  id: string;
  displayName: string;
  email: string | null;
}

export function createMiddleOfMathClient(config: SupabasePublicConfig): SupabaseClient {
  return createClient(config.url, config.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
}

export class SupabaseOperationalTelemetry {
  constructor(private readonly client: SupabaseClient) {}

  async record(operation: PilotOperation): Promise<void> {
    const { error } = await this.client.rpc("record_pilot_operation", {
      p_app: operation.app,
      p_event_name: operation.event
    });
    if (error) throw error;
  }
}

export class SupabaseStudentGateway {
  constructor(private readonly client: SupabaseClient) {}

  async ensureAnonymousIdentity(): Promise<string> {
    const { data: current } = await this.client.auth.getSession();
    if (current.session?.user.id) return current.session.user.id;
    const { data, error } = await this.client.auth.signInAnonymously();
    if (error || !data.user) throw error ?? new Error("학생용 익명 세션을 만들 수 없습니다.");
    return data.user.id;
  }

  async joinClass(joinCode: string, rosterKey: string, studentSecret: string): Promise<{
    studentId: string;
    classId: string;
    className: string;
    rosterKey: string;
    displayAlias: string | null;
  }> {
    await this.ensureAnonymousIdentity();
    const { data, error } = await this.client.rpc("join_class", {
      p_join_code: joinCode,
      p_roster_key: rosterKey,
      p_student_secret: studentSecret
    });
    if (error) throw new Error("입장 정보를 다시 확인해 주세요.");
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error("입장 정보를 다시 확인해 주세요.");
    return {
      studentId: String(row.student_id),
      classId: String(row.class_id),
      className: String(row.class_name),
      rosterKey: String(row.roster_key),
      displayAlias: row.display_alias ? String(row.display_alias) : null
    };
  }

  async listAssignments(classId: string): Promise<StudentAssignmentRecord[]> {
    const { data, error } = await this.client
      .from("assignments")
      .select("id, unit_id, opens_at, closes_at, status, diagnosis_sets(id, set_key, version, checksum, status, content)")
      .eq("class_id", classId)
      .eq("status", "active")
      .order("opens_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).flatMap((row: any) => {
      const diagnosis = Array.isArray(row.diagnosis_sets) ? row.diagnosis_sets[0] : row.diagnosis_sets;
      if (!diagnosis?.content) return [];
      return [{
        id: String(row.id),
        unitId: row.unit_id ? String(row.unit_id) : undefined,
        opensAt: String(row.opens_at),
        closesAt: row.closes_at ? String(row.closes_at) : undefined,
        status: String(row.status),
        diagnosisSet: {
          id: String(diagnosis.id),
          setKey: String(diagnosis.set_key),
          version: String(diagnosis.version),
          checksum: String(diagnosis.checksum),
          status: diagnosis.status,
          content: diagnosis.content as DiagnosisSet
        }
      }];
    });
  }

  async leaveDeviceIdentity(): Promise<void> {
    const { error } = await this.client.auth.signOut({ scope: "local" });
    if (error) throw error;
  }
}

export class SupabaseTeacherGateway {
  constructor(private readonly client: SupabaseClient) {}

  async getCurrentTeacherProfile(): Promise<TeacherProfileRecord> {
    const { data: auth, error: authError } = await this.client.auth.getUser();
    if (authError || !auth.user) throw authError ?? new Error("교사 로그인이 필요합니다.");
    const { data, error } = await this.client
      .from("teachers")
      .select("id, display_name")
      .eq("id", auth.user.id)
      .single();
    if (error) throw error;
    return {
      id: String(data.id),
      displayName: String(data.display_name),
      email: auth.user.email ?? null
    };
  }

  async listActiveClasses(): Promise<TeacherClassRecord[]> {
    const { data, error } = await this.client
      .from("classes")
      .select("id, name, grade, semester, pilot_ends_at, purge_after")
      .eq("active", true)
      .order("created_at");
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      grade: Number(row.grade),
      semester: Number(row.semester),
      pilotEndsAt: String(row.pilot_ends_at),
      purgeAfter: String(row.purge_after)
    }));
  }

  async createClass(input: { name: string; grade: number; semester: 1 | 2 }): Promise<TeacherClassRecord> {
    const { data, error } = await this.client.rpc("create_class", {
      p_name: input.name,
      p_grade: input.grade,
      p_semester: input.semester
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error("클래스를 만들지 못했습니다.");
    const { data: classRow, error: classError } = await this.client
      .from("classes")
      .select("pilot_ends_at, purge_after")
      .eq("id", row.class_id)
      .single();
    if (classError) throw classError;
    return {
      id: String(row.class_id),
      name: String(row.class_name),
      grade: input.grade,
      semester: input.semester,
      pilotEndsAt: String(classRow.pilot_ends_at),
      purgeAfter: String(classRow.purge_after),
      joinCode: String(row.join_code)
    };
  }

  async listStudents(classId: string): Promise<TeacherStudentRecord[]> {
    const { data, error } = await this.client
      .from("students")
      .select("id, roster_key, display_alias, active")
      .eq("class_id", classId)
      .order("roster_key");
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: String(row.id),
      rosterKey: String(row.roster_key),
      displayAlias: row.display_alias ? String(row.display_alias) : null,
      active: Boolean(row.active)
    }));
  }

  async addStudent(input: { classId: string; rosterKey: string; displayAlias?: string }): Promise<TeacherStudentRecord> {
    const { data, error } = await this.client.rpc("create_student", {
      p_class_id: input.classId,
      p_roster_key: input.rosterKey,
      p_display_alias: input.displayAlias?.trim() || null
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.student_id || !row?.join_secret) throw new Error("학생 입장 카드를 만들지 못했습니다.");
    return {
      id: String(row.student_id),
      rosterKey: String(row.roster_key),
      displayAlias: row.display_alias ? String(row.display_alias) : null,
      active: Boolean(row.active),
      joinSecret: String(row.join_secret)
    };
  }

  async rotateStudentJoinSecret(studentId: string): Promise<string> {
    const { data, error } = await this.client.rpc("rotate_student_join_secret", {
      p_student_id: studentId
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.join_secret) throw new Error("학생 개인 코드를 재발급하지 못했습니다.");
    return String(row.join_secret);
  }

  async rotateJoinCode(classId: string): Promise<string> {
    const { data, error } = await this.client.rpc("rotate_class_join_code", { p_class_id: classId });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.join_code) throw new Error("입장 코드를 바꾸지 못했습니다.");
    return String(row.join_code);
  }
}

export class SupabaseSessionRepository implements SessionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(session: DiagnosisSession): Promise<void> {
    const { error } = await this.client.rpc("start_student_session", {
      p_session_id: session.id,
      p_assignment_id: session.assignmentId,
      p_student_id: session.studentId,
      p_client_session_id: session.id
    });
    if (error) throw error;
  }

  async get(sessionId: string): Promise<DiagnosisSession | null> {
    const { data, error } = await this.client
      .from("sessions")
      .select("id, assignment_id, student_id, status, started_at, completed_at, last_event_seq, assignments(diagnosis_sets(set_key, version))")
      .eq("id", sessionId)
      .maybeSingle();
    if (error) throw error;
    return data ? mapSession(data) : null;
  }

  async findResumable(assignmentId: string, studentId: string): Promise<DiagnosisSession | null> {
    const { data, error } = await this.client
      .from("sessions")
      .select("id, assignment_id, student_id, status, started_at, completed_at, last_event_seq, assignments(diagnosis_sets(set_key, version))")
      .eq("assignment_id", assignmentId)
      .eq("student_id", studentId)
      .in("status", ["in_progress", "sync_pending"])
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? mapSession(data) : null;
  }

  async updateStatus(_sessionId: string, _status: SessionStatus, _completedAt?: string): Promise<void> {
    // 원격 상태와 완료 시각은 append_observation_events가 서버 수신 순서로만 전이한다.
  }

  async updateLastEventSeq(_sessionId: string, _lastEventSeq: number): Promise<void> {
    // 원격 순번은 append_observation_events가 검증 후 갱신한다.
  }
}

export class SupabaseEventRepository implements RemoteEventRepository {
  constructor(private readonly client: SupabaseClient) {}

  async appendBatch(events: ObservationEvent[]): Promise<Array<{ clientEventId: string; receivedAt: string }>> {
    if (events.length === 0) return [];
    const { data, error } = await this.client.rpc("append_observation_events", {
      p_events: events.map((event) => ({
        id: event.id,
        session_id: event.sessionId,
        client_event_id: event.clientEventId,
        client_seq: event.clientSeq,
        event_type: event.eventType,
        judgment_id: event.judgmentId ?? null,
        interaction_type: event.interaction.type,
        interaction_version: event.interaction.version,
        diagnosis_set_id: event.diagnosisSetId,
        diagnosis_set_version: event.diagnosisSetVersion,
        payload: event.payload,
        occurred_at: event.occurredAt
      }))
    });
    if (error) throw error;
    return (data ?? []).map((row: { client_event_id: string; received_at: string }) => ({
      clientEventId: row.client_event_id,
      receivedAt: row.received_at
    }));
  }

  async listBySession(sessionId: string): Promise<ObservationEvent[]> {
    const { data, error } = await this.client
      .from("observation_events")
      .select("*")
      .eq("session_id", sessionId)
      .order("client_seq");
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      clientEventId: row.client_event_id,
      clientSeq: row.client_seq,
      sessionId: row.session_id,
      diagnosisSetId: row.diagnosis_set_key ?? row.diagnosis_set_id,
      diagnosisSetVersion: row.diagnosis_set_version,
      eventType: row.event_type,
      judgmentId: row.judgment_id ?? undefined,
      interaction: { type: row.interaction_type, version: row.interaction_version },
      payload: row.payload,
      occurredAt: row.occurred_at,
      receivedAt: row.received_at
    } as ObservationEvent));
  }
}

export class SupabaseAssignmentRepository implements AssignmentRepository {
  constructor(private readonly client: SupabaseClient) {}

  async assign(input: {
    id: string;
    classId: string;
    diagnosisSetId: string;
    diagnosisSetVersion: string;
    unitId: string;
    opensAt: string;
    closesAt?: string;
  }): Promise<void> {
    const { data: auth, error: authError } = await this.client.auth.getUser();
    if (authError || !auth.user) throw authError ?? new Error("교사 로그인이 필요합니다.");
    const { data: diagnosisSet, error: diagnosisSetError } = await this.client
      .from("diagnosis_sets")
      .select("id")
      .eq("set_key", input.diagnosisSetId)
      .eq("version", input.diagnosisSetVersion)
      .single();
    if (diagnosisSetError) throw diagnosisSetError;
    const { error } = await this.client.from("assignments").insert({
      id: input.id,
      class_id: input.classId,
      diagnosis_set_id: diagnosisSet.id,
      diagnosis_set_version: input.diagnosisSetVersion,
      unit_id: input.unitId,
      opens_at: input.opensAt,
      closes_at: input.closesAt ?? null,
      status: "active",
      created_by: auth.user.id
    });
    if (error) throw error;
  }
}

function mapSession(row: Record<string, any>): DiagnosisSession {
  const assignment = Array.isArray(row.assignments) ? row.assignments[0] : row.assignments;
  const diagnosis = Array.isArray(assignment?.diagnosis_sets) ? assignment.diagnosis_sets[0] : assignment?.diagnosis_sets;
  return {
    id: String(row.id),
    assignmentId: String(row.assignment_id),
    studentId: String(row.student_id),
    diagnosisSetId: String(diagnosis?.set_key ?? "grade3-semester2"),
    diagnosisSetVersion: String(diagnosis?.version ?? "1.0.0"),
    status: row.status as SessionStatus,
    startedAt: String(row.started_at),
    completedAt: row.completed_at ? String(row.completed_at) : undefined,
    lastEventSeq: Number(row.last_event_seq ?? 0)
  };
}
