import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { createResult } from "@/lib/results";
import { createShare, revokeShare } from "@/lib/shares";
import { defaultShareSelection } from "@/lib/share-content";
import { createComparisonInvitation, getOwnedComparison, getPublicInvitation, joinComparison, revokeComparison, revokeComparisonInvitation } from "@/lib/comparisons";
import { recordShareEvent } from "@/lib/share-analytics";

const localUrl = process.env.TEST_SHARE_DATABASE_URL;
const visitors: string[] = [];
let sql: postgres.Sql;
beforeAll(() => {
  if (!localUrl) throw new Error("TEST_SHARE_DATABASE_URL must explicitly identify the isolated loopback test DB");
  const url = new URL(localUrl);
  if (url.hostname !== "127.0.0.1" || url.port !== "55439" || url.username !== "mirror_share_test" || url.pathname !== "/mirror_share_test") throw new Error("Refusing non-isolated database");
  process.env.DATABASE_URL = localUrl;
  process.env.APP_URL = "http://localhost:3000";
  sql = postgres(localUrl, { max: 3 });
});
afterAll(async () => {
  if (!sql) return;
  // Remove only rows created by this run; never truncate shared fixtures.
  if (visitors.length) {
    await sql`delete from share_events where actor_visitor_id in ${sql(visitors)} or share_id in (select id from result_shares where visitor_id in ${sql(visitors)})`;
    await sql`delete from comparison_continuations where visitor_id in ${sql(visitors)} or invitation_id in (select id from comparison_invitations where visitor_id in ${sql(visitors)})`;
    await sql`delete from referral_attributions where visitor_id in ${sql(visitors)} or share_id in (select id from result_shares where visitor_id in ${sql(visitors)}) or invitation_id in (select id from comparison_invitations where visitor_id in ${sql(visitors)})`;
    await sql`delete from comparisons where host_visitor_id in ${sql(visitors)} or guest_visitor_id in ${sql(visitors)}`;
    await sql`delete from comparison_invitations where visitor_id in ${sql(visitors)}`;
    await sql`delete from result_shares where visitor_id in ${sql(visitors)}`;
    await sql`delete from orders where visitor_id in ${sql(visitors)}`;
    await sql`delete from results where visitor_id in ${sql(visitors)}`;
    await sql`delete from visitors where id in ${sql(visitors)}`;
  }
  await sql.end();
  await (globalThis as unknown as { __mirrorSql?: postgres.Sql }).__mirrorSql?.end();
});
async function resultOwner() {
  const visitor = randomUUID(); visitors.push(visitor);
  const result = await createResult(visitor, Array(32).fill(2));
  return { visitor, result };
}
async function fixture() {
  const host = await resultOwner(), guest = await resultOwner();
  await sql`update results set unlocked_at = now() where id in ${sql([host.result.id, guest.result.id])}`;
  const share = await createShare(host.visitor, { resultId: host.result.id, selectedIds: defaultShareSelection(host.result.profile), showType: false, showDimensions: false, consentVersion: "share-public-v1", requestId: randomUUID() });
  const requestId = randomUUID();
  const invitation = await createComparisonInvitation(host.visitor, { shareId: share.item.id, consentVersion: "compare-host-v2", requestId });
  const input = { invitationToken: invitation.item.token, resultId: guest.result.id, consentVersion: "compare-guest-v2" as const };
  return { host, guest, share, invitation, requestId, input };
}
async function touch(visitor: string, token: string) {
  await recordShareEvent(visitor, { eventId: randomUUID(), eventName: "share_browser_visible", surface: "share_page", channel: "link", shareToken: token }, "zh");
}

