import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const playwright = resolve(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "playwright.cmd" : "playwright"
);

if (!existsSync(playwright)) {
  throw new Error(
    "Playwright 실행 파일이 없습니다. npm ci 뒤에 다시 실행해 주세요."
  );
}

const contracts = [
  {
    name: "staging",
    config: "playwright.staging.config.ts",
    env: {
      STAGING_STUDENT_URL: "https://example.invalid/student",
      STAGING_TEACHER_URL: "https://example.invalid/teacher",
      STAGING_STUDIO_URL: "https://example.invalid/studio",
      STAGING_TEACHER_EMAIL: "smoke@example.invalid",
      STAGING_TEACHER_PASSWORD: "placeholder"
    }
  },
  {
    name: "production",
    config: "playwright.production.config.ts",
    env: {
      PRODUCTION_STUDENT_URL: "https://example.invalid/student",
      PRODUCTION_TEACHER_URL: "https://example.invalid/teacher",
      PRODUCTION_STUDIO_URL: "https://example.invalid/studio"
    }
  }
];

for (const contract of contracts) {
  const result = spawnSync(
    playwright,
    ["test", "--config", contract.config, "--list"],
    {
      cwd: root,
      env: { ...process.env, ...contract.env },
      encoding: "utf8"
    }
  );
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  if (result.status !== 0) {
    throw new Error(
      `${contract.name} smoke 수집에 실패했습니다.\n${output.trim()}`
    );
  }
  const count = Number(output.match(/Total:\s+(\d+)\s+tests?/)?.[1] ?? 0);
  if (count < 1) {
    throw new Error(
      `${contract.name} config에서 smoke test를 하나도 수집하지 못했습니다.`
    );
  }
  console.log(
    `${contract.name} smoke contract passed: ${count} test(s) collected offline.`
  );
}
