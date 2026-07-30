import { describe, expect, it } from "vitest";
import { analyzePresentationBalance } from "@middle-of-math/domain";
import { grade3Semester2CompleteDiagnosis } from "./grade3-semester2-complete";

describe("3학년 2학기 실제 선택지 제시 균형", () => {
  it("실제 64문제의 정답 위치와 저작 첫 선택지가 2000개 세션에서 치우치지 않는다", () => {
    const judgments = grade3Semester2CompleteDiagnosis.judgments.map((judgment) => {
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
});
