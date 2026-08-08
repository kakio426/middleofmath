"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const tracker = require("./series-tracker.json");
const {
  assertNoUnapprovedDowngrade,
  deriveStage,
  materializeBundle,
  renderDashboard,
  repositoryRoots,
  resolveTrackedPath,
  summarizeTracker,
  updateTracker,
  validateTracker,
} = require("./track-series.cjs");

const trackerPath = path.join(__dirname, "series-tracker.json");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("원장은 30개 PPT와 PPT당 통합 활동지 1개 계약을 고정한다", () => {
  const validated = validateTracker(tracker, { trackerPath });
  assert.equal(validated.bundles.length, 30);
  assert.deepEqual(validated.bundles.map((bundle) => bundle.sequence), Array.from({ length: 30 }, (_, index) => index + 1));
  assert.equal(tracker.contract.targetDeckCount, 30);
  assert.equal(tracker.contract.worksheetsPerDeck, 1);
  assert.equal(tracker.contract.targetWorksheetCount, 30);
  assert.equal(tracker.contract.mathcanvasActivitiesPerDeck, 1);
  assert.equal(tracker.contract.mathcanvasReusePolicy, "owner-manual-curated-only");
  assert.equal(tracker.contract.mathcanvasPrototypeReuse, false);
  assert.equal(tracker.contract.mathcanvasExternalProjectReuse, false);
  assert.equal(tracker.contract.pptAuthor, "Claude");
});

