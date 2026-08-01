import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  createMiddleOfMathClient,
  CryptoIdGenerator,
  SupabaseAssignmentRepository,
  SupabaseContentStudioRepository,
  SupabaseOperationalTelemetry,
  SupabaseReportRepository,
  SupabaseTeacherGateway,
  SupabaseTeacherInsightsRepository,
  SystemClock,
  type TeacherClassRecord,
  type TeacherProfileRecord
} from "@middle-of-math/adapters";
import { AssignDiagnosis, ExportParentReport, GenerateAssignmentInsights, LoadClassInsights } from "@middle-of-math/application";
import {
  grade3Semester1Diagnosis,
  grade3Semester2Diagnosis,
  grade4Semester1Diagnosis,
  grade4Semester2Diagnosis,
  grade5Semester1Diagnosis,
  grade5Semester2Diagnosis,
  grade6Semester1Diagnosis,
  grade6Semester2Diagnosis,
  incomingPrerequisiteEdges
} from "@middle-of-math/content/runtime";
import {
  createParentReport,
  generateClassSummary,
  interpretSession,
  type ClassSummary,
  type DiagnosisSet,
  type DiagnosisFinding,
  type JudgmentConfirmationPayload,
  type ObservationEvent,
  type ParentReport,
  type ParentReportExportRecord,
  type PublishedDiagnosisSet,
  type TeacherAssignmentEvidenceBundle,
  type TeacherAssignmentInsights,
  type TeacherDistractorNote,
  type TeacherSessionEvidence,
  type TeacherStudentReport
} from "@middle-of-math/domain";
import {
  Brand,
  ConfidenceMark,
  EmptyState,
  EvidenceRail,
  ReadableText,
  SeverityMark,
  StatusPill
} from "@middle-of-math/ui";
import {
  findChoiceNote,
  groupSummaryByUnit
} from "./teacher-report-model";
import { createPairedEvidenceDemoProfiles } from "./teacher-demo-profiles";

type Page = "summary" | "student" | "assignment" | "roster" | "settings";
type ReportMode = "teacher" | "parent";
type ClassTermKey = "3-2" | "4-1" | "4-2" | "5-1" | "5-2" | "6-1" | "6-2";
type ClassCreationInput = {
  name: string;
  grade: 3 | 4 | 5 | 6;
  semester: 1 | 2;
};

interface TeacherStudentView {
  id: string;
  rosterKey: string;
  alias: string | null;
  status: "completed" | "in_progress" | "not_started" | "interpretation_pending";
  pendingReason?: "checksum_mismatch" | "unsupported_interaction_version";
  latestCompletedSessionId?: string;
  report?: TeacherStudentReport;
  attempts: TeacherSessionEvidence[];
}

const demoMode = import.meta.env.VITE_DEMO_MODE === "true";
const requestedDemoSetKey = typeof window === "undefined"
  ? null
  : new URLSearchParams(window.location.search).get("set");
const content = demoMode && requestedDemoSetKey === "grade4-semester1"
  ? grade4Semester1Diagnosis
  : demoMode && requestedDemoSetKey === "grade4-semester2"
    ? grade4Semester2Diagnosis
    : demoMode && requestedDemoSetKey === "grade5-semester1"
      ? grade5Semester1Diagnosis
    : demoMode && requestedDemoSetKey === "grade5-semester2"
      ? grade5Semester2Diagnosis
    : demoMode && requestedDemoSetKey === "grade6-semester1"
      ? grade6Semester1Diagnosis
    : demoMode && requestedDemoSetKey === "grade6-semester2"
      ? grade6Semester2Diagnosis
    : grade3Semester2Diagnosis;
const packagedPublishedContent: PublishedDiagnosisSet = {
  id: `packaged-${content.manifest.id}-v${content.manifest.version}`,
  setKey: content.manifest.id,
  version: content.manifest.version,
  checksum: content.manifest.checksum,
  status: "published",
  content,
  publishedAt: "2026-07-22T00:00:00.000Z"
};
const grade3DemoProfiles: Record<string, Record<string, number>> = {
  "student-03": { "g3s2-frac-01": 1, "g3s2-frac-02": 1, "g3s2-graph-01": 1 },
  "student-07": { "g3s2-frac-01": 1, "g3s2-circle-02": 1, "g3s2-measure-01": 1 },
  "student-12": { "g3s2-mul-01": 1, "g3s2-div-02": 1, "g3s2-graph-01": 1 },
  "student-18": { "g3s2-frac-01": 1, "g3s2-measure-02": 1, "g3s2-graph-02": 1 }
};
const grade4DemoProfiles: Record<string, Record<string, number>> = {
  "student-03": { "g4s1-bar-05": 1, "g4s1-bar-06": 1 },
  "student-07": {
    "g4s1-muldiv-01": 1,
    "g4s1-muldiv-02": 1,
    "g4s1-bar-07": 1,
    "g4s1-bar-08": 1
  },
  "student-12": {
    "g4s1-muldiv-11": 1,
    "g4s1-muldiv-12": 1,
    "g4s1-bar-09": 1,
    "g4s1-bar-10": 1
  },
  "student-18": { "g4s1-bar-05": 1, "g4s1-bar-06": 1, "g4s1-bar-09": 1, "g4s1-bar-10": 1 }
};
const grade4Semester2DemoProfiles: Record<string, Record<string, number>> = {
  "student-03": {
    "g4s2-tri-01": 1,
    "g4s2-tri-02": 1,
    "g4s2-frac-01": 1,
    "g4s2-quad-01": 1,
    "g4s2-quad-02": 1,
    "g4s2-dec-01": 1,
    "g4s2-dec-02": 1,
    "g4s2-poly-01": 1,
    "g4s2-poly-02": 1,
    "g4s2-line-01": 1,
    "g4s2-line-02": 1
  },
  "student-07": {
    "g4s2-tri-05": 1,
    "g4s2-tri-06": 1,
    "g4s2-frac-03": 1,
    "g4s2-frac-04": 1,
    "g4s2-quad-03": 1,
    "g4s2-quad-04": 1,
    "g4s2-dec-03": 1,
    "g4s2-dec-04": 1,
    "g4s2-poly-03": 1,
    "g4s2-poly-04": 1,
    "g4s2-line-03": 1,
    "g4s2-line-04": 1
  },
  "student-12": {
    "g4s2-tri-07": 2,
    "g4s2-tri-08": 2,
    "g4s2-frac-05": 2,
    "g4s2-frac-06": 2,
    "g4s2-quad-05": 2,
    "g4s2-quad-06": 2,
    "g4s2-dec-05": 2,
    "g4s2-dec-06": 2,
    "g4s2-dec-07": 2,
    "g4s2-dec-08": 2,
    "g4s2-poly-05": 2,
    "g4s2-poly-06": 2,
    "g4s2-poly-07": 1,
    "g4s2-poly-08": 1,
    "g4s2-line-07": 2,
    "g4s2-line-08": 2
  },
  "student-18": {
    "g4s2-tri-09": 1,
    "g4s2-tri-10": 1,
    "g4s2-frac-09": 1,
    "g4s2-frac-10": 1,
    "g4s2-quad-07": 1,
    "g4s2-quad-08": 1,
    "g4s2-quad-09": 1,
    "g4s2-quad-10": 1,
    "g4s2-dec-09": 1,
    "g4s2-dec-10": 1,
    "g4s2-poly-09": 1,
    "g4s2-poly-10": 1,
    "g4s2-line-09": 1,
    "g4s2-line-10": 1
  }
};
const grade5Semester1DemoProfiles: Record<string, Record<string, number>> = {
  "student-03": {
    "g5s1-mix-01": 1,
    "g5s1-mix-02": 1,
    "g5s1-fm-01": 1,
    "g5s1-fm-02": 1,
    "g5s1-cor-01": 1,
    "g5s1-cor-02": 1,
    "g5s1-frq-01": 1,
    "g5s1-frq-02": 1,
    "g5s1-fa-01": 1,
    "g5s1-fa-02": 1
  },
  "student-07": {
    "g5s1-mix-03": 1,
    "g5s1-mix-04": 1,
    "g5s1-fm-03": 1,
    "g5s1-fm-04": 1,
    "g5s1-cor-03": 1,
    "g5s1-cor-04": 1,
    "g5s1-frq-03": 1,
    "g5s1-frq-04": 1,
    "g5s1-fa-03": 1,
    "g5s1-fa-04": 1
  },
  "student-12": { "g5s1-mix-05": 1, "g5s1-frq-05": 1, "g5s1-fa-05": 1 },
  "student-18": {
    "g5s1-mix-09": 1,
    "g5s1-mix-10": 1,
    "g5s1-fm-09": 1,
    "g5s1-fm-10": 1,
    "g5s1-cor-09": 1,
    "g5s1-cor-10": 1,
    "g5s1-frq-13": 1,
    "g5s1-frq-14": 1,
    "g5s1-fa-11": 1,
    "g5s1-fa-12": 1
  }
};
const demoProfiles = content.manifest.id === "grade4-semester1"
  ? grade4DemoProfiles
  : content.manifest.id === "grade4-semester2"
    ? grade4Semester2DemoProfiles
    : content.manifest.id === "grade5-semester1"
      ? grade5Semester1DemoProfiles
    : content.manifest.grade >= 5
      ? createPairedEvidenceDemoProfiles(content)
    : grade3DemoProfiles;

function publicConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  return url && publishableKey ? { url, publishableKey } : null;
}

const runtimeConfig = publicConfig();
const runtimeClient = runtimeConfig && !demoMode ? createMiddleOfMathClient(runtimeConfig) : null;

function makeDemoEvidence(studentId: string): ObservationEvent<JudgmentConfirmationPayload>[] {
  const profile = demoProfiles[studentId] ?? {};
  const sessionId = `demo-session-${studentId}`;
  return content.judgments.map((judgment, index) => {
    const choice = judgment.choices[profile[judgment.id] ?? 0];
    return {
      id: `${sessionId}-event-${index + 1}`,
      clientEventId: `${sessionId}-client-${index + 1}`,
      clientSeq: index + 1,
      sessionId,
      diagnosisSetId: content.manifest.id,
      diagnosisSetVersion: content.manifest.version,
      eventType: "judgment_confirmed",
      judgmentId: judgment.id,
      interaction: judgment.interaction,
      payload: {
        choiceId: choice.id,
        durationMs: 11_000 + index * 1_600,
        firstSelectionMs: 5_000 + index * 500,
        confirmationMs: 2_300,
        selectionChanges: index % 4 === 0 ? 1 : 0,
        uncertainty: false
      },
      occurredAt: `2026-07-22T0${Math.floor(index / 6) + 8}:${String(index * 4 % 60).padStart(2, "0")}:00.000Z`
    };
  });
}

const demoClass: TeacherClassRecord = {
  id: "demo-class",
  name: `${content.manifest.grade}학년 햇살반`,
  grade: content.manifest.grade,
  semester: content.manifest.semester,
  pilotEndsAt: "2026-08-21T00:00:00.000Z",
  purgeAfter: "2026-11-19T00:00:00.000Z",
  joinCode: "MATH27"
};

const demoDefinitions = [
  { id: "student-03", rosterKey: "3", alias: "민들레", status: "completed" as const },
  { id: "student-07", rosterKey: "7", alias: null, status: "completed" as const },
  { id: "student-12", rosterKey: "12", alias: "나무", status: "completed" as const },
  { id: "student-18", rosterKey: "18", alias: null, status: "completed" as const },
  { id: "student-21", rosterKey: "21", alias: "구름", status: "in_progress" as const },
  { id: "student-24", rosterKey: "24", alias: null, status: "in_progress" as const },
  { id: "student-25", rosterKey: "25", alias: null, status: "not_started" as const }
];

function createDemoInsights(): TeacherAssignmentInsights {
  const students = demoDefinitions.map((student) => {
    const events = student.status === "completed" ? makeDemoEvidence(student.id) : [];
    const session = student.status === "not_started" ? undefined : {
      id: `demo-session-${student.id}`,
      assignmentId: "demo-assignment",
      studentId: student.id,
      diagnosisSetId: content.manifest.id,
      diagnosisSetVersion: content.manifest.version,
      status: student.status === "completed" ? "completed" as const : "in_progress" as const,
      startedAt: "2026-07-22T08:00:00.000Z",
      completedAt: student.status === "completed" ? "2026-07-22T10:00:00.000Z" : undefined,
      lastEventSeq: events.length
    };
    const report = session?.status === "completed"
      ? interpretSession(content, events, undefined, "2026-07-22T10:30:00.000Z")
      : undefined;
    return {
      student: { id: student.id, rosterKey: student.rosterKey, displayAlias: student.alias, active: true },
      sessions: session ? [{ session, events, interpretationRuns: [] }] : [],
      report
    };
  });
  const bundle: TeacherAssignmentEvidenceBundle = {
    class: { ...demoClass, semester: content.manifest.semester },
    assignment: { id: "demo-assignment", classId: demoClass.id, status: "active", opensAt: "2026-07-22T00:00:00.000Z" },
    diagnosisSet: packagedPublishedContent,
    students: students.map(({ student, sessions }) => ({ student, sessions }))
  };
  const ready = students.filter((student) => student.report).map((student) => ({ studentId: student.student.id, report: student.report! }));
  return {
    bundle,
    classSummary: generateClassSummary(ready, 2, content),
    students: students.map((student) => ({
      student: student.student,
      interpretationStatus: student.report ? "ready" : student.sessions.length ? "in_progress" : "not_started",
      latestCompletedSessionId: student.report ? student.sessions[0]?.session.id : undefined,
      report: student.report
    })),
    distractorNotes: []
  };
}

const demoInsights = createDemoInsights();

