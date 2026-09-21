# 付费双人相处指南：实施与验证记录

开始：2026-09-17。更新：2026-09-21。**PP-01～PP-06 本地实施与验收完成。本任务未提交、未部署。**

产品合同：[产品规格](../plans/paid-pairing-product.md) · [流程图](../plans/paid-pairing-flow.md) · [截图索引](paid-pairing/screenshots.md)。

## 1. 最终产品规则

- 免费单人相处说明书保留。新双人指南要求**双方分别解锁本次所选的具体结果**，历史已购结果直接可用，不能借用另一份报告的资格。
- 从结果、完整报告、我的报告和「我的双人指南」直接邀请，无需先生成公开单人卡。付款、保存续接、订单恢复都不能替代双方各自的明确同意。
- 遵循用户最新 AGENTS：测试前公开介绍价值和虚构示例，不出现购买提示；本人完成测试后、支付前明确说明费用及双方权益要求。
- 好友先看正常个人结果，再决定购买和参与。支付返回可继续指定邀请；多个待办由本人选择。邀请失效不损失个人报告，不自动换人或复活邀请。
- 新指南冻结三段沟通提示，含开口例句和小约定；无匹配率、分数比较或关系结论。旧免费指南继续由原双方阅读与撤回，旧邀请停止新增。

## 2. 实施进度

| 步骤 | 交付 | 验证 |
| --- | --- | --- |
| PP-01 服务端权益与兼容 | 统一只读权益判定、显式修复 paid 状态、独立邀请、192bit token、幂等、锁序和撤回 | 真实隔离库权限矩阵、并发与旧数据升级演练通过 |
| PP-02 内容与示例 | compare-v2 中英三段、例句与实践；正式生成器与阅读组件共用；v1 原样保留 | 27项内容/SSR测试，双语各6,561种类别组合；见 [content.md](paid-pairing/content.md) |
| PP-03 付款前介绍 | 公开 /pairing、正常结果权益预览、支付面板明确费用；全均衡未购不售卖 | 中英、sample、免费阅读与服务端直接请求检查通过 |
| PP-04 付款后入口 | 已购结果单一 Dock、完整报告紧凑入口、关系章入口、我的报告、配对中心 | 主要页面双语截图、320px与720/721px检查通过 |
| PP-05 好友支付与续接 | 服务端意图、跨语言原测验、正常结果、付款返回、独立同意、多邀请与身份恢复 | 真实32题闭环、存储不可用、统计失败、订单恢复和多邀请选择通过 |
| PP-06 统计与交付 | 7日首次归因、独立邀请来源、最小事件、成熟窗口报表、迁移与说明文档 | SQL savepoint故障隔离、mock排除、CNY/USD分开、PNG/QR及回归通过 |

关键代码：`src/lib/pairing-eligibility.ts`、`comparisons.ts`、`comparison-continuations.ts`、`share-analytics.ts`；`src/components/pairing/`；`drizzle/0006_soft_king_bedlam.sql`。统计口径见 [analytics.md](../analytics.md)。

