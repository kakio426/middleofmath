import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  createMiddleOfMathClient,
  CryptoIdGenerator,
  SupabaseAssignmentRepository,
  SupabaseContentStudioRepository,
  SupabaseTeacherGateway,
  SystemClock,
  type TeacherClassRecord
} from "@middle-of-math/adapters";
import { AssignDiagnosis } from "@middle-of-math/application";
import { grade3Semester2Diagnosis } from "@middle-of-math/content";
import {
  createParentReport,
  generateClassSummary,
  interpretSession,
  type DiagnosisFinding,
  type JudgmentConfirmationPayload,
  type ObservationEvent,
  type ParentReport,
  type PublishedDiagnosisSet,
  type TeacherStudentReport
} from "@middle-of-math/domain";
import {
  Brand,
  EmptyState,
  EvidenceRail,
  SeverityMark,
  StatusPill
} from "@middle-of-math/ui";

type Page = "summary" | "student" | "assignment" | "roster" | "settings";
type ReportMode = "teacher" | "parent";

interface DemoStudent {
  id: string;
  rosterKey: string;
  alias: string | null;
  status: "completed" | "in_progress" | "not_started";
  report?: TeacherStudentReport;
}

const content = grade3Semester2Diagnosis;
const packagedPublishedContent: PublishedDiagnosisSet = {
  id: "packaged-grade3-semester2-v1",
  setKey: content.manifest.id,
  version: content.manifest.version,
  checksum: content.manifest.checksum,
  status: "published",
  content,
  publishedAt: "2026-07-22T00:00:00.000Z"
};
const demoProfiles: Record<string, Record<string, number>> = {
  "student-03": { "g3s2-frac-01": 1, "g3s2-frac-02": 1, "g3s2-graph-01": 1 },
  "student-07": { "g3s2-frac-01": 1, "g3s2-circle-02": 1, "g3s2-measure-01": 1 },
  "student-12": { "g3s2-mul-01": 1, "g3s2-div-02": 1, "g3s2-graph-01": 1 },
  "student-18": { "g3s2-frac-01": 1, "g3s2-measure-02": 1, "g3s2-graph-02": 1 }
};

function publicConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  return url && publishableKey ? { url, publishableKey } : null;
}

const runtimeConfig = publicConfig();
const runtimeClient = runtimeConfig ? createMiddleOfMathClient(runtimeConfig) : null;

