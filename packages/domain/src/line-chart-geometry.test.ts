import { describe, expect, it } from "vitest";
import type { LineChartDiagram } from "./types";
import {
  lineChartExpectedAnswer,
  lineChartGeometryIssues,
  lineChartSeries,
  lineChartTickUnit
} from "./line-chart-geometry";

const visual: LineChartDiagram = {
  kind: "line-chart-diagram",
  mode: "largest-rise",
  axis: {
    unitLabel: "도",
    baselineValue: 0,
    tickCount: 7,
    labeledTicks: [{ index: 0, value: 0 }, { index: 7, value: 28 }]
  },
  timeAxis: { label: "시각", categories: ["오전 6시", "오전 9시", "낮 12시", "오후 3시", "오후 6시"] },
  points: [
    { categoryIndex: 0, tick: 2 },
    { categoryIndex: 1, tick: 3 },
    { categoryIndex: 2, tick: 6 },
    { categoryIndex: 3, tick: 7 },
    { categoryIndex: 4, tick: 2 }
  ],
  target: { kind: "interval", fromIndex: 1, toIndex: 2 }
};

describe("line chart geometry", () => {
  it("derives all values and the answer from visible ticks", () => {
    expect(lineChartTickUnit(visual)).toBe(4);
    expect(lineChartSeries(visual)).toEqual([8, 12, 24, 28, 8]);
    expect(lineChartExpectedAnswer(visual)).toBe("오전 9시→낮 12시");
    expect(lineChartGeometryIssues(visual)).toEqual([]);
  });

  it("rejects tied largest rises and answer-position shortcuts", () => {
    const mutant = structuredClone(visual);
    mutant.points[3]!.tick = 4;
    mutant.points[4]!.tick = 7;
    expect(lineChartGeometryIssues(mutant).map((entry) => entry.code)).toContain("LARGEST_RISE");

    const absoluteTie = structuredClone(visual);
    absoluteTie.points = [
      { categoryIndex: 0, tick: 6 },
      { categoryIndex: 1, tick: 3 },
      { categoryIndex: 2, tick: 6 },
      { categoryIndex: 3, tick: 7 },
      { categoryIndex: 4, tick: 6 }
    ];
    expect(lineChartGeometryIssues(absoluteTie).map((entry) => entry.code)).toContain(
      "LARGEST_RISE_SHORTCUT"
    );
  });

  it("keeps plotted points above a wave-truncated baseline", () => {
    const mutant = structuredClone(visual);
    mutant.axis.baselineValue = 20;
    mutant.axis.labeledTicks = [{ index: 0, value: 20 }, { index: 7, value: 48 }];
    mutant.points[0]!.tick = 0;
    expect(lineChartGeometryIssues(mutant).map((entry) => entry.code)).toContain(
      "WAVE_POINT_BASELINE"
    );
  });

  it("rejects an odd or already plotted midpoint", () => {
    const midpoint: LineChartDiagram = {
      ...structuredClone(visual),
      mode: "between-estimate",
      points: [
        { categoryIndex: 0, tick: 2 },
        { categoryIndex: 1, tick: 3 },
        { categoryIndex: 2, tick: 5 },
        { categoryIndex: 3, tick: 2 },
        { categoryIndex: 4, tick: 1 }
      ],
      target: { kind: "midpoint", fromIndex: 1, toIndex: 2 }
    };
    midpoint.points[2]!.tick = 4;
    expect(lineChartGeometryIssues(midpoint).map((entry) => entry.code)).toContain("MIDPOINT_INTEGER");
    midpoint.points[2]!.tick = 5;
    midpoint.points[4]!.tick = 4;
    expect(lineChartGeometryIssues(midpoint).map((entry) => entry.code)).toContain("MIDPOINT_VISIBLE");
  });
});