export function TeacherApp() {
  const client = runtimeClient;
  const [signedIn, setSignedIn] = useState(demoMode);
  const [authReady, setAuthReady] = useState(demoMode);
  const [authError, setAuthError] = useState<string | null>(null);
  const [page, setPage] = useState<Page>("summary");
  const [profile, setProfile] = useState<TeacherProfileRecord | null>(demoMode ? { id: "demo-teacher", displayName: "김수학", email: "demo@middleofmath.local" } : null);
  const [roster, setRoster] = useState<TeacherStudentView[]>(demoMode ? mapInsightsToStudents(demoInsights) : []);
  const [selectedStudentId, setSelectedStudentId] = useState("student-03");
  const [reportMode, setReportMode] = useState<ReportMode>("teacher");
  const [selectedFinding, setSelectedFinding] = useState<DiagnosisFinding | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [publishedContents, setPublishedContents] = useState<PublishedDiagnosisSet[]>(demoMode ? [packagedPublishedContent] : []);
  const [teacherClasses, setTeacherClasses] = useState<TeacherClassRecord[]>(demoMode ? [demoClass] : []);
  const [selectedClassId, setSelectedClassId] = useState(demoMode ? demoClass.id : "");
  const [assignmentBundles, setAssignmentBundles] = useState<TeacherAssignmentEvidenceBundle[]>(demoMode ? [demoInsights.bundle] : []);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(demoMode ? demoInsights.bundle.assignment.id : "");
  const [insights, setInsights] = useState<TeacherAssignmentInsights | null>(demoMode ? demoInsights : null);
  const [loadState, setLoadState] = useState<"idle" | "syncing" | "error">("idle");
  const [exportingParentReport, setExportingParentReport] = useState(false);
  const [printExport, setPrintExport] = useState<ParentReportExportRecord | null>(null);
  const loadGeneration = useRef(0);
  const authGeneration = useRef(0);
  const selectedClassIdRef = useRef(selectedClassId);
  const selectedAssignmentIdRef = useRef(selectedAssignmentId);
  const authUserIdRef = useRef<string | null>(demoMode ? "demo-teacher" : null);

  const students = insights ? mapInsightsToStudents(insights) : roster;
  const summary: ClassSummary = insights?.classSummary ?? { completedStudents: 0, inProgressStudents: 0, items: [] };
  const selectedClass = teacherClasses.find((item) => item.id === selectedClassId) ?? teacherClasses[0];
  const selectedBundle = assignmentBundles.find((item) => item.assignment.id === selectedAssignmentId) ?? assignmentBundles[0];
  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? students[0];
  const parentReport = selectedStudent?.report
    ? createParentReport(selectedBundle?.diagnosisSet.content ?? content, selectedStudent.report, parentStudentLabel(selectedStudent))
    : null;

  useEffect(() => {
    selectedClassIdRef.current = selectedClassId;
  }, [selectedClassId]);

  useEffect(() => {
    selectedAssignmentIdRef.current = selectedAssignmentId;
  }, [selectedAssignmentId]);

  useEffect(() => {
    if (!printExport) return;
    const clearSnapshot = () => setPrintExport(null);
    window.addEventListener("afterprint", clearSnapshot, { once: true });
    const timer = window.setTimeout(() => window.print(), 0);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", clearSnapshot);
    };
  }, [printExport]);

  useEffect(() => {
    if (!client) return;
    let active = true;
    const clearTeacherData = () => {
      ++loadGeneration.current;
      setProfile(null);
      setPublishedContents([]);
      setTeacherClasses([]);
      selectedClassIdRef.current = "";
      setSelectedClassId("");
      setRoster([]);
      setAssignmentBundles([]);
      selectedAssignmentIdRef.current = "";
      setSelectedAssignmentId("");
      setInsights(null);
      setPrintExport(null);
      setExportingParentReport(false);
      setNotice(null);
      setLoadState("idle");
    };
    const loadTeacherData = async (expectedUserId: string, generation: number) => {
      const gateway = new SupabaseTeacherGateway(client);
      setLoadState("syncing");
      const [teacherProfile, contents, classesResult] = await Promise.all([
        gateway.getCurrentTeacherProfile(),
        new SupabaseContentStudioRepository(client).listPublished(),
        gateway.listActiveClasses()
      ]);
      if (!active || generation !== authGeneration.current || teacherProfile.id !== expectedUserId) return;
      setProfile(teacherProfile);
      setPublishedContents(contents.filter((row) => row.status === "published"));
      setTeacherClasses(classesResult);
      const firstClass = classesResult[0];
      selectedClassIdRef.current = firstClass?.id ?? "";
      setSelectedClassId(firstClass?.id ?? "");
      if (firstClass) {
        await loadClassContext(firstClass.id);
        if (!active || generation !== authGeneration.current) return;
      }
      else {
        setRoster([]);
        setAssignmentBundles([]);
        setSelectedAssignmentId("");
        setInsights(null);
        setLoadState("idle");
      }
    };
    const handleSession = (session: { user: { id: string } } | null) => {
      const nextUserId = session?.user.id ?? null;
      setSignedIn(Boolean(session));
      setAuthReady(true);
      if (nextUserId === authUserIdRef.current) return;
      authUserIdRef.current = nextUserId;
      const generation = ++authGeneration.current;
      clearTeacherData();
      if (!session) {
        return;
      }
      void loadTeacherData(session.user.id, generation)
        .catch(() => {
          if (!active || generation !== authGeneration.current) return;
          setLoadState("error");
          setNotice("교사 프로필과 클래스 데이터를 불러오지 못했습니다.");
        });
    };
    void client.auth.getSession().then(({ data }) => {
      if (!active) return;
      handleSession(data.session);
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      handleSession(session);
    });
    return () => {
      active = false;
      ++authGeneration.current;
      ++loadGeneration.current;
      data.subscription.unsubscribe();
    };
  }, [client]);

  async function loadClassContext(classId: string, preferredAssignmentId?: string): Promise<void> {
    if (!client) return;
    const generation = ++loadGeneration.current;
    setLoadState("syncing");
    const gateway = new SupabaseTeacherGateway(client);
    const repository = new SupabaseTeacherInsightsRepository(client);
    try {
      const [studentRows, bundles] = await Promise.all([
        gateway.listStudents(classId),
        new LoadClassInsights(repository).execute(classId)
      ]);
      if (generation !== loadGeneration.current) return;
      setRoster(studentRows.map((student) => ({ id: student.id, rosterKey: student.rosterKey, alias: student.displayAlias, status: "not_started", attempts: [] })));
      setAssignmentBundles(bundles);
      const target = bundles.find((bundle) => bundle.assignment.id === preferredAssignmentId) ?? bundles[0];
      selectedAssignmentIdRef.current = target?.assignment.id ?? "";
      setSelectedAssignmentId(target?.assignment.id ?? "");
      if (!target) {
        setInsights(null);
        setLoadState("idle");
        return;
      }
      await loadAssignmentInsights(target.assignment.id, generation);
    } catch (error) {
      if (generation !== loadGeneration.current) return;
      setLoadState("error");
      throw error;
    }
  }

  async function loadAssignmentInsights(assignmentId: string, generation = ++loadGeneration.current): Promise<void> {
    if (!client) return;
    setLoadState("syncing");
    try {
      const next = await new GenerateAssignmentInsights(
        new SupabaseTeacherInsightsRepository(client),
        new SupabaseReportRepository(client),
        new SystemClock()
      ).execute(assignmentId);
      if (generation !== loadGeneration.current) return;
      const pendingReasons = new Set(next.students.map((student) => student.pendingReason).filter(Boolean));
      if (pendingReasons.has("checksum_mismatch")) {
        void new SupabaseOperationalTelemetry(client).record({ app: "teacher", event: "interpretation.checksum_failed" }).catch(() => undefined);
      }
      if (pendingReasons.has("unsupported_interaction_version")) {
        void new SupabaseOperationalTelemetry(client).record({ app: "teacher", event: "interpretation.unsupported" }).catch(() => undefined);
      }
      setInsights(next);
      setSelectedStudentId((current) => next.students.some((student) => student.student.id === current) ? current : next.students[0]?.student.id ?? "");
      setLoadState("idle");
    } catch (error) {
      if (generation !== loadGeneration.current) return;
      void new SupabaseOperationalTelemetry(client).record({ app: "teacher", event: "interpretation.failed" }).catch(() => undefined);
      setInsights(null);
      setLoadState("error");
      throw error;
    }
  }

  async function changeClass(classId: string): Promise<void> {
    selectedClassIdRef.current = classId;
    setSelectedClassId(classId);
    setSelectedFinding(null);
    await loadClassContext(classId).catch(() => setNotice("선택한 클래스의 기록을 불러오지 못했습니다."));
  }

  async function changeAssignment(assignmentId: string): Promise<void> {
    selectedAssignmentIdRef.current = assignmentId;
    setSelectedAssignmentId(assignmentId);
    setSelectedFinding(null);
    await loadAssignmentInsights(assignmentId).catch(() => setNotice("선택한 배정은 지금 해석할 수 없습니다."));
  }

  async function signIn(email: string, password: string) {
    if (!client) return;
    setAuthError(null);
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError("이메일과 비밀번호를 확인해 주세요.");
      return;
    }
    setSignedIn(true);
    setAuthReady(true);
  }

  async function signOut(): Promise<void> {
    if (!client) return;
    ++authGeneration.current;
    ++loadGeneration.current;
    setPrintExport(null);
    const { error } = await client.auth.signOut();
    if (error) setNotice("로그아웃하지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
  }

  function openStudent(studentId: string, finding?: DiagnosisFinding) {
    setSelectedStudentId(studentId);
    setSelectedFinding(finding ?? null);
    setReportMode("teacher");
    setPage("student");
  }

  async function addStudent(rosterKey: string, alias: string): Promise<void> {
    if (students.some((student) => student.rosterKey === rosterKey)) {
      setNotice("이미 사용 중인 번호입니다.");
      return;
    }
    const targetClass = selectedClass;
    if (!targetClass) throw new Error("학생을 추가할 클래스를 먼저 만들어 주세요.");
    const mutationAuthGeneration = authGeneration.current;
    const saved = client
      ? await new SupabaseTeacherGateway(client).addStudent({ classId: targetClass.id, rosterKey, displayAlias: alias })
      : { id: `local-${crypto.randomUUID()}`, rosterKey, displayAlias: alias || null, active: true, joinSecret: "STAR27" };
    if (mutationAuthGeneration !== authGeneration.current) return;
    if (selectedClassIdRef.current !== targetClass.id) {
      setNotice(`${targetClass.name}에 ${rosterKey}번을 추가했습니다. 개인 코드 ${saved.joinSecret}은 지금 한 번만 안전하게 전달해 주세요.`);
      return;
    }
    const newStudent: TeacherStudentView = { id: saved.id, rosterKey: saved.rosterKey, alias: saved.displayAlias, status: "not_started", attempts: [] };
    setRoster((current) => [...current, newStudent].sort((a, b) => Number(a.rosterKey) - Number(b.rosterKey)));
    if (client) await loadClassContext(targetClass.id, selectedAssignmentIdRef.current);
    if (mutationAuthGeneration !== authGeneration.current) return;
    setNotice(`${rosterKey}번을 추가했습니다. 개인 코드 ${saved.joinSecret}은 지금 한 번만 안전하게 전달해 주세요.`);
  }

  async function rotateStudentJoinSecret(studentId: string): Promise<void> {
    const student = students.find((item) => item.id === studentId);
    if (!student) throw new Error("학생을 찾을 수 없습니다.");
    const targetClassName = selectedClass?.name ?? "선택한 클래스";
    const mutationAuthGeneration = authGeneration.current;
    const joinSecret = client
      ? await new SupabaseTeacherGateway(client).rotateStudentJoinSecret(studentId)
      : "NEW527";
    if (mutationAuthGeneration !== authGeneration.current) return;
    setNotice(`${targetClassName} ${student.rosterKey}번의 새 개인 코드 ${joinSecret}입니다. 이전 코드는 즉시 사용할 수 없습니다.`);
  }

  async function createTeacherClass(input: ClassCreationInput): Promise<void> {
    if (!client) {
      setTeacherClasses([{
        ...demoClass,
        name: input.name,
        grade: input.grade,
        semester: input.semester
      }]);
      setNotice(`${input.name}을 만들었습니다. 입장 코드 MATH27`);
      return;
    }
    const mutationAuthGeneration = authGeneration.current;
    const created = await new SupabaseTeacherGateway(client).createClass(input);
    if (mutationAuthGeneration !== authGeneration.current) return;
    setTeacherClasses((current) => [...current, created]);
    selectedClassIdRef.current = created.id;
    setSelectedClassId(created.id);
    await loadClassContext(created.id);
    if (mutationAuthGeneration !== authGeneration.current) return;
    setNotice(`${created.name}을 만들었습니다. 입장 코드 ${created.joinCode}는 지금 안전하게 전달해 주세요.`);
  }

  async function rotateJoinCode(): Promise<void> {
    const targetClass = selectedClass;
    if (!targetClass) throw new Error("활성 클래스가 없습니다.");
    const mutationAuthGeneration = authGeneration.current;
    const joinCode = client
      ? await new SupabaseTeacherGateway(client).rotateJoinCode(targetClass.id)
      : "NEW527";
    if (mutationAuthGeneration !== authGeneration.current) return;
    setTeacherClasses((current) => current.map((item) => item.id === targetClass.id ? { ...item, joinCode } : item));
    setNotice(`${targetClass.name}의 새 입장 코드 ${joinCode}를 만들었습니다. 이전 코드는 즉시 사용할 수 없습니다.`);
  }

  async function assignDiagnosis(input: {
    diagnosis: PublishedDiagnosisSet;
    classId: string;
    opensAt: string;
    closesAt?: string;
  }): Promise<void> {
    if (!client) {
      setNotice(`${input.diagnosis.content.manifest.title} v${input.diagnosis.version}을 데모 클래스에 배정했습니다.`);
      return;
    }
    const mutationAuthGeneration = authGeneration.current;
    await new AssignDiagnosis(
      new SupabaseAssignmentRepository(client),
      new SystemClock(),
      new CryptoIdGenerator()
    ).execute({
      classId: input.classId,
      diagnosisSetId: input.diagnosis.setKey,
      diagnosisSetVersion: input.diagnosis.version,
      opensAt: input.opensAt,
      closesAt: input.closesAt
    });
    if (mutationAuthGeneration !== authGeneration.current) return;
    const targetClass = teacherClasses.find((item) => item.id === input.classId);
    if (selectedClassIdRef.current === input.classId) await loadClassContext(input.classId, selectedAssignmentIdRef.current);
    if (mutationAuthGeneration !== authGeneration.current) return;
    setNotice(`${input.diagnosis.content.manifest.title} v${input.diagnosis.version}을 ${targetClass?.name ?? "클래스"}에 배정했습니다.`);
  }

  async function exportParentReport(): Promise<void> {
    if (!selectedStudent?.latestCompletedSessionId || !profile || !parentReport) return;
    const sessionId = selectedStudent.latestCompletedSessionId;
    const reviewedBy = profile.id;
    const mutationAuthGeneration = authGeneration.current;
    setExportingParentReport(true);
    if (!client) {
      setPrintExport({
        id: `demo-export-${crypto.randomUUID()}`,
        sessionId,
        interpretationRunId: "demo-interpretation",
        reviewedBy,
        generatedAt: new Date().toISOString(),
        report: parentReport
      });
      setExportingParentReport(false);
      return;
    }
    try {
      const snapshot = await new ExportParentReport(
        new SupabaseTeacherInsightsRepository(client),
        new SupabaseReportRepository(client),
        new CryptoIdGenerator(),
        new SystemClock()
      ).execute({ sessionId, reviewedBy });
      if (mutationAuthGeneration !== authGeneration.current) return;
      setPrintExport(snapshot);
      setNotice("교사 검토 시점의 학부모 공유본을 기록했습니다. 인쇄 창을 엽니다.");
    } catch (error) {
      if (mutationAuthGeneration === authGeneration.current) {
        setNotice(error instanceof Error ? error.message : "학부모 공유본을 만들지 못했습니다.");
      }
    } finally {
      if (mutationAuthGeneration === authGeneration.current) {
        setExportingParentReport(false);
      }
    }
  }

  if (!client && !demoMode) return <TeacherConfigurationError />;
  if (!authReady) return <main className="teacher-auth-loading"><Brand /><p>교사 계정을 확인하고 있습니다.</p></main>;
  if (!signedIn) return <TeacherLogin onSubmit={signIn} error={authError} />;

  return (<>
    <div className="teacher-shell" aria-busy={exportingParentReport}>
      <aside className="teacher-sidebar">
        <Brand />
        <div className="teacher-class-switcher">
          <span>현재 클래스</span>
          <strong>{selectedClass?.name ?? "클래스 없음"}</strong>
          <small>{selectedClass?.joinCode ? `입장 코드 ${selectedClass.joinCode}` : "코드는 재발급할 때만 표시됩니다"}</small>
        </div>
        <nav aria-label="교사 메뉴">
          <NavButton active={page === "summary"} onClick={() => setPage("summary")} icon="∑">반 요약</NavButton>
          <NavButton active={page === "student"} onClick={() => setPage("student")} icon="↳">학생 리포트</NavButton>
          <NavButton active={page === "assignment"} onClick={() => setPage("assignment")} icon="＋">진단 배정</NavButton>
          <NavButton active={page === "roster"} onClick={() => setPage("roster")} icon="№">클래스·학생</NavButton>
          <NavButton active={page === "settings"} onClick={() => setPage("settings")} icon="·">설정</NavButton>
        </nav>
        <div className="teacher-sidebar-foot">
          <StatusPill tone={demoMode ? "warning" : "accent"}>{demoMode ? "로컬 데모" : "실제 기록"}</StatusPill>
          <span>교사 {profile?.displayName ?? "불러오는 중"}</span>
          {!demoMode && <button className="mom-button mom-button-quiet teacher-sign-out" onClick={() => void signOut()}>로그아웃</button>}
        </div>
      </aside>
      <main className="teacher-main">
        {notice && <div className="teacher-notice" role="status">{notice}<button onClick={() => setNotice(null)} aria-label="알림 닫기">×</button></div>}
        <TeacherContextBar classes={teacherClasses} assignments={assignmentBundles} selectedClassId={selectedClassId} selectedAssignmentId={selectedAssignmentId} state={loadState} onClassChange={changeClass} onAssignmentChange={changeAssignment} />
        {page === "summary" && <ClassSummaryPage students={students} summary={summary} selectedClass={selectedClass} selectedBundle={selectedBundle} state={loadState} onOpenStudent={openStudent} />}
        {page === "student" && (selectedStudent ? <StudentReportPage student={selectedStudent} students={students} diagnosisSet={selectedBundle?.diagnosisSet.content ?? content} choiceNotes={insights?.distractorNotes ?? []} reportMode={reportMode} parentReport={parentReport} selectedFinding={selectedFinding} exporting={exportingParentReport} onExport={exportParentReport} onStudentChange={(id) => openStudent(id)} onModeChange={setReportMode} onFindingSelect={setSelectedFinding} /> : <div className="teacher-page"><EmptyState title="학생이 없습니다" description="클래스·학생 화면에서 번호를 먼저 추가해 주세요." /></div>)}
        {page === "assignment" && <AssignmentPage diagnosisSets={publishedContents} classes={teacherClasses} onAssigned={assignDiagnosis} onCreateClass={createTeacherClass} />}
        {page === "roster" && <RosterPage students={students} classes={teacherClasses} selectedClass={selectedClass} onAdd={addStudent} onCreateClass={createTeacherClass} onRotate={rotateJoinCode} onRotateStudent={rotateStudentJoinSecret} />}
        {page === "settings" && <SettingsPage profile={profile} selectedClass={selectedClass} />}
      </main>
    </div>
    {exportingParentReport && <div className="teacher-export-lock" role="status">검토한 공유본을 고정하고 있습니다…</div>}
    {printExport && <div className="teacher-export-print"><ParentShareDocument report={printExport.report} /></div>}
  </>);
}

