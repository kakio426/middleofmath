import { describe, expect, it } from "vitest";
import { validateCoverageBlueprint } from "./coverage";
import { grade5Semester1CoverageBlueprint } from "./grade5-semester1-coverage";
import { grade5Semester1Diagnosis } from "./grade5-semester1";
import { grade5Semester1MisconceptionTitles } from "./grade5-semester1-rationales";

type Fraction = { numerator: number; denominator: number };

function gcd(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b !== 0) [a, b] = [b, a % b];
  return a;
}

function fraction(value: string): Fraction {
  if (/^\d+\/\d+$/.test(value)) {
    const [numerator, denominator] = value.split("/").map(Number);
    return { numerator, denominator };
  }
  if (/^\d+\.\d+$/.test(value)) {
    const decimalPlaces = value.split(".")[1].length;
    const denominator = 10 ** decimalPlaces;
    return { numerator: Math.round(Number(value) * denominator), denominator };
  }
  throw new Error(`분수나 소수로 읽을 수 없습니다: ${value}`);
}

function value(input: Fraction): number {
  return input.numerator / input.denominator;
}

function equal(left: Fraction, right: Fraction): boolean {
  return left.numerator * right.denominator === right.numerator * left.denominator;
}

function label(numerator: number, denominator: number): string {
  return `${numerator}/${denominator}`;
}

function multiplyBoth(numerator: number, denominator: number, factor: number): string {
  return label(numerator * factor, denominator * factor);
}

function denominatorOnly(numerator: number, targetDenominator: number): string {
  return label(numerator, targetDenominator);
}

function addBoth(numerator: number, denominator: number, amount: number): string {
  return label(numerator + amount, denominator + amount);
}

function divideBoth(numerator: number, denominator: number, divisor: number): string {
  return label(numerator / divisor, denominator / divisor);
}

function divideDifferently(
  numerator: number,
  denominator: number,
  numeratorDivisor: number,
  denominatorDivisor: number
): string {
  return label(numerator / numeratorDivisor, denominator / denominatorDivisor);
}

function subtractGcd(numerator: number, denominator: number): string {
  const common = gcd(numerator, denominator);
  return label(numerator - common, denominator - common);
}

function commonDenominator(
  numerator: number,
  denominator: number,
  targetDenominator: number
): string {
  return label(numerator * targetDenominator / denominator, targetDenominator);
}

function numeratorTimesOwnDenominator(
  numerator: number,
  denominator: number,
  targetDenominator: number
): string {
  return label(numerator * denominator, targetDenominator);
}

function byValue(candidates: string[], direction: "min" | "max"): string {
  return [...candidates].sort((left, right) =>
    (direction === "min" ? 1 : -1) * (value(fraction(left)) - value(fraction(right)))
  )[0];
}

function byNumerator(candidates: string[], direction: "min" | "max"): string {
  return [...candidates].sort((left, right) =>
    (direction === "min" ? 1 : -1)
      * (fraction(left).numerator - fraction(right).numerator)
  )[0];
}

function byDenominator(candidates: string[], direction: "min" | "max"): string {
  return [...candidates].sort((left, right) =>
    (direction === "min" ? 1 : -1)
      * (fraction(left).denominator - fraction(right).denominator)
  )[0];
}

function visibleDigit(labelValue: string): number {
  return labelValue.includes("/")
    ? fraction(labelValue).numerator
    : Number(labelValue.replace(/^0\./, ""));
}

function byVisibleDigit(candidates: string[], direction: "min" | "max"): string {
  return [...candidates].sort((left, right) =>
    (direction === "min" ? 1 : -1) * (visibleDigit(left) - visibleDigit(right))
  )[0];
}

function decimalFromFraction(numerator: number, denominator: number): string {
  return String(numerator / denominator);
}

function concatenateFractionDigits(numerator: number, denominator: number): string {
  return `0.${numerator}${denominator}`;
}

function numeratorAsTenths(numerator: number): string {
  return `0.${numerator}`;
}

