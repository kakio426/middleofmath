import { describe, expect, it } from "vitest";
import {
  grade5Semester2Diagnosis,
  grade6Semester1Diagnosis,
  grade6Semester2Diagnosis
} from "@middle-of-math/content/runtime";
import { createPairedEvidenceDemoProfiles } from "./teacher-demo-profiles";

describe("상위 학년 교사 데모 근거", () => {
  it.each([
    grade5Semester2Diagnosis,
    grade6Semester1Diagnosis,
    grade6Semester2Diagnosis
  ])("$manifest.id에 반복·단일 관찰을 함께 만든다", (content) => {
    const profiles = createPairedEvidenceDemoProfiles(content);
    const firstStageId = content.learnerStages[0].id;
    const firstStageQuestions = content.judgments.filter(
      (judgment) => judgment.learnerStageId === firstStageId
    );

    expect(Object.keys(profiles["student-03"])).toEqual(
      firstStageQuestions.map((judgment) => judgment.id)
    );
    expect(Object.keys(profiles["student-07"])).toEqual([
      firstStageQuestions[0].id
    ]);
    expect(Object.keys(profiles["student-12"])).toHaveLength(2);
    expect(profiles["student-18"]).toEqual({});
  });
});
