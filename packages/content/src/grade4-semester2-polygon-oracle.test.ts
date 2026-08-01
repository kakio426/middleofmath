import { describe, expect, it } from "vitest";
import type {
  PolygonFigure,
  TileCompositionFigure
} from "@middle-of-math/domain";
import { triangleOrientationCounts } from "@middle-of-math/domain";
import {
  polygonFigureExpectedAnswer,
  polygonFigureGeometryIssues,
  tileCompositionExpectedAnswer,
  tileCompositionGeometryIssues
} from "./polygon-figure-integrity";
import { diagnosisSetSchema } from "./schema";
import { grade4Semester2Diagnosis } from "./grade4-semester2";

const polygonJudgments = grade4Semester2Diagnosis.judgments.filter(
  (judgment) => judgment.unitId === "polygons"
);

describe("4학년 2학기 다각형·모양 채우기 정답 오라클", () => {
  it("10문항의 그림·타일링 계산과 정답 선택지가 모두 일치한다", () => {
    expect(polygonJudgments).toHaveLength(10);
    for (const judgment of polygonJudgments) {
      const correct = judgment.choices.find((choice) => choice.correct)?.label;
      if (judgment.visual.kind === "polygon-figure") {
        expect(
          polygonFigureGeometryIssues(judgment.visual),
          judgment.id
        ).toEqual([]);
        expect(
          polygonFigureExpectedAnswer(judgment.visual),
          judgment.id
        ).toBe(correct);
      } else {
        expect(judgment.visual.kind, judgment.id).toBe("tile-composition");
        if (judgment.visual.kind !== "tile-composition") continue;
        expect(
          tileCompositionGeometryIssues(judgment.visual),
          judgment.id
        ).toEqual([]);
        expect(
          tileCompositionExpectedAnswer(judgment.visual),
          judgment.id
        ).toBe(correct);
      }
    }
  });

  it("굽은 선을 곧은 닫힌 선으로 바꾸어 정답이 둘이 되면 거부한다", () => {
    const content = structuredClone(grade4Semester2Diagnosis);
    const visual = content.judgments[40].visual as PolygonFigure;
    if (visual.mode === "side-count-name") throw new Error("후보 문항이어야 합니다.");
    const curved = visual.candidates.find((candidate) =>
      candidate.figure.form === "curved"
    );
    if (!curved || !("vertices" in curved.figure)) {
      throw new Error("굽은 선 후보가 필요합니다.");
    }
    curved.figure = { form: "lattice", vertices: curved.figure.vertices };

    expect(diagnosisSetSchema.safeParse(content).success).toBe(false);
  });

  it("그림으로 계산한 후보와 정답 선택지의 글자가 다르면 거부한다", () => {
    const content = structuredClone(grade4Semester2Diagnosis);
    content.judgments[40].choices[0].label = "가 도형";

    expect(diagnosisSetSchema.safeParse(content).success).toBe(false);
  });

  it("같은 넓이지만 들어가지 않는 조각 묶음을 정답으로 바꾸면 거부한다", () => {
    const content = structuredClone(grade4Semester2Diagnosis);
    const judgment = content.judgments[46];
    const visual = judgment.visual as TileCompositionFigure;
    if (visual.mode !== "fill-remaining") throw new Error("남은 자리 문항이어야 합니다.");
    judgment.choices[0].label = "가 묶음";

    expect(tileCompositionExpectedAnswer(visual)).toBe("나 묶음");
    expect(diagnosisSetSchema.safeParse(content).success).toBe(false);
  });

  it("남은 자리보다 작은 오답 묶음이 없으면 거부한다", () => {
    const content = structuredClone(grade4Semester2Diagnosis);
    const visual = content.judgments[46].visual as TileCompositionFigure;
    if (visual.mode !== "fill-remaining") throw new Error("남은 자리 문항이어야 합니다.");
    visual.candidates[2].pieces = ["rhombus", "rhombus", "rhombus"];

    expect(tileCompositionGeometryIssues(visual)).toContain(
      "오답 중 하나는 남은 자리보다 작은 조각 묶음이어야 합니다."
    );
    expect(diagnosisSetSchema.safeParse(content).success).toBe(false);
  });

  it("조각 수 direct·transfer 영역은 회전·이동으로 같은 틀이 될 수 없다", () => {
    const direct = grade4Semester2Diagnosis.judgments[48].visual;
    const transfer = grade4Semester2Diagnosis.judgments[49].visual;
    if (direct.kind !== "tile-composition" || direct.mode !== "tile-count"
      || transfer.kind !== "tile-composition" || transfer.mode !== "tile-count"
    ) throw new Error("두 조각 수 문항이 필요합니다.");

    const directOrientations = Object.values(
      triangleOrientationCounts(direct.region)
    ).sort((left, right) => left - right);
    const transferOrientations = Object.values(
      triangleOrientationCounts(transfer.region)
    ).sort((left, right) => left - right);
    expect(directOrientations).toEqual([6, 6]);
    expect(transferOrientations).toEqual([5, 7]);
    expect(directOrientations).not.toEqual(transferOrientations);
  });

  it("삼각형 칸을 중복해 넓이를 부풀린 영역은 거부한다", () => {
    const content = structuredClone(grade4Semester2Diagnosis);
    const visual = content.judgments[49].visual as TileCompositionFigure;
    if (visual.mode !== "tile-count") throw new Error("조각 수 문항이어야 합니다.");
    visual.region[1] = visual.region[0];

    expect(diagnosisSetSchema.safeParse(content).success).toBe(false);
  });
});
