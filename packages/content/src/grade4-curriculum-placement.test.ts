import { describe, expect, it } from "vitest";
import placementJson from "./grade4-curriculum-placement.json";
import snapshotJson from "./upstream/kr-learning-map.grade34.snapshot.json";
import { jsonSha256 } from "./integrity-digest";

const expectedPlacement = [
  {
    semester: 1,
    units: [
      { order: 1, id: "large-numbers", title: "큰 수", reviewStatus: "approved", reviewedBy: "teacher:workspace-owner", reviewedAt: "2026-07-30T21:33:47+09:00", anchorIds: ["[4수01-01]", "[4수01-02]"] },
      { order: 2, id: "angles", title: "각도", reviewStatus: "approved", reviewedBy: "teacher:workspace-owner", reviewedAt: "2026-07-30T21:33:47+09:00", anchorIds: ["[4수03-02]", "[4수03-24]", "[4수03-25]"] },
      { order: 3, id: "multiplication-division", title: "곱셈과 나눗셈", reviewStatus: "approved", reviewedBy: "teacher:workspace-owner", reviewedAt: "2026-07-31T17:38:29+09:00", anchorIds: ["[4수01-04]", "[4수01-05]", "[4수01-07]", "[4수01-08]"] },
      { order: 4, id: "figure-transform", title: "평면도형의 이동", reviewStatus: "approved", reviewedBy: "teacher:workspace-owner", reviewedAt: "2026-07-31T09:13:00+09:00", anchorIds: ["[4수03-04]", "[4수03-05]"] },
      { order: 5, id: "bar-graphs", title: "막대그래프", reviewStatus: "approved", reviewedBy: "teacher:workspace-owner", reviewedAt: "2026-07-31T15:04:15+09:00", anchorIds: ["[4수04-01]", "[4수04-03]"] },
      { order: 6, id: "patterns-relations", title: "규칙과 관계", reviewStatus: "approved", reviewedBy: "teacher:workspace-owner", reviewedAt: "2026-07-31T10:24:21+09:00", anchorIds: ["[4수02-01]", "[4수02-02]", "[4수02-03]"] }
    ]
  },
  {
    semester: 2,
    units: [
      { order: 1, id: "triangles", title: "삼각형", reviewStatus: "approved", reviewedBy: "teacher:workspace-owner", reviewedAt: "2026-07-31T18:59:56+09:00", anchorIds: ["[4수03-08]", "[4수03-09]"] },
      { order: 2, id: "fraction-add-subtract", title: "분수의 덧셈과 뺄셈", reviewStatus: "approved", reviewedBy: "teacher:workspace-owner", reviewedAt: "2026-07-31T20:13:47+09:00", anchorIds: ["[4수01-15]"] },
      { order: 3, id: "quadrilaterals", title: "사각형", reviewStatus: "approved", reviewedBy: "teacher:workspace-owner", reviewedAt: "2026-07-31T21:34:58+09:00", anchorIds: ["[4수03-03]", "[4수03-10]"] },
      { order: 4, id: "decimal-add-subtract", title: "소수의 덧셈과 뺄셈", reviewStatus: "approved", reviewedBy: "teacher:workspace-owner", reviewedAt: "2026-07-31T23:42:26+09:00", anchorIds: ["[4수01-13]", "[4수01-14]", "[4수01-16]"] },
      { order: 5, id: "polygons", title: "다각형", reviewStatus: "approved", reviewedBy: "teacher:workspace-owner", reviewedAt: "2026-08-01T00:39:13+09:00", anchorIds: ["[4수03-11]", "[4수03-12]"] },
      { order: 6, id: "line-graphs", title: "꺾은선그래프", reviewStatus: "approved", reviewedBy: "teacher:workspace-owner", reviewedAt: "2026-08-01T04:16:40+09:00", anchorIds: ["[4수04-02]", "[4수04-03]"] }
    ]
  }
];

