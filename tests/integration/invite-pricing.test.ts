import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { createResult } from "@/lib/results";
import { getQuestionnaire } from "@/lib/questionnaires";
import { createComparisonInvitation, joinComparison, revokeComparisonInvitation } from "@/lib/comparisons";
import { registerComparisonContinuation } from "@/lib/comparison-continuations";
import { ensureInviteCode } from "@/lib/invite-codes";
import { quoteReport } from "@/lib/pricing";
import { createOrder, markOrderPaid, orderPairUrl } from "@/lib/orders";

const url = process.env.TEST_SHARE_DATABASE_URL;
const visitors: string[] = [];
let sql: postgres.Sql;
beforeAll(() => {
  if (url !== "postgres://mirror_share_test@127.0.0.1:55439/mirror_share_test") throw new Error("Refusing non-isolated database");
  process.env.DATABASE_URL = url; process.env.APP_URL = "http://localhost:3017";
  sql = postgres(url, { max: 3 });
});
afterAll(async () => {
  if (!sql) return;
  if (visitors.length) {
    await sql`delete from share_events where actor_visitor_id in ${sql(visitors)}`;
    await sql`delete from referral_attributions where visitor_id in ${sql(visitors)}`;
    await sql`delete from comparison_continuations where visitor_id in ${sql(visitors)}`;
    await sql`delete from pair_gifts where visitor_id in ${sql(visitors)} or claimed_visitor_id in ${sql(visitors)}`;
    await sql`delete from comparisons where host_visitor_id in ${sql(visitors)} or guest_visitor_id in ${sql(visitors)}`;
    await sql`delete from orders where visitor_id in ${sql(visitors)}`;
    await sql`delete from invite_codes where visitor_id in ${sql(visitors)}`;
    await sql`delete from comparison_invitations where visitor_id in ${sql(visitors)}`;
    await sql`delete from results where visitor_id in ${sql(visitors)}`;
    await sql`delete from visitors where id in ${sql(visitors)}`;
  }
  await sql.end(); await (globalThis as unknown as { __mirrorSql?: postgres.Sql }).__mirrorSql?.end();
});

type Owner = { visitor: string; id: string };
async function owner(paid = false, visitor: string = randomUUID()): Promise<Owner> {
  if (!visitors.includes(visitor)) visitors.push(visitor);
  const q = getQuestionnaire("standard64-v1")!;
  const result = await createResult(visitor, q.questions.map(x => x.reverse ? -2 : 2), null, q.id);
  if (paid) await sql`update results set unlocked_at = now() where id=${result.id}`;
  return { visitor, id: result.id };
}
const invite = (o: Owner) => createComparisonInvitation(o.visitor, { resultId: o.id, requestId: randomUUID(), relationship: "partner", consentVersion: "compare-host-v4" });
const quote = (o: Owner, extra: { invitationToken?: string; cookieCode?: string } = {}) => quoteReport({ visitorId: o.visitor, locale: "zh", ...extra });
const report = (o: Owner, extra: { invitationToken?: string; join?: boolean; inviteCode?: string } = {}) =>
  createOrder({ visitorId: o.visitor, resultId: o.id, userAgent: null, clientIp: "127.0.0.1", ...extra });

