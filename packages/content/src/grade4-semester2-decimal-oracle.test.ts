import { describe, expect, it } from "vitest";
import { grade4Semester2Diagnosis } from "./grade4-semester2";

type DecimalSpec = {
  judgmentId: string;
  scale: 100 | 1000;
  expectedChoices: [string, string, string];
};

const specs: DecimalSpec[] = [
  {
    judgmentId: "g4s2-dec-01",
    scale: 1000,
    expectedChoices: ["1.057", "1.57", "10.57"]
  },
  {
    judgmentId: "g4s2-dec-02",
    scale: 1000,
    expectedChoices: ["삼 점 영 영 구", "삼 점 구", "삼십 점 영 구"]
  },
  {
    judgmentId: "g4s2-dec-03",
    scale: 100,
    expectedChoices: ["0.34", "0.43", "3.4"]
  },
  {
    judgmentId: "g4s2-dec-04",
    scale: 100,
    expectedChoices: ["0.62 kg", "0.26 kg", "6.2 kg"]
  },
  {
    judgmentId: "g4s2-dec-05",
    scale: 100,
    expectedChoices: ["1.4", "1.25", "0.98"]
  },
  {
    judgmentId: "g4s2-dec-06",
    scale: 100,
    expectedChoices: ["지호", "나연", "준서"]
  },
  {
    judgmentId: "g4s2-dec-07",
    scale: 100,
    expectedChoices: ["1.15", "0.52", "0.15"]
  },
  {
    judgmentId: "g4s2-dec-08",
    scale: 100,
    expectedChoices: ["1.45 L", "0.91 L", "0.45 L"]
  },
  {
    judgmentId: "g4s2-dec-09",
    scale: 100,
    expectedChoices: ["1.22", "1.38", "1.32"]
  },
  {
    judgmentId: "g4s2-dec-10",
    scale: 100,
    expectedChoices: ["1.55 m", "2.45 m", "2.65 m"]
  }
];

function parseScaledDecimal(label: string, scale: 100 | 1000): number {
  const visible = label.replace(/ (kg|L|m)$/, "");
  const match = visible.match(/^([0-9]+)(?:\.([0-9]+))?$/);
  if (!match) throw new Error(`소수 선택지 형식을 읽을 수 없습니다: ${label}`);
  const decimalPlaces = scale === 100 ? 2 : 3;
  const fraction = (match[2] ?? "").padEnd(decimalPlaces, "0");
  if (fraction.length > decimalPlaces) {
    throw new Error(`허용 범위를 넘는 소수입니다: ${label}`);
  }
  return Number(match[1]) * scale + Number(fraction);
}

function labels(judgmentId: string): string[] {
  const judgment = grade4Semester2Diagnosis.judgments.find(
    (candidate) => candidate.id === judgmentId
  );
  if (!judgment) throw new Error(`문항을 찾을 수 없습니다: ${judgmentId}`);
  return judgment.choices.map((choice) => choice.label);
}