function TeacherConfigurationError() {
  return <main className="teacher-auth-loading"><Brand /><div className="mom-panel"><div className="mom-panel-body mom-stack"><h1>교사 앱 설정이 필요합니다</h1><p className="mom-muted">운영 환경에는 Supabase URL과 publishable key를 설정해 주세요. 로컬 데모는 <code>VITE_DEMO_MODE=true</code>에서만 열립니다.</p></div></div></main>;
}

function TeacherLogin({ onSubmit, error }: { onSubmit: (email: string, password: string) => Promise<void>; error: string | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <main className="teacher-login">
      <section className="teacher-login-copy">
        <Brand />
        <p className="mom-eyebrow">교사 대시보드</p>
        <h1>정답보다<br />생각의 중간을 봅니다</h1>
        <p>반복해서 나타난 판단 신호부터 보고, 학생의 근거까지 한 단계씩 내려갑니다.</p>
      </section>
      <form className="mom-panel teacher-login-form" onSubmit={(event) => { event.preventDefault(); void onSubmit(email, password); }}>
        <div className="mom-panel-body mom-stack-lg">
          <div><p className="mom-eyebrow">Invited teachers only</p><h2>교사 로그인</h2><p className="mom-muted">파일럿은 관리자에게 초대받은 교사만 사용할 수 있습니다.</p></div>
          <label className="mom-input-group">이메일<input className="mom-input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label className="mom-input-group">비밀번호<input className="mom-input" type="password" minLength={8} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <p className="mom-form-error" role="alert">{error}</p>}
          <button className="mom-button mom-button-primary mom-button-block">로그인</button>
        </div>
      </form>
    </main>
  );
}

