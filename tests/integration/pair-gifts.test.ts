import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { createResult, resultsForVisitor } from "@/lib/results";
import { getQuestionnaire } from "@/lib/questionnaires";
import { createComparisonInvitation, getPublicInvitation, invitationOptions, joinComparison, listOwnedComparisons, revokeComparisonInvitation } from "@/lib/comparisons";
import { listComparisonContinuations, registerComparisonContinuation } from "@/lib/comparison-continuations";
import { getPairingEligibility } from "@/lib/pairing-eligibility";
import { attachGiftToInvitation, fulfillGiftOrder } from "@/lib/pair-gifts";
import { createOrder, markOrderPaid } from "@/lib/orders";
import { compareMessages } from "@/lib/i18n/messages/compare";
import type { CompareRelationship } from "@/lib/compare-types";

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
    await sql`delete from comparison_invitations where visitor_id in ${sql(visitors)}`;
    await sql`delete from results where visitor_id in ${sql(visitors)}`;
    await sql`delete from visitors where id in ${sql(visitors)}`;
  }
  await sql.end(); await (globalThis as unknown as { __mirrorSql?: postgres.Sql }).__mirrorSql?.end();
});
type Owner = { visitor: string; id: string };
async function owner(paid = false, visitor: string = randomUUID(), questionnaire: "standard64-v1" | "en64-v1" = "standard64-v1"): Promise<Owner> {
  if (!visitors.includes(visitor)) visitors.push(visitor);
  const q = getQuestionnaire(questionnaire)!;
  const result = await createResult(visitor, q.questions.map(x => x.reverse ? -2 : 2), null, q.id);
  if (paid) await sql`update results set unlocked_at = now() where id=${result.id}`;
  return { visitor, id: result.id };
}
const invite = (o: Owner, relationship: CompareRelationship = "partner", requestId = randomUUID()) =>
  createComparisonInvitation(o.visitor, { resultId: o.id, requestId, relationship, consentVersion: "compare-host-v4" });
const join = (o: Owner, token: string) => joinComparison(o.visitor, { invitationToken: token, resultId: o.id, consentVersion: "compare-guest-v2" });
async function buyGift(host: Owner, invitationId: string) {
  const order = await createOrder({ visitorId: host.visitor, kind: "pair-gift", invitationId, userAgent: null, clientIp: "127.0.0.1" });
  return markOrderPaid(order.id, `MOCK-${order.id}`);
}
const gifts = (host: Owner) => sql`select * from pair_gifts where visitor_id=${host.visitor} order by created_at`;

describe("relationship guides (compare-v4)", () => {
  it("keeps one open invitation per relationship, and the relationship in the idempotency key", async () => {
    const host = await owner(true), request = randomUUID();
    const partner = await invite(host, "partner", request);
    expect((await invite(host, "partner", request)).item.id).toBe(partner.item.id);
    await expect(invite(host, "friend", request)).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
    await expect(invite(host, "partner")).rejects.toMatchObject({ code: "ACTIVE_INVITATION" });
    const colleague = await invite(host, "colleague");
    expect(colleague.item.relationship).toBe("colleague");
    const options = await invitationOptions(host.id, host.visitor);
    expect(options.activeInvitations.map(item => item.relationship).sort()).toEqual(["colleague", "partner"]);
    await expect(createComparisonInvitation(host.visitor, { resultId: host.id, requestId: randomUUID(), consentVersion: "compare-host-v3" })).rejects.toMatchObject({ code: "CONSENT_REFRESH_REQUIRED" });
  });
  it("publishes the relationship on the invitation and writes the guide for it", async () => {
    const host = await owner(true), guest = await owner(true);
    const invitation = await invite(host, "family");
    const visible = await getPublicInvitation(invitation.item.token);
    expect(visible).toMatchObject({ relationship: "family", covered: false });
    expect(JSON.stringify(visible)).not.toContain(host.id);
    const pair = await join(guest, invitation.item.token);
    expect(pair.item.relationship).toBe("family");
    const content = pair.item.outputSnapshot;
    expect(content.contentVersion).toBe("compare-v4");
    if (content.contentVersion !== "compare-v4") return;
    expect(content.relationship).toBe("family");
    expect(content.topic.title).toBe(compareMessages.zh.byRelationship.family.topic.title);
    expect((await sql`select relationship, content_version from comparisons where id=${pair.item.id}`)[0]).toEqual({ relationship: "family", content_version: "compare-v4" });
  });
  it("gives invitations made before relationships the v3 reading they promised", async () => {
    const host = await owner(true), guest = await owner(true);
    const invitation = await invite(host, "friend");
    await sql`update comparison_invitations set relationship=null, consent_version='compare-host-v3', content_version='compare-v3' where id=${invitation.item.id}`;
    const pair = await join(guest, invitation.item.token);
    expect(pair.item.outputSnapshot.contentVersion).toBe("compare-v3");
    expect(pair.item.relationship).toBeNull();
  });
});

