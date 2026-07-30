import { describe, expect, it } from "vitest";
import type { JudgmentVisual } from "@middle-of-math/domain";
import {
  grade3Semester2CompleteDiagnosis,
  grade3Semester2CoverageBlueprint,
  grade3Semester2Diagnosis
} from "@middle-of-math/content";
import {
  cloneAsDraft,
  collectStudioIssues,
  getStudioCurriculumProvenance,
  issueBelongsToJudgment,
  summarizeDistractorRationales,
  summarizeVisual,
  structurallyEqual,
  updateJudgment
} from "./studio-model";

const measurementVisualSummaries: Array<[JudgmentVisual, string]> = [
  [{ kind: "measurement", amount: 2300, unit: "g" }, "기존 측정 도구 그림"],
  [{
    kind: "unit-relation",
    medium: "capacity",
    given: [{ value: 1, unit: "L" }],
    targetUnit: "mL"
  }, "들이 단위 관계"],
  [{
    kind: "measure-referent",
    medium: "weight",
    object: "watermelon",
    instrument: "scale"
  }, "무게 측정 대상"],
  [{
    kind: "quantity-combine",
    medium: "weight",
    operator: "subtract",
    left: [{ value: 5, unit: "kg" }],
    right: [{ value: 2, unit: "kg" }, { value: 800, unit: "g" }]
  }, "무게의 차"],
  [{
    kind: "length-relation",
    value: 1,
    fromUnit: "m",
    targetUnit: "cm"
  }, "m→cm 길이 단위 관계"],
  [{
    kind: "partition-diagrams",
    diagrams: [{ label: "가", parts: [1, 1, 1, 1], highlightedPart: 0 }]
  }, "1개 등분 그림"]
];

describe("studio model", () => {
  it("published content를 독립적인 draft로 복제한다", () => {
    const draft = cloneAsDraft(grade3Semester2Diagnosis);
    expect(draft.manifest.status).toBe("draft");
    expect(grade3Semester2Diagnosis.manifest.status).toBe("published");
  });

  it("단일 정답 규칙을 발행 오류로 보고한다", () => {
    const draft = cloneAsDraft(grade3Semester2Diagnosis);
    const target = draft.judgments[0];
    const invalid = updateJudgment(draft, target.id, (judgment) => ({
      ...judgment,
      choices: judgment.choices.map((choice) => ({ ...choice, correct: false }))
    }));
    expect(collectStudioIssues(invalid).some((issue) => issue.message.includes("정답 선택지"))).toBe(true);
  });

  it("지원하지 않는 상호작용을 차단한다", () => {
    const draft = cloneAsDraft(grade3Semester2Diagnosis);
    const target = draft.judgments[0];
    const invalid = updateJudgment(draft, target.id, (judgment) => ({
      ...judgment,
      interaction: { type: "number-line", version: 1 }
    }));
    expect(collectStudioIssues(invalid).some((issue) => issue.message.includes("상호작용"))).toBe(true);
  });

  it("JSON 키 순서가 달라도 같은 판단으로 비교한다", () => {
    expect(structurallyEqual({ id: "a", prompt: "질문" }, { prompt: "질문", id: "a" })).toBe(true);
  });

  it.each(measurementVisualSummaries)(
    "측정 시각 자료를 읽기 전용 요약으로 안전하게 표시한다",
    (visual, expected) => {
      const judgment = {
        ...grade3Semester2CompleteDiagnosis.judgments[0],
        visual
      };
      expect(summarizeVisual(judgment)).toBe(expected);
    }
  );

  it("진단 무결성 적용 버전에서는 오류 없이 검수 경고만 보여 준다", () => {
    const issues = collectStudioIssues(
      grade3Semester2CompleteDiagnosis,
      grade3Semester2Diagnosis,
      { setKey: "grade3-semester2", targetVersion: "2.1.0" }
    );
    expect(issues.filter((issue) => issue.level === "error")).toEqual([]);
  });

  it("적용 버전에서 외부 학습맵의 한계를 검수 경고로 보여 준다", () => {
    const issues = collectStudioIssues(
      grade3Semester2CompleteDiagnosis,
      grade3Semester2Diagnosis,
      { setKey: "grade3-semester2", targetVersion: "2.1.0" }
    );
    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: "CW_UPSTREAM_CANDIDATE_DATA",
        level: "warning"
      }),
      expect.objectContaining({
        code: "CW_PREDECESSOR_ADVISORY",
        level: "warning"
      })
    ]));
  });

  it("스튜디오 근거 카드에 고정 버전과 실제 커버리지를 제공한다", () => {
    expect(getStudioCurriculumProvenance()).toMatchObject({
      anchorCount: 17,
      stageCount: 32,
      partialCount: 32,
      gapCount: 0,
      taxonomyVersion: "kr-full-depth-v0.4",
      ontologyVersion: "0.3.0-p3"
    });
  });

  it("적용 전 버전은 경고만 보여 주고 기존 구조 검증을 막지 않는다", () => {
    const issues = collectStudioIssues(
      grade3Semester2Diagnosis,
      undefined,
      { setKey: "grade3-semester2", targetVersion: "1.0.1" }
    );
    expect(issues.filter((issue) => issue.code.startsWith("DI_"))).toEqual([
      expect.objectContaining({
        code: "DI_GATE_NOT_ENFORCED",
        level: "warning"
      })
    ]);
  });

  it("1번 판단의 경로가 12번 판단의 오류를 잘못 포함하지 않는다", () => {
    expect(issueBelongsToJudgment("/judgments/1/choices", 1)).toBe(true);
    expect(issueBelongsToJudgment("/judgments/12/choices", 1)).toBe(false);
  });

  it("오답마다 선택지·오개념·생성 과정·교사 판단을 읽기 전용으로 요약한다", () => {
    const judgment = grade3Semester2CompleteDiagnosis.judgments.find(
      (item) => item.id === "g3s2-frac-11"
    )!;
    const summary = summarizeDistractorRationales(
      grade3Semester2CompleteDiagnosis,
      judgment.id,
      grade3Semester2CoverageBlueprint
    );

    expect(summary).toMatchObject({
      status: "matched",
      items: [
        {
          choiceId: "one-and-two-thirds",
          misconceptionTitle: "몫·분모·분자를 잘못 결합함",
          misconceptionId:
            "fraction.convert.conversion-components-miscombined"
        },
        {
          choiceId: "three-and-one-third",
          misconceptionTitle: "전체 묶음 수를 하나 빠뜨리거나 더함"
        }
      ]
    });
    expect(summary.status === "matched" && summary.sharedSignalRationale).toContain(
      "분모 단위"
    );
  });

  it("선택지 구조가 근거 원장과 달라지면 추측하지 않고 불일치를 알린다", () => {
    const changed = structuredClone(grade3Semester2CompleteDiagnosis);
    const judgment = changed.judgments.find(
      (item) => item.id === "g3s2-frac-11"
    )!;
    judgment.choices[1].id = "changed-choice";

    expect(
      summarizeDistractorRationales(
        changed,
        judgment.id,
        grade3Semester2CoverageBlueprint
      )
    ).toEqual({
      status: "mismatch",
      message: "이 초안의 선택지는 등록된 오답 근거와 일치하지 않습니다.",
      items: []
    });
  });
});
