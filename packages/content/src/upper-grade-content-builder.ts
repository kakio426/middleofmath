import type {
  DiagnosisSet,
  JudgmentVisual,
  Severity
} from "@middle-of-math/domain";
import type {
  DiagnosisCoverageBlueprint,
  DistractorRationale
} from "./coverage";
import { diagnosisContentChecksum } from "./integrity-digest";
import { diagnosisSetSchema } from "./schema";

export interface UpperGradeUnitSpec {
  id: string;
  title: string;
}

export interface UpperGradeDistractorSpec {
  id: string;
  label: string;
  misconceptionId: string;
  derivation: string;
  rationale: string;
}

export interface UpperGradeQuestionSpec {
  id: string;
  context: string;
  prompt: string;
  visual?: JudgmentVisual;
  correct: { id: string; label: string };
  distractors: [UpperGradeDistractorSpec, UpperGradeDistractorSpec];
}

export interface UpperGradeStageSpec {
  id: string;
  unitId: string;
  title: string;
  shortTitle: string;
  anchorIds: string[];
  prerequisiteStageIds?: string[];
  severity?: Severity;
  teachingMove: string;
  homePrompt: string;
  misconceptions: [
    { id: string; title: string },
    { id: string; title: string }
  ];
  questions: [UpperGradeQuestionSpec, UpperGradeQuestionSpec];
}

export interface UpperGradeSemesterSpec {
  id: string;
  version: string;
  grade: 5 | 6;
  semester: 1 | 2;
  title: string;
  shortTitle: string;
  blueprintRevision: string;
  anchors: Array<{ id: string; label: string; source: string }>;
  units: UpperGradeUnitSpec[];
  stages: UpperGradeStageSpec[];
}

export interface UpperGradeSemesterArtifacts {
  diagnosis: DiagnosisSet;
  coverageBlueprint: DiagnosisCoverageBlueprint;
  distractorRationales: DistractorRationale[];
  misconceptionTitles: Record<string, string>;
}

function assertAuthoringContract(spec: UpperGradeSemesterSpec): void {
  const unitIds = new Set(spec.units.map((unit) => unit.id));
  const stageIds = new Set(spec.stages.map((stage) => stage.id));
  const anchorIds = new Set(spec.anchors.map((anchor) => anchor.id));
  const authoredIds = new Set<string>();
  for (const stage of spec.stages) {
    if (!unitIds.has(stage.unitId)) throw new Error(`Unknown unit: ${stage.unitId}`);
    if (stage.anchorIds.some((anchorId) => !anchorIds.has(anchorId))) {
      throw new Error(`Unknown anchor in ${stage.id}`);
    }
    if ((stage.prerequisiteStageIds ?? []).some((stageId) => !stageIds.has(stageId))) {
      throw new Error(`Unknown prerequisite in ${stage.id}`);
    }
    const expectedMisconceptions = new Set(stage.misconceptions.map((item) => item.id));
    for (const question of stage.questions) {
      for (const id of [question.id, question.correct.id, ...question.distractors.map((item) => item.id)]) {
        if (authoredIds.has(id)) throw new Error(`Duplicate authored id: ${id}`);
        authoredIds.add(id);
      }
      const actualMisconceptions = new Set(
        question.distractors.map((item) => item.misconceptionId)
      );
      if (
        actualMisconceptions.size !== 2
        || [...expectedMisconceptions].some((id) => !actualMisconceptions.has(id))
      ) {
        throw new Error(`Both misconceptions must repeat in ${question.id}`);
      }
      for (const distractor of question.distractors) {
        if (distractor.derivation.length < 12 || distractor.rationale.length < 12) {
          throw new Error(`Distractor evidence is too short: ${question.id}/${distractor.id}`);
        }
      }
    }
  }
}

