export type Severity = "low" | "medium" | "high";

export type ElementaryGrade = 1 | 2 | 3 | 4 | 5 | 6;
export type SchoolSemester = 1 | 2;

export type SessionStatus =
  | "not_started"
  | "in_progress"
  | "sync_pending"
  | "completed"
  | "abandoned";

export interface CurriculumAnchor {
  id: string;
  label: string;
  source: string;
}

export interface LearnerStage {
  id: string;
  order: number;
  unitId: string;
  title: string;
  shortTitle: string;
  curriculumAnchorIds: string[];
  prerequisiteStageIds: string[];
}

export interface SignalDefinition {
  id: string;
  title: string;
  severity: Severity;
  teacherInterpretation: string;
  teachingMove: string;
  parentSummary: string;
  homePrompt: string;
}

export interface TeacherSignalCopy {
  interpretation: string;
  teachingMove: string;
}

export interface GuardianSignalCopy {
  summary: string;
  homePrompt: string;
}

export interface JudgmentChoice {
  id: string;
  label: string;
  correct: boolean;
  signalIds?: string[];
}

export type MeasureUnit = "mL" | "L" | "g" | "kg" | "t";
export type MeasureMedium = "capacity" | "weight";
export type LengthUnit = "mm" | "cm" | "m" | "km";
export interface MeasurePart {
  value: number;
  unit: MeasureUnit;
}

export interface GridCell {
  row: number;
  column: number;
}

export type QuadrilateralIndex = 0 | 1 | 2 | 3;
export type LatticePoint = readonly [number, number];
export type QuadrilateralVertices = readonly [
  LatticePoint,
  LatticePoint,
  LatticePoint,
  LatticePoint
];

type QuadrilateralVisualBase = {
  kind: "quadrilateral-figure";
};

export type QuadrilateralFigure =
  | QuadrilateralVisualBase & {
      mode: "side-perpendicular";
      vertices: QuadrilateralVertices;
      baseSideIndex: QuadrilateralIndex;
      rightAngleVertexIndexes: QuadrilateralIndex[];
    }
  | QuadrilateralVisualBase & {
      mode: "side-parallel-distance";
      vertices: QuadrilateralVertices;
      parallelSidePairs: Array<
        [QuadrilateralIndex, QuadrilateralIndex]
      >;
      sideLengthLabels: Array<{
        sideIndex: QuadrilateralIndex;
        lengthCm: number;
      }>;
      distanceSegment: {
        fromVertexIndex: QuadrilateralIndex;
        toSideIndex: QuadrilateralIndex;
        lengthCm: number;
      };
    }
  | QuadrilateralVisualBase & {
      mode: "parallel-classify";
      vertices: QuadrilateralVertices;
      parallelSidePairs: Array<
        [QuadrilateralIndex, QuadrilateralIndex]
      >;
    }
  | QuadrilateralVisualBase & {
      mode: "equal-side-classify";
      vertices: QuadrilateralVertices;
      equalSideGroups: QuadrilateralIndex[][];
    }
  | QuadrilateralVisualBase & {
      mode: "opposite-angle";
      parallelSidePairs: Array<
        [QuadrilateralIndex, QuadrilateralIndex]
      >;
      angles: [
        number | null,
        number | null,
        number | null,
        number | null
      ];
      askAngleIndex: QuadrilateralIndex;
    };

export type PolygonSideCount = 3 | 4 | 5 | 6 | 7 | 8;
export type PolygonCandidateId = "가" | "나" | "다";

export type PolygonOutline =
  | {
      form: "regular";
      sideCount: PolygonSideCount;
      rotationDegrees: number;
    }
  | {
      form: "equiangular";
      sideCount: 4 | 6;
      sideLengths: number[];
    }
  | {
      form: "lattice" | "open" | "crossing";
      vertices: LatticePoint[];
    }
  | {
      form: "curved";
      vertices: LatticePoint[];
      curvedSideIndex: number;
    };

export type PolygonFigure =
  | {
      kind: "polygon-figure";
      mode: "polygon-select" | "regular-select";
      candidates: Array<{
        id: PolygonCandidateId;
        figure: PolygonOutline;
      }>;
    }
  | {
      kind: "polygon-figure";
      mode: "side-count-name";
      figure: PolygonOutline;
    };

export type TriangleOrientation = "up" | "down";
export type TriangleCell = readonly [
  column: number,
  row: number,
  orientation: TriangleOrientation
];
export type PatternBlockName =
  | "triangle"
  | "rhombus"
  | "trapezoid"
  | "hexagon";

