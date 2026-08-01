import { describe, expect, it } from "vitest";
import { diagnosisSetSchema } from "./schema";
import { grade4Semester2Diagnosis } from "./grade4-semester2";

function contentWithJudgment(
  judgmentIndex: number,
  mutate: (judgment: {
    prompt: string;
    visual: Record<string, unknown>;
  }) => void
) {
  const content = structuredClone(grade4Semester2Diagnosis) as unknown as {
    judgments: Array<{
      prompt: string;
      visual: Record<string, unknown>;
    }>;
  };
  mutate(content.judgments[judgmentIndex]);
  return content;
}

function contentWithVisual(
  judgmentIndex: number,
  mutate: (visual: Record<string, unknown>) => void
) {
  return contentWithJudgment(
    judgmentIndex,
    (judgment) => mutate(judgment.visual)
  );
}

describe("4학년 2학기 시각 계약", () => {
  it("실제 60문제의 시각 데이터를 모두 허용한다", () => {
    expect(diagnosisSetSchema.safeParse(grade4Semester2Diagnosis).success).toBe(true);
  });

  it("분수 연산 문항은 계산 근거를 먼저 보여 주는 분수막대를 쓰지 않는다", () => {
    const fractionJudgments = grade4Semester2Diagnosis.judgments.filter(
      (judgment) => judgment.unitId === "fraction-add-subtract"
    );
    expect(fractionJudgments).toHaveLength(10);
    expect(fractionJudgments.every(
      (judgment) => judgment.visual.kind === "none"
    )).toBe(true);
  });

  it("삼각형이 만들어지지 않는 세 변을 거부한다", () => {
    const result = diagnosisSetSchema.safeParse(
      contentWithVisual(0, (visual) => {
        visual.sides = [1, 2, 3];
      })
    );

    expect(result.success).toBe(false);
  });

  it("세 내각의 합이 180도가 아닌 데이터를 거부한다", () => {
    const result = diagnosisSetSchema.safeParse(
      contentWithVisual(6, (visual) => {
        visual.angles = [90, 40, 40];
      })
    );

    expect(result.success).toBe(false);
  });

  it("이등변삼각형 성질 문항은 한 같은 각만 보여 주고 다른 같은 각을 묻는다", () => {
    for (const index of [4, 5]) {
      const visual = grade4Semester2Diagnosis.judgments[index].visual;
      expect(visual.kind).toBe("triangle-figure");
      if (visual.kind !== "triangle-figure") continue;
      expect(visual.mode).toBe("side-angle");
      expect(visual.angles?.filter((angle) => angle === null)).toHaveLength(2);
      expect(visual.equalSideIndexes).toContain(visual.askIndex);
      expect(
        visual.angles?.filter((angle) => angle !== null)
      ).toHaveLength(1);
    }
  });

  it("이등변삼각형 성질을 각의 합만으로 풀 수 있게 세 번째 각을 보여 주면 거부한다", () => {
    const result = diagnosisSetSchema.safeParse(
      contentWithVisual(4, (visual) => {
        visual.angles = [null, 70, 40];
      })
    );

    expect(result.success).toBe(false);
  });

  it("물음표가 같은 두 변의 맞은편 각을 벗어나면 거부한다", () => {
    const result = diagnosisSetSchema.safeParse(
      contentWithVisual(4, (visual) => {
        visual.askIndex = 2;
      })
    );

    expect(result.success).toBe(false);
  });

  it("같은 변 표시가 같은 변을 두 번 가리키는 데이터를 거부한다", () => {
    const result = diagnosisSetSchema.safeParse(
      contentWithVisual(4, (visual) => {
        visual.equalSideIndexes = [0, 0];
      })
    );

    expect(result.success).toBe(false);
  });

  it("같은 변과 각을 다루는 그림에 숫자 변 길이가 섞이는 것을 거부한다", () => {
    const result = diagnosisSetSchema.safeParse(
      contentWithVisual(4, (visual) => {
        visual.sides = [8, 8, 6];
      })
    );

    expect(result.success).toBe(false);
  });

  it("각으로 분류하는 그림에 변 길이가 섞이는 것을 거부한다", () => {
    const result = diagnosisSetSchema.safeParse(
      contentWithVisual(6, (visual) => {
        visual.sides = [5, 6, 7];
      })
    );

    expect(result.success).toBe(false);
  });

  it("폐기한 showEqualMarks 필드가 다시 들어오는 것을 거부한다", () => {
    const result = diagnosisSetSchema.safeParse(
      contentWithVisual(0, (visual) => {
        visual.showEqualMarks = true;
      })
    );

    expect(result.success).toBe(false);
  });

  it("각으로 분류하는 그림에서 세 각이 빠진 것을 거부한다", () => {
    const result = diagnosisSetSchema.safeParse(
      contentWithVisual(6, (visual) => {
        delete visual.angles;
      })
    );

    expect(result.success).toBe(false);
  });

  it("사각형 시각의 모드에 허용되지 않은 필드가 섞이면 거부한다", () => {
    const result = diagnosisSetSchema.safeParse(
      contentWithVisual(24, (visual) => {
        visual.rightAngleVertexIndexes = [0];
      })
    );

    expect(result.success).toBe(false);
  });

  it("수직 문항에 기준 변을 읽지 않아도 되는 평행 변 단서를 넣으면 거부한다", () => {
    const result = diagnosisSetSchema.safeParse(
      contentWithVisual(20, (visual) => {
        visual.parallelSidePairs = [[1, 3]];
      })
    );

    expect(result.success).toBe(false);
  });

  it("수직 문항의 직각 표시 위치가 중복되면 거부한다", () => {
    const result = diagnosisSetSchema.safeParse(
      contentWithVisual(20, (visual) => {
        visual.rightAngleVertexIndexes = [0, 0, 2];
      })
    );

    expect(result.success).toBe(false);
  });

  it("수직 문항의 기준 변 데이터가 질문에 적힌 변과 다르면 거부한다", () => {
    const result = diagnosisSetSchema.safeParse(
      contentWithVisual(20, (visual) => {
        visual.baseSideIndex = 3;
      })
    );

    expect(result.success).toBe(false);
  });

  it("수직 문항의 질문에 기준 변 외의 다른 변 이름도 넣으면 거부한다", () => {
    const result = diagnosisSetSchema.safeParse(
      contentWithJudgment(20, (judgment) => {
        judgment.prompt = "변 ㄱㄴ과 변 ㄹㄱ 중 수직인 두 변을 골라 보세요.";
      })
    );

    expect(result.success).toBe(false);
  });

  it("수직 문항의 직각 표시가 하나뿐이거나 서로 이웃하면 거부한다", () => {
    const oneMark = diagnosisSetSchema.safeParse(
      contentWithVisual(20, (visual) => {
        visual.rightAngleVertexIndexes = [0];
      })
    );
    const adjacentMarks = diagnosisSetSchema.safeParse(
      contentWithVisual(20, (visual) => {
        visual.rightAngleVertexIndexes = [0, 1];
      })
    );

    expect(oneMark.success).toBe(false);
    expect(adjacentMarks.success).toBe(false);
  });

  it("직각 표시가 없는 각이 직각처럼 보이는 수직 문항을 거부한다", () => {
    const result = diagnosisSetSchema.safeParse(
      contentWithVisual(20, (visual) => {
        visual.vertices = [[18, 17], [22, 15], [18, 9], [15, 11]];
      })
    );

    expect(result.success).toBe(false);
  });

  it("사각형의 실제 평행 관계를 빠뜨리거나 거짓으로 표시하면 거부한다", () => {
    const missingPair = diagnosisSetSchema.safeParse(
      contentWithVisual(22, (visual) => {
        visual.parallelSidePairs = [[1, 3]];
      })
    );
    const falsePair = diagnosisSetSchema.safeParse(
      contentWithVisual(24, (visual) => {
        visual.parallelSidePairs = [[0, 2]];
      })
    );

    expect(missingPair.success).toBe(false);
    expect(falsePair.success).toBe(false);
  });

  it("좌표와 다른 변 길이 또는 거리 라벨을 거부한다", () => {
    const sideMismatch = diagnosisSetSchema.safeParse(
      contentWithVisual(22, (visual) => {
        visual.sideLengthLabels = [
          { sideIndex: 0, lengthCm: 11 },
          { sideIndex: 1, lengthCm: 14 }
        ];
      })
    );
    const distanceMismatch = diagnosisSetSchema.safeParse(
      contentWithVisual(22, (visual) => {
        visual.distanceSegment = {
          fromVertexIndex: 0,
          toSideIndex: 1,
          lengthCm: 7
        };
      })
    );

    expect(sideMismatch.success).toBe(false);
    expect(distanceMismatch.success).toBe(false);
  });

  it("분류 문항에 실제 직각이 있거나 같은 네 변 표시가 빠지면 거부한다", () => {
    const hiddenRightAngle = diagnosisSetSchema.safeParse(
      contentWithVisual(24, (visual) => {
        visual.vertices = [[0, 8], [0, 0], [12, 0], [8, 8]];
        visual.parallelSidePairs = [[1, 3]];
      })
    );
    const incompleteEqualMarks = diagnosisSetSchema.safeParse(
      contentWithVisual(26, (visual) => {
        visual.equalSideGroups = [[0, 1, 2]];
      })
    );

    expect(hiddenRightAngle.success).toBe(false);
    expect(incompleteEqualMarks.success).toBe(false);
  });

  it("마주 보는 각의 물음표가 주어진 각의 반대편을 벗어나면 거부한다", () => {
    const result = diagnosisSetSchema.safeParse(
      contentWithVisual(28, (visual) => {
        visual.askAngleIndex = 2;
      })
    );

    expect(result.success).toBe(false);
  });

  it("사각형 시각의 알 수 없는 키와 자기 교차 좌표를 거부한다", () => {
    const unknownKey = diagnosisSetSchema.safeParse(
      contentWithVisual(20, (visual) => {
        visual.answer = "변 ㄷㄹ";
      })
    );
    const crossed = diagnosisSetSchema.safeParse(
      contentWithVisual(24, (visual) => {
        visual.vertices = [[0, 0], [12, 12], [0, 12], [12, 0]];
      })
    );

    expect(unknownKey.success).toBe(false);
    expect(crossed.success).toBe(false);
  });
});
