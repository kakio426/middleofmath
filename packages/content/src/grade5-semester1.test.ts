import { describe, expect, it } from "vitest";
import { validateCoverageBlueprint } from "./coverage";
import { inspectDiagnosticIntegrity } from "./diagnostic-integrity";
import { diagnosisContentChecksum } from "./integrity-digest";
import { validateDiagnosisSet } from "./schema";
import { grade4Semester1Diagnosis } from "./grade4-semester1";
import { grade5Semester1CoverageBlueprint } from "./grade5-semester1-coverage";
import { grade5Semester1Diagnosis } from "./grade5-semester1";

describe("5학년 1학기 진단", () => {
  it("여섯 단원·35단계·70판단을 단원별 독립 활동으로 제공한다", () => {
    expect(grade5Semester1Diagnosis.manifest).toMatchObject({
      id: "grade5-semester1",
      version: "1.0.0",
      grade: 5,
      semester: 1,
      status: "review",
      estimatedMinutes: 35,
      units: [
        { id: "mixed-operations", order: 1, title: "자연수의 혼합 계산" },
        { id: "factors-multiples", order: 2, title: "약수와 배수" },
        { id: "correspondence", order: 3, title: "대응 관계" },
        { id: "fraction-reduction-common-denominator", order: 4, title: "약분과 통분" },
        { id: "fraction-add-subtract", order: 5, title: "분수의 덧셈과 뺄셈" },
        { id: "polygon-perimeter-area", order: 6, title: "다각형의 둘레와 넓이" }
      ]
    });
    expect(grade5Semester1Diagnosis.curriculumAnchors.map(
      (anchor) => anchor.id
    )).toEqual([
      "[6수01-01]", "[6수01-04]", "[6수01-05]", "[6수02-01]",
      "[6수01-06]", "[6수01-07]", "[6수01-12]", "[6수01-08]",
      "[6수03-11]", "[6수03-12]", "[6수03-13]", "[6수03-14]"
    ]);
    expect(grade5Semester1Diagnosis.learnerStages).toHaveLength(35);
    expect(grade5Semester1Diagnosis.judgments).toHaveLength(70);
    expect(new Set(grade5Semester1Diagnosis.judgments.map(
      (judgment) => judgment.learnerStageId
    )).size).toBe(35);
  });

  it("곱셈·나눗셈은 독립 시작 단계이고 통합 단계가 네 기초 단계를 요구한다", () => {
    const stages = new Map(grade5Semester1Diagnosis.learnerStages.map(
      (stage) => [stage.id, stage]
    ));
    expect(stages.get("mixed-operations.multiply-first")
      ?.prerequisiteStageIds).toEqual([]);
    expect(stages.get("mixed-operations.divide-first")
      ?.prerequisiteStageIds).toEqual([]);
    expect(stages.get("mixed-operations.same-rank-left-to-right")
      ?.prerequisiteStageIds).toEqual([
        "mixed-operations.multiply-first",
        "mixed-operations.divide-first"
      ]);
    expect(stages.get("mixed-operations.full-order")
      ?.prerequisiteStageIds).toEqual([
        "mixed-operations.multiply-first",
        "mixed-operations.divide-first",
        "mixed-operations.same-rank-left-to-right",
        "mixed-operations.parentheses-first"
      ]);
  });

  it("약수와 배수는 독립 시작 단계이고 상황 적용은 두 공통값 단계를 요구한다", () => {
    const stages = new Map(grade5Semester1Diagnosis.learnerStages.map(
      (stage) => [stage.id, stage]
    ));
    expect(stages.get("factors.list-divisors")?.prerequisiteStageIds).toEqual([]);
    expect(stages.get("multiples.list-multiples")?.prerequisiteStageIds).toEqual([]);
    expect(stages.get("factors.common-and-greatest")
      ?.prerequisiteStageIds).toEqual(["factors.list-divisors"]);
    expect(stages.get("multiples.common-and-least")
      ?.prerequisiteStageIds).toEqual(["multiples.list-multiples"]);
    expect(stages.get("factors-multiples.apply-in-context")
      ?.prerequisiteStageIds).toEqual([
        "factors.common-and-greatest",
        "multiples.common-and-least"
      ]);
  });

  it("대응 관계는 표 읽기 뒤 기호식과 두 적용 갈래로 이어진다", () => {
    const stages = new Map(grade5Semester1Diagnosis.learnerStages.map(
      (stage) => [stage.id, stage]
    ));
    expect(stages.get("correspondence.pair-from-table")
      ?.prerequisiteStageIds).toEqual([]);
    expect(stages.get("correspondence.symbol-expression")
      ?.prerequisiteStageIds).toEqual(["correspondence.pair-from-table"]);
    expect(stages.get("correspondence.base-and-dependent")
      ?.prerequisiteStageIds).toEqual(["correspondence.symbol-expression"]);
    expect(stages.get("correspondence.apply-backward")
      ?.prerequisiteStageIds).toEqual(["correspondence.symbol-expression"]);
    expect(stages.get("correspondence.change-together")
      ?.prerequisiteStageIds).toEqual(["correspondence.pair-from-table"]);
  });

  it("약분과 통분은 독립 동치분수에서 기약분수·통분·비교로 이어진다", () => {
    const stages = new Map(grade5Semester1Diagnosis.learnerStages.map(
      (stage) => [stage.id, stage]
    ));
    expect(stages.get("frac-equiv.multiply-both")?.prerequisiteStageIds)
      .toEqual([]);
    expect(stages.get("frac-equiv.divide-both")?.prerequisiteStageIds)
      .toEqual([]);
    expect(stages.get("frac-equiv.simplest-form")?.prerequisiteStageIds)
      .toEqual(["frac-equiv.divide-both", "factors.common-and-greatest"]);
    expect(stages.get("frac-equiv.common-denominator")?.prerequisiteStageIds)
      .toEqual(["frac-equiv.multiply-both", "multiples.common-and-least"]);
    expect(stages.get("frac-compare.different-denominator")?.prerequisiteStageIds)
      .toEqual(["frac-equiv.common-denominator"]);
    expect(stages.get("frac-decimal.compare")?.prerequisiteStageIds)
      .toEqual(["frac-decimal.convert", "frac-compare.different-denominator"]);
  });

  it("분수의 덧셈과 뺄셈은 통분에서 연산·약분·대분수 처리로 이어진다", () => {
    const stages = new Map(grade5Semester1Diagnosis.learnerStages.map(
      (stage) => [stage.id, stage]
    ));
    expect(stages.get("fa.add-unlike")?.prerequisiteStageIds)
      .toEqual(["frac-equiv.common-denominator"]);
    expect(stages.get("fa.sub-unlike")?.prerequisiteStageIds)
      .toEqual(["frac-equiv.common-denominator"]);
    expect(stages.get("fa.reduce-result")?.prerequisiteStageIds)
      .toEqual(["fa.add-unlike", "fa.sub-unlike", "frac-equiv.simplest-form"]);
    expect(stages.get("fa.carry")?.prerequisiteStageIds)
      .toEqual(["fa.mixed-add"]);
    expect(stages.get("fa.borrow")?.prerequisiteStageIds)
      .toEqual(["fa.sub-unlike", "fa.mixed-add"]);
  });

  it("4학년 한 양의 규칙과 겹치지 않고 두 양·기호식 단계로 확장한다", () => {
    const grade4Stages = grade4Semester1Diagnosis.learnerStages.filter(
      (stage) => stage.unitId === "patterns-relations"
    );
    const grade5Stages = grade5Semester1Diagnosis.learnerStages.filter(
      (stage) => stage.unitId === "correspondence"
    );
    expect(grade4Stages).toHaveLength(5);
    expect(grade5Stages).toHaveLength(5);
    expect(grade5Stages.every((stage) =>
      !grade4Stages.some((earlier) => earlier.id === stage.id)
    )).toBe(true);
    expect(grade5Stages.flatMap((stage) => stage.curriculumAnchorIds))
      .not.toContain("[4수02-01]");
    expect(grade5Semester1Diagnosis.judgments.filter(
      (judgment) => judgment.unitId === "correspondence"
    ).slice(2, 6).every((judgment) =>
      judgment.choices.every((choice) => /[□△]/.test(choice.label))
    )).toBe(true);
  });

  it("모든 단계에 direct와 transfer 판단이 하나씩 있다", () => {
    expect(validateCoverageBlueprint(
      grade5Semester1Diagnosis,
      grade5Semester1CoverageBlueprint
    )).toEqual({ valid: true, issues: [] });
  });

  it("학생 문구는 짧고 제작자 용어·수동 줄바꿈·범위 밖 용어·불필요한 시각 자료가 없다", () => {
    const copy = grade5Semester1Diagnosis.judgments.flatMap((judgment) => [
      judgment.context ?? "",
      judgment.prompt,
      ...judgment.choices.map((choice) => choice.label)
    ]).join(" ");
    expect(copy).not.toMatch(
      /오개념|진단|전략|알고리즘|우선순위|결합법칙|분배법칙|소인수|서로소|인수분해|GCD|LCM|<br|[\r\n]/
    );
    expect(grade5Semester1Diagnosis.judgments.every((judgment) => {
      const expectedVisual = judgment.unitId === "correspondence"
        ? judgment.visual.kind === "relation-pattern-diagram"
          && judgment.visual.mode === "rule-table"
        : judgment.unitId === "polygon-perimeter-area"
          ? judgment.learnerStageId === "pa.area-unit"
            ? judgment.visual.kind === "none"
            : judgment.visual.kind === "perimeter-area-diagram"
          : judgment.visual.kind === "none";
      return expectedVisual
        && judgment.prompt.length <= 60
        && (judgment.context?.length ?? 0) <= 30;
    })).toBe(true);
  });

  it("런타임 스키마와 정규화된 checksum이 일치한다", () => {
    expect(validateDiagnosisSet(grade5Semester1Diagnosis)).toEqual({
      valid: true,
      issues: []
    });
    expect(grade5Semester1Diagnosis.manifest.checksum).toBe(
      diagnosisContentChecksum(grade5Semester1Diagnosis)
    );
  });

  it("승인 배치·5~6학년군 교차표·coverage 발행 게이트를 통과한다", () => {
    const result = inspectDiagnosticIntegrity({
      content: grade5Semester1Diagnosis,
      setKey: "grade5-semester1",
      targetVersion: "1.0.0"
    });
    expect(result.valid, JSON.stringify(result.issues, null, 2)).toBe(true);
    expect(result.issues.filter(
      (issue) => issue.severity === "error"
    )).toEqual([]);
    expect(result.gates?.[0]).toMatchObject({
      valid: true,
      errorCount: 0,
      warningCount: 1,
      blueprintRevision: "2026-08-01.7",
      crosswalkRevision: "2026-08-01.6",
      crosswalkDigest:
        "sha256:c4176ad2da5fd9a4ccd2705d9c1e448850394c731fe79207c2def68ce7af6352"
    });
  });
});
