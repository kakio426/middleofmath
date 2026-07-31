import { describe, expect, it } from "vitest";
import type {
  ClassSummary,
  EvidenceItem,
  TeacherDistractorNote
} from "@middle-of-math/domain";
import { findChoiceNote, groupSummaryByUnit } from "./teacher-report-model";

const evidence: EvidenceItem = {
  eventId: "event-1",
  judgmentId: "g4s1-bar-05",
  learnerStageId: "bar-graph.compare",
  curriculumAnchorIds: ["[4수04-01]"],
  selectedChoiceId: "two-more",
  selectedChoiceLabel: "2명",
  durationBand: "steady",
  firstSelectionMs: 3_000,
  confirmationMs: 1_000,
  selectionChanges: 0,
  uncertainty: false
};

const note: TeacherDistractorNote = {
  setKey: "grade4-semester1",
  version: "1.3.0",
  judgmentId: "g4s1-bar-05",
  choiceId: "two-more",
  signalIds: ["bar-graph.compare"],
  misconceptionKey: "bar-graph.compare.tick-difference-only",
  misconceptionTitle: "두 막대의 칸 수 차를 실제 값으로 바꾸지 않고 답함",
  teacherNote: "축구 4칸과 야구 2칸의 차 2칸을 실제 학생 수로 바꾸지 않았습니다."
};

describe("teacher report model", () => {
  it("finds a teacher-only note by the exact judgment and choice", () => {
    expect(findChoiceNote([note], evidence)).toEqual({
      title: note.misconceptionTitle,
      text: note.teacherNote
    });
    expect(findChoiceNote([note], { ...evidence, selectedChoiceId: "other" }))
      .toBeUndefined();
  });

  it("groups every summary item by curriculum unit without truncation", () => {
    const base = {
      severity: "medium" as const,
      studentCount: 1,
      evidenceCount: 1,
      studentIds: ["student-1"],
      confirmedStudentCount: 0,
      tentativeStudentCount: 1,
      confirmedStudentIds: [],
      interpretation: "해석",
      teachingMove: "수업"
    };
    const summary: ClassSummary = {
      completedStudents: 1,
      inProgressStudents: 0,
      items: [
        { ...base, signalId: "bar-2", title: "둘", unitId: "bar", unitTitle: "막대그래프", unitOrder: 5 },
        { ...base, signalId: "number-1", title: "하나", unitId: "number", unitTitle: "큰 수", unitOrder: 1 },
        { ...base, signalId: "bar-1", title: "셋", unitId: "bar", unitTitle: "막대그래프", unitOrder: 5 }
      ]
    };

    expect(groupSummaryByUnit(summary).map((group) => ({
      title: group.unitTitle,
      signals: group.items.map((item) => item.signalId)
    }))).toEqual([
      { title: "큰 수", signals: ["number-1"] },
      { title: "막대그래프", signals: ["bar-2", "bar-1"] }
    ]);
  });
});
