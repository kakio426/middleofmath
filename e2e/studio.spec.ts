import { expect, test } from "@playwright/test";

test("콘텐츠 스튜디오 라이브러리에서 판단 편집 미리보기로 이동한다", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "어떤 진단을 다듬을까요?" })).toBeVisible();
  await page.getByRole("button", { name: "계속 편집" }).click();
  await expect(page.getByText("학생 화면 미리보기")).toBeVisible();
  await expect(page.getByText("태블릿 · 자동 진행 없음")).toBeVisible();
});

test("교사는 학생에게 숨겨진 오답 생성 과정과 오개념을 읽기 전용으로 검수한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "계속 편집" }).click();

  const panel = page.locator(".studio-form-section").filter({
    has: page.getByRole("heading", { name: "오답 근거" })
  });
  await expect(panel).toBeVisible();
  await expect(panel.getByText("공통 관찰 기준")).toBeVisible();
  await expect(panel.getByText("곱해지는 수의 자릿값을 없앰")).toBeVisible();
  await expect(panel.getByText("곱셈을 덧셈으로 바꿈")).toBeVisible();
  await expect(panel.getByText("20을 2로 읽고 2×3=6으로 계산했습니다.")).toBeVisible();
  await expect(panel.locator(".studio-rationale-list > li")).toHaveCount(2);
  await expect(panel.locator("input, textarea, button")).toHaveCount(0);
});

test("스튜디오가 라이트·다크 테마를 명시적으로 전환한다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /다크 모드/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: /라이트 모드/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("기존 1.x 초안은 진단 게이트 적용 전임을 검수 화면에 분명히 알린다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "검수", exact: true }).click();

  await expect(
    page.getByRole("heading", {
      name: "이 버전은 진단 게이트 적용 대상이 아닙니다"
    })
  ).toBeVisible();
  await expect(page.getByText("DI_GATE_NOT_ENFORCED")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "발행 규칙을 모두 통과했습니다" })
  ).toHaveCount(0);
});

test("검수 화면에서 고정 학습맵과 부분 일치 범위를 확인할 수 있다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "검수", exact: true }).click();

  await expect(
    page.getByRole("heading", {
      name: "2.x용 교차표 · 17개 성취기준 · 32개 진단 단계"
    })
  ).toBeVisible();
  await expect(page.getByText("현재 1.x 적용 전")).toBeVisible();
  await expect(
    page.getByText(/현재 초안의 다음 버전 1.0.1에는 아직 적용하지 않습니다/)
  ).toBeVisible();
  await expect(page.getByText(/3ef0563/)).toBeVisible();
  await expect(
    page.getByText(/학생의 부족 단계를 자동 판정하지 않습니다/)
  ).toBeVisible();
});
