import { expect, test } from "@playwright/test";

test("스튜디오 운영 앱은 설정 누락 시 데모로 내려가지 않는다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "스튜디오 설정이 필요합니다" })).toBeVisible();
  await expect(page.getByText("VITE_DEMO_MODE=true")).toBeVisible();
});
