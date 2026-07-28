import type {
  ContentValidationIssue,
  ContentValidationResult,
  DiagnosisSet
} from "@middle-of-math/domain";
import { z } from "zod";

export const SUPPORTED_INTERACTIONS = [
  "choice@1",
  "fraction-bar@1",
  "measurement@1",
  "pictograph@1"
] as const;

const supportedInteractions = new Set<string>(SUPPORTED_INTERACTIONS);

const nonBlankString = z.string().min(1).refine((value) => value.trim().length > 0, "빈 문자열일 수 없습니다.");
const nonEmptyId = nonBlankString.refine((value) => value === value.trim(), "ID 앞뒤에는 공백을 둘 수 없습니다.");

function createDiagnosisSetSchema(copyString: z.ZodType<string>) {
  const choiceSchema = z.strictObject({
    id: nonEmptyId,
    label: copyString,
    correct: z.boolean(),
    signalIds: z.array(nonEmptyId).optional()
  });

  const visualSchema = z.discriminatedUnion("kind", [
    z.strictObject({ kind: z.literal("none") }),
    z.strictObject({
      kind: z.literal("array"),
      rows: z.number().int().positive(),
      columns: z.number().int().positive(),
      label: z.string()
    }),
    z.strictObject({
      kind: z.literal("item-collection"),
      ariaLabel: copyString,
      items: z.array(copyString).min(1)
    }),
    z.strictObject({
      kind: z.literal("data-table"),
      title: copyString,
      rows: z.array(z.strictObject({
        label: copyString,
        value: copyString
      })).min(2)
    }),
    z.strictObject({
      kind: z.literal("division-groups"),
      total: z.number().int().positive(),
      groups: z.number().int().positive()
    }),
    z.strictObject({
      kind: z.literal("circle"),
      showCenter: z.boolean().optional(),
      showRadius: z.boolean().optional(),
      showDiameter: z.boolean().optional()
    }),
    z.strictObject({
      kind: z.literal("fraction-bar"),
      numerator: z.number().int().nonnegative(),
      denominator: z.number().int().positive(),
      unknown: z.enum(["numerator", "denominator"]).optional()
    }),
    z.strictObject({
      kind: z.literal("measurement"),
      amount: z.number().nonnegative(),
      unit: z.enum(["mL", "L", "g", "kg"])
    }),
    z.strictObject({
      kind: z.literal("pictograph"),
      symbol: copyString,
      value: z.number().positive(),
      rows: z.array(z.strictObject({
        label: z.string(),
        count: z.number().int().nonnegative()
      })).min(1)
    })
  ]);

  return z.strictObject({
    manifest: z.strictObject({
      id: nonEmptyId,
      version: z.string().regex(/^\d+\.\d+\.\d+$/),
      checksum: z.string().min(8),
      title: copyString,
      shortTitle: copyString,
      grade: z.number().int().min(1).max(6),
      semester: z.union([z.literal(1), z.literal(2)]),
      curriculum: z.literal("2022-revised"),
      status: z.enum(["draft", "review", "published", "retired"]),
      units: z.array(z.strictObject({
        id: nonEmptyId,
        order: z.number().int().positive(),
        title: copyString
      })).min(1),
      interactionTypes: z.array(z.strictObject({
        type: nonEmptyId,
        version: z.number().int().positive()
      })).min(1),
      estimatedMinutes: z.number().int().positive()
    }),
    curriculumAnchors: z.array(z.strictObject({
      id: nonEmptyId,
      label: copyString,
      source: copyString
    })).min(1),
    learnerStages: z.array(z.strictObject({
      id: nonEmptyId,
      order: z.number().int().positive(),
      unitId: nonEmptyId,
      title: copyString,
      shortTitle: copyString,
      curriculumAnchorIds: z.array(nonEmptyId).min(1),
      prerequisiteStageIds: z.array(nonEmptyId)
    })).min(1),
    signals: z.array(z.strictObject({
      id: nonEmptyId,
      title: copyString,
      severity: z.enum(["low", "medium", "high"]),
      teacherInterpretation: copyString,
      teachingMove: copyString,
      parentSummary: copyString,
      homePrompt: copyString
    })).min(1),
    judgments: z.array(z.strictObject({
      id: nonEmptyId,
      unitId: nonEmptyId,
      learnerStageId: nonEmptyId,
      curriculumAnchorIds: z.array(nonEmptyId).min(1),
      prompt: copyString,
      context: z.string().optional(),
      visual: visualSchema,
      interaction: z.strictObject({
        type: nonEmptyId,
        version: z.number().int().positive(),
        config: z.record(z.string(), z.unknown()).optional()
      }),
      choices: z.array(choiceSchema).min(2)
    })).min(1)
  });
}

