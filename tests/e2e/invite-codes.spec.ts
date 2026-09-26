import { randomUUID } from "node:crypto";
import { test, expect, type APIRequestContext } from "@playwright/test";
import { getQuestionnaire } from "../../src/lib/questionnaires";
import { paymentMessages } from "../../src/lib/i18n/messages/payment";
import { pairingUiMessages } from "../../src/lib/i18n/messages/pairing-ui";

const origin = process.env.E2E_BASE_URL ?? "http://localhost:3000";
// Nothing before the test may name a price or say that anything is sold.
const purchaseWords = /付费|解锁|订阅|续费|邀请价|\bpaid\b|\bunlock|\bsubscription\b|invite price|[¥$]\s?\d/i;

async function seed(request: APIRequestContext, en = false) {
  await request.get(en ? "/" : "/zh");
  const q = getQuestionnaire(en ? "en32-v1" : "legacy32-v1")!;
  const res = await request.post("/api/results", { data: { questionnaireId: q.id, answers: q.questions.map((x) => ({ questionId: x.id, value: x.reverse ? -2 : 2 })) } });
  expect(res.status()).toBe(201);
  return (await res.json()).data.id as string;
}
async function order(request: APIRequestContext, data: Record<string, unknown>) {
  const res = await request.post("/api/orders", { headers: { origin }, data });
  expect(res.status()).toBe(201);
  return (await res.json()).data as { id: string; amountFen: number; pricing: string; listAmountFen: number };
}
async function paid(request: APIRequestContext, id: string) {
  const created = await order(request, { resultId: id });
  expect((await request.post(`/api/orders/${created.id}/mock-pay`, { headers: { origin } })).ok()).toBe(true);
  return created;
}

