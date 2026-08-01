import { describe, expect, it } from "vitest";
import type {
  QuadrilateralFigure,
  QuadrilateralIndex
} from "@middle-of-math/domain";
import { grade4Semester2Diagnosis } from "./grade4-semester2";
import {
  actualEqualSideGroups,
  actualParallelSidePairs,
  actualRightAngleVertexIndexes,
  dot,
  quadrilateralFigureGeometryIssues,
  quadrilateralSideName,
  sideSquaredLength,
  sideVector
} from "./quadrilateral-geometry";

const quadrilateralJudgments = grade4Semester2Diagnosis.judgments.filter(
  (judgment) => judgment.unitId === "quadrilaterals"
);

function correctLabel(judgmentId: string): string {
  const judgment = quadrilateralJudgments.find(
    (candidate) => candidate.id === judgmentId
  );
  const correct = judgment?.choices.find((choice) => choice.correct);
  if (!correct) throw new Error(`${judgmentId} 정답이 없습니다.`);
  return correct.label;
}

function wrongLabels(judgmentId: string): string[] {
  const judgment = quadrilateralJudgments.find(
    (candidate) => candidate.id === judgmentId
  );
  if (!judgment) throw new Error(`${judgmentId} 문항이 없습니다.`);
  return judgment.choices.filter((choice) => !choice.correct)
    .map((choice) => choice.label);
}

function visual(judgmentId: string): QuadrilateralFigure {
  const judgment = quadrilateralJudgments.find(
    (candidate) => candidate.id === judgmentId
  );
  if (judgment?.visual.kind !== "quadrilateral-figure") {
    throw new Error(`${judgmentId} 사각형 시각이 없습니다.`);
  }
  return judgment.visual;
}

