import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const runtimeDistDirectories = [
  "apps/student/dist",
  "apps/teacher/dist"
];
const rationaleSources = await Promise.all(
  [
    "../packages/content/src/grade3-semester1-rationales.ts",
    "../packages/content/src/grade3-semester2-rationales.ts"
  ].map((source) =>
    readFile(fileURLToPath(new URL(source, import.meta.url)), "utf8")
  )
);
const prerequisiteGraph = JSON.parse(
  await readFile(
    fileURLToPath(new URL(
      "../packages/content/src/grade3-stage-prerequisite-graph.json",
      import.meta.url
    )),
    "utf8"
  )
);
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
  prerequisiteGraph.reviewEvidence,
  ...prerequisiteGraph.edges.map((edge) => edge.reviewEvidence)
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
