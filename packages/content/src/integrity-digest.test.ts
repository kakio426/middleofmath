import { describe, expect, it } from "vitest";
import { jsonSha256, sha256Utf8 } from "./integrity-digest";

describe("sync integrity digest", () => {
  it("matches the SHA-256 standard vector", () => {
    expect(sha256Utf8("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });

  it("hashes the exact JSON property order used by provenance files", () => {
    expect(jsonSha256({ a: 1, b: "둘" })).toBe(
      "sha256:5ab609c856488ce261837a9c241b5f62f791a6f77859e108d3dfef090ba9a7bf"
    );
  });
});
