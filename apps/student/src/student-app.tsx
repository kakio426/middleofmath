import { useEffect, useMemo, useRef, useState } from "react";
import {
  CompleteSession,
  RecordJudgment,
  StartSession,
  SyncObservationEvents
} from "@middle-of-math/application";
import {
  grade3Semester1Diagnosis,
  grade3Semester2CompleteDiagnosis,
  grade3Semester2Diagnosis,
  grade4Semester1Diagnosis,
  grade4Semester2Diagnosis,
  grade5Semester1Diagnosis,
  grade5Semester2Diagnosis,
  grade6Semester1Diagnosis,
  grade6Semester2Diagnosis,
  parseDiagnosisSet
} from "@middle-of-math/content/runtime";
import {
  presentedChoices,
  type DiagnosisSession,
  type DiagnosisSet,
  type Judgment
} from "@middle-of-math/domain";
import {
  CryptoIdGenerator,
  createMiddleOfMathClient,
  IndexedDbContentStore,
  IndexedDbSessionStore,
  SupabaseEventRepository,
  SupabaseOperationalTelemetry,
  SupabaseSessionRepository,
  SupabaseStudentGateway,
  SystemClock,
  type StudentAssignmentRecord
} from "@middle-of-math/adapters";
import type { PublishedDiagnosisSet } from "@middle-of-math/domain";
import {
  AppShell,
  Brand,
  ChoiceOption,
  EmptyState,
  ProgressLine,
  ReadableText,
  StatusPill,
  VisualAid
} from "@middle-of-math/ui";
import {
  createUnitAssignmentCards,
  groupAssignmentsByArea,
  judgmentsForAssignment,
  type AssignmentCard
} from "./assignment-model";
import { createPublicPractice } from "./public-practice";

type Screen = "join" | "assignments" | "judgment" | "complete";

interface StudentContext {
  studentId: string;
  classId: string;
  className: string;
  rosterKey: string;
  displayAlias: string | null;
}

interface CachedAssignmentMetadata {
  id: string;
  unitId?: string;
  opensAt: string;
  closesAt?: string;
  status: string;
  diagnosisSet: Omit<StudentAssignmentRecord["diagnosisSet"], "content">;
}

const LOCAL_CONTEXT_KEY = "middle-of-math.student-context.v1";
const LOCAL_ASSIGNMENTS_KEY = "middle-of-math.student-assignments.v1";
const clock = new SystemClock();
const ids = new CryptoIdGenerator();

function publicConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  return url && publishableKey ? { url, publishableKey } : null;
}

const runtimeConfig = publicConfig();
const demoMode = import.meta.env.VITE_DEMO_MODE === "true";
const requestedDemoSet = demoMode && typeof window !== "undefined"
  ? new URLSearchParams(window.location.search).get("set")
  : null;
const demoContent = requestedDemoSet === "grade3-semester1"
  ? grade3Semester1Diagnosis
  : requestedDemoSet === "grade4-semester1"
    ? grade4Semester1Diagnosis
  : requestedDemoSet === "grade4-semester2"
    ? grade4Semester2Diagnosis
    : requestedDemoSet === "grade5-semester1"
      ? grade5Semester1Diagnosis
    : requestedDemoSet === "grade5-semester2"
      ? grade5Semester2Diagnosis
    : requestedDemoSet === "grade6-semester1"
      ? grade6Semester1Diagnosis
    : requestedDemoSet === "grade6-semester2"
      ? grade6Semester2Diagnosis
    : grade3Semester2CompleteDiagnosis;
const publicPractice = typeof window !== "undefined"
  ? createPublicPractice(new URLSearchParams(window.location.search).get("practice"))
  : null;
const localOnlyMode = demoMode || Boolean(publicPractice);
const localContent = publicPractice?.content ?? demoContent;
const runtimeClient = runtimeConfig && !localOnlyMode ? createMiddleOfMathClient(runtimeConfig) : null;

