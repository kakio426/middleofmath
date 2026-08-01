import { expect, test, type Locator } from "@playwright/test";
import {
  grade3Semester1Diagnosis,
  grade3Semester2CompleteDiagnosis,
  grade4Semester1Diagnosis,
  grade4Semester2Diagnosis,
  grade5Semester1Diagnosis,
  grade5Semester2Diagnosis,
  grade6Semester1Diagnosis,
  grade6Semester2Diagnosis
} from "@middle-of-math/content";

function renderedMathText(text: string) {
  return text.replace(/(\d+)\s*\/\s*(\d+)/g, "$1$2");
}

async function expectRenderedMathText(locator: Locator, source: string) {
  await expect(locator).toHaveText(renderedMathText(source));
  const expectedFractionLabels = [...source.matchAll(/(\d+)\s*\/\s*(\d+)/g)].map(
    ([, numerator, denominator]) => `${denominator}분의 ${numerator}`
  );

  if (expectedFractionLabels.length > 0) {
    const fractions = locator.locator(".mom-stacked-fraction");
    await expect(fractions).toHaveCount(expectedFractionLabels.length);
    expect(
      await fractions.evaluateAll((elements) =>
        elements.map((element) => element.getAttribute("aria-label"))
      )
    ).toEqual(expectedFractionLabels);
  }
}

async function expectFractionCentersAligned(locator: Locator, label: string) {
  const measurements = await locator.locator(".mom-stacked-fraction")
    .evaluateAll((fractions) => fractions.map((fraction) => {
      const fractionRect = fraction.getBoundingClientRect();
      const token = fraction.closest(".mom-readable-token");
      const tokenRect = token?.getBoundingClientRect();
      const container = fraction.closest("h1, .student-context, .mom-choice");
      const plainRects = container
        ? [...container.querySelectorAll(".mom-readable-token")]
          .filter((candidate) => !candidate.querySelector(".mom-stacked-fraction"))
          .map((candidate) => candidate.getBoundingClientRect())
          .filter((candidate) =>
            tokenRect ? Math.abs(candidate.top - tokenRect.top) < 10 : false
          )
        : [];
      const indicatorRect = container
        ?.querySelector(".mom-choice-indicator")
        ?.getBoundingClientRect();
      const targetCenter = plainRects.length > 0
        ? plainRects.reduce(
            (sum, rect) => sum + (rect.top + rect.bottom) / 2,
            0
          ) / plainRects.length
        : indicatorRect
          ? (indicatorRect.top + indicatorRect.bottom) / 2
          : null;
      return {
        ariaLabel: fraction.getAttribute("aria-label"),
        delta: targetCenter === null
          ? null
          : Math.abs((fractionRect.top + fractionRect.bottom) / 2 - targetCenter)
      };
    }));

  for (const measurement of measurements) {
    if (measurement.delta === null) {
      throw new Error(
        `${label}/${measurement.ariaLabel} 분수의 수직 중심 비교 기준을 찾지 못했습니다.`
      );
    }
    expect(
      measurement.delta,
      `${label}/${measurement.ariaLabel} 분수 수직 중심 오차`
    ).toBeLessThanOrEqual(2);
  }
}

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
      await expectRenderedMathText(prompt, judgment.prompt);
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
            const style = getComputedStyle(group);
            return group.getClientRects().length !== 1
              || group.scrollWidth > group.clientWidth
              || style.whiteSpace !== "nowrap";
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

test("3학년 1학기 네 단원 16문제는 세 화면 크기에서 독립 활동으로 읽힌다", async ({ page }) => {
  test.setTimeout(180_000);
  const viewports = [
    { width: 1280, height: 720 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 }
  ];

  for (const [viewportIndex, viewport] of viewports.entries()) {
    await page.setViewportSize(viewport);
    await page.goto("/?set=grade3-semester1");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await page.getByLabel("클래스 코드").fill("MATH27");
    await page.getByLabel("내 번호").fill(String(50 + viewportIndex));
    await page.getByRole("button", { name: "활동 확인하기" }).click();

    await expect(page.getByRole("article")).toHaveCount(
      grade3Semester1Diagnosis.manifest.units.length
    );
    await expect(page.getByRole("region", { name: "수와 연산" })).toBeVisible();
    await expect(page.getByRole("region", { name: "측정" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "그 밖의 영역" })).toHaveCount(0);

    for (const [unitIndex, unit] of grade3Semester1Diagnosis.manifest.units.entries()) {
      const judgments = grade3Semester1Diagnosis.judgments.filter(
        (judgment) => judgment.unitId === unit.id
      );
      const card = page.locator(
        `[data-assignment-id="${grade3Semester1Diagnosis.manifest.id}-${unit.id}"]`
      );
      await expect(card).toContainText(`${judgments.length}문제 · 약 3분`);
      await card.getByRole("button", { name: "시작하기" }).click();

      for (const [judgmentIndex, judgment] of judgments.entries()) {
        const prompt = page.locator(".student-question h1");
        await expectRenderedMathText(prompt, judgment.prompt);
        await expect(page.locator(".mom-choice")).toHaveCount(3);
        if (judgment.visual.kind !== "none") {
          await expect(page.locator(".mom-visual")).toHaveCount(1);
          await expect(page.locator(".mom-visual")).toHaveAttribute("role", "img");
        }
        expect(
          await prompt.locator(".mom-readable-token").evaluateAll((tokens) =>
            tokens
              .filter((token) => token.getClientRects().length !== 1)
              .map((token) => token.textContent)
          ),
          `${viewport.width}px ${judgment.id} 질문 어절 줄바꿈`
        ).toEqual([]);
        expect(
          await page.locator(".mom-choice .mom-readable-token").evaluateAll((tokens) =>
            tokens
              .filter((token) => token.getClientRects().length !== 1)
              .map((token) => token.textContent)
          ),
          `${viewport.width}px ${judgment.id} 선택지 어절 줄바꿈`
        ).toEqual([]);
        expect(
          await page.evaluate(() =>
            document.documentElement.scrollWidth > document.documentElement.clientWidth
          ),
          `${viewport.width}px ${judgment.id} 가로 넘침`
        ).toBe(false);

        await page.locator(".mom-choice").first().click();
        await page.getByRole("button", { name: "다음" }).click();
        if (judgmentIndex < judgments.length - 1) {
          await expect(page.locator(".student-question h1")).toBeVisible();
        }
      }

      await expect(page.getByRole("heading", { name: "끝까지 참여했어요" })).toBeVisible();
      if (unitIndex < grade3Semester1Diagnosis.manifest.units.length - 1) {
        await page.getByRole("button", { name: "활동 목록으로" }).click();
        await expect(page.getByRole("article")).toHaveCount(
          grade3Semester1Diagnosis.manifest.units.length
        );
      }
    }
  }
});

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
  await expectRenderedMathText(page.locator(".student-question h1"), firstJudgment!.prompt);
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
  test.setTimeout(60_000);
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
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 768, height: 1024 });
  await enterFreshActivityList(page, "31");
  await verifyEveryQuestionWrapsByWord(page);
});

