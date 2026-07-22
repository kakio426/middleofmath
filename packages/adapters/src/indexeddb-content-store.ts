import type { PublishedDiagnosisSet } from "@middle-of-math/domain";
import { assertPublishedContentChecksum } from "./content-checksum";

interface CachedPublishedContent {
  assignmentId: string;
  published: PublishedDiagnosisSet;
  cachedAt: string;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("콘텐츠 캐시 요청이 실패했습니다."));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("콘텐츠 캐시 저장이 실패했습니다."));
    transaction.onabort = () => reject(transaction.error ?? new Error("콘텐츠 캐시 저장이 중단되었습니다."));
  });
}

export class IndexedDbContentStore {
  private databasePromise?: Promise<IDBDatabase>;

  constructor(
    private readonly indexedDb: IDBFactory = indexedDB,
    private readonly databaseName = "middle-of-math-content"
  ) {}

  private database(): Promise<IDBDatabase> {
    if (!this.databasePromise) {
      this.databasePromise = new Promise((resolve, reject) => {
        const request = this.indexedDb.open(this.databaseName, 1);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains("publishedContent")) {
            request.result.createObjectStore("publishedContent", { keyPath: "assignmentId" });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("콘텐츠 캐시를 열 수 없습니다."));
      });
    }
    return this.databasePromise;
  }

  async put(assignmentId: string, published: PublishedDiagnosisSet): Promise<void> {
    if (!assignmentId) throw new Error("과제 ID가 필요합니다.");
    await assertPublishedContentChecksum(published);
    const db = await this.database();
    const transaction = db.transaction("publishedContent", "readwrite");
    transaction.objectStore("publishedContent").put({
      assignmentId,
      published: structuredClone(published),
      cachedAt: new Date().toISOString()
    } satisfies CachedPublishedContent);
    await transactionDone(transaction);
  }

  async get(assignmentId: string): Promise<PublishedDiagnosisSet | null> {
    const db = await this.database();
    const record = await requestResult(
      db.transaction("publishedContent").objectStore("publishedContent").get(assignmentId)
    ) as CachedPublishedContent | undefined;
    if (!record) return null;
    await assertPublishedContentChecksum(record.published);
    return record.published;
  }
}
