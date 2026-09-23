import { expect, test, type APIRequestContext, type Page, type TestInfo } from "@playwright/test";
import { questions } from "../../src/lib/personality";

type SavedResult = { id: string; type: string };
const recoveryRun = Math.floor(Date.now() / 1000) % 65_536;

// Keep each case's recovery attempts separate from other cases and browser projects.
function requestHeaders(testInfo: TestInfo) {
  const key = `${testInfo.project.name}:${testInfo.title}`;
  const hash = Array.from(key).reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 0);
  // Documentation-only IPv6 range; fresh runs/retries do not inherit a used bucket.
  return { "x-forwarded-for": `2001:db8:${recoveryRun.toString(16)}:${(hash >>> 16).toString(16)}:${(hash & 0xffff).toString(16)}:${testInfo.retry}::1` };
}

async function saveResult(request: APIRequestContext, opposite = false): Promise<SavedResult> {
  const answers = questions.map((question) => (Boolean(question.reverse) !== opposite ? -2 : 2));
  const response = await request.post("/api/results", { data: { answers } });
  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.ok).toBe(true);
  return body.data;
}

async function makeOrder(request: APIRequestContext, result: SavedResult, paid = false): Promise<string> {
  const response = await request.post("/api/orders", { data: { resultId: result.id } });
  expect(response.status()).toBe(201);
  const body = await response.json();
  const orderId: string = body.data.id;
  if (paid) {
    const payment = await request.post(`/api/orders/${orderId}/mock-pay`);
    expect(payment.status()).toBe(200);
    expect((await payment.json()).data.status).toBe("paid");
  }
  return orderId;
}

async function expectRecord(page: Page, result: SavedResult, paid = false) {
  const href = `/zh/${paid ? "report" : "result"}/${result.id}`;
  const card = page.getByRole("article", { name: `${result.type} 测试记录`, exact: true }).filter({
    has: page.locator(`a[href="${href}"]`),
  });
  await expect(card).toBeVisible();
  await expect(card.getByRole("link", { name: paid ? "阅读详细报告" : "查看简要结果", exact: true })).toHaveAttribute("href", href);
  if (!paid) await expect(card.getByRole("link", { name: "阅读详细报告", exact: true })).toHaveCount(0);
}