test("6개 단원의 64개 문제는 휴대전화에서도 어절 중간에 줄바꿈하거나 가로로 넘치지 않는다", async ({ page }) => {
  test.setTimeout(180_000);
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

test("4학년 1학기 승인 단원은 데스크톱·태블릿·휴대전화에서 읽기 쉽게 제시된다", async ({ page }) => {
  test.setTimeout(240_000);
  const viewports = [
    { width: 1280, height: 720 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 }
  ];
  const units = [
    { id: "large-numbers", summary: "12문제 · 약 6분" },
    { id: "angles", summary: "12문제 · 약 6분" },
    { id: "multiplication-division", summary: "12문제 · 약 6분" },
    { id: "figure-transform", summary: "10문제 · 약 5분" },
    { id: "bar-graphs", summary: "10문제 · 약 5분" },
    { id: "patterns-relations", summary: "10문제 · 약 5분" }
  ] as const;

  for (const [unitIndex, unit] of units.entries()) {
    const unitId = unit.id;
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
      await expect(card).toContainText(unit.summary);
      await card.getByRole("button", { name: "시작하기" }).click();

      for (const [index, judgment] of judgments.entries()) {
        const prompt = page.locator(".student-question h1");
        await expectRenderedMathText(prompt, judgment.prompt);
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
            visual.locator(".mom-polygon-angle-value")
          ).toHaveCount(judgment.visual.angles.length);
        }
        if (judgment.visual.kind === "grid-transform-diagram") {
          const visual = page.locator(".mom-grid-transform");
          await expect(visual).toBeVisible();
          await expect(visual).not.toHaveAttribute(
            "aria-label",
            /오른쪽으로|왼쪽으로|위쪽으로|아래쪽으로|시계 방향|시계 반대 방향|좌우를 뒤집|위아래를 뒤집/
          );
          if (judgment.visual.mode === "point-move") {
            await expect(visual.locator(".mom-transform-point")).toHaveCount(2);
            await expect(
              visual.locator(".mom-transform-source-cell")
            ).toHaveCount(0);
          } else {
            await expect(
              visual.locator(".mom-transform-source-cell")
            ).toHaveCount((judgment.visual.sourceCells?.length ?? 0) + 1);
            await expect(
              visual.locator(".mom-transform-target-cell")
            ).toHaveCount((judgment.visual.targetCells?.length ?? 0) + 1);
          }
          await expect(visual.locator(".mom-transform-axis")).toHaveCount(
            judgment.visual.mode === "flip-left-right"
              || judgment.visual.mode === "flip-up-down"
              ? 1
              : 0
          );
          await expect(visual.locator(".mom-transform-center")).toHaveCount(
            judgment.visual.mode === "rotate" ? 1 : 0
          );
          const visualLayout = await visual.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return {
              left: rect.left,
              right: rect.right,
              parentLeft:
                element.parentElement?.getBoundingClientRect().left ?? 0,
              parentRight:
                element.parentElement?.getBoundingClientRect().right ?? 0
            };
          });
          expect(visualLayout.left, judgment.id).toBeGreaterThanOrEqual(
            visualLayout.parentLeft - 1
          );
          expect(visualLayout.right, judgment.id).toBeLessThanOrEqual(
            visualLayout.parentRight + 1
          );
        }
        if (judgment.visual.kind === "bar-chart-diagram") {
          const visual = page.locator(".mom-bar-chart");
          await expect(visual).toBeVisible();
          await expect(visual.locator(".mom-bar-mark")).toHaveCount(
            judgment.visual.mode === "table-match"
              ? judgment.visual.candidates!.reduce(
                  (count, candidate) => count + candidate.bars.length,
                  0
                )
              : judgment.visual.bars!.length
          );
          await expect(visual.locator(".mom-bar-chart-svg")).toHaveCount(
            judgment.visual.mode === "table-match" ? 3 : 1
          );
          const visualLayout = await visual.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return {
              left: rect.left,
              right: rect.right,
              parentLeft:
                element.parentElement?.getBoundingClientRect().left ?? 0,
              parentRight:
                element.parentElement?.getBoundingClientRect().right ?? 0,
              overflow: element.scrollWidth > element.clientWidth
            };
          });
          expect(visualLayout.left, judgment.id).toBeGreaterThanOrEqual(
            visualLayout.parentLeft - 1
          );
          expect(visualLayout.right, judgment.id).toBeLessThanOrEqual(
            visualLayout.parentRight + 1
          );
          expect(visualLayout.overflow, judgment.id).toBe(false);
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

test("4학년 2학기 삼각형 10문제는 세 화면 크기에서 정확하고 읽기 쉽게 제시된다", async ({ page }) => {
  test.setTimeout(180_000);
  const viewports = [
    { width: 1280, height: 720 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 }
  ];
  const judgments = grade4Semester2Diagnosis.judgments.filter(
    (judgment) => judgment.unitId === "triangles"
  );

  for (const [viewportIndex, viewport] of viewports.entries()) {
    await page.setViewportSize(viewport);
    await page.goto("/?set=grade4-semester2");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await page.getByLabel("클래스 코드").fill("MATH27");
    await page.getByLabel("내 번호").fill(String(181 + viewportIndex));
    await page.getByRole("button", { name: "활동 확인하기" }).click();

    const card = page.locator(
      `[data-assignment-id="${grade4Semester2Diagnosis.manifest.id}-triangles"]`
    );
    await expect(card).toContainText("10문제 · 약 5분");
    await card.getByRole("button", { name: "시작하기" }).click();

    for (const [index, judgment] of judgments.entries()) {
      const prompt = page.locator(".student-question h1");
      await expectRenderedMathText(prompt, judgment.prompt);
      await expect(page.locator(".mom-choice")).toHaveCount(3);
      await expect(page.locator(".mom-triangle-figure")).toBeVisible();
      await expect(page.locator(".mom-triangle-shape")).toHaveCount(1);
      await expect(page.locator(".mom-triangle-vertex-name")).toHaveCount(3);
      await expect(page.locator(".mom-triangle-right-angle-square")).toHaveCount(0);
      const triangleStyle = await page.locator(".mom-triangle-shape").evaluate(
        (element) => ({
          fill: getComputedStyle(element).fill,
          stroke: getComputedStyle(element).stroke
        })
      );
      expect(triangleStyle.fill, judgment.id).not.toBe("rgb(0, 0, 0)");
      expect(triangleStyle.fill, judgment.id).not.toBe("none");
      expect(triangleStyle.stroke, judgment.id).not.toBe("none");
      if (
        judgment.visual.kind === "triangle-figure"
        && judgment.visual.equalSideIndexes
      ) {
        await expect(page.locator(".mom-triangle-equal-mark")).toHaveCount(
          judgment.visual.equalSideIndexes.length
        );
        expect(
          await page.locator(".mom-triangle-equal-mark").evaluateAll(
            (elements) => elements.every(
              (element) => getComputedStyle(element).stroke !== "none"
            )
          ),
          judgment.id
        ).toBe(true);
      }

      expect(
        await prompt.locator(".mom-readable-token").evaluateAll((tokens) =>
          tokens
            .filter((token) => token.getClientRects().length !== 1)
            .map((token) => token.textContent)
        ),
        `${viewport.width}px ${judgment.id} 질문에서 어절 내부 줄바꿈 발생`
      ).toEqual([]);
      expect(
        await page.locator(".mom-choice .mom-readable-token").evaluateAll((tokens) =>
          tokens
            .filter((token) => token.getClientRects().length !== 1)
            .map((token) => token.textContent)
        ),
        `${viewport.width}px ${judgment.id} 선택지에서 어절 내부 줄바꿈 발생`
      ).toEqual([]);
      expect(
        await page.evaluate(() =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth
        ),
        `${viewport.width}px ${judgment.id}에서 가로 넘침 발생`
      ).toBe(false);

      await page.locator(".mom-choice").first().click();
      await page.getByRole("button", { name: "다음" }).click();
      if (index < judgments.length - 1) {
        await expect(page.locator(".student-question h1")).toBeVisible();
      }
    }
    await expect(page.getByRole("heading", { name: "끝까지 참여했어요" })).toBeVisible();
  }
});

test("4학년 2학기 분수 연산 10문제는 세 화면 크기에서 어절이 갈라지지 않는다", async ({ page }) => {
  test.setTimeout(180_000);
  const viewports = [
    { width: 1280, height: 720 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 }
  ];
  const judgments = grade4Semester2Diagnosis.judgments.filter(
    (judgment) => judgment.unitId === "fraction-add-subtract"
  );

  for (const [viewportIndex, viewport] of viewports.entries()) {
    await page.setViewportSize(viewport);
    await page.goto("/?set=grade4-semester2");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await page.getByLabel("클래스 코드").fill("MATH27");
    await page.getByLabel("내 번호").fill(String(191 + viewportIndex));
    await page.getByRole("button", { name: "활동 확인하기" }).click();

    const card = page.locator(
      `[data-assignment-id="${grade4Semester2Diagnosis.manifest.id}-fraction-add-subtract"]`
    );
    await expect(card).toContainText("10문제 · 약 5분");
    await card.getByRole("button", { name: "시작하기" }).click();

    for (const [index, judgment] of judgments.entries()) {
      const prompt = page.locator(".student-question h1");
      await expectRenderedMathText(prompt, judgment.prompt);
      await expect(page.locator(".mom-choice")).toHaveCount(3);
      await expect(page.locator(".mom-visual")).toHaveCount(0);
      expect(
        await prompt.locator(".mom-readable-token").evaluateAll((tokens) =>
          tokens
            .filter((token) => token.getClientRects().length !== 1)
            .map((token) => token.textContent)
        ),
        `${viewport.width}px ${judgment.id} 질문에서 어절 내부 줄바꿈 발생`
      ).toEqual([]);
      expect(
        await page.locator(".mom-choice .mom-readable-token").evaluateAll((tokens) =>
          tokens
            .filter((token) => token.getClientRects().length !== 1)
            .map((token) => token.textContent)
        ),
        `${viewport.width}px ${judgment.id} 선택지에서 어절 내부 줄바꿈 발생`
      ).toEqual([]);
      expect(
        await page.evaluate(() =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth
        ),
        `${viewport.width}px ${judgment.id}에서 가로 넘침 발생`
      ).toBe(false);

      await page.locator(".mom-choice").first().click();
      await page.getByRole("button", { name: "다음" }).click();
      if (index < judgments.length - 1) {
        await expect(page.locator(".student-question h1")).toBeVisible();
      }
    }
    await expect(page.getByRole("heading", { name: "끝까지 참여했어요" })).toBeVisible();
  }
});

test("3~6학년 분수 포함 문항은 세 화면에서 분수·대분수의 수직 중심이 맞는다", async ({ page }) => {
  test.setTimeout(300_000);
  const viewports = [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1280, height: 720 }
  ];
  const sets = [
    grade3Semester1Diagnosis,
    grade3Semester2CompleteDiagnosis,
    grade4Semester2Diagnosis,
    grade5Semester1Diagnosis,
    grade5Semester2Diagnosis,
    grade6Semester1Diagnosis,
    grade6Semester2Diagnosis
  ];
  const hasFraction = (text: string) => /\d+\s*\/\s*\d+/.test(text);
  const spokenFractions = (text: string) => [
    ...text.matchAll(/(\d+)\s*\/\s*(\d+)/g)
  ].map(([, numerator, denominator]) => `${denominator}분의 ${numerator}`);
  let auditedJudgments = 0;

  for (const [viewportIndex, viewport] of viewports.entries()) {
    await page.setViewportSize(viewport);
    for (const [setIndex, content] of sets.entries()) {
    await page.goto(`/?set=${content.manifest.id}`);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await page.getByLabel("클래스 코드").fill("MATH27");
    await page.getByLabel("내 번호").fill(String(
      731 + viewportIndex * sets.length + setIndex
    ));
    await page.getByRole("button", { name: "활동 확인하기" }).click();

    for (const unit of content.manifest.units) {
      const judgments = content.judgments.filter(
        (judgment) => judgment.unitId === unit.id
      );
      if (!judgments.some((judgment) => [
        judgment.context ?? "",
        judgment.prompt,
        ...judgment.choices.map((choice) => choice.label)
      ].some(hasFraction))) continue;

      const card = page.locator(
        `[data-assignment-id="${content.manifest.id}-${unit.id}"]`
      );
      await card.getByRole("button", { name: "시작하기" }).click();

      for (const [index, judgment] of judgments.entries()) {
        await expect(page.locator(".student-judgment-grid")).toHaveAttribute(
          "data-judgment-id",
          judgment.id
        );
        const sourceCopies = [
          judgment.context ?? "",
          judgment.prompt,
          ...judgment.choices.map((choice) => choice.label)
        ];
        if (sourceCopies.some(hasFraction)) {
          auditedJudgments += 1;
          if (judgment.context && hasFraction(judgment.context)) {
            await expectRenderedMathText(
              page.locator(".student-context"),
              judgment.context
            );
          }
          if (hasFraction(judgment.prompt)) {
            await expectRenderedMathText(
              page.locator(".student-question h1"),
              judgment.prompt
            );
          }
          const expectedChoiceLabels = judgment.choices.flatMap((choice) =>
            spokenFractions(choice.label)
          ).sort();
          const actualChoiceLabels = await page
            .locator(".mom-choice .mom-stacked-fraction")
            .evaluateAll((fractions) => fractions.map(
              (fraction) => fraction.getAttribute("aria-label") ?? ""
            ).sort());
          expect(actualChoiceLabels, judgment.id).toEqual(expectedChoiceLabels);
          expect(
            await page.locator(".student-judgment-grid").innerText(),
            `${judgment.id}에서 슬래시 분수 노출`
          ).not.toMatch(/\d+\s*\/\s*\d+/);
          await expectFractionCentersAligned(
            page.locator(".student-judgment-grid"),
            judgment.id
          );
          expect(
            await page.evaluate(() =>
              document.documentElement.scrollWidth
              > document.documentElement.clientWidth
            ),
            `${judgment.id}에서 가로 넘침 발생`
          ).toBe(false);
        }

        await page.locator(".mom-choice").first().click();
        await page.getByRole("button", { name: "다음" }).click();
        if (index < judgments.length - 1) {
          await expect(page.locator(".student-question h1")).toBeVisible();
        }
      }

      await expect(page.getByRole("heading", { name: "끝까지 참여했어요" }))
        .toBeVisible();
      await page.getByRole("button", { name: "활동 목록으로" }).click();
    }
  }
  }

  expect(auditedJudgments).toBe(87 * viewports.length);
});

