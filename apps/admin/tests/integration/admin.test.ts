import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { filters } from "../../src/lib/filters";
import { overview, orderList, traffic, visitorList } from "../../src/lib/data";
import { consumeLoginAttempt, readOnly, adminDb } from "../../src/lib/db";
const url = process.env.ADMIN_TEST_DATABASE_URL;
if (!url) throw new Error("ADMIN_TEST_DATABASE_URL must point to an isolated, migrated test database");
process.env.ADMIN_DATABASE_URL = url;
const sql = postgres(url, { max: 1 }); const visitor = randomUUID(); const result = `admin-test-${randomUUID()}`;
const orderIds = Array.from({ length: 4 }, () => `M20300101${randomUUID().replaceAll("-", "").slice(0, 22).toUpperCase()}`);
const f = filters({ start: "2030-01-01", end: "2030-01-02" });
beforeAll(async () => {
  await sql`insert into visitors (id) values (${visitor})`;
  await sql`insert into results (id, visitor_id, answers, type, values, balanced, created_at) values (${result}, ${visitor}, '[]', 'INFJ', '{50,50,50,50}', '{true,true,true,true}', '2030-01-01T00:00:00Z')`;
  for (let i = 0; i < orderIds.length; i++) await sql`insert into orders (id, visitor_id, result_id, amount_fen, currency, provider, channel, status, paid_at, expires_at, created_at) values (${orderIds[i]}, ${visitor}, ${result}, ${i === 2 ? 690 : 550}, ${i === 2 ? "USD" : "CNY"}, ${i === 1 ? "mock" : "waffo"}, ${i === 1 ? "mock" : "card"}, ${i === 3 ? "created" : "paid"}, ${i === 3 ? null : new Date("2030-01-01T00:00:00Z")}, '2030-01-03', '2030-01-01T00:00:00Z')`;
  await sql`insert into browser_events (id, visitor_id, path, locale, device, created_at) values (${randomUUID()}, ${visitor}, '/zh/result/[id]', 'zh', 'phone', '2030-01-01T00:00:00Z')`;
});
afterAll(async () => {
  await sql`delete from browser_events where visitor_id = ${visitor}`;
  await sql`delete from telegram_outbox where order_id in ${sql(orderIds)}`;
  await sql`delete from orders where visitor_id = ${visitor}`;
  await sql`delete from results where visitor_id = ${visitor}`;
  await sql`delete from visitors where id = ${visitor}`;
  await sql.end(); await adminDb().end();
});
describe("admin database and transactional notifications", () => {
  it("separates mock orders and real currency totals", async () => {
    const data = await overview(f);
    expect(data.totals.mock).toBe(1); expect(data.totals.orders).toBe(4); expect(data.totals.visitors).toBe(1);
    expect(Number(data.revenue.find(r => r.currency === "CNY")?.amount)).toBe(550);
    expect(Number(data.revenue.find(r => r.currency === "USD")?.amount)).toBe(690);
  });
  it("filters orders and safely matches an exact support credential", async () => {
    expect((await orderList({ ...f, query: orderIds[3] })).rows[0].status).toBe("created");
    expect((await orderList({ ...f, query: "' OR true --" })).rows).toHaveLength(0);
    expect((await orderList({ ...f, provider: "mock" })).total).toBe(1);
  });
  it("reads route templates and per-visitor browsing", async () => {
    expect((await traffic(f, visitor)).recent[0].path).toBe("/zh/result/[id]");
    expect((await visitorList(f, visitor)).rows[0].views).toBe(1);
  });
  it("queues inserts and state changes once, never queues rolled-back changes", async () => {
    expect((await sql`select * from telegram_outbox where order_id = ${orderIds[3]}`).length).toBe(1);
    await sql`update orders set status = 'paid', paid_at = '2030-01-01T01:00:00Z' where id = ${orderIds[3]}`;
    await sql`update orders set status = 'paid' where id = ${orderIds[3]}`;
    expect((await sql`select * from telegram_outbox where order_id = ${orderIds[3]}`).length).toBe(2);
    await expect(sql.begin(async tx => { await tx`update orders set status = 'refunded' where id = ${orderIds[3]}`; throw new Error("rollback"); })).rejects.toThrow("rollback");
    expect((await sql`select * from telegram_outbox where order_id = ${orderIds[3]}`).length).toBe(2);
  });
  it("enforces a database-backed login throttle and read-only business transactions", async () => {
    await sql`delete from admin_login_attempts where bucket = 'single-admin'`;
    const attempts = await Promise.all(Array.from({ length: 31 }, () => consumeLoginAttempt()));
    expect(attempts.filter(a => a.allowed)).toHaveLength(30);
    await expect(readOnly(async tx => { await tx`update orders set amount_fen = 1 where id = ${orderIds[0]}`; })).rejects.toMatchObject({ code: "25006" });
    await sql`delete from admin_login_attempts where bucket = 'single-admin'`;
  });
});