test("an invited reader sees the invite price after the test and pays to pair in one step", async ({ page, browser }) => {
  const sheet = paymentMessages.zh.sheet;
  const host = await seed(page.request);
  expect(await paid(page.request, host)).toMatchObject({ amountFen: 690, pricing: "list" });
  const invite = (await (await page.request.post("/api/comparison-invitations", { headers: { origin }, data: { resultId: host, requestId: randomUUID(), relationship: "partner", consentVersion: "compare-host-v4" } })).json()).data;

  const guest = await browser.newContext({ baseURL: origin, viewport: page.viewportSize()! });
  const g = await guest.newPage();
  // Before the test, the invitation names no price.
  await g.goto(`/zh/t/${invite.token}`);
  expect(await g.locator("body").innerText()).not.toMatch(purchaseWords);
  const own = await seed(guest.request);
  await guest.request.post("/api/comparison-continuations", { headers: { origin }, data: { invitationToken: invite.token, resultId: own } });
  await g.goto(`/zh/result/${own}?compare=${invite.token}&unlock=1`);
  const dialog = g.getByRole("dialog");
  await expect(dialog.locator("[data-invite-price]")).toContainText(sheet.invitePrice);
  await expect(dialog).toContainText(sheet.pairConsent);
  const created = g.waitForResponse((r) => r.url().endsWith("/api/orders") && r.request().method() === "POST");
  await dialog.getByRole("button", { name: sheet.payJoin("5.5") }).click();
  expect((await (await created).json()).data).toMatchObject({ amountFen: 550, pricing: "invite", listAmountFen: 690 });
  const ready = dialog.locator("[data-pair-ready]");
  await expect(ready).toBeVisible();
  await expect(ready.getByRole("link", { name: sheet.readPair })).toHaveAttribute("href", /\/zh\/compare\//);
  // The guide is readable by both, and the host's report now leads to it.
  await g.goto((await ready.getByRole("link", { name: sheet.readPair }).getAttribute("href"))!);
  await expect(g).toHaveURL(/\/zh\/compare\//);
  await page.goto(`/zh/report/${host}?chapter=4`);
  await expect(page.locator('[data-report-invite="closing"]')).toHaveAttribute("data-report-invite-state", "ready");
  await guest.close();
});

test("an invite link gives someone else the invite price on their first report, and nothing to its owner", async ({ page, browser }) => {
  const t = pairingUiMessages.zh.reportInvite;
  const host = await seed(page.request);
  await paid(page.request, host);
  await page.goto(`/zh/report/${host}?chapter=3`);
  const block = page.locator("[data-invite-code]").filter({ visible: true }).first();
  await expect(block).toContainText(t.codeTitle);
  const code = (await block.locator("span").first().innerText()).trim();
  expect(code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);

  // The link keeps the code in a cookie and opens the home page, which names no price.
  const friend = await browser.newContext({ baseURL: origin, viewport: page.viewportSize()! });
  const landing = await friend.request.get(`/zh/i/${code}`, { maxRedirects: 0 });
  expect(landing.status()).toBe(303);
  expect(landing.headers()["location"]).toMatch(/\/zh$/);
  expect(landing.headers()["set-cookie"]).toMatch(new RegExp(`minv=${code}`));
  const f = await friend.newPage();
  await f.goto(`/zh/i/${code.toLowerCase()}`);
  await expect(f).toHaveURL(/\/zh$/);
  expect(await f.locator("main").innerText()).not.toMatch(purchaseWords);
  const first = await seed(friend.request);
  expect(await order(friend.request, { resultId: first })).toMatchObject({ amountFen: 550, pricing: "invite" });
  await f.goto(`/zh/result/${first}`);
  await expect(f.locator("[data-invite-price]").filter({ visible: true }).first()).toBeVisible();
  // Only the first report: once one is theirs, the next is at the list price.
  await paid(friend.request, first);
  const second = await seed(friend.request);
  expect(await order(friend.request, { resultId: second })).toMatchObject({ amountFen: 690, pricing: "list" });
  await friend.close();

  // The owner's own link, and a code that does not exist, change nothing.
  await page.request.get(`/zh/i/${code}`);
  expect(await order(page.request, { resultId: await seed(page.request) })).toMatchObject({ amountFen: 690, pricing: "list" });
  const stranger = await browser.newContext({ baseURL: origin });
  const unknown = await stranger.request.get("/zh/i/ZZZZZZ", { maxRedirects: 0 });
  expect(unknown.headers()["set-cookie"] ?? "").not.toMatch(/minv=/);
  await stranger.close();
});

test("a price that changes before paying is shown again rather than charged unseen", async ({ page, browser }) => {
  const sheet = paymentMessages.zh.sheet;
  const host = await seed(page.request);
  await paid(page.request, host);
  const invite = (await (await page.request.post("/api/comparison-invitations", { headers: { origin }, data: { resultId: host, requestId: randomUUID(), relationship: "partner", consentVersion: "compare-host-v4" } })).json()).data;
  const guest = await browser.newContext({ baseURL: origin, viewport: page.viewportSize()! });
  const g = await guest.newPage();
  const own = await seed(guest.request);
  await g.goto(`/zh/result/${own}?compare=${invite.token}&unlock=1`);
  const dialog = g.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: sheet.payJoin("5.5") })).toBeVisible();
  // The host closes the invitation while the sheet is open.
  expect((await page.request.delete(`/api/comparison-invitations/${invite.id}`, { headers: { origin } })).ok()).toBe(true);
  await dialog.getByRole("button", { name: sheet.reportOnly }).click();
  await dialog.getByRole("button", { name: sheet.mockPay("5.5") }).click();
  await expect(g.getByText(sheet.priceChanged("6.9"))).toBeVisible();
  await expect(dialog.getByRole("button", { name: sheet.mockPay("6.9") })).toBeVisible();
  await expect(dialog.locator("[data-invite-price]")).toHaveCount(0);
  await guest.close();
});

test("请 TA is charged the gift price", async ({ page }) => {
  const host = await seed(page.request);
  await paid(page.request, host);
  const invite = (await (await page.request.post("/api/comparison-invitations", { headers: { origin }, data: { resultId: host, requestId: randomUUID(), relationship: "friend", consentVersion: "compare-host-v4" } })).json()).data;
  expect(await order(page.request, { kind: "pair-gift", invitationId: invite.id })).toMatchObject({ amountFen: 490, pricing: "gift", listAmountFen: 690 });
});
