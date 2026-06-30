#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const stylesSource = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const questionsSource = fs.readFileSync(path.join(root, "questions.js"), "utf8");
const studentAppSource = `${appSource}\n${stylesSource}`;

const failures = [];

const forbiddenRendererSnippets = [
  {
    snippet: "choice.sublabel",
    reason: "student choices must not render diagnostic sublabels",
  },
  {
    snippet: "choice-sublabel",
    reason: "student choice sublabel markup/styles should not exist",
  },
  {
    snippet: "previous-step",
    reason: "student flow must be forward-only to prevent later information from contaminating earlier judgments",
  },
  {
    snippet: "previous-button",
    reason: "student flow must not expose a previous-step control",
  },
  {
    snippet: "goPrevious",
    reason: "student flow must not support returning to earlier judgments",
  },
  {
    snippet: "backtracksIntoStep",
    reason: "backtracking metrics are not collected in the forward-only student flow",
  },
  {
    snippet: "navigationEvents",
    reason: "previous-step navigation logs should not exist in the forward-only student flow",
  },
];

for (const { snippet, reason } of forbiddenRendererSnippets) {
  if (studentAppSource.includes(snippet)) {
    failures.push(`student app source renders/leaves ${snippet}: ${reason}`);
  }
}

const forbiddenTeacherAggregationSnippets = [
  {
    snippet: "MOM_SAMPLE_STUDENTS",
    reason: "teacher diagnosis must be based on the current session, not seeded sample students",
  },
  {
    snippet: "sampleStudents",
    reason: "teacher diagnosis must not merge sample students with the current session",
  },
];

for (const { snippet, reason } of forbiddenTeacherAggregationSnippets) {
  if (appSource.includes(snippet)) {
    failures.push(`app.js uses ${snippet}: ${reason}`);
  }
}

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(questionsSource, sandbox, { filename: "questions.js" });

const questions = sandbox.window.MOM_QUESTIONS || [];
if (!Array.isArray(questions) || questions.length === 0) {
  failures.push("questions.js did not expose window.MOM_QUESTIONS.");
}

const forbiddenStudentText = [
  /오개념/,
  /피드백/,
  /교사/,
  /진단/,
  /흔들/,
  /부족/,
  /지도/,
  /확인해야/,
  /다시 (?:봐|보|다뤄|확인)/,
  /필요합니다/,
  /경향/,
  /임의 계산/,
  /고른 선택/,
  /정확히 .*합니다/,
  /안정적/,
];

for (const question of questions) {
  for (const step of question.steps || []) {
    assertNoAnswerBars(question, step);
    for (const choice of step.choices || []) {
      assertStudentChoiceText(question, step, choice);
    }
  }
}

if (failures.length > 0) {
  console.error("Student content harness failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Student content harness passed: ${questions.length} questions checked.`);

function assertStudentChoiceText(question, step, choice) {
  const label = String(choice.label || "").trim();
  if (!label) {
    failures.push(`${question.id}/${step.id}/${choice.id}: choice label is empty.`);
  }

  for (const pattern of forbiddenStudentText) {
    if (pattern.test(label)) {
      failures.push(
        `${question.id}/${step.id}/${choice.id}: choice label leaks diagnostic wording: "${label}"`
      );
    }
  }
}

function assertNoAnswerBars(question, step) {
  const bars = step.bars || [];
  if (!bars.length) return;

  const correctChoices = (step.choices || []).filter((choice) => choice.correct);
  for (const correctChoice of correctChoices) {
    const correctLabel = normalize(correctChoice.label);
    for (const bar of bars) {
      const barLabel = normalize(bar.label);
      if (barLabel && barLabel === correctLabel) {
        failures.push(
          `${question.id}/${step.id}: scaffold bar directly reveals correct choice "${bar.label}".`
        );
      }

      const parsed = parseFractionLabel(correctChoice.label);
      if (
        parsed &&
        Number(bar.numerator) === parsed.numerator &&
        Number(bar.denominator) === parsed.denominator
      ) {
        failures.push(
          `${question.id}/${step.id}: scaffold bar visually reveals correct fraction "${correctChoice.label}".`
        );
      }
    }
  }
}

function normalize(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .replace(/미터/g, "m")
    .trim();
}

function parseFractionLabel(value) {
  const match = normalize(value).match(/^(\d+)\/(\d+)(?:m)?$/);
  if (!match) return null;
  return {
    numerator: Number(match[1]),
    denominator: Number(match[2]),
  };
}
