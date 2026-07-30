import { describe, expect, it } from "vitest";
import {
  findAnchorForSet,
  findGrade3Semester2Anchor,
  grade3Semester1AnchorRegistry,
  grade3Semester2Anchor,
  grade3Semester2AnchorRegistry,
  grade4Semester1Anchor,
  grade4Semester1AnchorRegistry
} from "./curriculum-anchor-registry";
import { grade3Semester1Diagnosis } from "./grade3-semester1";
import { grade3Semester2CompleteDiagnosis } from "./grade3-semester2-complete";
import { grade3Semester2Diagnosis } from "./grade3-semester2";

describe("grade 3 semester 2 curriculum anchor registry", () => {
  it("contains exactly the 17 anchors used by the complete set", () => {
    expect(grade3Semester2AnchorRegistry).toHaveLength(17);
    expect(new Set(grade3Semester2AnchorRegistry.map((row) => row.id))).toEqual(
      new Set(grade3Semester2CompleteDiagnosis.curriculumAnchors.map((row) => row.id))
    );
  });

  it("keeps v1 labels stable behind the published checksum", () => {
    for (const anchor of grade3Semester2Diagnosis.curriculumAnchors) {
      expect(grade3Semester2Anchor(anchor.id, "v1")).toEqual(anchor);
    }
  });

  it("uses reviewed v2 labels for the complete set", () => {
    for (const anchor of grade3Semester2CompleteDiagnosis.curriculumAnchors) {
      expect(grade3Semester2Anchor(anchor.id, "v2")).toEqual(anchor);
    }
  });

  it("fails closed for an unregistered anchor", () => {
    expect(findGrade3Semester2Anchor("[4수99-99]")).toBeUndefined();
    expect(() => grade3Semester2Anchor("[4수99-99]")).toThrow("등록되지 않은");
  });

  it("3학년 1학기 5개 앵커의 기존 라벨과 출처를 그대로 유지한다", () => {
    expect(grade3Semester1AnchorRegistry).toHaveLength(5);
    expect(
      grade3Semester1AnchorRegistry.map(({ id, label, source }) => ({
        id,
        label,
        source
      }))
    ).toEqual(grade3Semester1Diagnosis.curriculumAnchors);
  });

  it("모든 기존 앵커에 3-4학년군 출처 범위를 표시한다", () => {
    expect([
      ...grade3Semester1AnchorRegistry,
      ...grade3Semester2AnchorRegistry
    ].every((anchor) => anchor.gradeBand === "3-4")).toBe(true);
  });

  it("검수된 네 앵커만 3학년 학기 사이에서 공유한다", () => {
    const shared = grade3Semester2AnchorRegistry
      .filter((anchor) => anchor.sharedAcrossSemesters)
      .map((anchor) => anchor.id);
    expect(shared).toEqual([
      "[4수01-04]",
      "[4수01-05]",
      "[4수01-06]",
      "[4수01-09]"
    ]);
  });

  it("학년군 표기만으로 4학년 사용을 추정하지 않는다", () => {
    expect(findAnchorForSet("grade3-semester1", "[4수01-04]")).toMatchObject({
      grade: 3,
      semester: 1
    });
    expect(findAnchorForSet("grade3-semester2", "[4수03-17]")).toMatchObject({
      grade: 3,
      semester: 2
    });
    expect(findAnchorForSet("grade3-semester2", "[4수01-04]")?.label).toBe(
      "한 자리 수 또는 두 자리 수를 곱하는 곱셈"
    );
    expect(findAnchorForSet("grade3-semester2", "[4수03-17]")?.label).toBe(
      "들이의 단위를 알고 들이를 어림하고 재기"
    );
    expect(findAnchorForSet("grade4-semester1", "[4수01-04]")).toBeUndefined();
    expect(findAnchorForSet("grade4-semester1", "[4수03-16]")).toBeUndefined();
  });

  it("A1 승인된 큰 수와 각도 다섯 앵커만 4학년 1학기에서 찾는다", () => {
    expect(grade4Semester1AnchorRegistry.map((anchor) => anchor.id)).toEqual([
      "[4수01-01]",
      "[4수01-02]",
      "[4수03-02]",
      "[4수03-24]",
      "[4수03-25]"
    ]);
    expect(grade4Semester1Anchor("[4수01-01]")).toMatchObject({
      id: "[4수01-01]",
      label: expect.stringContaining("위치적 기수법")
    });
    expect(findAnchorForSet("grade4-semester1", "[4수01-02]")).toMatchObject({
      grade: 4,
      semester: 1,
      sharedAcrossGradeBand: false
    });
    expect(grade4Semester1Anchor("[4수03-02]")).toMatchObject({
      label: expect.stringContaining("직각")
    });
    expect(() => grade4Semester1Anchor("[4수03-03]")).toThrow("등록되지 않은");
  });
});