test("4학년 2학기 소수 10문제는 세 화면 크기에서 소수점과 어절이 또렷하게 보인다", async ({ page }) => {
  test.setTimeout(180_000);
  const viewports = [
    { width: 1280, height: 720 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 }
  ];
  const judgments = grade4Semester2Diagnosis.judgments.filter(
    (judgment) => judgment.unitId === "decimal-add-subtract"
  );

  for (const [viewportIndex, viewport] of viewports.entries()) {
    await page.setViewportSize(viewport);
    await page.goto("/?set=grade4-semester2");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await page.getByLabel("클래스 코드").fill("MATH27");
    await page.getByLabel("내 번호").fill(String(211 + viewportIndex));
    await page.getByRole("button", { name: "활동 확인하기" }).click();

    const card = page.locator(
      `[data-assignment-id="${grade4Semester2Diagnosis.manifest.id}-decimal-add-subtract"]`
    );
    await expect(card).toContainText("10문제 · 약 5분");
    await card.getByRole("button", { name: "시작하기" }).click();

    for (const [index, judgment] of judgments.entries()) {
      const prompt = page.locator(".student-question h1");
      await expectRenderedMathText(prompt, judgment.prompt);
      await expect(page.locator(".mom-choice")).toHaveCount(3);
      await expect(page.locator(".mom-visual")).toHaveCount(0);
      expect(
        await prompt.locator(".mom-readable-token").evaluateAll((tokens) =>
          tokens
            .filter((token) => token.getClientRects().length !== 1)
            .map((token) => token.textContent)
        ),
        `${viewport.width}px ${judgment.id} 질문에서 어절 내부 줄바꿈 발생`
      ).toEqual([]);
      expect(
        await page.locator(".mom-choice .mom-readable-token").evaluateAll((tokens) =>
          tokens
            .filter((token) => token.getClientRects().length !== 1)
            .map((token) => token.textContent)
        ),
        `${viewport.width}px ${judgment.id} 선택지에서 어절 내부 줄바꿈 발생`
      ).toEqual([]);
      expect(
        await page.evaluate(() =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth
        ),
        `${viewport.width}px ${judgment.id}에서 가로 넘침 발생`
      ).toBe(false);
      const decimalLabels = judgment.choices
        .map((choice) => choice.label)
        .filter((label) => /[0-9]\.[0-9]/.test(label));
      for (const label of decimalLabels) {
        await expect(page.getByText(label, { exact: true })).toBeVisible();
      }

      await page.locator(".mom-choice").first().click();
      await page.getByRole("button", { name: "다음" }).click();
      if (index < judgments.length - 1) {
        await expect(page.locator(".student-question h1")).toBeVisible();
      }
    }
    await expect(page.getByRole("heading", { name: "끝까지 참여했어요" })).toBeVisible();
  }
});

