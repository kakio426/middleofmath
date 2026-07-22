import type { DiagnosisSet, PublishedDiagnosisSet } from "@middle-of-math/domain";

export function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(",")}}`;
  }
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new Error("checksum에 직렬화할 수 없는 값입니다.");
  return serialized;
}

export async function computeDiagnosisChecksum(
  content: DiagnosisSet,
  cryptoProvider: Crypto = globalThis.crypto
): Promise<string> {
  if (!cryptoProvider?.subtle) throw new Error("SHA-256을 사용할 수 없는 환경입니다.");
  const checksumInput: DiagnosisSet = {
    ...content,
    manifest: { ...content.manifest, checksum: "" }
  };
  const digest = await cryptoProvider.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonicalJson(checksumInput))
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function assertPublishedContentChecksum(published: PublishedDiagnosisSet): Promise<void> {
  if (published.content.manifest.id !== published.setKey || published.content.manifest.version !== published.version) {
    throw new Error("콘텐츠 manifest와 발행 버전이 일치하지 않습니다.");
  }
  if (published.content.manifest.checksum !== published.checksum) {
    throw new Error("콘텐츠 checksum 메타데이터가 일치하지 않습니다.");
  }
  const calculated = await computeDiagnosisChecksum(published.content);
  if (calculated !== published.checksum) {
    throw new Error("콘텐츠 본문 checksum 검증에 실패했습니다.");
  }
}
