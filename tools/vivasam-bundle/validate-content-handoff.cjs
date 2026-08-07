#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const { HANDOFF_SCHEMA_VERSION, SERIES_TARGET_COUNT } = require("./build-content-handoff.cjs");

const FORBIDDEN_PRESENTATION_KEYS = new Set([
  "palette",
  "design",
  "layout",
  "font",
  "color",
  "spacing",
  "margin",
  "coordinates",
  "animation",
  "transition",
]);
const ROOT_KEYS = new Set(["schemaVersion", "lesson", "slides"]);
const LESSON_KEYS = new Set(["id", "version", "title", "subject", "grade", "unit", "durationMinutes", "slideCount"]);
const SLIDE_KEYS = new Set(["number", "phase", "minutes", "title", "visibleContent"]);

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

function walkKeys(value, pathParts = []) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    const nextPath = [...pathParts, key];
    ensure(!FORBIDDEN_PRESENTATION_KEYS.has(key), `PPT 내용 원고에 제작 지시 필드가 포함되었습니다: ${nextPath.join(".")}`);
    walkKeys(child, nextPath);
  }
}

function ensureOnlyKeys(value, allowedKeys, label) {
  for (const key of Object.keys(value || {})) {
    ensure(allowedKeys.has(key), `Claude용 PPT 내용 원고에 허용되지 않은 ${label} 필드가 있습니다: ${key}`);
  }
}

function assertContentHandoffContract(handoff) {
  ensureOnlyKeys(handoff, ROOT_KEYS, "최상위");
  ensureOnlyKeys(handoff.lesson, LESSON_KEYS, "수업");
  ensure(handoff.schemaVersion === HANDOFF_SCHEMA_VERSION, "내용 원고 스키마 버전이 다릅니다.");
  ensure(Array.isArray(handoff.slides) && handoff.slides.length > 0, "내용 원고에 슬라이드가 없습니다.");
  ensure(handoff.slides.length === handoff.lesson.slideCount, "선언한 슬라이드 수와 실제 내용 원고 수가 다릅니다.");
  ensure(handoff.slides.reduce((sum, slide) => sum + slide.minutes, 0) === handoff.lesson.durationMinutes, "슬라이드 시간 합계가 차시 시간과 다릅니다.");
  handoff.slides.forEach((slide, index) => {
    ensureOnlyKeys(slide, SLIDE_KEYS, `슬라이드 ${index + 1}`);
    ensure(slide.number === index + 1, `슬라이드 번호가 연속적이지 않습니다: ${slide.number}`);
    ensure(slide.title && !slide.title.includes("\n"), `슬라이드 ${slide.number} 제목에 제작용 줄바꿈이 남았습니다.`);
    ensure(Array.isArray(slide.visibleContent) && slide.visibleContent.length > 0, `슬라이드 ${slide.number} 화면 내용이 비었습니다.`);
  });
  const serialized = JSON.stringify(handoff);
  for (const forbidden of ["김서현", "이민준", "박유나", "010-", "@school", "학생 얼굴"]) {
    ensure(!serialized.includes(forbidden), `개인정보·실제 반응처럼 보이는 금지 문자열이 있습니다: ${forbidden}`);
  }
  walkKeys(handoff);
  return true;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function validateFiles(outputRoot) {
  const jsonPath = path.join(outputRoot, "claude-ppt-content.json");
  const markdownPath = path.join(outputRoot, "claude-ppt-content.md");
  const manifestPath = path.join(outputRoot, "content-manifest.json");
  for (const filePath of [jsonPath, markdownPath, manifestPath]) ensure(fs.existsSync(filePath), `내용 원고 산출물이 없습니다: ${filePath}`);
  const json = fs.readFileSync(jsonPath, "utf8");
  const markdown = fs.readFileSync(markdownPath, "utf8");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const handoff = JSON.parse(json);
  assertContentHandoffContract(handoff);
  ensure(manifest.seriesTargetCount === SERIES_TARGET_COUNT, "내용 원고 매니페스트의 시리즈 목표가 다릅니다.");
  ensure(manifest.slideCount === handoff.lesson.slideCount, "내용 원고 매니페스트의 슬라이드 수가 다릅니다.");
  for (const entry of manifest.files) {
    const content = entry.name.endsWith(".json") ? json : markdown;
    ensure(Buffer.byteLength(content) === entry.bytes, `${entry.name} 바이트 수가 다릅니다.`);
    ensure(sha256(content) === entry.sha256, `${entry.name} 해시가 다릅니다.`);
  }
  ensure(markdown.includes("화면에 들어갈 내용"), "Markdown 내용 원고에 슬라이드 화면 내용이 없습니다.");
  for (const forbiddenSection of ["발표자 노트", "동반 활동지", "교사용 정답", "Eduitit", "플랫폼"] ) {
    ensure(!markdown.includes(forbiddenSection), `Claude용 Markdown에 별도 산출물 정보가 섞였습니다: ${forbiddenSection}`);
  }
  return handoff;
}

function main() {
  const outputRoot = process.argv[2] ? path.resolve(process.argv[2]) : "";
  ensure(outputRoot, "usage: validate-content-handoff.cjs <content-handoff-root>");
  validateFiles(outputRoot);
  process.stdout.write("PASS: 가변 슬라이드 PPT 화면 내용 · 수학 자료 · 개인정보 · 별도 산출물 분리\n");
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exit(1);
  }
}

module.exports = { FORBIDDEN_PRESENTATION_KEYS, assertContentHandoffContract, validateFiles };