export function mapAssignmentRecord(row: StudentAssignmentRecord, content = row.diagnosisSet.content): AssignmentCard | null {
  try {
    const parsed = parseDiagnosisSet(content);
    const unit = row.unitId
      ? parsed.manifest.units.find((candidate) => candidate.id === row.unitId)
      : undefined;
    if (row.unitId && !unit) return null;
    const judgments = unit
      ? parsed.judgments.filter((judgment) => judgment.unitId === unit.id)
      : parsed.judgments;
    if (judgments.length === 0) return null;
    return {
      id: row.id,
      title: unit
        ? `${unit.order}단원 · ${unit.title}`
        : parsed.manifest.title,
      description: unit
        ? `${unit.title} 문제를 차근차근 풀어요.`
        : `${parsed.manifest.units.length}개 단원 · ${parsed.judgments.length}개의 짧은 생각`,
      status: "new",
      diagnosisSetId: row.diagnosisSet.setKey,
      diagnosisSetVersion: row.diagnosisSet.version,
      checksum: row.diagnosisSet.checksum,
      content: parsed,
      areaId: "assigned",
      areaTitle: "선생님이 보낸 활동",
      symbol: "✦",
      estimatedMinutes: unit
        ? Math.max(3, Math.ceil(judgments.length / 2))
        : parsed.manifest.estimatedMinutes,
      judgmentCount: judgments.length,
      unitId: unit?.id
    };
  } catch {
    return null;
  }
}

async function cacheAssignmentRecords(rows: StudentAssignmentRecord[], store: IndexedDbContentStore): Promise<AssignmentCard[]> {
  const cards: AssignmentCard[] = [];
  const metadata: CachedAssignmentMetadata[] = [];
  for (const row of rows) {
    const card = mapAssignmentRecord(row);
    if (!card) continue;
    const published: PublishedDiagnosisSet = {
      ...row.diagnosisSet,
      content: card.content,
      publishedAt: row.opensAt
    };
    await store.put(row.id, published);
    cards.push(card);
    metadata.push({
      id: row.id,
      unitId: row.unitId,
      opensAt: row.opensAt,
      closesAt: row.closesAt,
      status: row.status,
      diagnosisSet: {
        id: row.diagnosisSet.id,
        setKey: row.diagnosisSet.setKey,
        version: row.diagnosisSet.version,
        checksum: row.diagnosisSet.checksum,
        status: row.diagnosisSet.status
      }
    });
  }
  localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(metadata));
  return cards;
}

async function loadCachedAssignments(store: IndexedDbContentStore): Promise<AssignmentCard[]> {
  const raw = localStorage.getItem(LOCAL_ASSIGNMENTS_KEY);
  if (!raw) return [];
  try {
    const metadata = JSON.parse(raw) as CachedAssignmentMetadata[];
    const cards = await Promise.all(metadata.map(async (item) => {
      const published = await store.get(item.id);
      if (!published || published.setKey !== item.diagnosisSet.setKey || published.version !== item.diagnosisSet.version || published.checksum !== item.diagnosisSet.checksum) return null;
      return mapAssignmentRecord({ ...item, diagnosisSet: { ...item.diagnosisSet, content: published.content } });
    }));
    return cards.filter((card): card is AssignmentCard => Boolean(card));
  } catch {
    localStorage.removeItem(LOCAL_ASSIGNMENTS_KEY);
    return [];
  }
}

