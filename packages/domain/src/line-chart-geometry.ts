import type { LineChartDiagram } from "./types";

export interface LineChartIssue {
  code: string;
  path: string;
  message: string;
}

function issue(code: string, path: string, message: string): LineChartIssue {
  return { code, path, message };
}

export function lineChartTickUnit(visual: LineChartDiagram): number | null {
  const [first, ...rest] = visual.axis.labeledTicks;
  if (!first || rest.length === 0) return null;
  const units = rest.map((tick) => {
    const distance = tick.index - first.index;
    return distance === 0 ? Number.NaN : (tick.value - first.value) / distance;
  });
  return units.every((unit) => Number.isInteger(unit) && unit > 0 && unit === units[0])
    ? units[0]!
    : null;
}

export function lineChartSeries(visual: LineChartDiagram): number[] | null {
  const unit = lineChartTickUnit(visual);
  if (unit === null) return null;
  const ordered = [...visual.points].sort(
    (left, right) => left.categoryIndex - right.categoryIndex
  );
  return ordered.map((point) => visual.axis.baselineValue + point.tick * unit);
}

export function lineChartPointValue(
  visual: LineChartDiagram,
  categoryIndex: number
): number | null {
  const unit = lineChartTickUnit(visual);
  const point = visual.points.find((candidate) =>
    candidate.categoryIndex === categoryIndex
  );
  return unit === null || !point
    ? null
    : visual.axis.baselineValue + point.tick * unit;
}

export function lineChartExpectedAnswer(
  visual: LineChartDiagram
): number | string | null {
  const unit = lineChartTickUnit(visual);
  if (unit === null) return null;
  if (visual.mode === "tick-unit") return unit;
  const target = visual.target;
  if (!target) return null;
  if (target.kind === "point") {
    return lineChartPointValue(visual, target.categoryIndex);
  }
  const from = lineChartPointValue(visual, target.fromIndex);
  const to = lineChartPointValue(visual, target.toIndex);
  if (from === null || to === null) return null;
  if (target.kind === "midpoint") return (from + to) / 2;
  if (visual.mode === "step-change") return Math.abs(to - from);
  return `${visual.timeAxis.categories[target.fromIndex]}→${
    visual.timeAxis.categories[target.toIndex]
  }`;
}

