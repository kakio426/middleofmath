import { describe, expect, it } from "vitest";
import { grade3Semester2CompleteDiagnosis } from "./grade3-semester2-complete";

const reviewedAddedSignalSeverities = {
  "multiplication.two-digit-factor": "medium",
  "multiplication.estimate": "low",
  "division.meaning": "high",
  "division.remainder-check": "medium",
  "division.estimate": "low",
  "circle.equal-radii": "medium",
  "circle.compass": "medium",
  "fraction.discrete": "medium",
  "fraction.types": "medium",
  "fraction.unit": "high",
  "fraction.convert": "high",
  "fraction.unit-compare": "medium",
  "measurement.capacity-measure": "low",
  "measurement.capacity-arithmetic": "medium",
  "measurement.weight-measure": "low",
  "measurement.weight-arithmetic": "medium",
  "measurement.ton": "high",
  "pictograph.classify-table": "medium",
  "pictograph.convert": "medium",
  "pictograph.complete": "medium"
} as const;

describe("3학년 2학기 진단 신호 심각도 검토안", () => {
  it("U6에서 추가한 20개 신호에 검토한 심각도를 정확히 적용한다", () => {
    const actual = Object.fromEntries(
      grade3Semester2CompleteDiagnosis.signals
        .filter((signal) => signal.id in reviewedAddedSignalSeverities)
        .map((signal) => [signal.id, signal.severity])
    );
    expect(actual).toEqual(reviewedAddedSignalSeverities);
  });

  it("fallback을 포함한 전체 34개 신호가 한 심각도로 몰리지 않는다", () => {
    const counts = grade3Semester2CompleteDiagnosis.signals.reduce(
      (result, signal) => {
        result[signal.severity] += 1;
        return result;
      },
      { high: 0, medium: 0, low: 0 }
    );

    expect(counts).toEqual({ high: 10, medium: 18, low: 6 });
  });
});
