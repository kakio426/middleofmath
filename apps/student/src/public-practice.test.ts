import { describe, expect, it } from "vitest";
import { createPublicPractice } from "./public-practice";

describe("public practice links", () => {
  it.each([
    ["g3s1-multiplication", "multiplication", ["g3s1-mul-01", "g3s1-mul-02"]],
    ["g3s2-pictograph", "pictograph", ["g3s2-graph-03", "g3s2-graph-04", "g3s2-graph-07", "g3s2-graph-08"]]
  ])("scopes %s to the lesson topic", (key, unitId, judgmentIds) => {
    const practice = createPublicPractice(key);
    expect(practice).not.toBeNull();
    expect(practice?.assignments).toHaveLength(1);
    expect(practice?.assignments[0].unitId).toBe(unitId);
    expect(practice?.assignments[0].judgmentCount).toBe(judgmentIds.length);
    expect(practice?.content.judgments.map((judgment) => judgment.id).sort()).toEqual([...judgmentIds].sort());
  });

  it("rejects unknown practice keys", () => {
    expect(createPublicPractice("grade3-all")).toBeNull();
    expect(createPublicPractice(null)).toBeNull();
  });
});
