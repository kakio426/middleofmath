"use strict";

const assert = require("node:assert/strict");
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

test("submission register excludes lessons until production access is verified", () => {
  const register = buildSubmissionRegister(tracker);
  assert.equal(register.records.length, 0);
  assert.equal(register.completedRecordCount, 0);
  const markdown = renderSubmissionRegisterMarkdown(register);
  assert.equal((markdown.match(/^## \d{2}\./gm) || []).length, 0);
  assert.match(markdown, /현재 작성 완료: 0\/30/);
  assert.doesNotMatch(markdown, /교사용 정답|PPT 내용 원고/);
});
