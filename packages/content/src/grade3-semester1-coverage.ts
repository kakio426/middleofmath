import type {
  DiagnosisCoverageBlueprint,
  StageCoverage
} from "./coverage";
import {
  grade3Semester1DistractorRationales,
  grade3Semester1MisconceptionTitles
} from "./grade3-semester1-rationales";

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

export const grade3Semester1CoverageBlueprint: DiagnosisCoverageBlueprint = {
  diagnosisSetId: "grade3-semester1",
  blueprintRevision: "2026-07-30.1",
  enforcedFromVersion: "1.0.0",
  fallbackSignalIds: ["needs-scaffold", "needs-review"],
  misconceptionTitles: grade3Semester1MisconceptionTitles,
  distractors: grade3Semester1DistractorRationales,
  stages: [
    stage("multiplication.equal-groups", ["[4수01-04]"], "multiplication.equal-groups", "g3s1-mul-01", "g3s1-mul-02"),
    stage("multiplication.two-digit-by-one", ["[4수01-04]"], "multiplication.place-value", "g3s1-mul-03", "g3s1-mul-04"),
    stage("division.equal-partition", ["[4수01-05]"], "division.equal-partition", "g3s1-div-01", "g3s1-div-02"),
    stage("division.multiplication-link", ["[4수01-05]", "[4수01-06]"], "division.multiplication-link", "g3s1-div-03", "g3s1-div-04"),
    stage("fraction.equal-partition", ["[4수01-09]"], "fraction.equal-partition", "g3s1-frac-01", "g3s1-frac-02"),
    stage("fraction.part-of-whole", ["[4수01-09]"], "fraction.part-of-whole", "g3s1-frac-03", "g3s1-frac-04"),
    stage("length.unit-choice", ["[4수03-16]"], "length.unit-choice", "g3s1-len-01", "g3s1-len-02"),
    stage("length.unit-convert", ["[4수03-16]"], "length.unit-convert", "g3s1-len-03", "g3s1-len-04")
  ]
};
