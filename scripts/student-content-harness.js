#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const stylesSource = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const questionsSource = fs.readFileSync(path.join(root, "questions.js"), "utf8");
const countingSource = fs.readFileSync(path.join(root, "counting.js"), "utf8");
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
vm.runInContext(countingSource, sandbox, { filename: "counting.js" });

const questions = sandbox.window.MOM_QUESTIONS || [];
if (!Array.isArray(questions) || questions.length === 0) {
  failures.push("questions.js did not expose window.MOM_QUESTIONS.");
}

const countingQuestions = sandbox.window.MOM_COUNTING_QUESTIONS || [];
const countingConcepts = sandbox.window.MOM_COUNTING_CONCEPTS || [];
const countingCurriculum = sandbox.window.MOM_COUNTING_CURRICULUM || {};
const countingStages = sandbox.window.MOM_COUNTING_STAGES || [];
const diagnosticSets = sandbox.window.MOM_DIAGNOSTIC_SETS || [];
const countingSteps = countingQuestions.flatMap((question) => question.steps || []);

if (countingQuestions.length !== 10) {
  failures.push(`counting.js must expose 10 counting questions; found ${countingQuestions.length}.`);
}

if (countingSteps.length !== 24) {
  failures.push(`counting MVP must contain exactly 24 direct judgment steps; found ${countingSteps.length}.`);
}

if (countingSteps.some((step) => step.id === "c2-strategy")) {
  failures.push("language-heavy c2-strategy must be removed; object tapping is the evidence source.");
}

const expectedConceptIds = new Set([
  "count.number_words_to_20",
  "count.one_to_one",
  "count.cardinality",
  "count.order_irrelevance",
  "count.conservation",
  "count.numeral_quantity",
  "count.multiple_representations",
  "count.compare_sets",
  "count.compare_numerals",
  "count.one_more_less",
  "count.count_on",
  "count.count_back",
  "count.skip_2_5_10",
  "count.skip_extended",
]);
const actualConceptIds = new Set(countingConcepts.map((concept) => concept.id));
if (
  actualConceptIds.size !== expectedConceptIds.size ||
  [...expectedConceptIds].some((id) => !actualConceptIds.has(id))
) {
  failures.push("counting taxonomy must preserve the 14 expected stable concept IDs.");
}

const conceptIds = new Set(countingConcepts.map((concept) => concept.id));
const axisIds = new Set(["number-sequence", "one-to-one", "cardinality", "representation", "comparison-patterns"]);
const expectedAnchorIds = new Set([
  "kr-2022-elem-math:[2수01-01]",
  "kr-2022-elem-math:[2수01-03]",
]);
const actualAnchorIds = new Set((countingCurriculum.anchors || []).map((anchor) => anchor.id));
if (
  actualAnchorIds.size !== expectedAnchorIds.size ||
  [...expectedAnchorIds].some((id) => !actualAnchorIds.has(id))
) {
  failures.push("counting curriculum must expose the two verified 1-2 수와 연산 anchor IDs.");
}

if (countingCurriculum.source?.id !== "DECK6/korean-elementary-learning-map") {
  failures.push("counting curriculum source attribution is missing.");
}

if (countingCurriculum.source?.referenceCommit !== "3ef0563084aa2a9baaa47da2c1ec0ebf5d7edc5c") {
  failures.push("counting curriculum reference commit must stay pinned until the mapping is reviewed again.");
}

if (countingCurriculum.source?.dataVersion !== "kr-full-depth-v0.4" || countingCurriculum.source?.ontologyVersion !== "0.3.0-p3") {
  failures.push("counting curriculum data and ontology versions must be recorded together.");
}

if (!/공식 승인 자료가 아닙니다/.test(countingCurriculum.source?.note || "")) {
  failures.push("counting curriculum source must retain the non-approval disclaimer.");
}

if (countingStages.length !== 7) {
  failures.push(`counting MVP must expose exactly 7 ordered learner stages; found ${countingStages.length}.`);
}

const learnerStageIds = new Set(countingStages.map((stage) => stage.id));
for (const [index, stage] of countingStages.entries()) {
  if (stage.order !== index + 1) failures.push(`${stage.id}: learner stage order must be contiguous from 1.`);
  if (!expectedAnchorIds.has(stage.curriculumAnchorId)) {
    failures.push(`${stage.id}: unknown curriculum anchor ${stage.curriculumAnchorId}.`);
  }
  if (!Array.isArray(stage.curriculumTopicIds) || stage.curriculumTopicIds.length === 0) {
    failures.push(`${stage.id}: learner stage has no curriculum topic IDs.`);
  }
  for (const topicId of stage.curriculumTopicIds || []) {
    if (!/^kr\.mt\.math\.number-operations\.g1-2\.s2-01-(01|03)\.(concept|representation|application)$/.test(topicId)) {
      failures.push(`${stage.id}: unexpected Korean learning-map topic ID ${topicId}.`);
    }
  }
  for (const prerequisiteId of stage.prerequisiteStageIds || []) {
    const prerequisite = countingStages.find((item) => item.id === prerequisiteId);
    if (!prerequisite || prerequisite.order >= stage.order) {
      failures.push(`${stage.id}: prerequisite ${prerequisiteId} must exist earlier in the learner path.`);
    }
  }
}

