#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const artifactsRoot = path.join(repoRoot, "artifacts", "vivasam");

const { SERIES_PLAN, STRATEGIES, assertSeriesPlan } = require("./g3-series-plan.cjs");
const { validateLesson, writeContentHandoff } = require("./build-content-handoff.cjs");
const { validateFiles } = require("./validate-content-handoff.cjs");
const { recordContent } = require("./track-series.cjs");

const SLIDE_MINUTES = Object.freeze([2, 4, 2, 3, 6, 5, 7, 5, 3, 2, 1]);

function ensure(condition, message) {
  if (!condition) throw new Error(`초3 30개 내용 생성 오류: ${message}`);
}

function singleLine(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function toGoalSentence(shortTitle) {
  return singleLine(shortTitle)
    .replace(/읽고 씀$/, "읽고 쓴다")
    .replace(/나타냄$/, "나타낸다")
    .replace(/연결함$/, "연결한다")
    .replace(/구분함$/, "구분한다")
    .replace(/비교함$/, "비교한다")
    .replace(/합침$/, "합친다")
    .replace(/곱함$/, "곱한다")
    .replace(/구함$/, "구한다")
    .replace(/찾음$/, "찾는다")
    .replace(/고름$/, "고른다")
    .replace(/바꿈$/, "바꾼다")
    .replace(/함$/, "한다");
}

function responseProfile(entry) {
  const kind = entry.extension.oracle.kind;
  if (kind === "fraction") {
    return {
      goalEvidence: "그림에서 센 수와 분수의 뜻을 연결해 설명한다.",
      pairSpeaker: "전체 조각 수와 고른 조각 수를 짚어 분수를 설명하기",
      pairListener: "똑같이 나눈 전체와 분자·분모가 맞는지 확인하기",
      independentTitle: "분수와 까닭을 남겨요",
      independentSteps: ["전체가 똑같이 나뉘었는지 확인하기", "전체 조각 수와 고른 조각 수 표시하기", "분수로 나타내기", `분자와 분모의 뜻 쓰기: ${entry.extension.answer}`],
      studentProduct: "분수, 전체 조각 수, 고른 조각 수, 까닭",
    };
  }
  if (kind === "equal-parts") {
    return {
      goalEvidence: "조각의 개수와 크기를 구분해 판단 근거를 설명한다.",
      pairSpeaker: "분수로 나타낼 수 있는지 판단하고 고치는 방법 설명하기",
      pairListener: "조각의 크기가 모두 같은지 근거로 확인하기",
      independentTitle: "판단과 고치는 방법을 남겨요",
      independentSteps: ["전체 하나 표시하기", "각 조각의 크기 비교하기", "분수로 나타낼 수 있는지 판단하기", "바르게 나누는 방법과 까닭 쓰기"],
      studentProduct: "판단, 크기 비교, 고치는 방법, 까닭",
    };
  }
  if (kind === "referents") {
    return {
      goalEvidence: "대상의 실제 크기를 어림해 알맞은 단위를 설명한다.",
      pairSpeaker: "각 대상의 크기를 어림하고 알맞은 단위 설명하기",
      pairListener: "고른 단위로 나타낸 길이가 현실적인지 확인하기",
      independentTitle: "단위 선택과 까닭을 남겨요",
      independentSteps: ["재려는 대상 표시하기", "실제 크기 어림하기", "알맞은 단위 고르기", "그 단위가 알맞은 까닭 쓰기"],
      studentProduct: "대상, 어림한 크기, 선택한 단위, 까닭",
    };
  }
  if (kind === "named-relation") {
    return {
      goalEvidence: "원의 중심과 원 위의 점을 근거로 선분의 이름을 설명한다.",
      pairSpeaker: "중심과 원 위의 점을 짚어 선분의 이름 설명하기",
      pairListener: "선분의 두 끝점이 어디에 있는지 확인하기",
      independentTitle: "이름과 근거를 남겨요",
      independentSteps: ["원의 중심 O 표시하기", "원 위의 점 A 표시하기", "선분 OA의 이름 쓰기", "두 끝점의 위치로 까닭 설명하기"],
      studentProduct: "중심, 원 위의 점, 선분의 이름, 까닭",
    };
  }
  if (kind === "improper-to-mixed") {
    return {
      goalEvidence: "완전한 묶음과 남은 수를 대분수와 연결해 설명한다.",
      pairSpeaker: "분모만큼 묶은 과정과 대분수 설명하기",
      pairListener: "자연수 부분과 남은 분수 부분이 맞는지 확인하기",
      independentTitle: "묶은 과정과 대분수를 남겨요",
      independentSteps: ["분자를 분모만큼 묶기", "완전한 묶음 수 쓰기", "남은 수를 분자로 쓰기", "대분수와 묶은 과정 설명하기"],
      studentProduct: "묶음 과정, 자연수 부분, 분수 부분, 대분수",
    };
  }
  if (kind === "same-denominator-compare") {
    return {
      goalEvidence: "같은 분모와 다른 분자를 근거로 두 분수를 비교한다.",
      pairSpeaker: "두 분수의 분모와 분자를 비교해 큰 분수 설명하기",
      pairListener: "분모가 같은지 먼저 확인한 뒤 분자를 비교했는지 살펴보기",
      independentTitle: "비교 결과와 까닭을 남겨요",
      independentSteps: ["두 분수의 분모 확인하기", "분자가 나타내는 조각 수 비교하기", "더 큰 분수 쓰기", "한 조각의 크기와 조각 수로 까닭 쓰기"],
      studentProduct: "같은 분모, 두 분자, 비교 결과, 까닭",
    };
  }
  if (kind === "fact-family") {
    return {
      goalEvidence: "곱셈과 나눗셈의 세 수 관계를 식으로 설명한다.",
      pairSpeaker: "전체와 두 요인을 짚어 나눗셈식 설명하기",
      pairListener: "두 나눗셈식에 같은 세 수가 쓰였는지 확인하기",
      independentTitle: "연결된 식과 까닭을 남겨요",
      independentSteps: ["곱셈식에서 전체 찾기", "두 요인 표시하기", "연결되는 나눗셈식 쓰기", "곱셈으로 몫 확인하기"],
      studentProduct: "전체, 두 요인, 연결된 식, 확인 과정",
    };
  }
  return {
    goalEvidence: "주어진 정보와 핵심 관계를 식과 한 문장으로 설명한다.",
    pairSpeaker: "사용한 관계식과 답을 차례로 설명하기",
    pairListener: "식의 수와 단위가 문제의 뜻에 맞는지 확인하기",
    independentTitle: "풀이와 한 문장으로 남겨요",
    independentSteps: ["주어진 정보 표시하기", "핵심 관계식 쓰기", "계산하고 답의 뜻 나타내기", "사용한 관계로 까닭 쓰기"],
    studentProduct: "주어진 정보, 관계식, 계산 결과, 답의 뜻",
  };
}

function formatParts(parts) {
  return parts.map((part) => `${part.value}${part.unit}`).join(" ");
}

function visualLines(visual) {
  if (!visual || visual.kind === "none") return [];
  if (visual.kind === "array") return [`배열 자료: ${singleLine(visual.label)}, ${visual.rows}줄, 한 줄에 ${visual.columns}개`];
  if (visual.kind === "division-groups") return [`나눗셈 자료: 전체 ${visual.total}개, 같은 묶음 ${visual.groups}개`];
  if (visual.kind === "item-collection") return [`자료: ${singleLine(visual.ariaLabel)}`, `보이는 항목: ${visual.items.map(singleLine).join(", ")}`];
  if (visual.kind === "data-table") return [`표 제목: ${singleLine(visual.title)}`, ...visual.rows.map((row) => `${singleLine(row.label)}: ${singleLine(row.value)}`)];
  if (visual.kind === "fraction-bar") {
    const colored = visual.unknown === "numerator" ? "색칠한 칸은 빈칸" : `색칠한 칸 ${visual.numerator}개`;
    return [`분수 막대: 전체 ${visual.denominator}칸, ${colored}`];
  }
  if (visual.kind === "partition-diagrams") {
    return visual.diagrams.map((diagram) => `분할 그림 ${singleLine(diagram.label)}: 조각 크기 비율 ${diagram.parts.join(":" )}${Number.isInteger(diagram.highlightedPart) ? `, ${diagram.highlightedPart + 1}번째 조각 표시` : ""}`);
  }
  if (visual.kind === "length-relation") return [`길이 관계: ${visual.value}${visual.fromUnit}를 ${visual.targetUnit}로 바꾸기`];
  if (visual.kind === "unit-relation") return [`단위 관계 자료: ${formatParts(visual.given)}를 ${visual.targetUnit}로 바꾸기`];
  if (visual.kind === "quantity-combine") return [`양의 ${visual.operator === "add" ? "합" : "차"}: ${formatParts(visual.left)} ${visual.operator === "add" ? "+" : "-"} ${formatParts(visual.right)}`];
  if (visual.kind === "measure-referent") return [`측정 대상: ${singleLine(visual.object)}`, `측정 도구: ${singleLine(visual.instrument)}`];
  if (visual.kind === "circle") {
    const modeLabels = {
      radius: "중심과 원 위의 한 점을 이은 선분",
      diameter: "중심을 지나 원 위의 두 점을 이은 선분",
      "equal-radii": "한 원 안의 여러 반지름",
      "compass-center": "컴퍼스의 중심이 되는 점",
      "compass-radius": "컴퍼스를 벌린 길이와 반지름",
    };
    const lines = [`원 자료: ${modeLabels[visual.mode] || "중심과 반지름"}`];
    if (visual.radiusValue) lines.push(`주어진 반지름: ${visual.radiusValue}${visual.measurementUnit || "cm"}`);
    if (visual.diameterValue) lines.push(`주어진 지름: ${visual.diameterValue}${visual.measurementUnit || "cm"}`);
    return lines;
  }
  if (visual.kind === "pictograph") return [`범례: ${visual.symbol} 1개 = ${visual.value}`, ...visual.rows.map((row) => `${singleLine(row.label)}: ${visual.symbol} ${row.count}개`)];
  return [`자료 명세: ${JSON.stringify(visual)}`];
}

function judgmentLines(judgment, includeChoices = true) {
  const lines = [];
  if (judgment.context) lines.push(`상황: ${singleLine(judgment.context)}`);
  lines.push(`문제: ${singleLine(judgment.prompt)}`);
  lines.push(...visualLines(judgment.visual));
  if (includeChoices) lines.push(`선택지: ${judgment.choices.map((choice) => singleLine(choice.label)).join(" / ")}`);
  return lines;
}

function selectCandidateLines(judgment, sequence) {
  const correct = judgment.choices.find((choice) => choice.correct);
  const wrong = judgment.choices.find((choice) => !choice.correct);
  ensure(correct && wrong, `${judgment.id}에 비교할 정답과 오답이 없습니다.`);
  const candidates = sequence % 2 === 0 ? [wrong, correct] : [correct, wrong];
  return [`풀이 A의 답: ${singleLine(candidates[0].label)}`, `풀이 B의 답: ${singleLine(candidates[1].label)}`];
}

function sourcePair(source, entry) {
  const stage = source.diagnosis.learnerStages.find((item) => item.id === entry.stageId);
  const coverage = source.coverage.stages.find((item) => item.stageId === entry.stageId);
  ensure(stage, `${entry.lessonId}의 승인 학습 단계가 없습니다: ${entry.stageId}`);
  ensure(coverage?.evidence?.length === 2, `${entry.lessonId}의 직접·전이 근거가 2개가 아닙니다.`);
  const directId = coverage.evidence.find((item) => item.kind === "direct")?.judgmentId;
  const transferId = coverage.evidence.find((item) => item.kind === "transfer")?.judgmentId;
  const direct = source.diagnosis.judgments.find((item) => item.id === directId);
  const transfer = source.diagnosis.judgments.find((item) => item.id === transferId);
  ensure(direct && transfer, `${entry.lessonId}의 직접·전이 문항을 찾지 못했습니다.`);
  const model = entry.focus === "transfer" ? transfer : direct;
  const practice = entry.focus === "transfer" ? direct : transfer;
  return { stage, coverage, model, practice };
}

function buildSlides({ entry, stage, model, practice, strategy, rationales }) {
  const correctModel = model.choices.find((choice) => choice.correct);
  const correctPractice = practice.choices.find((choice) => choice.correct);
  const wrongModel = model.choices.filter((choice) => !choice.correct);
  ensure(correctModel && correctPractice && wrongModel.length === 2, `${entry.lessonId}의 정답·오답 구조가 잘못되었습니다.`);
  const errorLines = wrongModel.map((choice) => {
    const rationale = rationales.find((item) => item.judgmentId === model.id && item.choiceId === choice.id);
    ensure(rationale, `${model.id}/${choice.id}의 오답 근거가 없습니다.`);
    return `검토할 답 ${singleLine(choice.label)}: ${singleLine(rationale.derivation || rationale.rationale)}`;
  });
  const goalSentence = toGoalSentence(stage.shortTitle);
  const response = responseProfile(entry);
  const base = [
    {
      phase: "수업 열기", kind: "cover", title: entry.title,
      visibleContent: [stage.title, strategy.hook],
      intent: "차시의 핵심 관계를 짧은 질문으로 열어 학생이 확인할 수학적 차이를 분명히 한다.",
      teacherMove: "답을 먼저 말하지 않고 두 가지 예상이 나올 때까지 질문을 유지한다.",
      studentAction: "첫 생각과 그 까닭을 한 문장으로 말한다.",
      evidence: "학생이 무엇을 비교하거나 계산해야 하는지 수학 용어로 말하는지 확인한다.",
    },
    {
      phase: "동기 유발", kind: "dilemma", title: "두 답은 어디에서 달라졌을까요?",
      visibleContent: [...judgmentLines(model, false), ...selectCandidateLines(model, entry.sequence), "질문: 어느 풀이가 보이는 자료와 맞는지 근거를 말해 보세요."],
      intent: "실제 Middle of Math 문항의 정답과 추적 가능한 오답을 비교해 핵심 판단 기준을 드러낸다.",
      teacherMove: "사람이 아니라 풀이의 단계만 비교하게 하고, 보이는 수와 자료를 근거로 말하게 한다.",
      studentAction: "두 답이 만들어진 과정을 비교하고 확인할 기준을 제안한다.",
      evidence: "학생이 답의 크기만 보지 않고 목표 단계의 관계를 근거로 선택하는지 본다.",
    },
    {
      phase: "학습 목표", kind: "goals", title: "오늘 수업을 마치면",
      visibleContent: [`1. ${goalSentence}`, `2. ${strategy.rule}`, `3. ${response.goalEvidence}`, "성공 기준: 답과 함께 사용한 관계를 남기면 성공"],
      intent: "수업 목표를 관찰 가능한 행동과 설명 증거로 바꾼다.",
      teacherMove: "세 행동 중 학생이 지금 가장 자신 있는 것 하나를 고르게 한다.",
      studentAction: "오늘 보여 줄 행동을 자기 말로 바꾸어 말한다.",
      evidence: "학생이 결과와 설명을 서로 다른 성공 기준으로 인식하는지 확인한다.",
    },
    {
      phase: "생각 도구", kind: "route", title: "이 순서로 생각해요",
      visibleContent: strategy.steps.map((step, index) => `${index + 1}. ${step}`),
      intent: "문제 해결 과정을 네 단계로 외재화해 한 단계의 생략을 관찰할 수 있게 한다.",
      teacherMove: "각 단계에서 무엇을 적거나 가리킬지 학생에게 짧게 말하게 한다.",
      studentAction: "네 단계를 손가락으로 따라 읽고 문제에 적용할 준비를 한다.",
      evidence: "학생이 목표 관계를 사용하기 전 필요한 정보를 먼저 확인하는지 본다.",
    },
    {
      phase: "활동 1 · 함께 보기", kind: "model", title: "보이는 정보로 답을 확인해요",
      visibleContent: [...judgmentLines(model, true), `확인 결과: ${singleLine(correctModel.label)}`, `핵심 이유: ${strategy.rule}`],
      intent: "승인된 직접 또는 전이 문항을 모델로 사용해 자료와 계산의 연결을 명시한다.",
      teacherMove: "문제의 수와 자료를 하나씩 가리키며 각 수가 식에서 맡는 역할을 묻는다.",
      studentAction: "자료, 식, 답을 한 줄로 연결해 기록한다.",
      evidence: "학생이 정답을 고른 뒤 목표 관계로 다시 확인하는지 본다.",
    },
    {
      phase: "활동 1 · 따라 풀기", kind: "guided", title: "같은 생각을 다른 문제에 적용해요",
      visibleContent: [...judgmentLines(practice, true), "혼자 30초 생각한 뒤 네 단계 중 사용한 단계를 표시하세요."],
      intent: "직접 문항과 다른 맥락의 전이 문항으로 같은 수학적 행동이 유지되는지 확인한다.",
      teacherMove: "답을 공개하지 않고 학생이 사용한 단계와 근거만 먼저 묻는다.",
      studentAction: "문제를 풀고 사용한 관계를 식이나 말로 남긴다.",
      evidence: "숫자나 상황이 달라져도 같은 해결 관계를 적용하는지 확인한다.",
    },
    {
      phase: "활동 2 · 짝 설명", kind: "pair", title: "새 문제를 짝에게 설명해요",
      visibleContent: [`문제: ${entry.extension.prompt}`, ...entry.extension.visible, `말하는 사람: ${response.pairSpeaker}`, `듣는 사람: ${response.pairListener}`],
      intent: "교사가 설계한 새 수치의 문항으로 출처 문항을 그대로 외운 답이 아닌지 확인한다.",
      teacherMove: "짝이 답만 확인하지 않고 식의 각 수가 뜻하는 것을 질문하게 한다.",
      studentAction: "역할을 바꾸어 식, 답, 이유를 설명하고 확인한다.",
      evidence: "학생이 새 수치에서도 목표 관계를 정확히 적용하고 단위를 유지하는지 본다.",
    },
    {
      phase: "활동 3 · 혼자 적용", kind: "independent", title: response.independentTitle,
      visibleContent: [`다시 볼 문제: ${entry.extension.prompt}`, ...response.independentSteps.map((step, index) => `${index + 1}. ${step}`), `확인할 핵심 관계: ${strategy.rule}`],
      intent: "짝 대화 뒤 같은 문제를 독립적으로 재구성하게 해 개인 증거를 남긴다.",
      teacherMove: "학생의 답을 고쳐 주기 전에 식과 이유가 서로 맞는지만 표시한다.",
      studentAction: "도움 없이 자신의 풀이와 근거를 완성한다.",
      evidence: "학생이 말로 한 설명을 독립적인 기록으로 옮기는지 확인한다.",
    },
    {
      phase: "생각 나누기", kind: "errorDetective", title: "어느 단계에서 달라졌을까요?",
      visibleContent: [...errorLines, `확인 기준: ${strategy.rule}`, "질문: 각 답에서 가장 먼저 고쳐야 할 단계를 찾아보세요."],
      intent: "출처의 오답 도출 근거를 사용해 결과가 아니라 첫 오류 지점을 분석하게 한다.",
      teacherMove: "틀린 사람을 상상하게 하지 않고 식이나 관계에서 달라진 첫 지점만 말하게 한다.",
      studentAction: "두 오답의 첫 오류 단계를 찾고 바르게 고친다.",
      evidence: "서로 다른 오답을 같은 말로 뭉뚱그리지 않고 실제 계산 경로로 구분하는지 본다.",
    },
    {
      phase: "수업 정리 · 나가기 표", kind: "exit", title: "세 가지로 확인해요",
      visibleContent: [`1. ${singleLine(practice.prompt)}`, `2. ${entry.extension.prompt}`, `3. 다음 관계가 필요한 까닭을 한 문장으로 쓰세요: ${strategy.rule}`],
      intent: "직접 확인, 새 수치 적용, 이유 설명의 세 증거를 한 번에 수집한다.",
      teacherMove: "세 문항을 각각 결과, 적용, 설명 증거로 구분해 확인한다.",
      studentAction: "혼자 세 문항을 해결하고 제출한다.",
      evidence: "같은 목표 행동이 결과와 설명에서 함께 나타나는지 확인한다.",
    },
    {
      phase: "수업 닫기", kind: "summary", title: "오늘의 생각을 한 문장으로",
      visibleContent: [`오늘의 핵심: ${strategy.rule}`, "오늘 나는 이 방법으로 문제를 풀고 근거를 설명할 수 있다.", `다음 질문: ${strategy.hook}`],
      intent: "차시의 해결 관계를 학생 자신의 문장으로 다시 말하게 하고 다음 탐구와 연결한다.",
      teacherMove: "처음 예상과 지금 설명에서 달라진 낱말 하나를 찾게 한다.",
      studentAction: "핵심 관계와 달라진 생각을 한 문장으로 정리한다.",
      evidence: "학생이 단순 소감이 아니라 수학적 관계를 포함해 정리하는지 본다.",
    },
  ];
  return base.map((slide, index) => ({ ...slide, number: index + 1, minutes: SLIDE_MINUTES[index] }));
}

function buildLesson(entry, source) {
  const pair = sourcePair(source, entry);
  const strategy = STRATEGIES[`${entry.semester}:${entry.stageId}`];
  const unit = source.diagnosis.manifest.units.find((item) => item.id === pair.stage.unitId);
  ensure(strategy && unit, `${entry.lessonId}의 전략 또는 단원 정보가 없습니다.`);
  const lessonRationales = source.rationales.filter((item) => [pair.model.id, pair.practice.id].includes(item.judgmentId));
  const correctChoices = [pair.model, pair.practice].map((judgment) => {
    const choice = judgment.choices.find((item) => item.correct);
    ensure(choice, `${judgment.id}의 정답이 없습니다.`);
    return { judgmentId: judgment.id, choiceId: choice.id, label: choice.label };
  });
  const lesson = {
    schemaVersion: 1,
    id: entry.lessonId,
    version: "1.0.0",
    title: entry.title,
    subtitle: pair.stage.title,
    subject: "수학",
    subjectCode: "MATH",
    grade: `초등 3학년 ${entry.semester}학기`,
    unit: `${unit.order}. ${unit.title}`,
    durationMinutes: 40,
    curriculumAnchorIds: pair.stage.curriculumAnchorIds,
    targetBehavior: `${toGoalSentence(pair.stage.shortTitle)}. 식·자료·한 문장으로 근거를 설명한다.`,
    privacyRule: "실제 학생 이름·얼굴·학급·댓글을 넣지 않고 모든 풀이 비교는 풀이 A/B로 표시한다.",
    worksheet: {
      file: `${entry.lessonId}-worksheet.png`,
      title: `${entry.title} 통합 활동지`,
      instruction: "생각 도구, 함께 풀기, 짝 설명, 혼자 적용, 나가기 표를 한 장에 이어서 기록해요.",
    },
    sourceEvidence: [
      source.sourcePath,
      source.coveragePath,
      source.rationalePath,
      `manifest checksum: ${source.diagnosis.manifest.checksum}`,
      `learnerStageId: ${entry.stageId}`,
      `judgmentIds: ${pair.model.id}, ${pair.practice.id}`,
    ],
    mathOracle: {
      sourceChecksum: source.diagnosis.manifest.checksum,
      sourceJudgments: correctChoices,
      extensionAnswer: entry.extension.answer,
      extensionOracle: entry.extension.oracle,
    },
    slides: buildSlides({ entry, ...pair, strategy, rationales: lessonRationales }),
    answerKey: {
      sourceJudgments: correctChoices,
      guidedPractice: correctChoices.find((item) => item.judgmentId === pair.practice.id),
      extension: entry.extension.answer,
      errorAnalysis: lessonRationales.map((item) => ({ judgmentId: item.judgmentId, choiceId: item.choiceId, rationale: item.rationale, derivation: item.derivation })),
      exitTicket: [
        correctChoices.find((item) => item.judgmentId === pair.practice.id)?.label,
        entry.extension.answer,
        strategy.rule,
      ],
    },
  };
  validateLesson(lesson);
  return lesson;
}

async function loadSources() {
  const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
  try {
    const [s1Content, s1Coverage, s1Rationales, s2Content, s2Coverage, s2Rationales] = await Promise.all([
      server.ssrLoadModule("/packages/content/src/grade3-semester1.ts"),
      server.ssrLoadModule("/packages/content/src/grade3-semester1-coverage.ts"),
      server.ssrLoadModule("/packages/content/src/grade3-semester1-rationales.ts"),
      server.ssrLoadModule("/packages/content/src/grade3-semester2-complete.ts"),
      server.ssrLoadModule("/packages/content/src/grade3-semester2-coverage.ts"),
      server.ssrLoadModule("/packages/content/src/grade3-semester2-rationales.ts"),
    ]);
    return {
      1: {
        diagnosis: s1Content.grade3Semester1Diagnosis,
        coverage: s1Coverage.grade3Semester1CoverageBlueprint,
        rationales: s1Rationales.grade3Semester1DistractorRationales,
        sourcePath: "packages/content/src/grade3-semester1.ts",
        coveragePath: "packages/content/src/grade3-semester1-coverage.ts",
        rationalePath: "packages/content/src/grade3-semester1-rationales.ts",
      },
      2: {
        diagnosis: s2Content.grade3Semester2CompleteDiagnosis,
        coverage: s2Coverage.grade3Semester2CoverageBlueprint,
        rationales: s2Rationales.grade3Semester2DistractorRationales,
        sourcePath: "packages/content/src/grade3-semester2-complete.ts",
        coveragePath: "packages/content/src/grade3-semester2-coverage.ts",
        rationalePath: "packages/content/src/grade3-semester2-rationales.ts",
      },
    };
  } finally {
    await server.close();
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function buildIndex(records) {
  const table = records.map((record) => `| ${String(record.sequence).padStart(2, "0")} | ${record.semester}학기 | ${record.unit} | ${record.title} | ${record.slideCount} | [Markdown](${record.markdownRelative}) | [JSON](${record.jsonRelative}) |`).join("\n");
  return `# Claude 전달용 초등 3학년 PPT 내용 원고 30개

각 Markdown 파일 하나가 PPTX 한 개의 화면 내용 원고입니다. 제목·문항·수치·단위·관계는 원고와 같게 유지합니다.

- 범위: 초등 3학년 1학기 15개 + 2학기 15개
- PPT 수: 30개
- 기준 슬라이드 수: 각 11장
- 이 색인과 개별 원고에는 PPT 외 산출물이나 플랫폼 지시가 포함되지 않습니다.

| 번호 | 학기 | 단원 | 수업 제목 | 슬라이드 | 내용 원고 | JSON |
|---:|---:|---|---|---:|---|---|
${table}
`;
}

function buildCombined(records) {
  const sections = records.map((record) => {
    const markdown = fs.readFileSync(record.markdownPath, "utf8").trim();
    return `# PPT ${String(record.sequence).padStart(2, "0")} · ${record.title}\n\n${markdown}`;
  });
  return `# Claude 전달용 PPT 내용 원고 30개 합본\n\n${sections.join("\n\n---\n\n")}\n`;
}

async function main() {
  assertSeriesPlan();
  const skipTrack = process.argv.includes("--skip-track");
  const sources = await loadSources();
  const records = [];
  for (const entry of SERIES_PLAN) {
    const lessonRoot = path.join(artifactsRoot, entry.lessonId);
    const handoffRoot = path.join(lessonRoot, "content-handoff");
    if (!entry.existing) {
      const lesson = buildLesson(entry, sources[entry.semester]);
      const schemaPath = path.join(lessonRoot, "lesson-schema.json");
      writeJson(schemaPath, lesson);
      writeContentHandoff(lesson, handoffRoot);
      validateFiles(handoffRoot);
      if (!skipTrack) {
        recordContent({
          trackerPath: path.join(__dirname, "series-tracker.json"),
          dashboardPath: path.join(repoRoot, "docs", "vivasam-30-series-progress.md"),
          sequence: entry.sequence,
          lessonPath: schemaPath,
          handoffDir: handoffRoot,
          event: "Claude 전달용 PPT 내용 원고 검증",
          detail: `초등 3학년 ${entry.semester}학기 승인 소스의 ${entry.stageId} 단계로 11장 내용 원고를 검증했다.`,
        });
      }
    } else {
      ensure(fs.existsSync(path.join(handoffRoot, "claude-ppt-content.md")), `기존 1번 내용 원고가 없습니다: ${handoffRoot}`);
      validateFiles(handoffRoot);
    }
    const handoff = JSON.parse(fs.readFileSync(path.join(handoffRoot, "claude-ppt-content.json"), "utf8"));
    records.push({
      sequence: entry.sequence,
      semester: entry.semester,
      unit: handoff.lesson.unit,
      title: handoff.lesson.title,
      slideCount: handoff.lesson.slideCount,
      markdownPath: path.join(handoffRoot, "claude-ppt-content.md"),
      jsonPath: path.join(handoffRoot, "claude-ppt-content.json"),
      markdownRelative: `${entry.lessonId}/content-handoff/claude-ppt-content.md`,
      jsonRelative: `${entry.lessonId}/content-handoff/claude-ppt-content.json`,
    });
  }
  fs.writeFileSync(path.join(artifactsRoot, "CLAUDE-CONTENT-INDEX.md"), buildIndex(records), "utf8");
  fs.writeFileSync(path.join(artifactsRoot, "claude-all-30-ppt-content.md"), buildCombined(records), "utf8");
  writeJson(path.join(artifactsRoot, "claude-content-series-manifest.json"), {
    schemaVersion: 1,
    scope: "초등 3학년 1학기 15개 + 2학기 15개",
    sourcePolicy: "승인된 grade3-semester1 및 grade3-semester2-complete만 사용",
    count: records.length,
    records: records.map(({ markdownPath, jsonPath, ...record }) => record),
  });
  process.stdout.write(`완료: Claude용 PPT 내용 원고 ${records.length}개\n색인: ${path.join(artifactsRoot, "CLAUDE-CONTENT-INDEX.md")}\n합본: ${path.join(artifactsRoot, "claude-all-30-ppt-content.md")}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