function TeacherContextBar({ classes, assignments, selectedClassId, selectedAssignmentId, state, onClassChange, onAssignmentChange }: {
  classes: TeacherClassRecord[];
  assignments: TeacherAssignmentEvidenceBundle[];
  selectedClassId: string;
  selectedAssignmentId: string;
  state: "idle" | "syncing" | "error";
  onClassChange: (classId: string) => Promise<void>;
  onAssignmentChange: (assignmentId: string) => Promise<void>;
}) {
  const active = assignments.find((bundle) => bundle.assignment.id === selectedAssignmentId);
  return (
    <section className="teacher-context-spine" aria-label="리포트 범위">
      <div className="teacher-context-index">01</div>
      <label><span>클래스</span><select aria-label="현재 클래스" value={selectedClassId} disabled={!classes.length || state === "syncing"} onChange={(event) => void onClassChange(event.target.value)}>{classes.length ? classes.map((item) => <option value={item.id} key={item.id}>{item.name}</option>) : <option value="">클래스 없음</option>}</select></label>
      <div className="teacher-context-arrow" aria-hidden="true">→</div>
      <label><span>배정</span><select aria-label="현재 배정" value={selectedAssignmentId} disabled={!assignments.length || state === "syncing"} onChange={(event) => void onAssignmentChange(event.target.value)}>{assignments.length ? assignments.map((bundle) => <option value={bundle.assignment.id} key={bundle.assignment.id}>{bundle.diagnosisSet.content.manifest.shortTitle} · v{bundle.diagnosisSet.version} · {formatDate(bundle.assignment.opensAt)}</option>) : <option value="">배정 없음</option>}</select></label>
      <div className="teacher-context-proof"><span>{state === "syncing" ? "동기화 중" : state === "error" ? "불러오기 실패" : active ? "버전 고정" : "배정 대기"}</span><strong>{active ? `${active.diagnosisSet.checksum.slice(0, 10)}…` : "—"}</strong></div>
    </section>
  );
}

function ClassSummaryPage({ students, summary, selectedClass, selectedBundle, state, onOpenStudent }: { students: TeacherStudentView[]; summary: ClassSummary; selectedClass?: TeacherClassRecord; selectedBundle?: TeacherAssignmentEvidenceBundle; state: "idle" | "syncing" | "error"; onOpenStudent: (studentId: string, finding?: DiagnosisFinding) => void }) {
  const pending = students.filter((student) => student.status === "interpretation_pending").length;
  const unitGroups = groupSummaryByUnit(summary);
  return (
    <div className="teacher-page mom-stack-lg">
      <PageHeader eyebrow={`${selectedClass?.name ?? "클래스 선택 필요"} · ${selectedBundle?.diagnosisSet.content.manifest.title ?? "배정 선택 필요"}`} title="반에서 함께 다시 볼 생각" description="학생별 최신 완료 세션만 모았습니다. 진행 중·해석 대기 기록은 신호 집계에 넣지 않습니다." />
      <section className="teacher-metrics" aria-label="진단 현황">
        <Metric value={`${summary.completedStudents}명`} label="완료·해석" />
        <Metric value={`${summary.inProgressStudents}명`} label="진행 중" />
        <Metric value={`${students.filter((student) => student.status === "not_started").length}명`} label="시작 전" />
        <Metric value={pending ? `${pending}명` : `${selectedBundle?.diagnosisSet.content.judgments.length ?? 0}개`} label={pending ? "해석 대기" : "판단 단위"} />
      </section>
      {!selectedClass && <EmptyState title="첫 클래스를 만들어 주세요" description="클래스·학생 화면에서 학년·학기를 선택해 파일럿 클래스를 만들 수 있습니다." />}
      {selectedClass && !selectedBundle && state !== "syncing" && <EmptyState title="아직 배정된 진단이 없습니다" description="진단 배정 화면에서 검수 완료된 콘텐츠 버전을 이 클래스에 배정해 주세요." />}
      {state === "error" && <EmptyState title="기록을 불러오지 못했습니다" description="네트워크 연결을 확인한 뒤 클래스나 배정을 다시 선택해 주세요." />}
      {pending > 0 && <div className="teacher-pending-note" role="status"><strong>{pending}명 해석 대기</strong><span>콘텐츠 checksum 또는 상호작용 버전을 확인한 뒤 새 엔진 실행으로 다시 해석합니다. 원본 이벤트는 바꾸지 않습니다.</span></div>}
      {selectedBundle && state !== "error" && (
      <section className="mom-panel teacher-summary-panel">
        <div className="mom-panel-header"><div><p className="mom-eyebrow">Common signals</p><h2>학생 수가 많은 순서</h2></div><span className="mom-caption">{summary.items[0] ? "최신 엔진 해석" : "집계할 반복 신호 없음"}</span></div>
        <div className="teacher-summary-list">
          {!summary.items.length && <EmptyState title={state === "syncing" ? "실제 기록을 동기화하고 있습니다" : "함께 다시 볼 반복 신호가 없습니다"} description={state === "syncing" ? "세션, 이벤트, 콘텐츠 버전을 확인하고 있습니다." : "완료 기록이 생기거나 반복 신호가 나타나면 이곳에 표시됩니다."} />}
          {unitGroups.map((group) => (
            <section className="teacher-summary-unit" key={group.unitId}>
              <header><span>{String(group.unitOrder).padStart(2, "0")}</span><h3>{group.unitOrder}단원 · {group.unitTitle}</h3><small>{group.items.length}개 신호</small></header>
              {group.items.map((item, index) => {
                const related = students.filter((student) => item.studentIds.includes(student.id) && student.report);
                return (
                  <article className="teacher-summary-row" key={item.signalId}>
                    <span className="teacher-rank">{String(index + 1).padStart(2, "0")}</span>
                    <div className="teacher-summary-copy"><div className="mom-row-between"><h3>{item.title}</h3><SeverityMark severity={item.severity} /></div><p>{item.interpretation}</p><strong className="teacher-move">다음 수업 · {item.teachingMove}</strong></div>
                    <div className="teacher-summary-count"><span>반복 확인 {item.confirmedStudentCount}명 · 추가 관찰 {item.tentativeStudentCount}명</span></div>
                    <div className="teacher-student-links">{related.map((student) => <button key={student.id} onClick={() => onOpenStudent(student.id, student.report?.findings.find((finding) => finding.signalId === item.signalId))}>{studentLabel(student)}</button>)}</div>
                  </article>
                );
              })}
            </section>
          ))}
        </div>
      </section>
      )}
    </div>
  );
}

