import {
  analyzePresentationBalance,
  type ContentValidationGateAttestation,
  type ContentValidationIssue,
  type ContentValidationResult,
  type DiagnosisSet
} from "@middle-of-math/domain";
import { findCoverageBlueprint } from "./blueprint-registry";
import {
  inspectCurriculumCrosswalk,
  type CurriculumCrosswalkProvenance
} from "./curriculum-crosswalk";
import {
  validateCoverageBlueprint,
  type DiagnosisCoverageBlueprint,
  type DistractorRationale
} from "./coverage";
import { grade3Semester1Diagnosis } from "./grade3-semester1";
import { grade3Semester2CompleteDiagnosis } from "./grade3-semester2-complete";
import { inspectGrade4PlacementApproval } from "./grade4-placement-approval";
import {
  findStagePrerequisiteGraph,
  registeredStagePrerequisiteGraphs,
  requiresStagePrerequisiteGraph,
  type StagePrerequisiteGraph
} from "./stage-prerequisite-graph";
import { inspectStagePrerequisiteGraph } from "./stage-prerequisite-graph-integrity";

export const DIAGNOSTIC_INTEGRITY_GATE_VERSION = "gate-1.0.0";

export interface DiagnosticIntegrityOptions {
  blueprint?: DiagnosisCoverageBlueprint;
  presentationSampleCount?: number;
  stagePrerequisiteGraph?: StagePrerequisiteGraph | null;
}

