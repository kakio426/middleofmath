import { describe, expect, it } from "vitest";
import { grade5Semester1Diagnosis } from "./grade5-semester1";

const judgments = grade5Semester1Diagnosis.judgments.filter(
  (judgment) => judgment.unitId === "correspondence"
);

function labels(id: string): string[] {
  const judgment = judgments.find((entry) => entry.id === id);
  if (!judgment) throw new Error(`대응 관계 문항이 없습니다: ${id}`);
  return judgment.choices.map((choice) => choice.label);
}

const expectedChoices: Record<string, [string, string, string]> = {
  "g5s1-cor-01": [String(6 * 7), String(35 + (35 - 21)), String(35 + (6 - 5))],
  "g5s1-cor-02": [String(9 * 4), String(28 + (28 - 24)), String(28 + (9 - 7))],
  "g5s1-cor-03": ["△ = □ × 5", "△ = □ + 8", "△ = □ + 5"],
  "g5s1-cor-04": ["△ = □ × 3", "△ = □ + 8", "△ = □ + 3"],
  "g5s1-cor-05": ["△ = □ ÷ 5", "□ = △ ÷ 5", "△ = □ × 5"],
  "g5s1-cor-06": ["△ = □ ÷ 6", "□ = △ ÷ 6", "△ = □ × 6"],
  "g5s1-cor-07": [String(56 / 8), String(5 + 1), String(56 - 8)],
  "g5s1-cor-08": [String(12 * 6), String(54 + 6), String(12 / 6)],
  "g5s1-cor-09": [String(4 * 7), String(56 - 35), String(4 + 7)],
  "g5s1-cor-10": [String(14 / 7), String(5 - 4), String(14 + 7)]
};

function sourceNumbers(judgment: (typeof judgments)[number]): number[] {
  const visualNumbers = judgment.visual.kind === "relation-pattern-diagram"
    && judgment.visual.mode === "rule-table"
    ? judgment.visual.rows!.flatMap((row) => [row.left, row.right])
    : [];
  const copyNumbers = [judgment.context ?? "", judgment.prompt]
    .flatMap((value) => value.match(/\d+/g) ?? [])
    .map(Number);
  return [...new Set([...visualNumbers, ...copyNumbers])];
}

describe("5학년 대응 관계 독립 오라클", () => {
  it("10개 정답과 20개 오답을 독립 산출식으로 전부 다시 만든다", () => {
    expect(judgments).toHaveLength(10);
    for (const judgment of judgments) {
      expect(labels(judgment.id), judgment.id).toEqual(expectedChoices[judgment.id]);
      expect(judgment.choices[0].correct, judgment.id).toBe(true);
      expect(new Set(labels(judgment.id)).size, judgment.id).toBe(3);
    }
  });

  it("수치형 보기는 표·문맥·질문의 수를 그대로 복사하지 않는다", () => {
    for (const judgment of judgments.filter((entry) =>
      entry.choices.every((choice) => /^\d+$/.test(choice.label))
    )) {
      const sources = sourceNumbers(judgment);
      const copies = judgment.choices
        .map((choice) => Number(choice.label))
        .filter((value) => sources.includes(value));
      expect(copies, judgment.id).toEqual([]);
    }
  });

  it("식 보기는 한 연산만 사용하고 세 문자열 길이가 같다", () => {
    for (const judgment of judgments.slice(2, 6)) {
      const lengths = judgment.choices.map((choice) => choice.label.length);
      expect(new Set(lengths).size, judgment.id).toBe(1);
      for (const choice of judgment.choices) {
        expect(choice.label.match(/[+−×÷]/g), `${judgment.id}/${choice.id}`)
          .toHaveLength(1);
        expect(choice.label).toMatch(/^[□△] = [□△] [＋+−×÷] \d+$/u);
      }
    }
  });

  it("모든 문항이 두 양의 완전한 3행 표를 사용하고 표 밖 값을 묻는다", () => {
    for (const judgment of judgments) {
      expect(judgment.visual).toMatchObject({
        kind: "relation-pattern-diagram",
        mode: "rule-table"
      });
      if (judgment.visual.kind !== "relation-pattern-diagram"
        || judgment.visual.mode !== "rule-table") continue;
      const rows = judgment.visual.rows!;
      expect(rows).toHaveLength(3);
      expect(rows.every((row) => Number.isInteger(row.left) && Number.isInteger(row.right)))
        .toBe(true);
      expect(rows.slice(1).every((row, index) => row.left > rows[index].left))
        .toBe(true);
      expect(rows.slice(1).some((row, index) => row.left - rows[index].left > 1))
        .toBe(true);
    }
  });

  it("수치형 문항에서 정답 크기만으로 고르는 지름길이 없다", () => {
    const numeric = judgments.filter((entry) =>
      entry.choices.every((choice) => /^\d+$/.test(choice.label))
    );
    const ranks = numeric.map((judgment) => {
      const values = judgment.choices.map((choice) => Number(choice.label));
      return [...values].sort((left, right) => left - right).indexOf(values[0]);
    });
    expect(ranks).toEqual([1, 2, 1, 2, 2, 1]);
    expect(ranks.filter((rank) => rank === 0).length).toBeLessThanOrEqual(numeric.length / 2);
    expect(ranks.filter((rank) => rank === 2).length).toBeLessThanOrEqual(numeric.length / 2);
  });

  it("수치형 문항마다 정답과 자릿수가 같은 오답이 하나 이상 있다", () => {
    for (const judgment of judgments.filter((entry) =>
      entry.choices.every((choice) => /^\d+$/.test(choice.label))
    )) {
      const correctLength = judgment.choices[0].label.length;
      expect(
        judgment.choices.slice(1).some((choice) => choice.label.length === correctLength),
        judgment.id
      ).toBe(true);
    }
  });

  it("변화량 두 문항은 곱셈이나 나눗셈 관계를 명시해 한 판단만 요구한다", () => {
    const changeTogether = judgments.filter((judgment) =>
      judgment.learnerStageId === "correspondence.change-together"
    );
    expect(changeTogether).toHaveLength(2);
    for (const judgment of changeTogether) {
      expect(judgment.context, judgment.id).toMatch(/[×÷]/);
      expect(judgment.context, judgment.id).not.toMatch(/[+−]/);
    }
  });

  it("범위 밖 용어·기호와 한 양의 수열 문항이 없다", () => {
    const copy = judgments.flatMap((judgment) => [
      judgment.context ?? "",
      judgment.prompt,
      ...judgment.choices.map((choice) => choice.label)
    ]).join(" ");
    expect(copy).not.toMatch(/비율|백분율|함수|변수|정비례|그래프|좌표|%/);
    expect(judgments.every((judgment) =>
      judgment.visual.kind === "relation-pattern-diagram"
      && judgment.visual.mode === "rule-table"
    )).toBe(true);
  });
});
