import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer } from "vite";

const root = process.cwd();
const contentDir = resolve(root, "packages/content/src");
const shouldWrite = process.argv.includes("--write");
const definitions = [
  ["grade5-semester2", "grade5Semester2Diagnosis"],
  ["grade6-semester1", "grade6Semester1Diagnosis"],
  ["grade6-semester2", "grade6Semester2Diagnosis"]
];
const vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom"
});

try {
  for (const [moduleName, exportName] of definitions) {
    const module = await vite.ssrLoadModule(
      `/packages/content/src/${moduleName}.ts`
    );
    const serialized = `${JSON.stringify(module[exportName], null, 2)}\n`;
    const outputPath = resolve(contentDir, `${moduleName}.runtime.json`);
    if (shouldWrite) {
      await writeFile(outputPath, serialized, "utf8");
      console.log(`갱신: ${outputPath}`);
      continue;
    }
    const committed = await readFile(outputPath, "utf8");
    if (committed !== serialized) {
      throw new Error(`${moduleName} 런타임 스냅숏이 제작 원본과 다릅니다.`);
    }
    console.log(`검증: ${outputPath}`);
  }
} finally {
  await vite.close();
}
