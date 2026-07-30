import { describe, expect, it, vi } from "vitest";
import { SupabaseContentStudioRepository } from "./content-studio";

describe("SupabaseContentStudioRepository curriculum anchors", () => {
  it("학기 전용 성취기준과 학년군 공유 성취기준을 함께 조회한다", async () => {
    const eqCalls: Array<[string, unknown]> = [];
    const orCalls: string[] = [];
    const response = {
      data: [
        {
          anchor_key: "[4수01-04]",
          label: "곱셈",
          source: "교육부 고시 제2022-33호 [별책 8]"
        },
        {
          anchor_key: "[4수03-16]",
          label: "길이",
          source: "교육부 고시 제2022-33호 [별책 8]"
        }
      ],
      error: null
    };
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn((field: string, value: unknown) => {
        eqCalls.push([field, value]);
        return query;
      }),
      or: vi.fn((expression: string) => {
        orCalls.push(expression);
        return query;
      }),
      order: vi.fn(() => query),
      then(
        onFulfilled: (value: typeof response) => unknown,
        onRejected?: (reason: unknown) => unknown
      ) {
        return Promise.resolve(response).then(onFulfilled, onRejected);
      }
    };
    const client = {
      from: vi.fn(() => query)
    };
    const repository = new SupabaseContentStudioRepository(
      client as never
    );

    await expect(repository.listApproved({
      grade: 3,
      semester: 1,
      curriculum: "2022-revised"
    })).resolves.toEqual([
      {
        id: "[4수01-04]",
        label: "곱셈",
        source: "교육부 고시 제2022-33호 [별책 8]"
      },
      {
        id: "[4수03-16]",
        label: "길이",
        source: "교육부 고시 제2022-33호 [별책 8]"
      }
    ]);
    expect(client.from).toHaveBeenCalledWith("curriculum_anchors");
    expect(eqCalls).toEqual([
      ["active", true],
      ["curriculum", "2022-revised"]
    ]);
    expect(orCalls).toEqual([
      "grade.eq.3,and(shared_across_grade_band.eq.true,grade_band.eq.3-4)",
      "semester.eq.1,shared_across_semesters.eq.true"
    ]);
  });

  it("4학년 조회는 명시적으로 승인된 3-4학년군 앵커만 함께 요청한다", async () => {
    const orCalls: string[] = [];
    const response = { data: [], error: null };
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      or: vi.fn((expression: string) => {
        orCalls.push(expression);
        return query;
      }),
      order: vi.fn(() => query),
      then(
        onFulfilled: (value: typeof response) => unknown,
        onRejected?: (reason: unknown) => unknown
      ) {
        return Promise.resolve(response).then(onFulfilled, onRejected);
      }
    };
    const repository = new SupabaseContentStudioRepository({
      from: vi.fn(() => query)
    } as never);

    await repository.listApproved({ grade: 4, semester: 2 });

    expect(orCalls).toEqual([
      "grade.eq.4,and(shared_across_grade_band.eq.true,grade_band.eq.3-4)",
      "semester.eq.2,shared_across_semesters.eq.true"
    ]);
  });
});
