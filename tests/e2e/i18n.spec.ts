import { expect, test, type Page } from "@playwright/test";
import { EN_QUICK_QUESTIONNAIRE_ID, getQuestionnaire } from "../../src/lib/questionnaires";
import { answerQuestion } from "./quiz-helpers";

const enQuick = getQuestionnaire(EN_QUICK_QUESTIONNAIRE_ID)!;

/** A consistent first-pole preference on the English 32-item version, including reverse-scored items. */
async function answerAllEnglish(page: Page) {
  await page.getByRole("button", { name: "Start 32-item Quick" }).click();
  for (const [index, question] of enQuick.questions.entries()) {
    await answerQuestion(page, question.reverse ? 4 : 0, index === enQuick.questions.length - 1);
  }
}

test.describe("English site", () => {
  test("serves English without a prefix and Chinese under /zh", async ({ page, request }) => {
    const res = await request.get("/");
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain('<html lang="en"');
    // The English lockup reads "mirror | look within": wider artwork at the same glyph scale.
    expect(html).toContain('viewBox="0 0 232 40"');
    const zhHome = await (await request.get("/zh")).text();
    expect(zhHome).toContain('viewBox="0 0 194 40"');
    expect(zhHome).not.toContain('viewBox="0 0 232 40"');
    expect(html).toContain('hrefLang="zh-CN"');
    expect(html).toContain('hrefLang="en"');

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Look within");
    await expect(page.getByRole("link", { name: /Start the personality test/ }).first()).toBeVisible();

    const zh = await request.get("/zh/quiz");
    expect(zh.status()).toBe(200);
    expect(await zh.text()).toContain('<html lang="zh-CN"');
    const oldEnglish = await request.get("/en/quiz?from=old-link", { maxRedirects: 0 });
    expect(oldEnglish.status()).toBe(308);
    expect(oldEnglish.headers().location).toMatch(/\/quiz\?from=old-link$/);
  });

  test("the 更多 menu's languages open the same page in the other language, and locale-bound pages open the other home", async ({ page }) => {
    // The languages end the header's 更多 menu. Its button works once hydrated: retry until the panel is open.
    const languages = page.locator("[data-language-options]").filter({ visible: true });
    const openMore = (name: RegExp) =>
      expect(async () => {
        await page.locator("header").getByRole("navigation").filter({ visible: true }).getByRole("button", { name }).click();
        await expect(languages).toBeVisible({ timeout: 1000 });
      }).toPass();

    await page.goto("/zh/types/INFJ");
    await openMore(/^更多/);
    await expect(languages.getByText("中文", { exact: true })).toHaveAttribute("aria-current", "true");
    const english = languages.getByRole("link", { name: "English" });
    await expect(english).toHaveAttribute("href", "/types/INFJ");
    await english.click();
    await page.waitForURL(/\/types\/INFJ$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await openMore(/^More/);
    await languages.getByRole("link", { name: "中文" }).click();
    await page.waitForURL(/\/zh\/types\/INFJ$/);
    expect(new URL(page.url()).pathname).toBe("/zh/types/INFJ");
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");

    await page.goto("/report/sample");
    await openMore(/^More/);
    await expect(languages.getByRole("link", { name: "中文" })).toHaveAttribute("href", "/zh/report/sample");

    await page.goto("/result/zzzzzzzzzzzz");
    await openMore(/^More/);
    await expect(languages.getByRole("link", { name: "中文" })).toHaveAttribute("href", "/zh");
  });

  test("the English sample report ships all four chapters in the server HTML", async ({ request }) => {
    const html = await (await request.get("/report/sample")).text();
    expect(html.match(/role="tabpanel"/g)?.length).toBe(4);
    expect(html).toContain("Sample report");
    expect(html).not.toMatch(/示例报告/);
  });

  test("English quiz → result → demo payment → English report", async ({ page }) => {
    await page.goto("/quiz");
    await answerAllEnglish(page);
    await page.waitForURL(/\/result\//);
    const id = page.url().split("/result/")[1].split(/[?#]/)[0];

    await expect(page.getByText("YOUR PERSONALITY", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /Unlock report/ }).filter({ visible: true }).first().click();
    // The price comes from PRICE_USD_CENTS, so match the label rather than one amount.
    await page.getByRole("button", { name: /^Demo payment \$\d/ }).click();
    await page.getByRole("link", { name: "Read my report", exact: true }).click();
    await page.waitForURL(new RegExp(`/report/${id}`));
    await expect(page.getByText("CHAPTER 01")).toBeVisible();
    // Desktop shows the sidebar badge; phones show the heading row instead.
    await expect(page.getByText(/Unlocked · Demo|Full report · Demo/).filter({ visible: true }).first()).toBeVisible();

    // The Chinese URL of an English result lands on its English page.
    await page.goto(`/zh/result/${id}`);
    await page.waitForURL(new RegExp(`/result/${id}`));
  });

  /** Public English pages, plus the private ones a signed visitor reaches without any data. */
  const englishPages = ["/", "/quiz", "/result/sample", "/report/sample", "/about", "/preferences",
    "/pairing", "/help", "/types", "/types/INFJ", "/privacy", "/terms",
    "/my/report", "/my/shares", "/my/pairing"];

  test("no English page carries Chinese, in its copy, its metadata or its structured data", async ({ request }) => {
    for (const path of englishPages) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(200);
      // Flight payloads escape non-ASCII, so decode before looking: client-island props hide there.
      const html = (await res.text()).replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
      expect(html.match(/[\u4e00-\u9fff]/g) ?? [], `${path} must not render Chinese`).toEqual([]);
    }
  });

  test("each language installs as its own app, and neither manifest is written in the other language", async ({ request }) => {
    expect(await (await request.get("/")).text()).toContain('href="/manifest.webmanifest"');
    expect(await (await request.get("/zh")).text()).toContain('href="/zh/manifest.webmanifest"');

    const en = await (await request.get("/manifest.webmanifest")).json();
    expect(en).toMatchObject({ name: "mirror", short_name: "mirror", lang: "en", start_url: "/" });
    expect(JSON.stringify(en)).not.toMatch(/[\u4e00-\u9fff]/);

    const zh = await (await request.get("/zh/manifest.webmanifest")).json();
    expect(zh).toMatchObject({ name: "观己 mirror", short_name: "观己", lang: "zh-CN", start_url: "/zh" });
  });

  test("discovery files use English root URLs and /zh for Chinese", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
    expect(paths).toContain("/");
    expect(paths).toContain("/zh");
    expect(paths.some((path) => path === "/en" || path.startsWith("/en/"))).toBe(false);

    const english = await (await request.get("/llms.txt")).text();
    const chinese = await (await request.get("/zh/llms.txt")).text();
    expect(english).toContain("English (at /)");
    expect(english).toContain("/zh/llms.txt");
    expect(english).not.toMatch(/[\u4e00-\u9fff]/);
    expect(chinese).toContain("中文版位于 /zh");
    expect(chinese).toContain("/zh/types/INFJ");
    const oldEnglish = await request.get("/en/llms.txt", { maxRedirects: 0 });
    expect(oldEnglish.status()).toBe(308);
    expect(oldEnglish.headers().location).toBe("/llms.txt");
  });

  // A 404 is a non-streamed response: the built app returns the shell and resumes the copy on the
  // client, so assert the rendered page rather than the HTML body.
  test("an unmatched URL 404s in the language of its prefix", async ({ page, request }) => {
    for (const path of ["/no-such-page", "/zh/no-such-page"]) {
      expect((await request.get(path)).status(), path).toBe(404);
    }

    await page.goto("/no-such-page");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("This page has no story yet.");
    await expect(page.getByRole("link", { name: "Back to home" }).first()).toHaveAttribute("href", "/");

    await page.goto("/zh/no-such-page");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("这一页还没有故事。");
    await expect(page.getByRole("link", { name: "回到首页" }).first()).toHaveAttribute("href", "/zh");
  });

  test("API errors follow the language of the calling page", async ({ page }) => {
    await page.goto("/");
    const res = await page.request.post("/api/orders", {
      data: { resultId: "zzzzzzzzzzzz" },
      headers: { referer: new URL("/result/zzzzzzzzzzzz", page.url()).toString() },
    });
    expect(res.status()).toBe(404);
    expect((await res.json()).error.message).toBe("Result not found.");
  });
});
