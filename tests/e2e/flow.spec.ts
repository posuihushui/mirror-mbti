import { expect, test, type Page } from "@playwright/test";
import { questions } from "../../src/lib/questionnaires";
import { answerQuestion } from "./quiz-helpers";

/** A consistent first-pole preference, including reverse-scored items. */
async function answerAll(page: Page) {
  await page.getByRole("button", { name: "开始 32 题轻量版" }).click();
  for (const [index, question] of questions.entries()) {
    await answerQuestion(page, question.reverse ? 4 : 0, index === questions.length - 1);
  }
}

test.describe("core flow", () => {
  test("home renders with the primary CTA and never quotes an amount", async ({ page }) => {
    await page.goto("/zh");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("向内看见");
    await expect(page.getByRole("link", { name: /开始人格测试/ }).first()).toBeVisible();
    // Desktop shows "免费测试与性格概览"; the phone dock shows just "免费测试".
    await expect(page.getByText(/免费测试/).filter({ visible: true }).first()).toBeVisible();
    // Nothing before the test may quote a price or hint that anything is sold.
    expect(await page.locator("body").innerText()).not.toMatch(/付费|解锁|订阅|续费|[¥$]\s?\d/);
  });

  test("sample result and sample report are reachable", async ({ page }) => {
    await page.goto("/zh/result/sample");
    await expect(page.getByText("示例结果", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("img", { name: /内向偏好 79%/ }).first()).toBeVisible();
    await page.goto("/zh/report/sample");
    await expect(page.getByText("第一章")).toBeVisible();
  });

  test("an answer moves on by itself, next waits for an answer, and progress survives reload", async ({ page }) => {
    await page.goto("/zh/quiz");
    await page.getByRole("button", { name: "开始 32 题轻量版" }).click();
    const next = page.getByRole("button", { name: /下一题/ }).filter({ visible: true }).first();
    await expect(next).toBeDisabled();
    const first = await page.locator("#question-title").innerText();
    await page.getByRole("group").getByRole("button").first().click();
    // No second tap: the answer confirms, then question 02 replaces it.
    await expect(page.locator("#question-title")).not.toHaveText(first);
    await expect(page.getByText(/^02/).filter({ visible: true }).first()).toBeVisible();
    await expect(next).toBeDisabled();
    await page.reload();
    await expect(page.getByText(/^02/).filter({ visible: true }).first()).toBeVisible();
    await page.goto("/zh");
    await expect(page.getByRole("link", { name: "继续测试 · 1/32 题" }).first()).toBeVisible();
  });

  test("the last answer waits for an explicit tap before the result is created", async ({ page }) => {
    await page.goto("/zh/quiz");
    await page.getByRole("button", { name: "开始 32 题轻量版" }).click();
    for (const [index, question] of questions.entries()) {
      if (index === questions.length - 1) break;
      await answerQuestion(page, question.reverse ? 4 : 0);
    }
    await page.getByRole("group").getByRole("button").first().click();
    await page.waitForTimeout(800);
    await expect(page).toHaveURL(/\/quiz$/);
    await page.getByRole("button", { name: /查看我的结果|查看结果/ }).filter({ visible: true }).first().click();
    await page.waitForURL(/\/result\/[A-Za-z0-9_-]{12}$/);
  });

  test("complete quiz → result → mock pay → report chapters", async ({ page }, testInfo) => {
    await page.goto("/zh/quiz");
    await answerAll(page);
    await page.waitForURL(/\/result\/[A-Za-z0-9_-]{12}$/);
    await expect(page.getByText("你的人格倾向", { exact: true })).toBeVisible();
    await expect(page.getByText(/^100/).first()).toBeVisible();
    await expect(page.getByText("ESTJ", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("总经理", { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: /解锁报告与/ }).first().click();
    await expect(page.getByText("更完整地，认识自己。")).toBeVisible();
    await page.getByRole("button", { name: /暂不支付/ }).click();
    await expect(page.getByText("支付已取消，测试结果已保留")).toBeVisible();

    await page.getByRole("button", { name: /解锁报告与/ }).first().click();
    await page.getByRole("button", { name: /模拟支付 ¥6\.9/ }).click();
    await expect(page.getByText("正在演示解锁…")).toBeVisible();
    await expect(page.getByText("演示解锁成功，本次未产生扣款。")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("link", { name: "阅读我的报告", exact: true }).click();
    await page.waitForURL(/\/report\//);
    await expect(page.getByText("第一章")).toBeVisible();
    await expect(page.locator('[role="tabpanel"]')).toHaveCount(4);
    await expect(page.getByText("示例报告", { exact: true })).toHaveCount(0);

    await page.getByRole("button", { name: /下一章/ }).click();
    await expect(page.getByText("第二章")).toBeVisible();
    // Phones switch to the blind spots; desktop already shows them beside the strengths.
    if (testInfo.project.name === "mobile") await page.getByRole("tab", { name: "容易忽略的" }).click();
    await expect(page.getByText("精力的边界").filter({ visible: true })).toBeVisible();

    const reportPath = new URL(page.url()).pathname;
    await page.goto("/zh/my/report");
    await page.locator(`a[href="${reportPath}"]`).first().click();
    await expect(page).toHaveURL(reportPath);
  });

  test("the sample closes by inviting the test, not by quoting a price", async ({ page }, testInfo) => {
    await page.goto("/zh/result/sample");
    await expect(page.getByText("轮到你了", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /属于你的故事/ })).toBeVisible();
    // nothing is locked here, so no paywall block and no unlock action
    await expect(page.getByText("你不止于此")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /解锁报告与/ })).toHaveCount(0);
    // no price and no hint that anything is sold, and both CTAs lead to the test
    await expect(page.getByText(/免费测试与性格概览/)).toBeVisible();
    expect(await page.locator("body").innerText()).not.toMatch(/付费|解锁|订阅|续费|[¥$]\s?\d/);
    for (const cta of await page.getByRole("link", { name: /开始认识自己/ }).all()) {
      await expect(cta).toHaveAttribute("href", "/zh/quiz");
    }
    await expect(page.getByRole("link", { name: "阅读完整示例报告" })).toHaveAttribute("href", "/zh/report/sample");
    await page.getByRole("heading", { name: /属于你的故事/ }).scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("sample-invitation.png"), animations: "disabled" });
    await page.getByRole("link", { name: /开始认识自己/ }).last().click();
    await expect(page).toHaveURL(/\/quiz$/);
  });

  test("the sample report is the real report layout, marked as a sample", async ({ page }) => {
    await page.goto("/zh/report/sample");
    // marked as a sample: the notice above the reading, the badge or phone heading row, and the title
    await expect(page.getByText(/这是一份示例/).first()).toBeVisible();
    await expect(page.getByText("示例报告", { exact: true }).first()).toBeVisible();
    await expect(page).toHaveTitle(/示例报告/);
    // same structure as a paid report: four chapter panels behind one chapter switcher
    await expect(page.locator('[role="tabpanel"]')).toHaveCount(4);
    await expect(page.locator('[role="tablist"][aria-label="报告章节"] [role="tab"]')).toHaveCount(4);
    await expect(page.locator('nav[aria-label="报告章节"] button')).toHaveCount(4);
    // and it guides to the test rather than to a payment
    await expect(page.getByRole("heading", { name: /属于你的故事/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /解锁报告与/ })).toHaveCount(0);
    for (const cta of await page.getByRole("link", { name: /开始认识自己/ }).all()) {
      await expect(cta).toHaveAttribute("href", "/zh/quiz");
    }
  });

  test("sample report ships every chapter in the server HTML", async ({ request }) => {
    const html = (await (await request.get("/zh/report/sample")).text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
    for (const copy of [
      "先看清偏好",
      "理解你的优势",
      "好的关系",
      "找到适合你的方式",
      "在独处中恢复能量", // chapter 02 strengths
      "精力的边界", // chapter 02 blind spots
      "让精力的需要变得可见", // chapter 03
      "适合你的工作节奏", // chapter 04
    ]) {
      expect(html.includes(copy), copy).toBe(true);
    }
  });

  test("report chapters deep-link, switch and keep both insight lists", async ({ page }, testInfo) => {
    await page.goto("/zh/report/sample?chapter=3");
    await expect(page.getByRole("heading", { name: /好的关系/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /先看清偏好/ })).toBeHidden();

    await page.getByRole("button", { name: /下一章/ }).click();
    await expect(page.getByRole("heading", { name: /找到适合你的方式/ })).toBeVisible();
    await expect(page).toHaveURL(/chapter=4/);

    await page.goto("/zh/report/sample?chapter=2");
    const chapterTwo = page.locator("#chapter-panel-2");
    const strength = chapterTwo.getByRole("heading", { name: "在独处中恢复能量" });
    const blindspot = chapterTwo.getByRole("heading", { name: "精力的边界" });
    await expect(strength).toBeVisible();
    if (testInfo.project.name === "mobile") {
      // Phones switch between the two lists.
      await expect(blindspot).toBeHidden();
      await page.getByRole("tab", { name: "容易忽略的" }).click();
      await expect(blindspot).toBeVisible();
      await expect(strength).toBeHidden();
    } else {
      // From 721px each strength sits on one row with its blind spot.
      await expect(blindspot).toBeVisible();
      const [left, right] = [(await strength.boundingBox())!, (await blindspot.boundingBox())!];
      expect(Math.abs(left.y - right.y)).toBeLessThan(2);
      expect(right.x).toBeGreaterThan(left.x + left.width);
    }
  });

  test("locked report redirects to the result with the unlock sheet", async ({ page }) => {
    await page.goto("/zh/quiz");
    await answerAll(page);
    await page.waitForURL(/\/result\//);
    const id = page.url().split("/result/")[1];
    await page.goto(`/zh/report/${id}`);
    await expect(page).toHaveURL(new RegExp(`/zh/result/${id}\\?unlock=1`));
    await expect(page.getByText("更完整地，认识自己。")).toBeVisible();
  });

  test("API rejects malformed answers and unknown results", async ({ page }) => {
    await page.goto("/zh"); // obtains the visitor cookie
    const request = page.request;
    const noSession = await page.context().request.fetch("/api/results", { method: "POST", data: { answers: [] }, headers: { cookie: "" } });
    expect([400, 401]).toContain(noSession.status());
    const bad = await request.post("/api/results", { data: { answers: [1, 2, 3] } });
    expect(bad.status()).toBe(400);
    const missing = await request.get("/api/results/zzzzzzzzzzzz");
    expect(missing.status()).toBe(404);
    const foreign = await request.post("/api/orders", { data: { resultId: "zzzzzzzzzzzz" } });
    expect(foreign.status()).toBe(404);
    const mock = await request.post("/api/orders/M2026091000000000DEADBEEF/mock-pay");
    expect(mock.status()).toBe(404);
  });

  test("SEO endpoints respond", async ({ request }) => {
    for (const path of ["/robots.txt", "/sitemap.xml", "/llms.txt", "/llms-full.txt", "/manifest.webmanifest", "/opengraph-image", "/types/INFJ/opengraph-image", "/icon"]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(200);
    }
  });
});
