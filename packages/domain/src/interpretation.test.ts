import { describe, expect, it } from "vitest";
import {
  createParentReport,
  generateClassSummary,
  interpretSession
} from "./interpretation";
import type { DiagnosisSet, ObservationEvent } from "./types";

const set: DiagnosisSet = {
  manifest: {
    id: "grade3-semester2",
    version: "2.1.0",
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
  curriculumAnchors: [{
    id: "[4수01-09]",
    label: "분수",
    source: "2022 개정"
  }],
  learnerStages: [{
    id: "fraction.equal-parts",
    order: 1,
    unitId: "fractions",
    title: "전체를 똑같이 나누기",
    shortTitle: "똑같이 나눈 전체와 부분을 연결함",
    curriculumAnchorIds: ["[4수01-09]"],
    prerequisiteStageIds: []
  }],
  signals: [
    {
      id: "fraction.unequal-parts",
      title: "똑같이 나눈 조각의 기준",
      severity: "medium",
      teacherInterpretation: "등분할 기준을 다시 확인합니다.",
      teachingMove: "같은 크기 조각인지 비교합니다.",
      parentSummary: "전체를 같은 크기로 나누는 기준을 연습하고 있습니다.",
      homePrompt: "두 조각의 크기가 정말 같은지 물어봐 주세요."
    },
    {
      id: "needs-scaffold",
      title: "판단 시작점에 발판 필요",
      severity: "low",
      teacherInterpretation: "시작 기준을 다시 확인합니다.",
      teachingMove: "구체물에서 같은 관계를 찾게 합니다.",
      parentSummary: "생각을 시작하는 기준을 연습하고 있습니다.",
      homePrompt: "먼저 아는 것을 말해보게 해주세요."
    }
  ],
  judgments: [
    {
      id: "fraction-1",
      unitId: "fractions",
      learnerStageId: "fraction.equal-parts",
      curriculumAnchorIds: ["[4수01-09]"],
      prompt: "알맞은 분수",
      visual: { kind: "fraction-bar", numerator: 1, denominator: 4 },
      interaction: { type: "choice", version: 1 },
      choices: [
        { id: "one-fourth", label: "1/4", correct: true },
        {
          id: "four-one",
          label: "4/1",
          correct: false,
          signalIds: ["fraction.unequal-parts"]
        }
      ]
    },
    {
      id: "fraction-2",
      unitId: "fractions",
      learnerStageId: "fraction.equal-parts",
      curriculumAnchorIds: ["[4수01-09]"],
      prompt: "다른 그림에 알맞은 분수",
      visual: { kind: "fraction-bar", numerator: 1, denominator: 2 },
      interaction: { type: "choice", version: 1 },
      choices: [
        { id: "one-half", label: "1/2", correct: true },
        {
          id: "two-one",
          label: "2/1",
          correct: false,
          signalIds: ["fraction.unequal-parts"]
        }
      ]
    }
  ]
};

const generatedAt = "2026-07-22T00:00:00.000Z";

function event(input: {
  choiceId: string;
  judgmentId?: string;
  clientSeq?: number;
  id?: string;
  firstSelectionMs?: number | null;
  durationMs?: number;
}): ObservationEvent {
  const judgmentId = input.judgmentId ?? "fraction-1";
  const clientSeq = input.clientSeq ?? 1;
  return {
    id: input.id ?? `event-${judgmentId}-${clientSeq}-${input.choiceId}`,
    clientEventId: `client-${judgmentId}-${clientSeq}-${input.choiceId}`,
    clientSeq,
    sessionId: "session-1",
    diagnosisSetId: set.manifest.id,
    diagnosisSetVersion: set.manifest.version,
    eventType: "judgment_confirmed",
    judgmentId,
    interaction: { type: "choice", version: 1 },
    payload: {
      choiceId: input.choiceId,
      durationMs: input.durationMs ?? 10_000,
      firstSelectionMs: input.firstSelectionMs ?? 5_000,
      confirmationMs: 5_000,
      selectionChanges: 0,
      uncertainty: false
    },
    occurredAt: "2026-07-22T00:00:00.000Z"
  };
}

function lifecycleEvent(
  eventType: "session_started" | "choice_selected" | "session_completed",
  clientSeq: number
): ObservationEvent {
  return {
    id: `event-${eventType}`,
    clientEventId: `client-${eventType}`,
    clientSeq,
    sessionId: "session-1",
    diagnosisSetId: set.manifest.id,
    diagnosisSetVersion: set.manifest.version,
    eventType,
    interaction: { type: "choice", version: 1 },
    payload: {},
    occurredAt: "2026-07-22T00:00:00.000Z"
  };
}

function allPermutations<T>(values: readonly T[]): T[][] {
  if (values.length <= 1) return [[...values]];
  return values.flatMap((value, index) =>
    allPermutations([
      ...values.slice(0, index),
      ...values.slice(index + 1)
    ]).map((tail) => [value, ...tail])
  );
}

describe("interpretation engine", () => {
  it("derives a tentative finding without mutating observation events", () => {
    const events = [event({ choiceId: "four-one" })];
    const snapshot = structuredClone(events);
    const report = interpretSession(
      set,
      events,
      undefined,
      generatedAt
    );

    expect(report.findings[0]).toMatchObject({
      signalId: "fraction.unequal-parts",
      confidence: "tentative",
      tentativeReasons: ["single_observation"],
      opportunityCount: 2
    });
    expect(report.engineVersion).toBe("rules-3.0.0");
    expect(report.confirmedFindingCount).toBe(0);
    expect(report.tentativeFindingCount).toBe(1);
    expect(events).toEqual(snapshot);
  });

  it("keeps a one-hit finding out of guardian support language", () => {
    const teacher = interpretSession(
      set,
      [event({ choiceId: "four-one" })],
      undefined,
      generatedAt
    );
    const parent = createParentReport(set, teacher, "별빛");

    expect(parent.supportAreas).toEqual([]);
    expect(parent.closing).toContain("확정하지 않았습니다");
    expect(JSON.stringify(parent)).not.toContain("event-four-one");
    expect(JSON.stringify(parent)).not.toContain("rules-3.0.0");
  });

  it("aggregates completed reports into confirmed and tentative student counts", () => {
    const report = interpretSession(
      set,
      [event({ choiceId: "four-one" })],
      undefined,
      generatedAt
    );
    const summary = generateClassSummary([
      { studentId: "student-a", report },
      { studentId: "student-b", report }
    ], 1);

    expect(summary.items[0]).toMatchObject({
      studentCount: 2,
      evidenceCount: 2,
      confirmedStudentCount: 0,
      tentativeStudentCount: 2,
      confirmedStudentIds: []
    });
    expect(summary.inProgressStudents).toBe(1);
  });

  it("attaches a finding's sole curriculum unit when content is provided", () => {
    const report = interpretSession(
      set,
      [event({ choiceId: "four-one" })],
      undefined,
      generatedAt
    );
    const summary = generateClassSummary(
      [{ studentId: "student-a", report }],
      0,
      set
    );

    expect(summary.items[0]).toMatchObject({
      unitId: set.manifest.units[0].id,
      unitTitle: set.manifest.units[0].title,
      unitOrder: set.manifest.units[0].order
    });
  });

  it("does not mislabel one signal as a single unit when its evidence spans units", () => {
    const multiUnitSet = structuredClone(set);
    multiUnitSet.manifest.units.push({
      id: "second-unit",
      order: 2,
      title: "둘째 단원"
    });
    multiUnitSet.learnerStages.push({
      ...multiUnitSet.learnerStages[0],
      id: "fraction.second-unit",
      unitId: "second-unit"
    });
    const firstReport = interpretSession(
      multiUnitSet,
      [event({ choiceId: "four-one" })],
      undefined,
      generatedAt
    );
    const secondReport = structuredClone(firstReport);
    secondReport.findings[0].learnerStageIds = ["fraction.second-unit"];

    const summary = generateClassSummary(
      [
        { studentId: "student-a", report: firstReport },
        { studentId: "student-b", report: secondReport }
      ],
      0,
      multiUnitSet
    );

    expect(summary.items[0]).not.toHaveProperty("unitId");
    expect(summary.items[0]).not.toHaveProperty("unitTitle");
    expect(summary.items[0]).not.toHaveProperty("unitOrder");
  });

  it("confirms the same signal only after two distinct judgments", () => {
    const report = interpretSession(
      set,
      [
        event({
          choiceId: "four-one",
          judgmentId: "fraction-1",
          clientSeq: 1
        }),
        event({
          choiceId: "two-one",
          judgmentId: "fraction-2",
          clientSeq: 2
        })
      ],
      undefined,
      generatedAt
    );

    expect(report.findings[0]).toMatchObject({
      confidence: "confirmed",
      tentativeReasons: [],
      evidenceCount: 2,
      observedJudgmentIds: ["fraction-1", "fraction-2"],
      confirmationRule: "서로 다른 두 문항에서 같은 신호가 나타났습니다."
    });
    expect(report.confirmedFindingCount).toBe(1);
  });

  it("deduplicates a replay of the same judgment before promotion", () => {
    const report = interpretSession(
      set,
      [
        event({ choiceId: "four-one", clientSeq: 1 }),
        event({ choiceId: "four-one", clientSeq: 2 })
      ],
      undefined,
      generatedAt
    );

    expect(report.observedJudgmentCount).toBe(1);
    expect(report.findings[0]).toMatchObject({
      confidence: "tentative",
      evidenceCount: 1,
      observedJudgmentIds: ["fraction-1"]
    });
  });

  it("reports a correct transfer response as counter-evidence without hiding the hit", () => {
    const report = interpretSession(
      set,
      [
        event({
          choiceId: "four-one",
          judgmentId: "fraction-1",
          clientSeq: 1
        }),
        event({
          choiceId: "one-half",
          judgmentId: "fraction-2",
          clientSeq: 2
        })
      ],
      undefined,
      generatedAt
    );

    expect(report.findings[0]).toMatchObject({
      confidence: "tentative",
      observedJudgmentIds: ["fraction-1"],
      counterJudgmentIds: ["fraction-2"]
    });

    const expandedSet = structuredClone(set);
    expandedSet.judgments.push({
      ...structuredClone(set.judgments[1]),
      id: "fraction-3",
      prompt: "세 번째 그림에 알맞은 분수",
      choices: [
        { id: "one-third", label: "1/3", correct: true },
        {
          id: "three-one",
          label: "3/1",
          correct: false,
          signalIds: ["fraction.unequal-parts"]
        }
      ]
    });
    const withCounter = interpretSession(
      expandedSet,
      [
        event({
          choiceId: "four-one",
          judgmentId: "fraction-1",
          clientSeq: 1
        }),
        event({
          choiceId: "two-one",
          judgmentId: "fraction-2",
          clientSeq: 2
        }),
        event({
          choiceId: "one-third",
          judgmentId: "fraction-3",
          clientSeq: 3
        })
      ],
      undefined,
      generatedAt
    );
    expect(withCounter.findings[0]).toMatchObject({
      confidence: "confirmed",
      counterJudgmentIds: ["fraction-3"]
    });
  });

  it("replays to a deep-equal report across all one hundred twenty input permutations", () => {
    const canonicalEvents = [
      lifecycleEvent("session_started", 0),
      lifecycleEvent("choice_selected", 1),
      event({
        choiceId: "four-one",
        judgmentId: "fraction-1",
        clientSeq: 2
      }),
      event({
        choiceId: "two-one",
        judgmentId: "fraction-2",
        clientSeq: 3
      }),
      lifecycleEvent("session_completed", 4)
    ];
    const expected = interpretSession(
      set,
      canonicalEvents,
      undefined,
      generatedAt
    );
    const permutations = allPermutations(canonicalEvents);
    const distinctOrders = new Set(
      permutations.map((permutation) =>
        permutation.map((item) => item.id).join("\u0000")
      )
    );

    expect(permutations).toHaveLength(120);
    expect(distinctOrders.size).toBe(120);
    for (const permutation of permutations) {
      expect(
        interpretSession(set, permutation, undefined, generatedAt)
      ).toEqual(expected);
    }
  });

  it("uses byte-order event IDs to break a client sequence tie before deduplication", () => {
    const firstWrong = event({
      choiceId: "four-one",
      judgmentId: "fraction-1",
      clientSeq: 1,
      id: "event-a-first-wrong"
    });
    const secondWrong = event({
      choiceId: "two-one",
      judgmentId: "fraction-2",
      clientSeq: 1,
      id: "event-m-second-wrong"
    });
    const duplicateCorrect = event({
      choiceId: "one-fourth",
      judgmentId: "fraction-1",
      clientSeq: 1,
      id: "event-z-duplicate-correct"
    });
    const forward = interpretSession(
      set,
      [firstWrong, secondWrong, duplicateCorrect],
      undefined,
      generatedAt
    );
    const reversed = interpretSession(
      set,
      [duplicateCorrect, secondWrong, firstWrong],
      undefined,
      generatedAt
    );

    expect(reversed).toEqual(forward);
    expect(forward.observedJudgmentCount).toBe(2);
    expect(forward.evidence.map((item) => item.eventId)).toEqual([
      "event-a-first-wrong",
      "event-m-second-wrong"
    ]);
    expect(forward.findings[0]).toMatchObject({
      confidence: "confirmed",
      observedJudgmentIds: ["fraction-1", "fraction-2"]
    });
  });

  it("keeps the guardian report within the database-whitelisted shape", () => {
    const teacher = interpretSession(
      set,
      [
        event({
          choiceId: "four-one",
          judgmentId: "fraction-1",
          clientSeq: 1
        }),
        event({
          choiceId: "two-one",
          judgmentId: "fraction-2",
          clientSeq: 2
        })
      ],
      undefined,
      generatedAt
    );
    const parent = createParentReport(set, teacher, "별빛");

    expect(Object.keys(parent)).toEqual([
      "studentLabel",
      "diagnosisTitle",
      "generatedAt",
      "participation",
      "strengths",
      "supportAreas",
      "closing",
      "disclaimer"
    ]);
    expect(parent.supportAreas).toHaveLength(1);
    expect(Object.keys(parent.supportAreas[0])).toEqual([
      "title",
      "observation",
      "homePrompt"
    ]);
  });

  it("never confirms a fallback uncertainty response", () => {
    const unknown = event({ choiceId: "__unknown__" });
    unknown.payload.uncertainty = true;
    const report = interpretSession(set, [unknown], undefined, generatedAt);

    expect(report.findings[0]).toMatchObject({
      signalId: "needs-scaffold",
      confidence: "tentative",
      tentativeReasons: ["uncertainty_only"]
    });
  });
});
