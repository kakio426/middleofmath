import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  cronUtcToKst,
  difference,
  extractCron,
  extractDocumentedSecretNames,
  extractEnvFileKeys,
  extractHttpsHosts,
  extractJobEnvKeys,
  extractNeeds,
  extractPlaywrightTestDir,
  extractPurgeRpcName,
  extractRequiredEnvironmentNames,
  extractSecretNames,
  extractStagingAliases,
  extractViteEnvKeys,
  hasEnabledWorkflowDemoMode,
  jobHasEnvironment,
  parseWorkflowJobs,
  sqlDefinesServiceRoleOnlyFunction
} from "./parse-operations-inventory";

const root = resolve(process.cwd());
const workflowPaths = [
  ".github/workflows/ci.yml",
  ".github/workflows/release-staging.yml",
  ".github/workflows/release-production.yml",
  ".github/workflows/purge-expired-pilots.yml"
];
const workflows = new Map(
  workflowPaths.map((path) => [path, read(path)])
);
const docs = read("docs/pilot-operations.md");

describe("파일럿 운영 계약", () => {
  it("워크플로 비밀값과 운영 문서 목록이 양방향으로 일치한다", () => {
    const used = new Set<string>();
    for (const source of workflows.values()) {
      extractSecretNames(source).forEach((name) => used.add(name));
    }
    const documented = extractDocumentedSecretNames(docs);

    expect(difference(used, documented)).toEqual([]);
    expect(difference(documented, used)).toEqual([]);
  });

  it("비밀값을 쓰는 모든 job은 environment 경계 안에 있다", () => {
    const failures: string[] = [];
    for (const [path, source] of workflows) {
      for (const job of parseWorkflowJobs(source)) {
        if (extractSecretNames(job.body).size > 0 && !jobHasEnvironment(job)) {
          failures.push(`${path}:${job.id}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("모든 needs 대상은 같은 워크플로에 정의되어 있다", () => {
    const failures: string[] = [];
    for (const [path, source] of workflows) {
      const jobs = parseWorkflowJobs(source);
      const jobIds = new Set(jobs.map((job) => job.id));
      for (const job of jobs) {
        for (const target of extractNeeds(job)) {
          if (!jobIds.has(target)) failures.push(`${path}:${job.id}->${target}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("staging과 production smoke가 spec의 필수 환경값을 모두 전달한다", () => {
    const cases = [
      {
        workflow: ".github/workflows/release-staging.yml",
        spec: "e2e-staging/pilot-flow.spec.ts"
      },
      {
        workflow: ".github/workflows/release-production.yml",
        spec: "e2e-production/smoke.spec.ts"
      }
    ];

    for (const item of cases) {
      const smoke = parseWorkflowJobs(workflows.get(item.workflow)!)
        .find((job) => job.id === "smoke");
      expect(smoke, item.workflow).toBeDefined();
      expect(
        difference(
          extractRequiredEnvironmentNames(read(item.spec)),
          extractJobEnvKeys(smoke!)
        ),
        item.workflow
      ).toEqual([]);
    }
  });

  it("두 원격 Playwright config가 실제 smoke spec을 수집한다", () => {
    for (const configPath of [
      "playwright.staging.config.ts",
      "playwright.production.config.ts"
    ]) {
      const testDir = extractPlaywrightTestDir(read(configPath));
      expect(testDir, configPath).toBeTruthy();
      const absolute = resolve(root, testDir!);
      expect(existsSync(absolute), configPath).toBe(true);
      expect(
        readdirSync(absolute).filter((file) => file.endsWith(".spec.ts")).length,
        configPath
      ).toBeGreaterThan(0);
    }
  });

  it("03:17 KST purge 일정과 service-role 전용 RPC가 함께 고정된다", () => {
    const purge = workflows.get(
      ".github/workflows/purge-expired-pilots.yml"
    )!;
    const cron = extractCron(purge);
    expect(cron).toBe("17 18 * * *");
    expect(cronUtcToKst(cron!)).toBe("03:17");
    expect(docs).toContain("매일 03:17 KST");

    const rpc = extractPurgeRpcName(purge);
    expect(rpc).toBe("purge_expired_pilot_data");
    const migrationSql = walk("supabase/migrations", ".sql")
      .map(read)
      .join("\n");
    expect(sqlDefinesServiceRoleOnlyFunction(migrationSql, rpc!)).toBe(true);
  });

  it("각 앱의 VITE 환경값 사용과 .env.example이 정확히 일치한다", () => {
    for (const app of ["student", "teacher", "studio"]) {
      const used = new Set<string>();
      for (const path of walk(`apps/${app}/src`, [".ts", ".tsx"])) {
        extractViteEnvKeys(read(path)).forEach((key) => used.add(key));
      }
      expect(
        [...extractEnvFileKeys(read(`apps/${app}/.env.example`))].sort(),
        app
      ).toEqual([...used].sort());
    }
  });

  it("배포 워크플로는 데모 모드를 켜지 않는다", () => {
    const failures = [...workflows]
      .filter(([, source]) => hasEnabledWorkflowDemoMode(source))
      .map(([path]) => path);
    expect(failures).toEqual([]);
  });

  it("staging 별칭·smoke URL·문서의 세 호스트가 일치한다", () => {
    const staging = workflows.get(
      ".github/workflows/release-staging.yml"
    )!;
    const aliases = extractStagingAliases(staging);
    const workflowHosts = new Set(
      [...extractHttpsHosts(staging)].filter((host) =>
        host.endsWith("-staging.vercel.app")
      )
    );
    const documentedHosts = new Set(
      [...extractHttpsHosts(docs)].filter((host) =>
        host.endsWith("-staging.vercel.app")
      )
    );
    expect([...aliases].sort()).toEqual([...workflowHosts].sort());
    expect([...aliases].sort()).toEqual([...documentedHosts].sort());
    expect(aliases.size).toBe(3);
  });

  it("production smoke URL은 HTTPS이며 staging과 겹치지 않는다", () => {
    const stagingAliases = extractStagingAliases(
      workflows.get(".github/workflows/release-staging.yml")!
    );
    const production = parseWorkflowJobs(
      workflows.get(".github/workflows/release-production.yml")!
    ).find((job) => job.id === "smoke")!;
    const productionHosts = extractHttpsHosts(production.body);

    expect(productionHosts.size).toBe(3);
    expect(
      [...productionHosts].every(
        (host) => !host.includes("-staging") && !stagingAliases.has(host)
      )
    ).toBe(true);
  });

  it("production migration은 초대 교사 검사 뒤에만 실행된다", () => {
    const migrate = parseWorkflowJobs(
      workflows.get(".github/workflows/release-production.yml")!
    ).find((job) => job.id === "migrate")!;
    const queryIndex = migrate.body.indexOf(
      "assert-invited-teachers-only.sql"
    );
    const pushIndex = migrate.body.indexOf("supabase db push");
    expect(queryIndex).toBeGreaterThan(-1);
    expect(pushIndex).toBeGreaterThan(queryIndex);
    expect(read("supabase/snippets/assert-invited-teachers-only.sql"))
      .toContain("user_row.invited_at is null");
  });
});

describe("운영 계약의 음성 fixture", () => {
  it("문서에 없는 secret과 사용하지 않는 문서 secret을 구분한다", () => {
    const used = extractSecretNames(
      "env:\n  TOKEN: ${{ secrets.FOO }}\n"
    );
    const documented = extractDocumentedSecretNames(
      "## GitHub environment secrets\n\n- `BAR`\n"
    );
    expect(difference(used, documented)).toEqual(["FOO"]);
    expect(difference(documented, used)).toEqual(["BAR"]);
  });

  it("smoke job이 spec 필수 환경값을 빠뜨리면 차이를 찾는다", () => {
    const job = parseWorkflowJobs(
      "jobs:\n  smoke:\n    env:\n      PRESENT: yes\n"
    )[0];
    expect(
      difference(
        extractRequiredEnvironmentNames('required("MISSING")'),
        extractJobEnvKeys(job)
      )
    ).toEqual(["MISSING"]);
  });

  it("cron 변경과 purge RPC 이름 변경을 거부할 수 있다", () => {
    expect(cronUtcToKst("17 19 * * *")).not.toBe("03:17");
    expect(
      sqlDefinesServiceRoleOnlyFunction(
        "create or replace function public.original() returns void;",
        "renamed"
      )
    ).toBe(false);
  });

  it("새 VITE 키가 example에 없으면 차이를 찾는다", () => {
    expect(
      difference(
        extractViteEnvKeys("import.meta.env.VITE_NEW_KEY"),
        extractEnvFileKeys("VITE_OLD_KEY=value")
      )
    ).toEqual(["VITE_NEW_KEY"]);
  });

  it("배포 job의 demo true와 staging 별칭 불일치를 찾는다", () => {
    expect(hasEnabledWorkflowDemoMode("  VITE_DEMO_MODE: true\n")).toBe(true);
    expect(
      [...extractStagingAliases("  staging_alias: one-staging.vercel.app\n")]
    ).not.toEqual(
      [...extractHttpsHosts("https://two-staging.vercel.app")]
    );
  });
});

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

function walk(
  path: string,
  extensions: string | string[]
): string[] {
  const allowed = new Set(
    Array.isArray(extensions) ? extensions : [extensions]
  );
  const absolute = resolve(root, path);
  return readdirSync(absolute).flatMap((entry) => {
    const child = join(absolute, entry);
    if (statSync(child).isDirectory()) {
      return walk(child, [...allowed]);
    }
    return allowed.has(child.slice(child.lastIndexOf(".")))
      ? [child]
      : [];
  });
}