function StudentReportPage({ student, students, diagnosisSet, choiceNotes, reportMode, parentReport, selectedFinding, exporting, onExport, onStudentChange, onModeChange, onFindingSelect }: { student: TeacherStudentView; students: TeacherStudentView[]; diagnosisSet: DiagnosisSet; choiceNotes: TeacherDistractorNote[]; reportMode: ReportMode; parentReport: ParentReport | null; selectedFinding: DiagnosisFinding | null; exporting: boolean; onExport: () => Promise<void>; onStudentChange: (id: string) => void; onModeChange: (mode: ReportMode) => void; onFindingSelect: (finding: DiagnosisFinding | null) => void }) {
  const report = student.report;
  const attempts = [...student.attempts].sort((a, b) => b.session.startedAt.localeCompare(a.session.startedAt));
  return (
    <div className={`teacher-page mom-stack-lg ${reportMode === "parent" ? "is-parent-preview" : ""}`}>
      <PageHeader eyebrow="학생 리포트" title={studentLabel(student)} description="교사용 근거 리포트와 학부모 공유용 요약은 목적과 문장을 분리합니다." action={<select className="mom-input teacher-student-select" value={student.id} onChange={(event) => onStudentChange(event.target.value)}>{students.map((item) => <option key={item.id} value={item.id}>{studentLabel(item)}</option>)}</select>} />
      <div className="teacher-report-tabs" role="tablist">
        <button role="tab" aria-selected={reportMode === "teacher"} onClick={() => onModeChange("teacher")}>교사용 근거 리포트</button>
        <button role="tab" aria-selected={reportMode === "parent"} onClick={() => onModeChange("parent")}>학부모 공유 리포트</button>
      </div>
      {student.status === "interpretation_pending" && <EmptyState title="해석 대기 중입니다" description={student.pendingReason === "checksum_mismatch" ? "배정된 콘텐츠 checksum을 확인하고 있습니다. 이 기록은 반 요약에 포함되지 않습니다." : "현재 엔진이 지원하지 않는 상호작용 버전입니다. 지원 엔진 배포 뒤 새 해석 실행을 만듭니다."} />}
      {!report && student.status !== "interpretation_pending" && <EmptyState title="완료된 기록이 아직 없습니다" description="학생이 활동을 마치면 교사용 근거와 학부모용 요약을 따로 만들 수 있습니다." />}
      {report && reportMode === "teacher" && <TeacherEvidenceReport report={report} diagnosisSet={diagnosisSet} choiceNotes={choiceNotes} selectedFinding={selectedFinding} onFindingSelect={onFindingSelect} />}
      {report && reportMode === "parent" && parentReport && <ParentShareReport report={parentReport} exporting={exporting} onExport={onExport} />}
      <section className="mom-panel teacher-attempts"><div className="mom-panel-header"><div><p className="mom-eyebrow">Attempt history</p><h2>시도 이력</h2></div><span className="mom-caption">최신 완료 1건만 반 요약에 사용</span></div>{attempts.length ? <ol>{attempts.map((attempt) => <li key={attempt.session.id}><div><strong>{formatDateTime(attempt.session.startedAt)}</strong><span>{attempt.session.completedAt ? `완료 ${formatDateTime(attempt.session.completedAt)}` : "진행 중"}</span></div><StatusPill tone={attempt.session.id === student.latestCompletedSessionId ? "accent" : attempt.session.status === "completed" ? "neutral" : "warning"}>{attempt.session.id === student.latestCompletedSessionId ? "현재 해석" : attempt.session.status === "completed" ? "이전 완료" : "진행 중"}</StatusPill></li>)}</ol> : <p className="mom-panel-body mom-muted">아직 시작한 시도가 없습니다.</p>}</section>
    </div>
  );
}

