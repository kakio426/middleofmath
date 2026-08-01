import type { DiagnosisSet, Judgment, SignalDefinition } from "@middle-of-math/domain";
import {
  curriculumCrosswalkSummary,
  inspectDiagnosticIntegrity,
  validateDiagnosisSet,
  type DiagnosisCoverageBlueprint
} from "@middle-of-math/content";

export interface StudioIssue {
  code: string;
  path: string;
  level: "error" | "warning";
  message: string;
}

export interface StudioDistractorRationaleItem {
  choiceId: string;
  choiceLabel: string;
  misconceptionId: string;
  misconceptionTitle: string;
  derivation: string;
  rationale: string;
}

export type StudioDistractorRationaleSummary =
  | {
      status: "matched";
      sharedSignalRationale?: string;
      items: StudioDistractorRationaleItem[];
    }
  | {
      status: "mismatch";
      message: string;
      items: [];
    };

export function getStudioCurriculumProvenance() {
  return curriculumCrosswalkSummary();
}

export function cloneAsDraft(content: DiagnosisSet): DiagnosisSet {
  const draft = structuredClone(content);
  draft.manifest.status = "draft";
  return draft;
}

export function updateJudgment(
  content: DiagnosisSet,
  judgmentId: string,
  updater: (judgment: Judgment) => Judgment
): DiagnosisSet {
  return {
    ...content,
    judgments: content.judgments.map((judgment) => judgment.id === judgmentId ? updater(judgment) : judgment)
  };
}

export function updateSignal(
  content: DiagnosisSet,
  signalId: string,
  updater: (signal: SignalDefinition) => SignalDefinition
): DiagnosisSet {
  return {
    ...content,
    signals: content.signals.map((signal) => signal.id === signalId ? updater(signal) : signal)
  };
}

export function collectStudioIssues(
  content: DiagnosisSet,
  baseContent?: DiagnosisSet,
  gateContext?: { setKey: string; targetVersion: string }
): StudioIssue[] {
  const structural = validateDiagnosisSet(content, { baseContent });
  const gate = gateContext
    ? inspectDiagnosticIntegrity({
        content,
        setKey: gateContext.setKey,
        targetVersion: gateContext.targetVersion
      })
    : { issues: [] };
  return [...structural.issues, ...gate.issues].map((issue) => ({
    code: issue.code,
    path: issue.path,
    level: issue.severity,
    message: issue.message
  }));
}

export function issueBelongsToJudgment(
  issuePath: string,
  judgmentIndex: number
): boolean {
  const base = `/judgments/${judgmentIndex}`;
  return issuePath === base || issuePath.startsWith(`${base}/`);
}

