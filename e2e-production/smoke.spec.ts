import { expect, test } from "@playwright/test";

const studentUrl = required("PRODUCTION_STUDENT_URL");
const teacherUrl = required("PRODUCTION_TEACHER_URL");
const studioUrl = required("PRODUCTION_STUDIO_URL");

test("production student app has real configuration", async ({ page }) => {
  await page.goto(studentUrl);
  await expect(page.getByRole("heading", { name: /코드로 들어가요/ })).toBeVisible();
  await expect(page.getByText("학생 앱 설정이 필요합니다")).toHaveCount(0);
});

test("production teacher app has real configuration", async ({ page }) => {
  await page.goto(teacherUrl);
  await expect(page.getByRole("heading", { name: "교사 로그인" })).toBeVisible();
  await expect(page.getByText("교사 앱 설정이 필요합니다")).toHaveCount(0);
});

test("production studio app has real configuration", async ({ page }) => {
  await page.goto(studioUrl);
  await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();
  await expect(page.getByText("스튜디오 설정이 필요합니다")).toHaveCount(0);
});

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for the production smoke test.`);
  return value;
}