const expectedModulesByCode: Record<string, string> = {
  "[4수01-01]": "다섯 자리 이상의 수",
  "[4수01-02]": "다섯 자리 이상의 수",
  "[4수03-02]": "도형의 기초",
  "[4수03-24]": "각도",
  "[4수03-25]": "각도",
  "[4수01-04]": "세 자리 수 범위의 곱셈",
  "[4수01-05]": "세 자리 수 범위의 나눗셈",
  "[4수01-07]": "세 자리 수 범위의 나눗셈",
  "[4수01-08]": "자연수의 어림셈",
  "[4수03-04]": "평면도형의 이동",
  "[4수03-05]": "평면도형의 이동",
  "[4수04-01]": "자료의 수집과 정리",
  "[4수04-03]": "자료의 수집과 정리",
  "[4수02-01]": "규칙을 수나 식으로 나타내기",
  "[4수02-02]": "규칙을 수나 식으로 나타내기",
  "[4수02-03]": "등호와 동치 관계",
  "[4수03-08]": "여러 가지 삼각형",
  "[4수03-09]": "여러 가지 삼각형",
  "[4수01-15]": "분수의 덧셈과 뺄셈",
  "[4수03-03]": "도형의 기초",
  "[4수03-10]": "여러 가지 사각형",
  "[4수01-13]": "소수",
  "[4수01-14]": "소수",
  "[4수01-16]": "소수의 덧셈과 뺄셈",
  "[4수03-11]": "다각형",
  "[4수03-12]": "다각형",
  "[4수04-02]": "자료의 수집과 정리"
};

