import { describe, expect, it } from "vitest";
import { grade5Semester1Diagnosis } from "./grade5-semester1";
import {
  grade5Semester1DistractorRationales,
  grade5Semester1MisconceptionTitles
} from "./grade5-semester1-rationales";

type Token = number | "+" | "−" | "×" | "÷" | "(" | ")";

function calculate(expression: string): number {
  const input = (expression.match(/\d+|[()+−×÷]/g) ?? []).map((token) =>
    /^\d+$/.test(token) ? Number(token) : token as Token
  );
  let index = 0;
  const primary = (): number => {
    const token = input[index++];
    if (typeof token === "number") return token;
    if (token !== "(") throw new Error(`잘못된 산출식: ${expression}`);
    const value = addSubtract();
    if (input[index++] !== ")") throw new Error(`닫는 괄호 누락: ${expression}`);
    return value;
  };
  const multiplyDivide = (): number => {
    let value = primary();
    while (input[index] === "×" || input[index] === "÷") {
      const operator = input[index++];
      const right = primary();
      value = operator === "×" ? value * right : value / right;
    }
    return value;
  };
  const addSubtract = (): number => {
    let value = multiplyDivide();
    while (input[index] === "+" || input[index] === "−") {
      const operator = input[index++];
      const right = multiplyDivide();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  };
  const result = addSubtract();
  if (index !== input.length) throw new Error(`남은 토큰: ${expression}`);
  return result;
}

function commaLists(value: string): string[] {
  return [...value.matchAll(/\d+(?:,\s*\d+)+/g)]
    .map((match) => match[0].replace(/\s+/g, ""));
}

describe("5학년 1학기 오답 근거", () => {
  it("140개 오답 선택지에 정확히 한 근거가 있다", () => {
    const expected = grade5Semester1Diagnosis.judgments.flatMap((judgment) =>
      judgment.choices
        .filter((choice) => !choice.correct)
        .map((choice) => `${judgment.id}:${choice.id}`)
    ).sort();
    const actual = grade5Semester1DistractorRationales.map(
      (entry) => `${entry.judgmentId}:${entry.choiceId}`
    ).sort();
    expect(actual).toEqual(expected);
    expect(actual).toHaveLength(140);
  });

  it("단계마다 두 오개념이 direct와 transfer에서 반복된다", () => {
    for (const stage of grade5Semester1Diagnosis.learnerStages) {
      const judgmentIds = new Set(grade5Semester1Diagnosis.judgments
        .filter((judgment) => judgment.learnerStageId === stage.id)
        .map((judgment) => judgment.id));
      const entries = grade5Semester1DistractorRationales.filter((entry) =>
        judgmentIds.has(entry.judgmentId)
      );
      const grouped = entries.reduce((result, entry) => {
        const occurrences = result.get(entry.misconceptionId) ?? [];
        occurrences.push(entry);
        result.set(entry.misconceptionId, occurrences);
        return result;
      }, new Map<string, typeof entries>());
      expect(grouped.size, stage.id).toBe(2);
      for (const [id, occurrences] of grouped) {
        expect(new Set(occurrences.map(
          (entry) => entry.judgmentId
        )).size, id).toBe(2);
        expect(grade5Semester1MisconceptionTitles[id], id).toBeTruthy();
      }
    }
  });

  it("A4-5 오개념 ID는 선택지 A/B 위치가 아니라 수학적 의미를 기록한다", () => {
    const ids = new Set(grade5Semester1DistractorRationales
      .filter((entry) => entry.judgmentId.startsWith("g5s1-fa-"))
      .map((entry) => entry.misconceptionId));

    expect([...ids].sort()).toEqual([
      "fa.add-unlike.add-numerators-denominators",
      "fa.add-unlike.keep-original-numerators",
      "fa.borrow.stop-when-fraction-too-small",
      "fa.borrow.subtract-wholes-only",
      "fa.carry.raise-whole-without-reducing-fraction",
      "fa.carry.remove-whole-without-carrying",
      "fa.mixed-add.add-fraction-parts",
      "fa.mixed-add.omit-second-whole",
      "fa.reduce-result.operate-parts",
      "fa.reduce-result.reduce-one-side",
      "fa.sub-unlike.keep-original-numerators",
      "fa.sub-unlike.subtract-parts"
    ]);
    expect([...ids].every((id) => !/\.(?:a|b)$/.test(id))).toBe(true);
  });

  it("35단계 전체가 의미 ID를 사용하고 선택지 순서를 바꾸어도 근거 연결이 유지된다", () => {
    expect(grade5Semester1DistractorRationales.every(
      (entry) => !/\.(?:a|b)$/.test(entry.misconceptionId)
    )).toBe(true);

    const reorderedJudgments = grade5Semester1Diagnosis.judgments.map(
      (judgment) => ({ ...judgment, choices: [...judgment.choices].reverse() })
    );
    for (const entry of grade5Semester1DistractorRationales) {
      const judgment = reorderedJudgments.find(
        (candidate) => candidate.id === entry.judgmentId
      );
      const choice = judgment?.choices.find(
        (candidate) => candidate.id === entry.choiceId
      );
      expect(choice, `${entry.judgmentId}/${entry.choiceId}`).toBeTruthy();
      expect(entry.signalIds, entry.choiceId).toEqual(choice!.signalIds);
      expect(grade5Semester1MisconceptionTitles[entry.misconceptionId])
        .toBeTruthy();
    }

    const directOrder = grade5Semester1DistractorRationales
      .filter((entry) => entry.judgmentId === "g5s1-mix-01")
      .map((entry) => entry.misconceptionId);
    const transferOrder = grade5Semester1DistractorRationales
      .filter((entry) => entry.judgmentId === "g5s1-mix-02")
      .map((entry) => entry.misconceptionId);
    expect(directOrder).toEqual([
      "mixed-operations.multiply-first.calculate-left-to-right",
      "mixed-operations.multiply-first.stop-after-first-operation"
    ]);
    expect(transferOrder).toEqual([...directOrder].reverse());
    expect(Object.fromEntries(grade5Semester1DistractorRationales
      .filter((entry) => entry.judgmentId === "g5s1-mix-02")
      .map((entry) => [entry.choiceId, entry.misconceptionId])))
      .toEqual({
        "twenty-02": "mixed-operations.multiply-first.stop-after-first-operation",
        "one-hundred-thirty-02": "mixed-operations.multiply-first.calculate-left-to-right"
      });
  });

  it("모든 산출 근거가 실제 수식과 선택값을 포함하고 설명이 충분하다", () => {
    for (const entry of grade5Semester1DistractorRationales) {
      const judgment = grade5Semester1Diagnosis.judgments.find(
        (candidate) => candidate.id === entry.judgmentId
      );
      const choice = judgment?.choices.find(
        (candidate) => candidate.id === entry.choiceId
      );
      expect(choice, entry.choiceId).toBeTruthy();
      expect(entry.signalIds, entry.choiceId).toEqual(choice!.signalIds);
      expect(entry.derivation, entry.choiceId).toContain(choice!.label);
      const equalities = [...entry.derivation.matchAll(
        /([0-9()+−×÷]+)=([0-9]+)/g
      )];
      for (const equality of equalities) {
        expect(calculate(equality[1]), `${entry.choiceId}/${equality[0]}`)
          .toBe(Number(equality[2]));
      }
      if (/^\d+$/.test(choice!.label) && equalities.length > 0) {
        expect(equalities.at(-1)?.[2], entry.choiceId).toBe(choice!.label);
      } else if (choice!.label.includes(",")) {
        const derivedLists = commaLists(entry.derivation);
        expect(derivedLists.at(-1), entry.choiceId)
          .toBe(choice!.label.replace(/\s+/g, ""));
      } else if (equalities.length === 0) {
        expect(entry.derivation, entry.choiceId).toMatch(
          /약수|배수|공약수|공배수|나머지|곱|더해|빼면|나누|대응|관계|표|식|기호|분수|분자|분모|약분|통분|소수|자리|넓이|단위/
        );
      }
      for (const remainder of entry.derivation.matchAll(
        /(\d+)을 (\d+)로 나누면 몫은 (\d+), 나머지는 (\d+)/g
      )) {
        const [, dividend, divisor, quotient, rest] = remainder.map(Number);
        expect(Number(dividend), entry.choiceId)
          .toBe(Number(divisor) * Number(quotient) + Number(rest));
        expect(Number(rest), entry.choiceId).toBeLessThan(Number(divisor));
      }
      expect(entry.rationale.length, entry.choiceId).toBeGreaterThanOrEqual(15);
      expect(entry.sharedSignalRationale?.length ?? 0).toBeGreaterThanOrEqual(20);
    }
  });
});