test("30개 Claude HTML 수령과 30개 운영 공개 검증을 함께 추적한다", () => {
  const validated = validateTracker(tracker, { trackerPath });
  const summary = summarizeTracker(validated);
  for (const bundle of validated.bundles) {
    assert.equal(bundle.content.status, "validated");
    assert.equal(bundle.worksheet.status, "validated");
    assert.equal(bundle.ppt.status, "received");
    assert.equal(bundle.ppt.format, "html");
    assert.equal(bundle.ppt.slideCount, 12);
    assert.equal(bundle.eduitit.packageStatus, "validated");
    assert.equal(bundle.eduitit.localRecordStatus, "published");
    assert.equal(bundle.eduitit.anonymousAccessStatus, "production-passed");
    assert.equal(bundle.eduitit.productionStatus, "deployed");
    assert.match(bundle.eduitit.publicUrl, /^https:\/\/eduitit\.site\/edu-materials\//);
  }
  for (const bundle of validated.bundles) {
    assert.equal(bundle.ppt.status, "received");
    assert.equal(bundle.ppt.format, "html");
    assert.equal(bundle.ppt.slideCount, 12);
    assert.match(bundle.ppt.htmlPath, /-slides\.html$/);
    assert.match(bundle.ppt.intakeReportPath, /html-intake\.json$/);
  }
  assert.equal(summary.worksheetsValidated, 30);
  assert.equal(summary.supportValidated, 30);
  assert.equal(summary.packagesValidated, 30);
  assert.equal(summary.localRecordsPublished, 30);
  assert.equal(summary.claudePptsReceived, 30);
  assert.equal(summary.claudePptsAwaiting, 0);
  assert.equal(summary.claudePptsValidated, 0);
  assert.equal(summary.productionPublished, 30);
  assert.equal(summary.fullyCompleted, 0);
});

test("슬롯이 30개보다 적으면 검증을 막는다", () => {
  const broken = clone(tracker);
  broken.bundles.pop();
  assert.throws(() => validateTracker(broken, { trackerPath, checkArtifacts: false }), /정확히 30개/);
});

test("lessonId·통합 활동지 파일명·digest 중복을 막는다", () => {
  for (const [fieldPath, expected] of [
    ["lessonId", /lessonId 중복/],
    ["worksheet.filename", /통합 활동지 파일명 중복/],
    ["eduitit.digest", /Eduitit digest 중복/],
  ]) {
    const broken = clone(tracker);
    const first = materializeBundle(broken, broken.bundles[0]);
    const second = broken.bundles[1];
    Object.assign(second, {
      lessonId: "second-lesson",
      title: "두 번째 수업",
      subject: "수학",
      grade: "초등 3학년",
      unit: "단원",
      durationMinutes: 40,
      declaredSlideCount: 10,
    });
    const [root, key] = fieldPath.split(".");
    if (key) second[root] = { [key]: first[root][key] };
    else second[root] = first[root];
    assert.throws(() => validateTracker(broken, { trackerPath, checkArtifacts: false }), expected);
  }
});

test("validated 상태는 실제 근거 파일이 없으면 통과하지 못한다", () => {
  const broken = clone(tracker);
  broken.bundles[0].content.handoffJsonPath = "middleofmath:artifacts/vivasam/g3s2-pictograph-legend/content-handoff/missing.json";
  assert.throws(() => validateTracker(broken, { trackerPath }), /파일이 없습니다/);
});

test("운영 공개는 HTTPS URL과 비로그인 운영 검증 없이 기록할 수 없다", () => {
  const broken = clone(tracker);
  broken.bundles[0].eduitit.productionStatus = "deployed";
  broken.bundles[0].eduitit.publicUrl = "https://eduitit.site/example";
  broken.bundles[0].eduitit.anonymousAccessStatus = "local-passed";
  assert.throws(() => validateTracker(broken, { trackerPath, checkArtifacts: false }), /비로그인 접근 검증/);

  const insecure = clone(tracker);
  insecure.bundles[0].eduitit.productionStatus = "deployed";
  insecure.bundles[0].eduitit.anonymousAccessStatus = "production-passed";
  insecure.bundles[0].eduitit.publicUrl = "http://eduitit.site/example";
  assert.throws(() => validateTracker(insecure, { trackerPath, checkArtifacts: false }), /HTTPS/);
});

test("상태 하향은 명시적인 복구 플래그 없이는 차단한다", () => {
  const before = materializeBundle(tracker, tracker.bundles[0]);
  const after = clone(before);
  after.content.status = "drafting";
  assert.throws(() => assertNoUnapprovedDowngrade(before, after, ["content.status"], false), /--allow-downgrade/);
  assert.doesNotThrow(() => assertNoUnapprovedDowngrade(before, after, ["content.status"], true));
});

test("저장소 밖으로 벗어나는 추적 경로를 막는다", () => {
  const roots = repositoryRoots(tracker, trackerPath);
  assert.throws(() => resolveTrackedPath("middleofmath:../../outside.txt", roots), /저장소 밖/);
});

test("사람용 진행표에는 30개 슬롯과 1개 통합 활동지 계약이 표시된다", () => {
  const validated = validateTracker(tracker, { trackerPath });
  const markdown = renderDashboard(validated);
  assert.equal((markdown.match(/^\| \d{2} \|/gm) || []).length, 30);
  assert.match(markdown, /PPT당 통합 활동지 1개/);
  assert.match(markdown, /Claude는 발표 화면\(HTML 우선, 기존 PPTX 호환\)만 제작/);
  assert.match(markdown, /Eduitit 로컬 공개·비로그인 접근 검증 \| 30 \| 30/);
  assert.match(markdown, /Claude HTML\/PPTX 수령/);
  assert.match(markdown, /Claude HTML\/PPTX 수령 대기/);
  assert.match(markdown, /MathCanvas 활동 연결 완료/);
  assert.match(markdown, /로그인한 선생님의 내 캔버스/);
});

test("상태 갱신은 원장 이력과 사람용 진행표를 함께 남긴다", () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vivasam-series-tracker-"));
  try {
    const temporaryTrackerPath = path.join(temporaryRoot, "series-tracker.json");
    const temporaryDashboardPath = path.join(temporaryRoot, "progress.md");
    const temporaryTracker = clone(tracker);
    temporaryTracker.repositories.middleofmath = path.resolve(__dirname, "../..");
    temporaryTracker.repositories.eduitit = path.resolve(__dirname, "../../..", "eduitit");
    fs.writeFileSync(temporaryTrackerPath, `${JSON.stringify(temporaryTracker, null, 2)}\n`, "utf8");
    const beforeHistoryCount = temporaryTracker.history.length;
    updateTracker({
      trackerPath: temporaryTrackerPath,
      dashboardPath: temporaryDashboardPath,
      sequence: 1,
      sets: [],
      note: "테스트 이력",
      event: "추적 갱신 테스트",
      detail: "원장과 파생 진행표가 함께 갱신되는지 확인했다.",
      allowDowngrade: false,
    });
    updateTracker({
      trackerPath: temporaryTrackerPath,
      dashboardPath: temporaryDashboardPath,
      sequence: 1,
      sets: [],
      note: "테스트 이력",
      event: "같은 메모 재기록 테스트",
      detail: "같은 메모는 한 번만 보관한다.",
      allowDowngrade: false,
    });
    const updated = JSON.parse(fs.readFileSync(temporaryTrackerPath, "utf8"));
    assert.equal(updated.history.length, beforeHistoryCount + 2);
    assert.equal(updated.history.at(-1).event, "같은 메모 재기록 테스트");
    assert.equal(updated.bundles[0].notes.filter((note) => note === "테스트 이력").length, 1);
    assert.ok(fs.readFileSync(temporaryDashboardPath, "utf8").includes("테스트 이력"));
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});
