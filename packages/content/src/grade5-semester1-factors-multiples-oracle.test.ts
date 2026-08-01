import { describe, expect, it } from "vitest";
import { grade5Semester1Diagnosis } from "./grade5-semester1";

function divisors(value: number): number[] {
  return Array.from({ length: value }, (_, index) => index + 1)
    .filter((candidate) => value % candidate === 0);
}

function multiples(value: number, count: number, start = 1): number[] {
  return Array.from({ length: count }, (_, index) => value * (index + start));
}

function intersection(left: readonly number[], right: readonly number[]): number[] {
  const rightSet = new Set(right);
  return left.filter((value) => rightSet.has(value));
}

function union(left: readonly number[], right: readonly number[]): number[] {
  return [...new Set([...left, ...right])].sort((a, b) => a - b);
}

function gcd(left: number, right: number): number {
  return Math.max(...intersection(divisors(left), divisors(right)));
}

function lcm(left: number, right: number): number {
  for (let value = Math.max(left, right); value <= left * right; value += 1) {
    if (value % left === 0 && value % right === 0) return value;
  }
  throw new Error(`최소공배수를 찾지 못했습니다: ${left}, ${right}`);
}

function commonMultiples(left: number, right: number, count: number): number[] {
  return multiples(lcm(left, right), count);
}

function list(values: readonly number[]): string {
  return values.join(", ");
}

const judgments = grade5Semester1Diagnosis.judgments.filter(
  (judgment) => judgment.unitId === "factors-multiples"
);

const expectedChoices: Record<string, [string, string, string]> = {
  "g5s1-fm-01": [
    list(divisors(18)),
    list(divisors(18).slice(1, -1)),
    list([...divisors(18), 4].sort((a, b) => a - b))
  ],
  "g5s1-fm-02": [
    list(divisors(24)),
    list(divisors(24).slice(1, -1)),
    list([...divisors(24), 5].sort((a, b) => a - b))
  ],
  "g5s1-fm-03": [
    list(intersection(divisors(12), divisors(18))),
    list(union(divisors(12), divisors(18))),
    list(intersection(divisors(12), divisors(18)).slice(0, -1))
  ],
  "g5s1-fm-04": [
    String(gcd(16, 24)),
    String(divisors(24).filter((value) =>
      value < 24 && !divisors(16).includes(value)
    ).at(-1)),
    String(Math.max(...intersection(divisors(16), divisors(24)).slice(0, -1)))
  ],
  "g5s1-fm-05": [
    list(multiples(7, 4)),
    list(multiples(7, 4, 2)),
    list([7, 8, 9, 10])
  ],
  "g5s1-fm-06": [
    list(multiples(9, 4)),
    list(multiples(9, 4, 2)),
    list([9, 10, 11, 12])
  ],
  "g5s1-fm-07": [
    list(commonMultiples(4, 8, 3)),
    list(multiples(4 * 8, 3)),
    list(union(multiples(4, 3), multiples(8, 2)).slice(0, 3))
  ],
  "g5s1-fm-08": [
    String(lcm(6, 8)),
    String(6 * 8),
    String(multiples(6, 4).find((value) => value % 8 !== 0 && value > 8))
  ],
  "g5s1-fm-09": [String(gcd(12, 18)), String(lcm(12, 18)), String(12 + 18)],
  "g5s1-fm-10": [String(lcm(6, 8)), String(gcd(6, 8)), String(6 + 8)]
};

describe("5학년 약수와 배수 독립 오라클", () => {
  it("10개 정답과 20개 오답을 독립 함수로 전부 다시 만든다", () => {
    expect(judgments).toHaveLength(10);
    for (const judgment of judgments) {
      expect(judgment.choices.map((choice) => choice.label), judgment.id)
        .toEqual(expectedChoices[judgment.id]);
      expect(judgment.choices[0].correct, judgment.id).toBe(true);
      expect(new Set(judgment.choices.map((choice) => choice.label)).size)
        .toBe(3);
    }
  });

  it("목록형 보기의 모든 수는 자연수이며 정답 길이로 고를 수 없다", () => {
    for (const judgment of judgments.filter((entry) =>
      ["g5s1-fm-01", "g5s1-fm-02", "g5s1-fm-03", "g5s1-fm-05", "g5s1-fm-06", "g5s1-fm-07"]
        .includes(entry.id)
    )) {
      const numericCounts = judgment.choices.map((choice) =>
        choice.label.match(/\d+/g)?.length ?? 0
      );
      const textLengths = judgment.choices.map((choice) => choice.label.length);
      for (const choice of judgment.choices) {
        const values = (choice.label.match(/\d+/g) ?? []).map(Number);
        expect(values.length, `${judgment.id}/${choice.id}`).toBeGreaterThan(0);
        expect(values.every((value) => Number.isInteger(value) && value > 0))
          .toBe(true);
      }
      for (const measurements of [numericCounts, textLengths]) {
        const correct = measurements[0];
        const sameCount = measurements.filter((value) => value === correct).length;
        expect(
          (correct > Math.min(...measurements)
            && correct < Math.max(...measurements)) || sameCount > 1,
          `${judgment.id}: ${measurements.join(",")}`
        ).toBe(true);
      }
    }
  });

  it("대표값 문항은 정답이 보기의 크기만으로 드러나지 않는다", () => {
    for (const judgment of judgments.filter((entry) =>
      ["g5s1-fm-04", "g5s1-fm-08"].includes(entry.id)
    )) {
      const values = judgment.choices.map((choice) => Number(choice.label));
      const correctRank = [...values].sort((left, right) => left - right)
        .indexOf(values[0]);
      expect(correctRank, judgment.id).toBe(1);
    }
  });

  it("대표값 문항은 문제에 나온 수를 보기로 복사하지 않는다", () => {
    for (const judgment of judgments.filter((entry) =>
      ["g5s1-fm-04", "g5s1-fm-08"].includes(entry.id)
    )) {
      const operands = (judgment.prompt.match(/\d+/g) ?? []).map(Number);
      const choices = judgment.choices.map((choice) => Number(choice.label));
      expect(choices.filter((value) => operands.includes(value)), judgment.id)
        .toEqual([]);
    }
  });

  it("상황 문항은 공약수와 공배수 유형을 하나씩 다루고 정답 크기 순위가 다르다", () => {
    const situations = judgments.slice(8);
    expect(situations.map((judgment) => judgment.id)).toEqual([
      "g5s1-fm-09",
      "g5s1-fm-10"
    ]);
    const ranks = situations.map((judgment) => {
      const values = judgment.choices.map((choice) => Number(choice.label));
      return [...values].sort((a, b) => a - b).indexOf(values[0]);
    });
    expect(ranks).toEqual([0, 2]);
  });

  it("자연수·두 수·나열 범위를 넘는 용어나 시각 지름길이 없다", () => {
    const copy = judgments.flatMap((judgment) => [
      judgment.context ?? "",
      judgment.prompt,
      ...judgment.choices.map((choice) => choice.label)
    ]).join(" ");
    expect(copy).not.toMatch(/소인수|서로소|인수분해|GCD|LCM|호제법/);
    expect(judgments.every((judgment) => judgment.visual.kind === "none"))
      .toBe(true);
    expect(judgments.filter((judgment) =>
      judgment.learnerStageId.includes("common")
      || judgment.learnerStageId.includes("apply")
    ).every((judgment) =>
      (judgment.prompt.match(/\d+/g)?.length ?? 0) <= 2
    )).toBe(true);
  });
});
