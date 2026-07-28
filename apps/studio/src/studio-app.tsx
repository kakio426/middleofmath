import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  CryptoIdGenerator,
  createMiddleOfMathClient,
  SupabaseContentStudioRepository
} from "@middle-of-math/adapters";
import {
  AddContentReviewComment,
  CreateContentDraft,
  ForkRecoveryDraft,
  PublishDiagnosisSet,
  RequestContentReview,
  ResolveContentReviewComment,
  ReviewContentDraft,
  SaveDraftRevision
} from "@middle-of-math/application";
import { diagnosisContentValidator, grade3Semester2Diagnosis } from "@middle-of-math/content";
import type {
  ContentDraft,
  ContentReviewComment,
  ContentReviewRequest,
  DiagnosisSet,
  Judgment,
  SignalDefinition
} from "@middle-of-math/domain";
import { Brand, ChoiceOption, ProgressLine, StatusPill, VisualAid } from "@middle-of-math/ui";
import {
  cloneAsDraft,
  collectStudioIssues,
  structurallyEqual,
  summarizeVisual,
  updateJudgment,
  updateSignal
} from "./studio-model";

type Page = "library" | "editor" | "review" | "versions";
type EditorTab = "judgment" | "interpretation" | "metadata";
type Workflow = "draft" | "in_review" | "changes_requested" | "approved" | "published";
type StudioRole = "author" | "reviewer" | "admin";
type SaveState = "saved" | "saving" | "offline" | "conflict";

interface LocalDraftRecord {
  content: DiagnosisSet;
  revision: number;
  workflow: Workflow;
  updatedAt: string;
}

const LOCAL_DRAFT_KEY = "middle-of-math.studio.grade3-semester2.v1";
const LOCAL_RECOVERY_PREFIX = "middle-of-math.studio.recovery.v2";
const baseline = grade3Semester2Diagnosis;

function publicConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  return url && publishableKey ? { url, publishableKey } : null;
}

const runtimeConfig = publicConfig();
const demoMode = import.meta.env.VITE_DEMO_MODE === "true";
const runtimeClient = runtimeConfig && !demoMode ? createMiddleOfMathClient(runtimeConfig) : null;
const ids = new CryptoIdGenerator();

function readLocalDraft(): LocalDraftRecord {
  const raw = localStorage.getItem(LOCAL_DRAFT_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as LocalDraftRecord;
    } catch {
      localStorage.removeItem(LOCAL_DRAFT_KEY);
    }
  }
  return {
    content: cloneAsDraft(baseline),
    revision: 1,
    workflow: "draft",
    updatedAt: new Date().toISOString()
  };
}

function recoveryStorageKey(userId: string | null, draftId: string | null): string {
  return `${LOCAL_RECOVERY_PREFIX}.${userId ?? "local"}.${draftId ?? "grade3-semester2"}`;
}

function readRecoveryDraft(key: string): LocalDraftRecord | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LocalDraftRecord;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function nextPatchVersion(version: string): string {
  const [major, minor, patch] = version.split(".").map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

function compareVersionsDescending(left: string, right: string): number {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) return rightParts[index] - leftParts[index];
  }
  return 0;
}

