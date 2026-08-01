import { describe, expect, it } from "vitest";
import { validateCoverageBlueprint } from "./coverage";
import { inspectDiagnosticIntegrity } from "./diagnostic-integrity";
import { diagnosisContentChecksum } from "./integrity-digest";
import { validateDiagnosisSet } from "./schema";
import { grade4Semester2CoverageBlueprint } from "./grade4-semester2-coverage";
import { grade4Semester2Diagnosis } from "./grade4-semester2";

describe("4학년 2학기 단원별 진단", () => {
  it("여섯 단원·30단계·60판단을 독립 활동으로 제공한다", () => {
    expect(grade4Semester2Diagnosis.manifest).toMatchObject({
      id: "grade4-semester2",
      version: "1.4.0",
      grade: 4,
      semester: 2,
      status: "review",
      estimatedMinutes: 30,
      units: [
        { id: "triangles", order: 1, title: "삼각형" },
        {
          id: "fraction-add-subtract",
          order: 2,
          title: "분수의 덧셈과 뺄셈"
        },
        { id: "quadrilaterals", order: 3, title: "사각형" },
        {
          id: "decimal-add-subtract",
          order: 4,
          title: "소수의 덧셈과 뺄셈"
        },
        { id: "polygons", order: 5, title: "다각형" },
        { id: "line-graphs", order: 6, title: "꺾은선그래프" }
      ]
    });
    expect(grade4Semester2Diagnosis.learnerStages).toHaveLength(30);
    expect(grade4Semester2Diagnosis.judgments).toHaveLength(60);
    expect(grade4Semester2Diagnosis.curriculumAnchors.map(
      (anchor) => anchor.id
    )).toEqual([
      "[4수03-08]",
      "[4수03-09]",
      "[4수01-15]",
      "[4수03-03]",
      "[4수03-10]",
      "[4수01-13]",
      "[4수01-14]",
      "[4수01-16]",
      "[4수03-11]",
      "[4수03-12]",
      "[4수04-02]",
      "[4수04-03]"
    ]);
  });

  it("모든 단계에 direct와 transfer 판단이 하나씩 있다", () => {
    expect(validateCoverageBlueprint(
      grade4Semester2Diagnosis,
      grade4Semester2CoverageBlueprint
    )).toEqual({ valid: true, issues: [] });
  });

  it("삼각형 시각은 실제 변·각 자료와 함께 모든 문항에 나타난다", () => {
    const triangleJudgments = grade4Semester2Diagnosis.judgments.filter(
      (judgment) => judgment.unitId === "triangles"
    );
    expect(triangleJudgments).toHaveLength(10);
    expect(triangleJudgments.every(
      (judgment) => judgment.visual.kind === "triangle-figure"
    )).toBe(true);
    expect(validateDiagnosisSet(grade4Semester2Diagnosis)).toEqual({
      valid: true,
      issues: []
    });
  });

  it("그림의 수학 자료로 계산한 이름과 각이 정답 선택지와 일치한다", () => {
    for (const judgment of grade4Semester2Diagnosis.judgments.filter(
      (candidate) => candidate.unitId === "triangles"
    )) {
      const visual = judgment.visual;
      expect(visual.kind, judgment.id).toBe("triangle-figure");
      if (visual.kind !== "triangle-figure") continue;
      const correct = judgment.choices.find((choice) => choice.correct);
      expect(correct, judgment.id).toBeTruthy();

      if (visual.mode === "side-classify" && visual.sides) {
        const uniqueSideCount = new Set(visual.sides).size;
        expect(correct?.label, judgment.id).toBe(
          uniqueSideCount === 1 ? "정삼각형" : "이등변삼각형"
        );
      }
      if (visual.mode === "side-angle" && visual.angles) {
        const equalIndexes = visual.equalSideIndexes ?? [];
        const givenIndex = equalIndexes.find(
          (index) => visual.angles?.[index] !== null
        );
        expect(givenIndex, judgment.id).not.toBeUndefined();
        expect(equalIndexes, judgment.id).toContain(visual.askIndex);
        expect(
          visual.angles.filter((angle) => angle === null),
          judgment.id
        ).toHaveLength(2);
        expect(correct?.label, judgment.id).toBe(
          `${visual.angles[givenIndex!]}°`
        );
      }
      if (visual.mode === "angle-classify" && visual.angles) {
        const angles = visual.angles.map((angle) => angle ?? (
          180 - visual.angles!.reduce<number>(
            (sum, candidate) => sum + (candidate ?? 0),
            0
          )
        ));
        const expectedName = angles.includes(90)
          ? "직각삼각형"
          : Math.max(...angles) > 90
            ? "둔각삼각형"
            : "예각삼각형";
        expect(correct?.label, judgment.id).toBe(expectedName);
      }
    }
  });

  it("학생 문구에 제작자 용어와 수동 줄바꿈이 없다", () => {
    const copy = grade4Semester2Diagnosis.judgments.flatMap((judgment) => [
      judgment.context ?? "",
      judgment.prompt,
      ...judgment.choices.map((choice) => choice.label)
    ]).join(" ");
    expect(copy).not.toMatch(
      /오개념|진단|전략|알고리즘|대변|내각|합동|닮음|통분|약분|기약|최소공배수|분모가 다른|<br|[\r\n]/
    );
  });

  it("manifest checksum은 정규화된 콘텐츠와 일치한다", () => {
    expect(grade4Semester2Diagnosis.manifest.checksum).toBe(
      diagnosisContentChecksum(grade4Semester2Diagnosis)
    );
  });

  it("등록된 배치·교차표·coverage 발행 게이트를 통과한다", () => {
    const result = inspectDiagnosticIntegrity({
      content: grade4Semester2Diagnosis,
      setKey: "grade4-semester2",
      targetVersion: "1.4.0"
    });
    expect(result.valid).toBe(true);
    expect(result.issues.filter(
      (issue) => issue.severity === "error"
    )).toEqual([]);
    expect(result.gates?.[0]).toMatchObject({
      valid: true,
      errorCount: 0,
      warningCount: 1,
      blueprintRevision: "2026-08-01.6",
      crosswalkRevision: "2026-08-01.6",
      crosswalkDigest:
        "sha256:1c3d1772d232824977f73c3920784fde266ce5e71dbb8483e4ac815b50eeea99"
    });
  });
});
