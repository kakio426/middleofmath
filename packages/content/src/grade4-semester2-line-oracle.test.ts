import { describe, expect, it } from "vitest";
import {
  lineChartExpectedAnswer,
  lineChartGeometryIssues
} from "@middle-of-math/domain";
import { grade4Semester2Diagnosis } from "./grade4-semester2";
import { lineChartFigureIssues } from "./line-chart-figure-integrity";

describe("4학년 2학기 꺾은선그래프 수학 오라클", () => {
  const judgments = grade4Semester2Diagnosis.judgments.filter(
    (judgment) => judgment.unitId === "line-graphs"
  );

  it("5단계에 direct·transfer 두 문항씩 제공한다", () => {
    expect(judgments).toHaveLength(10);
    expect(new Set(judgments.map((judgment) => judgment.learnerStageId)).size).toBe(5);
  });

  it("보이는 축과 점만으로 모든 정답과 오답 생성 근거를 다시 계산한다", () => {
    for (const judgment of judgments) {
      expect(judgment.visual.kind, judgment.id).toBe("line-chart-diagram");
      if (judgment.visual.kind !== "line-chart-diagram") continue;
      expect(lineChartGeometryIssues(judgment.visual), judgment.id).toEqual([]);
      expect(lineChartExpectedAnswer(judgment.visual), judgment.id).not.toBeNull();
      expect(lineChartFigureIssues(judgment), judgment.id).toEqual([]);
    }
  });

  it("8개 수치 문항의 정답 수 크기 위치가 큰 수 4개·가운데 수 4개로 균형을 이룬다", () => {
    const ranks = judgments.flatMap((judgment) => {
      if (judgment.visual.kind !== "line-chart-diagram") return [];
      if (judgment.visual.mode === "largest-rise") return [];
      const values = judgment.choices.map((choice) => Number(
        choice.label.match(/\d+/)?.[0]
      ));
      const correct = Number(judgment.choices.find((choice) => choice.correct)?.label.match(/\d+/)?.[0]);
      const descending = [...values].sort((left, right) => right - left);
      return [descending.indexOf(correct) + 1];
    });
    expect(ranks.filter((rank) => rank === 1)).toHaveLength(4);
    expect(ranks.filter((rank) => rank === 2)).toHaveLength(4);
    expect(ranks.filter((rank) => rank === 3)).toHaveLength(0);
  });

  it("정답 표시를 오답으로 옮겨도 그림 오라클이 잡는다", () => {
    const mutant = structuredClone(judgments[0]!);
    mutant.choices[0]!.correct = false;
    mutant.choices[1]!.correct = true;
    expect(lineChartFigureIssues(mutant).map((issue) => issue.code)).toContain("ANSWER_ORACLE");
  });

  it("한 오답이 서로 다른 눈금 오해 두 가지로 설명되는 수치를 거부한다", () => {
    const tickUnit = structuredClone(judgments[0]!);
    if (tickUnit.visual.kind !== "line-chart-diagram") throw new Error("line chart fixture가 필요합니다.");
    tickUnit.visual.points[2]!.tick = tickUnit.visual.axis.tickCount;
    expect(lineChartFigureIssues(tickUnit).map((issue) => issue.code)).toContain(
      "DISTRACTOR_PROVENANCE_COLLISION"
    );

    const pointValue = structuredClone(judgments[2]!);
    if (pointValue.visual.kind !== "line-chart-diagram" || pointValue.visual.target?.kind !== "point") {
      throw new Error("point fixture가 필요합니다.");
    }
    pointValue.visual.axis.labeledTicks[1]!.value = pointValue.visual.axis.tickCount
      * pointValue.visual.points[pointValue.visual.target.categoryIndex]!.tick;
    expect(lineChartFigureIssues(pointValue).map((issue) => issue.code)).toContain(
      "DISTRACTOR_PROVENANCE_COLLISION"
    );
  });

  it("변화량 정답이 그래프에 이미 보이는 점값과 같으면 거부한다", () => {
    const mutant = structuredClone(judgments[4]!);
    if (mutant.visual.kind !== "line-chart-diagram") throw new Error("step-change fixture가 필요합니다.");
    mutant.visual.points = [
      { categoryIndex: 0, tick: 2 },
      { categoryIndex: 1, tick: 3 },
      { categoryIndex: 2, tick: 6 },
      { categoryIndex: 3, tick: 4 }
    ];
    mutant.choices = [
      { id: "collision-correct", label: "15도", correct: true },
      { id: "collision-ticks", label: "3도", correct: false },
      { id: "collision-later", label: "30도", correct: false }
    ];
    expect(lineChartFigureIssues(mutant).map((issue) => issue.code)).toContain(
      "ANSWER_EQUALS_PLOTTED_VALUE"
    );
  });

  it("분 단위 시간 표기는 문장과 축에서 아라비아숫자로 통일한다", () => {
    const koreanMinuteNumber = /(?:[일이삼사오육칠팔구십백]+|한|두|세|네|다섯|여섯|일곱|여덟|아홉|열|스무|서른|마흔|쉰)\s*분/;
    for (const judgment of judgments) {
      const copy = [judgment.context ?? "", judgment.prompt].join(" ");
      expect(copy, judgment.id).not.toMatch(koreanMinuteNumber);
    }
  });

  it("중간값 문항은 세로축 절반을 찍는 지름길과 눈금 단위 충돌을 피한다", () => {
    const estimates = judgments.filter((judgment) =>
      judgment.visual.kind === "line-chart-diagram"
      && judgment.visual.mode === "between-estimate"
    );
    for (const judgment of estimates) {
      if (judgment.visual.kind !== "line-chart-diagram") continue;
      const answer = lineChartExpectedAnswer(judgment.visual);
      const top = judgment.visual.axis.labeledTicks.at(-1)!.value;
      expect(Number(answer) * 2, judgment.id).not.toBe(top);
    }

    const collision = structuredClone(estimates[0]!);
    if (collision.visual.kind !== "line-chart-diagram") throw new Error("midpoint fixture가 필요합니다.");
    collision.visual.axis.labeledTicks[1]!.value = collision.visual.axis.tickCount * 4;
    expect(lineChartFigureIssues(collision).map((issue) => issue.code)).toContain(
      "DISTRACTOR_PROVENANCE_COLLISION"
    );
  });
});
