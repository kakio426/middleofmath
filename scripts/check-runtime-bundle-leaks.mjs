import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const runtimeDistDirectories = [
  "apps/student/dist",
  "apps/teacher/dist"
];
const contentSourceDirectory = fileURLToPath(new URL(
  "../packages/content/src",
  import.meta.url
));
const contentSourceEntries = await readdir(contentSourceDirectory);
const rationaleSources = await Promise.all(
  contentSourceEntries
    .filter((name) => name.endsWith("-rationales.ts"))
    .map((name) => readFile(join(contentSourceDirectory, name), "utf8"))
);
const contentJsonSources = await Promise.all(
  contentSourceEntries
    .filter((name) => name.endsWith(".json"))
    .map(async (name) => JSON.parse(
      await readFile(join(contentSourceDirectory, name), "utf8")
    ))
);

function collectReviewCopy(value) {
  if (Array.isArray(value)) return value.flatMap(collectReviewCopy);
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, nested]) =>
    key === "reviewEvidence" || key === "reviewLimitations"
      ? Array.isArray(nested) ? nested : [nested]
      : collectReviewCopy(nested)
  ).filter((item) => typeof item === "string");
}
const authoredKoreanCopy = [
  ...rationaleSources.flatMap((source) => [
    ...source.matchAll(/"([^"\n]*[가-힣][^"\n]*)"/g)
  ])
].map((match) => match[1]);
const forbiddenAuditCopy = [...new Set([
  "misconceptionId",
  "sharedSignalRationale",
  "derivation",
  "rationale",
  ...authoredKoreanCopy,
  ...contentJsonSources.flatMap(collectReviewCopy)
])];

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  }));
  return paths.flat();
}

const violations = [];
for (const directory of runtimeDistDirectories) {
  for (const path of await filesUnder(directory)) {
    if (![".js", ".html"].includes(extname(path))) continue;
    const source = await readFile(path, "utf8");
    for (const forbidden of forbiddenAuditCopy) {
      if (source.includes(forbidden)) {
        violations.push(`${path}: ${forbidden}`);
      }
    }
  }
}

if (violations.length > 0) {
  throw new Error(
    `편집용 오답 근거가 학생·교사 런타임 번들에 포함되었습니다.\n${violations.join("\n")}`
  );
}

console.log(
  `Runtime bundle leak check passed: ${forbiddenAuditCopy.length} editor-only strings excluded.`
);
