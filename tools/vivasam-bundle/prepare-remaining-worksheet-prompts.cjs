#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { buildWorksheetModel, loadSeriesLessons } = require("./build-series-non-ppt-assets.cjs");
const { VISUAL_DIRECTIONS } = require("./remaining-worksheet-imagegen-specs.cjs");

const REPO_ROOT = path.resolve(__dirname, "../..");

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function choiceBoxes(value) {
  return String(value || "").split(/\s+\/\s+/).filter(Boolean).map((label, index) => `${index + 1}번 선택 상자 "${label}"`).join(", ");
}

function buildPrompt(model) {
  const visual = VISUAL_DIRECTIONS[model.lessonId];
  if (!visual) throw new Error(`${model.lessonId} 활동지 시각 지시가 없습니다.`);
  const errorCase = model.domain === "fraction" ? model.errorCases[0] : model.errorCases[1];
  const wrong = errorCase.replace(/^검토할 답\s*/, "").replace(/\s*·\s*첫 오류는\?$/, "");
  const contextLine = model.guided.context === model.guided.prompt ? "" : `Korean context "${model.guided.context}". `;
  return `# 1. Scene:
초등학교 3학년 학생이 인쇄해 연필로 직접 푸는 완성된 세로형 수학 활동지 한 장. 흰 종이 바탕, 페이지 네 가장자리에 약 6% 안전 여백. 좌상단에는 독립된 작은 로고 구역을 두고 둥근 보라색 구름 안에 흰 소문자 영문 로고를 넣는다. 제목은 구름보다 충분히 아래에서 시작하는 별도 제목 구역에 놓아 로고와 제목이 확실히 떨어진다. 우상단에는 이름 쓰는 칸을 둔다.

본문에는 같은 너비의 큰 문제 카드 세 개를 위에서 아래로 쌓는다. 카드 사이는 넓게 띄우고, 문제 문장·수학 그림·선택지·답쓰기 칸을 서로 겹치지 않는 독립 영역으로 배치한다. 선택지는 한 줄에 몰아 쓰지 않고 각각 테두리가 있는 큰 상자로 분리한다. 모든 답칸은 학생이 두꺼운 연필로 쓸 수 있을 만큼 높고 길다.

첫 카드는 함께 풀기, 둘째 카드는 새 문제, 셋째 카드는 오류 탐정 역할이다. ${visual} 셋째 카드에는 지정된 잘못된 답을 연한 노란 상자에 한 번만 보여 주고, 오류 지점과 바른 풀이를 쓰는 두 개의 넓은 빈칸을 둔다. 맨 아래에는 핵심 관계를 한 줄로 정리하고 학생이 까닭을 쓰는 짧은 빈칸을 둔다.

# 2. Camera:
정면에서 본 평평한 A4 세로 문서 전체 보기. 원근 왜곡이 없는 2D 교과서 활동지, 네 가장자리가 모두 프레임 안에 들어오고 어떤 요소도 잘리지 않는다.

# 3. Lighting:
균일하고 밝은 중성 인쇄 조명. 글자와 수학식의 경계가 또렷하고 카드에는 매우 얕고 부드러운 그림자만 있다.

# 4. Color grading:
화이트 #FFFFFF, 딥 퍼플 #352064, 브랜드 퍼플 #6941C6, 라이트 퍼플 #F2EDFF, 작은 옐로 포인트 #F7C948.

# 5. Texture/Medium:
깨끗한 초등 수학 교과서형 플랫 교육 그래픽, 크고 또렷한 한국어 고딕체, 굵은 문제 번호, 둥근 모서리 카드, 규칙적인 정렬, 무광 종이 질감, 넉넉한 필기 공간.

# 6. Text-in-image:
top-left English logo "eduitit" in white lowercase text inside the purple cloud. Korean headline "${model.title}" in bold dark-purple geometric sans-serif. Korean subhead "${model.grade} · ${model.unit}" directly below the headline. Top-right name field reads "이름 __________".

First card Korean header "1. 함께 풀기". ${contextLine}Korean question "${model.guided.prompt}". ${choiceBoxes(model.guided.choices)}. 각 선택 상자 왼쪽에는 빈 선택 원 하나가 있다.

Second card Korean header "2. 새 문제". Korean question "${model.transfer.prompt}". ${model.transfer.cues.map((cue) => `cue box "${cue}"`).join(", ")}. 아래에 "식 ____________________"과 "답 ____________________"을 서로 다른 줄에 둔다.

Third card Korean header "3. 오류 탐정". Yellow wrong-answer box "${wrong}". Korean labels "첫 오류" and "바른 풀이" each followed by a long blank writing area.

Bottom Korean core line "${model.coreRule}". 모든 한글은 어절 단위로만 줄이 바뀌며 낱말 중간이 나뉘지 않는다. 슬래시가 포함된 모든 분수는 슬래시 문자를 인쇄하지 않고 분자 위, 분모 아래, 가운데 가로 분수선인 교과서 세로 분수로 렌더한다. All text appears once, perfectly legible — no duplicate text, no extra words, no invented glyphs, no watermark.

AR 2:3
`;
}

function main() {
  const lessons = loadSeriesLessons().filter((lesson) => lesson.sequence >= 7);
  for (const lesson of lessons) {
    const model = buildWorksheetModel(lesson);
    const worksheetRoot = path.join(REPO_ROOT, "artifacts", "vivasam", lesson.id, "worksheet");
    ensureDirectory(worksheetRoot);
    const promptPath = path.join(worksheetRoot, `${lesson.id}-worksheet.prompt.txt`);
    fs.writeFileSync(promptPath, buildPrompt(model), "utf8");
    process.stdout.write(`${lesson.sequence}\t${lesson.id}\t${promptPath}\n`);
  }
}

if (require.main === module) main();

module.exports = { buildPrompt };
