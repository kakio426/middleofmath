#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const sharp = require("sharp");

const REPO_ROOT = path.resolve(__dirname, "../..");
const DEFAULT_BACKUP_ROOT = "/private/tmp/vivasam-worksheet-originals";
const WIDTH = 1024;
const HEIGHT = 1536;

const PATCHES = Object.freeze({
  "g3s1-multiplication-groups-model": {
    oldLabel: "초등 3학년 1학기 · 곱셈",
    label: "초등 3학년 1학기 · 4. 곱셈",
    box: [270, 106, 470, 50],
  },
  "g3s1-multiplication-array-transfer": {
    oldLabel: "초등 3학년 1학기 · 1. 곱셈",
    label: "초등 3학년 1학기 · 4. 곱셈",
    box: [50, 215, 470, 68],
    anchor: "start",
    color: "#6941c6",
  },
  "g3s1-multiplication-place-value-model": {
    oldLabel: "초등 3학년 1학기 · 1. 곱셈",
    label: "초등 3학년 1학기 · 4. 곱셈",
    box: [260, 220, 500, 64],
  },
  "g3s1-multiplication-place-value-context": {
    oldLabel: "초등 3학년 1학기 · 1. 곱셈",
    label: "초등 3학년 1학기 · 4. 곱셈",
    box: [250, 195, 520, 52],
  },
  "g3s1-division-equal-sharing": {
    oldLabel: "초등 3학년 1학기 · 2. 나눗셈",
    label: "초등 3학년 1학기 · 3. 나눗셈",
    box: [240, 210, 560, 65],
    color: "#6941c6",
  },
  "g3s1-division-missing-factor": {
    oldLabel: "초등 3학년 1학기 · 2. 나눗셈",
    label: "초등 3학년 1학기 · 3. 나눗셈",
    box: [220, 190, 600, 65],
  },
  "g3s1-division-fact-family": {
    oldLabel: "초등 3학년 1학기 · 2. 나눗셈",
    label: "초등 3학년 1학기 · 3. 나눗셈",
    box: [50, 195, 520, 52],
    anchor: "start",
  },
  "g3s1-division-group-count": {
    oldLabel: "초등 3학년 1학기 · 2. 나눗셈",
    label: "초등 3학년 1학기 · 3. 나눗셈",
    box: [250, 196, 530, 52],
  },
  "g3s1-fraction-equal-parts": {
    oldLabel: "초등 3학년 1학기 · 3. 분수",
    label: "초등 3학년 1학기 · 6. 분수와 소수",
    box: [230, 190, 590, 68],
  },
  "g3s1-fraction-fix-partition": {
    oldLabel: "초등 3학년 1학기 · 3. 분수",
    label: "초등 3학년 1학기 · 6. 분수와 소수",
    box: [220, 164, 610, 59],
  },
  "g3s1-fraction-part-whole": {
    oldLabel: "초등 3학년 1학기 · 3. 분수",
    label: "초등 3학년 1학기 · 6. 분수와 소수",
    box: [220, 195, 610, 70],
  },
  "g3s1-fraction-pizza-context": {
    oldLabel: "초등 3학년 1학기 · 3. 분수",
    label: "초등 3학년 1학기 · 6. 분수와 소수",
    box: [50, 195, 620, 70],
    anchor: "start",
  },
  "g3s1-length-centimeter-meter": {
    oldLabel: "초등 3학년 1학기 · 4. 길이",
    label: "초등 3학년 1학기 · 5. 길이와 시간",
    box: [202, 198, 620, 52],
    replacements: [["지우개 길이 약 4cm", "지우개 길이 약 5cm"]],
    extraRegions: [{
      kind: "math-value",
      box: [170, 751, 225, 34],
      text: "지우개 길이 약 5cm",
      background: "#e1daf0",
      color: "#111111",
      fontSize: 27,
      fontWeight: 500,
      anchor: "middle",
    }],
  },
  "g3s1-length-real-world-units": {
    oldLabel: "초등 3학년 1학기 · 4. 길이",
    label: "초등 3학년 1학기 · 5. 길이와 시간",
    box: [50, 208, 610, 54],
    anchor: "start",
  },
  "g3s1-length-unit-conversion": {
    oldLabel: "초등 3학년 1학기 · 4. 길이",
    label: "초등 3학년 1학기 · 5. 길이와 시간",
    box: [50, 195, 620, 54],
    anchor: "start",
  },
  "g3s2-fraction-part-whole": {
    oldLabel: "초등 3학년 2학기 · 4. 분수",
    label: "초등 3학년 2학기 · 4. 분수와 소수",
    box: [210, 195, 630, 70],
  },
  "g3s2-fraction-convert": {
    oldLabel: "초등 3학년 2학기 · 4. 분수",
    label: "초등 3학년 2학기 · 4. 분수와 소수",
    box: [210, 190, 630, 75],
  },
  "g3s2-fraction-compare": {
    oldLabel: "초등 3학년 2학기 · 4. 분수",
    label: "초등 3학년 2학기 · 4. 분수와 소수",
    box: [50, 210, 640, 54],
    anchor: "start",
  },
});

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function fileHash(filePath) {
  return sha256(fs.readFileSync(filePath));
}