export const diagnosisSetSchema = createDiagnosisSetSchema(nonBlankString);
const diagnosisDraftStructureSchema = createDiagnosisSetSchema(z.string());

export interface ValidateDiagnosisSetOptions {
  baseContent?: DiagnosisSet;
}

function issue(
  issues: ContentValidationIssue[],
  code: string,
  path: string,
  message: string,
  severity: ContentValidationIssue["severity"] = "error"
): void {
  issues.push({ code, path, message, severity });
}

function checkUniqueIds(
  issues: ContentValidationIssue[],
  values: Array<{ id: string }>,
  path: string
): void {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    if (seen.has(value.id)) issue(issues, "DUPLICATE_ID", `${path}/${index}/id`, `중복 ID: ${value.id}`);
    seen.add(value.id);
  });
}

function checkPrerequisiteCycles(
  issues: ContentValidationIssue[],
  content: DiagnosisSet
): void {
  const stages = new Map(content.learnerStages.map((stage) => [stage.id, stage]));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (stageId: string): boolean => {
    if (visiting.has(stageId)) return true;
    if (visited.has(stageId)) return false;
    visiting.add(stageId);
    const cyclic = stages.get(stageId)?.prerequisiteStageIds.some(visit) ?? false;
    visiting.delete(stageId);
    visited.add(stageId);
    return cyclic;
  };

  for (const stage of content.learnerStages) {
    if (visit(stage.id)) {
      issue(issues, "PREREQUISITE_CYCLE", "/learnerStages", `선수 단계 순환 참조: ${stage.id}`);
      return;
    }
  }
}

function checkStableIds(
  issues: ContentValidationIssue[],
  content: DiagnosisSet,
  base: DiagnosisSet
): void {
  const collections: Array<[string, Array<{ id: string }>, Array<{ id: string }>]> = [
    ["units", content.manifest.units, base.manifest.units],
    ["curriculumAnchors", content.curriculumAnchors, base.curriculumAnchors],
    ["learnerStages", content.learnerStages, base.learnerStages],
    ["signals", content.signals, base.signals],
    ["judgments", content.judgments, base.judgments]
  ];
  for (const [path, current, previous] of collections) {
    const currentIds = new Set(current.map((item) => item.id));
    for (const item of previous) {
      if (!currentIds.has(item.id)) {
        issue(issues, "STABLE_ID_REMOVED", `/${path}`, `발행된 ID는 제거하거나 변경할 수 없습니다: ${item.id}`);
      }
    }
  }
  const currentJudgments = new Map(content.judgments.map((judgment) => [judgment.id, judgment]));
  for (const previousJudgment of base.judgments) {
    const current = currentJudgments.get(previousJudgment.id);
    if (!current) continue;
    const currentChoiceIds = new Set(current.choices.map((choice) => choice.id));
    for (const choice of previousJudgment.choices) {
      if (!currentChoiceIds.has(choice.id)) {
        issue(
          issues,
          "STABLE_ID_REMOVED",
          `/judgments/${previousJudgment.id}/choices`,
          `발행된 선택지 ID는 제거하거나 변경할 수 없습니다: ${choice.id}`
        );
      }
    }
  }
}

