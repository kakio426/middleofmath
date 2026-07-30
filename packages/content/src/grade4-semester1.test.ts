import { describe, expect, it } from "vitest";
import { validateCoverageBlueprint } from "./coverage";
import {
  grade34LearningMapSnapshot,
  grade4Semester1Crosswalk,
  inspectCurriculumCrosswalk
} from "./curriculum-crosswalk";
import { inspectDiagnosticIntegrity } from "./diagnostic-integrity";
import { grade4Semester1Diagnosis } from "./grade4-semester1";
import { grade4Semester1CoverageBlueprint } from "./grade4-semester1-coverage";
import { diagnosisContentChecksum } from "./integrity-digest";
import { validateDiagnosisSet } from "./schema";

describe("4학년 1학기 A1 진단 콘텐츠", () => {
  it("큰 수와 각도를 2개 단원·12개 단계·24개 판단으로 고정한다", () => {
    expect(grade4Semester1Diagnosis.manifest).toMatchObject({
      id: "grade4-semester1",
      version: "1.0.0",
      grade: 4,
      semester: 1,
      status: "review",
      estimatedMinutes: 12
    });
    expect(grade4Semester1Diagnosis.manifest.units).toEqual([
      { id: "large-numbers", order: 1, title: "큰 수" },
      { id: "angles", order: 2, title: "각도" }
    ]);
    expect(grade4Semester1Diagnosis.curriculumAnchors.map(
      (anchor) => anchor.id
    )).toEqual([
      "[4수01-01]",
      "[4수01-02]",
      "[4수03-02]",
      "[4수03-24]",
      "[4수03-25]"
    ]);
    expect(grade4Semester1Diagnosis.learnerStages).toHaveLength(12);
    expect(grade4Semester1Diagnosis.judgments).toHaveLength(24);
  });

  it("스키마·checksum·A1 배치·진단 무결성 게이트를 모두 통과한다", () => {
    expect(grade4Semester1Diagnosis.manifest.checksum).toBe(
      "0cf12964a5d2a47f0e6ba0cea738d87bea8e649fbf73664384b95d6e6965f4f1"
    );
    expect(grade4Semester1Diagnosis.manifest.checksum).toBe(
      diagnosisContentChecksum(grade4Semester1Diagnosis)
    );
    expect(validateDiagnosisSet(grade4Semester1Diagnosis)).toEqual({
      valid: true,
      issues: []
    });

    const result = inspectDiagnosticIntegrity({
      content: grade4Semester1Diagnosis,
      setKey: grade4Semester1Diagnosis.manifest.id,
      targetVersion: grade4Semester1Diagnosis.manifest.version
    });
    expect(result.issues.filter((issue) => issue.severity === "error")).toEqual(
      []
    );
    expect(result.valid).toBe(true);
    expect(result.gates?.[0]).toMatchObject({
      enforced: true,
      valid: true,
      blueprintRevision: "2026-07-30.2",
      crosswalkRevision: "2026-07-30.2"
    });
  });

  it("각 단계가 서로 다른 direct·transfer 판단을 하나씩 가진다", () => {
    expect(validateCoverageBlueprint(
      grade4Semester1Diagnosis,
      grade4Semester1CoverageBlueprint
    )).toEqual({ valid: true, issues: [] });

    for (const stage of grade4Semester1CoverageBlueprint.stages) {
      expect(stage.evidence.map((item) => item.kind).sort()).toEqual([
        "direct",
        "transfer"
      ]);
      expect(new Set(stage.evidence.map((item) => item.judgmentId)).size).toBe(
        2
      );
    }
  });

  it("공식 앵커의 열두 절을 독립 단계로 관찰한다", () => {
    const expected = {
      "[4수01-01]": [
        "large-number.place-value",
        "large-number.positional-notation",
        "large-number.read-write"
      ],
      "[4수01-02]": [
        "large-number.sequence",
        "large-number.compare",
        "large-number.compare-reasoning"
      ],
      "[4수03-02]": [
        "angle.right-angle",
        "angle.classify"
      ],
      "[4수03-24]": [
        "angle.protractor-measure",
        "angle.estimate"
      ],
      "[4수03-25]": [
        "angle.triangle-angle-sum",
        "angle.quadrilateral-angle-sum"
      ]
    };
    expect(Object.fromEntries(
      Object.entries(expected).map(([anchorId, stageIds]) => [
        anchorId,
        grade4Semester1Diagnosis.learnerStages
          .filter((stage) => stage.curriculumAnchorIds.includes(anchorId))
          .map((stage) => stage.id)
      ])
    )).toEqual(expected);
  });

  it("자리표는 필요한 네 판단에만 쓰고 자리 이름 문항은 정답을 강조하지 않는다", () => {
    const chartJudgments = grade4Semester1Diagnosis.judgments.filter(
      (judgment) => judgment.visual.kind === "place-value-chart"
    );
    expect(chartJudgments.map((judgment) => judgment.id)).toEqual([
      "g4s1-large-01",
      "g4s1-large-02",
      "g4s1-large-03",
      "g4s1-large-04"
    ]);
    const placeName = chartJudgments.find((judgment) =>
      judgment.visual.kind === "place-value-chart"
      && judgment.visual.ask === "place-name"
    );
    expect(placeName?.visual).toEqual({
      kind: "place-value-chart",
      digits: [8, 4, 1, 6, 2, 9],
      ask: "place-name"
    });
  });

  it("자리 이름 문항의 실제 열과 정답 키가 일치한다", () => {
    const placeNames = [
      "억의 자리",
      "천만의 자리",
      "백만의 자리",
      "십만의 자리",
      "만의 자리",
      "천의 자리",
      "백의 자리",
      "십의 자리",
      "일의 자리"
    ];
    const judgment = grade4Semester1Diagnosis.judgments.find(
      (candidate) => candidate.id === "g4s1-large-02"
    );
    expect(judgment?.visual.kind).toBe("place-value-chart");
    if (!judgment || judgment.visual.kind !== "place-value-chart") {
      throw new Error("자리 이름 판단의 자리표를 찾지 못했습니다.");
    }
    const renderedPlaceNames = placeNames.slice(
      placeNames.length - judgment.visual.digits.length
    );
    const targetIndexes = judgment.visual.digits.flatMap((digit, index) =>
      digit === 4 ? [index] : []
    );
    expect(targetIndexes).toHaveLength(1);
    expect(judgment.choices.find((choice) => choice.correct)?.label).toBe(
      renderedPlaceNames[targetIndexes[0]]
    );
  });

  it("위치적 기수법의 전이 판단은 숫자만 바꾼 복사 문제가 아니다", () => {
    const direct = grade4Semester1Diagnosis.judgments.find(
      (judgment) => judgment.id === "g4s1-large-03"
    );
    const transfer = grade4Semester1Diagnosis.judgments.find(
      (judgment) => judgment.id === "g4s1-large-04"
    );
    expect(direct?.prompt).toContain("값의 몇 배");
    expect(transfer?.context).toContain("옮긴다고");
    expect(direct?.choices.find((choice) => choice.correct)?.label).toBe(
      "100배"
    );
    expect(transfer?.choices.find((choice) => choice.correct)?.label).toBe(
      "1,000배"
    );
    expect(direct?.choices.map((choice) => choice.id)).not.toEqual(
      transfer?.choices.map((choice) => choice.id)
    );
  });

  it("학생 문구에 수동 줄바꿈·개발용 표현을 넣지 않는다", () => {
    const copy = grade4Semester1Diagnosis.judgments.flatMap((judgment) => [
      judgment.context ?? "",
      judgment.prompt,
      ...judgment.choices.map((choice) => choice.label)
    ]);
    expect(copy.some((text) => /[\r\n]/.test(text))).toBe(false);
    expect(copy.join(" ")).not.toMatch(
      /진단|검수|리뷰|메타데이터|direct|transfer|렌더/
    );
  });

  it("각도 시각 자료는 정답 숫자를 직접 적지 않고 필요한 수학 정보만 담는다", () => {
    const angleJudgments = grade4Semester1Diagnosis.judgments.filter(
      (judgment) => judgment.unitId === "angles"
    );
    expect(angleJudgments).toHaveLength(12);
    expect(angleJudgments.filter(
      (judgment) => judgment.visual.kind === "angle-figure"
    )).toHaveLength(8);
    expect(angleJudgments.filter(
      (judgment) => judgment.visual.kind === "polygon-angle-diagram"
    )).toHaveLength(4);

    for (const judgment of angleJudgments) {
      if (judgment.visual.kind === "angle-figure") {
        expect(judgment.visual.degrees).toBeGreaterThan(0);
        expect(judgment.visual.degrees).toBeLessThan(180);
      }
      expect(judgment.choices.map((choice) => choice.label)).not.toContain(
        "180도"
      );
      expect(judgment.choices.map((choice) => choice.label)).not.toContain(
        "360도"
      );
    }
    const missing = angleJudgments.filter(
      (judgment) =>
        judgment.visual.kind === "polygon-angle-diagram"
        && judgment.visual.mode === "find-missing"
    );
    expect(missing).toHaveLength(2);
    for (const judgment of missing) {
      if (judgment.visual.kind !== "polygon-angle-diagram") continue;
      expect(judgment.visual.angles.filter((angle) => angle.value === null))
        .toHaveLength(1);
    }
  });

  it("고정 학습맵과 교차표의 다섯 앵커·열두 단계를 오류 없이 연결한다", () => {
    const result = inspectCurriculumCrosswalk({
      content: grade4Semester1Diagnosis,
      setKey: grade4Semester1Diagnosis.manifest.id,
      targetVersion: grade4Semester1Diagnosis.manifest.version
    });
    expect(grade34LearningMapSnapshot.standards).toHaveLength(47);
    expect(grade4Semester1Crosswalk.anchorRows).toHaveLength(5);
    expect(grade4Semester1Crosswalk.stageRows).toHaveLength(12);
    expect(result.issues.filter((issue) => issue.severity === "error")).toEqual(
      []
    );
    expect(result.issues.map((issue) => issue.code)).toEqual([
      "CW_UPSTREAM_CANDIDATE_DATA"
    ]);
  });
});