export type TileCompositionFigure =
  | {
      kind: "tile-composition";
      mode: "fill-remaining";
      board: TriangleCell[];
      placed: Array<{
        piece: PatternBlockName;
        cells: TriangleCell[];
      }>;
      candidates: Array<{
        id: PolygonCandidateId;
        pieces: PatternBlockName[];
      }>;
    }
  | {
      kind: "tile-composition";
      mode: "tile-count";
      region: TriangleCell[];
      piece: PatternBlockName;
    };

export type LineChartMode =
  | "tick-unit"
  | "point-value"
  | "step-change"
  | "largest-rise"
  | "between-estimate";

export type LineChartTarget =
  | { kind: "point"; categoryIndex: number }
  | { kind: "interval"; fromIndex: number; toIndex: number }
  | { kind: "midpoint"; fromIndex: number; toIndex: number };

export interface LineChartDiagram {
  kind: "line-chart-diagram";
  mode: LineChartMode;
  axis: {
    unitLabel: string;
    baselineValue: number;
    tickCount: number;
    labeledTicks: Array<{ index: number; value: number }>;
  };
  timeAxis: {
    label: string;
    categories: string[];
  };
  points: Array<{ categoryIndex: number; tick: number }>;
  target?: LineChartTarget;
}

export type PerimeterAreaDiagram =
  | {
      kind: "perimeter-area-diagram";
      shape: "rectangle";
      width: number;
      height: number;
    }
  | {
      kind: "perimeter-area-diagram";
      shape: "square";
      side: number;
    }
  | {
      kind: "perimeter-area-diagram";
      shape: "parallelogram" | "triangle";
      base: number;
      height: number;
    }
  | {
      kind: "perimeter-area-diagram";
      shape: "trapezoid";
      topBase: number;
      bottomBase: number;
      height: number;
    }
  | {
      kind: "perimeter-area-diagram";
      shape: "rhombus";
      diagonal1: number;
      diagonal2: number;
    };

export type SolidDiagram =
  | {
      kind: "solid-diagram";
      mode: "structure" | "net";
      shape:
        | "rectangular-prism"
        | "cube"
        | "triangular-prism"
        | "square-pyramid"
        | "cylinder"
        | "cone"
        | "sphere";
    }
  | {
      kind: "solid-diagram";
      mode: "dimensions";
      shape: "rectangular-prism";
      width: number;
      depth: number;
      height: number;
    }
  | {
      kind: "solid-diagram";
      mode: "dimensions";
      shape: "cube";
      width: number;
    }
  | {
      kind: "solid-diagram";
      mode: "dimensions";
      shape: "cylinder";
      radius: number;
      height: number;
    }
  | {
      kind: "solid-diagram";
      mode: "unit-stack";
      shape: "unit-cubes";
      cubes: Array<readonly [x: number, y: number, z: number]>;
      frontDirection: "left" | "right";
    };

export interface PartChartDiagram {
  kind: "part-chart-diagram";
  mode: "strip" | "circle";
  totalParts: 10 | 20;
  segments: Array<{
    label: string;
    parts: number;
  }>;
}