test("4학년 2학기 사각형 10문제는 세 화면 크기에서 표시와 글자가 겹치지 않는다", async ({ page }) => {
  test.setTimeout(180_000);
  const viewports = [
    { width: 1280, height: 720 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 }
  ];
  const judgments = grade4Semester2Diagnosis.judgments.filter(
    (judgment) => judgment.unitId === "quadrilaterals"
  );

  for (const [viewportIndex, viewport] of viewports.entries()) {
    await page.setViewportSize(viewport);
    await page.goto("/?set=grade4-semester2");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await page.getByLabel("클래스 코드").fill("MATH27");
    await page.getByLabel("내 번호").fill(String(201 + viewportIndex));
    await page.getByRole("button", { name: "활동 확인하기" }).click();

    const card = page.locator(
      `[data-assignment-id="${grade4Semester2Diagnosis.manifest.id}-quadrilaterals"]`
    );
    await expect(card).toContainText("10문제 · 약 5분");
    await card.getByRole("button", { name: "시작하기" }).click();

    for (const [index, judgment] of judgments.entries()) {
      const prompt = page.locator(".student-question h1");
      await expectRenderedMathText(prompt, judgment.prompt);
      await expect(page.locator(".mom-choice")).toHaveCount(3);
      await expect(page.locator(".mom-quadrilateral-figure")).toBeVisible();
      await expect(page.locator(".mom-quad-shape")).toHaveCount(1);
      await expect(page.locator(".mom-quad-vertex-name")).toHaveCount(4);

      if (judgment.visual.kind === "quadrilateral-figure") {
        const visual = judgment.visual;
        const parallelCount = "parallelSidePairs" in visual
          ? visual.parallelSidePairs.length * 2
          : 0;
        const rightAngleCount = "rightAngleVertexIndexes" in visual
          ? visual.rightAngleVertexIndexes.length
          : 0;
        const equalMarkCount = "equalSideGroups" in visual
          ? visual.equalSideGroups.reduce(
              (count, group, groupIndex) =>
                count + group.length * (groupIndex + 1),
              0
            )
          : 0;
        await expect(page.locator(".mom-quad-parallel-arrow")).toHaveCount(
          parallelCount
        );
        await expect(page.locator(".mom-quad-right-angle")).toHaveCount(
          rightAngleCount
        );
        await expect(page.locator(".mom-quad-equal-mark")).toHaveCount(
          equalMarkCount
        );
        if ("sideLengthLabels" in visual) {
          await expect(page.locator(".mom-quad-side-value")).toHaveCount(2);
          await expect(page.locator(".mom-quad-distance-value")).toHaveCount(1);
          await expect(page.locator(".mom-quad-distance-segment")).toHaveCount(1);
        }
        if ("angles" in visual) {
          await expect(page.locator(".mom-quad-angle-value")).toHaveCount(2);
          await expect(page.locator(".mom-quad-angle-value", {
            hasText: "㉠"
          })).toHaveCount(1);
        }
      }

      expect(
        await prompt.locator(".mom-readable-token").evaluateAll((tokens) =>
          tokens
            .filter((token) => token.getClientRects().length !== 1)
            .map((token) => token.textContent)
        ),
        `${viewport.width}px ${judgment.id} 질문에서 어절 내부 줄바꿈 발생`
      ).toEqual([]);
      expect(
        await page.locator(".mom-choice .mom-readable-token").evaluateAll((tokens) =>
          tokens
            .filter((token) => token.getClientRects().length !== 1)
            .map((token) => token.textContent)
        ),
        `${viewport.width}px ${judgment.id} 선택지에서 어절 내부 줄바꿈 발생`
      ).toEqual([]);
      expect(
        await page.evaluate(() =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth
        ),
        `${viewport.width}px ${judgment.id}에서 가로 넘침 발생`
      ).toBe(false);
      const visibleLabels = page.locator(
        ".mom-quad-vertex-name, .mom-quad-side-value, "
        + ".mom-quad-distance-value, .mom-quad-angle-value"
      );
      const boxes = await visibleLabels.evaluateAll((labels) =>
        labels.map((label) => {
          const box = label.getBoundingClientRect();
          return {
            left: box.left,
            right: box.right,
            top: box.top,
            bottom: box.bottom
          };
        })
      );
      for (let left = 0; left < boxes.length; left += 1) {
        for (let right = left + 1; right < boxes.length; right += 1) {
          const overlapWidth = Math.min(
            boxes[left].right,
            boxes[right].right
          ) - Math.max(boxes[left].left, boxes[right].left);
          const overlapHeight = Math.min(
            boxes[left].bottom,
            boxes[right].bottom
          ) - Math.max(boxes[left].top, boxes[right].top);
          expect(
            overlapWidth > 1 && overlapHeight > 1,
            `${viewport.width}px ${judgment.id} label ${left}/${right} 겹침`
          ).toBe(false);
        }
      }

      await page.locator(".mom-choice").first().click();
      await page.getByRole("button", { name: "다음" }).click();
      if (index < judgments.length - 1) {
        await expect(page.locator(".student-question h1")).toBeVisible();
      }
    }
    await expect(page.getByRole("heading", { name: "끝까지 참여했어요" })).toBeVisible();
  }
});

