import { describe, expect, it } from "vitest";
import { grade3Semester2Diagnosis } from "./grade3-semester2";
import { parseDiagnosisSet, SUPPORTED_INTERACTIONS, validateDiagnosisSet } from "./schema";

function cloneContent() {
  return structuredClone(grade3Semester2Diagnosis);
}

describe("content studio diagnosis validation", () => {
  it("accepts the existing 3학년 2학기 published baseline", () => {
    const result = validateDiagnosisSet(cloneContent());
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(SUPPORTED_INTERACTIONS).toEqual([
      "choice@1",
      "fraction-bar@1",
      "measurement@1",
      "pictograph@1"
    ]);
  });

  it.each([1, 2, 3, 4, 5, 6] as const)("supports elementary grade %s", (grade) => {
    const content = cloneContent();
    content.manifest.grade = grade;
    expect(validateDiagnosisSet(content).valid).toBe(true);
  });

  it("rejects grades outside 1-6 and unsupported interactions", () => {
    const invalidGrade = cloneContent() as any;
    invalidGrade.manifest.grade = 7;
    expect(validateDiagnosisSet(invalidGrade).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "SCHEMA_INVALID", path: "/manifest/grade" })
    ]));

    const unsupported = cloneContent();
    unsupported.judgments[0].interaction = { type: "number-line", version: 1 };
    const result = validateDiagnosisSet(unsupported);
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "UNSUPPORTED_INTERACTION", path: "/judgments/0/interaction" })
    ]));
  });

  it("rejects broken references, prerequisite cycles, and ambiguous answers", () => {
    const content = cloneContent();
    content.learnerStages[0].prerequisiteStageIds = [content.learnerStages[1].id];
    content.learnerStages[1].prerequisiteStageIds = [content.learnerStages[0].id];
    content.judgments[0].curriculumAnchorIds = ["missing-anchor"];
    content.judgments[0].choices[1].correct = true;
    content.judgments[0].choices[2].signalIds = undefined;

    const result = validateDiagnosisSet(content);
    expect(result.valid).toBe(false);
    expect(result.issues.map((item) => item.code)).toEqual(expect.arrayContaining([
      "PREREQUISITE_CYCLE",
      "UNKNOWN_ANCHOR",
      "SINGLE_CORRECT_REQUIRED",
      "WRONG_CHOICE_SIGNAL_REQUIRED"
    ]));
  });

  it("rejects missing or answer-revealing visual evidence", () => {
    const missingPictograph = cloneContent();
    const pictograph = missingPictograph.judgments.find(
      (judgment) => judgment.interaction.type === "pictograph"
    );
    if (!pictograph) throw new Error("그림그래프 문항이 필요합니다.");
    pictograph.visual = { kind: "none" };
    expect(validateDiagnosisSet(missingPictograph).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "PICTOGRAPH_VISUAL_REQUIRED" })
    ]));

    const revealedGroups = cloneContent();
    const division = revealedGroups.judgments.find(
      (judgment) => judgment.visual.kind === "division-groups"
    );
    if (!division) throw new Error("나눗셈 묶음 문항이 필요합니다.");
    division.prompt = "몇 묶음일까요?";
    expect(validateDiagnosisSet(revealedGroups).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "ANSWER_REVEALING_VISUAL" })
    ]));
  });

  it("accepts semantic measurement visuals and rejects mismatched measurement media", () => {
    const valid = cloneContent();
    valid.judgments[0].visual = {
      kind: "quantity-combine",
      medium: "capacity",
      operator: "subtract",
      left: [{ value: 5, unit: "L" }],
      right: [{ value: 2, unit: "L" }, { value: 750, unit: "mL" }]
    };
    expect(validateDiagnosisSet(valid).valid).toBe(true);

    const wrongUnit = cloneContent();
    wrongUnit.judgments[0].visual = {
      kind: "unit-relation",
      medium: "capacity",
      given: [{ value: 2, unit: "kg" }],
      targetUnit: "mL"
    };
    expect(validateDiagnosisSet(wrongUnit).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "SCHEMA_INVALID" })
    ]));

    const wrongInstrument = cloneContent();
    wrongInstrument.judgments[0].visual = {
      kind: "measure-referent",
      medium: "weight",
      object: "watermelon",
      instrument: "beaker"
    };
    expect(validateDiagnosisSet(wrongInstrument).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "SCHEMA_INVALID" })
    ]));

    const unknownKind = cloneContent() as any;
    unknownKind.judgments[0].visual = { kind: "graduated-cylinder", value: 300 };
    expect(validateDiagnosisSet(unknownKind).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "SCHEMA_INVALID" })
    ]));
  });

  it("accepts a valid place-value chart and rejects answer leakage or bad indexes", () => {
    const valid = cloneContent();
    valid.judgments[0].visual = {
      kind: "place-value-chart",
      digits: [7, 3, 5, 2, 4],
      ask: "value",
      highlightIndexes: [1]
    };
    expect(validateDiagnosisSet(valid).valid).toBe(true);

    const leakedPlaceName = cloneContent();
    leakedPlaceName.judgments[0].visual = {
      kind: "place-value-chart",
      digits: [8, 4, 1, 6, 2],
      ask: "place-name",
      highlightIndexes: [0]
    };
    expect(validateDiagnosisSet(leakedPlaceName).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "SCHEMA_INVALID" })
      ])
    );

    const duplicateIndex = cloneContent();
    duplicateIndex.judgments[0].visual = {
      kind: "place-value-chart",
      digits: [5, 4, 5, 2, 0],
      ask: "value",
      highlightIndexes: [0, 0]
    };
    expect(validateDiagnosisSet(duplicateIndex).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "SCHEMA_INVALID" })
      ])
    );

    const outOfRange = cloneContent();
    outOfRange.judgments[0].visual = {
      kind: "place-value-chart",
      digits: [5, 4, 5, 2, 0],
      ask: "value",
      highlightIndexes: [5]
    };
    expect(validateDiagnosisSet(outOfRange).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "SCHEMA_INVALID" })
      ])
    );
  });

  it("accepts valid angle figures and rejects impossible or leaking mode combinations", () => {
    const validateVisual = (visual: any) => {
      const content = cloneContent() as any;
      content.judgments[0].visual = visual;
      return validateDiagnosisSet(content);
    };

    expect(validateVisual({
      kind: "angle-figure",
      degrees: 125,
      mode: "protractor",
      protractorPlacement: "aligned",
      label: "가"
    }).valid).toBe(true);
    expect(validateVisual({
      kind: "angle-figure",
      degrees: 85,
      mode: "bare",
      referenceRightAngle: true,
      rayLengths: [42, 88]
    }).valid).toBe(true);

    for (const visual of [
      { kind: "angle-figure", degrees: 0, mode: "bare" },
      { kind: "angle-figure", degrees: 180, mode: "bare" },
      {
        kind: "angle-figure",
        degrees: 90,
        mode: "bare",
        protractorPlacement: "aligned"
      }
    ]) {
      expect(validateVisual(visual).issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "SCHEMA_INVALID" })
        ])
      );
    }
  });

  it("enforces missing-angle and claim-verification polygon contracts", () => {
    const validateVisual = (visual: any) => {
      const content = cloneContent() as any;
      content.judgments[0].visual = visual;
      return validateDiagnosisSet(content);
    };

    expect(validateVisual({
      kind: "polygon-angle-diagram",
      polygon: "triangle",
      mode: "find-missing",
      angles: [
        { label: "가", value: 55 },
        { label: "나", value: 80 },
        { label: "다", value: null }
      ]
    }).valid).toBe(true);
    expect(validateVisual({
      kind: "polygon-angle-diagram",
      polygon: "quadrilateral",
      mode: "verify-claim",
      diagonal: true,
      angles: [
        { label: "가", value: 95 },
        { label: "나", value: 100 },
        { label: "다", value: 80 },
        { label: "라", value: 85 }
      ]
    }).valid).toBe(true);

    const invalidVisuals = [
      {
        kind: "polygon-angle-diagram",
        polygon: "triangle",
        mode: "find-missing",
        angles: [
          { label: "가", value: 55 },
          { label: "나", value: 80 },
          { label: "다", value: 30 },
          { label: "라", value: null }
        ]
      },
      {
        kind: "polygon-angle-diagram",
        polygon: "triangle",
        mode: "find-missing",
        angles: [
          { label: "가", value: 55 },
          { label: "나", value: 80 },
          { label: "다", value: 20 }
        ]
      },
      {
        kind: "polygon-angle-diagram",
        polygon: "triangle",
        mode: "find-missing",
        angles: [
          { label: "가", value: 55 },
          { label: "나", value: null },
          { label: "다", value: null }
        ]
      },
      {
        kind: "polygon-angle-diagram",
        polygon: "triangle",
        mode: "find-missing",
        angles: [
          { label: "가", value: 100 },
          { label: "나", value: 90 },
          { label: "다", value: null }
        ]
      },
      {
        kind: "polygon-angle-diagram",
        polygon: "triangle",
        mode: "verify-claim",
        angles: [
          { label: "가", value: 60 },
          { label: "나", value: 70 },
          { label: "다", value: null }
        ]
      },
      {
        kind: "polygon-angle-diagram",
        polygon: "triangle",
        mode: "verify-claim",
        diagonal: true,
        angles: [
          { label: "가", value: 60 },
          { label: "나", value: 70 },
          { label: "다", value: 60 }
        ]
      },
      {
        kind: "polygon-angle-diagram",
        polygon: "triangle",
        mode: "verify-claim",
        angles: [
          { label: "가", value: 60 },
          { label: "가", value: 70 },
          { label: "다", value: 60 }
        ]
      }
    ];

    for (const visual of invalidVisuals) {
      expect(validateVisual(visual).issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "SCHEMA_INVALID" })
        ])
      );
    }
  });

  it("keeps IDs from a previously published base immutable", () => {
    const content = cloneContent();
    content.judgments.shift();
    const result = validateDiagnosisSet(content, { baseContent: grade3Semester2Diagnosis });
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "STABLE_ID_REMOVED", path: "/judgments" })
    ]));
  });

  it("keeps teacher and guardian signal copy independently required", () => {
    const teacherMissing = cloneContent();
    teacherMissing.signals[0].teacherInterpretation = "";
    expect(validateDiagnosisSet(teacherMissing).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "SCHEMA_INVALID", path: "/signals/0/teacherInterpretation" })
    ]));

    const guardianMissing = cloneContent();
    guardianMissing.signals[0].parentSummary = "";
    expect(validateDiagnosisSet(guardianMissing).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "SCHEMA_INVALID", path: "/signals/0/parentSummary" })
    ]));
  });

  it("rejects unknown fields and does not normalize checksum-bearing strings", () => {
    const unknownTopLevel = cloneContent() as any;
    unknownTopLevel.debug = true;
    expect(validateDiagnosisSet(unknownTopLevel).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "SCHEMA_INVALID", path: "/" })
    ]));

    const unknownNested = cloneContent() as any;
    unknownNested.judgments[0].choices[0].debug = true;
    expect(validateDiagnosisSet(unknownNested).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "SCHEMA_INVALID", path: "/judgments/0/choices/0" })
    ]));

    const padded = cloneContent();
    padded.judgments[0].prompt = `  ${padded.judgments[0].prompt}  `;
    expect(parseDiagnosisSet(padded).judgments[0].prompt).toBe(padded.judgments[0].prompt);
  });
});
