import { expect, test, type Page } from "@playwright/test";
import { questions } from "../../src/lib/questionnaires";

type TrackedEvent = { name: string; params: Record<string, unknown> };

/** gtag commands queued in `window.dataLayer`. Without a built-in measurement ID they never leave the page. */
async function commands(page: Page): Promise<unknown[][]> {
  return page.evaluate(() =>
    ((window as unknown as { dataLayer?: unknown[] }).dataLayer ?? []).flatMap((entry) =>
      entry && typeof entry === "object" && "length" in entry ? [Array.from(entry as ArrayLike<unknown>)] : [],
    ),
  );
}

async function events(page: Page, name: string): Promise<TrackedEvent[]> {
  return (await commands(page))
    .filter((command) => command[0] === "event" && command[1] === name)
    .map((command) => ({ name, params: (command[2] ?? {}) as Record<string, unknown> }));
}

async function expectEvent(page: Page, name: string, params: Record<string, unknown> = {}) {
  await expect
    .poll(async () => (await events(page, name)).some((event) => Object.entries(params).every(([key, value]) => event.params[key] === value)), { message: `${name} ${JSON.stringify(params)}` })
    .toBe(true);
}

test.describe("analytics", () => {
  test("home sends a redacted page view and counts the start CTA", async ({ page }) => {
    await page.goto("/zh?utm_source=e2e&unlock=1");
    const origin = new URL(page.url()).origin;
    await expectEvent(page, "page_view", { page_type: "home", site_language: "zh", page_location: `${origin}/zh?utm_source=e2e` });

    await page.getByRole("link", { name: /开始人格测试/ }).filter({ visible: true }).first().click();
    await page.waitForURL(/\/quiz$/);
    await expectEvent(page, "cta_click", { cta_id: "start_quiz", page_type: "home" });
    await expectEvent(page, "page_view", { page_type: "quiz", page_referrer: `${origin}/zh?utm_source=e2e` });
  });

  test("opening the header menu is counted with its location", async ({ page }, testInfo) => {
    await page.goto("/zh");
    const trigger = page.getByRole("navigation", { name: "主导航" }).filter({ visible: true }).locator(".more-menu > button");
    const location = testInfo.project.name === "mobile" ? "header_mobile" : "header_nav";
    // Clicks before hydration do nothing; retry until the island reports the open.
    await expect(async () => {
      if ((await trigger.getAttribute("aria-expanded")) === "true") await trigger.click();
      await trigger.click();
      expect((await events(page, "more_menu_open")).some((event) => event.params.cta_location === location)).toBe(true);
    }).toPass();
  });

  test("the paid funnel is measured end to end without result IDs or order numbers", async ({ page }) => {
    await page.goto("/zh/quiz");
    const origin = new URL(page.url()).origin;
    await page.getByRole("button", { name: "开始 32 题轻量版" }).click();
    await expectEvent(page, "quiz_start", { questionnaire_id: "legacy32-v1", question_count: 32, resumed: "false" });

    for (const question of questions) {
      await expect(page.getByRole("group")).toBeVisible();
      await page.getByRole("group").getByRole("button").nth(question.reverse ? 4 : 0).click();
      await page.getByRole("button", { name: /下一题|查看我的结果|查看结果/ }).first().click();
    }
    await page.waitForURL(/\/result\/[A-Za-z0-9_-]{12}$/);
    const resultId = new URL(page.url()).pathname.split("/").pop()!;

    for (const percent of [25, 50, 75, 100]) await expectEvent(page, "quiz_progress", { questionnaire_id: "legacy32-v1", progress_percent: percent });
    expect(await events(page, "quiz_progress")).toHaveLength(4);
    await expectEvent(page, "quiz_submit", { questionnaire_id: "legacy32-v1" });
    await expectEvent(page, "quiz_complete", { questionnaire_id: "legacy32-v1", question_count: 32 });
    await expectEvent(page, "page_view", { page_type: "result", page_location: `${origin}/zh/result/[id]` });
    await expectEvent(page, "result_view", { is_sample: "false", result_owner: "true", result_clear: "true", result_unlocked: "false" });
    await expectEvent(page, "view_item", { currency: "CNY", value: 6.9 });

    await page.getByRole("button", { name: /解锁报告与/ }).first().click();
    await expectEvent(page, "cta_click", { cta_id: "unlock_report" });
    await expectEvent(page, "begin_checkout", { payment_mode: "mock", currency: "CNY", value: 6.9 });

    await page.getByRole("button", { name: /模拟支付 ¥6\.9/ }).click();
    await expect(page.getByText("演示解锁成功，本次未产生扣款。")).toBeVisible({ timeout: 15_000 });
    const orderId = (await page.locator("code").filter({ hasText: /^M\d{8}/ }).first().textContent())!.trim();
    await expectEvent(page, "add_payment_info", { payment_mode: "mock", payment_type: "mock" });
    await expectEvent(page, "purchase", { payment_mode: "mock", payment_type: "mock", currency: "CNY", value: 6.9 });
    const [purchase] = await events(page, "purchase");
    expect(purchase.params.transaction_id).toMatch(/^[0-9a-f]{16}$/);
    // Opening the sheet only changed `?unlock=1`: still one result page view.
    expect((await events(page, "page_view")).filter((event) => event.params.page_type === "result")).toHaveLength(1);

    await page.getByRole("link", { name: "阅读我的报告", exact: true }).click();
    await page.waitForURL(/\/report\//);
    await expectEvent(page, "cta_click", { cta_id: "read_report", cta_location: "payment_success" });
    await expectEvent(page, "report_view", { is_sample: "false", questionnaire_id: "legacy32-v1" });
    await expectEvent(page, "page_view", { page_type: "report", page_location: `${origin}/zh/report/[id]` });

    await page.getByRole("button", { name: /下一章/ }).click();
    await expectEvent(page, "report_chapter_view", { chapter_number: 2, nav_method: "next", page_type: "report" });
    await page.getByRole("tab", { name: "容易忽略的" }).click();
    await expectEvent(page, "report_tab_switch", { tab: "blindspots" });
    expect((await events(page, "page_view")).filter((event) => event.params.page_type === "report")).toHaveLength(1);

    const queued = JSON.stringify(await commands(page));
    expect(queued).not.toContain(resultId);
    expect(queued).not.toContain(orderId);
  });

  test("the sample report records chapter reading and its closing CTA", async ({ page }) => {
    await page.goto("/zh/report/sample");
    await expectEvent(page, "report_view", { is_sample: "true", page_type: "report_sample" });
    for (const chapter of [2, 3, 4]) {
      await page.getByRole("button", { name: /下一章/ }).click();
      await expectEvent(page, "report_chapter_view", { chapter_number: chapter, nav_method: "next" });
    }
    await page.locator('[data-track-location="report_closing"]').click();
    await page.waitForURL(/\/quiz$/);
    await expectEvent(page, "cta_click", { cta_id: "start_quiz", cta_location: "report_closing", page_type: "report_sample" });
  });
});
