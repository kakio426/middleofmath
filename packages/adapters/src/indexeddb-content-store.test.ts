import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import type { PublishedDiagnosisSet } from "@middle-of-math/domain";
import { grade3Semester2Diagnosis } from "../../content/src";
import { computeDiagnosisChecksum } from "./content-checksum";
import { IndexedDbContentStore } from "./indexeddb-content-store";

function published(): PublishedDiagnosisSet {
  return {
    id: "content-1",
    setKey: grade3Semester2Diagnosis.manifest.id,
    version: grade3Semester2Diagnosis.manifest.version,
    checksum: grade3Semester2Diagnosis.manifest.checksum,
    status: "published",
    content: structuredClone(grade3Semester2Diagnosis),
    publishedAt: "2026-07-22T00:00:00.000Z"
  };
}

describe("IndexedDbContentStore", () => {
  it("reproduces the packaged content checksum from canonical JSON", async () => {
    expect(await computeDiagnosisChecksum(grade3Semester2Diagnosis)).toBe(grade3Semester2Diagnosis.manifest.checksum);
  });

  it("caches and returns the exact assigned published content", async () => {
    const store = new IndexedDbContentStore(indexedDB, `middle-of-math-content-${crypto.randomUUID()}`);
    const content = published();
    await store.put("assignment-1", content);
    expect(await store.get("assignment-1")).toEqual(content);
    expect(await store.get("assignment-2")).toBeNull();
  });

  it("rejects mismatched versions and checksums instead of caching a fallback", async () => {
    const store = new IndexedDbContentStore(indexedDB, `middle-of-math-content-${crypto.randomUUID()}`);
    await expect(store.put("assignment-1", { ...published(), checksum: "different-checksum" })).rejects.toThrow("checksum");
    expect(await store.get("assignment-1")).toBeNull();
  });
});
