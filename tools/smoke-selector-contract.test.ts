import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  extractLiteralSelectors,
  missingLiteralSelectors
} from "./parse-operations-inventory";

const root = resolve(process.cwd());

describe("원격 smoke 선택자 계약", () => {
  it("문자열로 고정한 접근성 이름과 class hook이 앱 소스에 남아 있다", () => {
    const specs = [
      "e2e-staging/pilot-flow.spec.ts",
      "e2e-production/smoke.spec.ts"
    ].map(read).join("\n");
    const applicationSource = [
      ...walk("apps/student/src"),
      ...walk("apps/teacher/src"),
      ...walk("apps/studio/src"),
      ...walk("packages/ui/src")
    ].map(read).join("\n");

    expect(
      missingLiteralSelectors(
        extractLiteralSelectors(specs),
        applicationSource
      )
    ).toEqual([]);
  });

  it("앱 소스에서 사라진 literal 선택자를 검출한다", () => {
    const inventory = extractLiteralSelectors(`
      page.getByLabel("사라진 입력");
      page.getByRole("button", { name: "사라진 버튼" });
      page.locator(".removed-hook");
    `);
    expect(missingLiteralSelectors(inventory, "다른 화면"))
      .toEqual([
        "class:removed-hook",
        "name:사라진 버튼",
        "name:사라진 입력"
      ]);
  });
});

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

function walk(path: string): string[] {
  const absolute = resolve(root, path);
  return readdirSync(absolute).flatMap((entry) => {
    const child = join(absolute, entry);
    if (statSync(child).isDirectory()) return walk(child);
    return /\.(?:ts|tsx|css)$/.test(child) ? [child] : [];
  });
}
