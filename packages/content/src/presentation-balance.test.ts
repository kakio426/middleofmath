import { describe, expect, it } from "vitest";
import {
  analyzePresentationBalance,
  presentedChoiceIds
} from "@middle-of-math/domain";
import { grade3Semester2CompleteDiagnosis } from "./grade3-semester2-complete";
import { grade4Semester2Diagnosis } from "./grade4-semester2";
import { grade5Semester1Diagnosis } from "./grade5-semester1";

function balanceJudgments(content: {
  judgments: ReadonlyArray<{
    id: string;
    choices: ReadonlyArray<{ id: string; correct: boolean }>;
  }>;
}) {
  return content.judgments.map((judgment) => {
    const correctChoice = judgment.choices.find((choice) => choice.correct);
    if (!correctChoice) {
      throw new Error(`정답 선택지가 없습니다: ${judgment.id}`);
    }
    return {
      id: judgment.id,
      choiceIds: judgment.choices.map((choice) => choice.id),
      correctChoiceId: correctChoice.id
    };
  });
}

describe("3학년 2학기 실제 선택지 제시 균형", () => {
  it("실제 64문제의 정답 위치와 저작 첫 선택지가 2000개 세션에서 치우치지 않는다", () => {
    const judgments = balanceJudgments(grade3Semester2CompleteDiagnosis);

    expect(judgments).toHaveLength(64);
    const report = analyzePresentationBalance({
      sessionIds: Array.from({ length: 2_000 }, (_, index) => `content-session-${index}`),
      judgments
    });

    expect(report.groups).toHaveLength(1);
    expect(report.groups[0]).toMatchObject({
      choiceCount: 3,
      sampleCount: 128_000
    });
    expect(report.maxDeviation).toBeLessThanOrEqual(0.06);
    expect(report.degenerateSessions).toEqual([]);
    expect(report.authoredFirstFixedSessionIds).toEqual([]);
  });

  it("4학년 2학기 60문제도 2000개 세션에서 정답 위치가 치우치지 않는다", () => {
    const judgments = balanceJudgments(grade4Semester2Diagnosis);
    expect(judgments).toHaveLength(60);

    const report = analyzePresentationBalance({
      sessionIds: Array.from({ length: 2_000 }, (_, index) =>
        `grade4-semester2-session-${index}`
      ),
      judgments
    });

    expect(report.groups).toHaveLength(1);
    expect(report.groups[0]).toMatchObject({
      choiceCount: 3,
      sampleCount: 120_000
    });
    expect(report.maxDeviation).toBeLessThanOrEqual(0.01);
    expect(report.degenerateSessions).toEqual([]);
    expect(report.authoredFirstFixedSessionIds).toEqual([]);
  });

  it("5학년 1학기 여섯 단원은 각각 2000개 세션에서 정답 위치가 치우치지 않는다", () => {
    for (const unit of grade5Semester1Diagnosis.manifest.units) {
      const judgments = balanceJudgments({
        judgments: grade5Semester1Diagnosis.judgments.filter(
          (judgment) => judgment.unitId === unit.id
        )
      });
      const expectedCount = unit.id === "fraction-reduction-common-denominator"
        ? 14
        : unit.id === "fraction-add-subtract"
          ? 12
          : unit.id === "polygon-perimeter-area"
            ? 14
          : 10;
      expect(judgments, unit.id).toHaveLength(expectedCount);
      const sessionIds = Array.from({ length: 2_000 }, (_, index) =>
        `grade5-semester1-${unit.id}-session-${index}`
      );
      const report = analyzePresentationBalance({
        sessionIds,
        judgments,
        balanceWithinSession: true
      });
      expect(report.groups[0]).toMatchObject({
        choiceCount: 3,
        sampleCount: expectedCount * 2_000
      });
      expect(report.maxDeviation).toBeLessThanOrEqual(0.01);
      expect(report.degenerateSessions).toEqual([]);
      expect(report.authoredFirstFixedSessionIds).toEqual([]);

      const distractorOrders = new Set<string>();
      for (const sessionId of sessionIds) {
        const positionCounts = [0, 0, 0];
        for (const [judgmentIndex, judgment] of judgments.entries()) {
          const order = presentedChoiceIds({
            sessionId,
            judgmentId: judgment.id,
            judgmentIndex,
            correctChoiceId: judgment.correctChoiceId
          }, judgment.choiceIds);
          positionCounts[order.indexOf(judgment.correctChoiceId)] += 1;
          if (judgmentIndex === 0) {
            distractorOrders.add(order.filter(
              (choiceId) => choiceId !== judgment.correctChoiceId
            ).join(","));
          }
        }
        expect(
          [...positionCounts].sort((left, right) => left - right),
          sessionId
        ).toEqual(
          expectedCount === 14
            ? [4, 5, 5]
            : expectedCount === 12
              ? [4, 4, 4]
              : [3, 3, 4]
        );
      }
      expect(distractorOrders.size).toBe(2);
    }
  });
});
