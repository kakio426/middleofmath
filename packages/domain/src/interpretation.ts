import {
  DIAGNOSIS_RULES,
  resolveConfidence,
  summarizeResponseStyle,
  type InterpretedConfirmation
} from "./diagnosis-rules";
import {
  createDefaultInteractionRegistry,
  signalMap,
  type ExtractedJudgment,
  type InteractionRegistry
} from "./interaction-registry";
import type {
  ClassSummary,
  ClassSummaryItem,
  DiagnosisFinding,
  DiagnosisSet,
  Judgment,
  JudgmentConfirmationPayload,
  ObservationEvent,
  ParentReport,
  Severity,
  SignalOpportunity,
  TeacherStudentReport
} from "./types";

export const INTERPRETATION_ENGINE_VERSION = DIAGNOSIS_RULES.version;

const severityRank: Record<Severity, number> = { low: 1, medium: 2, high: 3 };

interface NormalizedObservation extends InterpretedConfirmation {
  event: ObservationEvent<JudgmentConfirmationPayload>;
  judgment: Judgment;
  extracted: ExtractedJudgment;
}

function compareBytes(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function uniqueInOrder(values: readonly string[]): string[] {
  return [...new Set(values)];
}

export function interpretSession(
  diagnosisSet: DiagnosisSet,
  events: ObservationEvent[],
  registry: InteractionRegistry | undefined,
  generatedAt: string
): TeacherStudentReport {
  const activeRegistry = registry ?? createDefaultInteractionRegistry();
  const judgmentById = new Map(
    diagnosisSet.judgments.map((judgment) => [judgment.id, judgment])
  );
  const judgmentOrder = new Map(
    diagnosisSet.judgments.map((judgment, index) => [judgment.id, index])
  );
  const definitions = signalMap(diagnosisSet);
  const orderedConfirmations = events
    .filter((
      event
    ): event is ObservationEvent<JudgmentConfirmationPayload> =>
      event.eventType === "judgment_confirmed"
    )
    .sort((left, right) =>
      left.clientSeq - right.clientSeq || compareBytes(left.id, right.id)
    );
  const seenJudgments = new Set<string>();
  const observations: NormalizedObservation[] = [];

  for (const event of orderedConfirmations) {
    if (!event.judgmentId || seenJudgments.has(event.judgmentId)) continue;
    seenJudgments.add(event.judgmentId);
    const judgment = judgmentById.get(event.judgmentId);
    if (!judgment) continue;
    const extracted = activeRegistry
      .get(event.interaction.type, event.interaction.version)
      .extract(event, judgment);
    observations.push({
      event,
      judgment,
      extracted,
      evidence: extracted.evidence,
      durationMs: event.payload.durationMs
    });
  }

  const evidence = observations.map((observation) => observation.evidence);
  const responseStyle = summarizeResponseStyle(observations);
  const observedStageIds = new Set(
    observations.map((observation) => observation.judgment.learnerStageId)
  );
  const opportunityIdsBySignal = new Map<string, string[]>();

  for (const judgment of diagnosisSet.judgments) {
    if (!observedStageIds.has(judgment.learnerStageId)) continue;
    const judgmentSignals = new Set(
      judgment.choices
        .filter((choice) => !choice.correct)
        .flatMap((choice) => choice.signalIds ?? [])
    );
    for (const signalId of judgmentSignals) {
      opportunityIdsBySignal.set(signalId, [
        ...(opportunityIdsBySignal.get(signalId) ?? []),
        judgment.id
      ]);
    }
  }

  const observationsBySignal = new Map<string, NormalizedObservation[]>();
  const observationsByJudgment = new Map(
    observations.map((observation) => [
      observation.judgment.id,
      observation
    ])
  );
  for (const observation of observations) {
    for (const signalId of observation.extracted.signalIds) {
      observationsBySignal.set(signalId, [
        ...(observationsBySignal.get(signalId) ?? []),
        observation
      ]);
    }
  }

  const signalIds = uniqueInOrder([
    ...diagnosisSet.signals.map((signal) => signal.id),
    ...observationsBySignal.keys()
  ]);
  const opportunities: SignalOpportunity[] = signalIds
    .map((signalId) => {
      const opportunityJudgmentIds = uniqueInOrder(
        opportunityIdsBySignal.get(signalId) ?? []
      );
      const observedJudgmentIds = uniqueInOrder(
        (observationsBySignal.get(signalId) ?? [])
          .map((observation) => observation.judgment.id)
          .sort((left, right) =>
            (judgmentOrder.get(left) ?? Number.MAX_SAFE_INTEGER)
              - (judgmentOrder.get(right) ?? Number.MAX_SAFE_INTEGER)
            || compareBytes(left, right)
          )
      );
      const counterJudgmentIds = opportunityJudgmentIds.filter(
        (judgmentId) => observationsByJudgment.get(judgmentId)?.extracted.correct
      );
      return {
        signalId,
        opportunityJudgmentIds,
        observedJudgmentIds,
        counterJudgmentIds
      };
    })
    .filter((opportunity) =>
      opportunity.opportunityJudgmentIds.length > 0
      || opportunity.observedJudgmentIds.length > 0
    );
  const opportunityBySignal = new Map(
    opportunities.map((opportunity) => [opportunity.signalId, opportunity])
  );

  const findings: DiagnosisFinding[] = [];
  for (const signalId of signalIds) {
    const definition = definitions.get(signalId);
    const signalObservations = observationsBySignal.get(signalId) ?? [];
    if (!definition || signalObservations.length === 0) continue;
    const opportunity = opportunityBySignal.get(signalId) ?? {
      signalId,
      opportunityJudgmentIds: [],
      observedJudgmentIds: uniqueInOrder(
        signalObservations.map((observation) => observation.judgment.id)
      ),
      counterJudgmentIds: []
    };
    const confidence = resolveConfidence({
      signalId,
      opportunityJudgmentIds: opportunity.opportunityJudgmentIds,
      observations: signalObservations,
      responseStyle
    });
    findings.push({
      signalId,
      title: definition.title,
      severity: definition.severity,
      evidenceCount: signalObservations.length,
      ...confidence,
      opportunityCount: opportunity.opportunityJudgmentIds.length,
      observedJudgmentIds: opportunity.observedJudgmentIds,
      counterJudgmentIds: opportunity.counterJudgmentIds,
      learnerStageIds: uniqueInOrder(
        signalObservations.map(
          (observation) => observation.judgment.learnerStageId
        )
      ),
      curriculumAnchorIds: uniqueInOrder(
        signalObservations.flatMap(
          (observation) => observation.judgment.curriculumAnchorIds
        )
      ),
      interpretation: definition.teacherInterpretation,
      teachingMove: definition.teachingMove,
      parentSummary: definition.parentSummary,
      homePrompt: definition.homePrompt,
      evidence: signalObservations.map(
        (observation) => observation.extracted.evidence
      )
    });
  }
  findings.sort((left, right) =>
    severityRank[right.severity] - severityRank[left.severity]
    || Number(right.confidence === "confirmed")
      - Number(left.confidence === "confirmed")
    || right.evidenceCount - left.evidenceCount
    || left.counterJudgmentIds.length - right.counterJudgmentIds.length
    || compareBytes(left.signalId, right.signalId)
  );

  return {
    sessionId: orderedConfirmations[0]?.sessionId ?? "unknown-session",
    diagnosisSetId: diagnosisSet.manifest.id,
    diagnosisSetVersion: diagnosisSet.manifest.version,
    engineVersion: INTERPRETATION_ENGINE_VERSION,
    generatedAt,
    observedJudgmentCount: evidence.length,
    stableJudgmentCount: observations.filter(
      (observation) => observation.extracted.correct
    ).length,
    uncertaintyCount: evidence.filter((item) => item.uncertainty).length,
    findings,
    evidence,
    opportunities,
    confirmedFindingCount: findings.filter(
      (finding) => finding.confidence === "confirmed"
    ).length,
    tentativeFindingCount: findings.filter(
      (finding) => finding.confidence === "tentative"
    ).length,
    responseStyle
  };
}

interface ClassSummaryBucket {
  item: ClassSummaryItem;
  tentativeStudentIds: Set<string>;
  unitIds: Set<string>;
}

export function generateClassSummary(
  reports: Array<{ studentId: string; report: TeacherStudentReport }>,
  inProgressStudents = 0,
  diagnosisSet?: DiagnosisSet
): ClassSummary {
  const buckets = new Map<string, ClassSummaryBucket>();
  const stageById = new Map(
    diagnosisSet?.learnerStages.map((stage) => [stage.id, stage]) ?? []
  );
  const unitById = new Map(
    diagnosisSet?.manifest.units.map((unit) => [unit.id, unit]) ?? []
  );
  const findingUnitIds = (finding: DiagnosisFinding) => uniqueInOrder(
    finding.learnerStageIds
      .map((stageId) => stageById.get(stageId)?.unitId)
      .filter((unitId): unitId is string => Boolean(
        unitId && unitById.has(unitId)
      ))
  );
  const syncUnit = (bucket: ClassSummaryBucket) => {
    if (bucket.unitIds.size !== 1) {
      delete bucket.item.unitId;
      delete bucket.item.unitTitle;
      delete bucket.item.unitOrder;
      return;
    }
    const unitId = [...bucket.unitIds][0];
    const unit = unitById.get(unitId);
    if (!unit) return;
    bucket.item.unitId = unit.id;
    bucket.item.unitTitle = unit.title;
    bucket.item.unitOrder = unit.order;
  };
  for (const { studentId, report } of reports) {
    for (const finding of report.findings) {
      const units = findingUnitIds(finding);
      const existing = buckets.get(finding.signalId);
      if (existing) {
        for (const unitId of units) existing.unitIds.add(unitId);
        syncUnit(existing);
        existing.item.evidenceCount += finding.evidenceCount;
        existing.item.studentIds = uniqueInOrder([
          ...existing.item.studentIds,
          studentId
        ]);
        existing.item.studentCount = existing.item.studentIds.length;
        if (finding.confidence === "confirmed") {
          existing.item.confirmedStudentIds = uniqueInOrder([
            ...existing.item.confirmedStudentIds,
            studentId
          ]);
        } else {
          existing.tentativeStudentIds.add(studentId);
        }
        existing.item.confirmedStudentCount =
          existing.item.confirmedStudentIds.length;
        existing.item.tentativeStudentCount =
          existing.tentativeStudentIds.size;
        if (
          severityRank[finding.severity]
          > severityRank[existing.item.severity]
        ) {
          existing.item.severity = finding.severity;
        }
      } else {
        const confirmed = finding.confidence === "confirmed";
        const bucket: ClassSummaryBucket = {
          item: {
            signalId: finding.signalId,
            title: finding.title,
            severity: finding.severity,
            studentCount: 1,
            evidenceCount: finding.evidenceCount,
            studentIds: [studentId],
            confirmedStudentCount: confirmed ? 1 : 0,
            tentativeStudentCount: confirmed ? 0 : 1,
            confirmedStudentIds: confirmed ? [studentId] : [],
            interpretation: finding.interpretation,
            teachingMove: finding.teachingMove
          },
          tentativeStudentIds: new Set(confirmed ? [] : [studentId]),
          unitIds: new Set(units)
        };
        syncUnit(bucket);
        buckets.set(finding.signalId, bucket);
      }
    }
  }

  const items = [...buckets.values()]
    .map((bucket) => bucket.item)
    .sort((left, right) =>
      right.confirmedStudentCount - left.confirmedStudentCount
      || right.studentCount - left.studentCount
      || severityRank[right.severity] - severityRank[left.severity]
      || compareBytes(left.signalId, right.signalId)
    );
  return { completedStudents: reports.length, inProgressStudents, items };
}

export function createParentReport(
  diagnosisSet: DiagnosisSet,
  teacherReport: TeacherStudentReport,
  studentLabel: string
): ParentReport {
  const stageById = new Map(
    diagnosisSet.learnerStages.map((stage) => [stage.id, stage])
  );
  const confirmedFindings = teacherReport.findings.filter(
    (finding) => finding.confidence === "confirmed"
  );
  const findingStageIds = new Set(
    teacherReport.findings.flatMap((finding) => finding.learnerStageIds)
  );
  const correctStageIds = new Set(
    teacherReport.evidence
      .filter((item) =>
        !teacherReport.findings.some((finding) =>
          finding.evidence.some(
            (findingEvidence) => findingEvidence.eventId === item.eventId
          )
        )
      )
      .map((item) => item.learnerStageId)
  );

  const strengths = [...correctStageIds]
    .filter((stageId) => !findingStageIds.has(stageId))
    .map((stageId) => stageById.get(stageId)?.shortTitle)
    .filter((title): title is string => Boolean(title))
    .slice(0, 3);

  return {
    studentLabel,
    diagnosisTitle: diagnosisSet.manifest.title,
    generatedAt: teacherReport.generatedAt,
    participation:
      `${teacherReport.observedJudgmentCount}개의 생각 과정을 끝까지 살펴보았습니다.`,
    strengths: strengths.length > 0
      ? strengths
      : ["한 단계씩 자신의 생각을 남기는 활동에 참여했습니다."],
    supportAreas: confirmedFindings.slice(0, 2).map((finding) => ({
      title: finding.title,
      observation: finding.parentSummary,
      homePrompt: finding.homePrompt
    })),
    closing: confirmedFindings.length === 0
      ? "이번 활동에서는 다시 살펴볼 지점을 확정하지 않았습니다. 다음 활동에서 같은 생각을 한 번 더 관찰하겠습니다."
      : "정답 수보다 어떤 기준으로 생각했는지를 이어서 관찰하겠습니다.",
    disclaimer:
      "이 리포트는 한 번의 활동에서 관찰한 생각 과정이며, 학생의 능력을 확정하거나 비교하는 평가가 아닙니다."
  };
}
