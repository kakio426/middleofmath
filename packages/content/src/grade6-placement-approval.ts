import type { ContentValidationIssue, DiagnosisSet } from "@middle-of-math/domain";
import placementJson from "./grade6-curriculum-placement.json";
import {
  inspectPlacementApproval,
  inspectPlacementLedger,
  placementReviewSummary,
  type CurriculumPlacement,
  type PlacementInspectionOptions,
  type PlacementReviewSummary
} from "./placement-approval";

export type Grade6CurriculumPlacement = CurriculumPlacement;
export const grade6CurriculumPlacement = placementJson as Grade6CurriculumPlacement;

export function grade6PlacementReviewSummary(): PlacementReviewSummary {
  return placementReviewSummary(grade6CurriculumPlacement);
}

export function inspectGrade6PlacementLedger(
  placement: Grade6CurriculumPlacement = grade6CurriculumPlacement,
  nowMs = Date.now()
): ContentValidationIssue[] {
  return inspectPlacementLedger(placement, nowMs);
}

export function inspectGrade6PlacementApproval(
  content: DiagnosisSet,
  options: PlacementInspectionOptions<Grade6CurriculumPlacement> = {}
): ContentValidationIssue[] {
  return inspectPlacementApproval(content, 6, grade6CurriculumPlacement, options);
}