## 3. 实际验证结果

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| typecheck | 通过 | [typecheck.log](paid-pairing/typecheck.log) |
| lint | 通过 | [lint.log](paid-pairing/lint.log) |
| unit | 22文件、263项通过 | [unit.log](paid-pairing/unit.log) |
| build | Next.js 16.3.4 standalone构建通过 | [build.log](paid-pairing/build.log) |
| 数据库集成 | 2文件、19项通过 | [integration.log](paid-pairing/integration.log) |
| 全量浏览器覆盖及失败补跑 | 150项配置用例最终覆盖：146通过、4按平台跳过，过程如下 | [全量日志](paid-pairing/e2e-release.log)、[2项补跑](paid-pairing/e2e-report-final.log) |
| 最后布局修复的相关回归 | 64通过、2按平台跳过 | [e2e-visual-final.log](paid-pairing/e2e-visual-final.log) |
| 迁移与旧行回填 | 0000～0006 hash一致；旧行策略与冻结内容保留，新默认正确 | [migration.log](paid-pairing/migration.log) |
| 实际PNG与二维码 | 中英960×1280，各一个QR，目标与预期完全一致 | [png-qr.json](paid-pairing/png-qr.json)、[图片](paid-pairing/screenshots.md#png-与二维码) |
| 差异空白检查 | git diff --check通过 | 工作树检查 |

**浏览器结果的读取方式：**最后一轮全量日志记录144通过、2失败、4跳过；两项失败均是测试选择器同时命中 Next 保留的隐藏旧页面。改为只检查当前可见续接区域后，两个用例全部补跑通过，未改变业务实现来绕过断言。随后发现并修复英文手机章节标签重叠、截图过早捕获加载占位的问题，再运行相关66项（64通过、2平台跳过）。因此不将任何含失败的单次日志称为「一次全量全绿」。早期 e2e.log、e2e-recheck.log 等仅保留排障历史。

4项平台跳过为：手机项目中的两种桌面对话框检查，以及桌面项目中的两项手机标题栏检查；相应目标平台均有执行记录。

复跑入口（数据库参数须保持为明确隔离测试库）：

```sh
npm run typecheck
npm run lint
npm test
DATABASE_URL=<本地隔离测试库> APP_URL=http://localhost:3017 PAYMENT_PROVIDER=mock EN_PAYMENT_PROVIDER=mock npm run build
TEST_SHARE_DATABASE_URL=<本地隔离测试库> npx vitest run --config vitest.share-integration.config.mts
E2E_BASE_URL=http://localhost:3017 npx playwright test --workers=2
```

## 4. 隐私、安全与回归结论

- 创建和加入均按签名访客及对应结果重新检查；覆盖双方已购/未购四组合、跨结果借权、第三人、无权API、旧同意版本、幂等冲突与并发撤回。
- 公开页面仅输出同意的冻结信息，不输出原resultId、订单、分数、答案；第三人持指南链接也不能读取。P0关闭的可选字段从快照缺省，HTML/RSC/图片检查保留。
- 迁移在同一隔离PostgreSQL实例内分别验证空库应用与旧结构含记录升级。原邀请/指南回填legacy-free-v1，新默认paid-pair-v2，冻结正文不变。
- 本人结果的首次归因、续接事件均以保存点隔离统计错误；不会让有效结果主事务失败，也不会由后续重测冒领首次完成。
- 自有DB为归因事实源，GA不采集能力链接和结果内容；复制/下载只代表操作，不代表真实发送。真实收入排除mock，按币种分开。
- 保留题库、计分、旧数组API、版本草稿、sample/paid结构、订单恢复和支付供应商验证；既有GA初始化及事件不重复。

## 5. 动画和视觉收尾

- 默认完整静态内容，有限WAAPI只增强；按钮与固定底栏位于动画祖先外。实际检测开始、完成、不重播、减少动态效果切换与打印；无JS可正常阅读服务器已授权内容。
- 付款成功后手机抽屉/桌面对话框切换仍保留成功操作，不退回付款按钮。邀请失效时清楚提示，仍可阅读已购报告。
- 报告顶部改为紧凑邀请入口；多条续接放在阅读区域后。中英报告主标题仍出现在393×852及1363×936首屏内。
- 英文手机四列章节名称正常换行、保留完整名称；中文布局不变。320px截图等待真实结果加载，未用骨架屏证明布局通过。
- 人工对照原设计的纸色、黑色报告、品牌与正文结构；已逐项查看支付成功、窄屏、报告首屏、双语PNG。完整证据见 [截图索引](paid-pairing/screenshots.md)。
- 本次没有更改OG图片字体或其画面文案，继续使用已存在的本地字体；实际导出PNG已检查字形及排版。

## 6. 环境与交付边界

- 起始基线见 [baseline.json](paid-pairing/baseline.json)。用户中途保存工作快照并合入Waffo；收尾HEAD为2323f4e。保留品牌、英文logo、GA4、Waffo及最新免费表述；本任务没有reset、commit或deploy。
- 测试服务为localhost:3017，隔离PostgreSQL仅监听127.0.0.1:55439。主测试库mirror_share_test，升级演练库mirror_pairing_upgrade_20260919。真实开发库localhost:5432/mirror仅只读核对迁移，没有写测试数据。详细记录见 [environment.md](paid-pairing/environment.md)。
- **未验证：**真实微信H5/JSAPI/SDK与微信真机、实际链上钱包支付、Waffo真实扣款。本地付款使用mock；微信可选分享配置保持默认关闭。本地通过不代表已上线或真实渠道验收。
- 实施无剩余阻塞。后续发布及真实渠道验收是独立操作，本任务不自动执行。
