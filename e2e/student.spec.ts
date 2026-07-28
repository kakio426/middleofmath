import { expect, test } from "@playwright/test";
import { grade3Semester2CompleteDiagnosis } from "@middle-of-math/content";

async function enterFreshActivityList(page: import("@playwright/test").Page, rosterKey: string) {
  await page.goto("/");
  await page.getByLabel("클래스 코드").fill("MATH27");
  await page.getByLabel("내 번호").fill(rosterKey);
  await page.getByRole("button", { name: "활동 확인하기" }).click();
}

function assignmentCard(page: import("@playwright/test").Page, unitId: string) {
  return page.locator(
    `[data-assignment-id="${grade3Semester2CompleteDiagnosis.manifest.id}-${unitId}"]`
  );
}

async function startUnitActivity(page: import("@playwright/test").Page, unitId: string) {
  await assignmentCard(page, unitId).getByRole("button", { name: "시작하기" }).click();
}

async function verifyEveryQuestionWrapsByWord(page: import("@playwright/test").Page) {
  for (const unit of grade3Semester2CompleteDiagnosis.manifest.units) {
    const judgments = grade3Semester2CompleteDiagnosis.judgments.filter(
      (judgment) => judgment.unitId === unit.id
    );
    await startUnitActivity(page, unit.id);

    for (const [index, judgment] of judgments.entries()) {
      const prompt = page.locator(".student-question h1");
      await expect(prompt).toHaveText(judgment.prompt);
      await expect(prompt.locator(".mom-readable-token")).toHaveCount(
        judgment.prompt.trim().split(/\s+/).length
      );

      const promptLayout = await prompt.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          wordBreak: style.wordBreak,
          overflowWrap: style.overflowWrap,
          horizontalOverflow: element.scrollWidth > element.clientWidth
        };
      });
      expect(promptLayout).toMatchObject({
        wordBreak: "keep-all",
        overflowWrap: "break-word",
        horizontalOverflow: false
      });

      const splitTokens = await prompt.locator(".mom-readable-token").evaluateAll((tokens) =>
        tokens.filter((token) => token.getClientRects().length !== 1).map((token) => token.textContent)
      );
      expect(splitTokens, `${judgment.id}에서 어절 내부 줄바꿈 발생`).toEqual([]);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
        `${judgment.id}에서 가로 넘침 발생`
      ).toBe(false);

      await page.locator(".mom-choice").first().click();
      await page.getByRole("button", { name: "다음" }).click();
      if (index < judgments.length - 1) {
        await expect(page.locator(".student-question h1")).toBeVisible();
      }
    }

    await expect(page.getByRole("heading", { name: "끝까지 참여했어요" })).toBeVisible();
    await page.getByRole("button", { name: "활동 목록으로" }).click();
  }
}

test("학생이 코드로 입장하고 진단을 앞으로만 시작한다", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /코드로 들어가요/ })).toBeVisible();
  await page.getByLabel("클래스 코드").fill("MATH27");
  await page.getByLabel("내 번호").fill("3");
  await page.getByRole("button", { name: "활동 확인하기" }).click();

  await expect(page.getByRole("heading", { name: /할 수학 활동이에요/ })).toBeVisible();
  await startUnitActivity(page, "multiplication");

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

test("3학년 2학기 활동은 4개 영역 아래 6개 단원으로 나뉜다", async ({ page }) => {
  await enterFreshActivityList(page, "30");

  await expect(page.getByRole("article")).toHaveCount(6);
  await expect(page.getByRole("heading", { name: "수와 연산" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "도형", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "측정", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "자료와 가능성" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "1단원 · 곱셈" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "6단원 · 그림그래프" })).toBeVisible();
  await expect(page.getByText(/64개의 짧은 생각/)).toHaveCount(0);
  await expect(assignmentCard(page, "fraction")).toContainText("14문제 · 약 7분");
});

test("6개 단원의 64개 문제는 세로형 태블릿에서 어절 중간에 줄바꿈하지 않는다", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await enterFreshActivityList(page, "31");
  await verifyEveryQuestionWrapsByWord(page);
});

test("6개 단원의 64개 문제는 휴대전화에서도 어절 중간에 줄바꿈하거나 가로로 넘치지 않는다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterFreshActivityList(page, "32");
  await verifyEveryQuestionWrapsByWord(page);
});
