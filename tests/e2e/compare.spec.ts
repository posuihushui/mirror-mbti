import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import { getQuestionnaire } from "../../src/lib/questionnaires";
import { compareMessages } from "../../src/lib/i18n/messages/compare";
import { pairingMessages } from "../../src/lib/i18n/messages/pairing";
import { pairingUiMessages } from "../../src/lib/i18n/messages/pairing-ui";
import { shareMessages } from "../../src/lib/i18n/messages/share";

const origin = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const evidence = "docs/verification/paid-pairing";
async function result(request: APIRequestContext, en: boolean, balanced = false) {
  await request.get(en ? "/en" : "/");
  const q = getQuestionnaire(en ? "en32-v1" : "standard64-v1")!;
  const response = await request.post("/api/results", { data: { questionnaireId: q.id, answers: q.questions.map(question => ({ questionId: question.id, value: balanced ? 0 : question.reverse ? -2 : 2 })) } });
  expect(response.status()).toBe(201);
  const own = (await response.json()).data;
  const order = await request.post("/api/orders", { data: { resultId: own.id }, headers: { origin } });
  expect(order.ok()).toBe(true);
  const paid = await request.post(`/api/orders/${(await order.json()).data.id}/mock-pay`, { headers: { origin } });
  expect(paid.ok()).toBe(true);
  return own;
}
async function share(request: APIRequestContext, en: boolean) {
  const own = await result(request, en);
  const response = await request.get(`/api/results/${own.id}/share-options`);
  const options = (await response.json()).data;
  const create = await request.post("/api/shares", { headers: { origin }, data: { resultId: own.id, selectedIds: options.defaultSelectedIds, showType: false, showDimensions: false, consentVersion: "share-public-v1", requestId: randomUUID() } });
  expect(create.status()).toBe(201);
  return { result: own, share: (await create.json()).data };
}
async function recordMotion(page: Page) {
  await page.addInitScript(() => {
    const counts = new WeakMap<Element, number>();
    (window as Window & { compareStarts?: WeakMap<Element, number> }).compareStarts = counts;
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args: Parameters<Element["animate"]>) {
      if (this.matches("[data-compare-motion]")) counts.set(this, (counts.get(this) ?? 0) + 1);
      return animate.apply(this, args);
    };
  });
}

