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

  const measurePartSchema = z.strictObject({
    value: z.number().int().nonnegative(),
    unit: z.enum(["mL", "L", "g", "kg", "t"])
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
      mode: z.enum([
        "radius",
        "diameter",
        "equal-radii",
        "compass-center",
        "compass-radius"
      ]).optional(),
      radiusValue: z.number().positive().optional(),
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
      kind: z.literal("partition-diagrams"),
      diagrams: z.array(z.strictObject({
        label: copyString,
        parts: z.array(z.number().positive()).min(2).max(8),
        highlightedPart: z.number().int().nonnegative().optional()
      })).min(1).max(3)
    }),
    z.strictObject({
      kind: z.literal("measurement"),
      amount: z.number().nonnegative(),
      unit: z.enum(["mL", "L", "g", "kg"])
    }),
    z.strictObject({
      kind: z.literal("length-relation"),
      value: z.number().int().positive(),
      fromUnit: z.enum(["mm", "cm", "m", "km"]),
      targetUnit: z.enum(["mm", "cm", "m", "km"])
    }),
    z.strictObject({
      kind: z.literal("unit-relation"),
      medium: z.enum(["capacity", "weight"]),
      given: z.array(measurePartSchema).min(1).max(2),
      targetUnit: z.enum(["mL", "L", "g", "kg", "t"])
    }),
    z.strictObject({
      kind: z.literal("measure-referent"),
      medium: z.enum(["capacity", "weight"]),
      object: z.enum(["paper-cup", "water-bottle", "watermelon", "paper-clip"]),
      instrument: z.enum(["beaker", "scale"])
    }),
    z.strictObject({
      kind: z.literal("quantity-combine"),
      medium: z.enum(["capacity", "weight"]),
      operator: z.enum(["add", "subtract"]),
      left: z.array(measurePartSchema).min(1).max(2),
      right: z.array(measurePartSchema).min(1).max(2)
    }),
    z.strictObject({
      kind: z.literal("place-value-chart"),
      digits: z.array(z.number().int().min(0).max(9)).min(4).max(9),
      ask: z.enum(["value", "place-name"]),
      highlightIndexes: z.array(z.number().int().nonnegative())
        .min(1)
        .max(2)
        .optional()
    }),
    z.strictObject({
      kind: z.literal("angle-figure"),
      degrees: z.number().int().min(1).max(179),
      mode: z.enum(["bare", "protractor"]),
      rayLengths: z.tuple([
        z.number().int().min(20).max(120),
        z.number().int().min(20).max(120)
      ]).optional(),
      referenceRightAngle: z.boolean().optional(),
      protractorPlacement: z.enum([
        "aligned",
        "vertex-off",
        "baseline-off"
      ]).optional(),
      label: copyString.optional()
    }),
    z.strictObject({
      kind: z.literal("polygon-angle-diagram"),
      polygon: z.enum(["triangle", "quadrilateral"]),
      mode: z.enum(["find-missing", "verify-claim"]),
      angles: z.array(z.strictObject({
        label: copyString,
        value: z.number().int().min(1).max(179).nullable()
      })).min(3).max(4),
      diagonal: z.boolean().optional()
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
  ]).superRefine((visual, context) => {
    if (visual.kind === "angle-figure") {
      if (
        visual.mode === "bare"
        && visual.protractorPlacement !== undefined
      ) {
        context.addIssue({
          code: "custom",
          message: "눈금이 없는 각 그림에는 각도기 배치 상태를 지정할 수 없습니다.",
          path: ["protractorPlacement"]
        });
      }
      return;
    }
    if (visual.kind === "polygon-angle-diagram") {
      const expectedLength = visual.polygon === "triangle" ? 3 : 4;
      if (visual.angles.length !== expectedLength) {
        context.addIssue({
          code: "custom",
          message: `${visual.polygon === "triangle" ? "삼각형" : "사각형"}의 각 개수가 맞지 않습니다.`,
          path: ["angles"]
        });
      }
      const labels = visual.angles.map((angle) => angle.label);
      if (new Set(labels).size !== labels.length) {
        context.addIssue({
          code: "custom",
          message: "각의 라벨은 서로 달라야 합니다.",
          path: ["angles"]
        });
      }
      if (visual.polygon === "triangle" && visual.diagonal !== undefined) {
        context.addIssue({
          code: "custom",
          message: "삼각형에는 대각선 표시를 지정할 수 없습니다.",
          path: ["diagonal"]
        });
      }
      const unknownCount = visual.angles.filter(
        (angle) => angle.value === null
      ).length;
      if (visual.mode === "find-missing") {
        if (unknownCount !== 1) {
          context.addIssue({
            code: "custom",
            message: "빠진 각을 찾는 그림에는 물음표가 정확히 하나 있어야 합니다.",
            path: ["angles"]
          });
        } else if (visual.angles.length === expectedLength) {
          const total = visual.polygon === "triangle" ? 180 : 360;
          const knownSum = visual.angles.reduce(
            (sum, angle) => sum + (angle.value ?? 0),
            0
          );
          const missing = total - knownSum;
          if (missing < 1 || missing > 179) {
            context.addIssue({
              code: "custom",
              message: "알려진 각으로 계산한 나머지 각은 1도 이상 179도 이하여야 합니다.",
              path: ["angles"]
            });
          }
        }
      } else {
        if (unknownCount !== 0) {
          context.addIssue({
            code: "custom",
            message: "주장을 확인하는 그림에는 모든 각의 수치가 있어야 합니다.",
            path: ["angles"]
          });
        }
        const claimSum = visual.angles.reduce(
          (sum, angle) => sum + (angle.value ?? 0),
          0
        );
        const maximum =
          visual.polygon === "triangle" ? 358 : 716;
        if (claimSum > maximum) {
          context.addIssue({
            code: "custom",
            message: "주장에 표시한 각의 합이 허용 범위를 벗어납니다.",
            path: ["angles"]
          });
        }
      }
      return;
    }
    if (visual.kind === "place-value-chart") {
      if (visual.digits[0] === 0) {
        context.addIssue({
          code: "custom",
          message: "자리표의 맨 앞 숫자는 0일 수 없습니다.",
          path: ["digits", 0]
        });
      }
      const highlights = visual.highlightIndexes ?? [];
      if (new Set(highlights).size !== highlights.length) {
        context.addIssue({
          code: "custom",
          message: "강조할 자리 번호는 중복될 수 없습니다.",
          path: ["highlightIndexes"]
        });
      }
      highlights.forEach((index, highlightIndex) => {
        if (index >= visual.digits.length) {
          context.addIssue({
            code: "custom",
            message: "강조할 자리 번호가 자리표 범위를 벗어납니다.",
            path: ["highlightIndexes", highlightIndex]
          });
        }
      });
      if (visual.ask === "place-name" && highlights.length > 0) {
        context.addIssue({
          code: "custom",
          message: "자리 이름을 찾는 문항은 정답 위치를 미리 강조할 수 없습니다.",
          path: ["highlightIndexes"]
        });
      }
      if (visual.ask === "value" && highlights.length === 0) {
        context.addIssue({
          code: "custom",
          message: "자리값을 묻는 문항은 한 자리 또는 두 자리를 강조해야 합니다.",
          path: ["highlightIndexes"]
        });
      }
      return;
    }
    if (visual.kind === "partition-diagrams") {
      visual.diagrams.forEach((diagram, index) => {
        if (
          diagram.highlightedPart !== undefined
          && diagram.highlightedPart >= diagram.parts.length
        ) {
          context.addIssue({
            code: "custom",
            message: "색칠한 조각 번호가 그림의 조각 수를 벗어납니다.",
            path: ["diagrams", index, "highlightedPart"]
          });
        }
      });
      return;
    }
    if (
      visual.kind !== "unit-relation" &&
      visual.kind !== "measure-referent" &&
      visual.kind !== "quantity-combine"
    ) {
      return;
    }

    const allowedUnits = visual.medium === "capacity"
      ? new Set(["mL", "L"])
      : new Set(["g", "kg", "t"]);
    const parts = visual.kind === "unit-relation"
      ? visual.given
      : visual.kind === "quantity-combine"
        ? [...visual.left, ...visual.right]
        : [];

    for (const [index, part] of parts.entries()) {
      if (!allowedUnits.has(part.unit)) {
        context.addIssue({
          code: "custom",
          message: `${visual.medium} 그림에 맞지 않는 단위입니다.`,
          path: [visual.kind === "unit-relation" ? "given" : index < (visual.kind === "quantity-combine" ? visual.left.length : 0) ? "left" : "right"]
        });
      }
    }
    if (visual.kind === "unit-relation" && !allowedUnits.has(visual.targetUnit)) {
      context.addIssue({
        code: "custom",
        message: `${visual.medium} 그림에 맞지 않는 목표 단위입니다.`,
        path: ["targetUnit"]
      });
    }
    if (visual.kind === "measure-referent") {
      const validCapacity =
        visual.medium === "capacity" &&
        visual.instrument === "beaker" &&
        (visual.object === "paper-cup" || visual.object === "water-bottle");
      const validWeight =
        visual.medium === "weight" &&
        visual.instrument === "scale" &&
        (visual.object === "watermelon" || visual.object === "paper-clip");
      if (!validCapacity && !validWeight) {
        context.addIssue({
          code: "custom",
          message: "측정 대상과 측정 도구가 측정 종류에 맞지 않습니다."
        });
      }
    }
  });

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
