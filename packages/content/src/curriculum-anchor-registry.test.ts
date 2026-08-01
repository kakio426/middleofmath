import { describe, expect, it } from "vitest";
import {
  curriculumAnchorSetAllowList,
  findAnchorForSet,
  findGrade3Semester2Anchor,
  grade3Semester1AnchorRegistry,
  grade3Semester2Anchor,
  grade3Semester2AnchorRegistry,
  grade4Semester1Anchor,
  grade4Semester1AnchorRegistry,
  grade4Semester2Anchor,
  grade4Semester2AnchorRegistry,
  grade5Semester1Anchor,
  grade5Semester1AnchorRegistry
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

  it("학년군 표기만으로 4학년 사용을 추정하지 않고 승인 허용목록만 따른다", () => {
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
    expect(findAnchorForSet("grade4-semester1", "[4수01-04]")).toMatchObject({
      grade: 4,
      semester: 1
    });
    expect(findAnchorForSet("grade4-semester1", "[4수03-16]")).toBeUndefined();
  });

  it("A1과 A2에서 승인된 열여섯 앵커만 4학년 1학기에서 찾는다", () => {
    expect(grade4Semester1AnchorRegistry.map((anchor) => anchor.id)).toEqual([
      "[4수01-01]",
      "[4수01-02]",
      "[4수01-04]",
      "[4수01-05]",
      "[4수01-07]",
      "[4수01-08]",
      "[4수03-02]",
      "[4수03-24]",
      "[4수03-25]",
      "[4수03-04]",
      "[4수03-05]",
      "[4수02-01]",
      "[4수02-02]",
      "[4수02-03]",
      "[4수04-01]",
      "[4수04-03]"
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
    expect(grade4Semester1Anchor("[4수03-04]")).toMatchObject({
      label: expect.stringContaining("밀기, 뒤집기, 돌리기")
    });
    expect(grade4Semester1Anchor("[4수03-05]")).toMatchObject({
      label: expect.stringContaining("점의 이동")
    });
    expect(grade4Semester1Anchor("[4수02-01]")).toMatchObject({
      label: expect.stringContaining("변화 규칙")
    });
    expect(grade4Semester1Anchor("[4수02-02]")).toMatchObject({
      label: expect.stringContaining("계산식의 배열")
    });
    expect(grade4Semester1Anchor("[4수02-03]")).toMatchObject({
      label: expect.stringContaining("등호")
    });
    expect(grade4Semester1Anchor("[4수04-01]")).toMatchObject({
      label: expect.stringContaining("막대그래프")
    });
    expect(() => grade4Semester1Anchor("[4수03-03]")).toThrow("등록되지 않은");
  });

  it("A3-1부터 A3-6까지 승인된 열한 앵커를 4학년 2학기에서 찾는다", () => {
    expect(grade4Semester2AnchorRegistry.map((anchor) => anchor.id)).toEqual([
      "[4수04-02]",
      "[4수03-08]",
      "[4수03-09]",
      "[4수01-15]",
      "[4수03-03]",
      "[4수03-10]",
      "[4수01-13]",
      "[4수01-14]",
      "[4수01-16]",
      "[4수03-11]",
      "[4수03-12]"
    ]);
    expect(grade4Semester2Anchor("[4수03-08]")).toMatchObject({
      label: expect.stringContaining("변의 길이")
    });
    expect(grade4Semester2Anchor("[4수03-09]")).toMatchObject({
      label: expect.stringContaining("각의 크기")
    });
    expect(grade4Semester2Anchor("[4수01-15]")).toMatchObject({
      label: expect.stringContaining("분모가 같은 분수")
    });
    expect(findAnchorForSet("grade4-semester2", "[4수03-08]")).toMatchObject({
      grade: 4,
      semester: 2,
      sharedAcrossGradeBand: false
    });
    expect(findAnchorForSet("grade4-semester2", "[4수01-15]")).toMatchObject({
      grade: 4,
      semester: 2,
      sharedAcrossSemesters: false
    });
    expect(grade4Semester2Anchor("[4수03-03]")).toMatchObject({
      label: expect.stringContaining("수선")
    });
    expect(grade4Semester2Anchor("[4수03-10]")).toMatchObject({
      label: expect.stringContaining("사각형")
    });
    expect(findAnchorForSet("grade4-semester2", "[4수03-10]")).toMatchObject({
      grade: 4,
      semester: 2,
      sharedAcrossSemesters: false
    });
    expect(grade4Semester2Anchor("[4수01-13]")).toMatchObject({
      label: expect.stringContaining("소수 세 자리 수")
    });
    expect(grade4Semester2Anchor("[4수01-14]")).toMatchObject({
      label: expect.stringContaining("크기를 비교")
    });
    expect(grade4Semester2Anchor("[4수01-16]")).toMatchObject({
      label: expect.stringContaining("덧셈과 뺄셈")
    });
    expect(findAnchorForSet("grade4-semester2", "[4수01-16]")).toMatchObject({
      grade: 4,
      semester: 2,
      sharedAcrossGradeBand: false
    });
    expect(grade4Semester2Anchor("[4수03-11]")).toMatchObject({
      label: expect.stringContaining("다각형과 정다각형")
    });
    expect(grade4Semester2Anchor("[4수03-12]")).toMatchObject({
      label: expect.stringContaining("모양을 만들거나 채우고")
    });
    expect(findAnchorForSet("grade4-semester2", "[4수03-12]")).toMatchObject({
      grade: 4,
      semester: 2,
      sharedAcrossSemesters: false
    });
    expect(findAnchorForSet("grade4-semester1", "[4수03-10]")).toBeUndefined();
    expect(grade4Semester2Anchor("[4수04-02]")).toMatchObject({
      label: expect.stringContaining("꺾은선그래프")
    });
  });

  it("A4-1부터 A4-6까지 승인된 열두 앵커를 5학년 1학기에서 찾는다", () => {
    expect(grade5Semester1AnchorRegistry.map((anchor) => anchor.id)).toEqual([
      "[6수01-01]",
      "[6수01-04]",
      "[6수01-05]",
      "[6수02-01]",
      "[6수01-06]",
      "[6수01-07]",
      "[6수01-12]",
      "[6수01-08]",
      "[6수03-11]",
      "[6수03-12]",
      "[6수03-13]",
      "[6수03-14]"
    ]);
    expect(grade5Semester1Anchor("[6수02-01]")).toMatchObject({
      label: expect.stringContaining("대응표")
    });
    expect(findAnchorForSet("grade5-semester1", "[6수02-01]")).toMatchObject({
      grade: 5,
      semester: 1,
      sharedAcrossGradeBand: false
    });
    expect(findAnchorForSet("grade6-semester1", "[6수02-01]")).toBeUndefined();
    expect(grade5Semester1Anchor("[6수01-12]")).toMatchObject({
      label: expect.stringContaining("분수와 소수")
    });
    expect(grade5Semester1Anchor("[6수01-08]")).toMatchObject({
      label: expect.stringContaining("덧셈과 뺄셈")
    });
  });

  it("공유 성취기준은 명시한 세트에서만 찾고 공유 boolean을 켜지 않는다", () => {
    expect(curriculumAnchorSetAllowList).toEqual([
      {
        anchorId: "[4수01-04]",
        setKey: "grade3-semester1",
        canonical: false,
        coverage: "partial"
      },
      {
        anchorId: "[4수01-04]",
        setKey: "grade3-semester2",
        canonical: true,
        coverage: "partial"
      },
      {
        anchorId: "[4수01-04]",
        setKey: "grade4-semester1",
        canonical: false,
        coverage: "partial"
      },
      {
        anchorId: "[4수01-05]",
        setKey: "grade3-semester1",
        canonical: false,
        coverage: "partial"
      },
      {
        anchorId: "[4수01-05]",
        setKey: "grade3-semester2",
        canonical: true,
        coverage: "partial"
      },
      {
        anchorId: "[4수01-05]",
        setKey: "grade4-semester1",
        canonical: false,
        coverage: "partial"
      },
      {
        anchorId: "[4수01-07]",
        setKey: "grade4-semester1",
        canonical: true,
        coverage: "partial"
      },
      {
        anchorId: "[4수01-08]",
        setKey: "grade3-semester2",
        canonical: true,
        coverage: "partial"
      },
      {
        anchorId: "[4수01-08]",
        setKey: "grade4-semester1",
        canonical: false,
        coverage: "partial"
      },
      {
        anchorId: "[4수04-01]",
        setKey: "grade3-semester2",
        canonical: true,
        coverage: "partial"
      },
      {
        anchorId: "[4수04-01]",
        setKey: "grade4-semester1",
        canonical: false,
        coverage: "partial"
      },
      {
        anchorId: "[4수04-03]",
        setKey: "grade4-semester1",
        canonical: true,
        coverage: "partial"
      },
      {
        anchorId: "[4수04-03]",
        setKey: "grade4-semester2",
        canonical: false,
        coverage: "partial"
      }
    ]);
    expect(findAnchorForSet("grade3-semester2", "[4수04-01]")).toMatchObject({
      grade: 3,
      semester: 2,
      sharedAcrossGradeBand: false,
      sharedAcrossSemesters: false
    });
    expect(findAnchorForSet("grade4-semester1", "[4수04-01]")).toMatchObject({
      grade: 4,
      semester: 1,
      sharedAcrossGradeBand: false,
      sharedAcrossSemesters: false
    });
    expect(findAnchorForSet("grade3-semester1", "[4수04-01]")).toBeUndefined();
    expect(findAnchorForSet("grade4-semester2", "[4수04-01]")).toBeUndefined();
    expect(findAnchorForSet("grade4-semester2", "[4수04-03]")).toMatchObject({
      grade: 4,
      semester: 1,
      sharedAcrossSemesters: false
    });
    expect(findAnchorForSet("grade3-semester2", "[4수04-03]")).toBeUndefined();
    expect(findAnchorForSet("grade4-semester2", "[4수01-04]")).toBeUndefined();
    expect(findAnchorForSet("grade4-semester2", "[4수01-05]")).toBeUndefined();
    expect(findAnchorForSet("grade4-semester2", "[4수01-07]")).toBeUndefined();
    expect(findAnchorForSet("grade4-semester2", "[4수01-08]")).toBeUndefined();
    expect(findAnchorForSet("grade3-semester1", "[4수01-07]")).toBeUndefined();
    expect(findAnchorForSet("grade3-semester1", "[4수01-08]")).toBeUndefined();
  });
});
