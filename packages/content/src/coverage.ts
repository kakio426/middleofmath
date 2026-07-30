import type {
  ContentValidationIssue,
  ContentValidationResult,
  DiagnosisSet
} from "@middle-of-math/domain";

export type CoverageEvidenceKind = "direct" | "transfer";

export interface CoverageEvidence {
  judgmentId: string;
  kind: CoverageEvidenceKind;
}

export interface StageCoverage {
  stageId: string;
  curriculumAnchorIds: string[];
  signalIds: string[];
  evidence: CoverageEvidence[];
}

export interface DistractorRationale {
  judgmentId: string;
  choiceId: string;
  signalIds: string[];
  misconceptionId: string;
  rationale: string;
  derivation: string;
  sharedSignalRationale?: string;
}

export interface DiagnosisCoverageBlueprint {
  diagnosisSetId: string;
  blueprintRevision: string;
  enforcedFromVersion: string;
  stages: StageCoverage[];
  fallbackSignalIds: string[];
  misconceptionTitles: Record<string, string>;
  distractors: DistractorRationale[];
}

function addIssue(
  issues: ContentValidationIssue[],
  code: string,
  path: string,
  message: string
): void {
  issues.push({ code, path, message, severity: "error" });
}

function sameIds(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((id) => right.includes(id));
}

function studentCopyFingerprint(
  judgment: DiagnosisSet["judgments"][number]
): string {
  return `${judgment.context ?? ""}\n${judgment.prompt}`.replace(/\s+/g, " ").trim();
}

