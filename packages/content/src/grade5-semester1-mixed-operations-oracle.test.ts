import { describe, expect, it } from "vitest";
import { grade5Semester1Diagnosis } from "./grade5-semester1";

type Token = number | "+" | "−" | "×" | "÷" | "(" | ")";

function tokens(expression: string): Token[] {
  return (expression.match(/\d+|[()+−×÷]/g) ?? []).map((token) =>
    /^\d+$/.test(token) ? Number(token) : token as Token
  );
}

function calculate(expression: string): number {
  const input = tokens(expression);
  let index = 0;
  const primary = (): number => {
    const token = input[index++];
    if (typeof token === "number") return token;
    if (token !== "(") throw new Error(`잘못된 식: ${expression}`);
    const value = addSubtract();
    if (input[index++] !== ")") throw new Error(`닫는 괄호가 없습니다: ${expression}`);
    return value;
  };
  const multiplyDivide = (): number => {
    let value = primary();
    while (input[index] === "×" || input[index] === "÷") {
      const operator = input[index++];
      const right = primary();
      value = operator === "×" ? value * right : value / right;
      if (!Number.isInteger(value)) {
        throw new Error(`자연수 중간값이 아닙니다: ${expression}`);
      }
    }
    return value;
  };
  const addSubtract = (): number => {
    let value = multiplyDivide();
    while (input[index] === "+" || input[index] === "−") {
      const operator = input[index++];
      const right = multiplyDivide();
      value = operator === "+" ? value + right : value - right;
      if (!Number.isInteger(value) || value < 0) {
        throw new Error(`자연수 중간값이 아닙니다: ${expression}`);
      }
    }
    return value;
  };
  const result = addSubtract();
  if (index !== input.length) throw new Error(`남은 토큰이 있습니다: ${expression}`);
  return result;
}

const expectedChoices: Record<string, [number, number, number]> = {
  "g5s1-mix-01": [20, 44, 12],
  "g5s1-mix-02": [10, 130, 20],
  "g5s1-mix-03": [14, 4, 18],
  "g5s1-mix-04": [38, 8, 37],
  "g5s1-mix-05": [96, 6, 24],
  "g5s1-mix-06": [16, 30, 23],
  "g5s1-mix-07": [36, 20, 12],
  "g5s1-mix-08": [8, 15, 9],
  "g5s1-mix-09": [26, 11, 19],
  "g5s1-mix-10": [18, 168, 52]
};

const mixedOperationJudgments = grade5Semester1Diagnosis.judgments.filter(
  (judgment) => judgment.unitId === "mixed-operations"
);

describe("5학년 자연수의 혼합 계산 독립 오라클", () => {
  it("화면의 원시 식을 표준 계산 순서로 계산한 값이 정답과 일치한다", () => {
    for (const judgment of mixedOperationJudgments) {
      const correct = judgment.choices.find((choice) => choice.correct);
      expect(Number(correct?.label), judgment.id).toBe(calculate(judgment.prompt));
    }
  });

  it("10개 정답과 20개 오답이 독립 전수표와 정확히 일치한다", () => {
    for (const judgment of mixedOperationJudgments) {
      expect(judgment.choices.map((choice) => Number(choice.label)), judgment.id)
        .toEqual(expectedChoices[judgment.id]);
      expect(new Set(judgment.choices.map(
        (choice) => choice.label
      )).size, judgment.id).toBe(3);
    }
  });

  it("보기는 식에 보이는 수를 그대로 복사하지 않고 자연수 범위에 있다", () => {
    for (const judgment of mixedOperationJudgments) {
      const operands = new Set(tokens(judgment.prompt).filter(
        (token): token is number => typeof token === "number"
      ));
      for (const choice of judgment.choices) {
        const value = Number(choice.label);
        expect(Number.isInteger(value) && value >= 0, `${judgment.id}/${choice.id}`)
          .toBe(true);
        expect(operands.has(value), `${judgment.id}/${choice.id}`).toBe(false);
      }
    }
  });

  it("식은 초5 첫 단원 범위인 자연수·소괄호·사칙연산 세 번 이하만 사용한다", () => {
    for (const judgment of mixedOperationJudgments) {
      expect(judgment.prompt, judgment.id).not.toMatch(/[\[\]{}.,]/);
      expect(judgment.prompt.match(/[+−×÷]/g)?.length ?? 0, judgment.id)
        .toBeLessThanOrEqual(3);
      expect(judgment.prompt, judgment.id).toMatch(/^[-+−×÷()\d\s]+ = \?$/);
    }
  });

  it("각 단계의 두 문항은 정답 크기 순위가 같지 않아 최댓값 고르기로 풀리지 않는다", () => {
    for (const stage of grade5Semester1Diagnosis.learnerStages.filter(
      (candidate) => candidate.unitId === "mixed-operations"
    )) {
      const stageJudgments = mixedOperationJudgments.filter(
        (judgment) => judgment.learnerStageId === stage.id
      );
      const ranks = stageJudgments.map((judgment) => {
        const values = judgment.choices.map((choice) => Number(choice.label));
        const correct = Number(judgment.choices.find(
          (choice) => choice.correct
        )?.label);
        return [...values].sort((left, right) => left - right).indexOf(correct);
      });
      expect(new Set(ranks).size, stage.id).toBeGreaterThan(1);
    }
    const correctIsLargest = mixedOperationJudgments.filter(
      (judgment) => {
        const values = judgment.choices.map((choice) => Number(choice.label));
        return Number(judgment.choices.find(
          (choice) => choice.correct
        )?.label) === Math.max(...values);
      }
    );
    expect(correctIsLargest.map((judgment) => judgment.id)).toEqual([
      "g5s1-mix-04",
      "g5s1-mix-05",
      "g5s1-mix-07",
      "g5s1-mix-09"
    ]);
  });
});
