import { describe, expect, it } from "vitest";
import {
  analyzePresentationBalance,
  presentedChoiceIds,
  presentedChoices
} from "./presentation-order";

const choices = [
  { id: "choice-a", label: "가" },
  { id: "choice-b", label: "나" },
  { id: "choice-c", label: "다" }
];

describe("deterministic choice presentation", () => {
  it("keeps the same order for the same session and judgment", () => {
    const seed = { sessionId: "session-17", judgmentId: "judgment-4" };
    const first = presentedChoiceIds(seed, choices.map((choice) => choice.id));

    for (let index = 0; index < 1_000; index += 1) {
      expect(presentedChoiceIds(seed, choices.map((choice) => choice.id))).toEqual(first);
    }
  });

  it("does not depend on the authoring array order", () => {
    const seed = { sessionId: "session-18", judgmentId: "judgment-4" };
    const forward = presentedChoiceIds(seed, choices.map((choice) => choice.id));
    const reverse = presentedChoiceIds(seed, [...choices].reverse().map((choice) => choice.id));

    expect(reverse).toEqual(forward);
    expect(presentedChoices(seed, choices).map((choice) => choice.id)).toEqual(forward);
  });

  it("balances correct positions across synthetic sessions", () => {
    const report = analyzePresentationBalance({
      sessionIds: Array.from({ length: 2_000 }, (_, index) => `session-${index}`),
      judgments: Array.from({ length: 64 }, (_, index) => ({
        id: `judgment-${index}`,
        choiceIds: choices.map((choice) => `${choice.id}-${index}`),
        correctChoiceId: `choice-a-${index}`
      }))
    });

    expect(report.groups).toHaveLength(1);
    expect(report.groups[0]).toMatchObject({ choiceCount: 3, sampleCount: 128_000 });
    expect(report.maxDeviation).toBeLessThanOrEqual(0.06);
    expect(report.degenerateSessions).toEqual([]);
    expect(report.authoredFirstFixedSessionIds).toEqual([]);
  });

  it("ignores malformed balance inputs instead of inventing positions", () => {
    const report = analyzePresentationBalance({
      sessionIds: ["session-a"],
      judgments: [
        { id: "one-choice", choiceIds: ["a"], correctChoiceId: "a" },
        { id: "missing-correct", choiceIds: ["a", "b"], correctChoiceId: "c" }
      ]
    });

    expect(report).toEqual({
      groups: [],
      maxDeviation: 0,
      degenerateSessions: [],
      authoredFirstFixedSessionIds: []
    });
  });
});
