import type {
  ContentValidationIssue,
  DiagnosisSet
} from "@middle-of-math/domain";
import { jsonSha256 } from "./integrity-digest";
import type {
  StagePrerequisiteEdge,
  StagePrerequisiteGraph
} from "./stage-prerequisite-graph";
import snapshotJson from "./upstream/kr-learning-map.g3s1.snapshot.json";

export interface StageGraphInspection {
  issues: ContentValidationIssue[];
  graphRevision: string | null;
  graphDigest: string | null;
}

function add(
  issues: ContentValidationIssue[],
  code: string,
  path: string,
  message: string,
  severity: ContentValidationIssue["severity"] = "error"
): void {
  issues.push({ code, path, message, severity });
}

export function inspectStagePrerequisiteGraph(input: {
  graph: StagePrerequisiteGraph | null;
  sourceSetKey: string;
  sets: Record<string, DiagnosisSet>;
  peerGraphs?: readonly StagePrerequisiteGraph[];
}): StageGraphInspection {
  const issues: ContentValidationIssue[] = [];
  const graph = input.graph;
  if (!graph) {
    add(issues, "SPG_GRAPH_MISSING", "/stagePrerequisiteGraph", "학기 사이 선수 단계 그래프가 필요합니다.");
    return { issues, graphRevision: null, graphDigest: null };
  }

  if (!graph.graphRevision.trim()) {
    add(issues, "SPG_REVISION_MISSING", "/stagePrerequisiteGraph/graphRevision", "선수 단계 그래프 리비전이 필요합니다.");
  }
  const { graphDigest: _digest, ...body } = graph;
  if (jsonSha256(body) !== graph.graphDigest) {
    add(issues, "SPG_DIGEST_MISMATCH", "/stagePrerequisiteGraph/graphDigest", "선수 단계 그래프 무결성 값이 다릅니다.");
  }
  if (graph.sourceSetKey !== input.sourceSetKey) {
    add(issues, "SPG_UNKNOWN_SET", "/stagePrerequisiteGraph/sourceSetKey", "그래프의 출발 세트가 현재 진단 세트와 다릅니다.");
  }

  const stageMaps = new Map(
    Object.entries(input.sets).map(([setKey, set]) => [
      setKey,
      new Map(set.learnerStages.map((stage) => [stage.id, stage]))
    ])
  );
  const edgeKeys = new Set<string>();
  const peerEdgeKeys = new Set(
    (input.peerGraphs ?? [])
      .filter((peer) => peer.sourceSetKey !== graph.sourceSetKey)
      .flatMap((peer) => peer.edges.map((edge) => edgeKey(edge)))
  );
  const adjacency = new Map<string, Set<string>>();

  for (const [setKey, set] of Object.entries(input.sets)) {
    for (const stage of set.learnerStages) {
      const node = key(setKey, stage.id);
      for (const prerequisiteId of stage.prerequisiteStageIds) {
        connect(adjacency, key(setKey, prerequisiteId), node);
      }
    }
  }

  graph.edges.forEach((edge, index) => {
    const path = `/stagePrerequisiteGraph/edges/${index}`;
    if (
      edge.fromSetKey !== graph.sourceSetKey
      && edge.toSetKey !== graph.sourceSetKey
    ) {
      add(
        issues,
        "SPG_EDGE_OUTSIDE_OWNER",
        path,
        "선수 단계 연결은 그래프 소유 세트를 출발 또는 도착으로 포함해야 합니다."
      );
    }
    const fromSet = input.sets[edge.fromSetKey];
    const toSet = input.sets[edge.toSetKey];
    if (!fromSet) add(issues, "SPG_UNKNOWN_SET", `${path}/fromSetKey`, `없는 출발 세트입니다: ${edge.fromSetKey}`);
    if (!toSet) add(issues, "SPG_UNKNOWN_SET", `${path}/toSetKey`, `없는 도착 세트입니다: ${edge.toSetKey}`);

    const fromStage = stageMaps.get(edge.fromSetKey)?.get(edge.fromStageId);
    const toStage = stageMaps.get(edge.toSetKey)?.get(edge.toStageId);
    if (fromSet && !fromStage) add(issues, "SPG_UNKNOWN_STAGE", `${path}/fromStageId`, `없는 출발 단계입니다: ${edge.fromStageId}`);
    if (toSet && !toStage) add(issues, "SPG_UNKNOWN_STAGE", `${path}/toStageId`, `없는 도착 단계입니다: ${edge.toStageId}`);

    const fromNode = key(edge.fromSetKey, edge.fromStageId);
    const toNode = key(edge.toSetKey, edge.toStageId);
    if (fromNode === toNode) {
      add(issues, "SPG_SELF_EDGE", path, "같은 단계를 자기 선수 단계로 연결할 수 없습니다.");
    }
    const currentEdgeKey = edgeKey(edge);
    if (edgeKeys.has(currentEdgeKey)) {
      add(issues, "SPG_DUPLICATE_EDGE", path, "같은 선수 단계 연결이 중복되었습니다.");
    }
    if (peerEdgeKeys.has(currentEdgeKey)) {
      add(
        issues,
        "SPG_EDGE_DUPLICATED_ACROSS_GRAPHS",
        path,
        "같은 선수 단계 연결을 여러 소유 그래프에 중복 등록할 수 없습니다."
      );
    }
    edgeKeys.add(currentEdgeKey);
    connect(adjacency, fromNode, toNode);

    if (fromSet && toSet) {
      const ordinalGap = semesterOrdinal(toSet) - semesterOrdinal(fromSet);
      if (ordinalGap <= 0) {
        add(issues, "SPG_FORWARD_EDGE", path, "선수 단계는 더 이른 학년·학기에서 이후 학기로만 연결해야 합니다.");
      }
      if (ordinalGap >= 2 && !hasGradeSkipJustification(edge.reviewEvidence)) {
        add(
          issues,
          "SPG_GRADE_SKIP_UNJUSTIFIED",
          `${path}/reviewEvidence`,
          "한 학기 이상 건너뛰어 연결하려면 '학기 건너뛰기:' 뒤에 구체적인 편집 근거를 기록해야 합니다."
        );
      }
    }
    if (toStage && toStage.prerequisiteStageIds.length > 0) {
      add(issues, "SPG_TARGET_NOT_UNIT_ENTRY", `${path}/toStageId`, "학기 사이 연결은 도착 단원의 시작 단계만 가리킬 수 있습니다.");
    }
    if (edge.reviewEvidence.trim().length < 20) {
      add(issues, "SPG_REVIEW_EVIDENCE_REQUIRED", `${path}/reviewEvidence`, "각 선수 단계 연결에는 구체적인 편집 근거가 필요합니다.");
    }
    inspectUpstreamClaim(edge, path, issues);
  });

  if (hasCycle(adjacency)) {
    add(issues, "SPG_CYCLE", "/stagePrerequisiteGraph/edges", "학기 안팎의 선수 단계 연결에 순환이 있습니다.");
  }

  if (graph.edges.length > 0) {
    add(
      issues,
      "SPG_ADVISORY_EDGES_PRESENT",
      "/stagePrerequisiteGraph/edges",
      `선수 단계 연결은 편집 참고용입니다: ${graph.edges.map((edge) => edge.id).join(", ")}`,
      "warning"
    );
    add(
      issues,
      "SPG_SEMESTER_PLACEMENT_EDITORIAL",
      "/stagePrerequisiteGraph",
      "고정 학습맵은 3-4학년군만 확인하며 학기 배치는 Middle of Math의 편집 결정입니다.",
      "warning"
    );
  }

  return {
    issues,
    graphRevision: graph.graphRevision || null,
    graphDigest: graph.graphDigest || null
  };
}