for (const step of countingSteps) {
  if (!Array.isArray(step.skillIds) || step.skillIds.length === 0) {
    failures.push(`${step.id}: counting step has no skillIds.`);
  }
  for (const skillId of step.skillIds || []) {
    if (!conceptIds.has(skillId)) failures.push(`${step.id}: unknown counting skill ID ${skillId}.`);
  }
  if (!axisIds.has(step.axis)) failures.push(`${step.id}: unknown counting axis ${step.axis}.`);
}

for (const concept of countingConcepts) {
  if (!learnerStageIds.has(concept.stageId)) {
    failures.push(`${concept.id}: concept has no valid learner stage.`);
  }
  if (!expectedAnchorIds.has(concept.curriculumAnchorId)) {
    failures.push(`${concept.id}: concept has no valid Korean curriculum anchor.`);
  }
  if (!/^kr\.mt\.math\.number-operations\.g1-2\.s2-01-(01|03)\.(concept|representation|application)$/.test(concept.curriculumTopicId || "")) {
    failures.push(`${concept.id}: concept has no valid Korean learning-map topic ID.`);
  }
}

const coveredConceptIds = new Set(countingSteps.flatMap((step) => step.skillIds || []));
for (const concept of countingConcepts.filter((item) => !item.extension)) {
  if (!coveredConceptIds.has(concept.id)) {
    failures.push(`${concept.id}: non-extension counting concept has no diagnostic coverage.`);
  }
}


const coveredLearnerStages = new Set(
  countingSteps.flatMap((step) =>
    (step.skillIds || []).map((skillId) => countingConcepts.find((concept) => concept.id === skillId)?.stageId)
  ).filter(Boolean)
);
for (const stage of countingStages) {
  if (!coveredLearnerStages.has(stage.id)) failures.push(`${stage.id}: learner stage has no diagnostic coverage.`);
}

if (countingSteps.some((step) => /손가락\s*5개/.test(step.prompt || ""))) {
  failures.push("counting prompt reveals the target quantity instead of assessing representation.");
}

for (const interactionType of ["object-set", "number-sequence", "number-line"]) {
  if (!countingSteps.some((step) => step.interaction?.type === interactionType)) {
    failures.push(`counting MVP does not contain a ${interactionType} interaction.`);
  }
}

for (const requiredSnippet of [
  'action === "select-set"',
  'action === "tap-object"',
  "objectTapOrder",
  "duplicateObjectTaps",
  "untouchedObjectIds",
  "objectOmissionCount",
  "skillIds = step.skillIds",
  "skillAxes",
  "skillAxis: step.axis",
  "learnerStageIds",
  "curriculumAnchorIds",
  "curriculumTopicIds",
  "buildCountingStageSummary",
  "findEarliestStageToCheck",
]) {
  if (!appSource.includes(requiredSnippet)) {
    failures.push(`app.js is missing counting/session behavior: ${requiredSnippet}.`);
  }
}

if (diagnosticSets.length !== 2 || !diagnosticSets.some((set) => set.id === "counting-primary") || !diagnosticSets.some((set) => set.id === "fraction-grade5")) {
  failures.push("diagnostic picker must expose separate counting and fraction sets.");
}
if (diagnosticSets.find((set) => set.id === "counting-primary")?.questionCountLabel !== "10문항 · 24개 판단") {
  failures.push("counting picker must show the revised exact count of 10 questions and 24 judgments.");
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

const lowGradeBannedPatterns = [
  /빠뜨/,
  /표시하며/,
  /좋은 방법/,
  /전략/,
  /이었다면/,
  /마지막에 말한 수/,
  /공을 세며/,
  /오른쪽부터 다시/,
  /간격이 넓/,
  /수직선/,
  /수량/,
  /하나 더 작은/,
];

for (const question of questions) {
  for (const step of question.steps || []) {
    assertNoAnswerBars(question, step);
    for (const choice of step.choices || []) {
      assertStudentChoiceText(question, step, choice);
    }
  }
}

for (const question of countingQuestions) {
  for (const step of question.steps || []) {
    assertLowGradeStudentText(question, step);
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

console.log(`Student content harness passed: ${questions.length} fraction + ${countingQuestions.length} counting questions checked.`);

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

  if (question.id.startsWith("c")) {
    for (const pattern of lowGradeBannedPatterns) {
      if (pattern.test(label)) {
        failures.push(
          `${question.id}/${step.id}/${choice.id}: low-grade choice contains vocabulary-heavy wording: "${label}"`
        );
      }
    }
  }
}

function assertLowGradeStudentText(question, step) {
  const visibleText = [
    question.title,
    question.stem,
    question.focus,
    step.title,
    step.prompt,
    step.interaction?.instruction,
  ].filter(Boolean).join(" ");
  for (const pattern of lowGradeBannedPatterns) {
    if (pattern.test(visibleText)) {
      failures.push(`${question.id}/${step.id}: low-grade student text contains vocabulary-heavy wording: "${visibleText}".`);
    }
  }
  if (!String(step.prompt || "").trim().endsWith("?") && !String(step.prompt || "").trim().endsWith("요.")) {
    failures.push(`${question.id}/${step.id}: student prompt should be one short question or action sentence.`);
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