export type JudgmentVisual =
  | { kind: "none" }
  | { kind: "array"; rows: number; columns: number; label: string }
  | { kind: "item-collection"; ariaLabel: string; items: string[] }
  | { kind: "data-table"; title: string; rows: Array<{ label: string; value: string }> }
  | { kind: "division-groups"; total: number; groups: number }
  | {
      kind: "circle";
      mode?: "radius" | "diameter" | "equal-radii" | "compass-center" | "compass-radius";
      radiusValue?: number;
      diameterValue?: number;
      measurementUnit?: "cm" | "m";
      showCenter?: boolean;
      showRadius?: boolean;
      showDiameter?: boolean;
    }
  | { kind: "fraction-bar"; numerator: number; denominator: number; unknown?: "numerator" | "denominator" }
  | {
      kind: "partition-diagrams";
      diagrams: Array<{
        label: string;
        parts: number[];
        highlightedPart?: number;
      }>;
    }
  | { kind: "measurement"; amount: number; unit: "mL" | "L" | "g" | "kg" }
  | {
      kind: "length-relation";
      value: number;
      fromUnit: LengthUnit;
      targetUnit: LengthUnit;
    }
  | {
      kind: "unit-relation";
      medium: MeasureMedium;
      given: MeasurePart[];
      targetUnit: MeasureUnit;
    }
  | {
      kind: "measure-referent";
      medium: MeasureMedium;
      object: "paper-cup" | "water-bottle" | "watermelon" | "paper-clip";
      instrument: "beaker" | "scale";
    }
  | {
      kind: "quantity-combine";
      medium: MeasureMedium;
      operator: "add" | "subtract";
      left: MeasurePart[];
      right: MeasurePart[];
    }
  | {
      kind: "place-value-chart";
      digits: number[];
      ask: "value" | "place-name";
      highlightIndexes?: number[];
    }
  | {
      kind: "angle-figure";
      degrees: number;
      mode: "bare" | "protractor";
      rayLengths?: [number, number];
      referenceRightAngle?: boolean;
      protractorPlacement?: "aligned" | "vertex-off" | "baseline-off";
      label?: string;
    }
  | {
      kind: "polygon-angle-diagram";
      polygon: "triangle" | "quadrilateral";
      mode: "find-missing" | "verify-claim";
      angles: Array<{
        label: string;
        value: number | null;
      }>;
      diagonal?: boolean;
    }
  | {
      kind: "triangle-figure";
      mode: "side-classify" | "side-angle" | "angle-classify";
      sides?: [number, number, number];
      angles?: [
        number | null,
        number | null,
        number | null
      ];
      equalSideIndexes?: [
        0 | 1 | 2,
        0 | 1 | 2
      ];
      askIndex?: 0 | 1 | 2;
    }
  | QuadrilateralFigure
  | PolygonFigure
  | TileCompositionFigure
  | LineChartDiagram
  | PerimeterAreaDiagram
  | SolidDiagram
  | PartChartDiagram
  | {
      kind: "grid-transform-diagram";
      mode:
        | "slide"
        | "flip-left-right"
        | "flip-up-down"
        | "rotate"
        | "point-move";
      rows: number;
      columns: number;
      sourceCells?: GridCell[];
      targetCells?: GridCell[];
      sourceMarker?: GridCell;
      targetMarker?: GridCell;
      axisIndex?: number;
      center?: GridCell;
      direction?: "up" | "down" | "left" | "right";
      amount?: number;
      turn?: "clockwise" | "counterclockwise";
      quarterTurns?: 1 | 2 | 3;
      points?: Array<GridCell & { label: "A" | "B" }>;
    }
  | {
      kind: "relation-pattern-diagram";
      mode:
        | "number-sequence"
        | "figure-sequence"
        | "rule-table"
        | "calculation-array"
        | "equal-sign-balance";
      terms?: Array<number | null>;
      figure?: "square" | "circle" | "triangle";
      counts?: Array<number | null>;
      askOrder?: number;
      leftLabel?: string;
      rightLabel?: string;
      rows?: Array<{ left: number; right: number }>;
      calculations?: Array<{
        a: number;
        operator: "multiply" | "divide";
        b: number;
        result: number | null;
      }>;
      equation?: {
        operator: "add";
        left: [number, number];
        right: [number | null, number | null];
      };
    }
  | {
      kind: "bar-chart-diagram";
      mode:
        | "unit-value"
        | "bar-value"
        | "bar-difference"
        | "table-match"
        | "chart-conclusion";
      axis: {
        orientation: "vertical" | "horizontal";
        tickCount: number;
        labeledTicks: Array<{ index: number; value: number }>;
        unitLabel: string;
      };
      bars?: Array<{ category: string; ticks: number }>;
      target?: string;
      comparison?:
        | { kind: "pair"; categories: [string, string] }
        | { kind: "extremes" };
      table?: Array<{ category: string; count: number }>;
      candidates?: Array<{
        id: "가" | "나" | "다";
        bars: Array<{ category: string; ticks: number }>;
      }>;
    }
  | { kind: "pictograph"; symbol: string; value: number; rows: Array<{ label: string; count: number }> };

export interface InteractionDescriptor {
  type: string;
  version: number;
  config?: Record<string, unknown>;
}

export interface Judgment {
  id: string;
  unitId: string;
  learnerStageId: string;
  curriculumAnchorIds: string[];
  prompt: string;
  context?: string;
  visual: JudgmentVisual;
  interaction: InteractionDescriptor;
  choices: JudgmentChoice[];
}

export interface DiagnosisSetManifest {
  id: string;
  version: string;
  checksum: string;
  title: string;
  shortTitle: string;
  grade: ElementaryGrade;
  semester: SchoolSemester;
  curriculum: "2022-revised";
  status: "draft" | "review" | "published" | "retired";
  units: Array<{ id: string; order: number; title: string }>;
  interactionTypes: Array<{ type: string; version: number }>;
  estimatedMinutes: number;
}

export type ContentTeamRole = "author" | "reviewer" | "admin";

export interface ContentTeamMembership {
  userId: string;
  role: ContentTeamRole;
  active: boolean;
}

