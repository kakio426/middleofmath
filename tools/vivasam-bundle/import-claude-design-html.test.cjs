"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  hasPublishableInputs,
  validateClaudeHtmlSlides,
} = require("./build-series-non-ppt-assets.cjs");
const { compileClaudeDesignHtml } = require("./import-claude-design-html.cjs");

function write(root, relativePath, content) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  return target;
}

test("Claude Design 묶음을 원본 배치를 유지한 단일 Eduitit HTML로 묶는다", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "claude-design-export-"));
  const dsRoot = "_ds/blockprint";
  write(root, "support.js", "window.__supportLoaded = true;\n");
  write(root, "deck-stage.js", "customElements.define('deck-stage', class extends HTMLElement { goTo() {} });\n");
  write(root, `${dsRoot}/_ds_bundle.js`, "window.__designSystemLoaded = true;\n");
  write(root, `${dsRoot}/assets/fonts/PretendardVariable.woff2`, Buffer.from("font"));
  write(
    root,
    `${dsRoot}/tokens/fonts.css`,
    '@import url("https://fonts.googleapis.com/css2?family=Inter");\n@font-face{font-family:Pretendard;src:url("../assets/fonts/PretendardVariable.woff2") format("woff2")}\n',
  );
  write(root, `${dsRoot}/styles.css`, '@import "tokens/fonts.css";\n:root{--font-sans:Pretendard,sans-serif}\n');
  write(root, "assets/illustrations/cloud.png", Buffer.from("png-image"));
  const sourcePath = write(root, "수업 제목.dc.html", `<!DOCTYPE html>
<html><head><meta charset="utf-8"><script src="./support.js"></script></head><body>
<x-dc><helmet>
<link rel="stylesheet" href="${dsRoot}/tokens/fonts.css">
<link rel="stylesheet" href="${dsRoot}/styles.css">
<script src="${dsRoot}/_ds_bundle.js"></script>
</helmet>
<x-import component-from-global-scope="deck-stage" from="./deck-stage.js" width="1920" height="1080">
<section data-label="01"><h1>수업 제목</h1><img src="assets/illustrations/cloud.png" alt=""></section>
<section data-label="02"><h2>둘째 장</h2></section>
</x-import></x-dc>
</body></html>`);
  const outputPath = path.join(root, "lesson-slides.html");

  const result = compileClaudeDesignHtml({
    sourcePath,
    exportRoot: root,
    outputPath,
    lessonId: "g3s1-test-lesson",
    title: "수업 제목",
  });
  const output = fs.readFileSync(outputPath, "utf8");
  const validated = validateClaudeHtmlSlides(outputPath);

  assert.equal(result.slideCount, 2);
  assert.equal(validated.slideCount, 2);
  assert.equal(validated.width, 1920);
  assert.match(output, /data-eduitit-runtime="design-export"/);
  assert.doesNotMatch(output, /Claude/i);
  assert.equal((output.match(/data-slide/g) || []).length, 2);
  assert.match(output, /data:image\/png;base64,/);
  assert.match(output, /data:font\/woff2;base64,/);
  assert.match(output, /\/static\/vendor\/react\/react\.production\.min\.js/);
  assert.doesNotMatch(output, /src="\.\/support\.js"/);
  assert.doesNotMatch(output, /assets\/illustrations\/cloud\.png/);
  assert.doesNotMatch(output, /(?:src|href)="https?:\/\//);
});

test("HTML을 받았어도 통합 활동지가 없으면 공개 패키지 대상에 넣지 않는다", () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vivasam-package-inputs-"));
  const lesson = { id: "g3s1-test-lesson" };
  write(
    repoRoot,
    `artifacts/vivasam/${lesson.id}/claude/${lesson.id}-slides.html`,
    '<!doctype html><html><head><meta name="eduitit-slide-size" content="1600x900"></head><body><main data-eduitit-deck><section data-slide>수업</section></main></body></html>',
  );

  assert.equal(hasPublishableInputs(repoRoot, lesson), false);

  const worksheetRoot = `artifacts/vivasam/${lesson.id}/worksheet`;
  write(repoRoot, `${worksheetRoot}/${lesson.id}-worksheet.prompt.txt`, "prompt");
  write(repoRoot, `${worksheetRoot}/${lesson.id}-worksheet.imagegen.json`, "{}");
  write(repoRoot, `${worksheetRoot}/${lesson.id}-worksheet.png`, "png");

  assert.equal(hasPublishableInputs(repoRoot, lesson), true);
});
