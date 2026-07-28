import { expect, test } from "@playwright/test";

test("콘텐츠 스튜디오 라이브러리에서 판단 편집 미리보기로 이동한다", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "어떤 진단을 다듬을까요?" })).toBeVisible();
  await page.getByRole("button", { name: "계속 편집" }).click();
  await expect(page.getByText("학생 화면 미리보기")).toBeVisible();
  await expect(page.getByText("태블릿 · 자동 진행 없음")).toBeVisible();
});

test("스튜디오가 라이트·다크 테마를 명시적으로 전환한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /다크 모드/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: /라이트 모드/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
