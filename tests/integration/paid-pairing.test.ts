import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { createResult } from "@/lib/results";
import { getQuestionnaire } from "@/lib/questionnaires";
import { createComparisonInvitation, getOwnedComparison, getPublicInvitation, getInvitationState, joinComparison, revokeComparison, revokeComparisonInvitation, listOwnedComparisons } from "@/lib/comparisons";
import { deleteComparisonContinuation, listComparisonContinuations, registerComparisonContinuation } from "@/lib/comparison-continuations";
import { getPairingEligibility, reconcilePaidResult } from "@/lib/pairing-eligibility";
import { recordShareEvent } from "@/lib/share-analytics";
import { createOrder } from "@/lib/orders";
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
    await sql`delete from result_shares where visitor_id in ${sql(visitors)}`;
    await sql`delete from results where visitor_id in ${sql(visitors)}`;
    await sql`delete from visitors where id in ${sql(visitors)}`;
  }
  await sql.end(); await (globalThis as unknown as { __mirrorSql?: postgres.Sql }).__mirrorSql?.end();
});
async function owner(paid = false, visitor = randomUUID(), balanced = false) {
  if (!visitors.includes(visitor)) visitors.push(visitor);
  const q = getQuestionnaire("standard64-v1")!;
  const result = await createResult(visitor, q.questions.map(x => balanced ? 0 : x.reverse ? -2 : 2), null, q.id);
  if (paid) await sql`update results set unlocked_at = now() where id=${result.id}`;
  return { visitor, id: result.id };
}
function invite(o: {visitor:string;id:string}, requestId=randomUUID(), relationship: CompareRelationship="partner") { return createComparisonInvitation(o.visitor, { resultId:o.id, requestId, relationship, consentVersion:"compare-host-v4" }); }
function join(o: {visitor:string;id:string}, token:string) { return joinComparison(o.visitor, { invitationToken:token, resultId:o.id, consentVersion:"compare-guest-v2" }); }