export type ContentDraftStatus =
  | "draft"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "published";

export type ContentReviewDecision = "approve" | "request_changes";

export interface ContentValidationIssue {
  code: string;
  path: string;
  message: string;
  severity: "error" | "warning";
}

export interface ContentValidationGateAttestation {
  gate: "diagnostic-integrity";
  gateVersion: string;
  policy: "enforce" | "warn";
  enforced: boolean;
  setKey: string;
  targetVersion: string;
  blueprintRevision: string | null;
  valid: boolean;
  errorCount: number;
  warningCount: number;
  graphRevision?: string;
  graphDigest?: string;
  crosswalkRevision?: string;
  crosswalkDigest?: string;
  upstreamCommit?: string;
  upstreamTaxonomyVersion?: string;
  upstreamOntologyVersion?: string;
}

export interface ContentValidationResult {
  valid: boolean;
  issues: ContentValidationIssue[];
  gates?: ContentValidationGateAttestation[];
}

export interface ContentDraft {
  id: string;
  setKey: string;
  ownerId: string;
  status: ContentDraftStatus;
  baseDiagnosisSetId?: string;
  content: DiagnosisSet;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContentReviewRequest {
  id: string;
  draftId: string;
  draftRevision: number;
  authorId: string;
  reviewerId?: string;
  status: "pending" | "changes_requested" | "approved" | "cancelled" | "published";
  requestedAt: string;
  decidedAt?: string;
}

export interface ContentReviewComment {
  id: string;
  reviewRequestId: string;
  authorId: string;
  path: string;
  body: string;
  required: boolean;
  resolvedAt?: string;
  createdAt: string;
}

export interface PublishedDiagnosisSet {
  id: string;
  setKey: string;
  version: string;
  checksum: string;
  status: "published" | "retired";
  content: DiagnosisSet;
  publishedAt: string;
}

export interface DiagnosisSet {
  manifest: DiagnosisSetManifest;
  curriculumAnchors: CurriculumAnchor[];
  learnerStages: LearnerStage[];
  signals: SignalDefinition[];
  judgments: Judgment[];
}

export type ObservationEventType =
  | "session_started"
  | "choice_selected"
  | "choice_changed"
  | "uncertainty_selected"
  | "judgment_confirmed"
  | "session_completed";

export interface JudgmentConfirmationPayload extends Record<string, unknown> {
  choiceId: string;
  presentedChoiceIds?: string[];
  durationMs: number;
  firstSelectionMs: number | null;
  confirmationMs: number | null;
  selectionChanges: number;
  uncertainty: boolean;
}

export interface ObservationEvent<TPayload = Record<string, unknown>> {
  id: string;
  clientEventId: string;
  clientSeq: number;
  sessionId: string;
  diagnosisSetId: string;
  diagnosisSetVersion: string;
  eventType: ObservationEventType;
  judgmentId?: string;
  interaction: InteractionDescriptor;
  payload: TPayload;
  occurredAt: string;
  receivedAt?: string;
}

export interface EvidenceItem {
  eventId: string;
  judgmentId: string;
  learnerStageId: string;
  curriculumAnchorIds: string[];
  selectedChoiceId: string;
  selectedChoiceLabel: string;
  presentedChoiceIds?: string[];
  selectedChoicePosition?: number;
  presentedChoiceCount?: number;
  durationBand: "quick" | "steady" | "long";
  firstSelectionMs: number | null;
  confirmationMs: number | null;
  selectionChanges: number;
  uncertainty: boolean;
}

export type FindingConfidence = "tentative" | "confirmed";

export type TentativeReason =
  | "insufficient_opportunity"
  | "single_observation"
  | "position_style"
  | "too_fast"
  | "uncertainty_only"
  | "data_quality";

export interface SignalOpportunity {
  signalId: string;
  opportunityJudgmentIds: string[];
  observedJudgmentIds: string[];
  counterJudgmentIds: string[];
}

export interface ResponseStyleSummary {
  confirmationCount: number;
  provenanceCount: number;
  provenanceCoverage: number;
  dominantPosition: number | null;
  dominantPositionRate: number | null;
  positionStyleSuspected: boolean;
  fastConfirmationCount: number;
}

export interface DiagnosisFinding {
  signalId: string;
  title: string;
  severity: Severity;
  evidenceCount: number;
  confidence: FindingConfidence;
  tentativeReasons: TentativeReason[];
  opportunityCount: number;
  observedJudgmentIds: string[];
  counterJudgmentIds: string[];
  confirmationRule: string;
  learnerStageIds: string[];
  curriculumAnchorIds: string[];
  interpretation: string;
  teachingMove: string;
  parentSummary: string;
  homePrompt: string;
  evidence: EvidenceItem[];
}

export interface TeacherStudentReport {
  sessionId: string;
  diagnosisSetId: string;
  diagnosisSetVersion: string;
  engineVersion: string;
  generatedAt: string;
  observedJudgmentCount: number;
  stableJudgmentCount: number;
  uncertaintyCount: number;
  findings: DiagnosisFinding[];
  evidence: EvidenceItem[];
  opportunities: SignalOpportunity[];
  confirmedFindingCount: number;
  tentativeFindingCount: number;
  responseStyle: ResponseStyleSummary;
}

export interface ParentReport {
  studentLabel: string;
  diagnosisTitle: string;
  generatedAt: string;
  participation: string;
  strengths: string[];
  supportAreas: Array<{ title: string; observation: string; homePrompt: string }>;
  closing: string;
  disclaimer: string;
}

export interface ClassSummaryItem {
  signalId: string;
  title: string;
  severity: Severity;
  unitId?: string;
  unitTitle?: string;
  unitOrder?: number;
  studentCount: number;
  evidenceCount: number;
  studentIds: string[];
  confirmedStudentCount: number;
  tentativeStudentCount: number;
  confirmedStudentIds: string[];
  interpretation: string;
  teachingMove: string;
}

export interface ClassSummary {
  completedStudents: number;
  inProgressStudents: number;
  items: ClassSummaryItem[];
}

export interface DiagnosisSession {
  id: string;
  assignmentId: string;
  studentId: string;
  diagnosisSetId: string;
  diagnosisSetVersion: string;
  status: SessionStatus;
  startedAt: string;
  completedAt?: string;
  lastEventSeq: number;
}

export interface TeacherClassSnapshot {
  id: string;
  name: string;
  grade: number;
  semester: SchoolSemester;
  pilotEndsAt: string;
  purgeAfter: string;
}

export interface TeacherAssignmentSnapshot {
  id: string;
  classId: string;
  status: "draft" | "active" | "closed" | "archived";
  opensAt: string;
  closesAt?: string;
}

export interface TeacherStudentSnapshot {
  id: string;
  rosterKey: string;
  displayAlias: string | null;
  active: boolean;
}

export interface InterpretationRunRecord {
  id: string;
  sessionId: string;
  engineVersion: string;
  diagnosisSetVersion: string;
  generatedAt: string;
  report: TeacherStudentReport;
}

export interface ParentReportExportRecord {
  id: string;
  sessionId: string;
  interpretationRunId: string;
  reviewedBy: string;
  generatedAt: string;
  report: ParentReport;
}

export interface TeacherSessionEvidence {
  session: DiagnosisSession;
  events: ObservationEvent[];
  interpretationRuns: InterpretationRunRecord[];
}

export interface TeacherStudentEvidence {
  student: TeacherStudentSnapshot;
  sessions: TeacherSessionEvidence[];
}

export interface TeacherAssignmentEvidenceBundle {
  class: TeacherClassSnapshot;
  assignment: TeacherAssignmentSnapshot;
  diagnosisSet: PublishedDiagnosisSet;
  students: TeacherStudentEvidence[];
}

export interface TeacherSessionEvidenceContext {
  class: TeacherClassSnapshot;
  assignment: TeacherAssignmentSnapshot;
  diagnosisSet: PublishedDiagnosisSet;
  student: TeacherStudentSnapshot;
  evidence: TeacherSessionEvidence;
}

export interface PrivacySafeDailyAggregate {
  day: string;
  classesCreated: number;
  studentsAdded: number;
  sessionsStarted: number;
  sessionsCompleted: number;
  observationEventsReceived: number;
  parentExportsGenerated: number;
}

export interface TeacherAssignmentStudentInsight {
  student: TeacherStudentSnapshot;
  interpretationStatus: "not_started" | "in_progress" | "ready" | "interpretation_pending";
  pendingReason?: "checksum_mismatch" | "unsupported_interaction_version";
  latestCompletedSessionId?: string;
  report?: TeacherStudentReport;
}

export interface TeacherDistractorNote {
  setKey: string;
  version: string;
  judgmentId: string;
  choiceId: string;
  signalIds: string[];
  misconceptionKey: string;
  misconceptionTitle: string;
  teacherNote: string;
}

export interface TeacherAssignmentInsights {
  bundle: TeacherAssignmentEvidenceBundle;
  classSummary: ClassSummary;
  students: TeacherAssignmentStudentInsight[];
  distractorNotes: TeacherDistractorNote[];
}
