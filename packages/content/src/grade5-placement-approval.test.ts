import { describe, expect, it } from "vitest";
import type { DiagnosisSet } from "@middle-of-math/domain";
import { passingDiagnosticIntegritySet } from "./diagnostic-integrity.fixture";
import {
  grade5CurriculumPlacement,
  grade5PlacementReviewSummary,
  inspectGrade5PlacementApproval,
  inspectGrade5PlacementLedger,
  type Grade5CurriculumPlacement
} from "./grade5-placement-approval";

function mixedOperationsFixture(): DiagnosisSet {
  const content = structuredClone(passingDiagnosticIntegritySet);
  content.manifest.id = "grade5-semester1";
  content.manifest.grade = 5;
  content.manifest.semester = 1;
  content.manifest.units = [{
    id: "mixed-operations",
    order: 1,
    title: "자연수의 혼합 계산"
  }];
  content.curriculumAnchors = [{
    id: "[6수01-01]",
    label: "자연수의 혼합 계산",
    source: "교육부 고시 제2022-33호 [별책 8] 수학과 교육과정"
  }];
  return content;
}

function approvedTwoUnitFixture(): DiagnosisSet {
  const content = mixedOperationsFixture();
  content.manifest.units.push({
    id: "factors-multiples",
    order: 2,
    title: "약수와 배수"
  });
  content.curriculumAnchors.push(
    { id: "[6수01-04]", label: "약수", source: "교육부 고시 제2022-33호" },
    { id: "[6수01-05]", label: "배수", source: "교육부 고시 제2022-33호" }
  );
  return content;
}

function approvedThreeUnitFixture(): DiagnosisSet {
  const content = approvedTwoUnitFixture();
  content.manifest.units.push({
    id: "correspondence",
    order: 3,
    title: "대응 관계"
  });
  content.curriculumAnchors.push({
    id: "[6수02-01]",
    label: "대응 관계",
    source: "교육부 고시 제2022-33호"
  });
  return content;
}

function approvedFourUnitFixture(): DiagnosisSet {
  const content = approvedThreeUnitFixture();
  content.manifest.units.push({
    id: "fraction-reduction-common-denominator",
    order: 4,
    title: "약분과 통분"
  });
  content.curriculumAnchors.push(
    { id: "[6수01-06]", label: "크기가 같은 분수와 약분·통분", source: "교육부 고시 제2022-33호" },
    { id: "[6수01-07]", label: "분모가 다른 분수 비교", source: "교육부 고시 제2022-33호" },
    { id: "[6수01-12]", label: "분수와 소수의 관계", source: "교육부 고시 제2022-33호" }
  );
  return content;
}

function approvedFiveUnitFixture(): DiagnosisSet {
  const content = approvedFourUnitFixture();
  content.manifest.units.push({
    id: "fraction-add-subtract",
    order: 5,
    title: "분수의 덧셈과 뺄셈"
  });
  content.curriculumAnchors.push({
    id: "[6수01-08]",
    label: "분모가 다른 분수의 덧셈과 뺄셈",
    source: "교육부 고시 제2022-33호"
  });
  return content;
}

function approvedSixUnitFixture(): DiagnosisSet {
  const content = approvedFiveUnitFixture();
  content.manifest.units.push({
    id: "polygon-perimeter-area",
    order: 6,
    title: "다각형의 둘레와 넓이"
  });
  content.curriculumAnchors.push(
    { id: "[6수03-11]", label: "다각형의 둘레", source: "교육부 고시 제2022-33호" },
    { id: "[6수03-12]", label: "넓이 단위", source: "교육부 고시 제2022-33호" },
    { id: "[6수03-13]", label: "직사각형과 정사각형의 넓이", source: "교육부 고시 제2022-33호" },
    { id: "[6수03-14]", label: "여러 다각형의 넓이", source: "교육부 고시 제2022-33호" }
  );
  return content;
}

function withEveryUnitApproved(): Grade5CurriculumPlacement {
  const placement = structuredClone(grade5CurriculumPlacement);
  placement.status = "approved";
  for (const semester of placement.semesters) {
    for (const unit of semester.units) {
      unit.reviewStatus = "approved";
      unit.reviewedBy = "teacher:grade5-review";
      unit.reviewedAt = "2026-08-01T06:00:00+09:00";
    }
  }
  return placement;
}