function decimalDigitsAsFraction(decimal: string): string {
  const digits = decimal.replace(/^0\./, "");
  return label(Number(digits[0]), Number(digits.slice(1)));
}

function decimalWithWrongZeroCount(decimal: string): string {
  return label(Number(decimal.replace(".", "")), 10);
}

const judgments = grade5Semester1Diagnosis.judgments.filter(
  (judgment) => judgment.unitId === "fraction-reduction-common-denominator"
);

const compare09 = ["4/5", "7/9", "2/3"];
const compare10 = ["3/8", "2/3", "7/10"];
const compare13 = ["0.7", "4/5", "3/4"];
const compare14 = ["0.3", "3/8", "2/5"];

const expectedChoices: Record<string, [string, string, string]> = {
  "g5s1-frq-01": [multiplyBoth(2, 3, 4), denominatorOnly(2, 12), addBoth(2, 3, 4)],
  "g5s1-frq-02": [multiplyBoth(3, 5, 3), denominatorOnly(3, 15), addBoth(3, 5, 3)],
  "g5s1-frq-03": [divideBoth(12, 18, 3), label(12 / 6, 6), divideDifferently(12, 18, 4, 3)],
  "g5s1-frq-04": [divideBoth(18, 27, 3), label(18 / 9, 9), divideDifferently(18, 27, 2, 3)],
  "g5s1-frq-05": [divideBoth(20, 36, 4), divideDifferently(20, 36, 2, 3), subtractGcd(20, 36)],
  "g5s1-frq-06": [divideBoth(18, 30, 6), divideDifferently(18, 30, 3, 2), subtractGcd(18, 30)],
  "g5s1-frq-07": [commonDenominator(1, 4, 12), denominatorOnly(1, 12), numeratorTimesOwnDenominator(1, 4, 12)],
  "g5s1-frq-08": [commonDenominator(3, 4, 20), denominatorOnly(3, 20), numeratorTimesOwnDenominator(3, 4, 20)],
  "g5s1-frq-09": [byValue(compare09, "max"), byNumerator(compare09, "max"), byDenominator(compare09, "min")],
  "g5s1-frq-10": [byValue(compare10, "min"), byNumerator(compare10, "min"), byDenominator(compare10, "max")],
  "g5s1-frq-11": [decimalFromFraction(3, 5), concatenateFractionDigits(3, 5), numeratorAsTenths(3)],
  "g5s1-frq-12": [divideBoth(25, 100, 25), decimalDigitsAsFraction("0.25"), decimalWithWrongZeroCount("0.25")],
  "g5s1-frq-13": [byValue(compare13, "max"), byVisibleDigit(compare13, "max"), byDenominator(compare13.filter((item) => item.includes("/")), "min")],
  "g5s1-frq-14": [byValue(compare14, "min"), byVisibleDigit(compare14, "min"), byDenominator(compare14.filter((item) => item.includes("/")), "max")]
};

