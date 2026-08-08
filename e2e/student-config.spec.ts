import { expect, test } from "@playwright/test";

test("학생 운영 앱은 설정 누락 시 데모로 내려가지 않는다", async ({ page }) => {
  await page.goto("/?set=grade4-semester1");
  await expect(page.getByRole("heading", { name: "학생 앱 설정이 필요합니다" })).toBeVisible();
  await expect(page.getByText("VITE_DEMO_MODE=true")).toBeVisible();
  await expect(page.getByText("4학년 1학기")).toHaveCount(0);
});

test("공개 곱셈 링크는 Supabase 설정 없이 바로 문제 목록을 연다", async ({ page }) => {
  await page.goto("/?practice=g3s2-multiplication");

  await expect(page.getByRole("heading", { name: "학생 앱 설정이 필요합니다" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "곱셈 생각 확인하기" })).toBeVisible();
  await expect(page.getByText("8문제 · 약 4분")).toBeVisible();
  await expect(page.getByRole("button", { name: "시작하기" })).toBeVisible();
});