export function buildUpperGradeSemester(
  spec: UpperGradeSemesterSpec
): UpperGradeSemesterArtifacts {
  assertAuthoringContract(spec);
  const publishedChoiceIds = new Map<string, string>();
  spec.stages.forEach((stage, stageIndex) => stage.questions.forEach(
    (question, questionIndex) => {
      const slot = (stageIndex * 2 + questionIndex) % 3;
      const suffixes = ["a", "b", "c"];
      publishedChoiceIds.set(question.correct.id, `${question.id}-${suffixes[slot]}`);
      question.distractors.forEach((distractor, distractorIndex) => {
        publishedChoiceIds.set(
          distractor.id,
          `${question.id}-${suffixes[(slot + distractorIndex + 1) % 3]}`
        );
      });
    }
  ));
  const misconceptionTitles = Object.fromEntries(
    spec.stages.flatMap((stage) => stage.misconceptions.map(
      (misconception) => [misconception.id, misconception.title]
    ))
  );
  const distractorRationales: DistractorRationale[] = spec.stages.flatMap(
    (stage) => stage.questions.flatMap((question) => question.distractors.map(
      (distractor) => ({
        judgmentId: question.id,
        choiceId: publishedChoiceIds.get(distractor.id)!,
        signalIds: [stage.id],
        misconceptionId: distractor.misconceptionId,
        derivation: `${distractor.derivation} '${question.prompt}'에서 그 결과 ${distractor.label}이라고 판단한다.`,
        rationale: `${distractor.rationale} '${question.context}'에서 '${question.prompt}'을 풀 때 ${distractor.label}과 ${question.correct.label}을 구별합니다.`,
        sharedSignalRationale: `${stage.title}에서 같은 계산 또는 판단 전략이 두 문항에 반복되는지 확인해야 합니다.`
      })
    ))
  );
  const unsigned: DiagnosisSet = {
    manifest: {
      id: spec.id,
      version: spec.version,
      checksum: "",
      title: spec.title,
      shortTitle: spec.shortTitle,
      grade: spec.grade,
      semester: spec.semester,
      curriculum: "2022-revised",
      status: "review",
      units: spec.units.map((unit, index) => ({ ...unit, order: index + 1 })),
      interactionTypes: [{ type: "choice", version: 1 }],
      estimatedMinutes: Math.ceil(spec.stages.length)
    },
    curriculumAnchors: spec.anchors,
    learnerStages: spec.stages.map((stage, index) => ({
      id: stage.id,
      order: index + 1,
      unitId: stage.unitId,
      title: stage.title,
      shortTitle: stage.shortTitle,
      curriculumAnchorIds: stage.anchorIds,
      prerequisiteStageIds: stage.prerequisiteStageIds ?? []
    })),
    signals: spec.stages.map((stage) => ({
      id: stage.id,
      title: stage.shortTitle,
      severity: stage.severity ?? "high",
      teacherInterpretation: `${stage.title}에서 같은 오답 전략이 두 문항에 반복되는지 확인할 필요가 있습니다.`,
      teachingMove: stage.teachingMove,
      parentSummary: `${stage.shortTitle}을 차근차근 연습하고 있습니다.`,
      homePrompt: stage.homePrompt
    })),
    judgments: spec.stages.flatMap((stage) => stage.questions.map((question) => ({
      id: question.id,
      unitId: stage.unitId,
      learnerStageId: stage.id,
      curriculumAnchorIds: stage.anchorIds,
      context: question.context,
      prompt: question.prompt,
      visual: question.visual ?? { kind: "none" },
      interaction: { type: "choice", version: 1 },
      choices: [
        {
          ...question.correct,
          id: publishedChoiceIds.get(question.correct.id)!,
          correct: true
        },
        ...question.distractors.map((distractor) => ({
          id: publishedChoiceIds.get(distractor.id)!,
          label: distractor.label,
          correct: false,
          signalIds: [stage.id]
        }))
      ]
    })))
  };
  unsigned.manifest.checksum = diagnosisContentChecksum(unsigned);
  const diagnosis = diagnosisSetSchema.parse(unsigned) as DiagnosisSet;
  const coverageBlueprint: DiagnosisCoverageBlueprint = {
    diagnosisSetId: spec.id,
    blueprintRevision: spec.blueprintRevision,
    enforcedFromVersion: spec.version,
    stages: spec.stages.map((stage) => ({
      stageId: stage.id,
      curriculumAnchorIds: stage.anchorIds,
      signalIds: [stage.id],
      evidence: [
        { judgmentId: stage.questions[0].id, kind: "direct" },
        { judgmentId: stage.questions[1].id, kind: "transfer" }
      ]
    })),
    fallbackSignalIds: [],
    misconceptionTitles,
    distractors: distractorRationales
  };
  return {
    diagnosis,
    coverageBlueprint,
    distractorRationales,
    misconceptionTitles
  };
}
