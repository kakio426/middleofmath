#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const { validateClaudeHtmlSlides } = require("./build-series-non-ppt-assets.cjs");

const REPO_ROOT = path.resolve(__dirname, "../..");
const TRACKER_PATH = path.join(__dirname, "series-tracker.json");
const REACT_URL = "/static/vendor/react/react.production.min.js";
const REACT_DOM_URL = "/static/vendor/react/react-dom.production.min.js";
const MAX_SOURCE_BYTES = 12 * 1024 * 1024;

function ensure(condition, message) {
  if (!condition) throw new Error(`Claude Design HTML 가져오기 실패: ${message}`);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeTitle(value) {
  return String(value || "")
    .normalize("NFC")
    .replace(/\.dc\.html$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function attributeValue(tag, name) {
  const match = tag.match(new RegExp(`\\b${escapeRegex(name)}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match ? match[1].trim() : "";
}

function resolveInside(exportRoot, ownerPath, reference) {
  const clean = String(reference || "").split(/[?#]/, 1)[0].trim();
  ensure(clean && !clean.startsWith("/") && !clean.includes("\\"), `허용되지 않는 상대 경로입니다: ${reference}`);
  ensure(!/^[a-z][a-z0-9+.-]*:/i.test(clean) && !clean.startsWith("//"), `외부 리소스는 가져올 수 없습니다: ${reference}`);
  const root = path.resolve(exportRoot);
  const resolved = path.resolve(path.dirname(ownerPath), clean);
  ensure(resolved === root || resolved.startsWith(`${root}${path.sep}`), `리소스 경로가 내보내기 폴더를 벗어났습니다: ${reference}`);
  ensure(fs.existsSync(resolved) && fs.statSync(resolved).isFile(), `리소스 파일이 없습니다: ${reference}`);
  return resolved;
}

function mimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const known = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
  };
  ensure(known[extension], `인라인으로 묶을 수 없는 리소스 형식입니다: ${path.basename(filePath)}`);
  return known[extension];
}

function dataUrl(filePath) {
  return `data:${mimeType(filePath)};base64,${fs.readFileSync(filePath).toString("base64")}`;
}

function inlineCss(css, cssPath, exportRoot, dependencies, importStack = new Set(), cssSeen = new Set()) {
  ensure(!importStack.has(cssPath), `CSS @import 순환 참조가 있습니다: ${path.relative(exportRoot, cssPath)}`);
  if (cssSeen.has(cssPath)) return "";
  cssSeen.add(cssPath);
  const nextStack = new Set(importStack);
  nextStack.add(cssPath);
  const withoutRemoteFonts = css.replace(
    /@import\s+url\(\s*["']?https:\/\/fonts\.googleapis\.com\/[^)]+\)\s*;?/gi,
    "",
  );
  const withLocalImports = withoutRemoteFonts.replace(
    /@import\s+(?:url\(\s*)?["']([^"']+)["']\s*\)?\s*;?/gi,
    (match, reference) => {
      if (/^https:\/\/fonts\.googleapis\.com\//i.test(reference)) return "";
      const importedPath = resolveInside(exportRoot, cssPath, reference);
      ensure(path.extname(importedPath).toLowerCase() === ".css", `CSS가 아닌 @import입니다: ${reference}`);
      dependencies.add(importedPath);
      return inlineCss(fs.readFileSync(importedPath, "utf8"), importedPath, exportRoot, dependencies, nextStack, cssSeen);
    },
  );
  ensure(!/@import\s/i.test(withLocalImports), `CSS @import를 해석하지 못했습니다: ${path.relative(exportRoot, cssPath)}`);
  return withLocalImports.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (match, quote, reference) => {
    const trimmed = reference.trim();
    if (!trimmed || trimmed.startsWith("data:") || trimmed.startsWith("#")) return match;
    const resourcePath = resolveInside(exportRoot, cssPath, trimmed);
    dependencies.add(resourcePath);
    return `url("${dataUrl(resourcePath)}")`;
  });
}

function encodeScriptBlob(source) {
  return Buffer.from(source, "utf8").toString("base64");
}

function resourceBootstrap(resources) {
  const entries = Object.entries(resources).map(([reference, source]) => {
    return `${JSON.stringify(reference)}:new Blob([Uint8Array.from(atob(${JSON.stringify(encodeScriptBlob(source))}),function(c){return c.charCodeAt(0);})],{type:"text/javascript"})`;
  });
  return `<script data-eduitit-bundled-resources>\nwindow.__resources=window.__resources||{};\nwindow.__resources["https://unpkg.com/react@18.3.1/umd/react.production.min.js"]=${JSON.stringify(REACT_URL)};\nwindow.__resources["https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"]=${JSON.stringify(REACT_DOM_URL)};\nwindow.__resourceBlobs=Object.assign(window.__resourceBlobs||{},{${entries.join(",")}});\n</script>`;
}

function inlineScriptTag(source, label) {
  ensure(!/<\/script/i.test(source), `${label} 안에 닫는 script 문자열이 있어 안전하게 인라인할 수 없습니다.`);
  return `<script data-eduitit-bundled-script="${escapeHtml(label)}">\n${source}\n</script>`;
}

function annotateDeck(html, lessonId, title) {
  const imports = [...html.matchAll(/<x-import\b[^>]*component-from-global-scope=["']deck-stage["'][^>]*>/gi)];
  ensure(imports.length === 1, "deck-stage x-import가 정확히 하나여야 합니다.");
  const openTag = imports[0][0];
  const openIndex = imports[0].index;
  const closeIndex = html.indexOf("</x-import>", openIndex + openTag.length);
  ensure(closeIndex > openIndex, "deck-stage x-import 닫는 태그가 없습니다.");
  const bodyStart = openIndex + openTag.length;
  const body = html.slice(bodyStart, closeIndex);
  const sectionCount = (body.match(/<section\b/gi) || []).length;
  ensure(sectionCount >= 1 && sectionCount <= 60, "슬라이드는 1~60장이어야 합니다.");
  const annotatedOpenTag = openTag.replace(
    /<x-import\b/i,
    `<x-import data-eduitit-deck data-eduitit-runtime="design-export" data-eduitit-lesson-id="${escapeHtml(lessonId)}"`,
  );
  const annotatedBody = body.replace(/<section\b(?![^>]*\bdata-slide(?:\s|=|>))/gi, "<section data-slide");
  const replaced = `${html.slice(0, openIndex)}${annotatedOpenTag}${annotatedBody}${html.slice(closeIndex)}`;
  const width = Number(attributeValue(openTag, "width"));
  const height = Number(attributeValue(openTag, "height"));
  ensure(width >= 640 && width <= 3840 && height >= 360 && height <= 2160, "deck-stage 크기가 올바르지 않습니다.");
  ensure(Math.abs(width / height - 16 / 9) <= 0.002, "deck-stage 캔버스는 16:9여야 합니다.");

  let withMetadata = replaced;
  withMetadata = withMetadata.replace(/<meta[^>]+name=["']eduitit-slide-size["'][^>]*>/gi, "");
  const metadata = `<meta name="eduitit-slide-size" content="${width}x${height}"><meta name="eduitit-source" content="design-export"><title>${escapeHtml(title)}</title>`;
  if (/<title\b/i.test(withMetadata)) {
    withMetadata = withMetadata.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
    withMetadata = withMetadata.replace(/<head\b[^>]*>/i, (match) => `${match}<meta name="eduitit-slide-size" content="${width}x${height}"><meta name="eduitit-source" content="design-export">`);
  } else {
    withMetadata = withMetadata.replace(/<head\b[^>]*>/i, (match) => `${match}${metadata}`);
  }
  return { html: withMetadata, slideCount: sectionCount, width, height };
}

function compileClaudeDesignHtml({ sourcePath, exportRoot, outputPath, lessonId, title }) {
  const root = path.resolve(exportRoot || path.dirname(sourcePath));
  const source = path.resolve(sourcePath);
  ensure(source.startsWith(`${root}${path.sep}`), "원본 HTML은 내보내기 폴더 안에 있어야 합니다.");
  ensure(fs.existsSync(source), `원본 HTML이 없습니다: ${source}`);
  const sourceBytes = fs.readFileSync(source);
  ensure(sourceBytes.length > 0 && sourceBytes.length <= MAX_SOURCE_BYTES, "원본 HTML 크기는 12MB 이하여야 합니다.");
  let html = sourceBytes.toString("utf8");
  ensure(/^\s*<!doctype html>/i.test(html), "원본은 완전한 HTML 문서여야 합니다.");
  ensure(/<x-dc\b/i.test(html), "Claude Design x-dc 루트가 없습니다.");
  for (const forbidden of [/<iframe\b/i, /<object\b/i, /<embed\b/i, /<applet\b/i, /<base\b/i, /<form\b/i, /<meta[^>]+http-equiv=["']?refresh/i]) {
    ensure(!forbidden.test(html), `원본에 허용하지 않는 능동 요소가 있습니다: ${forbidden}`);
  }

  const dependencies = new Set([source]);
  const localScripts = [];
  let supportSource = "";
  html = html.replace(/<script\b([^>]*)\bsrc\s*=\s*["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (tag, before, reference) => {
    const scriptPath = resolveInside(root, source, reference);
    dependencies.add(scriptPath);
    const script = fs.readFileSync(scriptPath, "utf8");
    if (path.basename(scriptPath) === "support.js") {
      ensure(!supportSource, "support.js가 두 번 선언되었습니다.");
      supportSource = script;
    } else {
      localScripts.push({ label: path.relative(root, scriptPath).split(path.sep).join("/"), source: script });
    }
    return "";
  });
  ensure(supportSource, "support.js를 찾지 못했습니다.");

  const styleSources = [];
  const cssSeen = new Set();
  html = html.replace(/<link\b[^>]*>/gi, (tag) => {
    const rel = attributeValue(tag, "rel").toLowerCase();
    const reference = attributeValue(tag, "href");
    if (rel !== "stylesheet") return tag;
    if (/^https:\/\/fonts\.googleapis\.com\//i.test(reference)) return "";
    const cssPath = resolveInside(root, source, reference);
    dependencies.add(cssPath);
    const css = inlineCss(fs.readFileSync(cssPath, "utf8"), cssPath, root, dependencies, new Set(), cssSeen);
    styleSources.push(`/* ${path.relative(root, cssPath).split(path.sep).join("/")} */\n${css}`);
    return "";
  });

  html = html.replace(/(<(?:img|source|video|audio)\b[^>]*\bsrc\s*=\s*["'])([^"']+)(["'])/gi, (match, prefix, reference, suffix) => {
    if (reference.startsWith("data:")) return match;
    const assetPath = resolveInside(root, source, reference);
    dependencies.add(assetPath);
    return `${prefix}${dataUrl(assetPath)}${suffix}`;
  });
  ensure(!/\bsrcset\s*=/i.test(html), "srcset 리소스는 단일 파일로 안전하게 묶을 수 없습니다.");

  const annotated = annotateDeck(html, lessonId, title);
  html = annotated.html;
  const importReferences = [...html.matchAll(/<x-import\b[^>]*\bfrom\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1]);
  ensure(importReferences.length >= 1, "x-import 리소스가 없습니다.");
  const resources = {};
  for (const reference of importReferences) {
    const modulePath = resolveInside(root, source, reference);
    dependencies.add(modulePath);
    resources[reference] = fs.readFileSync(modulePath, "utf8");
  }

  const injected = [
    styleSources.length ? `<style data-eduitit-bundled-styles>\n${styleSources.join("\n")}\n</style>` : "",
    `<script src="${REACT_URL}"></script>`,
    `<script src="${REACT_DOM_URL}"></script>`,
    resourceBootstrap(resources),
    ...localScripts.map(({ label, source: script }) => inlineScriptTag(script, label)),
    inlineScriptTag(supportSource, "support.js"),
  ].filter(Boolean).join("\n");
  html = html.replace(/<\/head\s*>/i, `${injected}\n</head>`);
  ensure(!/(?:src|href|srcset|poster)\s*=\s*["']\s*(?:https?:|\/\/)/i.test(html), "외부 URL 참조가 남아 있습니다.");

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html.endsWith("\n") ? html : `${html}\n`, "utf8");
  const validated = validateClaudeHtmlSlides(outputPath);
  ensure(validated.slideCount === annotated.slideCount, "묶은 HTML의 슬라이드 수가 원본과 다릅니다.");

  return {
    outputPath,
    slideCount: validated.slideCount,
    width: validated.width,
    height: validated.height,
    sourceSha256: sha256(sourceBytes),
    outputSha256: sha256(fs.readFileSync(outputPath)),
    dependencies: [...dependencies].sort().map((dependencyPath) => ({
      path: path.relative(root, dependencyPath).split(path.sep).join("/"),
      sha256: sha256(fs.readFileSync(dependencyPath)),
      bytes: fs.statSync(dependencyPath).size,
    })),
  };
}

function parseArgs(argv) {
  const result = { sourceDir: "", sequences: null };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--source-dir") result.sourceDir = argv[++index] || "";
    else if (value === "--sequences") {
      result.sequences = (argv[++index] || "").split(",").map(Number).filter(Number.isInteger);
    } else if (["--help", "-h"].includes(value)) result.help = true;
    else throw new Error(`알 수 없는 옵션입니다: ${value}`);
  }
  return result;
}

function printUsage() {
  process.stdout.write("사용법: node tools/vivasam-bundle/import-claude-design-html.cjs --source-dir <Claude 내보내기 폴더> [--sequences 1,2,3]\n");
}

function importClaudeDesignDirectory({ sourceDir, sequences = null, repoRoot = REPO_ROOT }) {
  const root = path.resolve(sourceDir);
  ensure(fs.existsSync(root) && fs.statSync(root).isDirectory(), `내보내기 폴더가 없습니다: ${root}`);
  const tracker = JSON.parse(fs.readFileSync(TRACKER_PATH, "utf8"));
  const selected = new Set(sequences || tracker.bundles.map((bundle) => bundle.sequence));
  const sourceByTitle = new Map();
  for (const filename of fs.readdirSync(root).filter((name) => name.endsWith(".dc.html"))) {
    const normalized = normalizeTitle(filename);
    ensure(!sourceByTitle.has(normalized), `같은 제목의 HTML이 두 개 있습니다: ${normalized}`);
    sourceByTitle.set(normalized, path.join(root, filename));
  }

  const results = [];
  for (const bundle of tracker.bundles.filter((item) => selected.has(item.sequence))) {
    const sourcePath = sourceByTitle.get(normalizeTitle(bundle.title));
    ensure(sourcePath, `${bundle.sequence}번 '${bundle.title}' HTML을 찾지 못했습니다.`);
    const claudeRoot = path.join(repoRoot, "artifacts", "vivasam", bundle.lessonId, "claude");
    const outputPath = path.join(claudeRoot, `${bundle.lessonId}-slides.html`);
    const result = compileClaudeDesignHtml({
      sourcePath,
      exportRoot: root,
      outputPath,
      lessonId: bundle.lessonId,
      title: bundle.title,
    });
    const intakePath = path.join(claudeRoot, "html-intake.json");
    fs.writeFileSync(intakePath, `${JSON.stringify({
      schemaVersion: 1,
      sourceFormat: "claude-design-dc-html",
      sourceFilename: path.basename(sourcePath),
      lessonId: bundle.lessonId,
      sequence: bundle.sequence,
      title: bundle.title,
      slideCount: result.slideCount,
      width: result.width,
      height: result.height,
      sourceSha256: result.sourceSha256,
      outputSha256: result.outputSha256,
      outputFilename: path.basename(outputPath),
      dependencies: result.dependencies,
    }, null, 2)}\n`, "utf8");
    results.push({ ...result, intakePath, lessonId: bundle.lessonId, sequence: bundle.sequence, title: bundle.title });
  }
  ensure(results.length === selected.size, `요청한 ${selected.size}개 중 ${results.length}개만 가져왔습니다.`);
  return results;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) return printUsage();
  ensure(options.sourceDir, "--source-dir가 필요합니다.");
  const results = importClaudeDesignDirectory(options);
  for (const result of results) {
    process.stdout.write(`${String(result.sequence).padStart(2, "0")} ${result.title}: ${result.slideCount}장 → ${path.relative(REPO_ROOT, result.outputPath)}\n`);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  compileClaudeDesignHtml,
  importClaudeDesignDirectory,
  normalizeTitle,
};
