import { describe, expect, it } from "vitest";
import type { DiagnosisSession, ObservationEvent } from "@middle-of-math/domain";
import type { LocalEventQueue, SessionRepository } from "./ports";
import { CompleteSession, RecordJudgment, StartSession } from "./use-cases";

class Sessions implements SessionRepository {
  values = new Map<string, DiagnosisSession>();
  async create(session: DiagnosisSession) { this.values.set(session.id, session); }
  async get(id: string) { return this.values.get(id) ?? null; }
  async findResumable(assignmentId: string, studentId: string) {
    return [...this.values.values()].find((session) => session.assignmentId === assignmentId && session.studentId === studentId && session.status !== "completed") ?? null;
  }
  async updateStatus(id: string, status: DiagnosisSession["status"], completedAt?: string) {
    const session = this.values.get(id);
    if (session) this.values.set(id, { ...session, status, completedAt });
  }
  async updateLastEventSeq(id: string, lastEventSeq: number) {
    const session = this.values.get(id);
    if (session) this.values.set(id, { ...session, lastEventSeq });
  }
}

class Queue implements LocalEventQueue {
  values: ObservationEvent[] = [];
  async append(event: ObservationEvent) { this.values.push(structuredClone(event)); }
  async listPending(sessionId?: string) { return this.values.filter((event) => !sessionId || event.sessionId === sessionId); }
  async markSynced() {}
}

const clock = { now: () => new Date("2026-07-22T00:00:00.000Z") };
let id = 0;
const ids = { next: () => `id-${++id}` };

describe("session use cases", () => {
  it("resumes an existing session instead of creating a duplicate", async () => {
    const sessions = new Sessions();
    const queue = new Queue();
    const useCase = new StartSession(sessions, queue, clock, ids);
    const first = await useCase.execute({ assignmentId: "a", studentId: "s", diagnosisSetId: "d", diagnosisSetVersion: "1.0.0" });
    const second = await useCase.execute({ assignmentId: "a", studentId: "s", diagnosisSetId: "d", diagnosisSetVersion: "1.0.0" });

    expect(second.id).toBe(first.id);
    expect(queue.values.filter((event) => event.eventType === "session_started")).toHaveLength(1);
  });

  it("appends judgments and completion without changing earlier events", async () => {
    const sessions = new Sessions();
    const queue = new Queue();
    const start = new StartSession(sessions, queue, clock, ids);
    const session = await start.execute({ assignmentId: "a", studentId: "s", diagnosisSetId: "d", diagnosisSetVersion: "1.0.0" });
    const firstEvent = structuredClone(queue.values[0]);
    await new RecordJudgment(sessions, queue, clock, ids).execute({
      sessionId: session.id,
      judgmentId: "j-1",
      interaction: { type: "choice", version: 1 },
      payload: {
        choiceId: "c-1",
        presentedChoiceIds: ["c-3", "c-1", "c-2"],
        durationMs: 4_000,
        firstSelectionMs: 2_000,
        confirmationMs: 2_000,
        selectionChanges: 0,
        uncertainty: false
      }
    });
    await new CompleteSession(sessions, queue, clock, ids).execute(session.id);

    expect(queue.values[0]).toEqual(firstEvent);
    expect(queue.values.map((event) => event.eventType)).toEqual(["session_started", "judgment_confirmed", "session_completed"]);
    expect(queue.values[1].payload.presentedChoiceIds).toEqual(["c-3", "c-1", "c-2"]);
    expect((await sessions.get(session.id))?.status).toBe("sync_pending");
  });
});
