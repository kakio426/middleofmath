import type {
  ContentValidationIssue,
  DiagnosisSet
} from "@middle-of-math/domain";

export type UnitReviewStatus =
  | "pending-teacher-review"
  | "approved"
  | "rejected";

export interface PlacementUnit {
  order: number;
  id: string;
  title: string;
  reviewStatus: UnitReviewStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  anchorIds: string[];
}

export interface CurriculumPlacement {
  revision: string;
  status: UnitReviewStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  semesters: Array<{
    semester: 1 | 2;
    units: PlacementUnit[];
  }>;
}

export interface PlacementInspectionOptions<T extends CurriculumPlacement> {
  placement?: T;
  setKey?: string;
  nowMs?: number;
}

export interface PlacementReviewSummary {
  revision: string;
  status: UnitReviewStatus;
  units: ReadonlyArray<Readonly<{
    semester: 1 | 2;
    order: number;
    id: string;
    title: string;
    reviewStatus: UnitReviewStatus;
    reviewedBy: string | null;
    reviewedAt: string | null;
    anchorIds: readonly string[];
  }>>;
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

function hasApprovalEvidence(unit: PlacementUnit, nowMs: number): boolean {
  const reviewedAt = unit.reviewedAt?.trim() ?? "";
  const reviewedAtMs = Date.parse(reviewedAt);
  return reviewerIdPattern.test(unit.reviewedBy?.trim() ?? "")
    && isoDateTimePattern.test(reviewedAt)
    && !Number.isNaN(reviewedAtMs)
    && reviewedAtMs <= nowMs;
}

export function placementReviewSummary(
  placement: CurriculumPlacement
): PlacementReviewSummary {
  return Object.freeze({
    revision: placement.revision,
    status: placement.status,
    units: Object.freeze(
      placement.semesters.flatMap((semester) =>
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

export function inspectPlacementLedger(
  placement: CurriculumPlacement,
  nowMs = Date.now()
): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];
  const units = placement.semesters.flatMap((semester) => semester.units);
  units.forEach((unit, index) => {
    const hasReviewerMetadata =
      unit.reviewedBy !== null || unit.reviewedAt !== null;
    if (unit.reviewStatus === "approved" && !hasApprovalEvidence(unit, nowMs)) {
      addIssue(
        issues,
        "PLACEMENT_APPROVAL_EVIDENCE_MISSING",
        `/semesters/units/${index}`,
        `승인자 ID와 현재 시각 이하의 ISO 승인 시각이 필요합니다: ${unit.title}`
      );
    }
    if (unit.reviewStatus !== "approved" && hasReviewerMetadata) {
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
      "전역 승인은 모든 단원이 유효하게 승인된 뒤에만 설정할 수 있습니다."
    );
  }
  if (placement.status !== "approved" && allUnitsApproved) {
    addIssue(
      issues,
      "PLACEMENT_GLOBAL_STATUS_STALE",
      "/status",
      "모든 단원이 승인되면 전역 상태도 approved로 갱신해야 합니다."
    );
  }
  return issues;
}

export function approvedAnchorIds(
  placement: CurriculumPlacement,
  semester: 1 | 2,
  unitIds: readonly string[],
  nowMs = Date.now()
): string[] {
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

export function inspectPlacementApproval(
  content: DiagnosisSet,
  grade: number,
  defaultPlacement: CurriculumPlacement,
  options: PlacementInspectionOptions<CurriculumPlacement> = {}
): ContentValidationIssue[] {
  const placement = options.placement ?? defaultPlacement;
  const setKey = options.setKey ?? content.manifest.id;
  const nowMs = options.nowMs ?? Date.now();
  const setScope = /^grade([1-6])-semester([12])$/.exec(setKey);
  const isTargetSet = Number(setScope?.[1]) === grade;
  if (content.manifest.grade !== grade && !isTargetSet) return [];

  const issues = inspectPlacementLedger(placement, nowMs);
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
      `${grade}학년 setKey의 학년·학기와 콘텐츠 manifest 범위가 다릅니다.`
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
      `승인 원장에 없는 ${grade}학년 학기입니다: ${content.manifest.semester}`
    );
    return issues;
  }

  const unitsById = new Map(semester.units.map((unit) => [unit.id, unit]));
  const selectedApprovedUnits: PlacementUnit[] = [];

  if (content.manifest.units.length === 0) {
    addIssue(
      issues,
      "PLACEMENT_UNIT_SELECTION_EMPTY",
      "/manifest/units",
      `${grade}학년 진단 세트에는 승인된 단원이 하나 이상 필요합니다.`
    );
  }
  const seenContentUnitIds = new Set<string>();

  content.manifest.units.forEach((contentUnit, index) => {
    const approvedUnit = unitsById.get(contentUnit.id);
    const path = `/manifest/units/${index}`;
    if (seenContentUnitIds.has(contentUnit.id)) {
      addIssue(
        issues,
        "PLACEMENT_UNIT_DUPLICATE",
        `${path}/id`,
        `같은 단원을 진단 세트에 두 번 넣을 수 없습니다: ${contentUnit.id}`
      );
    }
    seenContentUnitIds.add(contentUnit.id);
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
