import type {
  DiagnosisSet,
  EvidenceItem,
  Judgment,
  JudgmentConfirmationPayload,
  ObservationEvent,
  SignalDefinition
} from "./types";

export interface ExtractedJudgment {
  correct: boolean;
  signalIds: string[];
  evidence: EvidenceItem;
}

export interface InteractionRegistration {
  type: string;
  version: number;
  extract(event: ObservationEvent<JudgmentConfirmationPayload>, judgment: Judgment): ExtractedJudgment;
}

function durationBand(durationMs: number): EvidenceItem["durationBand"] {
  if (durationMs >= 30_000) return "long";
  if (durationMs <= 5_000) return "quick";
  return "steady";
}

function extractChoiceLike(
  event: ObservationEvent<JudgmentConfirmationPayload>,
  judgment: Judgment
): ExtractedJudgment {
  const selected = judgment.choices.find((choice) => choice.id === event.payload.choiceId);
  const uncertainty = event.payload.uncertainty || event.payload.choiceId === "__unknown__";
  const signalIds = uncertainty
    ? ["needs-scaffold"]
    : selected?.correct
      ? []
      : selected?.signalIds ?? ["needs-review"];

  return {
    correct: Boolean(selected?.correct) && !uncertainty,
    signalIds,
    evidence: {
      eventId: event.id,
      judgmentId: judgment.id,
      learnerStageId: judgment.learnerStageId,
      curriculumAnchorIds: judgment.curriculumAnchorIds,
      selectedChoiceId: event.payload.choiceId,
      selectedChoiceLabel: uncertainty ? "잘 모르겠어요" : selected?.label ?? "알 수 없는 선택",
      durationBand: durationBand(event.payload.durationMs),
      firstSelectionMs: event.payload.firstSelectionMs,
      confirmationMs: event.payload.confirmationMs,
      selectionChanges: event.payload.selectionChanges,
      uncertainty
    }
  };
}

export class InteractionRegistry {
  private readonly registrations = new Map<string, InteractionRegistration>();

  register(registration: InteractionRegistration): this {
    const key = `${registration.type}@${registration.version}`;
    if (this.registrations.has(key)) throw new Error(`Interaction already registered: ${key}`);
    this.registrations.set(key, registration);
    return this;
  }

  get(type: string, version: number): InteractionRegistration {
    const key = `${type}@${version}`;
    const registration = this.registrations.get(key);
    if (!registration) throw new Error(`Unknown interaction: ${key}`);
    return registration;
  }
}

export function createDefaultInteractionRegistry(): InteractionRegistry {
  const registry = new InteractionRegistry();
  for (const type of ["choice", "fraction-bar", "measurement", "pictograph"]) {
    registry.register({ type, version: 1, extract: extractChoiceLike });
  }
  return registry;
}

export function signalMap(diagnosisSet: DiagnosisSet): Map<string, SignalDefinition> {
  return new Map(diagnosisSet.signals.map((signal) => [signal.id, signal]));
}