describe("请 TA gifts", () => {
  it("turns a paid gift order into one gift on its invitation, idempotently, without touching the host's report", async () => {
    const host = await owner(true), invitation = await invite(host);
    const historyBefore = await resultsForVisitor(host.visitor);
    const order = await buyGift(host, invitation.item.id);
    expect(order).toMatchObject({ kind: "pair-gift", status: "paid", resultId: host.id, invitationId: invitation.item.id, amountFen: 690, currency: "CNY" });
    await markOrderPaid(order!.id, "again"); await fulfillGiftOrder(order!); await fulfillGiftOrder(order!);
    const rows = await gifts(host);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ invitation_id: invitation.item.id, claimed_at: null, locale: "zh" });
    expect(await getPairingEligibility(host.id, host.visitor)).toBe("eligible");
    expect(await resultsForVisitor(host.visitor)).toEqual(historyBefore);
    expect(await getPublicInvitation(invitation.item.token)).toMatchObject({ covered: true });
    await expect(buyGift(host, invitation.item.id)).rejects.toMatchObject({ code: "GIFT_ALREADY_COVERED" });
    const stranger = await owner(true);
    await expect(createOrder({ visitorId: stranger.visitor, kind: "pair-gift", invitationId: invitation.item.id, userAgent: null, clientIp: "127.0.0.1" })).rejects.toMatchObject({ code: "INVITATION_NOT_FOUND" });
  });
  it("opens a locked participant's report on join, and only for one participant", async () => {
    const host = await owner(true), invitation = await invite(host);
    await buyGift(host, invitation.item.id);
    const paidGuest = await owner(true), first = await owner(), second = await owner();
    // A participant who already has their report leaves the gift for the next person.
    await join(paidGuest, invitation.item.token);
    expect((await gifts(host))[0].claimed_at).toBeNull();
    await registerComparisonContinuation(first.visitor, { invitationToken: invitation.item.token, resultId: first.id });
    expect((await listComparisonContinuations(first.visitor, first.id))[0].covered).toBe(true);
    const pair = await join(first, invitation.item.token);
    expect(pair.item.outputSnapshot.contentVersion).toBe("compare-v4");
    expect(await getPairingEligibility(first.id, first.visitor)).toBe("eligible");
    expect((await sql`select unlock_order_id from results where id=${first.id}`)[0].unlock_order_id).toBeNull();
    expect((await gifts(host))[0]).toMatchObject({ claimed_visitor_id: first.visitor, claimed_result_id: first.id });
    expect(await getPublicInvitation(invitation.item.token)).toMatchObject({ covered: false });
    await expect(join(second, invitation.item.token)).rejects.toMatchObject({ code: "PAIRING_UNLOCK_REQUIRED" });
    expect(await getPairingEligibility(second.id, second.visitor)).toBe("locked");
  });
  it("lets exactly one of two locked participants racing to join use the gift", async () => {
    for (let n = 0; n < 3; n++) {
      const host = await owner(true), invitation = await invite(host), a = await owner(), b = await owner();
      await buyGift(host, invitation.item.id);
      const settled = await Promise.allSettled([join(a, invitation.item.token), join(b, invitation.item.token)]);
      expect(settled.filter(x => x.status === "fulfilled")).toHaveLength(1);
      expect(settled.find(x => x.status === "rejected")).toMatchObject({ reason: { code: "PAIRING_UNLOCK_REQUIRED" } });
      expect((await sql`select count(*)::int n from results where id in ${sql([a.id, b.id])} and unlocked_at is not null`)[0].n).toBe(1);
    }
  });
  it("moves an unused gift from a closed invitation to the host's next one in the same language", async () => {
    const host = await owner(true), first = await invite(host, "partner");
    await buyGift(host, first.item.id);
    await revokeComparisonInvitation(first.item.id, host.visitor);
    expect((await listOwnedComparisons(host.visitor)).availableGifts).toEqual({ zh: 1, en: 0 });
    const next = await invite(host, "friend");
    expect(next.item.covered).toBe(true);
    expect((await gifts(host))[0].invitation_id).toBe(next.item.id);
    // A host holding an unused gift attaches it rather than paying again.
    const other = await invite(host, "family");
    expect(other.item.covered).toBe(false);
    await expect(attachGiftToInvitation(host.visitor, other.item.id)).rejects.toMatchObject({ code: "GIFT_NONE_AVAILABLE" });
    await revokeComparisonInvitation(next.item.id, host.visitor);
    await expect(buyGift(host, other.item.id)).rejects.toMatchObject({ code: "GIFT_AVAILABLE" });
    expect(await attachGiftToInvitation(host.visitor, other.item.id)).toEqual({ invitationId: other.item.id, covered: true });
    expect(await attachGiftToInvitation(host.visitor, other.item.id)).toEqual({ invitationId: other.item.id, covered: true });
    await expect(attachGiftToInvitation(randomUUID(), other.item.id)).rejects.toMatchObject({ status: 404 });
    // An English invitation never takes a gift paid in yuan.
    const english = await owner(true, host.visitor, "en64-v1");
    await revokeComparisonInvitation(other.item.id, host.visitor);
    expect((await invite(english, "partner")).item.covered).toBe(false);
  });
  it("keeps a gift paid after its invitation closed as an available gift", async () => {
    const host = await owner(true), invitation = await invite(host);
    const order = await createOrder({ visitorId: host.visitor, kind: "pair-gift", invitationId: invitation.item.id, userAgent: null, clientIp: "127.0.0.1" });
    await revokeComparisonInvitation(invitation.item.id, host.visitor);
    await markOrderPaid(order.id, "late");
    expect((await gifts(host))[0].invitation_id).toBeNull();
    expect((await listOwnedComparisons(host.visitor)).availableGifts.zh).toBe(1);
  });
});
