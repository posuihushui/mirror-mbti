import { expect, test } from "@playwright/test";

/** The header's 更多信息 menu is the only place these pages are listed: pages carry no footer navigation. */
const menuPaths = ["/preferences", "/types", "/about", "/help", "/privacy", "/terms"];

test.describe("header navigation", () => {
  test("every menu link stays in the server HTML while the menu is closed", async ({ request }) => {
    for (const path of ["/", "/help", "/result/sample", "/report/sample", "/en"]) {
      const html = await (await request.get(path)).text();
      const prefix = path.startsWith("/en") ? "/en" : "";
      expect(html, `${path} renders the menu`).toContain('aria-expanded="false"');
      for (const target of menuPaths) expect(html, `${path} links ${target}`).toContain(`href="${prefix}${target}"`);
    }
  });

  test("the menu opens on click and closes on Escape, an outside press and a followed link", async ({ page }, testInfo) => {
    const phone = testInfo.project.name === "mobile";
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "主导航" }).filter({ visible: true });
    const trigger = nav.getByRole("button", { name: phone ? "更多" : "更多信息", exact: true });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    const types = nav.getByRole("link", { name: "16 型人格", exact: true });
    await expect(types).toBeHidden();
    if (!phone) {
      await expect(nav.getByRole("link", { name: "人格测试", exact: true })).toBeVisible();
      await expect(nav.getByRole("link", { name: /我的报告/ })).toBeVisible();
    }

    // The button works once hydrated: retry until it opens.
    await expect(async () => {
      await trigger.click();
      await expect(types).toBeVisible({ timeout: 1000 });
    }).toPass();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    if (phone) {
      await expect(nav.getByRole("link", { name: "人格测试", exact: true })).toBeVisible();
      await expect(nav.getByRole("link", { name: "我的报告", exact: true })).toBeVisible();
    }
    await page.keyboard.press("Escape");
    await expect(types).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.click();
    await expect(types).toBeVisible();
    await page.mouse.click(4, Math.round(page.viewportSize()!.height * 0.45));
    await expect(types).toBeHidden();

    await trigger.click();
    await types.click();
    await page.waitForURL(/\/types$/);
    await expect(page.locator('.more-menu [aria-expanded="true"]')).toHaveCount(0);
  });

  test("phones show the logo without its tagline while desktop keeps the full lockup", async ({ page }, testInfo) => {
    const phone = testInfo.project.name === "mobile";
    for (const [path, lockup] of [["/", 194], ["/en", 232]] as const) {
      await page.goto(path);
      const logo = page.locator("header > a").first().locator("svg").filter({ visible: true });
      await expect(logo).toHaveCount(1);
      await expect(logo).toHaveAttribute("viewBox", `0 0 ${phone ? 126 : lockup} 40`);
    }
  });

  test("the phone header fits narrow screens in both languages", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Phone widths only.");
    for (const width of [360, 393]) {
      await page.setViewportSize({ width, height: 740 });
      for (const path of ["/", "/en", "/en/about"]) {
        await page.goto(path);
        const header = page.locator("header");
        expect(await header.evaluate((el) => el.scrollWidth - el.clientWidth), `${path} @${width}`).toBe(0);
        const box = await header.getByRole("navigation").filter({ visible: true }).locator(".more-menu > button").boundingBox();
        expect(box!.x + box!.width, `${path} @${width}`).toBeLessThanOrEqual(width - 16);
      }
    }
  });

  test("the phone header keeps the logo or back link and both menu labels on one centre line", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Phone header only.");
    for (const path of ["/", "/en", "/help"]) {
      await page.goto(path);
      const nav = page.locator("header").getByRole("navigation").filter({ visible: true });
      const parts = [
        page.locator("header > a").first().locator("svg").filter({ visible: true }),
        nav.locator('[data-slot="dropdown-menu-trigger"] > span'),
        nav.locator(".more-menu > button > span"),
      ];
      const [left, ...labels] = await Promise.all(
        parts.map(async (part) => {
          const box = (await part.boundingBox())!;
          return box.y + box.height / 2;
        }),
      );
      for (const label of labels) expect(Math.abs(label - left), path).toBeLessThanOrEqual(1);
    }
  });
});
