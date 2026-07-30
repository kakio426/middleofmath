import { expect, test } from "@playwright/test";

test("교사가 반 요약에서 실제 범위와 학생 근거로 내려간다", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByLabel("현재 클래스")).toHaveValue("demo-class");
  await expect(page.getByLabel("현재 배정")).toHaveValue("demo-assignment");
  await expect(page.getByRole("heading", { name: "반에서 함께 다시 볼 생각" })).toBeVisible();
  await expect(page.getByText("4명", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: /3번 · 민들레/ }).first().click();
  await expect(page.getByRole("heading", { name: "3번 · 민들레" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "시도 이력" })).toBeVisible();
  await expect(page.getByText("현재 해석")).toBeVisible();
});

test("학부모 공유본은 교사 검토 버튼을 눌렀을 때만 출력한다", async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => document.body.setAttribute("data-print-requested", "true");
  });
  await page.goto("/");
  await page.getByRole("button", { name: /3번 · 민들레/ }).first().click();
  await page.getByRole("tab", { name: "학부모 공유 리포트" }).click();

  await expect(page.locator("body")).not.toHaveAttribute("data-print-requested", "true");
  await page.getByRole("button", { name: "검토 완료 · 인쇄/PDF" }).click();
  await expect(page.locator("body")).toHaveAttribute("data-print-requested", "true");
  const recordedPrintSnapshot = page.locator(".teacher-export-print .parent-report-paper");
  await expect(recordedPrintSnapshot).toHaveCount(1);
  await expect(recordedPrintSnapshot).toContainText("민들레의 수학 생각 기록");
  await expect(recordedPrintSnapshot).not.toContainText("3번");
});

test("교사 대시보드가 다크 모드에서도 같은 컨텍스트를 유지한다", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.getByLabel("현재 클래스")).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("color-scheme", /dark|light dark/);
});

test("한 번의 관찰은 확정하지 않고 보호자 연습 항목에서 제외한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /3번 · 민들레/ }).first().click();

  await expect(page.getByText("한 번 관찰").first()).toBeVisible();
  await expect(
    page.getByText("이 활동에는 같은 신호를 확인할 문항이 한 개뿐이었습니다.")
  ).toBeVisible();
  await expect(page.getByText(/반복 확인 0 · 추가 관찰 3/)).toBeVisible();

  await page.getByRole("tab", { name: "학부모 공유 리포트" }).click();
  await expect(page.locator(".parent-support-list article")).toHaveCount(0);
  await expect(
    page.getByText(/이번 활동에서는 다시 살펴볼 지점을 확정하지 않았습니다/)
  ).toBeVisible();
});

test("교사용 근거에서 검수된 이전 학기 단계만 편집 참고로 보여준다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /3번 · 민들레/ }).first().click();

  await page.locator(".teacher-findings").getByRole("button", {
    name: /분모와 분자의 역할/
  }).click();
  const prerequisite = page.locator(".teacher-prerequisite-note");
  await expect(prerequisite).toContainText(
    "먼저 확인할 이전 학기 단계 (편집 참고)"
  );
  await expect(prerequisite).toContainText("부분을 분수로 나타냄");
  await expect(prerequisite).toContainText("[4수01-09] · 참고");

  await page.locator(".teacher-findings").getByRole("button", {
    name: /그림그래프의 범례/
  }).click();
  await expect(page.locator(".teacher-prerequisite-note")).toHaveCount(0);
});