function TeacherEvidenceReport({ report, diagnosisSet, choiceNotes, selectedFinding, onFindingSelect }: { report: TeacherStudentReport; diagnosisSet: DiagnosisSet; choiceNotes: TeacherDistractorNote[]; selectedFinding: DiagnosisFinding | null; onFindingSelect: (finding: DiagnosisFinding | null) => void }) {
  const finding = selectedFinding ?? report.findings[0];
  const evidence = finding?.evidence[0];
  const judgment = evidence ? diagnosisSet.judgments.find((item) => item.id === evidence.judgmentId) : null;
  const stage = judgment ? diagnosisSet.learnerStages.find((item) => item.id === judgment.learnerStageId) : null;
  const anchor = judgment ? diagnosisSet.curriculumAnchors.find((item) => item.id === judgment.curriculumAnchorIds[0]) : null;
  const choiceNote = demoMode
    ? {
        title: "로컬 데모 안내",
        text: "로컬 데모에서는 오답 해석을 불러오지 않습니다. 실제 기록에서만 표시됩니다."
      }
    : findChoiceNote(choiceNotes, evidence);
  const prerequisiteStages = stage
    ? incomingPrerequisiteEdges(diagnosisSet.manifest.id, stage.id)
        .map((edge) => {
          const prerequisite = grade3Semester1Diagnosis.learnerStages.find(
            (item) => item.id === edge.fromStageId
          );
          const prerequisiteAnchor = prerequisite
            ? grade3Semester1Diagnosis.curriculumAnchors.find(
                (item) => item.id === prerequisite.curriculumAnchorIds[0]
              )
            : null;
          return prerequisite && prerequisiteAnchor
            ? { edge, prerequisite, prerequisiteAnchor }
            : null;
        })
        .filter((item) => item !== null)
    : [];
  return (
    <div className="teacher-report-grid">
      <section className="mom-panel">
        <div className="mom-panel-header"><div><p className="mom-eyebrow">Observed signals</p><h2>우선 살펴볼 판단</h2></div><span className="mom-caption">관찰 {report.observedJudgmentCount} · 반복 확인 {report.confirmedFindingCount} · 추가 관찰 {report.tentativeFindingCount}</span></div>
        <div className="teacher-findings">
          {report.findings.map((item) => <button key={item.signalId} className={finding?.signalId === item.signalId ? "is-active" : ""} onClick={() => onFindingSelect(item)}><span><strong>{item.title}</strong><small>근거 {item.evidenceCount}개</small></span><span className="teacher-finding-marks"><ConfidenceMark confidence={item.confidence} /><SeverityMark severity={item.severity} /></span></button>)}
        </div>
      </section>
      <section className="mom-panel teacher-evidence-panel">
        {finding && evidence && judgment && stage && anchor ? <>
          <div className="mom-panel-header"><div><p className="mom-eyebrow">Evidence trail</p><h2>{finding.title}</h2></div><span className="teacher-finding-marks"><ConfidenceMark confidence={finding.confidence} /><SeverityMark severity={finding.severity} /></span></div>
          <div className="mom-panel-body mom-stack-lg">
            <p className="teacher-interpretation">{finding.interpretation}</p>
            <p className="teacher-confidence-rule">{finding.confirmationRule}</p>
            <EvidenceRail anchor={`${anchor.id} ${anchor.label}`} stage={stage.title} evidence={evidence} choiceNote={choiceNote} />
            {!choiceNote && <p className="teacher-choice-note-empty">이 근거에는 오답 해석이 없습니다.</p>}
            {prerequisiteStages.length > 0 && (
              <aside className="teacher-prerequisite-note">
                <span>먼저 확인할 이전 학기 단계 (편집 참고)</span>
                <ul>
                  {prerequisiteStages.map(({ edge, prerequisite, prerequisiteAnchor }) => (
                    <li key={edge.id}>
                      <strong>{prerequisite.shortTitle}</strong>
                      <small>{prerequisiteAnchor.id} · 참고</small>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
            <div className="teacher-question-evidence"><span>학생이 본 판단</span><strong><ReadableText text={judgment.prompt} /></strong></div>
            <div className="teacher-next-move"><span>다음 수업에서</span><p>{finding.teachingMove}</p></div>
          </div>
          <footer className="teacher-report-meta">콘텐츠 {report.diagnosisSetVersion} · 해석 {report.engineVersion} · {formatDate(report.generatedAt)}</footer>
        </> : <EmptyState title="관찰 신호가 없습니다" description="이 기록에서는 우선 확인할 반복 신호가 나타나지 않았습니다." />}
      </section>
    </div>
  );
}

function ParentShareReport({ report, exporting, onExport }: { report: ParentReport; exporting: boolean; onExport: () => Promise<void> }) {
  return <ParentShareDocument report={report} action={<button className="mom-button mom-button-secondary parent-print-button" disabled={exporting} onClick={() => void onExport()}>{exporting ? "공유본 기록 중…" : "검토 완료 · 인쇄/PDF"}</button>} />;
}

function ParentShareDocument({ report, action }: { report: ParentReport; action?: ReactNode }) {
  return (
    <section className="parent-report-paper">
      <header><div><p className="mom-eyebrow">Middle of Math · 가정 공유용</p><h1>{report.studentLabel}의 수학 생각 기록</h1><p>{report.diagnosisTitle} · {formatDate(report.generatedAt)}</p></div>{action}</header>
      <div className="parent-report-intro"><span aria-hidden="true">∴</span><p>{report.participation}<br />{report.closing}</p></div>
      <section><p className="parent-section-number">01</p><h2>지금 잘 이어가고 있어요</h2><ul>{report.strengths.map((strength) => <li key={strength}>{strength}</li>)}</ul></section>
      <section><p className="parent-section-number">02</p><h2>함께 연습하고 있어요</h2><div className="parent-support-list">{report.supportAreas.map((area) => <article key={area.title}><h3>{area.title}</h3><p>{area.observation}</p><strong>집에서 이렇게 물어봐 주세요</strong><p>{area.homePrompt}</p></article>)}</div></section>
      <footer>{report.disclaimer}<br />학생 번호, 클래스 코드, 정오답 수는 이 공유 문서에 포함하지 않습니다.</footer>
    </section>
  );
}

function AssignmentPage({ diagnosisSets, classes, onAssigned, onCreateClass }: {
  diagnosisSets: PublishedDiagnosisSet[];
  classes: TeacherClassRecord[];
  onAssigned: (input: { diagnosis: PublishedDiagnosisSet; classId: string; opensAt: string; closesAt?: string }) => Promise<void>;
  onCreateClass: (input: ClassCreationInput) => Promise<void>;
}) {
  const [step, setStep] = useState(1);
  const [selectedId, setSelectedId] = useState(diagnosisSets[0]?.id ?? "");
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id ?? "");
  const [opensDate, setOpensDate] = useState(() => assignmentDateValue(0));
  const [closesDate, setClosesDate] = useState(() => assignmentDateValue(7));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState("3학년 햇살반");
  const [newClassTerm, setNewClassTerm] = useState<ClassTermKey>("3-2");
  useEffect(() => {
    if (!selectedId && diagnosisSets[0]) setSelectedId(diagnosisSets[0].id);
  }, [diagnosisSets, selectedId]);
  useEffect(() => {
    if (!selectedClassId && classes[0]) setSelectedClassId(classes[0].id);
  }, [classes, selectedClassId]);
  const selected = diagnosisSets.find((diagnosis) => diagnosis.id === selectedId) ?? diagnosisSets[0];
  const selectedClass = classes.find((item) => item.id === selectedClassId) ?? classes[0];
  const hasTermMismatch = Boolean(
    selected
    && selectedClass
    && (
      selected.content.manifest.grade !== selectedClass.grade
      || selected.content.manifest.semester !== selectedClass.semester
    )
  );
  async function submitAssignment() {
    if (!selected || !selectedClass) return;
    setSaving(true);
    setError(null);
    try {
      await onAssigned({
        diagnosis: selected,
        classId: selectedClass.id,
        opensAt: new Date(`${opensDate}T00:00:00+09:00`).toISOString(),
        closesAt: new Date(`${closesDate}T23:59:59+09:00`).toISOString()
      });
      setStep(1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "배정을 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="teacher-page mom-stack-lg">
      <PageHeader eyebrow="진단 배정" title="한 번에 한 결정씩 배정합니다" description="이미 시작된 배정의 콘텐츠 버전은 바뀌지 않습니다." />
      <ol className="teacher-stepper"><li className={step >= 1 ? "is-active" : ""}>1 클래스</li><li className={step >= 2 ? "is-active" : ""}>2 진단</li><li className={step >= 3 ? "is-active" : ""}>3 일정</li><li className={step >= 4 ? "is-active" : ""}>4 검토</li></ol>
      <section className="mom-panel teacher-assignment-panel"><div className="mom-panel-body mom-stack-lg">
        {step === 1 && <DecisionBlock number="01" title="어느 반에 배정할까요?" description="로그인한 교사가 소유한 활성 클래스만 표시합니다.">{classes.length === 0 ? <div className="mom-stack"><p className="mom-muted">첫 클래스를 만들면 입장 코드가 한 번 표시됩니다.</p><label className="mom-input-group">클래스 이름<input className="mom-input" value={newClassName} onChange={(event) => setNewClassName(event.target.value.slice(0, 60))} /></label><ClassTermSelect value={newClassTerm} onChange={setNewClassTerm} /><button type="button" className="mom-button mom-button-secondary" disabled={!newClassName.trim()} onClick={() => void onCreateClass(classCreationInput(newClassName.trim(), newClassTerm)).catch((cause) => setError(cause instanceof Error ? cause.message : "클래스를 만들지 못했습니다."))}>클래스 만들기</button></div> : classes.map((item) => <button type="button" key={item.id} className={`teacher-decision ${selectedClass?.id === item.id ? "is-selected" : ""}`} onClick={() => setSelectedClassId(item.id)}><strong>{item.name}</strong><span>{item.grade}학년 {item.semester}학기</span></button>)}</DecisionBlock>}
        {step === 2 && <DecisionBlock number="02" title="어떤 진단을 사용할까요?" description="검수 완료된 발행 버전만 선택할 수 있습니다.">{diagnosisSets.length === 0 ? <p className="mom-form-error">배정할 수 있는 발행 콘텐츠가 없습니다.</p> : diagnosisSets.map((diagnosis) => <button key={diagnosis.id} className={`teacher-decision ${selected?.id === diagnosis.id ? "is-selected" : ""}`} onClick={() => setSelectedId(diagnosis.id)}><strong>{diagnosis.content.manifest.title}</strong><span>v{diagnosis.version} · {diagnosis.content.manifest.units.length}개 단원 · {diagnosis.content.judgments.length}개 판단 · 약 {diagnosis.content.manifest.estimatedMinutes}분</span></button>)}</DecisionBlock>}
        {step === 3 && <DecisionBlock number="03" title="언제까지 열어둘까요?" description="시작한 학생은 마감 뒤에도 교사가 종료하기 전까지 이어갈 수 있습니다."><div className="teacher-date-grid"><label className="mom-input-group">시작<input className="mom-input" type="date" value={opensDate} onChange={(event) => setOpensDate(event.target.value)} /></label><label className="mom-input-group">마감<input className="mom-input" type="date" min={opensDate} value={closesDate} onChange={(event) => setClosesDate(event.target.value)} /></label></div></DecisionBlock>}
        {step === 4 && selected && selectedClass && <DecisionBlock number="04" title="배정 내용을 확인해 주세요" description="배정 뒤에는 콘텐츠 버전을 바꾸지 않습니다."><dl className="teacher-review-list"><div><dt>클래스</dt><dd>{selectedClass.name}</dd></div><div><dt>진단</dt><dd>{selected.content.manifest.title} v{selected.version}</dd></div><div><dt>콘텐츠 체크섬</dt><dd className="mom-mono">{selected.checksum.slice(0, 16)}…</dd></div><div><dt>기간</dt><dd>{opensDate}—{closesDate}</dd></div></dl>{hasTermMismatch && <p className="teacher-term-warning" role="status">클래스는 {selectedClass.grade}학년 {selectedClass.semester}학기이고 진단은 {selected.content.manifest.grade}학년 {selected.content.manifest.semester}학기입니다. 학년·학기를 다시 확인해 주세요.</p>}</DecisionBlock>}
        {error && <p className="mom-form-error" role="alert">{error}</p>}
        <div className="mom-row-between"><button type="button" className="mom-button mom-button-quiet" disabled={step === 1 || saving} onClick={() => setStep((value) => value - 1)}>이전 결정</button><button type="button" className="mom-button mom-button-primary" disabled={!selected || !selectedClass || saving || closesDate < opensDate} onClick={() => { if (step < 4) setStep((value) => value + 1); else void submitAssignment(); }}>{saving ? "저장 중…" : step < 4 ? "다음 결정" : "이 내용으로 배정"}</button></div>
      </div></section>
    </div>
  );
}

function assignmentDateValue(offsetDays: number): string {
  const date = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function RosterPage({ students, classes, selectedClass, onAdd, onCreateClass, onRotate, onRotateStudent }: {
  students: TeacherStudentView[];
  classes: TeacherClassRecord[];
  selectedClass?: TeacherClassRecord;
  onAdd: (key: string, alias: string) => Promise<void>;
  onCreateClass: (input: ClassCreationInput) => Promise<void>;
  onRotate: () => Promise<void>;
  onRotateStudent: (studentId: string) => Promise<void>;
}) {
  const [key, setKey] = useState("");
  const [alias, setAlias] = useState("");
  const [className, setClassName] = useState("3학년 햇살반");
  const [classTerm, setClassTerm] = useState<ClassTermKey>("3-2");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onAdd(key, alias.trim());
      setKey("");
      setAlias("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "학생을 추가하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="teacher-page mom-stack-lg">
      <PageHeader eyebrow="클래스·학생" title="번호는 필수, 별칭은 선택" description="실명은 받지 않습니다. 학생별 개인 코드는 생성·재발급 때 한 번만 보여 주고 해시로 보관합니다." action={classes.length ? <button className="mom-button mom-button-secondary" onClick={() => void onRotate().catch((cause) => setError(cause instanceof Error ? cause.message : "입장 코드를 바꾸지 못했습니다."))}>입장 코드 바꾸기</button> : undefined} />
      {classes.length === 0 ? <section className="mom-panel"><div className="mom-panel-body mom-stack-lg"><div><p className="mom-eyebrow">First class</p><h2>첫 클래스를 만들어 주세요</h2><p className="mom-muted">학년·학기를 선택해 파일럿 클래스를 시작합니다.</p></div><label className="mom-input-group">클래스 이름<input className="mom-input" value={className} onChange={(event) => setClassName(event.target.value.slice(0, 60))} /></label><ClassTermSelect value={classTerm} onChange={setClassTerm} /><button className="mom-button mom-button-primary" disabled={!className.trim()} onClick={() => void onCreateClass(classCreationInput(className.trim(), classTerm)).catch((cause) => setError(cause instanceof Error ? cause.message : "클래스를 만들지 못했습니다."))}>클래스 만들기</button></div></section> : <section className="teacher-code-strip"><div><span>{selectedClass?.name ?? "클래스 선택"}</span><strong>{selectedClass?.joinCode ?? "코드 비공개"}</strong></div><p>원문 코드는 생성·재발급 직후에만 표시합니다.<br />분실했다면 새 코드를 발급해 주세요.</p></section>}
      {classes.length > 0 && <section className="teacher-class-create"><div><p className="mom-eyebrow">New pilot class</p><strong>다른 클래스 추가</strong></div><label className="mom-input-group">클래스 이름<input className="mom-input" value={className} onChange={(event) => setClassName(event.target.value.slice(0, 60))} /></label><ClassTermSelect value={classTerm} onChange={setClassTerm} /><button className="mom-button mom-button-secondary" disabled={!className.trim()} onClick={() => void onCreateClass(classCreationInput(className.trim(), classTerm)).catch((cause) => setError(cause instanceof Error ? cause.message : "클래스를 만들지 못했습니다."))}>클래스 만들기</button></section>}
      {error && <p className="mom-form-error" role="alert">{error}</p>}
      <div className="teacher-roster-grid">
        <section className="mom-panel"><div className="mom-panel-header"><div><p className="mom-eyebrow">Roster</p><h2>학생 {students.length}명</h2></div></div><table className="teacher-table"><thead><tr><th>번호</th><th>별칭</th><th>진행</th><th>개인 코드</th></tr></thead><tbody>{students.map((student) => <tr key={student.id}><td><strong>{student.rosterKey}</strong></td><td>{student.alias ?? <span className="mom-muted">사용 안 함</span>}</td><td>{student.status === "completed" ? "완료" : student.status === "in_progress" ? "진행 중" : student.status === "interpretation_pending" ? "해석 대기" : "시작 전"}</td><td><button type="button" className="mom-button mom-button-quiet" onClick={() => void onRotateStudent(student.id).catch((cause) => setError(cause instanceof Error ? cause.message : "개인 코드를 바꾸지 못했습니다."))}>재발급</button></td></tr>)}</tbody></table></section>
        <form className="mom-panel" onSubmit={submit}><div className="mom-panel-body mom-stack-lg"><div><p className="mom-eyebrow">Add student</p><h2>학생 한 명 추가</h2></div><label className="mom-input-group">번호 <span>필수</span><input className="mom-input" inputMode="numeric" pattern="[0-9]+" value={key} onChange={(event) => setKey(event.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="예: 8" required /></label><label className="mom-input-group">별칭 <span>선택</span><input className="mom-input" value={alias} onChange={(event) => setAlias(event.target.value.slice(0, 12))} placeholder="예: 민들레" /><small>실명 대신 학생과 합의한 별칭을 사용하세요.</small></label><button className="mom-button mom-button-primary mom-button-block" disabled={saving || classes.length === 0}>{saving ? "저장 중…" : "학생 추가"}</button></div></form>
      </div>
    </div>
  );
}

function ClassTermSelect({
  value,
  onChange
}: {
  value: ClassTermKey;
  onChange: (value: ClassTermKey) => void;
}) {
  return (
    <label className="mom-input-group">
      학년·학기
      <select
        className="mom-input"
        value={value}
        onChange={(event) => onChange(event.target.value as ClassTermKey)}
      >
        <option value="3-2">3학년 2학기</option>
        <option value="4-1">4학년 1학기</option>
        <option value="4-2">4학년 2학기</option>
        <option value="5-1">5학년 1학기</option>
        <option value="5-2">5학년 2학기</option>
        <option value="6-1">6학년 1학기</option>
        <option value="6-2">6학년 2학기</option>
      </select>
    </label>
  );
}

function classCreationInput(
  name: string,
  term: ClassTermKey
): ClassCreationInput {
  if (term === "4-1") return { name, grade: 4, semester: 1 };
  if (term === "4-2") return { name, grade: 4, semester: 2 };
  if (term === "5-1") return { name, grade: 5, semester: 1 };
  if (term === "5-2") return { name, grade: 5, semester: 2 };
  if (term === "6-1") return { name, grade: 6, semester: 1 };
  if (term === "6-2") return { name, grade: 6, semester: 2 };
  return { name, grade: 3, semester: 2 };
}

function SettingsPage({ profile, selectedClass }: { profile: TeacherProfileRecord | null; selectedClass?: TeacherClassRecord }) {
  return <div className="teacher-page mom-stack-lg"><PageHeader eyebrow="설정" title="교사 계정과 데이터 원칙" description="AI 요약 설정은 Phase 3 전까지 노출하지 않습니다." /><section className="mom-panel"><div className="mom-panel-body teacher-settings"><div><span>표시 이름</span><strong>{profile?.displayName ?? "불러오는 중"}</strong></div><div><span>이메일</span><strong>{profile?.email ?? "인증 계정"}</strong></div><div><span>학생 개인정보</span><strong>번호 필수 · 별칭 선택 · 실명 미수집 · 개인 코드 해시 보관</strong></div><div><span>학부모 공유</span><strong>교사 검토 후 인쇄/PDF 저장</strong></div>{selectedClass && <><div><span>파일럿 종료</span><strong>{formatDate(selectedClass.pilotEndsAt)}</strong></div><div><span>자동 삭제 예정</span><strong>{formatDate(selectedClass.purgeAfter)}</strong></div></>}</div></section></div>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <header className="teacher-page-header"><div><p className="mom-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{action}</header>;
}

function NavButton({ active, icon, children, onClick }: { active: boolean; icon: string; children: ReactNode; onClick: () => void }) {
  return <button className={active ? "is-active" : ""} onClick={onClick}><span>{icon}</span>{children}</button>;
}

function Metric({ value, label }: { value: string; label: string }) {
  return <article><strong>{value}</strong><span>{label}</span></article>;
}

function DecisionBlock({ number, title, description, children }: { number: string; title: string; description: string; children: ReactNode }) {
  return <div className="teacher-decision-block"><span>{number}</span><div className="mom-stack"><div><h2>{title}</h2><p className="mom-muted">{description}</p></div>{children}</div></div>;
}

function mapInsightsToStudents(value: TeacherAssignmentInsights): TeacherStudentView[] {
  const evidenceByStudent = new Map(value.bundle.students.map((entry) => [entry.student.id, entry.sessions]));
  return value.students.map((entry) => ({
    id: entry.student.id,
    rosterKey: entry.student.rosterKey,
    alias: entry.student.displayAlias,
    status: entry.interpretationStatus === "ready" ? "completed" : entry.interpretationStatus,
    pendingReason: entry.pendingReason,
    latestCompletedSessionId: entry.latestCompletedSessionId,
    report: entry.report,
    attempts: evidenceByStudent.get(entry.student.id) ?? []
  }));
}

function studentLabel(student: TeacherStudentView) {
  return student.alias ? `${student.rosterKey}번 · ${student.alias}` : `${student.rosterKey}번`;
}

function parentStudentLabel(student: TeacherStudentView) {
  return student.alias ?? "학생";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeZone: "Asia/Seoul" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Seoul" }).format(new Date(value));
}
