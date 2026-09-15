import { expect, test } from "@playwright/test";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`interaction motion: ${reducedMotion}`, () => {
    test.use({ reducedMotion });

    test("question navigation preserves answers and keeps the phone dock inside the viewport", async ({ page }, testInfo) => {
      if (testInfo.project.name === "mobile") await page.setViewportSize({ width: 320, height: 852 });
      await page.goto("/quiz");
      await page.getByRole("button", { name: "开始 32 题轻量版" }).click();
      const question = page.locator(".quiz-question-motion");
      const title = page.locator("#question-title");
      const firstTitle = await title.innerText();
      const next = page.getByRole("button", { name: "下一题", exact: true }).filter({ visible: true });
      const back = page.getByRole("button", { name: "上一题", exact: true }).filter({ visible: true });
      await expect(next).toBeDisabled();
      await page.getByRole("button", { name: "非常符合", exact: true }).click();
      await expect(title).toHaveText(firstTitle);
      await next.click();
      await expect(title).not.toHaveText(firstTitle);
      await expect(question).toHaveAttribute("data-direction", "forward");
      await expect(next).toBeDisabled();
      await back.click();
      await expect(title).toHaveText(firstTitle);
      await expect(question).toHaveAttribute("data-direction", "backward");
      await expect(page.getByRole("button", { name: "非常符合", exact: true })).toHaveAttribute("aria-pressed", "true");
      await expect(question).toHaveCSS("animation-name", reducedMotion === "reduce" ? "none" : "question-enter");

      if (testInfo.project.name === "mobile") {
        const dock = page.locator('nav[aria-label="底部题目导航"]').locator("..");
        for (const scroll of [0, 500]) {
          await page.evaluate((y) => window.scrollTo(0, y), scroll);
          const rect = await dock.boundingBox();
          expect(rect).not.toBeNull();
          expect(rect!.x).toBeGreaterThanOrEqual(0);
          expect(rect!.x + rect!.width).toBeLessThanOrEqual(320);
          expect(rect!.y + rect!.height).toBeCloseTo(852, 0);
          await expect(next).toBeInViewport();
          await expect(back).toBeInViewport();
        }
      }
    });

    test("rapid strength switches retain both original lists and align the selected pill", async ({ page }) => {
      await page.goto("/report/sample?chapter=2");
      const switcher = page.getByRole("tablist", { name: "优势与盲点" });
      await expect(switcher).toBeVisible();
      const result = await page.evaluate(async () => {
        const lists = Array.from(document.querySelectorAll<HTMLElement>(".strength-content-motion"));
        const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[aria-label="优势与盲点"] button'));
        const observations = [];
        for (const index of [1, 0, 1, 0, 1]) {
          tabs[index].click();
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
          observations.push({
            visible: lists.flatMap((list, i) => list.hidden ? [] : [i]),
            selected: tabs.flatMap((tab, i) => tab.getAttribute("aria-selected") === "true" ? [i] : []),
            intact: lists.length === 2 && lists.every((list) => list.isConnected && list.textContent!.trim().length > 0),
            index,
          });
        }
        return observations;
      });
      for (const state of result) {
        expect(state.intact).toBe(true);
        expect(state.visible).toEqual([state.index]);
        expect(state.selected).toEqual([state.index]);
      }
      const indicator = page.locator(".strength-indicator-motion");
      await expect.poll(async () => {
        const a = await indicator.boundingBox();
        const b = await switcher.getByRole("tab", { selected: true }).boundingBox();
        return Math.abs(a!.x - b!.x) + Math.abs(a!.width - b!.width);
      }).toBeLessThan(1);
      if (reducedMotion === "reduce") {
        await expect(indicator).toHaveCSS("transition-duration", "0s");
        await expect(page.locator(".strength-content-motion:not([hidden])")).toHaveCSS("animation-name", "none");
      }
    });

    test("desktop modal stays centered and releases its overlay when closed", async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === "mobile", "Phone sheets keep Vaul's native gesture motion.");
      await page.goto("/");
      const trigger = page.getByRole("button", { name: "了解测试", exact: true });
      for (let cycle = 0; cycle < 2; cycle++) {
        await trigger.click();
        const dialog = page.locator('[data-slot="dialog-content"]');
        const overlay = page.locator('[data-slot="dialog-overlay"]');
        await expect(dialog).toBeVisible();
        await expect(dialog).toHaveCSS("animation-name", reducedMotion === "reduce" ? "none" : "dialog-enter");
        await expect(overlay).toHaveCSS("transform", "none");
        const bounds = await overlay.boundingBox();
        expect(bounds).toEqual({ x: 0, y: 0, ...page.viewportSize()! });
        await expect.poll(async () => {
          const rect = await dialog.boundingBox();
          return Math.abs(rect!.x + rect!.width / 2 - page.viewportSize()!.width / 2)
            + Math.abs(rect!.y + rect!.height / 2 - page.viewportSize()!.height / 2);
        }).toBeLessThan(1);
        await dialog.getByRole("button", { name: "关闭", exact: true }).click();
        await expect(dialog).toHaveCount(0);
        await expect(overlay).toHaveCount(0);
        await expect(page.locator("body")).not.toHaveCSS("pointer-events", "none");
      }
    });
  });
}
