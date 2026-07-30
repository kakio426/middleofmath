import { expect, test } from "@playwright/test";
import {
  grade3Semester2CompleteDiagnosis,
  grade4Semester1Diagnosis
} from "@middle-of-math/content";

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

async function latestLocalJudgmentPayload(
  page: import("@playwright/test").Page
): Promise<Record<string, unknown> | null> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("middle-of-math", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const records = await new Promise<Array<{ event?: {
      clientSeq?: number;
      eventType?: string;
      payload?: Record<string, unknown>;
    } }>>((resolve, reject) => {
      const request = database.transaction("events").objectStore("events").getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return records
      .map((record) => record.event)
      .filter((event) => event?.eventType === "judgment_confirmed")
      .sort((left, right) => (right?.clientSeq ?? 0) - (left?.clientSeq ?? 0))[0]
      ?.payload ?? null;
  });
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
      const splitConnectors = await prompt.locator(".mom-readable-keep").evaluateAll((groups) =>
        groups
          .filter((group) => {
            const tokens = [...group.querySelectorAll(".mom-readable-token")];
            return new Set(tokens.map((token) => Math.round(token.getBoundingClientRect().top))).size > 1;
          })
          .map((group) => group.textContent)
      );
      expect(splitConnectors, `${judgment.id}에서 연결어가 다음 어절과 분리됨`).toEqual([]);
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
  await expect(page.locator("body")).not.toContainText(
    /오개념|오답 근거|공통 관찰 기준|오답이 만들어진 과정|교사가 확인할 판단|정답입니다|오답입니다/
  );
});

test("선택지 순서는 같은 세션에서 재현되고 실제 제시 순서가 근거에 저장된다", async ({ page }) => {
  await enterFreshActivityList(page, "34");
  await startUnitActivity(page, "multiplication");

  const firstJudgment = grade3Semester2CompleteDiagnosis.judgments.find(
    (judgment) => judgment.unitId === "multiplication"
  );
  expect(firstJudgment).toBeTruthy();
  const firstOrder = await page.locator(".mom-choice").allTextContents();

  await page.reload();
  await assignmentCard(page, "multiplication")
    .getByRole("button", { name: "이어서 하기" })
    .click();
  await expect(page.locator(".student-question h1")).toHaveText(firstJudgment!.prompt);
  await expect(page.locator(".mom-choice")).toHaveText(firstOrder);

  await page.locator(".mom-choice").first().click();
  await page.getByRole("button", { name: "다음" }).click();

  const expectedChoiceIds = firstOrder.map((label) =>
    firstJudgment!.choices.find((choice) => choice.label === label)?.id
  );
  expect(expectedChoiceIds.every(Boolean)).toBe(true);
  await expect.poll(() => latestLocalJudgmentPayload(page)).toMatchObject({
    presentedChoiceIds: expectedChoiceIds
  });
});

