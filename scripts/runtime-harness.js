#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const failures = [];
const roleCallbacks = {};
let appClickHandler = null;
let clock = 1000;

const appElement = {
  innerHTML: "",
  addEventListener(type, callback) {
    if (type === "click") appClickHandler = callback;
  },
};

const roleTabs = ["student", "teacher"].map((view) => ({
  dataset: { view },
  classList: { toggle() {} },
  setAttribute() {},
  addEventListener(type, callback) {
    if (type === "click") roleCallbacks[view] = callback;
  },
}));

const document = {
  querySelector(selector) {
    return selector === "#app" ? appElement : null;
  },
  querySelectorAll(selector) {
    return selector === ".role-tab" ? roleTabs : [];
  },
  addEventListener(type, callback) {
    if (type === "DOMContentLoaded") callback();
  },
};

const sandbox = {
  window: {
    setTimeout() { return 1; },
    clearTimeout() {},
  },
  document,
  performance: { now: () => (clock += 100) },
  Date,
  Set,
  Map,
  console,
};
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);

for (const filename of ["questions.js", "counting.js", "app.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, filename), "utf8"), sandbox, { filename });
}

assertIncludes(appElement.innerHTML, "초등 수 세기", "initial diagnostic picker shows counting");
assertIncludes(appElement.innerHTML, "5학년 분수", "initial diagnostic picker preserves fractions");

click({ action: "select-set", setId: "counting-primary" });
assertIncludes(appElement.innerHTML, "사과 세기", "counting session starts at first question");
assertIncludes(appElement.innerHTML, 'data-action="tap-object"', "object set is a real interactive control");

click({ action: "tap-object", objectId: "object-1" });
click({ action: "tap-object", objectId: "object-1" });
click({ action: "select-choice", choiceId: "seven" });
click({ action: "next-step" });

roleCallbacks.teacher();
assertIncludes(appElement.innerHTML, "다섯 가지 수 세기 축", "counting teacher view renders five-axis summary");
assertIncludes(appElement.innerHTML, "교육과정에서 관찰 근거까지", "counting teacher view renders curriculum-to-evidence path");
assertIncludes(appElement.innerHTML, "[2수01-01]", "verified Korean curriculum anchor appears in teacher view");
assertIncludes(appElement.innerHTML, "1단계 · 하나씩 세기", "earliest learner stage is identified provisionally");
assertIncludes(appElement.innerHTML, "count.stage.1.count-each", "stable learner-stage ID is connected to evidence");
assertIncludes(
  appElement.innerHTML,
  "kr.mt.math.number-operations.g1-2.s2-01-01.application",
  "Korean learning-map topic ID is connected to observed evidence"
);
assertIncludes(appElement.innerHTML, "같은 그림 다시 누름 1회", "duplicate object attempt appears as teacher evidence");
assertIncludes(appElement.innerHTML, "누르지 않은 그림 6개", "object omissions appear as teacher evidence");
assertIncludes(
  appElement.innerHTML,
  "선택한 답과 별개로 그림을 세는 과정에서 중복과 누락이 함께 관찰되었습니다.",
  "interaction evidence takes precedence over a successful choice note"
);
assertIncludes(appElement.innerHTML, "count.one_to_one", "stable concept ID appears in evidence");
assertIncludes(appElement.innerHTML, "수 이름 순서", "multi-skill evidence contributes to the number-sequence axis");
assertIncludes(appElement.innerHTML, "일대일 대응", "multi-skill evidence contributes to the one-to-one axis");

click({ action: "restart" });
click({ action: "select-choice", choiceId: "seven" });
click({ action: "next-step" });
roleCallbacks.teacher();
assertIncludes(appElement.innerHTML, "그림을 누르지 않음 · 답 선택만 기록", "untapped object set is recorded as unobserved interaction");
assertIncludes(appElement.innerHTML, "일대일 대응 근거는 더 필요합니다.", "untapped correct answer is not treated as an omission or stable process");
assertIncludes(appElement.innerHTML, "근거 더 필요", "untapped direct-counting task leaves the learner stage provisional");
if (appElement.innerHTML.includes("누르지 않은 그림 7개")) {
  failures.push("untapped object set must not be diagnosed as seven omissions.");
}

click({ action: "change-set" });
roleCallbacks.student();
click({ action: "select-set", setId: "fraction-grade5" });
assertIncludes(appElement.innerHTML, "1/2와 같은 크기의 분수", "existing fraction diagnostic still starts");

if (failures.length) {
  console.error("Runtime harness failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Runtime harness passed: picker, counting interaction/evidence, and fraction fallback checked.");

function click(dataset) {
  if (!appClickHandler) {
    failures.push("app click handler was not initialized.");
    return;
  }
  appClickHandler({ target: { closest: () => ({ dataset }) } });
}

function assertIncludes(source, expected, description) {
  if (!String(source).includes(expected)) failures.push(`${description}: missing ${expected}`);
}
