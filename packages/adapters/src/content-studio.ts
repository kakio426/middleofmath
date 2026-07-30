import type {
  ContentDraftFilter,
  ContentReviewFilter,
  ContentStudioRepository,
  CurriculumAnchorRepository,
  PublishedDiagnosisSetRepository
} from "@middle-of-math/application";
import { ContentRevisionConflictError } from "@middle-of-math/application";
import type {
  ContentDraft,
  ContentReviewComment,
  ContentReviewDecision,
  ContentReviewRequest,
  ContentTeamMembership,
  ContentValidationResult,
  CurriculumAnchor,
  DiagnosisSet,
  PublishedDiagnosisSet
} from "@middle-of-math/domain";
import type { SupabaseClient } from "@supabase/supabase-js";

type JsonRow = Record<string, any>;

function curriculumGradeBand(grade: number): string | null {
  if (!Number.isInteger(grade) || grade < 1 || grade > 6) return null;
  const start = grade % 2 === 0 ? grade - 1 : grade;
  return `${start}-${start + 1}`;
}

export class SupabaseContentStudioRepository
implements ContentStudioRepository, PublishedDiagnosisSetRepository, CurriculumAnchorRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getCurrentContentMembership(): Promise<ContentTeamMembership | null> {
    const { data: auth, error: authError } = await this.client.auth.getUser();
    if (authError) throw authError;
    if (!auth.user) return null;
    const { data, error } = await this.client
      .from("content_team_members")
      .select("user_id, role, active")
      .eq("user_id", auth.user.id)
      .eq("active", true)
      .maybeSingle();
    if (error) throw error;
    return data ? { userId: String(data.user_id), role: data.role, active: Boolean(data.active) } : null;
  }

  async listDrafts(filter: ContentDraftFilter = {}): Promise<ContentDraft[]> {
    let query = this.client.from("content_drafts").select("*").order("updated_at", { ascending: false });
    if (filter.ownerId) query = query.eq("owner_id", filter.ownerId);
    if (filter.status) query = query.eq("status", filter.status);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapDraft);
  }

  async getDraft(draftId: string): Promise<ContentDraft | null> {
    const { data, error } = await this.client.from("content_drafts").select("*").eq("id", draftId).maybeSingle();
    if (error) throw error;
    return data ? mapDraft(data) : null;
  }

  async getPublishedContent(id: string): Promise<DiagnosisSet | null> {
    const published = await this.getPublished(id);
    return published?.content ?? null;
  }

  async listReviewRequests(filter: ContentReviewFilter = {}): Promise<ContentReviewRequest[]> {
    let query = this.client.from("content_review_requests").select("*").order("requested_at", { ascending: false });
    if (filter.status) query = query.eq("status", filter.status);
    if (filter.reviewerId) query = query.eq("reviewer_id", filter.reviewerId);
    if (filter.draftId) query = query.eq("draft_id", filter.draftId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapReview);
  }

  async getReviewRequest(reviewRequestId: string): Promise<ContentReviewRequest | null> {
    const { data, error } = await this.client.from("content_review_requests").select("*").eq("id", reviewRequestId).maybeSingle();
    if (error) throw error;
    return data ? mapReview(data) : null;
  }

  async getLatestReviewForDraft(draftId: string): Promise<ContentReviewRequest | null> {
    const { data, error } = await this.client
      .from("content_review_requests")
      .select("*")
      .eq("draft_id", draftId)
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? mapReview(data) : null;
  }

  async listReviewComments(reviewRequestId: string): Promise<ContentReviewComment[]> {
    const { data, error } = await this.client
      .from("content_review_comments")
      .select("*")
      .eq("review_request_id", reviewRequestId)
      .order("created_at");
    if (error) throw error;
    return (data ?? []).map(mapComment);
  }

  async addReviewComment(input: {
    id: string;
    reviewRequestId: string;
    authorId: string;
    path: string;
    body: string;
    required: boolean;
  }): Promise<ContentReviewComment> {
    const { data, error } = await this.client.from("content_review_comments").insert({
      id: input.id,
      review_request_id: input.reviewRequestId,
      author_id: input.authorId,
      path: input.path,
      body: input.body,
      required: input.required
    }).select("*").single();
    if (error) throw error;
    return mapComment(data);
  }

  async resolveReviewComment(commentId: string): Promise<ContentReviewComment> {
    const { data, error } = await this.client
      .from("content_review_comments")
      .update({ resolved_at: new Date().toISOString() })
      .eq("id", commentId)
      .select("*")
      .single();
    if (error) throw error;
    return mapComment(data);
  }

  async createDraft(input: {
    id: string;
    setKey: string;
    ownerId: string;
    content: DiagnosisSet;
    baseDiagnosisSetId?: string;
  }): Promise<ContentDraft> {
    const { data, error } = await this.client.from("content_drafts").insert({
      id: input.id,
      set_key: input.setKey,
      owner_id: input.ownerId,
      base_diagnosis_set_id: input.baseDiagnosisSetId ?? null,
      content: input.content
    }).select("*").single();
    if (error) throw error;
    return mapDraft(data);
  }

  async saveDraft(input: {
    draftId: string;
    expectedRevision: number;
    content: DiagnosisSet;
  }): Promise<ContentDraft> {
    const { data, error } = await this.client.rpc("save_content_draft", {
      p_draft_id: input.draftId,
      p_expected_revision: input.expectedRevision,
      p_content: input.content
    });
    if (error) throw mapContentError(error);
    return mapDraft(firstRow(data));
  }

  async requestReview(input: {
    id: string;
    draftId: string;
    expectedRevision: number;
    authorId: string;
    reviewerId?: string;
  }): Promise<ContentReviewRequest> {
    const { data, error } = await this.client.rpc("request_content_review", {
      p_request_id: input.id,
      p_draft_id: input.draftId,
      p_expected_revision: input.expectedRevision,
      p_reviewer_id: input.reviewerId ?? null
    });
    if (error) throw mapContentError(error);
    return mapReview(firstRow(data));
  }

  async review(input: {
    reviewRequestId: string;
    expectedDraftRevision: number;
    reviewerId: string;
    decision: ContentReviewDecision;
  }): Promise<ContentReviewRequest> {
    const { data, error } = await this.client.rpc("decide_content_review", {
      p_review_request_id: input.reviewRequestId,
      p_expected_draft_revision: input.expectedDraftRevision,
      p_decision: input.decision
    });
    if (error) throw mapContentError(error);
    return mapReview(firstRow(data));
  }

  async publish(input: {
    draftId: string;
    expectedRevision: number;
    reviewerId: string;
    version: string;
    releaseNotes: string;
    validation: ContentValidationResult;
  }): Promise<PublishedDiagnosisSet> {
    const { data, error } = await this.client.rpc("publish_diagnosis_set", {
      p_draft_id: input.draftId,
      p_expected_revision: input.expectedRevision,
      p_version: input.version,
      p_release_notes: input.releaseNotes,
      p_validation: input.validation
    });
    if (error) throw mapContentError(error);
    return mapPublished(firstRow(data));
  }

  async listPublished(): Promise<PublishedDiagnosisSet[]> {
    const { data, error } = await this.client
      .from("diagnosis_sets")
      .select("id, set_key, version, checksum, status, content, published_at")
      .in("status", ["published", "retired"])
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapPublished);
  }

  async getPublished(id: string): Promise<PublishedDiagnosisSet | null> {
    const { data, error } = await this.client
      .from("diagnosis_sets")
      .select("id, set_key, version, checksum, status, content, published_at")
      .eq("id", id)
      .in("status", ["published", "retired"])
      .maybeSingle();
    if (error) throw error;
    return data ? mapPublished(data) : null;
  }

  async getPublishedByVersion(setKey: string, version: string): Promise<PublishedDiagnosisSet | null> {
    const { data, error } = await this.client
      .from("diagnosis_sets")
      .select("id, set_key, version, checksum, status, content, published_at")
      .eq("set_key", setKey)
      .eq("version", version)
      .in("status", ["published", "retired"])
      .maybeSingle();
    if (error) throw error;
    return data ? mapPublished(data) : null;
  }

  async retire(id: string): Promise<void> {
    const { error } = await this.client.rpc("retire_diagnosis_set", { p_diagnosis_set_id: id });
    if (error) throw error;
  }

  async listApproved(input: { grade?: number; semester?: number; curriculum?: string } = {}): Promise<CurriculumAnchor[]> {
    let query = this.client.from("curriculum_anchors").select("anchor_key, label, source").eq("active", true).order("anchor_key");
    if (input.grade) {
      const gradeBand = curriculumGradeBand(input.grade);
      query = gradeBand
        ? query.or(
            `grade.eq.${input.grade},and(shared_across_grade_band.eq.true,grade_band.eq.${gradeBand})`
          )
        : query.eq("grade", input.grade);
    }
    if (input.semester) {
      query = query.or(
        `semester.eq.${input.semester},shared_across_semesters.eq.true`
      );
    }
    if (input.curriculum) query = query.eq("curriculum", input.curriculum);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row) => ({ id: row.anchor_key, label: row.label, source: row.source }));
  }
}

