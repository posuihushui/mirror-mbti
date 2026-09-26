import { mkdir, writeFile } from "node:fs/promises";
import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import { getQuestionnaire } from "../../src/lib/questionnaires";
import { compareMessages } from "../../src/lib/i18n/messages/compare";
import { pairingMessages } from "../../src/lib/i18n/messages/pairing";
import { pairingUiMessages } from "../../src/lib/i18n/messages/pairing-ui";
import { paymentMessages } from "../../src/lib/i18n/messages/payment";

const origin = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const evidence = "docs/design-evidence/relationship-2026-09-25";
const purchaseWords = /付费|解锁|订阅|续费|\bpaid\b|\bunlock|\bsubscription\b|[¥$]\s?\d/i;

async function seed(request: APIRequestContext, en: boolean) {
  await request.get(en ? "/" : "/zh");
  const q = getQuestionnaire(en ? "en32-v1" : "legacy32-v1")!;
  const response = await request.post("/api/results", { data: { questionnaireId: q.id, answers: q.questions.map((x) => ({ questionId: x.id, value: x.reverse ? -2 : 2 })) } });
  expect(response.status()).toBe(201);
  return (await response.json()).data.id as string;
}
async function payReport(request: APIRequestContext, id: string) {
  const order = await request.post("/api/orders", { headers: { origin }, data: { resultId: id } });
  expect(order.ok()).toBe(true);
  expect((await request.post(`/api/orders/${(await order.json()).data.id}/mock-pay`, { headers: { origin } })).ok()).toBe(true);
}
async function settle(page: Page) {
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length)).toBe(0);
}
async function shot(page: Page, name: string) {
  await mkdir(evidence, { recursive: true });
  await settle(page);
  const inDialog = await page.getByRole("dialog").isVisible();
  await page.screenshot({ path: `${evidence}/${name}.png`, fullPage: !inDialog });
}

