#!/usr/bin/env node
"use strict";

const path = require("node:path");

const { validateClaudeHtmlSlides } = require("./build-series-non-ppt-assets.cjs");

function main(argv = process.argv.slice(2)) {
  if (argv.length !== 1) {
    throw new Error("사용법: node tools/vivasam-bundle/check-claude-html-slides.cjs <LESSON_ID-slides.html>");
  }
  const htmlPath = path.resolve(argv[0]);
  const result = validateClaudeHtmlSlides(htmlPath);
  process.stdout.write(`${JSON.stringify({
    ok: true,
    htmlPath,
    slideCount: result.slideCount,
    width: result.width,
    height: result.height,
  }, null, 2)}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { main };
