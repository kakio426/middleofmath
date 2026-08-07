#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "../..");
const DEFAULT_TRACKER_PATH = path.join(__dirname, "series-tracker.json");
const DEFAULT_JSON_PATH = path.join(REPO_ROOT, "artifacts", "vivasam", "vivasam-submission-register.json");
const DEFAULT_MARKDOWN_PATH = path.join(REPO_ROOT, "artifacts", "vivasam", "VIVASAM-SUBMISSION-REGISTER.md");

function ensure(condition, message) {
  if (!condition) throw new Error(`비바샘 제출 레지스터 오류: ${message}`);
}

function repoPath(reference) {
  ensure(typeof reference === "string" && reference.startsWith("middleofmath:"), `지원하지 않는 경로입니다: ${reference}`);
  return path.join(REPO_ROOT, reference.slice("middleofmath:".length));
}

function extractCoreIntent(markdown) {
  const match = markdown.match(/## 차시 설계의 핵심\s+([^\n].*?)(?:\n\n|\n## )/s);
  ensure(match, "'차시 설계의 핵심' 문단을 찾지 못했습니다.");
  return match[1].replace(/\s+/g, " ").trim();
}

function buildSubmissionRegister(tracker) {
  ensure(tracker?.contract?.targetDeckCount === 30, "목표 PPT 수가 30이 아닙니다.");
  ensure(Array.isArray(tracker.bundles) && tracker.bundles.length === 30, "수업 꾸러미는 정확히 30개여야 합니다.");
  const defaultSubmission = tracker.bundleDefaults?.submission || {};
  const records = [...tracker.bundles]
    .sort((a, b) => a.sequence - b.sequence)
    .map((bundle) => {
      const schemaPath = repoPath(bundle.content.schemaPath);
      const intentPath = repoPath(bundle.support.intentPath);
      const schema = require(schemaPath);
      const intentMarkdown = fs.readFileSync(intentPath, "utf8");
      const submission = { ...defaultSubmission, ...(bundle.submission || {}) };
      ensure(schema.id === bundle.lessonId, `${bundle.lessonId} 스키마 ID가 다릅니다.`);
      ensure(bundle.subject === "수학", `${bundle.lessonId} 교과목이 수학이 아닙니다.`);
      ensure(bundle.eduitit.anonymousAccessStatus === "production-passed", `${bundle.lessonId} 비로그인 공개 검증이 완료되지 않았습니다.`);
      ensure(/^https:\/\/eduitit\.site\/edu-materials\/[0-9a-f-]+\/$/.test(bundle.eduitit.publicUrl), `${bundle.lessonId} 운영 공개 URL이 잘못되었습니다.`);
      return {
        sequence: bundle.sequence,
        lessonId: bundle.lessonId,
        subject: bundle.subject,
        grade: bundle.grade,
        unit: bundle.unit,
        title: bundle.title,
        slideCountGuide: bundle.declaredSlideCount,
        teachingIntent: extractCoreIntent(intentMarkdown),
        observableGoal: schema.targetBehavior,
        publicUrl: bundle.eduitit.publicUrl,
        representativeImagePath: bundle.support.representativeImagePath,
        worksheetPngPath: bundle.worksheet.pngPath,
        worksheetPdfPath: bundle.worksheet.pdfPath,
        teachingIntentPath: bundle.support.intentPath,
        answerKeyPath: bundle.support.answerKeyPath,
        claudeContentPath: bundle.content.handoffMarkdownPath,
        pptStatus: bundle.ppt.status,
        communityPostStatus: submission.communityPostStatus,
        raceRecordStatus: submission.raceRecordStatus,
      };
    });
  ensure(new Set(records.map((record) => record.lessonId)).size === 30, "lessonId가 중복되었습니다.");
  ensure(new Set(records.map((record) => record.publicUrl)).size === 30, "공개 URL이 중복되었습니다.");
  return {
    schemaVersion: 1,
    seriesId: tracker.seriesId,
    updatedAt: tracker.updatedAt,
    subject: "수학",
    targetDeckCount: 30,
    targetWorksheetCount: 30,
    records,
  };
}

function renderSubmissionRegisterMarkdown(register) {
  const lines = [
    "# 2026 비바샘 수업 꾸러미 30개 제출 레지스터",
    "",
    `- 기준 시각: ${register.updatedAt}`,
    "- 범위: 초등 수학 3학년 1·2학기, PPT 30개, PPT당 통합 활동지 1개",
    "- 공개 위치: Eduitit 수업 꾸러미 카테고리(비로그인 열람 검증 완료)",
    "- 현재 남은 항목: Claude PPTX 30개 수령·검수, 이후 교사 커뮤니티 게시와 ‘나의 레이스’ 등록",
    "",
  ];
  for (const record of register.records) {
    lines.push(
      `## ${String(record.sequence).padStart(2, "0")}. ${record.title}`,
      "",
      `- 교과목: ${record.subject}`,
      `- 대상·단원: ${record.grade} · ${record.unit}`,
      `- PPT 내용 원고: ${record.claudeContentPath}`,
      `- 수업 설계 의도: ${record.teachingIntent}`,
      `- 관찰 가능한 목표: ${record.observableGoal}`,
      `- 공개 URL: ${record.publicUrl}`,
      `- 대표 이미지: ${record.representativeImagePath}`,
      `- 활동지 PNG: ${record.worksheetPngPath}`,
      `- 활동지 PDF: ${record.worksheetPdfPath}`,
      `- 교사용 정답: ${record.answerKeyPath}`,
      `- 상태: PPT ${record.pptStatus} · 커뮤니티 ${record.communityPostStatus} · 나의 레이스 ${record.raceRecordStatus}`,
      "",
    );
  }
  return `${lines.join("\n").trim()}\n`;
}

function writeAtomic(filePath, contents) {
  const resolved = path.resolve(filePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  const temporaryPath = `${resolved}.tmp-${process.pid}`;
  fs.writeFileSync(temporaryPath, contents, "utf8");
  fs.renameSync(temporaryPath, resolved);
}

function writeSubmissionRegister(tracker, {
  jsonPath = DEFAULT_JSON_PATH,
  markdownPath = DEFAULT_MARKDOWN_PATH,
} = {}) {
  const register = buildSubmissionRegister(tracker);
  writeAtomic(jsonPath, `${JSON.stringify(register, null, 2)}\n`);
  writeAtomic(markdownPath, renderSubmissionRegisterMarkdown(register));
  return { register, jsonPath, markdownPath };
}

function parseArgs(argv) {
  const options = {
    trackerPath: DEFAULT_TRACKER_PATH,
    jsonPath: DEFAULT_JSON_PATH,
    markdownPath: DEFAULT_MARKDOWN_PATH,
  };
  while (argv.length) {
    const token = argv.shift();
    const value = argv.shift();
    ensure(value, `${token} 뒤에 경로를 입력하세요.`);
    if (token === "--tracker") options.trackerPath = path.resolve(value);
    else if (token === "--json") options.jsonPath = path.resolve(value);
    else if (token === "--markdown") options.markdownPath = path.resolve(value);
    else throw new Error(`알 수 없는 옵션입니다: ${token}`);
  }
  return options;
}

if (require.main === module) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const tracker = JSON.parse(fs.readFileSync(options.trackerPath, "utf8"));
    const result = writeSubmissionRegister(tracker, options);
    process.stdout.write(`${JSON.stringify({
      records: result.register.records.length,
      jsonPath: result.jsonPath,
      markdownPath: result.markdownPath,
    }, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exit(1);
  }
}

module.exports = {
  DEFAULT_JSON_PATH,
  DEFAULT_MARKDOWN_PATH,
  buildSubmissionRegister,
  extractCoreIntent,
  renderSubmissionRegisterMarkdown,
  writeSubmissionRegister,
};
