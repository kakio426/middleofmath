import type {
  ContentValidationIssue,
  DiagnosisSet
} from "@middle-of-math/domain";
import semester1CrosswalkJson from "./grade3-semester1-crosswalk.json";
import semester2CrosswalkJson from "./grade3-semester2-crosswalk.json";
import grade4Semester1CrosswalkJson from "./grade4-semester1-crosswalk.json";
import grade4Semester2CrosswalkJson from "./grade4-semester2-crosswalk.json";
import grade5Semester1CrosswalkJson from "./grade5-semester1-crosswalk.json";
import grade5Semester2CrosswalkJson from "./grade5-semester2-crosswalk.json";
import grade6Semester1CrosswalkJson from "./grade6-semester1-crosswalk.json";
import grade6Semester2CrosswalkJson from "./grade6-semester2-crosswalk.json";
import {
  grade3Semester1AnchorRegistry,
  findGrade3Semester2Anchor,
  grade4Semester1AnchorRegistry,
  grade4Semester2AnchorRegistry,
  grade5Semester1AnchorRegistry,
  grade5Semester2AnchorRegistry,
  grade6Semester1AnchorRegistry,
  grade6Semester2AnchorRegistry
} from "./curriculum-anchor-registry";
import { jsonSha256 } from "./integrity-digest";
import semester1SnapshotJson from "./upstream/kr-learning-map.g3s1.snapshot.json";
import semester2SnapshotJson from "./upstream/kr-learning-map.snapshot.json";
import grade34SnapshotJson from "./upstream/kr-learning-map.grade34.snapshot.json";
import grade56SnapshotJson from "./upstream/kr-learning-map.grade56.snapshot.json";

export type AnchorCrosswalkStatus = "matched" | "code-only" | "gap" | "local-only";
export type StageCrosswalkStatus = "topic-matched" | "topic-partial" | "gap" | "local-only";

export interface PredecessorCandidate {
  topicId: string;
  prerequisiteId: string;
  strength: "hard" | "soft";
  advisory: true;
  localStageId: null;
}

export interface AnchorCrosswalkRow {
  anchorId: string;
  status: AnchorCrosswalkStatus;
  standardKey?: string;
  topicIds: string[];
  reviewEvidence: string;
}

export interface StageCrosswalkRow {
  stageId: string;
  status: StageCrosswalkStatus;
  topicIds: string[];
  reviewEvidence: string;
  predecessorCandidate?: PredecessorCandidate;
}

export interface CurriculumCrosswalk {
  setKey: string;
  revision: string;
  upstreamCommit: string;
  upstreamTaxonomyVersion: string;
  upstreamOntologyVersion: string;
  snapshotDigest: string;
  anchorRows: AnchorCrosswalkRow[];
  stageRows: StageCrosswalkRow[];
  crosswalkDigest: string;
}

interface CuratedSnapshot {
  upstream: {
    repository: string;
    commit: string;
    license: string;
    taxonomyVersion: string;
    ontologyVersion: string;
    generatedAt: string;
    status: string;
    verificationStatus: string;
    officialStatus: string;
    learnerDiagnosisSupported: boolean;
  };
  files: Record<string, { bytes: number; sha256: string }>;
  advisory: {
    crosswalkOnly: boolean;
    notLearnerDiagnosis: boolean;
    candidatePrerequisites: boolean;
  };
  standards: Array<{
    key: string;
    code: string;
    gradeBand: string;
    subject: string;
    domain: string;
    verificationStatus: string;
  }>;
  topics: Array<{
    id: string;
    standardKey: string | null;
    gradeBand: string;
    subject: string;
    domain: string;
    verificationStatus: string;
    relationship: string;
  }>;
  dependencies: Array<{
    topicId: string;
    prerequisiteId: string;
    relationship: "prerequisite";
    strength: "hard" | "soft";
    basis: string;
  }>;
  snapshotDigest: string;
}

export interface CurriculumCrosswalkProvenance {
  crosswalkRevision: string;
  crosswalkDigest: string;
  upstreamCommit: string;
  upstreamTaxonomyVersion: string;
  upstreamOntologyVersion: string;
}

