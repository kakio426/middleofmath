import {
  createParentReport,
  generateClassSummary,
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
  type PublishedDiagnosisSet,
  type TeacherStudentReport
} from "@middle-of-math/domain";
import type {
  AssignmentRepository,
  Clock,
  ContentStudioRepository,
  ContentValidator,
  IdGenerator,
  LocalEventQueue,
  RemoteEventRepository,
  ReportRepository,
  SessionRepository,
  PublishedDiagnosisSetRepository
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
  constructor(private readonly reports: ReportRepository) {}

  async execute(
    diagnosisSet: DiagnosisSet,
    events: ObservationEvent[],
    studentLabel: string
  ): Promise<{ teacher: TeacherStudentReport; parent: ReturnType<typeof createParentReport> }> {
    const teacher = interpretSession(diagnosisSet, events);
    const parent = createParentReport(diagnosisSet, teacher, studentLabel);
    await this.reports.saveTeacherReport(teacher);
    if (this.reports.saveParentReport) await this.reports.saveParentReport(teacher.sessionId, parent);
    return { teacher, parent };
  }
}

export class GenerateClassSummary {
  execute(
    reports: Array<{ studentId: string; report: TeacherStudentReport }>,
    inProgressStudents = 0
  ): ClassSummary {
    return generateClassSummary(reports, inProgressStudents);
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
    private readonly ids: IdGenerator
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
    assertValid(this.validator.validate(draft.content, base ?? undefined));
    return this.content.requestReview({ id: this.ids.next(), ...input });
  }
}

export class ReviewContentDraft {
  constructor(private readonly content: ContentStudioRepository) {}

  execute(input: {
    reviewRequestId: string;
    expectedDraftRevision: number;
    reviewerId: string;
    decision: ContentReviewDecision;
  }): Promise<ContentReviewRequest> {
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
    private readonly validator: ContentValidator
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
    const validation = this.validator.validate(draft.content, base ?? undefined);
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