describe("paid pairing server contracts", () => {
  it("requires each selected result to be owned and paid, never visitor-wide membership", async () => {
    const host = await owner(), guest = await owner();
    await expect(invite(host)).rejects.toMatchObject({ code:"PAIRING_UNLOCK_REQUIRED" });
    await sql`update results set unlocked_at=now() where id=${guest.id}`;
    await expect(invite(host)).rejects.toMatchObject({ code:"PAIRING_UNLOCK_REQUIRED" });
    await sql`update results set unlocked_at=now() where id=${host.id}`;
    const invitation = await invite(host);
    const unpaid = await owner(false, guest.visitor);
    await expect(join(unpaid,invitation.item.token)).rejects.toMatchObject({ code:"PAIRING_UNLOCK_REQUIRED" });
    await expect(join({...guest, id:host.id},invitation.item.token)).rejects.toMatchObject({ status:404 });
    const pair = await join(guest, invitation.item.token);
    expect(await getOwnedComparison(pair.item.id,host.visitor)).not.toBeNull();
    expect(await getOwnedComparison(pair.item.id,randomUUID())).toBeNull();
    expect(pair.item.outputSnapshot.contentVersion).toBe("compare-v4");
    expect((await sql`select count(*)::int n from result_shares where visitor_id=${host.visitor}`)[0].n).toBe(0);
  });
  it("rejects stale consent and serializes one active invitation per result and idempotency keys", async () => {
    const host=await owner(true), request=randomUUID();
    await expect(createComparisonInvitation(host.visitor,{resultId:host.id,requestId:request,consentVersion:"compare-host-v1"})).rejects.toMatchObject({code:"CONSENT_REFRESH_REQUIRED"});
    const rows=await Promise.all(Array.from({length:5},()=>invite(host,request)));
    expect(new Set(rows.map(x=>x.item.id)).size).toBe(1);
    await expect(invite(host)).rejects.toMatchObject({code:"ACTIVE_INVITATION"});
    const second=await owner(true,host.visitor);
    await expect(invite(second,request)).rejects.toMatchObject({code:"IDEMPOTENCY_CONFLICT"});
    expect(rows[0].item.token).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(JSON.stringify(await getPublicInvitation(rows[0].item.token))).not.toContain(host.id);
  });
  it("retains historical free guides, but closes old invitations to new joins", async () => {
    const host=await owner(true), guest=await owner(true), another=await owner(true);
    const invitation=await invite(host), pair=await join(guest,invitation.item.token);
    const frozen={...pair.item.outputSnapshot,contentVersion:"compare-v1"};
    await sql`update comparison_invitations set access_policy='legacy-free-v1',consent_version='compare-host-v1' where id=${invitation.item.id}`;
    await sql`update comparisons set access_policy='legacy-free-v1',content_version='compare-v1',output_snapshot=${sql.json(frozen)} where id=${pair.item.id}`;
    await sql`update results set unlocked_at=null where id in ${sql([host.id,guest.id])}`;
    expect(await getInvitationState(invitation.item.token)).toBe("legacy");
    expect(await getPublicInvitation(invitation.item.token)).toBeNull();
    expect((await getOwnedComparison(pair.item.id,guest.visitor))?.outputSnapshot).toEqual(frozen);
    await expect(join(another,invitation.item.token)).rejects.toMatchObject({code:"INVITATION_UPGRADE_REQUIRED"});
    await revokeComparison(pair.item.id,guest.visitor);
    expect(await getOwnedComparison(pair.item.id,host.visitor)).toBeNull();
  });
  it("stores multiple private intents without consent and clears all invitation intents on join", async () => {
    const a=await owner(true), b=await owner(true), guest=await owner(true), otherResult=await owner(false,guest.visitor);
    const ia=await invite(a), ib=await invite(b);
    const add=(token:string,resultId=guest.id)=>registerComparisonContinuation(guest.visitor,{invitationToken:token,resultId});
    const saved=await add(ia.item.token); expect(saved.status).toBe("pending");
    expect(await add(ia.item.token)).toEqual(saved);
    await add(ia.item.token,otherResult.id); await add(ib.item.token);
    expect(await listComparisonContinuations(guest.visitor)).toHaveLength(3);
    expect(await listComparisonContinuations(a.visitor)).toHaveLength(0);
    if(saved.status==='pending') { await deleteComparisonContinuation(saved.id,a.visitor); expect(await listComparisonContinuations(guest.visitor)).toHaveLength(3); }
    const pair=await join(guest,ia.item.token);
    expect(await listComparisonContinuations(guest.visitor)).toHaveLength(1);
    expect(await add(ia.item.token,otherResult.id)).toEqual({status:"completed",pairUrl:pair.item.url});
    await sql`update comparison_invitations set expires_at=now()-interval '1 second' where id=${ia.item.id}`;
    expect(await add(ia.item.token)).toEqual({status:"completed",pairUrl:pair.item.url});
    await revokeComparison(pair.item.id,guest.visitor);
    await expect(add(ia.item.token)).rejects.toMatchObject({status:410});
    const pending=await listComparisonContinuations(guest.visitor);
    await deleteComparisonContinuation(pending[0].id,guest.visitor); await deleteComparisonContinuation(pending[0].id,guest.visitor);
    expect(await listComparisonContinuations(guest.visitor)).toHaveLength(0);
  });
  it("isolates intent analytics SQL failure in a savepoint",async()=>{
    const host=await owner(true),guest=await owner(), invitation=await invite(host);
    const name=`test_intent_${randomUUID().replaceAll('-','')}`;
    await sql.unsafe(`create function ${name}() returns trigger language plpgsql as $$ begin raise exception 'test'; end $$`);
    await sql.unsafe(`create trigger ${name} before insert on share_events for each row when (NEW.actor_visitor_id='${guest.visitor}'::uuid) execute function ${name}()`);
    try { expect((await registerComparisonContinuation(guest.visitor,{invitationToken:invitation.item.token,resultId:guest.id})).status).toBe("pending"); }
    finally { await sql.unsafe(`drop trigger ${name} on share_events`); await sql.unsafe(`drop function ${name}()`); }
    expect(await listComparisonContinuations(guest.visitor)).toHaveLength(1);
  });
  it("independent invitation first touch stays exclusive and checks owner events",async()=>{
    const host=await owner(true),invitation=await invite(host),visitor=randomUUID(); visitors.push(visitor);
    await recordShareEvent(visitor,{eventId:randomUUID(),eventName:"share_browser_visible",surface:"invitation",channel:"link",shareToken:invitation.item.token},"zh");
    const result=await owner(false,visitor);
    const [a]=await sql`select invitation_id,share_id,first_result_id from referral_attributions where visitor_id=${visitor}`;
    expect(a).toMatchObject({invitation_id:invitation.item.id,share_id:null,first_result_id:result.id});
    await expect(recordShareEvent(visitor,{eventId:randomUUID(),eventName:"pairing_checkout_opened",surface:"payment_sheet",channel:"unknown",resultId:host.id},"zh")).rejects.toMatchObject({status:404});
    await recordShareEvent(visitor,{eventId:randomUUID(),eventName:"pairing_benefit_viewed",surface:"result",channel:"unknown",resultId:result.id},"zh");
    expect((await sql`select eligibility_at_event from share_events where owner_result_id=${result.id}`)[0].eligibility_at_event).toBe("locked");
  });
  it("repair is explicit/idempotent, rejects repeat purchase, and preserves an existing entitlement",async()=>{
    const o=await owner(), id=randomUUID(), at=new Date('2026-09-01T00:00:00Z');
    await sql`insert into orders(id,visitor_id,result_id,amount_fen,provider,channel,status,paid_at,expires_at) values(${id},${o.visitor},${o.id},690,'mock','mock','paid',${at},${at})`;
    expect(await getPairingEligibility(o.id,o.visitor)).toBe("syncing");
    expect((await sql`select unlocked_at from results where id=${o.id}`)[0].unlocked_at).toBeNull();
    await expect(createOrder({visitorId:o.visitor,resultId:o.id,userAgent:null,clientIp:"127.0.0.1"})).rejects.toMatchObject({code:"PAIRING_ENTITLEMENT_SYNCING"});
    await Promise.all([reconcilePaidResult(o.id,o.visitor),reconcilePaidResult(o.id,o.visitor)]);
    expect(await getPairingEligibility(o.id,o.visitor)).toBe("eligible");
    const original=(await sql`select unlocked_at,unlock_order_id from results where id=${o.id}`)[0];
    await reconcilePaidResult(o.id,o.visitor);
    expect((await sql`select unlocked_at,unlock_order_id from results where id=${o.id}`)[0]).toEqual(original);
    expect(original.unlock_order_id).toBe(id);
    // Every completed questionnaire can be unlocked (2026-09-21), near-even ones included.
    const balanced=await owner(false,randomUUID(),true);
    expect(await getPairingEligibility(balanced.id,balanced.visitor)).toBe("locked");
    await sql`update results set unlocked_at=now() where id=${balanced.id}`;
    expect(await getPairingEligibility(balanced.id,balanced.visitor)).toBe("eligible");
  });
  it("independent invite withdrawal racing join leaves no readable content, only management metadata",async()=>{
    for(let n=0;n<3;n++){
      const host=await owner(true),guest=await owner(true),invitation=await invite(host);
      const settled=await Promise.allSettled([join(guest,invitation.item.token),revokeComparisonInvitation(invitation.item.id,host.visitor)]);
      expect(settled[1].status).toBe("fulfilled");
      if(settled[0].status==='fulfilled') expect(await getOwnedComparison(settled[0].value.item.id,guest.visitor)).toBeNull();
      const list=await listOwnedComparisons(guest.visitor); expect(JSON.stringify(list.items)).not.toMatch(/hostSnapshot|guestSnapshot|outputSnapshot/);
    }
  });
  it("paid exposure cohorts use mature windows and exclude late and mock revenue",async()=>{
    const day=86400000,now=new Date(),start=new Date(+now-40*day).toISOString().slice(0,10),end=now.toISOString().slice(0,10);
    const report=async()=>JSON.parse((await promisify(execFile)(process.execPath,["--import","tsx","scripts/report-share-growth.ts","--start",start,"--end",end],{env:{...process.env,SHARE_GROWTH_DATABASE_URL:url}})).stdout);
    const before=await report();
    const mature=await owner(),observing=await owner();
    for(const [o,days] of [[mature,20],[observing,3]] as const){
      const at=new Date(+now-days*day);
      for(const [eventName,offset] of [["pairing_benefit_viewed",0],["pairing_checkout_opened",.2]] as const){
        const id=randomUUID();await recordShareEvent(o.visitor,{eventName,eventId:id,resultId:o.id,surface:eventName==='pairing_benefit_viewed'?'result':'payment_sheet',channel:'unknown'},'zh');
        await sql`update share_events set occurred_at=${new Date(+at+offset*day)} where id=${id}`;
      }
      for(const [provider,amount,delay] of [["wechat",690,1],["mock",10000,2],["wechat",999,8]] as const){
        await sql`insert into orders(id,visitor_id,result_id,amount_fen,currency,provider,channel,status,paid_at,expires_at) values(${randomUUID()},${o.visitor},${o.id},${amount},'CNY',${provider},${provider==='mock'?'mock':'jsapi'},'paid',${new Date(+at+delay*day)},${new Date(+at+delay*day)})`;
      }
    }
    const after=await report();
    expect(after.purchase_funnel.real_purchase_7d.denominator-before.purchase_funnel.real_purchase_7d.denominator).toBe(1);
    expect(after.purchase_funnel.real_purchase_7d.numerator-before.purchase_funnel.real_purchase_7d.numerator).toBe(1);
    expect(after.purchase_funnel.real_purchase_7d.observing_count-before.purchase_funnel.real_purchase_7d.observing_count).toBe(1);
    const money=(r:typeof after)=>Number(r.pairing_revenue.currencies_and_statuses.find((x:{currency:string;status:string})=>x.currency==='CNY'&&x.status==='paid')?.amount_minor??0);
    expect(money(after)-money(before)).toBe(690);
  });

});
