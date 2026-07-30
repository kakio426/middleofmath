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
  blueprintRevision: "2026-07-30.2",
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
    )
  ]
};