describe("4학년 코드·단원·학기 배치 검토 원장", () => {
  it("고정된 3-4학년군 전체 스냅숏의 출처와 digest를 검증한다", () => {
    const { snapshotDigest, ...body } = snapshotJson;
    expect(snapshotJson.upstream).toMatchObject({
      repository: "DECK6/korean-elementary-learning-map",
      commit: "3ef0563084aa2a9baaa47da2c1ec0ebf5d7edc5c",
      learnerDiagnosisSupported: false
    });
    expect(snapshotJson.files).toEqual({
      "curriculum-standards.json": {
        bytes: 1913076,
        sha256: "aaaebb939c17fcc11a808fef3ae8164823425f74bfe8092a4a66941cb8c33335"
      },
      "topics.json": {
        bytes: 5387054,
        sha256: "80aa059ed305ce4cbeb0df45436c0b204a42cd208204c1cc1e5332c70c4bf5f3"
      },
      "dependencies.json": {
        bytes: 762739,
        sha256: "e09a6137bb70edf2a0b0928c05a4bd3f102c80845846ff13b10767ef4ceafe2c"
      }
    });
    expect(snapshotJson.standards).toHaveLength(47);
    expect(snapshotJson.topics).toHaveLength(142);
    expect(snapshotJson.dependencies).toHaveLength(6);
    expect(snapshotDigest).toBe(
      "sha256:c636ccf0033a8bfd1d808c899bbb569ac58da39a8197d2c9bbc4b9c615eef562"
    );
    expect(jsonSha256(body)).toBe(snapshotDigest);
    expect(placementJson.upstreamSnapshotDigest).toBe(snapshotDigest);
    expect(snapshotJson.advisory).toMatchObject({
      locatorProvenance: "upstream-recorded",
      locatorLocallyReproducible: false,
      locatorUsage: "추출 도구·버전·플래그가 고정되지 않은 DECK6 상류 줄 번호다. 로컬 재현이나 학기 배치 승인 근거로 사용하지 않는다."
    });
    expect(snapshotJson.sources).toEqual([
      {
        id: "kr-ncic-math-pdf-2022",
        name: "교육부 고시 제2022-33호 [별책8] 수학과 교육과정.pdf",
        url: "https://ncic.re.kr/inv/org/download.do?year=2022&seq=10003559&orgType=ogi4",
        accessDate: "2026-07-09",
        sourceType: "official-pdf",
        publisher: "교육부",
        via: "NCIC 국가교육과정정보센터",
        attachmentName: "[별책8] 수학과 교육과정.pdf",
        fileSizeBytes: 1938993,
        pdfPages: 263,
        sha256: "ba7c7c63ad31ba0fd32e5eb8148d696dd73288acce111495c593298112f8f840"
      }
    ]);
    expect(snapshotJson.standards.every((standard) =>
      standard.module.length > 0
      && standard.focus.includes(standard.code)
      && standard.sourceRefs.includes("kr-ncic-math-pdf-2022")
      && standard.evidence.some((item) =>
        item.sourceId === "kr-ncic-math-pdf-2022"
        && item.locator.startsWith("pdftotext lines ")
        && item.basis.includes(standard.code)
        && item.basis.includes(standard.module)
      )
    )).toBe(true);
  });

  it("A1부터 A3-6까지 승인하고 두 학기 여섯 단원을 명시한다", () => {
    expect(placementJson).toMatchObject({
      revision: "grade4-placement-2026-08-01.16",
      status: "approved",
      reviewedBy: "teacher:workspace-owner",
      reviewedAt: "2026-08-01T04:16:40+09:00"
    });
    expect(placementJson.semesters.map((semester) => ({
      semester: semester.semester,
      units: semester.units.length
    }))).toEqual([
      { semester: 1, units: 6 },
      { semester: 2, units: 6 }
    ]);
    expect(placementJson.semesters[0].units.filter((unit) =>
      unit.reviewStatus === "approved"
    ).map((unit) => unit.id)).toEqual([
      "large-numbers",
      "angles",
      "multiplication-division",
      "figure-transform",
      "bar-graphs",
      "patterns-relations"
    ]);
    expect(placementJson.semesters[1].units.every((unit) =>
      unit.reviewStatus === "approved"
    )).toBe(true);
    expect(placementJson.reviewLimitations).toEqual([
      "2학기 PDF 부록에는 3~4학년군 성취기준 47개 전체가 포함되므로 PDF 안의 코드 존재만으로 학기 배치를 승인하지 않는다.",
      "1학기 PDF 부록에도 나타나는 [4수03-10]은 공식 2학기 3단원 행으로 배치를 확정했다. [4수01-13], [4수01-14], [4수01-16]은 2학기 PDF 인쇄면 79~80쪽의 4단원 행으로, [4수03-11], [4수03-12]는 본문 인쇄면 81쪽의 5단원 행으로 배치를 확정했다. 나머지 단원 문맥은 교사가 우선 확인한다.",
      "2학기 PDF 부록 색인은 다각형을 6단원, 꺾은선그래프를 5단원으로 적어 본문 수업-평가 계획 표와 다르며 삼각형·사각형 단원 번호도 본문과 어긋난다. 학기 단원 배치에는 부록 색인이 아니라 본문 표를 사용한다.",
      "스냅숏의 pdftotext 줄 번호는 DECK6 상류 기록값이며 추출 도구가 고정되지 않아 로컬에서 재현되지 않는다. 줄 번호를 학기 배치 승인 근거로 사용하지 않는다.",
      "[4수01-07]의 학생용 요약 라벨은 고정 스냅숏의 세 자리 수 범위의 나눗셈 모듈과 4학년 1학기 단원 배치를 함께 대조해 작성했으며 성취기준 원문을 옮긴 것이 아니다."
    ]);
  });

  it("단원 순서와 단원별 코드 전체를 승인 후보 그대로 고정한다", () => {
    expect(placementJson.semesters).toEqual(expectedPlacement);
  });

  it("배치 코드가 모두 고정 스냅숏에 있고 코드별 모듈 근거를 보존한다", () => {
    const snapshotCodes = new Set(
      snapshotJson.standards.map((standard) => standard.code)
    );
    const [semester1, semester2] = placementJson.semesters.map((semester) =>
      semester.units.flatMap((unit) => unit.anchorIds)
    );
    expect(semester1).toHaveLength(16);
    expect(semester2).toHaveLength(12);
    expect(
      [...semester1, ...semester2].every((code) => snapshotCodes.has(code))
    ).toBe(true);
    expect(Object.fromEntries(
      snapshotJson.standards
        .filter((standard) => expectedModulesByCode[standard.code])
        .map((standard) => [standard.code, standard.module])
    )).toEqual(expectedModulesByCode);
    expect(semester1.filter((code) => semester2.includes(code))).toEqual([
      "[4수04-03]"
    ]);
  });

  it("교사가 승인해야 할 학기·학년군 공유 후보를 정확히 고정한다", () => {
    expect(placementJson.sharingCandidates).toEqual({
      acrossSemesters: ["[4수04-03]"],
      acrossGradeBand: [
        "[4수01-04]",
        "[4수01-05]",
        "[4수01-08]",
        "[4수04-01]"
      ]
    });
  });

  it("공식 게시물의 첨부 PDF 주소·크기·해시를 고정한다", () => {
    expect(placementJson.sources.slice(1)).toMatchObject([
      {
        id: "goe-grade4-semester1-2025",
        attachmentUrl: "https://www.goe.go.kr/resource/old/BBSMSTR_000000030222/BBS_202503061124157060.pdf",
        attachmentBytes: 4632051,
        attachmentSha256: "614cee22fa9c953efa6a671271e798b4d5232d2e5c87a7b1a2afdde395e7f54c"
      },
      {
        id: "goe-grade4-semester2-2025",
        attachmentUrl: "https://www.goe.go.kr/resource/goe/na/bbs_2675/2025/07/f4c15fac-ae7b-46aa-8e16-b8d86b710d44.pdf",
        attachmentBytes: 6721390,
        attachmentSha256: "934e4dfcc268c7865f74509fd1182434e2bbfcade90033211dd7e34ce3c4952f"
      }
    ]);
  });
});
