import { expect, test, type Page } from "@playwright/test";
import { EN_QUICK_QUESTIONNAIRE_ID, getQuestionnaire } from "../../src/lib/questionnaires";

const enQuick = getQuestionnaire(EN_QUICK_QUESTIONNAIRE_ID)!;

/** A consistent first-pole preference on the English 32-item version, including reverse-scored items. */
async function answerAllEnglish(page: Page) {
  await page.getByRole("button", { name: "Start 32-item Quick" }).click();
  for (const question of enQuick.questions) {
    await expect(page.getByRole("group")).toBeVisible();
    await page.getByRole("group").getByRole("button").nth(question.reverse ? 4 : 0).click();
    await page.getByRole("button", { name: /^(Next|See my result|See result)$/ }).first().click();
  }
}

test.describe("English site", () => {
  test("serves English pages with hreflang, while Chinese URLs stay unprefixed", async ({ page, request }) => {
    const res = await request.get("/en");
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain('<html lang="en"');
    // The English lockup reads "mirror | look within": wider artwork at the same glyph scale.
    expect(html).toContain('viewBox="0 0 232 40"');
    const zhHome = await (await request.get("/")).text();
    expect(zhHome).toContain('viewBox="0 0 194 40"');
    expect(zhHome).not.toContain('viewBox="0 0 232 40"');
    expect(html).toContain('hrefLang="zh-CN"');
    expect(html).toContain('hrefLang="en"');

    await page.goto("/en");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Look within");
    await expect(page.getByRole("link", { name: /Start the personality test/ }).first()).toBeVisible();

    const zh = await request.get("/zh/quiz", { maxRedirects: 0 });
    expect(zh.status()).toBe(308);
    expect(zh.headers().location).toMatch(/\/quiz$/);
  });

  test("the header language menu opens the same page in the other language, and locale-bound pages open the other home", async ({ page }) => {
    // The trigger is a hydrated Radix button: retry until the menu is open rather than racing hydration.
    const openLanguageMenu = (name: RegExp) =>
      expect(async () => {
        await page.getByRole("button", { name }).filter({ visible: true }).click();
        await expect(page.getByRole("menu")).toBeVisible({ timeout: 1000 });
      }).toPass();

    await page.goto("/types/INFJ");
    await openLanguageMenu(/语言/);
    await expect(page.getByRole("menuitem", { name: "中文" })).toHaveAttribute("aria-current", "true");
    const english = page.getByRole("menuitem", { name: "English" });
    await expect(english).toHaveAttribute("href", "/en/types/INFJ");
    await english.click();
    await page.waitForURL(/\/en\/types\/INFJ$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await openLanguageMenu(/Language/);
    await page.getByRole("menuitem", { name: "中文" }).click();
    await page.waitForURL(/\/types\/INFJ$/);
    expect(new URL(page.url()).pathname).toBe("/types/INFJ");
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");

    await page.goto("/en/report/sample");
    await openLanguageMenu(/Language/);
    await expect(page.getByRole("menuitem", { name: "中文" })).toHaveAttribute("href", "/report/sample");

    await page.goto("/en/result/zzzzzzzzzzzz");
    await openLanguageMenu(/Language/);
    await expect(page.getByRole("menuitem", { name: "中文" })).toHaveAttribute("href", "/");
  });

  test("the English sample report ships all four chapters in the server HTML", async ({ request }) => {
    const html = await (await request.get("/en/report/sample")).text();
    expect(html.match(/role="tabpanel"/g)?.length).toBe(4);
    expect(html).toContain("Sample report");
    expect(html).not.toMatch(/示例报告/);
  });

  test("English quiz → result → demo payment → English report", async ({ page }) => {
    await page.goto("/en/quiz");
    await answerAllEnglish(page);
    await page.waitForURL(/\/en\/result\//);
    const id = page.url().split("/en/result/")[1].split(/[?#]/)[0];

    await expect(page.getByText("YOUR PERSONALITY", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Unlock the full report" }).filter({ visible: true }).first().click();
    await page.getByRole("button", { name: /Demo payment \$1/ }).click();
    await page.getByRole("button", { name: "Start reading" }).click();
    await page.waitForURL(new RegExp(`/en/report/${id}`));
    await expect(page.getByText("CHAPTER 01")).toBeVisible();
    // Desktop shows the sidebar badge; phones show the heading row instead.
    await expect(page.getByText(/Unlocked · Demo|Full report · Demo/).filter({ visible: true }).first()).toBeVisible();

    // The Chinese URL of an English result lands on its English page.
    await page.goto(`/result/${id}`);
    await page.waitForURL(new RegExp(`/en/result/${id}`));
  });

  test("API errors follow the language of the calling page", async ({ page }) => {
    await page.goto("/en");
    const res = await page.request.post("/api/orders", {
      data: { resultId: "zzzzzzzzzzzz" },
      headers: { referer: new URL("/en/result/zzzzzzzzzzzz", page.url()).toString() },
    });
    expect(res.status()).toBe(404);
    expect((await res.json()).error.message).toBe("Result not found.");
  });
});
