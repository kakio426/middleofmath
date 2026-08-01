import { execFileSync } from "node:child_process";
import {
  type LineChartDiagram,
  type LineChartMode
} from "../packages/domain/src/index";
import { lineChartDiagramSchema } from "../packages/content/src/schema";

let seed = 0x4a332d36;
function random(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0x1_0000_0000;
}
function integer(minimum: number, maximum: number): number {
  return minimum + Math.floor(random() * (maximum - minimum + 1));
}

const modes: LineChartMode[] = [
  "tick-unit",
  "point-value",
  "step-change",
  "largest-rise",
  "between-estimate"
];

function makeCase(index: number): unknown {
  const mode = modes[index % modes.length]!;
  const categoryCount = integer(4, 6);
  const tickCount = integer(2, 12);
  const unit = integer(1, 10);
  const baselineValue = integer(0, 5) * 4;
  const points = Array.from({ length: categoryCount }, (_, categoryIndex) => ({
    categoryIndex,
    tick: integer(0, tickCount)
  }));
  const visual: LineChartDiagram = {
    kind: "line-chart-diagram",
    mode,
    axis: {
      unitLabel: index % 3 === 0 ? "cm" : "도",
      baselineValue,
      tickCount,
      labeledTicks: [
        { index: 0, value: baselineValue },
        { index: tickCount, value: baselineValue + tickCount * unit }
      ]
    },
    timeAxis: {
      label: "시각",
      categories: Array.from({ length: categoryCount }, (_, item) => `시점-${item}`)
    },
    points
  };
  if (mode === "point-value") {
    visual.target = { kind: "point", categoryIndex: integer(0, categoryCount - 1) };
  } else if (mode !== "tick-unit") {
    const fromIndex = integer(0, categoryCount - 2);
    visual.target = {
      kind: mode === "between-estimate" ? "midpoint" : "interval",
      fromIndex,
      toIndex: fromIndex + 1
    };
  }

  switch (index % 17) {
    case 0:
      visual.axis.labeledTicks[1]!.value += 1;
      break;
    case 1:
      if (visual.points.length > 1) visual.points[1]!.categoryIndex = 0;
      break;
    case 2:
      visual.points[0]!.tick = tickCount + 1;
      break;
    case 3:
      if (visual.target?.kind === "interval" || visual.target?.kind === "midpoint") {
        visual.target.fromIndex = 0;
        visual.target.toIndex = 2;
      } else if (mode === "tick-unit") {
        visual.target = { kind: "point", categoryIndex: 1 };
      }
      break;
    case 4:
      visual.timeAxis.categories[categoryCount - 1] = visual.timeAxis.categories[0]!;
      break;
    case 5:
      return { ...visual, values: visual.points.map((point) => point.tick) };
    case 6:
      visual.axis.unitLabel = "";
      break;
    case 7:
      visual.axis.baselineValue = 1001;
      visual.axis.labeledTicks = [
        { index: 0, value: 1001 },
        { index: tickCount, value: 1001 + tickCount * unit }
      ];
      break;
    case 8:
      visual.axis.baselineValue = 0;
      visual.axis.tickCount = 10;
      visual.axis.labeledTicks = [
        { index: 0, value: 0 },
        { index: 10, value: 2010 }
      ];
      visual.points.forEach((point) => {
        point.tick %= 11;
      });
      break;
    case 9:
      if (mode === "point-value") {
        visual.target = { kind: "interval", fromIndex: 0, toIndex: 1 };
      } else if (mode === "between-estimate") {
        visual.target = { kind: "interval", fromIndex: 0, toIndex: 1 };
      } else if (mode === "tick-unit") {
        visual.target = { kind: "point", categoryIndex: 1 };
      } else {
        visual.target = { kind: "midpoint", fromIndex: 0, toIndex: 1 };
      }
      break;
    case 10:
      return {
        ...visual,
        axis: { ...visual.axis, tickCount: String(visual.axis.tickCount) }
      };
    case 11:
      return { ...visual, kind: "line-chart" };
    case 12:
      return { ...visual, axis: { ...visual.axis, answer: 12 } };
    case 13:
      visual.axis.labeledTicks[0]!.index = 1;
      break;
    case 14:
      visual.timeAxis.categories[0] = " ";
      break;
    case 15:
      if (mode === "tick-unit") {
        visual.target = { kind: "point", categoryIndex: 1 };
      } else {
        delete visual.target;
      }
      break;
  }
  return visual;
}

const cases = Array.from({ length: 600 }, (_, index) => makeCase(index));
const expected = cases.map((visual) => lineChartDiagramSchema.safeParse(visual).success);
const container = execFileSync(
  "docker",
  ["ps", "--filter", "name=^supabase_db_", "--format", "{{.Names}}"],
  { encoding: "utf8" }
).trim().split("\n")[0];
if (!container) throw new Error("실행 중인 Supabase DB 컨테이너를 찾지 못했습니다.");

const payload = JSON.stringify(cases).replaceAll("$cases$", "");
const sql = `
  select ordinality, public.jsonb_line_chart_diagram_valid(value)
  from jsonb_array_elements($cases$${payload}$cases$::jsonb)
    with ordinality item(value, ordinality)
  order by ordinality;
`;
const output = execFileSync(
  "docker",
  ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres", "-At", "-F", "|"],
  { input: sql, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 }
);
const actual = output.trim().split("\n").map((line) => line.endsWith("|t"));
const mismatches = expected.flatMap((value, index) =>
  value === actual[index]
    ? []
    : [{ index, ts: value, sql: actual[index], visual: cases[index] }]
);
if (mismatches.length > 0) {
  throw new Error(`TS↔SQL mismatch ${mismatches.length}/600\n${
    JSON.stringify(mismatches.slice(0, 5), null, 2)
  }`);
}
console.log("line-chart parity: 600 cases, 0 mismatches");
