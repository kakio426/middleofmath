import { describe, expect, it } from "vitest";
import {
  curriculumCrosswalkSummary,
  grade3Semester2Crosswalk,
  inspectCurriculumCrosswalk,
  koreanLearningMapSnapshot,
  type CurriculumCrosswalk
} from "./curriculum-crosswalk";
import { grade3Semester2CompleteDiagnosis } from "./grade3-semester2-complete";

function inspect(
  crosswalk: CurriculumCrosswalk | null = structuredClone(grade3Semester2Crosswalk),
  snapshot = structuredClone(koreanLearningMapSnapshot)
) {
  return inspectCurriculumCrosswalk(
    {
      content: structuredClone(grade3Semester2CompleteDiagnosis),
      setKey: "grade3-semester2",
      targetVersion: "2.1.0"
    },
    { crosswalk, snapshot }
  );
}

function codes(result: ReturnType<typeof inspect>) {
  return result.issues.map((issue) => issue.code);
}

describe("grade 3 semester 2 curriculum crosswalk", () => {
  it("covers all 17 anchors and 32 stages without publication errors", () => {
    const result = inspect();
    expect(result.issues.filter((issue) => issue.severity === "error")).toEqual([]);
    expect(grade3Semester2Crosswalk.anchorRows).toHaveLength(17);
    expect(grade3Semester2Crosswalk.stageRows).toHaveLength(32);
  });

  it("labels all local stages as honest partial matches", () => {
    expect(new Set(grade3Semester2Crosswalk.stageRows.map((row) => row.status))).toEqual(
      new Set(["topic-partial"])
    );
  });

  it("keeps exactly six upstream predecessor candidates advisory", () => {
    const candidates = grade3Semester2Crosswalk.stageRows.filter(
      (row) => row.predecessorCandidate
    );
    expect(candidates).toHaveLength(6);
    expect(candidates.every((row) =>
      row.predecessorCandidate?.advisory
      && row.predecessorCandidate.localStageId === null
    )).toBe(true);
  });

  it("attests the immutable upstream and crosswalk provenance", () => {
    expect(inspect().provenance).toEqual({
      crosswalkRevision: "crosswalk-2026-07-29.1",
      crosswalkDigest: grade3Semester2Crosswalk.crosswalkDigest,
      upstreamCommit: "3ef0563084aa2a9baaa47da2c1ec0ebf5d7edc5c",
      upstreamTaxonomyVersion: "kr-full-depth-v0.4",
      upstreamOntologyVersion: "0.3.0-p3"
    });
  });

  it("reports candidate and predecessor limitations as warnings", () => {
    expect(inspect().issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "CW_UPSTREAM_CANDIDATE_DATA", severity: "warning" }),
      expect.objectContaining({ code: "CW_PREDECESSOR_ADVISORY", severity: "warning" })
    ]));
  });

  it("fails when the registered crosswalk is absent", () => {
    expect(codes(inspect(null))).toContain("CW_CROSSWALK_MISSING");
  });

  it("fails closed for an explicitly required but unregistered production set", () => {
    const result = inspectCurriculumCrosswalk(
      {
        content: structuredClone(grade3Semester2CompleteDiagnosis),
        setKey: "unregistered-production-set",
        targetVersion: "1.0.0"
      },
      { required: true }
    );
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "CW_CROSSWALK_MISSING",
        severity: "error"
      })
    ]);
  });

  it("fails when the revision is missing", () => {
    const crosswalk = structuredClone(grade3Semester2Crosswalk);
    crosswalk.revision = "";
    crosswalk.crosswalkDigest = "";
    expect(codes(inspect(crosswalk))).toContain("CW_REVISION_MISSING");
  });

  it("fails when the upstream pin is incomplete", () => {
    const crosswalk = structuredClone(grade3Semester2Crosswalk);
    crosswalk.upstreamCommit = "main";
    crosswalk.crosswalkDigest = "";
    expect(codes(inspect(crosswalk))).toContain("CW_UPSTREAM_PIN_MISSING");
  });

  it("rejects a valid-looking commit that does not match the snapshot", () => {
    const crosswalk = structuredClone(grade3Semester2Crosswalk);
    crosswalk.upstreamCommit = "0".repeat(40);
    crosswalk.crosswalkDigest = "";
    expect(codes(inspect(crosswalk))).toContain("CW_UPSTREAM_PIN_MISSING");
  });

  it("detects any curated snapshot body change", () => {
    const snapshot = structuredClone(koreanLearningMapSnapshot);
    snapshot.advisory.notLearnerDiagnosis = false;
    expect(codes(inspect(structuredClone(grade3Semester2Crosswalk), snapshot))).toContain(
      "CW_SNAPSHOT_DIGEST_MISMATCH"
    );
  });

  it("detects any crosswalk body change", () => {
    const crosswalk = structuredClone(grade3Semester2Crosswalk);
    crosswalk.stageRows[0].status = "topic-matched";
    expect(codes(inspect(crosswalk))).toContain("CW_CROSSWALK_DIGEST_MISMATCH");
  });

  it("detects an unmapped content anchor", () => {
    const crosswalk = structuredClone(grade3Semester2Crosswalk);
    crosswalk.anchorRows.shift();
    crosswalk.crosswalkDigest = "";
    expect(codes(inspect(crosswalk))).toContain("CW_ANCHOR_UNMAPPED");
  });

  it("detects an orphan anchor row", () => {
    const crosswalk = structuredClone(grade3Semester2Crosswalk);
    crosswalk.anchorRows.push({
      anchorId: "[4수99-99]",
      status: "gap",
      topicIds: [],
      reviewEvidence: "콘텐츠에 존재하지 않는 행을 검증하기 위한 충분히 긴 테스트 근거이다."
    });
    crosswalk.crosswalkDigest = "";
    expect(codes(inspect(crosswalk))).toContain("CW_ANCHOR_ROW_ORPHAN");
  });

  it("detects an unmapped content stage", () => {
    const crosswalk = structuredClone(grade3Semester2Crosswalk);
    crosswalk.stageRows.shift();
    crosswalk.crosswalkDigest = "";
    expect(codes(inspect(crosswalk))).toContain("CW_STAGE_UNMAPPED");
  });

  it("detects an orphan stage row", () => {
    const crosswalk = structuredClone(grade3Semester2Crosswalk);
    crosswalk.stageRows.push({
      stageId: "unknown.stage",
      status: "gap",
      topicIds: [],
      reviewEvidence: "콘텐츠에 존재하지 않는 행을 검증하기 위한 충분히 긴 테스트 근거이다."
    });
    crosswalk.crosswalkDigest = "";
    expect(codes(inspect(crosswalk))).toContain("CW_STAGE_ROW_ORPHAN");
  });

  it("rejects upstream IDs outside the pinned snapshot", () => {
    const crosswalk = structuredClone(grade3Semester2Crosswalk);
    crosswalk.stageRows[0].topicIds = ["kr.mt.math.unknown"];
    crosswalk.crosswalkDigest = "";
    expect(codes(inspect(crosswalk))).toContain("CW_UPSTREAM_ID_UNKNOWN");
  });

  it("rejects a topic mapped outside the local stage scope", () => {
    const crosswalk = structuredClone(grade3Semester2Crosswalk);
    crosswalk.stageRows[0].topicIds =
      structuredClone(crosswalk.stageRows.at(-1)?.topicIds ?? []);
    crosswalk.crosswalkDigest = "";
    expect(codes(inspect(crosswalk))).toContain("CW_SCOPE_MISMATCH");
  });

  it("rejects a known topic attached to the wrong anchor row", () => {
    const crosswalk = structuredClone(grade3Semester2Crosswalk);
    crosswalk.anchorRows[0].topicIds =
      structuredClone(crosswalk.anchorRows.at(-1)?.topicIds ?? []);
    crosswalk.crosswalkDigest = "";
    expect(codes(inspect(crosswalk))).toContain("CW_SCOPE_MISMATCH");
  });

  it("requires a reviewed explanation for every status", () => {
    const crosswalk = structuredClone(grade3Semester2Crosswalk);
    crosswalk.anchorRows[0].reviewEvidence = "짧음";
    crosswalk.crosswalkDigest = "";
    expect(codes(inspect(crosswalk))).toContain("CW_STATUS_EVIDENCE_REQUIRED");
  });

  it("rejects a matched status without any matched topic ID", () => {
    const crosswalk = structuredClone(grade3Semester2Crosswalk);
    crosswalk.anchorRows[0].topicIds = [];
    crosswalk.crosswalkDigest = "";
    expect(codes(inspect(crosswalk))).toContain("CW_STATUS_EVIDENCE_REQUIRED");
  });

  it("detects a content label drifting from the registry", () => {
    const content = structuredClone(grade3Semester2CompleteDiagnosis);
    content.curriculumAnchors[0].label = "다른 이름";
    const result = inspectCurriculumCrosswalk(
      { content, setKey: "grade3-semester2", targetVersion: "2.1.0" }
    );
    expect(result.issues.map((issue) => issue.code)).toContain(
      "CW_ANCHOR_LABEL_DRIFT"
    );
  });

  it("rejects a predecessor candidate added to a non-entry stage", () => {
    const crosswalk = structuredClone(grade3Semester2Crosswalk);
    const source = crosswalk.stageRows.find((row) => row.predecessorCandidate);
    const target = crosswalk.stageRows.find((row) => row.stageId === "multiplication.combine");
    if (!source?.predecessorCandidate || !target) throw new Error("test fixture missing");
    target.predecessorCandidate = structuredClone(source.predecessorCandidate);
    crosswalk.crosswalkDigest = "";
    expect(codes(inspect(crosswalk))).toContain("CW_PREDECESSOR_SCOPE_INVALID");
  });

  it("summarizes provenance for the Studio without exposing upstream prose", () => {
    expect(curriculumCrosswalkSummary()).toEqual({
      revision: "crosswalk-2026-07-29.1",
      anchorCount: 17,
      stageCount: 32,
      partialCount: 32,
      gapCount: 0,
      upstreamCommit: "3ef0563084aa2a9baaa47da2c1ec0ebf5d7edc5c",
      taxonomyVersion: "kr-full-depth-v0.4",
      ontologyVersion: "0.3.0-p3"
    });
  });
});