function makeDemoReport(studentId: string): TeacherStudentReport {
  const profile = demoProfiles[studentId] ?? {};
  const sessionId = `demo-session-${studentId}`;
  const events: ObservationEvent<JudgmentConfirmationPayload>[] = content.judgments.map((judgment, index) => {
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
  return interpretSession(content, events, undefined, "2026-07-22T10:30:00.000Z");
}

const initialStudents: DemoStudent[] = [
  { id: "student-03", rosterKey: "3", alias: "민들레", status: "completed", report: makeDemoReport("student-03") },
  { id: "student-07", rosterKey: "7", alias: null, status: "completed", report: makeDemoReport("student-07") },
  { id: "student-12", rosterKey: "12", alias: "나무", status: "completed", report: makeDemoReport("student-12") },
  { id: "student-18", rosterKey: "18", alias: null, status: "completed", report: makeDemoReport("student-18") },
  { id: "student-21", rosterKey: "21", alias: "구름", status: "in_progress" },
  { id: "student-24", rosterKey: "24", alias: null, status: "in_progress" },
  { id: "student-25", rosterKey: "25", alias: null, status: "not_started" }
];

export function TeacherApp() {
  const client = runtimeClient;
  const [signedIn, setSignedIn] = useState(!client);
  const [authReady, setAuthReady] = useState(!client);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [page, setPage] = useState<Page>("summary");
  const [students, setStudents] = useState(client ? [] : initialStudents);
  const [selectedStudentId, setSelectedStudentId] = useState("student-03");
  const [reportMode, setReportMode] = useState<ReportMode>("teacher");
  const [selectedFinding, setSelectedFinding] = useState<DiagnosisFinding | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [publishedContents, setPublishedContents] = useState<PublishedDiagnosisSet[]>(client ? [] : [packagedPublishedContent]);
  const [teacherClasses, setTeacherClasses] = useState<TeacherClassRecord[]>(client ? [] : [
    { id: "demo-class", name: "3학년 햇살반", grade: 3, semester: 2 }
  ]);

  const completed = students.filter((student) => student.report).map((student) => ({ studentId: student.id, report: student.report! }));
  const summary = generateClassSummary(completed, students.filter((student) => student.status === "in_progress").length);
  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? students[0];
  const parentReport = selectedStudent?.report
    ? createParentReport(content, selectedStudent.report, parentStudentLabel(selectedStudent))
    : null;

  useEffect(() => {
    if (!client) return;
    let active = true;
    const loadTeacherData = async () => {
      const gateway = new SupabaseTeacherGateway(client);
      const [contents, classesResult] = await Promise.all([
        new SupabaseContentStudioRepository(client).listPublished(),
        gateway.listActiveClasses()
      ]);
      const roster = classesResult[0] ? await gateway.listStudents(classesResult[0].id) : [];
      if (!active) return;
      setPublishedContents(contents.filter((row) => row.status === "published"));
      setTeacherClasses(classesResult);
      setStudents(roster.map((student) => ({
        id: student.id,
        rosterKey: student.rosterKey,
        alias: student.displayAlias,
        status: "not_started" as const
      })));
    };
    void client.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSignedIn(Boolean(data.session));
      setAuthReady(true);
      if (data.session) {
        void loadTeacherData()
          .catch(() => setNotice("발행 콘텐츠 또는 클래스를 불러오지 못해 배정 화면을 열 수 없습니다."));
      }
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setSignedIn(Boolean(session));
      setAuthReady(true);
      if (session) {
        void loadTeacherData()
          .catch(() => setNotice("발행 콘텐츠 또는 클래스를 불러오지 못해 배정 화면을 열 수 없습니다."));
      } else {
        setPublishedContents([]);
        setTeacherClasses([]);
      }
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client]);

  async function signIn(email: string, password: string) {
    if (!client) return;
    setAuthError(null);
    setAuthNotice(null);
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError("이메일과 비밀번호를 확인해 주세요.");
      return;
    }
    setSignedIn(true);
    setAuthReady(true);
  }

  async function register(displayName: string, email: string, password: string) {
    if (!client) return;
    setAuthError(null);
    setAuthNotice(null);
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName.trim() || "교사" } }
    });
    if (error) {
      setAuthError("계정을 만들지 못했습니다. 이메일과 비밀번호를 확인해 주세요.");
      return;
    }
    if (data.session) {
      setSignedIn(true);
      setAuthReady(true);
    } else {
      setAuthNotice("확인 이메일을 보냈습니다. 이메일 인증 뒤 로그인해 주세요.");
    }
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
    const targetClass = teacherClasses[0];
    if (!targetClass) throw new Error("학생을 추가할 클래스를 먼저 만들어 주세요.");
    const saved = client
      ? await new SupabaseTeacherGateway(client).addStudent({ classId: targetClass.id, rosterKey, displayAlias: alias })
      : { id: `local-${crypto.randomUUID()}`, rosterKey, displayAlias: alias || null, active: true };
    const newStudent: DemoStudent = { id: saved.id, rosterKey: saved.rosterKey, alias: saved.displayAlias, status: "not_started" };
    setStudents((current) => [...current, newStudent].sort((a, b) => Number(a.rosterKey) - Number(b.rosterKey)));
    setNotice(`${rosterKey}번을 ${targetClass.name}에 추가했습니다.`);
  }

  async function createTeacherClass(name: string): Promise<void> {
    if (!client) {
      setTeacherClasses([{ id: "demo-class", name, grade: 3, semester: 2, joinCode: "MATH27" }]);
      setNotice(`${name}을 만들었습니다. 입장 코드 MATH27`);
      return;
    }
    const created = await new SupabaseTeacherGateway(client).createClass({ name, grade: 3, semester: 2 });
    setTeacherClasses((current) => [...current, created]);
    setNotice(`${created.name}을 만들었습니다. 입장 코드 ${created.joinCode}는 지금 안전하게 전달해 주세요.`);
  }

  async function rotateJoinCode(): Promise<void> {
    const targetClass = teacherClasses[0];
    if (!targetClass) throw new Error("활성 클래스가 없습니다.");
    const joinCode = client
      ? await new SupabaseTeacherGateway(client).rotateJoinCode(targetClass.id)
      : "NEW527";
    setTeacherClasses((current) => current.map((item) => item.id === targetClass.id ? { ...item, joinCode } : item));
    setNotice(`새 입장 코드 ${joinCode}를 만들었습니다. 이전 코드는 즉시 사용할 수 없습니다.`);
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
    const targetClass = teacherClasses.find((item) => item.id === input.classId);
    setNotice(`${input.diagnosis.content.manifest.title} v${input.diagnosis.version}을 ${targetClass?.name ?? "클래스"}에 배정했습니다.`);
  }

  if (!authReady) return <main className="teacher-auth-loading"><Brand /><p>교사 계정을 확인하고 있습니다.</p></main>;
  if (!signedIn) return <TeacherLogin onSubmit={signIn} onRegister={register} error={authError} notice={authNotice} />;

  return (
    <div className="teacher-shell">
      <aside className="teacher-sidebar">
        <Brand />
        <div className="teacher-class-switcher">
          <span>현재 클래스</span>
          <strong>{teacherClasses[0]?.name ?? "클래스 없음"}</strong>
          <small>{teacherClasses[0]?.joinCode ? `입장 코드 ${teacherClasses[0].joinCode}` : "코드는 재발급할 때만 표시됩니다"}</small>
        </div>
        <nav aria-label="교사 메뉴">
          <NavButton active={page === "summary"} onClick={() => setPage("summary")} icon="∑">반 요약</NavButton>
          <NavButton active={page === "student"} onClick={() => setPage("student")} icon="↳">학생 리포트</NavButton>
          <NavButton active={page === "assignment"} onClick={() => setPage("assignment")} icon="＋">진단 배정</NavButton>
          <NavButton active={page === "roster"} onClick={() => setPage("roster")} icon="№">클래스·학생</NavButton>
          <NavButton active={page === "settings"} onClick={() => setPage("settings")} icon="·">설정</NavButton>
        </nav>
        <div className="teacher-sidebar-foot">
          <StatusPill tone="warning">{client ? "시연 데이터 · Auth 연결" : "로컬 데모"}</StatusPill>
          <span>교사 김수학</span>
        </div>
      </aside>
      <main className="teacher-main">
        {notice && <div className="teacher-notice" role="status">{notice}<button onClick={() => setNotice(null)} aria-label="알림 닫기">×</button></div>}
        {page === "summary" && <ClassSummaryPage students={students} summary={summary} onOpenStudent={openStudent} />}
        {page === "student" && (selectedStudent ? <StudentReportPage student={selectedStudent} students={students} reportMode={reportMode} parentReport={parentReport} selectedFinding={selectedFinding} onStudentChange={(id) => openStudent(id)} onModeChange={setReportMode} onFindingSelect={setSelectedFinding} /> : <div className="teacher-page"><EmptyState title="학생이 없습니다" description="클래스·학생 화면에서 번호를 먼저 추가해 주세요." /></div>)}
        {page === "assignment" && <AssignmentPage diagnosisSets={publishedContents} classes={teacherClasses} onAssigned={assignDiagnosis} onCreateClass={createTeacherClass} />}
        {page === "roster" && <RosterPage students={students} classes={teacherClasses} onAdd={addStudent} onCreateClass={createTeacherClass} onRotate={rotateJoinCode} />}
        {page === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}

function TeacherLogin({ onSubmit, onRegister, error, notice }: { onSubmit: (email: string, password: string) => Promise<void>; onRegister: (displayName: string, email: string, password: string) => Promise<void>; error: string | null; notice: string | null }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [displayName, setDisplayName] = useState("");
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
      <form className="mom-panel teacher-login-form" onSubmit={(event) => { event.preventDefault(); if (mode === "login") void onSubmit(email, password); else void onRegister(displayName, email, password); }}>
        <div className="mom-panel-body mom-stack-lg">
          <div><p className="mom-eyebrow">{mode === "login" ? "Welcome back" : "Teacher account"}</p><h2>{mode === "login" ? "교사 로그인" : "교사 계정 만들기"}</h2></div>
          {mode === "register" && <label className="mom-input-group">표시 이름<input className="mom-input" autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value.slice(0, 30))} required /></label>}
          <label className="mom-input-group">이메일<input className="mom-input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label className="mom-input-group">비밀번호<input className="mom-input" type="password" minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <p className="mom-form-error" role="alert">{error}</p>}
          {notice && <p className="teacher-auth-notice" role="status">{notice}</p>}
          <button className="mom-button mom-button-primary mom-button-block">{mode === "login" ? "로그인" : "계정 만들기"}</button>
          <button className="mom-button mom-button-quiet mom-button-block" type="button" onClick={() => setMode((current) => current === "login" ? "register" : "login")}>{mode === "login" ? "처음이신가요? 교사 계정 만들기" : "이미 계정이 있나요? 로그인"}</button>
        </div>
      </form>
    </main>
  );
}

