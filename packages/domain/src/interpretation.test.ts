import { describe, expect, it } from "vitest";
import { createParentReport, generateClassSummary, interpretSession } from "./interpretation";
import type { DiagnosisSet, ObservationEvent } from "./types";

const set: DiagnosisSet = {
  manifest: {
    id: "grade3-semester2",
    version: "1.0.0",
    checksum: "test",
    title: "3학년 2학기 수학",
    shortTitle: "3-2 수학",
    grade: 3,
    semester: 2,
    curriculum: "2022-revised",
    status: "published",
    units: [{ id: "fractions", order: 1, title: "분수" }],
    interactionTypes: [{ type: "choice", version: 1 }],
    estimatedMinutes: 1
  },
  curriculumAnchors: [{ id: "[4수01-09]", label: "분수", source: "2022 개정" }],
  learnerStages: [{
    id: "fraction.equal-parts",
    order: 1,
    unitId: "fractions",
    title: "전체를 똑같이 나누기",
    shortTitle: "똑같이 나눈 전체와 부분을 연결함",
    curriculumAnchorIds: ["[4수01-09]"],
    prerequisiteStageIds: []
  }],
  signals: [{
    id: "fraction.unequal-parts",
    title: "똑같이 나눈 조각의 기준",
    severity: "medium",
    teacherInterpretation: "등분할 기준을 다시 확인합니다.",
    teachingMove: "같은 크기 조각인지 비교합니다.",
    parentSummary: "전체를 같은 크기로 나누는 기준을 연습하고 있습니다.",
    homePrompt: "두 조각의 크기가 정말 같은지 물어봐 주세요."
  }],
  judgments: [{
    id: "fraction-1",
    unitId: "fractions",
    learnerStageId: "fraction.equal-parts",
    curriculumAnchorIds: ["[4수01-09]"],
    prompt: "알맞은 분수",
    visual: { kind: "fraction-bar", numerator: 1, denominator: 4 },
    interaction: { type: "choice", version: 1 },
    choices: [
      { id: "one-fourth", label: "1/4", correct: true },
      { id: "four-one", label: "4/1", correct: false, signalIds: ["fraction.unequal-parts"] }
    ]
  }]
};

function event(choiceId: string): ObservationEvent {
  return {
    id: `event-${choiceId}`,
    clientEventId: `client-${choiceId}`,
    clientSeq: 1,
    sessionId: "session-1",
    diagnosisSetId: set.manifest.id,
    diagnosisSetVersion: set.manifest.version,
    eventType: "judgment_confirmed",
    judgmentId: "fraction-1",
    interaction: { type: "choice", version: 1 },
    payload: {
      choiceId,
      durationMs: 10_000,
      firstSelectionMs: 5_000,
      confirmationMs: 5_000,
      selectionChanges: 0,
      uncertainty: false
    },
    occurredAt: "2026-07-22T00:00:00.000Z"
  };
}

describe("interpretation engine", () => {
  it("derives findings without mutating observation events", () => {
    const events = [event("four-one")];
    const snapshot = structuredClone(events);
    const report = interpretSession(set, events, undefined, "2026-07-22T00:00:00.000Z");

    expect(report.findings[0]?.signalId).toBe("fraction.unequal-parts");
    expect(report.engineVersion).toBe("rules-2.0.0");
    expect(events).toEqual(snapshot);
  });

  it("keeps parent language separate from teacher evidence", () => {
    const teacher = interpretSession(set, [event("four-one")]);
    const parent = createParentReport(set, teacher, "12번 · 별빛");

    expect(parent.supportAreas[0]?.observation).toContain("연습");
    expect(JSON.stringify(parent)).not.toContain("event-four-one");
    expect(JSON.stringify(parent)).not.toContain("rules-2.0.0");
  });

  it("aggregates completed reports by students and evidence", () => {
    const report = interpretSession(set, [event("four-one")]);
    const summary = generateClassSummary([
      { studentId: "student-a", report },
      { studentId: "student-b", report }
    ], 1);

    expect(summary.items[0]).toMatchObject({ studentCount: 2, evidenceCount: 2 });
    expect(summary.inProgressStudents).toBe(1);
  });
});
