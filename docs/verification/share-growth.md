# 分享与双人提示实施验证

日期：2026-09-15。P0 与 P1 已完成本地实施与验证；没有提交或部署。

## 基线与范围

- 基线保存在 `share-growth/baseline.json`；保留原有品牌、英文 logo、GA4、页头导航等未提交改动。
- 按磁盘最新 AGENTS.md 实施；手机页头使用无 tagline 的品牌和“更多”导航。未改题库、计分、旧草稿结构、sample/paid架构、支付或恢复授权。
- 先读实施规格和安装版 Next.js Cache Components、Server/Client Components、Route Handlers、loading、ImageResponse 文档。使用既有 Drizzle、Radix/Vaul、WAAPI、Satori、QRCode，无新增动画库/分析SDK/图片服务。

## 分步状态与证据

| 步骤 | 实施与验证 |
| --- | --- |
| P0-01 | 四维候选、默认三选、双语内容和严格公开DTO；清晰/部分均衡/全均衡/四问卷纯测试通过。 |
| P0-02 | 192bit token、服务端本人结果生成快照、owner API、幂等、撤销、限流、同源/字节上限。迁移0004在隔离本地库执行。安全规则、真实权限和撤销API浏览器测试通过。 |
| P0-03 | SSR好友页、PNG/OG、完整metadata、robots/no-store/no-referrer、字体子集。实际检查中文/英文PNG和OG；二维码已解码。关闭字段从snapshot缺省，公开HTML/RSC无原resultId及未公开字段；撤销后PNG/OG不可读。 |
| P0-04 | 结果本人入口、响应式编辑、公开开关、预览、PNG保存意图、复制成功/手动降级、我的分享。快速选择、PNG失败、Clipboard失败、正常复制、全均衡公开已测试；创建中关闭后可从管理页找回且仅一份记录，已通过。 |
| P0-05 | 首次有效可见触达7日窗口、复用quiz_start触发点、自有数据库首次结果归因。真实SQL错误触发savepoint回滚且results成功提交；重测不补领；并发只有一条首次归因。只读统计和dry-run维护已用成熟队列fixture验证。 |
| P0-06 | 单次有限动画、快速操作、中断、reduce/print/noJS完整状态；320/720/721无横向溢出。UI行为与截图一起验收。 |
| P1-01 | 确定性三段沟通提示、跨版本、全均衡、无共同点/无差异组合测试通过，无匹配率/分数比较。 |
| P1-02 | 独立host consent、guest consent、双方visitor权限、固定share→invitation→pair锁序、幂等、过期只禁新加入。真实DB十项含8轮join/revoke竞争通过。 |
| P1-03 | 公开邀请、本人已有结果选择、正常结果后单独确认、双方页、管理回访、任一方撤回。中英文/跨语言浏览器授权流程通过。 |
| P1-04 | 面板汇合与三段依次出现，按实际WAAPI次数验证；reduce/print/noJS通过。真实32题流程在localStorage/sessionStorage抛错及统计请求断网时仍能正常完成并单独授权。 |

## 已执行检查

- `npm run typecheck`：通过。
- `npm run lint`：通过。旧`.cache`生成文件曾被误扫描，已仅追加忽略，不删除缓存。
- `npm test`：19 files / 229 tests 通过。
- `APP_URL=http://localhost:3000 npm run build`：通过；显式提供本地测试DB和测试SESSION_SECRET，GA measurement ID为空，未发送真实GA统计。
- `npm run db:generate`、`npm run db:migrate`：迁移0004成功，见 [本地数据库记录](share-growth/local-db.md)。仅新增六表/约束/索引，不变更旧results/orders表。
- `TEST_SHARE_DATABASE_URL=… npx vitest run --config vitest.share-integration.config.mts`：10/10通过；测试限制连接专用loopback库。
- 补充最终失效页/英文管理页截图的对应e2e：14/14通过，记录`evidence-final.log`。
- 最终完整e2e：132 passed / 4 skipped / 0 failed（1.5分钟）。4项skip是原有手机/桌面专属条件，无新功能跳过。早期新增测试误用旧API请求body，修正为既有`{answers:number[]}`后通过；业务API未为测试改变。
- 早期浏览器失败曾定位并修复：Satori Fragment造成PNG列布局错误；hydration在首帧前清除动画；无JS时React流式隐藏容器；测试读取动画次数早于客户端挂载。另一次并行测试覆盖共同trace目录，后续全部使用独立输出目录。

