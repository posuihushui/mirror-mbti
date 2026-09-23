import { expect, test, type Page } from "@playwright/test";
import { getQuestionnaire, STANDARD_QUESTIONNAIRE_ID } from "../../src/lib/questionnaires";

async function answerAndNext(page: Page, option = 0) {
  await page.getByRole("group").getByRole("button").nth(option).click();
  await page.getByRole("button", { name: /下一题|查看我的结果|查看结果/ }).first().click();
}

test.describe("review improvements", () => {
  test("keeps separate drafts, checks answers and restarts only the chosen version", async ({ page }, testInfo) => {
    await page.goto("/zh/quiz");
    await expect(page.getByRole("heading", { name: "32 题 · 轻量版" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "64 题 · 标准版" })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("quiz-versions.png"), fullPage: true, animations: "disabled" });
    await page.getByRole("button", { name: "开始 64 题标准版" }).click();
    await answerAndNext(page);
    await answerAndNext(page, 1);
    await page.getByRole("button", { name: "切换版本" }).click();
    await expect(page.getByText("已保存 2/64 题，可接着上次的位置继续。")).toBeVisible();
    await page.getByRole("button", { name: "开始 32 题轻量版" }).click();
    await answerAndNext(page, 2);
    await page.getByRole("button", { name: "切换版本" }).click();
    await page.getByRole("button", { name: "继续 64 题标准版" }).click();
    await page.reload();
    await expect(page.locator("#question-title")).toHaveText(getQuestionnaire(STANDARD_QUESTIONNAIRE_ID)!.questions[2].text);
    await page.getByRole("button", { name: "检查已答题 · 2/64" }).click();
    await page.getByRole("button", { name: "第 1 题，已作答", exact: true }).click();
    await expect(page.getByRole("group").getByRole("button").first()).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "重新开始", exact: true }).click();
    await page.getByRole("button", { name: "保留当前进度" }).click();
    await expect(page.getByText("已答 2/64 题")).toBeVisible();
    await page.getByRole("button", { name: "重新开始", exact: true }).click();
    await page.getByRole("button", { name: "确认重新开始" }).click();
    await expect(page.getByText("已答 0/64 题")).toBeVisible();
    await page.getByRole("button", { name: "切换版本" }).click();
    await page.getByRole("button", { name: "继续 32 题轻量版" }).click();
    await expect(page.getByText("已答 1/32 题")).toBeVisible();
  });

  test("migrates an existing 32-question browser draft without changing its answers", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("mirror.quiz.v1", JSON.stringify({ answers: [1, ...Array(31).fill(null)], index: 1, updatedAt: Date.now() })));
    await page.goto("/zh/quiz");
    await expect(page.getByText("轻量版 · 32 题")).toBeVisible();
    await expect(page.getByText("已答 1/32 题")).toBeVisible();
    await page.getByRole("button", { name: "上一题" }).first().click();
    await expect(page.getByRole("group").getByRole("button").nth(1)).toHaveAttribute("aria-pressed", "true");
  });

  test("can finish the quiz when browser storage is blocked", async ({ page }) => {
    await page.addInitScript(() => {
      Storage.prototype.getItem = () => { throw new DOMException("blocked", "SecurityError"); };
      Storage.prototype.setItem = () => { throw new DOMException("blocked", "SecurityError"); };
    });
    await page.goto("/zh/quiz");
    await page.getByRole("button", { name: "开始 32 题轻量版" }).click();
    await expect(page.getByText("当前进度仅保存在本页")).toBeVisible();
    for (let i = 0; i < 32; i++) await answerAndNext(page, 2);
    await page.waitForURL(/\/result\/[A-Za-z0-9_-]{12}$/);
    await expect(page.getByText("调停者", { exact: true })).toBeVisible();
    await page.goto("/zh/my/report");
    await expect(page.getByRole("article", { name: "INFP 测试记录" })).toHaveCount(1);
  });

  test("completes all 64 questions, persists the version and serves the paid chapters as HTML", async ({ page }, testInfo) => {
    await page.goto("/zh/quiz");
    await page.getByRole("button", { name: "开始 64 题标准版" }).click();
    const questionnaire = getQuestionnaire(STANDARD_QUESTIONNAIRE_ID)!;
    for (const question of questionnaire.questions) {
      await expect(page.getByRole("heading", { level: 2 })).toHaveText(question.text);
      await answerAndNext(page, question.reverse ? 4 : 0);
    }
    await page.waitForURL(/\/result\/[A-Za-z0-9_-]{12}$/);
    const resultId = new URL(page.url()).pathname.split("/").at(-1)!;
    const response = await page.request.get(`/api/results/${resultId}`);
    expect((await response.json()).data).toMatchObject({ questionnaireId: STANDARD_QUESTIONNAIRE_ID, questionCount: 64, type: "ESTJ", clarity: ["marked", "marked", "marked", "marked"] });
    await expect(page.getByText("标准版 · 64 题", { exact: true })).toBeVisible();
    const saved = await page.request.get(`/api/results/${resultId}/answers`);
    expect((await saved.json()).data.responses).toEqual(questionnaire.questions.map((q) => ({ questionId: q.id, value: q.reverse ? -2 : 2 })));
    const order = await page.request.post("/api/orders", { data: { resultId } });
    expect(order.status()).toBe(201);
    const orderId = (await order.json()).data.id;
    expect((await page.request.post(`/api/orders/${orderId}/mock-pay`)).status()).toBe(200);
    const report = await page.request.get(`/zh/report/${resultId}`);
    expect(report.status()).toBe(200);
    const html = (await report.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
    for (const text of ["第一章", "第二章", "第三章", "第四章", "第 1 天", "第 7 天", "这次偏向较明显"]) expect(html.includes(text), text).toBe(true);
    await page.goto(`/zh/report/${resultId}?chapter=4`);
    await expect(page.getByRole("heading", { name: "第 7 天 · 保留一个小调整" })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("paid-action-plan.png"), fullPage: true, animations: "disabled" });
    await page.goto("/zh/my/report");
    await expect(page.getByRole("link", { name: "阅读详细报告", exact: true })).toHaveAttribute("href", `/zh/report/${resultId}`);
    await expect(page.getByText(/标准版 · 64 题/)).toBeVisible();
  });

  test("a fully balanced result still names a type, still sells, and invites a review of straight-lined answers", async ({ page, browser, baseURL }, testInfo) => {
    await page.goto("/zh");
    const created = await page.request.post("/api/results", { data: { answers: Array(32).fill(0) } });
    const result = (await created.json()).data;
    expect(result).toMatchObject({ type: "INFP", clarity: ["even", "even", "even", "even"] });
    await page.goto(`/zh/result/${result.id}?unlock=1`);
    const sheet = page.getByRole("dialog", { name: "更完整地，认识自己。" });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("button", { name: "关闭" }).click();
    await expect(sheet).toHaveCount(0);
    await expect(page.getByText("调停者", { exact: true })).toBeVisible();
    await expect(page.getByText("四个维度都接近均衡", { exact: false })).toBeVisible();
    await expect(page.getByText(/这次作答里有很长一段选了同一个选项/)).toBeVisible();
    await expect(page.getByRole("button", { name: /解锁报告与/ }).first()).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("balanced-result.png"), fullPage: true, animations: "disabled" });
    const og = await page.request.get(`/zh/result/${result.id}/opengraph-image`);
    expect(og.status()).toBe(200);
    await testInfo.attach("balanced-og", { body: await og.body(), contentType: "image/png" });
    const order = await page.request.post("/api/orders", { data: { resultId: result.id } });
    expect(order.status()).toBe(201);
    const publicResult = await page.request.get(`/api/results/${result.id}`);
    expect((await publicResult.json()).data).toMatchObject({ type: "INFP", unlocked: false });
    const stranger = await browser.newContext({ baseURL });
    try {
      await stranger.request.get("/");
      expect((await stranger.request.get(`/api/results/${result.id}/answers`)).status()).toBe(404);
    } finally { await stranger.close(); }
    await page.getByRole("button", { name: "检查答案并重新作答" }).click();
    await expect(page).toHaveURL(/\/quiz$/);
    await expect(page.getByText("已答 32/32 题")).toBeVisible();
    await expect(page.getByRole("group").getByRole("button").nth(2)).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "检查已答题 · 32/32" }).click();
    await page.getByRole("button", { name: "第 32 题，已作答", exact: true }).click();
    await page.getByRole("button", { name: /查看我的结果|查看结果/ }).first().click();
    await page.waitForURL(/\/result\/[A-Za-z0-9_-]{12}$/);
    expect(page.url()).not.toContain(result.id);
    await page.goto("/zh/my/report");
    await expect(page.getByRole("article", { name: "INFP 测试记录" })).toHaveCount(2);
  });

  test("public pages explain MBTI, score limits and a working support contact", async ({ page, request }, testInfo) => {
    await page.goto("/zh");
    await expect(page).toHaveTitle(/MBTI/);
    await expect(page.getByText(/MBTI 测试体验/).first()).toBeVisible();
    for (const path of ["/zh/help", "/zh/privacy", "/zh/terms"]) {
      await page.goto(path);
      await expect(page.getByRole("link", { name: "lakehu0x@gmail.com", exact: true })).toHaveAttribute("href", "mailto:lakehu0x@gmail.com");
    }
    const quizHtml = await (await request.get("/zh/quiz")).text();
    for (const copy of ["轻量版", "标准版", "64", "心理测量学验证"]) expect(quizHtml).toContain(copy);
    await page.goto("/zh/help");
    await page.screenshot({ path: testInfo.outputPath("help.png"), fullPage: true, animations: "disabled" });
  });
});
