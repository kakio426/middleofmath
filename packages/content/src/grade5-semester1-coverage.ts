import type {
  DiagnosisCoverageBlueprint,
  StageCoverage
} from "./coverage";
import {
  grade5Semester1DistractorRationales,
  grade5Semester1MisconceptionTitles
} from "./grade5-semester1-rationales";

function stage(
  stageId: string,
  directJudgmentId: string,
  transferJudgmentId: string,
  signalIds: string[] = [stageId],
  curriculumAnchorIds: string[] = ["[6수01-01]"]
): StageCoverage {
  return {
    stageId,
    curriculumAnchorIds,
    signalIds,
    evidence: [
      { judgmentId: directJudgmentId, kind: "direct" },
      { judgmentId: transferJudgmentId, kind: "transfer" }
    ]
  };
}

export const grade5Semester1CoverageBlueprint: DiagnosisCoverageBlueprint = {
  diagnosisSetId: "grade5-semester1",
  blueprintRevision: "2026-08-01.7",
  enforcedFromVersion: "1.0.0",
  fallbackSignalIds: ["needs-scaffold", "needs-review"],
  misconceptionTitles: grade5Semester1MisconceptionTitles,
  distractors: grade5Semester1DistractorRationales,
  stages: [
    stage("mixed-operations.multiply-first", "g5s1-mix-01", "g5s1-mix-02", [
      "mixed-operations.multiply-first",
      "mixed-operations.incomplete-expression"
    ]),
    stage("mixed-operations.divide-first", "g5s1-mix-03", "g5s1-mix-04"),
    stage("mixed-operations.same-rank-left-to-right", "g5s1-mix-05", "g5s1-mix-06", [
      "mixed-operations.same-rank-left-to-right",
      "mixed-operations.incomplete-expression"
    ]),
    stage("mixed-operations.parentheses-first", "g5s1-mix-07", "g5s1-mix-08", [
      "mixed-operations.parentheses-first",
      "mixed-operations.incomplete-expression"
    ]),
    stage("mixed-operations.full-order", "g5s1-mix-09", "g5s1-mix-10"),
    stage("factors.list-divisors", "g5s1-fm-01", "g5s1-fm-02", [
      "factors.list-divisors"
    ], ["[6수01-04]"]),
    stage("factors.common-and-greatest", "g5s1-fm-03", "g5s1-fm-04", [
      "factors.common-and-greatest",
      "factors-multiples.common-set"
    ], ["[6수01-04]"]),
    stage("multiples.list-multiples", "g5s1-fm-05", "g5s1-fm-06", [
      "multiples.list-multiples"
    ], ["[6수01-05]"]),
    stage("multiples.common-and-least", "g5s1-fm-07", "g5s1-fm-08", [
      "multiples.common-and-least",
      "factors-multiples.common-set"
    ], ["[6수01-05]"]),
    stage("factors-multiples.apply-in-context", "g5s1-fm-09", "g5s1-fm-10", [
      "factors-multiples.apply-in-context"
    ], ["[6수01-04]", "[6수01-05]"]),
    stage("correspondence.pair-from-table", "g5s1-cor-01", "g5s1-cor-02", [
      "correspondence.pair-from-table"
    ], ["[6수02-01]"]),
    stage("correspondence.symbol-expression", "g5s1-cor-03", "g5s1-cor-04", [
      "correspondence.symbol-expression"
    ], ["[6수02-01]"]),
    stage("correspondence.base-and-dependent", "g5s1-cor-05", "g5s1-cor-06", [
      "correspondence.base-and-dependent"
    ], ["[6수02-01]"]),
    stage("correspondence.apply-backward", "g5s1-cor-07", "g5s1-cor-08", [
      "correspondence.apply-backward"
    ], ["[6수02-01]"]),
    stage("correspondence.change-together", "g5s1-cor-09", "g5s1-cor-10", [
      "correspondence.change-together"
    ], ["[6수02-01]"]),
    stage("frac-equiv.multiply-both", "g5s1-frq-01", "g5s1-frq-02", [
      "frac-equiv.multiply-both"
    ], ["[6수01-06]"]),
    stage("frac-equiv.divide-both", "g5s1-frq-03", "g5s1-frq-04", [
      "frac-equiv.divide-both"
    ], ["[6수01-06]"]),
    stage("frac-equiv.simplest-form", "g5s1-frq-05", "g5s1-frq-06", [
      "frac-equiv.simplest-form"
    ], ["[6수01-06]"]),
    stage("frac-equiv.common-denominator", "g5s1-frq-07", "g5s1-frq-08", [
      "frac-equiv.common-denominator"
    ], ["[6수01-06]"]),
    stage("frac-compare.different-denominator", "g5s1-frq-09", "g5s1-frq-10", [
      "frac-compare.different-denominator"
    ], ["[6수01-07]"]),
    stage("frac-decimal.convert", "g5s1-frq-11", "g5s1-frq-12", [
      "frac-decimal.convert"
    ], ["[6수01-12]"]),
    stage("frac-decimal.compare", "g5s1-frq-13", "g5s1-frq-14", [
      "frac-decimal.compare"
    ], ["[6수01-12]"]),
    stage("fa.add-unlike", "g5s1-fa-01", "g5s1-fa-02", [
      "fa.add-unlike"
    ], ["[6수01-08]"]),
    stage("fa.sub-unlike", "g5s1-fa-03", "g5s1-fa-04", [
      "fa.sub-unlike"
    ], ["[6수01-08]"]),
    stage("fa.reduce-result", "g5s1-fa-05", "g5s1-fa-06", [
      "fa.reduce-result"
    ], ["[6수01-08]"]),
    stage("fa.mixed-add", "g5s1-fa-07", "g5s1-fa-08", [
      "fa.mixed-add"
    ], ["[6수01-08]"]),
    stage("fa.carry", "g5s1-fa-09", "g5s1-fa-10", [
      "fa.carry"
    ], ["[6수01-08]"]),
    stage("fa.borrow", "g5s1-fa-11", "g5s1-fa-12", [
      "fa.borrow"
    ], ["[6수01-08]"]),
    stage("pa.perimeter", "g5s1-pa-01", "g5s1-pa-02", [
      "pa.perimeter"
    ], ["[6수03-11]"]),
    stage("pa.area-unit", "g5s1-pa-03", "g5s1-pa-04", [
      "pa.area-unit"
    ], ["[6수03-12]"]),
    stage("pa.rectangle-square-area", "g5s1-pa-05", "g5s1-pa-06", [
      "pa.rectangle-square-area"
    ], ["[6수03-13]"]),
    stage("pa.parallelogram-area", "g5s1-pa-07", "g5s1-pa-08", [
      "pa.parallelogram-area"
    ], ["[6수03-14]"]),
    stage("pa.triangle-area", "g5s1-pa-09", "g5s1-pa-10", [
      "pa.triangle-area"
    ], ["[6수03-14]"]),
    stage("pa.trapezoid-area", "g5s1-pa-11", "g5s1-pa-12", [
      "pa.trapezoid-area"
    ], ["[6수03-14]"]),
    stage("pa.rhombus-area", "g5s1-pa-13", "g5s1-pa-14", [
      "pa.rhombus-area"
    ], ["[6수03-14]"])
  ]
};