## 图片与截图

目录：[share-growth/](share-growth/)。测试使用393×852、1363×936，设备像素比使手机PNG物理像素为1179×2556；另有320/720/721布局证据。

- `entry-{zh,en}-{mobile,desktop}.png`、`editor-{zh,en}-{mobile,desktop}.png`、`created-{zh,en}-{mobile,desktop}.png`。
- `friend-{zh,en}-{mobile,desktop}.png`、`management-{zh,en}-{mobile,desktop}.png`、`closed-{zh,en}-{mobile,desktop}.png`、`created-fallback-{mobile,desktop}.png`。
- `host-consent-*`、`invitation-*`、`guest-consent-*`、`pair-*`：双语双方同意和提示。
- `breakpoint-*`、`print-*`、`no-js-*`：响应式与降级。
- `guide-{zh,en}.png`（960×1280）、`og-{zh,en}.png`（1200×630）。人工查看实际字体与布局，不只检查尺寸。
- `qr-decode.txt`为本机Vision真实解码结果；对应`guide-*.expected-url.txt`由测试输出，最终逐一核对完全一致，均仅含正确公开URL，无query/resultId。Swift本机SDK不匹配，改用Objective-C调用同一Vision框架成功；未新增项目依赖。

## 统计与维护

命令要求显式 `SHARE_GROWTH_DATABASE_URL`，不自动读取通用DATABASE_URL：

```sh
SHARE_GROWTH_DATABASE_URL='<明确的只读或测试连接>' node --import tsx scripts/report-share-growth.ts --start 2026-09-01 --end 2026-09-15 --format json
SHARE_GROWTH_DATABASE_URL='<明确的维护连接>' node --import tsx scripts/cleanup-share-growth.ts
# 确认dry-run数量后人工执行：同命令追加 --apply
```

报告输出成熟与观察中队列、分子分母、7日首次完成推荐、14日分享种子推荐、下一代、真实付费（排除mock）和CNY/USD分别金额。只读事务，超90日范围拒绝；维护默认dry-run，事件90日、归因窗口结束180日、限流2日，不删除分享/对照/结果/订单。没有创建自动任务。

限制：归因单位是签名浏览器，不是真实人数，不证明因果增量；失败触达不追补。过期未完成窗口可被新窗口覆盖，当前表不能恢复被覆盖的旧窗口分母，报告明确标记基于保留窗口的条件统计，不能把它解释为完整历史转化率。业务分享/创建事实不依赖已清理事件。

## 环境与未验证项

- 仅隔离Postgres `127.0.0.1:55439`，详细启动/迁移见local-db.md。没有读取或迁移未知生产库。
- 用户原有3000端口服务保留。本任务使用 `HOSTNAME=localhost PORT=3017 APP_URL=http://localhost:3017`。HOSTNAME=127.0.0.1会使当前Next本机URL规范化形成rewrite循环，统一localhost后正常。
- 微信公众号配置、iOS/Android微信内预览/长按保存尚未真机核验；`WECHAT_SHARE_ENABLED=false`。普通浏览器保存/复制不依赖SDK，不把复制、下载或配置成功称为真实分享成功。
- 本地GA能力路由经过URL清洗并停用Google采集；有效measurement ID下也有单测验证停用标记先于config且不注入脚本。未向真实GA后台发送测试事件。
- 多次额度不足曾中断代理和自动审批；已按用户继续指令恢复，失败不记为通过。
