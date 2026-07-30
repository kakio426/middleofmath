import { describe, expect, it } from "vitest";
import type { DiagnosisSet } from "@middle-of-math/domain";
import { inspectDiagnosticIntegrity } from "./diagnostic-integrity";
import { passingDiagnosticIntegritySet } from "./diagnostic-integrity.fixture";
import {
  grade4CurriculumPlacement,
  grade4PlacementReviewSummary,
  inspectGrade4PlacementApproval,
  inspectGrade4PlacementLedger,
  type Grade4CurriculumPlacement
} from "./grade4-placement-approval";

function grade4LargeNumbersFixture(): DiagnosisSet {
  const content = structuredClone(passingDiagnosticIntegritySet);
  content.manifest.id = "grade4-semester1";
  content.manifest.grade = 4;
  content.manifest.semester = 1;
  content.manifest.units = [{
    id: "large-numbers",
    order: 1,
    title: "큰 수"
  }];
  content.curriculumAnchors = [
    {
      id: "[4수01-01]",
      label: "다섯 자리 이상의 수",
      source: "교육부 고시 제2022-33호 [별책 8] 수학과 교육과정"
    },
    {
      id: "[4수01-02]",
      label: "다섯 자리 이상의 수",
      source: "교육부 고시 제2022-33호 [별책 8] 수학과 교육과정"
    }
  ];
  return content;
}

function grade4PendingUnitFixture(): DiagnosisSet {
  const content = grade4LargeNumbersFixture();
  content.manifest.units = [{
    id: "multiplication-division",
    order: 3,
    title: "곱셈과 나눗셈"
  }];
  content.curriculumAnchors = [
    "[4수01-04]",
    "[4수01-05]",
    "[4수01-07]",
    "[4수01-08]"
  ].map((id) => ({
    id,
    label: "곱셈과 나눗셈",
    source: "교육부 고시 제2022-33호 [별책 8] 수학과 교육과정"
  }));
  return content;
}

function withLargeNumbersApproved(): Grade4CurriculumPlacement {
  const placement = structuredClone(grade4CurriculumPlacement);
  const unit = placement.semesters[0].units.find(
    (candidate) => candidate.id === "large-numbers"
  );
  if (!unit) throw new Error("큰 수 배치 단원을 찾지 못했습니다.");
  unit.reviewStatus = "approved";
  unit.reviewedBy = "teacher:checkpoint-a1";
  unit.reviewedAt = "2026-07-30T04:00:00+09:00";
  return placement;
}

function withLargeNumbersPending(): Grade4CurriculumPlacement {
  const placement = structuredClone(grade4CurriculumPlacement);
  const unit = placement.semesters[0].units.find(
    (candidate) => candidate.id === "large-numbers"
  );
  if (!unit) throw new Error("큰 수 배치 단원을 찾지 못했습니다.");
  unit.reviewStatus = "pending-teacher-review";
  unit.reviewedBy = null;
  unit.reviewedAt = null;
  return placement;
}

function withEveryUnitApproved(): Grade4CurriculumPlacement {
  const placement = structuredClone(grade4CurriculumPlacement);
  placement.status = "approved";
  for (const semester of placement.semesters) {
    for (const unit of semester.units) {
      unit.reviewStatus = "approved";
      unit.reviewedBy = "teacher:checkpoint-a2";
      unit.reviewedAt = "2026-07-30T04:00:00+09:00";
    }
  }
  return placement;
}

