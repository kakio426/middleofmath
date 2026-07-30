import { describe, expect, it } from "vitest";
import { inspectDiagnosticIntegrity } from "./diagnostic-integrity";
import { grade3Semester1Diagnosis } from "./grade3-semester1";

describe("3학년 1학기 진단 무결성의 알려진 편집 한계", () => {
  it("오류 없이 외부 자료와 학기 연결의 자문 성격만 명시한다", () => {
    const result = inspectDiagnosticIntegrity({
      content: grade3Semester1Diagnosis,
      setKey: grade3Semester1Diagnosis.manifest.id,
      targetVersion: grade3Semester1Diagnosis.manifest.version
    });

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "CW_UPSTREAM_CANDIDATE_DATA",
        severity: "warning"
      }),
      expect.objectContaining({
        code: "CW_PREDECESSOR_ADVISORY",
        severity: "warning"
      }),
      expect.objectContaining({
        code: "SPG_ADVISORY_EDGES_PRESENT",
        severity: "warning"
      }),
      expect.objectContaining({
        code: "SPG_SEMESTER_PLACEMENT_EDITORIAL",
        severity: "warning"
      })
    ]);
    expect(result.gates?.[0]).toMatchObject({
      enforced: true,
      valid: true,
      errorCount: 0,
      warningCount: 4,
      blueprintRevision: "2026-07-30.1",
      crosswalkRevision: "crosswalk-g3s1-2026-07-30.1",
      crosswalkDigest:
        "sha256:04ac730ff1e941da9ee14ab8105c0054b8989f5ab4068556bb674d19c74f1184",
      graphRevision: "g3-prerequisite-2026-07-30.1",
      graphDigest:
        "sha256:3df7e0f008076ab38ea2b821b51582abd94eec6021a1422b7ee369294e704a47",
      upstreamCommit: "3ef0563084aa2a9baaa47da2c1ec0ebf5d7edc5c",
      upstreamTaxonomyVersion: "kr-full-depth-v0.4",
      upstreamOntologyVersion: "0.3.0-p3"
    });
  });

  it("등록된 세트의 선수 그래프가 빠지면 운영 게이트에서 차단한다", () => {
    const result = inspectDiagnosticIntegrity(
      {
        content: grade3Semester1Diagnosis,
        setKey: grade3Semester1Diagnosis.manifest.id,
        targetVersion: grade3Semester1Diagnosis.manifest.version
      },
      { stagePrerequisiteGraph: null }
    );

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "SPG_GRAPH_MISSING",
        severity: "error"
      })
    ]));
  });
});
