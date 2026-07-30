import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import type { DiagnosisSession, ObservationEvent } from "@middle-of-math/domain";
import { IndexedDbSessionStore } from "./indexeddb-session-store";

const session: DiagnosisSession = {
  id: "session-a",
  assignmentId: "assignment-a",
  studentId: "student-a",
  diagnosisSetId: "grade3-semester2",
  diagnosisSetVersion: "1.0.0",
  status: "in_progress",
  startedAt: "2026-07-22T00:00:00.000Z",
  lastEventSeq: 0
};

const event: ObservationEvent = {
  id: "event-a",
  clientEventId: "client-a",
  clientSeq: 1,
  sessionId: session.id,
  diagnosisSetId: session.diagnosisSetId,
  diagnosisSetVersion: session.diagnosisSetVersion,
  eventType: "session_started",
  interaction: { type: "choice", version: 1 },
  payload: {},
  occurredAt: session.startedAt
};

const judgmentEvent: ObservationEvent = {
  ...event,
  id: "event-b",
  clientEventId: "client-b",
  clientSeq: 2,
  eventType: "judgment_confirmed",
  judgmentId: "judgment-a",
  payload: {
    choiceId: "choice-b",
    presentedChoiceIds: ["choice-c", "choice-b", "choice-a"],
    durationMs: 4_000,
    firstSelectionMs: 2_000,
    confirmationMs: 1_000,
    selectionChanges: 0,
    uncertainty: false
  }
};

describe("IndexedDbSessionStore", () => {
  it("resumes sessions and keeps events append-only and idempotent", async () => {
    const store = new IndexedDbSessionStore(indexedDB, `middle-of-math-test-${crypto.randomUUID()}`);
    await store.create(session);
    await store.append(event);
    await store.append(structuredClone(event));

    expect((await store.findResumable(session.assignmentId, session.studentId))?.id).toBe(session.id);
    expect(await store.listPending()).toEqual([event]);
  });

  it("preserves the exact presented choice order in the offline event queue", async () => {
    const store = new IndexedDbSessionStore(indexedDB, `middle-of-math-test-${crypto.randomUUID()}`);
    await store.append(judgmentEvent);
    await store.append(structuredClone(judgmentEvent));

    expect((await store.listPending())[0].payload.presentedChoiceIds).toEqual([
      "choice-c",
      "choice-b",
      "choice-a"
    ]);
  });

  it("rejects a reused idempotency key with a different payload", async () => {
    const store = new IndexedDbSessionStore(indexedDB, `middle-of-math-test-${crypto.randomUUID()}`);
    await store.append(event);
    await expect(store.append({ ...event, eventType: "session_completed" })).rejects.toThrow("다른 이벤트");
  });
});
