import type { ReactNode } from "react";
import type { EvidenceItem, JudgmentVisual, Severity } from "@middle-of-math/domain";

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
      <span>{label}</span>
    </button>
  );
}

export function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "warning" | "risk" }) {
  return <span className={`mom-pill mom-pill-${tone}`}>{children}</span>;
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
    return (
      <div className="mom-visual mom-circle-wrap" role="img" aria-label="원의 중심과 선분을 나타낸 그림">
        <div className="mom-circle">
          {visual.showCenter && <span className="mom-circle-center" />}
          {visual.showRadius && <span className="mom-circle-radius" />}
          {visual.showDiameter && <span className="mom-circle-diameter" />}
        </div>
      </div>
    );
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
  if (visual.kind === "measurement") {
    return (
      <div className="mom-visual mom-measurement" role="img" aria-label={`${visual.amount}${visual.unit}`}>
        <span>{visual.amount}</span><small>{visual.unit}</small>
      </div>
    );
  }
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

export function EvidenceRail({
  anchor,
  stage,
  evidence
}: {
  anchor: string;
  stage: string;
  evidence: EvidenceItem;
}) {
  return (
    <ol className="mom-evidence-rail">
      <li><span>교육과정</span><strong>{anchor}</strong></li>
      <li><span>작은 학습 단계</span><strong>{stage}</strong></li>
      <li><span>관찰 근거</span><strong>{evidence.selectedChoiceLabel}</strong><small>{formatEvidence(evidence)}</small></li>
    </ol>
  );
}

export function SeverityMark({ severity }: { severity: Severity }) {
  const label = severity === "high" ? "우선 확인" : severity === "medium" ? "관찰됨" : "근거 더 필요";
  return <StatusPill tone={severity === "high" ? "risk" : severity === "medium" ? "warning" : "neutral"}>{label}</StatusPill>;
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
