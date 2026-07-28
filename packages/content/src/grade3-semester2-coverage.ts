import type {
  DiagnosisCoverageBlueprint,
  StageCoverage
} from "./coverage";

function stage(
  stageId: string,
  curriculumAnchorIds: string[],
  signalIds: string[],
  directJudgmentId: string,
  transferJudgmentId: string
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

/**
 * 3-2 완성 문제은행의 편집용 커버리지 계약.
 *
 * direct는 관계나 계산 절차를 바로 확인하는 문항이고, transfer는 다른 수,
 * 생활 맥락, 표상에 같은 생각을 적용하는 문항이다.
 */
export const grade3Semester2CoverageBlueprint: DiagnosisCoverageBlueprint = {
  diagnosisSetId: "grade3-semester2",
  fallbackSignalIds: ["needs-scaffold", "needs-review"],
  stages: [
    stage(
      "multiplication.place-value",
      ["[4수01-04]"],
      ["multiplication.place-value-loss"],
      "g3s2-mul-01",
      "g3s2-mul-03"
    ),
    stage(
      "multiplication.combine",
      ["[4수01-04]"],
      ["multiplication.partial-product"],
      "g3s2-mul-02",
      "g3s2-mul-04"
    ),
    stage(
      "multiplication.two-digit",
      ["[4수01-04]"],
      ["multiplication.two-digit-factor"],
      "g3s2-mul-05",
      "g3s2-mul-06"
    ),
    stage(
      "multiplication.estimate",
      ["[4수01-08]"],
      ["multiplication.estimate"],
      "g3s2-mul-07",
      "g3s2-mul-08"
    ),
    stage(
      "division.meaning",
      ["[4수01-05]"],
      ["division.meaning"],
      "g3s2-div-05",
      "g3s2-div-06"
    ),
    stage(
      "division.remainder",
      ["[4수01-05]", "[4수01-06]"],
      ["division.leftover"],
      "g3s2-div-01",
      "g3s2-div-03"
    ),
    stage(
      "division.equal-sharing",
      ["[4수01-05]", "[4수01-06]"],
      ["division.equal-share"],
      "g3s2-div-02",
      "g3s2-div-04"
    ),
    stage(
      "division.remainder-check",
      ["[4수01-05]", "[4수01-06]"],
      ["division.remainder-check"],
      "g3s2-div-07",
      "g3s2-div-08"
    ),
    stage(
      "division.estimate",
      ["[4수01-08]"],
      ["division.estimate"],
      "g3s2-div-09",
      "g3s2-div-10"
    ),
    stage(
      "circle.parts",
      ["[4수03-06]"],
      ["circle.center-radius"],
      "g3s2-circle-01",
      "g3s2-circle-03"
    ),
    stage(
      "circle.equal-radii",
      ["[4수03-06]"],
      ["circle.equal-radii"],
      "g3s2-circle-05",
      "g3s2-circle-06"
    ),
    stage(
      "circle.diameter",
      ["[4수03-06]"],
      ["circle.radius-diameter"],
      "g3s2-circle-02",
      "g3s2-circle-04"
    ),
    stage(
      "circle.compass",
      ["[4수03-07]"],
      ["circle.compass"],
      "g3s2-circle-07",
      "g3s2-circle-08"
    ),
    stage(
      "fraction.part-whole",
      ["[4수01-09]", "[4수01-10]"],
      ["fraction.part-whole"],
      "g3s2-frac-01",
      "g3s2-frac-03"
    ),
    stage(
      "fraction.discrete",
      ["[4수01-09]"],
      ["fraction.discrete"],
      "g3s2-frac-05",
      "g3s2-frac-06"
    ),
    stage(
      "fraction.unit",
      ["[4수01-10]"],
      ["fraction.unit"],
      "g3s2-frac-07",
      "g3s2-frac-08"
    ),
    stage(
      "fraction.types",
      ["[4수01-10]"],
      ["fraction.types"],
      "g3s2-frac-09",
      "g3s2-frac-10"
    ),
    stage(
      "fraction.convert",
      ["[4수01-10]"],
      ["fraction.convert"],
      "g3s2-frac-11",
      "g3s2-frac-12"
    ),
    stage(
      "fraction.compare",
      ["[4수01-11]"],
      ["fraction.same-denominator"],
      "g3s2-frac-02",
      "g3s2-frac-04"
    ),
    stage(
      "fraction.unit-compare",
      ["[4수01-11]"],
      ["fraction.unit-compare"],
      "g3s2-frac-13",
      "g3s2-frac-14"
    ),
    stage(
      "measurement.capacity-measure",
      ["[4수03-17]"],
      ["measurement.capacity-measure"],
      "g3s2-measure-05",
      "g3s2-measure-06"
    ),
    stage(
      "measurement.capacity",
      ["[4수03-18]"],
      ["measurement.capacity-unit"],
      "g3s2-measure-01",
      "g3s2-measure-03"
    ),
    stage(
      "measurement.capacity-arithmetic",
      ["[4수03-19]"],
      ["measurement.capacity-arithmetic"],
      "g3s2-measure-07",
      "g3s2-measure-08"
    ),
    stage(
      "measurement.weight-measure",
      ["[4수03-20]"],
      ["measurement.weight-measure"],
      "g3s2-measure-09",
      "g3s2-measure-10"
    ),
    stage(
      "measurement.weight",
      ["[4수03-21]"],
      ["measurement.weight-unit"],
      "g3s2-measure-02",
      "g3s2-measure-04"
    ),
    stage(
      "measurement.ton",
      ["[4수03-22]"],
      ["measurement.ton"],
      "g3s2-measure-11",
      "g3s2-measure-12"
    ),
    stage(
      "measurement.weight-arithmetic",
      ["[4수03-23]"],
      ["measurement.weight-arithmetic"],
      "g3s2-measure-13",
      "g3s2-measure-14"
    ),
    stage(
      "pictograph.classify-table",
      ["[4수04-01]"],
      ["pictograph.classify-table"],
      "g3s2-graph-05",
      "g3s2-graph-06"
    ),
    stage(
      "pictograph.legend",
      ["[4수04-01]"],
      ["pictograph.legend"],
      "g3s2-graph-01",
      "g3s2-graph-03"
    ),
    stage(
      "pictograph.convert",
      ["[4수04-01]"],
      ["pictograph.convert"],
      "g3s2-graph-07",
      "g3s2-graph-08"
    ),
    stage(
      "pictograph.complete",
      ["[4수04-01]"],
      ["pictograph.complete"],
      "g3s2-graph-09",
      "g3s2-graph-10"
    ),
    stage(
      "pictograph.compare",
      ["[4수04-01]"],
      ["pictograph.difference"],
      "g3s2-graph-02",
      "g3s2-graph-04"
    )
  ]
};
