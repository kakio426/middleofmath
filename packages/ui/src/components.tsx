import { Fragment, type ReactNode } from "react";
import type {
  EvidenceItem,
  FindingConfidence,
  JudgmentVisual,
  MeasurePart,
  MeasureUnit,
  Severity
} from "@middle-of-math/domain";

const KEEP_WITH_NEXT = new Set([
  "그리고",
  "그래서",
  "그렇다면",
  "다음으로",
  "따라서",
  "또",
  "또한",
  "먼저",
  "그러면",
  "하지만",
  "이때",
  "이제"
]);

function readableSentences(text: string): string[][] {
  const sentences: string[][] = [];
  let current: string[] = [];
  for (const token of text.trim().split(/\s+/).filter(Boolean)) {
    current.push(token);
    if (/[.!?](?:["'”’)\]]*)$/.test(token)) {
      sentences.push(current);
      current = [];
    }
  }
  if (current.length > 0) sentences.push(current);
  return sentences;
}

function readableGroups(tokens: string[]): string[][] {
  const groups: string[][] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    if (KEEP_WITH_NEXT.has(tokens[index]) && tokens[index + 1]) {
      groups.push([tokens[index], tokens[index + 1]]);
      index += 1;
    } else {
      groups.push([tokens[index]]);
    }
  }
  return groups;
}

export function ReadableText({ text }: { text: string }) {
  return (
    <>
      {readableSentences(text).map((sentence, sentenceIndex) => (
        <Fragment key={`${sentence.join("-")}-${sentenceIndex}`}>
          {sentenceIndex > 0 && " "}
          <span className="mom-readable-sentence">
            {readableGroups(sentence).map((group, groupIndex) => (
              <Fragment key={`${group.join("-")}-${groupIndex}`}>
                {groupIndex > 0 && " "}
                <span className={group.length > 1 ? "mom-readable-keep" : undefined}>
                  {group.map((token, tokenIndex) => (
                    <Fragment key={`${token}-${tokenIndex}`}>
                      {tokenIndex > 0 && " "}
                      <span className="mom-readable-token">{token}</span>
                    </Fragment>
                  ))}
                </span>
              </Fragment>
            ))}
          </span>
        </Fragment>
      ))}
    </>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="mom-brand">
      <span className="mom-brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
      <div>
        <p className="mom-eyebrow">Middle of Math</p>
        {!compact && <strong>생각의 중간을 봅니다</strong>}
      </div>
    </div>
  );
}

export function AppShell({
  role,
  actions,
  children
}: {
  role: "student" | "teacher";
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`mom-shell mom-shell-${role}`}>
      <header className="mom-topbar">
        <Brand compact={role === "student"} />
        <div className="mom-topbar-actions">{actions}</div>
      </header>
      <main>{children}</main>
    </div>
  );
}

export function ProgressLine({ value, label = "진단 진행 정도" }: { value: number; label?: string }) {
  const normalized = Math.min(100, Math.max(0, value));
  return (
    <div className="mom-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={normalized}>
      <span style={{ width: `${normalized}%` }} />
    </div>
  );
}

export function ChoiceOption({
  label,
  selected,
  onSelect
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button type="button" className="mom-choice" aria-pressed={selected} onClick={onSelect}>
      <span className="mom-choice-indicator" aria-hidden="true" />
      <span className="mom-readable-text"><ReadableText text={label} /></span>
    </button>
  );
}

export function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "warning" | "risk" }) {
  return <span className={`mom-pill mom-pill-${tone}`}>{children}</span>;
}

const SPOKEN_MEASURE_UNITS: Record<MeasureUnit, string> = {
  mL: "밀리리터",
  L: "리터",
  g: "그램",
  kg: "킬로그램",
  t: "톤"
};

const MEASURE_OBJECT_LABELS = {
  "paper-cup": "종이컵",
  "water-bottle": "큰 물통",
  watermelon: "수박",
  "paper-clip": "종이 클립"
} as const;

const PLACE_VALUE_NAMES = [
  "억의 자리",
  "천만의 자리",
  "백만의 자리",
  "십만의 자리",
  "만의 자리",
  "천의 자리",
  "백의 자리",
  "십의 자리",
  "일의 자리"
] as const;