export interface CrosswalkInspection {
  issues: ContentValidationIssue[];
  provenance: CurriculumCrosswalkProvenance | null;
}

export interface CrosswalkInspectionOptions {
  crosswalk?: CurriculumCrosswalk | null;
  snapshot?: CuratedSnapshot;
  required?: boolean;
}

export const grade3Semester2Crosswalk =
  semester2CrosswalkJson as CurriculumCrosswalk;
export const grade3Semester1Crosswalk =
  semester1CrosswalkJson as CurriculumCrosswalk;
export const grade4Semester1Crosswalk =
  grade4Semester1CrosswalkJson as CurriculumCrosswalk;
export const grade4Semester2Crosswalk =
  grade4Semester2CrosswalkJson as CurriculumCrosswalk;
export const grade5Semester1Crosswalk =
  grade5Semester1CrosswalkJson as CurriculumCrosswalk;
export const grade5Semester2Crosswalk =
  grade5Semester2CrosswalkJson as CurriculumCrosswalk;
export const grade6Semester1Crosswalk =
  grade6Semester1CrosswalkJson as CurriculumCrosswalk;
export const grade6Semester2Crosswalk =
  grade6Semester2CrosswalkJson as CurriculumCrosswalk;
export const koreanLearningMapSnapshot =
  semester2SnapshotJson as CuratedSnapshot;
export const grade3Semester1LearningMapSnapshot =
  semester1SnapshotJson as CuratedSnapshot;
export const grade34LearningMapSnapshot =
  grade34SnapshotJson as CuratedSnapshot;
export const grade56LearningMapSnapshot =
  grade56SnapshotJson as CuratedSnapshot;

const registry = new Map([
  [grade3Semester1Crosswalk.setKey, {
    crosswalk: grade3Semester1Crosswalk,
    snapshot: grade3Semester1LearningMapSnapshot,
    expectedSnapshotDigest: "sha256:bf2f29fed186c7ed340cd0dc1f56386950a0e5d11d56296e82bf6255eb54b1ea",
    expectedCrosswalkDigest: "sha256:04ac730ff1e941da9ee14ab8105c0054b8989f5ab4068556bb674d19c74f1184"
  }],
  [grade3Semester2Crosswalk.setKey, {
    crosswalk: grade3Semester2Crosswalk,
    snapshot: koreanLearningMapSnapshot,
    expectedSnapshotDigest: "sha256:5bb711591ecd2b7312e4fce53c2ab76b1f8701ce532fc74dab164cca882c639a",
    expectedCrosswalkDigest: "sha256:e39d1284f97d38b4946c1787665504385f71aeb1d9e5e03f5ee9ff2d1ffa90ab"
  }],
  [grade4Semester1Crosswalk.setKey, {
    crosswalk: grade4Semester1Crosswalk,
    snapshot: grade34LearningMapSnapshot,
    expectedSnapshotDigest: "sha256:c636ccf0033a8bfd1d808c899bbb569ac58da39a8197d2c9bbc4b9c615eef562",
    expectedCrosswalkDigest: "sha256:7a9d71ba2421d70e34c1c115c4596c69dc68004eb9da88b05fb0b60f85b09965"
  }],
  [grade4Semester2Crosswalk.setKey, {
    crosswalk: grade4Semester2Crosswalk,
    snapshot: grade34LearningMapSnapshot,
    expectedSnapshotDigest: "sha256:c636ccf0033a8bfd1d808c899bbb569ac58da39a8197d2c9bbc4b9c615eef562",
    expectedCrosswalkDigest: "sha256:1c3d1772d232824977f73c3920784fde266ce5e71dbb8483e4ac815b50eeea99"
  }],
  [grade5Semester1Crosswalk.setKey, {
    crosswalk: grade5Semester1Crosswalk,
    snapshot: grade56LearningMapSnapshot,
    expectedSnapshotDigest: "sha256:7ec5c6254d89f931c73d1638cefcaf92b8f0102e98ae55258b0d7b3fd6b664cb",
    expectedCrosswalkDigest: "sha256:c4176ad2da5fd9a4ccd2705d9c1e448850394c731fe79207c2def68ce7af6352"
  }],
  [grade5Semester2Crosswalk.setKey, {
    crosswalk: grade5Semester2Crosswalk,
    snapshot: grade56LearningMapSnapshot,
    expectedSnapshotDigest: "sha256:7ec5c6254d89f931c73d1638cefcaf92b8f0102e98ae55258b0d7b3fd6b664cb",
    expectedCrosswalkDigest: "sha256:ca8d89618d70b480041d00e334f24f6fb1d848b1b61813b38424a5abca143fdb"
  }],
  [grade6Semester1Crosswalk.setKey, {
    crosswalk: grade6Semester1Crosswalk,
    snapshot: grade56LearningMapSnapshot,
    expectedSnapshotDigest: "sha256:7ec5c6254d89f931c73d1638cefcaf92b8f0102e98ae55258b0d7b3fd6b664cb",
    expectedCrosswalkDigest: "sha256:a6c0cebd7eaf5c4859df32decd9bc7033ed1e4d3bc1f80631327b7e515f6e10c"
  }],
  [grade6Semester2Crosswalk.setKey, {
    crosswalk: grade6Semester2Crosswalk,
    snapshot: grade56LearningMapSnapshot,
    expectedSnapshotDigest: "sha256:7ec5c6254d89f931c73d1638cefcaf92b8f0102e98ae55258b0d7b3fd6b664cb",
    expectedCrosswalkDigest: "sha256:75c2deffa24604f04db5fbcd6e9801ffd2cf808db644c3ac5142b1f80eb15f37"
  }]
]);

