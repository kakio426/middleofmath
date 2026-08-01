import { describe, expect, it } from "vitest";
import { buildPairedStages, type PairStageInput } from "./paired-stage-authoring";

const input: PairStageInput = {
  id: "sample.stage",
  unitId: "sample-unit",
  title: "표본 단계",
  shortTitle: "표본을 확인함",
  anchorIds: ["sample-anchor"],
  mistakes: [
    { id: "sample.stage.first", title: "첫 오류", derivation: "첫 번째 잘못된 절차를 적용한다.", rationale: "첫 번째 절차를 바로잡습니다." },
    { id: "sample.stage.second", title: "둘째 오류", derivation: "두 번째 잘못된 절차를 적용한다.", rationale: "두 번째 절차를 바로잡습니다." }
  ],
  cases: [
    {
      context: "첫 자료입니다.", prompt: "첫 판단은 무엇인가요?", correct: "정답 1",
      wrong: [
        { label: "둘째 오답 1", misconceptionId: "sample.stage.second" },
        { label: "첫 오답 1", misconceptionId: "sample.stage.first" }
      ]
    },
    {
      context: "둘째 자료입니다.", prompt: "둘째 판단은 무엇인가요?", correct: "정답 2",
      wrong: [
        { label: "첫 오답 2", misconceptionId: "sample.stage.first" },
        { label: "둘째 오답 2", misconceptionId: "sample.stage.second" }
      ]
    }
  ]
};

describe("paired-stage authoring", () => {
  it("오답 배열 위치가 아니라 문항별 명시 ID로 오개념을 연결한다", () => {
    const [stage] = buildPairedStages("sample", [input]);
    const first = stage.questions[0];
    expect(first.distractors.map((item) => [item.label, item.misconceptionId])).toEqual([
      ["둘째 오답 1", "sample.stage.second"],
      ["첫 오답 1", "sample.stage.first"]
    ]);
  });

  it("문항이 두 오개념을 각각 한 번씩 연결하지 않으면 거부한다", () => {
    const invalid = structuredClone(input);
    invalid.cases[0].wrong[1].misconceptionId = "sample.stage.second";
    expect(() => buildPairedStages("sample", [invalid])).toThrow(
      "Each case must map both stage misconceptions explicitly"
    );
  });
});