function ClassSummaryPage({ students, summary, onOpenStudent }: { students: DemoStudent[]; summary: ReturnType<typeof generateClassSummary>; onOpenStudent: (studentId: string, finding?: DiagnosisFinding) => void }) {
  return (
    <div className="teacher-page mom-stack-lg">
      <PageHeader eyebrow="3학년 햇살반 · 3학년 2학기 수학" title="반에서 함께 다시 볼 생각" description="완료한 학생의 반복 신호만 모았습니다. 진행 중 기록은 오개념 집계에 넣지 않습니다." action={<button className="mom-button mom-button-secondary">내보내기</button>} />
      <section className="teacher-metrics" aria-label="진단 현황">
        <Metric value={`${summary.completedStudents}명`} label="완료" />
        <Metric value={`${summary.inProgressStudents}명`} label="진행 중" />
        <Metric value={`${students.filter((student) => student.status === "not_started").length}명`} label="시작 전" />
        <Metric value="12개" label="판단 단위" />
      </section>
      <section className="mom-panel teacher-summary-panel">
        <div className="mom-panel-header"><div><p className="mom-eyebrow">Common signals</p><h2>학생 수가 많은 순서</h2></div><span className="mom-caption">엔진 rules-2.0.0</span></div>
        <div className="teacher-summary-list">
          {summary.items.slice(0, 6).map((item, index) => {
            const related = students.filter((student) => item.studentIds.includes(student.id) && student.report);
            return (
              <article className="teacher-summary-row" key={item.signalId}>
                <span className="teacher-rank">{String(index + 1).padStart(2, "0")}</span>
                <div className="teacher-summary-copy"><div className="mom-row-between"><h3>{item.title}</h3><SeverityMark severity={item.severity} /></div><p>{item.interpretation}</p><strong className="teacher-move">다음 수업 · {item.teachingMove}</strong></div>
                <div className="teacher-summary-count"><strong>{item.studentCount}</strong><span>명 관찰</span></div>
                <div className="teacher-student-links">{related.map((student) => <button key={student.id} onClick={() => onOpenStudent(student.id, student.report?.findings.find((finding) => finding.signalId === item.signalId))}>{studentLabel(student)}</button>)}</div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StudentReportPage({ student, students, reportMode, parentReport, selectedFinding, onStudentChange, onModeChange, onFindingSelect }: { student: DemoStudent; students: DemoStudent[]; reportMode: ReportMode; parentReport: ParentReport | null; selectedFinding: DiagnosisFinding | null; onStudentChange: (id: string) => void; onModeChange: (mode: ReportMode) => void; onFindingSelect: (finding: DiagnosisFinding | null) => void }) {
  const report = student.report;
  return (
    <div className={`teacher-page mom-stack-lg ${reportMode === "parent" ? "is-parent-preview" : ""}`}>
      <PageHeader eyebrow="학생 리포트" title={studentLabel(student)} description="교사용 근거 리포트와 학부모 공유용 요약은 목적과 문장을 분리합니다." action={<select className="mom-input teacher-student-select" value={student.id} onChange={(event) => onStudentChange(event.target.value)}>{students.map((item) => <option key={item.id} value={item.id}>{studentLabel(item)}</option>)}</select>} />
      <div className="teacher-report-tabs" role="tablist">
        <button role="tab" aria-selected={reportMode === "teacher"} onClick={() => onModeChange("teacher")}>교사용 근거 리포트</button>
        <button role="tab" aria-selected={reportMode === "parent"} onClick={() => onModeChange("parent")}>학부모 공유 리포트</button>
      </div>
      {!report && <EmptyState title="완료된 기록이 아직 없습니다" description="학생이 활동을 마치면 교사용 근거와 학부모용 요약을 따로 만들 수 있습니다." />}
      {report && reportMode === "teacher" && <TeacherEvidenceReport report={report} selectedFinding={selectedFinding} onFindingSelect={onFindingSelect} />}
      {report && reportMode === "parent" && parentReport && <ParentShareReport report={parentReport} />}
    </div>
  );
}

function TeacherEvidenceReport({ report, selectedFinding, onFindingSelect }: { report: TeacherStudentReport; selectedFinding: DiagnosisFinding | null; onFindingSelect: (finding: DiagnosisFinding | null) => void }) {
  const finding = selectedFinding ?? report.findings[0];
  const evidence = finding?.evidence[0];
  const judgment = evidence ? content.judgments.find((item) => item.id === evidence.judgmentId) : null;
  const stage = judgment ? content.learnerStages.find((item) => item.id === judgment.learnerStageId) : null;
  const anchor = judgment ? content.curriculumAnchors.find((item) => item.id === judgment.curriculumAnchorIds[0]) : null;
  return (
    <div className="teacher-report-grid">
      <section className="mom-panel">
        <div className="mom-panel-header"><div><p className="mom-eyebrow">Observed signals</p><h2>우선 살펴볼 판단</h2></div><span className="mom-caption">{report.observedJudgmentCount}개 중 {report.stableJudgmentCount}개 안정</span></div>
        <div className="teacher-findings">
          {report.findings.map((item) => <button key={item.signalId} className={finding?.signalId === item.signalId ? "is-active" : ""} onClick={() => onFindingSelect(item)}><span><strong>{item.title}</strong><small>근거 {item.evidenceCount}개</small></span><SeverityMark severity={item.severity} /></button>)}
        </div>
      </section>
      <section className="mom-panel teacher-evidence-panel">
        {finding && evidence && judgment && stage && anchor ? <>
          <div className="mom-panel-header"><div><p className="mom-eyebrow">Evidence trail</p><h2>{finding.title}</h2></div><SeverityMark severity={finding.severity} /></div>
          <div className="mom-panel-body mom-stack-lg">
            <p className="teacher-interpretation">{finding.interpretation}</p>
            <EvidenceRail anchor={`${anchor.id} ${anchor.label}`} stage={stage.title} evidence={evidence} />
            <div className="teacher-question-evidence"><span>학생이 본 판단</span><strong>{judgment.prompt}</strong></div>
            <div className="teacher-next-move"><span>다음 수업에서</span><p>{finding.teachingMove}</p></div>
          </div>
          <footer className="teacher-report-meta">콘텐츠 {report.diagnosisSetVersion} · 해석 {report.engineVersion} · {formatDate(report.generatedAt)}</footer>
        </> : <EmptyState title="관찰 신호가 없습니다" description="이 기록에서는 우선 확인할 반복 신호가 나타나지 않았습니다." />}
      </section>
    </div>
  );
}

function ParentShareReport({ report }: { report: ParentReport }) {
  return (
    <section className="parent-report-paper">
      <header><div><p className="mom-eyebrow">Middle of Math · 가정 공유용</p><h1>{report.studentLabel}의 수학 생각 기록</h1><p>{report.diagnosisTitle} · {formatDate(report.generatedAt)}</p></div><button className="mom-button mom-button-secondary parent-print-button" onClick={() => window.print()}>인쇄 · PDF 저장</button></header>
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
  onCreateClass: (name: string) => Promise<void>;
}) {
  const [step, setStep] = useState(1);
  const [selectedId, setSelectedId] = useState(diagnosisSets[0]?.id ?? "");
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id ?? "");
  const [opensDate, setOpensDate] = useState(() => assignmentDateValue(0));
  const [closesDate, setClosesDate] = useState(() => assignmentDateValue(7));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState("3학년 햇살반");
  useEffect(() => {
    if (!selectedId && diagnosisSets[0]) setSelectedId(diagnosisSets[0].id);
  }, [diagnosisSets, selectedId]);
  useEffect(() => {
    if (!selectedClassId && classes[0]) setSelectedClassId(classes[0].id);
  }, [classes, selectedClassId]);
  const selected = diagnosisSets.find((diagnosis) => diagnosis.id === selectedId) ?? diagnosisSets[0];
  const selectedClass = classes.find((item) => item.id === selectedClassId) ?? classes[0];
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
        {step === 1 && <DecisionBlock number="01" title="어느 반에 배정할까요?" description="로그인한 교사가 소유한 활성 클래스만 표시합니다.">{classes.length === 0 ? <div className="mom-stack"><p className="mom-muted">첫 클래스를 만들면 입장 코드가 한 번 표시됩니다.</p><label className="mom-input-group">클래스 이름<input className="mom-input" value={newClassName} onChange={(event) => setNewClassName(event.target.value.slice(0, 60))} /></label><button type="button" className="mom-button mom-button-secondary" disabled={!newClassName.trim()} onClick={() => void onCreateClass(newClassName.trim()).catch((cause) => setError(cause instanceof Error ? cause.message : "클래스를 만들지 못했습니다."))}>3학년 2학기 클래스 만들기</button></div> : classes.map((item) => <button type="button" key={item.id} className={`teacher-decision ${selectedClass?.id === item.id ? "is-selected" : ""}`} onClick={() => setSelectedClassId(item.id)}><strong>{item.name}</strong><span>{item.grade}학년 {item.semester}학기</span></button>)}</DecisionBlock>}
        {step === 2 && <DecisionBlock number="02" title="어떤 진단을 사용할까요?" description="검수 완료된 발행 버전만 선택할 수 있습니다.">{diagnosisSets.length === 0 ? <p className="mom-form-error">배정할 수 있는 발행 콘텐츠가 없습니다.</p> : diagnosisSets.map((diagnosis) => <button key={diagnosis.id} className={`teacher-decision ${selected?.id === diagnosis.id ? "is-selected" : ""}`} onClick={() => setSelectedId(diagnosis.id)}><strong>{diagnosis.content.manifest.title}</strong><span>v{diagnosis.version} · {diagnosis.content.manifest.units.length}개 단원 · {diagnosis.content.judgments.length}개 판단 · 약 {diagnosis.content.manifest.estimatedMinutes}분</span></button>)}</DecisionBlock>}
        {step === 3 && <DecisionBlock number="03" title="언제까지 열어둘까요?" description="시작한 학생은 마감 뒤에도 교사가 종료하기 전까지 이어갈 수 있습니다."><div className="teacher-date-grid"><label className="mom-input-group">시작<input className="mom-input" type="date" value={opensDate} onChange={(event) => setOpensDate(event.target.value)} /></label><label className="mom-input-group">마감<input className="mom-input" type="date" min={opensDate} value={closesDate} onChange={(event) => setClosesDate(event.target.value)} /></label></div></DecisionBlock>}
        {step === 4 && selected && selectedClass && <DecisionBlock number="04" title="배정 내용을 확인해 주세요" description="배정 뒤에는 콘텐츠 버전을 바꾸지 않습니다."><dl className="teacher-review-list"><div><dt>클래스</dt><dd>{selectedClass.name}</dd></div><div><dt>진단</dt><dd>{selected.content.manifest.title} v{selected.version}</dd></div><div><dt>콘텐츠 체크섬</dt><dd className="mom-mono">{selected.checksum.slice(0, 16)}…</dd></div><div><dt>기간</dt><dd>{opensDate}—{closesDate}</dd></div></dl></DecisionBlock>}
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

function RosterPage({ students, classes, onAdd, onCreateClass, onRotate }: {
  students: DemoStudent[];
  classes: TeacherClassRecord[];
  onAdd: (key: string, alias: string) => Promise<void>;
  onCreateClass: (name: string) => Promise<void>;
  onRotate: () => Promise<void>;
}) {
  const [key, setKey] = useState("");
  const [alias, setAlias] = useState("");
  const [className, setClassName] = useState("3학년 햇살반");
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
      <PageHeader eyebrow="클래스·학생" title="번호는 필수, 별칭은 선택" description="번호는 클래스 안에서 변하지 않는 식별자입니다. 별칭은 화면 표시용이며 실명을 입력하지 않습니다." action={classes.length ? <button className="mom-button mom-button-secondary" onClick={() => void onRotate().catch((cause) => setError(cause instanceof Error ? cause.message : "입장 코드를 바꾸지 못했습니다."))}>입장 코드 바꾸기</button> : undefined} />
      {classes.length === 0 ? <section className="mom-panel"><div className="mom-panel-body mom-stack-lg"><div><p className="mom-eyebrow">First class</p><h2>첫 클래스를 만들어 주세요</h2><p className="mom-muted">3학년 2학기 파일럿 클래스로 시작합니다.</p></div><label className="mom-input-group">클래스 이름<input className="mom-input" value={className} onChange={(event) => setClassName(event.target.value.slice(0, 60))} /></label><button className="mom-button mom-button-primary" disabled={!className.trim()} onClick={() => void onCreateClass(className.trim()).catch((cause) => setError(cause instanceof Error ? cause.message : "클래스를 만들지 못했습니다."))}>클래스 만들기</button></div></section> : <section className="teacher-code-strip"><div><span>{classes[0].name}</span><strong>{classes[0].joinCode ?? "코드 비공개"}</strong></div><p>원문 코드는 생성·재발급 직후에만 표시합니다.<br />분실했다면 새 코드를 발급해 주세요.</p></section>}
      {error && <p className="mom-form-error" role="alert">{error}</p>}
      <div className="teacher-roster-grid">
        <section className="mom-panel"><div className="mom-panel-header"><div><p className="mom-eyebrow">Roster</p><h2>학생 {students.length}명</h2></div></div><table className="teacher-table"><thead><tr><th>번호</th><th>별칭</th><th>진행</th><th>상태</th></tr></thead><tbody>{students.map((student) => <tr key={student.id}><td><strong>{student.rosterKey}</strong></td><td>{student.alias ?? <span className="mom-muted">사용 안 함</span>}</td><td>{student.status === "completed" ? "완료" : student.status === "in_progress" ? "진행 중" : "시작 전"}</td><td><StatusPill tone="neutral">활성</StatusPill></td></tr>)}</tbody></table></section>
        <form className="mom-panel" onSubmit={submit}><div className="mom-panel-body mom-stack-lg"><div><p className="mom-eyebrow">Add student</p><h2>학생 한 명 추가</h2></div><label className="mom-input-group">번호 <span>필수</span><input className="mom-input" inputMode="numeric" pattern="[0-9]+" value={key} onChange={(event) => setKey(event.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="예: 8" required /></label><label className="mom-input-group">별칭 <span>선택</span><input className="mom-input" value={alias} onChange={(event) => setAlias(event.target.value.slice(0, 12))} placeholder="예: 민들레" /><small>실명 대신 학생과 합의한 별칭을 사용하세요.</small></label><button className="mom-button mom-button-primary mom-button-block" disabled={saving || classes.length === 0}>{saving ? "저장 중…" : "학생 추가"}</button></div></form>
      </div>
    </div>
  );
}

function SettingsPage() {
  return <div className="teacher-page mom-stack-lg"><PageHeader eyebrow="설정" title="교사 계정과 데이터 원칙" description="AI 요약 설정은 Phase 3 전까지 노출하지 않습니다." /><section className="mom-panel"><div className="mom-panel-body teacher-settings"><div><span>표시 이름</span><strong>김수학</strong></div><div><span>이메일 상태</span><strong>인증 완료</strong></div><div><span>학생 개인정보</span><strong>번호 필수 · 별칭 선택 · 실명 미수집</strong></div><div><span>학부모 공유</span><strong>교사 검토 후 인쇄/PDF 저장</strong></div></div></section></div>;
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

function studentLabel(student: DemoStudent) {
  return student.alias ? `${student.rosterKey}번 · ${student.alias}` : `${student.rosterKey}번`;
}

function parentStudentLabel(student: DemoStudent) {
  return student.alias ?? "학생";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeZone: "Asia/Seoul" }).format(new Date(value));
}
