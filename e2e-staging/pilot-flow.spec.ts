import { expect, test } from "@playwright/test";

const teacherUrl = required("STAGING_TEACHER_URL");
const studentUrl = required("STAGING_STUDENT_URL");
const studioUrl = required("STAGING_STUDIO_URL");
const teacherEmail = required("STAGING_TEACHER_EMAIL");
const teacherPassword = required("STAGING_TEACHER_PASSWORD");

test("초대 교사부터 학부모 PDF 요청까지 실제 staging 파일럿 흐름", async ({ browser }) => {
  const teacherContext = await browser.newContext();
  const teacher = await teacherContext.newPage();
  await teacher.addInitScript(() => {
    window.print = () => document.body.setAttribute("data-print-requested", "true");
  });
  await teacher.goto(teacherUrl);
  await teacher.getByLabel("이메일").fill(teacherEmail);
  await teacher.getByLabel("비밀번호").fill(teacherPassword);
  await teacher.getByRole("button", { name: "로그인" }).click();
  await expect(teacher.getByRole("heading", { name: "반에서 함께 다시 볼 생각" })).toBeVisible();

  const pilotName = `파일럿 ${Date.now()}`;
  await teacher.getByRole("button", { name: "학급·학생" }).click();
  const hasExistingClass = Boolean(await teacher.getByLabel("현재 학급").inputValue());
  if (!hasExistingClass) {
    await teacher.getByLabel("학급 이름").fill(pilotName);
    await teacher.getByRole("button", { name: "학급 만들기" }).click();
  } else {
    const newClass = teacher.locator(".teacher-class-create");
    await newClass.getByLabel("학급 이름").fill(pilotName);
    await newClass.getByRole("button", { name: "학급 만들기" }).click();
  }
  await expect(teacher.getByLabel("현재 학급")).toContainText(pilotName);
  const joinCode = (await teacher.locator(".teacher-code-strip strong").textContent())?.trim();
  expect(joinCode).toMatch(/^[A-Z0-9]{6}$/);

  await teacher.getByLabel(/번호/).last().fill("1");
  await teacher.getByLabel(/별칭/).fill("민들레");
  await teacher.getByRole("button", { name: "학생 추가" }).click();
  await expect(teacher.getByRole("cell", { name: "민들레" })).toBeVisible();
  const joinSecret = (await teacher.locator(".teacher-notice").textContent())?.match(/개인 코드 ([A-Z0-9]{6})/)?.[1];
  expect(joinSecret).toMatch(/^[A-Z0-9]{6}$/);

  await teacher.getByRole("button", { name: "진단 배정" }).click();
  await teacher.getByRole("button", { name: new RegExp(pilotName) }).click();
  await teacher.getByRole("button", { name: "다음" }).click();
  const diagnosisDecision = teacher.locator(".teacher-decision").filter({
    hasText: "3학년 2학기"
  }).first();
  await diagnosisDecision.click();
  await teacher.getByRole("button", { name: "다음" }).click();
  const unitDecision = teacher.locator(".teacher-decision").first();
  const diagnosisSummary = await unitDecision.textContent();
  const expectedJudgmentCount = Number(
    diagnosisSummary?.match(/(\d+)개 문항/)?.[1] ?? 0
  );
  expect(expectedJudgmentCount).toBeGreaterThan(0);
  expect(expectedJudgmentCount).toBeLessThanOrEqual(14);
  await unitDecision.click();
  await teacher.getByRole("button", { name: "다음" }).click();
  await teacher.getByRole("button", { name: "다음" }).click();
  await teacher.getByRole("button", { name: "이 내용으로 배정" }).click();

  const studentContext = await browser.newContext({ ...devicesTablet() });
  const student = await studentContext.newPage();
  await student.goto(studentUrl);
  await student.getByLabel("클래스 코드").fill(joinCode!);
  await student.getByLabel("내 번호").fill("1");
  await student.getByLabel("내 개인 코드").fill(joinSecret!);
  await student.getByRole("button", { name: "활동 확인하기" }).click();
  await student.getByRole("button", { name: "시작하기" }).click();
  let observedJudgmentCount = 0;
  while (
    observedJudgmentCount < 80
    && await student.getByRole(
      "heading",
      { name: "끝까지 참여했어요" }
    ).count() === 0
  ) {
    await expect(student.locator(".mom-choice").first()).toBeVisible();
    await student.locator(".mom-choice").first().click();
    await student.getByRole("button", { name: "다음", exact: true }).click();
    observedJudgmentCount += 1;
  }
  await expect(student.getByRole("heading", { name: "끝까지 참여했어요" })).toBeVisible();
  expect(observedJudgmentCount).toBe(expectedJudgmentCount);

  await teacher.getByRole("button", { name: "반 요약" }).click();
  await teacher.getByLabel("현재 학급").selectOption({ label: pilotName });
  await expect.poll(async () => teacher.locator(".teacher-metrics article").first().textContent(), { timeout: 30_000 }).toContain("1명");
  await teacher.getByRole("button", { name: /1번 · 민들레/ }).first().click();
  await teacher.getByRole("tab", { name: "가정 공유용 결과표" }).click();
  await teacher.getByRole("button", { name: "검토 완료 · 인쇄/PDF" }).click();
  await expect(teacher.locator("body")).toHaveAttribute("data-print-requested", "true");

  await studentContext.close();
  await teacherContext.close();
});

test("staging studio가 실제 설정의 로그인 화면을 연다", async ({ page }) => {
  await page.goto(studioUrl);
  await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();
  await expect(page.getByText("스튜디오 설정이 필요합니다")).toHaveCount(0);
});

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for the staging smoke test.`);
  return value;
}

function devicesTablet() {
  return {
    viewport: { width: 820, height: 1180 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  };
}
