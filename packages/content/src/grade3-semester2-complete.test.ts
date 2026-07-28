import { describe, expect, it } from "vitest";
import { validateCoverageBlueprint } from "./coverage";
import { grade3Semester2CompleteDiagnosis } from "./grade3-semester2-complete";
import { grade3Semester2CoverageBlueprint } from "./grade3-semester2-coverage";
import { grade3Semester2Diagnosis } from "./grade3-semester2";
import { validateDiagnosisSet } from "./schema";

function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(",")}}`;
  }
  const serialized = JSON.stringify(value);
  if (serialized === undefined) throw new Error("checksum에 직렬화할 수 없는 값입니다.");
  return serialized;
}

async function checksum(
  content = grade3Semester2CompleteDiagnosis
): Promise<string> {
  const checksumInput = {
    ...content,
    manifest: { ...content.manifest, checksum: "" }
  };
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonicalJson(checksumInput))
  );
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0")
  ).join("");
}

describe("3학년 2학기 완성 문제은행", () => {
  it("has a canonical checksum for the v2.0.1 review payload", async () => {
    expect(await checksum()).toBe(grade3Semester2CompleteDiagnosis.manifest.checksum);
  });

  it("keeps v1 immutable and publishes the expanded bank as a separate v2 review", () => {
    expect(grade3Semester2Diagnosis.manifest.version).toBe("1.0.0");
    expect(grade3Semester2Diagnosis.judgments).toHaveLength(12);
    expect(grade3Semester2CompleteDiagnosis.manifest.version).toBe("2.0.1");
    expect(grade3Semester2CompleteDiagnosis.manifest.status).toBe("review");

    const result = validateDiagnosisSet(grade3Semester2CompleteDiagnosis, {
      baseContent: grade3Semester2Diagnosis
    });
    expect(result).toEqual({ valid: true, issues: [] });
  });

  it("keeps the complete v1 payload behind its published checksum", async () => {
    expect(await checksum(grade3Semester2Diagnosis)).toBe(
      grade3Semester2Diagnosis.manifest.checksum
    );
  });

  it("preserves every published unit, stage, signal, judgment, and choice ID", () => {
    const completeIds = {
      units: new Set(grade3Semester2CompleteDiagnosis.manifest.units.map((item) => item.id)),
      stages: new Set(grade3Semester2CompleteDiagnosis.learnerStages.map((item) => item.id)),
      signals: new Set(grade3Semester2CompleteDiagnosis.signals.map((item) => item.id)),
      judgments: new Map(grade3Semester2CompleteDiagnosis.judgments.map((item) => [item.id, item]))
    };

    expect(grade3Semester2Diagnosis.manifest.units.every((item) => completeIds.units.has(item.id))).toBe(true);
    expect(grade3Semester2Diagnosis.learnerStages.every((item) => completeIds.stages.has(item.id))).toBe(true);
    expect(grade3Semester2Diagnosis.signals.every((item) => completeIds.signals.has(item.id))).toBe(true);
    for (const published of grade3Semester2Diagnosis.judgments) {
      const complete = completeIds.judgments.get(published.id);
      expect(complete).toBeDefined();
      expect(published.choices.every((choice) => complete?.choices.some((item) => item.id === choice.id))).toBe(true);
      expect(complete?.choices).toEqual(published.choices);
    }
  });

  it("decomposes six units into 32 ordered stages and 64 judgments", () => {
    expect(grade3Semester2CompleteDiagnosis.manifest.units).toHaveLength(6);
    expect(grade3Semester2CompleteDiagnosis.learnerStages).toHaveLength(32);
    expect(grade3Semester2CompleteDiagnosis.judgments).toHaveLength(64);
    expect(grade3Semester2CompleteDiagnosis.learnerStages.map((stage) => stage.order)).toEqual(
      Array.from({ length: 32 }, (_, index) => index + 1)
    );

    const expectedCounts = {
      multiplication: 4,
      division: 5,
      circle: 4,
      fraction: 7,
      measurement: 7,
      pictograph: 5
    };
    for (const [unitId, expected] of Object.entries(expectedCounts)) {
      expect(
        grade3Semester2CompleteDiagnosis.learnerStages.filter((stage) => stage.unitId === unitId)
      ).toHaveLength(expected);
    }
  });

  it("covers the approved 3-2 anchors without splitting the 3-4 grade-band IDs", () => {
    expect(grade3Semester2CompleteDiagnosis.curriculumAnchors.map((anchor) => anchor.id)).toEqual([
      "[4수01-04]",
      "[4수01-05]",
      "[4수01-06]",
      "[4수03-06]",
      "[4수03-07]",
      "[4수01-09]",
      "[4수01-10]",
      "[4수01-11]",
      "[4수03-17]",
      "[4수03-19]",
      "[4수03-20]",
      "[4수04-01]",
      "[4수01-08]",
      "[4수03-18]",
      "[4수03-21]",
      "[4수03-22]",
      "[4수03-23]"
    ]);

    expect(
      grade3Semester2CompleteDiagnosis.curriculumAnchors.find(
        (anchor) => anchor.id === "[4수03-17]"
      )?.label
    ).toBe("들이의 단위를 알고 들이를 어림하고 재기");
    expect(
      grade3Semester2CompleteDiagnosis.curriculumAnchors.find(
        (anchor) => anchor.id === "[4수03-20]"
      )?.label
    ).toBe("무게의 단위를 알고 무게를 어림하고 재기");
    expect(
      grade3Semester2CompleteDiagnosis.learnerStages.find(
        (stage) => stage.id === "circle.diameter"
      )?.curriculumAnchorIds
    ).toEqual(["[4수03-06]"]);
  });

  it("gives every stage independent direct and transfer evidence", () => {
    const result = validateCoverageBlueprint(
      grade3Semester2CompleteDiagnosis,
      grade3Semester2CoverageBlueprint
    );
    expect(result).toEqual({ valid: true, issues: [] });
    for (const coverage of grade3Semester2CoverageBlueprint.stages) {
      expect(coverage.evidence).toHaveLength(2);
      expect(new Set(coverage.evidence.map((item) => item.judgmentId)).size).toBe(2);
      expect(coverage.evidence.map((item) => item.kind).sort()).toEqual(["direct", "transfer"]);
    }
  });

  it("presents each stage as a direct-then-transfer pair in learner order", () => {
    expect(grade3Semester2CompleteDiagnosis.judgments.map((item) => item.id)).toEqual(
      grade3Semester2CoverageBlueprint.stages.flatMap((coverage) =>
        coverage.evidence.map((evidence) => evidence.judgmentId)
      )
    );
  });

  it("includes three-digit by one-digit multiplication without answer-revealing measurement visuals", () => {
    const multiplicationCopy = grade3Semester2CompleteDiagnosis.judgments
      .filter((item) => item.unitId === "multiplication")
      .map((item) => `${item.context ?? ""} ${item.prompt}`)
      .join("\n");
    expect(multiplicationCopy).toMatch(/\d{3}×\d/);

    const measurementJudgments = grade3Semester2CompleteDiagnosis.judgments
      .filter((item) => item.unitId === "measurement");
    expect(measurementJudgments).toHaveLength(14);
    expect(measurementJudgments.every((item) => item.visual.kind === "none")).toBe(true);
  });

  it("keeps student copy short and avoids unsupported visual meanings", () => {
    const forbidden = /오개념|진단 결과|정답은|틀렸|부족|교사용|학부모용/;
    for (const judgment of grade3Semester2CompleteDiagnosis.judgments) {
      expect(judgment.prompt).not.toMatch(forbidden);
      expect(judgment.prompt.length).toBeLessThanOrEqual(100);
      expect(judgment.context?.length ?? 0).toBeLessThanOrEqual(100);
      for (const choice of judgment.choices) {
        expect(choice.label).not.toMatch(forbidden);
      }
      if (judgment.visual.kind === "fraction-bar") {
        expect(judgment.visual.numerator).toBeLessThanOrEqual(judgment.visual.denominator);
      }
    }
  });

  it("shows the source material required to answer every data-display question", () => {
    const byId = new Map(
      grade3Semester2CompleteDiagnosis.judgments.map((judgment) => [judgment.id, judgment])
    );

    expect(byId.get("g3s2-graph-03")?.visual).toMatchObject({
      kind: "pictograph",
      symbol: "★",
      value: 5,
      rows: [{ label: "책", count: 4 }]
    });
    expect(byId.get("g3s2-graph-05")?.visual.kind).toBe("item-collection");
    expect(byId.get("g3s2-graph-06")?.visual.kind).toBe("data-table");
    expect(byId.get("g3s2-div-05")?.visual.kind).toBe("item-collection");
  });
});
