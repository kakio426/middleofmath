import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const commit = "3ef0563084aa2a9baaa47da2c1ec0ebf5d7edc5c";

async function readSnapshot(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function runGenerator(label, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      "scripts/refresh-crosswalk-snapshot.mjs",
      "--commit",
      commit,
      ...args
    ], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${label} 재현 실패\n${stderr || stdout}`));
        return;
      }
      const digest = /snapshotDigest (sha256:[0-9a-f]{64})/.exec(stdout)?.[1];
      console.log(`${label}: ${digest ?? "digest 출력 없음"}`);
      resolve();
    });
  });
}

const legacy = await readSnapshot(
  "packages/content/src/upstream/kr-learning-map.snapshot.json"
);
const grade3Semester1 = await readSnapshot(
  "packages/content/src/upstream/kr-learning-map.g3s1.snapshot.json"
);
const grade34 = await readSnapshot(
  "packages/content/src/upstream/kr-learning-map.grade34.snapshot.json"
);
const grade56 = await readSnapshot(
  "packages/content/src/upstream/kr-learning-map.grade56.snapshot.json"
);

await runGenerator("3-4 legacy-v0", [
  "--grade-band", "3-4",
  "--snapshot-schema", "legacy-v0",
  "--expect-digest", legacy.snapshotDigest
]);
await runGenerator("3-4 grade3-semester1 legacy-v0", [
  "--grade-band", "3-4",
  "--snapshot-schema", "legacy-v0",
  "--codes", grade3Semester1.standards.map((row) => row.code).join(","),
  "--expect-digest", grade3Semester1.snapshotDigest
]);
await runGenerator("3-4 evidence-v1", [
  "--grade-band", "3-4",
  "--snapshot-schema", "evidence-v1",
  "--codes", grade34.standards.map((row) => row.code).join(","),
  "--expect-digest", grade34.snapshotDigest
]);
await runGenerator("5-6 evidence-v1", [
  "--grade-band", "5-6",
  "--snapshot-schema", "evidence-v1",
  "--codes", grade56.scope.requestedCodes.join(","),
  "--expect-digest", grade56.snapshotDigest
]);

console.log("Crosswalk snapshot reproducibility harness passed.");