for (const en of [false, true]) test(`comparison explicit consent, cross-locale privacy and withdrawal ${en ? "en" : "zh"}`, async ({ page, browser }, info) => {
  test.setTimeout(120000);
  const locale = en ? "en" : "zh"; const p = pairingMessages[locale]; const ui = pairingUiMessages[locale]; const m = compareMessages[locale]; const s = shareMessages[locale];
  const prefix = en ? "/en" : "";
  const viewport = info.project.name === "mobile" ? { width: 393, height: 852 } : { width: 1363, height: 936 };
  const host = await share(page.request, en);
  await page.goto(`${prefix}/my/pairing`);
  await page.getByRole("button", { name: ui.invite, exact: true }).first().click();
  const consent = page.locator('[data-compare-consent="host"]');
  await expect(consent).toBeVisible();
  await expect(consent.getByRole("button", { name: p.hostAgree, exact: true })).toBeDisabled();
  await expect(consent.getByRole("checkbox")).not.toBeChecked();
  await expect(consent).toContainText(m.hostConsentDetail);
  await mkdir(evidence, { recursive: true });
  await page.screenshot({ path: `${evidence}/host-consent-${locale}-${info.project.name}.png`, fullPage: true, animations: "disabled" });
  await consent.getByRole("checkbox").check();
  const inviteResponse = page.waitForResponse(response => response.url().endsWith("/api/comparison-invitations") && response.request().method() === "POST");
  await consent.getByRole("button", { name: p.hostAgree, exact: true }).click();
  const invite = (await (await inviteResponse).json()).data;
  expect(invite.url).toMatch(/\/t\/[A-Za-z0-9_-]{32}$/);
  await expect(page.getByText(m.created, { exact: true })).toBeVisible();
  const shareAgain = await page.request.get(new URL(host.share.url).pathname);
  expect(await shareAgain.text()).not.toContain('"dimensions":');
  expect(await shareAgain.text()).not.toContain('"typeLabel":');

  const guest = await browser.newContext({ baseURL: origin, viewport });
  const guestResult = await result(guest.request, !en, false);
  const guestPage = await guest.newPage();
  await recordMotion(guestPage);
  await guestPage.goto(new URL(invite.url).pathname);
  await expect(guestPage.locator("[data-share-card]")).toContainText(ui.hostScope);
  expect(await guestPage.content()).not.toContain(host.result.id);
  await guestPage.screenshot({ path: `${evidence}/invitation-${locale}-${info.project.name}.png`, fullPage: true, animations: "disabled" });
  await guestPage.getByRole("link", { name: m.chooseExisting, exact: true }).click();
  await guestPage.getByRole("button", { name: ui.choose }).click();
  await guestPage.waitForURL(/\/result\//);
  await guestPage.goto(`${prefix}/t/${invite.token}/join?result=${guestResult.id}`);
  const guestConsent = guestPage.locator('[data-compare-consent="guest"]');
  await expect(guestConsent.getByRole("button", { name: p.guestAgree })).toBeDisabled();
  await expect(guestConsent).toContainText(m.guestConsent);
  await guestPage.screenshot({ path: `${evidence}/guest-consent-${locale}-${info.project.name}.png`, fullPage: true, animations: "disabled" });
  await guestConsent.getByRole("checkbox").check();
  await guestConsent.getByRole("button", { name: p.guestAgree }).click();
  await guestPage.waitForURL(/\/compare\/[a-f0-9-]+$/);
  const pairPath = new URL(guestPage.url()).pathname;
  const pairId = pairPath.split("/").at(-1)!;
  await expect(guestPage.getByRole("heading", { name: m.title, exact: true })).toBeVisible();
  await expect(guestPage.locator('[data-compare-motion="section"]')).toHaveCount(3);
  await expect(guestPage.getByText(m.differentQuestionnaires, { exact: true })).toBeVisible();
  await expect.poll(() => guestPage.locator('[data-compare-motion="host"]').evaluate(node => (window as Window & { compareStarts?: WeakMap<Element, number> }).compareStarts?.get(node) ?? 0)).toBe(1);
  await guestPage.locator('[data-compare-motion="section"]').last().scrollIntoViewIfNeeded();
  await guestPage.locator('[data-compare-motion="host"]').scrollIntoViewIfNeeded();
  expect(await guestPage.locator('[data-compare-motion="host"]').evaluate(node => (window as Window & { compareStarts?: WeakMap<Element, number> }).compareStarts?.get(node) ?? 0)).toBe(1);
  await expect.poll(() => guestPage.locator("main").evaluate(node => node.getAnimations({ subtree: true }).filter(animation => animation.playState === "running").length)).toBe(0);
  await guestPage.screenshot({ path: `${evidence}/pair-${locale}-${info.project.name}.png`, fullPage: true, animations: "disabled" });
  expect(await guestPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  const third = await browser.newContext({ baseURL: origin, viewport });
  const thirdPage = await third.newPage();
  await thirdPage.goto(pairPath);
  await expect(thirdPage.getByRole("heading", { name: m.unavailable })).toBeVisible();
  await expect(thirdPage.locator("[data-compare-motion]")).toHaveCount(0);
  expect((await third.request.delete(`/api/comparisons/${pairId}`, { headers: { origin } })).status()).not.toBe(200);
  const noJs = await browser.newContext({ baseURL: origin, javaScriptEnabled: false, storageState: await guest.storageState() });
  const plain = await noJs.newPage(); await plain.goto(pairPath);
  await expect(plain.locator('[data-compare-motion="section"]')).toHaveCount(3);
  for (const title of m.titles) await expect(plain.getByRole("heading", { name: title })).toBeVisible();
  await noJs.close();
  await guestPage.emulateMedia({ reducedMotion: "reduce" });
  await guestPage.reload();
  for (const element of await guestPage.locator("[data-compare-motion]").all()) {
    await expect(element).toHaveCSS("opacity", "1"); await expect(element).toHaveCSS("transform", "none");
    expect(await element.evaluate(node => node.getAnimations().length)).toBe(0);
  }
  await guestPage.emulateMedia({ media: "print" });
  await expect(guestPage.locator('[data-compare-motion="section"]')).toHaveCount(3);
  await guestPage.emulateMedia({ media: "screen" });

  await page.goto(`${prefix}/my/pairing`);
  await expect(page.locator(`[data-comparison-manager] a[href$="/compare/${pairId}"]`)).toBeVisible();
  await page.goto(pairPath);
  await expect(page.locator('[data-compare-motion="section"]')).toHaveCount(3);
  await guestPage.getByRole("button", { name: m.revoke, exact: true }).click();
  const modal = guestPage.getByRole("dialog");
  await expect(modal).toContainText(m.revokeConfirm);
  await modal.getByRole("button", { name: m.revoke, exact: true }).click();
  await expect(guestPage.locator("[data-compare-motion]")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: m.unavailable })).toBeVisible();
  await guestPage.goto(`${!en ? "/en" : ""}/result/${guestResult.id}`);
  await expect(guestPage.locator("[data-share-entry]")).toBeVisible();
  await third.close(); await guest.close();
  void s;
});