describe("5학년 단원별 배치 승인 게이트", () => {
  it("현재 원장의 앞의 여섯 단원 승인 근거와 전역 대기 상태가 일관된다", () => {
    expect(inspectGrade5PlacementLedger()).toEqual([]);
  });

  it("읽기 전용 요약에 1·2학기 12개 단원을 제공한다", () => {
    const summary = grade5PlacementReviewSummary();
    expect(summary.revision).toBe("grade5-placement-2026-08-01.7");
    expect(summary.status).toBe("approved");
    expect(summary.units).toHaveLength(12);
    expect(Object.isFrozen(summary)).toBe(true);
    expect(Object.isFrozen(summary.units)).toBe(true);
    expect(summary.units.every((unit) =>
      Object.isFrozen(unit) && Object.isFrozen(unit.anchorIds)
    )).toBe(true);
  });

  it("승인된 자연수의 혼합 계산과 정확한 성취기준만 통과시킨다", () => {
    expect(inspectGrade5PlacementApproval(mixedOperationsFixture())).toEqual([]);
  });

  it("승인된 두 단원과 세 성취기준을 함께 통과시킨다", () => {
    expect(inspectGrade5PlacementApproval(approvedTwoUnitFixture())).toEqual([]);
  });

  it("승인된 세 단원과 네 성취기준을 함께 통과시킨다", () => {
    expect(inspectGrade5PlacementApproval(approvedThreeUnitFixture())).toEqual([]);
  });

  it("승인된 네 단원과 일곱 성취기준을 함께 통과시킨다", () => {
    expect(inspectGrade5PlacementApproval(approvedFourUnitFixture())).toEqual([]);
  });

  it("승인된 다섯 단원과 여덟 성취기준을 함께 통과시킨다", () => {
    expect(inspectGrade5PlacementApproval(approvedFiveUnitFixture())).toEqual([]);
  });

  it("승인된 여섯 단원과 열두 성취기준을 함께 통과시킨다", () => {
    expect(inspectGrade5PlacementApproval(approvedSixUnitFixture())).toEqual([]);
  });

  it("미승인 단원은 콘텐츠로 넣지 못한다", () => {
    const content = mixedOperationsFixture();
    content.manifest.units = [{
      id: "number-range-rounding",
      order: 1,
      title: "수의 범위와 올림, 버림, 반올림"
    }];
    content.curriculumAnchors = [
      { id: "[6수01-02]", label: "수의 범위", source: "교육부 고시 제2022-33호" }
    ];
    expect(inspectGrade5PlacementApproval(content).map((issue) => issue.code)).toEqual([
      "PLACEMENT_UNIT_UNREGISTERED",
      "PLACEMENT_ANCHOR_NOT_APPROVED"
    ]);
  });

  it("승인 단원에 다른 단원의 코드를 섞거나 승인 코드를 누락하지 못한다", () => {
    const mixed = mixedOperationsFixture();
    mixed.curriculumAnchors.push({
      id: "[6수01-04]",
      label: "약수",
      source: "교육부 고시 제2022-33호"
    });
    expect(inspectGrade5PlacementApproval(mixed).map(
      (issue) => issue.code
    )).toContain("PLACEMENT_ANCHOR_NOT_APPROVED");

    const missing = mixedOperationsFixture();
    missing.curriculumAnchors = [];
    expect(inspectGrade5PlacementApproval(missing).map(
      (issue) => issue.code
    )).toContain("PLACEMENT_APPROVED_ANCHOR_MISSING");
  });

  it("빈 단원 선택과 같은 단원의 중복 선택을 허용하지 않는다", () => {
    const empty = mixedOperationsFixture();
    empty.manifest.units = [];
    empty.curriculumAnchors = [];
    expect(inspectGrade5PlacementApproval(empty).map(
      (issue) => issue.code
    )).toContain("PLACEMENT_UNIT_SELECTION_EMPTY");

    const duplicate = mixedOperationsFixture();
    duplicate.manifest.units.push({ ...duplicate.manifest.units[0] });
    expect(inspectGrade5PlacementApproval(duplicate).map(
      (issue) => issue.code
    )).toContain("PLACEMENT_UNIT_DUPLICATE");
  });

  it("setKey와 manifest 학년·학기가 다르면 우회하지 못한다", () => {
    const wrongGrade = mixedOperationsFixture();
    wrongGrade.manifest.grade = 4;
    expect(inspectGrade5PlacementApproval(wrongGrade, {
      setKey: "grade5-semester1"
    }).map((issue) => issue.code)).toContain("PLACEMENT_SET_SCOPE_MISMATCH");

    const wrongSemester = mixedOperationsFixture();
    wrongSemester.manifest.semester = 2;
    expect(inspectGrade5PlacementApproval(wrongSemester, {
      setKey: "grade5-semester1"
    }).map((issue) => issue.code)).toContain("PLACEMENT_SET_SCOPE_MISMATCH");
  });

  it("승인 근거가 없거나 미래 시각이면 승인 상태만으로 통과하지 못한다", () => {
    const missing = structuredClone(grade5CurriculumPlacement);
    missing.semesters[0].units[0].reviewedAt = null;
    expect(inspectGrade5PlacementApproval(mixedOperationsFixture(), {
      placement: missing
    }).map((issue) => issue.code)).toContain(
      "PLACEMENT_APPROVAL_EVIDENCE_MISSING"
    );

    const future = structuredClone(grade5CurriculumPlacement);
    expect(inspectGrade5PlacementApproval(mixedOperationsFixture(), {
      placement: future,
      nowMs: Date.parse("2026-08-01T06:00:00+09:00")
    }).map((issue) => issue.code)).toContain(
      "PLACEMENT_APPROVAL_EVIDENCE_MISSING"
    );
  });

  it("전역 approved는 12단원 전체 승인과 함께만 바뀐다", () => {
    const partial = structuredClone(grade5CurriculumPlacement);
    partial.status = "approved";
    partial.semesters[1].units[0].reviewStatus = "pending-teacher-review";
    partial.semesters[1].units[0].reviewedBy = null;
    partial.semesters[1].units[0].reviewedAt = null;
    expect(inspectGrade5PlacementLedger(partial).map(
      (issue) => issue.code
    )).toContain("PLACEMENT_GLOBAL_APPROVAL_INCONSISTENT");

    const allApprovedButPending = withEveryUnitApproved();
    allApprovedButPending.status = "pending-teacher-review";
    expect(inspectGrade5PlacementLedger(allApprovedButPending).map(
      (issue) => issue.code
    )).toContain("PLACEMENT_GLOBAL_STATUS_STALE");
    expect(inspectGrade5PlacementLedger(withEveryUnitApproved())).toEqual([]);
  });

  it("4학년 이하 콘텐츠에는 5학년 배치 규칙을 적용하지 않는다", () => {
    expect(inspectGrade5PlacementApproval(
      passingDiagnosticIntegritySet
    )).toEqual([]);
  });
});