export function summarizeVisual(judgment: Judgment): string {
  switch (judgment.visual.kind) {
    case "none": return "시각 자료 없음";
    case "array": return `${judgment.visual.rows}×${judgment.visual.columns} 배열`;
    case "item-collection": return `셀 자료 ${judgment.visual.items.length}개`;
    case "data-table": return `${judgment.visual.rows.length}행 표`;
    case "division-groups": return `${judgment.visual.total}개 · ${judgment.visual.groups}묶음`;
    case "circle": return "원과 선분";
    case "fraction-bar": return `${judgment.visual.denominator}칸 분수 막대`;
    case "partition-diagrams": return `${judgment.visual.diagrams.length}개 등분 그림`;
    case "measurement": return "기존 측정 도구 그림";
    case "length-relation": return `${judgment.visual.fromUnit}→${judgment.visual.targetUnit} 길이 단위 관계`;
    case "unit-relation": return `${judgment.visual.medium === "capacity" ? "들이" : "무게"} 단위 관계`;
    case "measure-referent": return `${judgment.visual.medium === "capacity" ? "들이" : "무게"} 측정 대상`;
    case "quantity-combine": return `${judgment.visual.medium === "capacity" ? "들이" : "무게"}의 ${judgment.visual.operator === "add" ? "합" : "차"}`;
    case "place-value-chart": return `${judgment.visual.digits.length}자리 자리값표`;
    case "angle-figure": return judgment.visual.mode === "protractor"
      ? "각도기와 한 각"
      : "눈금 없는 한 각";
    case "polygon-angle-diagram": return `${
      judgment.visual.polygon === "triangle" ? "삼각형" : "사각형"
    }의 각 그림`;
    case "triangle-figure": return judgment.visual.mode === "side-classify"
      ? "변의 길이로 분류하는 삼각형"
      : judgment.visual.mode === "side-angle"
        ? "같은 변과 각이 표시된 삼각형"
        : "각의 크기로 분류하는 삼각형";
    case "quadrilateral-figure": {
      const labels = {
        "side-perpendicular": "직각 표시가 있는 사각형",
        "side-parallel-distance": "평행한 두 변 사이의 거리",
        "parallel-classify": "평행 표시가 있는 사각형",
        "equal-side-classify": "같은 변 표시가 있는 사각형",
        "opposite-angle": "마주 보는 각이 표시된 사각형"
      } as const;
      return labels[judgment.visual.mode];
    }
    case "polygon-figure": return judgment.visual.mode === "polygon-select"
      ? "다각형 후보 가·나·다"
      : judgment.visual.mode === "side-count-name"
        ? "변의 수를 세는 다각형"
        : "정다각형 후보 가·나·다";
    case "tile-composition": return judgment.visual.mode === "fill-remaining"
      ? "남은 자리를 채우는 모양 조각"
      : "같은 모양 조각으로 채우기";
    case "grid-transform-diagram": return judgment.visual.mode === "point-move"
      ? "격자에서 두 점의 이동"
      : "격자에서 처음·나중 도형";
    case "relation-pattern-diagram": {
      if (judgment.visual.mode === "number-sequence") {
        return `수 배열 ${judgment.visual.terms?.map((term) => term ?? "□").join(" → ")}`;
      }
      if (judgment.visual.mode === "figure-sequence") {
        return `도형 개수 ${judgment.visual.counts?.map((count) => count ?? "□").join(" → ")}`;
      }
      if (judgment.visual.mode === "rule-table") {
        return `${judgment.visual.leftLabel} ↔ ${judgment.visual.rightLabel} 대응표`;
      }
      if (judgment.visual.mode === "calculation-array") {
        return `계산식 ${judgment.visual.calculations?.length ?? 0}개 배열`;
      }
      return "등호 양쪽의 합 비교";
    }
    case "bar-chart-diagram": {
      if (judgment.visual.mode === "unit-value") {
        return `${judgment.visual.axis.tickCount}칸 눈금의 한 칸 값`;
      }
      if (judgment.visual.mode === "table-match") {
        return `${judgment.visual.table?.length ?? 0}개 항목 표와 후보 그래프`;
      }
      return `${judgment.visual.bars?.length ?? 0}개 항목 막대그래프`;
    }
    case "line-chart-diagram": {
      const labels = {
        "tick-unit": "눈금 한 칸의 값",
        "point-value": "한 점의 값",
        "step-change": "두 점 사이 변화량",
        "largest-rise": "가장 크게 증가한 구간",
        "between-estimate": "두 점 사이 값 어림"
      } as const;
      return `${judgment.visual.timeAxis.categories.length}개 시점 꺾은선그래프 · ${labels[judgment.visual.mode]}`;
    }
    case "perimeter-area-diagram": {
      const labels = {
        rectangle: "직사각형",
        square: "정사각형",
        parallelogram: "평행사변형",
        triangle: "삼각형",
        trapezoid: "사다리꼴",
        rhombus: "마름모"
      } as const;
      return `길이가 표시된 ${labels[judgment.visual.shape]}`;
    }
    case "solid-diagram": return judgment.visual.mode === "unit-stack"
      ? "앞 방향이 표시된 쌓기나무"
      : `${judgment.visual.shape} ${judgment.visual.mode === "net" ? "전개도" : "입체 그림"}`;
    case "part-chart-diagram": return judgment.visual.mode === "strip"
      ? `${judgment.visual.totalParts}칸 띠그래프`
      : `${judgment.visual.totalParts}부분 원그래프`;
    case "pictograph": return `그림 1개 = ${judgment.visual.value}개`;
  }
}

export function summarizeDistractorRationales(
  content: DiagnosisSet,
  judgmentId: string,
  blueprint: DiagnosisCoverageBlueprint
): StudioDistractorRationaleSummary {
  const judgment = content.judgments.find((item) => item.id === judgmentId);
  if (!judgment) {
    return {
      status: "mismatch",
      message: "이 초안의 선택지는 등록된 오답 근거와 일치하지 않습니다.",
      items: []
    };
  }

  const distractors = judgment.choices.filter((choice) => !choice.correct);
  const rationaleEntries = blueprint.distractors.filter(
    (entry) => entry.judgmentId === judgmentId
  );
  const entriesByChoice = new Map(
    rationaleEntries.map((entry) => [entry.choiceId, entry])
  );
  const hasExactChoiceMatch =
    rationaleEntries.length === distractors.length
    && distractors.every((choice) => entriesByChoice.has(choice.id))
    && rationaleEntries.every((entry) =>
      distractors.some((choice) => choice.id === entry.choiceId)
    );

  if (!hasExactChoiceMatch) {
    return {
      status: "mismatch",
      message: "이 초안의 선택지는 등록된 오답 근거와 일치하지 않습니다.",
      items: []
    };
  }

  const items = distractors.map((choice) => {
    const entry = entriesByChoice.get(choice.id)!;
    return {
      choiceId: choice.id,
      choiceLabel: choice.label,
      misconceptionId: entry.misconceptionId,
      misconceptionTitle:
        blueprint.misconceptionTitles[entry.misconceptionId]
        ?? entry.misconceptionId,
      derivation: entry.derivation,
      rationale: entry.rationale
    };
  });
  const sharedRationales = [
    ...new Set(
      rationaleEntries
        .map((entry) => entry.sharedSignalRationale?.trim())
        .filter((value): value is string => Boolean(value))
    )
  ];

  return {
    status: "matched",
    ...(sharedRationales.length === 1
      ? { sharedSignalRationale: sharedRationales[0] }
      : {}),
    items
  };
}

export function structurallyEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(sortObject(left)) === JSON.stringify(sortObject(right));
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, sortObject(item)])
    );
  }
  return value;
}
