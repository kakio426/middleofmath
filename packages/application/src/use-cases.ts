import {
  createParentReport,
  generateClassSummary,
  INTERPRETATION_ENGINE_VERSION,
  interpretSession,
  type ContentDraft,
  type ContentReviewComment,
  type ContentReviewDecision,
  type ContentReviewRequest,
  type ContentValidationResult,
  type ClassSummary,
  type DiagnosisSession,
  type DiagnosisSet,
  type JudgmentConfirmationPayload,
  type ObservationEvent,
  type ParentReportExportRecord,
  type PublishedDiagnosisSet,
  type TeacherAssignmentEvidenceBundle,
  type TeacherAssignmentInsights,
  type TeacherSessionEvidence,
  type TeacherStudentReport
} from "@middle-of-math/domain";
import type {
  AssignmentRepository,
  Clock,
  ContentStudioRepository,
  ContentValidator,
  DiagnosticIntegrityGate,
  IdGenerator,
  LocalEventQueue,
  RemoteEventRepository,
  ReportRepository,
  SessionRepository,
  PublishedDiagnosisSetRepository,
  TeacherInsightsRepository
} from "./ports";

export class StartSession {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly events: LocalEventQueue,
    private readonly clock: Clock,
    private readonly ids: IdGenerator
  ) {}

  async execute(input: {
    assignmentId: string;
    studentId: string;
    diagnosisSetId: string;
    diagnosisSetVersion: string;
  }): Promise<DiagnosisSession> {
    const resumable = await this.sessions.findResumable(input.assignmentId, input.studentId);
    if (resumable) return resumable;

    const now = this.clock.now().toISOString();
    const session: DiagnosisSession = {
      id: this.ids.next(),
      assignmentId: input.assignmentId,
      studentId: input.studentId,
      diagnosisSetId: input.diagnosisSetId,
      diagnosisSetVersion: input.diagnosisSetVersion,
      status: "in_progress",
      startedAt: now,
      lastEventSeq: 1
    };
    await this.sessions.create(session);
    await this.events.append({
      id: this.ids.next(),
      clientEventId: this.ids.next(),
      clientSeq: 1,
      sessionId: session.id,
      diagnosisSetId: session.diagnosisSetId,
      diagnosisSetVersion: session.diagnosisSetVersion,
      eventType: "session_started",
      interaction: { type: "choice", version: 1 },
      payload: {},
      occurredAt: now
    });
    return session;
  }
}

export class RecordJudgment {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly events: LocalEventQueue,
    private readonly clock: Clock,
    private readonly ids: IdGenerator
  ) {}

  async execute(input: {
    sessionId: string;
    judgmentId: string;
    interaction: { type: string; version: number };
    payload: JudgmentConfirmationPayload;
  }): Promise<ObservationEvent<JudgmentConfirmationPayload>> {
    const session = await this.sessions.get(input.sessionId);
    if (!session || !["in_progress", "sync_pending"].includes(session.status)) {
      throw new Error("진행 중인 세션을 찾을 수 없습니다.");
    }
    const event: ObservationEvent<JudgmentConfirmationPayload> = {
      id: this.ids.next(),
      clientEventId: this.ids.next(),
      clientSeq: session.lastEventSeq + 1,
      sessionId: session.id,
      diagnosisSetId: session.diagnosisSetId,
      diagnosisSetVersion: session.diagnosisSetVersion,
      eventType: "judgment_confirmed",
      judgmentId: input.judgmentId,
      interaction: input.interaction,
      payload: input.payload,
      occurredAt: this.clock.now().toISOString()
    };
    await this.events.append(event);
    await this.sessions.updateLastEventSeq(session.id, event.clientSeq);
    return event;
  }
}

export class SyncObservationEvents {
  constructor(
    private readonly local: LocalEventQueue,
    private readonly remote: RemoteEventRepository,
    private readonly sessions: SessionRepository
  ) {}

  async execute(sessionId?: string): Promise<number> {
    const pending = await this.local.listPending(sessionId);
    if (pending.length === 0) return 0;
    const acknowledgements = await this.remote.appendBatch(pending);
    await this.local.markSynced(
      acknowledgements.map((item) => item.clientEventId),
      acknowledgements[0]?.receivedAt ?? new Date().toISOString()
    );
    for (const id of new Set(pending.map((event) => event.sessionId))) {
      const session = await this.sessions.get(id);
      if (session?.status === "sync_pending") await this.sessions.updateStatus(id, "completed", session.completedAt);
    }
    return acknowledgements.length;
  }
}

