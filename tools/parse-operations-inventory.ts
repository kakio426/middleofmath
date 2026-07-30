export interface WorkflowJob {
  id: string;
  body: string;
}

export function parseWorkflowJobs(source: string): WorkflowJob[] {
  const jobsStart = source.search(/^jobs:\s*$/m);
  if (jobsStart < 0) return [];

  const jobsSource = source.slice(jobsStart);
  const matches = [...jobsSource.matchAll(/^  ([a-z0-9_-]+):\s*$/gm)];
  return matches.map((match, index) => ({
    id: match[1],
    body: jobsSource.slice(
      match.index,
      matches[index + 1]?.index ?? jobsSource.length
    )
  }));
}

export function extractSecretNames(source: string): Set<string> {
  const names = new Set<string>();
  for (const match of source.matchAll(
    /secrets(?:\.([A-Z][A-Z0-9_]*)|\[['"]([A-Z][A-Z0-9_]*)['"]\])/g
  )) {
    names.add(match[1] ?? match[2]);
  }
  if (/secrets\[matrix\.project_secret\]/.test(source)) {
    for (const match of source.matchAll(
      /^\s+project_secret:\s*([A-Z][A-Z0-9_]*)\s*$/gm
    )) {
      names.add(match[1]);
    }
  }
  return names;
}

export function extractDocumentedSecretNames(markdown: string): Set<string> {
  const section = markdown
    .split("## GitHub environment secrets")[1]
    ?.split(/^## /m)[0] ?? "";
  return new Set(
    [...section.matchAll(/^- `([A-Z][A-Z0-9_]*)`/gm)].map(
      (match) => match[1]
    )
  );
}

export function difference(
  required: Iterable<string>,
  available: Iterable<string>
): string[] {
  const availableSet = new Set(available);
  return [...new Set(required)]
    .filter((value) => !availableSet.has(value))
    .sort();
}

export function jobHasEnvironment(job: WorkflowJob): boolean {
  return /^    environment:\s*\S+/m.test(job.body);
}

export function extractJobEnvKeys(job: WorkflowJob): Set<string> {
  return new Set(
    [...job.body.matchAll(/^\s{6,}([A-Z][A-Z0-9_]+):\s*/gm)].map(
      (match) => match[1]
    )
  );
}

export function extractNeeds(job: WorkflowJob): string[] {
  const match = job.body.match(/^    needs:\s*(.+)\s*$/m);
  if (!match) return [];
  const value = match[1].trim();
  if (value.startsWith("[")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [value];
}

export function extractRequiredEnvironmentNames(source: string): Set<string> {
  const names = new Set<string>();
  for (const match of source.matchAll(
    /\brequired\(\s*["']([A-Z][A-Z0-9_]*)["']\s*\)/g
  )) {
    names.add(match[1]);
  }
  for (const match of source.matchAll(
    /\bprocess\.env\.([A-Z][A-Z0-9_]*)\b/g
  )) {
    names.add(match[1]);
  }
  return names;
}

export function extractPlaywrightTestDir(source: string): string | null {
  return source.match(/\btestDir:\s*["']([^"']+)["']/)?.[1] ?? null;
}

export function extractCron(source: string): string | null {
  return source.match(/\bcron:\s*["']([^"']+)["']/)?.[1] ?? null;
}

export function cronUtcToKst(cron: string): string | null {
  const match = cron.match(/^(\d{1,2})\s+(\d{1,2})\s+\*\s+\*\s+\*$/);
  if (!match) return null;
  const minute = Number(match[1]);
  const hour = (Number(match[2]) + 9) % 24;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function extractPurgeRpcName(source: string): string | null {
  return source.match(/\/rest\/v1\/rpc\/([a-z0-9_]+)/)?.[1] ?? null;
}

export function sqlDefinesServiceRoleOnlyFunction(
  sql: string,
  functionName: string
): boolean {
  const escaped = escapeRegExp(functionName);
  return new RegExp(
    `create\\s+or\\s+replace\\s+function\\s+public\\.${escaped}\\s*\\(`,
    "i"
  ).test(sql)
    && new RegExp(
      `revoke\\s+all\\s+on\\s+function\\s+public\\.${escaped}\\s*\\([^;]*\\)\\s+from\\s+public`,
      "i"
    ).test(sql)
    && new RegExp(
      `grant\\s+execute\\s+on\\s+function\\s+public\\.${escaped}\\s*\\([^;]*\\)\\s+to\\s+service_role`,
      "i"
    ).test(sql);
}

export function extractEnvFileKeys(source: string): Set<string> {
  return new Set(
    [...source.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map(
      (match) => match[1]
    )
  );
}

export function extractViteEnvKeys(source: string): Set<string> {
  return new Set(
    [...source.matchAll(/\bimport\.meta\.env\.(VITE_[A-Z0-9_]+)\b/g)].map(
      (match) => match[1]
    )
  );
}

export function hasEnabledWorkflowDemoMode(source: string): boolean {
  return /^\s+VITE_DEMO_MODE:\s*["']?true["']?\s*$/m.test(source);
}

export function extractStagingAliases(source: string): Set<string> {
  return new Set(
    [...source.matchAll(/^\s+staging_alias:\s*([a-z0-9.-]+)\s*$/gm)].map(
      (match) => match[1]
    )
  );
}

export function extractHttpsHosts(source: string): Set<string> {
  return new Set(
    [...source.matchAll(/https:\/\/([a-z0-9.-]+)/g)].map(
      (match) => match[1]
    )
  );
}

export interface LiteralSelectorInventory {
  accessibleNames: Set<string>;
  classNames: Set<string>;
}

export function extractLiteralSelectors(
  source: string
): LiteralSelectorInventory {
  const accessibleNames = new Set<string>();
  for (const match of source.matchAll(
    /\bgetBy(?:Label|Text)\(\s*["']([^"']+)["']/g
  )) {
    accessibleNames.add(match[1]);
  }
  for (const match of source.matchAll(
    /\bgetByRole\([^,\n]+,\s*\{[^}\n]*\bname:\s*["']([^"']+)["']/g
  )) {
    accessibleNames.add(match[1]);
  }

  const classNames = new Set<string>();
  for (const locator of source.matchAll(
    /\blocator\(\s*["']([^"']+)["']\s*\)/g
  )) {
    for (const classMatch of locator[1].matchAll(/\.([a-z][a-z0-9_-]*)/g)) {
      classNames.add(classMatch[1]);
    }
  }
  return { accessibleNames, classNames };
}

export function missingLiteralSelectors(
  inventory: LiteralSelectorInventory,
  applicationSource: string
): string[] {
  return [
    ...[...inventory.accessibleNames]
      .filter((name) => !containsAccessibleName(applicationSource, name))
      .map((name) => `name:${name}`),
    ...[...inventory.classNames]
      .filter((name) => !applicationSource.includes(name))
      .map((name) => `class:${name}`)
  ].sort();
}

function containsAccessibleName(source: string, name: string): boolean {
  if (source.includes(name)) return true;
  const visibleTokens = name.split(/\s+/).filter(Boolean);
  return visibleTokens.length > 1
    && visibleTokens.every((token) => source.includes(token));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
