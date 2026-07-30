import { describe, expect, it } from "vitest";
import { inspectDiagnosticIntegrity } from "./diagnostic-integrity";
import { grade3Semester2CompleteDiagnosis } from "./grade3-semester2-complete";

/**
 * U6 closes the known semantic errors. The two remaining warnings explicitly
 * describe the pinned upstream map's candidate/advisory status.
 */
describe("3학년 2학기 진단 무결성의 알려진 콘텐츠 공백", () => {
  it("passes v2.1 semantic enforcement with only upstream provenance warnings", () => {
    const result = inspectDiagnosticIntegrity({
      content: grade3Semester2CompleteDiagnosis,
      setKey: grade3Semester2CompleteDiagnosis.manifest.id,
      targetVersion: "2.1.0"
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
      })
    ]);
    expect(result.gates?.[0]).toMatchObject({
      enforced: true,
      valid: true,
      errorCount: 0,
      warningCount: 2,
      blueprintRevision: "2026-07-30.2",
      crosswalkRevision: "crosswalk-2026-07-29.1",
      crosswalkDigest: "sha256:e39d1284f97d38b4946c1787665504385f71aeb1d9e5e03f5ee9ff2d1ffa90ab",
      upstreamCommit: "3ef0563084aa2a9baaa47da2c1ec0ebf5d7edc5c",
      upstreamTaxonomyVersion: "kr-full-depth-v0.4",
      upstreamOntologyVersion: "0.3.0-p3"
    });
  });
});
