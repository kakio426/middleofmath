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

test("4학년 1학기 배정은 단원별 요약과 교사용 오답 해석 자리까지 이어진다", async ({ page }) => {
  await page.goto("/?set=grade4-semester1");

  await expect(page.getByLabel("현재 클래스")).toHaveValue("demo-class");
  await expect(page.getByLabel("현재 배정")).toHaveValue("demo-assignment");
  await expect(page.getByText("4학년 햇살반", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "3단원 · 곱셈과 나눗셈" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "5단원 · 막대그래프" })).toBeVisible();
  await expect(page.locator(".teacher-summary-unit")).toHaveCount(2);

  await page.getByRole("button", { name: /3번 · 민들레/ }).first().click();
  await expect(page.getByRole("heading", { name: "3번 · 민들레" })).toBeVisible();
  await expect(page.getByText("오답 해석", { exact: true })).toBeVisible();
  await expect(page.getByText(
    "로컬 데모에서는 오답 해석을 불러오지 않습니다. 실제 기록에서만 표시됩니다."
  )).toBeVisible();

  await page.getByRole("button", { name: "클래스·학생" }).click();
  const classTerm = page.getByLabel("학년·학기");
  await expect(classTerm).toHaveValue("3-2");
  await expect(classTerm.locator("option")).toHaveText([
    "3학년 2학기",
    "4학년 1학기",
    "4학년 2학기",
    "5학년 1학기",
    "5학년 2학기",
    "6학년 1학기",
    "6학년 2학기"
  ]);
});

test("4학년 2학기 여섯 단원은 교사 요약에서 단계별 근거로 이어진다", async ({ page }) => {
  await page.goto("/?set=grade4-semester2");

  await expect(page.getByText("4학년 햇살반", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "1단원 · 삼각형" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "2단원 · 분수의 덧셈과 뺄셈" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "3단원 · 사각형" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "4단원 · 소수의 덧셈과 뺄셈" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "5단원 · 다각형" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "6단원 · 꺾은선그래프" })).toBeVisible();
  await expect(page.locator(".teacher-summary-unit")).toHaveCount(6);

  await page.getByRole("button", { name: /3번 · 민들레/ }).first().click();
  await expect(page.getByRole("heading", { name: "3번 · 민들레" })).toBeVisible();
  await expect(page.getByText("오답 해석", { exact: true })).toBeVisible();
  await expect(page.getByText(/같은 길이인 두 변/).first()).toBeVisible();
  await page.locator(".teacher-findings").getByRole("button", {
    name: /동분모 덧셈 계산/
  }).click();
  await expect(page.getByText(/분모가 같은 두 분수/).first()).toBeVisible();
  await page.locator(".teacher-findings").getByRole("button", {
    name: /수직인 변 찾기/
  }).click();
  await expect(
    page.getByText(/직각 표시를 근거로 기준 변과 수직인 변/).first()
  ).toBeVisible();
  await page.locator(".teacher-findings").getByRole("button", {
    name: /소수의 빈 자리까지 읽고 쓰기/
  }).click();
  await expect(page.getByText(/소수점 아래 0도 자리를 나타낸다는 점/).first()).toBeVisible();
  await page.locator(".teacher-findings").getByRole("button", {
    name: /다각형의 선과 둘러싸임 확인하기/
  }).click();
  await expect(page.getByText(/곧은 선으로만 둘러싸였고/).first()).toBeVisible();
  await page.locator(".teacher-findings").getByRole("button", {
    name: /세로 눈금 한 칸의 값 정하기/
  }).click();
  await expect(page.getByText(/표시된 두 눈금값의 차이/).first()).toBeVisible();
});

test("5학년 1학기 다섯 단원은 교사 요약에서 단원별 단계 근거로 이어진다", async ({ page }) => {
  await page.goto("/?set=grade5-semester1");

  await expect(page.getByText("5학년 햇살반", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "1단원 · 자연수의 혼합 계산" }))
    .toBeVisible();
  await expect(page.getByRole("heading", { name: "2단원 · 약수와 배수" }))
    .toBeVisible();
  await expect(page.getByRole("heading", { name: "3단원 · 대응 관계" }))
    .toBeVisible();
  await expect(page.getByRole("heading", { name: "4단원 · 약분과 통분" }))
    .toBeVisible();
  await expect(page.getByRole("heading", { name: "5단원 · 분수의 덧셈과 뺄셈" }))
    .toBeVisible();
  await expect(page.locator(".teacher-summary-unit")).toHaveCount(5);

  await page.getByRole("button", { name: /3번 · 민들레/ }).first().click();
  await expect(page.getByRole("heading", { name: "3번 · 민들레" })).toBeVisible();
  await expect(page.getByText("오답 해석", { exact: true })).toBeVisible();
  await expect(page.getByText(/곱셈을 먼저 계산하는 순서/).first()).toBeVisible();
  await page.locator(".teacher-findings").getByRole("button", {
    name: /약수 빠짐없이 찾기/
  }).click();
  await expect(page.getByText(/1과 자기 자신까지 포함/).first()).toBeVisible();
  await page.locator(".teacher-findings").getByRole("button", {
    name: /대응표에서 새 짝 찾기/
  }).click();
  await expect(page.getByText(/두 양의 짝이 어떻게 함께 변하는지/).first())
    .toBeVisible();
  await page.locator(".teacher-findings").getByRole("button", {
    name: /분자와 분모에 같은 수 곱하기/
  }).click();
  await expect(page.getByText(/분자와 분모에 서로 다른 계산/).first())
    .toBeVisible();
  await page.locator(".teacher-findings").getByRole("button", {
    name: /분모가 다른 분수 더하기/
  }).click();
  await expect(page.getByText(/먼저 통분하고 바뀐 분자를 더하는지/).first())
    .toBeVisible();

  await page.locator(".teacher-student-select").selectOption("student-12");
  await expect(page.getByRole("heading", { name: "12번 · 나무" })).toBeVisible();
  await expect(page.getByText("한 번 관찰").first()).toBeVisible();
  await expect(page.getByText(
    "이 활동에서 한 번만 나타났습니다. 확정하지 않고 다시 살펴봅니다."
  )).toBeVisible();
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
