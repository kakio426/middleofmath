import { describe, expect, it } from "vitest";
import type {
  DiagnosisSet,
  JudgmentConfirmationPayload,
  ObservationEvent
} from "./types";
import { createDefaultInteractionRegistry } from "./interaction-registry";

const judgment: DiagnosisSet["judgments"][number] = {
  id: "judgment-a",
  unitId: "unit-a",
  learnerStageId: "stage-a",
  curriculumAnchorIds: ["[4수01-01]"],
  prompt: "알맞은 답을 골라 보세요.",
  visual: { kind: "none" },
  interaction: { type: "choice", version: 1 },
  choices: [
    { id: "choice-a", label: "10", correct: true },
    { id: "choice-b", label: "11", correct: false, signalIds: ["signal-a"] },
    { id: "choice-c", label: "12", correct: false, signalIds: ["signal-b"] }
  ]
};

function confirmation(
  presentedChoiceIds?: string[]
): ObservationEvent<JudgmentConfirmationPayload> {
  return {
    id: "event-a",
    clientEventId: "client-a",
    clientSeq: 2,
    sessionId: "session-a",
    diagnosisSetId: "set-a",
    diagnosisSetVersion: "1.0.0",
    eventType: "judgment_confirmed",
    judgmentId: judgment.id,
    interaction: judgment.interaction,
    payload: {
      choiceId: "choice-b",
      ...(presentedChoiceIds ? { presentedChoiceIds } : {}),
      durationMs: 8_000,
      firstSelectionMs: 4_000,
      confirmationMs: 2_000,
      selectionChanges: 0,
      uncertainty: false
    },
    occurredAt: "2026-07-29T00:00:00.000Z"
  };
}

describe("choice-like interaction evidence", () => {
  it("records the validated presentation order and one-based selected position", () => {
    const extracted = createDefaultInteractionRegistry()
      .get("choice", 1)
      .extract(confirmation(["choice-c", "choice-b", "choice-a"]), judgment);

    expect(extracted.evidence).toMatchObject({
      presentedChoiceIds: ["choice-c", "choice-b", "choice-a"],
      presentedChoiceCount: 3,
      selectedChoicePosition: 2
    });
  });

  it.each([
    ["missing choice", ["choice-a", "choice-b"]],
    ["unknown choice", ["choice-a", "choice-b", "choice-x"]],
    ["duplicate choice", ["choice-a", "choice-b", "choice-b"]]
  ])("ignores an invalid presentation order: %s", (_label, order) => {
    const extracted = createDefaultInteractionRegistry()
      .get("choice", 1)
      .extract(confirmation(order), judgment);

    expect(extracted.evidence.presentedChoiceIds).toBeUndefined();
    expect(extracted.evidence.selectedChoicePosition).toBeUndefined();
    expect(extracted.evidence.presentedChoiceCount).toBeUndefined();
  });

  it("keeps legacy events without presentation order compatible", () => {
    const extracted = createDefaultInteractionRegistry()
      .get("choice", 1)
      .extract(confirmation(), judgment);

    expect(extracted.evidence.selectedChoiceId).toBe("choice-b");
    expect(extracted.signalIds).toEqual(["signal-a"]);
  });
});