test.describe("report history and order recovery", () => {
  test.beforeEach(async ({ context }, testInfo) => {
    await context.setExtraHTTPHeaders(requestHeaders(testInfo));
  });

  test("lists every result, including an older paid report, without depending on local storage", async ({ page }, testInfo) => {
    await page.goto("/zh");
    const paid = await saveResult(page.request);
    await makeOrder(page.request, paid, true);
    const unpaid = await saveResult(page.request, true);
    const latest = await saveResult(page.request);

    await page.goto("/zh/my/report");
    await expect(page).toHaveURL(/\/my\/report$/);
    await expect(page.getByRole("article", { name: /测试记录$/ })).toHaveCount(3);
    await expectRecord(page, paid, true);
    await expectRecord(page, unpaid);
    await expectRecord(page, latest);

    const html = await (await page.request.get("/zh/my/report")).text();
    for (const href of [`/zh/report/${paid.id}`, `/zh/result/${unpaid.id}`, `/zh/result/${latest.id}`]) {
      expect(html).toContain(`href="${href}"`);
    }

    await page.evaluate(() => localStorage.clear());
    await page.goto("/zh");
    // Phones keep 我的报告 inside the header's 更多 menu; open it once the button is hydrated.
    const header = page.getByRole("navigation", { name: "主导航" }).filter({ visible: true });
    const more = header.getByRole("button", { name: "更多", exact: true });
    const myReports = header.getByRole("link", { name: /我的报告/ }).first();
    if (await more.isVisible()) {
      await expect(async () => {
        if ((await more.getAttribute("aria-expanded")) !== "true") await more.click();
        await expect(myReports).toBeVisible({ timeout: 1000 });
      }).toPass();
    }
    await expect(myReports).toHaveAttribute("href", "/zh/my/report");
    await myReports.click();
    await expect(page).toHaveURL(/\/my\/report$/);
    await expect(page.getByRole("article", { name: /测试记录$/ })).toHaveCount(3);
    await page.screenshot({ path: testInfo.outputPath("report-history.png"), fullPage: true, animations: "disabled" });
  });

  test("a visitor without a saved session can start a test or recover with an order number", async ({ page, context }, testInfo) => {
    expect((await context.cookies()).filter((cookie) => cookie.name === "mid")).toHaveLength(0);
    await page.goto("/zh/my/report");
    await expect(page.getByRole("article", { name: /测试记录$/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /开始.*测试|开始认识自己/ }).filter({ visible: true }).first()).toHaveAttribute("href", "/zh/quiz");
    await expect(page.getByLabel("订单号", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "找回测试记录", exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("report-empty.png"), fullPage: true, animations: "disabled" });
  });

  test("recovering a paid order restores all history while the other result stays locked", async ({ page, context }) => {
    await page.goto("/zh");
    const paid = await saveResult(page.request);
    const orderId = await makeOrder(page.request, paid, true);
    const unpaid = await saveResult(page.request, true);
    const ownerCookie = (await context.cookies()).find((cookie) => cookie.name === "mid")!;

    await page.evaluate(() => localStorage.clear());
    await context.clearCookies();
    await page.goto("/zh/my/report");
    await expect(page.getByRole("article", { name: /测试记录$/ })).toHaveCount(0);
    await page.getByLabel("订单号", { exact: true }).fill(orderId);
    await page.getByRole("button", { name: "找回测试记录", exact: true }).click();
    await expectRecord(page, paid, true);
    await expectRecord(page, unpaid);
    await expect(page.getByRole("article", { name: /测试记录$/ })).toHaveCount(2);
    expect((await context.cookies()).filter((cookie) => cookie.name === "mid").map((cookie) => cookie.value)).toEqual([ownerCookie.value]);

    await page.locator(`a[href="/zh/report/${paid.id}"]`).click();
    await expect(page.getByText("第一章", { exact: true })).toBeVisible();
    await page.goto(`/zh/report/${unpaid.id}`);
    await expect(page).toHaveURL(new RegExp(`/zh/result/${unpaid.id}\\?unlock=1$`));
    await expect(page.getByText("更完整地，认识自己。", { exact: true })).toBeVisible();
    expect((await (await page.request.get(`/api/results/${unpaid.id}`)).json()).data.unlocked).toBe(false);
  });

  test("an unpaid order can recover from a direct request without a cookie and does not grant paid access", async ({ page, context, browser, baseURL }, testInfo) => {
    await page.goto("/zh");
    const ordered = await saveResult(page.request);
    const orderId = await makeOrder(page.request, ordered);
    const other = await saveResult(page.request, true);
    const ownerCookie = (await context.cookies()).find((cookie) => cookie.name === "mid")!;
    const recoveredContext = await browser.newContext({ baseURL, extraHTTPHeaders: requestHeaders(testInfo) });

    try {
      expect(await recoveredContext.cookies()).toHaveLength(0);
      const recovery = await recoveredContext.request.post("/api/reports/recover", {
        data: { orderId },
        headers: { Origin: new URL(baseURL!).origin },
      });
      expect(recovery.status()).toBe(200);
      expect((await recoveredContext.cookies()).filter((cookie) => cookie.name === "mid").map((cookie) => cookie.value)).toEqual([ownerCookie.value]);
      expect(recovery.headersArray().filter((header) => header.name.toLowerCase() === "set-cookie" && header.value.startsWith("mid="))).toHaveLength(1);

      const recoveredPage = await recoveredContext.newPage();
      await recoveredPage.goto("/zh/my/report");
      await expectRecord(recoveredPage, ordered);
      await expectRecord(recoveredPage, other);
      await expect(recoveredPage.getByRole("article", { name: /测试记录$/ })).toHaveCount(2);
      await recoveredPage.goto(`/zh/report/${ordered.id}`);
      await expect(recoveredPage).toHaveURL(new RegExp(`/zh/result/${ordered.id}\\?unlock=1$`));
      expect((await (await recoveredContext.request.get(`/api/results/${ordered.id}`)).json()).data.unlocked).toBe(false);
    } finally {
      await recoveredContext.close();
    }
  });

  test("recovers another visitor from the history page without merging records or changing paid access", async ({ page, context, browser, baseURL }, testInfo) => {
    await page.goto("/zh");
    const current = await saveResult(page.request);
    const previousContext = await browser.newContext({ baseURL, extraHTTPHeaders: requestHeaders(testInfo) });

    try {
      await previousContext.request.get("/zh");
      const unpaid = await saveResult(previousContext.request, true);
      const recoveryOrder = await makeOrder(previousContext.request, unpaid);
      const paid = await saveResult(previousContext.request);
      await makeOrder(previousContext.request, paid, true);
      const previousCookie = (await previousContext.cookies()).find((cookie) => cookie.name === "mid")!;

      await page.goto("/zh/my/report");
      await expectRecord(page, current);
      await expect(page.getByRole("article", { name: /测试记录$/ })).toHaveCount(1);
      await expect(page.getByLabel("订单号", { exact: true })).toBeHidden();
      await page.getByRole("button", { name: "找回其他测试记录", exact: true }).click();
      await expect(page.getByText(/找回后将切换到订单所属用户，不合并两边的记录/)).toBeVisible();
      await page.getByLabel("订单号", { exact: true }).fill(recoveryOrder);
      await page.getByRole("button", { name: "找回测试记录", exact: true }).click();

      await expectRecord(page, unpaid);
      await expectRecord(page, paid, true);
      await expect(page.getByRole("article", { name: /测试记录$/ })).toHaveCount(2);
      await expect(page.locator(`a[href="/zh/result/${current.id}"]`)).toHaveCount(0);
      expect((await context.cookies()).filter((cookie) => cookie.name === "mid").map((cookie) => cookie.value)).toEqual([previousCookie.value]);
      expect((await (await page.request.get(`/api/results/${current.id}`)).json()).data.owner).toBe(false);

      await page.goto(`/zh/report/${unpaid.id}`);
      await expect(page).toHaveURL(new RegExp(`/zh/result/${unpaid.id}\\?unlock=1$`));
      expect((await (await page.request.get(`/api/results/${unpaid.id}`)).json()).data.unlocked).toBe(false);
    } finally {
      await previousContext.close();
    }
  });

  test("isolates visitors and keeps the current identity after invalid or cross-site recovery", async ({ page, context, browser, baseURL }, testInfo) => {
    await page.goto("/zh");
    const own = await saveResult(page.request);
    const originalCookie = (await context.cookies()).find((cookie) => cookie.name === "mid")!;
    const otherContext = await browser.newContext({ baseURL, extraHTTPHeaders: requestHeaders(testInfo) });

    try {
      await otherContext.request.get("/zh");
      const foreign = await saveResult(otherContext.request, true);
      const foreignOrder = await makeOrder(otherContext.request, foreign, true);

      await page.goto("/zh/my/report");
      await expectRecord(page, own);
      await expect(page.getByRole("article", { name: /测试记录$/ })).toHaveCount(1);
      await expect(page.locator(`a[href="/zh/report/${foreign.id}"]`)).toHaveCount(0);

      for (const [orderId, status] of [["not-an-order", 400], ["M190001010000000000000000", 404]] as const) {
        const response = await page.request.post("/api/reports/recover", {
          data: { orderId },
          headers: { Origin: new URL(baseURL!).origin },
        });
        expect(response.status()).toBe(status);
      }
      const crossSite = await page.request.post("/api/reports/recover", {
        data: { orderId: foreignOrder },
        headers: { Origin: "https://example.invalid" },
      });
      expect(crossSite.status()).toBe(403);
      expect((await context.cookies()).filter((cookie) => cookie.name === "mid").map((cookie) => cookie.value)).toEqual([originalCookie.value]);

      await page.reload();
      await expectRecord(page, own);
      await expect(page.getByRole("article", { name: /测试记录$/ })).toHaveCount(1);
      await page.goto(`/zh/report/${foreign.id}`);
      await expect(page).toHaveURL(new RegExp(`/zh/result/${foreign.id}$`));
      await expect(page.getByText("第一章", { exact: true })).toHaveCount(0);
    } finally {
      await otherContext.close();
    }
  });

  test("limits repeated recovery attempts without issuing a replacement identity", async ({ page, context, baseURL }) => {
    await page.goto("/zh");
    const originalCookie = (await context.cookies()).find((cookie) => cookie.name === "mid")!;
    for (let attempt = 0; attempt < 10; attempt++) {
      const response = await page.request.post("/api/reports/recover", {
        data: { orderId: "invalid-order" },
        headers: { Origin: new URL(baseURL!).origin },
      });
      expect(response.status()).toBe(400);
    }

    const limited = await page.request.post("/api/reports/recover", {
      data: { orderId: "invalid-order" },
      headers: { Origin: new URL(baseURL!).origin },
    });
    expect(limited.status()).toBe(429);
    expect(Number(limited.headers()["retry-after"])).toBeGreaterThan(0);
    expect((await context.cookies()).filter((cookie) => cookie.name === "mid").map((cookie) => cookie.value)).toEqual([originalCookie.value]);
  });
});
