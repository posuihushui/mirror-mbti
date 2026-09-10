import { expect, test } from "@playwright/test";

/**
 * Visual regression against the committed baselines in tests/e2e/__screenshots__.
 * First run: `npx playwright test visual --update-snapshots`, then compare the
 * generated images against docs/design-evidence/*.
 */
test.describe("visual", () => {
  test("home", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("home.png", { fullPage: false });
  });

  test("sample result", async ({ page }) => {
    await page.goto("/result/sample");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("result.png", { fullPage: false });
  });

  test("sample report chapter 2", async ({ page }) => {
    await page.goto("/report/sample?chapter=2");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("report.png", { fullPage: false });
  });
});