export class CompleteSession {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly events: LocalEventQueue,
    private readonly clock: Clock,
    private readonly ids: IdGenerator
  ) {}

  async execute(sessionId: string): Promise<void> {
    const session = await this.sessions.get(sessionId);
    if (!session) throw new Error("세션을 찾을 수 없습니다.");
    if (session.status === "completed") return;
    const now = this.clock.now().toISOString();
    await this.events.append({
      id: this.ids.next(),
      clientEventId: this.ids.next(),
      clientSeq: session.lastEventSeq + 1,
      sessionId: session.id,
      diagnosisSetId: session.diagnosisSetId,
      diagnosisSetVersion: session.diagnosisSetVersion,
      eventType: "session_completed",
      interaction: { type: "choice", version: 1 },
      payload: {},
      occurredAt: now
    });
    await this.sessions.updateLastEventSeq(session.id, session.lastEventSeq + 1);
    await this.sessions.updateStatus(session.id, "sync_pending", now);
  }
}

export class GenerateStudentReport {
  constructor(
    private readonly reports: ReportRepository,
    private readonly clock: Clock
  ) {}

  async execute(
    diagnosisSet: DiagnosisSet,
    events: ObservationEvent[],
    studentLabel: string
  ): Promise<{
    teacher: TeacherStudentReport;
    parent: ReturnType<typeof createParentReport>;
    interpretationRun: Awaited<ReturnType<ReportRepository["saveInterpretationRun"]>>;
  }> {
    const teacher = interpretSession(
      diagnosisSet,
      events,
      undefined,
      this.clock.now().toISOString()
    );
    const parent = createParentReport(diagnosisSet, teacher, studentLabel);
    const interpretationRun = await this.reports.saveInterpretationRun(teacher);
    return { teacher, parent, interpretationRun };
  }
}

export class LoadClassInsights {
  constructor(private readonly insights: TeacherInsightsRepository) {}

  async execute(classId: string): Promise<TeacherAssignmentEvidenceBundle[]> {
    return this.insights.listClassAssignmentBundles(classId);
  }
}

export function selectLatestCompletedAttempt(
  attempts: TeacherSessionEvidence[]
): TeacherSessionEvidence | undefined {
  return attempts
    .filter((attempt) => attempt.session.status === "completed" && attempt.session.completedAt)
    .sort((left, right) => {
      const completed = right.session.completedAt!.localeCompare(left.session.completedAt!);
      if (completed !== 0) return completed;
      const started = right.session.startedAt.localeCompare(left.session.startedAt);
      if (started !== 0) return started;
      return right.session.id.localeCompare(left.session.id);
    })[0];
}

export class GenerateAssignmentInsights {
  constructor(
    private readonly insights: TeacherInsightsRepository,
    private readonly reports: ReportRepository,
    private readonly clock: Clock
  ) {}

  async execute(assignmentId: string): Promise<TeacherAssignmentInsights> {
    const bundle = await this.insights.getAssignmentBundle(assignmentId);
    if (!bundle) throw new Error("과제 근거를 찾을 수 없습니다.");
    const distractorNotes = await this.insights.listDistractorNotes({
      setKey: bundle.diagnosisSet.setKey,
      version: bundle.diagnosisSet.version
    }).catch(() => []);

    const studentReports: Array<{ studentId: string; report: TeacherStudentReport }> = [];
    const students = [];
    let inProgressStudents = 0;
    const contentPendingReason = getInterpretationPendingReason(bundle.diagnosisSet);

    for (const student of bundle.students) {
      const latest = selectLatestCompletedAttempt(student.sessions);
      if (student.sessions.some((attempt) => ["in_progress", "sync_pending"].includes(attempt.session.status))) {
        inProgressStudents += 1;
      }
      if (!latest) {
        students.push({
          student: student.student,
          interpretationStatus: student.sessions.some((attempt) => ["in_progress", "sync_pending"].includes(attempt.session.status))
            ? "in_progress" as const
            : "not_started" as const
        });
        continue;
      }
      if (contentPendingReason) {
        students.push({
          student: student.student,
          interpretationStatus: "interpretation_pending" as const,
          pendingReason: contentPendingReason,
          latestCompletedSessionId: latest.session.id
        });
        continue;
      }
      const persisted = latest.interpretationRuns.find((run) =>
        run.engineVersion === INTERPRETATION_ENGINE_VERSION
        && run.diagnosisSetVersion === bundle.diagnosisSet.version
      ) ?? await this.reports.getInterpretationRun({
        sessionId: latest.session.id,
        engineVersion: INTERPRETATION_ENGINE_VERSION,
        diagnosisSetVersion: bundle.diagnosisSet.version
      });
      const report = persisted?.report ?? interpretSession(
        bundle.diagnosisSet.content,
        latest.events,
        undefined,
        this.clock.now().toISOString()
      );
      if (!persisted) await this.reports.saveInterpretationRun(report);
      studentReports.push({ studentId: student.student.id, report });
      students.push({
        student: student.student,
        interpretationStatus: "ready" as const,
        latestCompletedSessionId: latest.session.id,
        report
      });
    }

    return {
      bundle,
      classSummary: generateClassSummary(
        studentReports,
        inProgressStudents,
        bundle.diagnosisSet.content
      ),
      students,
      distractorNotes
    };
  }
}