test("4학년 2학기 다각형 10문제는 세 화면 크기에서 선과 모양 조각을 또렷하게 보여 준다", async ({ page }) => {
  test.setTimeout(180_000);
  const viewports = [
    { width: 1280, height: 720 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 }
  ];
  const judgments = grade4Semester2Diagnosis.judgments.filter(
    (judgment) => judgment.unitId === "polygons"
  );

  for (const [viewportIndex, viewport] of viewports.entries()) {
    await page.setViewportSize(viewport);
    await page.goto("/?set=grade4-semester2");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await page.getByLabel("클래스 코드").fill("MATH27");
    await page.getByLabel("내 번호").fill(String(221 + viewportIndex));
    await page.getByRole("button", { name: "활동 확인하기" }).click();

    const card = page.locator(
      `[data-assignment-id="${grade4Semester2Diagnosis.manifest.id}-polygons"]`
    );
    await expect(card).toContainText("10문제 · 약 5분");
    await card.getByRole("button", { name: "시작하기" }).click();

    for (const [index, judgment] of judgments.entries()) {
      const prompt = page.locator(".student-question h1");
      await expectRenderedMathText(prompt, judgment.prompt);
      await expect(page.locator(".mom-choice")).toHaveCount(3);
      await expect(page.locator(".mom-visual")).toBeVisible();

      if (judgment.visual.kind === "polygon-figure") {
        await expect(page.locator(".mom-polygon-figure")).toBeVisible();
        const outlineCount = judgment.visual.mode === "side-count-name" ? 1 : 3;
        await expect(page.locator(".mom-polygon-outline")).toHaveCount(outlineCount);
        if (judgment.visual.mode === "polygon-select") {
          await expect(page.locator(".mom-polygon-open-end")).toHaveCount(2);
          await expect(page.locator(".mom-polygon-outline[d*='Q']")).toHaveCount(1);
          const description = await page.locator(".mom-polygon-figure")
            .getAttribute("aria-label");
          expect(description, `${judgment.id} 접근성 설명`).not.toContain("다각형");
          for (const candidate of judgment.visual.candidates) {
            expect(description, `${judgment.id}/${candidate.id} 접근성 설명`)
              .toContain(`${candidate.id}:`);
          }
          const endpointColors = await page.locator(".mom-polygon-open-end")
            .evaluateAll((nodes) => nodes.map((node) => ({
              stroke: getComputedStyle(node).stroke,
              neutral: getComputedStyle(document.documentElement)
                .getPropertyValue("--text-secondary").trim(),
              error: getComputedStyle(document.documentElement)
                .getPropertyValue("--status-error").trim()
            })));
          expect(endpointColors.every(({ stroke, neutral }) =>
            stroke === neutral || stroke === "rgb(82, 97, 91)"
          ), `${judgment.id} 열린 끝점 중립색`).toBe(true);
          expect(endpointColors.every(({ stroke, error }) => stroke !== error),
            `${judgment.id} 열린 끝점 오류색 금지`).toBe(true);
        }
        if (judgment.visual.mode === "regular-select") {
          await expect(page.locator(".mom-polygon-side-mark")).not.toHaveCount(0);
          await expect(page.locator(".mom-polygon-angle-mark")).not.toHaveCount(0);
          const description = await page.locator(".mom-polygon-figure")
            .getAttribute("aria-label");
          expect(description, `${judgment.id} 접근성 설명`).not.toContain("정다각형");
          if (viewport.width === 390) {
            const candidateWidths = await page.locator(".mom-polygon-candidate")
              .evaluateAll((nodes) => nodes.map((node) =>
                node.getBoundingClientRect().width
              ));
            expect(Math.min(...candidateWidths), `${judgment.id} 후보 폭`)
              .toBeGreaterThanOrEqual(150);
            const markSizes = await page.locator(
              ".mom-polygon-side-mark, .mom-polygon-angle-mark"
            ).evaluateAll((nodes) => nodes.map((node) => {
              const box = node.getBoundingClientRect();
              return Math.max(box.width, box.height);
            }));
            expect(Math.min(...markSizes), `${judgment.id} 눈금·각 표시 크기`)
              .toBeGreaterThanOrEqual(8);
          }
        }
      }

      if (judgment.visual.kind === "tile-composition") {
        await expect(page.locator(".mom-tile-composition")).toBeVisible();
        await expect(page.locator(".mom-tile-cell")).not.toHaveCount(0);
        if (judgment.visual.mode === "fill-remaining") {
          await expect(page.locator(".mom-tile-candidate")).toHaveCount(3);
          await expect(page.locator(".mom-tile-cell.is-placed")).not.toHaveCount(0);
          await expect(page.locator(".mom-tile-board")).not.toContainText(/빈자리 \d+칸/);
          const pieceBounds = await page.locator(
            ".mom-tile-candidates .mom-pattern-piece"
          ).evaluateAll((nodes) => nodes.map((node) => {
            const cells = [...node.querySelectorAll<SVGGraphicsElement>(
              ".mom-tile-cell"
            )];
            const boxes = cells.map((cell) => cell.getBoundingClientRect());
            return {
              piece: node.getAttribute("title"),
              width: Math.max(...boxes.map((box) => box.right))
                - Math.min(...boxes.map((box) => box.left)),
              height: Math.max(...boxes.map((box) => box.bottom))
                - Math.min(...boxes.map((box) => box.top))
            };
          }));
          const largestByPiece = new Map<string | null, number>();
          for (const piece of pieceBounds) {
            largestByPiece.set(piece.piece, Math.max(
              largestByPiece.get(piece.piece) ?? 0,
              piece.width * piece.height
            ));
          }
          if (largestByPiece.has("정삼각형") && largestByPiece.has("마름모")) {
            expect(largestByPiece.get("마름모")!, `${judgment.id} 공통 조각 축척`)
              .toBeGreaterThan(largestByPiece.get("정삼각형")! * 1.35);
          }
          if (largestByPiece.has("마름모") && largestByPiece.has("사다리꼴")) {
            expect(largestByPiece.get("사다리꼴")!, `${judgment.id} 공통 조각 축척`)
              .toBeGreaterThan(largestByPiece.get("마름모")! * 1.2);
          }
          const boardCellEdge = await page.locator(
            ".mom-tile-board .mom-tile-cell"
          ).first().evaluate((node) => {
            const points = node.getAttribute("points")!.split(" ")
              .slice(0, 2)
              .map((pair) => pair.split(",").map(Number));
            const matrix = (node as SVGGraphicsElement).getScreenCTM()!;
            const transformed = points.map(([x, y]) => ({
              x: matrix.a * x + matrix.c * y + matrix.e,
              y: matrix.b * x + matrix.d * y + matrix.f
            }));
            return Math.hypot(
              transformed[1].x - transformed[0].x,
              transformed[1].y - transformed[0].y
            );
          });
          const candidateCellEdges = await page.locator(
            ".mom-tile-candidates .mom-tile-cell"
          ).evaluateAll((nodes) => nodes.map((node) => {
            const points = node.getAttribute("points")!.split(" ")
              .slice(0, 2)
              .map((pair) => pair.split(",").map(Number));
            const matrix = (node as SVGGraphicsElement).getScreenCTM()!;
            const transformed = points.map(([x, y]) => ({
              x: matrix.a * x + matrix.c * y + matrix.e,
              y: matrix.b * x + matrix.d * y + matrix.f
            }));
            return Math.hypot(
              transformed[1].x - transformed[0].x,
              transformed[1].y - transformed[0].y
            );
          }));
          for (const edge of candidateCellEdges) {
            expect(edge, `${judgment.id} 보드·후보 단위 삼각형 축척`)
              .toBeCloseTo(boardCellEdge, 0);
          }
        } else {
          await expect(page.locator(".mom-tile-key")).toContainText("기준 조각 1개");
          const unitEdges = await page.locator(
            ".mom-tile-board .mom-tile-cell:first-child, "
            + ".mom-tile-key .mom-tile-cell:first-child"
          ).evaluateAll((nodes) => nodes.map((node) => {
            const points = node.getAttribute("points")!.split(" ")
              .slice(0, 2)
              .map((pair) => pair.split(",").map(Number));
            const matrix = (node as SVGGraphicsElement).getScreenCTM()!;
            const transformed = points.map(([x, y]) => ({
              x: matrix.a * x + matrix.c * y + matrix.e,
              y: matrix.b * x + matrix.d * y + matrix.f
            }));
            return Math.hypot(
              transformed[1].x - transformed[0].x,
              transformed[1].y - transformed[0].y
            );
          }));
          expect(unitEdges, `${judgment.id} 보드·기준 조각 셀`).toHaveLength(2);
          expect(unitEdges[0], `${judgment.id} 보드·기준 조각 단위 삼각형 축척`)
            .toBeCloseTo(unitEdges[1], 0);
        }
      }

      expect(
        await prompt.locator(".mom-readable-token").evaluateAll((tokens) =>
          tokens
            .filter((token) => token.getClientRects().length !== 1)
            .map((token) => token.textContent)
        ),
        `${viewport.width}px ${judgment.id} 질문에서 어절 내부 줄바꿈 발생`
      ).toEqual([]);
      expect(
        await page.locator(".mom-choice .mom-readable-token").evaluateAll((tokens) =>
          tokens
            .filter((token) => token.getClientRects().length !== 1)
            .map((token) => token.textContent)
        ),
        `${viewport.width}px ${judgment.id} 선택지에서 어절 내부 줄바꿈 발생`
      ).toEqual([]);
      expect(
        await page.evaluate(() =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth
        ),
        `${viewport.width}px ${judgment.id}에서 가로 넘침 발생`
      ).toBe(false);

      const visualBox = await page.locator(".mom-visual").boundingBox();
      expect(visualBox?.width ?? 0, `${viewport.width}px ${judgment.id} 시각 폭`)
        .toBeGreaterThanOrEqual(Math.min(350, viewport.width - 70));

      await page.locator(".mom-choice").first().click();
      await page.getByRole("button", { name: "다음" }).click();
      if (index < judgments.length - 1) {
        await expect(page.locator(".student-question h1")).toBeVisible();
      }
    }
    await expect(page.getByRole("heading", { name: "끝까지 참여했어요" })).toBeVisible();
  }
});