for (const en of [false, true]) test(`relationship invitation, 请 TA and a covered participant ${en ? "en" : "zh"}`, async ({ page, browser }, info) => {
  test.setTimeout(150000);
  const locale = en ? "en" : "zh", prefix = en ? "" : "/zh", device = info.project.name;
  const m = compareMessages[locale], p = pairingMessages[locale], ui = pairingUiMessages[locale], g = ui.gift, pay = paymentMessages[locale];
  const partner = m.relationshipLabels.partner;

  // Host: a paid result, then an invitation for a partner, created through the sheet.
  const host = await seed(page.request, en);
  await payReport(page.request, host);
  await page.goto(`${prefix}/my/pairing`);
  await page.getByRole("button", { name: ui.invite, exact: true }).first().click();
  const sheet = page.getByRole("dialog");
  await sheet.getByRole("radiogroup", { name: m.relationshipPick }).getByText(partner, { exact: true }).click();
  await shot(page, `host-sheet-${locale}-${device}`);
  const consent = sheet.locator('[data-compare-consent="host"]');
  await expect(consent).toContainText(m.hostConsentDetail);
  await consent.getByRole("checkbox").check();
  const created = page.waitForResponse((r) => r.url().endsWith("/api/comparison-invitations") && r.request().method() === "POST");
  await consent.getByRole("button", { name: p.hostAgree, exact: true }).click();
  const invitation = (await (await created).json()).data;
  expect(invitation.relationship).toBe("partner");
  await expect(sheet.getByText(m.created, { exact: true })).toBeVisible();
  // The copied message is written for the relationship.
  await expect(sheet.getByRole("textbox")).toHaveValue(p.invitationTexts.partner(invitation.url));
  // Inside the invitation sheet, 请 TA leads to the pairing center rather than stacking a second sheet.
  const cover = sheet.getByRole("link", { name: new RegExp(`^${g.cta}`) });
  await expect(cover).toContainText(`${pay.currency}6.9`);
  await cover.click();
  await page.waitForURL(new RegExp(`/my/pairing\\?gift=${invitation.id}$`));
  const giftSheet = page.getByRole("dialog");
  await expect(giftSheet).toContainText(g.product);
  for (const bullet of g.bullets) await expect(giftSheet).toContainText(bullet);
  await expect(giftSheet).toContainText(g.terms);
  await shot(page, `gift-sheet-${locale}-${device}`);
  const orderResponse = page.waitForResponse((r) => r.url().endsWith("/api/orders") && r.request().method() === "POST");
  await giftSheet.getByRole("button", { name: pay.sheet.mockPay("6.9") }).click();
  const order = (await (await orderResponse).json()).data;
  expect(order).toMatchObject({ kind: "pair-gift", invitationId: invitation.id, resultId: host });
  await expect(giftSheet.locator("[data-gift-ready]")).toBeVisible();
  await expect(giftSheet).not.toContainText(/演示|Demo/);
  await giftSheet.getByRole("button", { name: g.backToCenter }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator('[data-comparison-manager] [data-gift="covered"]')).toBeVisible();
  expect(new URL(page.url()).search).toBe("");
  // Buying a cover never touches the host's own report or its history entry.
  const history = await page.request.get(`${prefix}/my/report`);
  expect(await history.text()).not.toContain(order.id);
  const status = await page.request.get(`${prefix}/pay/${order.id}`);
  expect(status.status()).toBe(200);
  await page.goto(`${prefix}/pay/${order.id}`);
  await expect(page.getByRole("heading", { level: 1, name: g.statusPaid })).toBeVisible();
  await expect(page.getByRole("link", { name: g.backToCenter })).toBeVisible();

  // Participant, before testing: told the report is taken care of, with no price and no purchase words.
  const guest = await browser.newContext({ baseURL: origin, viewport: page.viewportSize()! });
  const gp = await guest.newPage();
  await gp.goto(new URL(invitation.url).pathname);
  await expect(gp.locator('[data-gift="banner"]')).toHaveText(g.banner);
  await expect(gp.getByText(m.relationshipBetween.partner, { exact: true })).toBeVisible();
  expect(await gp.locator("body").innerText()).not.toMatch(purchaseWords);
  for (const selector of ['meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:description"]']) {
    expect(await gp.locator(selector).getAttribute("content")).not.toContain(partner);
  }
  await shot(gp, `invitation-covered-${locale}-${device}`);

  // After testing: the result offers joining instead of a price, in the dock and the panel.
  const own = await seed(guest.request, en);
  await gp.goto(`${prefix}/result/${own}?compare=${invitation.token}`);
  const accept = gp.getByRole("link", { name: g.accept, exact: true }).filter({ visible: true });
  await expect(accept.first()).toBeVisible();
  await expect(gp.locator('[data-gift="covered-panel"]')).toBeVisible();
  await expect(gp.getByRole("button", { name: /解锁报告与|Unlock report/ }).filter({ visible: true })).toHaveCount(0);
  await expect(gp.getByRole("link", { name: new RegExp(`^${g.buyOwn}`) })).toBeVisible();
  await shot(gp, `result-covered-${locale}-${device}`);
  // The first screen: on phones the dock names the cover and carries no price.
  await gp.evaluate(() => window.scrollTo(0, 0));
  if (device === "mobile") {
    const dock = gp.locator(".fixed.inset-x-0.bottom-0").filter({ hasText: g.dockLabel });
    await expect(dock).toBeVisible();
    await expect(dock).not.toContainText(pay.currency);
  } else {
    await expect(gp.getByText(g.resultHeading, { exact: true }).first()).toBeVisible();
  }
  await settle(gp);
  await gp.screenshot({ path: `${evidence}/result-covered-first-screen-${locale}-${device}.png` });
  await accept.first().click();
  await gp.waitForURL(new RegExp(`/t/${invitation.token}/join\\?result=${own}`));
  const guestConsent = gp.locator('[data-compare-consent="guest"]');
  await expect(guestConsent.locator('[data-gift="consent"]')).toHaveText(g.consent);
  await expect(guestConsent.getByRole("button", { name: p.guestAgree })).toBeDisabled();
  await shot(gp, `join-covered-${locale}-${device}`);
  await guestConsent.getByRole("checkbox").check();
  await guestConsent.getByRole("button", { name: p.guestAgree }).click();
  await gp.waitForURL(/\/compare\/[a-f0-9-]+$/);
  const pairPath = new URL(gp.url()).pathname;
  await expect(gp.getByRole("heading", { level: 1, name: m.titleFor(partner), exact: true })).toBeVisible();
  await expect(gp.locator('[data-compare-topic="partner"]')).toContainText(m.byRelationship.partner.topic.title);
  await expect(gp.locator("[data-compare-card]")).toHaveCount(4);
  await gp.locator('[data-compare-topic="partner"]').scrollIntoViewIfNeeded();
  await shot(gp, `guide-partner-${locale}-${device}`);
  const image = await gp.request.get(`${pairPath}/image`);
  expect(image.status()).toBe(200);
  await mkdir(evidence, { recursive: true });
  await writeFile(`${evidence}/guide-image-${locale}-${device}.png`, await image.body());

  // Joining opened the participant's own report, and the cover is spent.
  await gp.goto(`${prefix}/result/${own}`);
  await expect(gp.getByRole("link", { name: /阅读已购报告|Read my purchased report|Read your full report/ }).first()).toBeVisible();
  const report = await gp.request.get(`${prefix}/report/${own}`);
  expect(report.status()).toBe(200);
  await page.goto(`${prefix}/my/pairing`);
  await expect(page.locator(`[data-comparison-manager] a[href$="${pairPath}"]`)).toContainText(m.titleFor(partner));
  await expect(page.locator('[data-comparison-manager] [data-gift="covered"]')).toHaveCount(0);
  await expect(page.locator('[data-comparison-manager] [data-gift="offer"]')).toBeVisible();
  await shot(page, `center-after-${locale}-${device}`);

  // A second participant is not covered any more: the invitation page asks nothing of them before the test.
  const third = await browser.newContext({ baseURL: origin });
  const tp = await third.newPage();
  await tp.goto(new URL(invitation.url).pathname);
  await expect(tp.locator('[data-gift="banner"]')).toHaveCount(0);
  await third.close();
  await guest.close();
});

test("/pairing shows one difference in four relationships without a reading or a price", async ({ page }, info) => {
  for (const en of [false, true]) {
    const locale = en ? "en" : "zh", m = compareMessages[locale], p = pairingMessages[locale];
    await page.goto(`${en ? "" : "/zh"}/pairing`);
    const section = page.locator("[data-relationships]");
    await expect(section.getByRole("heading", { name: p.relationshipsTitle })).toBeVisible();
    await expect(section.locator("[data-relationship]")).toHaveCount(4);
    for (const relationship of ["partner", "friend", "family", "colleague"] as const) {
      await expect(section.locator(`[data-relationship="${relationship}"]`)).toContainText(m.byRelationship[relationship].scenes.JP.opposite);
      await expect(section).not.toContainText(m.byRelationship[relationship].topic.generic);
    }
    await expect(page.locator('[data-pairing-example="partner"] [data-compare-topic="partner"]')).toContainText(m.byRelationship.partner.topic.title);
    expect(await page.locator("body").innerText()).not.toMatch(purchaseWords);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await section.scrollIntoViewIfNeeded();
    await shot(page, `pairing-relationships-${locale}-${info.project.name}`);
  }
});