function firstRow(data: unknown): JsonRow {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") throw new Error("Supabase가 콘텐츠 결과를 반환하지 않았습니다.");
  return row as JsonRow;
}

function mapDraft(row: JsonRow): ContentDraft {
  return {
    id: String(row.id),
    setKey: String(row.set_key),
    ownerId: String(row.owner_id),
    status: row.status,
    baseDiagnosisSetId: row.base_diagnosis_set_id ? String(row.base_diagnosis_set_id) : undefined,
    content: row.content as DiagnosisSet,
    revision: Number(row.revision),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapReview(row: JsonRow): ContentReviewRequest {
  return {
    id: String(row.id),
    draftId: String(row.draft_id),
    draftRevision: Number(row.draft_revision),
    authorId: String(row.author_id),
    reviewerId: row.reviewer_id ? String(row.reviewer_id) : undefined,
    status: row.status,
    requestedAt: String(row.requested_at),
    decidedAt: row.decided_at ? String(row.decided_at) : undefined
  };
}

function mapComment(row: JsonRow): ContentReviewComment {
  return {
    id: String(row.id),
    reviewRequestId: String(row.review_request_id),
    authorId: String(row.author_id),
    path: String(row.path),
    body: String(row.body),
    required: Boolean(row.required),
    resolvedAt: row.resolved_at ? String(row.resolved_at) : undefined,
    createdAt: String(row.created_at)
  };
}

function mapPublished(row: JsonRow): PublishedDiagnosisSet {
  return {
    id: String(row.id),
    setKey: String(row.set_key),
    version: String(row.version),
    checksum: String(row.checksum),
    status: row.status,
    content: row.content as DiagnosisSet,
    publishedAt: String(row.published_at)
  };
}

function mapContentError(error: { message: string }): Error {
  if (/revision conflict/i.test(error.message)) return new ContentRevisionConflictError();
  return error as Error;
}