function getInterpretationPendingReason(
  diagnosisSet: PublishedDiagnosisSet
): "checksum_mismatch" | "unsupported_interaction_version" | undefined {
  if (diagnosisSet.checksum !== diagnosisSet.content.manifest.checksum) return "checksum_mismatch";
  const supported = new Set(["choice@1", "fraction-bar@1", "measurement@1", "pictograph@1"]);
  if (diagnosisSet.content.judgments.some((judgment) =>
    !supported.has(`${judgment.interaction.type}@${judgment.interaction.version}`)
  )) return "unsupported_interaction_version";
  return undefined;
}

export class ExportParentReport {
  constructor(
    private readonly insights: TeacherInsightsRepository,
    private readonly reports: ReportRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock
  ) {}

  async execute(input: { sessionId: string; reviewedBy: string }): Promise<ParentReportExportRecord> {
    const context = await this.insights.getSessionEvidence(input.sessionId);
    if (!context || context.evidence.session.status !== "completed") {
      throw new Error("완료된 세션 근거를 찾을 수 없습니다.");
    }
    if (getInterpretationPendingReason(context.diagnosisSet)) {
      throw new Error("콘텐츠 검증이 끝날 때까지 학부모 리포트를 내보낼 수 없습니다.");
    }
    const current = context.evidence.interpretationRuns.find((run) =>
      run.engineVersion === INTERPRETATION_ENGINE_VERSION
      && run.diagnosisSetVersion === context.diagnosisSet.version
    ) ?? await this.reports.getInterpretationRun({
      sessionId: context.evidence.session.id,
      engineVersion: INTERPRETATION_ENGINE_VERSION,
      diagnosisSetVersion: context.diagnosisSet.version
    });
    const report = current?.report ?? interpretSession(
      context.diagnosisSet.content,
      context.evidence.events,
      undefined,
      this.clock.now().toISOString()
    );
    const run = current ?? await this.reports.saveInterpretationRun(report);
    const studentLabel = context.student.displayAlias ?? "학생";
    const parent = createParentReport(context.diagnosisSet.content, report, studentLabel);
    return this.reports.saveParentReportExport({
      id: this.ids.next(),
      sessionId: context.evidence.session.id,
      interpretationRunId: run.id,
      reviewedBy: input.reviewedBy,
      report: parent
    });
  }
}

export class GenerateClassSummary {
  execute(
    reports: Array<{ studentId: string; report: TeacherStudentReport }>,
    inProgressStudents = 0,
    diagnosisSet?: DiagnosisSet
  ): ClassSummary {
    return generateClassSummary(reports, inProgressStudents, diagnosisSet);
  }
}

export class AssignDiagnosis {
  constructor(
    private readonly assignments: AssignmentRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator
  ) {}

  async execute(input: {
    classId: string;
    diagnosisSetId: string;
    diagnosisSetVersion: string;
    opensAt?: string;
    closesAt?: string;
  }): Promise<string> {
    const id = this.ids.next();
    await this.assignments.assign({
      id,
      classId: input.classId,
      diagnosisSetId: input.diagnosisSetId,
      diagnosisSetVersion: input.diagnosisSetVersion,
      opensAt: input.opensAt ?? this.clock.now().toISOString(),
      closesAt: input.closesAt
    });
    return id;
  }
}

export class ContentValidationError extends Error {
  constructor(readonly result: ContentValidationResult) {
    super("콘텐츠 검증을 통과하지 못했습니다.");
    this.name = "ContentValidationError";
  }
}

export class ContentRevisionConflictError extends Error {
  constructor(message = "다른 사용자가 먼저 저장했습니다. 최신 리비전을 다시 불러오세요.") {
    super(message);
    this.name = "ContentRevisionConflictError";
  }
}

function assertValid(result: ContentValidationResult): void {
  if (!result.valid) throw new ContentValidationError(result);
}

