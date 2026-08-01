import type {
  DiagnosisCoverageBlueprint,
  StageCoverage
} from "./coverage";
import {
  grade4Semester2DistractorRationales,
  grade4Semester2MisconceptionTitles
} from "./grade4-semester2-rationales";

function stage(
  stageId: string,
  anchorId: string,
  directJudgmentId: string,
  transferJudgmentId: string
): StageCoverage {
  return {
    stageId,
    curriculumAnchorIds: [anchorId],
    signalIds: [stageId],
    evidence: [
      { judgmentId: directJudgmentId, kind: "direct" },
      { judgmentId: transferJudgmentId, kind: "transfer" }
    ]
  };
}

export const grade4Semester2CoverageBlueprint: DiagnosisCoverageBlueprint = {
  diagnosisSetId: "grade4-semester2",
  blueprintRevision: "2026-08-01.6",
  enforcedFromVersion: "1.0.0",
  fallbackSignalIds: ["needs-scaffold", "needs-review"],
  misconceptionTitles: grade4Semester2MisconceptionTitles,
  distractors: grade4Semester2DistractorRationales,
  stages: [
    stage(
      "triangles.classify-isosceles",
      "[4수03-08]",
      "g4s2-tri-01",
      "g4s2-tri-02"
    ),
    stage(
      "triangles.classify-equilateral",
      "[4수03-08]",
      "g4s2-tri-03",
      "g4s2-tri-04"
    ),
    stage(
      "triangles.isosceles-equal-angles",
      "[4수03-08]",
      "g4s2-tri-05",
      "g4s2-tri-06"
    ),
    stage(
      "triangles.classify-right",
      "[4수03-09]",
      "g4s2-tri-07",
      "g4s2-tri-08"
    ),
    stage(
      "triangles.classify-acute-obtuse",
      "[4수03-09]",
      "g4s2-tri-09",
      "g4s2-tri-10"
    ),
    stage(
      "frac-ops.add-same-denominator",
      "[4수01-15]",
      "g4s2-frac-01",
      "g4s2-frac-02"
    ),
    stage(
      "frac-ops.sum-to-mixed",
      "[4수01-15]",
      "g4s2-frac-03",
      "g4s2-frac-04"
    ),
    stage(
      "frac-ops.subtract-same-denominator",
      "[4수01-15]",
      "g4s2-frac-05",
      "g4s2-frac-06"
    ),
    stage(
      "frac-ops.whole-minus-fraction",
      "[4수01-15]",
      "g4s2-frac-07",
      "g4s2-frac-08"
    ),
    stage(
      "frac-ops.mixed-add",
      "[4수01-15]",
      "g4s2-frac-09",
      "g4s2-frac-10"
    ),
    stage(
      "quad.perpendicular-side",
      "[4수03-03]",
      "g4s2-quad-01",
      "g4s2-quad-02"
    ),
    stage(
      "quad.parallel-side-distance",
      "[4수03-03]",
      "g4s2-quad-03",
      "g4s2-quad-04"
    ),
    stage(
      "quad.trapezoid-parallel-pair",
      "[4수03-10]",
      "g4s2-quad-05",
      "g4s2-quad-06"
    ),
    stage(
      "quad.rhombus-equal-sides",
      "[4수03-10]",
      "g4s2-quad-07",
      "g4s2-quad-08"
    ),
    stage(
      "quad.parallelogram-opposite-angle",
      "[4수03-10]",
      "g4s2-quad-09",
      "g4s2-quad-10"
    ),
    stage(
      "decimal.read-write",
      "[4수01-13]",
      "g4s2-dec-01",
      "g4s2-dec-02"
    ),
    stage(
      "decimal.compose-place-value",
      "[4수01-13]",
      "g4s2-dec-03",
      "g4s2-dec-04"
    ),
    stage(
      "decimal.compare",
      "[4수01-14]",
      "g4s2-dec-05",
      "g4s2-dec-06"
    ),
    stage(
      "decimal.add",
      "[4수01-16]",
      "g4s2-dec-07",
      "g4s2-dec-08"
    ),
    stage(
      "decimal.subtract",
      "[4수01-16]",
      "g4s2-dec-09",
      "g4s2-dec-10"
    ),
    stage(
      "polygon.identify-closed-straight",
      "[4수03-11]",
      "g4s2-poly-01",
      "g4s2-poly-02"
    ),
    stage(
      "polygon.name-by-side-count",
      "[4수03-11]",
      "g4s2-poly-03",
      "g4s2-poly-04"
    ),
    stage(
      "polygon.regular-two-conditions",
      "[4수03-11]",
      "g4s2-poly-05",
      "g4s2-poly-06"
    ),
    stage(
      "polygon.fill-remaining-space",
      "[4수03-12]",
      "g4s2-poly-07",
      "g4s2-poly-08"
    ),
    stage(
      "polygon.tile-count-pieces",
      "[4수03-12]",
      "g4s2-poly-09",
      "g4s2-poly-10"
    ),
    stage(
      "line-graph.tick-unit",
      "[4수04-02]",
      "g4s2-line-01",
      "g4s2-line-02"
    ),
    stage(
      "line-graph.point-value",
      "[4수04-02]",
      "g4s2-line-03",
      "g4s2-line-04"
    ),
    stage(
      "line-graph.step-change",
      "[4수04-02]",
      "g4s2-line-05",
      "g4s2-line-06"
    ),
    {
      stageId: "line-graph.largest-rise",
      curriculumAnchorIds: ["[4수04-02]", "[4수04-03]"],
      signalIds: ["line-graph.largest-rise"],
      evidence: [
        { judgmentId: "g4s2-line-07", kind: "direct" },
        { judgmentId: "g4s2-line-08", kind: "transfer" }
      ]
    },
    {
      stageId: "line-graph.between-estimate",
      curriculumAnchorIds: ["[4수04-02]", "[4수04-03]"],
      signalIds: ["line-graph.between-estimate"],
      evidence: [
        { judgmentId: "g4s2-line-09", kind: "direct" },
        { judgmentId: "g4s2-line-10", kind: "transfer" }
      ]
    }
  ]
};
