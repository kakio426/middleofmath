import type { DiagnosisSet, Judgment } from "@middle-of-math/domain";

export type AssignmentStatus = "new" | "in_progress" | "completed";

export interface AssignmentCard {
  id: string;
  title: string;
  description: string;
  status: AssignmentStatus;
  diagnosisSetId: string;
  diagnosisSetVersion: string;
  checksum: string;
  content: DiagnosisSet;
  areaId: string;
  areaTitle: string;
  symbol: string;
  estimatedMinutes: number;
  judgmentCount: number;
  unitId?: string;
}

export interface AssignmentGroup {
  id: string;
  title: string;
  assignments: AssignmentCard[];
}

const CURRICULUM_AREAS = [
  {
    id: "number-operations",
    title: "수와 연산",
    unitIds: ["multiplication", "division", "fraction"]
  },
  {
    id: "geometry",
    title: "도형",
    unitIds: ["circle"]
  },
  {
    id: "measurement",
    title: "측정",
    unitIds: ["measurement"]
  },
  {
    id: "data-probability",
    title: "자료와 가능성",
    unitIds: ["pictograph"]
  }
] as const;

const UNIT_SYMBOLS: Record<string, string> = {
  multiplication: "×",
  division: "÷",
  circle: "○",
  fraction: "¼",
  measurement: "ℓ",
  pictograph: "▦"
};

function areaForUnit(unitId: string): { id: string; title: string } {
  return CURRICULUM_AREAS.find((area) =>
    area.unitIds.some((candidate) => candidate === unitId)
  ) ?? { id: "other", title: "그 밖의 영역" };
}

export function createUnitAssignmentCards(content: DiagnosisSet): AssignmentCard[] {
  return [...content.manifest.units]
    .sort((left, right) => left.order - right.order)
    .map((unit) => {
      const judgments = content.judgments.filter((judgment) => judgment.unitId === unit.id);
      const area = areaForUnit(unit.id);
      return {
        id: `${content.manifest.id}-${unit.id}`,
        title: `${unit.order}단원 · ${unit.title}`,
        description: `${unit.title} 문제를 차근차근 풀어요.`,
        status: "new",
        diagnosisSetId: content.manifest.id,
        diagnosisSetVersion: content.manifest.version,
        checksum: content.manifest.checksum,
        content,
        areaId: area.id,
        areaTitle: area.title,
        symbol: UNIT_SYMBOLS[unit.id] ?? "•",
        estimatedMinutes: Math.max(3, Math.ceil(judgments.length / 2)),
        judgmentCount: judgments.length,
        unitId: unit.id
      };
    });
}

export function judgmentsForAssignment(assignment: AssignmentCard): Judgment[] {
  if (!assignment.unitId) return assignment.content.judgments;
  return assignment.content.judgments.filter(
    (judgment) => judgment.unitId === assignment.unitId
  );
}

export function groupAssignmentsByArea(assignments: AssignmentCard[]): AssignmentGroup[] {
  const grouped = new Map<string, AssignmentGroup>();
  for (const assignment of assignments) {
    const group = grouped.get(assignment.areaId) ?? {
      id: assignment.areaId,
      title: assignment.areaTitle,
      assignments: []
    };
    group.assignments.push(assignment);
    grouped.set(assignment.areaId, group);
  }

  const preferredOrder = new Map<string, number>(
    CURRICULUM_AREAS.map((area, index) => [area.id, index])
  );
  return [...grouped.values()].sort(
    (left, right) =>
      (preferredOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
      (preferredOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER)
  );
}
