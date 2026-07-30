import type {
  ContentValidationIssue,
  DiagnosisSet
} from "@middle-of-math/domain";
import placementJson from "./grade4-curriculum-placement.json";

export type Grade4UnitReviewStatus =
  | "pending-teacher-review"
  | "approved"
  | "rejected";

export interface Grade4PlacementUnit {
  order: number;
  id: string;
  title: string;
  reviewStatus: Grade4UnitReviewStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  anchorIds: string[];
}

export interface Grade4CurriculumPlacement {
  revision: string;
  status: Grade4UnitReviewStatus;
  semesters: Array<{
    semester: 1 | 2;
    units: Grade4PlacementUnit[];
  }>;
}

export interface Grade4PlacementInspectionOptions {
  placement?: Grade4CurriculumPlacement;
  setKey?: string;
  nowMs?: number;
}

export interface Grade4PlacementReviewSummary {
  revision: string;
  status: Grade4UnitReviewStatus;
  units: ReadonlyArray<Readonly<{
    semester: 1 | 2;
    order: number;
    id: string;
    title: string;
    reviewStatus: Grade4UnitReviewStatus;
    reviewedBy: string | null;
    reviewedAt: string | null;
    anchorIds: readonly string[];
  }>>;
}

export const grade4CurriculumPlacement =
  placementJson as Grade4CurriculumPlacement;

export function grade4PlacementReviewSummary(): Grade4PlacementReviewSummary {
  return Object.freeze({
    revision: grade4CurriculumPlacement.revision,
    status: grade4CurriculumPlacement.status,
    units: Object.freeze(
      grade4CurriculumPlacement.semesters.flatMap((semester) =>
        semester.units.map((unit) => Object.freeze({
          semester: semester.semester,
          order: unit.order,
          id: unit.id,
          title: unit.title,
          reviewStatus: unit.reviewStatus,
          reviewedBy: unit.reviewedBy,
          reviewedAt: unit.reviewedAt,
          anchorIds: Object.freeze([...unit.anchorIds])
        }))
      )
    )
  });
}

function addIssue(
  issues: ContentValidationIssue[],
  code: string,
  path: string,
  message: string
): void {
  issues.push({ code, path, message, severity: "error" });
}

const reviewerIdPattern = /^teacher:[a-z0-9][a-z0-9._-]{2,63}$/;
const isoDateTimePattern =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;

function hasApprovalEvidence(
  unit: Grade4PlacementUnit,
  nowMs: number
): boolean {
  const reviewedAt = unit.reviewedAt?.trim() ?? "";
  const reviewedAtMs = Date.parse(reviewedAt);
  return reviewerIdPattern.test(unit.reviewedBy?.trim() ?? "")
    && isoDateTimePattern.test(reviewedAt)
    && !Number.isNaN(reviewedAtMs)
    && reviewedAtMs <= nowMs;
}

export function inspectGrade4PlacementLedger(
  placement: Grade4CurriculumPlacement = grade4CurriculumPlacement,
  nowMs = Date.now()
): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];
  const units = placement.semesters.flatMap((semester) => semester.units);
  units.forEach((unit, index) => {
    const hasReviewerMetadata =
      unit.reviewedBy !== null || unit.reviewedAt !== null;
    if (
      unit.reviewStatus === "approved"
      && !hasApprovalEvidence(unit, nowMs)
    ) {
      addIssue(
        issues,
        "PLACEMENT_APPROVAL_EVIDENCE_MISSING",
        `/semesters/units/${index}`,
        `승인자 ID와 현재 시각 이하의 ISO 승인 시각이 필요합니다: ${unit.title}`
      );
    }
    if (
      unit.reviewStatus !== "approved"
      && hasReviewerMetadata
    ) {
      addIssue(
        issues,
        "PLACEMENT_NON_APPROVED_REVIEW_METADATA",
        `/semesters/units/${index}`,
        `승인되지 않은 단원에는 승인자·승인 시각을 기록할 수 없습니다: ${unit.title}`
      );
    }
  });

  const allUnitsApproved = units.length > 0 && units.every((unit) =>
    unit.reviewStatus === "approved" && hasApprovalEvidence(unit, nowMs)
  );
  if (placement.status === "approved" && !allUnitsApproved) {
    addIssue(
      issues,
      "PLACEMENT_GLOBAL_APPROVAL_INCONSISTENT",
      "/status",
      "전역 승인은 12개 단원이 모두 유효하게 승인된 뒤에만 설정할 수 있습니다."
    );
  }
  if (placement.status !== "approved" && allUnitsApproved) {
    addIssue(
      issues,
      "PLACEMENT_GLOBAL_STATUS_STALE",
      "/status",
      "12개 단원이 모두 승인되면 전역 상태도 approved로 갱신해야 합니다."
    );
  }
  return issues;
}

