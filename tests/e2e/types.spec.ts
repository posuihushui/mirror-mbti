import { expect, test } from "@playwright/test";

const ALL = ["ISTJ", "ISFJ", "INFJ", "INTJ", "ISTP", "ISFP", "INFP", "INTP", "ESTP", "ESFP", "ENFP", "ENTP", "ESTJ", "ESFJ", "ENFJ", "ENTJ"];

test.describe("type pages", () => {
  for (const [prefix, groups] of [["/zh", ["NF", "NT", "SJ", "SP"]], ["", ["NF", "NT", "SJ", "SP"]]] as const) {
    test(`${prefix || "/"} types index lists every type in the map and in exactly one full group`, async ({ page }) => {
      await page.goto(`${prefix}/types`);
      const map = page.getByRole("table");
      await expect(map.getByRole("link")).toHaveCount(16);
      for (const type of ALL) await expect(map.locator(`a[href="${prefix}/types/${type}"]`)).toHaveCount(1);
      const listed: string[] = [];
      for (const group of groups) {
        const section = page.locator(`section[aria-labelledby="group-${group}"]`);
        const links = section.locator('a[href*="/types/"]');
        // Every temperament group is complete: an empty or partial group is the bug this guards against.
        await expect(links).toHaveCount(4);
        for (const href of await links.evaluateAll((as) => as.map((a) => a.getAttribute("href")!))) listed.push(href.split("/").pop()!);
      }
      expect([...listed].sort()).toEqual([...ALL].sort());
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }

  test("a type page explains itself with server-rendered diagrams", async ({ page, request }) => {
    const html = await (await request.get("/zh/types/INFJ")).text();
    // The diagrams are content: they ship in the HTML, not only after hydration.
    for (const text of ["偏向内向 I", "偏向直觉 N", "偏向情感 F", "偏向判断 J", "在日常里，可能是什么样？", "INFJ 可能会这样说", "在十六种倾向中的位置"]) {
      expect(html, text).toContain(text);
    }
    await page.goto("/zh/types/INFJ");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("INFJ");
    // Four one-letter neighbours, each a link to that type.
    for (const neighbor of ["ENFJ", "ISFJ", "INTJ", "INFP"]) {
      await expect(page.locator(`section[aria-labelledby="neighbors"] a[href="/zh/types/${neighbor}"]`)).toHaveCount(1);
    }
    // The map marks where this type sits.
    await expect(page.getByRole("table").locator('a[aria-current="page"]')).toHaveAttribute("href", "/zh/types/INFJ");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test("the English type page carries the same diagrams without Chinese", async ({ page }) => {
    await page.goto("/types/ESTP");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("ESTP");
    await expect(page.getByText("Leans Extraverted (E)", { exact: true })).toBeAttached();
    await expect(page.locator('section[aria-labelledby="neighbors"] a[href^="/types/"]')).toHaveCount(4);
    await expect(page.getByRole("table").locator('a[aria-current="page"]')).toHaveAttribute("href", "/types/ESTP");
    expect(await page.locator("main").innerText()).not.toMatch(/[一-鿿]/);
  });
});
