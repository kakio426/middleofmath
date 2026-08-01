import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer } from "vite";

const root = process.cwd();
const contentDir = resolve(root, "packages/content/src");
const snapshotPath = resolve(contentDir, "upstream/kr-learning-map.grade56.snapshot.json");
const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
const shouldWrite = process.argv.includes("--write");
const vite = await createServer({ server: { middlewareMode: true }, appType: "custom" });

function digest(value) {
  return `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;
}

function topicsForAnchor(anchorId) {
  const standardKey = `kr-2022-elem-math:${anchorId}`;
  return snapshot.topics
    .filter((topic) => topic.standardKey === standardKey)
    .map((topic) => topic.id)
    .sort();
}

async function loadDiagnosis(moduleName, exportName) {
  const module = await vite.ssrLoadModule(`/packages/content/src/${moduleName}.ts`);
  return module[exportName];
}

function generateCrosswalk(content) {
  const body = {
    setKey: content.manifest.id,
    revision: "2026-08-01.1",
    upstreamCommit: snapshot.upstream.commit,
    upstreamTaxonomyVersion: snapshot.upstream.taxonomyVersion,
    upstreamOntologyVersion: snapshot.upstream.ontologyVersion,
    snapshotDigest: snapshot.snapshotDigest,
    anchorRows: content.curriculumAnchors.map((anchor) => ({
      anchorId: anchor.id,
      status: "matched",
      standardKey: `kr-2022-elem-math:${anchor.id}`,
      topicIds: topicsForAnchor(anchor.id),
      reviewEvidence: `고정 DECK6 스냅숏에서 ${anchor.id}의 개념·표현·적용 주제가 같은 성취기준 코드에 직접 연결됨을 확인했다.`
    })),
    stageRows: content.learnerStages.map((stage) => ({
      stageId: stage.id,
      status: "topic-partial",
      topicIds: [...new Set(stage.curriculumAnchorIds.flatMap(topicsForAnchor))].sort(),
      reviewEvidence: `${stage.title} 행동을 로컬 진단 단계로 세분화했다. 상류 주제는 범위 대조에만 쓰며 학생 결손 판정으로 자동 승격하지 않는다.`
    }))
  };
  return { ...body, crosswalkDigest: digest(body) };
}

try {
  const existingPath = resolve(contentDir, "grade5-semester1-crosswalk.json");
  const existing = JSON.parse(await readFile(existingPath, "utf8"));
  const { crosswalkDigest: _oldDigest, ...existingBody } = existing;
  existingBody.snapshotDigest = snapshot.snapshotDigest;
  const refreshedExisting = {
    ...existingBody,
    crosswalkDigest: digest(existingBody)
  };

  const definitions = [
    ["grade5-semester2", "grade5Semester2Diagnosis"],
    ["grade6-semester1", "grade6Semester1Diagnosis"],
    ["grade6-semester2", "grade6Semester2Diagnosis"]
  ];
  const generated = [];
  for (const [moduleName, exportName] of definitions) {
    const content = await loadDiagnosis(moduleName, exportName);
    const crosswalk = generateCrosswalk(content);
    if (crosswalk.anchorRows.some((row) => row.topicIds.length === 0)) {
      throw new Error(`${moduleName}: 상류 주제가 없는 성취기준이 있습니다.`);
    }
    generated.push([resolve(contentDir, `${moduleName}-crosswalk.json`), crosswalk]);
  }

  const outputs = [[existingPath, refreshedExisting], ...generated];
  for (const [path, value] of outputs) {
    if (shouldWrite) await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    console.log(`${shouldWrite ? "갱신" : "검증"}: ${path} ${value.crosswalkDigest}`);
  }
} finally {
  await vite.close();
}
