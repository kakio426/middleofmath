import { describe, expect, it } from "vitest";
import { validateCoverageBlueprint } from "./coverage";
import { diagnosisContentChecksum } from "./integrity-digest";
import { validateDiagnosisSet } from "./schema";
import {
  grade5Semester2CoverageBlueprint,
  grade5Semester2Diagnosis,
  grade5Semester2DistractorRationales
} from "./grade5-semester2";

function largerGroupLabel(left: number, right: number): string {
  if (left === right) return "두 모둠이 같습니다";
  return left > right ? "가 모둠" : "나 모둠";
}

function groupScores(context: string): [number[], number[]] {
  const match = context.match(
    /^가 모둠은 ([\d, ]+)점이고 나 모둠은 ([\d, ]+)점입니다\.$/
  );
  if (!match) throw new Error(`평균 비교 자료를 읽을 수 없습니다: ${context}`);
  const parse = (value: string) => value.split(",").map((item) => Number(item.trim()));
  return [parse(match[1]!), parse(match[2]!)];
}

function choiceForMisconception(
  judgmentId: string,
  misconceptionId: string
): string | undefined {
  const judgment = grade5Semester2Diagnosis.judgments.find(
    (item) => item.id === judgmentId
  );
  const rationale = grade5Semester2DistractorRationales.find(
    (entry) => entry.judgmentId === judgmentId
      && entry.misconceptionId === misconceptionId
  );
  return judgment?.choices.find((choice) => choice.id === rationale?.choiceId)?.label;
}

function fractionValue(label: string): { numerator: bigint; denominator: bigint } {
  const match = label.match(/^(\d+)\/(\d+)/);
  if (!match) return { numerator: BigInt(label.match(/^\d+/)?.[0] ?? "0"), denominator: 1n };
  return { numerator: BigInt(match[1]), denominator: BigInt(match[2]) };
}

