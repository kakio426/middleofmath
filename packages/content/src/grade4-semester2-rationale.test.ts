import { describe, expect, it } from "vitest";
import { grade4Semester2Diagnosis } from "./grade4-semester2";
import {
  grade4Semester2DistractorRationales,
  grade4Semester2MisconceptionTitles
} from "./grade4-semester2-rationales";

describe("4학년 2학기 오답 근거", () => {
  it("120개 오답 선택지에 정확히 한 근거가 있다", () => {
    const expected = grade4Semester2Diagnosis.judgments.flatMap((judgment) =>
      judgment.choices
        .filter((choice) => !choice.correct)
        .map((choice) => `${judgment.id}:${choice.id}`)
    ).sort();
    const actual = grade4Semester2DistractorRationales.map(
      (entry) => `${entry.judgmentId}:${entry.choiceId}`
    ).sort();
    expect(actual).toEqual(expected);
    expect(actual).toHaveLength(120);
  });

  it("단계마다 두 오개념이 direct와 transfer에서 반복된다", () => {
    for (const stage of grade4Semester2Diagnosis.learnerStages) {
      const entries = grade4Semester2DistractorRationales.filter((entry) =>
        entry.misconceptionId.startsWith(`${stage.id}.`)
      );
      const byMisconception = entries.reduce((grouped, entry) => {
        const occurrences = grouped.get(entry.misconceptionId) ?? [];
        occurrences.push(entry);
        grouped.set(entry.misconceptionId, occurrences);
        return grouped;
      }, new Map<string, typeof entries>());
      expect(byMisconception.size, stage.id).toBe(2);
      for (const [id, occurrences] of byMisconception) {
        expect(new Set(occurrences.map(
          (entry) => entry.judgmentId
        )).size, id).toBe(2);
        expect(grade4Semester2MisconceptionTitles[id], id).toBeTruthy();
      }
    }
  });

  it("오개념은 오답의 화면 위치가 아니라 실제 오류 기제로 연결된다", () => {
    const expected = new Map<string, string>([
      ["g4s2-poly-01:curved-ga-01", "polygon.identify-closed-straight.a"],
      ["g4s2-poly-01:open-da-01", "polygon.identify-closed-straight.b"],
      ["g4s2-poly-02:open-ga-02", "polygon.identify-closed-straight.b"],
      ["g4s2-poly-02:curved-na-02", "polygon.identify-closed-straight.a"],
      ["g4s2-poly-07:two-rhombi-ga-07", "polygon.fill-remaining-space.a"],
      ["g4s2-poly-07:two-triangles-da-07", "polygon.fill-remaining-space.b"],
      ["g4s2-poly-08:three-rhombi-na-08", "polygon.fill-remaining-space.a"],
      ["g4s2-poly-08:two-rhombi-da-08", "polygon.fill-remaining-space.b"],
      ["g4s2-poly-09:three-large-groups-09", "polygon.tile-count-pieces.a"],
      ["g4s2-poly-09:twelve-rhombi-09", "polygon.tile-count-pieces.b"],
      ["g4s2-poly-10:two-trapezoids-10", "polygon.tile-count-pieces.a"],
      ["g4s2-poly-10:twelve-trapezoids-10", "polygon.tile-count-pieces.b"]
    ]);
    const actual = new Map(grade4Semester2DistractorRationales.map((entry) => [
      `${entry.judgmentId}:${entry.choiceId}`,
      entry.misconceptionId
    ]));
    for (const [key, misconceptionId] of expected) {
      expect(actual.get(key), key).toBe(misconceptionId);
    }
  });

  it("산출 과정은 실제 선택지의 수치와 연산을 설명한다", () => {
    for (const entry of grade4Semester2DistractorRationales) {
      expect(entry.derivation, entry.choiceId).toMatch(
        /[0-9]|°|cm|\+|-|÷|더|빼|비교|직각|평행|눈금|변|각|선|끝|칸|조각|모양/
      );
      expect(entry.rationale.length, entry.choiceId).toBeGreaterThanOrEqual(15);
    }
  });

  it("조각 수 오개념 A는 두 문항 모두 주어진 조각보다 큰 묶음에서 실제 선택지를 산출한다", () => {
    const title = grade4Semester2MisconceptionTitles[
      "polygon.tile-count-pieces.a"
    ];
    const entries = grade4Semester2DistractorRationales.filter(
      (entry) => entry.misconceptionId === "polygon.tile-count-pieces.a"
    );

    expect(title).toBe(
      "주어진 조각보다 큰 묶음을 조각 하나로 세어 개수를 적게 셈"
    );
    expect(entries).toHaveLength(2);
    expect(entries.find((entry) => entry.judgmentId === "g4s2-poly-09")
      ?.derivation).toMatch(/12칸.*4칸짜리 큰 묶음 3개.*3개/);
    expect(entries.find((entry) => entry.judgmentId === "g4s2-poly-10")
      ?.derivation).toMatch(/12칸.*6칸짜리 큰 묶음 2개.*2개/);
  });

  it("조각 수 선택지는 문맥이나 질문에 보인 수를 그대로 반복하지 않는다", () => {
    const judgments = grade4Semester2Diagnosis.judgments.filter(
      (judgment) => judgment.choices.every((choice) => /^\d+개$/.test(choice.label))
    );
    for (const judgment of judgments) {
      const visibleNumbers = new Set(
        `${judgment.context ?? ""} ${judgment.prompt}`.match(/\d+/g) ?? []
      );
      for (const choice of judgment.choices) {
        const choiceNumber = choice.label.match(/^\d+/)?.[0];
        expect(visibleNumbers.has(choiceNumber ?? ""), `${judgment.id}/${choice.id}`)
          .toBe(false);
      }
    }
  });
});
