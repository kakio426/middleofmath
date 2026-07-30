import { describe, expect, it } from "vitest";
import type { DiagnosisSet } from "@middle-of-math/domain";
import { grade3Semester1Diagnosis } from "./grade3-semester1";
import { grade3Semester2CompleteDiagnosis } from "./grade3-semester2-complete";
import { inspectStagePrerequisiteGraph } from "./stage-prerequisite-graph-integrity";
import {
  grade3StagePrerequisiteGraph,
  registeredStagePrerequisiteGraphs,
  registeredStagePrerequisiteGraphSetKeys,
  type StagePrerequisiteGraph
} from "./stage-prerequisite-graph";
import { runtimeStagePrerequisiteEdges } from "./stage-prerequisite-runtime";

function sets(): Record<string, DiagnosisSet> {
  return {
    "grade3-semester1": structuredClone(grade3Semester1Diagnosis),
    "grade3-semester2": structuredClone(grade3Semester2CompleteDiagnosis)
  };
}

function inspect(
  graph: StagePrerequisiteGraph | null,
  inputSets = sets(),
  peerGraphs: readonly StagePrerequisiteGraph[] = []
) {
  return inspectStagePrerequisiteGraph({
    graph,
    sourceSetKey: "grade3-semester1",
    sets: inputSets,
    peerGraphs
  });
}

function expectCode(
  graph: StagePrerequisiteGraph | null,
  code: string
): void {
  expect(inspect(graph).issues.map((issue) => issue.code)).toContain(code);
}

function graph(): StagePrerequisiteGraph {
  return structuredClone(grade3StagePrerequisiteGraph);
}