describe("isolated share-growth database contracts", () => {
  it("requires independent consent, freezes only agreed fields and denies unrelated readers", async () => {
    const f = await fixture();
    expect(f.share.item.snapshot).not.toHaveProperty("dimensions");
    expect(f.invitation.item.snapshot).toHaveProperty("categories");
    await expect(createComparisonInvitation(f.host.visitor, { shareId: f.share.item.id, consentVersion: "bad" as "compare-host-v2", requestId: randomUUID() })).rejects.toThrow();
    const joined = await joinComparison(f.guest.visitor, f.input);
    expect(await getOwnedComparison(joined.item.id, f.host.visitor)).not.toBeNull();
    expect(await getOwnedComparison(joined.item.id, f.guest.visitor)).not.toBeNull();
    expect(await getOwnedComparison(joined.item.id, randomUUID())).toBeNull();
    expect(JSON.stringify(await getPublicInvitation(f.invitation.item.token))).not.toContain(f.host.result.id);
    expect(Object.keys(joined.item.hostSnapshot).sort()).toEqual(["categories", "createdAt", "questionnaireId"]);
    await expect(joinComparison(f.host.visitor, { ...f.input, resultId: f.host.result.id })).rejects.toMatchObject({ code: "SELF_COMPARISON" });
  });
  it("serializes duplicate invitation/join requests and never swaps a guest result", async () => {
    const f = await fixture();
    const invitations = await Promise.all(Array.from({ length: 4 }, () => createComparisonInvitation(f.host.visitor, { shareId: f.share.item.id, consentVersion: "compare-host-v2", requestId: f.requestId })));
    expect(new Set(invitations.map(r => r.item.id)).size).toBe(1);
    const pairs = await Promise.all(Array.from({ length: 5 }, () => joinComparison(f.guest.visitor, f.input)));
    expect(new Set(pairs.map(r => r.item.id)).size).toBe(1);
    expect(pairs.filter(p => p.created)).toHaveLength(1);
    const another = await createResult(f.guest.visitor, Array(32).fill(0));
    await expect(joinComparison(f.guest.visitor, { ...f.input, resultId: another.id })).rejects.toMatchObject({ status: 409, code: "ALREADY_JOINED" });
  });
  it("rejects new keys for an active invite and serializes a shared request key across shares", async () => {
    const f = await fixture();
    await expect(createComparisonInvitation(f.host.visitor, { shareId: f.share.item.id, consentVersion: "compare-host-v2", requestId: randomUUID() })).rejects.toMatchObject({ status: 409, code: "ACTIVE_INVITATION" });
    await revokeComparisonInvitation(f.invitation.item.id, f.host.visitor);
    const makeShare = () => createShare(f.host.visitor, { resultId: f.host.result.id, selectedIds: defaultShareSelection(f.host.result.profile), showType: false, showDimensions: false, consentVersion: "share-public-v1", requestId: randomUUID() });
    const shares = await Promise.all([makeShare(), makeShare()]);
    const requestId = randomUUID();
    const created = await Promise.allSettled(shares.map(share => createComparisonInvitation(f.host.visitor, { shareId: share.item.id, consentVersion: "compare-host-v2", requestId })));
    expect(created.filter(row => row.status === "fulfilled")).toHaveLength(1);
    const rejected = created.find(row => row.status === "rejected");
    expect(rejected?.status === "rejected" && rejected.reason).toMatchObject({ status: 409, code: "IDEMPOTENCY_CONFLICT" });
  });
  it("expiry blocks new joins but allows existing pair reads and idempotent retries", async () => {
    const f = await fixture();
    const joined = await joinComparison(f.guest.visitor, f.input);
    await sql`update comparison_invitations set expires_at = now() - interval '1 second' where id = ${f.invitation.item.id}`;
    expect(await getPublicInvitation(f.invitation.item.token)).toBeNull();
    expect((await joinComparison(f.guest.visitor, f.input)).item.id).toBe(joined.item.id);
    expect(await getOwnedComparison(joined.item.id, f.host.visitor)).not.toBeNull();
    const other = await resultOwner();
    await expect(joinComparison(other.visitor, { ...f.input, resultId: other.result.id })).rejects.toMatchObject({ status: 410 });
  });
  it("either party can withdraw, cannot revive a pair, and cannot read after withdrawal", async () => {
    const f = await fixture();
    const joined = await joinComparison(f.guest.visitor, f.input);
    await expect(revokeComparison(joined.item.id, randomUUID())).rejects.toMatchObject({ status: 404 });
    await revokeComparison(joined.item.id, f.guest.visitor);
    await revokeComparison(joined.item.id, f.guest.visitor);
    expect(await getOwnedComparison(joined.item.id, f.host.visitor)).toBeNull();
    expect(await getOwnedComparison(joined.item.id, f.guest.visitor)).toBeNull();
    await expect(joinComparison(f.guest.visitor, f.input)).rejects.toMatchObject({ status: 410 });
  });
  it.each(["invitation", "share"] as const)("join racing %s revocation leaves no readable pair", async target => {
    for (let run = 0; run < 4; run++) {
      const f = await fixture();
      const settled = await Promise.allSettled([
        joinComparison(f.guest.visitor, f.input),
        target === "share" ? revokeShare(f.share.item.id, f.host.visitor) : revokeComparisonInvitation(f.invitation.item.id, f.host.visitor),
      ]);
      expect(settled[1].status).toBe("fulfilled");
      if (settled[0].status === "fulfilled") {
        expect(await getOwnedComparison(settled[0].value.item.id, f.host.visitor)).toBeNull();
        expect(await getOwnedComparison(settled[0].value.item.id, f.guest.visitor)).toBeNull();
      }
      expect(await getPublicInvitation(f.invitation.item.token)).toBeNull();
    }
  });
  it("only one concurrent first completion receives first-touch attribution", async () => {
    const f = await fixture();
    const visitor = randomUUID(); visitors.push(visitor);
    await touch(visitor, f.share.item.token);
    const results = await Promise.all([createResult(visitor, Array(32).fill(0)), createResult(visitor, Array(32).fill(2))]);
    const [attribution] = await sql`select first_result_id from referral_attributions where visitor_id = ${visitor}`;
    expect(results.map(r => r.id)).toContain(attribution.first_result_id);
    const [count] = await sql`select count(*)::int as n from results where visitor_id = ${visitor}`;
    expect(count.n).toBe(2);
  });
  it("real SQL failure rolls back attribution savepoint but commits result; retest cannot reclaim it", async () => {
    const f = await fixture();
    const visitor = randomUUID(); visitors.push(visitor);
    await touch(visitor, f.share.item.token);
    // The generated identifier contains only [a-z0-9_]; trigger affects this fixture visitor only.
    const name = `test_share_fail_${randomUUID().replaceAll("-", "")}`;
    await sql.unsafe(`create function ${name}() returns trigger language plpgsql as $$ begin raise exception 'intentional attribution SQL failure'; end $$`);
    await sql.unsafe(`create trigger ${name} before update on referral_attributions for each row when (NEW.visitor_id = '${visitor}'::uuid) execute function ${name}()`);
    let completed: Awaited<ReturnType<typeof createResult>>;
    try { completed = await createResult(visitor, Array(32).fill(0)); }
    finally {
      await sql.unsafe(`drop trigger if exists ${name} on referral_attributions`);
      await sql.unsafe(`drop function if exists ${name}()`);
    }
    const [result] = await sql`select id from results where id = ${completed!.id}`;
    expect(result.id).toBe(completed!.id);
    const [unclaimed] = await sql`select first_result_id from referral_attributions where visitor_id = ${visitor}`;
    expect(unclaimed.first_result_id).toBeNull();
    await createResult(visitor, Array(32).fill(2));
    const [afterRetest] = await sql`select first_result_id from referral_attributions where visitor_id = ${visitor}`;
    expect(afterRetest.first_result_id).toBeNull();
  });
  it("reports mature cohorts, mock exclusion, separate currencies and zero-denominator semantics", async () => {
    const day = 86400000;
    const now = new Date();
    const start = new Date(+now - 30 * day).toISOString().slice(0, 10);
    const end = now.toISOString().slice(0, 10);
    const report = async () => {
      const { stdout } = await promisify(execFile)(process.execPath, ["--import", "tsx", "scripts/report-share-growth.ts", "--start", start, "--end", end], { env: { ...process.env, SHARE_GROWTH_DATABASE_URL: localUrl } });
      return JSON.parse(stdout);
    };
    const before = await report();
    const f = await fixture();
    const firstAt = new Date(+now - 20 * day), seedAt = new Date(+now - 19 * day), touchAt = new Date(+now - 18.5 * day), guestAt = new Date(+now - 18 * day);
    await sql`update results set created_at = ${firstAt} where id = ${f.host.result.id}`;
    await sql`update results set created_at = ${guestAt} where id = ${f.guest.result.id}`;
    await sql`update result_shares set created_at = ${seedAt} where id = ${f.share.item.id}`;
    await sql`insert into referral_attributions(visitor_id,share_id,first_touch_at,expires_at,first_result_id,completed_at) values(${f.guest.visitor},${f.share.item.id},${touchAt},${new Date(+touchAt + 7 * day)},${f.guest.result.id},${guestAt})`;
    for (const [provider, currency, amount] of [["mock", "CNY", 10000], ["wechat", "CNY", 690], ["crypto", "USD", 100]] as const) {
      await sql`insert into orders(id,visitor_id,result_id,amount_fen,currency,provider,channel,status,paid_at,expires_at) values(${randomUUID()},${f.guest.visitor},${f.guest.result.id},${amount},${currency},${provider},${provider === "crypto" ? "ethereum" : provider === "wechat" ? "jsapi" : "mock"},'paid',${new Date(+guestAt + day)},${new Date(+guestAt + 2 * day)})`;
    }
    const after = await report();
    expect(after.first_completion_card_creation_7d.denominator - before.first_completion_card_creation_7d.denominator).toBe(2);
    expect(after.first_completion_card_creation_7d.numerator - before.first_completion_card_creation_7d.numerator).toBe(1);
    expect(after.first_completion_referral_7d.numerator - before.first_completion_referral_7d.numerator).toBe(1);
    expect(after.share_seed_referral_14d.numerator - before.share_seed_referral_14d.numerator).toBe(1);
    expect(after.share_seed_referral_14d.denominator - before.share_seed_referral_14d.denominator).toBe(1);
    expect(after.real_payment_7d.numerator - before.real_payment_7d.numerator).toBe(1);
    const money = (output: typeof after, currency: string) => Number(output.revenue.currencies_and_statuses.find((r: { currency: string; status: string }) => r.currency === currency && r.status === "paid")?.amount_minor ?? 0);
    expect(money(after, "CNY") - money(before, "CNY")).toBe(690);
    expect(money(after, "USD") - money(before, "USD")).toBe(100);
    expect(JSON.stringify(after)).not.toContain(f.guest.visitor);
    expect(JSON.stringify(after)).not.toContain(f.share.item.token);
  });

});
