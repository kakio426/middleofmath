#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const JSZip = require("jszip");
const sharp = require("sharp");

const lesson = require("./lesson-pictograph.cjs");
const {
  LAYOUT_CONTRACT_VERSION,
  LESSON_LAYOUT,
  assertLessonLayout,
} = require("./layout-contract.cjs");
const {
  TEXT_FLOW_CONTRACT_VERSION,
  SUMMARY_NEXT_QUESTION_FLOW,
  wrapKoreanWords,
} = require("./korean-text-flow.cjs");

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

function count(text, pattern) {
  return (text.match(pattern) || []).length;
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function validateVisualContracts() {
  assertLessonLayout(LESSON_LAYOUT);
  const summary = lesson.slides.find((slide) => slide.kind === "summary");
  ensure(summary, "정리 슬라이드가 없습니다.");
  return wrapKoreanWords(summary.data.next, SUMMARY_NEXT_QUESTION_FLOW);
}

function validateMathOracle() {
  const byNumber = new Map(lesson.slides.map((slide) => [slide.number, slide]));
  const dilemma = byNumber.get(2).data;
  ensure(dilemma.rows[0].count * dilemma.legendValue === 20, "2장 범례 오라클이 20권을 만들지 못합니다.");

  const guided = byNumber.get(6).data;
  const guidedValues = guided.rows.map((row) => row.count * guided.legendValue);
  ensure(guidedValues[0] === 8 && guidedValues[1] === 4, "6장 행 수량이 8개·4개가 아닙니다.");
  ensure(guidedValues[0] - guidedValues[1] === 4, "6장 차이가 4개가 아닙니다.");

  const pair = byNumber.get(7).data;
  const pairValues = pair.rows.map((row) => row.count * pair.legendValue);
  ensure(pairValues.reduce((sum, value) => sum + value, 0) === 50, "7장 전체 나무 수가 50그루가 아닙니다.");
  ensure(pairValues[0] - pairValues[1] === 10, "7장 공원 차이가 10그루가 아닙니다.");

  const independent = byNumber.get(8).data;
  const topCount = independent.rows[0].count;
  const needed = 25 / independent.legendValue;
  ensure(Number.isInteger(needed) && needed === 5, "8장 25권에 필요한 별 수가 5개가 아닙니다.");
  ensure(needed - topCount === 2, "8장 더 그릴 별 수가 2개가 아닙니다.");

  ensure(lesson.answerKey[10] === "6명, 별 5개, 범례.", "10장 정답 키가 예상과 다릅니다.");
}

async function validatePptx(deckPath, expectedSummaryLines) {
  const zip = await JSZip.loadAsync(fs.readFileSync(deckPath));
  const slideNames = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name));
  const noteNames = Object.keys(zip.files).filter((name) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(name));
  ensure(slideNames.length === 11, `PPTX 슬라이드가 11장이 아닙니다: ${slideNames.length}`);
  ensure(noteNames.length === 11, `PPTX 발표자 노트가 11개가 아닙니다: ${noteNames.length}`);
  let allText = "";
  for (const name of [...slideNames, ...noteNames]) allText += await zip.file(name).async("string");
  for (const required of ["그림 하나에", "범례", "수업 설계 의도", "동반 활동지"]) {
    ensure(allText.includes(required), `PPTX에 필요한 문구가 없습니다: ${required}`);
  }
  for (const forbidden of ["lorem", "ipsum", "xxxx", "김서현", "이민준", "박유나"]) {
    ensure(!allText.toLowerCase().includes(forbidden.toLowerCase()), `PPTX에 금지 문구가 있습니다: ${forbidden}`);
  }
  const summaryXml = await zip.file("ppt/slides/slide11.xml").async("string");
  for (const line of expectedSummaryLines) {
    ensure(summaryXml.includes(`<a:t>${escapeXml(line)}</a:t>`), `11장 다음 차시 질문이 어절 단위의 명시적 줄로 저장되지 않았습니다: ${line}`);
  }
}

async function validateWorksheets(worksheetDir) {
  const names = fs.readdirSync(worksheetDir).filter((name) => name.endsWith(".png")).sort();
  ensure(names.length === 11, `활동지 PNG가 11개가 아닙니다: ${names.length}`);
  for (const [index, name] of names.entries()) {
    ensure(name === lesson.slides[index].worksheet.file, `활동지 파일 매핑이 다릅니다: ${name}`);
    const metadata = await sharp(path.join(worksheetDir, name)).metadata();
    ensure(metadata.width === 1240 && metadata.height === 1754, `${name} 크기가 A4 렌더 계약과 다릅니다.`);
    ensure(fs.statSync(path.join(worksheetDir, name)).size < 5 * 1024 * 1024, `${name}이 5MB를 넘습니다.`);
  }
}