function gradeBandForGrade(grade: number): "1-2" | "3-4" | "5-6" {
  return grade <= 2 ? "1-2" : grade <= 4 ? "3-4" : "5-6";
}

function addIssue(
  issues: ContentValidationIssue[],
  code: string,
  path: string,
  message: string,
  severity: ContentValidationIssue["severity"] = "error"
): void {
  issues.push({ code, path, message, severity });
}

function contentLabel(
  setKey: string,
  anchorId: string,
  targetVersion: string
): string | undefined {
  if (setKey === grade3Semester1Crosswalk.setKey) {
    return grade3Semester1AnchorRegistry.find(
      (anchor) => anchor.id === anchorId
    )?.label;
  }
  if (setKey === grade4Semester1Crosswalk.setKey) {
    return grade4Semester1AnchorRegistry.find(
      (anchor) => anchor.id === anchorId
    )?.label;
  }
  if (setKey === grade4Semester2Crosswalk.setKey) {
    return grade4Semester2AnchorRegistry.find(
      (anchor) => anchor.id === anchorId
    )?.label;
  }
  if (setKey === grade5Semester1Crosswalk.setKey) {
    return grade5Semester1AnchorRegistry.find(
      (anchor) => anchor.id === anchorId
    )?.label;
  }
  if (setKey === grade5Semester2Crosswalk.setKey) {
    return grade5Semester2AnchorRegistry.find(
      (anchor) => anchor.id === anchorId
    )?.label;
  }
  if (setKey === grade6Semester1Crosswalk.setKey) {
    return grade6Semester1AnchorRegistry.find(
      (anchor) => anchor.id === anchorId
    )?.label;
  }
  if (setKey === grade6Semester2Crosswalk.setKey) {
    return grade6Semester2AnchorRegistry.find(
      (anchor) => anchor.id === anchorId
    )?.label;
  }
  const anchor = findGrade3Semester2Anchor(anchorId);
  if (!anchor) return undefined;
  return targetVersion.startsWith("1.")
    ? anchor.v1Label ?? anchor.label
    : anchor.label;
}

