import { describe, expect, it } from "vitest";
import { validateCoverageBlueprint } from "./coverage";
import { diagnosisContentChecksum } from "./integrity-digest";
import { validateDiagnosisSet } from "./schema";
import {
  grade6Semester2CoverageBlueprint,
  grade6Semester2Diagnosis,
  grade6Semester2DistractorRationales
} from "./grade6-semester2";

function judgmentById(id: string) {
  const judgment = grade6Semester2Diagnosis.judgments.find((item) => item.id === id);
  if (!judgment) throw new Error(`Unknown judgment: ${id}`);
  return judgment;
}

function choiceForMisconception(
  judgmentId: string,
  misconceptionId: string
): string | undefined {
  const judgment = judgmentById(judgmentId);
  const rationale = grade6Semester2DistractorRationales.find(
    (entry) => entry.judgmentId === judgmentId
      && entry.misconceptionId === misconceptionId
  );
  return judgment.choices.find((choice) => choice.id === rationale?.choiceId)?.label;
}

describe("6학년 2학기 진단", () => {
  it("공식 여섯 단원을 28단계·56문항으로 분리한다", () => {
    expect(grade6Semester2Diagnosis.manifest).toMatchObject({
      id: "grade6-semester2", grade: 6, semester: 2
    });
    expect(grade6Semester2Diagnosis.manifest.units).toHaveLength(6);
    expect(grade6Semester2Diagnosis.curriculumAnchors).toHaveLength(10);
    expect(grade6Semester2Diagnosis.learnerStages).toHaveLength(28);
    expect(grade6Semester2Diagnosis.judgments).toHaveLength(56);
  });

  it("각 단계가 오답 전략을 두 문항에서 반복 관찰한다", () => {
    for (const stage of grade6Semester2Diagnosis.learnerStages) {
      const questions = grade6Semester2Diagnosis.judgments.filter(
        (question) => question.learnerStageId === stage.id
      );
      expect(questions, stage.id).toHaveLength(2);
      for (const question of questions) {
        expect(question.choices.filter((choice) => !choice.correct)).toHaveLength(2);
      }
    }
  });

  it("스키마·커버리지·체크섬 계약을 통과한다", () => {
    expect(validateDiagnosisSet(grade6Semester2Diagnosis)).toEqual({ valid: true, issues: [] });
    expect(validateCoverageBlueprint(
      grade6Semester2Diagnosis,
      grade6Semester2CoverageBlueprint
    )).toEqual({ valid: true, issues: [] });
    expect(grade6Semester2Diagnosis.manifest.checksum).toBe(
      diagnosisContentChecksum(grade6Semester2Diagnosis)
    );
  });

  it("모든 문항의 세 선택지는 값과 표시가 서로 다르다", () => {
    for (const judgment of grade6Semester2Diagnosis.judgments) {
      expect(new Set(judgment.choices.map((choice) => choice.label)).size,
        judgment.id).toBe(3);
    }
  });

  it("분수 나눗셈 오답은 실제 잘못된 계산과 답 단위를 유지한다", () => {
    expect([
      choiceForMisconception("g6s2-03-1", "fd2.mixed-divisor.bad-improper"),
      choiceForMisconception("g6s2-03-1", "fd2.mixed-divisor.no-reciprocal")
    ]).toEqual(["1과 1/3", "27/8"]);
    expect([
      choiceForMisconception("g6s2-04-2", "fd2.application.multiply"),
      choiceForMisconception("g6s2-04-2", "fd2.application.reverse")
    ]).toEqual(["1,200원", "1/7500원"]);
    for (const [judgmentId, suffix] of [
      ["g6s2-02-2", "작품"],
      ["g6s2-03-2", "도막"],
      ["g6s2-04-1", "km"],
      ["g6s2-04-2", "원"]
    ] as const) {
      expect(judgmentById(judgmentId).choices.every(
        (choice) => choice.label.endsWith(suffix)
      ), judgmentId).toBe(true);
    }
  });

  it("위에서 본 쌓기나무 그림은 바닥 자리 수와 전체 개수를 그대로 담는다", () => {
    for (const [judgmentId, expectedPlaces, expectedCubes, expectedFrontCells] of [
      ["g6s2-05-1", 3, 5, 4],
      ["g6s2-05-2", 4, 5, 3]
    ] as const) {
      const visual = judgmentById(judgmentId).visual;
      expect(visual.kind, judgmentId).toBe("solid-diagram");
      if (visual.kind !== "solid-diagram" || visual.mode !== "unit-stack") {
        throw new Error(`Expected unit stack: ${judgmentId}`);
      }
      const places = new Set(visual.cubes.map(([x, y]) => `${x},${y}`));
      expect(places.size, judgmentId).toBe(expectedPlaces);
      expect(visual.cubes, judgmentId).toHaveLength(expectedCubes);
      const projectedCells = ([0, 1] as const).map((groupAxis) => {
        const heights = new Map<number, number>();
        for (const cube of visual.cubes) {
          const key = cube[groupAxis];
          heights.set(key, Math.max(heights.get(key) ?? 0, cube[2] + 1));
        }
        return [...heights.values()].reduce((sum, height) => sum + height, 0);
      });
      expect(projectedCells, judgmentId).toEqual([
        expectedFrontCells,
        expectedFrontCells
      ]);
      for (const [x, y, z] of visual.cubes.filter(([, , z]) => z > 0)) {
        expect(visual.cubes, `${judgmentId}/${x},${y},${z}`).toContainEqual([x, y, z - 1]);
      }
    }
  });

  it("가려진 쌓기나무 문항은 문장에 모든 기둥 높이를 미리 주지 않는다", () => {
    for (const judgmentId of ["g6s2-07-1", "g6s2-07-2"]) {
      const judgment = judgmentById(judgmentId);
      expect(judgment.context, judgmentId).not.toMatch(/높이가\s*[\d, ]+인|높이가\s*\d인/);
      expect(judgment.visual.kind, judgmentId).toBe("solid-diagram");
      if (judgment.visual.kind !== "solid-diagram" || judgment.visual.mode !== "unit-stack") {
        throw new Error(`Expected unit stack: ${judgmentId}`);
      }
      expect(judgment.visual.cubes, judgmentId).toHaveLength(5);
    }
  });

  it("조건에 맞게 쌓기 오답은 두 문항 모두 위층의 추가 나무만 센다", () => {
    expect([
      choiceForMisconception("g6s2-09-1", "space.build-condition.extra-only"),
      choiceForMisconception("g6s2-09-2", "space.build-condition.extra-only")
    ]).toEqual(["1개", "2개"]);
  });

  it("소수 나눗셈의 역순·몫 해석 오답이 실제 산출값과 일치한다", () => {
    expect([
      choiceForMisconception("g6s2-10-1", "dd2.decimal-dividend.reverse"),
      choiceForMisconception("g6s2-10-2", "dd2.decimal-dividend.reverse")
    ]).toEqual(["0.138…", "0.18…도막"]);
    expect([
      choiceForMisconception("g6s2-13-1", "dd2.application.ignore-whole"),
      choiceForMisconception("g6s2-13-2", "dd2.application.ignore-whole")
    ]).toEqual(["2.02…개", "4.52개"]);
    for (const judgmentId of ["g6s2-13-1", "g6s2-13-2"]) {
      expect(judgmentById(judgmentId).choices.every(
        (choice) => choice.label.endsWith("개")
      ), judgmentId).toBe(true);
    }
  });

  it("원 둘레·넓이 그림의 표시 수치는 문제 조건과 일치한다", () => {
    expect(judgmentById("g6s2-20-1").visual).toMatchObject({
      kind: "circle", mode: "radius", radiusValue: 5, showRadius: true
    });
    expect(judgmentById("g6s2-20-2").visual).toMatchObject({
      kind: "circle", mode: "diameter", diameterValue: 20, measurementUnit: "m"
    });
    expect(judgmentById("g6s2-22-1").visual).toMatchObject({
      kind: "circle", mode: "radius", radiusValue: 4, showRadius: true
    });
    expect(judgmentById("g6s2-22-2").visual).toMatchObject({
      kind: "circle", mode: "diameter", diameterValue: 10, measurementUnit: "m"
    });
  });

  it("비례식 빈 항 오답은 구한 배수를 적용하지 않고 그대로 답한다", () => {
    expect([
      choiceForMisconception("g6s2-16-1", "prop.missing.use-scale-factor"),
      choiceForMisconception("g6s2-16-2", "prop.missing.use-scale-factor")
    ]).toEqual(["3", "3 km"]);
  });

  it("낱개 사탕 비례배분의 모든 선택지는 가능한 정수 개수다", () => {
    const judgment = judgmentById("g6s2-17-1");
    expect(judgment.context).toContain("42개");
    expect(judgment.choices.map((choice) => choice.label)).toEqual(
      expect.arrayContaining(["12개", "21개", "2개"])
    );
    expect(judgment.choices.every((choice) => /^\d+개$/.test(choice.label))).toBe(true);
  });

  it("지름과 반지름을 바꾸는 오답은 질문에 따라 정확히 산출된다", () => {
    expect([
      choiceForMisconception("g6s2-21-1", "circle.find-diameter.confuse-radius"),
      choiceForMisconception("g6s2-21-2", "circle.find-diameter.confuse-radius")
    ]).toEqual(["6 cm", "20 m"]);
  });

  it("같은 원기둥 그림에서는 같은 꼭짓점 오개념이 같은 값을 만든다", () => {
    expect([
      choiceForMisconception("g6s2-25-1", "round-solids.cylinder-elements.vertex"),
      choiceForMisconception("g6s2-25-2", "round-solids.cylinder-elements.vertex")
    ]).toEqual(["밑면 2개, 꼭짓점 2개", "밑면 2개, 꼭짓점 2개"]);
  });

  it("둥근 입체도형 전개도 선택지는 모두 같은 형식의 도형 이름이다", () => {
    expect(judgmentById("g6s2-28-1").visual).toMatchObject({
      kind: "solid-diagram", mode: "net", shape: "cylinder"
    });
    expect(judgmentById("g6s2-28-2").visual).toMatchObject({
      kind: "solid-diagram", mode: "net", shape: "cone"
    });
    for (const judgmentId of ["g6s2-28-1", "g6s2-28-2"]) {
      expect(judgmentById(judgmentId).choices.every(
        (choice) => /^(?:원기둥|원뿔|구)$/.test(choice.label)
      ), judgmentId).toBe(true);
    }
  });

  it("과일 가격 문항의 곱셈·역순 오답이 실제 산출과 연결된다", () => {
    const judgment = grade6Semester2Diagnosis.judgments.find(
      (item) => item.prompt === "1 kg의 가격은 얼마인가요?"
    );
    expect(judgment).toBeDefined();
    const labelFor = (misconceptionId: string) => {
      const rationale = grade6Semester2DistractorRationales.find(
        (entry) => entry.judgmentId === judgment!.id
          && entry.misconceptionId === misconceptionId
      );
      return judgment!.choices.find(
        (choice) => choice.id === rationale?.choiceId
      )?.label;
    };
    expect(labelFor("fd2.application.multiply")).toBe("1,200원");
    expect(labelFor("fd2.application.reverse")).toBe("1/7500원");
  });
});