function validateWebPackage(packageRoot) {
  const sourcePath = path.join(packageRoot, "source.html");
  const manifestPath = path.join(packageRoot, "manifest.json");
  ensure(fs.existsSync(sourcePath), "Eduitit source.html이 없습니다.");
  ensure(fs.existsSync(manifestPath), "Eduitit manifest.json이 없습니다.");
  const html = fs.readFileSync(sourcePath, "utf8");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  ensure(manifest.lessonId === lesson.id, "웹 패키지 수업 ID가 다릅니다.");
  ensure(count(html, /class="slide-card"/g) === 11, "웹 게시물의 슬라이드 카드가 11개가 아닙니다.");
  ensure(count(html, /class="worksheet-preview"/g) === 11, "웹 게시물의 활동지 미리보기가 11개가 아닙니다.");
  ensure(html.includes("수업 설계 의도"), "웹 게시물에 수업 설계 의도가 없습니다.");
  ensure(html.includes("실제 학생 이름·얼굴·댓글은 포함하지 않았습니다"), "웹 게시물에 개인정보 안전 안내가 없습니다.");
  ensure(!html.includes("data:image/"), "웹 게시물에 인라인 base64 이미지가 있습니다.");
  ensure(!html.includes("http://"), "웹 게시물에 비보안 HTTP 자원이 있습니다.");
  ensure(!html.includes("<script"), "정적 게시물에 불필요한 스크립트가 있습니다.");
  ensure(Buffer.byteLength(html, "utf8") < 5 * 1024 * 1024, "웹 게시물 HTML이 5MB를 넘습니다.");
  for (const asset of manifest.assets) {
    const assetPath = path.join(packageRoot, asset.path);
    ensure(fs.existsSync(assetPath), `웹 자산이 없습니다: ${asset.path}`);
    ensure(fs.statSync(assetPath).size === asset.bytes, `웹 자산 바이트가 다릅니다: ${asset.path}`);
    ensure(sha256(assetPath) === asset.sha256, `웹 자산 해시가 다릅니다: ${asset.path}`);
  }
}

async function main() {
  const expectedSummaryLines = validateVisualContracts();
  validateMathOracle();
  ensure(lesson.slides.reduce((sum, slide) => sum + slide.minutes, 0) === 40, "차시 시간이 40분이 아닙니다.");
  const repoRoot = path.resolve(__dirname, "../..");
  const outputRoot = path.join(repoRoot, "artifacts", "vivasam", lesson.id);
  const deckPath = path.join(outputRoot, `${lesson.id}.pptx`);
  const deckPdfPath = path.join(outputRoot, `${lesson.id}.pdf`);
  const worksheetsPdfPath = path.join(outputRoot, `${lesson.id}-worksheets.pdf`);
  const slideDir = path.join(outputRoot, "slides");
  const worksheetDir = path.join(outputRoot, "worksheets", "png");
  const artifactManifestPath = path.join(outputRoot, "artifact-manifest.json");
  for (const filePath of [deckPath, deckPdfPath, worksheetsPdfPath]) {
    ensure(fs.existsSync(filePath) && fs.statSync(filePath).size > 0, `산출물이 없습니다: ${filePath}`);
  }
  ensure(fs.existsSync(artifactManifestPath), "artifact-manifest.json이 없습니다.");
  const artifactManifest = JSON.parse(fs.readFileSync(artifactManifestPath, "utf8"));
  ensure(artifactManifest.layoutContractVersion === LAYOUT_CONTRACT_VERSION, "산출물의 레이아웃 계약 버전이 현재 하네스와 다릅니다.");
  ensure(artifactManifest.textFlowContractVersion === TEXT_FLOW_CONTRACT_VERSION, "산출물의 한국어 줄바꿈 계약 버전이 현재 하네스와 다릅니다.");
  ensure(fs.readdirSync(slideDir).filter((name) => /^slide-\d+\.jpg$/.test(name)).length === 11, "슬라이드 렌더 이미지가 11개가 아닙니다.");
  await validatePptx(deckPath, expectedSummaryLines);
  await validateWorksheets(worksheetDir);

  const eduititRoot = process.argv[2] ? path.resolve(process.argv[2]) : "";
  if (eduititRoot) {
    validateWebPackage(path.join(eduititRoot, "edu_materials", "static", "edu_materials", "lesson_bundles", lesson.id));
  } else {
    validateWebPackage(path.join(outputRoot, "web-package"));
  }
  process.stdout.write("PASS: 11장 PPTX · 발표자 노트 · 11개 활동지 · 수학 오라클 · 레이아웃 간격 · 한국어 어절 줄바꿈 · 해시 자산 검증\n");
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
