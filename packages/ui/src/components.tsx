import { Fragment, type ReactNode, useId } from "react";
import type {
  EvidenceItem,
  FindingConfidence,
  JudgmentVisual,
  MeasurePart,
  MeasureUnit,
  PatternBlockName,
  PolygonFigure,
  PolygonOutline,
  QuadrilateralFigure,
  QuadrilateralIndex,
  Severity,
  TileCompositionFigure,
  TriangleCell
} from "@middle-of-math/domain";
import {
  patternBlockCells,
  patternBlockKoreanNames,
  polygonConcaveVertexCount,
  polygonMarkClasses,
  polygonOutlinePoints,
  triangleCellKey,
  triangleCellVertices
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
    const mixedNumberLength = (start: number): number => {
      const whole = tokens[start];
      const fraction = tokens[start + 1];
      if (!whole || !fraction) return 0;
      const isWhole = /^\d+$/.test(whole) || /^\d+(?:과|와)$/.test(whole);
      const isFraction = /^\d+\/\d+(?:[가-힣]+)?[,.)!?]*$/.test(fraction);
      return isWhole && isFraction ? 2 : 0;
    };
    const firstMixedNumberLength = mixedNumberLength(index);
    if (firstMixedNumberLength > 0) {
      let end = index + firstMixedNumberLength;
      while (/^[+−×÷]$/.test(tokens[end] ?? "")) {
        const nextMixedNumberLength = mixedNumberLength(end + 1);
        if (nextMixedNumberLength === 0) break;
        end += 1 + nextMixedNumberLength;
      }
      if (tokens[end] === "=") {
        end += 1;
        if (tokens[end] === "?") end += 1;
      }
      groups.push(tokens.slice(index, end));
      index = end - 1;
    } else if (/^[\d/()+−×÷=?]+$/.test(tokens[index])) {
      const expression: string[] = [];
      while (
        index < tokens.length
        && /^[\d/()+−×÷=?]+$/.test(tokens[index])
      ) {
        expression.push(tokens[index]);
        index += 1;
      }
      index -= 1;
      if (
        expression.length >= 3
        && expression.some((token) => /[()+−×÷=]/.test(token))
      ) {
        groups.push(expression);
      } else if (
        expression.length === 2
        && /^\d+$/.test(expression[0])
        && /^\d+\/\d+$/.test(expression[1])
      ) {
        groups.push(expression);
      } else {
        groups.push(...expression.map((token) => [token]));
      }
    } else if (KEEP_WITH_NEXT.has(tokens[index]) && tokens[index + 1]) {
      groups.push([tokens[index], tokens[index + 1]]);
      index += 1;
    } else {
      groups.push([tokens[index]]);
    }
  }
  return groups;
}

function MathToken({ token }: { token: string }) {
  const matches = [...token.matchAll(/(\d+)\/(\d+)/g)];
  if (matches.length === 0) return token;

  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const [index, match] of matches.entries()) {
    if (match.index! > cursor) {
      parts.push(token.slice(cursor, match.index));
    }
    const numerator = match[1];
    const denominator = match[2];
    parts.push(
      <span
        aria-label={`${denominator}분의 ${numerator}`}
        className="mom-stacked-fraction"
        key={`${match[0]}-${index}`}
        role="math"
      >
        <span className="mom-stacked-fraction-numerator" aria-hidden="true">
          {numerator}
        </span>
        <span className="mom-stacked-fraction-denominator" aria-hidden="true">
          {denominator}
        </span>
      </span>
    );
    cursor = match.index! + match[0].length;
  }
  if (cursor < token.length) parts.push(token.slice(cursor));
  return <>{parts}</>;
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
                      <span className="mom-readable-token"><MathToken token={token} /></span>
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

type LineChartDiagram = Extract<
  JudgmentVisual,
  { kind: "line-chart-diagram" }
>;

type PerimeterAreaDiagram = Extract<
  JudgmentVisual,
  { kind: "perimeter-area-diagram" }
>;

type SolidDiagram = Extract<
  JudgmentVisual,
  { kind: "solid-diagram" }
>;

type PartChartDiagram = Extract<
  JudgmentVisual,
  { kind: "part-chart-diagram" }
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
  const unitName = visual.measurementUnit === "m" ? "미터" : "센티미터";
  const measurement = visual.diameterValue !== undefined
    ? ` 선분 AB의 길이는 ${visual.diameterValue}${unitName}입니다.`
    : visual.radiusValue !== undefined
      ? ` 중심 O에서 원 위의 점까지의 길이는 ${visual.radiusValue}${unitName}입니다.`
      : "";
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

type LineSegmentRayFigure = Extract<
  JudgmentVisual,
  { kind: "line-segment-ray" }
>;
type ClockFace = Extract<JudgmentVisual, { kind: "clock-face" }>;

// 끝점 생김새만 말하고 "선분/반직선/직선" 이름은 붙이지 않는다.
// 이름 자체가 문항의 정답이기 때문이다.
const LINE_END_SHAPES: Record<
  LineSegmentRayFigure["figures"][number]["type"],
  { start: "point" | "arrow"; end: "point" | "arrow" }
> = {
  segment: { start: "point", end: "point" },
  ray: { start: "point", end: "arrow" },
  line: { start: "arrow", end: "arrow" }
};

function lineSegmentRayDescription(visual: LineSegmentRayFigure): string {
  const spokenEnd = (shape: "point" | "arrow") =>
    shape === "point" ? "점으로 막혀 있고" : "화살표로 계속 이어지고";
  const figures = visual.figures.map((figure) => {
    const ends = LINE_END_SHAPES[figure.type];
    return `${figure.label}: 곧은 선의 왼쪽 끝은 ${spokenEnd(ends.start)} 오른쪽 끝은 ${spokenEnd(ends.end)} 있습니다`;
  }).join(". ");
  return `${figures}. 각 선의 이름은 표시하지 않습니다.`;
}