export function StudioApp() {
  const client = runtimeClient;
  const repository = useMemo(() => client ? new SupabaseContentStudioRepository(client) : null, [client]);
  const remoteLoadStarted = useRef(false);
  const authGeneration = useRef(0);
  const activeIdentity = useRef<{ userId: string | null; draftId: string | null }>({
    userId: null,
    draftId: null
  });
  const initialRecord = useMemo(readLocalDraft, []);
  const [signedIn, setSignedIn] = useState(!client && demoMode);
  const [authReady, setAuthReady] = useState(!client);
  const [authError, setAuthError] = useState<string | null>(null);
  const [page, setPage] = useState<Page>("library");
  const [role, setRole] = useState<StudioRole>("author");
  const [userId, setUserId] = useState<string | null>(null);
  const [remoteDraftId, setRemoteDraftId] = useState<string | null>(null);
  const [reviewRequest, setReviewRequest] = useState<ContentReviewRequest | null>(null);
  const [reviewComments, setReviewComments] = useState<ContentReviewComment[]>([]);
  const [remoteReady, setRemoteReady] = useState(!repository && demoMode);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [draft, setDraft] = useState(initialRecord.content);
  const [baseContent, setBaseContent] = useState<DiagnosisSet>(baseline);
  const [persistedJson, setPersistedJson] = useState(() => JSON.stringify(initialRecord.content));
  const [revision, setRevision] = useState(initialRecord.revision);
  const [workflow, setWorkflow] = useState<Workflow>(initialRecord.workflow);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [recoveryDraft, setRecoveryDraft] = useState<LocalDraftRecord | null>(() =>
    repository || !demoMode ? null : readRecoveryDraft(recoveryStorageKey(null, null))
  );
  const [selectedJudgmentId, setSelectedJudgmentId] = useState(initialRecord.content.judgments[0]?.id ?? "");
  const [editorTab, setEditorTab] = useState<EditorTab>("judgment");
  const [notice, setNotice] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light"
  );
  const [online, setOnline] = useState(navigator.onLine);

  const issues = useMemo(() => collectStudioIssues(draft, baseContent), [draft, baseContent]);
  const errors = issues.filter((issue) => issue.level === "error");
  const selectedJudgment = draft.judgments.find((judgment) => judgment.id === selectedJudgmentId) ?? draft.judgments[0];
  const selectedStage = draft.learnerStages.find((stage) => stage.id === selectedJudgment?.learnerStageId);
  const relatedSignals = selectedJudgment
    ? draft.signals.filter((signal) => selectedJudgment.choices.some((choice) => choice.signalIds?.includes(signal.id)))
    : [];
  const editable = (role === "author" || role === "admin") && (workflow === "draft" || workflow === "changes_requested");
  const hasWorkingDraft = demoMode || Boolean(remoteDraftId);
  const nextVersion = nextPatchVersion(draft.manifest.version);

  const resetRemoteWorkspace = useCallback((nextUserId: string | null) => {
    const cleanDraft = cloneAsDraft(baseline);
    authGeneration.current += 1;
    remoteLoadStarted.current = false;
    activeIdentity.current = { userId: nextUserId, draftId: null };
    setSignedIn(Boolean(nextUserId));
    setUserId(nextUserId);
    setRemoteReady(!repository);
    setRemoteDraftId(null);
    setRole("author");
    setReviewRequest(null);
    setReviewComments([]);
    setRecoveryDraft(null);
    setAccessError(null);
    setAuthError(null);
    setDraft(cleanDraft);
    setBaseContent(baseline);
    setPersistedJson(JSON.stringify(cleanDraft));
    setRevision(1);
    setWorkflow("draft");
    setSaveState("saved");
    setSelectedJudgmentId(cleanDraft.judgments[0]?.id ?? "");
    setPage("library");
    setNotice(null);
  }, [repository]);

  useEffect(() => {
    if (!client) return;
    let active = true;
    let authEventSeen = false;
    const applySession = (nextUserId: string | null) => {
      if (activeIdentity.current.userId !== nextUserId) {
        resetRemoteWorkspace(nextUserId);
      } else {
        setSignedIn(Boolean(nextUserId));
        setUserId(nextUserId);
      }
      setAuthReady(true);
    };
    void client.auth.getSession().then(({ data }) => {
      if (!active || authEventSeen) return;
      applySession(data.session?.user.id ?? null);
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      authEventSeen = true;
      applySession(session?.user.id ?? null);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client, resetRemoteWorkspace]);

  useEffect(() => {
    if (!repository || !signedIn || !userId || remoteLoadStarted.current) return;
    remoteLoadStarted.current = true;
    let active = true;
    const generation = authGeneration.current;
    const isCurrent = () => active
      && authGeneration.current === generation
      && activeIdentity.current.userId === userId;
    void (async () => {
      try {
        const membership = await repository.getCurrentContentMembership();
        if (!membership?.active) {
          if (isCurrent()) {
            setAccessError("이 계정에는 콘텐츠 제작 또는 검수 권한이 없습니다.");
            setRemoteReady(true);
          }
          return;
        }
        if (membership.userId !== userId) {
          throw new Error("현재 로그인 계정과 콘텐츠 권한 정보가 일치하지 않습니다.");
        }
        if (!isCurrent()) return;
        setRole(membership.role);
        const drafts = await repository.listDrafts();
        let target: ContentDraft | undefined;
        let targetReview: ContentReviewRequest | null = null;

        if (membership.role === "reviewer") {
          const pending = await repository.listReviewRequests({ status: "pending", reviewerId: membership.userId });
          const unassigned = pending.length === 0 ? await repository.listReviewRequests({ status: "pending" }) : [];
          targetReview = pending[0] ?? unassigned.find((item) => !item.reviewerId) ?? null;
          target = targetReview ? drafts.find((item) => item.id === targetReview?.draftId) : drafts.find((item) => item.status === "in_review");
        } else {
          target = drafts.find((item) => item.ownerId === membership.userId && item.setKey === baseline.manifest.id && item.status !== "published");
          if (!target) {
            const published = (await repository.listPublished())
              .filter((item) => item.setKey === baseline.manifest.id && item.status === "published")
              .sort((left, right) => compareVersionsDescending(left.version, right.version))[0];
            target = await new CreateContentDraft(repository, diagnosisContentValidator, ids).execute({
              setKey: baseline.manifest.id,
              ownerId: membership.userId,
              content: cloneAsDraft(published?.content ?? baseline),
              baseDiagnosisSetId: published?.id
            });
          }
          targetReview = await repository.getLatestReviewForDraft(target.id);
        }

        if (target) {
          if (!targetReview) targetReview = await repository.getLatestReviewForDraft(target.id);
          const publishedBase = target.baseDiagnosisSetId ? await repository.getPublished(target.baseDiagnosisSetId) : null;
          const comments = targetReview ? await repository.listReviewComments(targetReview.id) : [];
          if (!isCurrent()) return;
          activeIdentity.current = { userId: membership.userId, draftId: target.id };
          setRemoteDraftId(target.id);
          setRecoveryDraft(readRecoveryDraft(recoveryStorageKey(membership.userId, target.id)));
          setDraft(target.content);
          setBaseContent(publishedBase?.content ?? baseline);
          setRevision(target.revision);
          setWorkflow(target.status);
          setPersistedJson(JSON.stringify(target.content));
          setSelectedJudgmentId(target.content.judgments[0]?.id ?? "");
          setReviewRequest(targetReview);
          setReviewComments(comments);
          if (membership.role === "reviewer" && targetReview) setPage("review");
        }
        if (isCurrent()) setRemoteReady(true);
      } catch (error) {
        if (isCurrent()) {
          setAccessError(error instanceof Error ? error.message : "콘텐츠 작업 공간을 열지 못했습니다.");
          setRemoteReady(true);
        }
      }
    })();
    return () => { active = false; };
  }, [repository, signedIn, userId]);

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
    const nextJson = JSON.stringify(draft);
    if (!remoteReady || nextJson === persistedJson) return;
    if (saveState === "saving" || saveState === "conflict") return;
    const timer = window.setTimeout(() => {
      const next: LocalDraftRecord = {
        content: draft,
        revision,
        workflow,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(next));
      if (repository) {
        if (!remoteDraftId || !online) {
          setSaveState("offline");
          return;
        }
        const generation = authGeneration.current;
        const requestUserId = userId;
        const requestDraftId = remoteDraftId;
        const recoveryKey = recoveryStorageKey(requestUserId, requestDraftId);
        const isCurrent = () => authGeneration.current === generation
          && activeIdentity.current.userId === requestUserId
          && activeIdentity.current.draftId === requestDraftId;
        setSaveState("saving");
        void new SaveDraftRevision(repository, diagnosisContentValidator).execute({
          draftId: requestDraftId,
          expectedRevision: revision,
          content: draft,
          baseContent
        }).then((saved) => {
          if (!isCurrent()) return;
          setRevision(saved.revision);
          setWorkflow(saved.status);
          setPersistedJson(JSON.stringify(saved.content));
          setSaveState("saved");
        }).catch(async (error: Error) => {
          if (error.name === "ContentRevisionConflictError") {
            localStorage.setItem(recoveryKey, JSON.stringify(next));
            if (!isCurrent()) return;
            setRecoveryDraft(next);
            try {
              const latest = await repository.getDraft(requestDraftId);
              if (!isCurrent()) return;
              if (latest) {
                setDraft(latest.content);
                setRevision(latest.revision);
                setWorkflow(latest.status);
                setPersistedJson(JSON.stringify(latest.content));
              }
              setNotice("서버의 최신 리비전을 불러왔습니다. 로컬 복구 사본을 비교해 다시 적용할 수 있습니다.");
            } catch {
              if (!isCurrent()) return;
              setNotice("내 편집본을 복구 사본으로 보관했습니다. 네트워크를 확인한 뒤 ‘내 편집 다시 적용’을 눌러 주세요.");
            } finally {
              if (isCurrent()) setSaveState("conflict");
            }
            return;
          }
          if (online) {
            localStorage.setItem(recoveryKey, JSON.stringify(next));
            if (!isCurrent()) return;
            setRecoveryDraft(next);
            setSaveState("conflict");
            setNotice(`${error.message} 내 편집본은 복구 사본으로 보관했습니다.`);
          } else if (isCurrent()) {
            setSaveState("offline");
            setNotice(error.message);
          }
        });
        return;
      }
      const localRevision = revision + 1;
      setRevision(localRevision);
      setPersistedJson(nextJson);
      localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify({ ...next, revision: localRevision }));
      setSaveState(online ? "saved" : "offline");
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [draft, persistedJson, revision, workflow, repository, remoteDraftId, remoteReady, online, baseContent, saveState]);

  async function signIn(email: string, password: string) {
    if (!client) return;
    setAuthError(null);
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError("이메일과 비밀번호 또는 콘텐츠 제작 권한을 확인해 주세요.");
      return;
    }
  }

  async function restoreRecoveryDraft() {
    if (!recoveryDraft) return;
    const generation = authGeneration.current;
    const requestUserId = userId;
    const requestDraftId = remoteDraftId;
    const recoveryKey = recoveryStorageKey(requestUserId, requestDraftId);
    const isCurrent = () => authGeneration.current === generation
      && activeIdentity.current.userId === requestUserId
      && activeIdentity.current.draftId === requestDraftId;
    try {
      if (repository && requestDraftId && requestUserId) {
        const currentDraft = await repository.getDraft(requestDraftId);
        if (!isCurrent()) return;
        if (!currentDraft) throw new Error("서버 초안을 찾을 수 없습니다.");
        const fork = await new ForkRecoveryDraft(repository, diagnosisContentValidator, ids).execute({
          setKey: recoveryDraft.content.manifest.id,
          ownerId: requestUserId,
          content: recoveryDraft.content,
          baseDiagnosisSetId: currentDraft.baseDiagnosisSetId
        });
        localStorage.removeItem(recoveryKey);
        if (!isCurrent()) return;
        activeIdentity.current = { userId: requestUserId, draftId: fork.id };
        setRemoteDraftId(fork.id);
        setDraft(fork.content);
        setRevision(fork.revision);
        setWorkflow(fork.status);
        setPersistedJson(JSON.stringify(fork.content));
        setSelectedJudgmentId(recoveryDraft.content.judgments[0]?.id ?? "");
        setRecoveryDraft(null);
        setSaveState("saved");
        setNotice("복구 사본을 별도 초안으로 만들었습니다. 서버의 기존 초안은 그대로 유지됩니다.");
        return;
      } else {
        setDraft(recoveryDraft.content);
        setPersistedJson(JSON.stringify(recoveryDraft.content));
        localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(recoveryDraft));
        localStorage.removeItem(recoveryStorageKey(null, null));
      }
      setSelectedJudgmentId(recoveryDraft.content.judgments[0]?.id ?? "");
      setRecoveryDraft(null);
      setSaveState("saved");
      setNotice("로컬 복구 사본을 다시 열었습니다.");
    } catch (error) {
      if (repository && !isCurrent()) return;
      setSaveState("conflict");
      setNotice(error instanceof Error ? error.message : "복구 사본을 적용하지 못했습니다.");
    }
  }

  async function discardRecoveryDraft() {
    const generation = authGeneration.current;
    const requestUserId = userId;
    const requestDraftId = remoteDraftId;
    const recoveryKey = recoveryStorageKey(requestUserId, requestDraftId);
    const isCurrent = () => authGeneration.current === generation
      && activeIdentity.current.userId === requestUserId
      && activeIdentity.current.draftId === requestDraftId;
    try {
      if (repository && requestDraftId) {
        const latest = await repository.getDraft(requestDraftId);
        if (!isCurrent()) return;
        if (latest) {
          setDraft(latest.content);
          setRevision(latest.revision);
          setWorkflow(latest.status);
          setPersistedJson(JSON.stringify(latest.content));
        }
      }
      localStorage.removeItem(recoveryKey);
      if (repository && !isCurrent()) return;
      setRecoveryDraft(null);
      setSaveState("saved");
      setNotice("로컬 복구 사본을 버리고 서버 리비전을 유지했습니다.");
    } catch (error) {
      if (repository && !isCurrent()) return;
      setNotice(error instanceof Error ? error.message : "서버 리비전을 다시 불러오지 못했습니다.");
    }
  }

  async function signOut() {
    const generation = authGeneration.current;
    const signingOutUserId = activeIdentity.current.userId;
    if (client) await client.auth.signOut();
    if (authGeneration.current === generation && activeIdentity.current.userId === signingOutUserId) {
      resetRemoteWorkspace(null);
    }
  }

  function captureRemoteIdentity() {
    const generation = authGeneration.current;
    const requestUserId = userId;
    const requestDraftId = remoteDraftId;
    return () => authGeneration.current === generation
      && activeIdentity.current.userId === requestUserId
      && activeIdentity.current.draftId === requestDraftId;
  }

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    setTheme(next);
  }

  function selectJudgment(id: string) {
    setSelectedJudgmentId(id);
    setEditorTab("judgment");
    setPage("editor");
  }

  function changeJudgment(updater: (judgment: Judgment) => Judgment) {
    if (!selectedJudgment || !editable) return;
    setDraft((current) => updateJudgment(current, selectedJudgment.id, updater));
  }

  function changeSignal(signalId: string, updater: (signal: SignalDefinition) => SignalDefinition) {
    if (!editable) return;
    setDraft((current) => updateSignal(current, signalId, updater));
  }

  async function requestReview() {
    if (errors.length > 0) {
      setNotice(`오류 ${errors.length}개를 먼저 해결해 주세요.`);
      return;
    }
    if (saveState === "saving" || JSON.stringify(draft) !== persistedJson) {
      setNotice("자동 저장이 끝난 뒤 다시 검수를 요청해 주세요.");
      return;
    }
    const isCurrent = captureRemoteIdentity();
    try {
      if (repository && remoteDraftId && userId) {
        const request = await new RequestContentReview(repository, diagnosisContentValidator, ids).execute({
          draftId: remoteDraftId,
          expectedRevision: revision,
          authorId: userId
        });
        if (!isCurrent()) return;
        setReviewRequest(request);
        setReviewComments([]);
      }
      if (repository && !isCurrent()) return;
      setWorkflow("in_review");
      setPage("review");
      setNotice("리비전이 고정되어 검수자에게 전달되었습니다.");
    } catch (error) {
      if (repository && !isCurrent()) return;
      setNotice(error instanceof Error ? error.message : "검수를 요청하지 못했습니다.");
    }
  }

  async function requestChanges() {
    const isCurrent = captureRemoteIdentity();
    try {
      if (repository && reviewRequest && userId) {
        await new ReviewContentDraft(repository).execute({
          reviewRequestId: reviewRequest.id,
          expectedDraftRevision: revision,
          reviewerId: userId,
          decision: "request_changes"
        });
      }
      if (repository && !isCurrent()) return;
      setWorkflow("changes_requested");
      setNotice("변경 요청이 작성자에게 전달되었습니다.");
    } catch (error) {
      if (repository && !isCurrent()) return;
      setNotice(error instanceof Error ? error.message : "변경 요청을 보내지 못했습니다.");
    }
  }

  async function approve() {
    if (errors.length > 0) return;
    const isCurrent = captureRemoteIdentity();
    try {
      if (repository && reviewRequest && userId) {
        const approved = await new ReviewContentDraft(repository).execute({
          reviewRequestId: reviewRequest.id,
          expectedDraftRevision: revision,
          reviewerId: userId,
          decision: "approve"
        });
        if (!isCurrent()) return;
        setReviewRequest(approved);
      }
      if (repository && !isCurrent()) return;
      setWorkflow("approved");
      setNotice("현재 리비전을 승인했습니다. 작성자가 발행할 수 있습니다.");
    } catch (error) {
      if (repository && !isCurrent()) return;
      setNotice(error instanceof Error ? error.message : "승인하지 못했습니다.");
    }
  }

  async function publish() {
    if (workflow !== "approved" || errors.length > 0) return;
    const isCurrent = captureRemoteIdentity();
    try {
      if (repository && remoteDraftId && userId) {
        const published = await new PublishDiagnosisSet(repository, diagnosisContentValidator).execute({
          draftId: remoteDraftId,
          expectedRevision: revision,
          reviewerId: reviewRequest?.reviewerId ?? userId,
          version: nextVersion,
          releaseNotes: "콘텐츠 스튜디오 첫 검수 발행"
        });
        if (!isCurrent()) return;
        setDraft(published.content);
        setBaseContent(published.content);
        setPersistedJson(JSON.stringify(published.content));
      }
      if (repository && !isCurrent()) return;
      setWorkflow("published");
      setNotice(`grade3-semester2@${nextVersion}을 발행했습니다.`);
      setPage("versions");
    } catch (error) {
      if (repository && !isCurrent()) return;
      setNotice(error instanceof Error ? error.message : "콘텐츠를 발행하지 못했습니다.");
    }
  }

  async function addReviewComment(body: string, path: string) {
    if (!repository || !reviewRequest || !userId) {
      const localComment: ContentReviewComment = { id: ids.next(), reviewRequestId: reviewRequest?.id ?? "local-review", authorId: userId ?? "local-reviewer", path, body, required: true, createdAt: new Date().toISOString() };
      setReviewComments((current) => [...current, localComment]);
      return;
    }
    const isCurrent = captureRemoteIdentity();
    try {
      const comment = await new AddContentReviewComment(repository, ids).execute({ reviewRequestId: reviewRequest.id, authorId: userId, path, body });
      if (!isCurrent()) return;
      setReviewComments((current) => [...current, comment]);
    } catch (error) {
      if (!isCurrent()) return;
      setNotice(error instanceof Error ? error.message : "검수 의견을 남기지 못했습니다.");
    }
  }

  async function resolveReviewComment(commentId: string) {
    if (!repository) {
      setReviewComments((current) => current.map((comment) => comment.id === commentId ? { ...comment, resolvedAt: new Date().toISOString() } : comment));
      return;
    }
    const isCurrent = captureRemoteIdentity();
    try {
      const resolved = await new ResolveContentReviewComment(repository).execute(commentId);
      if (!isCurrent()) return;
      setReviewComments((current) => current.map((comment) => comment.id === commentId ? resolved : comment));
    } catch (error) {
      if (!isCurrent()) return;
      setNotice(error instanceof Error ? error.message : "검수 의견을 해결 처리하지 못했습니다.");
    }
  }

  if (!client && !demoMode) return <StudioConfigurationError />;
  if (!authReady) return <StudioLoading />;
  if (!signedIn) return <StudioLogin onSignIn={signIn} error={authError} />;
  if (accessError) return <StudioAccessDenied message={accessError} onSignOut={signOut} />;
  if (!remoteReady) return <StudioLoading />;

  return (
    <div className="studio-shell">
      <aside className="studio-sidebar">
        <Brand />
        <p className="studio-product-label">콘텐츠 스튜디오</p>
        <nav aria-label="콘텐츠 스튜디오 메뉴">
          <NavButton active={page === "library"} icon="▦" onClick={() => setPage("library")}>콘텐츠</NavButton>
          <NavButton active={page === "editor"} icon="✎" onClick={() => hasWorkingDraft ? setPage("editor") : setNotice("열 수 있는 초안이 없습니다.")}>편집</NavButton>
          <NavButton active={page === "review"} icon="✓" onClick={() => hasWorkingDraft ? setPage("review") : setNotice("현재 검수 대기 콘텐츠가 없습니다.")}>검수</NavButton>
          <NavButton active={page === "versions"} icon="↺" onClick={() => setPage("versions")}>버전</NavButton>
        </nav>
        <div className="studio-sidebar-foot">
          {!client && (
            <label className="studio-role-switch">
              <span>로컬 역할 미리보기</span>
              <select value={role} onChange={(event) => setRole(event.target.value as StudioRole)}>
                <option value="author">제작자</option>
                <option value="reviewer">검수자</option>
                <option value="admin">관리자</option>
              </select>
            </label>
          )}
          <button type="button" className="studio-sidebar-button" onClick={toggleTheme}>{theme === "light" ? "◐ 다크 모드" : "○ 라이트 모드"}</button>
          {client && <button type="button" className="studio-sidebar-button" onClick={() => void signOut()}>로그아웃</button>}
        </div>
      </aside>

      <main className="studio-main">
        <header className="studio-topbar">
          <div>
            <p className="mom-eyebrow">3학년 2학기 · grade3-semester2</p>
            <strong>{pageTitle(page)}</strong>
          </div>
          <div className="studio-topbar-actions">
            <SaveIndicator state={saveState} revision={revision} />
            <WorkflowPill workflow={workflow} />
            {page === "editor" && editable && <button type="button" className="mom-button mom-button-primary" onClick={() => void requestReview()}>검수 요청</button>}
          </div>
        </header>

        {notice && <div className="studio-notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice(null)}>닫기</button></div>}
        {recoveryDraft && <div className="studio-recovery" role="alert"><div><strong>저장 충돌 복구 사본</strong><span>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(recoveryDraft.updatedAt))}의 내 편집본이 남아 있습니다.</span></div><div><button type="button" className="mom-button mom-button-primary" onClick={() => void restoreRecoveryDraft()}>별도 복구 초안 만들기</button><button type="button" className="mom-button mom-button-quiet" onClick={() => void discardRecoveryDraft()}>서버 버전 유지</button></div></div>}
        {page === "library" && <LibraryPage available={hasWorkingDraft} workflow={workflow} revision={revision} baseVersion={baseContent.manifest.version} nextVersion={nextVersion} onEdit={() => setPage("editor")} onReview={() => setPage("review")} />}
        {page === "editor" && hasWorkingDraft && selectedJudgment && (
          <EditorPage
            content={draft}
            judgment={selectedJudgment}
            selectedStageTitle={selectedStage?.title ?? "학습 단계 없음"}
            relatedSignals={relatedSignals}
            selectedId={selectedJudgmentId}
            tab={editorTab}
            issues={issues}
            editable={editable}
            readOnlyReason={workflow === "published" ? "발행된 버전은 읽기 전용입니다. 새 수정은 이 버전에서 초안을 만들어 진행합니다." : "검수 중인 리비전은 읽기 전용입니다. 변경 요청 뒤 제작자가 다시 편집할 수 있습니다."}
            onTab={setEditorTab}
            onSelect={selectJudgment}
            onChangeJudgment={changeJudgment}
            onChangeSignal={changeSignal}
          />
        )}
        {page === "review" && hasWorkingDraft && (
          <ReviewPage
            baseline={baseContent}
            draft={draft}
            workflow={workflow}
            role={role}
            issues={issues}
            comments={reviewComments}
            onSelect={selectJudgment}
            onRequestChanges={requestChanges}
            onApprove={approve}
            onPublish={publish}
            nextVersion={nextVersion}
            onAddComment={addReviewComment}
            onResolveComment={resolveReviewComment}
          />
        )}
        {page === "versions" && <VersionsPage workflow={workflow} currentVersion={draft.manifest.version} />}
      </main>
    </div>
  );
}

