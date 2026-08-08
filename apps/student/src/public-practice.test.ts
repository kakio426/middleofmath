import { describe, expect, it } from "vitest";
import { createPublicPractice, PUBLIC_PRACTICE_DEFINITIONS } from "./public-practice";

const LESSON_PRACTICES = {
  "g3s2-pictograph-legend": ["pictograph", ["g3s2-graph-01", "g3s2-graph-03"]],
  "g3s1-multiplication-groups-model": ["multiplication", ["g3s1-mul-01", "g3s1-mul-02"]],
  "g3s1-multiplication-array-transfer": ["multiplication", ["g3s1-mul-01", "g3s1-mul-02"]],
  "g3s1-multiplication-place-value-model": ["multiplication", ["g3s1-mul-03", "g3s1-mul-04"]],
  "g3s1-multiplication-place-value-context": ["multiplication", ["g3s1-mul-03", "g3s1-mul-04"]],
  "g3s1-division-equal-sharing": ["division", ["g3s1-div-01", "g3s1-div-02"]],
  "g3s1-division-missing-factor": ["division", ["g3s1-div-02", "g3s1-div-03"]],
  "g3s1-division-fact-family": ["division", ["g3s1-div-03", "g3s1-div-04"]],
  "g3s1-division-group-count": ["division", ["g3s1-div-03", "g3s1-div-04"]],
  "g3s1-fraction-equal-parts": ["fraction", ["g3s1-frac-01", "g3s1-frac-02"]],
  "g3s1-fraction-fix-partition": ["fraction", ["g3s1-frac-01", "g3s1-frac-02"]],
  "g3s1-fraction-part-whole": ["fraction", ["g3s1-frac-03", "g3s1-frac-04"]],
  "g3s1-fraction-pizza-context": ["fraction", ["g3s1-frac-03", "g3s1-frac-04"]],
  "g3s1-length-centimeter-meter": ["length", ["g3s1-len-01", "g3s1-len-02"]],
  "g3s1-length-real-world-units": ["length", ["g3s1-len-01", "g3s1-len-02"]],
  "g3s1-length-unit-conversion": ["length", ["g3s1-len-03", "g3s1-len-04"]],
  "g3s2-multiplication-place-value": ["multiplication", ["g3s2-mul-01", "g3s2-mul-03"]],
  "g3s2-multiplication-combine": ["multiplication", ["g3s2-mul-02", "g3s2-mul-04"]],
  "g3s2-multiplication-two-digit": ["multiplication", ["g3s2-mul-05", "g3s2-mul-06"]],
  "g3s2-division-meaning": ["division", ["g3s2-div-05", "g3s2-div-06"]],
  "g3s2-division-remainder": ["division", ["g3s2-div-01", "g3s2-div-03"]],
  "g3s2-division-remainder-check": ["division", ["g3s2-div-07", "g3s2-div-08"]],
  "g3s2-circle-parts": ["circle", ["g3s2-circle-01", "g3s2-circle-03"]],
  "g3s2-circle-diameter": ["circle", ["g3s2-circle-02", "g3s2-circle-04"]],
  "g3s2-fraction-part-whole": ["fraction", ["g3s2-frac-01", "g3s2-frac-03"]],
  "g3s2-fraction-convert": ["fraction", ["g3s2-frac-11", "g3s2-frac-12"]],
  "g3s2-fraction-compare": ["fraction", ["g3s2-frac-02", "g3s2-frac-04"]],
  "g3s2-capacity-unit": ["measurement", ["g3s2-measure-01", "g3s2-measure-03"]],
  "g3s2-weight-unit": ["measurement", ["g3s2-measure-02", "g3s2-measure-04"]],
  "g3s2-pictograph-compare": ["pictograph", ["g3s2-graph-02", "g3s2-graph-04"]]
} as const;

describe("public practice links", () => {
  it("defines one exact practice route for every Vivasam lesson", () => {
    expect(Object.keys(PUBLIC_PRACTICE_DEFINITIONS).sort()).toEqual(Object.keys(LESSON_PRACTICES).sort());
  });

  it.each(Object.entries(LESSON_PRACTICES))("scopes %s to its exact lesson evidence", (key, [unitId, judgmentIds]) => {
    const practice = createPublicPractice(key);
    expect(practice).not.toBeNull();
    expect(practice?.assignments).toHaveLength(1);
    expect(practice?.assignments[0].unitId).toBe(unitId);
    expect(practice?.assignments[0].judgmentCount).toBe(judgmentIds.length);
    expect(practice?.content.judgments.map((judgment) => judgment.id).sort()).toEqual([...judgmentIds].sort());
  });

  it("keeps the published g3s2 multiplication link working without Supabase", () => {
    const practice = createPublicPractice("g3s2-multiplication");

    expect(practice).not.toBeNull();
    expect(practice?.assignments).toHaveLength(1);
    expect(practice?.assignments[0].unitId).toBe("multiplication");
    expect(practice?.assignments[0].judgmentCount).toBe(2);
    expect(practice?.content.judgments.map((judgment) => judgment.id).sort()).toEqual([
      "g3s2-mul-01",
      "g3s2-mul-02"
    ]);
  });

  it("rejects unknown practice keys", () => {
    expect(createPublicPractice("grade3-all")).toBeNull();
    expect(createPublicPractice("g3s1-multiplication")).toBeNull();
    expect(createPublicPractice("g3s2-pictograph")).toBeNull();
    expect(createPublicPractice(null)).toBeNull();
  });
});
