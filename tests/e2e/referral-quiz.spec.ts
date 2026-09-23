import { randomUUID } from "node:crypto";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { pairingUiMessages } from "../../src/lib/i18n/messages/pairing-ui";
import { pairingMessages } from "../../src/lib/i18n/messages/pairing";
import { compareMessages } from "../../src/lib/i18n/messages/compare";
import { getQuestionnaire } from "../../src/lib/questionnaires";
import { answerQuestion } from "./quiz-helpers";

const origin = process.env.E2E_BASE_URL ?? "http://localhost:3000";
async function invitationForHost(request: APIRequestContext) {
  await request.get("/");
  const resultResponse = await request.post("/api/results", { data: { answers: getQuestionnaire("legacy32-v1")!.questions.map(q => q.reverse ? -2 : 2) } });
  expect(resultResponse.status()).toBe(201);
  const resultId = (await resultResponse.json()).data.id;
  const optionsResponse = await request.get(`/api/results/${resultId}/share-options`);
  expect(optionsResponse.status()).toBe(200);
  const options = (await optionsResponse.json()).data;
  const shareResponse = await request.post("/api/shares", { headers: { origin }, data: { resultId, selectedIds: options.defaultSelectedIds, showType: false, showDimensions: false, consentVersion: "share-public-v1", requestId: randomUUID() } });
  expect(shareResponse.status()).toBe(201);
  const share = (await shareResponse.json()).data;
  const order = (await (await request.post("/api/orders", { headers: { origin }, data: { resultId } })).json()).data;
  expect((await request.post(`/api/orders/${order.id}/mock-pay`, { headers: { origin } })).ok()).toBe(true);
  const inviteResponse = await request.post("/api/comparison-invitations", { headers: { origin }, data: { shareId: share.id, consentVersion: "compare-host-v3", requestId: randomUUID() } });
  expect(inviteResponse.status()).toBe(201);
  return (await inviteResponse.json()).data as { token: string; url: string };
}
async function complete32(page: Page, en: boolean, token: string) {
  const questionnaire = getQuestionnaire(en ? "en32-v1" : "legacy32-v1")!;
  await page.getByRole("button", { name: en ? "Start 32-item Quick" : "开始 32 题轻量版", exact: true }).click();
  for (const [index, question] of questionnaire.questions.entries()) {
    expect(new URL(page.url()).searchParams.get("compare")).toBe(token);
    // Wait for the actual question text, rather than racing the next render after a click.
    await expect(page.locator("#question-title")).toHaveText(question.text);
    await answerQuestion(page, question.reverse ? 4 : 0, index === questionnaire.questions.length - 1);
  }
}
for (const en of [false, true]) {
  test(`invitation → actual ${en ? "English cross-locale" : "Chinese"} quiz → own result → explicit consent survives unavailable storage and analytics`, async ({ page: hostPage, browser }, info) => {
    test.setTimeout(150_000);
    const invitation = await invitationForHost(hostPage.request);
    const guest = await browser.newContext({ baseURL: origin, viewport: info.project.use.viewport, isMobile: info.project.use.isMobile, hasTouch: info.project.use.hasTouch });
    try {
      await guest.addInitScript(() => {
        for (const key of ["localStorage", "sessionStorage"] as const) Object.defineProperty(window, key, { configurable: true, get() { throw new DOMException("Storage unavailable for test", "SecurityError"); } });
      });
      const page = await guest.newPage();
      let eventFailures = 0, joins = 0;
      await page.route("**/api/share-events", async route => { eventFailures++; await route.abort("failed"); });
      page.on("request", request => { if (new URL(request.url()).pathname === "/api/comparisons" && request.method() === "POST") joins++; });
      await page.goto(`/zh/t/${invitation.token}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.getByRole("link", { name: "免费开始测试", exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/quiz\\?compare=${invitation.token}$`));
      // Both languages may participate in a Chinese invitation. Keep the explicit flow context in the URL.
      if (en) await page.goto(`/quiz?compare=${invitation.token}`);
      await complete32(page, en, invitation.token);
      await page.waitForURL(new RegExp(`${en ? "" : "/zh"}/result/[A-Za-z0-9_-]{12}\\?compare=${invitation.token}$`));
      expect(new URL(page.url()).searchParams.get("compare")).toBe(invitation.token);
      await expect(page.getByText(en ? "YOUR PERSONALITY" : "你的人格倾向", { exact: true })).toBeVisible();
      expect(joins).toBe(0);
      expect(eventFailures).toBeGreaterThan(0);
      const ui = pairingUiMessages[en ? "en" : "zh"], p = pairingMessages[en ? "en" : "zh"], m = compareMessages[en ? "en" : "zh"];
      const resultId = new URL(page.url()).pathname.split("/").at(-1)!;
      const order = (await (await guest.request.post("/api/orders", { headers: { origin }, data: { resultId } })).json()).data;
      expect((await guest.request.post(`/api/orders/${order.id}/mock-pay`, { headers: { origin } })).ok()).toBe(true);
      const continueLink = page.getByRole("link", { name: ui.continue, exact: true });
      await expect(continueLink).toHaveAttribute("href", new RegExp(`^${en ? "" : "/zh"}/t/${invitation.token}/join\\?result=[A-Za-z0-9_-]{12}$`));
      await continueLink.click();
      await expect(page.locator('[data-compare-consent="guest"]')).toBeVisible();
      // Consent follows the selected result language; the frozen pair uses the host language.
      await expect(page.locator("html")).toHaveAttribute("lang", en ? "en" : "zh-CN");
      const consent = page.getByRole("checkbox", { name: m.agree });
      const joinButton = page.getByRole("button", { name: p.guestAgree, exact: true });
      await expect(consent).not.toBeChecked();
      await expect(joinButton).toBeDisabled();
      expect(joins).toBe(0);
      await consent.check();
      await joinButton.click();
      await page.waitForURL(/\/compare\/[0-9a-f-]{36}$/);
      expect(joins).toBe(1);
      await expect(page.getByRole("heading", { name: compareMessages.zh.cardsTitle, exact: true })).toBeVisible();
      await expect(page.locator("[data-compare-card]")).toHaveCount(4);
      for (const theme of Object.values(compareMessages.zh.themes)) await expect(page.getByRole("heading", { name: theme, exact: true })).toBeVisible();
      if (en) await expect(page.getByText("双方使用的问卷版本不同；这里只对照已同意的定性类别，不比较分数。", { exact: true })).toBeVisible();
      await hostPage.goto(new URL(page.url()).pathname);
      await expect(hostPage.getByRole("heading", { name: compareMessages.zh.cardsTitle, exact: true })).toBeVisible();
    } finally { await guest.close(); }
  });
}