function StudioConfigurationError() {
  return <main className="studio-centered"><Brand /><div className="mom-panel"><div className="mom-panel-body mom-stack"><h1>스튜디오 설정이 필요합니다</h1><p className="mom-muted">운영 환경에는 Supabase URL과 publishable key를 설정해 주세요. 로컬 데모는 <code>VITE_DEMO_MODE=true</code>에서만 열립니다.</p></div></div></main>;
}

function StudioLoading() {
  return <main className="studio-centered"><Brand /><p className="mom-muted">제작 권한을 확인하고 있습니다.</p></main>;
}

function StudioAccessDenied({ message, onSignOut }: { message: string; onSignOut: () => Promise<void> }) {
  return <main className="studio-centered"><Brand /><div className="mom-panel"><div className="mom-panel-body mom-stack"><h1>스튜디오 권한이 필요합니다</h1><p className="mom-muted">{message}</p><button type="button" className="mom-button" onClick={() => void onSignOut()}>다른 계정으로 로그인</button></div></div></main>;
}

function StudioLogin({ onSignIn, error }: { onSignIn: (email: string, password: string) => void; error: string | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <main className="studio-login">
      <section className="studio-login-copy">
        <Brand />
        <p className="mom-eyebrow">콘텐츠 스튜디오</p>
        <h1>좋은 진단은<br />좋은 판단 단위에서 시작됩니다.</h1>
        <p>학생에게는 문제만, 교사에게는 근거를 남기는 콘텐츠를 제작하고 검수합니다.</p>
      </section>
      <form className="studio-login-form mom-panel" onSubmit={(event: FormEvent) => { event.preventDefault(); onSignIn(email, password); }}>
        <div className="mom-panel-body mom-stack-lg">
          <div><p className="mom-eyebrow">내부 제작자 전용</p><h2>로그인</h2></div>
          <label className="mom-input-group"><span>이메일</span><input className="mom-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label className="mom-input-group"><span>비밀번호</span><input className="mom-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <p className="mom-form-error" role="alert">{error}</p>}
          <button className="mom-button mom-button-primary" type="submit">스튜디오 열기</button>
        </div>
      </form>
    </main>
  );
}