function LineSegmentRayVisual({ visual }: { visual: LineSegmentRayFigure }) {
  const rowHeight = 46;
  const lineStart = 62;
  const lineEnd = 216;
  const height = visual.figures.length * rowHeight + 16;

  return (
    <svg
      aria-label={lineSegmentRayDescription(visual)}
      className="mom-visual mom-line-segment-ray"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox={`0 0 240 ${height}`}
    >
      <g aria-hidden="true">
        {visual.figures.map((figure, index) => {
          const y = index * rowHeight + rowHeight / 2 + 8;
          const ends = LINE_END_SHAPES[figure.type];
          // 화살표 끝은 촉이 들어갈 자리를 남기고, 점 끝은 선을 끝까지 그린다.
          const x1 = ends.start === "arrow" ? lineStart + 9 : lineStart;
          const x2 = ends.end === "arrow" ? lineEnd - 9 : lineEnd;
          return (
            <g key={figure.label}>
              <text className="mom-line-figure-label" x="14" y={y + 5}>
                {figure.label}
              </text>
              <line
                className="mom-line-figure-stroke"
                x1={x1}
                x2={x2}
                y1={y}
                y2={y}
              />
              {ends.start === "point" ? (
                <circle className="mom-line-figure-endpoint" cx={lineStart} cy={y} r="4.5" />
              ) : (
                <polygon
                  className="mom-line-figure-arrow"
                  points={`${lineStart},${y} ${lineStart + 11},${y - 6} ${lineStart + 11},${y + 6}`}
                />
              )}
              {ends.end === "point" ? (
                <circle className="mom-line-figure-endpoint" cx={lineEnd} cy={y} r="4.5" />
              ) : (
                <polygon
                  className="mom-line-figure-arrow"
                  points={`${lineEnd},${y} ${lineEnd - 11},${y - 6} ${lineEnd - 11},${y + 6}`}
                />
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// 시계 눈금 1~12 를 한자어로 읽었을 때 받침이 있는 수. 조사를 고르는 데 쓴다.
const CLOCK_MARK_WITH_FINAL_CONSONANT = new Set([1, 3, 6, 7, 8, 10, 11]);

function clockMarkObjectParticle(mark: number): string {
  return CLOCK_MARK_WITH_FINAL_CONSONANT.has(mark) ? "을" : "를";
}

function clockMarkAndParticle(mark: number): string {
  return CLOCK_MARK_WITH_FINAL_CONSONANT.has(mark) ? "과" : "와";
}

// 시계 바늘이 가리키는 위치만 말하고 읽은 시각은 말하지 않는다.
function clockFaceDescription(visual: ClockFace): string {
  const nextHour = visual.hour === 12 ? 1 : visual.hour + 1;
  const hourPosition = visual.minute === 0
    ? `${visual.hour}${clockMarkObjectParticle(visual.hour)} 정확히 가리키고`
    : `${visual.hour}${clockMarkAndParticle(visual.hour)} ${nextHour} 사이에 있고`;
  const exactMark = visual.minute === 0 ? 12 : visual.minute / 5;
  const beforeMark = Math.floor(visual.minute / 5) === 0
    ? 12
    : Math.floor(visual.minute / 5);
  const minutePosition = visual.minute % 5 === 0
    ? `${exactMark}${clockMarkObjectParticle(exactMark)} 정확히 가리킵니다`
    : `${beforeMark}${clockMarkAndParticle(beforeMark)} ${Math.floor(visual.minute / 5) + 1} 사이에 있습니다`;
  return `1부터 12까지 눈금이 있는 시계입니다. 짧은바늘은 ${hourPosition}, 긴바늘은 ${minutePosition}. 읽은 시각은 숫자로 표시하지 않습니다.`;
}

function ClockFaceVisual({ visual }: { visual: ClockFace }) {
  const center = { x: 120, y: 120 };
  const radius = 100;
  // polarPoint 는 0도가 3시 방향이고 반시계가 양수다. 시계 각도(12시부터
  // 시계방향)를 넘기기 전에 `90 - 각도`로 바꿔 준다.
  const fromClockAngle = (clockDegrees: number, distance: number) =>
    polarPoint(center.x, center.y, distance, 90 - clockDegrees);
  // 눈금 숫자는 바깥(78), 바늘 끝은 그 안쪽에 둔다. 바늘이 자기가 가리키는
  // 숫자를 덮으면 시각을 읽는 문항에서 정답 숫자가 가려지기 때문이다.
  const hourNumberRadius = radius - 22;
  const hourHand = fromClockAngle(
    (visual.hour % 12) * 30 + visual.minute * 0.5,
    radius * 0.44
  );
  const minuteHand = fromClockAngle(visual.minute * 6, radius * 0.66);

  return (
    <svg
      aria-label={clockFaceDescription(visual)}
      className="mom-visual mom-clock-face"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox="0 0 240 240"
    >
      <g aria-hidden="true">
        <circle
          className="mom-clock-dial"
          cx={center.x}
          cy={center.y}
          r={radius}
        />
        {Array.from({ length: 60 }, (_, tick) => {
          const isHourTick = tick % 5 === 0;
          const outer = fromClockAngle(tick * 6, radius);
          const inner = fromClockAngle(tick * 6, radius - (isHourTick ? 12 : 6));
          return (
            <line
              className={`mom-clock-tick${isHourTick ? " is-hour" : ""}`}
              key={tick}
              x1={outer.x}
              x2={inner.x}
              y1={outer.y}
              y2={inner.y}
            />
          );
        })}
        {Array.from({ length: 12 }, (_, index) => {
          const hour = index + 1;
          const position = fromClockAngle(hour * 30, hourNumberRadius);
          return (
            <text
              className="mom-clock-hour-number"
              dominantBaseline="central"
              key={hour}
              textAnchor="middle"
              x={position.x}
              y={position.y}
            >
              {hour}
            </text>
          );
        })}
        <line
          className="mom-clock-hand is-hour"
          x1={center.x}
          x2={hourHand.x}
          y1={center.y}
          y2={hourHand.y}
        />
        <line
          className="mom-clock-hand is-minute"
          x1={center.x}
          x2={minuteHand.x}
          y1={center.y}
          y2={minuteHand.y}
        />
        <circle
          className="mom-clock-pin"
          cx={center.x}
          cy={center.y}
          r="5"
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

type TriangleFigure = Extract<
  JudgmentVisual,
  { kind: "triangle-figure" }
>;

function completedTriangleAngles(
  visual: TriangleFigure
): [number, number, number] | null {
  const angles = visual.angles;
  if (!angles) return null;
  if (
    visual.mode === "side-angle"
    && visual.equalSideIndexes
    && visual.askIndex !== undefined
  ) {
    const [left, right] = visual.equalSideIndexes;
    const givenIndex = visual.askIndex === left ? right : left;
    const given = angles[givenIndex];
    const remaining = [0, 1, 2].find(
      (index) => index !== left && index !== right
    );
    if (given !== null && remaining !== undefined) {
      const completed: [number, number, number] = [0, 0, 0];
      completed[left] = given;
      completed[right] = given;
      completed[remaining] = 180 - given * 2;
      return completed;
    }
  }
  const knownSum = angles.reduce<number>(
    (sum, value) => sum + (value ?? 0),
    0
  );
  return angles.map((value) => value ?? 180 - knownSum) as [
    number,
    number,
    number
  ];
}

function triangleFigurePoints(visual: TriangleFigure): DiagramPoint[] {
  const completedAngles = completedTriangleAngles(visual);
  if (completedAngles) {
    const angleVisual: PolygonAngleDiagram = {
      kind: "polygon-angle-diagram",
      polygon: "triangle",
      mode: "verify-claim",
      angles: completedAngles.map((value, index) => ({
        label: ["ㄱ", "ㄴ", "ㄷ"][index],
        value
      }))
    };
    const points = triangleDiagramPoints(angleVisual);
    if (points) return points;
  }
  const sides = visual.sides ?? [5, 5, 6];
  const [oppositeLeft, oppositeRight, base] = sides;
  const topX =
    (
      oppositeRight * oppositeRight
      + base * base
      - oppositeLeft * oppositeLeft
    ) / (2 * base);
  const topY = Math.sqrt(
    Math.max(1, oppositeRight * oppositeRight - topX * topX)
  );
  return fitDiagramPoints([
    [0, 0],
    [base, 0],
    [topX, topY]
  ]);
}

function triangleFigureDescription(visual: TriangleFigure): string {
  const sides = visual.sides
    ? `세 변의 길이는 ${visual.sides.join("센티미터, ")}센티미터입니다.`
    : "";
  const angles = visual.angles
    ? `각 표시는 ${visual.angles.flatMap((value, index) => {
        if (value !== null) return [`${["ㄱ", "ㄴ", "ㄷ"][index]}에 ${value}도`];
        return visual.askIndex === index
          ? [`${["ㄱ", "ㄴ", "ㄷ"][index]}에 물음표`]
          : [];
      }).join(", ")}입니다.`
    : "";
  const triangleSideNames = ["변 ㄴㄷ", "변 ㄷㄱ", "변 ㄱㄴ"];
  const equalMarks = visual.equalSideIndexes
    ? `${visual.equalSideIndexes
        .map((sideIndex) => triangleSideNames[sideIndex])
        .join("과 ")}에 같은 눈금 표시가 있습니다.`
    : "";
  return ["삼각형 ㄱㄴㄷ.", sides, angles, equalMarks]
    .filter(Boolean)
    .join(" ");
}

function sideEndpoints(
  points: DiagramPoint[],
  sideIndex: number
): [DiagramPoint, DiagramPoint] {
  if (sideIndex === 0) return [points[1], points[2]];
  if (sideIndex === 1) return [points[2], points[0]];
  return [points[0], points[1]];
}

function TriangleFigureVisual({ visual }: { visual: TriangleFigure }) {
  const points = triangleFigurePoints(visual);
  const annotations = polygonAngleAnnotations(points);
  const centroid: DiagramPoint = [
    points.reduce((sum, point) => sum + point[0], 0) / 3,
    points.reduce((sum, point) => sum + point[1], 0) / 3
  ];
  const equalSideIndexes = visual.equalSideIndexes ?? [];
  return (
    <svg
      aria-label={triangleFigureDescription(visual)}
      className="mom-visual mom-triangle-figure"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox="0 0 240 170"
    >
      <g aria-hidden="true">
        <polygon
          className="mom-triangle-shape"
          points={points.map((point) => point.join(",")).join(" ")}
        />
        {visual.sides?.map((value, sideIndex) => {
          const [start, end] = sideEndpoints(points, sideIndex);
          const midpoint: DiagramPoint = [
            (start[0] + end[0]) / 2,
            (start[1] + end[1]) / 2
          ];
          const away = unitVector(centroid, midpoint);
          const labelPoint: DiagramPoint = [
            midpoint[0] + away[0] * 14,
            midpoint[1] + away[1] * 14
          ];
          return (
            <g key={`side-${sideIndex}`}>
              <text
                className="mom-triangle-side-value"
                dominantBaseline="central"
                textAnchor="middle"
                x={roundCoordinate(labelPoint[0])}
                y={roundCoordinate(labelPoint[1])}
              >
                {value} cm
              </text>
            </g>
          );
        })}
        {equalSideIndexes.map((sideIndex) => {
          const [start, end] = sideEndpoints(points, sideIndex);
          const midpoint: DiagramPoint = [
            (start[0] + end[0]) / 2,
            (start[1] + end[1]) / 2
          ];
          const normal = unitVector(start, end);
          return (
            <line
              className="mom-triangle-equal-mark"
              key={`equal-side-${sideIndex}`}
              x1={roundCoordinate(midpoint[0] - normal[1] * 6)}
              x2={roundCoordinate(midpoint[0] + normal[1] * 6)}
              y1={roundCoordinate(midpoint[1] + normal[0] * 6)}
              y2={roundCoordinate(midpoint[1] - normal[0] * 6)}
            />
          );
        })}
        {visual.angles?.map((value, index) => {
          if (value === null && visual.askIndex !== index) return null;
          return (
            <g className="mom-triangle-angle-mark" key={`angle-${index}`}>
            <path
              className="mom-triangle-angle-arc"
              d={annotations[index].arcPath}
            />
            <text
              className="mom-triangle-angle-value"
              dominantBaseline="central"
              textAnchor="middle"
              x={annotations[index].valuePoint[0]}
              y={annotations[index].valuePoint[1]}
            >
              {value === null ? "㉠" : `${value}°`}
            </text>
          </g>
          );
        })}
        {points.map((point, index) => (
          <text
            className="mom-triangle-vertex-name"
            key={`vertex-${index}`}
            textAnchor="middle"
            x={annotations[index].vertexNamePoint[0]}
            y={annotations[index].vertexNamePoint[1]}
          >
            {["ㄱ", "ㄴ", "ㄷ"][index]}
          </text>
        ))}
      </g>
    </svg>
  );
}

const QUADRILATERAL_VERTEX_NAMES = ["ㄱ", "ㄴ", "ㄷ", "ㄹ"] as const;

function quadrilateralSideEndpoints(
  points: DiagramPoint[],
  sideIndex: QuadrilateralIndex
): [DiagramPoint, DiagramPoint] {
  return [points[sideIndex], points[(sideIndex + 1) % 4]];
}

function quadrilateralFigurePoints(
  visual: QuadrilateralFigure
): DiagramPoint[] {
  if (visual.mode !== "opposite-angle") {
    return fitDiagramPoints(visual.vertices.map(([x, y]) => [x, y]));
  }
  const givenIndex = visual.angles.findIndex((value) => value !== null);
  const given = visual.angles[givenIndex] ?? 70;
  const lowerLeftAngle = givenIndex % 2 === 1 ? given : 180 - given;
  const radians = lowerLeftAngle * Math.PI / 180;
  const slanted = 8;
  const base = 13;
  return fitDiagramPoints([
    [slanted * Math.cos(radians), slanted * Math.sin(radians)],
    [0, 0],
    [base, 0],
    [
      base + slanted * Math.cos(radians),
      slanted * Math.sin(radians)
    ]
  ]);
}

function quadrilateralFigureDescription(
  visual: QuadrilateralFigure
): string {
  const parts = ["사각형 ㄱㄴㄷㄹ."];
  if ("rightAngleVertexIndexes" in visual) {
    parts.push(
      `${visual.rightAngleVertexIndexes.map(
        (index) => `꼭짓점 ${QUADRILATERAL_VERTEX_NAMES[index]}`
      ).join(", ")}에 직각 표시가 있습니다.`
    );
  }
  if ("parallelSidePairs" in visual) {
    parts.push(
      visual.parallelSidePairs.map(([left, right], pairIndex) =>
        `${["한 개", "두 개"][pairIndex]} 화살표가 변 `
        + `${QUADRILATERAL_VERTEX_NAMES[left]}`
        + `${QUADRILATERAL_VERTEX_NAMES[(left + 1) % 4]}과 변 `
        + `${QUADRILATERAL_VERTEX_NAMES[right]}`
        + `${QUADRILATERAL_VERTEX_NAMES[(right + 1) % 4]}에 표시되어 있습니다.`
      ).join(" ")
    );
  }
  if ("equalSideGroups" in visual) {
    parts.push(
      visual.equalSideGroups.map((group, groupIndex) =>
        `${["한 개", "두 개", "세 개"][groupIndex]} 눈금이 `
        + `${group.map((index) =>
          `변 ${QUADRILATERAL_VERTEX_NAMES[index]}`
          + `${QUADRILATERAL_VERTEX_NAMES[(index + 1) % 4]}`
        ).join(", ")}에 표시되어 있습니다.`
      ).join(" ")
    );
  }
  if ("sideLengthLabels" in visual) {
    parts.push(
      `변의 길이는 ${visual.sideLengthLabels.map((label) =>
        `변 ${QUADRILATERAL_VERTEX_NAMES[label.sideIndex]}`
        + `${QUADRILATERAL_VERTEX_NAMES[(label.sideIndex + 1) % 4]}`
        + ` ${label.lengthCm}센티미터`
      ).join(", ")}로 표시되어 있습니다.`
    );
    parts.push(
      `두 변 사이에 직각 표시가 있는 ${visual.distanceSegment.lengthCm}센티미터 선분이 있습니다.`
    );
  }
  if ("angles" in visual) {
    parts.push(
      `각 표시는 ${visual.angles.flatMap((value, index) => {
        if (value !== null) {
          return [`${QUADRILATERAL_VERTEX_NAMES[index]}에 ${value}도`];
        }
        return visual.askAngleIndex === index
          ? [`${QUADRILATERAL_VERTEX_NAMES[index]}에 물음표`]
          : [];
      }).join(", ")}입니다.`
    );
  }
  return parts.join(" ");
}

function quadMarkPath(
  start: DiagramPoint,
  end: DiagramPoint,
  markCount: number
): string {
  const midpoint: DiagramPoint = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2
  ];
  const along = unitVector(start, end);
  const normal: DiagramPoint = [-along[1], along[0]];
  const offsets = markCount === 1 ? [0] : [-5, 5];
  return offsets.map((offset) => {
    const center: DiagramPoint = [
      midpoint[0] + along[0] * offset,
      midpoint[1] + along[1] * offset
    ];
    const left: DiagramPoint = [
      center[0] - along[0] * 4 + normal[0] * 3,
      center[1] - along[1] * 4 + normal[1] * 3
    ];
    const right: DiagramPoint = [
      center[0] + along[0] * 4 + normal[0] * 3,
      center[1] + along[1] * 4 + normal[1] * 3
    ];
    return `M ${roundCoordinate(left[0])} ${roundCoordinate(left[1])} `
      + `L ${roundCoordinate(center[0])} ${roundCoordinate(center[1])} `
      + `L ${roundCoordinate(right[0])} ${roundCoordinate(right[1])}`;
  }).join(" ");
}

export function quadrilateralFigureLabelPoints(
  visual: QuadrilateralFigure
): DiagramPoint[] {
  const points = quadrilateralFigurePoints(visual);
  const annotations = polygonAngleAnnotations(points);
  const centroid: DiagramPoint = [
    points.reduce((sum, point) => sum + point[0], 0) / 4,
    points.reduce((sum, point) => sum + point[1], 0) / 4
  ];
  const labels: DiagramPoint[] = annotations.map(
    (annotation) => annotation.vertexNamePoint
  );
  if ("sideLengthLabels" in visual) {
    for (const label of visual.sideLengthLabels) {
      const [start, end] = quadrilateralSideEndpoints(
        points,
        label.sideIndex
      );
      const midpoint: DiagramPoint = [
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2
      ];
      const away = unitVector(centroid, midpoint);
      labels.push([
        midpoint[0] + away[0] * 15,
        midpoint[1] + away[1] * 15
      ]);
    }
  }
  if ("distanceSegment" in visual) {
    const source = points[visual.distanceSegment.fromVertexIndex];
    const [sideStart, sideEnd] = quadrilateralSideEndpoints(
      points,
      visual.distanceSegment.toSideIndex
    );
    const side = unitVector(sideStart, sideEnd);
    const rawSide: DiagramPoint = [
      sideEnd[0] - sideStart[0],
      sideEnd[1] - sideStart[1]
    ];
    const startToSource: DiagramPoint = [
      source[0] - sideStart[0],
      source[1] - sideStart[1]
    ];
    const projection = (
      startToSource[0] * rawSide[0]
      + startToSource[1] * rawSide[1]
    ) / (
      rawSide[0] * rawSide[0]
      + rawSide[1] * rawSide[1]
    );
    const foot: DiagramPoint = [
      sideStart[0] + rawSide[0] * projection,
      sideStart[1] + rawSide[1] * projection
    ];
    labels.push([
      (source[0] + foot[0]) / 2 + side[0] * 10,
      (source[1] + foot[1]) / 2 + side[1] * 10
    ]);
  }
  if ("angles" in visual) {
    visual.angles.forEach((value, index) => {
      if (value !== null || visual.askAngleIndex === index) {
        labels.push(annotations[index].valuePoint);
      }
    });
  }
  return labels;
}

function QuadrilateralFigureVisual({
  visual
}: {
  visual: QuadrilateralFigure;
}) {
  const points = quadrilateralFigurePoints(visual);
  const annotations = polygonAngleAnnotations(points);
  const centroid: DiagramPoint = [
    points.reduce((sum, point) => sum + point[0], 0) / 4,
    points.reduce((sum, point) => sum + point[1], 0) / 4
  ];
  return (
    <svg
      aria-label={quadrilateralFigureDescription(visual)}
      className="mom-visual mom-quadrilateral-figure"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox="0 0 240 180"
    >
      <g aria-hidden="true">
        <polygon
          className="mom-quad-shape"
          points={points.map((point) => point.join(",")).join(" ")}
        />
        {"rightAngleVertexIndexes" in visual
          && visual.rightAngleVertexIndexes.map((index) => {
            const vertex = points[index];
            const previous = points[(index + 3) % 4];
            const next = points[(index + 1) % 4];
            const toPrevious = unitVector(vertex, previous);
            const toNext = unitVector(vertex, next);
            const first: DiagramPoint = [
              vertex[0] + toPrevious[0] * 11,
              vertex[1] + toPrevious[1] * 11
            ];
            const corner: DiagramPoint = [
              first[0] + toNext[0] * 11,
              first[1] + toNext[1] * 11
            ];
            const second: DiagramPoint = [
              vertex[0] + toNext[0] * 11,
              vertex[1] + toNext[1] * 11
            ];
            return (
              <path
                className="mom-quad-right-angle"
                d={`M ${first.join(" ")} L ${corner.join(" ")} L ${second.join(" ")}`}
                key={`right-${index}`}
              />
            );
          })}
        {"parallelSidePairs" in visual
          && visual.parallelSidePairs.flatMap(([left, right], pairIndex) =>
            [left, right].map((sideIndex) => {
              const [start, end] = quadrilateralSideEndpoints(
                points,
                sideIndex
              );
              return (
                <path
                  className="mom-quad-parallel-arrow"
                  d={quadMarkPath(start, end, pairIndex + 1)}
                  key={`parallel-${pairIndex}-${sideIndex}`}
                />
              );
            })
          )}
        {"equalSideGroups" in visual
          && visual.equalSideGroups.flatMap((group, groupIndex) =>
            group.map((sideIndex) => {
              const [start, end] = quadrilateralSideEndpoints(
                points,
                sideIndex
              );
              const midpoint: DiagramPoint = [
                (start[0] + end[0]) / 2,
                (start[1] + end[1]) / 2
              ];
              const along = unitVector(start, end);
              const normal: DiagramPoint = [-along[1], along[0]];
              const offsets = groupIndex === 0 ? [0] : [-4, 4];
              return offsets.map((offset, markIndex) => (
                <line
                  className="mom-quad-equal-mark"
                  key={`equal-${groupIndex}-${sideIndex}-${markIndex}`}
                  x1={roundCoordinate(
                    midpoint[0] + along[0] * offset - normal[0] * 6
                  )}
                  x2={roundCoordinate(
                    midpoint[0] + along[0] * offset + normal[0] * 6
                  )}
                  y1={roundCoordinate(
                    midpoint[1] + along[1] * offset - normal[1] * 6
                  )}
                  y2={roundCoordinate(
                    midpoint[1] + along[1] * offset + normal[1] * 6
                  )}
                />
              ));
            })
          )}
        {"sideLengthLabels" in visual
          && visual.sideLengthLabels.map((label) => {
            const [start, end] = quadrilateralSideEndpoints(
              points,
              label.sideIndex
            );
            const midpoint: DiagramPoint = [
              (start[0] + end[0]) / 2,
              (start[1] + end[1]) / 2
            ];
            const away = unitVector(centroid, midpoint);
            return (
              <text
                className="mom-quad-side-value"
                dominantBaseline="central"
                key={`side-value-${label.sideIndex}`}
                textAnchor="middle"
                x={roundCoordinate(midpoint[0] + away[0] * 15)}
                y={roundCoordinate(midpoint[1] + away[1] * 15)}
              >
                {label.lengthCm} cm
              </text>
            );
          })}
        {"distanceSegment" in visual && (() => {
          const source = points[visual.distanceSegment.fromVertexIndex];
          const [sideStart, sideEnd] = quadrilateralSideEndpoints(
            points,
            visual.distanceSegment.toSideIndex
          );
          const side = unitVector(sideStart, sideEnd);
          const rawSide: DiagramPoint = [
            sideEnd[0] - sideStart[0],
            sideEnd[1] - sideStart[1]
          ];
          const startToSource: DiagramPoint = [
            source[0] - sideStart[0],
            source[1] - sideStart[1]
          ];
          const projection = (
            startToSource[0] * rawSide[0]
            + startToSource[1] * rawSide[1]
          ) / (
            rawSide[0] * rawSide[0]
            + rawSide[1] * rawSide[1]
          );
          const foot: DiagramPoint = [
            sideStart[0] + rawSide[0] * projection,
            sideStart[1] + rawSide[1] * projection
          ];
          const towardSource = unitVector(foot, source);
          const labelPoint: DiagramPoint = [
            (source[0] + foot[0]) / 2 + side[0] * 10,
            (source[1] + foot[1]) / 2 + side[1] * 10
          ];
          const squareA: DiagramPoint = [
            foot[0] + side[0] * 8,
            foot[1] + side[1] * 8
          ];
          const squareB: DiagramPoint = [
            squareA[0] + towardSource[0] * 8,
            squareA[1] + towardSource[1] * 8
          ];
          const squareC: DiagramPoint = [
            foot[0] + towardSource[0] * 8,
            foot[1] + towardSource[1] * 8
          ];
          return (
            <>
              <line
                className="mom-quad-distance-segment"
                x1={source[0]}
                x2={foot[0]}
                y1={source[1]}
                y2={foot[1]}
              />
              <path
                className="mom-quad-distance-right-angle"
                d={`M ${squareA.join(" ")} L ${squareB.join(" ")} L ${squareC.join(" ")}`}
              />
              <text
                className="mom-quad-distance-value"
                dominantBaseline="central"
                textAnchor="middle"
                x={roundCoordinate(labelPoint[0])}
                y={roundCoordinate(labelPoint[1])}
              >
                {visual.distanceSegment.lengthCm} cm
              </text>
            </>
          );
        })()}
        {"angles" in visual && visual.angles.map((value, index) => {
          if (value === null && visual.askAngleIndex !== index) return null;
          return (
            <g className="mom-quad-angle-mark" key={`angle-${index}`}>
              <path
                className="mom-quad-angle-arc"
                d={annotations[index].arcPath}
              />
              <text
                className="mom-quad-angle-value"
                dominantBaseline="central"
                textAnchor="middle"
                x={annotations[index].valuePoint[0]}
                y={annotations[index].valuePoint[1]}
              >
                {value === null ? "㉠" : `${value}°`}
              </text>
            </g>
          );
        })}
        {points.map((point, index) => (
          <text
            className="mom-quad-vertex-name"
            key={`vertex-${index}`}
            textAnchor="middle"
            x={annotations[index].vertexNamePoint[0]}
            y={annotations[index].vertexNamePoint[1]}
          >
            {QUADRILATERAL_VERTEX_NAMES[index]}
          </text>
        ))}
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

function lineChartDescription(visual: LineChartDiagram): string {
  const first = visual.axis.labeledTicks[0]!;
  const last = visual.axis.labeledTicks.at(-1)!;
  const wave = visual.axis.baselineValue > 0
    ? ` 세로축은 물결선 아래를 줄였고 기준값은 ${visual.axis.baselineValue}${visual.axis.unitLabel}입니다.`
    : "";
  const axis = `세로축 단위는 ${visual.axis.unitLabel}이고 ${first.value}부터 ${last.value}까지 ${visual.axis.tickCount}칸입니다.${wave}`;
  const points = [...visual.points]
    .sort((left, right) => left.categoryIndex - right.categoryIndex)
    .map((point) => `${visual.timeAxis.categories[point.categoryIndex]} ${point.tick}칸`)
    .join(", ");
  return `${axis} 가로축은 ${visual.timeAxis.label}이며 점은 차례로 ${points}입니다.`;
}

function perimeterAreaDescription(visual: PerimeterAreaDiagram): string {
  if (visual.shape === "rectangle") {
    return `가로 ${visual.width}센티미터, 세로 ${visual.height}센티미터인 직사각형`;
  }
  if (visual.shape === "square") {
    return `한 변이 ${visual.side}센티미터인 정사각형`;
  }
  if (visual.shape === "parallelogram") {
    return `밑변 ${visual.base}센티미터, 높이 ${visual.height}센티미터인 평행사변형`;
  }
  if (visual.shape === "triangle") {
    return `밑변 ${visual.base}센티미터, 높이 ${visual.height}센티미터인 삼각형`;
  }
  if (visual.shape === "trapezoid") {
    return `윗변 ${visual.topBase}센티미터, 아랫변 ${visual.bottomBase}센티미터, 높이 ${visual.height}센티미터인 사다리꼴`;
  }
  if (visual.shape === "rhombus") {
    return `두 대각선이 ${visual.diagonal1}센티미터와 ${visual.diagonal2}센티미터인 마름모`;
  }
  return "길이가 표시된 도형";
}

function DimensionLabel({ x, y, children }: {
  x: number;
  y: number;
  children: ReactNode;
}) {
  return <text className="mom-area-dimension" textAnchor="middle" x={x} y={y}>{children}</text>;
}

function HeightGuide({ x, top, bottom }: { x: number; top: number; bottom: number }) {
  return (
    <g>
      <line className="mom-area-height" x1={x} x2={x} y1={top} y2={bottom} />
      <path className="mom-area-right-angle" d={`M ${x} ${bottom - 11} h 11 v 11`} />
    </g>
  );
}

function fitAreaMeasures(
  horizontal: number,
  vertical: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number; scale: number } {
  const scale = Math.min(maxWidth / horizontal, maxHeight / vertical);
  return {
    width: roundCoordinate(horizontal * scale),
    height: roundCoordinate(vertical * scale),
    scale
  };
}

function PerimeterAreaVisual({ visual }: { visual: PerimeterAreaDiagram }) {
  let body: ReactNode;
  if (visual.shape === "rectangle") {
    const fitted = fitAreaMeasures(visual.width, visual.height, 180, 110);
    const left = roundCoordinate(150 - fitted.width / 2);
    const top = roundCoordinate(95 - fitted.height / 2);
    const bottom = roundCoordinate(top + fitted.height);
    body = <>
      <rect className="mom-area-shape" height={fitted.height} width={fitted.width} x={left} y={top} />
      <DimensionLabel x={150} y={bottom + 28}>{visual.width} cm</DimensionLabel>
      <DimensionLabel x={left - 25} y={100}>{visual.height} cm</DimensionLabel>
      <path className="mom-area-right-angle" d={`M ${left} ${top + 12} h 12 v -12`} />
    </>;
  } else if (visual.shape === "square") {
    body = <>
      <rect className="mom-area-shape" height="130" width="130" x="85" y="30" />
      <DimensionLabel x={150} y={188}>{visual.side} cm</DimensionLabel>
      <path className="mom-area-right-angle" d="M 85 42 h 12 v -12" />
      <path className="mom-area-equal-mark" d="M 147 26 v 8 M 147 156 v 8 M 81 91 h 8 M 211 91 h 8" />
    </>;
  } else if (visual.shape === "parallelogram") {
    const fitted = fitAreaMeasures(visual.base, visual.height, 185, 115);
    const shear = roundCoordinate(Math.min(32, fitted.width * 0.22));
    const bottomLeft = roundCoordinate(150 - (fitted.width + shear) / 2);
    const bottomRight = roundCoordinate(bottomLeft + fitted.width);
    const topLeft = roundCoordinate(bottomLeft + shear);
    const topRight = roundCoordinate(topLeft + fitted.width);
    const bottom = 160;
    const top = roundCoordinate(bottom - fitted.height);
    body = <>
      <polygon
        className="mom-area-shape"
        points={`${topLeft},${top} ${topRight},${top} ${bottomRight},${bottom} ${bottomLeft},${bottom}`}
      />
      <HeightGuide bottom={bottom} top={top} x={topLeft} />
      <DimensionLabel x={(bottomLeft + bottomRight) / 2} y={190}>{visual.base} cm</DimensionLabel>
      <DimensionLabel x={topLeft + 23} y={(top + bottom) / 2 + 5}>{visual.height} cm</DimensionLabel>
    </>;
  } else if (visual.shape === "triangle") {
    const fitted = fitAreaMeasures(visual.base, visual.height, 200, 130);
    const left = roundCoordinate(150 - fitted.width / 2);
    const right = roundCoordinate(left + fitted.width);
    const bottom = 165;
    const top = roundCoordinate(bottom - fitted.height);
    const apex = roundCoordinate(left + fitted.width * 0.43);
    body = <>
      <polygon className="mom-area-shape" points={`${left},${bottom} ${right},${bottom} ${apex},${top}`} />
      <HeightGuide bottom={bottom} top={top} x={apex} />
      <DimensionLabel x={150} y={195}>{visual.base} cm</DimensionLabel>
      <DimensionLabel x={apex + 24} y={(top + bottom) / 2 + 5}>{visual.height} cm</DimensionLabel>
    </>;
  } else if (visual.shape === "trapezoid") {
    const fitted = fitAreaMeasures(visual.bottomBase, visual.height, 200, 120);
    const topWidth = roundCoordinate(visual.topBase * fitted.scale);
    const bottomLeft = roundCoordinate(150 - fitted.width / 2);
    const bottomRight = roundCoordinate(150 + fitted.width / 2);
    const topLeft = roundCoordinate(150 - topWidth / 2);
    const topRight = roundCoordinate(150 + topWidth / 2);
    const bottom = 165;
    const top = roundCoordinate(bottom - fitted.height);
    body = <>
      <polygon
        className="mom-area-shape"
        points={`${topLeft},${top} ${topRight},${top} ${bottomRight},${bottom} ${bottomLeft},${bottom}`}
      />
      <HeightGuide bottom={bottom} top={top} x={topLeft} />
      <DimensionLabel x={150} y={top - 12}>{visual.topBase} cm</DimensionLabel>
      <DimensionLabel x={150} y={195}>{visual.bottomBase} cm</DimensionLabel>
      <DimensionLabel x={topLeft + 24} y={(top + bottom) / 2 + 5}>{visual.height} cm</DimensionLabel>
    </>;
  } else if (visual.shape === "rhombus") {
    const fitted = fitAreaMeasures(visual.diagonal1, visual.diagonal2, 210, 166);
    const left = roundCoordinate(150 - fitted.width / 2);
    const right = roundCoordinate(150 + fitted.width / 2);
    const top = roundCoordinate(105 - fitted.height / 2);
    const bottom = roundCoordinate(105 + fitted.height / 2);
    body = <>
      <polygon className="mom-area-shape" points={`150,${top} ${right},105 150,${bottom} ${left},105`} />
      <line className="mom-area-diagonal" x1={left} x2={right} y1="105" y2="105" />
      <line className="mom-area-diagonal" x1="150" x2="150" y1={top} y2={bottom} />
      <path className="mom-area-right-angle" d="M 150 94 h 11 v 11" />
      <DimensionLabel x={150 + fitted.width * 0.27} y={94}>{visual.diagonal1} cm</DimensionLabel>
      <DimensionLabel x={123} y={105 - fitted.height * 0.24}>{visual.diagonal2} cm</DimensionLabel>
    </>;
  } else {
    body = null;
  }
  return (
    <svg
      aria-label={perimeterAreaDescription(visual)}
      className={`mom-visual mom-perimeter-area is-${visual.shape}`}
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox="0 0 300 210"
    >
      <g aria-hidden="true">{body}</g>
    </svg>
  );
}

const SOLID_STRUCTURE_DESCRIPTIONS: Record<Exclude<SolidDiagram["shape"], "unit-cubes">, string> = {
  "rectangular-prism": "마주 보는 면들이 서로 평행하고, 직사각형 면들로 둘러싸인 입체도형",
  cube: "크기가 같은 정사각형 면들로 둘러싸인 입체도형",
  "triangular-prism": "서로 평행한 삼각형 면이 앞뒤에 있고 대응하는 변들이 직사각형 면으로 이어진 입체도형",
  "square-pyramid": "정사각형 밑면의 네 꼭짓점에서 삼각형 옆면들이 위의 한 점으로 모이는 입체도형",
  cylinder: "위아래에 서로 평행한 합동인 원 모양 면이 있고 굽은 옆면으로 이어진 입체도형",
  cone: "아래에 원 모양 면이 있고 굽은 옆면이 위의 한 점으로 모이는 입체도형",
  sphere: "평평한 면이나 모서리, 꼭짓점이 없이 모든 방향으로 둥근 입체도형"
};

const SOLID_NET_DESCRIPTIONS: Record<Exclude<SolidDiagram["shape"], "unit-cubes">, string> = {
  "rectangular-prism": "직사각형 면 여섯 장이 모서리를 따라 이어진 전개도",
  cube: "크기가 같은 정사각형 면 여섯 장이 모서리를 따라 이어진 전개도",
  "triangular-prism": "삼각형 면 두 장과 직사각형 면 세 장이 모서리를 따라 이어진 전개도",
  "square-pyramid": "정사각형 면 한 장 둘레에 삼각형 면 네 장이 이어진 전개도",
  cylinder: "직사각형 한 장과 같은 크기의 원 두 장으로 된 전개도",
  cone: "부채꼴 한 장과 원 한 장으로 된 전개도",
  sphere: "잘라서 평면에 겹치지 않게 펼칠 수 없는 둥근 겉면을 나타낸 그림"
};

function solidDescription(visual: SolidDiagram): string {
  if (visual.mode === "unit-stack") {
    return `앞 방향이 ${visual.frontDirection === "left" ? "왼쪽" : "오른쪽"}으로 표시된 쌓기나무 그림. 쌓기나무의 위치는 ${visual.cubes
      .map(([x, y, z]) => `가로 ${x + 1}, 세로 ${y + 1}, 높이 ${z + 1}칸`)
      .join(", ")}입니다.`;
  }
  if (visual.mode !== "dimensions") {
    return visual.mode === "net"
      ? SOLID_NET_DESCRIPTIONS[visual.shape]
      : SOLID_STRUCTURE_DESCRIPTIONS[visual.shape];
  }
  if (visual.shape === "rectangular-prism") {
    return `가로 ${visual.width}센티미터, 세로 ${visual.depth}센티미터, 높이 ${visual.height}센티미터인 직육면체`;
  }
  if (visual.shape === "cube") {
    return `한 모서리가 ${visual.width}센티미터인 정육면체`;
  }
  return `밑면의 반지름이 ${visual.radius}센티미터, 높이가 ${visual.height}센티미터인 원기둥`;
}

function BoxStructure({ cube = false }: { cube?: boolean }) {
  const front = cube ? "92,72 220,72 220,178 92,178" : "72,78 226,78 226,174 72,174";
  const back = cube ? "126,42 254,42 254,148 126,148" : "116,42 270,42 270,138 116,138";
  return <>
    <polygon className="mom-solid-face is-back" points={back} />
    <polygon className="mom-solid-face is-front" points={front} />
    <path className="mom-solid-edge" d={cube
      ? "M92 72 L126 42 M220 72 L254 42 M220 178 L254 148 M92 178 L126 148"
      : "M72 78 L116 42 M226 78 L270 42 M226 174 L270 138 M72 174 L116 138"} />
  </>;
}

function SolidStructure({ shape }: { shape: Exclude<SolidDiagram["shape"], "unit-cubes"> }) {
  if (shape === "rectangular-prism" || shape === "cube") {
    return <BoxStructure cube={shape === "cube"} />;
  }
  if (shape === "triangular-prism") {
    return <>
      <polygon className="mom-solid-face is-back" points="135,42 245,148 92,148" />
      <polygon className="mom-solid-face is-front" points="105,72 215,178 62,178" />
      <path className="mom-solid-edge" d="M105 72 L135 42 M215 178 L245 148 M62 178 L92 148" />
    </>;
  }
  if (shape === "square-pyramid") {
    return <>
      <polygon className="mom-solid-face is-front" points="55,165 205,183 278,142 128,125" />
      <path className="mom-solid-edge" d="M165 38 L55 165 L205 183 L278 142 L165 38 M128 125 L165 38 M55 165 L128 125 L278 142" />
      <path className="mom-solid-hidden" d="M128 125 L205 183" />
    </>;
  }
  if (shape === "cylinder") {
    return <>
      <path className="mom-solid-face" d="M92 66 V160 C92 184 248 184 248 160 V66" />
      <ellipse className="mom-solid-face is-top" cx="170" cy="66" rx="78" ry="25" />
      <path className="mom-solid-hidden" d="M92 160 C92 136 248 136 248 160" />
    </>;
  }
  if (shape === "cone") {
    return <>
      <path className="mom-solid-face" d="M170 35 L82 166 C82 194 258 194 258 166 Z" />
      <path className="mom-solid-hidden" d="M82 166 C82 138 258 138 258 166" />
      <path className="mom-solid-edge" d="M82 166 C82 194 258 194 258 166" />
    </>;
  }
  return <>
    <circle className="mom-solid-face" cx="170" cy="112" r="78" />
    <ellipse className="mom-solid-hidden" cx="170" cy="112" rx="78" ry="27" />
  </>;
}

function SolidNet({ shape }: { shape: Exclude<SolidDiagram["shape"], "unit-cubes"> }) {
  if (shape === "cylinder") {
    return <>
      <rect className="mom-solid-net-face" data-net-face="side" height="80" width="157.079633" x="101.460184" y="72" />
      <circle className="mom-solid-net-face" cx="180" cy="47" data-net-face="top-base" r="25" />
      <circle className="mom-solid-net-face" cx="180" cy="177" data-net-face="bottom-base" r="25" />
    </>;
  }
  if (shape === "cone") {
    return <>
      <path className="mom-solid-net-face" d="M80 150 A100 100 0 0 1 180 50 L180 150 Z" data-net-face="side-sector" />
      <circle className="mom-solid-net-face" cx="55" cy="150" data-net-face="base" r="25" />
    </>;
  }
  if (shape === "triangular-prism") {
    return <>
      <rect className="mom-solid-net-face" height="42" width="150" x="90" y="46" />
      <rect className="mom-solid-net-face" height="42" width="150" x="90" y="88" />
      <rect className="mom-solid-net-face" height="42" width="150" x="90" y="130" />
      <polygon className="mom-solid-net-face" points="90,88 90,130 53.626933,109" />
      <polygon className="mom-solid-net-face" points="240,88 240,130 276.373067,109" />
    </>;
  }
  if (shape === "square-pyramid") {
    return <>
      <rect className="mom-solid-net-face" height="70" width="70" x="145" y="80" />
      <polygon className="mom-solid-net-face" points="145,80 215,80 180,34" />
      <polygon className="mom-solid-net-face" points="145,150 215,150 180,196" />
      <polygon className="mom-solid-net-face" points="145,80 145,150 99,115" />
      <polygon className="mom-solid-net-face" points="215,80 215,150 261,115" />
    </>;
  }
  if (shape === "sphere") return <SolidStructure shape="sphere" />;
  if (shape === "cube") {
    const size = 42;
    const faces = [[2,0],[0,1],[1,1],[2,1],[3,1],[2,2]];
    return <>{faces.map(([column, row], index) => (
      <rect
        className="mom-solid-net-face"
        data-net-face={`cube-${index + 1}`}
        height={size}
        key={index}
        width={size}
        x={72 + column! * size}
        y={50 + row! * size}
      />
    ))}</>;
  }
  const faces = [
    { x: 50, y: 90, width: 50, height: 42 },
    { x: 100, y: 90, width: 34, height: 42 },
    { x: 134, y: 90, width: 50, height: 42 },
    { x: 184, y: 90, width: 34, height: 42 },
    { x: 134, y: 56, width: 50, height: 34 },
    { x: 134, y: 132, width: 50, height: 34 }
  ];
  return <>{faces.map((face, index) => (
    <rect
      className="mom-solid-net-face"
      data-net-face={`box-${index + 1}`}
      height={face.height}
      key={index}
      width={face.width}
      x={face.x}
      y={face.y}
    />
  ))}</>;
}

function DimensionLabels({ visual }: { visual: Extract<SolidDiagram, { mode: "dimensions" }> }) {
  if (visual.shape === "cube") {
    return <DimensionLabel x={156} y={204}>{visual.width} cm</DimensionLabel>;
  }
  if (visual.shape === "rectangular-prism") {
    return <>
      <DimensionLabel x={148} y={204}>{visual.width} cm</DimensionLabel>
      <DimensionLabel x={276} y={163}>{visual.depth} cm</DimensionLabel>
      <DimensionLabel x={45} y={130}>{visual.height} cm</DimensionLabel>
    </>;
  }
  return <>
    <line className="mom-solid-measure" x1="170" x2="246" y1="66" y2="66" />
    <DimensionLabel x={210} y={55}>{visual.radius} cm</DimensionLabel>
    <DimensionLabel x={70} y={120}>{visual.height} cm</DimensionLabel>
  </>;
}

function unitCubeOrigin(x: number, y: number, z: number) {
  return {
    x: 168 + (x - y) * 34,
    y: 176 + (x + y) * 17 - z * 34
  };
}

function unitStackViewBox(visual: Extract<SolidDiagram, { mode: "unit-stack" }>) {
  const origins = visual.cubes.map(([x, y, z]) => unitCubeOrigin(x, y, z));
  const arrowX = visual.frontDirection === "left" ? [30, 96] : [264, 330];
  const minX = Math.min(...origins.map((origin) => origin.x - 34), ...arrowX) - 12;
  const maxX = Math.max(...origins.map((origin) => origin.x + 34), ...arrowX) + 12;
  const minY = Math.min(...origins.map((origin) => origin.y - 17), 190) - 12;
  const maxY = Math.max(...origins.map((origin) => origin.y + 51), 226) + 12;
  return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
}

function UnitCube({ x, y, z }: { x: number; y: number; z: number }) {
  const { x: originX, y: originY } = unitCubeOrigin(x, y, z);
  return <g className="mom-unit-cube">
    <polygon className="is-top" points={`${originX},${originY - 17} ${originX + 34},${originY} ${originX},${originY + 17} ${originX - 34},${originY}`} />
    <polygon className="is-left" points={`${originX - 34},${originY} ${originX},${originY + 17} ${originX},${originY + 51} ${originX - 34},${originY + 34}`} />
    <polygon className="is-right" points={`${originX + 34},${originY} ${originX},${originY + 17} ${originX},${originY + 51} ${originX + 34},${originY + 34}`} />
  </g>;
}

function SolidDiagramVisual({ visual }: { visual: SolidDiagram }) {
  const body = visual.mode === "unit-stack"
    ? [...visual.cubes]
        .sort((left, right) => left[2] - right[2] || left[1] - right[1] || left[0] - right[0])
        .map(([x, y, z]) => <UnitCube key={`${x}-${y}-${z}`} x={x} y={y} z={z} />)
    : visual.mode === "net"
      ? <SolidNet shape={visual.shape} />
      : <>
          <SolidStructure shape={visual.shape} />
          {visual.mode === "dimensions" && <DimensionLabels visual={visual} />}
        </>;
  return <svg
    aria-label={solidDescription(visual)}
    className={`mom-visual mom-solid-diagram is-${visual.mode} is-${visual.shape}`}
    focusable="false"
    preserveAspectRatio="xMidYMid meet"
    role="img"
    viewBox={visual.mode === "unit-stack" ? unitStackViewBox(visual) : "0 0 360 230"}
  >
    <g aria-hidden="true">{body}</g>
    {visual.mode === "unit-stack" && <g aria-hidden="true" className="mom-solid-front-arrow">
      <path d={visual.frontDirection === "left" ? "M84 210 H38 L52 198 M38 210 L52 222" : "M276 210 H322 L308 198 M322 210 L308 222"} />
      <text x={visual.frontDirection === "left" ? 90 : 270} y="216">앞</text>
    </g>}
  </svg>;
}

const PART_CHART_CLASSES = ["is-a", "is-b", "is-c", "is-d", "is-e", "is-f"];

function PartChartPattern({ index, prefix }: { index: number; prefix: string }) {
  const patternId = `${prefix}-pattern-${index}`;
  const patternClass = PART_CHART_CLASSES[index];
  const marks = [
    <circle className="mom-part-chart-pattern-dot" cx="4" cy="4" key="dots" r="1.7" />,
    <path className="mom-part-chart-pattern-mark" d="M -2 4 L 4 -2 M 2 12 L 12 2 M 10 14 L 14 10" key="diagonal" />,
    <path className="mom-part-chart-pattern-mark" d="M 0 3 H 12 M 3 0 V 12" key="grid" />,
    <path className="mom-part-chart-pattern-mark" d="M 0 4 H 12" key="horizontal" />,
    <path className="mom-part-chart-pattern-mark" d="M 0 4 L 4 0 L 8 4 L 4 8 Z" key="diamond" />,
    <path className="mom-part-chart-pattern-mark" d="M 4 0 V 12" key="vertical" />
  ];
  return <pattern
    data-part-pattern={index}
    height="8"
    id={patternId}
    patternUnits="userSpaceOnUse"
    width="8"
  >
    <rect className={`mom-part-chart-pattern-background ${patternClass}`} height="8" width="8" />
    {marks[index]}
  </pattern>;
}

function partChartPatternFill(prefix: string, index: number) {
  return `url(#${prefix}-pattern-${index})`;
}

function partChartDescription(visual: PartChartDiagram): string {
  const partUnit = visual.mode === "strip" ? "칸" : "부분";
  return `${visual.mode === "strip" ? "띠그래프" : "원그래프"}. 전체 ${visual.totalParts}${partUnit} 가운데 ${visual.segments
    .map((segment) => `${segment.label} ${segment.parts}${partUnit}`)
    .join(", ")}으로 나뉘어 있습니다.`;
}

function PartChartVisual({ visual }: { visual: PartChartDiagram }) {
  const chartId = useId().replace(/[^a-zA-Z0-9_-]/g, "") || "chart";
  const patternPrefix = `mom-part-chart-${chartId}`;
  const unitSegments = visual.segments.flatMap((segment, segmentIndex) =>
    Array.from({ length: segment.parts }, () => segmentIndex)
  );
  return <svg
    aria-label={partChartDescription(visual)}
    className={`mom-visual mom-part-chart is-${visual.mode}`}
    focusable="false"
    preserveAspectRatio="xMidYMid meet"
    role="img"
    viewBox="0 0 360 230"
  >
    <defs>
      {visual.segments.map((segment, index) => (
        <PartChartPattern index={index} key={segment.label} prefix={patternPrefix} />
      ))}
    </defs>
    <g aria-hidden="true">
      {visual.mode === "strip" ? (
        <>
          {unitSegments.map((segmentIndex, index) => (
            <rect
              className={`mom-part-chart-piece ${PART_CHART_CLASSES[segmentIndex]}`}
              data-part-pattern={segmentIndex}
              fill={partChartPatternFill(patternPrefix, segmentIndex)}
              height="72"
              key={index}
              width={320 / visual.totalParts}
              x={20 + index * 320 / visual.totalParts}
              y="45"
            />
          ))}
          <text className="mom-part-chart-total" textAnchor="middle" x="180" y="30">전체 {visual.totalParts}칸</text>
        </>
      ) : <>
        <text className="mom-part-chart-total" textAnchor="middle" x="180" y="16">전체 {visual.totalParts}부분</text>
        {unitSegments.map((segmentIndex, index) => {
        const start = index / visual.totalParts * Math.PI * 2 - Math.PI / 2;
        const end = (index + 1) / visual.totalParts * Math.PI * 2 - Math.PI / 2;
        const x1 = 180 + 78 * Math.cos(start);
        const y1 = 100 + 78 * Math.sin(start);
        const x2 = 180 + 78 * Math.cos(end);
        const y2 = 100 + 78 * Math.sin(end);
        return <path
          className={`mom-part-chart-piece ${PART_CHART_CLASSES[segmentIndex]}`}
          data-part-pattern={segmentIndex}
          d={`M 180 100 L ${roundCoordinate(x1)} ${roundCoordinate(y1)} A 78 78 0 0 1 ${roundCoordinate(x2)} ${roundCoordinate(y2)} Z`}
          fill={partChartPatternFill(patternPrefix, segmentIndex)}
          key={index}
        />;
      })}</>}
      <g className="mom-part-chart-legend">
        {visual.segments.map((segment, index) => {
          const x = 28 + (index % 3) * 108;
          const y = 178 + Math.floor(index / 3) * 26;
          return <g key={segment.label}>
            <rect
              className={`mom-part-chart-key ${PART_CHART_CLASSES[index]}`}
              data-part-pattern={index}
              fill={partChartPatternFill(patternPrefix, index)}
              height="14"
              rx="2"
              width="14"
              x={x}
              y={y - 12}
            />
            <text x={x + 20} y={y}>{segment.label}</text>
          </g>;
        })}
      </g>
    </g>
  </svg>;
}

function LineChartVisual({ visual }: { visual: LineChartDiagram }) {
  const width = 430;
  const height = 310;
  const left = 58;
  const right = 22;
  const top = 48;
  const bottom = 98;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const ordered = [...visual.points].sort(
    (a, b) => a.categoryIndex - b.categoryIndex
  );
  const xForIndex = (index: number) => left + (
    visual.timeAxis.categories.length === 1
      ? 0
      : plotWidth * index / (visual.timeAxis.categories.length - 1)
  );
  const yForTick = (tick: number) => top + plotHeight - plotHeight * tick / visual.axis.tickCount;
  const path = ordered.map((point, index) =>
    `${index === 0 ? "M" : "L"} ${xForIndex(point.categoryIndex)} ${yForTick(point.tick)}`
  ).join(" ");
  const labels = new Map(visual.axis.labeledTicks.map((tick) => [tick.index, tick.value]));

  return (
    <div
      aria-label={lineChartDescription(visual)}
      className={`mom-visual mom-line-chart is-${visual.mode}`}
      role="img"
    >
      <svg
        aria-hidden="true"
        className="mom-line-chart-svg"
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${width} ${height}`}
      >
        {Array.from({ length: visual.axis.tickCount + 1 }, (_, tick) => {
          const y = yForTick(tick);
          return (
            <Fragment key={tick}>
              <line className="mom-line-grid-line" x1={left} x2={left + plotWidth} y1={y} y2={y} />
              <line className="mom-line-tick" x1={left - 5} x2={left} y1={y} y2={y} />
              {labels.has(tick) && (
                <text className="mom-line-axis-label" textAnchor="end" x={left - 10} y={y + 5}>
                  {labels.get(tick)}
                </text>
              )}
            </Fragment>
          );
        })}
        <line className="mom-line-axis" x1={left} x2={left} y1={top} y2={top + plotHeight} />
        <line className="mom-line-axis" x1={left} x2={left + plotWidth} y1={top + plotHeight} y2={top + plotHeight} />
        {visual.axis.baselineValue > 0 && (
          <path className="mom-line-wave" d={`M ${left - 7} ${top + plotHeight - 8} l 5 4 l -5 4 l 5 4`} />
        )}
        <text className="mom-line-unit-label" x="8" y="18">({visual.axis.unitLabel})</text>
        <path className="mom-line-series" d={path} />
        {ordered.map((point) => {
          const isTarget = visual.target?.kind === "point"
            && visual.target.categoryIndex === point.categoryIndex;
          const categoryAnchor = point.categoryIndex === 0
            ? "start"
            : point.categoryIndex === visual.timeAxis.categories.length - 1
              ? "end"
              : "middle";
          return (
            <g key={point.categoryIndex}>
              {isTarget && (
                <circle
                  className="mom-line-target-ring"
                  cx={xForIndex(point.categoryIndex)}
                  cy={yForTick(point.tick)}
                  r="10"
                />
              )}
              <circle
                className="mom-line-point"
                cx={xForIndex(point.categoryIndex)}
                cy={yForTick(point.tick)}
                r="9"
              />
              <text
                className="mom-line-category-label"
                textAnchor={categoryAnchor}
                x={xForIndex(point.categoryIndex)}
                y={top + plotHeight + 24 + (point.categoryIndex % 2) * 26}
              >
                {visual.timeAxis.categories[point.categoryIndex]}
              </text>
            </g>
          );
        })}
        <text className="mom-line-time-label" textAnchor="end" x={width - 2} y={height - 4}>
          ({visual.timeAxis.label})
        </text>
      </svg>
    </div>
  );
}

type SvgPoint = readonly [number, number];

function fitPoints(
  points: readonly SvgPoint[],
  width: number,
  height: number,
  padding: number
): SvgPoint[] {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minimumX = Math.min(...xs);
  const maximumX = Math.max(...xs);
  const minimumY = Math.min(...ys);
  const maximumY = Math.max(...ys);
  const scale = Math.min(
    (width - padding * 2) / Math.max(1, maximumX - minimumX),
    (height - padding * 2) / Math.max(1, maximumY - minimumY)
  );
  const usedWidth = (maximumX - minimumX) * scale;
  const usedHeight = (maximumY - minimumY) * scale;
  const offsetX = (width - usedWidth) / 2;
  const offsetY = (height - usedHeight) / 2;
  return points.map(([x, y]) => [
    offsetX + (x - minimumX) * scale,
    offsetY + (y - minimumY) * scale
  ] as const);
}

function polygonPath(outline: PolygonOutline, points: readonly SvgPoint[]): string {
  const path = [`M ${points[0][0]} ${points[0][1]}`];
  const edgeCount = outline.form === "open" ? points.length - 1 : points.length;
  for (let index = 0; index < edgeCount; index += 1) {
    const start = points[index];
    const end = points[(index + 1) % points.length];
    if (outline.form === "curved" && index === outline.curvedSideIndex) {
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const length = Math.max(1, Math.hypot(dx, dy));
      const curve = Math.min(18, Math.max(10, length * .28));
      const control: SvgPoint = [
        (start[0] + end[0]) / 2 - dy / length * curve,
        (start[1] + end[1]) / 2 + dx / length * curve
      ];
      path.push(`Q ${control[0]} ${control[1]} ${end[0]} ${end[1]}`);
    } else {
      path.push(`L ${end[0]} ${end[1]}`);
    }
  }
  if (outline.form !== "open") path.push("Z");
  return path.join(" ");
}

function sideMarkPaths(
  points: readonly SvgPoint[],
  sideClasses: readonly number[]
): string[] {
  return sideClasses.flatMap((markClass, index) => {
    const start = points[index];
    const end = points[(index + 1) % points.length];
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const length = Math.max(1, Math.hypot(dx, dy));
    const along: SvgPoint = [dx / length, dy / length];
    const normal: SvgPoint = [-along[1], along[0]];
    const count = markClass + 1;
    return Array.from({ length: count }, (_, markIndex) => {
      const offset = (markIndex - (count - 1) / 2) * 6;
      const center: SvgPoint = [
        (start[0] + end[0]) / 2 + along[0] * offset,
        (start[1] + end[1]) / 2 + along[1] * offset
      ];
      return `M ${center[0] - normal[0] * 4} ${center[1] - normal[1] * 4} `
        + `L ${center[0] + normal[0] * 4} ${center[1] + normal[1] * 4}`;
    });
  });
}

function angleMarkPaths(
  points: readonly SvgPoint[],
  angleClasses: readonly number[]
): string[] {
  return angleClasses.flatMap((markClass, index) => {
    const vertex = points[index];
    const previous = points[(index + points.length - 1) % points.length];
    const next = points[(index + 1) % points.length];
    const previousLength = Math.max(1, Math.hypot(
      previous[0] - vertex[0], previous[1] - vertex[1]
    ));
    const nextLength = Math.max(1, Math.hypot(
      next[0] - vertex[0], next[1] - vertex[1]
    ));
    const toPrevious: SvgPoint = [
      (previous[0] - vertex[0]) / previousLength,
      (previous[1] - vertex[1]) / previousLength
    ];
    const toNext: SvgPoint = [
      (next[0] - vertex[0]) / nextLength,
      (next[1] - vertex[1]) / nextLength
    ];
    return Array.from({ length: markClass + 1 }, (_, markIndex) => {
      const radius = 8 + markIndex * 4;
      const first: SvgPoint = [
        vertex[0] + toPrevious[0] * radius,
        vertex[1] + toPrevious[1] * radius
      ];
      const second: SvgPoint = [
        vertex[0] + toNext[0] * radius,
        vertex[1] + toNext[1] * radius
      ];
      const control: SvgPoint = [
        vertex[0] + (toPrevious[0] + toNext[0]) * radius * .72,
        vertex[1] + (toPrevious[1] + toNext[1]) * radius * .72
      ];
      return `M ${first[0]} ${first[1]} Q ${control[0]} ${control[1]} ${second[0]} ${second[1]}`;
    });
  });
}

function PolygonOutlineSvg({
  outline,
  showMarks
}: {
  outline: PolygonOutline;
  showMarks: boolean;
}) {
  const points = fitPoints(polygonOutlinePoints(outline), 120, 100, 17);
  const marks = showMarks
    ? polygonMarkClasses(outline)
    : { sideClasses: [], angleClasses: [] };
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 120 100">
      <path className="mom-polygon-outline" d={polygonPath(outline, points)} />
      {sideMarkPaths(points, marks.sideClasses).map((path, index) => (
        <path className="mom-polygon-side-mark" d={path} key={`side-${index}`} />
      ))}
      {angleMarkPaths(points, marks.angleClasses).map((path, index) => (
        <path className="mom-polygon-angle-mark" d={path} key={`angle-${index}`} />
      ))}
      {outline.form === "open" && [points[0], points.at(-1)!].map((point, index) => (
        <circle
          className="mom-polygon-open-end"
          cx={point[0]}
          cy={point[1]}
          key={`open-${index}`}
          r="3.5"
        />
      ))}
    </svg>
  );
}

function polygonFigureDescription(visual: PolygonFigure): string {
  if (visual.mode === "side-count-name") {
    const sideCount = visual.figure.form === "regular"
      || visual.figure.form === "equiangular"
      ? visual.figure.sideCount
      : visual.figure.form === "open"
        ? visual.figure.vertices.length - 1
        : visual.figure.vertices.length;
    const concaveCount = polygonConcaveVertexCount(visual.figure);
    const countLabel = ["영", "한", "두", "세", "네", "다섯", "여섯"]
      [concaveCount] ?? String(concaveCount);
    return `곧은 변 ${sideCount}개와 꼭짓점 ${sideCount}개가 이어진 닫힌 모양. 안쪽으로 들어간 꼭짓점이 ${countLabel} 곳 있습니다.`;
  }
  const descriptions = visual.candidates.map(({ id, figure }) => {
    const sideCount = figure.form === "regular" || figure.form === "equiangular"
      ? figure.sideCount
      : figure.form === "open"
        ? figure.vertices.length - 1
        : figure.vertices.length;
    if (visual.mode === "polygon-select") {
      if (figure.form === "open") {
        return `${id}: 곧은 선분 ${sideCount}개가 이어지지만 두 끝은 만나지 않음`;
      }
      if (figure.form === "curved") {
        return `${id}: 선 ${sideCount}개가 이어져 닫혔고 그중 한 곳은 굽은 선`;
      }
      return `${id}: 곧은 선분 ${sideCount}개가 이어져 닫힌 모양`;
    }
    const marks = polygonMarkClasses(figure);
    const sideKinds = new Set(marks.sideClasses).size;
    const angleKinds = new Set(marks.angleClasses).size;
    return `${id}: 변의 길이 표시는 ${sideKinds}종류, 각의 크기 표시는 ${angleKinds}종류`;
  });
  return descriptions.join(". ");
}

function PolygonFigureVisual({ visual }: { visual: PolygonFigure }) {
  if (visual.mode === "side-count-name") {
    return (
      <div
        aria-label={polygonFigureDescription(visual)}
        className="mom-visual mom-polygon-figure is-single"
        role="img"
      >
        <PolygonOutlineSvg outline={visual.figure} showMarks={false} />
      </div>
    );
  }
  return (
    <div
      aria-label={polygonFigureDescription(visual)}
      className="mom-visual mom-polygon-figure"
      role="img"
    >
      {visual.candidates.map((candidate) => (
        <div className="mom-polygon-candidate" key={candidate.id}>
          <strong aria-hidden="true">{candidate.id}</strong>
          <PolygonOutlineSvg
            outline={candidate.figure}
            showMarks={visual.mode === "regular-select"}
          />
        </div>
      ))}
    </div>
  );
}

function latticeCartesian([column, row]: readonly [number, number]): SvgPoint {
  return [column + row * .5, row * Math.sqrt(3) / 2];
}

const TRIANGLE_CELL_UNIT = 36;
const TRIANGLE_CELL_PADDING = 6;

function compactTriangleCellCanvas(cells: readonly TriangleCell[]): {
  width: number;
  height: number;
} {
  const points = cells.flatMap((cell) =>
    triangleCellVertices(cell).map(latticeCartesian)
  );
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return {
    width: Math.ceil(
      (Math.max(...xs) - Math.min(...xs)) * TRIANGLE_CELL_UNIT
      + TRIANGLE_CELL_PADDING * 2
    ),
    height: Math.ceil(
      (Math.max(...ys) - Math.min(...ys)) * TRIANGLE_CELL_UNIT
      + TRIANGLE_CELL_PADDING * 2
    )
  };
}

function equallyScaledTriangleCells(
  cells: readonly TriangleCell[],
  width: number,
  height: number
): Array<{ cell: TriangleCell; points: SvgPoint[] }> {
  const raw = cells.map((cell) => ({
    cell,
    points: triangleCellVertices(cell).map(latticeCartesian)
  }));
  const flat = raw.flatMap((entry) => entry.points);
  const minimumX = Math.min(...flat.map(([x]) => x));
  const maximumX = Math.max(...flat.map(([x]) => x));
  const minimumY = Math.min(...flat.map(([, y]) => y));
  const maximumY = Math.max(...flat.map(([, y]) => y));
  const unit = TRIANGLE_CELL_UNIT;
  const offsetX = (width - (maximumX - minimumX) * unit) / 2;
  const offsetY = (height - (maximumY - minimumY) * unit) / 2;
  const fitted = flat.map(([x, y]) => [
    offsetX + (x - minimumX) * unit,
    offsetY + (y - minimumY) * unit
  ] as SvgPoint);
  let cursor = 0;
  return raw.map((entry) => ({
    cell: entry.cell,
    points: fitted.slice(cursor, cursor += entry.points.length)
  }));
}

function TriangleCellSvg({
  cells,
  placedCells = [],
  className,
  compact = false
}: {
  cells: readonly TriangleCell[];
  placedCells?: readonly TriangleCell[];
  className?: string;
  compact?: boolean;
}) {
  const placedKeys = new Set(placedCells.map(triangleCellKey));
  const canvas = compact
    ? compactTriangleCellCanvas(cells)
    : { width: 180, height: 125 };
  return (
    <svg
      aria-hidden="true"
      className={className}
      focusable="false"
      height={canvas.height}
      preserveAspectRatio="xMidYMid meet"
      viewBox={`0 0 ${canvas.width} ${canvas.height}`}
      width={canvas.width}
    >
      {equallyScaledTriangleCells(
        cells,
        canvas.width,
        canvas.height
      ).map(({ cell, points }) => (
        <polygon
          className={placedKeys.has(triangleCellKey(cell))
            ? "mom-tile-cell is-placed"
            : "mom-tile-cell"}
          key={triangleCellKey(cell)}
          points={points.map((point) => point.join(",")).join(" ")}
        />
      ))}
    </svg>
  );
}

function PatternPieceIcon({ piece }: { piece: PatternBlockName }) {
  const cells = patternBlockCells(piece, piece === "hexagon" ? 1 : 0, piece === "hexagon" ? 1 : 0);
  return (
    <span
      className={`mom-pattern-piece is-${piece}`}
      title={patternBlockKoreanNames[piece]}
    >
      <TriangleCellSvg
        cells={cells}
        className="mom-pattern-piece-svg"
        compact
      />
      <span>{patternBlockKoreanNames[piece]}</span>
    </span>
  );
}

function tileCompositionDescription(visual: TileCompositionFigure): string {
  const describeCells = (cells: readonly TriangleCell[]) => cells
    .map(([column, row, orientation]) =>
      `가로 ${column}, 세로 ${row}, ${orientation === "up" ? "위" : "아래"} 방향`
    )
    .join("; ");
  if (visual.mode === "tile-count") {
    const pieceCells = patternBlockCells(visual.piece);
    return [
      `큰 모양은 작은 삼각형 ${visual.region.length}칸입니다.`,
      `큰 모양의 각 칸 위치는 ${describeCells(visual.region)}입니다.`,
      `기준 ${patternBlockKoreanNames[visual.piece]} 조각 한 개는 작은 삼각형 ${pieceCells.length}칸입니다.`
    ].join(" ");
  }
  const placed = visual.placed.map(({ piece, cells }, index) =>
    `${index + 1}번째 ${patternBlockKoreanNames[piece]} 조각이 차지한 칸은 ${describeCells(cells)}`
  ).join(". ");
  const candidates = visual.candidates.map(({ id, pieces }) =>
    `${id} 묶음: ${pieces.map((piece) => patternBlockKoreanNames[piece]).join(", ")}`
  ).join(". ");
  return [
    `전체 삼각형 격자의 각 칸 위치는 ${describeCells(visual.board)}입니다.`,
    `${placed}.`,
    candidates
  ].join(" ");
}

function TileCompositionVisual({ visual }: { visual: TileCompositionFigure }) {
  if (visual.mode === "tile-count") {
    return (
      <div
        aria-label={tileCompositionDescription(visual)}
        className="mom-visual mom-tile-composition is-count"
        role="img"
      >
        <div className="mom-tile-board">
          <TriangleCellSvg cells={visual.region} />
        </div>
        <div className="mom-tile-key" aria-hidden="true">
          <span>기준 조각 1개</span>
          <PatternPieceIcon piece={visual.piece} />
        </div>
      </div>
    );
  }
  const placedCells = visual.placed.flatMap((placed) => placed.cells);
  return (
    <div
      aria-label={tileCompositionDescription(visual)}
      className="mom-visual mom-tile-composition is-fill"
      role="img"
    >
      <div className="mom-tile-board">
        <TriangleCellSvg cells={visual.board} placedCells={placedCells} />
      </div>
      <div className="mom-tile-candidates" aria-hidden="true">
        {visual.candidates.map((candidate) => (
          <div className="mom-tile-candidate" key={candidate.id}>
            <strong>{candidate.id}</strong>
            <div>
              {candidate.pieces.map((piece, index) => (
                <PatternPieceIcon key={`${piece}-${index}`} piece={piece} />
              ))}
            </div>
          </div>
        ))}
      </div>
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
  if (visual.kind === "line-segment-ray") {
    return lineSegmentRayDescription(visual);
  }
  if (visual.kind === "clock-face") {
    return clockFaceDescription(visual);
  }
  if (visual.kind === "triangle-figure") {
    return triangleFigureDescription(visual);
  }
  if (visual.kind === "quadrilateral-figure") {
    return quadrilateralFigureDescription(visual);
  }
  if (visual.kind === "polygon-figure") {
    return polygonFigureDescription(visual);
  }
  if (visual.kind === "tile-composition") {
    return tileCompositionDescription(visual);
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
  if (visual.kind === "line-chart-diagram") {
    return lineChartDescription(visual);
  }
  if (visual.kind === "perimeter-area-diagram") {
    return perimeterAreaDescription(visual);
  }
  if (visual.kind === "solid-diagram") {
    return solidDescription(visual);
  }
  if (visual.kind === "part-chart-diagram") {
    return partChartDescription(visual);
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
  unit = "cm",
  x,
  y
}: {
  value: number | undefined;
  unit?: "cm" | "m";
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
      {value} {unit}
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
              <CircleMeasurement value={visual.radiusValue} unit={visual.measurementUnit} x={111} y={146} />
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
            <CircleMeasurement value={visual.radiusValue} unit={visual.measurementUnit} x={146} y={61} />
          </>
        )}
        {mode === "diameter" && (
          <>
            <line className="mom-circle-diameter-segment" x1="68" x2="172" y1="80" y2="80" />
            {visual.diameterValue === undefined && (
              <line className="mom-circle-radius-highlight" x1="120" x2="172" y1="80" y2="80" />
            )}
            <circle className="mom-circle-point" cx="120" cy="80" r="2.8" />
            <CirclePointLabel label="A" x={58} y={84} />
            <CirclePointLabel label="O" x={120} y={94} />
            <CirclePointLabel label="B" x={182} y={84} />
            <CircleMeasurement
              value={visual.diameterValue ?? visual.radiusValue}
              unit={visual.measurementUnit}
              x={visual.diameterValue === undefined ? 146 : 120}
              y={68}
            />
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
            <CircleMeasurement value={visual.radiusValue} unit={visual.measurementUnit} x={146} y={61} />
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
  if (visual.kind === "line-segment-ray") {
    return <LineSegmentRayVisual visual={visual} />;
  }
  if (visual.kind === "clock-face") {
    return <ClockFaceVisual visual={visual} />;
  }
  if (visual.kind === "triangle-figure") {
    return <TriangleFigureVisual visual={visual} />;
  }
  if (visual.kind === "quadrilateral-figure") {
    return <QuadrilateralFigureVisual visual={visual} />;
  }
  if (visual.kind === "polygon-figure") {
    return <PolygonFigureVisual visual={visual} />;
  }
  if (visual.kind === "tile-composition") {
    return <TileCompositionVisual visual={visual} />;
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
  if (visual.kind === "line-chart-diagram") {
    return <LineChartVisual visual={visual} />;
  }
  if (visual.kind === "perimeter-area-diagram") {
    return <PerimeterAreaVisual visual={visual} />;
  }
  if (visual.kind === "solid-diagram") {
    return <SolidDiagramVisual visual={visual} />;
  }
  if (visual.kind === "part-chart-diagram") {
    return <PartChartVisual visual={visual} />;
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
      <li><span>학생 응답 기록</span><strong><ReadableText text={evidence.selectedChoiceLabel} /></strong><small>{formatEvidence(evidence)}</small></li>
      {choiceNote && <li><span>이 선택에서 확인할 생각</span><strong>{choiceNote.title}</strong><small>{choiceNote.text}</small></li>}
    </ol>
  );
}

export function SeverityMark({ severity }: { severity: Severity }) {
  const label = severity === "high" ? "먼저 확인" : severity === "medium" ? "계속 살펴보기" : "응답 더 필요";
  return <StatusPill tone={severity === "high" ? "risk" : severity === "medium" ? "warning" : "neutral"}>{label}</StatusPill>;
}

export function ConfidenceMark({
  confidence
}: {
  confidence: FindingConfidence;
}) {
  return (
    <StatusPill tone={confidence === "confirmed" ? "warning" : "neutral"}>
      {confidence === "confirmed" ? "같은 생각이 반복됨" : "한 번 더 확인 필요"}
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
