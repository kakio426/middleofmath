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

export interface StudentAssignmentRecord {
  id: string;
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
  joinCode?: string;
}

export interface TeacherStudentRecord {
  id: string;
  rosterKey: string;
  displayAlias: string | null;
  active: boolean;
}

export function createMiddleOfMathClient(config: SupabasePublicConfig): SupabaseClient {
  return createClient(config.url, config.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
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

  async joinClass(joinCode: string, rosterKey: string): Promise<{
    studentId: string;
    classId: string;
    className: string;
    rosterKey: string;
    displayAlias: string | null;
  }> {
    await this.ensureAnonymousIdentity();
    const { data, error } = await this.client.rpc("join_class", {
      p_join_code: joinCode,
      p_roster_key: rosterKey
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error("클래스 코드 또는 번호를 다시 확인해 주세요.");
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
      .select("id, opens_at, closes_at, status, diagnosis_sets(id, set_key, version, checksum, status, content)")
      .eq("class_id", classId)
      .eq("status", "active")
      .order("opens_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).flatMap((row: any) => {
      const diagnosis = Array.isArray(row.diagnosis_sets) ? row.diagnosis_sets[0] : row.diagnosis_sets;
      if (!diagnosis?.content) return [];
      return [{
        id: String(row.id),
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

  async listActiveClasses(): Promise<TeacherClassRecord[]> {
    const { data, error } = await this.client
      .from("classes")
      .select("id, name, grade, semester")
      .eq("active", true)
      .order("created_at");
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      grade: Number(row.grade),
      semester: Number(row.semester)
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
    return {
      id: String(row.class_id),
      name: String(row.class_name),
      grade: input.grade,
      semester: input.semester,
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
    const { data, error } = await this.client.from("students").insert({
      class_id: input.classId,
      roster_key: input.rosterKey,
      display_alias: input.displayAlias?.trim() || null
    }).select("id, roster_key, display_alias, active").single();
    if (error) throw error;
    return {
      id: String(data.id),
      rosterKey: String(data.roster_key),
      displayAlias: data.display_alias ? String(data.display_alias) : null,
      active: Boolean(data.active)
    };
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
    const { data: auth } = await this.client.auth.getUser();
    const { error } = await this.client.from("sessions").insert({
      id: session.id,
      assignment_id: session.assignmentId,
      student_id: session.studentId,
      student_auth_uid: auth.user?.id,
      client_session_id: session.id,
      status: session.status,
      started_at: session.startedAt,
      last_event_seq: session.lastEventSeq
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

  async updateStatus(sessionId: string, status: SessionStatus, completedAt?: string): Promise<void> {
    const { error } = await this.client
      .from("sessions")
      .update({ status, completed_at: completedAt ?? null })
      .eq("id", sessionId);
    if (error) throw error;
  }

  async updateLastEventSeq(sessionId: string, lastEventSeq: number): Promise<void> {
    const { error } = await this.client.from("sessions").update({ last_event_seq: lastEventSeq }).eq("id", sessionId);
    if (error) throw error;
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
