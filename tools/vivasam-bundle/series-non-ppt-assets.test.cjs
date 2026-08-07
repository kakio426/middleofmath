"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const sharp = require("sharp");

const {
  SERIES_ASSET_CONTRACT,
  buildWorksheetModel,
  loadSeriesLessons,
  validateSeriesArtifacts,
  wrapRepresentativeTitle,
} = require("./build-series-non-ppt-assets.cjs");

const repoRoot = path.resolve(__dirname, "../..");

function listRelativeFiles(directory) {
  const files = [];
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) files.push(path.relative(directory, absolute).split(path.sep).join("/"));
    }
  };
  visit(directory);
  return files.sort();
}

test("30개 차시는 각각 통합 활동지 한 개와 고유한 학습 증거를 가진다", () => {
  const lessons = loadSeriesLessons();
  assert.equal(lessons.length, 30);
  assert.equal(new Set(lessons.map((lesson) => lesson.id)).size, 30);

  const worksheetFiles = new Set();
  for (const lesson of lessons) {
    const model = buildWorksheetModel(lesson);
    assert.equal(model.worksheetFile, `${lesson.id}-worksheet.png`);
    assert.equal(worksheetFiles.has(model.worksheetFile), false);
    worksheetFiles.add(model.worksheetFile);
    assert.equal(model.routeSteps.length, 4);
    assert.ok(model.guided.prompt);
    assert.ok(model.transfer.prompt);
    assert.equal(model.errorCases.length, 2);
    assert.equal(model.exitItems.length, 3);
    assert.ok(model.answers.guided);
    assert.ok(model.answers.transfer);
    assert.equal(model.answers.exit.length, 3);
  }
  assert.equal(worksheetFiles.size, 30);
});

test("대표 이미지 제목은 어절을 자르지 않고 최대 두 줄로 배치한다", () => {
  for (const lesson of loadSeriesLessons()) {
    const lines = wrapRepresentativeTitle(lesson.title);
    assert.ok(lines.length >= 1 && lines.length <= 2, lesson.id);
    assert.equal(lines.join(" "), lesson.title.replace(/\s+/g, " ").trim(), lesson.id);
    assert.ok(lines.every((line) => Array.from(line).length <= SERIES_ASSET_CONTRACT.titleMaxCharactersPerLine));
    if (lines.length === 2) {
      assert.ok(Array.from(lines[1].replace(/\s/g, "")).length >= 4, `${lesson.id}의 마지막 제목 줄이 너무 짧습니다.`);
    }
  }
});

test("생성된 30개 비-PPT 산출물은 파일·크기·패키지 계약을 통과한다", async () => {
  const report = await validateSeriesArtifacts({ repoRoot });
  assert.equal(report.lessonCount, 30);
  assert.equal(report.worksheetCount, 30);
  assert.equal(report.packageCount, 30);
  assert.equal(report.supportCount, 30);
  assert.equal(report.representativeImageCount, 30);
  assert.equal(new Set(report.worksheetHashes).size, 30);
  assert.equal(new Set(report.representativeImageHashes).size, 30);

  for (const item of report.items) {
    const worksheetMetadata = await sharp(item.worksheetPngPath).metadata();
    const representativeMetadata = await sharp(item.representativeImagePath).metadata();
    assert.deepEqual(
      [worksheetMetadata.width, worksheetMetadata.height],
      [SERIES_ASSET_CONTRACT.worksheetWidth, SERIES_ASSET_CONTRACT.worksheetHeight],
      item.lessonId,
    );
    assert.deepEqual(
      [representativeMetadata.width, representativeMetadata.height],
      [SERIES_ASSET_CONTRACT.representativeWidth, SERIES_ASSET_CONTRACT.representativeHeight],
      item.lessonId,
    );
    assert.equal(fs.readFileSync(item.worksheetPdfPath).subarray(0, 4).toString("ascii"), "%PDF");

    const manifest = JSON.parse(fs.readFileSync(item.packageManifestPath, "utf8"));
    const html = fs.readFileSync(item.packageHtmlPath, "utf8");
    assert.equal(manifest.lessonId, item.lessonId);
    assert.equal(manifest.pptStatus, "awaiting-claude");
    assert.equal(manifest.assets.some((asset) => asset.path.endsWith(".pptx")), false);
    assert.equal(manifest.downloadAssets.length, 7);
    assert.match(html, /통합 활동지/);
    assert.match(html, /수업 설계 의도/);
    assert.match(html, /교사용 정답/);
    assert.match(html, /PPT는 Claude 제작 후 추가/);
    assert.doesNotMatch(html, /data:image\//i);
    assert.doesNotMatch(html, /\b01[016789]-?\d{3,4}-?\d{4}\b/);
    assert.doesNotMatch(html, /\b\d학년\s*\d반\s*\d+번\b/);
  }
});

test("30개 활동지와 대표 이미지는 한눈에 검토할 접촉표로 정리된다", async () => {
  const reviewRoot = path.join(repoRoot, "artifacts", "vivasam", "review");
  const index = JSON.parse(fs.readFileSync(path.join(reviewRoot, "index.json"), "utf8"));
  const worksheetsPath = path.join(reviewRoot, "worksheets-contact-sheet.png");
  const representativesPath = path.join(reviewRoot, "representative-images-contact-sheet.png");
  const worksheets = await sharp(worksheetsPath).metadata();
  const representatives = await sharp(representativesPath).metadata();

  assert.equal(index.seriesId, "vivasam-2026-middleofmath-30");
  assert.equal(index.count, 30);
  assert.equal(index.records.length, 30);
  assert.ok(index.records.every((record) => record.worksheetPng && record.representativeImage));
  assert.deepEqual([worksheets.width, worksheets.height], [1208, 1992]);
  assert.deepEqual([representatives.width, representatives.height], [1720, 1220]);
});

test("비-PPT 원본과 Eduitit 동기화 폴더에는 manifest 밖 잔여 파일이나 PPTX가 없다", () => {
  const lessons = loadSeriesLessons();
  const syncedRoot = path.resolve(repoRoot, "../eduitit/edu_materials/static/edu_materials/lesson_bundles");
  const syncedLessonDirectories = fs.readdirSync(syncedRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  assert.equal(syncedLessonDirectories.length, 30);

  for (const lesson of lessons) {
    for (const packageRoot of [
      path.join(repoRoot, "artifacts", "vivasam", lesson.id, "web-package"),
      path.join(syncedRoot, lesson.id),
    ]) {
      const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, "manifest.json"), "utf8"));
      const expected = ["manifest.json", "source.html", ...manifest.assets.map((asset) => asset.path)].sort();
      const actual = listRelativeFiles(packageRoot);
      assert.deepEqual(actual, expected, `${lesson.id}: ${packageRoot}`);
      assert.equal(actual.some((file) => /\.pptx?$/i.test(file)), false, lesson.id);
    }
  }
});