export function approvedGrade4AnchorIds(
  semester: 1 | 2,
  unitIds: readonly string[],
  options: Pick<Grade4PlacementInspectionOptions, "placement" | "nowMs"> = {}
): string[] {
  const placement = options.placement ?? grade4CurriculumPlacement;
  const nowMs = options.nowMs ?? Date.now();
  const wantedUnits = new Set(unitIds);
  return (placement.semesters.find((entry) => entry.semester === semester)
    ?.units ?? [])
    .filter((unit) =>
      wantedUnits.has(unit.id)
      && unit.reviewStatus === "approved"
      && hasApprovalEvidence(unit, nowMs)
    )
    .flatMap((unit) => unit.anchorIds);
}

export function inspectGrade4PlacementApproval(
  content: DiagnosisSet,
  options: Grade4PlacementInspectionOptions = {}
): ContentValidationIssue[] {
  const placement = options.placement ?? grade4CurriculumPlacement;
  const setKey = options.setKey ?? content.manifest.id;
  const nowMs = options.nowMs ?? Date.now();
  const setScope = /^grade([1-6])-semester([12])$/.exec(setKey);
  const isGrade4Set = setScope?.[1] === "4";
  if (content.manifest.grade !== 4 && !isGrade4Set) return [];

  const issues = inspectGrade4PlacementLedger(placement, nowMs);
  if (setKey !== content.manifest.id) {
    addIssue(
      issues,
      "PLACEMENT_SET_KEY_MISMATCH",
      "/manifest/id",
      "검사 대상 setKey와 콘텐츠 manifest ID가 다릅니다."
    );
  }
  if (
    !setScope
    || Number(setScope[1]) !== content.manifest.grade
    || Number(setScope[2]) !== content.manifest.semester
  ) {
    addIssue(
      issues,
      "PLACEMENT_SET_SCOPE_MISMATCH",
      "/manifest",
      "4학년 setKey의 학년·학기와 콘텐츠 manifest 범위가 다릅니다."
    );
    return issues;
  }

  const semester = placement.semesters.find(
    (entry) => entry.semester === content.manifest.semester
  );
  if (!semester) {
    addIssue(
      issues,
      "PLACEMENT_SEMESTER_UNREGISTERED",
      "/manifest/semester",
      `승인 원장에 없는 4학년 학기입니다: ${content.manifest.semester}`
    );
    return issues;
  }

  const unitsById = new Map(semester.units.map((unit) => [unit.id, unit]));
  const selectedApprovedUnits: Grade4PlacementUnit[] = [];

  content.manifest.units.forEach((contentUnit, index) => {
    const approvedUnit = unitsById.get(contentUnit.id);
    const path = `/manifest/units/${index}`;
    if (!approvedUnit) {
      addIssue(
        issues,
        "PLACEMENT_UNIT_UNREGISTERED",
        path,
        `승인 원장에 없는 단원입니다: ${contentUnit.id}`
      );
      return;
    }
    if (
      approvedUnit.title !== contentUnit.title
      || approvedUnit.order !== contentUnit.order
    ) {
      addIssue(
        issues,
        "PLACEMENT_UNIT_METADATA_MISMATCH",
        path,
        `승인된 단원명 또는 순서와 다릅니다: ${contentUnit.id}`
      );
    }
    if (approvedUnit.reviewStatus !== "approved") {
      addIssue(
        issues,
        "PLACEMENT_UNIT_NOT_APPROVED",
        `${path}/id`,
        `교사가 아직 승인하지 않은 단원입니다: ${contentUnit.title}`
      );
      return;
    }
    if (!hasApprovalEvidence(approvedUnit, nowMs)) {
      addIssue(
        issues,
        "PLACEMENT_APPROVAL_EVIDENCE_MISSING",
        path,
        `승인자와 승인 시각이 없는 단원입니다: ${contentUnit.title}`
      );
      return;
    }
    selectedApprovedUnits.push(approvedUnit);
  });

  const approvedAnchorIds = new Set(
    selectedApprovedUnits.flatMap((unit) => unit.anchorIds)
  );
  const contentAnchorIds = new Set(
    content.curriculumAnchors.map((anchor) => anchor.id)
  );

  content.curriculumAnchors.forEach((anchor, index) => {
    if (!approvedAnchorIds.has(anchor.id)) {
      addIssue(
        issues,
        "PLACEMENT_ANCHOR_NOT_APPROVED",
        `/curriculumAnchors/${index}/id`,
        `선택한 승인 단원에 속하지 않는 성취기준입니다: ${anchor.id}`
      );
    }
  });
  for (const anchorId of approvedAnchorIds) {
    if (!contentAnchorIds.has(anchorId)) {
      addIssue(
        issues,
        "PLACEMENT_APPROVED_ANCHOR_MISSING",
        "/curriculumAnchors",
        `승인된 단원의 성취기준이 진단 세트에서 빠졌습니다: ${anchorId}`
      );
    }
  }

  return issues;
}
