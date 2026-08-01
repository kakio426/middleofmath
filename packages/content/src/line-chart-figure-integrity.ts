import {
  lineChartExpectedAnswer,
  lineChartPointValue,
  lineChartTickUnit,
  type Judgment,
  type LineChartDiagram
} from "@middle-of-math/domain";

export interface LineChartFigureIssue {
  code: string;
  message: string;
}

function numericLabel(label: string): number | null {
  const match = label.replaceAll(",", "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function visibleNumbers(judgment: Judgment, visual: LineChartDiagram): number[] {
  const copy = [judgment.context ?? "", judgment.prompt, ...visual.timeAxis.categories].join(" ");
  return [
    ...(copy.match(/\d+(?:\.\d+)?/g) ?? []).map(Number),
    ...visual.axis.labeledTicks.map((tick) => tick.value)
  ];
}

function intervalLabel(visual: LineChartDiagram, index: number): string {
  return `${visual.timeAxis.categories[index]}부터 ${
    visual.timeAxis.categories[index + 1]
  }까지`;
}

export function lineChartFigureIssues(
  judgment: Judgment
): LineChartFigureIssue[] {
  if (judgment.visual.kind !== "line-chart-diagram") return [];
  const visual = judgment.visual;
  const ordered = [...visual.points].sort((left, right) => left.categoryIndex - right.categoryIndex);
  const issues: LineChartFigureIssue[] = [];
  const correct = judgment.choices.find((choice) => choice.correct);
  const expected = lineChartExpectedAnswer(visual);
  if (!correct || expected === null) {
    return [{ code: "ANSWER_MISSING", message: "그림에서 정답을 산출할 수 없습니다." }];
  }
  if (typeof expected === "number") {
    const choiceValues = judgment.choices.map((choice) => numericLabel(choice.label));
    if (choiceValues.some((value) => value === null) || new Set(choiceValues).size !== choiceValues.length) {
      issues.push({ code: "CHOICE_VALUES", message: "수치 선택지는 서로 다른 수를 하나씩 포함해야 합니다." });
    }
    if (numericLabel(correct.label) !== expected) {
      issues.push({ code: "ANSWER_ORACLE", message: "정답 표시가 그림에서 계산한 값과 다릅니다." });
    }
    if (visibleNumbers(judgment, visual).includes(expected)) {
      issues.push({ code: "ANSWER_COPY", message: "정답 수가 문장·시간·표시 눈금에 그대로 보입니다." });
    }
    const plottedValues = ordered.flatMap((_, index) => {
      if (
        visual.mode === "point-value"
        && visual.target?.kind === "point"
        && index === visual.target.categoryIndex
      ) {
        return [];
      }
      const value = lineChartPointValue(visual, index);
      return value === null ? [] : [value];
    });
    if (plottedValues.includes(expected)) {
      issues.push({
        code: "ANSWER_EQUALS_PLOTTED_VALUE",
        message: "파생 정답이 다른 점의 값과 같아 목표 계산 없이 맞힐 수 있습니다."
      });
    }
  } else {
    const target = visual.target;
    if (
      target?.kind !== "interval"
      || !correct.label.includes(visual.timeAxis.categories[target.fromIndex]!)
      || !correct.label.includes(visual.timeAxis.categories[target.toIndex]!)
    ) {
      issues.push({ code: "ANSWER_ORACLE", message: "정답 구간이 그림에서 계산한 구간과 다릅니다." });
    }
  }

  const wrongLabels = judgment.choices.filter((choice) => !choice.correct).map((choice) => choice.label);
  const unit = lineChartTickUnit(visual)!;
  if (visual.mode === "tick-unit") {
    const expectedWrong = [1, visual.axis.tickCount];
    if (!expectedWrong.every((value) => wrongLabels.some((label) => numericLabel(label) === value))) {
      issues.push({ code: "DISTRACTOR_ORACLE", message: "눈금 단위 오답이 선언한 두 오해와 다릅니다." });
    }
    if (visual.points.some((point) => point.tick === visual.axis.tickCount)) {
      issues.push({
        code: "DISTRACTOR_PROVENANCE_COLLISION",
        message: "전체 눈금 칸 수 오답이 가장 높은 점의 눈금 위치와 겹칩니다."
      });
    }
  }
  if (visual.mode === "point-value" && visual.target?.kind === "point") {
    const index = visual.target.categoryIndex;
    const neighborValues = [
      lineChartPointValue(visual, index - 1),
      lineChartPointValue(visual, index + 1)
    ].filter((value): value is number => value !== null);
    const hasTickNumber = wrongLabels.some((label) =>
      numericLabel(label) === ordered[index]!.tick
    );
    const hasNeighborValue = neighborValues.some((value) =>
      wrongLabels.some((label) => numericLabel(label) === value)
    );
    if (!hasTickNumber || !hasNeighborValue) {
      issues.push({ code: "DISTRACTOR_ORACLE", message: "점 읽기 오답이 눈금 번호·이웃 점 값과 다릅니다." });
    }
    if (ordered[index]!.tick === unit) {
      issues.push({
        code: "DISTRACTOR_PROVENANCE_COLLISION",
        message: "점의 눈금 번호 오답이 한 눈금의 실제 값과 겹칩니다."
      });
    }
  }
  if (visual.mode === "step-change" && visual.target?.kind === "interval") {
    const { fromIndex, toIndex } = visual.target;
    const tickDifference = Math.abs(ordered[toIndex]!.tick - ordered[fromIndex]!.tick);
    const laterValue = lineChartPointValue(visual, toIndex);
    if (![tickDifference, laterValue].every((value) =>
      wrongLabels.some((label) => numericLabel(label) === value)
    )) {
      issues.push({ code: "DISTRACTOR_ORACLE", message: "변화량 오답이 눈금 차이·나중 값과 다릅니다." });
    }
  }
  if (visual.mode === "largest-rise") {
    const changes = ordered.slice(1).map((point, index) => point.tick - ordered[index]!.tick);
    const absoluteIndex = changes.findIndex((change) =>
      Math.abs(change) === Math.max(...changes.map((candidate) => Math.abs(candidate)))
    );
    const maximumPointIndex = ordered.findIndex((point) =>
      point.tick === Math.max(...ordered.map((candidate) => candidate.tick))
    );
    const maximumIntervalIndex = Math.max(0, maximumPointIndex - 1);
    const expectedWrong = [intervalLabel(visual, absoluteIndex), intervalLabel(visual, maximumIntervalIndex)];
    if (!expectedWrong.every((label) => wrongLabels.includes(label))) {
      issues.push({ code: "DISTRACTOR_ORACLE", message: "증가 구간 오답이 절댓값·최고점 오해와 다릅니다." });
    }
  }
  if (visual.mode === "between-estimate" && visual.target?.kind === "midpoint") {
    const { fromIndex, toIndex } = visual.target;
    const preceding = lineChartPointValue(visual, fromIndex);
    const midpointTick = (ordered[fromIndex]!.tick + ordered[toIndex]!.tick) / 2;
    if (![preceding, midpointTick].every((value) =>
      wrongLabels.some((label) => numericLabel(label) === value)
    )) {
      issues.push({ code: "DISTRACTOR_ORACLE", message: "중간값 오답이 앞 점·눈금 번호 오해와 다릅니다." });
    }
    if (midpointTick === unit) {
      issues.push({
        code: "DISTRACTOR_PROVENANCE_COLLISION",
        message: "중간 높이의 눈금 번호 오답이 한 눈금의 실제 값과 겹칩니다."
      });
    }
  }
  if (unit <= 0) {
    issues.push({ code: "UNIT", message: "눈금 단위가 올바르지 않습니다." });
  }
  return issues;
}