test("4학년 2학기 꺾은선그래프 10문제는 네 화면 크기와 밝고 어두운 화면에서 읽힌다", async ({ page }) => {
  test.setTimeout(300_000);
  const viewports = [
    { width: 1280, height: 720 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 360, height: 800 }
  ];
  const judgments = grade4Semester2Diagnosis.judgments.filter(
    (judgment) => judgment.unitId === "line-graphs"
  );
  let learnerNumber = 330;

  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    for (const viewport of viewports) {
      learnerNumber += 1;
      await page.setViewportSize(viewport);
      await page.goto("/?set=grade4-semester2");
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.reload();
      await page.getByLabel("클래스 코드").fill("MATH27");
      await page.getByLabel("내 번호").fill(String(learnerNumber));
      await page.getByRole("button", { name: "활동 확인하기" }).click();

      const card = page.locator(
        `[data-assignment-id="${grade4Semester2Diagnosis.manifest.id}-line-graphs"]`
      );
      await expect(card).toContainText("10문제 · 약 5분");
      await card.getByRole("button", { name: "시작하기" }).click();

      for (const [index, judgment] of judgments.entries()) {
        await expectRenderedMathText(page.locator(".student-question h1"), judgment.prompt);
        const chart = page.locator(".mom-line-chart");
        await expect(chart).toBeVisible();
        await expect(chart.locator(".mom-line-point")).toHaveCount(
          judgment.visual.kind === "line-chart-diagram"
            ? judgment.visual.points.length
            : 0
        );
        await expect(chart.locator(".mom-line-series")).toHaveCount(1);
        await expect(chart.locator(".mom-line-axis-label")).toHaveCount(2);
        await expect(chart.locator(".mom-line-unit-label")).toHaveCount(1);
        await expect(chart.locator(".mom-line-time-label")).toHaveCount(1);

        const description = await chart.getAttribute("aria-label") ?? "";
        if (judgment.visual.kind === "line-chart-diagram") {
          for (const category of judgment.visual.timeAxis.categories) {
            expect(description, `${judgment.id} 접근성 시점`).toContain(category);
          }
          for (const point of judgment.visual.points) {
            expect(description, `${judgment.id} 접근성 눈금`).toContain(`${point.tick}칸`);
          }
          const correct = judgment.choices.find((choice) => choice.correct)!.label;
          expect(description, `${judgment.id} 접근성 정답 비노출`).not.toContain(correct);
          await expect(chart.locator(".mom-line-wave")).toHaveCount(
            judgment.visual.axis.baselineValue > 0 ? 1 : 0
          );
          await expect(chart.locator(".mom-line-target-ring")).toHaveCount(
            judgment.visual.target?.kind === "point" ? 1 : 0
          );
        }

        const markerSizes = await chart.locator(".mom-line-point").evaluateAll(
          (nodes) => nodes.map((node) => node.getBoundingClientRect().width)
        );
        expect(Math.min(...markerSizes), `${viewport.width}px ${judgment.id} 점 크기`)
          .toBeGreaterThanOrEqual(12);
        const textLayout = await chart.locator(".mom-line-chart-svg").evaluate((svg) => {
          const bounds = svg.getBoundingClientRect();
          const scale = svg.viewBox.baseVal.width > 0
            ? bounds.width / svg.viewBox.baseVal.width
            : 1;
          const labels = [...svg.querySelectorAll<SVGTextElement>(
            ".mom-line-axis-label, .mom-line-category-label, .mom-line-unit-label, .mom-line-time-label"
          )].map((label) => {
            const rect = label.getBoundingClientRect();
            return {
              className: label.getAttribute("class") ?? "",
              text: label.textContent ?? "",
              effectiveFontSize: Number.parseFloat(getComputedStyle(label).fontSize) * scale,
              left: rect.left,
              right: rect.right,
              top: rect.top,
              bottom: rect.bottom
            };
          });
          const overlaps = labels.flatMap((left, leftIndex) =>
            labels.slice(leftIndex + 1).flatMap((right) => {
              const horizontal = Math.min(left.right, right.right) - Math.max(left.left, right.left);
              const vertical = Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top);
              return horizontal > 1 && vertical > 1
                ? [`${left.text}/${right.text}`]
                : [];
            })
          );
          return {
            labels,
            overlaps,
            minimumEffectiveFontSize: Math.min(...labels.map((label) => label.effectiveFontSize)),
            chartBounds: bounds.toJSON()
          };
        });
        expect(
          textLayout.minimumEffectiveFontSize,
          `${viewport.width}px ${judgment.id} 실제 그래프 글자 크기`
        ).toBeGreaterThanOrEqual(12);
        expect(textLayout.overlaps, `${viewport.width}px ${judgment.id} 그래프 글자 겹침`)
          .toEqual([]);
        for (const label of textLayout.labels) {
          expect(label.left, `${judgment.id} ${label.text} 왼쪽 포함`)
            .toBeGreaterThanOrEqual(textLayout.chartBounds.left - 1);
          expect(label.right, `${judgment.id} ${label.text} 오른쪽 포함`)
            .toBeLessThanOrEqual(textLayout.chartBounds.right + 1);
          expect(label.top, `${judgment.id} ${label.text} 위쪽 포함`)
            .toBeGreaterThanOrEqual(textLayout.chartBounds.top - 1);
          expect(label.bottom, `${judgment.id} ${label.text} 아래쪽 포함`)
            .toBeLessThanOrEqual(textLayout.chartBounds.bottom + 1);
        }
        expect(await page.evaluate(() =>
          document.documentElement.scrollWidth > document.documentElement.clientWidth
        ), `${viewport.width}px ${judgment.id} 가로 넘침`).toBe(false);
        expect(
          await page.locator(".student-question h1 .mom-readable-token").evaluateAll(
            (tokens) => tokens.filter((token) => token.getClientRects().length !== 1)
              .map((token) => token.textContent)
          ),
          `${viewport.width}px ${judgment.id} 질문 어절 줄바꿈`
        ).toEqual([]);
        expect(
          await page.locator(".mom-choice .mom-readable-token").evaluateAll(
            (tokens) => tokens.filter((token) => token.getClientRects().length !== 1)
              .map((token) => token.textContent)
          ),
          `${viewport.width}px ${judgment.id} 선택지 어절 줄바꿈`
        ).toEqual([]);

        await page.locator(".mom-choice").first().click();
        await page.getByRole("button", { name: "다음" }).click();
        if (index < judgments.length - 1) {
          await expect(page.locator(".student-question h1")).toBeVisible();
        }
      }
      await expect(page.getByRole("heading", { name: "끝까지 참여했어요" })).toBeVisible();
    }
  }
});