function PlaceValueChart({
  visual
}: {
  visual: Extract<JudgmentVisual, { kind: "place-value-chart" }>;
}) {
  const placeNames = PLACE_VALUE_NAMES.slice(
    PLACE_VALUE_NAMES.length - visual.digits.length
  );
  const highlighted = new Set(visual.highlightIndexes ?? []);
  return (
    <table className="mom-visual mom-place-value-chart">
      <caption>자리표</caption>
      <thead>
        <tr>
          {placeNames.map((name, index) => (
            <th
              className={[
                highlighted.has(index) ? "is-highlighted" : "",
                index > 0 && (visual.digits.length - index) % 4 === 0
                  ? "is-group-start"
                  : ""
              ].filter(Boolean).join(" ") || undefined}
              key={name}
              scope="col"
            >
              {name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          {visual.digits.map((digit, index) => (
            <td
              className={[
                highlighted.has(index) ? "is-highlighted" : "",
                index > 0 && (visual.digits.length - index) % 4 === 0
                  ? "is-group-start"
                  : ""
              ].filter(Boolean).join(" ") || undefined}
              key={`${placeNames[index]}-${index}`}
            >
              {digit}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

type AngleFigure = Extract<
  JudgmentVisual,
  { kind: "angle-figure" }
>;

type PolygonAngleDiagram = Extract<
  JudgmentVisual,
  { kind: "polygon-angle-diagram" }
>;

type GridTransformDiagram = Extract<
  JudgmentVisual,
  { kind: "grid-transform-diagram" }
>;

type RelationPatternDiagram = Extract<
  JudgmentVisual,
  { kind: "relation-pattern-diagram" }
>;

type BarChartDiagram = Extract<
  JudgmentVisual,
  { kind: "bar-chart-diagram" }
>;

type CircleDiagram = Extract<
  JudgmentVisual,
  { kind: "circle" }
>;

type CircleDiagramMode =
  | "center"
  | "radius"
  | "diameter"
  | "equal-radii"
  | "compass-center"
  | "compass-radius";

function resolvedCircleMode(visual: CircleDiagram): CircleDiagramMode {
  if (visual.mode) return visual.mode;
  if (visual.showDiameter) return "diameter";
  if (visual.showRadius) return "radius";
  return "center";
}

function circleDiagramDescription(visual: CircleDiagram): string {
  const mode = resolvedCircleMode(visual);
  const measurement = visual.radiusValue === undefined
    ? ""
    : ` 표시한 길이는 ${visual.radiusValue}센티미터입니다.`;
  if (mode === "diameter") {
    return `원 위의 점 A와 B를 중심 O를 지나 이은 선분이 표시되어 있습니다.${measurement}`;
  }
  if (mode === "equal-radii") {
    return `중심 O에서 원 위의 점 A, B, C까지 이은 세 선분이 표시되어 있습니다.${measurement}`;
  }
  if (mode === "compass-center" || mode === "compass-radius") {
    return `컴퍼스의 한쪽 끝은 중심 O에, 다른 쪽 끝은 원 위의 점 A에 놓여 있습니다.${measurement}`;
  }
  if (mode === "radius") {
    return `중심 O와 원 위의 점 A를 이은 선분이 표시되어 있습니다.${measurement}`;
  }
  return "중심 O가 표시된 원입니다.";
}

function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

function polarPoint(
  centerX: number,
  centerY: number,
  radius: number,
  degrees: number
): { x: number; y: number } {
  const radians = degrees * Math.PI / 180;
  return {
    x: roundCoordinate(centerX + radius * Math.cos(radians)),
    y: roundCoordinate(centerY - radius * Math.sin(radians))
  };
}

function angleFigureDescription(visual: AngleFigure): string {
  const label = visual.label ? `${visual.label}: ` : "";
  if (visual.mode === "bare") {
    const lengths = visual.rayLengths ?? [70, 70];
    const lengthFact = lengths[0] === lengths[1]
      ? "두 변이 벌어진 각입니다."
      : "두 변이 벌어진 각이며 한 변이 다른 변보다 짧습니다.";
    const reference = visual.referenceRightAngle
      ? " 직각 기준선이 함께 표시됩니다."
      : "";
    return `${label}${lengthFact}${reference} 각의 크기는 숫자로 표시하지 않습니다.`;
  }
  const placement = visual.protractorPlacement ?? "aligned";
  if (placement === "baseline-off") {
    return `${label}각도기의 중심은 꼭짓점에 있으나 0 눈금이 한 변에서 벗어나 있습니다. 안쪽 눈금과 바깥쪽 눈금이 함께 있으며 읽은 값은 표시하지 않습니다.`;
  }
  if (placement === "vertex-off") {
    return `${label}각도기의 중심이 꼭짓점에서 벗어나 있습니다. 안쪽 눈금과 바깥쪽 눈금이 함께 있으며 읽은 값은 표시하지 않습니다.`;
  }
  return `${label}각도기의 중심이 꼭짓점에 있고 0 눈금이 한 변에 맞춰져 있습니다. 안쪽 눈금과 바깥쪽 눈금이 함께 있으며 읽은 값은 표시하지 않습니다.`;
}

function AngleFigureVisual({ visual }: { visual: AngleFigure }) {
  const vertex = { x: 120, y: 132 };
  const rayLengths = visual.rayLengths ?? [86, 86];
  const baseEnd = polarPoint(
    vertex.x,
    vertex.y,
    Math.min(rayLengths[0], 112),
    0
  );
  const angleEnd = polarPoint(
    vertex.x,
    vertex.y,
    Math.min(rayLengths[1], 112),
    visual.degrees
  );
  const arcStart = polarPoint(vertex.x, vertex.y, 25, 0);
  const arcEnd = polarPoint(vertex.x, vertex.y, 25, visual.degrees);
  const placement = visual.protractorPlacement ?? "aligned";
  const protractorCenter = placement === "vertex-off"
    ? { x: vertex.x + 14, y: vertex.y - 10 }
    : vertex;
  const protractorRotation = placement === "baseline-off" ? 12 : 0;
  const ticks = Array.from({ length: 37 }, (_, index) => index * 5);

  return (
    <svg
      aria-label={angleFigureDescription(visual)}
      className="mom-visual mom-semantic-angle mom-angle-figure"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox="0 0 240 160"
    >
      <g aria-hidden="true">
        {visual.label && (
          <text className="mom-angle-label" x="14" y="22">
            {visual.label}
          </text>
        )}
        {visual.mode === "protractor" && (
          <g
            className="mom-protractor"
            transform={`rotate(${protractorRotation} ${protractorCenter.x} ${protractorCenter.y})`}
          >
            <path
              className="mom-protractor-body"
              d={[
                `M ${protractorCenter.x - 82} ${protractorCenter.y}`,
                `A 82 82 0 0 1 ${protractorCenter.x + 82} ${protractorCenter.y}`,
                `L ${protractorCenter.x - 82} ${protractorCenter.y}`,
                "Z"
              ].join(" ")}
            />
            <line
              className="mom-protractor-baseline"
              x1={protractorCenter.x - 82}
              x2={protractorCenter.x + 82}
              y1={protractorCenter.y}
              y2={protractorCenter.y}
            />
            {ticks.map((tick) => {
              const outer = polarPoint(
                protractorCenter.x,
                protractorCenter.y,
                82,
                tick
              );
              const inner = polarPoint(
                protractorCenter.x,
                protractorCenter.y,
                tick % 10 === 0 ? 71 : 77,
                tick
              );
              const insideLabel = polarPoint(
                protractorCenter.x,
                protractorCenter.y,
                62,
                tick
              );
              const outsideLabel = polarPoint(
                protractorCenter.x,
                protractorCenter.y,
                40,
                tick
              );
              const showLabel = tick % 20 === 0 || tick === 90;
              return (
                <g key={tick}>
                  <line
                    className={`mom-protractor-tick${tick % 10 === 0 ? " is-major" : ""}`}
                    x1={outer.x}
                    x2={inner.x}
                    y1={outer.y}
                    y2={inner.y}
                  />
                  {showLabel && (
                    <>
                      <text
                        className="mom-protractor-number"
                        textAnchor="middle"
                        x={insideLabel.x}
                        y={insideLabel.y + 2}
                      >
                        {tick}
                      </text>
                      <text
                        className="mom-protractor-number is-outer"
                        textAnchor="middle"
                        x={outsideLabel.x}
                        y={outsideLabel.y + 2}
                      >
                        {180 - tick}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
            <circle
              className="mom-protractor-center"
              cx={protractorCenter.x}
              cy={protractorCenter.y}
              r="3"
            />
          </g>
        )}
        {visual.referenceRightAngle && (
          <g className="mom-right-angle-reference">
            <line
              x1={vertex.x}
              x2={vertex.x}
              y1={vertex.y}
              y2={vertex.y - 78}
            />
            <path
              d={`M ${vertex.x} ${vertex.y - 13} L ${vertex.x + 13} ${vertex.y - 13} L ${vertex.x + 13} ${vertex.y}`}
            />
          </g>
        )}
        <line
          className="mom-angle-ray"
          x1={vertex.x}
          x2={baseEnd.x}
          y1={vertex.y}
          y2={baseEnd.y}
        />
        <line
          className="mom-angle-ray"
          x1={vertex.x}
          x2={angleEnd.x}
          y1={vertex.y}
          y2={angleEnd.y}
        />
        <path
          className="mom-angle-arc"
          d={`M ${arcStart.x} ${arcStart.y} A 25 25 0 0 0 ${arcEnd.x} ${arcEnd.y}`}
        />
        <circle
          className="mom-angle-vertex"
          cx={vertex.x}
          cy={vertex.y}
          r="3.5"
        />
      </g>
    </svg>
  );
}

function polygonAngleDescription(visual: PolygonAngleDiagram): string {
  const shape = visual.polygon === "triangle" ? "삼각형" : "사각형";
  const angleCopy = visual.angles.map((angle) =>
    `${angle.label} ${angle.value === null ? "물음표" : `${angle.value}도`}`
  ).join(", ");
  const diagonal = visual.diagonal
    ? " 대각선 하나로 두 삼각형으로 나뉘어 있습니다."
    : "";
  return `${shape}. 각은 ${angleCopy}로 표시되어 있습니다.${diagonal}`;
}

type DiagramPoint = readonly [number, number];

function fitDiagramPoints(points: DiagramPoint[]): DiagramPoint[] {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scale = Math.min(184 / (maxX - minX), 96 / (maxY - minY));
  const contentWidth = (maxX - minX) * scale;
  const contentHeight = (maxY - minY) * scale;
  const offsetX = 120 - contentWidth / 2 - minX * scale;
  const offsetY = 84 + contentHeight / 2 + minY * scale;
  return points.map(([x, y]) => [
    roundCoordinate(offsetX + x * scale),
    roundCoordinate(offsetY - y * scale)
  ]);
}

function triangleDiagramPoints(
  visual: PolygonAngleDiagram
): DiagramPoint[] | null {
  const values = visual.angles.map((angle) => angle.value);
  const knownSum = values.reduce<number>(
    (sum, value) => sum + (value ?? 0),
    0
  );
  const completed = values.map((value) => value ?? 180 - knownSum);
  if (
    completed.length !== 3
    || completed.some((value) => value <= 0 || value >= 180)
    || completed.reduce((sum, value) => sum + value, 0) !== 180
  ) {
    return null;
  }
  const [leftAngle] = completed;
  const radians = completed.map((value) => value * Math.PI / 180);
  const base = 176;
  const leftSide = base * Math.sin(radians[1]) / Math.sin(radians[2]);
  const raw: DiagramPoint[] = [
    [0, 0],
    [base, 0],
    [
      leftSide * Math.cos(leftAngle * Math.PI / 180),
      leftSide * Math.sin(leftAngle * Math.PI / 180)
    ]
  ];
  return fitDiagramPoints(raw);
}

function quadrilateralDiagramPoints(
  visual: PolygonAngleDiagram
): DiagramPoint[] | null {
  const values = visual.angles.map((angle) => angle.value);
  if (
    values.length !== 4
    || values.some((value) => value === null)
    || values.reduce<number>((sum, value) => sum + (value ?? 0), 0) !== 360
  ) {
    return null;
  }
  const [, second, third, fourth] = values as number[];
  const directions = [
    0,
    180 - second,
    360 - second - third,
    540 - second - third - fourth
  ].map((degrees) => degrees * Math.PI / 180);
  const vectors = directions.map((radians) => [
    Math.cos(radians),
    Math.sin(radians)
  ] as const);
  const targetX = -(vectors[0][0] + vectors[1][0]);
  const targetY = -(vectors[0][1] + vectors[1][1]);
  const determinant =
    vectors[2][0] * vectors[3][1] - vectors[2][1] * vectors[3][0];
  if (Math.abs(determinant) < 0.0001) return null;
  const thirdLength =
    (targetX * vectors[3][1] - targetY * vectors[3][0]) / determinant;
  const fourthLength =
    (vectors[2][0] * targetY - vectors[2][1] * targetX) / determinant;
  if (thirdLength <= 0 || fourthLength <= 0) return null;
  const raw: DiagramPoint[] = [[0, 0]];
  const lengths = [1, 1, thirdLength];
  for (let index = 0; index < 3; index += 1) {
    const previous = raw[index];
    raw.push([
      previous[0] + lengths[index] * vectors[index][0],
      previous[1] + lengths[index] * vectors[index][1]
    ]);
  }
  return fitDiagramPoints(raw);
}

type PolygonAngleAnnotation = {
  arcPath: string;
  valuePoint: DiagramPoint;
  vertexNamePoint: DiagramPoint;
};

function unitVector(
  from: DiagramPoint,
  to: DiagramPoint
): DiagramPoint {
  const deltaX = to[0] - from[0];
  const deltaY = to[1] - from[1];
  const length = Math.hypot(deltaX, deltaY) || 1;
  return [deltaX / length, deltaY / length];
}

function polygonAngleAnnotations(
  points: DiagramPoint[]
): PolygonAngleAnnotation[] {
  const arcRadius = points.length === 3 ? 17 : 15;
  const valueOffset = points.length === 3 ? 27 : 25;
  const vertexNameOffset = points.length === 3 ? 13 : 12;
  return points.map((vertex, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const towardPrevious = unitVector(vertex, previous);
    const towardNext = unitVector(vertex, next);
    const bisectorX = towardPrevious[0] + towardNext[0];
    const bisectorY = towardPrevious[1] + towardNext[1];
    const bisectorLength = Math.hypot(bisectorX, bisectorY) || 1;
    const inward: DiagramPoint = [
      bisectorX / bisectorLength,
      bisectorY / bisectorLength
    ];
    const arcStart: DiagramPoint = [
      roundCoordinate(vertex[0] + towardPrevious[0] * arcRadius),
      roundCoordinate(vertex[1] + towardPrevious[1] * arcRadius)
    ];
    const arcEnd: DiagramPoint = [
      roundCoordinate(vertex[0] + towardNext[0] * arcRadius),
      roundCoordinate(vertex[1] + towardNext[1] * arcRadius)
    ];
    const cross =
      towardPrevious[0] * towardNext[1]
      - towardPrevious[1] * towardNext[0];
    return {
      arcPath:
        `M ${arcStart[0]} ${arcStart[1]} `
        + `A ${arcRadius} ${arcRadius} 0 0 ${cross > 0 ? 1 : 0} `
        + `${arcEnd[0]} ${arcEnd[1]}`,
      valuePoint: [
        roundCoordinate(vertex[0] + inward[0] * valueOffset),
        roundCoordinate(vertex[1] + inward[1] * valueOffset)
      ],
      vertexNamePoint: [
        roundCoordinate(vertex[0] - inward[0] * vertexNameOffset),
        roundCoordinate(vertex[1] - inward[1] * vertexNameOffset)
      ]
    };
  });
}

function PolygonAngleDiagramVisual({
  visual
}: {
  visual: PolygonAngleDiagram;
}) {
  const fallbackPoints: DiagramPoint[] = visual.polygon === "triangle"
    ? [[30, 132], [210, 132], [96, 36]]
    : [[28, 132], [212, 132], [196, 36], [52, 36]];
  const points = (
    visual.polygon === "triangle"
      ? triangleDiagramPoints(visual)
      : quadrilateralDiagramPoints(visual)
  ) ?? fallbackPoints;
  const annotations = polygonAngleAnnotations(points);
  return (
    <svg
      aria-label={polygonAngleDescription(visual)}
      className="mom-visual mom-semantic-angle mom-polygon-angle"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox="0 0 240 160"
    >
      <g aria-hidden="true">
        <text
          className="mom-polygon-hint"
          textAnchor="middle"
          x="120"
          y="16"
        >
          ※ 그림은 실제 모양과 다를 수 있어요.
        </text>
        <polygon
          className="mom-polygon-shape"
          points={points.map((point) => point.join(",")).join(" ")}
        />
        {visual.diagonal && visual.polygon === "quadrilateral" && (
          <line
            className="mom-polygon-diagonal"
            x1={points[0][0]}
            x2={points[2][0]}
            y1={points[0][1]}
            y2={points[2][1]}
          />
        )}
        {visual.angles.map((angle, index) => {
          const annotation = annotations[index];
          return (
            <g className="mom-polygon-angle-mark" key={angle.label}>
              <path
                className="mom-polygon-angle-arc"
                d={annotation.arcPath}
              />
              <text
                className="mom-polygon-vertex-name"
                textAnchor="middle"
                x={annotation.vertexNamePoint[0]}
                y={annotation.vertexNamePoint[1]}
              >
                {angle.label}
              </text>
              <text
                className="mom-polygon-angle-value"
                dominantBaseline="central"
                textAnchor="middle"
                x={annotation.valuePoint[0]}
                y={annotation.valuePoint[1]}
              >
                {angle.value === null ? "?" : `${angle.value}°`}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function gridCellDescription(cell: { row: number; column: number }): string {
  return `위에서 ${cell.row + 1}번째 칸, 왼쪽에서 ${cell.column + 1}번째 칸`;
}

function gridTransformDescription(visual: GridTransformDiagram): string {
  if (visual.mode === "point-move") {
    const points = visual.points ?? [];
    return `${visual.rows}행 ${visual.columns}열 격자. ${points.map(
      (point) => `${point.label}점은 ${gridCellDescription(point)}의 중심`
    ).join(", ")}에 표시되어 있습니다.`;
  }
  const source = (visual.sourceCells ?? []).map(gridCellDescription).join(", ");
  const target = (visual.targetCells ?? []).map(gridCellDescription).join(", ");
  const marker = visual.sourceMarker && visual.targetMarker
    ? ` 처음 표식은 ${gridCellDescription(visual.sourceMarker)}, 나중 표식은 ${gridCellDescription(visual.targetMarker)}에 있습니다.`
    : "";
  const guide = visual.axisIndex !== undefined
    ? " 점선 기준이 표시되어 있습니다."
    : visual.center
      ? ` 중심점은 ${gridCellDescription(visual.center)}의 중심에 표시되어 있습니다.`
      : "";
  return `${visual.rows}행 ${visual.columns}열 격자. 처음 도형의 칸은 ${source}이고, 나중 도형의 칸은 ${target}입니다.${marker}${guide}`;
}

function GridTransformDiagramVisual({
  visual
}: {
  visual: GridTransformDiagram;
}) {
  const cellSize = Math.min(
    28,
    224 / visual.columns,
    154 / visual.rows
  );
  const gridWidth = visual.columns * cellSize;
  const gridHeight = visual.rows * cellSize;
  const originX = (300 - gridWidth) / 2;
  const originY = 18;
  const centerOf = (cell: { row: number; column: number }) => ({
    x: roundCoordinate(originX + (cell.column + 0.5) * cellSize),
    y: roundCoordinate(originY + (cell.row + 0.5) * cellSize)
  });
  const cellRect = (cell: { row: number; column: number }) => ({
    x: roundCoordinate(originX + cell.column * cellSize + 2),
    y: roundCoordinate(originY + cell.row * cellSize + 2),
    width: roundCoordinate(cellSize - 4),
    height: roundCoordinate(cellSize - 4)
  });
  const legendY = roundCoordinate(originY + gridHeight + 26);
  const axis = visual.axisIndex === undefined
    ? null
    : visual.mode === "flip-left-right"
      ? {
          x1: originX + visual.axisIndex * cellSize,
          x2: originX + visual.axisIndex * cellSize,
          y1: originY - 6,
          y2: originY + gridHeight + 6
        }
      : {
          x1: originX - 6,
          x2: originX + gridWidth + 6,
          y1: originY + visual.axisIndex * cellSize,
          y2: originY + visual.axisIndex * cellSize
        };

  return (
    <svg
      aria-label={gridTransformDescription(visual)}
      className="mom-visual mom-grid-transform"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox="0 0 300 230"
    >
      <g aria-hidden="true">
        <rect
          className="mom-transform-grid-background"
          height={gridHeight}
          rx="4"
          width={gridWidth}
          x={originX}
          y={originY}
        />
        {Array.from({ length: visual.columns + 1 }, (_, index) => (
          <line
            className="mom-transform-grid-line"
            key={`column-${index}`}
            x1={originX + index * cellSize}
            x2={originX + index * cellSize}
            y1={originY}
            y2={originY + gridHeight}
          />
        ))}
        {Array.from({ length: visual.rows + 1 }, (_, index) => (
          <line
            className="mom-transform-grid-line"
            key={`row-${index}`}
            x1={originX}
            x2={originX + gridWidth}
            y1={originY + index * cellSize}
            y2={originY + index * cellSize}
          />
        ))}
        {(visual.targetCells ?? []).map((cell) => (
          <rect
            className="mom-transform-target-cell"
            key={`target-${cell.row}-${cell.column}`}
            {...cellRect(cell)}
          />
        ))}
        {(visual.sourceCells ?? []).map((cell) => (
          <rect
            className="mom-transform-source-cell"
            key={`source-${cell.row}-${cell.column}`}
            {...cellRect(cell)}
          />
        ))}
        {axis && (
          <line
            className="mom-transform-axis"
            {...axis}
          />
        )}
        {visual.center && (() => {
          const center = centerOf(visual.center);
          return (
            <g className="mom-transform-center">
              <circle cx={center.x} cy={center.y} r="4" />
              <path d={`M ${center.x - 9} ${center.y} H ${center.x + 9} M ${center.x} ${center.y - 9} V ${center.y + 9}`} />
            </g>
          );
        })()}
        {visual.sourceMarker && (() => {
          const marker = centerOf(visual.sourceMarker);
          return (
            <circle
              className="mom-transform-source-marker"
              cx={marker.x}
              cy={marker.y}
              r={Math.max(3.5, cellSize * 0.13)}
            />
          );
        })()}
        {visual.targetMarker && (() => {
          const marker = centerOf(visual.targetMarker);
          return (
            <circle
              className="mom-transform-target-marker"
              cx={marker.x}
              cy={marker.y}
              r={Math.max(3.5, cellSize * 0.13)}
            />
          );
        })()}
        {(visual.points ?? []).map((point) => {
          const position = centerOf(point);
          return (
            <g className="mom-transform-point" key={point.label}>
              <circle cx={position.x} cy={position.y} r="5" />
              <text
                textAnchor="middle"
                x={position.x}
                y={position.y - 9}
              >
                {point.label}
              </text>
            </g>
          );
        })}
        {visual.mode !== "point-move" && (
          <g className="mom-transform-legend">
            <rect className="mom-transform-source-cell" height="12" rx="2" width="12" x="83" y={legendY - 10} />
            <text x="100" y={legendY}>처음</text>
            <rect className="mom-transform-target-cell" height="12" rx="2" width="12" x="161" y={legendY - 10} />
            <text x="178" y={legendY}>나중</text>
          </g>
        )}
      </g>
    </svg>
  );
}

function relationPatternDescription(visual: RelationPatternDiagram): string {
  if (visual.mode === "number-sequence") {
    return `수 배열. ${visual.terms!.map((term) => term ?? "빈칸").join(", ")}.`;
  }
  if (visual.mode === "figure-sequence") {
    const figure = visual.figure === "square"
      ? "정사각형"
      : visual.figure === "triangle"
        ? "삼각형"
        : "원";
    return `도형 배열. ${visual.counts!.map(
      (count, index) => `${index + 1}번째 모양은 ${count === null ? "빈칸" : `${figure} ${count}개`}`
    ).join(", ")}.`;
  }
  if (visual.mode === "rule-table") {
    return `${visual.leftLabel}, ${visual.rightLabel} 대응표. ${visual.rows!.map(
      (row) => `${row.left}의 짝은 ${row.right}`
    ).join(", ")}.`;
  }
  if (visual.mode === "calculation-array") {
    return `계산식 배열. ${visual.calculations!.map((item) => {
      const operator = item.operator === "multiply" ? "곱하기" : "나누기";
      return `${item.a} ${operator} ${item.b}, 결과 ${item.result ?? "빈칸"}`;
    }).join(", ")}.`;
  }
  const equation = visual.equation!;
  return `등식. 왼쪽 식은 ${equation.left[0]} 더하기 ${
    equation.left[1]
  }. 오른쪽 식은 ${equation.right[0] ?? "빈칸"} 더하기 ${
    equation.right[1] ?? "빈칸"
  }. 두 식 사이에 등호가 있습니다.`;
}

function RelationFigure({
  count,
  figure,
  order
}: {
  count: number | null;
  figure: NonNullable<RelationPatternDiagram["figure"]>;
  order: number;
}) {
  return (
    <div className="mom-relation-figure-card">
      <strong>{order}번째</strong>
      <svg aria-hidden="true" focusable="false" viewBox="0 0 72 62">
        {count === null ? (
          <text className="mom-relation-figure-unknown" textAnchor="middle" x="36" y="38">?</text>
        ) : Array.from({ length: count }, (_, index) => {
          const x = 15 + (index % 4) * 14;
          const y = 17 + Math.floor(index / 4) * 14;
          if (figure === "triangle") {
            return (
              <path
                className="mom-relation-figure-shape"
                d={`M ${x} ${y - 5} L ${x - 5} ${y + 4} L ${x + 5} ${y + 4} Z`}
                key={index}
              />
            );
          }
          if (figure === "circle") {
            return <circle className="mom-relation-figure-shape" cx={x} cy={y} key={index} r="4.5" />;
          }
          return <rect className="mom-relation-figure-shape" height="9" key={index} rx="1" width="9" x={x - 4.5} y={y - 4.5} />;
        })}
      </svg>
    </div>
  );
}

function RelationPatternVisual({
  visual
}: {
  visual: RelationPatternDiagram;
}) {
  const ariaLabel = relationPatternDescription(visual);
  if (visual.mode === "number-sequence") {
    return (
      <div className="mom-visual mom-relation-pattern mom-relation-number-sequence" role="img" aria-label={ariaLabel}>
        <div className="mom-relation-sequence-track" aria-hidden="true">
          {visual.terms!.map((term, index) => (
            <Fragment key={`${term ?? "blank"}-${index}`}>
              {index > 0 && <span className="mom-relation-arrow">→</span>}
              <strong className={term === null ? "is-unknown" : undefined}>
                {term ?? "?"}
              </strong>
            </Fragment>
          ))}
        </div>
      </div>
    );
  }
  if (visual.mode === "figure-sequence") {
    return (
      <div className="mom-visual mom-relation-pattern mom-relation-figure-sequence" role="img" aria-label={ariaLabel}>
        <div className="mom-relation-figure-track" aria-hidden="true">
          {visual.counts!.map((count, index) => (
            <RelationFigure
              count={count}
              figure={visual.figure!}
              key={index}
              order={index + 1}
            />
          ))}
        </div>
      </div>
    );
  }
  if (visual.mode === "rule-table") {
    return (
      <table className="mom-visual mom-relation-pattern mom-relation-table" aria-label={ariaLabel}>
        <thead>
          <tr>
            <th scope="col">{visual.leftLabel}</th>
            <th scope="col">{visual.rightLabel}</th>
          </tr>
        </thead>
        <tbody>
          {visual.rows!.map((row) => (
            <tr key={`${row.left}-${row.right}`}>
              <td>{row.left}</td>
              <td>{row.right}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (visual.mode === "calculation-array") {
    return (
      <div className="mom-visual mom-relation-pattern mom-relation-calculations" role="img" aria-label={ariaLabel}>
        <div aria-hidden="true">
          {visual.calculations!.map((item, index) => (
            <p key={index}>
              <span>{item.a}</span>
              <span>{item.operator === "multiply" ? "×" : "÷"}</span>
              <span>{item.b}</span>
              <span>=</span>
              <strong className={item.result === null ? "is-unknown" : undefined}>
                {item.result ?? "?"}
              </strong>
            </p>
          ))}
        </div>
      </div>
    );
  }
  const equation = visual.equation!;
  return (
    <div className="mom-visual mom-relation-pattern mom-relation-equation" role="img" aria-label={ariaLabel}>
      <p aria-hidden="true">
        <span>{equation.left[0]}</span>
        <span>+</span>
        <span>{equation.left[1]}</span>
        <span>=</span>
        <strong className={equation.right[0] === null ? "is-unknown" : undefined}>
          {equation.right[0] ?? "?"}
        </strong>
        <span>+</span>
        <strong className={equation.right[1] === null ? "is-unknown" : undefined}>
          {equation.right[1] ?? "?"}
        </strong>
      </p>
    </div>
  );
}

function barChartDescription(visual: BarChartDiagram): string {
  const finalTick = visual.axis.labeledTicks.at(-1)!;
  const direction = visual.axis.orientation === "vertical" ? "세로" : "가로";
  const axis = `${direction} 눈금. 0부터 ${finalTick.value}${
    visual.axis.unitLabel
  }까지 같은 간격 ${visual.axis.tickCount}칸.`;
  if (visual.mode === "table-match") {
    const table = visual.table!.map(
      (row) => `${row.category} ${row.count}${visual.axis.unitLabel}`
    ).join(", ");
    const candidates = visual.candidates!.map((candidate) =>
      `${candidate.id} 그래프는 ${candidate.bars.map(
        (bar) => `${bar.category} ${bar.ticks}칸`
      ).join(", ")}`
    ).join(". ");
    return `${axis} 자료표는 ${table}. ${candidates}.`;
  }
  const bars = visual.bars!.map(
    (bar) => `${bar.category} 막대 ${bar.ticks}칸`
  ).join(", ");
  return `${axis} ${bars}.`;
}

function BarChartSvg({
  axis,
  bars,
  compact = false
}: {
  axis: BarChartDiagram["axis"];
  bars: NonNullable<BarChartDiagram["bars"]>;
  compact?: boolean;
}) {
  const width = 360;
  const height = compact ? 180 : 240;
  const left = axis.orientation === "vertical" ? 46 : 76;
  const right = 18;
  const top = 28;
  const bottom = axis.orientation === "vertical" ? 48 : 30;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const labeledByIndex = new Map(
    axis.labeledTicks.map((tick) => [tick.index, tick.value])
  );
  const patternIds = bars.map(
    (_, index) => `mom-bar-pattern-${axis.orientation}-${bars.length}-${index}`
  );

  return (
    <svg
      aria-hidden="true"
      className="mom-bar-chart-svg"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        {patternIds.map((id, index) => (
          <pattern
            height="8"
            id={id}
            key={id}
            patternUnits="userSpaceOnUse"
            width="8"
          >
            <rect className="mom-bar-fill" height="8" width="8" />
            {index % 3 === 1 && (
              <path className="mom-bar-pattern-line" d="M-2 8 L8 -2 M2 10 L10 2" />
            )}
            {index % 3 === 2 && (
              <circle className="mom-bar-pattern-dot" cx="4" cy="4" r="1.3" />
            )}
          </pattern>
        ))}
      </defs>
      <g>
        {Array.from({ length: axis.tickCount + 1 }, (_, index) => {
          const x = left + (plotWidth * index) / axis.tickCount;
          const y = top + plotHeight - (plotHeight * index) / axis.tickCount;
          const label = labeledByIndex.get(index);
          return axis.orientation === "vertical" ? (
            <Fragment key={index}>
              <line className="mom-bar-grid-line" x1={left} x2={left + plotWidth} y1={y} y2={y} />
              {label !== undefined && (
                <text className="mom-bar-axis-label" textAnchor="end" x={left - 8} y={y + 4}>
                  {label}
                </text>
              )}
            </Fragment>
          ) : (
            <Fragment key={index}>
              <line className="mom-bar-grid-line" x1={x} x2={x} y1={top} y2={top + plotHeight} />
              {label !== undefined && (
                <text className="mom-bar-axis-label" textAnchor="middle" x={x} y={top + plotHeight + 20}>
                  {label}
                </text>
              )}
            </Fragment>
          );
        })}
        <line
          className="mom-bar-axis-line"
          x1={left}
          x2={axis.orientation === "vertical" ? left : left + plotWidth}
          y1={axis.orientation === "vertical" ? top : top + plotHeight}
          y2={top + plotHeight}
        />
        <line
          className="mom-bar-axis-line"
          x1={left}
          x2={left + plotWidth}
          y1={top + plotHeight}
          y2={top + plotHeight}
        />
        <text
          className="mom-bar-unit-label"
          textAnchor={axis.orientation === "vertical" ? "start" : "end"}
          x={axis.orientation === "vertical" ? 4 : width - 2}
          y={14}
        >
          ({axis.unitLabel})
        </text>
        {bars.map((bar, index) => {
          if (axis.orientation === "vertical") {
            const slot = plotWidth / bars.length;
            const barWidth = Math.min(compact ? 34 : 46, slot * 0.58);
            const barHeight = (bar.ticks / axis.tickCount) * plotHeight;
            const x = left + slot * index + (slot - barWidth) / 2;
            const y = top + plotHeight - barHeight;
            return (
              <g key={bar.category}>
                <rect
                  className="mom-bar-mark"
                  fill={`url(#${patternIds[index]})`}
                  height={barHeight}
                  rx="3"
                  width={barWidth}
                  x={x}
                  y={y}
                />
                <text
                  className="mom-bar-category-label"
                  textAnchor="middle"
                  x={x + barWidth / 2}
                  y={top + plotHeight + 25}
                >
                  {bar.category}
                </text>
              </g>
            );
          }
          const slot = plotHeight / bars.length;
          const barHeight = Math.min(compact ? 22 : 30, slot * 0.58);
          const barWidth = (bar.ticks / axis.tickCount) * plotWidth;
          const y = top + slot * index + (slot - barHeight) / 2;
          return (
            <g key={bar.category}>
              <text
                className="mom-bar-category-label"
                dominantBaseline="central"
                textAnchor="end"
                x={left - 8}
                y={y + barHeight / 2}
              >
                {bar.category}
              </text>
              <rect
                className="mom-bar-mark"
                fill={`url(#${patternIds[index]})`}
                height={barHeight}
                rx="3"
                width={barWidth}
                x={left}
                y={y}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function BarChartVisual({ visual }: { visual: BarChartDiagram }) {
  const description = barChartDescription(visual);
  if (visual.mode === "table-match") {
    return (
      <div
        aria-label={description}
        className="mom-visual mom-bar-chart mom-bar-chart-match"
        role="img"
      >
        <table className="mom-bar-data-table" aria-hidden="true">
          <thead>
            <tr>
              {visual.table!.map((row) => <th key={row.category}>{row.category}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              {visual.table!.map((row) => (
                <td key={row.category}>{row.count}{visual.axis.unitLabel}</td>
              ))}
            </tr>
          </tbody>
        </table>
        <div className="mom-bar-candidates" aria-hidden="true">
          {visual.candidates!.map((candidate) => (
            <div className="mom-bar-candidate" key={candidate.id}>
              <strong>{candidate.id}</strong>
              <BarChartSvg axis={visual.axis} bars={candidate.bars} compact />
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div
      aria-label={description}
      className={`mom-visual mom-bar-chart is-${visual.axis.orientation}`}
      role="img"
    >
      <BarChartSvg axis={visual.axis} bars={visual.bars!} />
    </div>
  );
}

type SemanticMeasureVisual = Extract<
  JudgmentVisual,
  { kind: "unit-relation" | "measure-referent" | "quantity-combine" }
>;

function visibleMeasureParts(parts: MeasurePart[]): string {
  return parts.map((part) => `${part.value}${part.unit}`).join(" ");
}

function spokenMeasureParts(parts: MeasurePart[]): string {
  return parts
    .map((part) => `${part.value}${SPOKEN_MEASURE_UNITS[part.unit]}`)
    .join(" ");
}

function spokenTargetUnit(unit: MeasureUnit): string {
  const particle = unit === "g" || unit === "kg" || unit === "t" ? "으로" : "로";
  return `${SPOKEN_MEASURE_UNITS[unit]}${particle}`;
}

function spokenGiven(parts: MeasurePart[]): string {
  const lastUnit = parts.at(-1)?.unit;
  const particle = lastUnit === "g" || lastUnit === "kg" || lastUnit === "t" ? "을" : "를";
  return `${spokenMeasureParts(parts)}${particle}`;
}

export function describeVisual(visual: JudgmentVisual): string | null {
  if (visual.kind === "circle") {
    return circleDiagramDescription(visual);
  }
  if (visual.kind === "angle-figure") {
    return angleFigureDescription(visual);
  }
  if (visual.kind === "polygon-angle-diagram") {
    return polygonAngleDescription(visual);
  }
  if (visual.kind === "grid-transform-diagram") {
    return gridTransformDescription(visual);
  }
  if (visual.kind === "relation-pattern-diagram") {
    return relationPatternDescription(visual);
  }
  if (visual.kind === "bar-chart-diagram") {
    return barChartDescription(visual);
  }
  if (visual.kind === "partition-diagrams") {
    return visual.diagrams.map((diagram) => {
      const equal = new Set(diagram.parts).size === 1;
      const highlighted = diagram.highlightedPart === undefined
        ? ""
        : `, ${diagram.highlightedPart + 1}번째 조각 색칠`;
      return `${diagram.label}: ${equal ? "같은" : "서로 다른"} 너비 ${diagram.parts.length}조각${highlighted}`;
    }).join(". ");
  }
  if (visual.kind === "measurement") {
    return visual.unit === "mL" || visual.unit === "L"
      ? "들이를 재는 눈금 없는 용기 그림"
      : "무게를 재는 바늘이나 눈금이 없는 저울 그림";
  }
  if (visual.kind === "unit-relation") {
    return `${spokenGiven(visual.given)} ${spokenTargetUnit(visual.targetUnit)} 나타내는 관계. 답은 물음표.`;
  }
  if (visual.kind === "measure-referent") {
    const object = MEASURE_OBJECT_LABELS[visual.object];
    return visual.medium === "capacity"
      ? `${object}의 들이를 눈금 없는 비커로 재어 보는 그림`
      : `${object}의 무게를 바늘이나 눈금이 없는 저울로 재어 보는 그림`;
  }
  if (visual.kind === "quantity-combine") {
    const operator = visual.operator === "add" ? "더하기" : "빼기";
    return `${spokenMeasureParts(visual.left)} ${operator} ${spokenMeasureParts(visual.right)}. 답은 물음표.`;
  }
  if (visual.kind === "length-relation") {
    return `${visual.value}${visual.fromUnit}를 ${visual.targetUnit}로 나타내는 관계. 답은 물음표.`;
  }
  return null;
}

function CirclePointLabel({
  label,
  x,
  y
}: {
  label: string;
  x: number;
  y: number;
}) {
  return (
    <text
      className="mom-circle-point-label"
      dominantBaseline="central"
      textAnchor="middle"
      x={x}
      y={y}
    >
      {label}
    </text>
  );
}

function CircleMeasurement({
  value,
  x,
  y
}: {
  value: number | undefined;
  x: number;
  y: number;
}) {
  if (value === undefined) return null;
  return (
    <text
      className="mom-circle-measurement"
      dominantBaseline="central"
      textAnchor="middle"
      x={x}
      y={y}
    >
      {value} cm
    </text>
  );
}

function CircleDiagramVisual({
  visual
}: {
  visual: CircleDiagram;
}) {
  const mode = resolvedCircleMode(visual);
  const compassMode = mode === "compass-center" || mode === "compass-radius";
  if (compassMode) {
    return (
      <svg
        aria-label={circleDiagramDescription(visual)}
        className="mom-visual mom-circle-diagram"
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        viewBox="0 0 240 160"
      >
        <g aria-hidden="true">
          <circle className="mom-circle-outline" cx="90" cy="98" r="42" />
          <line className="mom-circle-radius-segment" x1="90" x2="132" y1="98" y2="98" />
          <circle className="mom-circle-point" cx="90" cy="98" r="2.8" />
          <CirclePointLabel label="O" x={82} y={108} />
          <CirclePointLabel label="A" x={142} y={102} />
          <g className="mom-compass">
            <circle className="mom-compass-hinge" cx="128" cy="28" r="5" />
            <path className="mom-compass-leg" d="M125 33 L91 94" />
            <path className="mom-compass-leg" d="M131 33 L132 92" />
            <path className="mom-compass-needle" d="M91 94 L90 102" />
            <path className="mom-compass-pencil" d="M128 85 L136 85 L132 99 Z" />
          </g>
          {mode === "compass-radius" && (
            <g className="mom-circle-dimension">
              <path d="M90 133 H132 M90 128 V138 M132 128 V138" />
              <CircleMeasurement value={visual.radiusValue} x={111} y={146} />
            </g>
          )}
        </g>
      </svg>
    );
  }

  const center = { x: 120, y: 80 };
  return (
    <svg
      aria-label={circleDiagramDescription(visual)}
      className="mom-visual mom-circle-diagram"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox="0 0 240 160"
    >
      <g aria-hidden="true">
        <circle className="mom-circle-outline" cx={center.x} cy={center.y} r="52" />
        {mode === "radius" && (
          <>
            <line className="mom-circle-radius-segment" x1="120" x2="165" y1="80" y2="54" />
            <circle className="mom-circle-point" cx="120" cy="80" r="2.8" />
            <CirclePointLabel label="O" x={111} y={91} />
            <CirclePointLabel label="A" x={174} y={49} />
            <CircleMeasurement value={visual.radiusValue} x={146} y={61} />
          </>
        )}
        {mode === "diameter" && (
          <>
            <line className="mom-circle-diameter-segment" x1="68" x2="172" y1="80" y2="80" />
            <line className="mom-circle-radius-highlight" x1="120" x2="172" y1="80" y2="80" />
            <circle className="mom-circle-point" cx="120" cy="80" r="2.8" />
            <CirclePointLabel label="A" x={58} y={84} />
            <CirclePointLabel label="O" x={120} y={94} />
            <CirclePointLabel label="B" x={182} y={84} />
            <CircleMeasurement value={visual.radiusValue} x={146} y={68} />
          </>
        )}
        {mode === "equal-radii" && (
          <>
            <line className="mom-circle-radius-segment" x1="120" x2="165" y1="80" y2="54" />
            <line className="mom-circle-radius-segment" x1="120" x2="93" y1="80" y2="33" />
            <line className="mom-circle-radius-segment" x1="120" x2="75" y1="80" y2="106" />
            <circle className="mom-circle-point" cx="120" cy="80" r="2.8" />
            <CirclePointLabel label="O" x={112} y={91} />
            <CirclePointLabel label="A" x={174} y={49} />
            <CirclePointLabel label="B" x={89} y={22} />
            <CirclePointLabel label="C" x={66} y={113} />
            <CircleMeasurement value={visual.radiusValue} x={146} y={61} />
          </>
        )}
        {mode === "center" && (
          <>
            <circle className="mom-circle-point" cx="120" cy="80" r="2.8" />
            <CirclePointLabel label="O" x={111} y={91} />
          </>
        )}
      </g>
    </svg>
  );
}

function PartitionDiagramsVisual({
  visual
}: {
  visual: Extract<JudgmentVisual, { kind: "partition-diagrams" }>;
}) {
  return (
    <div
      className="mom-visual mom-partition-diagrams"
      role="img"
      aria-label={describeVisual(visual) ?? undefined}
    >
      {visual.diagrams.map((diagram) => (
        <div className="mom-partition-diagram" key={diagram.label}>
          <strong>{diagram.label}</strong>
          <span className="mom-partition-strip" aria-hidden="true">
            {diagram.parts.map((part, index) => (
              <i
                className={index === diagram.highlightedPart ? "is-highlighted" : undefined}
                key={`${diagram.label}-${index}`}
                style={{ flexGrow: part }}
              />
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

function UnitRelationVisual({
  visual
}: {
  visual: Extract<SemanticMeasureVisual, { kind: "unit-relation" }>;
}) {
  return (
    <svg
      className="mom-visual mom-semantic-measure"
      viewBox="0 0 640 180"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={describeVisual(visual) ?? undefined}
      focusable="false"
    >
      <g aria-hidden="true">
        <rect className="mom-measure-card" x="28" y="40" width="240" height="100" rx="18" />
        <text aria-hidden="true" className="mom-measure-value" x="148" y="101">{visibleMeasureParts(visual.given)}</text>
        <path className="mom-measure-line" d="M292 90 H356 M342 76 L356 90 342 104" />
        <rect className="mom-measure-card mom-measure-unknown-card" x="382" y="40" width="230" height="100" rx="18" />
        <text aria-hidden="true" className="mom-measure-value" x="497" y="101">? {visual.targetUnit}</text>
      </g>
    </svg>
  );
}

function LengthRelationVisual({
  visual
}: {
  visual: Extract<JudgmentVisual, { kind: "length-relation" }>;
}) {
  return (
    <svg
      className="mom-visual mom-semantic-measure"
      viewBox="0 0 640 180"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={describeVisual(visual) ?? undefined}
      focusable="false"
    >
      <g aria-hidden="true">
        <rect className="mom-measure-card" x="28" y="40" width="240" height="100" rx="18" />
        <text aria-hidden="true" className="mom-measure-value" x="148" y="101">
          {visual.value}{visual.fromUnit}
        </text>
        <path className="mom-measure-line" d="M292 90 H356 M342 76 L356 90 342 104" />
        <rect className="mom-measure-card mom-measure-unknown-card" x="382" y="40" width="230" height="100" rx="18" />
        <text aria-hidden="true" className="mom-measure-value" x="497" y="101">
          ? {visual.targetUnit}
        </text>
      </g>
    </svg>
  );
}

function QuantityCombineVisual({
  visual
}: {
  visual: Extract<SemanticMeasureVisual, { kind: "quantity-combine" }>;
}) {
  const operator = visual.operator === "add" ? "+" : "−";
  return (
    <svg
      className="mom-visual mom-semantic-measure"
      viewBox="0 0 760 190"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={describeVisual(visual) ?? undefined}
      focusable="false"
    >
      <g aria-hidden="true">
        <rect className="mom-measure-card" x="18" y="45" width="220" height="100" rx="18" />
        <text aria-hidden="true" className="mom-measure-value mom-measure-value-compact" x="128" y="106">{visibleMeasureParts(visual.left)}</text>
        <circle className="mom-measure-operator" cx="285" cy="95" r="25" />
        <text aria-hidden="true" className="mom-measure-symbol" x="285" y="104">{operator}</text>
        <rect className="mom-measure-card" x="332" y="45" width="220" height="100" rx="18" />
        <text aria-hidden="true" className="mom-measure-value mom-measure-value-compact" x="442" y="106">{visibleMeasureParts(visual.right)}</text>
        <text aria-hidden="true" className="mom-measure-symbol" x="590" y="104">=</text>
        <rect className="mom-measure-card mom-measure-unknown-card" x="620" y="45" width="122" height="100" rx="18" />
        <text aria-hidden="true" className="mom-measure-value" x="681" y="106">?</text>
      </g>
    </svg>
  );
}

function MeasureObject({
  object
}: {
  object: Extract<SemanticMeasureVisual, { kind: "measure-referent" }>["object"];
}) {
  if (object === "paper-cup") {
    return <path className="mom-measure-shape" d="M92 50 H202 L188 148 Q147 164 106 148 Z" />;
  }
  if (object === "water-bottle") {
    return (
      <>
        <path className="mom-measure-shape" d="M126 34 H170 V57 Q188 72 188 98 V151 Q148 164 108 151 V98 Q108 72 126 57 Z" />
        <path className="mom-measure-line" d="M126 48 H170" />
      </>
    );
  }
  if (object === "watermelon") {
    return (
      <>
        <ellipse className="mom-measure-shape" cx="148" cy="104" rx="78" ry="55" />
        <path className="mom-measure-line mom-measure-detail" d="M113 56 Q91 104 113 152 M148 49 Q132 104 148 159 M183 56 Q205 104 183 152" />
      </>
    );
  }
  return (
    <path
      className="mom-measure-line mom-paper-clip"
      d="M173 66 L116 123 Q94 145 74 125 Q55 105 76 84 L143 37 Q163 23 180 40 Q197 57 179 73 L111 121"
    />
  );
}

function MeasureInstrument({ medium }: { medium: "capacity" | "weight" }) {
  if (medium === "capacity") {
    return (
      <path
        className="mom-measure-shape"
        d="M424 44 H550 L534 150 Q487 166 440 150 Z M550 65 Q589 67 584 101 Q579 128 541 126"
      />
    );
  }
  return (
    <>
      <path className="mom-measure-shape" d="M408 73 Q487 47 566 73 L548 151 H426 Z" />
      <path className="mom-measure-line" d="M451 57 Q487 34 523 57 M404 151 H570" />
    </>
  );
}

function MeasureReferentVisual({
  visual
}: {
  visual: Extract<SemanticMeasureVisual, { kind: "measure-referent" }>;
}) {
  return (
    <svg
      className="mom-visual mom-semantic-measure"
      viewBox="0 0 640 210"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={describeVisual(visual) ?? undefined}
      focusable="false"
    >
      <g aria-hidden="true">
        <MeasureObject object={visual.object} />
        <path className="mom-measure-line mom-measure-guide" d="M270 100 H356 M342 86 L356 100 342 114" />
        <MeasureInstrument medium={visual.medium} />
        <text aria-hidden="true" className="mom-measure-caption" x="148" y="193">{MEASURE_OBJECT_LABELS[visual.object]}</text>
        <text aria-hidden="true" className="mom-measure-caption" x="487" y="193">
          {visual.medium === "capacity" ? "들이 재는 도구" : "무게 재는 도구"}
        </text>
      </g>
    </svg>
  );
}

function LegacyMeasurementVisual({
  visual
}: {
  visual: Extract<JudgmentVisual, { kind: "measurement" }>;
}) {
  const capacity = visual.unit === "mL" || visual.unit === "L";
  return (
    <svg
      className="mom-visual mom-semantic-measure mom-legacy-measure"
      viewBox="0 0 360 180"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={describeVisual(visual) ?? undefined}
      focusable="false"
    >
      <g aria-hidden="true">
        {capacity ? (
          <path className="mom-measure-shape" d="M105 28 H245 L226 143 Q175 160 124 143 Z M245 54 Q282 57 278 91 Q274 118 234 116" />
        ) : (
          <>
            <path className="mom-measure-shape" d="M94 66 Q175 38 256 66 L236 143 H114 Z" />
            <path className="mom-measure-line" d="M136 50 Q175 24 214 50 M89 143 H261" />
          </>
        )}
      </g>
    </svg>
  );
}

export function VisualAid({ visual }: { visual: JudgmentVisual }) {
  if (visual.kind === "none") return null;
  if (visual.kind === "array") {
    return (
      <div className="mom-visual mom-array" role="img" aria-label={visual.label} style={{ gridTemplateColumns: `repeat(${visual.columns}, 1fr)` }}>
        {Array.from({ length: visual.rows * visual.columns }, (_, index) => <span key={index} />)}
      </div>
    );
  }
  if (visual.kind === "item-collection") {
    return (
      <div className="mom-visual mom-item-collection" role="img" aria-label={visual.ariaLabel}>
        {visual.items.map((item, index) => <span aria-hidden="true" key={`${item}-${index}`}>{item}</span>)}
      </div>
    );
  }
  if (visual.kind === "data-table") {
    return (
      <table className="mom-visual mom-data-table">
        <caption>{visual.title}</caption>
        <thead>
          <tr><th scope="col">종류</th><th scope="col">수</th></tr>
        </thead>
        <tbody>
          {visual.rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td className={row.value === "?" ? "is-unknown" : undefined}>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  if (visual.kind === "division-groups") {
    return (
      <div className="mom-visual mom-division" role="img" aria-label={`${visual.total}개를 ${visual.groups}묶음으로 나누는 그림`}>
        <div className="mom-total-number">{visual.total}<small>개</small></div>
        <div className="mom-group-row">
          {Array.from({ length: visual.groups }, (_, index) => <span key={index}>묶음 {index + 1}</span>)}
        </div>
      </div>
    );
  }
  if (visual.kind === "circle") {
    return <CircleDiagramVisual visual={visual} />;
  }
  if (visual.kind === "fraction-bar") {
    if (visual.unknown === "denominator") {
      return (
        <div className="mom-visual mom-fraction mom-fraction-unknown" role="img" aria-label={`분자는 ${visual.numerator}, 분모는 물음표인 분수`}>
          <strong>{visual.numerator}</strong>
          <span aria-hidden="true" />
          <strong>?</strong>
        </div>
      );
    }
    const barCount = visual.unknown
      ? 1
      : Math.max(1, Math.ceil(visual.numerator / visual.denominator));
    const label = visual.unknown
      ? `${visual.denominator}칸으로 나뉜 빈 기준 막대`
      : `한 줄에 ${visual.denominator}칸씩, 모두 ${visual.numerator}칸이 채워진 분수 막대`;
    return (
      <div className="mom-visual mom-fraction" role="img" aria-label={label}>
        {Array.from({ length: barCount }, (_, barIndex) => (
          <div
            className="mom-fraction-row"
            key={barIndex}
            style={{ gridTemplateColumns: `repeat(${visual.denominator}, 1fr)` }}
          >
            {Array.from({ length: visual.denominator }, (_, cellIndex) => {
              const globalIndex = barIndex * visual.denominator + cellIndex;
              return (
                <span
                  key={cellIndex}
                  className={!visual.unknown && globalIndex < visual.numerator ? "is-filled" : ""}
                />
              );
            })}
          </div>
        ))}
      </div>
    );
  }
  if (visual.kind === "partition-diagrams") {
    return <PartitionDiagramsVisual visual={visual} />;
  }
  if (visual.kind === "measurement") {
    return <LegacyMeasurementVisual visual={visual} />;
  }
  if (visual.kind === "length-relation") {
    return <LengthRelationVisual visual={visual} />;
  }
  if (visual.kind === "unit-relation") {
    return <UnitRelationVisual visual={visual} />;
  }
  if (visual.kind === "measure-referent") {
    return <MeasureReferentVisual visual={visual} />;
  }
  if (visual.kind === "quantity-combine") {
    return <QuantityCombineVisual visual={visual} />;
  }
  if (visual.kind === "place-value-chart") {
    return <PlaceValueChart visual={visual} />;
  }
  if (visual.kind === "angle-figure") {
    return <AngleFigureVisual visual={visual} />;
  }
  if (visual.kind === "polygon-angle-diagram") {
    return <PolygonAngleDiagramVisual visual={visual} />;
  }
  if (visual.kind === "grid-transform-diagram") {
    return <GridTransformDiagramVisual visual={visual} />;
  }
  if (visual.kind === "relation-pattern-diagram") {
    return <RelationPatternVisual visual={visual} />;
  }
  if (visual.kind === "bar-chart-diagram") {
    return <BarChartVisual visual={visual} />;
  }
  if (visual.kind === "pictograph") {
    return (
      <div className="mom-visual mom-pictograph" role="img" aria-label={`그림 한 개는 ${visual.value}개를 나타내는 그림그래프`}>
        <p className="mom-legend"><span>{visual.symbol}</span> = {visual.value}개</p>
        {visual.rows.map((row) => (
          <div className="mom-pictograph-row" key={row.label}>
            <strong>{row.label}</strong>
            <span aria-hidden="true">{Array.from({ length: row.count }, () => visual.symbol).join(" ")}</span>
          </div>
        ))}
      </div>
    );
  }
  const exhaustiveVisual: never = visual;
  return exhaustiveVisual;
}

export function EvidenceRail({
  anchor,
  stage,
  evidence,
  choiceNote
}: {
  anchor: string;
  stage: string;
  evidence: EvidenceItem;
  choiceNote?: { title: string; text: string };
}) {
  return (
    <ol className="mom-evidence-rail">
      <li><span>교육과정</span><strong>{anchor}</strong></li>
      <li><span>작은 학습 단계</span><strong>{stage}</strong></li>
      <li><span>관찰 근거</span><strong>{evidence.selectedChoiceLabel}</strong><small>{formatEvidence(evidence)}</small></li>
      {choiceNote && <li><span>오답 해석</span><strong>{choiceNote.title}</strong><small>{choiceNote.text}</small></li>}
    </ol>
  );
}

export function SeverityMark({ severity }: { severity: Severity }) {
  const label = severity === "high" ? "우선 확인" : severity === "medium" ? "관찰됨" : "근거 더 필요";
  return <StatusPill tone={severity === "high" ? "risk" : severity === "medium" ? "warning" : "neutral"}>{label}</StatusPill>;
}

export function ConfidenceMark({
  confidence
}: {
  confidence: FindingConfidence;
}) {
  return (
    <StatusPill tone={confidence === "confirmed" ? "warning" : "neutral"}>
      {confidence === "confirmed" ? "반복 확인" : "한 번 관찰"}
    </StatusPill>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mom-empty">
      <span className="mom-empty-glyph" aria-hidden="true">∴</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}

function formatEvidence(evidence: EvidenceItem): string {
  const time = evidence.durationBand === "long" ? "오래 고민함" : evidence.durationBand === "quick" ? "빠르게 선택함" : "충분히 고민함";
  const changed = evidence.selectionChanges > 0 ? ` · 선택 변경 ${evidence.selectionChanges}회` : "";
  const uncertainty = evidence.uncertainty ? " · 잘 모르겠어요 사용" : "";
  return `${time}${changed}${uncertainty}`;
}