function LibraryPage({ available, workflow, revision, baseVersion, nextVersion, onEdit, onReview }: { available: boolean; workflow: Workflow; revision: number; baseVersion: string; nextVersion: string; onEdit: () => void; onReview: () => void }) {
  return (
    <section className="studio-page studio-library">
      <div className="studio-page-heading">
        <div><p className="mom-eyebrow">내부 콘텐츠 원장</p><h1>어떤 진단을 다듬을까요?</h1><p className="mom-muted">초안과 검수 상태를 확인하고, 발행된 버전에서 새 초안을 시작합니다.</p></div>
        <button type="button" className="mom-button" disabled>+ 새 진단 세트</button>
      </div>
      <div className="studio-filter-row" aria-label="콘텐츠 상태 필터">
        <button className="is-active" type="button">전체 2</button><button type="button">내 초안 1</button><button type="button">검수 대기 {workflow === "in_review" ? 1 : 0}</button><button type="button">발행 1</button>
      </div>
      {!available && <div className="mom-panel"><div className="mom-empty"><span className="mom-empty-glyph">✓</span><h2>현재 검수 대기 콘텐츠가 없습니다</h2><p>제작자가 새 리비전을 요청하면 이 목록에 나타납니다.</p></div></div>}
      {available && <div className="studio-content-list">
        <article className="studio-content-row is-working">
          <div className="studio-set-monogram"><span>3</span><small>2학기</small></div>
          <div><div className="mom-row"><h2>3학년 2학기 수학</h2><WorkflowPill workflow={workflow} /></div><p>6개 단원 · 12개 판단 · 리비전 {revision}</p><small>grade3-semester2 · 다음 발행 {nextVersion}</small></div>
          <div className="studio-row-metrics"><span><strong>12</strong> 판단</span><span><strong>0</strong> 오류</span></div>
          <button type="button" className="mom-button mom-button-primary" onClick={workflow === "in_review" ? onReview : onEdit}>{workflow === "in_review" ? "검수 보기" : "계속 편집"}</button>
        </article>
        <article className="studio-content-row">
          <div className="studio-set-monogram is-published"><span>3</span><small>2학기</small></div>
          <div><div className="mom-row"><h2>3학년 2학기 수학</h2><StatusPill tone="accent">발행됨</StatusPill></div><p>교사 배정에 사용 중인 기준 버전</p><small>grade3-semester2 · {baseVersion}</small></div>
          <div className="studio-row-metrics"><span><strong>12</strong> 판단</span><span><strong>6</strong> 단원</span></div>
          <button type="button" className="mom-button" onClick={onEdit}>새 초안으로 복제</button>
        </article>
      </div>}
    </section>
  );
}

