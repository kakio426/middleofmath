import type {
  ClassSummary,
  ClassSummaryItem,
  EvidenceItem,
  TeacherDistractorNote
} from "@middle-of-math/domain";

export interface ClassSummaryUnitGroup {
  unitId: string;
  unitTitle: string;
  unitOrder: number;
  items: ClassSummaryItem[];
}

export function findChoiceNote(
  notes: TeacherDistractorNote[],
  evidence?: EvidenceItem
): { title: string; text: string } | undefined {
  if (!evidence) return undefined;
  const note = notes.find(
    (candidate) =>
      candidate.judgmentId === evidence.judgmentId
      && candidate.choiceId === evidence.selectedChoiceId
  );
  return note
    ? { title: note.misconceptionTitle, text: note.teacherNote }
    : undefined;
}

export function groupSummaryByUnit(
  summary: ClassSummary
): ClassSummaryUnitGroup[] {
  const groups = new Map<string, ClassSummaryUnitGroup>();
  for (const item of summary.items) {
    const unitId = item.unitId ?? "unclassified";
    const current = groups.get(unitId);
    if (current) {
      current.items.push(item);
      continue;
    }
    groups.set(unitId, {
      unitId,
      unitTitle: item.unitTitle ?? "단원 정보 없음",
      unitOrder: item.unitOrder ?? Number.MAX_SAFE_INTEGER,
      items: [item]
    });
  }
  return [...groups.values()].sort(
    (left, right) =>
      left.unitOrder - right.unitOrder
      || left.unitId.localeCompare(right.unitId, "ko")
  );
}
