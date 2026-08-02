import type {
  ClassSummary,
  ClassSummaryItem,
  DiagnosisFinding,
  DiagnosisSet,
  EvidenceItem,
  Judgment,
  LearnerStage,
  SignalDefinition,
  TeacherStudentReport,
  TeacherDistractorNote
} from "@middle-of-math/domain";

export interface StagePrerequisiteLink {
  fromSetKey: string;
  fromStageId: string;
  toSetKey: string;
  toStageId: string;
}

export interface TeacherReportStageView {
  setKey: string;
  stage: LearnerStage;
  anchorLabels: string[];
}

export interface TeacherReportEvidenceView {
  evidence: EvidenceItem;
  judgment?: Judgment;
  stage?: TeacherReportStageView;
  anchorLabels: string[];
}

export interface TeacherReportFindingView {
  finding: DiagnosisFinding;
  statusLabel: "같은 생각이 반복됨" | "한 번 더 확인 필요";
  currentStages: TeacherReportStageView[];
  prerequisiteStages: TeacherReportStageView[];
  nextStages: TeacherReportStageView[];
  observedEvidence: TeacherReportEvidenceView[];
  counterEvidence: TeacherReportEvidenceView[];
  dataQualityNotes: string[];
}

export interface TeacherReportView {
  findings: TeacherReportFindingView[];
  unobservedSignals: SignalDefinition[];
  dataQualityNotice?: string;
}

export interface ClassSummaryUnitGroup {
  unitId: string;
  unitTitle: string;
  unitOrder: number;
  items: ClassSummaryItem[];
}

export function findChoiceNote(
  notes: TeacherDistractorNote[],
  evidence?: EvidenceItem
): { title: string; text: string } | undefined {
  if (!evidence) return undefined;
  const note = notes.find(
    (candidate) =>
      candidate.judgmentId === evidence.judgmentId
      && candidate.choiceId === evidence.selectedChoiceId
  );
  return note
    ? { title: note.misconceptionTitle, text: note.teacherNote }
    : undefined;
}

export function groupSummaryByUnit(
  summary: ClassSummary
): ClassSummaryUnitGroup[] {
  const groups = new Map<string, ClassSummaryUnitGroup>();
  for (const item of summary.items) {
    const unitId = item.unitId ?? "unclassified";
    const current = groups.get(unitId);
    if (current) {
      current.items.push(item);
      continue;
    }
    groups.set(unitId, {
      unitId,
      unitTitle: item.unitTitle ?? "단원 정보 없음",
      unitOrder: item.unitOrder ?? Number.MAX_SAFE_INTEGER,
      items: [item]
    });
  }
  return [...groups.values()].sort(
    (left, right) =>
      left.unitOrder - right.unitOrder
      || left.unitId.localeCompare(right.unitId, "ko")
  );
}