describe("4학년 2학기 사각형 수학 오라클", () => {
  it("10문항의 좌표·표시·라벨 계약이 기하 계산과 일치한다", () => {
    expect(quadrilateralJudgments).toHaveLength(10);
    for (const judgment of quadrilateralJudgments) {
      expect(judgment.visual.kind, judgment.id).toBe(
        "quadrilateral-figure"
      );
      if (judgment.visual.kind !== "quadrilateral-figure") continue;
      expect(
        quadrilateralFigureGeometryIssues(judgment.visual),
        judgment.id
      ).toEqual([]);
    }
  });

  it("수직 문항은 기준 변과 직각 표시를 함께 읽어야 정답이 정해진다", () => {
    for (const id of ["g4s2-quad-01", "g4s2-quad-02"]) {
      const judgment = quadrilateralJudgments.find(
        (candidate) => candidate.id === id
      );
      expect(judgment, id).toBeTruthy();
      const figure = visual(id);
      expect(figure.mode).toBe("side-perpendicular");
      if (figure.mode !== "side-perpendicular") continue;
      const base = figure.baseSideIndex;
      const candidates = [0, 1, 2, 3] as const;
      expect(judgment?.prompt, id).toContain(
        quadrilateralSideName(base)
      );
      const perpendicular = candidates.filter((index) =>
        index !== base
        && dot(
          sideVector(figure.vertices, base),
          sideVector(figure.vertices, index)
        ) === 0
      );
      expect(perpendicular, id).toHaveLength(1);
      expect(correctLabel(id)).toBe(
        quadrilateralSideName(perpendicular[0])
      );
      expect(actualParallelSidePairs(figure.vertices), id).toEqual([]);
      expect(actualRightAngleVertexIndexes(figure.vertices), id).toEqual(
        figure.rightAngleVertexIndexes
      );
      expect(figure.rightAngleVertexIndexes, id).toHaveLength(2);
      const candidateSidesTouchingAMark = candidates.filter((index) =>
        index !== base
        && (
          figure.rightAngleVertexIndexes.includes(index)
          || figure.rightAngleVertexIndexes.includes(
            ((index + 1) % 4) as QuadrilateralIndex
          )
        )
      );
      expect(candidateSidesTouchingAMark, id).toHaveLength(3);
      const notTouchingBase = candidates.find((index) =>
        index !== base
        && index !== (base + 1) % 4
        && index !== (base + 3) % 4
      );
      expect(notTouchingBase, id).not.toBeUndefined();
      expect(wrongLabels(id), id).toContain(
        quadrilateralSideName(notTouchingBase!)
      );
    }
  });

  it("거리 문항은 수직 거리와 두 변의 길이를 서로 다른 값으로 고정한다", () => {
    for (const id of ["g4s2-quad-03", "g4s2-quad-04"]) {
      const figure = visual(id);
      expect(figure.mode).toBe("side-parallel-distance");
      if (figure.mode !== "side-parallel-distance") continue;
      expect(correctLabel(id)).toBe(
        `${figure.distanceSegment.lengthCm} cm`
      );
      const derivedSideLengths = figure.sideLengthLabels.map((label) => {
        const squared = sideSquaredLength(
          figure.vertices,
          label.sideIndex
        );
        expect(squared, id).toBe(label.lengthCm ** 2);
        return `${label.lengthCm} cm`;
      });
      expect(wrongLabels(id)).toEqual(derivedSideLengths);
      expect(new Set([
        correctLabel(id),
        ...wrongLabels(id)
      ]).size, id).toBe(3);
    }
    const allLabels = [
      correctLabel("g4s2-quad-04"),
      ...wrongLabels("g4s2-quad-04")
    ].map((label) => Number(label.replace(" cm", "")));
    expect(allLabels[0]).not.toBe(Math.min(...allLabels));
  });

  it("사다리꼴 문항은 평행한 마주 보는 변이 정확히 한 쌍이다", () => {
    for (const id of ["g4s2-quad-05", "g4s2-quad-06"]) {
      const figure = visual(id);
      expect(figure.mode).toBe("parallel-classify");
      if (figure.mode !== "parallel-classify") continue;
      expect(actualParallelSidePairs(figure.vertices), id).toEqual(
        figure.parallelSidePairs
      );
      expect(figure.parallelSidePairs, id).toHaveLength(1);
      expect(correctLabel(id)).toBe("사다리꼴");
      expect(wrongLabels(id)).toEqual(["평행사변형", "마름모"]);
    }
  });

  it("마름모 문항은 네 변이 같고 직각이 없어 오답 둘이 거짓이다", () => {
    for (const id of ["g4s2-quad-07", "g4s2-quad-08"]) {
      const figure = visual(id);
      expect(figure.mode).toBe("equal-side-classify");
      if (figure.mode !== "equal-side-classify") continue;
      expect(actualEqualSideGroups(figure.vertices), id).toEqual([
        [0, 1, 2, 3]
      ]);
      expect(actualRightAngleVertexIndexes(figure.vertices), id).toEqual(
        []
      );
      expect(correctLabel(id)).toBe("마름모");
      expect(wrongLabels(id)).toEqual(["정사각형", "직사각형"]);
    }
  });

  it("평행사변형의 마주 보는 각 정답과 오답 두 규칙을 계산한다", () => {
    for (const id of ["g4s2-quad-09", "g4s2-quad-10"]) {
      const figure = visual(id);
      expect(figure.mode).toBe("opposite-angle");
      if (figure.mode !== "opposite-angle") continue;
      const givenIndex = figure.angles.findIndex(
        (value) => value !== null
      ) as QuadrilateralIndex;
      const given = figure.angles[givenIndex]!;
      expect(figure.askAngleIndex, id).toBe(
        (givenIndex + 2) % 4
      );
      expect(correctLabel(id)).toBe(`${given}°`);
      expect(wrongLabels(id)).toEqual([
        `${180 - given}°`,
        `${360 / 4}°`
      ]);
    }
  });

  it("표시 약속은 필요한 문항에만 들어가고 작도 능력을 주장하지 않는다", () => {
    const copy = quadrilateralJudgments.map((judgment) =>
      `${judgment.context ?? ""} ${judgment.prompt}`
    ).join(" ");
    expect(copy).not.toMatch(/그려|작도|삼각자|각도기|설명해/);
    for (const judgment of quadrilateralJudgments) {
      const figure = judgment.visual;
      if (figure.kind !== "quadrilateral-figure") continue;
      if ("parallelSidePairs" in figure) {
        expect(judgment.context, judgment.id).toContain("화살표");
      }
      if (figure.mode === "side-perpendicular") {
        expect(judgment.context, judgment.id).toContain("직각 표시");
      }
      if (figure.mode === "equal-side-classify") {
        expect(judgment.context, judgment.id).toContain("같은 눈금");
      }
    }
  });
});
