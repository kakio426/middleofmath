#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { registrationIntentFor } = require("./registration-intents.cjs");

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
    .filter((bundle) => bundle.eduitit?.anonymousAccessStatus === "production-passed")
    .map((bundle) => {
      const schemaPath = repoPath(bundle.content.schemaPath);
      const schema = require(schemaPath);
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
        slideCount: bundle.ppt.slideCount,
        teachingIntent: registrationIntentFor(bundle.lessonId),
        publicUrl: bundle.eduitit.publicUrl,
        representativeImagePath: bundle.support.representativeImagePath,
        pptStatus: bundle.ppt.status,
        communityPostStatus: submission.communityPostStatus,
        raceRecordStatus: submission.raceRecordStatus,
      };
    });
  ensure(records.length <= 30, "현재 공개 완료된 제출 기록 수가 잘못되었습니다.");
  ensure(new Set(records.map((record) => record.lessonId)).size === records.length, "lessonId가 중복되었습니다.");
  ensure(new Set(records.map((record) => record.publicUrl)).size === records.length, "공개 URL이 중복되었습니다.");
  ensure(new Set(records.map((record) => record.teachingIntent)).size === records.length, "등록용 수업 설계 의도가 중복되었습니다.");
  return {
    schemaVersion: 1,
    seriesId: tracker.seriesId,
    updatedAt: tracker.updatedAt,
    subject: "수학",
    targetDeckCount: 30,
    targetWorksheetCount: 30,
    completedRecordCount: records.length,
    records,
  };
}

function renderSubmissionRegisterMarkdown(register) {
  const lines = [
    "# 수업 자료 등록용 입력 내용",
    "",
    `- 기준 시각: ${register.updatedAt}`,
    "- 범위: 초등 수학 3학년 1·2학기, PPT 30개, PPT당 통합 활동지 1개",
    `- 현재 작성 완료: ${register.completedRecordCount}/${register.targetDeckCount}`,
    "",
  ];
  for (const record of register.records) {
    lines.push(
      `## ${String(record.sequence).padStart(2, "0")}. ${record.title}`,
      "",
      `- 교과목: ${record.subject}`,
      `- 대상·단원: ${record.grade} · ${record.unit}`,
      `- 수업 설계 의도: ${record.teachingIntent}`,
      `- 공개 URL: ${record.publicUrl}`,
      `- 대표 이미지: ${record.representativeImagePath}`,
      `- PPT 장수: ${record.slideCount}장`,
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
