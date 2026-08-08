"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const tracker = require("./series-tracker.json");
const {
  buildSubmissionRegister,
  extractCoreIntent,
  renderSubmissionRegisterMarkdown,
} = require("./build-submission-register.cjs");

test("extractCoreIntent keeps the complete Korean paragraph", () => {
  const value = extractCoreIntent("# 제목\n\n## 차시 설계의 핵심\n\n첫 문장입니다. 둘째 문장입니다.\n\n## 다음\n");
  assert.equal(value, "첫 문장입니다. 둘째 문장입니다.");
});

test("submission register contains only the received and publicly verified lessons", () => {
  const register = buildSubmissionRegister(tracker);
  assert.equal(register.records.length, 30);
  assert.equal(register.completedRecordCount, 30);
  assert.equal(new Set(register.records.map((record) => record.publicUrl)).size, 30);
  for (const record of register.records) {
    assert.equal(record.subject, "수학");
    assert.match(record.publicUrl, /^https:\/\/eduitit\.site\/edu-materials\//);
    assert.equal(record.pptStatus, "received");
    assert.equal(record.slideCount, 12);
    assert.equal(record.communityPostStatus, "not-posted");
    assert.equal(record.raceRecordStatus, "not-registered");
    assert.ok(fs.existsSync(record.representativeImagePath.replace("middleofmath:", "")));
    assert.ok(record.teachingIntent.length > 40);
  }
  const markdown = renderSubmissionRegisterMarkdown(register);
  assert.equal((markdown.match(/^## \d{2}\./gm) || []).length, 30);
  assert.match(markdown, /현재 작성 완료: 30\/30/);
  assert.doesNotMatch(markdown, /교사용 정답|PPT 내용 원고/);
});