function studentCopyPattern(
  judgment: DiagnosisSet["judgments"][number]
): string {
  return studentCopyFingerprint(judgment)
    .replace(/\d+(?:[.,]\d+)*/g, "#")
    .replace(/[A-Z]/g, "?")
    .replace(/[★●■◆]/g, "기호")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 문제은행의 수학적 커버리지를 런타임 콘텐츠 스키마와 별도로 검사한다.
 *
 * blueprint는 문항의 출제 의도(direct/transfer)를 명시하는 편집 계약이다.
 * 이 메타데이터를 학생 런타임 payload에 넣지 않아 기존 DiagnosisSet 타입과
 * 발행 콘텐츠 소비자를 깨지 않도록 한다.
 */
export function validateCoverageBlueprint(
  content: DiagnosisSet,
  blueprint: DiagnosisCoverageBlueprint
): ContentValidationResult {
  const issues: ContentValidationIssue[] = [];
  const stages = new Map(content.learnerStages.map((stage) => [stage.id, stage]));
  const anchors = new Set(content.curriculumAnchors.map((anchor) => anchor.id));
  const signals = new Set(content.signals.map((signal) => signal.id));
  const judgments = new Map(content.judgments.map((judgment) => [judgment.id, judgment]));
  const coveredStageIds = new Set<string>();
  const coveredAnchorIds = new Set<string>();
  const coveredSignalIds = new Set<string>();
  const evidenceCounts = new Map<string, number>();

  if (blueprint.diagnosisSetId !== content.manifest.id) {
    addIssue(
      issues,
      "COVERAGE_SET_MISMATCH",
      "/diagnosisSetId",
      `콘텐츠 ID와 커버리지 ID가 다릅니다: ${blueprint.diagnosisSetId}`
    );
  }

  blueprint.stages.forEach((coverage, coverageIndex) => {
    const path = `/stages/${coverageIndex}`;
    if (coveredStageIds.has(coverage.stageId)) {
      addIssue(
        issues,
        "DUPLICATE_STAGE_COVERAGE",
        `${path}/stageId`,
        `단계 커버리지가 중복되었습니다: ${coverage.stageId}`
      );
    }
    coveredStageIds.add(coverage.stageId);

    const stage = stages.get(coverage.stageId);
    if (!stage) {
      addIssue(
        issues,
        "UNKNOWN_COVERAGE_STAGE",
        `${path}/stageId`,
        `없는 학습 단계입니다: ${coverage.stageId}`
      );
    } else if (!sameIds(coverage.curriculumAnchorIds, stage.curriculumAnchorIds)) {
      addIssue(
        issues,
        "STAGE_ANCHOR_COVERAGE_MISMATCH",
        `${path}/curriculumAnchorIds`,
        `단계의 성취기준과 커버리지 성취기준이 다릅니다: ${coverage.stageId}`
      );
    }

    for (const anchorId of coverage.curriculumAnchorIds) {
      coveredAnchorIds.add(anchorId);
      if (!anchors.has(anchorId)) {
        addIssue(
          issues,
          "UNKNOWN_COVERAGE_ANCHOR",
          `${path}/curriculumAnchorIds`,
          `없는 성취기준입니다: ${anchorId}`
        );
      }
    }

    for (const signalId of coverage.signalIds) {
      coveredSignalIds.add(signalId);
      if (!signals.has(signalId)) {
        addIssue(
          issues,
          "UNKNOWN_COVERAGE_SIGNAL",
          `${path}/signalIds`,
          `없는 관찰 신호입니다: ${signalId}`
        );
      }
    }

    const direct = coverage.evidence.filter((item) => item.kind === "direct");
    const transfer = coverage.evidence.filter((item) => item.kind === "transfer");
    const distinctEvidenceIds = new Set(coverage.evidence.map((item) => item.judgmentId));
    if (
      coverage.evidence.length < 2 ||
      distinctEvidenceIds.size < 2 ||
      direct.length === 0 ||
      transfer.length === 0
    ) {
      addIssue(
        issues,
        "DIRECT_AND_TRANSFER_REQUIRED",
        `${path}/evidence`,
        `각 단계에는 서로 다른 직접 확인 문항과 적용·전이 문항이 필요합니다: ${coverage.stageId}`
      );
    }

    const fingerprints = new Set<string>();
    const observedSignalIds = new Set<string>();
    coverage.evidence.forEach((evidence, evidenceIndex) => {
      const evidencePath = `${path}/evidence/${evidenceIndex}/judgmentId`;
      evidenceCounts.set(
        evidence.judgmentId,
        (evidenceCounts.get(evidence.judgmentId) ?? 0) + 1
      );
      const judgment = judgments.get(evidence.judgmentId);
      if (!judgment) {
        addIssue(
          issues,
          "UNKNOWN_COVERAGE_JUDGMENT",
          evidencePath,
          `없는 문항입니다: ${evidence.judgmentId}`
        );
        return;
      }
      if (judgment.learnerStageId !== coverage.stageId) {
        addIssue(
          issues,
          "JUDGMENT_STAGE_COVERAGE_MISMATCH",
          evidencePath,
          `문항이 다른 단계에 연결되어 있습니다: ${evidence.judgmentId}`
        );
      }
      if (
        judgment.curriculumAnchorIds.some(
          (anchorId) => !coverage.curriculumAnchorIds.includes(anchorId)
        )
      ) {
        addIssue(
          issues,
          "JUDGMENT_ANCHOR_COVERAGE_MISMATCH",
          evidencePath,
          `문항 성취기준이 단계 커버리지를 벗어납니다: ${evidence.judgmentId}`
        );
      }
      judgment.choices
        .filter((choice) => !choice.correct)
        .flatMap((choice) => choice.signalIds ?? [])
        .forEach((signalId) => observedSignalIds.add(signalId));

      const fingerprint = studentCopyFingerprint(judgment);
      if (fingerprints.has(fingerprint)) {
        addIssue(
          issues,
          "INDEPENDENT_EVIDENCE_REQUIRED",
          evidencePath,
          `같은 학생 문구를 반복한 문항은 독립 근거로 셀 수 없습니다: ${evidence.judgmentId}`
        );
      }
      fingerprints.add(fingerprint);
    });

    for (const directEvidence of direct) {
      const directJudgment = judgments.get(directEvidence.judgmentId);
      if (!directJudgment) continue;
      for (const transferEvidence of transfer) {
        const transferJudgment = judgments.get(transferEvidence.judgmentId);
        if (!transferJudgment) continue;
        if (studentCopyPattern(directJudgment) === studentCopyPattern(transferJudgment)) {
          addIssue(
            issues,
            "NUMERIC_COPY_NOT_TRANSFER",
            `${path}/evidence`,
            `숫자나 기호만 바꾼 문항은 적용·전이 근거로 셀 수 없습니다: ${transferEvidence.judgmentId}`
          );
        }
      }
    }

    if (!sameIds([...observedSignalIds], coverage.signalIds)) {
      addIssue(
        issues,
        "STAGE_SIGNAL_COVERAGE_MISMATCH",
        `${path}/signalIds`,
        `문항에서 관찰되는 신호와 단계 커버리지 신호가 다릅니다: ${coverage.stageId}`
      );
    }
  });

  for (const stageId of stages.keys()) {
    if (!coveredStageIds.has(stageId)) {
      addIssue(
        issues,
        "STAGE_COVERAGE_REQUIRED",
        "/stages",
        `커버리지에서 빠진 학습 단계입니다: ${stageId}`
      );
    }
  }
  for (const anchorId of anchors) {
    if (!coveredAnchorIds.has(anchorId)) {
      addIssue(
        issues,
        "ANCHOR_COVERAGE_REQUIRED",
        "/stages",
        `커버리지에서 빠진 성취기준입니다: ${anchorId}`
      );
    }
  }

  const fallbackSignalIds = new Set<string>();
  blueprint.fallbackSignalIds.forEach((signalId, index) => {
    if (fallbackSignalIds.has(signalId)) {
      addIssue(
        issues,
        "DUPLICATE_FALLBACK_SIGNAL",
        `/fallbackSignalIds/${index}`,
        `공통 신호가 중복되었습니다: ${signalId}`
      );
    }
    fallbackSignalIds.add(signalId);
    coveredSignalIds.add(signalId);
    if (!signals.has(signalId)) {
      addIssue(
        issues,
        "UNKNOWN_COVERAGE_SIGNAL",
        `/fallbackSignalIds/${index}`,
        `없는 관찰 신호입니다: ${signalId}`
      );
    }
  });
  for (const signalId of signals) {
    if (!coveredSignalIds.has(signalId)) {
      addIssue(
        issues,
        "SIGNAL_COVERAGE_REQUIRED",
        "/stages",
        `커버리지에서 빠진 관찰 신호입니다: ${signalId}`
      );
    }
  }

  for (const judgmentId of judgments.keys()) {
    const count = evidenceCounts.get(judgmentId) ?? 0;
    if (count === 0) {
      addIssue(
        issues,
        "JUDGMENT_COVERAGE_REQUIRED",
        "/stages",
        `커버리지에서 빠진 문항입니다: ${judgmentId}`
      );
    } else if (count > 1) {
      addIssue(
        issues,
        "DUPLICATE_JUDGMENT_COVERAGE",
        "/stages",
        `한 문항을 여러 근거로 중복 사용했습니다: ${judgmentId}`
      );
    }
  }

  return {
    valid: !issues.some((item) => item.severity === "error"),
    issues
  };
}
