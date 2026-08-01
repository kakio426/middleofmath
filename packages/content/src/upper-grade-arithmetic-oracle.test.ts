import { describe, expect, it } from "vitest";
import { grade5Semester2Diagnosis } from "./grade5-semester2";
import { grade6Semester1Diagnosis } from "./grade6-semester1";
import { grade6Semester2Diagnosis } from "./grade6-semester2";

const numberToken = /(?:\d+\s*[과와]\s*)?\d+\/\d+|\d+\s+\d+\/\d+|\d+(?:,\d{3})*(?:\.\d+)?/g;

function numericValue(text: string): number {
  const normalized = text.replaceAll(",", "").trim();
  const koreanMixed = normalized.match(/^(\d+)\s*[과와]\s*(\d+)\/(\d+)/);
  if (koreanMixed) {
    return Number(koreanMixed[1]) + Number(koreanMixed[2]) / Number(koreanMixed[3]);
  }
  const spacedMixed = normalized.match(/^(\d+)\s+(\d+)\/(\d+)/);
  if (spacedMixed) {
    return Number(spacedMixed[1]) + Number(spacedMixed[2]) / Number(spacedMixed[3]);
  }
  const fraction = normalized.match(/^(\d+)\/(\d+)/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  const decimal = normalized.match(/^\d+(?:\.\d+)?/);
  if (!decimal) throw new Error(`수 값을 읽을 수 없습니다: ${text}`);
  return Number(decimal[0]);
}

function exactRationalValue(text: string): { numerator: bigint; denominator: bigint } {
  const normalized = text.replaceAll(",", "").trim();
  const koreanMixed = normalized.match(/^(\d+)\s*[과와]\s*(\d+)\/(\d+)/);
  if (koreanMixed) {
    const whole = BigInt(koreanMixed[1]);
    const numerator = BigInt(koreanMixed[2]);
    const denominator = BigInt(koreanMixed[3]);
    return { numerator: whole * denominator + numerator, denominator };
  }
  const spacedMixed = normalized.match(/^(\d+)\s+(\d+)\/(\d+)/);
  if (spacedMixed) {
    const whole = BigInt(spacedMixed[1]);
    const numerator = BigInt(spacedMixed[2]);
    const denominator = BigInt(spacedMixed[3]);
    return { numerator: whole * denominator + numerator, denominator };
  }
  const fraction = normalized.match(/^(\d+)\/(\d+)/);
  if (fraction) {
    return {
      numerator: BigInt(fraction[1]),
      denominator: BigInt(fraction[2])
    };
  }
  const decimal = normalized.match(/^(\d+)(?:\.(\d+))?/);
  if (!decimal) throw new Error(`정확한 수 값을 읽을 수 없습니다: ${text}`);
  const decimalPlaces = decimal[2]?.length ?? 0;
  const denominator = 10n ** BigInt(decimalPlaces);
  return {
    numerator: BigInt(`${decimal[1]}${decimal[2] ?? ""}`),
    denominator
  };
}

function expressionValue(prompt: string): number | undefined {
  const operatorMatch = prompt.match(/[×÷+−]/);
  if (!operatorMatch || operatorMatch.index === undefined) return undefined;
  const leftTokens = prompt.slice(0, operatorMatch.index).match(numberToken);
  const rightTokens = prompt.slice(operatorMatch.index + 1).match(numberToken);
  if (!leftTokens?.length || !rightTokens?.length) return undefined;
  const left = numericValue(leftTokens.at(-1)!);
  const right = numericValue(rightTokens[0]!);
  switch (operatorMatch[0]) {
    case "×": return left * right;
    case "÷": return left / right;
    case "+": return left + right;
    case "−": return left - right;
    default: return undefined;
  }
}

describe("5-2~6-2 계산 문항 독립 오라클", () => {
  it("문제 식에서 다시 계산한 값과 게시된 정답이 일치한다", () => {
    const sets = [grade5Semester2Diagnosis, grade6Semester1Diagnosis, grade6Semester2Diagnosis];
    let checked = 0;
    for (const diagnosis of sets) {
      for (const judgment of diagnosis.judgments) {
        const expected = expressionValue(judgment.prompt);
        if (expected === undefined) continue;
        const correct = judgment.choices.find((choice) => choice.correct);
        expect(correct, judgment.id).toBeDefined();
        expect(numericValue(correct!.label), judgment.id).toBeCloseTo(expected, 9);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThanOrEqual(25);
  });

  it("분수 단원의 오답은 정답과 같은 수를 다른 꼴로 제시하지 않는다", () => {
    const sets = [grade5Semester2Diagnosis, grade6Semester1Diagnosis, grade6Semester2Diagnosis];
    const fractionUnits = new Set(["fraction-multiplication", "fraction-division"]);
    for (const diagnosis of sets) {
      for (const judgment of diagnosis.judgments.filter(
        (item) => fractionUnits.has(item.unitId)
      )) {
        const correct = exactRationalValue(
          judgment.choices.find((choice) => choice.correct)!.label
        );
        for (const distractor of judgment.choices.filter(
          (choice) => !choice.correct
        )) {
          const wrong = exactRationalValue(distractor.label);
          expect(
            wrong.numerator * correct.denominator
              === correct.numerator * wrong.denominator,
            `${judgment.id}/${distractor.id}`
          ).toBe(false);
        }
      }
    }
  });
});
