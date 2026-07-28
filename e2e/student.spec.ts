import { expect, test } from "@playwright/test";

test("학생이 코드로 입장하고 진단을 앞으로만 시작한다", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /코드로 들어가요/ })).toBeVisible();
  await page.getByLabel("클래스 코드").fill("MATH27");
  await page.getByLabel("내 번호").fill("3");
  await page.getByRole("button", { name: "활동 확인하기" }).click();

  await expect(page.getByRole("heading", { name: /할 수학 활동이에요/ })).toBeVisible();
  await page.getByRole("button", { name: "시작하기" }).click();

  await expect(page.locator(".student-progress-wrap")).toBeVisible();
  await expect(page.getByRole("button", { name: "잘 모르겠어요" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /이전|뒤로/ })).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(/오개념|정답입니다|오답입니다/);
});

test("학생 태블릿 화면이 다크 모드에서도 열린다", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.getByLabel("클래스 코드")).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("color-scheme", /dark|light dark/);
});