export function mergeValidationResults(
  ...results: ContentValidationResult[]
): ContentValidationResult {
  const issues = results.flatMap((result) => result.issues);
  const gates = results.flatMap((result) => result.gates ?? []);
  return {
    valid: !issues.some((item) => item.severity === "error"),
    issues,
    ...(gates.length > 0 ? { gates } : {})
  };
}

export function incrementSemanticVersion(
  current: string | undefined,
  bump: "patch" | "minor" | "major" = "patch"
): string {
  if (!current) return "1.0.0";
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(current);
  if (!match) throw new Error("올바른 콘텐츠 버전이 아닙니다.");
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

export function publishTargetVersion(
  draft: ContentDraft,
  base?: DiagnosisSet
): string {
  return base
    ? incrementSemanticVersion(base.manifest.version)
    : draft.content.manifest.version;
}

export class CreateContentDraft {
  constructor(
    private readonly content: ContentStudioRepository,
    private readonly validator: ContentValidator,
    private readonly ids: IdGenerator
  ) {}

  async execute(input: {
    setKey: string;
    ownerId: string;
    content: DiagnosisSet;
    baseDiagnosisSetId?: string;
  }): Promise<ContentDraft> {
    if (input.setKey !== input.content.manifest.id) {
      throw new Error("setKey와 콘텐츠 manifest ID가 일치해야 합니다.");
    }
    assertValid(this.validator.validate(input.content));
    return this.content.createDraft({ id: this.ids.next(), ...input });
  }
}

export class ForkRecoveryDraft {
  constructor(
    private readonly content: ContentStudioRepository,
    private readonly validator: ContentValidator,
    private readonly ids: IdGenerator
  ) {}

  async execute(input: {
    setKey: string;
    ownerId: string;
    content: DiagnosisSet;
    baseDiagnosisSetId?: string;
  }): Promise<ContentDraft> {
    if (input.setKey !== input.content.manifest.id) {
      throw new Error("복구 콘텐츠의 manifest ID가 세트 ID와 일치하지 않습니다.");
    }
    const base = input.baseDiagnosisSetId
      ? await this.content.getPublishedContent(input.baseDiagnosisSetId)
      : undefined;
    if (input.baseDiagnosisSetId && !base) throw new Error("복구 초안의 기준 발행본을 찾을 수 없습니다.");
    assertValid(this.validator.validateRecovery(input.content, base ?? undefined));
    return this.content.createDraft({ id: this.ids.next(), ...input });
  }
}

export class SaveDraftRevision {
  constructor(
    private readonly content: ContentStudioRepository,
    private readonly validator?: ContentValidator
  ) {}

  async execute(input: {
    draftId: string;
    expectedRevision: number;
    content: DiagnosisSet;
    baseContent?: DiagnosisSet;
  }): Promise<ContentDraft> {
    if (this.validator) {
      const result = this.validator.validate(input.content, input.baseContent);
      const structuralErrors = result.issues.filter((item) => item.code === "STABLE_ID_REMOVED");
      if (structuralErrors.length > 0) {
        throw new ContentValidationError({ valid: false, issues: structuralErrors });
      }
    }
    return this.content.saveDraft(input);
  }
}

export class RequestContentReview {
  constructor(
    private readonly content: ContentStudioRepository,
    private readonly validator: ContentValidator,
    private readonly ids: IdGenerator,
    private readonly gate: DiagnosticIntegrityGate
  ) {}

  async execute(input: {
    draftId: string;
    expectedRevision: number;
    authorId: string;
    reviewerId?: string;
  }): Promise<ContentReviewRequest> {
    const draft = await this.content.getDraft(input.draftId);
    if (!draft) throw new Error("초안을 찾을 수 없습니다.");
    if (draft.revision !== input.expectedRevision) throw new ContentRevisionConflictError();
    const base = draft.baseDiagnosisSetId
      ? await this.content.getPublishedContent(draft.baseDiagnosisSetId)
      : undefined;
    assertValid(mergeValidationResults(
      this.validator.validate(draft.content, base ?? undefined),
      this.gate.inspect({
        content: draft.content,
        setKey: draft.setKey,
        targetVersion: publishTargetVersion(draft, base ?? undefined)
      })
    ));
    return this.content.requestReview({ id: this.ids.next(), ...input });
  }
}

export class ReviewContentDraft {
  constructor(
    private readonly content: ContentStudioRepository,
    private readonly validator: ContentValidator,
    private readonly gate: DiagnosticIntegrityGate
  ) {}

  async execute(input: {
    reviewRequestId: string;
    expectedDraftRevision: number;
    reviewerId: string;
    decision: ContentReviewDecision;
  }): Promise<ContentReviewRequest> {
    if (input.decision === "approve") {
      const review = await this.content.getReviewRequest(input.reviewRequestId);
      if (!review) throw new Error("검수 요청을 찾을 수 없습니다.");
      const draft = await this.content.getDraft(review.draftId);
      if (!draft) throw new Error("초안을 찾을 수 없습니다.");
      if (draft.revision !== input.expectedDraftRevision) {
        throw new ContentRevisionConflictError();
      }
      const base = draft.baseDiagnosisSetId
        ? await this.content.getPublishedContent(draft.baseDiagnosisSetId)
        : undefined;
      assertValid(mergeValidationResults(
        this.validator.validate(draft.content, base ?? undefined),
        this.gate.inspect({
          content: draft.content,
          setKey: draft.setKey,
          targetVersion: publishTargetVersion(draft, base ?? undefined)
        })
      ));
    }
    return this.content.review(input);
  }
}

export class AddContentReviewComment {
  constructor(
    private readonly content: ContentStudioRepository,
    private readonly ids: IdGenerator
  ) {}

  execute(input: {
    reviewRequestId: string;
    authorId: string;
    path: string;
    body: string;
    required?: boolean;
  }): Promise<ContentReviewComment> {
    if (!input.path.startsWith("/")) throw new Error("검수 의견 경로는 JSON Pointer여야 합니다.");
    if (!input.body.trim()) throw new Error("검수 의견을 입력해 주세요.");
    return this.content.addReviewComment({
      ...input,
      id: this.ids.next(),
      required: input.required ?? true
    });
  }
}

export class ResolveContentReviewComment {
  constructor(private readonly content: ContentStudioRepository) {}

  execute(commentId: string): Promise<ContentReviewComment> {
    return this.content.resolveReviewComment(commentId);
  }
}

export class PublishDiagnosisSet {
  constructor(
    private readonly content: ContentStudioRepository,
    private readonly validator: ContentValidator,
    private readonly gate: DiagnosticIntegrityGate
  ) {}

  async execute(input: {
    draftId: string;
    expectedRevision: number;
    reviewerId: string;
    version: string;
    releaseNotes: string;
  }): Promise<PublishedDiagnosisSet> {
    const draft = await this.content.getDraft(input.draftId);
    if (!draft) throw new Error("초안을 찾을 수 없습니다.");
    if (draft.revision !== input.expectedRevision) throw new ContentRevisionConflictError();
    const base = draft.baseDiagnosisSetId
      ? await this.content.getPublishedContent(draft.baseDiagnosisSetId)
      : undefined;
    const validation = mergeValidationResults(
      this.validator.validate(draft.content, base ?? undefined),
      this.gate.inspect({
        content: draft.content,
        setKey: draft.setKey,
        targetVersion: input.version
      })
    );
    assertValid(validation);
    return this.content.publish({ ...input, validation });
  }
}

export class RetireDiagnosisSet {
  constructor(private readonly published: PublishedDiagnosisSetRepository) {}

  execute(id: string): Promise<void> {
    return this.published.retire(id);
  }
}

export class ImportContent {
  constructor(
    private readonly createDraft: CreateContentDraft,
    private readonly validator: ContentValidator
  ) {}

  async execute(input: { ownerId: string; serialized: string }): Promise<ContentDraft> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(input.serialized);
    } catch {
      throw new Error("올바른 JSON 파일이 아닙니다.");
    }
    const validation = this.validator.validate(parsed);
    assertValid(validation);
    const content = parsed as DiagnosisSet;
    return this.createDraft.execute({
      setKey: content.manifest.id,
      ownerId: input.ownerId,
      content
    });
  }
}

export class ExportContent {
  constructor(
    private readonly drafts: ContentStudioRepository,
    private readonly published: PublishedDiagnosisSetRepository
  ) {}

  async execute(input: { draftId?: string; publishedId?: string }): Promise<string> {
    if (input.draftId) {
      const draft = await this.drafts.getDraft(input.draftId);
      if (!draft) throw new Error("초안을 찾을 수 없습니다.");
      return JSON.stringify(draft.content, null, 2);
    }
    if (input.publishedId) {
      const diagnosis = await this.published.getPublished(input.publishedId);
      if (!diagnosis) throw new Error("발행 콘텐츠를 찾을 수 없습니다.");
      return JSON.stringify(diagnosis.content, null, 2);
    }
    throw new Error("내보낼 콘텐츠 ID가 필요합니다.");
  }
}