interface DiagnosticIntegrityInput {
  content: DiagnosisSet;
  setKey: string;
  targetVersion: string;
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

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeCopy(value: string): string {
  return normalizeWhitespace(value)
    .toLocaleLowerCase("ko-KR")
    .replace(/[“”‘’"'`]/g, "");
}

function compactCopy(value: string): string {
  return normalizeCopy(value).replace(/[\s.,!?()[\]{}:;·]/g, "");
}

function hasMechanisticDerivation(value: string): boolean {
  return /[0-9]|[+\-−×÷=/]/.test(value)
    || /(으?로|라고) (판단|취급)/.test(normalizeWhitespace(value));
}

function normalizeIds(ids: readonly string[] | undefined): string {
  return [...(ids ?? [])].sort().join("\u0000");
}

function parseVersion(version: string): [number, number, number] | null {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

function versionAtLeast(version: string, floor: string): boolean {
  const current = parseVersion(version);
  const minimum = parseVersion(floor);
  if (!current || !minimum) return true;
  for (let index = 0; index < 3; index += 1) {
    if (current[index] !== minimum[index]) return current[index] > minimum[index];
  }
  return true;
}

function createAttestation(
  input: DiagnosticIntegrityInput,
  blueprintRevision: string | null,
  enforced: boolean,
  issues: ContentValidationIssue[],
  provenance: CurriculumCrosswalkProvenance | null,
  stageGraph: { graphRevision: string | null; graphDigest: string | null } | null = null
): ContentValidationGateAttestation {
  const errorCount = issues.filter((item) => item.severity === "error").length;
  const warningCount = issues.filter((item) => item.severity === "warning").length;
  return {
    gate: "diagnostic-integrity",
    gateVersion: DIAGNOSTIC_INTEGRITY_GATE_VERSION,
    policy: enforced ? "enforce" : "warn",
    enforced,
    setKey: input.setKey,
    targetVersion: input.targetVersion,
    blueprintRevision,
    valid: errorCount === 0,
    errorCount,
    warningCount,
    ...(provenance ?? {}),
    ...(stageGraph?.graphRevision ? { graphRevision: stageGraph.graphRevision } : {}),
    ...(stageGraph?.graphDigest ? { graphDigest: stageGraph.graphDigest } : {})
  };
}

function result(
  input: DiagnosticIntegrityInput,
  blueprintRevision: string | null,
  enforced: boolean,
  issues: ContentValidationIssue[],
  provenance: CurriculumCrosswalkProvenance | null = null,
  stageGraph: { graphRevision: string | null; graphDigest: string | null } | null = null
): ContentValidationResult {
  const gate = createAttestation(
    input,
    blueprintRevision,
    enforced,
    issues,
    provenance,
    stageGraph
  );
  return {
    valid: gate.valid,
    issues,
    gates: [gate]
  };
}

function nonEnforcedResult(
  input: DiagnosticIntegrityInput,
  blueprintRevision: string | null,
  additionalIssues: readonly ContentValidationIssue[] = []
): ContentValidationResult {
  const issues: ContentValidationIssue[] = [...additionalIssues];
  issue(
    issues,
    "DI_GATE_NOT_ENFORCED",
    "/",
    "이 발행 버전에는 진단 무결성 게이트가 아직 적용되지 않습니다.",
    "warning"
  );
  return result(input, blueprintRevision, false, issues);
}

function isValidMisconceptionId(value: string): boolean {
  return /^[a-z0-9][a-z0-9.-]*$/.test(value);
}

function matchingRationales(
  entries: readonly DistractorRationale[],
  judgmentId: string,
  choiceId: string
): Array<{ entry: DistractorRationale; index: number }> {
  return entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) =>
      entry.judgmentId === judgmentId && entry.choiceId === choiceId
    );
}

export function inspectDiagnosticIntegrity(
  input: DiagnosticIntegrityInput,
  options: DiagnosticIntegrityOptions = {}
): ContentValidationResult {
  const placementIssues = inspectGrade4PlacementApproval(input.content, {
    setKey: input.setKey
  });
  const explicitlyOverridden = Object.prototype.hasOwnProperty.call(options, "blueprint");
  const registeredBlueprint = findCoverageBlueprint(input.setKey);
  const blueprint = explicitlyOverridden ? options.blueprint : registeredBlueprint;

  if (!blueprint) {
    if (
      registeredBlueprint
      && versionAtLeast(input.targetVersion, registeredBlueprint.enforcedFromVersion)
    ) {
      const issues: ContentValidationIssue[] = [...placementIssues];
      issue(
        issues,
        "DI_BLUEPRINT_MISSING",
        "/",
        `진단 무결성 블루프린트를 찾을 수 없습니다: ${input.setKey}`
      );
      return result(input, null, true, issues);
    }
    return nonEnforcedResult(input, null, placementIssues);
  }

  if (!versionAtLeast(input.targetVersion, blueprint.enforcedFromVersion)) {
    return nonEnforcedResult(
      input,
      blueprint.blueprintRevision || null,
      placementIssues
    );
  }

  const crosswalk = inspectCurriculumCrosswalk(input, {
    required: Boolean(registeredBlueprint)
  });
  const stageGraphOverridden = Object.prototype.hasOwnProperty.call(
    options,
    "stagePrerequisiteGraph"
  );
  const registeredStageGraph = findStagePrerequisiteGraph(input.setKey);
  const stageGraphInput = stageGraphOverridden
    ? options.stagePrerequisiteGraph ?? null
    : registeredStageGraph ?? null;
  const stageGraph = requiresStagePrerequisiteGraph(input.setKey)
    ? inspectStagePrerequisiteGraph({
        graph: stageGraphInput,
        sourceSetKey: input.setKey,
        sets: {
          "grade3-semester1": grade3Semester1Diagnosis,
          "grade3-semester2": grade3Semester2CompleteDiagnosis
        },
        peerGraphs: registeredStagePrerequisiteGraphs()
      })
    : null;
  const issues = [
    ...placementIssues,
    ...crosswalk.issues,
    ...(stageGraph?.issues ?? []),
    ...validateCoverageBlueprint(input.content, blueprint).issues
  ];
  if (!blueprint.blueprintRevision.trim()) {
    issue(
      issues,
      "DI_BLUEPRINT_REVISION_MISSING",
      "/blueprint/blueprintRevision",
      "블루프린트 리비전이 필요합니다."
    );
  }

  const judgments = new Map(
    input.content.judgments.map((judgment, index) => [
      judgment.id,
      { judgment, index }
    ])
  );
  const validRationales = new Map<
    string,
    { entry: DistractorRationale; index: number }
  >();
  const seenRationaleKeys = new Set<string>();
  const signals = new Map(
    input.content.signals.map((signal) => [signal.id, signal])
  );
  const rationaleCopies = new Map<string, number>();
  const derivationCopies = new Map<string, number>();
  const sharedRationalesByStage = new Map<string, Set<string>>();
  const sharedRationaleStages = new Map<string, Set<string>>();

  blueprint.distractors.forEach((entry, index) => {
    const key = `${entry.judgmentId}\u0000${entry.choiceId}`;
    const judgmentRecord = judgments.get(entry.judgmentId);
    const choice = judgmentRecord?.judgment.choices.find(
      (candidate) => candidate.id === entry.choiceId
    );
    if (seenRationaleKeys.has(key) || !judgmentRecord || !choice || choice.correct) {
      issue(
        issues,
        "DI_DISTRACTOR_RATIONALE_ORPHAN",
        `/blueprint/distractors/${index}`,
        `오답과 연결되지 않는 근거 항목입니다: ${entry.judgmentId}/${entry.choiceId}`
      );
    } else {
      validRationales.set(key, { entry, index });
    }
    seenRationaleKeys.add(key);

    if (choice && normalizeIds(entry.signalIds) !== normalizeIds(choice.signalIds)) {
      issue(
        issues,
        "DI_DISTRACTOR_SIGNAL_MISMATCH",
        `/blueprint/distractors/${index}/signalIds`,
        "오답 근거의 신호가 실제 선택지 신호와 다릅니다."
      );
    }
    if (!isValidMisconceptionId(entry.misconceptionId.trim())) {
      issue(
        issues,
        "DI_MISCONCEPTION_ID_REQUIRED",
        `/blueprint/distractors/${index}/misconceptionId`,
        "소문자 영문·숫자·점·하이픈으로 된 오개념 ID가 필요합니다."
      );
    }
    if (
      judgmentRecord
      && !entry.misconceptionId.startsWith(
        `${judgmentRecord.judgment.learnerStageId}.`
      )
    ) {
      issue(
        issues,
        "DI_MISCONCEPTION_ID_SCOPE",
        `/blueprint/distractors/${index}/misconceptionId`,
        "오개념 ID는 문항의 학습 단계 ID로 시작해야 합니다."
      );
    }
    const misconceptionTitle =
      blueprint.misconceptionTitles[entry.misconceptionId]?.trim();
    if (!misconceptionTitle || misconceptionTitle.length < 2) {
      issue(
        issues,
        "DI_MISCONCEPTION_TITLE_MISSING",
        `/blueprint/distractors/${index}/misconceptionId`,
        "오개념 ID에 대응하는 검수용 제목이 필요합니다."
      );
    }
    if (entry.rationale.trim().length < 10) {
      issue(
        issues,
        "DI_RATIONALE_TOO_SHORT",
        `/blueprint/distractors/${index}/rationale`,
        "오답 근거는 10자 이상으로 작성해야 합니다."
      );
    }
    if (entry.derivation.trim().length < 10) {
      issue(
        issues,
        "DI_DERIVATION_TOO_SHORT",
        `/blueprint/distractors/${index}/derivation`,
        "오답이 만들어지는 과정을 10자 이상으로 작성해야 합니다."
      );
    }

    const rationaleCopy = normalizeCopy(entry.rationale);
    const derivationCopy = normalizeCopy(entry.derivation);
    const previousRationale = rationaleCopies.get(rationaleCopy);
    const previousDerivation = derivationCopies.get(derivationCopy);
    if (previousRationale !== undefined || previousDerivation !== undefined) {
      issue(
        issues,
        "DI_RATIONALE_DUPLICATED",
        `/blueprint/distractors/${index}`,
        "각 오답의 근거와 생성 과정은 다른 오답을 복사하지 않고 독립적으로 작성해야 합니다."
      );
    }
    rationaleCopies.set(rationaleCopy, index);
    derivationCopies.set(derivationCopy, index);

    if (!hasMechanisticDerivation(entry.derivation)) {
      issue(
        issues,
        "DI_DERIVATION_NOT_MECHANISTIC",
        `/blueprint/distractors/${index}/derivation`,
        "생성 과정에는 계산식 또는 잘못 적용한 판단 규칙이 드러나야 합니다."
      );
    }

    const signalTeacherCopy = entry.signalIds
      .map((signalId) => signals.get(signalId)?.teacherInterpretation ?? "")
      .map(normalizeCopy)
      .filter(Boolean);
    if (
      signalTeacherCopy.some(
        (teacherCopy) =>
          teacherCopy === rationaleCopy || teacherCopy.includes(rationaleCopy)
      )
    ) {
      issue(
        issues,
        "DI_RATIONALE_COPIED_FROM_SIGNAL",
        `/blueprint/distractors/${index}/rationale`,
        "오답 근거를 신호의 교사 해석 문구에서 그대로 가져올 수 없습니다."
      );
    }

    if (choice) {
      const compactRationale = compactCopy(entry.rationale);
      const compactChoice = compactCopy(choice.label);
      const wordsWithoutChoice = normalizeWhitespace(entry.rationale)
        .replace(choice.label, "")
        .split(/\s+/)
        .filter(Boolean);
      if (
        compactRationale === compactChoice
        || (
          compactChoice.length > 0
          && compactRationale.includes(compactChoice)
          && wordsWithoutChoice.length <= 2
        )
      ) {
        issue(
          issues,
          "DI_RATIONALE_RESTATES_CHOICE",
          `/blueprint/distractors/${index}/rationale`,
          "오답 근거는 선택지 문구를 되풀이하지 말고 수학적 판단을 설명해야 합니다."
        );
      }
    }

    const sharedRationale = normalizeCopy(entry.sharedSignalRationale ?? "");
    const stageId = judgmentRecord?.judgment.learnerStageId;
    if (stageId && sharedRationale) {
      const stageRationales =
        sharedRationalesByStage.get(stageId) ?? new Set<string>();
      stageRationales.add(sharedRationale);
      sharedRationalesByStage.set(stageId, stageRationales);
      const stagesForRationale =
        sharedRationaleStages.get(sharedRationale) ?? new Set<string>();
      stagesForRationale.add(stageId);
      sharedRationaleStages.set(sharedRationale, stagesForRationale);
    }
  });

  for (const [stageId, sharedRationales] of sharedRationalesByStage) {
    if (sharedRationales.size > 1) {
      issue(
        issues,
        "DI_SHARED_RATIONALE_INCONSISTENT",
        "/blueprint/distractors",
        `한 단계의 공통 신호 사용 근거가 서로 다릅니다: ${stageId}`
      );
    }
  }
  for (const [sharedRationale, stageIds] of sharedRationaleStages) {
    if (stageIds.size > 1) {
      issue(
        issues,
        "DI_SHARED_RATIONALE_INCONSISTENT",
        "/blueprint/distractors",
        `서로 다른 단계가 같은 공통 신호 사용 근거를 공유합니다: ${sharedRationale}`
      );
    }
  }

  input.content.judgments.forEach((judgment, judgmentIndex) => {
    const distractors = judgment.choices
      .map((choice, choiceIndex) => ({ choice, choiceIndex }))
      .filter(({ choice }) => !choice.correct);
    const labels = new Map<string, number>();

    judgment.choices.forEach((choice) => {
      const normalized = normalizeWhitespace(choice.label);
      labels.set(normalized, (labels.get(normalized) ?? 0) + 1);
    });
    if ([...labels.values()].some((count) => count > 1)) {
      issue(
        issues,
        "DI_DUPLICATE_CHOICE_LABEL",
        `/judgments/${judgmentIndex}/choices`,
        "한 문항 안에 같은 선택지 문구가 중복되었습니다."
      );
    }

    const rationaleRecords = distractors.map(({ choice, choiceIndex }) => {
      const matches = matchingRationales(
        blueprint.distractors,
        judgment.id,
        choice.id
      );
      if (matches.length === 0) {
        issue(
          issues,
          "DI_DISTRACTOR_RATIONALE_REQUIRED",
          `/judgments/${judgmentIndex}/choices/${choiceIndex}/signalIds`,
          "각 오답 선택지에는 독립적인 오개념 근거가 필요합니다."
        );
      }
      for (const fallbackId of blueprint.fallbackSignalIds) {
        if (choice.signalIds?.includes(fallbackId)) {
          issue(
            issues,
            "DI_FALLBACK_SIGNAL_REFERENCED",
            `/judgments/${judgmentIndex}/choices/${choiceIndex}/signalIds`,
            `엔진 전용 공통 신호를 오답에 직접 연결할 수 없습니다: ${fallbackId}`
          );
        }
      }
      return matches[0];
    }).filter(
      (record): record is { entry: DistractorRationale; index: number } =>
        Boolean(record)
    );

    for (let left = 0; left < rationaleRecords.length; left += 1) {
      for (let right = left + 1; right < rationaleRecords.length; right += 1) {
        const leftRecord = rationaleRecords[left];
        const rightRecord = rationaleRecords[right];
        if (
          leftRecord.entry.misconceptionId !== rightRecord.entry.misconceptionId
          && normalizeIds(leftRecord.entry.signalIds)
            === normalizeIds(rightRecord.entry.signalIds)
          && (leftRecord.entry.sharedSignalRationale?.trim().length ?? 0) < 10
          && (rightRecord.entry.sharedSignalRationale?.trim().length ?? 0) < 10
        ) {
          issue(
            issues,
            "DI_SIGNAL_CANNOT_SEPARATE_MISCONCEPTIONS",
            `/judgments/${judgmentIndex}/choices`,
            "서로 다른 오개념을 같은 신호로 기록하려면 공통 신호 사용 근거가 필요합니다."
          );
        }
        if (
          leftRecord.entry.misconceptionId === rightRecord.entry.misconceptionId
          && normalizeWhitespace(leftRecord.entry.derivation)
            === normalizeWhitespace(rightRecord.entry.derivation)
        ) {
          issue(
            issues,
            "DI_UNJUSTIFIED_DUPLICATE_DISTRACTOR",
            `/judgments/${judgmentIndex}/choices`,
            "같은 오개념에서 똑같이 만들어진 오답을 중복 제시할 수 없습니다."
          );
        }
      }
    }
  });

  input.content.learnerStages.forEach((stage, stageIndex) => {
    const misconceptionIds = new Set<string>();
    const judgmentIdsByMisconception = new Map<string, Set<string>>();
    for (const judgment of input.content.judgments) {
      if (judgment.learnerStageId !== stage.id) continue;
      for (const choice of judgment.choices) {
        if (choice.correct) continue;
        const rationale = validRationales.get(
          `${judgment.id}\u0000${choice.id}`
        );
        if (rationale?.entry.misconceptionId.trim()) {
          const misconceptionId =
            rationale.entry.misconceptionId.trim();
          misconceptionIds.add(misconceptionId);
          const judgmentIds =
            judgmentIdsByMisconception.get(misconceptionId)
            ?? new Set<string>();
          judgmentIds.add(judgment.id);
          judgmentIdsByMisconception.set(
            misconceptionId,
            judgmentIds
          );
        }
      }
    }
    if (misconceptionIds.size < 2) {
      issue(
        issues,
        "DI_STAGE_MISCONCEPTION_DISCRIMINATION_REQUIRED",
        `/learnerStages/${stageIndex}`,
        "각 학습 단계에서 서로 다른 오개념을 적어도 2가지 구분할 수 있어야 합니다."
      );
    }
    for (const [misconceptionId, judgmentIds] of
      judgmentIdsByMisconception) {
      if (judgmentIds.size < 2) {
        issue(
          issues,
          "DI_MISCONCEPTION_EVIDENCE_REPETITION_REQUIRED",
          `/learnerStages/${stageIndex}`,
          `각 오개념은 서로 다른 직접·전이 문항에서 반복 관찰할 수 있어야 합니다: ${misconceptionId}`
        );
      }
    }
  });

  const judgmentsBySignal = new Map<string, Set<string>>();
  input.content.judgments.forEach((judgment) => {
    judgment.choices.filter((choice) => !choice.correct).forEach((choice) => {
      choice.signalIds?.forEach((signalId) => {
        const judgmentIds = judgmentsBySignal.get(signalId) ?? new Set<string>();
        judgmentIds.add(judgment.id);
        judgmentsBySignal.set(signalId, judgmentIds);
      });
    });
  });
  input.content.signals.forEach((signal, signalIndex) => {
    if (
      !blueprint.fallbackSignalIds.includes(signal.id)
      && (judgmentsBySignal.get(signal.id)?.size ?? 0) < 2
    ) {
      issue(
        issues,
        "DI_SIGNAL_NOT_CONFIRMABLE",
        `/signals/${signalIndex}`,
        "이 신호는 서로 다른 두 문항에서 확인할 수 없습니다.",
        "warning"
      );
    }
  });

  const rationalesByMisconception = new Map<
    string,
    Array<{ entry: DistractorRationale; index: number }>
  >();
  blueprint.distractors.forEach((entry, index) => {
    const records = rationalesByMisconception.get(entry.misconceptionId) ?? [];
    records.push({ entry, index });
    rationalesByMisconception.set(entry.misconceptionId, records);
  });
  for (const records of rationalesByMisconception.values()) {
    if (
      new Set(records.map(({ entry }) => normalizeIds(entry.signalIds))).size > 1
    ) {
      issue(
        issues,
        "DI_MISCONCEPTION_SIGNAL_SPLIT",
        `/blueprint/distractors/${records[0].index}/signalIds`,
        "하나의 오개념이 여러 신호 집합으로 나뉘어 집계됩니다.",
        "warning"
      );
    }
  }

  const diagnosticSignals = input.content.signals.filter(
    (signal) => !blueprint.fallbackSignalIds.includes(signal.id)
  );
  const severityCounts = new Map<string, number>();
  diagnosticSignals.forEach((signal) => {
    severityCounts.set(
      signal.severity,
      (severityCounts.get(signal.severity) ?? 0) + 1
    );
  });
  const dominantSeverityCount = Math.max(0, ...severityCounts.values());
  if (
    diagnosticSignals.length > 0
    && dominantSeverityCount / diagnosticSignals.length > 0.8
  ) {
    issue(
      issues,
      "DI_SEVERITY_UNDIFFERENTIATED",
      "/signals",
      "진단 신호의 심각도가 대부분 같아 우선순위를 구분하기 어렵습니다.",
      "warning"
    );
  }

  const balanceJudgments = input.content.judgments.flatMap((judgment) => {
    const correctChoice = judgment.choices.find((choice) => choice.correct);
    return correctChoice
      ? [{
          id: judgment.id,
          choiceIds: judgment.choices.map((choice) => choice.id),
          correctChoiceId: correctChoice.id
        }]
      : [];
  });
  const sampleCount = Math.max(1, options.presentationSampleCount ?? 128);
  const balance = analyzePresentationBalance({
    sessionIds: Array.from(
      { length: sampleCount },
      (_, index) => `gate-sample-${index.toString(16).padStart(8, "0")}`
    ),
    judgments: balanceJudgments
  });
  if (balance.maxDeviation > 0.06) {
    issue(
      issues,
      "DI_PRESENTATION_POSITION_IMBALANCE",
      "/judgments",
      "선택지 제시 위치가 허용 범위를 벗어나 치우쳤습니다."
    );
  }
  if (balance.degenerateSessions.length > 0) {
    issue(
      issues,
      "DI_PRESENTATION_SESSION_DEGENERATE",
      "/judgments",
      "일부 세션에서 선택지 위치가 한쪽에 지나치게 몰렸습니다."
    );
  }

  return result(
    input,
    blueprint.blueprintRevision || null,
    true,
    issues,
    crosswalk.provenance,
    stageGraph
  );
}

export const diagnosticIntegrityGate = {
  inspect: inspectDiagnosticIntegrity
};