test("서로 다른 세션에서는 첫 선택지 위치가 고정되지 않는다", async ({ page }) => {
  const firstLabels: string[] = [];

  for (const rosterKey of Array.from({ length: 20 }, (_, index) => String(40 + index))) {
    await enterFreshActivityList(page, rosterKey);
    await startUnitActivity(page, "multiplication");
    firstLabels.push((await page.locator(".mom-choice").first().textContent()) ?? "");
    await page.getByRole("button", { name: "나가기" }).click();
  }

  expect(new Set(firstLabels).size).toBeGreaterThan(1);
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

test("두 문장으로 된 질문은 의미 단위로 자연스럽게 줄을 바꾼다", async ({ page }) => {
  await page.setViewportSize({ width: 1060, height: 720 });
  await enterFreshActivityList(page, "33");
  await startUnitActivity(page, "multiplication");

  const prompt = page.locator(".student-question h1");
  await expect(prompt).toHaveText("24×3을 계산하려고 해요. 먼저 20×3은 얼마일까요?");
  const sentences = prompt.locator(".mom-readable-sentence");
  await expect(sentences).toHaveCount(2);
  const sentenceTops = await sentences.evaluateAll((items) =>
    items.map((item) => Math.round(item.getBoundingClientRect().top))
  );
  expect(sentenceTops[1]).toBeGreaterThan(sentenceTops[0]);

  const connectorTokens = prompt.locator(".mom-readable-keep .mom-readable-token");
  await expect(connectorTokens).toHaveCount(2);
  const connectorTops = await connectorTokens.evaluateAll((items) =>
    items.map((item) => Math.round(item.getBoundingClientRect().top))
  );
  expect(new Set(connectorTops).size).toBe(1);
});

test("6개 단원의 64개 문제는 세로형 태블릿에서 어절 중간에 줄바꿈하지 않는다", async ({ page }) => {
  test.slow();
  await page.setViewportSize({ width: 768, height: 1024 });
  await enterFreshActivityList(page, "31");
  await verifyEveryQuestionWrapsByWord(page);
});

test("6개 단원의 64개 문제는 휴대전화에서도 어절 중간에 줄바꿈하거나 가로로 넘치지 않는다", async ({ page }) => {
  test.slow();
  await page.setViewportSize({ width: 390, height: 844 });
  await enterFreshActivityList(page, "32");
  await verifyEveryQuestionWrapsByWord(page);
});

test("측정 14문제의 의미 그림은 휴대전화에서 정답을 보이지 않고 비율을 유지한다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "dark" });
  await enterFreshActivityList(page, "35");
  await startUnitActivity(page, "measurement");

  const judgments = grade3Semester2CompleteDiagnosis.judgments.filter(
    (judgment) => judgment.unitId === "measurement"
  );
  expect(judgments).toHaveLength(14);

  for (const [index, judgment] of judgments.entries()) {
    const visual = page.locator(".mom-semantic-measure");
    await expect(visual).toBeVisible();
    await expect(visual).toHaveAttribute("role", "img");
    await expect(visual).toHaveAttribute("preserveAspectRatio", "xMidYMid meet");

    const rendered = await visual.evaluate((element) => {
      const svg = element as SVGSVGElement;
      const bounds = svg.getBoundingClientRect();
      return {
        width: bounds.width,
        parentWidth: svg.parentElement?.getBoundingClientRect().width ?? 0,
        horizontalOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
        minimumEffectiveTextSize: Math.min(
          ...[...svg.querySelectorAll("text")].map((text) => {
            const viewBoxWidth = svg.viewBox.baseVal.width;
            const scale = viewBoxWidth > 0 ? bounds.width / viewBoxWidth : 1;
            return Number.parseFloat(getComputedStyle(text).fontSize) * scale;
          })
        ),
        stroke: getComputedStyle(
          svg.querySelector(".mom-measure-card, .mom-measure-shape, .mom-measure-line") ??
            svg
        ).stroke,
        cardFill: getComputedStyle(
          svg.querySelector(".mom-measure-card, .mom-measure-shape") ?? svg
        ).fill,
        text: svg.textContent ?? "",
        ariaLabel: svg.getAttribute("aria-label") ?? ""
      };
    });
    const correctLabel = judgment.choices.find((choice) => choice.correct)?.label ?? "";

    expect(rendered.width, judgment.id).toBeLessThanOrEqual(rendered.parentWidth + 1);
    expect(rendered.horizontalOverflow, judgment.id).toBe(false);
    expect(rendered.minimumEffectiveTextSize, judgment.id).toBeGreaterThanOrEqual(14);
    expect(rendered.stroke, judgment.id).not.toBe(rendered.cardFill);
    expect(`${rendered.text} ${rendered.ariaLabel}`, judgment.id).not.toContain(correctLabel);

    await page.locator(".mom-choice").first().click();
    await page.getByRole("button", { name: "다음" }).click();
    if (index < judgments.length - 1) {
      await expect(page.locator(".student-question h1")).toBeVisible();
    }
  }
});

test("4학년 1학기 큰 수와 각도는 데스크톱·태블릿·휴대전화에서 읽기 쉽게 제시된다", async ({ page }) => {
  test.setTimeout(120_000);
  const viewports = [
    { width: 1280, height: 720 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 }
  ];
  const units = ["large-numbers", "angles"] as const;

  for (const [unitIndex, unitId] of units.entries()) {
    const judgments = grade4Semester1Diagnosis.judgments.filter(
      (judgment) => judgment.unitId === unitId
    );
    for (const [viewportIndex, viewport] of viewports.entries()) {
      await page.setViewportSize(viewport);
      await page.goto("/?set=grade4-semester1");
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.reload();
      await page.getByLabel("클래스 코드").fill("MATH27");
      await page.getByLabel("내 번호").fill(
        String(81 + unitIndex * viewports.length + viewportIndex)
      );
      await page.getByRole("button", { name: "활동 확인하기" }).click();

      const card = page.locator(
        `[data-assignment-id="${grade4Semester1Diagnosis.manifest.id}-${unitId}"]`
      );
      await expect(card).toContainText("12문제 · 약 6분");
      await card.getByRole("button", { name: "시작하기" }).click();

      for (const [index, judgment] of judgments.entries()) {
        const prompt = page.locator(".student-question h1");
        await expect(prompt).toHaveText(judgment.prompt);
        await expect(page.locator(".mom-choice")).toHaveCount(
          judgment.choices.length
        );

        const splitPromptTokens = await prompt
          .locator(".mom-readable-token")
          .evaluateAll((tokens) =>
            tokens
              .filter((token) => token.getClientRects().length !== 1)
              .map((token) => token.textContent)
          );
        expect(
          splitPromptTokens,
          `${viewport.width}px ${judgment.id} 질문에서 어절 내부 줄바꿈 발생`
        ).toEqual([]);

        const splitChoiceTokens = await page
          .locator(".mom-choice .mom-readable-token")
          .evaluateAll((tokens) =>
            tokens
              .filter((token) => token.getClientRects().length !== 1)
              .map((token) => token.textContent)
          );
        expect(
          splitChoiceTokens,
          `${viewport.width}px ${judgment.id} 선택지에서 어절 내부 줄바꿈 발생`
        ).toEqual([]);

        expect(
          await page.evaluate(
            () =>
              document.documentElement.scrollWidth >
              document.documentElement.clientWidth
          ),
          `${viewport.width}px ${judgment.id}에서 가로 넘침 발생`
        ).toBe(false);

        if (judgment.visual.kind === "place-value-chart") {
          const table = page.locator(".mom-place-value-chart");
          await expect(table).toBeVisible();
          await expect(table.locator("thead th")).toHaveCount(
            judgment.visual.digits.length
          );
          await expect(table.locator("tbody td")).toHaveCount(
            judgment.visual.digits.length
          );
          await expect(table.locator("tbody td.is-highlighted")).toHaveCount(
            judgment.visual.highlightIndexes?.length ?? 0
          );
          const tableLayout = await table.evaluate((element) => ({
            width: element.getBoundingClientRect().width,
            parentWidth:
              element.parentElement?.getBoundingClientRect().width ?? 0,
            horizontalOverflow: element.scrollWidth > element.clientWidth
          }));
          expect(tableLayout.width, judgment.id).toBeLessThanOrEqual(
            tableLayout.parentWidth + 1
          );
          expect(tableLayout.horizontalOverflow, judgment.id).toBe(false);
        } else {
          await expect(page.locator(".mom-place-value-chart")).toHaveCount(0);
        }

        if (judgment.visual.kind === "angle-figure") {
          const visual = page.locator(".mom-angle-figure");
          await expect(visual).toBeVisible();
          await expect(visual).not.toHaveAttribute(
            "aria-label",
            new RegExp(`${judgment.visual.degrees}도`)
          );
          await expect(page.locator(".mom-protractor")).toHaveCount(
            judgment.visual.mode === "protractor" ? 1 : 0
          );
        }
        if (judgment.visual.kind === "polygon-angle-diagram") {
          const visual = page.locator(".mom-polygon-angle");
          await expect(visual).toBeVisible();
          await expect(
            visual.locator(".mom-polygon-angle-label")
          ).toHaveCount(judgment.visual.angles.length);
        }

        await page.locator(".mom-choice").first().click();
        await page.getByRole("button", { name: "다음" }).click();
        if (index < judgments.length - 1) {
          await expect(page.locator(".student-question h1")).toBeVisible();
        }
      }

      await expect(
        page.getByRole("heading", { name: "끝까지 참여했어요" })
      ).toBeVisible();
    }
  }
});
