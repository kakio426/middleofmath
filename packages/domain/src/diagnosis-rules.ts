import type {
  DiagnosisFinding,
  EvidenceItem,
  ResponseStyleSummary,
  TeacherStudentReport,
  TentativeReason
} from "./types";

export const DIAGNOSIS_RULES = Object.freeze({
  version: "rules-3.0.0",
  minConfirmingJudgments: 2,
  minOpportunities: 2,
  positionStyleMinConfirmations: 5,
  positionStyleMinProvenanceCoverage: 0.8,
  positionStyleDominanceRate: 0.8,
  deliberationFloorMs: 1_500,
  fastDurationMs: 3_000,
  fallbackSignalIds: Object.freeze([
    "needs-scaffold",
    "needs-review"
  ] as const)
});

export interface InterpretedConfirmation {
  evidence: EvidenceItem;
  durationMs: number;
}

export interface ConfidenceResolutionInput {
  signalId: string;
  opportunityJudgmentIds: readonly string[];
  observations: readonly InterpretedConfirmation[];
  responseStyle: ResponseStyleSummary;
}

export function summarizeResponseStyle(
  confirmations: readonly InterpretedConfirmation[]
): ResponseStyleSummary {
  const positions = confirmations
    .map((confirmation) => confirmation.evidence.selectedChoicePosition)
    .filter((position): position is number =>
      typeof position === "number"
      && Number.isInteger(position)
      && position > 0
    );
  const positionCounts = new Map<number, number>();
  for (const position of positions) {
    positionCounts.set(position, (positionCounts.get(position) ?? 0) + 1);
  }
  const dominant = [...positionCounts.entries()].sort(
    (left, right) => right[1] - left[1] || left[0] - right[0]
  )[0];
  const confirmationCount = confirmations.length;
  const provenanceCount = positions.length;
  const provenanceCoverage = confirmationCount === 0
    ? 0
    : provenanceCount / confirmationCount;
  const dominantPosition = dominant?.[0] ?? null;
  const dominantPositionRate = dominant
    ? dominant[1] / provenanceCount
    : null;
  const fastConfirmationCount = confirmations.filter((confirmation) =>
    confirmation.evidence.firstSelectionMs !== null
    && confirmation.evidence.firstSelectionMs < DIAGNOSIS_RULES.deliberationFloorMs
    && confirmation.durationMs < DIAGNOSIS_RULES.fastDurationMs
  ).length;

  return {
    confirmationCount,
    provenanceCount,
    provenanceCoverage,
    dominantPosition,
    dominantPositionRate,
    positionStyleSuspected:
      confirmationCount >= DIAGNOSIS_RULES.positionStyleMinConfirmations
      && provenanceCoverage >= DIAGNOSIS_RULES.positionStyleMinProvenanceCoverage
      && dominantPositionRate !== null
      && dominantPositionRate >= DIAGNOSIS_RULES.positionStyleDominanceRate,
    fastConfirmationCount
  };
}

export function resolveConfidence(
  input: ConfidenceResolutionInput
): {
  confidence: "tentative" | "confirmed";
  tentativeReasons: TentativeReason[];
  confirmationRule: string;
} {
  if (input.signalId === DIAGNOSIS_RULES.fallbackSignalIds[0]) {
    const tentativeReasons: TentativeReason[] = ["uncertainty_only"];
    return {
      confidence: "tentative",
      tentativeReasons,
      confirmationRule: confirmationRuleCopy(tentativeReasons)
    };
  }
  if (input.signalId === DIAGNOSIS_RULES.fallbackSignalIds[1]) {
    const tentativeReasons: TentativeReason[] = ["data_quality"];
    return {
      confidence: "tentative",
      tentativeReasons,
      confirmationRule: confirmationRuleCopy(tentativeReasons)
    };
  }

  const observedJudgmentCount = new Set(
    input.observations.map((observation) => observation.evidence.judgmentId)
  ).size;
  const tentativeReasons: TentativeReason[] = [];
  if (input.opportunityJudgmentIds.length < DIAGNOSIS_RULES.minOpportunities) {
    tentativeReasons.push("insufficient_opportunity");
  }
  if (observedJudgmentCount < DIAGNOSIS_RULES.minConfirmingJudgments) {
    tentativeReasons.push("single_observation");
  }
  if (input.responseStyle.positionStyleSuspected) {
    tentativeReasons.push("position_style");
  }
  if (
    input.observations.length > 0
    && input.observations.every((observation) =>
      observation.evidence.firstSelectionMs !== null
      && observation.evidence.firstSelectionMs < DIAGNOSIS_RULES.deliberationFloorMs
      && observation.durationMs < DIAGNOSIS_RULES.fastDurationMs
    )
  ) {
    tentativeReasons.push("too_fast");
  }

  return {
    confidence: tentativeReasons.length === 0 ? "confirmed" : "tentative",
    tentativeReasons,
    confirmationRule: confirmationRuleCopy(tentativeReasons)
  };
}

