import { createDefaultInteractionRegistry, signalMap, type InteractionRegistry } from "./interaction-registry";
import type {
  ClassSummary,
  ClassSummaryItem,
  DiagnosisFinding,
  DiagnosisSet,
  JudgmentConfirmationPayload,
  ObservationEvent,
  ParentReport,
  Severity,
  TeacherStudentReport
} from "./types";

export const INTERPRETATION_ENGINE_VERSION = "rules-2.0.0";

const severityRank: Record<Severity, number> = { low: 1, medium: 2, high: 3 };

export function interpretSession(
  diagnosisSet: DiagnosisSet,
  events: ObservationEvent[],
  registry: InteractionRegistry = createDefaultInteractionRegistry(),
  generatedAt = new Date().toISOString()
): TeacherStudentReport {
  const judgments = new Map(diagnosisSet.judgments.map((judgment) => [judgment.id, judgment]));
  const definitions = signalMap(diagnosisSet);
  const confirmations = events
    .filter((event): event is ObservationEvent<JudgmentConfirmationPayload> => event.eventType === "judgment_confirmed")
    .sort((a, b) => a.clientSeq - b.clientSeq);

  const findingBuckets = new Map<string, DiagnosisFinding>();
  const evidence = [];
  let stableJudgmentCount = 0;
  let uncertaintyCount = 0;

  for (const event of confirmations) {
    const judgment = event.judgmentId ? judgments.get(event.judgmentId) : undefined;
    if (!judgment) continue;
    const extracted = registry.get(event.interaction.type, event.interaction.version).extract(event, judgment);
    evidence.push(extracted.evidence);
    if (extracted.correct) stableJudgmentCount += 1;
    if (extracted.evidence.uncertainty) uncertaintyCount += 1;

    for (const signalId of extracted.signalIds) {
      const definition = definitions.get(signalId);
      if (!definition) continue;
      const existing = findingBuckets.get(signalId);
      if (existing) {
        existing.evidenceCount += 1;
        existing.evidence.push(extracted.evidence);
        existing.learnerStageIds = [...new Set([...existing.learnerStageIds, judgment.learnerStageId])];
        existing.curriculumAnchorIds = [...new Set([...existing.curriculumAnchorIds, ...judgment.curriculumAnchorIds])];
      } else {
        findingBuckets.set(signalId, {
          signalId,
          title: definition.title,
          severity: definition.severity,
          evidenceCount: 1,
          learnerStageIds: [judgment.learnerStageId],
          curriculumAnchorIds: [...judgment.curriculumAnchorIds],
          interpretation: definition.teacherInterpretation,
          teachingMove: definition.teachingMove,
          parentSummary: definition.parentSummary,
          homePrompt: definition.homePrompt,
          evidence: [extracted.evidence]
        });
      }
    }
  }

  const findings = [...findingBuckets.values()].sort(
    (a, b) => severityRank[b.severity] - severityRank[a.severity] || b.evidenceCount - a.evidenceCount
  );

  return {
    sessionId: events[0]?.sessionId ?? "unknown-session",
    diagnosisSetId: diagnosisSet.manifest.id,
    diagnosisSetVersion: diagnosisSet.manifest.version,
    engineVersion: INTERPRETATION_ENGINE_VERSION,
    generatedAt,
    observedJudgmentCount: evidence.length,
    stableJudgmentCount,
    uncertaintyCount,
    findings,
    evidence
  };
}

export function generateClassSummary(
  reports: Array<{ studentId: string; report: TeacherStudentReport }>,
  inProgressStudents = 0
): ClassSummary {
  const buckets = new Map<string, ClassSummaryItem>();
  for (const { studentId, report } of reports) {
    for (const finding of report.findings) {
      const existing = buckets.get(finding.signalId);
      if (existing) {
        existing.evidenceCount += finding.evidenceCount;
        existing.studentIds = [...new Set([...existing.studentIds, studentId])];
        existing.studentCount = existing.studentIds.length;
        if (severityRank[finding.severity] > severityRank[existing.severity]) existing.severity = finding.severity;
      } else {
        buckets.set(finding.signalId, {
          signalId: finding.signalId,
          title: finding.title,
          severity: finding.severity,
          studentCount: 1,
          evidenceCount: finding.evidenceCount,
          studentIds: [studentId],
          interpretation: finding.interpretation,
          teachingMove: finding.teachingMove
        });
      }
    }
  }

  const items = [...buckets.values()].sort(
    (a, b) => b.studentCount - a.studentCount || severityRank[b.severity] - severityRank[a.severity]
  );
  return { completedStudents: reports.length, inProgressStudents, items };
}

export function createParentReport(
  diagnosisSet: DiagnosisSet,
  teacherReport: TeacherStudentReport,
  studentLabel: string
): ParentReport {
  const stageById = new Map(diagnosisSet.learnerStages.map((stage) => [stage.id, stage]));
  const findingStageIds = new Set(teacherReport.findings.flatMap((finding) => finding.learnerStageIds));
  const correctStageIds = new Set(
    teacherReport.evidence
      .filter((item) => !teacherReport.findings.some((finding) => finding.evidence.some((evidence) => evidence.eventId === item.eventId)))
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
    participation: `${teacherReport.observedJudgmentCount}개의 생각 과정을 끝까지 살펴보았습니다.`,
    strengths: strengths.length > 0 ? strengths : ["한 단계씩 자신의 생각을 남기는 활동에 참여했습니다."],
    supportAreas: teacherReport.findings.slice(0, 2).map((finding) => ({
      title: finding.title,
      observation: finding.parentSummary,
      homePrompt: finding.homePrompt
    })),
    closing: "정답 수보다 어떤 기준으로 생각했는지를 이어서 관찰하겠습니다.",
    disclaimer: "이 리포트는 한 번의 활동에서 관찰한 생각 과정이며, 학생의 능력을 확정하거나 비교하는 평가가 아닙니다."
  };
}
