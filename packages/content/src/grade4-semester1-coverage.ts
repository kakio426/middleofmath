import type {
  DiagnosisCoverageBlueprint,
  StageCoverage
} from "./coverage";
import {
  grade4Semester1DistractorRationales,
  grade4Semester1MisconceptionTitles
} from "./grade4-semester1-rationales";

function stage(
  stageId: string,
  curriculumAnchorIds: string[],
  signalId: string,
  directJudgmentId: string,
  transferJudgmentId: string
): StageCoverage {
  return {
    stageId,
    curriculumAnchorIds,
    signalIds: [signalId],
    evidence: [
      { judgmentId: directJudgmentId, kind: "direct" },
      { judgmentId: transferJudgmentId, kind: "transfer" }
    ]
  };
}

export const grade4Semester1CoverageBlueprint: DiagnosisCoverageBlueprint = {
  diagnosisSetId: "grade4-semester1",
  blueprintRevision: "2026-07-31.6",
  enforcedFromVersion: "1.0.0",
  fallbackSignalIds: ["needs-scaffold", "needs-review"],
  misconceptionTitles: grade4Semester1MisconceptionTitles,
  distractors: grade4Semester1DistractorRationales,
  stages: [
    stage(
      "large-number.place-value",
      ["[4수01-01]"],
      "large-number.place-value",
      "g4s1-large-01",
      "g4s1-large-02"
    ),
    stage(
      "large-number.positional-notation",
      ["[4수01-01]"],
      "large-number.positional-notation",
      "g4s1-large-03",
      "g4s1-large-04"
    ),
    stage(
      "large-number.read-write",
      ["[4수01-01]"],
      "large-number.read-write",
      "g4s1-large-05",
      "g4s1-large-06"
    ),
    stage(
      "large-number.sequence",
      ["[4수01-02]"],
      "large-number.sequence",
      "g4s1-large-07",
      "g4s1-large-08"
    ),
    stage(
      "large-number.compare",
      ["[4수01-02]"],
      "large-number.compare",
      "g4s1-large-09",
      "g4s1-large-10"
    ),
    stage(
      "large-number.compare-reasoning",
      ["[4수01-02]"],
      "large-number.compare-reasoning",
      "g4s1-large-11",
      "g4s1-large-12"
    ),
    stage(
      "angle.right-angle",
      ["[4수03-02]"],
      "angle.right-angle",
      "g4s1-angle-01",
      "g4s1-angle-02"
    ),
    stage(
      "angle.classify",
      ["[4수03-02]"],
      "angle.classify",
      "g4s1-angle-03",
      "g4s1-angle-04"
    ),
    stage(
      "angle.protractor-measure",
      ["[4수03-24]"],
      "angle.protractor-measure",
      "g4s1-angle-05",
      "g4s1-angle-06"
    ),
    stage(
      "angle.estimate",
      ["[4수03-24]"],
      "angle.estimate",
      "g4s1-angle-07",
      "g4s1-angle-08"
    ),
    stage(
      "angle.triangle-angle-sum",
      ["[4수03-25]"],
      "angle.triangle-angle-sum",
      "g4s1-angle-09",
      "g4s1-angle-10"
    ),
    stage(
      "angle.quadrilateral-angle-sum",
      ["[4수03-25]"],
      "angle.quadrilateral-angle-sum",
      "g4s1-angle-11",
      "g4s1-angle-12"
    ),
    stage(
      "figure-transform.slide",
      ["[4수03-04]"],
      "figure-transform.slide",
      "g4s1-transform-01",
      "g4s1-transform-02"
    ),
    stage(
      "figure-transform.flip-left-right",
      ["[4수03-04]"],
      "figure-transform.flip-left-right",
      "g4s1-transform-03",
      "g4s1-transform-04"
    ),
    stage(
      "figure-transform.flip-up-down",
      ["[4수03-04]"],
      "figure-transform.flip-up-down",
      "g4s1-transform-05",
      "g4s1-transform-06"
    ),
    stage(
      "figure-transform.rotate",
      ["[4수03-04]"],
      "figure-transform.rotate",
      "g4s1-transform-07",
      "g4s1-transform-08"
    ),
    stage(
      "figure-transform.point-move",
      ["[4수03-05]"],
      "figure-transform.point-move",
      "g4s1-transform-09",
      "g4s1-transform-10"
    ),
    stage(
      "patterns-relations.number-rule",
      ["[4수02-01]"],
      "patterns-relations.number-rule",
      "g4s1-pattern-01",
      "g4s1-pattern-02"
    ),
    stage(
      "patterns-relations.figure-rule",
      ["[4수02-01]"],
      "patterns-relations.figure-rule",
      "g4s1-pattern-03",
      "g4s1-pattern-04"
    ),
    stage(
      "patterns-relations.rule-as-expression",
      ["[4수02-01]"],
      "patterns-relations.rule-as-expression",
      "g4s1-pattern-05",
      "g4s1-pattern-06"
    ),
    stage(
      "patterns-relations.calc-array-rule",
      ["[4수02-02]"],
      "patterns-relations.calc-array-rule",
      "g4s1-pattern-07",
      "g4s1-pattern-08"
    ),
    stage(
      "patterns-relations.equal-sign",
      ["[4수02-03]"],
      "patterns-relations.equal-sign",
      "g4s1-pattern-09",
      "g4s1-pattern-10"
    ),
    stage(
      "bar-graph.scale",
      ["[4수04-01]"],
      "bar-graph.scale",
      "g4s1-bar-01",
      "g4s1-bar-02"
    ),
    stage(
      "bar-graph.read-value",
      ["[4수04-01]"],
      "bar-graph.read-value",
      "g4s1-bar-03",
      "g4s1-bar-04"
    ),
    stage(
      "bar-graph.compare",
      ["[4수04-01]"],
      "bar-graph.compare",
      "g4s1-bar-05",
      "g4s1-bar-06"
    ),
    stage(
      "bar-graph.table-match",
      ["[4수04-01]", "[4수04-03]"],
      "bar-graph.table-match",
      "g4s1-bar-07",
      "g4s1-bar-08"
    ),
    stage(
      "bar-graph.inquiry",
      ["[4수04-03]"],
      "bar-graph.inquiry",
      "g4s1-bar-09",
      "g4s1-bar-10"
    ),
    stage(
      "mul-div.partial-product-place",
      ["[4수01-04]"],
      "mul-div.partial-product-place",
      "g4s1-muldiv-01",
      "g4s1-muldiv-02"
    ),
    stage(
      "mul-div.product-combine",
      ["[4수01-04]"],
      "mul-div.product-combine",
      "g4s1-muldiv-03",
      "g4s1-muldiv-04"
    ),
    stage(
      "mul-div.quotient-place",
      ["[4수01-07]"],
      "mul-div.quotient-place",
      "g4s1-muldiv-05",
      "g4s1-muldiv-06"
    ),
    stage(
      "mul-div.quotient-adjust",
      ["[4수01-07]"],
      "mul-div.quotient-adjust",
      "g4s1-muldiv-07",
      "g4s1-muldiv-08"
    ),
    stage(
      "mul-div.multiplication-check",
      ["[4수01-05]"],
      "mul-div.multiplication-check",
      "g4s1-muldiv-09",
      "g4s1-muldiv-10"
    ),
    stage(
      "mul-div.estimate",
      ["[4수01-08]"],
      "mul-div.estimate",
      "g4s1-muldiv-11",
      "g4s1-muldiv-12"
    )
  ]
};