interface EditorPageProps {
  content: DiagnosisSet;
  judgment: Judgment;
  selectedStageTitle: string;
  relatedSignals: SignalDefinition[];
  selectedId: string;
  tab: EditorTab;
  issues: ReturnType<typeof collectStudioIssues>;
  editable: boolean;
  readOnlyReason: string;
  onTab: (tab: EditorTab) => void;
  onSelect: (id: string) => void;
  onChangeJudgment: (updater: (judgment: Judgment) => Judgment) => void;
  onChangeSignal: (signalId: string, updater: (signal: SignalDefinition) => SignalDefinition) => void;
}

function EditorPage(props: EditorPageProps) {
  return (
    <section className="studio-editor">
      <ContentOutline content={props.content} selectedId={props.selectedId} onSelect={props.onSelect} />
      <div className="studio-editor-center">
        <div className="studio-editor-title">
          <div><p className="mom-eyebrow">판단 단위 {props.content.judgments.indexOf(props.judgment) + 1} / {props.content.judgments.length}</p><h1>{props.judgment.id}</h1></div>
          <StatusPill>{props.judgment.interaction.type} v{props.judgment.interaction.version}</StatusPill>
        </div>
        <div className="studio-editor-tabs" role="tablist">
          <TabButton active={props.tab === "judgment"} onClick={() => props.onTab("judgment")}>학생 판단</TabButton>
          <TabButton active={props.tab === "interpretation"} onClick={() => props.onTab("interpretation")}>리포트 해석</TabButton>
          <TabButton active={props.tab === "metadata"} onClick={() => props.onTab("metadata")}>연결 정보</TabButton>
        </div>
        {!props.editable && <p className="studio-readonly-note">{props.readOnlyReason}</p>}
        <fieldset className="studio-editor-fieldset" disabled={!props.editable}>
          {props.tab === "judgment" && <JudgmentForm judgment={props.judgment} onChange={props.onChangeJudgment} />}
          {props.tab === "interpretation" && <InterpretationForm signals={props.relatedSignals} onChange={props.onChangeSignal} />}
          {props.tab === "metadata" && <MetadataPanel content={props.content} judgment={props.judgment} stageTitle={props.selectedStageTitle} />}
        </fieldset>
      </div>
      <PreviewRail judgment={props.judgment} judgmentIndex={props.content.judgments.indexOf(props.judgment)} stageTitle={props.selectedStageTitle} issues={props.issues} />
    </section>
  );
}