describe("3학년 학기 사이 선수 단계 그래프", () => {
  it("6개 연결을 학생 판정이 아닌 편집 참고로만 검증한다", () => {
    const result = inspect(graph());
    expect(grade3StagePrerequisiteGraph.edges).toHaveLength(6);
    expect(
      grade3StagePrerequisiteGraph.edges.every((edge) => edge.advisory)
    ).toBe(true);
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "SPG_ADVISORY_EDGES_PRESENT",
        severity: "warning"
      }),
      expect.objectContaining({
        code: "SPG_SEMESTER_PLACEMENT_EDITORIAL",
        severity: "warning"
      })
    ]);
  });

  it("소유 세트별 그래프를 레지스트리에서 열거한다", () => {
    expect(registeredStagePrerequisiteGraphSetKeys()).toEqual([
      "grade3-semester1"
    ]);
    expect(registeredStagePrerequisiteGraphs()).toEqual([
      grade3StagePrerequisiteGraph
    ]);
  });

  it("교사 런타임에는 검수 근거를 제외한 최소 연결만 내보낸다", () => {
    const expected = grade3StagePrerequisiteGraph.edges.map((edge) => ({
      id: edge.id,
      fromSetKey: edge.fromSetKey,
      fromStageId: edge.fromStageId,
      toSetKey: edge.toSetKey,
      toStageId: edge.toStageId,
      advisory: true as const
    }));

    expect(runtimeStagePrerequisiteEdges()).toEqual(expected);
    expect(JSON.stringify(runtimeStagePrerequisiteEdges())).not.toContain(
      "reviewEvidence"
    );
    expect(JSON.stringify(runtimeStagePrerequisiteEdges())).not.toContain(
      "upstreamTopicId"
    );
  });

  it("그래프가 없으면 차단한다", () => {
    expectCode(null, "SPG_GRAPH_MISSING");
  });

  it("리비전과 digest를 각각 검증한다", () => {
    const missingRevision = graph();
    missingRevision.graphRevision = "";
    expectCode(missingRevision, "SPG_REVISION_MISSING");

    const changedBody = graph();
    changedBody.reviewEvidence += " 변경";
    expectCode(changedBody, "SPG_DIGEST_MISMATCH");
  });

  it("없는 세트와 단계를 차단한다", () => {
    const unknownSet = graph();
    unknownSet.edges[0].fromSetKey = "grade2-semester2";
    expectCode(unknownSet, "SPG_UNKNOWN_SET");

    const unknownStage = graph();
    unknownStage.edges[0].fromStageId = "multiplication.unknown";
    expectCode(unknownStage, "SPG_UNKNOWN_STAGE");
  });

  it("자기 연결과 중복 연결을 차단한다", () => {
    const self = graph();
    self.edges[0].toSetKey = self.edges[0].fromSetKey;
    self.edges[0].toStageId = self.edges[0].fromStageId;
    expectCode(self, "SPG_SELF_EDGE");

    const duplicate = graph();
    duplicate.edges.push(structuredClone(duplicate.edges[0]));
    expectCode(duplicate, "SPG_DUPLICATE_EDGE");
  });

  it("소유 세트와 무관한 연결을 차단한다", () => {
    const outsideOwner = graph();
    outsideOwner.edges[0].fromSetKey = "grade3-semester2";
    expectCode(outsideOwner, "SPG_EDGE_OUTSIDE_OWNER");
  });

  it("서로 다른 소유 그래프에 같은 연결을 중복 등록하지 않는다", () => {
    const peer = graph();
    peer.sourceSetKey = "grade3-semester2";
    const result = inspect(graph(), sets(), [peer]);
    expect(result.issues.map((issue) => issue.code)).toContain(
      "SPG_EDGE_DUPLICATED_ACROSS_GRAPHS"
    );
  });

  it("뒤 학기에서 앞 학기로 향하는 연결과 순환을 차단한다", () => {
    const backward = graph();
    backward.edges.push({
      id: "test-backward-cycle",
      fromSetKey: "grade3-semester2",
      fromStageId: "division.meaning",
      toSetKey: "grade3-semester1",
      toStageId: "multiplication.equal-groups",
      basis: "local-editorial",
      strength: "soft",
      advisory: true,
      reviewEvidence:
        "테스트에서 뒤 학기 단계가 앞 학기 시작 단계로 돌아가 순환하는 경우를 검증한다."
    });
    expectCode(backward, "SPG_FORWARD_EDGE");
    expectCode(backward, "SPG_CYCLE");
  });

  it("도착 단원의 시작 단계만 가리키게 한다", () => {
    const nonEntry = graph();
    nonEntry.edges[0].toStageId = "multiplication.combine";
    expectCode(nonEntry, "SPG_TARGET_NOT_UNIT_ENTRY");
  });

  it("각 연결에 충분한 편집 근거를 요구한다", () => {
    const weakEvidence = graph();
    weakEvidence.edges[0].reviewEvidence = "짧음";
    expectCode(weakEvidence, "SPG_REVIEW_EVIDENCE_REQUIRED");
  });

  it("중간 학기를 하나라도 건너뛰는 연결에는 구조화된 근거를 요구한다", () => {
    const grade4Semester1 = structuredClone(grade3Semester2CompleteDiagnosis);
    grade4Semester1.manifest.id = "grade4-semester1";
    grade4Semester1.manifest.grade = 4;
    grade4Semester1.manifest.semester = 1;
    const expandedSets = {
      ...sets(),
      "grade4-semester1": grade4Semester1
    };
    const skipped = graph();
    skipped.edges[0].toSetKey = "grade4-semester1";
    expect(
      inspect(skipped, expandedSets).issues.map((issue) => issue.code)
    ).toContain("SPG_GRADE_SKIP_UNJUSTIFIED");

    skipped.edges[0].reviewEvidence +=
      " 학기 건너뛰기: 중간 학기의 관련 단계가 아직 검수되지 않아 도착 진입 단계에만 자문 연결한다.";
    expect(
      inspect(skipped, expandedSets).issues.map((issue) => issue.code)
    ).not.toContain("SPG_GRADE_SKIP_UNJUSTIFIED");
  });

  it("외부 주제 쌍을 학생 진단이나 학기 배치의 직접 근거로 과장하지 않는다", () => {
    const overreach = graph();
    overreach.edges[0].advisory = false;
    expectCode(overreach, "SPG_UPSTREAM_CLAIM_OVERREACH");
  });

  it("고정 스냅숏에 실제로 있는 외부 선수 쌍만 허용한다", () => {
    const unattested = graph();
    unattested.edges[0].upstreamTopicId = "kr.mt.math.unknown";
    expectCode(unattested, "SPG_UPSTREAM_PAIR_UNATTESTED");
  });
});
