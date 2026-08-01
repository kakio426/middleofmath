import { describe, expect, it } from "vitest";
import { grade5Semester1Diagnosis } from "./grade5-semester1";

type Fraction = { numerator: number; denominator: number };

function gcd(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b !== 0) [a, b] = [b, a % b];
  return a;
}

function simplify(value: Fraction): Fraction {
  const divisor = gcd(value.numerator, value.denominator);
  return {
    numerator: value.numerator / divisor,
    denominator: value.denominator / divisor
  };
}

function parseFraction(value: string): Fraction {
  const match = value.match(/^(?:(\d+) )?(\d+)\/(\d+)$/);
  if (!match) throw new Error(`분수 형식이 아닙니다: ${value}`);
  const whole = Number(match[1] ?? 0);
  const denominator = Number(match[3]);
  return {
    numerator: whole * denominator + Number(match[2]),
    denominator
  };
}

function calculatePrompt(prompt: string): Fraction {
  const values = [...prompt.matchAll(/(?:(\d+) )?(\d+)\/(\d+)/g)].map((match) => {
    const denominator = Number(match[3]);
    return {
      numerator: Number(match[1] ?? 0) * denominator + Number(match[2]),
      denominator
    };
  });
  if (values.length !== 2) throw new Error(`두 분수 식이 아닙니다: ${prompt}`);
  const sign = prompt.includes("−") ? -1 : 1;
  return simplify({
    numerator: values[0].numerator * values[1].denominator
      + sign * values[1].numerator * values[0].denominator,
    denominator: values[0].denominator * values[1].denominator
  });
}

function formatFraction(value: Fraction): string {
  const whole = Math.floor(value.numerator / value.denominator);
  const remainder = value.numerator % value.denominator;
  if (remainder === 0) return String(whole);
  return whole > 0
    ? `${whole} ${remainder}/${value.denominator}`
    : `${remainder}/${value.denominator}`;
}

const expectedDistractors: Record<string, [string, string]> = {
  "g5s1-fa-01": ["2/7", "2/12"],
  "g5s1-fa-02": ["3/7", "3/10"],
  "g5s1-fa-03": ["2/2", "2/12"],
  "g5s1-fa-04": ["4/2", "4/12"],
  "g5s1-fa-05": ["4/30", "2/16"],
  "g5s1-fa-06": ["1/12", "6/8"],
  "g5s1-fa-07": ["1 11/12", "3 3/7"],
  "g5s1-fa-08": ["2 5/12", "3 2/10"],
  "g5s1-fa-09": ["1 1/4", "2 5/4"],
  "g5s1-fa-10": ["2 1/6", "3 7/6"],
  "g5s1-fa-11": ["3 1/4", "2 1/4"],
  "g5s1-fa-12": ["4 1/6", "2 1/6"]
};

const judgments = grade5Semester1Diagnosis.judgments.filter(
  (judgment) => judgment.unitId === "fraction-add-subtract"
);

describe("5학년 1학기 분수의 덧셈과 뺄셈 oracle", () => {
  it("12문항의 정답을 독립 분수 계산으로 다시 구한다", () => {
    expect(judgments).toHaveLength(12);
    for (const judgment of judgments) {
      const correct = judgment.choices.find((choice) => choice.correct);
      expect(correct?.label, judgment.id).toBe(
        formatFraction(calculatePrompt(judgment.prompt))
      );
      expect(judgment.curriculumAnchorIds, judgment.id).toEqual(["[6수01-08]"]);
      expect(judgment.visual.kind, judgment.id).toBe("none");
    }
  });

  it("각 단계의 두 오답이 계획한 계산 흔적과 정확히 일치한다", () => {
    for (const judgment of judgments) {
      expect(
        judgment.choices.filter((choice) => !choice.correct).map((choice) => choice.label),
        judgment.id
      ).toEqual(expectedDistractors[judgment.id]);
    }
  });

  it("정답과 값이 같은 오답을 허용하지 않는다", () => {
    const equivalentDistractors = judgments.flatMap((judgment) => {
      const correct = parseFraction(
        judgment.choices.find((choice) => choice.correct)!.label
      );
      return judgment.choices
        .filter((choice) => !choice.correct)
        .filter((choice) => {
          const distractor = parseFraction(choice.label);
          return correct.numerator * distractor.denominator
            === distractor.numerator * correct.denominator;
        })
        .map((choice) => `${judgment.id}:${choice.label}`);
    });
    expect(equivalentDistractors).toEqual([]);
  });

  it("같은 분모 계산·곱셈·나눗셈·소수 문항을 섞지 않는다", () => {
    for (const judgment of judgments) {
      const operands = [...judgment.prompt.matchAll(/\d+\/(\d+)/g)]
        .map((match) => Number(match[1]));
      expect(operands).toHaveLength(2);
      expect(operands[0], judgment.id).not.toBe(operands[1]);
      expect(`${judgment.context} ${judgment.prompt}`, judgment.id)
        .not.toMatch(/[×÷]|\d+\.\d+/);
    }
  });
});
