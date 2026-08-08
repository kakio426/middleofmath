"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const sharp = require("sharp");
const seriesTracker = require("./series-tracker.json");

const {
  SERIES_ASSET_CONTRACT,
  buildWorksheetModel,
  loadSeriesLessons,
  receivedPresentationForLesson,
  validateClaudeHtmlSlides,
  validateSeriesArtifacts,
  wrapRepresentativeTitle,
} = require("./build-series-non-ppt-assets.cjs");

const repoRoot = path.resolve(__dirname, "../..");

function fileHash(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

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

test("Claude HTML은 16:9 정적 슬라이드 계약을 통과하고 PPTX보다 우선한다", () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vivasam-html-slides-"));
  const lesson = { id: "g3s1-html-test" };
  const claudeRoot = path.join(temporaryRoot, "artifacts", "vivasam", lesson.id, "claude");
  fs.mkdirSync(claudeRoot, { recursive: true });
  const htmlPath = path.join(claudeRoot, `${lesson.id}-slides.html`);
  const html = `<!doctype html><html lang="ko"><head><meta name="eduitit-slide-size" content="1600x900"></head><body><main data-eduitit-deck><section data-slide>1</section><section data-slide>2</section></main></body></html>`;
  fs.writeFileSync(htmlPath, html, "utf8");
  fs.writeFileSync(path.join(claudeRoot, `${lesson.id}.pptx`), "archive only");
  try {
    assert.deepEqual(validateClaudeHtmlSlides(htmlPath), {
      htmlPath,
      slideCount: 2,
      width: 1600,
      height: 900,
    });
    const presentation = receivedPresentationForLesson(lesson, { repoRoot: temporaryRoot });
    assert.equal(presentation.format, "html");
    assert.equal(presentation.slideCount, 2);
    assert.equal(presentation.sourcePath, htmlPath);

    fs.writeFileSync(htmlPath, html.replace("</body>", '<iframe src="https://example.com"></iframe></body>'), "utf8");
    assert.throws(() => validateClaudeHtmlSlides(htmlPath), /외부·능동 콘텐츠/);

    fs.writeFileSync(htmlPath, html.replace("</body>", '<img srcset="https://example.com/slide.png 2x"></body>'), "utf8");
    assert.throws(() => validateClaudeHtmlSlides(htmlPath), /외부·능동 콘텐츠/);

    fs.writeFileSync(htmlPath, html.replace("<section data-slide>1</section>", "<div><section data-slide>1</section></div>"), "utf8");
    assert.throws(() => validateClaudeHtmlSlides(htmlPath), /직접 자식/);
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});

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

  const pictograph = buildWorksheetModel(lessons.find((lesson) => lesson.id === "g3s2-pictograph-legend"));
  assert.match(pictograph.guided.context, /범례: ● 1개 = 2개/);
  assert.match(pictograph.guided.context, /첫째 줄: ● 4개/);
  assert.match(pictograph.guided.context, /둘째 줄: ● 2개/);
  assert.match(pictograph.transfer.cues.join(" "), /범례: ■ 1개 = 10그루/);
  assert.match(pictograph.transfer.cues.join(" "), /공원 A: ■ 3개/);
  assert.match(pictograph.transfer.cues.join(" "), /공원 B: ■ 2개/);
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

test("PPT가 도착한 차시만 활동지 이미지와 공개 패키지를 만든다", async () => {
  const report = await validateSeriesArtifacts({ repoRoot, availableOnly: true });
  assert.equal(report.lessonCount, 6);
  assert.equal(report.worksheetCount, 6);
  assert.equal(report.packageCount, 6);
  assert.equal(report.supportCount, 6);
  assert.equal(report.representativeImageCount, 6);
  assert.equal(new Set(report.worksheetHashes).size, 6);
  assert.equal(new Set(report.representativeImageHashes).size, 6);

  for (const item of report.items) {
    const worksheetRoot = path.dirname(item.worksheetPngPath);
    const worksheetFiles = listRelativeFiles(worksheetRoot);
    assert.deepEqual(worksheetFiles, [
      `${item.lessonId}-worksheet.imagegen.json`,
      `${item.lessonId}-worksheet.pdf`,
      `${item.lessonId}-worksheet.png`,
      `${item.lessonId}-worksheet.prompt.txt`,
    ]);
    assert.equal(worksheetFiles.some((file) => /\.(?:svg|html?|css)$/i.test(file)), false, item.lessonId);

    const prompt = fs.readFileSync(item.worksheetPromptPath, "utf8");
    const generation = JSON.parse(fs.readFileSync(item.worksheetMetadataPath, "utf8"));
    assert.equal(generation.schemaVersion, 1);
    assert.equal(generation.generationMode, "built-in-imagegen");
    assert.equal(generation.generator, "image_gen");
    assert.match(generation.sourceOutputId, /^exec-[a-z0-9-]+\.png$/i);
    assert.equal(generation.promptSha256, fileHash(item.worksheetPromptPath));
    assert.equal(generation.imageSha256, fileHash(item.worksheetPngPath));
    assert.match(prompt.trim(), /AR 2:3$/);
    assert.match(prompt, /보라색\s*구름/);
    assert.match(prompt, /eduitit/i);
    for (const flag of ["logoTitleSeparated", "allQuestionTextLegible", "choicesVisuallySeparated", "answerSpacesPresent", "noOverlapsOrClipping"]) {
      assert.equal(generation.visualQa[flag], true, `${item.lessonId}: ${flag}`);
    }

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

    if (item.lessonId === "g3s2-pictograph-legend") {
      assert.deepEqual(generation.visualQa.mathVisualCounts, {
        problem1Rows: [4, 2],
        problem2Rows: [3, 2],
        problem3EmptyStars: 6,
      });
    }
    if (item.lessonId === "g3s1-multiplication-groups-model") {
      assert.deepEqual(generation.visualQa.mathVisualCounts, {
        problem1Rows: 6,
        problem1PerRow: 5,
        problem2Groups: 5,
        problem2PerGroup: 4,
        choiceLabels: ["30장", "11장", "6장"],
      });
    }
    if (item.lessonId === "g3s1-multiplication-array-transfer") {
      assert.deepEqual(generation.visualQa.mathVisualCounts, {
        problem1Groups: 4,
        problem1PerGroup: 3,
        problem1ChoiceLabels: ["3×4=12자루", "3+4=7자루", "4자루"],
        problem3WorkLabels: ["5+6=11장", "6장"],
      });
    }
    if (item.lessonId === "g3s1-multiplication-place-value-model") {
      assert.deepEqual(generation.visualQa.mathVisualCounts, {
        problem1Decomposition: ["30×2", "4×2"],
        problem2Boxes: 2,
        problem2ChoiceLabels: ["84권", "8권", "44권"],
        problem3WrongWork: "2×3=6 → 3×3=9 → 6+9=15",
      });
    }
    if (item.lessonId === "g3s1-multiplication-place-value-context") {
      assert.deepEqual(generation.visualQa.mathVisualCounts, {
        problem1Boxes: 2,
        problem1ChoiceLabels: ["84권", "8권", "44권"],
        problem2Boxes: 3,
        problem2PlaceValueParts: ["30×3", "1×3"],
        problem3WorkLabels: ["첫 번째 풀이", "두 번째 풀이"],
      });
    }
    if (item.lessonId === "g3s1-division-equal-sharing") {
      assert.deepEqual(generation.visualQa.mathVisualCounts, {
        problem1SourceCookies: 18,
        problem1RecipientPlates: 6,
        problem2ChoiceLabels: ["4자루", "5자루", "15자루"],
        problem3WrongWork: "12÷3=3개",
      });
    }

    const manifest = JSON.parse(fs.readFileSync(item.packageManifestPath, "utf8"));
    const html = fs.readFileSync(item.packageHtmlPath, "utf8");
    assert.equal(manifest.lessonId, item.lessonId);
    assert.equal(manifest.schemaVersion, 4);
    assert.equal(manifest.slideCount, 12);
    assert.equal(manifest.pptStatus, "available");
    assert.equal(manifest.presentationMode, "html");
    assert.equal(manifest.assets.some((asset) => asset.path.endsWith(".pptx")), false);
    assert.equal(manifest.assets.filter((asset) => asset.role === "presentation").length, 1);
    assert.equal(manifest.downloadAssets.length, 1);
    assert.match(manifest.practiceUrl, /^https:\/\/middle-of-math-student\.vercel\.app\/\?practice=/);
    assert.equal(manifest.assets.some((asset) => /\.(?:md|json|svg)$/i.test(asset.path)), false);
    const trackedMathCanvas = seriesTracker.bundles.find((bundle) => bundle.lessonId === item.lessonId).mathcanvas || {};
    const expectedMathCanvasUrl = ["manual-selected", "created", "public-link-ready"].includes(trackedMathCanvas.status)
      ? trackedMathCanvas.editorUrl
      : "";
    assert.equal(manifest.mathCanvasEditorUrl || "", expectedMathCanvasUrl);
    assert.equal((html.match(/data-section=/g) || []).length, 3);
    assert.match(html, />PPT</);
    assert.match(html, />활동지</);
    assert.match(html, /수업은 이렇게 진행해 보세요/);
    assert.match(html, /관련 문제 더 풀기/);
    assert.match(html, new RegExp(`href="${manifest.practiceUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
    if (expectedMathCanvasUrl) {
      assert.doesNotMatch(html, /data-section="mathcanvas"/);
      assert.match(html, new RegExp(`href="${expectedMathCanvasUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
      assert.match(html, /MathCanvas에서 열기/);
    }
    assert.doesNotMatch(html, /비바샘|개인정보|Claude|교사용 정답|수업 설계 의도|슬라이드별 내용/);
    assert.doesNotMatch(html, /data:image\//i);
    assert.doesNotMatch(html, /\b01[016789]-?\d{3,4}-?\d{4}\b/);
    assert.doesNotMatch(html, /\b\d학년\s*\d반\s*\d+번\b/);
    if (item.lessonId === "g3s1-multiplication-array-transfer") {
      const teachingIntent = fs.readFileSync(item.teachingIntentPath, "utf8");
      assert.match(teachingIntent, /줄 수만 바뀌면 답도 바뀔까요\?/);
      assert.equal((teachingIntent.match(/^\| \d+ \|/gm) || []).length, 12);
    }
  }

  for (const lesson of loadSeriesLessons().filter((lesson) => ![1, 2, 3, 4, 5, 6].includes(lesson.sequence))) {
    const lessonRoot = path.join(repoRoot, "artifacts", "vivasam", lesson.id);
    for (const directory of ["worksheet", "support", "web-package"]) {
      assert.equal(fs.existsSync(path.join(lessonRoot, directory)), false, `${lesson.id}: ${directory}`);
    }
    assert.equal(fs.existsSync(path.join(lessonRoot, "non-ppt-artifact-manifest.json")), false, lesson.id);
  }
});

test("전체 접촉표는 PPT 30개가 모두 도착하기 전에는 만들지 않는다", () => {
  assert.equal(fs.existsSync(path.join(repoRoot, "artifacts", "vivasam", "review")), false);
});

test("PPT가 도착한 원본과 Eduitit 동기화 폴더에는 공개 자료만 있다", () => {
  const lessons = loadSeriesLessons().filter((lesson) => [1, 2, 3, 4, 5, 6].includes(lesson.sequence));
  const eduititRoot = process.env.EDUITIT_ROOT
    ? path.resolve(process.env.EDUITIT_ROOT)
    : path.resolve(repoRoot, "../eduitit");
  const syncedRoot = path.join(eduititRoot, "edu_materials", "static", "edu_materials", "lesson_bundles");
  const syncedLessonDirectories = fs.readdirSync(syncedRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  assert.equal(syncedLessonDirectories.length, 6);

  for (const lesson of lessons) {
    for (const packageRoot of [
      path.join(repoRoot, "artifacts", "vivasam", lesson.id, "web-package"),
      path.join(syncedRoot, lesson.id),
    ]) {
      const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, "manifest.json"), "utf8"));
      const expected = ["manifest.json", "source.html", ...manifest.assets.map((asset) => asset.path)].sort();
      const actual = listRelativeFiles(packageRoot);
      assert.deepEqual(actual, expected, `${lesson.id}: ${packageRoot}`);
      assert.equal(
        actual
          .filter((file) => !["manifest.json", "source.html"].includes(file))
          .some((file) => /\.(?:md|json|svg)$/i.test(file)),
        false,
        lesson.id,
      );
      assert.equal(actual.some((file) => /\.pptx$/i.test(file)), false, lesson.id);
      assert.equal(actual.filter((file) => /-slides\.html$/i.test(file)).length, 1, lesson.id);
    }
  }
});
