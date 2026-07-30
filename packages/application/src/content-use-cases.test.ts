import { describe, expect, it } from "vitest";
import type {
  ContentDraft,
  ContentReviewComment,
  ContentReviewRequest,
  ContentValidationResult,
  PublishedDiagnosisSet
} from "@middle-of-math/domain";
import {
  diagnosisContentValidator,
  diagnosticIntegrityGate,
  grade3Semester2Diagnosis
} from "../../content/src";
import type {
  ContentDraftFilter,
  ContentStudioRepository,
  DiagnosticIntegrityGate,
  PublishedDiagnosisSetRepository
} from "./ports";
import {
  ContentRevisionConflictError,
  ContentValidationError,
  CreateContentDraft,
  ForkRecoveryDraft,
  incrementSemanticVersion,
  PublishDiagnosisSet,
  RequestContentReview,
  ReviewContentDraft,
  SaveDraftRevision
} from "./use-cases";

class MemoryContentRepository implements ContentStudioRepository, PublishedDiagnosisSetRepository {
  drafts = new Map<string, ContentDraft>();
  published = new Map<string, PublishedDiagnosisSet>();
  reviews = new Map<string, ContentReviewRequest>();
  lastPublishValidation?: ContentValidationResult;

  async getCurrentContentMembership() { return null; }

  async listDrafts(filter: ContentDraftFilter = {}) {
    return [...this.drafts.values()].filter((draft) =>
      (!filter.ownerId || draft.ownerId === filter.ownerId) && (!filter.status || draft.status === filter.status)
    );
  }
  async getDraft(id: string) { return this.drafts.get(id) ?? null; }
  async getPublishedContent(id: string) { return this.published.get(id)?.content ?? null; }
  async listReviewRequests(filter: Parameters<ContentStudioRepository["listReviewRequests"]>[0] = {}) {
    return [...this.reviews.values()].filter((review) =>
      (!filter?.status || review.status === filter.status)
      && (!filter?.reviewerId || review.reviewerId === filter.reviewerId)
      && (!filter?.draftId || review.draftId === filter.draftId)
    );
  }
  async getReviewRequest(id: string) { return this.reviews.get(id) ?? null; }
  async getLatestReviewForDraft(draftId: string) {
    return [...this.reviews.values()].filter((review) => review.draftId === draftId).at(-1) ?? null;
  }
  async listReviewComments() { return []; }
  async addReviewComment(): Promise<ContentReviewComment> { throw new Error("not used"); }
  async resolveReviewComment(): Promise<ContentReviewComment> { throw new Error("not used"); }
  async createDraft(input: Parameters<ContentStudioRepository["createDraft"]>[0]) {
    const draft: ContentDraft = {
      ...input,
      status: "draft",
      revision: 1,
      createdAt: "2026-07-22T00:00:00.000Z",
      updatedAt: "2026-07-22T00:00:00.000Z"
    };
    this.drafts.set(draft.id, draft);
    return draft;
  }
  async saveDraft(input: Parameters<ContentStudioRepository["saveDraft"]>[0]) {
    const draft = this.drafts.get(input.draftId);
    if (!draft || draft.revision !== input.expectedRevision) throw new ContentRevisionConflictError();
    const saved = { ...draft, content: input.content, revision: draft.revision + 1 };
    this.drafts.set(draft.id, saved);
    return saved;
  }
  async requestReview(input: Parameters<ContentStudioRepository["requestReview"]>[0]) {
    const review: ContentReviewRequest = {
      id: input.id,
      draftId: input.draftId,
      draftRevision: input.expectedRevision,
      authorId: input.authorId,
      reviewerId: input.reviewerId,
      status: "pending",
      requestedAt: "2026-07-22T00:00:00.000Z"
    };
    this.reviews.set(review.id, review);
    return review;
  }
  async review(input: Parameters<ContentStudioRepository["review"]>[0]) {
    const current = this.reviews.get(input.reviewRequestId)!;
    const result: ContentReviewRequest = {
      ...current,
      reviewerId: input.reviewerId,
      status: input.decision === "approve" ? "approved" : "changes_requested",
      decidedAt: "2026-07-22T00:00:00.000Z"
    };
    this.reviews.set(result.id, result);
    return result;
  }
  async publish(input: Parameters<ContentStudioRepository["publish"]>[0]) {
    this.lastPublishValidation = structuredClone(input.validation);
    const draft = this.drafts.get(input.draftId)!;
    const result: PublishedDiagnosisSet = {
      id: "published-1",
      setKey: draft.setKey,
      version: input.version,
      checksum: "checksum-1",
      status: "published",
      content: draft.content,
      publishedAt: "2026-07-22T00:00:00.000Z"
    };
    this.published.set(result.id, result);
    return result;
  }
  async listPublished() { return [...this.published.values()]; }
  async getPublished(id: string) { return this.published.get(id) ?? null; }
  async getPublishedByVersion(setKey: string, version: string) {
    return [...this.published.values()].find((item) => item.setKey === setKey && item.version === version) ?? null;
  }
  async retire(id: string) {
    const item = this.published.get(id);
    if (item) this.published.set(id, { ...item, status: "retired" });
  }
}

