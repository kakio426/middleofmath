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

describe("4학년 1학기 A1·A2 진단 콘텐츠", () => {
  it("승인된 여섯 단원을 33개 단계·66개 판단으로 고정한다", () => {
    expect(grade4Semester1Diagnosis.manifest).toMatchObject({
      id: "grade4-semester1",
      version: "1.4.0",
      grade: 4,
      semester: 1,
      status: "review",
      estimatedMinutes: 33
    });
    expect(grade4Semester1Diagnosis.manifest.units).toEqual([
      { id: "large-numbers", order: 1, title: "큰 수" },
      { id: "angles", order: 2, title: "각도" },
      { id: "multiplication-division", order: 3, title: "곱셈과 나눗셈" },
      { id: "figure-transform", order: 4, title: "평면도형의 이동" },
      { id: "bar-graphs", order: 5, title: "막대그래프" },
      { id: "patterns-relations", order: 6, title: "규칙과 관계" }
    ]);
    expect(grade4Semester1Diagnosis.curriculumAnchors.map(
      (anchor) => anchor.id
    )).toEqual([
      "[4수01-01]",
      "[4수01-02]",
      "[4수03-02]",
      "[4수03-24]",
      "[4수03-25]",
      "[4수03-04]",
      "[4수03-05]",
      "[4수02-01]",
      "[4수02-02]",
      "[4수02-03]",
      "[4수04-01]",
      "[4수04-03]",
      "[4수01-04]",
      "[4수01-05]",
      "[4수01-07]",
      "[4수01-08]"
    ]);
    expect(grade4Semester1Diagnosis.learnerStages).toHaveLength(33);
    expect(grade4Semester1Diagnosis.judgments).toHaveLength(66);
  });

  it("스키마·checksum·A2 배치·진단 무결성 게이트를 모두 통과한다", () => {
    expect(grade4Semester1Diagnosis.manifest.checksum).toBe(
      "47bc36ddc83e406e82a716feaf3d6f52fd7706dabb0673fa0c95fd4342988109"
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
      blueprintRevision: "2026-07-31.6",
      crosswalkRevision: "2026-07-31.6"
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
      ],
      "[4수03-04]": [
        "figure-transform.slide",
        "figure-transform.flip-left-right",
        "figure-transform.flip-up-down",
        "figure-transform.rotate"
      ],
      "[4수03-05]": [
        "figure-transform.point-move"
      ],
      "[4수02-01]": [
        "patterns-relations.number-rule",
        "patterns-relations.figure-rule",
        "patterns-relations.rule-as-expression"
      ],
      "[4수02-02]": [
        "patterns-relations.calc-array-rule"
      ],
      "[4수02-03]": [
        "patterns-relations.equal-sign"
      ],
      "[4수04-01]": [
        "bar-graph.scale",
        "bar-graph.read-value",
        "bar-graph.compare",
        "bar-graph.table-match"
      ],
      "[4수04-03]": [
        "bar-graph.table-match",
        "bar-graph.inquiry"
      ],
      "[4수01-04]": [
        "mul-div.partial-product-place",
        "mul-div.product-combine"
      ],
      "[4수01-05]": [
        "mul-div.multiplication-check"
      ],
      "[4수01-07]": [
        "mul-div.quotient-place",
        "mul-div.quotient-adjust"
      ],
      "[4수01-08]": [
        "mul-div.estimate"
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

  it("곱셈과 나눗셈은 그림 없이도 읽히는 짧은 문장과 검산 가능한 답을 사용한다", () => {
    const judgments = grade4Semester1Diagnosis.judgments.filter(
      (judgment) => judgment.unitId === "multiplication-division"
    );
    expect(judgments).toHaveLength(12);
    expect(judgments.every((judgment) => judgment.visual.kind === "none"))
      .toBe(true);

    const studentCopy = judgments.flatMap((judgment) => [
      judgment.context ?? "",
      judgment.prompt,
      ...judgment.choices.map((choice) => choice.label)
    ]);
    expect(studentCopy.join(" ")).not.toMatch(
      /부분곱|알고리즘|최적|효율적|전략|메타인지|추론 과정|판단 근거/
    );
    expect(Math.max(...studentCopy.map((text) => text.length))).toBeLessThan(
      48
    );

    const correctById = Object.fromEntries(
      judgments.map((judgment) => [
        judgment.id,
        judgment.choices.find((choice) => choice.correct)?.label
      ])
    );
    expect(correctById).toEqual({
      "g4s1-muldiv-01": "4,260",
      "g4s1-muldiv-02": "2,960권",
      "g4s1-muldiv-03": "3,848",
      "g4s1-muldiv-04": "7,520개",
      "g4s1-muldiv-05": "십의 자리",
      "g4s1-muldiv-06": "두 자리 수",
      "g4s1-muldiv-07": "14로 크게 합니다",
      "g4s1-muldiv-08": "15로 작게 합니다",
      "g4s1-muldiv-09": "23×12+19=295",
      "g4s1-muldiv-10": "32×15+20=500",
      "g4s1-muldiv-11": "8,000",
      "g4s1-muldiv-12": "20개쯤"
    });
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

  it("도형 이동 자료는 지정한 이동과 좌표가 일치하고 점 이동을 도형 이동으로 바꾸지 않는다", () => {
    const transformJudgments = grade4Semester1Diagnosis.judgments.filter(
      (judgment) => judgment.unitId === "figure-transform"
    );
    expect(transformJudgments).toHaveLength(10);
    expect(transformJudgments.map((judgment) => judgment.visual.kind).every(
      (kind) => kind === "grid-transform-diagram"
    )).toBe(true);
    expect(transformJudgments.flatMap((judgment) =>
      judgment.visual.kind === "grid-transform-diagram"
        ? [judgment.visual.mode]
        : []
    )).toEqual([
      "slide",
      "slide",
      "flip-left-right",
      "flip-left-right",
      "flip-up-down",
      "flip-up-down",
      "rotate",
      "rotate",
      "point-move",
      "point-move"
    ]);

    const pointMove = transformJudgments.filter(
      (judgment) => judgment.curriculumAnchorIds.includes("[4수03-05]")
    );
    expect(pointMove).toHaveLength(2);
    for (const judgment of pointMove) {
      expect(judgment.visual).toMatchObject({
        kind: "grid-transform-diagram",
        mode: "point-move"
      });
      if (judgment.visual.kind !== "grid-transform-diagram") continue;
      expect(judgment.visual.sourceCells).toBeUndefined();
      expect(judgment.visual.targetCells).toBeUndefined();
      expect(judgment.visual.points?.map((point) => point.label)).toEqual([
        "A",
        "B"
      ]);
    }
    expect(JSON.stringify(transformJudgments)).not.toContain("무늬");
  });

  it("규칙과 관계 자료는 다섯 표현을 두 문항씩 사용하고 정답을 저장하지 않는다", () => {
    const relationJudgments = grade4Semester1Diagnosis.judgments.filter(
      (judgment) => judgment.unitId === "patterns-relations"
    );
    expect(relationJudgments).toHaveLength(10);
    expect(relationJudgments.flatMap((judgment) =>
      judgment.visual.kind === "relation-pattern-diagram"
        ? [judgment.visual.mode]
        : []
    )).toEqual([
      "number-sequence",
      "number-sequence",
      "figure-sequence",
      "figure-sequence",
      "rule-table",
      "rule-table",
      "calculation-array",
      "calculation-array",
      "equal-sign-balance",
      "equal-sign-balance"
    ]);
    const serialized = JSON.stringify(
      relationJudgments.map((judgment) => judgment.visual)
    );
    expect(serialized).not.toMatch(/"answer"|"correct"|"solution"/);
  });

  it("막대그래프는 다섯 관찰 행동을 두 문항씩 다루고 표와 일치하는 후보를 하나만 둔다", () => {
    const barJudgments = grade4Semester1Diagnosis.judgments.filter(
      (judgment) => judgment.unitId === "bar-graphs"
    );
    expect(barJudgments).toHaveLength(10);
    expect(barJudgments.flatMap((judgment) =>
      judgment.visual.kind === "bar-chart-diagram"
        ? [judgment.visual.mode]
        : []
    )).toEqual([
      "unit-value",
      "unit-value",
      "bar-value",
      "bar-value",
      "bar-difference",
      "bar-difference",
      "table-match",
      "table-match",
      "chart-conclusion",
      "chart-conclusion"
    ]);

    const matchingCandidateIds: string[] = [];
    for (const judgment of barJudgments) {
      expect(judgment.visual.kind).toBe("bar-chart-diagram");
      if (judgment.visual.kind !== "bar-chart-diagram") continue;
      const finalTick = judgment.visual.axis.labeledTicks.at(-1);
      expect(finalTick?.index).toBe(judgment.visual.axis.tickCount);
      expect(judgment.visual.axis.labeledTicks[0]).toEqual({
        index: 0,
        value: 0
      });
      if (judgment.visual.mode === "table-match") {
        const step =
          finalTick!.value / finalTick!.index;
        const table = judgment.visual.table!;
        const matches = judgment.visual.candidates!.filter((candidate) =>
          candidate.bars.every(
            (bar, index) =>
              bar.category === table[index]?.category
              && bar.ticks * step === table[index]?.count
          )
        );
        expect(matches, judgment.id).toHaveLength(1);
        matchingCandidateIds.push(matches[0]!.id);
      }
    }
    expect(new Set(matchingCandidateIds)).toEqual(new Set(["가", "나"]));
    expect(JSON.stringify(barJudgments)).not.toMatch(
      /line-chart|freehand|꺾은선그래프|색칠한 막대/
    );
  });

  it("고정 학습맵과 교차표의 열여섯 앵커·서른세 단계를 오류 없이 연결한다", () => {
    const result = inspectCurriculumCrosswalk({
      content: grade4Semester1Diagnosis,
      setKey: grade4Semester1Diagnosis.manifest.id,
      targetVersion: grade4Semester1Diagnosis.manifest.version
    });
    expect(grade34LearningMapSnapshot.standards).toHaveLength(47);
    expect(grade4Semester1Crosswalk.anchorRows).toHaveLength(16);
    expect(grade4Semester1Crosswalk.stageRows).toHaveLength(33);
    expect(result.issues.filter((issue) => issue.severity === "error")).toEqual(
      []
    );
    expect(result.issues.map((issue) => issue.code)).toEqual([
      "CW_UPSTREAM_CANDIDATE_DATA"
    ]);
  });
});
