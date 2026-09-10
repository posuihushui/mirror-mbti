import { expect, test, type Page } from "@playwright/test";

/** Answers all 32 questions with the given value (index in the 5-option list). */
async function answerAll(page: Page, optionIndex: number) {
  for (let i = 0; i < 32; i++) {
    await expect(page.getByRole("group")).toBeVisible();
    await page.getByRole("group").getByRole("button").nth(optionIndex).click();
    const next = page.getByRole("button", { name: /下一题|查看我的结果|查看结果/ }).first();
    await next.click();
  }
}

test.describe("core flow", () => {
  test("home renders with the primary CTA and price", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("向内看见");
    await expect(page.getByRole("link", { name: /开始认识自己/ }).first()).toBeVisible();
    await expect(page.getByText(/完整报告 ¥6\.9/).filter({ visible: true }).first()).toBeVisible();
  });

  test("sample result and sample report are reachable", async ({ page }) => {
    await page.goto("/result/sample");
    await expect(page.getByText("SAMPLE REPORT · 示例报告")).toBeVisible();
    await expect(page.getByRole("img", { name: /内向偏好 79%/ }).first()).toBeVisible();
    await page.goto("/report/sample");
    await expect(page.getByText("CHAPTER 01")).toBeVisible();
  });

  test("quiz gates next until an answer is chosen and persists progress across reload", async ({ page }) => {
    await page.goto("/quiz");
    const next = page.getByRole("button", { name: /下一题/ }).first();
    await expect(next).toBeDisabled();
    await page.getByRole("group").getByRole("button").first().click();
    await expect(next).toBeEnabled();
    await next.click();
    await expect(page.getByText(/^02/).filter({ visible: true }).first()).toBeVisible();
    await page.reload();
    await expect(page.getByText(/^02/).filter({ visible: true }).first()).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("link", { name: /继续认识自己/ }).first()).toBeVisible();
  });

  test("complete quiz → result → mock pay → report chapters", async ({ page }) => {
    await page.goto("/quiz");
    await answerAll(page, 0);
    await page.waitForURL(/\/result\/[A-Za-z0-9_-]{12}$/);
    await expect(page.getByText("YOUR PERSONALITY · 你的性格画像")).toBeVisible();
    // "非常符合" on every item cancels out across reverse-scored pairs: 50% on all four axes.
    await expect(page.getByText(/^50/).first()).toBeVisible();
    await expect(page.getByText("部分维度接近均衡，字母只描述这次作答中的倾向。")).toBeVisible();

    await page.getByRole("button", { name: /解锁完整报告/ }).first().click();
    await expect(page.getByText("更完整地，认识自己。")).toBeVisible();
    await page.getByRole("button", { name: /暂不支付/ }).click();
    await expect(page.getByText("支付已取消，测试结果已保留")).toBeVisible();

    await page.getByRole("button", { name: /解锁完整报告/ }).first().click();
    await page.getByRole("button", { name: /模拟支付 ¥6\.9/ }).click();
    await expect(page.getByText("正在演示解锁…")).toBeVisible();
    await expect(page.getByText("演示解锁成功，本次未产生扣款。")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /开始阅读报告/ }).click();
    await page.waitForURL(/\/report\//);
    await expect(page.getByText("CHAPTER 01")).toBeVisible();
    await expect(page.locator('[role="tabpanel"]')).toHaveCount(4);
    await expect(page.getByText("SAMPLE REPORT · 示例报告")).toHaveCount(0);

    await page.getByRole("button", { name: /下一章/ }).click();
    await expect(page.getByText("CHAPTER 02")).toBeVisible();
    await page.getByRole("tab", { name: "容易忽略的" }).click();
    await expect(page.getByText("精力的边界")).toBeVisible();

    const reportPath = new URL(page.url()).pathname;
    await page.goto("/my/report");
    await page.locator(`a[href="${reportPath}"]`).first().click();
    await expect(page).toHaveURL(reportPath);
  });

  test("the sample closes by inviting the test, not by quoting a price", async ({ page }) => {
    await page.goto("/result/sample");
    await expect(page.getByText("YOUR TURN · 轮到你了")).toBeVisible();
    await expect(page.getByRole("heading", { name: /属于你的故事/ })).toBeVisible();
    // nothing is locked here, so no paywall block and no unlock action
    await expect(page.getByText("THERE IS MORE TO YOU")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /解锁完整报告/ })).toHaveCount(0);
    // the price stays as a footnote, and both CTAs lead to the test
    await expect(page.getByText(/免费测试与性格概览 · 完整报告 ¥6\.9 \/ 次/)).toBeVisible();
    for (const cta of await page.getByRole("link", { name: /开始认识自己/ }).all()) {
      await expect(cta).toHaveAttribute("href", "/quiz");
    }
    await expect(page.getByRole("link", { name: "阅读完整示例报告" })).toHaveAttribute("href", "/report/sample");
    await page.getByRole("link", { name: /开始认识自己/ }).last().click();
    await expect(page).toHaveURL(/\/quiz$/);
  });

  test("the sample report is the real report layout, marked as a sample", async ({ page }) => {
    await page.goto("/report/sample");
    // marked as a sample
    await expect(page.getByText("SAMPLE REPORT · 示例报告")).toBeVisible();
    await expect(page.getByText("示例报告").first()).toBeVisible();
    await expect(page).toHaveTitle(/示例报告/);
    // same structure as a paid report: four chapter panels behind one chapter switcher
    await expect(page.locator('[role="tabpanel"]')).toHaveCount(4);
    await expect(page.locator('[role="tablist"][aria-label="报告章节"] [role="tab"]')).toHaveCount(4);
    await expect(page.locator('nav[aria-label="报告章节"] button')).toHaveCount(4);
    // and it guides to the test rather than to a payment
    await expect(page.getByRole("heading", { name: /属于你的故事/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /解锁完整报告/ })).toHaveCount(0);
    for (const cta of await page.getByRole("link", { name: /开始认识自己/ }).all()) {
      await expect(cta).toHaveAttribute("href", "/quiz");
    }
  });

  test("sample report ships every chapter in the server HTML", async ({ request }) => {
    const html = await (await request.get("/report/sample")).text();
    for (const copy of [
      "温柔地理解世界",
      "理解你的优势",
      "好的关系",
      "找到适合你的方式",
      "在独处中恢复能量", // chapter 02 strengths
      "精力的边界", // chapter 02 blind spots
      "让精力的需要变得可见", // chapter 03
      "适合你的工作节奏", // chapter 04
    ]) {
      expect(html, copy).toContain(copy);
    }
  });

  test("report chapters deep-link, switch and keep both insight lists", async ({ page }) => {
    await page.goto("/report/sample?chapter=3");
    await expect(page.getByRole("heading", { name: /好的关系/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /温柔地理解世界/ })).toBeHidden();

    await page.getByRole("button", { name: /下一章/ }).click();
    await expect(page.getByRole("heading", { name: /找到适合你的方式/ })).toBeVisible();
    await expect(page).toHaveURL(/chapter=4/);

    await page.goto("/report/sample?chapter=2");
    const chapterTwo = page.locator("#chapter-panel-2");
    await expect(chapterTwo.getByRole("heading", { name: "在独处中恢复能量" })).toBeVisible();
    await expect(chapterTwo.getByRole("heading", { name: "精力的边界" })).toBeHidden();
    await page.getByRole("tab", { name: "容易忽略的" }).click();
    await expect(chapterTwo.getByRole("heading", { name: "精力的边界" })).toBeVisible();
    await expect(chapterTwo.getByRole("heading", { name: "在独处中恢复能量" })).toBeHidden();
  });

  test("locked report redirects to the result with the unlock sheet", async ({ page }) => {
    await page.goto("/quiz");
    await answerAll(page, 2);
    await page.waitForURL(/\/result\//);
    const id = page.url().split("/result/")[1];
    await page.goto(`/report/${id}`);
    await expect(page).toHaveURL(new RegExp(`/result/${id}\\?unlock=1`));
    await expect(page.getByText("更完整地，认识自己。")).toBeVisible();
  });

  test("API rejects malformed answers and unknown results", async ({ page }) => {
    await page.goto("/"); // obtains the visitor cookie
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
    for (const path of ["/robots.txt", "/sitemap.xml", "/manifest.webmanifest", "/opengraph-image", "/types/INFJ/opengraph-image", "/icon"]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(200);
    }
  });
});
