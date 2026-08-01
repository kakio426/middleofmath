import { describe, expect, it } from "vitest";
import placementJson from "./grade5-curriculum-placement.json";
import snapshotJson from "./upstream/kr-learning-map.grade56.snapshot.json";
import { jsonSha256 } from "./integrity-digest";

const semester1 = [
  { order: 1, id: "mixed-operations", title: "자연수의 혼합 계산", anchorIds: ["[6수01-01]"] },
  { order: 2, id: "factors-multiples", title: "약수와 배수", anchorIds: ["[6수01-04]", "[6수01-05]"] },
  { order: 3, id: "correspondence", title: "대응 관계", anchorIds: ["[6수02-01]"] },
  { order: 4, id: "fraction-reduction-common-denominator", title: "약분과 통분", anchorIds: ["[6수01-06]", "[6수01-07]", "[6수01-12]"] },
  { order: 5, id: "fraction-add-subtract", title: "분수의 덧셈과 뺄셈", anchorIds: ["[6수01-08]"] },
  { order: 6, id: "polygon-perimeter-area", title: "다각형의 둘레와 넓이", anchorIds: ["[6수03-11]", "[6수03-12]", "[6수03-13]", "[6수03-14]"] }
];

const semester2 = [
  { order: 1, id: "number-range-rounding", title: "수의 범위와 올림, 버림, 반올림", anchorIds: ["[6수01-02]", "[6수01-03]"] },
  { order: 2, id: "fraction-multiplication", title: "분수의 곱셈", anchorIds: ["[6수01-09]"] },
  { order: 3, id: "congruence-symmetry", title: "합동과 대칭", anchorIds: ["[6수03-01]", "[6수03-02]"] },
  { order: 4, id: "decimal-multiplication", title: "소수의 곱셈", anchorIds: ["[6수01-13]"] },
  { order: 5, id: "rectangular-prisms-cubes", title: "직육면체와 정육면체", anchorIds: ["[6수03-03]", "[6수03-04]"] },
  { order: 6, id: "average-probability", title: "평균과 가능성", anchorIds: ["[6수04-01]", "[6수04-04]", "[6수04-05]", "[6수04-06]"] }
];

