import type { DiagnosisSet, Judgment, SignalDefinition } from "@middle-of-math/domain";
import { validateDiagnosisSet } from "@middle-of-math/content";

export interface StudioIssue {
  path: string;
  level: "error" | "warning";
  message: string;
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

export function collectStudioIssues(content: DiagnosisSet, baseContent?: DiagnosisSet): StudioIssue[] {
  return validateDiagnosisSet(content, { baseContent }).issues.map((issue) => ({
    path: issue.path,
    level: issue.severity,
    message: issue.message
  }));
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
    case "measurement": return `${judgment.visual.amount}${judgment.visual.unit}`;
    case "pictograph": return `그림 1개 = ${judgment.visual.value}개`;
  }
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