describe("5학년 2학기 진단", () => {
  it("공식 여섯 단원을 33단계·66문항으로 분리한다", () => {
    expect(grade5Semester2Diagnosis.manifest).toMatchObject({
      id: "grade5-semester2",
      version: "1.0.0",
      grade: 5,
      semester: 2,
      units: [
        { id: "number-range-rounding", order: 1 },
        { id: "fraction-multiplication", order: 2 },
        { id: "congruence-symmetry", order: 3 },
        { id: "decimal-multiplication", order: 4 },
        { id: "rectangular-prisms-cubes", order: 5 },
        { id: "average-probability", order: 6 }
      ]
    });
    expect(grade5Semester2Diagnosis.curriculumAnchors).toHaveLength(12);
    expect(grade5Semester2Diagnosis.learnerStages).toHaveLength(33);
    expect(grade5Semester2Diagnosis.judgments).toHaveLength(66);
  });

  it("각 단계에 독립적인 직접·전이 문항 두 개를 둔다", () => {
    for (const stage of grade5Semester2Diagnosis.learnerStages) {
      const questions = grade5Semester2Diagnosis.judgments.filter(
        (judgment) => judgment.learnerStageId === stage.id
      );
      expect(questions, stage.id).toHaveLength(2);
      expect(new Set(questions.map(
        (question) => `${question.context ?? ""}\n${question.prompt}`
      )).size, stage.id).toBe(2);
    }
  });

  it("스키마·커버리지·체크섬 계약을 통과한다", () => {
    expect(validateDiagnosisSet(grade5Semester2Diagnosis)).toEqual({
      valid: true,
      issues: []
    });
    expect(validateCoverageBlueprint(
      grade5Semester2Diagnosis,
      grade5Semester2CoverageBlueprint
    )).toEqual({ valid: true, issues: [] });
    expect(grade5Semester2Diagnosis.manifest.checksum).toBe(
      diagnosisContentChecksum(grade5Semester2Diagnosis)
    );
  });

  it("입체도형 문제는 텍스트 기호 대신 의미 있는 그림을 사용한다", () => {
    const questions = grade5Semester2Diagnosis.judgments.filter(
      (judgment) => judgment.unitId === "rectangular-prisms-cubes"
    );
    expect(questions).toHaveLength(10);
    expect(questions.every((question) => question.visual.kind === "solid-diagram")).toBe(true);
  });

  it("평균 비교의 정답과 두 오답이 평균·합·최댓값 전략에서 실제로 나온다", () => {
    const questions = grade5Semester2Diagnosis.judgments.filter(
      (question) => question.learnerStageId === "ap.mean-compare"
    );
    expect(questions).toHaveLength(2);

    for (const question of questions) {
      const [left, right] = groupScores(question.context ?? "");
      const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
      const answerFor = (leftValue: number, rightValue: number) =>
        largerGroupLabel(leftValue, rightValue);
      const correct = question.choices.find((choice) => choice.correct);
      expect(correct?.label, question.id).toBe(
        answerFor(sum(left) / left.length, sum(right) / right.length)
      );

      const labelForMisconception = (suffix: string) => {
        const rationale = grade5Semester2DistractorRationales.find(
          (entry) => entry.judgmentId === question.id
            && entry.misconceptionId.endsWith(suffix)
        );
        return question.choices.find((choice) => choice.id === rationale?.choiceId)?.label;
      };
      expect(labelForMisconception("compare-total"), question.id).toBe(
        answerFor(sum(left), sum(right))
      );
      expect(labelForMisconception("compare-maximum"), question.id).toBe(
        answerFor(Math.max(...left), Math.max(...right))
      );
      expect(new Set(question.choices.map((choice) => choice.label)).size, question.id).toBe(3);
    }
  });

  it("반올림·모서리·전개도 오답이 표시된 수에서 한 가지 방식으로 산출된다", () => {
    for (const judgmentId of ["g5s2-nr-09", "g5s2-nr-10"]) {
      expect(choiceForMisconception(
        judgmentId,
        "nr.round-nearest.reverse-five-rule"
      ), judgmentId).toBeDefined();
    }
    for (const judgmentId of ["g5s2-nr-11", "g5s2-nr-12"]) {
      expect(choiceForMisconception(
        judgmentId,
        "nr.round-apply.ignore-situation-direction"
      ), judgmentId).toBeDefined();
    }

    const rectangularPrismQuestion = grade5Semester2Diagnosis.judgments.find(
      (judgment) => judgment.id === "g5s2-rp-05"
    )!;
    expect(rectangularPrismQuestion.visual).toMatchObject({
      kind: "solid-diagram",
      mode: "structure",
      shape: "rectangular-prism"
    });
    const cubeQuestion = grade5Semester2Diagnosis.judgments.find(
      (judgment) => judgment.id === "g5s2-rp-06"
    )!;
    expect(cubeQuestion.visual).toMatchObject({
      kind: "solid-diagram",
      mode: "structure",
      shape: "cube"
    });
    expect(choiceForMisconception(
      rectangularPrismQuestion.id,
      "rp.edge-properties.call-different"
    )).toBe("서로 다릅니다");
    expect(choiceForMisconception(
      cubeQuestion.id,
      "rp.edge-properties.call-double"
    )).toBe("반대쪽이 두 배입니다");
    expect(choiceForMisconception(
      "g5s2-rp-08",
      "rp.net-face-count.add-fold-lines"
    )).toBe("11개");
    expect(choiceForMisconception(
      "g5s2-cs-03",
      "cs.congruence-correspondence.double-corresponding-value"
    )).toBe("10 cm");
    expect(choiceForMisconception(
      "g5s2-cs-04",
      "cs.congruence-correspondence.double-corresponding-value"
    )).toBe("140°");
  });

  it("가능성 선택지는 서로 다른 정확한 값이고 전이 문항의 정답 위치가 반복되지 않는다", () => {
    for (const judgment of grade5Semester2Diagnosis.judgments.filter(
      (item) => item.learnerStageId === "ap.likelihood-number"
    )) {
      const values = judgment.choices.map((choice) => fractionValue(choice.label));
      for (let left = 0; left < values.length; left += 1) {
        for (let right = left + 1; right < values.length; right += 1) {
          expect(
            values[left].numerator * values[right].denominator
              === values[right].numerator * values[left].denominator,
            `${judgment.id}/${judgment.choices[left].label}/${judgment.choices[right].label}`
          ).toBe(false);
        }
      }
    }

    const predictionQuestions = grade5Semester2Diagnosis.judgments.filter(
      (item) => item.learnerStageId === "ap.data-predict"
    );
    const sourcePositions = predictionQuestions.map((judgment) => {
      const correct = judgment.choices.find((choice) => choice.correct)!.label;
      expect(judgment.visual.kind, judgment.id).toBe("data-table");
      if (judgment.visual.kind !== "data-table") return -1;
      return judgment.visual.rows.findIndex((row) => row.label === correct);
    });
    expect(sourcePositions).toEqual([0, 1]);
  });

  it("측정 단위가 정답 위치의 단서가 되지 않고 평균 정답을 자료에서 복사할 수 없다", () => {
    const unitPattern = /(cm|m²|kg|L|m)$/;
    for (const judgment of grade5Semester2Diagnosis.judgments) {
      const correctLabel = judgment.choices.find((choice) => choice.correct)!.label;
      const expectedUnit = correctLabel.match(unitPattern)?.[1];
      if (!expectedUnit) continue;
      expect(
        judgment.choices.every((choice) => choice.label.endsWith(expectedUnit)),
        judgment.id
      ).toBe(true);
    }

    for (const judgment of grade5Semester2Diagnosis.judgments.filter(
      (item) => item.learnerStageId === "ap.mean-calculate"
    )) {
      const correct = judgment.choices.find((choice) => choice.correct)!.label;
      expect(
        judgment.visual.kind === "item-collection"
          ? judgment.visual.items.includes(correct)
          : false,
        judgment.id
      ).toBe(false);
    }
  });

  it("점대칭 중심 문항은 A점을 중심이라고 미리 말하지 않고 실제 중점을 묻는다", () => {
    const judgment = grade5Semester2Diagnosis.judgments.find(
      (item) => item.id === "g5s2-cs-12"
    )!;
    expect(judgment.context).toBe("A점을 반 바퀴 돌렸더니 B점의 자리에 왔다고 합니다.");
    expect(judgment.context).not.toContain("A점을 중심으로");
    expect(judgment.visual).toMatchObject({
      kind: "grid-transform-diagram",
      mode: "point-move",
      points: [
        { row: 1, column: 2, label: "A" },
        { row: 5, column: 6, label: "B" }
      ]
    });
    expect(judgment.choices.find((choice) => choice.correct)?.label)
      .toBe("위에서 4번째, 왼쪽에서 5번째 칸의 중심");
  });
});
