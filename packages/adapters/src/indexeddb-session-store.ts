import type { LocalEventQueue, SessionRepository } from "@middle-of-math/application";
import type { DiagnosisSession, ObservationEvent } from "@middle-of-math/domain";

interface QueuedEventRecord {
  clientEventId: string;
  sessionId: string;
  event: ObservationEvent;
  synced: boolean;
  receivedAt?: string;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB 요청이 실패했습니다."));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB 저장이 실패했습니다."));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB 저장이 중단되었습니다."));
  });
}

export class IndexedDbSessionStore implements SessionRepository, LocalEventQueue {
  private databasePromise?: Promise<IDBDatabase>;

  constructor(
    private readonly indexedDb: IDBFactory = indexedDB,
    private readonly databaseName = "middle-of-math"
  ) {}

  private database(): Promise<IDBDatabase> {
    if (!this.databasePromise) {
      this.databasePromise = new Promise((resolve, reject) => {
        const request = this.indexedDb.open(this.databaseName, 1);
        request.onupgradeneeded = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains("sessions")) {
            const sessions = database.createObjectStore("sessions", { keyPath: "id" });
            sessions.createIndex("assignmentStudent", ["assignmentId", "studentId"], { unique: false });
          }
          if (!database.objectStoreNames.contains("events")) {
            const events = database.createObjectStore("events", { keyPath: "clientEventId" });
            events.createIndex("sessionId", "sessionId", { unique: false });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("로컬 저장소를 열 수 없습니다."));
      });
    }
    return this.databasePromise;
  }

  async create(session: DiagnosisSession): Promise<void> {
    const db = await this.database();
    const transaction = db.transaction("sessions", "readwrite");
    transaction.objectStore("sessions").add(structuredClone(session));
    await transactionDone(transaction);
  }

  async get(sessionId: string): Promise<DiagnosisSession | null> {
    const db = await this.database();
    const result = await requestResult(db.transaction("sessions").objectStore("sessions").get(sessionId));
    return (result as DiagnosisSession | undefined) ?? null;
  }

  async findResumable(assignmentId: string, studentId: string): Promise<DiagnosisSession | null> {
    const db = await this.database();
    const index = db.transaction("sessions").objectStore("sessions").index("assignmentStudent");
    const sessions = await requestResult(index.getAll(IDBKeyRange.only([assignmentId, studentId])));
    return (sessions as DiagnosisSession[])
      .filter((session) => !["completed", "abandoned"].includes(session.status))
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null;
  }

  async updateStatus(sessionId: string, status: DiagnosisSession["status"], completedAt?: string): Promise<void> {
    const session = await this.get(sessionId);
    if (!session) throw new Error("로컬 세션을 찾을 수 없습니다.");
    const db = await this.database();
    const transaction = db.transaction("sessions", "readwrite");
    transaction.objectStore("sessions").put({ ...session, status, completedAt });
    await transactionDone(transaction);
  }

  async updateLastEventSeq(sessionId: string, lastEventSeq: number): Promise<void> {
    const session = await this.get(sessionId);
    if (!session) throw new Error("로컬 세션을 찾을 수 없습니다.");
    const db = await this.database();
    const transaction = db.transaction("sessions", "readwrite");
    transaction.objectStore("sessions").put({ ...session, lastEventSeq });
    await transactionDone(transaction);
  }

  async append(event: ObservationEvent): Promise<void> {
    const db = await this.database();
    const existing = await requestResult(
      db.transaction("events").objectStore("events").get(event.clientEventId)
    ) as QueuedEventRecord | undefined;
    if (existing) {
      if (JSON.stringify(existing.event) !== JSON.stringify(event)) {
        throw new Error(`같은 clientEventId에 다른 이벤트가 있습니다: ${event.clientEventId}`);
      }
      return;
    }
    const transaction = db.transaction("events", "readwrite");
    transaction.objectStore("events").add({
      clientEventId: event.clientEventId,
      sessionId: event.sessionId,
      event: structuredClone(event),
      synced: false
    } satisfies QueuedEventRecord);
    await transactionDone(transaction);
  }

  async listPending(sessionId?: string): Promise<ObservationEvent[]> {
    const db = await this.database();
    const records = await requestResult(db.transaction("events").objectStore("events").getAll()) as QueuedEventRecord[];
    return records
      .filter((record) => !record.synced && (!sessionId || record.sessionId === sessionId))
      .map((record) => record.event)
      .sort((a, b) => a.clientSeq - b.clientSeq);
  }

  async listAll(sessionId: string): Promise<ObservationEvent[]> {
    const db = await this.database();
    const index = db.transaction("events").objectStore("events").index("sessionId");
    const records = await requestResult(index.getAll(sessionId)) as QueuedEventRecord[];
    return records.map((record) => record.event).sort((a, b) => a.clientSeq - b.clientSeq);
  }

  async markSynced(clientEventIds: string[], receivedAt: string): Promise<void> {
    if (clientEventIds.length === 0) return;
    const db = await this.database();
    const existing = await requestResult(db.transaction("events").objectStore("events").getAll()) as QueuedEventRecord[];
    const selected = existing.filter((record) => clientEventIds.includes(record.clientEventId));
    const transaction = db.transaction("events", "readwrite");
    const store = transaction.objectStore("events");
    for (const record of selected) store.put({ ...record, synced: true, receivedAt });
    await transactionDone(transaction);
  }
}