export function lineChartGeometryIssues(
  visual: LineChartDiagram
): LineChartIssue[] {
  const issues: LineChartIssue[] = [];
  const { axis } = visual;
  if (!Number.isInteger(axis.baselineValue) || axis.baselineValue < 0) {
    issues.push(issue("BASELINE", "axis.baselineValue", "기준값은 0 이상의 정수여야 합니다."));
  }
  if (!Number.isInteger(axis.tickCount) || axis.tickCount < 2 || axis.tickCount > 12) {
    issues.push(issue("TICK_COUNT", "axis.tickCount", "눈금 칸 수는 2~12의 정수여야 합니다."));
  }
  const indexes = axis.labeledTicks.map((tick) => tick.index);
  if (
    axis.labeledTicks.length !== 2
    || indexes[0] !== 0
    || indexes[1] !== axis.tickCount
    || axis.labeledTicks[0]?.value !== axis.baselineValue
  ) {
    issues.push(issue(
      "LABELED_TICKS",
      "axis.labeledTicks",
      "기준 눈금과 마지막 눈금의 값만 정확히 표시해야 합니다."
    ));
  }
  const unit = lineChartTickUnit(visual);
  if (unit === null) {
    issues.push(issue("UNIT", "axis.labeledTicks", "한 칸의 값은 양의 정수여야 합니다."));
  }
  const categories = visual.timeAxis.categories;
  if (categories.length < 4 || categories.length > 6 || new Set(categories).size !== categories.length) {
    issues.push(issue("CATEGORIES", "timeAxis.categories", "시간 항목은 서로 다른 4~6개여야 합니다."));
  }
  const pointIndexes = visual.points.map((point) => point.categoryIndex);
  if (
    visual.points.length !== categories.length
    || new Set(pointIndexes).size !== categories.length
    || [...pointIndexes].sort((a, b) => a - b).some((value, index) => value !== index)
  ) {
    issues.push(issue("POINTS", "points", "각 시간 항목에는 점이 정확히 하나씩 있어야 합니다."));
  }
  if (visual.points.some((point) =>
    !Number.isInteger(point.tick) || point.tick < 0 || point.tick > axis.tickCount
  )) {
    issues.push(issue("POINT_RANGE", "points", "점은 그래프 눈금 범위 안의 정수 칸에 있어야 합니다."));
  }
  if (axis.baselineValue > 0 && visual.points.some((point) => point.tick === 0)) {
    issues.push(issue(
      "WAVE_POINT_BASELINE",
      "points",
      "물결선으로 줄인 축에서는 점을 기준선보다 한 칸 이상 위에 놓아야 합니다."
    ));
  }

  const expectedTargetKind = {
    "tick-unit": undefined,
    "point-value": "point",
    "step-change": "interval",
    "largest-rise": "interval",
    "between-estimate": "midpoint"
  } as const;
  const expected = expectedTargetKind[visual.mode];
  if (expected === undefined ? visual.target !== undefined : visual.target?.kind !== expected) {
    issues.push(issue("TARGET_KIND", "target", "문항 유형에 맞는 목표 지점을 지정해야 합니다."));
  }
  if (unit === null || issues.some((candidate) => candidate.code === "POINTS")) {
    return issues;
  }

  if (visual.mode === "tick-unit" && axis.tickCount === unit) {
    issues.push(issue("TICK_UNIT_COLLISION", "axis", "눈금 칸 수와 한 칸의 값이 같으면 안 됩니다."));
  }
  const target = visual.target;
  if (!target) return issues;
  if (target.kind === "point") {
    if (target.categoryIndex <= 0 || target.categoryIndex >= categories.length - 1) {
      issues.push(issue("POINT_TARGET", "target.categoryIndex", "값을 읽는 점은 그래프 안쪽에 있어야 합니다."));
    } else {
      const value = lineChartPointValue(visual, target.categoryIndex);
      const before = lineChartPointValue(visual, target.categoryIndex - 1);
      const after = lineChartPointValue(visual, target.categoryIndex + 1);
      if (value === before || value === after) {
        issues.push(issue("POINT_NEIGHBOR", "target", "묻는 점은 이웃한 점과 높이가 달라야 합니다."));
      }
    }
    return issues;
  }
  if (target.toIndex !== target.fromIndex + 1) {
    issues.push(issue("ADJACENT", "target", "변화 구간은 이웃한 두 시점이어야 합니다."));
    return issues;
  }
  if (target.fromIndex < 0 || target.toIndex >= categories.length) {
    issues.push(issue("TARGET_RANGE", "target", "목표 구간은 그래프 안에 있어야 합니다."));
    return issues;
  }

  const ordered = [...visual.points].sort((a, b) => a.categoryIndex - b.categoryIndex);
  const tickChanges = ordered.slice(1).map((point, index) => point.tick - ordered[index]!.tick);
  if (visual.mode === "step-change") {
    const targetChange = tickChanges[target.fromIndex];
    if (Math.abs(targetChange ?? 0) < 2) {
      issues.push(issue("STEP_SIZE", "target", "묻는 변화는 두 눈금 이상이어야 합니다."));
    }
    if (tickChanges.filter((change) => Math.abs(change) === Math.abs(targetChange ?? 0)).length !== 1) {
      issues.push(issue("STEP_UNIQUE", "points", "묻는 변화량의 크기는 그래프에서 하나뿐이어야 합니다."));
    }
  }
  if (visual.mode === "largest-rise") {
    const maxRise = Math.max(...tickChanges);
    const riseIndexes = tickChanges.flatMap((change, index) => change === maxRise ? [index] : []);
    const absoluteMax = Math.max(...tickChanges.map((change) => Math.abs(change)));
    const absoluteIndexes = tickChanges.flatMap((change, index) =>
      Math.abs(change) === absoluteMax ? [index] : []
    );
    const globalMaxIndex = ordered.findIndex((point) =>
      point.tick === Math.max(...ordered.map((candidate) => candidate.tick))
    );
    const globalMaxCount = ordered.filter((point) =>
      point.tick === ordered[globalMaxIndex]!.tick
    ).length;
    if (maxRise <= 0 || riseIndexes.length !== 1 || riseIndexes[0] !== target.fromIndex) {
      issues.push(issue("LARGEST_RISE", "target", "목표 구간만 가장 크게 증가해야 합니다."));
    }
    if (
      target.fromIndex === 0
      || target.fromIndex === tickChanges.length - 1
      || absoluteIndexes.length !== 1
      || absoluteIndexes.includes(target.fromIndex)
      || globalMaxCount !== 1
      || [target.fromIndex, target.toIndex].includes(globalMaxIndex)
    ) {
      issues.push(issue("LARGEST_RISE_SHORTCUT", "points", "끝·최댓점·가장 큰 절댓값만 보고 답할 수 없게 구성해야 합니다."));
    }
  }
  if (visual.mode === "between-estimate") {
    const fromPoint = ordered[target.fromIndex]!;
    const toPoint = ordered[target.toIndex]!;
    const sum = fromPoint.tick + toPoint.tick;
    const midpointTick = sum / 2;
    if (!Number.isInteger(midpointTick)) {
      issues.push(issue("MIDPOINT_INTEGER", "target", "중간값은 정확한 눈금에 놓여야 합니다."));
    }
    if (ordered.some((point) => point.tick === midpointTick)) {
      issues.push(issue("MIDPOINT_VISIBLE", "points", "중간값이 이미 표시된 점의 값과 같으면 안 됩니다."));
    }
  }
  return issues;
}
