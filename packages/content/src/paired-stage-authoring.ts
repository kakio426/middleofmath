import type { JudgmentVisual } from "@middle-of-math/domain";
import type {
  UpperGradeQuestionSpec,
  UpperGradeStageSpec
} from "./upper-grade-content-builder";

export interface PairCase {
  context: string;
  prompt: string;
  correct: string;
  wrong: [
    { label: string; misconceptionId: string; derivation?: string },
    { label: string; misconceptionId: string; derivation?: string }
  ];
  visual?: JudgmentVisual;
}

export interface PairMistake {
  id: string;
  title: string;
  derivation: string;
  rationale: string;
}

export interface PairStageInput {
  id: string;
  unitId: string;
  title: string;
  shortTitle: string;
  anchorIds: string[];
  prerequisiteStageIds?: string[];
  mistakes: [PairMistake, PairMistake];
  cases: [PairCase, PairCase];
}

export function buildPairedStages(
  prefix: string,
  inputs: PairStageInput[]
): UpperGradeStageSpec[] {
  return inputs.map((input, index) => {
    const questions = input.cases.map((entry, caseIndex): UpperGradeQuestionSpec => {
      const id = `${prefix}-${String(index + 1).padStart(2, "0")}-${caseIndex + 1}`;
      const mistakeById = new Map(input.mistakes.map((mistake) => [mistake.id, mistake]));
      if (
        new Set(entry.wrong.map((wrong) => wrong.misconceptionId)).size !== 2
        || entry.wrong.some((wrong) => !mistakeById.has(wrong.misconceptionId))
      ) {
        throw new Error(`Each case must map both stage misconceptions explicitly: ${id}`);
      }
      return {
        id,
        context: entry.context,
        prompt: entry.prompt,
        visual: entry.visual ?? { kind: "none" },
        correct: { id: `${id}-correct`, label: entry.correct },
        distractors: entry.wrong.map((wrong, mistakeIndex) => {
          const mistake = mistakeById.get(wrong.misconceptionId)!;
          return {
            id: `${id}-d${mistakeIndex + 1}`,
            label: wrong.label,
            misconceptionId: wrong.misconceptionId,
            derivation: wrong.derivation
              ?? `${mistake.derivation} '${entry.prompt}'에서 그 결과 '${wrong.label}'을 얻는다.`,
            rationale: mistake.rationale
          };
        }) as UpperGradeQuestionSpec["distractors"]
      };
    }) as [UpperGradeQuestionSpec, UpperGradeQuestionSpec];
    return {
      id: input.id,
      unitId: input.unitId,
      title: input.title,
      shortTitle: input.shortTitle,
      anchorIds: input.anchorIds,
      prerequisiteStageIds: input.prerequisiteStageIds ?? [],
      teachingMove: "식을 그림이나 단위와 연결한 뒤, 계산 순서를 한 단계씩 말하게 하세요.",
      homePrompt: "답을 알려 주기 전에 무엇을 같게 만들거나 몇 배 했는지 설명하게 해주세요.",
      misconceptions: input.mistakes.map(({ id, title }) => ({ id, title })) as UpperGradeStageSpec["misconceptions"],
      questions
    };
  });
}