const ids = { next: () => "draft-1" };

function attestedGate(
  configuredIssues: ContentValidationResult["issues"] = []
): DiagnosticIntegrityGate {
  return {
    inspect(input) {
      const errorCount = configuredIssues.filter((item) => item.severity === "error").length;
      const warningCount = configuredIssues.filter((item) => item.severity === "warning").length;
      return {
        valid: errorCount === 0,
        issues: structuredClone(configuredIssues),
        gates: [{
          gate: "diagnostic-integrity",
          gateVersion: "gate-test",
          policy: "enforce",
          enforced: true,
          setKey: input.setKey,
          targetVersion: input.targetVersion,
          blueprintRevision: "test-1",
          valid: errorCount === 0,
          errorCount,
          warningCount
        }]
      };
    }
  };
}

const gateError = {
  code: "DI_TEST_BLOCK",
  path: "/learnerStages/0",
  message: "진단 무결성 실패",
  severity: "error" as const
};

describe("content studio use cases", () => {
  it("defaults new content to 1.0.0 and existing edits to the next patch", () => {
    expect(incrementSemanticVersion(undefined)).toBe("1.0.0");
    expect(incrementSemanticVersion("1.0.0")).toBe("1.0.1");
    expect(incrementSemanticVersion("1.2.9", "minor")).toBe("1.3.0");
    expect(incrementSemanticVersion("1.2.9", "major")).toBe("2.0.0");
  });

  it("creates and saves a validated draft with optimistic revision", async () => {
    const repository = new MemoryContentRepository();
    const create = new CreateContentDraft(repository, diagnosisContentValidator, ids);
    const draft = await create.execute({
      setKey: "grade3-semester2",
      ownerId: "author-1",
      content: structuredClone(grade3Semester2Diagnosis)
    });
    const saved = await new SaveDraftRevision(repository).execute({
      draftId: draft.id,
      expectedRevision: 1,
      content: structuredClone(grade3Semester2Diagnosis)
    });
    expect(saved.revision).toBe(2);

    await expect(new SaveDraftRevision(repository).execute({
      draftId: draft.id,
      expectedRevision: 1,
      content: structuredClone(grade3Semester2Diagnosis)
    })).rejects.toBeInstanceOf(ContentRevisionConflictError);
  });

  it("autosaves structurally incomplete work while review remains fully validated", async () => {
    const repository = new MemoryContentRepository();
    const draft = await new CreateContentDraft(repository, diagnosisContentValidator, ids).execute({
      setKey: "grade3-semester2",
      ownerId: "author-1",
      content: structuredClone(grade3Semester2Diagnosis)
    });
    const incomplete = structuredClone(grade3Semester2Diagnosis);
    incomplete.judgments[0].prompt = "";
    const saved = await new SaveDraftRevision(repository).execute({
      draftId: draft.id,
      expectedRevision: 1,
      content: incomplete
    });
    expect(saved.content.judgments[0].prompt).toBe("");
    await expect(new RequestContentReview(repository, diagnosisContentValidator, { next: () => "review-1" }, diagnosticIntegrityGate).execute({
      draftId: draft.id,
      expectedRevision: 2,
      authorId: "author-1"
    })).rejects.toBeInstanceOf(ContentValidationError);
  });

  it("rejects invalid content before persistence or review", async () => {
    const repository = new MemoryContentRepository();
    const invalid = structuredClone(grade3Semester2Diagnosis);
    invalid.judgments[0].interaction = { type: "number-line", version: 1 };
    await expect(new CreateContentDraft(repository, diagnosisContentValidator, ids).execute({
      setKey: invalid.manifest.id,
      ownerId: "author-1",
      content: invalid
    })).rejects.toBeInstanceOf(ContentValidationError);
    expect(repository.drafts.size).toBe(0);
  });

  it("revalidates stable IDs against the published base before review and publish", async () => {
    const repository = new MemoryContentRepository();
    repository.published.set("base-1", {
      id: "base-1",
      setKey: grade3Semester2Diagnosis.manifest.id,
      version: "1.0.0",
      checksum: grade3Semester2Diagnosis.manifest.checksum,
      status: "published",
      content: structuredClone(grade3Semester2Diagnosis),
      publishedAt: "2026-07-22T00:00:00.000Z"
    });
    const draft = await new CreateContentDraft(repository, diagnosisContentValidator, ids).execute({
      setKey: "grade3-semester2",
      ownerId: "author-1",
      content: structuredClone(grade3Semester2Diagnosis),
      baseDiagnosisSetId: "base-1"
    });
    const removedId = structuredClone(grade3Semester2Diagnosis);
    removedId.judgments = removedId.judgments.slice(0, -1);
    await new SaveDraftRevision(repository).execute({
      draftId: draft.id,
      expectedRevision: 1,
      content: removedId
    });

    await expect(new RequestContentReview(repository, diagnosisContentValidator, { next: () => "review-1" }, diagnosticIntegrityGate).execute({
      draftId: draft.id,
      expectedRevision: 2,
      authorId: "author-1"
    })).rejects.toBeInstanceOf(ContentValidationError);
    await expect(new PublishDiagnosisSet(repository, diagnosisContentValidator, diagnosticIntegrityGate).execute({
      draftId: draft.id,
      expectedRevision: 2,
      reviewerId: "reviewer-1",
      version: "1.0.1",
      releaseNotes: "invalid removal"
    })).rejects.toBeInstanceOf(ContentValidationError);
  });

  it("forks a recovery copy without overwriting the conflicted server draft", async () => {
    const repository = new MemoryContentRepository();
    const originalContent = structuredClone(grade3Semester2Diagnosis);
    repository.published.set("base-1", {
      id: "base-1",
      setKey: originalContent.manifest.id,
      version: originalContent.manifest.version,
      checksum: originalContent.manifest.checksum,
      status: "published",
      content: structuredClone(originalContent),
      publishedAt: "2026-07-22T00:00:00.000Z"
    });
    const original = await new CreateContentDraft(repository, diagnosisContentValidator, { next: () => "original-draft" }).execute({
      setKey: originalContent.manifest.id,
      ownerId: "author-1",
      content: originalContent,
      baseDiagnosisSetId: "base-1"
    });
    const recoveryContent = structuredClone(originalContent);
    recoveryContent.judgments[0].prompt = "";
    const fork = await new ForkRecoveryDraft(repository, diagnosisContentValidator, { next: () => "recovery-draft" }).execute({
      setKey: recoveryContent.manifest.id,
      ownerId: "author-1",
      content: recoveryContent,
      baseDiagnosisSetId: "base-1"
    });

    expect(fork.id).toBe("recovery-draft");
    expect(fork.content.judgments[0].prompt).toBe("");
    expect((await repository.getDraft(original.id))?.content.judgments[0].prompt).toBe(originalContent.judgments[0].prompt);
  });

  it("pins review and publication to the latest draft revision", async () => {
    const repository = new MemoryContentRepository();
    const draft = await new CreateContentDraft(repository, diagnosisContentValidator, ids).execute({
      setKey: "grade3-semester2",
      ownerId: "author-1",
      content: structuredClone(grade3Semester2Diagnosis)
    });
    await expect(new RequestContentReview(repository, diagnosisContentValidator, { next: () => "review-1" }, diagnosticIntegrityGate).execute({
      draftId: draft.id,
      expectedRevision: 2,
      authorId: "author-1",
      reviewerId: "reviewer-1"
    })).rejects.toBeInstanceOf(ContentRevisionConflictError);

    const published = await new PublishDiagnosisSet(repository, diagnosisContentValidator, diagnosticIntegrityGate).execute({
      draftId: draft.id,
      expectedRevision: 1,
      reviewerId: "reviewer-1",
      version: "1.0.1",
      releaseNotes: "검수 반영"
    });
    expect(published.content.manifest.id).toBe("grade3-semester2");
    expect(await repository.getPublishedByVersion("grade3-semester2", "1.0.1")).toEqual(published);
  });

  it("blocks review requests when diagnostic integrity reports an error", async () => {
    const repository = new MemoryContentRepository();
    const draft = await new CreateContentDraft(
      repository,
      diagnosisContentValidator,
      ids
    ).execute({
      setKey: "grade3-semester2",
      ownerId: "author-1",
      content: structuredClone(grade3Semester2Diagnosis)
    });

    await expect(
      new RequestContentReview(
        repository,
        diagnosisContentValidator,
        { next: () => "review-1" },
        attestedGate([gateError])
      ).execute({
        draftId: draft.id,
        expectedRevision: 1,
        authorId: "author-1"
      })
    ).rejects.toMatchObject({
      name: "ContentValidationError",
      result: {
        issues: expect.arrayContaining([
          expect.objectContaining({ code: "DI_TEST_BLOCK" })
        ])
      }
    });
  });

  it("blocks approval but still allows requesting changes on invalid diagnostic content", async () => {
    const repository = new MemoryContentRepository();
    const draft = await new CreateContentDraft(
      repository,
      diagnosisContentValidator,
      ids
    ).execute({
      setKey: "grade3-semester2",
      ownerId: "author-1",
      content: structuredClone(grade3Semester2Diagnosis)
    });
    const review = await repository.requestReview({
      id: "review-1",
      draftId: draft.id,
      expectedRevision: draft.revision,
      authorId: "author-1",
      reviewerId: "reviewer-1"
    });

    const useCase = new ReviewContentDraft(
      repository,
      diagnosisContentValidator,
      attestedGate([gateError])
    );
    await expect(useCase.execute({
      reviewRequestId: review.id,
      expectedDraftRevision: draft.revision,
      reviewerId: "reviewer-1",
      decision: "approve"
    })).rejects.toBeInstanceOf(ContentValidationError);

    await expect(useCase.execute({
      reviewRequestId: review.id,
      expectedDraftRevision: draft.revision,
      reviewerId: "reviewer-1",
      decision: "request_changes"
    })).resolves.toMatchObject({ status: "changes_requested" });
  });

  it("blocks publication when the diagnostic gate fails", async () => {
    const repository = new MemoryContentRepository();
    const draft = await new CreateContentDraft(
      repository,
      diagnosisContentValidator,
      ids
    ).execute({
      setKey: "grade3-semester2",
      ownerId: "author-1",
      content: structuredClone(grade3Semester2Diagnosis)
    });

    await expect(
      new PublishDiagnosisSet(
        repository,
        diagnosisContentValidator,
        attestedGate([gateError])
      ).execute({
        draftId: draft.id,
        expectedRevision: draft.revision,
        reviewerId: "reviewer-1",
        version: "1.0.1",
        releaseNotes: "진단 게이트 실패 확인"
      })
    ).rejects.toBeInstanceOf(ContentValidationError);
  });

  it("passes the merged warning and scoped gate attestation into publication", async () => {
    const repository = new MemoryContentRepository();
    const draft = await new CreateContentDraft(
      repository,
      diagnosisContentValidator,
      ids
    ).execute({
      setKey: "grade3-semester2",
      ownerId: "author-1",
      content: structuredClone(grade3Semester2Diagnosis)
    });
    const warning = {
      code: "DI_TEST_WARNING",
      path: "/signals",
      message: "확인이 필요한 경고",
      severity: "warning" as const
    };

    await new PublishDiagnosisSet(
      repository,
      diagnosisContentValidator,
      attestedGate([warning])
    ).execute({
      draftId: draft.id,
      expectedRevision: draft.revision,
      reviewerId: "reviewer-1",
      version: "1.0.1",
      releaseNotes: "진단 게이트 기록"
    });

    expect(repository.lastPublishValidation).toMatchObject({
      valid: true,
      issues: [warning],
      gates: [expect.objectContaining({
        setKey: "grade3-semester2",
        targetVersion: "1.0.1",
        warningCount: 1
      })]
    });
  });
});
