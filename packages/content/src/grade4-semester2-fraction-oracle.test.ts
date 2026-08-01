import { describe, expect, it } from "vitest";
import { grade4Semester2Diagnosis } from "./grade4-semester2";

type Term = { whole: number; num: number; den: number };
type Transform =
  | "add-denominators"
  | "flip-operation"
  | "swap-whole-and-numerator"
  | "double-denominator-on-subtract"
  | "whole-as-unit-fraction"
  | "no-operation"
  | "whole-sum-into-numerator";
type FractionSpec = {
  judgmentId: string;
  operation: "add" | "subtract";
  left: Term;
  right: Term;
  requestedForm: "fraction" | "mixed";
  unit?: "L" | "m" | "kg";
  distractors: [Transform, Transform];
};

const specs: FractionSpec[] = [
  {
    judgmentId: "g4s2-frac-01",
    operation: "add",
    left: { whole: 0, num: 2, den: 7 },
    right: { whole: 0, num: 3, den: 7 },
    requestedForm: "fraction",
    distractors: ["add-denominators", "flip-operation"]
  },
  {
    judgmentId: "g4s2-frac-02",
    operation: "add",
    left: { whole: 0, num: 3, den: 9 },
    right: { whole: 0, num: 5, den: 9 },
    requestedForm: "fraction",
    unit: "L",
    distractors: ["add-denominators", "flip-operation"]
  },
  {
    judgmentId: "g4s2-frac-03",
    operation: "add",
    left: { whole: 0, num: 5, den: 6 },
    right: { whole: 0, num: 4, den: 6 },
    requestedForm: "mixed",
    distractors: ["swap-whole-and-numerator", "add-denominators"]
  },
  {
    judgmentId: "g4s2-frac-04",
    operation: "add",
    left: { whole: 0, num: 5, den: 8 },
    right: { whole: 0, num: 6, den: 8 },
    requestedForm: "mixed",
    unit: "m",
    distractors: ["swap-whole-and-numerator", "add-denominators"]
  },
  {
    judgmentId: "g4s2-frac-05",
    operation: "subtract",
    left: { whole: 0, num: 8, den: 9 },
    right: { whole: 0, num: 5, den: 9 },
    requestedForm: "fraction",
    distractors: ["double-denominator-on-subtract", "flip-operation"]
  },
  {
    judgmentId: "g4s2-frac-06",
    operation: "subtract",
    left: { whole: 0, num: 7, den: 10 },
    right: { whole: 0, num: 4, den: 10 },
    requestedForm: "fraction",
    unit: "kg",
    distractors: ["double-denominator-on-subtract", "flip-operation"]
  },
  {
    judgmentId: "g4s2-frac-07",
    operation: "subtract",
    left: { whole: 1, num: 0, den: 8 },
    right: { whole: 0, num: 3, den: 8 },
    requestedForm: "fraction",
    distractors: ["whole-as-unit-fraction", "no-operation"]
  },
  {
    judgmentId: "g4s2-frac-08",
    operation: "subtract",
    left: { whole: 1, num: 0, den: 7 },
    right: { whole: 0, num: 3, den: 7 },
    requestedForm: "fraction",
    unit: "m",
    distractors: ["whole-as-unit-fraction", "no-operation"]
  },
  {
    judgmentId: "g4s2-frac-09",
    operation: "add",
    left: { whole: 1, num: 2, den: 7 },
    right: { whole: 2, num: 3, den: 7 },
    requestedForm: "mixed",
    distractors: ["add-denominators", "whole-sum-into-numerator"]
  },
  {
    judgmentId: "g4s2-frac-10",
    operation: "add",
    left: { whole: 1, num: 1, den: 5 },
    right: { whole: 2, num: 2, den: 5 },
    requestedForm: "mixed",
    unit: "L",
    distractors: ["add-denominators", "whole-sum-into-numerator"]
  }
];

function particle(whole: number): "과" | "와" {
  const koreanCardinalEndsWithConsonant = new Set([0, 1, 3, 6, 7, 8]);
  return koreanCardinalEndsWithConsonant.has(whole % 10) ? "과" : "와";
}

function appendUnit(label: string, unit?: FractionSpec["unit"]): string {
  return unit ? `${label} ${unit}` : label;
}

function numerator(term: Term): number {
  return term.whole * term.den + term.num;
}

