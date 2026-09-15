# 隔离本地数据库验证

日期：2026-09-15。仅新建临时测试实例，未读取或连接现有 DATABASE_URL，未改生产数据库。

## 实例

- PostgreSQL：本机 Homebrew 工具。
- 数据目录：`/tmp/mirror-share-pg.DeQn49/data`
- 日志：`/tmp/mirror-share-pg.DeQn49/postgres.log`
- 监听：仅 `127.0.0.1:55439`；socket 目录 `/tmp/mirror-share-pg.DeQn49`。
- 测试用户、数据库：均为 `mirror_share_test`，无密码，临时本地 trust 认证。
- 明确的非秘密测试连接：`postgres://mirror_share_test@127.0.0.1:55439/mirror_share_test`。
- 实例保持运行，供后续构建/e2e/事务测试使用。无需修改 `.env`。

## 实际执行

```sh
mktemp -d /tmp/mirror-share-pg.XXXXXX
initdb -D /tmp/mirror-share-pg.DeQn49/data --username=mirror_share_test --auth=trust --encoding=UTF8 --locale=C
pg_ctl -D /tmp/mirror-share-pg.DeQn49/data -l /tmp/mirror-share-pg.DeQn49/postgres.log -o '-h 127.0.0.1 -p 55439 -k /tmp/mirror-share-pg.DeQn49' start
psql -h 127.0.0.1 -p 55439 -U mirror_share_test -d postgres -v ON_ERROR_STOP=1 -c 'CREATE DATABASE mirror_share_test'
npm run db:generate
DATABASE_URL=postgres://mirror_share_test@127.0.0.1:55439/mirror_share_test npm run db:migrate
npx vitest run tests/unit/share-policy.test.ts tests/unit/share-analytics-url.test.ts
```

首次 sandbox 内 initdb 因共享内存 EPERM 失败且自行删除不完整 data 目录；使用明确的本地动作升级权限后初始化成功。普通 sandbox TCP 连接同样 EPERM；数据库相关后续命令须以 `require_escalated` 执行。自动审核批准了本次本地初始化、启动、创建测试库和迁移，没有人工确认阻塞。

## 结果

- `npm run db:generate` 成功生成 `drizzle/0004_flippant_brother_voodoo.sql`、对应 snapshot 和 journal 更新。
- 人工审阅 SQL：只新增六张分享/双人/归因/事件/限流表及其外键、唯一约束、索引；未 ALTER 原 results/orders。
- 全部迁移在空测试库成功应用（`Migrations applied`）。
- 新增两组纯规则测试：32 项全部通过。覆盖精确三选三、禁止客户端权限/快照字段、独立同意、token 格式、幂等摘要、同源、UTF-8 实际字节限制、HMAC 限流桶、预取排除、事件白名单、中英文/内部 zh token 路由和 query/referrer 脱敏。
- 这些纯测试不替代真实 owner 权限、事务并发、归因 savepoint、浏览器与图片验收；由主执行流程继续完成。

## 完成后可手工停止

仅在后续测试全部结束后：

```sh
pg_ctl -D /tmp/mirror-share-pg.DeQn49/data stop -m fast
```

本记录不自动删除测试数据。