describe("invite codes", () => {
  it("belong to unlocked reports only, one per report, and stay the same", async () => {
    const locked = await owner();
    expect(await ensureInviteCode(locked.id, locked.visitor)).toBeNull();
    const host = await owner(true);
    const code = await ensureInviteCode(host.id, host.visitor);
    expect(code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
    expect(await ensureInviteCode(host.id, host.visitor)).toBe(code);
    // Someone else's visitor id cannot create a code for this report.
    const other = await owner(true);
    expect(await ensureInviteCode(other.id, host.visitor)).toBeNull();
  });
});

describe("the invite price", () => {
  it("applies to a first report through an open invitation, by token or by the saved continuation", async () => {
    const host = await owner(true), guest = await owner();
    const invitation = await invite(host);
    const code = await ensureInviteCode(host.id, host.visitor);
    expect(await quote(guest)).toMatchObject({ amount: 690, pricing: "list" });
    // Showing a price names the invitation but records nothing; only the order records the code.
    const shown = await quote(guest, { invitationToken: invitation.item.token });
    expect(shown).toMatchObject({ amount: 550, list: 690, pricing: "invite", inviteCode: null, label: "5.5", listLabel: "6.9" });
    expect(shown.invitation?.token).toBe(invitation.item.token);
    await registerComparisonContinuation(guest.visitor, { invitationToken: invitation.item.token, resultId: guest.id });
    expect(await quote(guest)).toMatchObject({ amount: 550, pricing: "invite" });
    // The order charges what the page quoted, and remembers why.
    const order = await report(guest);
    expect(order).toMatchObject({ amountFen: 550, pricing: "invite", listAmountFen: 690, inviteCode: code, joinInvitationId: null });
    // A closed invitation no longer prices anything.
    await revokeComparisonInvitation(invitation.item.id, host.visitor);
    expect(await quote(guest, { invitationToken: invitation.item.token })).toMatchObject({ amount: 690, pricing: "list" });
  });

  it("applies through someone else's invite link, never one's own, and never to a second report", async () => {
    const host = await owner(true);
    const code = (await ensureInviteCode(host.id, host.visitor))!;
    const friend = await owner();
    expect(await quote(friend, { cookieCode: code.toLowerCase() })).toMatchObject({ amount: 550, pricing: "invite", inviteCode: code });
    const own = await owner(false, host.visitor);
    expect(await quote(own, { cookieCode: code })).toMatchObject({ amount: 690, pricing: "list" });
    expect(await quote(friend, { cookieCode: "ZZZZZZ" })).toMatchObject({ amount: 690, pricing: "list" });
    await sql`update invite_codes set disabled_at = now() where code=${code}`;
    expect(await quote(friend, { cookieCode: code })).toMatchObject({ amount: 690, pricing: "list" });
    await sql`update invite_codes set disabled_at = null where code=${code}`;
    const order = await report(friend, { inviteCode: code });
    await markOrderPaid(order.id, `MOCK-${order.id}`);
    const second = await owner(false, friend.visitor);
    expect(await quote(second, { cookieCode: code })).toMatchObject({ amount: 690, pricing: "list" });
  });

  it("goes to one report at a time: another result waits until the pending order is paid or lapses", async () => {
    const host = await owner(true);
    const code = (await ensureInviteCode(host.id, host.visitor))!;
    const friend = await owner(), other = await owner(false, friend.visitor);
    expect(await report(friend, { inviteCode: code })).toMatchObject({ amountFen: 550, pricing: "invite" });
    // A retried order for the same result keeps its price; another result pays the list price meanwhile.
    expect(await report(friend, { inviteCode: code })).toMatchObject({ amountFen: 550, pricing: "invite" });
    expect(await report(other, { inviteCode: code })).toMatchObject({ amountFen: 690, pricing: "list" });
    await sql`update orders set status = 'expired' where visitor_id=${friend.visitor}`;
    expect(await report(other, { inviteCode: code })).toMatchObject({ amountFen: 550, pricing: "invite" });
  });

  it("still names the invitation for pay-to-pair when the price is the list price", async () => {
    const host = await owner(true), guest = await owner(true);
    const invitation = await invite(host);
    const next = await owner(false, guest.visitor);
    const shown = await quote(next, { invitationToken: invitation.item.token });
    expect(shown).toMatchObject({ amount: 690, pricing: "list" });
    expect(shown.invitation?.id).toBe(invitation.item.id);
  });

  it("never applies to a host on their own invitation", async () => {
    const host = await owner(true);
    const invitation = await invite(host);
    const next = await owner(false, host.visitor);
    expect(await quote(next, { invitationToken: invitation.item.token })).toMatchObject({ amount: 690, pricing: "list" });
  });
});

describe("pay-to-pair", () => {
  it("joins the invitation once the payment is confirmed, on the consent given with it", async () => {
    const host = await owner(true), guest = await owner();
    const invitation = await invite(host);
    const order = await report(guest, { invitationToken: invitation.item.token, join: true });
    expect(order).toMatchObject({ pricing: "invite", joinInvitationId: invitation.item.id, joinConsentVersion: "compare-guest-v2" });
    expect(await sql`select id from comparisons where invitation_id=${invitation.item.id}`).toHaveLength(0);
    const paid = (await markOrderPaid(order.id, `MOCK-${order.id}`))!;
    const [pair] = await sql`select guest_visitor_id, guest_result_id, guest_consent_version, relationship from comparisons where invitation_id=${invitation.item.id}`;
    expect(pair).toMatchObject({ guest_visitor_id: guest.visitor, guest_result_id: guest.id, guest_consent_version: "compare-guest-v2", relationship: "partner" });
    expect(await orderPairUrl(paid)).toMatch(/^\/zh\/compare\//);
    // Repeated confirmations (polls, callbacks) join once.
    await markOrderPaid(order.id, `MOCK-${order.id}`);
    expect(await sql`select id from comparisons where invitation_id=${invitation.item.id}`).toHaveLength(1);
  });

  it("still unlocks the report when the invitation ends before the payment lands", async () => {
    const host = await owner(true), guest = await owner();
    const invitation = await invite(host);
    const order = await report(guest, { invitationToken: invitation.item.token, join: true });
    await revokeComparisonInvitation(invitation.item.id, host.visitor);
    const paid = (await markOrderPaid(order.id, `MOCK-${order.id}`))!;
    expect((await sql`select unlocked_at from results where id=${guest.id}`)[0].unlocked_at).not.toBeNull();
    expect(await orderPairUrl(paid)).toBeNull();
  });

  it("refuses to take consent for a join the visitor already has", async () => {
    const host = await owner(true), guest = await owner(true);
    const invitation = await invite(host);
    await joinComparison(guest.visitor, { invitationToken: invitation.item.token, resultId: guest.id, consentVersion: "compare-guest-v2" });
    const next = await owner(false, guest.visitor);
    await expect(report(next, { invitationToken: invitation.item.token, join: true })).rejects.toMatchObject({ code: "ALREADY_JOINED" });
    expect(await report(next, { invitationToken: invitation.item.token })).toMatchObject({ joinInvitationId: null });
  });

  it("refuses to take consent for an invitation that is closed or one's own", async () => {
    const host = await owner(true);
    const invitation = await invite(host);
    await expect(report(await owner(false, host.visitor), { invitationToken: invitation.item.token, join: true })).rejects.toMatchObject({ code: "INVITATION_UNAVAILABLE" });
    await revokeComparisonInvitation(invitation.item.id, host.visitor);
    await expect(report(await owner(), { invitationToken: invitation.item.token, join: true })).rejects.toMatchObject({ code: "INVITATION_UNAVAILABLE" });
  });
});

describe("请 TA", () => {
  it("is charged the gift price", async () => {
    const host = await owner(true);
    const invitation = await invite(host);
    const order = await createOrder({ visitorId: host.visitor, kind: "pair-gift", invitationId: invitation.item.id, userAgent: null, clientIp: "127.0.0.1" });
    expect(order).toMatchObject({ amountFen: 490, pricing: "gift", listAmountFen: 690, inviteCode: null });
  });
});