export function StudentApp() {
  const config = localOnlyMode ? null : runtimeConfig;
  const localStore = useMemo(() => new IndexedDbSessionStore(), []);
  const contentStore = useMemo(() => new IndexedDbContentStore(), []);
  const client = runtimeClient;
  const gateway = useMemo(() => client ? new SupabaseStudentGateway(client) : null, [client]);
  const remoteSessions = useMemo(() => client ? new SupabaseSessionRepository(client) : null, [client]);
  const remoteEvents = useMemo(() => client ? new SupabaseEventRepository(client) : null, [client]);
  const telemetry = useMemo(() => client ? new SupabaseOperationalTelemetry(client) : null, [client]);
  const [screen, setScreen] = useState<Screen>(() => publicPractice || localStorage.getItem(LOCAL_CONTEXT_KEY) ? "assignments" : "join");
  const [student, setStudent] = useState<StudentContext | null>(() => {
    if (publicPractice) {
      return {
        studentId: `practice-${publicPractice.key}`,
        classId: "public-practice",
        className: "수업 연계 문제",
        rosterKey: "연습",
        displayAlias: null
      };
    }
    const saved = localStorage.getItem(LOCAL_CONTEXT_KEY);
    if (!saved) return null;
    const restored = JSON.parse(saved) as StudentContext;
    return demoMode
      ? { ...restored, className: `${localContent.manifest.grade}학년 체험반` }
      : restored;
  });
  const [assignmentCards, setAssignmentCards] = useState<AssignmentCard[]>(() =>
    publicPractice?.assignments ?? (demoMode ? createUnitAssignmentCards(localContent) : [])
  );
  const [assignment, setAssignment] = useState<AssignmentCard | null>(null);
  const [session, setSession] = useState<DiagnosisSession | null>(null);
  const [judgmentIndex, setJudgmentIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [selectionChanges, setSelectionChanges] = useState(0);
  const [firstSelectionMs, setFirstSelectionMs] = useState<number | null>(null);
  const [selectedAtMs, setSelectedAtMs] = useState<number | null>(null);
  const [unknownVisible, setUnknownVisible] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const stepStartedAt = useRef(performance.now());

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (screen !== "judgment") return;
    setUnknownVisible(false);
    const timer = window.setTimeout(() => setUnknownVisible(true), 30_000);
    return () => window.clearTimeout(timer);
  }, [screen, judgmentIndex]);

  useEffect(() => {
    if (!online || !remoteEvents || !session) return;
    void (async () => {
      if (remoteSessions) {
        const localSession = await localStore.get(session.id);
        if (localSession && !await remoteSessions.get(session.id)) await remoteSessions.create(localSession);
      }
      return new SyncObservationEvents(localStore, remoteEvents, remoteSessions ?? localStore).execute(session.id);
    })()
      .catch(() => { void telemetry?.record({ app: "student", event: "sync.failed" }).catch(() => undefined); });
  }, [online, remoteEvents, remoteSessions, session, localStore, telemetry]);

  useEffect(() => {
    if (!config || !student) return;
    let active = true;
    void loadCachedAssignments(contentStore).then((cards) => {
      if (active && cards.length > 0) setAssignmentCards(cards);
    });
    if (online && gateway) {
      void gateway.listAssignments(student.classId)
        .then((rows) => cacheAssignmentRecords(rows, contentStore))
        .then((cards) => { if (active) setAssignmentCards(cards); })
        .catch(() => undefined);
    }
    return () => { active = false; };
  }, [config, student, online, gateway, contentStore]);

  useEffect(() => {
    if (!student || screen !== "assignments" || assignmentCards.length === 0) return;
    let active = true;
    void Promise.all(
      assignmentCards.map(async (card) => ({
        id: card.id,
        resumable: Boolean(await localStore.findResumable(card.id, student.studentId))
      }))
    ).then((states) => {
      if (!active) return;
      const resumableIds = new Set(
        states.filter((state) => state.resumable).map((state) => state.id)
      );
      if (resumableIds.size === 0) return;
      setAssignmentCards((current) => {
        if (!current.some((card) => resumableIds.has(card.id) && card.status === "new")) {
          return current;
        }
        return current.map((card) =>
          resumableIds.has(card.id) && card.status === "new"
            ? { ...card, status: "in_progress" }
            : card
        );
      });
    });
    return () => { active = false; };
  }, [assignmentCards, localStore, screen, student]);

  const activeContent = assignment?.content
    ?? assignmentCards[0]?.content
    ?? (localOnlyMode ? localContent : grade3Semester2Diagnosis);
  const activeJudgments = assignment
    ? judgmentsForAssignment(assignment)
    : activeContent.judgments;
  const assignments = assignmentCards.map((card) => card.id === assignment?.id ? {
    ...card,
    status: session?.status === "completed" || (demoMode && session?.status === "sync_pending")
      ? "completed" as const
      : session
        ? "in_progress" as const
        : card.status
  } : card);
  const currentJudgment = activeJudgments[judgmentIndex];
  const currentPresentedChoices = useMemo(() => {
    if (!currentJudgment || !session) return [];
    return presentedChoices(
      {
        sessionId: session.id,
        judgmentId: currentJudgment.id,
        judgmentIndex,
        correctChoiceId: currentJudgment.choices.find(
          (choice) => choice.correct
        )?.id
      },
      currentJudgment.choices
    );
  }, [currentJudgment, judgmentIndex, session?.id]);
  const progress = activeJudgments.length > 0
    ? judgmentIndex / activeJudgments.length * 100
    : 0;

  async function joinClass(input: { joinCode: string; rosterKey: string; studentSecret: string }) {
    setMessage(null);
    if (!/^[A-Z0-9]{6}$/.test(input.joinCode)) {
      setMessage("클래스 코드는 공백 없이 6자리로 입력해 주세요.");
      return;
    }
    try {
      const context = gateway
        ? await gateway.joinClass(input.joinCode, input.rosterKey, input.studentSecret)
        : localOnlyMode ? {
            studentId: `demo-${input.rosterKey}`,
            classId: "demo-class",
            className: `${localContent.manifest.grade}학년 체험반`,
            rosterKey: input.rosterKey,
            displayAlias: null
          } : (() => { throw new Error("학생 앱의 Supabase 환경변수가 필요합니다."); })();
      const next: StudentContext = context;
      setStudent(next);
      localStorage.setItem(LOCAL_CONTEXT_KEY, JSON.stringify(next));
      if (gateway) {
        const rows = await gateway.listAssignments(next.classId);
        const cards = await cacheAssignmentRecords(rows, contentStore);
        setAssignmentCards(cards);
        if (rows.length > 0 && cards.length === 0) {
          setMessage("배정된 활동의 콘텐츠를 확인하지 못했습니다. 선생님에게 알려 주세요.");
        }
      }
      setScreen("assignments");
    } catch {
      setMessage("입장 정보를 다시 확인해 주세요.");
    }
  }

  async function syncPendingSession(sessionId: string): Promise<number> {
    if (!remoteEvents || !remoteSessions) return 0;
    const localSession = await localStore.get(sessionId);
    if (localSession && !await remoteSessions.get(sessionId)) {
      await remoteSessions.create(localSession);
    }
    return new SyncObservationEvents(localStore, remoteEvents, remoteSessions).execute(sessionId);
  }

  async function startAssignment(card: AssignmentCard) {
    if (!student) return;
    setSaving(true);
    setMessage(null);
    try {
      const repository = remoteSessions && online ? new LocalFirstSessionRepository(localStore, remoteSessions) : localStore;
      const active = await new StartSession(repository, localStore, clock, ids).execute({
        assignmentId: card.id,
        studentId: student.studentId,
        diagnosisSetId: card.diagnosisSetId,
        diagnosisSetVersion: card.diagnosisSetVersion
      });
      const existing = await localStore.listAll(active.id);
      const judgmentIds = new Set(judgmentsForAssignment(card).map((judgment) => judgment.id));
      const completedJudgments = existing.filter(
        (event) =>
          event.eventType === "judgment_confirmed" &&
          event.judgmentId &&
          judgmentIds.has(event.judgmentId)
      ).length;
      setSession(active);
      setAssignment(card);
      setAssignmentCards((current) =>
        current.map((item) =>
          item.id === card.id ? { ...item, status: "in_progress" } : item
        )
      );
      if (completedJudgments >= judgmentIds.size || active.status === "completed") {
        setScreen("complete");
      } else {
        setJudgmentIndex(completedJudgments);
        resetJudgmentState();
        setScreen("judgment");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "진단을 시작하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function selectChoice(choiceId: string) {
    const now = performance.now();
    if (selectedChoiceId && selectedChoiceId !== choiceId) setSelectionChanges((value) => value + 1);
    if (firstSelectionMs === null) setFirstSelectionMs(now - stepStartedAt.current);
    setSelectedChoiceId(choiceId);
    setSelectedAtMs(now);
  }

  async function confirmJudgment() {
    if (!session || !currentJudgment || !selectedChoiceId) return;
    setSaving(true);
    const now = performance.now();
    try {
      const repository = remoteSessions ? new LocalFirstSessionRepository(localStore, remoteSessions) : localStore;
      await new RecordJudgment(repository, localStore, clock, ids).execute({
        sessionId: session.id,
        judgmentId: currentJudgment.id,
        interaction: currentJudgment.interaction,
        payload: {
          choiceId: selectedChoiceId,
          presentedChoiceIds: currentPresentedChoices.map((choice) => choice.id),
          durationMs: now - stepStartedAt.current,
          firstSelectionMs,
          confirmationMs: selectedAtMs === null ? null : now - selectedAtMs,
          selectionChanges,
          uncertainty: selectedChoiceId === "__unknown__"
        }
      });
      const isLast = judgmentIndex === activeJudgments.length - 1;
      if (isLast) {
        await new CompleteSession(repository, localStore, clock, ids).execute(session.id);
        const updated = await repository.get(session.id);
        if (updated) setSession(updated);
        if (online && remoteEvents) {
          await syncPendingSession(session.id).catch(() => {
            void telemetry?.record({ app: "student", event: "sync.failed" }).catch(() => undefined);
            return 0;
          });
        }
        if (assignment) {
          setAssignmentCards((current) =>
            current.map((item) =>
              item.id === assignment.id ? { ...item, status: "completed" } : item
            )
          );
        }
        setScreen("complete");
      } else {
        setJudgmentIndex((value) => value + 1);
        resetJudgmentState();
      }
    } catch {
      setMessage("기록은 이 기기에 저장했습니다. 연결되면 다시 전송합니다.");
    } finally {
      setSaving(false);
    }
  }

  function resetJudgmentState() {
    stepStartedAt.current = performance.now();
    setSelectedChoiceId(null);
    setSelectionChanges(0);
    setFirstSelectionMs(null);
    setSelectedAtMs(null);
    setUnknownVisible(false);
  }

  async function leaveClass() {
    if (gateway) await gateway.leaveDeviceIdentity().catch(() => undefined);
    localStorage.removeItem(LOCAL_CONTEXT_KEY);
    localStorage.removeItem(LOCAL_ASSIGNMENTS_KEY);
    setStudent(null);
    setAssignmentCards(
      publicPractice?.assignments ?? (demoMode ? createUnitAssignmentCards(localContent) : [])
    );
    setAssignment(null);
    setSession(null);
    setScreen("join");
  }

  if (!config && !localOnlyMode) {
    return <RuntimeConfigurationError appName="학생 앱" />;
  }

  return (
    <AppShell
      role="student"
      actions={<><StatusPill tone={localOnlyMode ? "neutral" : online ? "accent" : "warning"}>{publicPractice ? "연습 중" : demoMode ? "체험 중" : online ? "연결됨" : "이 기기에 저장 중"}</StatusPill>{student && !publicPractice && <button className="mom-button mom-button-quiet" onClick={() => void leaveClass()}>나가기</button>}</>}
    >
      {screen === "join" && (
        <JoinScreen
          onJoin={joinClass}
          message={message}
          configured={Boolean(config)}
          grade={localContent.manifest.grade}
          semester={localContent.manifest.semester}
        />
      )}
      {screen === "assignments" && student && (
        <AssignmentScreen student={student} assignments={assignments} onStart={startAssignment} saving={saving} message={message} />
      )}
      {screen === "judgment" && currentJudgment && (
        <JudgmentScreen
          judgment={currentJudgment}
          choices={currentPresentedChoices}
          unitTitle={activeContent.manifest.units.find((unit) => unit.id === currentJudgment.unitId)?.title ?? "수학 활동"}
          progress={progress}
          selectedChoiceId={selectedChoiceId}
          unknownVisible={unknownVisible}
          saving={saving}
          onSelect={selectChoice}
          onConfirm={confirmJudgment}
        />
      )}
      {screen === "complete" && (
        <CompletionScreen
          demo={localOnlyMode}
          synced={Boolean(online && session?.status === "completed")}
          onDone={() => setScreen("assignments")}
        />
      )}
    </AppShell>
  );
}

function RuntimeConfigurationError({ appName }: { appName: string }) {
  return <main className="student-centered"><Brand /><div className="mom-panel"><div className="mom-panel-body mom-stack"><h1>{appName} 설정이 필요합니다</h1><p className="mom-muted">운영 환경에는 Supabase URL과 publishable key를 설정해 주세요. 로컬 데모는 <code>VITE_DEMO_MODE=true</code>에서만 열립니다.</p></div></div></main>;
}

function JoinScreen({
  onJoin,
  message,
  configured,
  grade,
  semester
}: {
  onJoin: (input: { joinCode: string; rosterKey: string; studentSecret: string }) => void;
  message: string | null;
  configured: boolean;
  grade: number;
  semester: number;
}) {
  const [joinCode, setJoinCode] = useState(configured ? "" : "MATH27");
  const [rosterKey, setRosterKey] = useState("");
  const [studentSecret, setStudentSecret] = useState(configured ? "" : "STAR27");
  return (
    <section className="student-entry">
      <div className="student-entry-copy">
        <p className="mom-eyebrow">{grade}학년 {semester}학기 수학</p>
        <h1>선생님이 알려준<br />코드로 들어가요</h1>
        <p className="mom-muted">이름은 필요하지 않아요. 선생님이 준 번호와 개인 코드를 사용합니다.</p>
        {!configured && <StatusPill tone="neutral">체험 모드</StatusPill>}
      </div>
      <form className="mom-panel student-entry-form" onSubmit={(event) => { event.preventDefault(); onJoin({ joinCode, rosterKey, studentSecret }); }}>
        <div className="mom-panel-body mom-stack-lg">
          <div className="mom-input-group">
            <label htmlFor="join-code">클래스 코드</label>
            <input id="join-code" className="mom-input student-code-input" value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))} inputMode="text" autoComplete="off" placeholder="6자리 코드" required />
          </div>
          <div className="mom-input-group">
            <label htmlFor="roster-key">내 번호</label>
            <input id="roster-key" className="mom-input" value={rosterKey} onChange={(event) => setRosterKey(event.target.value.trimStart().slice(0, 20))} inputMode="numeric" autoComplete="off" placeholder="예: 12" required />
            <span className="mom-caption">별칭은 선생님이 정한 경우에만 함께 표시됩니다.</span>
          </div>
          <div className="mom-input-group">
            <label htmlFor="student-secret">내 개인 코드</label>
            <input id="student-secret" className="mom-input student-code-input" value={studentSecret} onChange={(event) => setStudentSecret(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))} inputMode="text" autoComplete="off" placeholder="입장 카드 6자리" required />
            <span className="mom-caption">친구와 바꾸지 않고 내 입장 카드에 적힌 코드를 사용해요.</span>
          </div>
          {message && <p className="mom-form-error" role="alert">{message}</p>}
          <button className="mom-button mom-button-primary mom-button-block" type="submit">활동 확인하기</button>
        </div>
      </form>
    </section>
  );
}