function formatVisibleTerm(term: Term): string {
  if (term.whole > 0 && term.num > 0) {
    return `${term.whole}${particle(term.whole)} ${term.num}/${term.den}`;
  }
  if (term.whole > 0) return `${term.whole}`;
  return `${term.num}/${term.den}`;
}

function resultNumerator(spec: FractionSpec): number {
  const left = numerator(spec.left);
  const right = numerator(spec.right);
  return spec.operation === "add" ? left + right : left - right;
}

function formatResult(spec: FractionSpec): string {
  const result = resultNumerator(spec);
  const denominator = spec.left.den;
  if (spec.requestedForm === "mixed") {
    const whole = Math.floor(result / denominator);
    const remainder = result % denominator;
    return appendUnit(
      `${whole}${particle(whole)} ${remainder}/${denominator}`,
      spec.unit
    );
  }
  return appendUnit(`${result}/${denominator}`, spec.unit);
}

function formatDistractor(spec: FractionSpec, transform: Transform): string {
  const denominator = spec.left.den;
  const leftNumerator = spec.left.num;
  const rightNumerator = spec.right.num;
  const wholeSum = spec.left.whole + spec.right.whole;
  switch (transform) {
    case "add-denominators": {
      const result = leftNumerator + rightNumerator;
      const fraction = `${result}/${denominator * 2}`;
      return appendUnit(
        wholeSum > 0
          ? `${wholeSum}${particle(wholeSum)} ${fraction}`
          : fraction,
        spec.unit
      );
    }
    case "flip-operation":
      return appendUnit(
        `${spec.operation === "add"
          ? Math.abs(leftNumerator - rightNumerator)
          : leftNumerator + rightNumerator}/${denominator}`,
        spec.unit
      );
    case "swap-whole-and-numerator": {
      const result = resultNumerator(spec);
      const whole = Math.floor(result / denominator);
      const remainder = result % denominator;
      return appendUnit(
        `${remainder}${particle(remainder)} ${whole}/${denominator}`,
        spec.unit
      );
    }
    case "double-denominator-on-subtract":
      return appendUnit(
        `${leftNumerator - rightNumerator}/${denominator * 2}`,
        spec.unit
      );
    case "whole-as-unit-fraction":
      return appendUnit(
        `${rightNumerator - 1}/${denominator}`,
        spec.unit
      );
    case "no-operation":
      return appendUnit(
        `1과 ${rightNumerator}/${denominator}`,
        spec.unit
      );
    case "whole-sum-into-numerator":
      return appendUnit(
        `${wholeSum + leftNumerator + rightNumerator}/${denominator}`,
        spec.unit
      );
  }
}

function exactValue(label: string): { numerator: number; denominator: number } {
  const withoutUnit = label.replace(/ (L|m|kg)$/, "");
  const mixed = withoutUnit.match(/^([0-9]+)(과|와) ([0-9]+)\/([0-9]+)$/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const num = Number(mixed[3]);
    const den = Number(mixed[4]);
    return { numerator: whole * den + num, denominator: den };
  }
  const fraction = withoutUnit.match(/^([0-9]+)\/([0-9]+)$/);
  if (!fraction) throw new Error(`분수 선택지 형식을 읽을 수 없습니다: ${label}`);
  return { numerator: Number(fraction[1]), denominator: Number(fraction[2]) };
}

function sameRational(
  left: ReturnType<typeof exactValue>,
  right: ReturnType<typeof exactValue>
): boolean {
  return left.numerator * right.denominator
    === right.numerator * left.denominator;
}

function gcd(left: number, right: number): number {
  let dividend = Math.abs(left);
  let divisor = Math.abs(right);
  while (divisor !== 0) {
    [dividend, divisor] = [divisor, dividend % divisor];
  }
  return dividend;
}

function reducedResultLabel(spec: FractionSpec): string {
  const result = resultNumerator(spec);
  const denominator = spec.left.den;
  const whole = spec.requestedForm === "mixed"
    ? Math.floor(result / denominator)
    : 0;
  const remainder = spec.requestedForm === "mixed"
    ? result % denominator
    : result;
  const factor = gcd(remainder, denominator);
  const reducedFraction = `${remainder / factor}/${denominator / factor}`;
  return appendUnit(
    spec.requestedForm === "mixed"
      ? `${whole}${particle(whole)} ${reducedFraction}`
      : reducedFraction,
    spec.unit
  );
}