function ContentOutline({ content, selectedId, onSelect }: { content: DiagnosisSet; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <aside className="studio-outline" aria-label="진단 구조">
      <div className="studio-outline-heading"><p className="mom-eyebrow">진단 구조</p><strong>{content.manifest.shortTitle}</strong></div>
      <ol>
        {content.manifest.units.sort((a, b) => a.order - b.order).map((unit) => {
          const judgments = content.judgments.filter((judgment) => judgment.unitId === unit.id);
          return (
            <li key={unit.id} className="studio-outline-unit">
              <div><span>{unit.order}</span><strong>{unit.title}</strong><small>{judgments.length}</small></div>
              <ul>{judgments.map((judgment) => (
                <li key={judgment.id}><button type="button" className={selectedId === judgment.id ? "is-active" : ""} onClick={() => onSelect(judgment.id)}><span /><span>{content.learnerStages.find((stage) => stage.id === judgment.learnerStageId)?.shortTitle ?? judgment.id}</span></button></li>
              ))}</ul>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

function JudgmentForm({ judgment, onChange }: { judgment: Judgment; onChange: (updater: (judgment: Judgment) => Judgment) => void }) {
  return (
    <div className="studio-form mom-stack-lg">
      <FormSection number="01" title="학생에게 보여줄 말" description="진단 이름이나 정답을 암시하지 않고, 한 번에 한 가지 판단만 묻습니다.">
        <label className="mom-input-group"><span>상황 안내</span><input className="mom-input" value={judgment.context ?? ""} onChange={(event) => onChange((current) => ({ ...current, context: event.target.value }))} placeholder="선택 사항" /></label>
        <label className="mom-input-group"><span>질문</span><textarea className="mom-input studio-textarea" value={judgment.prompt} onChange={(event) => onChange((current) => ({ ...current, prompt: event.target.value }))} /></label>
      </FormSection>
      <FormSection number="02" title="선택지와 관찰 신호" description="정답은 하나만 지정합니다. 오답에는 해석할 신호를 연결합니다.">
        <div className="studio-choice-editor">
          {judgment.choices.map((choice, index) => (
            <div className="studio-choice-edit-row" key={choice.id}>
              <label className="studio-correct-toggle" title="정답으로 지정"><input type="radio" name={`correct-${judgment.id}`} checked={choice.correct} onChange={() => onChange((current) => ({ ...current, choices: current.choices.map((item) => ({ ...item, correct: item.id === choice.id })) }))} /><span>{String.fromCharCode(65 + index)}</span></label>
              <input className="mom-input" value={choice.label} onChange={(event) => onChange((current) => ({ ...current, choices: current.choices.map((item) => item.id === choice.id ? { ...item, label: event.target.value } : item) }))} />
              <div className="studio-signal-tags">{choice.correct ? <span className="is-correct">정답</span> : choice.signalIds?.map((id) => <span key={id}>{id.split(".").at(-1)}</span>)}</div>
            </div>
          ))}
        </div>
      </FormSection>
      <FormSection number="03" title="시각 자료" description="학생 화면에서 실제로 렌더링되는 구조화 자료입니다.">
        <div className="studio-readonly-grid"><span>유형<strong>{judgment.visual.kind}</strong></span><span>요약<strong>{summarizeVisual(judgment)}</strong></span><span>상호작용<strong>{judgment.interaction.type} v{judgment.interaction.version}</strong></span></div>
        <p className="studio-field-note">새 시각 자료 유형과 상호작용 제작은 이번 단계에서 지원하지 않습니다.</p>
      </FormSection>
    </div>
  );
}

function InterpretationForm({ signals, onChange }: { signals: SignalDefinition[]; onChange: (signalId: string, updater: (signal: SignalDefinition) => SignalDefinition) => void }) {
  if (signals.length === 0) return <div className="studio-empty-editor"><h2>연결된 오답 신호가 없습니다.</h2><p>학생 판단 탭에서 오답 선택지에 신호를 연결해 주세요.</p></div>;
  return (
    <div className="studio-form mom-stack-lg">
      {signals.map((signal) => (
        <div className="studio-signal-editor" key={signal.id}>
          <header><div><p className="mom-eyebrow">{signal.id}</p><h2>{signal.title}</h2></div><StatusPill tone={signal.severity === "high" ? "risk" : signal.severity === "medium" ? "warning" : "neutral"}>{signal.severity}</StatusPill></header>
          <div className="studio-report-columns">
            <FormSection number="T" title="교사가 보는 해석" description="근거를 판단하고 다음 수업을 정할 때 사용합니다.">
              <label className="mom-input-group"><span>관찰 해석</span><textarea className="mom-input studio-textarea" value={signal.teacherInterpretation} onChange={(event) => onChange(signal.id, (current) => ({ ...current, teacherInterpretation: event.target.value }))} /></label>
              <label className="mom-input-group"><span>수업 제안</span><textarea className="mom-input studio-textarea" value={signal.teachingMove} onChange={(event) => onChange(signal.id, (current) => ({ ...current, teachingMove: event.target.value }))} /></label>
            </FormSection>
            <FormSection number="H" title="학부모에게 전할 말" description="비교·순위·오개념 코드 없이 현재 연습과 가정 활동만 전합니다.">
              <label className="mom-input-group"><span>현재 연습</span><textarea className="mom-input studio-textarea" value={signal.parentSummary} onChange={(event) => onChange(signal.id, (current) => ({ ...current, parentSummary: event.target.value }))} /></label>
              <label className="mom-input-group"><span>가정 활동</span><textarea className="mom-input studio-textarea" value={signal.homePrompt} onChange={(event) => onChange(signal.id, (current) => ({ ...current, homePrompt: event.target.value }))} /></label>
            </FormSection>
          </div>
        </div>
      ))}
    </div>
  );
}

function MetadataPanel({ content, judgment, stageTitle }: { content: DiagnosisSet; judgment: Judgment; stageTitle: string }) {
  return (
    <div className="studio-form">
      <FormSection number="→" title="판단이 근거가 되는 경로" description="ID는 발행 후 바뀌지 않으며, 순서는 별도로 관리합니다.">
        <ol className="studio-link-rail">
          <li><span>교육과정</span><strong>{judgment.curriculumAnchorIds.join(", ")}</strong><small>{content.curriculumAnchors.filter((anchor) => judgment.curriculumAnchorIds.includes(anchor.id)).map((anchor) => anchor.label).join(" · ")}</small></li>
          <li><span>작은 학습 단계</span><strong>{stageTitle}</strong><small>{judgment.learnerStageId}</small></li>
          <li><span>판단 단위</span><strong>{judgment.prompt}</strong><small>{judgment.id}</small></li>
        </ol>
      </FormSection>
    </div>
  );
}

function PreviewRail({ judgment, judgmentIndex, stageTitle, issues }: { judgment: Judgment; judgmentIndex: number; stageTitle: string; issues: ReturnType<typeof collectStudioIssues> }) {
  const [unknownVisible, setUnknownVisible] = useState(false);
  useEffect(() => {
    setUnknownVisible(false);
    const timer = window.setTimeout(() => setUnknownVisible(true), 30_000);
    return () => window.clearTimeout(timer);
  }, [judgment.id]);
  const relevantIssues = issues.filter((issue) => issue.path.startsWith(`/judgments/${judgmentIndex}`));
  return (
    <aside className="studio-preview-rail">
      <div className="studio-preview-heading"><div><p className="mom-eyebrow">학생 화면 미리보기</p><strong>태블릿 · 자동 진행 없음</strong></div><span>768</span></div>
      <div className="studio-tablet-frame">
        <div className="studio-tablet-top"><Brand compact /><span>연결됨</span></div>
        <div className="studio-tablet-progress"><ProgressLine value={42} /></div>
        <div className="studio-tablet-content">
          {judgment.context && <p className="mom-muted">{judgment.context}</p>}
          <h2>{judgment.prompt}</h2>
          <VisualAid visual={judgment.visual} />
          <div className="mom-choice-list">{judgment.choices.map((choice) => <ChoiceOption key={choice.id} label={choice.label || "빈 선택지"} selected={false} onSelect={() => undefined} />)}</div>
          {unknownVisible
            ? <button type="button" className="studio-unknown-preview">잘 모르겠어요</button>
            : <p className="studio-unknown-preview">30초 후 “잘 모르겠어요” 표시</p>}
        </div>
      </div>
      <div className="studio-preview-meta"><span>학습 단계</span><strong>{stageTitle}</strong><small>이 정보는 학생에게 표시되지 않습니다.</small></div>
      <div className={`studio-validation-summary ${relevantIssues.length ? "has-issues" : ""}`}><span>{relevantIssues.length ? `이 판단에 확인할 점 ${relevantIssues.length}개` : "이 판단은 발행 규칙을 통과했습니다"}</span>{relevantIssues.slice(0, 2).map((issue) => <small key={`${issue.path}-${issue.message}`}>{issue.message}</small>)}</div>
    </aside>
  );
}

function ReviewPage({ baseline, draft, workflow, role, issues, comments, nextVersion, onSelect, onRequestChanges, onApprove, onPublish, onAddComment, onResolveComment }: { baseline: DiagnosisSet; draft: DiagnosisSet; workflow: Workflow; role: StudioRole; issues: ReturnType<typeof collectStudioIssues>; comments: ContentReviewComment[]; nextVersion: string; onSelect: (id: string) => void; onRequestChanges: () => Promise<void>; onApprove: () => Promise<void>; onPublish: () => Promise<void>; onAddComment: (body: string, path: string) => Promise<void>; onResolveComment: (commentId: string) => Promise<void> }) {
  const changed = draft.judgments.filter((judgment, index) => !structurallyEqual(judgment, baseline.judgments[index]));
  const errors = issues.filter((issue) => issue.level === "error");
  const unresolvedRequired = comments.filter((comment) => comment.required && !comment.resolvedAt);
  const [commentBody, setCommentBody] = useState("");
  const [commentPath, setCommentPath] = useState("/judgments/0");
  async function submitComment() {
    if (!commentBody.trim()) return;
    await onAddComment(commentBody, commentPath);
    setCommentBody("");
  }
  return (
    <section className="studio-page studio-review">
      <div className="studio-page-heading"><div><p className="mom-eyebrow">리비전 검수</p><h1>학생에게 가기 전, 다른 눈으로 봅니다.</h1><p className="mom-muted">기준 버전 1.0.0과 현재 초안의 변경 및 발행 규칙을 함께 확인합니다.</p></div><div className="mom-row"><StatusPill tone={errors.length ? "risk" : "accent"}>{errors.length ? `오류 ${errors.length}` : "검증 통과"}</StatusPill><span className="mom-caption">변경 판단 {changed.length}</span></div></div>
      <div className="studio-review-layout">
        <div className="studio-review-list">
          <section className="mom-panel"><header className="mom-panel-header"><div><p className="mom-eyebrow">자동 검증</p><h2>{errors.length ? "발행을 막는 오류가 있습니다" : "발행 규칙을 모두 통과했습니다"}</h2></div></header><div className="mom-panel-body studio-check-list">{issues.length === 0 ? <p className="studio-check-success">구조, 참조, 상호작용, 리포트 문구를 확인했습니다.</p> : issues.map((issue) => <p key={`${issue.path}-${issue.message}`} className={issue.level}><strong>{issue.level === "error" ? "오류" : "확인"}</strong><span>{issue.message}</span><small>{issue.path}</small></p>)}</div></section>
          <section className="mom-panel"><header className="mom-panel-header"><div><p className="mom-eyebrow">1.0.0과 비교</p><h2>{changed.length ? `${changed.length}개 판단이 달라졌습니다` : "판단 내용 변경이 없습니다"}</h2></div></header><div className="studio-diff-list">{changed.length === 0 ? <div className="studio-no-diff">초안은 기준 버전과 같습니다. 편집 화면에서 내용을 수정해 보세요.</div> : changed.map((judgment) => { const before = baseline.judgments.find((item) => item.id === judgment.id); return <button type="button" key={judgment.id} onClick={() => onSelect(judgment.id)}><span>{judgment.id}</span><del>{before?.prompt}</del><ins>{judgment.prompt}</ins></button>; })}</div></section>
          <section className="mom-panel"><header className="mom-panel-header"><div><p className="mom-eyebrow">필드별 검수 의견</p><h2>{comments.length ? `${unresolvedRequired.length}개 해결 필요` : "등록된 의견이 없습니다"}</h2></div></header><div className="studio-comment-list">{comments.length === 0 ? <p className="studio-no-diff">필드 경로와 함께 의견을 남기면 다음 검수에도 위치가 유지됩니다.</p> : comments.map((comment) => <article key={comment.id} className={comment.resolvedAt ? "is-resolved" : ""}><div><code>{comment.path}</code><StatusPill tone={comment.resolvedAt ? "neutral" : "warning"}>{comment.resolvedAt ? "해결됨" : "필수"}</StatusPill></div><p>{comment.body}</p>{!comment.resolvedAt && role !== "reviewer" && <button type="button" className="mom-button" onClick={() => void onResolveComment(comment.id)}>반영 완료</button>}</article>)}</div></section>
        </div>
        <aside className="studio-review-decision mom-panel">
          <div className="mom-panel-body mom-stack-lg">
            <div><p className="mom-eyebrow">현재 역할 · {role === "author" ? "제작자" : role === "reviewer" ? "검수자" : "관리자"}</p><h2>검수 결정</h2><p className="mom-muted">작성자와 다른 계정만 현재 리비전을 승인할 수 있습니다.</p></div>
            {role !== "author" && workflow === "in_review" && <><label className="mom-input-group"><span>의견 위치</span><select className="mom-input" value={commentPath} onChange={(event) => setCommentPath(event.target.value)}>{draft.judgments.map((judgment, index) => <option key={judgment.id} value={`/judgments/${index}`}>{judgment.id}</option>)}</select></label><label className="mom-input-group"><span>검수 의견</span><textarea className="mom-input studio-textarea" value={commentBody} onChange={(event) => setCommentBody(event.target.value)} placeholder="변경이 필요한 위치와 이유를 구체적으로 남겨 주세요." /></label><button type="button" className="mom-button" disabled={!commentBody.trim()} onClick={() => void submitComment()}>필수 의견 추가</button></>}
            {role !== "author" && workflow === "in_review" && <><button type="button" className="mom-button" onClick={() => void onRequestChanges()}>변경 요청</button><button type="button" className="mom-button mom-button-primary" disabled={errors.length > 0 || unresolvedRequired.length > 0} onClick={() => void onApprove()}>현재 리비전 승인</button></>}
            {(role === "author" || role === "admin") && workflow === "approved" && <button type="button" className="mom-button mom-button-primary" onClick={() => void onPublish()}>{nextVersion} 발행</button>}
            {workflow === "draft" && <p className="studio-decision-note">제작자가 검수 요청을 보내면 결정할 수 있습니다.</p>}
            {workflow === "changes_requested" && <p className="studio-decision-note">작성자가 변경 요청을 반영하고 다시 검수를 요청해야 합니다.</p>}
            {workflow === "published" && <StatusPill tone="accent">1.0.1 발행 완료</StatusPill>}
          </div>
        </aside>
      </div>
    </section>
  );
}

function VersionsPage({ workflow, currentVersion }: { workflow: Workflow; currentVersion: string }) {
  return (
    <section className="studio-page studio-versions">
      <div className="studio-page-heading"><div><p className="mom-eyebrow">불변 발행 기록</p><h1>발행한 내용은 고치지 않습니다.</h1><p className="mom-muted">문제가 있으면 이전 버전을 유지하고 새 버전을 검수해 발행합니다.</p></div><button type="button" className="mom-button">JSON 내보내기</button></div>
      <div className="studio-version-timeline">
        {workflow === "published" && currentVersion !== "1.0.0" && <VersionRow version={currentVersion} status="현재 버전" date="방금 전" note="콘텐츠 스튜디오에서 검수 발행" />}
        <VersionRow version="1.0.0" status={workflow === "published" && currentVersion !== "1.0.0" ? "이전 버전" : "현재 버전"} date="2026.07.22" note="3학년 2학기 운영 기준 콘텐츠 · 6개 단원, 12개 판단" />
      </div>
    </section>
  );
}

function VersionRow({ version, status, date, note }: { version: string; status: string; date: string; note: string }) {
  return <article><div className="studio-version-node" /><div><div className="mom-row"><h2>{version}</h2><StatusPill tone={status === "현재 버전" ? "accent" : "neutral"}>{status}</StatusPill></div><p>{note}</p><small>{date} · checksum 검증됨</small></div><button type="button" className="mom-button">내용 보기</button></article>;
}

function FormSection({ number, title, description, children }: { number: string; title: string; description: string; children: ReactNode }) {
  return <section className="studio-form-section"><header><span>{number}</span><div><h2>{title}</h2><p>{description}</p></div></header><div className="studio-form-section-body">{children}</div></section>;
}

function NavButton({ active, icon, onClick, children }: { active: boolean; icon: string; onClick: () => void; children: ReactNode }) {
  return <button type="button" className={active ? "is-active" : ""} onClick={onClick}><span aria-hidden="true">{icon}</span>{children}</button>;
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" role="tab" aria-selected={active} className={active ? "is-active" : ""} onClick={onClick}>{children}</button>;
}

function WorkflowPill({ workflow }: { workflow: Workflow }) {
  const map: Record<Workflow, { label: string; tone: "neutral" | "accent" | "warning" | "risk" }> = {
    draft: { label: "초안", tone: "neutral" },
    in_review: { label: "검수 대기", tone: "warning" },
    changes_requested: { label: "변경 요청", tone: "risk" },
    approved: { label: "승인됨", tone: "accent" },
    published: { label: "발행됨", tone: "accent" }
  };
  return <StatusPill tone={map[workflow].tone}>{map[workflow].label}</StatusPill>;
}

function SaveIndicator({ state, revision }: { state: SaveState; revision: number }) {
  const labels: Record<SaveState, string> = { saved: `저장됨 · r${revision}`, saving: "저장 중…", offline: "기기에 임시 저장", conflict: "저장 충돌" };
  return <span className={`studio-save-state is-${state}`}><i />{labels[state]}</span>;
}

function pageTitle(page: Page): string {
  return { library: "콘텐츠", editor: "판단 단위 편집", review: "검수와 승인", versions: "발행 버전" }[page];
}