function AssignmentScreen({ student, assignments, onStart, saving, message }: { student: StudentContext; assignments: AssignmentCard[]; onStart: (assignment: AssignmentCard) => void; saving: boolean; message: string | null }) {
  const groups = groupAssignmentsByArea(assignments);
  return (
    <section className="student-page mom-stack-lg">
      <header className="student-page-heading">
        <p className="mom-eyebrow">{student.className}</p>
        <h1>{student.displayAlias ? `${student.rosterKey}번 · ${student.displayAlias}` : `${student.rosterKey}번`}, 할 수학 활동이에요</h1>
        <p className="mom-muted">영역을 살펴보고, 오늘 풀 단원 하나를 골라요.</p>
      </header>
      {message && <p className="student-sync-note">{message}</p>}
      {assignments.length === 0 && <EmptyState title="아직 할 활동이 없어요" description="선생님이 활동을 보내면 여기에 나타납니다." />}
      <div className="assignment-groups">
        {groups.map((group) => (
          <section
            className="assignment-group mom-stack"
            aria-labelledby={`assignment-group-${group.id}`}
            key={group.id}
          >
            <header className="assignment-group-heading">
              <div>
                <p className="mom-eyebrow">수학 영역</p>
                <h2 id={`assignment-group-${group.id}`}>{group.title}</h2>
              </div>
              <span className="mom-caption">{group.assignments.length}개 단원</span>
            </header>
            <div className="assignment-list">
              {group.assignments.map((item) => (
                <article
                  className="mom-panel assignment-card"
                  data-assignment-id={item.id}
                  key={item.id}
                >
                  <div className="assignment-unit-strip" aria-hidden="true">{item.symbol}</div>
                  <div className="mom-panel-body mom-stack">
                    <div className="mom-row-between">
                      <StatusPill tone={item.status === "in_progress" ? "accent" : "neutral"}>{item.status === "in_progress" ? "진행 중" : item.status === "completed" ? "완료" : "새 활동"}</StatusPill>
                      <span className="mom-caption">{item.judgmentCount}문제 · 약 {item.estimatedMinutes}분</span>
                    </div>
                    <div><h3>{item.title}</h3><p className="mom-muted">{item.description}</p></div>
                    <button className="mom-button mom-button-primary mom-button-block" disabled={saving || item.status === "completed"} onClick={() => onStart(item)}>
                      {saving ? "준비 중…" : item.status === "in_progress" ? "이어서 하기" : item.status === "completed" ? "완료했어요" : "시작하기"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function JudgmentScreen({ judgment, choices, unitTitle, progress, selectedChoiceId, unknownVisible, saving, onSelect, onConfirm }: { judgment: Judgment; choices: Judgment["choices"]; unitTitle: string; progress: number; selectedChoiceId: string | null; unknownVisible: boolean; saving: boolean; onSelect: (choiceId: string) => void; onConfirm: () => void }) {
  return (
    <section className="student-judgment">
      <div className="student-progress-wrap"><ProgressLine value={progress} /></div>
      <article className="student-judgment-grid" data-judgment-id={judgment.id}>
        <div className="student-question mom-stack-lg">
          <div>
            <p className="mom-eyebrow">{unitTitle}</p>
            {judgment.context && <p className="student-context mom-readable-text"><ReadableText text={judgment.context} /></p>}
            <h1 className="mom-readable-text"><ReadableText text={judgment.prompt} /></h1>
          </div>
          <VisualAid visual={judgment.visual} />
        </div>
        <div className="student-response mom-stack">
          <div className="mom-choice-list">
            {choices.map((choice) => <ChoiceOption key={choice.id} label={choice.label} selected={selectedChoiceId === choice.id} onSelect={() => onSelect(choice.id)} />)}
          </div>
          <div className={`student-unknown ${unknownVisible ? "is-visible" : ""}`}>
            {unknownVisible && <button type="button" className="mom-button mom-button-quiet mom-button-block" onClick={() => onSelect("__unknown__")}>잘 모르겠어요</button>}
          </div>
          <button type="button" className="mom-button mom-button-primary mom-button-block" disabled={!selectedChoiceId || saving} onClick={onConfirm}>{saving ? "기록 중…" : "다음"}</button>
        </div>
      </article>
    </section>
  );
}

function CompletionScreen({ demo, synced, onDone }: { demo: boolean; synced: boolean; onDone: () => void }) {
  return (
    <section className="student-complete">
      <EmptyState
        title="끝까지 참여했어요"
        description={demo
          ? "활동을 마쳤어요. 기록은 이 기기에 저장했어요."
          : synced
            ? "모든 생각 기록을 선생님께 안전하게 전달했어요."
            : "기록은 이 기기에 안전하게 보관 중이에요. 연결되면 자동으로 전달할게요."}
        action={<button className="mom-button mom-button-primary" onClick={onDone}>활동 목록으로</button>}
      />
    </section>
  );
}

class LocalFirstSessionRepository {
  constructor(
    private readonly local: IndexedDbSessionStore,
    private readonly remote: SupabaseSessionRepository
  ) {}

  async create(session: DiagnosisSession) {
    await this.remote.create(session);
    await this.local.create(session);
  }
  async get(id: string) { return await this.local.get(id) ?? this.remote.get(id); }
  async findResumable(assignmentId: string, studentId: string) {
    return await this.local.findResumable(assignmentId, studentId) ?? this.remote.findResumable(assignmentId, studentId);
  }
  async updateStatus(id: string, status: DiagnosisSession["status"], completedAt?: string) {
    await this.local.updateStatus(id, status, completedAt);
    await this.remote.updateStatus(id, status, completedAt).catch(() => undefined);
  }
  async updateLastEventSeq(id: string, sequence: number) {
    await this.local.updateLastEventSeq(id, sequence);
    await this.remote.updateLastEventSeq(id, sequence).catch(() => undefined);
  }
}
