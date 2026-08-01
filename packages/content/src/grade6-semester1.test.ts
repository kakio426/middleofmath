import { describe, expect, it } from "vitest";
import { validateCoverageBlueprint } from "./coverage";
import { diagnosisContentChecksum } from "./integrity-digest";
import { validateDiagnosisSet } from "./schema";
import {
  grade6Semester1CoverageBlueprint,
  grade6Semester1Diagnosis,
  grade6Semester1DistractorRationales,
  grade6Semester1MisconceptionTitles
} from "./grade6-semester1";

function choiceForMisconception(
  judgmentId: string,
  misconceptionId: string
): string | undefined {
  const judgment = grade6Semester1Diagnosis.judgments.find(
    (item) => item.id === judgmentId
  );
  const rationale = grade6Semester1DistractorRationales.find(
    (entry) => entry.judgmentId === judgmentId
      && entry.misconceptionId === misconceptionId
  );
  return judgment?.choices.find((choice) => choice.id === rationale?.choiceId)?.label;
}

describe("6학년 1학기 진단", () => {
  it("공식 여섯 단원을 31단계·62문항으로 분리한다", () => {
    expect(grade6Semester1Diagnosis.manifest).toMatchObject({
      id: "grade6-semester1", grade: 6, semester: 1
    });
    expect(grade6Semester1Diagnosis.manifest.units).toHaveLength(6);
    expect(grade6Semester1Diagnosis.curriculumAnchors).toHaveLength(13);
    expect(grade6Semester1Diagnosis.learnerStages).toHaveLength(31);
    expect(grade6Semester1Diagnosis.judgments).toHaveLength(62);
  });

  it("각 단계에 직접·전이 문항 두 개가 있다", () => {
    for (const stage of grade6Semester1Diagnosis.learnerStages) {
      expect(grade6Semester1Diagnosis.judgments.filter(
        (question) => question.learnerStageId === stage.id
      ), stage.id).toHaveLength(2);
    }
  });

  it("스키마·커버리지·체크섬 계약을 통과한다", () => {
    expect(validateDiagnosisSet(grade6Semester1Diagnosis)).toEqual({ valid: true, issues: [] });
    expect(validateCoverageBlueprint(
      grade6Semester1Diagnosis,
      grade6Semester1CoverageBlueprint
    )).toEqual({ valid: true, issues: [] });
    expect(grade6Semester1Diagnosis.manifest.checksum).toBe(
      diagnosisContentChecksum(grade6Semester1Diagnosis)
    );
  });

  it("모든 문항의 세 선택지는 값과 표시가 서로 다르다", () => {
    for (const judgment of grade6Semester1Diagnosis.judgments) {
      expect(new Set(judgment.choices.map((choice) => choice.label)).size,
        judgment.id).toBe(3);
    }
  });

  it("분수 나눗셈 오답은 계산 규칙과 답 형식 단서가 일치한다", () => {
    expect(choiceForMisconception(
      "g6s1-02-1",
      "fd.mixed-by-natural.bad-improper"
    )).toBe("1/2");
    expect(grade6Semester1Diagnosis.judgments.find(
      (item) => item.id === "g6s1-02-1"
    )?.choices.find((choice) => choice.correct)?.label).toBe("3/4");
    expect(grade6Semester1Diagnosis.judgments.find(
      (item) => item.id === "g6s1-02-2"
    )?.choices.find((choice) => choice.correct)?.label).toBe("1과 1/3 m");
    for (const judgmentId of ["g6s1-03-1", "g6s1-03-2"]) {
      expect(choiceForMisconception(
        judgmentId,
        "fd.natural-by-fraction.flip-dividend-too"
      ), judgmentId).toBeDefined();
    }
    expect(grade6Semester1Diagnosis.judgments.find(
      (item) => item.id === "g6s1-04-1"
    )?.context).toBe("계산한 결과를 고르세요.");
    for (const [judgmentId, suffix] of [
      ["g6s1-03-2", "병"],
      ["g6s1-05-1", "봉지"],
      ["g6s1-05-2", "컵"]
    ] as const) {
      const judgment = grade6Semester1Diagnosis.judgments.find(
        (item) => item.id === judgmentId
      )!;
      expect(judgment.prompt, judgmentId).toContain("분량");
      expect(judgment.choices.every((choice) => choice.label.endsWith(suffix)),
        judgmentId).toBe(true);
    }
  });

  it("입체도형 오답은 실제 그림에서 재현되는 세기 실수와 일치한다", () => {
    expect(choiceForMisconception(
      "g6s1-08-1",
      "solid.elements.omit-one"
    )).toBe("5개");
    expect(choiceForMisconception(
      "g6s1-08-2",
      "solid.elements.omit-one"
    )).toBe("4개");
    expect([
      choiceForMisconception("g6s1-07-1", "solid.bases.count-all-sides"),
      choiceForMisconception("g6s1-07-2", "solid.bases.count-all-sides")
    ]).toEqual(["3개", "4개"]);
    expect([
      choiceForMisconception("g6s1-10-1", "solid.side-faces.omit-two"),
      choiceForMisconception("g6s1-10-2", "solid.side-faces.omit-two")
    ]).toEqual(["3개", "4개"]);
  });

  it("1보다 작은 소수 몫 오답은 소수점을 한 자리 더 옮긴 값이다", () => {
    expect(choiceForMisconception(
      "g6s1-12-1",
      "dd.zero-quotient.extra-left-shift"
    )).toBe("0.04");
    expect(choiceForMisconception(
      "g6s1-12-2",
      "dd.zero-quotient.extra-left-shift"
    )).toBe("0.07 L");
  });

  it("분수로 답하라는 문항은 세 선택지를 모두 분수로 제시한다", () => {
    const judgment = grade6Semester1Diagnosis.judgments.find(
      (item) => item.id === "g6s1-18-1"
    )!;
    expect(judgment.prompt).toContain("분수");
    expect(judgment.choices.every((choice) => choice.label.includes("/"))).toBe(true);
  });

  it("소수 나눗셈 적용 문항은 단위가 아니라 계산 순서로 오답을 구별한다", () => {
    expect(choiceForMisconception(
      "g6s1-15-1",
      "dd.application.reverse-order"
    )).toBe("0.25 km");
    expect(choiceForMisconception(
      "g6s1-15-2",
      "dd.application.reverse-order"
    )).toBe("0.2배");
    for (const judgmentId of ["g6s1-15-1", "g6s1-15-2"]) {
      const judgment = grade6Semester1Diagnosis.judgments.find(
        (item) => item.id === judgmentId
      )!;
      const suffix = judgmentId.endsWith("1") ? "km" : "배";
      expect(judgment.choices.every((choice) => choice.label.endsWith(suffix)),
        judgmentId).toBe(true);
    }
  });

  it("그래프 오답은 두 문항에서 같은 오개념을 같은 방식으로 재현한다", () => {
    expect(choiceForMisconception(
      "g6s1-22-1",
      "graph.circle-read.reverse-size"
    )).toBe("자전거");
    expect(choiceForMisconception(
      "g6s1-22-2",
      "graph.circle-read.reverse-size"
    )).toBe("여름");
    expect([
      choiceForMisconception("g6s1-24-1", "graph.construct.choose-other-category"),
      choiceForMisconception("g6s1-24-2", "graph.construct.choose-other-category")
    ]).toEqual(["10칸", "4부분"]);
    expect([
      choiceForMisconception("g6s1-24-1", "graph.construct.use-complement"),
      choiceForMisconception("g6s1-24-2", "graph.construct.use-complement")
    ]).toEqual(["14칸", "8부분"]);
  });

  it("원그래프 문장은 6학년 수준의 부분·범례 어휘만 사용한다", () => {
    const stage = grade6Semester1Diagnosis.learnerStages.find(
      (item) => item.id === "graph.circle-read"
    )!;
    const circleRationales = grade6Semester1DistractorRationales.filter(
      (entry) => entry.misconceptionId.startsWith("graph.circle-read.")
    );
    const stageText = [
      stage.title,
      grade6Semester1MisconceptionTitles["graph.circle-read.legend"],
      grade6Semester1MisconceptionTitles["graph.circle-read.reverse-size"],
      ...circleRationales.flatMap((entry) => [entry.derivation, entry.rationale])
    ].join(" ");
    expect(stageText).not.toMatch(/부채꼴|중심각/);

    const legendRationales = grade6Semester1DistractorRationales
      .filter((entry) => entry.misconceptionId === "graph.circle-read.legend")
      .map((entry) => entry.derivation);
    expect(legendRationales).toEqual(expect.arrayContaining([
      expect.stringContaining("도보가 아니라 버스로"),
      expect.stringContaining("겨울이 아니라 봄으로")
    ]));
  });

  it("할인액 문항의 판매 가격 오답은 계산 방향을 정확히 설명한다", () => {
    const rationale = grade6Semester1DistractorRationales.find(
      (entry) => entry.judgmentId === "g6s1-20-1"
        && entry.misconceptionId === "rate.application.subtract-wrong"
    );
    expect(rationale?.derivation).toContain("판매 가격");
    expect(choiceForMisconception(
      "g6s1-20-1",
      "rate.application.subtract-wrong"
    )).toBe("24,000원");
  });

  it("전개도 문항의 모든 선택지는 입체도형 이름이며 같은 두 오개념을 재현한다", () => {
    expect([
      choiceForMisconception("g6s1-09-1", "solid.net.swap-prism-pyramid"),
      choiceForMisconception("g6s1-09-2", "solid.net.swap-prism-pyramid")
    ]).toEqual(["삼각뿔", "사각기둥"]);
    expect([
      choiceForMisconception("g6s1-09-1", "solid.net.name-from-side-face"),
      choiceForMisconception("g6s1-09-2", "solid.net.name-from-side-face")
    ]).toEqual(["사각기둥", "삼각뿔"]);
    for (const judgmentId of ["g6s1-09-1", "g6s1-09-2"]) {
      const judgment = grade6Semester1Diagnosis.judgments.find(
        (item) => item.id === judgmentId
      )!;
      expect(judgment.choices.every((choice) => /(?:기둥|뿔)$/.test(choice.label)),
        judgmentId).toBe(true);
    }
  });

  it("부피·겉넓이 문항은 정답을 문장에 노출하거나 단위로 누출하지 않는다", () => {
    const volumeBox = grade6Semester1Diagnosis.judgments.find(
      (item) => item.id === "g6s1-28-2"
    )!;
    expect(volumeBox.visual).toMatchObject({
      kind: "solid-diagram",
      mode: "dimensions",
      width: 8,
      depth: 3,
      height: 6
    });
    expect(volumeBox.choices.map((choice) => choice.label)).toEqual(
      expect.arrayContaining(["144 cm³", "17 cm³", "24 cm³"])
    );

    const net = grade6Semester1Diagnosis.judgments.find(
      (item) => item.id === "g6s1-30-1"
    )!;
    expect(net.context).not.toContain("여섯");

    expect(choiceForMisconception(
      "g6s1-31-1",
      "surface.calculate.volume"
    )).toBe("30 cm²");
    expect(choiceForMisconception(
      "g6s1-31-2",
      "surface.calculate.volume"
    )).toBe("125 cm²");
    for (const judgmentId of ["g6s1-28-1", "g6s1-28-2", "g6s1-31-1", "g6s1-31-2"]) {
      const judgment = grade6Semester1Diagnosis.judgments.find(
        (item) => item.id === judgmentId
      )!;
      const suffix = judgmentId.startsWith("g6s1-28") ? "cm³" : "cm²";
      expect(judgment.choices.every((choice) => choice.label.endsWith(suffix)),
        judgmentId).toBe(true);
    }
  });
});
