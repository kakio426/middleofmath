"use strict";

const lesson = {
  schemaVersion: 1,
  id: "g3s2-pictograph-legend",
  version: "1.0.0",
  title: "그림 하나에 숨은 수",
  subtitle: "범례를 적용해 그림그래프의 실제 수량과 차이를 읽어요",
  subject: "수학",
  subjectCode: "MATH",
  grade: "초등 3학년 2학기",
  unit: "6. 그림그래프",
  durationMinutes: 40,
  curriculumAnchor: "[4수04-01]",
  targetBehavior:
    "그림 수를 세고 범례의 값을 적용해 실제 수량으로 바꾼 뒤 두 행의 수량 차이를 설명한다.",
  privacyRule:
    "실제 학생 이름·얼굴·학급·댓글을 넣지 않고, 모든 학생 반응은 '생각 A/B' 같은 합성 예시로 표시한다.",
  worksheet: {
    file: "g3s2-pictograph-legend-worksheet.png",
    title: "그림그래프 범례 통합 활동지",
    instruction: "범례를 적용해 실제 수량을 구하고, 두 행을 비교한 뒤 풀이 이유를 한 문장으로 설명해요.",
  },
  sourceEvidence: [
    "packages/content/src/grade3-semester2-complete.ts",
    "packages/content/src/grade3-semester2-rationales.ts",
    "middleofmath-content-review 시각·오답 근거 계약",
  ],
  palette: {
    forest: "146B55",
    forestDark: "0D493A",
    mint: "D9EEE7",
    mintLight: "EFF8F4",
    yellow: "F1C75B",
    coral: "E87963",
    ink: "17211D",
    muted: "52615B",
    line: "D9E2DF",
    paper: "F8FAF9",
    white: "FFFFFF",
  },
  slides: [
    {
      number: 1,
      phase: "수업 열기",
      minutes: 1,
      kind: "cover",
      title: "그림 하나에\n숨은 수",
      kicker: "그림은 네 개인데, 답은 왜 4가 아닐까요?",
      intent:
        "그림의 개수와 실제 수량이 다를 수 있다는 인지적 갈등을 제목에서 바로 만들고, 수업의 핵심 대상인 범례를 탐구할 이유를 만든다.",
      teacherMove:
        "정답을 말하지 않고 제목의 질문만 읽은 뒤, 학생이 '그림 수'와 '나타내는 수'를 구분해 말하는지 듣는다.",
      studentAction: "첫 느낌을 한 문장으로 예상한다.",
      evidence: "학생이 그림 수와 실제 수량을 같은 것으로 보는지 확인한다.",
      worksheet: {
        file: "activity-01-opening-prediction.png",
        title: "생각 열기 카드",
        instruction: "그림 네 개가 실제로는 몇을 뜻할지 예상하고 까닭을 적어요.",
      },
    },
    {
      number: 2,
      phase: "동기 유발",
      minutes: 4,
      kind: "dilemma",
      title: "네 개를 셌는데 왜 답이 다를까요?",
      intent:
        "같은 시각자료에서 나온 두 답을 비교하게 하여, 범례를 적용하지 않은 대표 오답을 비난 없이 드러낸다.",
      teacherMove:
        "'누가 맞았어?'보다 '두 생각은 어디까지 같고 어디서 달라졌어?'라고 묻는다.",
      studentAction: "생각 A와 B의 공통점·차이점을 짝과 말한다.",
      evidence: "학생이 4×5의 관계를 그림 수와 범례로 설명하는지 확인한다.",
      data: {
        symbol: "star",
        legendValue: 5,
        legendUnit: "권",
        rows: [{ label: "책", count: 4 }],
        claims: [
          { label: "생각 A", text: "별이 4개니까 4권이에요." },
          { label: "생각 B", text: "별 하나가 5권이니 20권이에요." },
        ],
      },
      worksheet: {
        file: "activity-02-compare-thinking.png",
        title: "두 생각 비교하기",
        instruction: "같은 점과 다른 점을 찾고 더 설득력 있는 생각에 근거를 붙여요.",
      },
    },
    {
      number: 3,
      phase: "학습 목표",
      minutes: 2,
      kind: "goals",
      title: "오늘 수업을 마치면",
      intent:
        "수업 목표를 '알기'가 아니라 학생이 실제로 보여 줄 세 행동으로 제시해 성공 기준을 분명히 한다.",
      teacherMove:
        "세 기준을 읽고 학생이 가장 자신 있는 기준 하나에 손가락으로 표시하게 한다.",
      studentAction: "오늘 확인할 세 행동을 자기 말로 바꿔 말한다.",
      evidence: "학생이 수업 목표를 그림 수 세기, 범례 적용, 차이 설명으로 구분하는지 본다.",
      data: {
        goals: [
          "필요한 행의 그림 수를 빠짐없이 센다.",
          "그림 한 개가 나타내는 수를 한 번 적용한다.",
          "실제 수량으로 바꾼 뒤 차이를 설명한다.",
        ],
        success: "답뿐 아니라 '그림 수 × 범례'를 말이나 식으로 남기면 성공!",
      },
      worksheet: {
        file: "activity-03-success-checklist.png",
        title: "오늘의 성공 기준",
        instruction: "수업 전·후에 세 기준을 스스로 확인해요.",
      },
    },
    {
      number: 4,
      phase: "생각 도구",
      minutes: 3,
      kind: "route",
      title: "그림그래프는 이 순서로 읽어요",
      intent:
        "학생이 범례를 잊거나 두 번 적용하지 않도록 읽기 과정을 네 개의 눈에 보이는 단계로 외재화한다.",
      teacherMove:
        "손가락으로 네 칸을 따라가며 각 단계에서 무엇을 확인하는지 짧게 말하게 한다.",
      studentAction: "문제를 풀 때 사용할 사고 순서를 손가락으로 따라 읽는다.",
      evidence: "학생이 비교 전에 각 행을 실제 수량으로 바꾸는 순서를 말하는지 본다.",
      data: {
        steps: [
          { n: 1, title: "행 고르기", body: "무엇을 묻는지 찾기" },
          { n: 2, title: "그림 세기", body: "그림을 빠짐없이 세기" },
          { n: 3, title: "범례 적용", body: "그림 수 × 한 그림의 값" },
          { n: 4, title: "비교·설명", body: "실제 수량끼리 계산" },
        ],
      },
      worksheet: {
        file: "activity-04-thinking-route.png",
        title: "그림그래프 읽기 길",
        instruction: "문제 옆에 두고 네 단계를 순서대로 표시해요.",
      },
    },
    {
      number: 5,
      phase: "활동 1 · 함께 보기",
      minutes: 6,
      kind: "model",
      title: "그림 네 개를 20권으로 읽는 까닭",
      intent:
        "범례를 곱셈식과 뛰어 세기 두 표현으로 연결하여, 곱셈만 암기하거나 그림 수만 세는 지름길을 막는다.",
      teacherMove:
        "별을 하나씩 짚으며 5, 10, 15, 20으로 뛰어 센 뒤 4×5와 연결한다.",
      studentAction: "그림을 짚어 뛰어 세고 같은 관계를 곱셈식으로 적는다.",
      evidence: "그림 한 개마다 범례 값이 한 번씩 누적됨을 말하는지 본다.",
      data: {
        symbol: "star",
        legendValue: 5,
        legendUnit: "권",
        rows: [{ label: "책", count: 4 }],
        skipCounts: [5, 10, 15, 20],
        equation: "4 × 5 = 20",
      },
      worksheet: {
        file: "activity-05-skip-count-model.png",
        title: "범례로 뛰어 세기",
        instruction: "그림을 하나씩 짚으며 수를 쓰고 곱셈식과 연결해요.",
      },
    },
    {
      number: 6,
      phase: "활동 1 · 따라 풀기",
      minutes: 5,
      kind: "guided",
      title: "귤 수와 두 줄의 차이를 구해요",
      intent:
        "같은 범례를 두 행에 각각 적용한 뒤 비교하도록 하여, 그림 개수 차이만 답하는 오류를 수업 중간에 확인한다.",
      teacherMove:
        "첫째 줄, 둘째 줄의 실제 수량을 따로 적게 한 뒤 마지막에만 차이를 구하게 한다.",
      studentAction: "혼자 30초 생각한 뒤 짝에게 네 단계로 설명한다.",
      evidence: "그림 차이 2를 그대로 답하지 않고 (4−2)×2=4개로 설명하는지 본다.",
      data: {
        symbol: "circle",
        legendValue: 2,
        legendUnit: "개",
        rows: [
          { label: "첫째 줄", count: 4 },
          { label: "둘째 줄", count: 2 },
        ],
        prompts: ["첫째 줄의 귤은 모두 몇 개?", "두 줄은 몇 개 차이?"],
      },
      worksheet: {
        file: "activity-06-guided-practice.png",
        title: "따라 풀기",
        instruction: "두 행을 실제 수량으로 바꾼 뒤 차이를 구해요.",
      },
    },
    {
      number: 7,
      phase: "활동 2 · 짝 설명",
      minutes: 8,
      kind: "pair",
      title: "공원 A·B 나무 수를 설명해요",
      intent:
        "정답 선택을 넘어 범례를 근거로 한 설명을 짝에게 말하게 하여, 계산 결과와 수학적 이유를 함께 수집한다.",
      teacherMove:
        "말하는 학생은 식을 가리키고, 듣는 학생은 '범례를 한 번 적용했나요?'를 확인하게 한다.",
      studentAction: "역할을 바꾸어 총수와 차이를 설명하고 서로의 근거를 확인한다.",
      evidence: "(3+2)×10=50과 (3−2)×10=10을 구분해 설명하는지 본다.",
      data: {
        symbol: "square",
        legendValue: 10,
        legendUnit: "그루",
        rows: [
          { label: "공원 A", count: 3 },
          { label: "공원 B", count: 2 },
        ],
        prompts: ["두 공원에는 모두 몇 그루?", "A는 B보다 몇 그루 더 많을까?", "범례를 넣어 설명하기"],
      },
      worksheet: {
        file: "activity-07-pair-talk-mat.png",
        title: "짝 설명 매트",
        instruction: "말하는 사람·확인하는 사람 역할을 바꾸며 두 문제를 설명해요.",
      },
    },
    {
      number: 8,
      phase: "활동 3 · 혼자 적용",
      minutes: 5,
      kind: "independent",
      title: "25권을 나타내려면\n별을 어떻게 채울까요?",
      intent:
        "실제 수량에서 필요한 그림 수를 역으로 정하게 하여, 범례 관계를 한 방향 계산으로만 외웠는지 확인한다.",
      teacherMove:
        "그림부터 그리지 말고 25÷5로 필요한 그림 수를 먼저 쓰게 한다.",
      studentAction: "빈 행을 완성하고 위 행보다 몇 개 더 그렸는지 적는다.",
      evidence: "25÷5=5와 5−3=2를 두 단계로 구분하는지 본다.",
      data: {
        symbol: "star",
        legendValue: 5,
        legendUnit: "권",
        rows: [
          { label: "위 칸 · 15권", count: 3 },
          { label: "아래 칸 · 25권", count: 0, blankSlots: 6 },
        ],
        prompts: ["아래 칸에 별을 몇 개?", "위 칸보다 몇 개 더?"],
      },
      worksheet: {
        file: "activity-08-independent-practice.png",
        title: "혼자 적용하기",
        instruction: "필요한 그림 수를 계산하고 빈 그림그래프를 완성해요.",
      },
    },
    {
      number: 9,
      phase: "생각 나누기",
      minutes: 3,
      kind: "errorDetective",
      title: "어디에서 생각이 갈렸을까요?",
      intent:
        "대표 오답을 학생의 부족으로 규정하지 않고 사고 과정의 갈림길로 다루어, 범례 누락과 일부 행 누락을 구분한다.",
      teacherMove:
        "오답을 고친 뒤 끝내지 말고 '어느 단계에서 다시 확인하면 될까?'를 네 단계 카드와 연결한다.",
      studentAction: "생각 A/B가 놓친 단계를 찾아 수정 문장을 쓴다.",
      evidence: "학생이 '그림 수만 셈'과 '한 행만 계산함'을 서로 다른 오류로 구분하는지 본다.",
      data: {
        cases: [
          { label: "생각 A", text: "네모가 모두 5개라서 5그루예요.", missed: "범례 적용" },
          { label: "생각 B", text: "A만 계산해서 3×10=30그루예요.", missed: "행 고르기" },
        ],
      },
      worksheet: {
        file: "activity-09-error-detective.png",
        title: "오류 탐정 카드",
        instruction: "각 생각이 놓친 단계를 찾고 더 정확한 설명으로 바꿔요.",
      },
    },
    {
      number: 10,
      phase: "수업 정리 · 나가기 표",
      minutes: 2,
      kind: "exit",
      title: "세 문제로 오늘의 생각을 확인해요",
      intent:
        "읽기, 완성, 핵심 어휘의 세 증거를 짧게 수집해 다음 차시의 전체·소집단·개별 확인을 결정한다.",
      teacherMove:
        "정답을 즉시 공개하지 않고, 활동지를 걷어 범례 적용 오류와 역관계 오류를 구분해 기록한다.",
      studentAction: "각 문항에 식이나 짧은 까닭을 남긴다.",
      evidence: "범례 누락, 비교 순서, 역연산의 세 신호를 서로 섞지 않고 확인한다.",
      data: {
        items: [
          "● 한 개가 3명일 때, ● 5개와 ● 3개는 몇 명 차이일까요?",
          "★ 한 개가 5권일 때, 25권을 나타내려면 ★가 몇 개 필요할까요?",
          "그림그래프를 읽을 때 그림 수보다 먼저 확인할 것은 무엇일까요?",
        ],
      },
      worksheet: {
        file: "activity-10-exit-ticket.png",
        title: "나가기 표",
        instruction: "세 문제에 답하고 풀이 흔적을 한 줄씩 남겨요.",
      },
    },
    {
      number: 11,
      phase: "수업 닫기",
      minutes: 1,
      kind: "summary",
      title: "그림 수가 아니라\n그림이 뜻하는 수를 읽어요",
      intent:
        "오늘의 사고 경로를 세 문장으로 압축하고, 다음 차시의 표→그림그래프 구성 활동으로 자연스럽게 연결한다.",
      teacherMove:
        "학생이 세 문장 중 하나를 골라 자기 말로 다시 말하게 하고 다음 질문을 남긴다.",
      studentAction: "가장 도움이 된 단계를 고르고 다음 차시 질문을 예상한다.",
      evidence: "학생이 자신의 점검 지점을 구체적인 단계 이름으로 말하는지 본다.",
      data: {
        takeaways: [
          "묻는 행의 그림을 빠짐없이 센다.",
          "그림 수에 범례를 한 번 적용한다.",
          "실제 수량으로 바꾼 뒤 비교한다.",
        ],
        next: "표의 수를 그림그래프로 바꾸려면 어떤 범례가 좋을까요?",
      },
      worksheet: {
        file: "activity-11-reflection.png",
        title: "한 문장 돌아보기",
        instruction: "오늘 가장 도움이 된 단계를 고르고 까닭을 적어요.",
      },
    },
  ],
  answerKey: {
    2: "생각 B. 별 4개×5권=20권.",
    5: "5, 10, 15, 20; 4×5=20권.",
    6: "첫째 줄 8개, 둘째 줄 4개, 차이 4개.",
    7: "두 공원 50그루, A가 B보다 10그루 더 많다.",
    8: "아래 칸 별 5개, 위 칸보다 2개 더.",
    9: "생각 A는 범례 적용을, 생각 B는 두 행 모두 선택·계산하는 단계를 놓쳤다.",
    10: "6명, 별 5개, 범례.",
  },
};

module.exports = lesson;