export function inspectCurriculumCrosswalk(
  input: { content: DiagnosisSet; setKey: string; targetVersion: string },
  options: CrosswalkInspectionOptions = {}
): CrosswalkInspection {
  const issues: ContentValidationIssue[] = [];
  const registered = registry.get(input.setKey);
  if (!registered) {
    if (options.required) {
      addIssue(
        issues,
        "CW_CROSSWALK_MISSING",
        "/crosswalk",
        `등록된 교육과정 교차표가 없습니다: ${input.setKey}`
      );
    }
    return { issues, provenance: null };
  }
  const explicitlyOverridden =
    Object.prototype.hasOwnProperty.call(options, "crosswalk");
  const crosswalk = explicitlyOverridden
    ? options.crosswalk
    : registered.crosswalk;
  const snapshot = options.snapshot ?? registered.snapshot;
  if (!crosswalk) {
    addIssue(issues, "CW_CROSSWALK_MISSING", "/crosswalk", "교육과정 교차표가 필요합니다.");
    return { issues, provenance: null };
  }

  const provenance: CurriculumCrosswalkProvenance = {
    crosswalkRevision: crosswalk.revision,
    crosswalkDigest: crosswalk.crosswalkDigest,
    upstreamCommit: crosswalk.upstreamCommit,
    upstreamTaxonomyVersion: crosswalk.upstreamTaxonomyVersion,
    upstreamOntologyVersion: crosswalk.upstreamOntologyVersion
  };

  if (!crosswalk.revision.trim()) {
    addIssue(issues, "CW_REVISION_MISSING", "/crosswalk/revision", "교차표 리비전이 필요합니다.");
  }
  if (
    !/^[0-9a-f]{40}$/.test(crosswalk.upstreamCommit)
    || !crosswalk.upstreamTaxonomyVersion.trim()
    || !crosswalk.upstreamOntologyVersion.trim()
    || crosswalk.upstreamCommit !== snapshot.upstream.commit
    || crosswalk.upstreamTaxonomyVersion !== snapshot.upstream.taxonomyVersion
    || crosswalk.upstreamOntologyVersion !== snapshot.upstream.ontologyVersion
  ) {
    addIssue(issues, "CW_UPSTREAM_PIN_MISSING", "/crosswalk/upstreamCommit", "외부 학습맵 커밋과 버전을 고정해야 합니다.");
  }

  const { snapshotDigest: _snapshotDigest, ...snapshotBody } = snapshot;
  if (
    snapshot.snapshotDigest !== registered.expectedSnapshotDigest
    || jsonSha256(snapshotBody) !== snapshot.snapshotDigest
    || crosswalk.snapshotDigest !== snapshot.snapshotDigest
  ) {
    addIssue(issues, "CW_SNAPSHOT_DIGEST_MISMATCH", "/crosswalk/snapshotDigest", "고정 학습맵 스냅숏의 무결성 값이 다릅니다.");
  }
  const { crosswalkDigest: _crosswalkDigest, ...crosswalkBody } = crosswalk;
  if (
    crosswalk.crosswalkDigest !== registered.expectedCrosswalkDigest
    || jsonSha256(crosswalkBody) !== crosswalk.crosswalkDigest
  ) {
    addIssue(issues, "CW_CROSSWALK_DIGEST_MISMATCH", "/crosswalk/crosswalkDigest", "교육과정 교차표의 무결성 값이 다릅니다.");
  }

  const contentAnchors = new Map(
    input.content.curriculumAnchors.map((anchor) => [anchor.id, anchor])
  );
  const contentStages = new Map(
    input.content.learnerStages.map((stage) => [stage.id, stage])
  );
  const expectedGradeBand = gradeBandForGrade(input.content.manifest.grade);
  const standards = new Map(snapshot.standards.map((row) => [row.key, row]));
  const topics = new Map(snapshot.topics.map((row) => [row.id, row]));
  const dependencies = new Set(
    snapshot.dependencies.map((row) =>
      `${row.topicId}\u0000${row.prerequisiteId}\u0000${row.strength}`
    )
  );

  for (const anchorId of contentAnchors.keys()) {
    if (crosswalk.anchorRows.filter((row) => row.anchorId === anchorId).length !== 1) {
      addIssue(issues, "CW_ANCHOR_UNMAPPED", "/crosswalk/anchorRows", `성취기준 교차표 행은 정확히 하나여야 합니다: ${anchorId}`);
    }
  }
  crosswalk.anchorRows.forEach((row, index) => {
    const path = `/crosswalk/anchorRows/${index}`;
    if (!contentAnchors.has(row.anchorId)) {
      addIssue(issues, "CW_ANCHOR_ROW_ORPHAN", `${path}/anchorId`, `콘텐츠에 없는 성취기준 교차표 행입니다: ${row.anchorId}`);
    }
    if (row.reviewEvidence.trim().length < 20) {
      addIssue(issues, "CW_STATUS_EVIDENCE_REQUIRED", `${path}/reviewEvidence`, "교차표 상태에는 20자 이상의 검수 근거가 필요합니다.");
    }
    if (
      (row.status === "matched" && (!row.standardKey || row.topicIds.length === 0))
      || (row.status === "code-only" && (!row.standardKey || row.topicIds.length > 0))
      || ((row.status === "gap" || row.status === "local-only")
        && (Boolean(row.standardKey) || row.topicIds.length > 0))
    ) {
      addIssue(issues, "CW_STATUS_EVIDENCE_REQUIRED", path, `성취기준 교차표 상태와 외부 ID 구성이 맞지 않습니다: ${row.anchorId}`);
    }
    if (row.standardKey) {
      const standard = standards.get(row.standardKey);
      if (!standard) {
        addIssue(issues, "CW_UPSTREAM_ID_UNKNOWN", `${path}/standardKey`, `스냅숏에 없는 성취기준 ID입니다: ${row.standardKey}`);
      } else if (
        standard.code !== row.anchorId
        || standard.gradeBand !== expectedGradeBand
        || standard.subject !== "Mathematics"
      ) {
        addIssue(issues, "CW_SCOPE_MISMATCH", path, `성취기준 교차표의 학년군·교과 범위가 다릅니다: ${row.anchorId}`);
      }
    }
    for (const topicId of row.topicIds) {
      const topic = topics.get(topicId);
      if (!topic) {
        addIssue(issues, "CW_UPSTREAM_ID_UNKNOWN", `${path}/topicIds`, `스냅숏에 없는 주제 ID입니다: ${topicId}`);
      } else if (
        topic.gradeBand !== expectedGradeBand
        || topic.subject !== "Mathematics"
        || !row.standardKey
        || topic.standardKey !== row.standardKey
      ) {
        addIssue(issues, "CW_SCOPE_MISMATCH", `${path}/topicIds`, `성취기준 행과 외부 주제의 학년군·교과·성취기준 범위가 다릅니다: ${row.anchorId}`);
      }
    }
    const expectedLabel = contentLabel(
      input.setKey,
      row.anchorId,
      input.targetVersion
    );
    const actualLabel = contentAnchors.get(row.anchorId)?.label;
    if (expectedLabel && actualLabel !== expectedLabel) {
      addIssue(issues, "CW_ANCHOR_LABEL_DRIFT", `${path}/anchorId`, `성취기준 라벨이 등록부와 다릅니다: ${row.anchorId}`);
    }
  });

  for (const stageId of contentStages.keys()) {
    if (crosswalk.stageRows.filter((row) => row.stageId === stageId).length !== 1) {
      addIssue(issues, "CW_STAGE_UNMAPPED", "/crosswalk/stageRows", `학습 단계 교차표 행은 정확히 하나여야 합니다: ${stageId}`);
    }
  }
  crosswalk.stageRows.forEach((row, index) => {
    const path = `/crosswalk/stageRows/${index}`;
    const stage = contentStages.get(row.stageId);
    if (!stage) {
      addIssue(issues, "CW_STAGE_ROW_ORPHAN", `${path}/stageId`, `콘텐츠에 없는 단계 교차표 행입니다: ${row.stageId}`);
    }
    if (row.reviewEvidence.trim().length < 20) {
      addIssue(issues, "CW_STATUS_EVIDENCE_REQUIRED", `${path}/reviewEvidence`, "교차표 상태에는 20자 이상의 검수 근거가 필요합니다.");
    }
    if (
      ((row.status === "topic-matched" || row.status === "topic-partial")
        && row.topicIds.length === 0)
      || ((row.status === "gap" || row.status === "local-only")
        && row.topicIds.length > 0)
    ) {
      addIssue(issues, "CW_STATUS_EVIDENCE_REQUIRED", path, `학습 단계 교차표 상태와 외부 주제 ID 구성이 맞지 않습니다: ${row.stageId}`);
    }
    for (const topicId of row.topicIds) {
      const topic = topics.get(topicId);
      if (!topic) {
        addIssue(issues, "CW_UPSTREAM_ID_UNKNOWN", `${path}/topicIds`, `스냅숏에 없는 주제 ID입니다: ${topicId}`);
      } else if (
        topic.gradeBand !== expectedGradeBand
        || topic.subject !== "Mathematics"
        || (stage && topic.standardKey && !stage.curriculumAnchorIds.some(
          (anchorId) => topic.standardKey === `kr-2022-elem-math:${anchorId}`
        ))
      ) {
        addIssue(issues, "CW_SCOPE_MISMATCH", `${path}/topicIds`, `학습 단계와 외부 주제의 학년군·교과·성취기준 범위가 다릅니다: ${row.stageId}`);
      }
    }
    const candidate = row.predecessorCandidate;
    if (candidate && (
      !stage
      || stage.prerequisiteStageIds.length > 0
      || !candidate.advisory
      || candidate.localStageId !== null
      || !dependencies.has(
        `${candidate.topicId}\u0000${candidate.prerequisiteId}\u0000${candidate.strength}`
      )
      || !topics.has(candidate.topicId)
      || !topics.has(candidate.prerequisiteId)
    )) {
      addIssue(issues, "CW_PREDECESSOR_SCOPE_INVALID", `${path}/predecessorCandidate`, "선수 후보는 시작 단계에만, 스냅숏 근거와 함께 참고용으로 연결할 수 있습니다.");
    }
  });

  addIssue(
    issues,
    "CW_UPSTREAM_CANDIDATE_DATA",
    "/crosswalk",
    "외부 학습맵은 후보 데이터이며 학생 진단의 직접 근거로 사용하지 않습니다.",
    "warning"
  );
  if (
    crosswalk.anchorRows.some((row) => row.status === "gap" || row.status === "local-only")
    || crosswalk.stageRows.some((row) => row.status === "gap" || row.status === "local-only")
  ) {
    addIssue(issues, "CW_COVERAGE_GAPS_PRESENT", "/crosswalk", "외부 학습맵과 연결되지 않은 편집 공백이 남아 있습니다.", "warning");
  }
  if (crosswalk.stageRows.some((row) => row.predecessorCandidate)) {
    addIssue(issues, "CW_PREDECESSOR_ADVISORY", "/crosswalk/stageRows", "외부 선수 관계는 편집 참고용 후보이며 로컬 진단 단계로 자동 승격하지 않습니다.", "warning");
  }

  return { issues, provenance };
}

export function curriculumCrosswalkSummary() {
  const partialCount = grade3Semester2Crosswalk.stageRows.filter(
    (row) => row.status === "topic-partial"
  ).length;
  const gapCount = [
    ...grade3Semester2Crosswalk.anchorRows,
    ...grade3Semester2Crosswalk.stageRows
  ].filter((row) => row.status === "gap" || row.status === "local-only").length;
  return {
    revision: grade3Semester2Crosswalk.revision,
    anchorCount: grade3Semester2Crosswalk.anchorRows.length,
    stageCount: grade3Semester2Crosswalk.stageRows.length,
    partialCount,
    gapCount,
    upstreamCommit: grade3Semester2Crosswalk.upstreamCommit,
    taxonomyVersion: grade3Semester2Crosswalk.upstreamTaxonomyVersion,
    ontologyVersion: grade3Semester2Crosswalk.upstreamOntologyVersion
  };
}