describe("4학년 2학기 소수 수학 오라클", () => {
  it("열 문항의 정답과 두 오답을 계획한 산출값에 고정한다", () => {
    const judgments = grade4Semester2Diagnosis.judgments.filter(
      (judgment) => judgment.unitId === "decimal-add-subtract"
    );
    expect(judgments).toHaveLength(10);
    for (const spec of specs) {
      const judgment = judgments.find(
        (candidate) => candidate.id === spec.judgmentId
      );
      expect(judgment, spec.judgmentId).toBeTruthy();
      if (!judgment) continue;
      expect(judgment.choices.map((choice) => choice.label), spec.judgmentId)
        .toEqual(spec.expectedChoices);
      expect(judgment.choices.map((choice) => choice.correct), spec.judgmentId)
        .toEqual([true, false, false]);
      expect(judgment.visual, spec.judgmentId).toEqual({ kind: "none" });
    }
  });

  it("자리값 구성과 비교를 100분의 1 정수로 다시 계산한다", () => {
    expect(parseScaledDecimal(labels("g4s2-dec-03")[0], 100)).toBe(
      3 * 10 + 4
    );
    expect(parseScaledDecimal(labels("g4s2-dec-03")[1], 100)).toBe(
      4 * 10 + 3
    );
    expect(parseScaledDecimal(labels("g4s2-dec-03")[2], 100)).toBe(34 * 10);

    expect(parseScaledDecimal(labels("g4s2-dec-04")[0], 100)).toBe(62);
    expect(parseScaledDecimal(labels("g4s2-dec-04")[1], 100)).toBe(26);
    expect(parseScaledDecimal(labels("g4s2-dec-04")[2], 100)).toBe(62 * 10);

    const direct = ["1.4", "1.25", "0.98"].map((value) =>
      parseScaledDecimal(value, 100)
    );
    expect(direct).toEqual([140, 125, 98]);
    expect(Math.max(...direct)).toBe(direct[0]);

    const transfer = ["2.7", "2.65", "1.98"].map((value) =>
      parseScaledDecimal(value, 100)
    );
    expect(transfer).toEqual([270, 265, 198]);
    expect(Math.max(...transfer)).toBe(transfer[0]);
  });

  it("덧셈과 뺄셈의 정답과 반복 오답을 정수 계산으로 재생성한다", () => {
    expect(labels("g4s2-dec-07").map((label) =>
      parseScaledDecimal(label, 100)
    )).toEqual([
      70 + 45,
      7 + 45,
      (70 + 45) % 100
    ]);
    expect(labels("g4s2-dec-08").map((label) =>
      parseScaledDecimal(label, 100)
    )).toEqual([
      85 + 60,
      85 + 6,
      (85 + 60) % 100
    ]);
    expect(labels("g4s2-dec-09").map((label) =>
      parseScaledDecimal(label, 100)
    )).toEqual([
      150 - 28,
      100 + 30 + 8,
      100 + 30 + 2
    ]);
    expect(labels("g4s2-dec-10").map((label) =>
      parseScaledDecimal(label, 100)
    )).toEqual([
      230 - 75,
      200 + 40 + 5,
      200 + 60 + 5
    ]);
  });

  it("읽기·쓰기에만 소수 세 자리를 쓰고 연산은 소수 두 자리 범위를 지킨다", () => {
    expect(parseScaledDecimal("1.057", 1000)).toBe(1057);
    for (const spec of specs.slice(2)) {
      expect(spec.scale, spec.judgmentId).toBe(100);
    }
    const decimalJudgments = grade4Semester2Diagnosis.judgments.filter(
      (candidate) => candidate.unitId === "decimal-add-subtract"
    );
    for (const judgment of decimalJudgments.filter(
      (candidate) => candidate.learnerStageId !== "decimal.read-write"
    )) {
      const visible = `${judgment.context ?? ""} ${judgment.prompt}`;
      expect(visible, judgment.id).not.toMatch(/[0-9]+\.[0-9]{3}/);
    }
    for (const judgment of decimalJudgments) {
      const visible = `${judgment.context ?? ""} ${judgment.prompt}`;
      expect(visible, `${judgment.id}:범위 밖 연산 기호`).not.toMatch(/[×÷]/);
      expect(visible, `${judgment.id}:단위 환산`).not.toMatch(
        /환산|단위를 바꾸|1000 ?m|100 ?cm/
      );
      expect(visible, `${judgment.id}:같은 소수의 묶음 곱셈`).not.toMatch(
        /한 개(?:의|에) .+[0-9]+개|같은 .+[0-9]+개/
      );
    }
    const placeValueTransfer = decimalJudgments.find(
      (judgment) => judgment.id === "g4s2-dec-04"
    );
    expect(placeValueTransfer?.context).toContain("0.1 kg이 6개");
    expect(placeValueTransfer?.context).toContain("0.01 kg이 2개");
    expect(placeValueTransfer?.prompt).not.toContain("모두");
  });

  it("비교 direct·transfer가 모두 처음 나온 값을 고르는 지름길을 만들지 않는다", () => {
    const compareJudgments = grade4Semester2Diagnosis.judgments.filter(
      (judgment) => judgment.learnerStageId === "decimal.compare"
    );
    expect(compareJudgments).toHaveLength(2);

    const firstMentionedIsCorrect = compareJudgments.map((judgment) => {
      const visible = `${judgment.context ?? ""} ${judgment.prompt}`;
      const correctChoice = judgment.choices.find((choice) => choice.correct);
      const firstChoiceMention = judgment.choices
        .map((choice) => ({
          correct: choice.correct,
          index: visible.indexOf(choice.label)
        }))
        .filter(({ index }) => index >= 0)
        .sort((left, right) => left.index - right.index)[0];
      expect(firstChoiceMention, judgment.id).toBeDefined();
      return firstChoiceMention?.correct === correctChoice?.correct;
    });

    expect(firstMentionedIsCorrect).toEqual([false, true]);
  });
});
