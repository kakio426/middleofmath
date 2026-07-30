import type {
  ContentDraft,
  ContentReviewComment,
  ContentReviewDecision,
  ContentReviewRequest,
  ContentTeamMembership,
  ContentValidationResult,
  CurriculumAnchor,
  DiagnosisSet,
  DiagnosisSession,
  InterpretationRunRecord,
  ObservationEvent,
  ParentReport,
  ParentReportExportRecord,
  PrivacySafeDailyAggregate,
  PublishedDiagnosisSet,
  TeacherAssignmentEvidenceBundle,
  TeacherSessionEvidenceContext,
  TeacherStudentReport
} from "@middle-of-math/domain";

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}

export interface SessionRepository {
  create(session: DiagnosisSession): Promise<void>;
  get(sessionId: string): Promise<DiagnosisSession | null>;
  findResumable(assignmentId: string, studentId: string): Promise<DiagnosisSession | null>;
  updateStatus(sessionId: string, status: DiagnosisSession["status"], completedAt?: string): Promise<void>;
  updateLastEventSeq(sessionId: string, lastEventSeq: number): Promise<void>;
}

export interface LocalEventQueue {
  append(event: ObservationEvent): Promise<void>;
  listPending(sessionId?: string): Promise<ObservationEvent[]>;
  markSynced(clientEventIds: string[], receivedAt: string): Promise<void>;
}

export interface RemoteEventRepository {
  appendBatch(events: ObservationEvent[]): Promise<Array<{ clientEventId: string; receivedAt: string }>>;
  listBySession(sessionId: string): Promise<ObservationEvent[]>;
}

export interface AssignmentRepository {
  assign(input: {
    id: string;
    classId: string;
    diagnosisSetId: string;
    diagnosisSetVersion: string;
    opensAt: string;
    closesAt?: string;
  }): Promise<void>;
}

export interface ReportRepository {
  saveInterpretationRun(report: TeacherStudentReport): Promise<InterpretationRunRecord>;
  getInterpretationRun(input: {
    sessionId: string;
    engineVersion: string;
    diagnosisSetVersion: string;
  }): Promise<InterpretationRunRecord | null>;
  saveParentReportExport(input: {
    id: string;
    sessionId: string;
    interpretationRunId: string;
    reviewedBy: string;
    report: ParentReport;
  }): Promise<ParentReportExportRecord>;
}

export interface TeacherInsightsRepository {
  getAssignmentBundle(assignmentId: string): Promise<TeacherAssignmentEvidenceBundle | null>;
  listClassAssignmentBundles(classId: string): Promise<TeacherAssignmentEvidenceBundle[]>;
  getSessionEvidence(sessionId: string): Promise<TeacherSessionEvidenceContext | null>;
  listDailyAggregates(from: string, to: string): Promise<PrivacySafeDailyAggregate[]>;
}

export interface AiSummarizer {
  summarize(input: { anonymousFindings: Array<{ signalId: string; evidenceCount: number }> }): Promise<string>;
}

export interface ContentDraftFilter {
  ownerId?: string;
  status?: ContentDraft["status"];
}

export interface ContentReviewFilter {
  status?: ContentReviewRequest["status"];
  reviewerId?: string;
  draftId?: string;
}

export interface ContentStudioRepository {
  getCurrentContentMembership(): Promise<ContentTeamMembership | null>;
  listDrafts(filter?: ContentDraftFilter): Promise<ContentDraft[]>;
  getDraft(draftId: string): Promise<ContentDraft | null>;
  getPublishedContent(id: string): Promise<DiagnosisSet | null>;
  listReviewRequests(filter?: ContentReviewFilter): Promise<ContentReviewRequest[]>;
  getReviewRequest(reviewRequestId: string): Promise<ContentReviewRequest | null>;
  getLatestReviewForDraft(draftId: string): Promise<ContentReviewRequest | null>;
  listReviewComments(reviewRequestId: string): Promise<ContentReviewComment[]>;
  addReviewComment(input: {
    id: string;
    reviewRequestId: string;
    authorId: string;
    path: string;
    body: string;
    required: boolean;
  }): Promise<ContentReviewComment>;
  resolveReviewComment(commentId: string): Promise<ContentReviewComment>;
  createDraft(input: {
    id: string;
    setKey: string;
    ownerId: string;
    content: DiagnosisSet;
    baseDiagnosisSetId?: string;
  }): Promise<ContentDraft>;
  saveDraft(input: {
    draftId: string;
    expectedRevision: number;
    content: DiagnosisSet;
  }): Promise<ContentDraft>;
  requestReview(input: {
    id: string;
    draftId: string;
    expectedRevision: number;
    authorId: string;
    reviewerId?: string;
  }): Promise<ContentReviewRequest>;
  review(input: {
    reviewRequestId: string;
    expectedDraftRevision: number;
    reviewerId: string;
    decision: ContentReviewDecision;
  }): Promise<ContentReviewRequest>;
  publish(input: {
    draftId: string;
    expectedRevision: number;
    reviewerId: string;
    version: string;
    releaseNotes: string;
    validation: ContentValidationResult;
  }): Promise<PublishedDiagnosisSet>;
}

export interface PublishedDiagnosisSetRepository {
  listPublished(): Promise<PublishedDiagnosisSet[]>;
  getPublished(id: string): Promise<PublishedDiagnosisSet | null>;
  getPublishedByVersion(setKey: string, version: string): Promise<PublishedDiagnosisSet | null>;
  retire(id: string): Promise<void>;
}

export interface CurriculumAnchorRepository {
  listApproved(input?: { grade?: number; semester?: number; curriculum?: string }): Promise<CurriculumAnchor[]>;
}

export interface ContentValidator {
  validate(content: unknown, baseContent?: DiagnosisSet): ContentValidationResult;
  validateRecovery(content: unknown, baseContent?: DiagnosisSet): ContentValidationResult;
}

export interface DiagnosticIntegrityGate {
  inspect(input: {
    content: DiagnosisSet;
    setKey: string;
    targetVersion: string;
  }): ContentValidationResult;
}
