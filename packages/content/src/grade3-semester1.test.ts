import { describe, expect, it } from "vitest";
import { validateCoverageBlueprint } from "./coverage";
import {
  grade3Semester1Crosswalk,
  grade3Semester1LearningMapSnapshot,
  inspectCurriculumCrosswalk
} from "./curriculum-crosswalk";
import { diagnosisContentChecksum } from "./integrity-digest";
import { grade3Semester1Diagnosis } from "./grade3-semester1";
import { grade3Semester1CoverageBlueprint } from "./grade3-semester1-coverage";
import { grade3Semester2Diagnosis } from "./grade3-semester2";
import { validateDiagnosisSet } from "./schema";

describe("3학년 1학기 선수 진단 콘텐츠", () => {
  it("고정된 4개 단원·8개 단계·16개 판단을 스키마와 checksum으로 검증한다", () => {
    expect(grade3Semester1Diagnosis.manifest).toMatchObject({
      id: "grade3-semester1",
      version: "1.0.0",
      grade: 3,
      semester: 1,
      status: "review"
    });
    expect(grade3Semester1Diagnosis.manifest.units).toHaveLength(4);
    expect(grade3Semester1Diagnosis.learnerStages).toHaveLength(8);
    expect(grade3Semester1Diagnosis.judgments).toHaveLength(16);
    expect(grade3Semester1Diagnosis.manifest.checksum).toBe(
      "0656d583e8bf2987f456e47887a0d7243f6b611a4b586f45c11eeba7dca88112"
    );
    expect(grade3Semester1Diagnosis.manifest.checksum).toBe(
      diagnosisContentChecksum(grade3Semester1Diagnosis)
    );
    expect(validateDiagnosisSet(grade3Semester1Diagnosis)).toEqual({
      valid: true,
      issues: []
    });
  });

  it("검증된 5개 성취기준만 사용하고 잘못 제안됐던 평면도형 코드를 넣지 않는다", () => {
    const anchorIds = grade3Semester1Diagnosis.curriculumAnchors.map(
      (anchor) => anchor.id
    );
    expect(anchorIds).toEqual([
      "[4수01-04]",
      "[4수01-05]",
      "[4수01-06]",
      "[4수01-09]",
      "[4수03-16]"
    ]);
    expect(anchorIds).not.toContain("[4수03-05]");
    expect(JSON.stringify(grade3Semester1Diagnosis)).not.toContain("[4수03-05]");
  });

  it("각 단계에 서로 다른 직접 확인과 적용·전이 판단을 하나씩 둔다", () => {
    expect(
      validateCoverageBlueprint(
        grade3Semester1Diagnosis,
        grade3Semester1CoverageBlueprint
      )
    ).toEqual({ valid: true, issues: [] });

    for (const stage of grade3Semester1CoverageBlueprint.stages) {
      expect(stage.evidence.map((item) => item.kind).sort(), stage.stageId).toEqual([
        "direct",
        "transfer"
      ]);
      expect(
        new Set(stage.evidence.map((item) => item.judgmentId)).size,
        stage.stageId
      ).toBe(2);
    }
  });

  it("나눗셈 전이는 식의 빈칸으로, 분수 등분할은 실제 그림으로 확인한다", () => {
    const divisionTransfer = grade3Semester1Diagnosis.judgments.find(
      (judgment) => judgment.id === "g3s1-div-02"
    );
    expect(divisionTransfer).toMatchObject({
      prompt: "5×□=20에서 □에 알맞은 수는 무엇일까요?",
      visual: { kind: "array", rows: 5, columns: 4 }
    });

    const fractionJudgments = grade3Semester1Diagnosis.judgments.filter(
      (judgment) => judgment.learnerStageId === "fraction.equal-partition"
    );
    expect(fractionJudgments).toHaveLength(2);
    expect(
      fractionJudgments.every(
        (judgment) => judgment.visual.kind === "partition-diagrams"
      )
    ).toBe(true);
    expect(fractionJudgments[0].prompt).not.toBe(fractionJudgments[1].prompt);
  });

  it("초3-1 곱셈 선행 판단을 초3-2의 부분곱 계산 문항과 중복하지 않는다", () => {
    const prerequisite = grade3Semester1Diagnosis.judgments.find(
      (judgment) => judgment.id === "g3s1-mul-03"
    );
    const semester2 = grade3Semester2Diagnosis.judgments.find(
      (judgment) => judgment.id === "g3s2-mul-01"
    );
    expect(prerequisite?.prompt).toContain("나누어 계산한 식");
    expect(prerequisite?.choices.map((choice) => choice.label)).toEqual([
      "20×3=60 → 3×3=9 → 60+9=69",
      "2×3=6 → 3×3=9 → 6+9=15",
      "23+3=26"
    ]);
    expect(prerequisite?.prompt).not.toBe(semester2?.prompt);
    expect(prerequisite?.choices.map((choice) => choice.label)).not.toEqual(
      semester2?.choices.map((choice) => choice.label)
    );
  });

  it("길이 문항 4개 모두 대상 또는 단위 관계를 눈으로 확인하게 한다", () => {
    const lengthJudgments = grade3Semester1Diagnosis.judgments.filter(
      (judgment) => judgment.unitId === "length"
    );
    expect(lengthJudgments).toHaveLength(4);
    expect(lengthJudgments.map((judgment) => judgment.visual.kind)).toEqual([
      "item-collection",
      "item-collection",
      "length-relation",
      "length-relation"
    ]);
  });

  it("고정 학습맵에는 18개 코드가 있고 초3-1 교차표는 오류 없이 자문 경고만 남긴다", () => {
    const result = inspectCurriculumCrosswalk({
      content: grade3Semester1Diagnosis,
      setKey: grade3Semester1Diagnosis.manifest.id,
      targetVersion: grade3Semester1Diagnosis.manifest.version
    });

    expect(grade3Semester1LearningMapSnapshot.standards).toHaveLength(18);
    expect(grade3Semester1Crosswalk.anchorRows).toHaveLength(5);
    expect(grade3Semester1Crosswalk.stageRows).toHaveLength(8);
    expect(
      grade3Semester1Crosswalk.stageRows.every(
        (row) => row.status === "topic-partial"
      )
    ).toBe(true);
    expect(result.issues.filter((issue) => issue.severity === "error")).toEqual([]);
    expect(result.issues.map((issue) => issue.code)).toEqual([
      "CW_UPSTREAM_CANDIDATE_DATA",
      "CW_PREDECESSOR_ADVISORY"
    ]);
  });
});