export function validateDiagnosisSet(
  input: unknown,
  options: ValidateDiagnosisSetOptions = {}
): ContentValidationResult {
  const parsed = diagnosisSetSchema.safeParse(input);
  if (!parsed.success) {
    return {
      valid: false,
      issues: parsed.error.issues.map((item) => ({
        code: "SCHEMA_INVALID",
        path: `/${item.path.join("/")}`,
        message: item.message,
        severity: "error" as const
      }))
    };
  }

  const content = parsed.data as DiagnosisSet;
  const issues: ContentValidationIssue[] = [];
  const unitIds = new Set(content.manifest.units.map((unit) => unit.id));
  const anchorIds = new Set(content.curriculumAnchors.map((anchor) => anchor.id));
  const stageIds = new Set(content.learnerStages.map((stage) => stage.id));
  const signalIds = new Set(content.signals.map((signal) => signal.id));

  checkUniqueIds(issues, content.manifest.units, "/manifest/units");
  checkUniqueIds(issues, content.curriculumAnchors, "/curriculumAnchors");
  checkUniqueIds(issues, content.learnerStages, "/learnerStages");
  checkUniqueIds(issues, content.signals, "/signals");
  checkUniqueIds(issues, content.judgments, "/judgments");

  content.learnerStages.forEach((stage, index) => {
    if (!unitIds.has(stage.unitId)) issue(issues, "UNKNOWN_UNIT", `/learnerStages/${index}/unitId`, `없는 단원 ID: ${stage.unitId}`);
    stage.curriculumAnchorIds.forEach((id) => {
      if (!anchorIds.has(id)) issue(issues, "UNKNOWN_ANCHOR", `/learnerStages/${index}/curriculumAnchorIds`, `승인되지 않은 성취기준: ${id}`);
    });
    stage.prerequisiteStageIds.forEach((id) => {
      if (!stageIds.has(id)) issue(issues, "UNKNOWN_PREREQUISITE", `/learnerStages/${index}/prerequisiteStageIds`, `없는 선수 단계: ${id}`);
    });
  });

  const studentLanguage = /오개념|진단 결과|정답은|틀렸|부족|교사용|학부모용/;
  content.judgments.forEach((judgment, index) => {
    if (!unitIds.has(judgment.unitId)) issue(issues, "UNKNOWN_UNIT", `/judgments/${index}/unitId`, `없는 단원 ID: ${judgment.unitId}`);
    if (!stageIds.has(judgment.learnerStageId)) issue(issues, "UNKNOWN_STAGE", `/judgments/${index}/learnerStageId`, `없는 학습 단계: ${judgment.learnerStageId}`);
    judgment.curriculumAnchorIds.forEach((id) => {
      if (!anchorIds.has(id)) issue(issues, "UNKNOWN_ANCHOR", `/judgments/${index}/curriculumAnchorIds`, `승인되지 않은 성취기준: ${id}`);
    });
    const interactionKey = `${judgment.interaction.type}@${judgment.interaction.version}`;
    if (!supportedInteractions.has(interactionKey)) {
      issue(issues, "UNSUPPORTED_INTERACTION", `/judgments/${index}/interaction`, `지원하지 않는 상호작용: ${interactionKey}`);
    }
    if (judgment.choices.filter((choice) => choice.correct).length !== 1) {
      issue(issues, "SINGLE_CORRECT_REQUIRED", `/judgments/${index}/choices`, "정답 선택지는 정확히 하나여야 합니다.");
    }
    if (judgment.interaction.type === "pictograph" && judgment.visual.kind !== "pictograph") {
      issue(
        issues,
        "PICTOGRAPH_VISUAL_REQUIRED",
        `/judgments/${index}/visual`,
        "그림그래프 문항에는 범례와 자료 행이 보이는 그림그래프 시각 자료가 필요합니다."
      );
    }
    if (
      judgment.learnerStageId === "pictograph.classify-table" &&
      !["item-collection", "data-table"].includes(judgment.visual.kind)
    ) {
      issue(
        issues,
        "CLASSIFY_TABLE_VISUAL_REQUIRED",
        `/judgments/${index}/visual`,
        "자료 분류·표 문항에는 셀 실제 자료 또는 표가 화면에 보여야 합니다."
      );
    }
    if (
      judgment.visual.kind === "division-groups" &&
      /몇\s*묶음/.test(judgment.prompt)
    ) {
      issue(
        issues,
        "ANSWER_REVEALING_VISUAL",
        `/judgments/${index}/visual`,
        "묶음 수를 묻는 문항에서 완성된 묶음을 미리 보여주면 정답이 노출됩니다."
      );
    }
    checkUniqueIds(issues, judgment.choices, `/judgments/${index}/choices`);
    judgment.choices.forEach((choice, choiceIndex) => {
      if (!choice.correct && (!choice.signalIds || choice.signalIds.length === 0)) {
        issue(issues, "WRONG_CHOICE_SIGNAL_REQUIRED", `/judgments/${index}/choices/${choiceIndex}/signalIds`, "오답 선택지에는 관찰 신호가 필요합니다.");
      }
      choice.signalIds?.forEach((id) => {
        if (!signalIds.has(id)) issue(issues, "UNKNOWN_SIGNAL", `/judgments/${index}/choices/${choiceIndex}/signalIds`, `없는 관찰 신호: ${id}`);
      });
    });
    const studentCopy = [judgment.context, judgment.prompt, ...judgment.choices.map((choice) => choice.label)].filter(Boolean).join(" ");
    if (studentLanguage.test(studentCopy)) {
      issue(issues, "STUDENT_LANGUAGE_LEAK", `/judgments/${index}`, "학생 문구에 진단·정오 판단 표현이 포함되어 있습니다.");
    }
  });

  content.manifest.interactionTypes.forEach((descriptor, index) => {
    const key = `${descriptor.type}@${descriptor.version}`;
    if (!supportedInteractions.has(key)) issue(issues, "UNSUPPORTED_INTERACTION", `/manifest/interactionTypes/${index}`, `지원하지 않는 상호작용: ${key}`);
  });

  checkPrerequisiteCycles(issues, content);
  if (options.baseContent) checkStableIds(issues, content, options.baseContent);

  return { valid: !issues.some((item) => item.severity === "error"), issues };
}

