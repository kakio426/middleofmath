import type { DiagnosisSet } from "@middle-of-math/domain";
import type { DiagnosisCoverageBlueprint } from "./coverage";

const signalCopy = {
  teacherInterpretation: "학생이 사용한 생각을 구체적인 풀이 과정과 함께 확인합니다.",
  teachingMove: "같은 수를 다른 표상으로 다시 나타내고 이유를 말하게 합니다.",
  parentSummary: "수의 관계를 여러 방법으로 설명하는 연습을 하고 있습니다.",
  homePrompt: "작은 물건을 세어 보고 어떻게 셌는지 서로 이야기해 보세요."
};

export const passingDiagnosticIntegritySet: DiagnosisSet = {
  manifest: {
    id: "diagnostic-integrity-fixture",
    version: "1.0.0",
    checksum: "fixture-checksum",
    title: "진단 무결성 통과 예시",
    shortTitle: "통과 예시",
    grade: 3,
    semester: 2,
    curriculum: "2022-revised",
    status: "review",
    units: [{ id: "counting", order: 1, title: "수 세기" }],
    interactionTypes: [{ type: "choice", version: 1 }],
    estimatedMinutes: 3
  },
  curriculumAnchors: [{
    id: "[4수01-01]",
    label: "큰 수의 자릿값과 수의 관계 이해하기",
    source: "교육부 고시 제2022-33호 [별책 8] 수학과 교육과정"
  }],
  learnerStages: [{
    id: "counting.compose",
    order: 1,
    unitId: "counting",
    title: "십과 일을 묶어 수 구성하기",
    shortTitle: "수 구성",
    curriculumAnchorIds: ["[4수01-01]"],
    prerequisiteStageIds: []
  }],
  signals: [
    {
      id: "counting.ones-only",
      title: "낱개만 세는 경향",
      severity: "low",
      ...signalCopy
    },
    {
      id: "counting.tens-only",
      title: "십 묶음만 세는 경향",
      severity: "high",
      ...signalCopy
    },
    {
      id: "needs-scaffold",
      title: "도움이 필요한 반응",
      severity: "medium",
      ...signalCopy
    },
    {
      id: "needs-review",
      title: "교사 확인이 필요한 반응",
      severity: "medium",
      ...signalCopy
    }
  ],
  judgments: [
    {
      id: "fixture-direct",
      unitId: "counting",
      learnerStageId: "counting.compose",
      curriculumAnchorIds: ["[4수01-01]"],
      prompt: "십 묶음 2개와 낱개 4개로 만든 수는 무엇일까요?",
      visual: { kind: "none" },
      interaction: { type: "choice", version: 1 },
      choices: [
        { id: "direct-correct", label: "24", correct: true },
        {
          id: "direct-ones",
          label: "6",
          correct: false,
          signalIds: ["counting.ones-only"]
        },
        {
          id: "direct-tens",
          label: "20",
          correct: false,
          signalIds: ["counting.tens-only"]
        }
      ]
    },
    {
      id: "fixture-transfer",
      unitId: "counting",
      learnerStageId: "counting.compose",
      curriculumAnchorIds: ["[4수01-01]"],
      context: "연필을 10자루씩 3상자에 담고 7자루를 더 놓았습니다.",
      prompt: "연필은 모두 몇 자루일까요?",
      visual: { kind: "none" },
      interaction: { type: "choice", version: 1 },
      choices: [
        { id: "transfer-correct", label: "37자루", correct: true },
        {
          id: "transfer-ones",
          label: "10자루",
          correct: false,
          signalIds: ["counting.ones-only"]
        },
        {
          id: "transfer-tens",
          label: "30자루",
          correct: false,
          signalIds: ["counting.tens-only"]
        }
      ]
    }
  ]
};

export const passingDiagnosticIntegrityBlueprint: DiagnosisCoverageBlueprint = {
  diagnosisSetId: passingDiagnosticIntegritySet.manifest.id,
  blueprintRevision: "fixture-1",
  enforcedFromVersion: "1.0.0",
  fallbackSignalIds: ["needs-scaffold", "needs-review"],
  misconceptionTitles: {
    "counting.compose.ones-only": "묶음 수와 낱개 수를 그대로 더함",
    "counting.compose.tens-only": "낱개를 빼고 묶음만 셈"
  },
  stages: [{
    stageId: "counting.compose",
    curriculumAnchorIds: ["[4수01-01]"],
    signalIds: ["counting.ones-only", "counting.tens-only"],
    evidence: [
      { judgmentId: "fixture-direct", kind: "direct" },
      { judgmentId: "fixture-transfer", kind: "transfer" }
    ]
  }],
  distractors: [
    {
      judgmentId: "fixture-direct",
      choiceId: "direct-ones",
      signalIds: ["counting.ones-only"],
      misconceptionId: "counting.compose.ones-only",
      rationale: "십 묶음과 낱개를 구분하지 않고 보이는 묶음 수만 더했습니다.",
      derivation: "십 묶음 2개와 낱개 4개를 2와 4로 보고 6을 선택합니다."
    },
    {
      judgmentId: "fixture-direct",
      choiceId: "direct-tens",
      signalIds: ["counting.tens-only"],
      misconceptionId: "counting.compose.tens-only",
      rationale: "낱개를 빠뜨리고 십 묶음이 나타내는 수만 답으로 골랐습니다.",
      derivation: "십 묶음 2개만 20으로 바꾸고 낱개 4개를 더하지 않습니다."
    },
    {
      judgmentId: "fixture-transfer",
      choiceId: "transfer-ones",
      signalIds: ["counting.ones-only"],
      misconceptionId: "counting.compose.ones-only",
      rationale: "상자와 낱개를 각각 하나의 항목으로 세어 수의 크기를 놓쳤습니다.",
      derivation: "상자 3개와 낱개 7개를 단순히 더해 10자루를 선택합니다."
    },
    {
      judgmentId: "fixture-transfer",
      choiceId: "transfer-tens",
      signalIds: ["counting.tens-only"],
      misconceptionId: "counting.compose.tens-only",
      rationale: "상자 속 연필만 계산하고 밖에 놓인 낱개를 합치지 않았습니다.",
      derivation: "10자루씩 3상자만 계산한 30자루를 답으로 선택합니다."
    }
  ]
};
