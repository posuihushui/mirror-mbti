import { expect, test } from "@playwright/test";

/** The header's menus are the only place these pages are listed: pages carry no footer navigation. */
const menuPaths = ["/preferences", "/types", "/about", "/help", "/privacy", "/terms"];

test.describe("header navigation", () => {
  test("every menu link stays in the server HTML while the menu is closed", async ({ request }) => {
    for (const path of ["/zh", "/zh/help", "/zh/result/sample", "/zh/report/sample", "/"]) {
      const html = await (await request.get(path)).text();
      const prefix = path.startsWith("/zh") ? "/zh" : "";
      expect(html, `${path} renders the menu`).toContain('aria-expanded="false"');
      for (const target of menuPaths) expect(html, `${path} links ${target}`).toContain(`href="${prefix}${target}"`);
    }
  });

  test("the menu opens on click and closes on Escape, an outside press and a followed link", async ({ page }, testInfo) => {
    const phone = testInfo.project.name === "mobile";
    await page.goto("/zh");
    const nav = page.getByRole("navigation", { name: "主导航" }).filter({ visible: true });
    const trigger = nav.getByRole("button", { name: phone ? "更多" : "更多信息", exact: true });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    const about = nav.getByRole("link", { name: "测试说明", exact: true });
    const primary = ["人格测试", "16 型人格", "我的报告"].map((name) => nav.getByRole("link", { name, exact: true }));
    const english = nav.locator("[data-language-options]").getByRole("link", { name: "English" });
    await expect(about).toBeHidden();
    await expect(english).toBeHidden();
    // Desktop shows the three primary links beside the menu; phones keep them inside it.
    for (const link of primary) await (phone ? expect(link).toBeHidden() : expect(link).toBeVisible());

    // The button works once hydrated: retry until it opens.
    await expect(async () => {
      await trigger.click();
      await expect(about).toBeVisible({ timeout: 1000 });
    }).toPass();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    for (const link of primary) await expect(link).toBeVisible();
    // The menu ends with the languages: the current one is marked, the other is a link.
    await expect(nav.locator("[data-language-options]").getByText("中文", { exact: true })).toHaveAttribute("aria-current", "true");
    await expect(english).toHaveAttribute("href", "/");
    await page.keyboard.press("Escape");
    await expect(about).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.click();
    await expect(about).toBeVisible();
    await page.mouse.click(4, Math.round(page.viewportSize()!.height * 0.45));
    await expect(about).toBeHidden();

    await trigger.click();
    await about.click();
    await page.waitForURL(/\/about$/);
    await expect(page.locator('.more-menu [aria-expanded="true"]')).toHaveCount(0);
  });

  test("phones show the logo without its tagline while desktop keeps the full lockup", async ({ page }, testInfo) => {
    const phone = testInfo.project.name === "mobile";
    for (const [path, lockup] of [["/zh", 194], ["/", 232]] as const) {
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
      for (const path of ["/zh", "/", "/about"]) {
        await page.goto(path);
        const header = page.locator("header");
        expect(await header.evaluate((el) => el.scrollWidth - el.clientWidth), `${path} @${width}`).toBe(0);
        const box = await header.getByRole("navigation").filter({ visible: true }).locator(".more-menu > button").boundingBox();
        expect(box!.x + box!.width, `${path} @${width}`).toBeLessThanOrEqual(width - 16);
      }
    }
  });

  test("the phone header keeps the logo or back link and the menu label on one centre line", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Phone header only.");
    for (const path of ["/zh", "/", "/zh/help"]) {
      await page.goto(path);
      const nav = page.locator("header").getByRole("navigation").filter({ visible: true });
      const parts = [
        page.locator("header > a").first().locator("svg").filter({ visible: true }),
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
