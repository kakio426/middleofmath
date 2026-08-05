import { expect, test } from "@playwright/test";

test("교사 운영 앱은 설정 누락 시 데모로 내려가지 않는다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "서비스 준비가 완료되지 않았습니다" })).toBeVisible();
  await expect(page.getByText("관리자에게 교사용 서비스 설정을 확인해 달라고 요청해 주세요.")).toBeVisible();
  // 이 검사의 목적은 문구가 아니라 "데모로 내려가지 않는다"이므로,
  // 로그인 화면과 반 요약 대시보드가 모두 안 뜨는 것까지 확인한다.
  await expect(page.getByRole("button", { name: "로그인" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "반에서 함께 다시 볼 생각" })).toHaveCount(0);
});