export function buildTeacherReportView(
  report: TeacherStudentReport,
  diagnosisSet: DiagnosisSet,
  relatedDiagnosisSets: readonly DiagnosisSet[] = [diagnosisSet],
  prerequisiteLinks: readonly StagePrerequisiteLink[] = []
): TeacherReportView {
  const sets = new Map(
    [...relatedDiagnosisSets, diagnosisSet].map((set) => [set.manifest.id, set])
  );
  const judgmentById = new Map(
    diagnosisSet.judgments.map((judgment) => [judgment.id, judgment])
  );

  const stageView = (
    setKey: string,
    stageId: string
  ): TeacherReportStageView | undefined => {
    const set = sets.get(setKey);
    const stage = set?.learnerStages.find((candidate) => candidate.id === stageId);
    if (!set || !stage) return undefined;
    const anchors = new Map(
      set.curriculumAnchors.map((anchor) => [anchor.id, anchor.label])
    );
    return {
      setKey,
      stage,
      anchorLabels: stage.curriculumAnchorIds.map(
        (id) => `${id} ${anchors.get(id) ?? ""}`.trim()
      )
    };
  };

  const evidenceView = (evidence: EvidenceItem): TeacherReportEvidenceView => {
    const judgment = judgmentById.get(evidence.judgmentId);
    const stage = stageView(diagnosisSet.manifest.id, evidence.learnerStageId);
    const anchorLabels = evidence.curriculumAnchorIds.map((id) => {
      const label = diagnosisSet.curriculumAnchors.find(
        (anchor) => anchor.id === id
      )?.label;
      return `${id} ${label ?? ""}`.trim();
    });
    return { evidence, judgment, stage, anchorLabels };
  };

  const findings = report.findings.map((finding) => {
    const currentStages = finding.learnerStageIds
      .map((stageId) => stageView(diagnosisSet.manifest.id, stageId))
      .filter((stage): stage is TeacherReportStageView => Boolean(stage));
    const prerequisiteStages = dedupeStages([
      ...currentStages.flatMap(({ stage }) =>
        stage.prerequisiteStageIds
          .map((stageId) => stageView(diagnosisSet.manifest.id, stageId))
          .filter((item): item is TeacherReportStageView => Boolean(item))
      ),
      ...prerequisiteLinks
        .filter((link) =>
          link.toSetKey === diagnosisSet.manifest.id
          && finding.learnerStageIds.includes(link.toStageId)
        )
        .map((link) => stageView(link.fromSetKey, link.fromStageId))
        .filter((item): item is TeacherReportStageView => Boolean(item))
    ]);
    const currentIds = new Set(currentStages.map(({ stage }) => stage.id));
    const nextStages = diagnosisSet.learnerStages
      .filter((stage) => stage.prerequisiteStageIds.some((id) => currentIds.has(id)))
      .map((stage) => stageView(diagnosisSet.manifest.id, stage.id))
      .filter((stage): stage is TeacherReportStageView => Boolean(stage));
    const counterIds = new Set(finding.counterJudgmentIds);
    const counterEvidence = report.evidence
      .filter((evidence) => counterIds.has(evidence.judgmentId))
      .map(evidenceView);

    return {
      finding,
      statusLabel: finding.confidence === "confirmed"
        ? "같은 생각이 반복됨" as const
        : "한 번 더 확인 필요" as const,
      currentStages,
      prerequisiteStages,
      nextStages,
      observedEvidence: finding.evidence.map(evidenceView),
      counterEvidence,
      dataQualityNotes: evidenceQualityNotes(finding.evidence)
    };
  });
  const opportunityBySignal = new Map(
    report.opportunities.map((opportunity) => [opportunity.signalId, opportunity])
  );
  const unobservedSignals = diagnosisSet.signals.filter((signal) => {
    const opportunity = opportunityBySignal.get(signal.id);
    return Boolean(
      opportunity
      && opportunity.observedJudgmentIds.length === 0
      && opportunity.counterJudgmentIds.length > 0
    );
  });

  return {
    findings,
    unobservedSignals,
    dataQualityNotice: report.responseStyle.positionStyleSuspected
      ? "보기의 같은 위치를 반복해서 고른 흔적이 있어 이 결과만으로 어려움을 단정하지 않습니다. 학생의 수학 수준이 아니라 응답 기록을 살펴보는 참고 정보로만 사용합니다."
      : undefined
  };
}

function dedupeStages(
  stages: readonly TeacherReportStageView[]
): TeacherReportStageView[] {
  const unique = new Map(
    stages.map((stage) => [`${stage.setKey}:${stage.stage.id}`, stage])
  );
  return [...unique.values()].sort((left, right) =>
    left.stage.order - right.stage.order
    || left.stage.id.localeCompare(right.stage.id, "ko")
  );
}

function evidenceQualityNotes(evidence: readonly EvidenceItem[]): string[] {
  const changed = evidence.filter((item) => item.selectionChanges > 0).length;
  const quick = evidence.filter((item) => item.durationBand === "quick").length;
  const long = evidence.filter((item) => item.durationBand === "long").length;
  const uncertain = evidence.filter((item) => item.uncertainty).length;
  return [
    changed > 0 ? `선택을 바꾼 문항 ${changed}개` : null,
    quick > 0 ? `빠르게 선택한 문항 ${quick}개` : null,
    long > 0 ? `오래 고민한 문항 ${long}개` : null,
    uncertain > 0 ? `‘잘 모르겠어요’를 사용한 문항 ${uncertain}개` : null
  ].filter((note): note is string => Boolean(note));
}