test("5학년 1학기 여섯 단원 70문제는 네 화면 크기와 밝고 어두운 화면에서 읽기 단위가 갈라지지 않는다", async ({ page }) => {
  test.setTimeout(480_000);
  const viewports = [
    { width: 1280, height: 720 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 360, height: 800 }
  ];
  let learnerNumber = 400;

  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    for (const viewport of viewports) {
      learnerNumber += 1;
      await page.setViewportSize(viewport);
      await page.goto("/?set=grade5-semester1");
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.reload();
      await page.getByLabel("클래스 코드").fill("MATH27");
      await page.getByLabel("내 번호").fill(String(learnerNumber));
      await page.getByRole("button", { name: "활동 확인하기" }).click();

      await expect(page.getByRole("article")).toHaveCount(
        grade5Semester1Diagnosis.manifest.units.length
      );
      const units = grade5Semester1Diagnosis.manifest.units.map((unit) => ({
        id: unit.id,
        judgments: grade5Semester1Diagnosis.judgments.filter(
          (judgment) => judgment.unitId === unit.id
        )
      }));

      for (const [unitIndex, unit] of units.entries()) {
        const card = page.locator(
          `[data-assignment-id="${grade5Semester1Diagnosis.manifest.id}-${unit.id}"]`
        );
        await expect(card).toContainText(
          `${unit.judgments.length}문제 · 약 ${Math.max(3, Math.ceil(unit.judgments.length / 2))}분`
        );
        await card.getByRole("button", { name: "시작하기" }).click();

        for (const [index, judgment] of unit.judgments.entries()) {
          const prompt = page.locator(".student-question h1");
          await expectRenderedMathText(prompt, judgment.prompt);
          await expect(page.locator(".mom-choice")).toHaveCount(3);
          if (judgment.visual.kind === "relation-pattern-diagram"
            && judgment.visual.mode === "rule-table") {
            const table = page.locator(".mom-relation-table");
            await expect(table).toHaveCount(1);
            await expect(table.locator("th")).toHaveText([
              judgment.visual.leftLabel!,
              judgment.visual.rightLabel!
            ]);
            await expect(table.locator("td")).toHaveText(
              judgment.visual.rows!.flatMap((row) => [String(row.left), String(row.right)])
            );
            await expect(table).toHaveAttribute(
              "aria-label",
              `${judgment.visual.leftLabel}, ${judgment.visual.rightLabel} 대응표. ${
                judgment.visual.rows!.map((row) => `${row.left}의 짝은 ${row.right}`).join(", ")
              }.`
            );
            const tableMetrics = await table.evaluate((element) => {
              const rect = element.getBoundingClientRect();
              const cells = [...element.querySelectorAll("th, td")];
              return {
                left: rect.left,
                right: rect.right,
                viewportWidth: document.documentElement.clientWidth,
                minFontSize: Math.min(...cells.map((cell) =>
                  Number.parseFloat(getComputedStyle(cell).fontSize)
                )),
                overflowingCells: cells.filter((cell) =>
                  cell.scrollWidth > cell.clientWidth
                ).map((cell) => cell.textContent)
              };
            });
            expect(tableMetrics.left, `${viewport.width}px ${judgment.id} 표 왼쪽`).toBeGreaterThanOrEqual(0);
            expect(tableMetrics.right, `${viewport.width}px ${judgment.id} 표 오른쪽`)
              .toBeLessThanOrEqual(tableMetrics.viewportWidth);
            expect(tableMetrics.minFontSize, `${viewport.width}px ${judgment.id} 표 글자 크기`)
              .toBeGreaterThanOrEqual(12);
            expect(tableMetrics.overflowingCells, `${viewport.width}px ${judgment.id} 표 셀 넘침`)
              .toEqual([]);
          } else if (judgment.visual.kind === "perimeter-area-diagram") {
            const diagram = page.locator(".mom-perimeter-area");
            await expect(diagram).toHaveCount(1);
            await expect(diagram).toHaveClass(new RegExp(`\\bis-${judgment.visual.shape}\\b`));
            await expect(diagram).toHaveAttribute("role", "img");
            await expect(diagram).toHaveAttribute("aria-label", /.+/);
            const diagramBounds = await diagram.evaluate((element) => {
              const rect = element.getBoundingClientRect();
              return {
                left: rect.left,
                right: rect.right,
                width: rect.width,
                viewportWidth: document.documentElement.clientWidth
              };
            });
            expect(diagramBounds.left, `${viewport.width}px ${judgment.id} 도형 왼쪽`)
              .toBeGreaterThanOrEqual(0);
            expect(diagramBounds.right, `${viewport.width}px ${judgment.id} 도형 오른쪽`)
              .toBeLessThanOrEqual(diagramBounds.viewportWidth);
            expect(diagramBounds.width, `${viewport.width}px ${judgment.id} 도형 너비`)
              .toBeGreaterThan(0);
          } else {
            await expect(page.locator(".mom-visual")).toHaveCount(0);
          }

          if (unit.id === "mixed-operations") {
            const expressionGroup = prompt.locator(".mom-readable-keep");
            await expect(expressionGroup).toHaveCount(1);
            await expectRenderedMathText(expressionGroup, judgment.prompt);
          }
          expect(
            await prompt.locator(".mom-readable-token").evaluateAll((tokens) =>
              tokens
                .filter((token) => token.getClientRects().length !== 1)
                .map((token) => token.textContent)
            ),
            `${colorScheme} ${viewport.width}px ${judgment.id} 문제 내부 줄바꿈`
          ).toEqual([]);
          expect(
            await page.locator(".mom-choice .mom-readable-token").evaluateAll((tokens) =>
              tokens
                .filter((token) => token.getClientRects().length !== 1)
                .map((token) => token.textContent)
            ),
            `${colorScheme} ${viewport.width}px ${judgment.id} 선택지 내부 줄바꿈`
          ).toEqual([]);
          expect(
            await page.evaluate(() =>
              document.documentElement.scrollWidth
                > document.documentElement.clientWidth
            ),
            `${colorScheme} ${viewport.width}px ${judgment.id} 가로 넘침`
          ).toBe(false);

          await page.locator(".mom-choice").first().click();
          await page.getByRole("button", { name: "다음" }).click();
          if (index < unit.judgments.length - 1) {
            await expect(page.locator(".student-question h1")).toBeVisible();
          }
        }
        await expect(page.getByRole("heading", { name: "끝까지 참여했어요" }))
          .toBeVisible();
        if (unitIndex < units.length - 1) {
          await page.getByRole("button", { name: "활동 목록으로" }).click();
          await expect(page.getByRole("article")).toHaveCount(
            grade5Semester1Diagnosis.manifest.units.length
          );
        }
      }
    }
  }
});
