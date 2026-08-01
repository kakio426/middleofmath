import type {
  ContentValidationIssue,
  DiagnosisSet
} from "@middle-of-math/domain";
import placementJson from "./grade5-curriculum-placement.json";
import {
  approvedAnchorIds,
  inspectPlacementApproval,
  inspectPlacementLedger,
  placementReviewSummary,
  type CurriculumPlacement,
  type PlacementInspectionOptions,
  type PlacementReviewSummary,
  type PlacementUnit,
  type UnitReviewStatus
} from "./placement-approval";

export type Grade5UnitReviewStatus = UnitReviewStatus;
export type Grade5PlacementUnit = PlacementUnit;
export type Grade5CurriculumPlacement = CurriculumPlacement;
export type Grade5PlacementInspectionOptions =
  PlacementInspectionOptions<Grade5CurriculumPlacement>;
export type Grade5PlacementReviewSummary = PlacementReviewSummary;

export const grade5CurriculumPlacement =
  placementJson as Grade5CurriculumPlacement;

export function grade5PlacementReviewSummary(): Grade5PlacementReviewSummary {
  return placementReviewSummary(grade5CurriculumPlacement);
}

export function inspectGrade5PlacementLedger(
  placement: Grade5CurriculumPlacement = grade5CurriculumPlacement,
  nowMs = Date.now()
): ContentValidationIssue[] {
  return inspectPlacementLedger(placement, nowMs);
}

export function approvedGrade5AnchorIds(
  semester: 1 | 2,
  unitIds: readonly string[],
  options: Pick<Grade5PlacementInspectionOptions, "placement" | "nowMs"> = {}
): string[] {
  return approvedAnchorIds(
    options.placement ?? grade5CurriculumPlacement,
    semester,
    unitIds,
    options.nowMs
  );
}

export function inspectGrade5PlacementApproval(
  content: DiagnosisSet,
  options: Grade5PlacementInspectionOptions = {}
): ContentValidationIssue[] {
  return inspectPlacementApproval(
    content,
    5,
    grade5CurriculumPlacement,
    options
  );
}