export function confirmationRuleCopy(
  tentativeReasons: readonly TentativeReason[]
): string {
  const primary = tentativeReasons[0];
  switch (primary) {
    case "insufficient_opportunity":
      return "이 활동에는 같은 신호를 확인할 문항이 한 개뿐이었습니다.";
    case "single_observation":
      return "이 활동에서 한 번만 나타났습니다. 확정하지 않고 다시 살펴봅니다.";
    case "position_style":
      return "보기 위치를 반복해서 고른 흔적이 있어 판단 근거로 확정하지 않습니다.";
    case "too_fast":
      return "선택까지 걸린 시간이 매우 짧아 판단 근거로 확정하지 않습니다.";
    case "uncertainty_only":
      return "‘잘 모르겠어요’를 사용해 시작 발판이 필요한 상태로 봅니다.";
    case "data_quality":
      return "기록과 콘텐츠 버전을 확인해야 합니다.";
    default:
      return "서로 다른 두 문항에서 같은 신호가 나타났습니다.";
  }
}

const emptyResponseStyle = (): ResponseStyleSummary => ({
  confirmationCount: 0,
  provenanceCount: 0,
  provenanceCoverage: 0,
  dominantPosition: null,
  dominantPositionRate: null,
  positionStyleSuspected: false,
  fastConfirmationCount: 0
});

function uniqueStrings(values: unknown[]): string[] {
  return [...new Set(values.filter((value): value is string =>
    typeof value === "string"
  ))];
}

function normalizeLegacyFinding(value: unknown): DiagnosisFinding {
  const finding = value as Partial<DiagnosisFinding> & Record<string, unknown>;
  const evidence = Array.isArray(finding.evidence)
    ? finding.evidence as EvidenceItem[]
    : [];
  return {
    signalId: String(finding.signalId ?? "needs-review"),
    title: String(finding.title ?? "추가 관찰 필요"),
    severity: finding.severity === "high" || finding.severity === "medium"
      ? finding.severity
      : "low",
    evidenceCount: typeof finding.evidenceCount === "number"
      ? finding.evidenceCount
      : evidence.length,
    confidence: "tentative",
    tentativeReasons: ["data_quality"],
    opportunityCount: typeof finding.evidenceCount === "number"
      ? finding.evidenceCount
      : evidence.length,
    observedJudgmentIds: uniqueStrings(
      evidence.map((item) => item?.judgmentId)
    ),
    counterJudgmentIds: [],
    confirmationRule:
      "이전 엔진(rules-2.0.0) 해석입니다. 새 기준으로 다시 해석해야 합니다.",
    learnerStageIds: Array.isArray(finding.learnerStageIds)
      ? uniqueStrings(finding.learnerStageIds)
      : [],
    curriculumAnchorIds: Array.isArray(finding.curriculumAnchorIds)
      ? uniqueStrings(finding.curriculumAnchorIds)
      : [],
    interpretation: String(finding.interpretation ?? ""),
    teachingMove: String(finding.teachingMove ?? ""),
    parentSummary: String(finding.parentSummary ?? ""),
    homePrompt: String(finding.homePrompt ?? ""),
    evidence
  };
}

export function normalizeTeacherReport(raw: unknown): TeacherStudentReport {
  const report = raw as Partial<TeacherStudentReport> & Record<string, unknown>;
  if (
    report.engineVersion === DIAGNOSIS_RULES.version
    && Array.isArray(report.opportunities)
    && report.responseStyle
    && typeof report.confirmedFindingCount === "number"
    && typeof report.tentativeFindingCount === "number"
  ) {
    return report as TeacherStudentReport;
  }

  const evidence = Array.isArray(report.evidence)
    ? report.evidence as EvidenceItem[]
    : [];
  const findings = Array.isArray(report.findings)
    ? report.findings.map(normalizeLegacyFinding)
    : [];
  return {
    sessionId: String(report.sessionId ?? "unknown-session"),
    diagnosisSetId: String(report.diagnosisSetId ?? "unknown-diagnosis-set"),
    diagnosisSetVersion: String(report.diagnosisSetVersion ?? "unknown-version"),
    engineVersion: String(report.engineVersion ?? "rules-2.0.0"),
    generatedAt: String(report.generatedAt ?? ""),
    observedJudgmentCount: typeof report.observedJudgmentCount === "number"
      ? report.observedJudgmentCount
      : evidence.length,
    stableJudgmentCount: typeof report.stableJudgmentCount === "number"
      ? report.stableJudgmentCount
      : 0,
    uncertaintyCount: typeof report.uncertaintyCount === "number"
      ? report.uncertaintyCount
      : 0,
    findings,
    evidence,
    opportunities: [],
    confirmedFindingCount: 0,
    tentativeFindingCount: findings.length,
    responseStyle: emptyResponseStyle()
  };
}