function inspectUpstreamClaim(
  edge: StagePrerequisiteEdge,
  path: string,
  issues: ContentValidationIssue[]
): void {
  if (edge.basis !== "upstream-anchor-pair") return;
  if (!edge.advisory || !edge.reviewEvidence.includes("학기 배치")) {
    add(issues, "SPG_UPSTREAM_CLAIM_OVERREACH", path, "외부 학습맵의 학년군 관계를 학기 근거나 학생 판정으로 확대할 수 없습니다.");
  }
  const attested = snapshotJson.dependencies.some((row) =>
    row.topicId === edge.upstreamTopicId
    && row.prerequisiteId === edge.upstreamPrerequisiteId
    && row.strength === edge.strength
  );
  if (!attested) {
    add(issues, "SPG_UPSTREAM_PAIR_UNATTESTED", path, "고정 스냅숏에 없는 외부 주제 쌍을 근거로 주장할 수 없습니다.");
  }
}

function semesterOrdinal(set: DiagnosisSet): number {
  return set.manifest.grade * 2 + set.manifest.semester;
}

function edgeKey(edge: StagePrerequisiteEdge): string {
  return [
    edge.fromSetKey,
    edge.fromStageId,
    edge.toSetKey,
    edge.toStageId
  ].join("\u0000");
}

function hasGradeSkipJustification(reviewEvidence: string): boolean {
  const marker = "학기 건너뛰기:";
  const markerIndex = reviewEvidence.indexOf(marker);
  if (markerIndex < 0) return false;
  return reviewEvidence.slice(markerIndex + marker.length).trim().length >= 10;
}

function key(setKey: string, stageId: string): string {
  return `${setKey}\u0000${stageId}`;
}

function connect(
  adjacency: Map<string, Set<string>>,
  from: string,
  to: string
): void {
  const targets = adjacency.get(from) ?? new Set<string>();
  targets.add(to);
  adjacency.set(from, targets);
}

function hasCycle(adjacency: Map<string, Set<string>>): boolean {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (node: string): boolean => {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const target of adjacency.get(node) ?? []) {
      if (visit(target)) return true;
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  };
  return [...adjacency.keys()].some(visit);
}