describe("4학년 2학기 분수 연산 수학 오라클", () => {
  it("보이는 계산 자료에서 구한 답과 오답 산출 과정이 모든 선택지와 일치한다", () => {
    const judgments = grade4Semester2Diagnosis.judgments.filter(
      (judgment) => judgment.unitId === "fraction-add-subtract"
    );
    expect(judgments).toHaveLength(10);

    for (const spec of specs) {
      const judgment = judgments.find(
        (candidate) => candidate.id === spec.judgmentId
      );
      expect(judgment, spec.judgmentId).toBeTruthy();
      if (!judgment) continue;

      expect(spec.left.den, spec.judgmentId).toBe(spec.right.den);
      expect(spec.left.den, spec.judgmentId).toBeGreaterThanOrEqual(4);
      expect(spec.left.den, spec.judgmentId).toBeLessThanOrEqual(10);
      expect(resultNumerator(spec), spec.judgmentId).toBeGreaterThanOrEqual(0);

      const expectedLabels = [
        formatResult(spec),
        ...spec.distractors.map((transform) =>
          formatDistractor(spec, transform)
        )
      ];
      expect(judgment.choices.map((choice) => choice.label), spec.judgmentId)
        .toEqual(expectedLabels);
      expect(judgment.choices[0].correct, spec.judgmentId).toBe(true);
      expect(judgment.choices.slice(1).every(
        (choice) => choice.correct === false
      ), spec.judgmentId).toBe(true);

      const values = judgment.choices.map((choice) => exactValue(choice.label));
      for (let leftIndex = 0; leftIndex < values.length; leftIndex += 1) {
        for (
          let rightIndex = leftIndex + 1;
          rightIndex < values.length;
          rightIndex += 1
        ) {
          expect(
            sameRational(values[leftIndex], values[rightIndex]),
            `${spec.judgmentId}:${judgment.choices[leftIndex].label}:${judgment.choices[rightIndex].label}`
          ).toBe(false);
        }
      }

      const visibleCopy = `${judgment.context ?? ""} ${judgment.prompt}`;
      expect(visibleCopy, `${spec.judgmentId}:첫 번째 수`).toContain(
        formatVisibleTerm(spec.left)
      );
      expect(visibleCopy, `${spec.judgmentId}:두 번째 수`).toContain(
        formatVisibleTerm(spec.right)
      );
      if (spec.requestedForm === "mixed") {
        expect(judgment.prompt, `${spec.judgmentId}:답의 형태`).toContain(
          "대분수"
        );
      }
      const visibleOperands = [
        formatVisibleTerm(spec.left),
        formatVisibleTerm(spec.right)
      ];
      for (const distractor of judgment.choices.slice(1)) {
        expect(
          visibleOperands,
          `${spec.judgmentId}:${distractor.label}:보이는 수 복사 금지`
        ).not.toContain(distractor.label.replace(/ (L|m|kg)$/, ""));
      }
      if (gcd(resultNumerator(spec) % spec.left.den, spec.left.den) > 1) {
        expect(
          judgment.choices.map((choice) => choice.label),
          `${spec.judgmentId}:약분형 선택지 금지`
        ).not.toContain(reducedResultLabel(spec));
      }
      expect(judgment.visual.kind, spec.judgmentId).toBe("none");
      expect(judgment.interaction.type, spec.judgmentId).toBe("choice");
    }
  });

  it("받아올림·받아내림과 서로 다른 분모가 범위에 들어오지 않는다", () => {
    for (const spec of specs) {
      expect(spec.left.den, spec.judgmentId).toBe(spec.right.den);
      if (
        spec.requestedForm === "mixed"
        && spec.left.whole > 0
        && spec.right.whole > 0
      ) {
        expect(
          spec.left.num + spec.right.num,
          spec.judgmentId
        ).toBeLessThan(spec.left.den);
      }
      expect(resultNumerator(spec), spec.judgmentId).toBeLessThanOrEqual(
        spec.left.den * 4
      );
    }
  });

  it("대분수 표기의 과·와가 자연수 읽기와 일치한다", () => {
    const mixedLabels = grade4Semester2Diagnosis.judgments
      .filter((judgment) => judgment.unitId === "fraction-add-subtract")
      .flatMap((judgment) => judgment.choices.map((choice) => choice.label))
      .filter((label) => /^[0-9]+(과|와) /.test(label));
    for (const label of mixedLabels) {
      const match = label.match(/^([0-9]+)(과|와) /);
      expect(match).toBeTruthy();
      if (!match) continue;
      expect(match[2], label).toBe(particle(Number(match[1])));
    }
  });
});