describe("5학년 코드·단원·학기 배치 검토 원장", () => {
  it("DECK6 5~6학년군 45개 코드 스냅숏의 출처와 digest를 고정한다", () => {
    const { snapshotDigest, ...body } = snapshotJson;
    expect(snapshotJson.upstream).toMatchObject({
      repository: "DECK6/korean-elementary-learning-map",
      commit: "3ef0563084aa2a9baaa47da2c1ec0ebf5d7edc5c",
      taxonomyVersion: "kr-full-depth-v0.4",
      ontologyVersion: "0.3.0-p3",
      learnerDiagnosisSupported: false
    });
    expect(snapshotJson.scope).toMatchObject({ gradeBand: "5-6" });
    expect(snapshotJson.scope.requestedCodes).toHaveLength(45);
    expect(snapshotJson.standards).toHaveLength(45);
    expect(snapshotJson.topics).toHaveLength(135);
    expect(snapshotJson.dependencies).toHaveLength(33);
    expect(snapshotDigest).toBe(
      "sha256:7ec5c6254d89f931c73d1638cefcaf92b8f0102e98ae55258b0d7b3fd6b664cb"
    );
    expect(jsonSha256(body)).toBe(snapshotDigest);
    expect(placementJson.upstreamSnapshotDigest).toBe(snapshotDigest);
    expect(snapshotJson.standards.every((standard) =>
      standard.gradeBand === "5-6"
      && standard.subject === "Mathematics"
      && standard.sourceRefs.includes("kr-ncic-math-pdf-2022")
    )).toBe(true);
  });

  it("2026 공식 표의 5학년 1·2학기 단원 순서와 24개 코드 배치를 고정한다", () => {
    expect(placementJson.semesters.map((semester) => ({
      semester: semester.semester,
      units: semester.units.map(({ reviewStatus: _status, reviewedBy: _by, reviewedAt: _at, ...unit }) => unit)
    }))).toEqual([
      { semester: 1, units: semester1 },
      { semester: 2, units: semester2 }
    ]);
    const placementCodes = placementJson.semesters.flatMap((semester) =>
      semester.units.flatMap((unit) => unit.anchorIds)
    );
    expect(placementCodes).toHaveLength(24);
    expect(new Set(placementCodes).size).toBe(24);
    expect(placementCodes.every((code) =>
      snapshotJson.standards.some((standard) => standard.code === code)
    )).toBe(true);
  });

  it("DECK6 모듈명과 공식 단원명이 다를 수 있음을 회귀 계약으로 남긴다", () => {
    const upstream = snapshotJson.standards.find(
      (standard) => standard.code === "[6수01-12]"
    );
    const officialUnit = placementJson.semesters[0].units.find(
      (unit) => unit.anchorIds.includes("[6수01-12]")
    );
    expect(upstream?.module).toBe("분수와 소수의 관계");
    expect(officialUnit?.title).toBe("약분과 통분");
    expect(upstream?.module).not.toBe(officialUnit?.title);
  });

  it("5학년 두 학기 열두 단원의 배치 승인 근거를 보존한다", () => {
    const units = placementJson.semesters.flatMap((semester) =>
      semester.units.map((unit) => ({
        ...unit,
        reviewedBy: unit.reviewedBy as string | null,
        reviewedAt: unit.reviewedAt as string | null
      }))
    );
    expect(placementJson).toMatchObject({
      revision: "grade5-placement-2026-08-01.7",
      status: "approved",
      reviewedBy: "teacher:workspace-owner",
      reviewedAt: "2026-08-01T13:05:00+09:00"
    });
    expect(units.filter((unit) => unit.reviewStatus === "approved")).toEqual([
      expect.objectContaining({
        id: "mixed-operations",
        reviewedBy: "teacher:workspace-owner",
        reviewedAt: "2026-08-01T06:14:09+09:00"
      }),
      expect.objectContaining({
        id: "factors-multiples",
        reviewedBy: "teacher:workspace-owner",
        reviewedAt: "2026-08-01T07:37:28+09:00"
      }),
      expect.objectContaining({
        id: "correspondence",
        reviewedBy: "teacher:workspace-owner",
        reviewedAt: "2026-08-01T08:47:00+09:00"
      }),
      expect.objectContaining({
        id: "fraction-reduction-common-denominator",
        reviewedBy: "teacher:workspace-owner",
        reviewedAt: "2026-08-01T09:32:00+09:00"
      }),
      expect.objectContaining({
        id: "fraction-add-subtract",
        reviewedBy: "teacher:workspace-owner",
        reviewedAt: "2026-08-01T10:08:00+09:00"
      }),
      expect.objectContaining({
        id: "polygon-perimeter-area",
        reviewedBy: "teacher:workspace-owner",
        reviewedAt: "2026-08-01T10:50:00+09:00"
      }),
      ...semester2.map((unit) => expect.objectContaining({
        id: unit.id,
        reviewStatus: "approved",
        reviewedBy: "teacher:workspace-owner",
        reviewedAt: "2026-08-01T13:05:00+09:00"
      }))
    ]);
  });

  it("공식 교육과정·상류 고정 커밋·2026 학기 배치 자료를 모두 기록한다", () => {
    expect(placementJson.sources).toEqual([
      expect.objectContaining({
        id: "deck6-grade56",
        commit: "3ef0563084aa2a9baaa47da2c1ec0ebf5d7edc5c"
      }),
      expect.objectContaining({
        id: "ncic-math-curriculum-2022",
        attachmentBytes: 1938993,
        attachmentPages: 263,
        attachmentSha256: "ba7c7c63ad31ba0fd32e5eb8148d696dd73288acce111495c593298112f8f840"
      }),
      expect.objectContaining({
        id: "goe-grade5-2026",
        registeredAt: "2026-02-25",
        attachmentBytes: 3572819,
        attachmentPages: 229,
        attachmentSha256: "0a8ad1b80c85fb3cee22d90fa36de1838bef02921ae048837f1a73b6c8297826"
      })
    ]);
    expect(placementJson.reviewLimitations).toHaveLength(6);
    expect(placementJson.sources[2]).toMatchObject({
      attachmentFileKey: "c2a2e7e3c51678582e911837b4b66d3d",
      attachmentDownloadMethod: expect.stringContaining("nttFileDownload.do?fileKey=")
    });
  });
});