describe("4학년 단원별 배치 승인 게이트", () => {
  it("A1 두 단원만 승인되고 나머지 10개 단원은 승인 대기 상태다", () => {
    const units = grade4CurriculumPlacement.semesters.flatMap(
      (semester) => semester.units
    );
    expect(units).toHaveLength(12);
    expect(units.filter((unit) =>
      unit.reviewStatus === "approved"
      && unit.reviewedBy === "teacher:workspace-owner"
      && unit.reviewedAt === "2026-07-30T21:33:47+09:00"
    ).map((unit) => unit.id)).toEqual(["large-numbers", "angles"]);
    expect(units.filter((unit) =>
      unit.reviewStatus === "pending-teacher-review"
      && unit.reviewedBy === null
      && unit.reviewedAt === null
    )).toHaveLength(10);
    expect(inspectGrade4PlacementLedger()).toEqual([]);
  });

  it("Studio에는 원본을 바꿀 수 없는 읽기 전용 승인 요약만 제공한다", () => {
    const summary = grade4PlacementReviewSummary();
    expect(summary.revision).toBe("grade4-placement-2026-07-30.6");
    expect(summary.units).toHaveLength(12);
    expect(Object.isFrozen(summary)).toBe(true);
    expect(Object.isFrozen(summary.units)).toBe(true);
    expect(summary.units.every((unit) =>
      Object.isFrozen(unit) && Object.isFrozen(unit.anchorIds)
    )).toBe(true);
  });

  it("미승인 단원과 그 성취기준을 진단 세트에 넣지 못한다", () => {
    const issues = inspectGrade4PlacementApproval(
      grade4LargeNumbersFixture(),
      { placement: withLargeNumbersPending() }
    );
    expect(issues.map((issue) => issue.code)).toEqual([
      "PLACEMENT_UNIT_NOT_APPROVED",
      "PLACEMENT_ANCHOR_NOT_APPROVED",
      "PLACEMENT_ANCHOR_NOT_APPROVED"
    ]);
  });

  it("승인자와 시각이 기록된 단원의 정확한 성취기준만 허용한다", () => {
    expect(inspectGrade4PlacementApproval(
      grade4LargeNumbersFixture(),
      { placement: withLargeNumbersApproved() }
    )).toEqual([]);
  });

  it("승인 상태만 바꾸고 유효한 승인 시각을 남기지 않으면 허용하지 않는다", () => {
    const placement = withLargeNumbersApproved();
    placement.semesters[0].units[0].reviewedAt = "어제";
    expect(inspectGrade4PlacementApproval(
      grade4LargeNumbersFixture(),
      { placement }
    ).map((issue) => issue.code)).toContain(
      "PLACEMENT_APPROVAL_EVIDENCE_MISSING"
    );
  });

  it("승인자 ID 형식과 미래가 아닌 ISO 승인 시각을 요구한다", () => {
    const badReviewer = withLargeNumbersApproved();
    badReviewer.semesters[0].units[0].reviewedBy = "교사";
    expect(inspectGrade4PlacementApproval(
      grade4LargeNumbersFixture(),
      { placement: badReviewer }
    ).map((issue) => issue.code)).toContain(
      "PLACEMENT_APPROVAL_EVIDENCE_MISSING"
    );

    const futureReview = withLargeNumbersApproved();
    futureReview.semesters[0].units[0].reviewedAt =
      "2026-07-31T04:00:00+09:00";
    expect(inspectGrade4PlacementApproval(
      grade4LargeNumbersFixture(),
      {
        placement: futureReview,
        nowMs: Date.parse("2026-07-30T05:00:00+09:00")
      }
    ).map((issue) => issue.code)).toContain(
      "PLACEMENT_APPROVAL_EVIDENCE_MISSING"
    );
  });

  it("승인된 단원에 다른 단원의 성취기준을 섞지 못한다", () => {
    const content = grade4LargeNumbersFixture();
    content.curriculumAnchors.push({
      id: "[4수03-02]",
      label: "도형의 기초",
      source: "교육부 고시 제2022-33호 [별책 8] 수학과 교육과정"
    });
    expect(inspectGrade4PlacementApproval(
      content,
      { placement: withLargeNumbersApproved() }
    ).map((issue) => issue.code)).toContain("PLACEMENT_ANCHOR_NOT_APPROVED");
  });

  it("승인 단원의 성취기준을 일부 빠뜨리지 못한다", () => {
    const content = grade4LargeNumbersFixture();
    content.curriculumAnchors.pop();
    expect(inspectGrade4PlacementApproval(
      content,
      { placement: withLargeNumbersApproved() }
    ).map((issue) => issue.code)).toContain(
      "PLACEMENT_APPROVED_ANCHOR_MISSING"
    );
  });

  it("등록된 진단 무결성 게이트도 미승인 단원을 먼저 차단한다", () => {
    const result = inspectDiagnosticIntegrity({
      content: grade4PendingUnitFixture(),
      setKey: "grade4-semester1",
      targetVersion: "1.0.0"
    });
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain(
      "PLACEMENT_UNIT_NOT_APPROVED"
    );
    expect(result.issues.map((issue) => issue.code)).not.toContain(
      "DI_GATE_NOT_ENFORCED"
    );
  });

  it("grade4 setKey와 manifest 학년·학기가 다르면 배치 검사를 우회하지 못한다", () => {
    const wrongGrade = grade4LargeNumbersFixture();
    wrongGrade.manifest.grade = 3;
    expect(inspectGrade4PlacementApproval(wrongGrade, {
      setKey: "grade4-semester1"
    }).map((issue) => issue.code)).toContain("PLACEMENT_SET_SCOPE_MISMATCH");

    const wrongSemester = grade4LargeNumbersFixture();
    wrongSemester.manifest.semester = 2;
    expect(inspectGrade4PlacementApproval(wrongSemester, {
      setKey: "grade4-semester1"
    }).map((issue) => issue.code)).toContain("PLACEMENT_SET_SCOPE_MISMATCH");
  });

  it("setKey와 manifest ID가 다르면 별도 오류를 낸다", () => {
    const content = grade4LargeNumbersFixture();
    content.manifest.id = "grade4-semester1-other";
    expect(inspectGrade4PlacementApproval(content, {
      setKey: "grade4-semester1"
    }).map((issue) => issue.code)).toContain("PLACEMENT_SET_KEY_MISMATCH");
  });

  it("전역 approved는 12단원 전체 승인과 항상 함께 바뀐다", () => {
    const partial = withLargeNumbersApproved();
    partial.status = "approved";
    expect(inspectGrade4PlacementLedger(partial).map(
      (issue) => issue.code
    )).toContain("PLACEMENT_GLOBAL_APPROVAL_INCONSISTENT");

    const allApprovedButPending = withEveryUnitApproved();
    allApprovedButPending.status = "pending-teacher-review";
    expect(inspectGrade4PlacementLedger(allApprovedButPending).map(
      (issue) => issue.code
    )).toContain("PLACEMENT_GLOBAL_STATUS_STALE");

    expect(inspectGrade4PlacementLedger(
      withEveryUnitApproved()
    )).toEqual([]);
  });

  it("3학년 콘텐츠에는 4학년 배치 규칙을 적용하지 않는다", () => {
    expect(inspectGrade4PlacementApproval(
      passingDiagnosticIntegritySet
    )).toEqual([]);
  });
});