function atomicWrite(filePath, value) {
  const temporaryPath = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(temporaryPath, value);
  fs.renameSync(temporaryPath, filePath);
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasLegacyLabel(prompt, patch) {
  return new RegExp(`${escapeRegExp(patch.oldLabel)}(?!와 소수)`).test(prompt);
}

function regionFor(kind, box, text, options = {}) {
  const [left, top, width, height] = box;
  return {
    kind,
    bbox: { left, top, width, height },
    text,
    background: options.background || "#ffffff",
    color: options.color || "#2d1a6d",
    fontSize: options.fontSize || 29,
    fontWeight: options.fontWeight || 600,
    anchor: options.anchor || "middle",
  };
}

function regionsFor(patch) {
  return [
    regionFor("curriculum-label", patch.box, patch.label, patch),
    ...(patch.extraRegions || []).map((region) => regionFor(region.kind, region.box, region.text, region)),
  ];
}

function renderRegion(region) {
  const { width, height } = region.bbox;
  const x = region.anchor === "start" ? 0 : width / 2;
  const textAnchor = region.anchor === "start" ? "start" : "middle";
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`
      + `<rect width="100%" height="100%" fill="${region.background}"/>`
      + `<text x="${x}" y="${height * 0.7}" text-anchor="${textAnchor}" font-family="Apple SD Gothic Neo, Pretendard, sans-serif" font-size="${region.fontSize}" font-weight="${region.fontWeight}" fill="${region.color}">${escapeXml(region.text)}</text>`
      + "</svg>",
  );
}

function containsPoint(region, x, y) {
  const { left, top, width, height } = region.bbox;
  return x >= left && x < left + width && y >= top && y < top + height;
}

async function comparePixels(original, corrected, regions) {
  const [before, after] = await Promise.all([
    sharp(original).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(corrected).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  ensure(before.info.width === WIDTH && before.info.height === HEIGHT, "원본 활동지 크기가 1024×1536이 아닙니다.");
  ensure(after.info.width === WIDTH && after.info.height === HEIGHT, "교정 활동지 크기가 1024×1536이 아닙니다.");
  ensure(before.info.channels === after.info.channels, "교정 전후 PNG 채널 수가 다릅니다.");

  let insideChangedPixels = 0;
  let outsideChangedPixels = 0;
  const channels = before.info.channels;
  for (let pixel = 0; pixel < WIDTH * HEIGHT; pixel += 1) {
    const offset = pixel * channels;
    let changed = false;
    for (let channel = 0; channel < channels; channel += 1) {
      if (before.data[offset + channel] !== after.data[offset + channel]) {
        changed = true;
        break;
      }
    }
    if (!changed) continue;
    const x = pixel % WIDTH;
    const y = Math.floor(pixel / WIDTH);
    if (regions.some((region) => containsPoint(region, x, y))) insideChangedPixels += 1;
    else outsideChangedPixels += 1;
  }
  return { insideChangedPixels, outsideChangedPixels };
}

function replacePrompt(prompt, patch, lessonId) {
  const hasOld = hasLegacyLabel(prompt, patch);
  const hasNew = prompt.includes(patch.label);
  ensure(hasOld !== hasNew, `${lessonId}: 프롬프트의 기존/정본 단원 표기 상태가 모호합니다.`);
  let corrected = hasOld ? prompt.split(patch.oldLabel).join(patch.label) : prompt;
  for (const [before, after] of patch.replacements || []) {
    ensure(corrected.includes(before) || corrected.includes(after), `${lessonId}: 교정할 프롬프트 문구를 찾지 못했습니다: ${before}`);
    corrected = corrected.split(before).join(after);
  }
  return corrected;
}

async function verifyExistingPatch({ lessonId, patch, regions, promptPath, metadataPath, pngPath, backupPath }) {
  const prompt = fs.readFileSync(promptPath, "utf8");
  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  ensure(prompt.includes(patch.label) && !hasLegacyLabel(prompt, patch), `${lessonId}: 정본 프롬프트가 유지되지 않았습니다.`);
  ensure(metadata.promptSha256 === fileHash(promptPath), `${lessonId}: 프롬프트 해시가 다릅니다.`);
  ensure(metadata.imageSha256 === fileHash(pngPath), `${lessonId}: 이미지 해시가 다릅니다.`);
  ensure(metadata.postProcessing?.mode === "deterministic-text-overlay", `${lessonId}: 후처리 계약이 없습니다.`);
  ensure(metadata.postProcessing.outsideChangedPixels === 0, `${lessonId}: 선언된 영역 밖 변경이 기록되어 있습니다.`);
  ensure(metadata.postProcessing.regions?.some((region) => region.text === patch.label), `${lessonId}: 정본 단원 표기 영역이 기록되지 않았습니다.`);
  if (fs.existsSync(backupPath)) {
    const diff = await comparePixels(fs.readFileSync(backupPath), fs.readFileSync(pngPath), regions);
    ensure(diff.outsideChangedPixels === 0, `${lessonId}: 백업 대조 결과 선언 영역 밖 ${diff.outsideChangedPixels}픽셀이 바뀌었습니다.`);
    ensure(diff.insideChangedPixels === metadata.postProcessing.changedPixels, `${lessonId}: 백업 대조 변경 픽셀 수가 메타데이터와 다릅니다.`);
  }
  return { lessonId, status: "verified", changedPixels: metadata.postProcessing.changedPixels };
}

async function patchWorksheet(lessonId, patch, backupRoot) {
  const worksheetRoot = path.join(REPO_ROOT, "artifacts", "vivasam", lessonId, "worksheet");
  const stem = `${lessonId}-worksheet`;
  const promptPath = path.join(worksheetRoot, `${stem}.prompt.txt`);
  const metadataPath = path.join(worksheetRoot, `${stem}.imagegen.json`);
  const pngPath = path.join(worksheetRoot, `${stem}.png`);
  const backupPath = path.join(backupRoot, `${lessonId}.png`);
  const regions = regionsFor(patch);
  for (const filePath of [promptPath, metadataPath, pngPath]) ensure(fs.existsSync(filePath), `${lessonId}: ${path.basename(filePath)} 파일이 없습니다.`);

  const currentMetadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  if (currentMetadata.postProcessing) {
    return verifyExistingPatch({ lessonId, patch, regions, promptPath, metadataPath, pngPath, backupPath });
  }

  ensure(currentMetadata.imageSha256 === fileHash(pngPath), `${lessonId}: 교정 전 이미지 해시가 메타데이터와 다릅니다.`);
  const original = fs.readFileSync(pngPath);
  if (!fs.existsSync(backupPath)) fs.copyFileSync(pngPath, backupPath);
  else ensure(fileHash(backupPath) === currentMetadata.imageSha256, `${lessonId}: 기존 감사 백업이 현재 원본과 다릅니다.`);

  const corrected = await sharp(original)
    .composite(regions.map((region) => ({
      input: renderRegion(region),
      left: region.bbox.left,
      top: region.bbox.top,
    })))
    .png({ compressionLevel: 9 })
    .toBuffer();
  const diff = await comparePixels(original, corrected, regions);
  ensure(diff.insideChangedPixels > 0, `${lessonId}: 선언 영역 안에서 바뀐 픽셀이 없습니다.`);
  ensure(diff.outsideChangedPixels === 0, `${lessonId}: 선언 영역 밖 ${diff.outsideChangedPixels}픽셀이 바뀌었습니다.`);

  const correctedPrompt = replacePrompt(fs.readFileSync(promptPath, "utf8"), patch, lessonId);
  atomicWrite(promptPath, correctedPrompt);
  atomicWrite(pngPath, corrected);

  const reviewedAt = new Date().toISOString();
  const metadata = {
    ...currentMetadata,
    promptSha256: fileHash(promptPath),
    imageSha256: fileHash(pngPath),
    visualQa: {
      ...currentMetadata.visualQa,
      reviewedAt,
      mathVisualCounts: lessonId === "g3s1-length-centimeter-meter"
        ? {
            ...currentMetadata.visualQa.mathVisualCounts,
            problem2Objects: ["지우개 약 5cm", "복도 약 20m"],
          }
        : currentMetadata.visualQa.mathVisualCounts,
    },
    postProcessing: {
      mode: "deterministic-text-overlay",
      tool: "sharp",
      script: "tools/vivasam-bundle/patch-worksheet-curriculum-labels.cjs",
      sourceImageSha256: currentMetadata.imageSha256,
      appliedAt: reviewedAt,
      regions: regions.map((region) => ({
        kind: region.kind,
        bbox: region.bbox,
        text: region.text,
      })),
      outsideChangedPixels: diff.outsideChangedPixels,
      changedPixels: diff.insideChangedPixels,
    },
  };
  atomicWrite(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  return { lessonId, status: "patched", changedPixels: diff.insideChangedPixels };
}

async function main() {
  const backupFlag = process.argv.indexOf("--backup-root");
  const backupRoot = backupFlag === -1 ? DEFAULT_BACKUP_ROOT : path.resolve(process.argv[backupFlag + 1]);
  ensure(backupRoot && !backupRoot.startsWith(REPO_ROOT), "감사 백업은 저장소 밖 경로여야 합니다.");
  fs.mkdirSync(backupRoot, { recursive: true });

  const results = [];
  for (const [lessonId, patch] of Object.entries(PATCHES)) results.push(await patchWorksheet(lessonId, patch, backupRoot));
  process.stdout.write(`${JSON.stringify({ backupRoot, results }, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { PATCHES, comparePixels, regionsFor };