describe("5학년 약분과 통분 독립 오라클", () => {
  it("14개 정답과 28개 오답을 고정 행렬과 정확히 대조한다", () => {
    expect(judgments).toHaveLength(14);
    for (const judgment of judgments) {
      expect(judgment.choices.map((choice) => choice.label), judgment.id)
        .toEqual(expectedChoices[judgment.id]);
      expect(judgment.choices.filter((choice) => choice.correct), judgment.id)
        .toHaveLength(1);
      expect(judgment.choices[0].correct, judgment.id).toBe(true);
      expect(new Set(judgment.choices.map((choice) => choice.label)).size)
        .toBe(3);
    }
  });

  it("일곱 단계마다 direct와 transfer가 하나씩 있고 성취기준이 맞는다", () => {
    expect(validateCoverageBlueprint(
      grade5Semester1Diagnosis,
      grade5Semester1CoverageBlueprint
    )).toEqual({ valid: true, issues: [] });
    const anchorByStage = new Map([
      ["frac-equiv.multiply-both", "[6수01-06]"],
      ["frac-equiv.divide-both", "[6수01-06]"],
      ["frac-equiv.simplest-form", "[6수01-06]"],
      ["frac-equiv.common-denominator", "[6수01-06]"],
      ["frac-compare.different-denominator", "[6수01-07]"],
      ["frac-decimal.convert", "[6수01-12]"],
      ["frac-decimal.compare", "[6수01-12]"]
    ]);
    for (const [stageId, anchorId] of anchorByStage) {
      const stageJudgments = judgments.filter(
        (judgment) => judgment.learnerStageId === stageId
      );
      expect(stageJudgments, stageId).toHaveLength(2);
      expect(stageJudgments.every((judgment) =>
        judgment.curriculumAnchorIds.length === 1
        && judgment.curriculumAnchorIds[0] === anchorId
      ), stageId).toBe(true);
    }
  });

  it("분수·소수 보기는 유효하고 정답 수학값을 독립 계산으로 확인한다", () => {
    const correctValues: Record<string, number> = {
      "g5s1-frq-01": 2 / 3,
      "g5s1-frq-02": 3 / 5,
      "g5s1-frq-03": 12 / 18,
      "g5s1-frq-04": 18 / 27,
      "g5s1-frq-05": 20 / 36,
      "g5s1-frq-06": 18 / 30,
      "g5s1-frq-07": 1 / 4,
      "g5s1-frq-08": 3 / 4,
      "g5s1-frq-09": Math.max(4 / 5, 7 / 9, 2 / 3),
      "g5s1-frq-10": Math.min(2 / 3, 3 / 8, 7 / 10),
      "g5s1-frq-11": 3 / 5,
      "g5s1-frq-12": 0.25,
      "g5s1-frq-13": Math.max(0.7, 4 / 5, 3 / 4),
      "g5s1-frq-14": Math.min(0.3, 3 / 8, 2 / 5)
    };
    for (const judgment of judgments) {
      for (const choice of judgment.choices) {
        const parsed = fraction(choice.label);
        expect(parsed.denominator, `${judgment.id}/${choice.id}`).toBeGreaterThan(0);
        expect(parsed.numerator, `${judgment.id}/${choice.id}`).toBeGreaterThanOrEqual(0);
      }
      expect(value(fraction(judgment.choices[0].label)), judgment.id)
        .toBeCloseTo(correctValues[judgment.id], 10);
    }
  });

  it("모든 오답은 정답과 수학값도 다르다", () => {
    for (const judgment of judgments) {
      const correct = fraction(judgment.choices[0].label);
      const equalDistractors = judgment.choices.slice(1).filter((choice) =>
        equal(correct, fraction(choice.label))
      );
      expect(equalDistractors, judgment.id).toEqual([]);
    }
  });

  it("통분 문항은 지정 공통분모가 두 원래 분모의 공배수이고 크기를 유지한다", () => {
    const cases = [
      { id: "g5s1-frq-07", original: { numerator: 1, denominator: 4 }, other: 3, common: 12 },
      { id: "g5s1-frq-08", original: { numerator: 3, denominator: 4 }, other: 5, common: 20 }
    ];
    for (const item of cases) {
      const judgment = judgments.find((entry) => entry.id === item.id)!;
      const correct = fraction(judgment.choices[0].label);
      expect(item.common % item.original.denominator, item.id).toBe(0);
      expect(item.common % item.other, item.id).toBe(0);
      expect(correct.denominator, item.id).toBe(item.common);
      expect(equal(correct, item.original), item.id).toBe(true);
    }
  });

  it("분모가 다른 분수와 분수·소수 비교는 모든 후보를 실제 값으로 비교한다", () => {
    for (const id of ["g5s1-frq-09", "g5s1-frq-13"]) {
      const judgment = judgments.find((entry) => entry.id === id)!;
      const values = judgment.choices.map((choice) => value(fraction(choice.label)));
      expect(values[0], id).toBe(Math.max(...values));
    }
    for (const id of ["g5s1-frq-10", "g5s1-frq-14"]) {
      const judgment = judgments.find((entry) => entry.id === id)!;
      const values = judgment.choices.map((choice) => value(fraction(choice.label)));
      expect(values[0], id).toBe(Math.min(...values));
    }
  });

  it("비교와 변환 오개념 제목은 direct와 transfer 양쪽 기제를 함께 설명한다", () => {
    expect(grade5Semester1MisconceptionTitles).toMatchObject({
      "frac-compare.different-denominator.compare-numerators-only": "분자 숫자만 보고 분수의 크기를 정함",
      "frac-compare.different-denominator.compare-denominators-only": "분모 숫자만 보고 분수의 크기를 정함",
      "frac-decimal.convert.ignore-place-value": "분모 10·100의 자릿값을 적용하지 않음",
      "frac-decimal.compare.compare-denominators-only": "분모 숫자만 보고 분수의 크기를 정함"
    });
  });

  it("변환 문항은 분모 10·100의 자릿값과 기약분수 조건을 만족한다", () => {
    const toDecimal = judgments.find((entry) => entry.id === "g5s1-frq-11")!;
    expect(value(fraction(toDecimal.choices[0].label))).toBe(3 / 5);
    const toFraction = fraction(
      judgments.find((entry) => entry.id === "g5s1-frq-12")!.choices[0].label
    );
    expect(value(toFraction)).toBe(0.25);
    expect(gcd(toFraction.numerator, toFraction.denominator)).toBe(1);
  });

  it("모든 문항은 답을 노출하는 그림 없이 수치 행동만 관찰한다", () => {
    expect(judgments.every((judgment) => judgment.visual.kind === "none"))
      .toBe(true);
  });

  it("비교 후보 복사는 네 비교 문항에만 명시적으로 허용한다", () => {
    const allowed = new Set([
      "g5s1-frq-09", "g5s1-frq-10", "g5s1-frq-13", "g5s1-frq-14"
    ]);
    for (const judgment of judgments) {
      const copied = judgment.choices.filter((choice) =>
        judgment.prompt.includes(choice.label)
      );
      expect(copied.length > 0, judgment.id).toBe(allowed.has(judgment.id));
      if (allowed.has(judgment.id)) expect(copied, judgment.id).toHaveLength(3);
    }
  });

  it("목표 분모를 밝힌 문항은 세 선택지 모두 그 분모를 사용한다", () => {
    for (const judgment of judgments) {
      const target = `${judgment.context ?? ""} ${judgment.prompt}`
        .match(/분모가 (\d+)인/)?.[1];
      if (!target) continue;
      expect(judgment.choices.map((choice) => fraction(choice.label).denominator), judgment.id)
        .toEqual([Number(target), Number(target), Number(target)]);
    }
  });

  it("정답 크기 위치는 여러 순위에 분산된다", () => {
    const ranks = judgments.map((judgment) => {
      const values = judgment.choices.map((choice) => value(fraction(choice.label)));
      return [...values].sort((left, right) => left - right).indexOf(values[0]);
    });
    expect(ranks).toEqual([1, 1, 2, 1, 1, 2, 1, 2, 2, 0, 2, 0, 2, 0]);
    expect(ranks.slice(0, 2)).toEqual([1, 1]);
    expect(ranks.slice(4, 6)).toEqual([1, 2]);
    expect(new Set(ranks).size).toBe(3);
  });

  it("학생 문구는 짧고 수동 줄바꿈과 범위 밖 내용을 포함하지 않는다", () => {
    const copy = judgments.flatMap((judgment) => [
      judgment.context ?? "",
      judgment.prompt,
      ...judgment.choices.map((choice) => choice.label)
    ]).join(" ");
    expect(copy).not.toMatch(
      /대분수|가분수|분수의 덧셈|분수의 뺄셈|분수의 곱셈|비율|비례|백분율|순환소수|%|<br|[\r\n]/
    );
    expect(judgments.every((judgment) =>
      judgment.prompt.length <= 60
      && (judgment.context?.length ?? 0) <= 30
      && judgment.choices.every((choice) => choice.label.length <= 12)
    )).toBe(true);
  });
});
