import { describe, expect, it } from "vitest";
import { grade3Semester2Diagnosis } from "@middle-of-math/content";
import { cloneAsDraft, collectStudioIssues, structurallyEqual, updateJudgment } from "./studio-model";

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
});
