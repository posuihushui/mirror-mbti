import { expect, test } from "@playwright/test";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test.describe(`number motion: ${reducedMotion}`, () => {
    test.use({ reducedMotion });

    test("rapid question jumps show the latest number, with only changed digits moving", async ({ page }) => {
      await page.goto("/zh/quiz");
      await page.getByRole("button", { name: "开始 32 题轻量版" }).click();
      await page.getByRole("button", { name: /检查已答题/ }).click();
      const observations = await page.evaluate(async () => {
        const jumps = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-slot="accordion-content"] button'));
        const states = [];
        for (const target of [9, 10, 11, 10, 2]) {
          jumps[target - 1].click();
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
          const number = document.querySelector<HTMLElement>("main section .number-motion[data-value='" + target + "']")!;
          states.push({ target, value: number.textContent, direction: number.dataset.direction, changing: number.querySelectorAll(".number-changing").length });
        }
        return states;
      });
      expect(observations.map((state) => state.value)).toEqual(["09", "10", "11", "10", "02"]);
      expect(observations.map((state) => state.direction)).toEqual(["up", "up", "up", "down", "down"]);
      expect(observations[2].changing).toBe(1);
      await expect(page.locator("main section .number-motion[data-value='2']").first()).toHaveText("02");
      await page.getByRole("button", { name: "非常符合", exact: true }).click();
      await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
      if (reducedMotion === "reduce") {
        for (const layer of await page.locator(".number-changing").all()) await expect(layer).toHaveCSS("animation-name", "none");
        for (const layer of await page.locator(".number-previous").all()) await expect(layer).toHaveCSS("display", "none");
      } else {
        await expect.poll(() => page.locator(".number-previous").filter({ visible: true }).evaluateAll((layers) => layers.every((layer) => getComputedStyle(layer).opacity === "0"))).toBe(true);
      }
      await page.getByRole("button", { name: /检查已答题/ }).click();
      await expect(page.locator('[data-slot="accordion-content"]')).toBeHidden();
    });

    test("switching 32 and 64 items animates the total and restores each draft", async ({ page }) => {
      await page.goto("/zh/quiz");
      await page.getByRole("button", { name: "开始 32 题轻量版" }).click();
      await page.getByRole("button", { name: "非常符合", exact: true }).click();
      await page.getByRole("button", { name: "下一题", exact: true }).filter({ visible: true }).click();
      const title = await page.locator("#question-title").innerText();
      await page.getByRole("button", { name: "切换版本", exact: true }).click();
      await expect(page.locator(".quiz-version-motion").first()).toHaveCSS("animation-name", reducedMotion === "reduce" ? "none" : "chapter-enter");
      await page.getByRole("button", { name: "开始 64 题标准版" }).click();
      await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuemax", "64");
      const total = page.locator("main section .number-motion[data-value='64']").first();
      await expect(total).toHaveText("64");
      await expect(total).toHaveAttribute("data-direction", "up");
      await expect(total.locator(".number-previous")).toHaveCount(2);
      await page.getByRole("button", { name: "比较符合", exact: true }).click();
      await page.getByRole("button", { name: "切换版本", exact: true }).click();
      await page.getByRole("button", { name: "继续 32 题轻量版" }).click();
      await expect(page.locator("#question-title")).toHaveText(title);
      await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
      await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuemax", "32");
      await expect(page.locator("main section .number-motion[data-value='32']").first()).toHaveAttribute("data-direction", "down");
      await page.getByRole("button", { name: "切换版本", exact: true }).click();
      await page.getByRole("button", { name: "继续 64 题标准版" }).click();
      await expect(page.getByRole("button", { name: "比较符合", exact: true })).toHaveAttribute("aria-pressed", "true");
    });
  });
}
