import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  generateGrade4Semester1PublicationV140Sql
} from "./emit-published-set-sql";

const v130MigrationPath = fileURLToPath(new URL(
  "../supabase/migrations/202607310004_grade4_semester1_publication.sql",
  import.meta.url
));
const v140MigrationPath = fileURLToPath(new URL(
  "../supabase/migrations/202607310009_grade4_semester1_publication_v140.sql",
  import.meta.url
));

describe("grade 4 semester 1 publication SQL generator", () => {
  it("keeps the current 1.4.0 publication migration in sync", async () => {
    const generated = generateGrade4Semester1PublicationV140Sql();
    const committed = await readFile(v140MigrationPath, "utf8");
    expect(committed).toBe(generated);
  });

  it("keeps the immutable 1.3.0 publication ledger byte-for-byte", async () => {
    const committed = await readFile(v130MigrationPath, "utf8");
    expect(createHash("sha256").update(committed).digest("hex")).toBe(
      "17e5585e2f26ec0d81a0e1b52ba4933821b1e051d79e34128f1d546554bbbb61"
    );
    expect(committed).toContain("'grade4-semester1'");
    expect(committed).toContain("'1.3.0'");
    expect(committed).toContain("5개 단원 · 27개 학습 단계 · 54개 진단 판단");
  });
});