export function validateRecoveryDiagnosisSet(
  input: unknown,
  options: ValidateDiagnosisSetOptions = {}
): ContentValidationResult {
  const parsed = diagnosisDraftStructureSchema.safeParse(input);
  if (!parsed.success) {
    return {
      valid: false,
      issues: parsed.error.issues.map((item) => ({
        code: "SCHEMA_INVALID",
        path: `/${item.path.join("/")}`,
        message: item.message,
        severity: "error" as const
      }))
    };
  }

  const issues: ContentValidationIssue[] = [];
  if (options.baseContent) checkStableIds(issues, parsed.data as DiagnosisSet, options.baseContent);
  return { valid: !issues.some((item) => item.severity === "error"), issues };
}

export function parseDiagnosisSet(input: unknown): DiagnosisSet {
  const result = validateDiagnosisSet(input);
  if (!result.valid) {
    throw new Error(result.issues.map((item) => `${item.path}: ${item.message}`).join("\n"));
  }
  return diagnosisSetSchema.parse(input) as DiagnosisSet;
}

export const diagnosisContentValidator = {
  validate(content: unknown, baseContent?: DiagnosisSet): ContentValidationResult {
    return validateDiagnosisSet(content, { baseContent });
  },
  validateRecovery(content: unknown, baseContent?: DiagnosisSet): ContentValidationResult {
    return validateRecoveryDiagnosisSet(content, { baseContent });
  }
};
