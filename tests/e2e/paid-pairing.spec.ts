import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import { getQuestionnaire } from "../../src/lib/questionnaires";
import { pairingUiMessages } from "../../src/lib/i18n/messages/pairing-ui";
import { pairingMessages } from "../../src/lib/i18n/messages/pairing";
const origin=process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const evidence='docs/verification/paid-pairing';
async function seed(request:APIRequestContext,en=false){
 await request.get(en?'/en':'/'); const q=getQuestionnaire(en?'en32-v1':'legacy32-v1')!;
 const res=await request.post('/api/results',{data:{questionnaireId:q.id,answers:q.questions.map(x=>({questionId:x.id,value:x.reverse?-2:2}))}});
 expect(res.status()).toBe(201); return (await res.json()).data.id as string;
}
async function pay(request:APIRequestContext,id:string){const r=await request.post('/api/orders',{headers:{origin},data:{resultId:id}});expect(r.ok()).toBe(true);const oid=(await r.json()).data.id;expect((await request.post(`/api/orders/${oid}/mock-pay`,{headers:{origin}})).ok()).toBe(true);return oid;}
async function shot(page:Page,name:string){
 await mkdir(evidence,{recursive:true});
 const inDialog=await page.getByRole('dialog').isVisible();
 await expect.poll(()=>page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length)).toBe(0);
 await page.screenshot({path:`${evidence}/${name}.png`,fullPage:!inDialog});
}
for(const en of [false,true])test(`paid invitation → own overview → payment → independent consent ${en?'en':'zh'}`,async({page,browser},info)=>{
 const locale=en?'en':'zh', prefix=en?'/en':'',m=pairingUiMessages[locale],p=pairingMessages[locale];const host=await seed(page.request,en);
 const inviteInput={resultId:host,requestId:randomUUID(),consentVersion:'compare-host-v2'};
 const denied=await page.request.post('/api/comparison-invitations',{headers:{origin},data:inviteInput});expect(denied.status()).toBe(403);
 await page.goto(`${prefix}/result/${host}`);await expect(page.locator('[data-pairing-benefit="preview"]')).toBeVisible();await shot(page,`benefit-${locale}-${info.project.name}`);
 await pay(page.request,host);await page.reload();await expect(page.locator('[data-pairing-benefit="unlocked"]')).toBeVisible();await expect(page.getByRole('button',{name:/解锁报告与|Unlock report|Unlock & pair/})).toHaveCount(0);await shot(page,`paid-entry-${locale}-${info.project.name}`);
 const created=await page.request.post('/api/comparison-invitations',{headers:{origin},data:inviteInput});expect(created.status()).toBe(201);const invite=(await created.json()).data;
 const guest=await browser.newContext({baseURL:origin,viewport:page.viewportSize()!});const g=await guest.newPage();await g.goto(new URL(invite.url).pathname);expect(await g.locator("body").innerText()).not.toMatch(/付费|解锁|订阅|续费|\bpaid\b|\bunlock|\bsubscription\b|[¥$]\s?\d/i);
 const own=await seed(guest.request,en);await g.goto(`${prefix}/t/${invite.token}/join`);await g.getByRole('button',{name:m.choose}).click();await g.waitForURL(new RegExp(`/result/${own}`));await expect(g.locator('[data-pairing-continuations]')).toBeVisible();
 // Storage cannot authorize, and blocked storage cannot lose the server continuation.
 await g.addInitScript(()=>{for(const s of [localStorage,sessionStorage]){s.clear();Object.defineProperty(s,'setItem',{value:()=>{throw new Error('blocked');}});}});await g.reload();
 await g.getByRole('button',{name:/解锁报告与|Unlock report|Unlock & pair/}).filter({visible:true}).first().click();await expect(g.getByRole('dialog')).toContainText(p.feeRule);await g.getByRole('button',{name:en?/^Demo payment \$/:/模拟支付 ¥/}).click();
 await expect(g.locator('[data-pairing-access="eligible"]')).toBeVisible();
 // Switching between the dialog and drawer must not return a paid buyer to checkout.
 const originalViewport=g.viewportSize()!;
 await g.setViewportSize({width:originalViewport.width>720?393:1363,height:originalViewport.height});
 await expect(g.getByRole('dialog').locator('[data-pairing-access="eligible"]')).toBeVisible();
 await expect(g.getByRole('button',{name:en?/^Demo payment \$/:/模拟支付 ¥/})).toHaveCount(0);
 await g.setViewportSize(originalViewport);
 await expect(g.getByRole('dialog').locator('[data-pairing-access="eligible"]')).toBeVisible();
 await shot(g,`payment-ready-${locale}-${info.project.name}`);await g.getByRole('dialog').getByRole('link',{name:m.continue,exact:true}).click();await g.waitForURL(/\/join\?result=/);
 const consent=g.locator('[data-compare-consent="guest"]');await expect(consent.getByRole('checkbox')).not.toBeChecked();await expect(consent.getByRole('button',{name:p.guestAgree})).toBeDisabled();await consent.getByRole('checkbox').check();await consent.getByRole('button',{name:p.guestAgree}).click();await g.waitForURL(/\/compare\//);await expect(g.locator('[data-compare-motion="section"]')).toHaveCount(3);
 const resultPage=await guest.request.get(`${prefix}/result/${own}`);expect(await resultPage.text()).not.toContain('data-pairing-continuations');
 await g.goto(`${prefix}/my/pairing`);await expect(g.locator('[data-comparison-manager] a[href*="/compare/"]')).toBeVisible();await shot(g,`center-history-${locale}-${info.project.name}`);
 await guest.close();
});

test('pairing page, narrow widths, no-JS, print and reduced motion',async({page,browser},info)=>{
 for(const en of [false,true]){
  const prefix=en?'/en':'',m=pairingUiMessages[en?'en':'zh'];
  await page.goto(`${prefix}/pairing`);expect(await page.locator("body").innerText()).not.toMatch(/付费|解锁|订阅|续费|\bpaid\b|\bunlock|\bsubscription\b|[¥$]\s?\d/i);await expect(page.getByRole('link',{name:m.start,exact:true})).toBeVisible();await shot(page,`introduction-${en?'en':'zh'}-${info.project.name}`);
  for(const width of [320,390,720,721]){await page.setViewportSize({width,height:width===390?749:852});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await shot(page,`intro-${en?'en':'zh'}-${width}-${info.project.name}`);}
  await page.emulateMedia({reducedMotion:'reduce'});await page.reload();for(const el of await page.locator('[data-pairing-reveal]').all()){await expect(el).toHaveCSS('opacity','1');expect(await el.evaluate(x=>x.getAnimations().length)).toBe(0);}
  await page.emulateMedia({media:'print'});await expect(page.getByRole('heading',{name:m.stepsTitle})).toBeVisible();await page.emulateMedia({media:'screen'});
  const plain=await browser.newContext({baseURL:origin,javaScriptEnabled:false});const doc=await plain.newPage();await doc.goto(`${prefix}/pairing`);await expect(doc.getByRole('link',{name:m.start,exact:true})).toBeVisible();await expect(doc.getByRole('heading',{name:m.stepsTitle})).toBeVisible();await plain.close();
 }
});

test('owner-only access, strict continuation inputs and closed invite keep personal report',async({page,browser})=>{
 const host=await seed(page.request);await pay(page.request,host);const invite=(await (await page.request.post('/api/comparison-invitations',{headers:{origin},data:{resultId:host,requestId:randomUUID(),consentVersion:'compare-host-v2'}})).json()).data;
 const guest=await browser.newContext({baseURL:origin});const own=await seed(guest.request);const body={invitationToken:invite.token,resultId:own};
 expect((await guest.request.get(`/api/pairing-access?resultId=${host}`)).status()).toBe(404);
 expect((await guest.request.post('/api/comparison-continuations',{headers:{origin:'https://example.org'},data:body})).status()).toBe(403);
 expect((await guest.request.post('/api/comparison-continuations',{headers:{origin},data:{...body,unlocked:true}})).status()).toBe(400);
 expect((await guest.request.post('/api/comparison-continuations',{headers:{origin},data:body})).status()).toBe(200);
 await page.request.delete(`/api/comparison-invitations/${invite.id}`,{headers:{origin}});await pay(guest.request,own);
 expect((await guest.request.post('/api/comparisons',{headers:{origin},data:{...body,consentVersion:'compare-guest-v2'}})).status()).toBe(410);
 expect((await guest.request.get(`/report/${own}`)).status()).toBe(200);
 const access=(await (await guest.request.get(`/api/pairing-access?resultId=${own}`)).json()).data;expect(access.continuations).toEqual([]);expect(access.unavailableInvitation).toBe(true);
 await guest.close();
});


test('result docks fit phone breakpoints',async({page},info)=>{
 if(info.project.name!=='mobile')return;
 for(const en of [false,true]){
  const prefix=en?'/en':'',id=await seed(page.request,en);
  await page.goto(`${prefix}/result/${id}`);
  await expect(page.locator('[data-pairing-benefit="preview"]')).toBeAttached();
  await expect(page.getByRole('heading',{level:1})).toBeVisible();
  for(const width of [320,390,720,721]){
   await page.setViewportSize({width,height:width===390?749:852});
   await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   if(width<721) {
    const unlock=page.locator('.fixed').getByRole('button',{name:/解锁报告与配对|Unlock & pair/});
    await expect(unlock).toBeVisible();
    const bounds=await unlock.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(width);
   }
   await shot(page,`result-${en?'en':'zh'}-${width}-locked`);
   if(width===320)await page.screenshot({path:`${evidence}/result-${en?'en':'zh'}-320-top.png`});
  }
  await pay(page.request,id);await page.reload();await page.setViewportSize({width:320,height:852});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const invite=page.locator('.fixed a').filter({hasText:en?'Invite':'邀请'});await expect(invite).toBeVisible();
  const box=await invite.boundingBox();expect(box!.x+box!.width).toBeLessThanOrEqual(320);
  await shot(page,`result-${en?'en':'zh'}-320-paid`);
 }
});

test('empty center, report entry and recovered order retain separate invitations', async ({ page, browser }, info) => {
 for (const en of [false, true]) {
  const prefix=en?'/en':'', locale=en?'en':'zh', m=pairingUiMessages[locale];
  const guest=await browser.newContext({baseURL:origin, viewport:info.project.use.viewport});
  const g=await guest.newPage();
  await g.goto(`${prefix}/my/pairing`);
  await expect(g.locator('[data-comparison-manager]').getByText(m.emptyInvitations, {exact:true})).toBeVisible();
  await shot(g,`center-empty-${locale}-${info.project.name}`);
  const own=await seed(guest.request,en);
  const tokens:string[]=[];
  for(let i=0;i<2;i++) {
   const host=await seed(page.request,en);await pay(page.request,host);
   const response=await page.request.post('/api/comparison-invitations',{headers:{origin},data:{resultId:host,requestId:randomUUID(),consentVersion:'compare-host-v2'}});
   expect(response.status()).toBe(201);const invitation=(await response.json()).data;
   tokens.push(invitation.token);
   expect((await guest.request.post('/api/comparison-continuations',{headers:{origin},data:{invitationToken:invitation.token,resultId:own}})).ok()).toBe(true);
  }
  const orderId=await pay(guest.request,own);
  await guest.clearCookies();
  const restored=await guest.request.post('/api/reports/recover',{headers:{origin,'x-forwarded-for':`2001:db8:${randomUUID().slice(0,4)}::1`},data:{orderId}});
  expect(restored.status()).toBe(200);
  await g.goto(`${prefix}/pay/${orderId}`);
  await expect(g.getByRole('heading',{name:m.continueChoice})).toBeVisible();
  const links=g.locator('[data-pairing-continuations] a');
  await expect(links).toHaveCount(2);
  const urls=await links.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
  for(const token of tokens)expect(urls).toContain(`${prefix}/t/${token}/join?result=${own}`);
  await shot(g,`payment-multiple-${locale}-${info.project.name}`);
  await g.getByRole('link',{name:m.readReport,exact:true}).click();
  await expect(g).toHaveURL(new RegExp(`/report/${own}$`));
  await expect(g.locator('[data-pairing-benefit="unlocked"]').filter({visible:true}).first()).toBeVisible();
  const heading=await g.getByRole('heading',{level:1}).boundingBox();
  expect(heading!.y+heading!.height).toBeLessThan(g.viewportSize()!.height);
  if(info.project.name==='mobile') {
   for(const tab of await g.getByRole('tab').all())expect(await tab.evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true);
  }
  // Next keeps the prior route in a hidden Activity tree during client navigation.
  expect((await g.locator('[data-pairing-continuations]').filter({visible:true}).boundingBox())!.y).toBeGreaterThan(heading!.y);
  await shot(g,`report-entry-${locale}-${info.project.name}`);
  await g.screenshot({path:`${evidence}/report-top-${locale}-${info.project.name}.png`});
  const raw=await (await guest.request.get(`${prefix}/report/${own}`)).text();
  expect(raw).toContain('chapter-panel-3');
  await g.goto(`${prefix}/t/${tokens[1]}/join?result=${own}`);
  await expect(g.locator('[data-compare-consent="guest"] input')).not.toBeChecked();
  await guest.close();
 }
});
