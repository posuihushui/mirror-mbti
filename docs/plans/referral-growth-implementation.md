# 观己 mirror：分享传播与动画实施规格

日期：2026-09-15  
用途：交给 GPT-6 medium 执行；本文件是实施合同，不代表功能已完成。  
配套：[执行提示词](./referral-growth-execution-prompt.md)

## 0. 目标、范围和执行原则

用户已认可“我的相处说明书 → 好友参与 → 双人相处提示 → 好友生成自己的说明书”的产品方案，并明确要求加入动画。按以下顺序实施，不重新讨论产品方向。

| 阶段 | 完成的用户价值 | 必须包含 |
| --- | --- | --- |
| P0 | 用户能把自己选定的三条相处提示发出去；好友能完成自己的测试 | 公开快照、分享编辑与预览、PNG/链接、好友页、来源统计、管理与撤销、中英文、动画与验证 |
| P1 | 双方明确同意后获得三条沟通提示 | 独立对照邀请、选择已有结果或完成测试、双方权限、站内回访、撤回、中英文、动画与验证 |

P0 和 P1 是两次可独立验收的交付。默认执行提示词仅实施 P0；P1 在明确指定时执行。P0 的按钮不得承诺尚未实现的双人功能。

本次实现不涉及现金奖励、转发解锁、邀请人数任务、注册系统、微信群排行榜、匿名评价、AI 在线生成、付费双人报告。基础分享与双人提示免费；个人报告继续按现有规则收费。

首版匿名，不增加昵称、头像或任意自定义句子；用户从服务器提供的四条候选中选三条。这样可以把第一版重点放在生成质量、分享和互动闭环。昵称和自由编辑另立后续任务，不以“待完善”控件出现在首版。

### 0.1 当前工作树

本规格编写时，仓库已有品牌与英文 logo 的未提交修改，涉及 AGENTS.md、brand-logo、wordmark、app-header、OG、品牌脚本和 i18n 测试等；复核时还出现了正在新增的 GA4 统计文件 `src/instrumentation-client.ts`、`src/lib/analytics/*`、`src/components/analytics/*`。执行前重新检查 `git status --short`，记录基线；保留所有既有修改。以磁盘上的最新 AGENTS.md 为准，特别是英文 logo 已有独立尺寸和 `brandLogoWidth(locale, ...)`。

不重置、不覆盖这些修改，不自动提交或部署。实现所需常规编辑和本地验证直接完成。

### 0.2 先读这些资料

现有代码的权威入口（以下路径均相对仓库根目录）：

- `AGENTS.md`、`package.json`、`next.config.ts`。
- `src/app/[lang]/result/[id]/page.tsx`、`src/components/result/result-actions.tsx`。
- `src/lib/results.ts`、`src/lib/personality.ts`、`src/lib/preference-content.ts`。
- `src/app/api/results/route.ts`、`src/components/quiz/quiz.tsx`、`src/lib/questionnaires.ts`。
- `src/db/schema.ts`、`src/lib/session.ts`、`src/proxy.ts`。
- `src/lib/recovery-policy.ts`、`src/app/api/reports/recover/route.ts`：参考同源检查、限流、限制请求体的做法，不改变恢复功能。
- `src/components/site/responsive-sheet.tsx`、`src/components/ui/dialog.tsx`、`src/components/ui/drawer.tsx`。
- `src/components/result/radar-reveal.tsx`、`src/components/result/radar-motion.module.css`、`src/app/globals.css`。
- `src/components/site/wechat-share.tsx`、`src/app/api/wechat/jsconfig/route.ts`。
- `src/lib/i18n/locale.ts`、`src/lib/seo.ts`、`src/app/robots.ts`。
- `src/instrumentation-client.ts`、`src/lib/analytics/{events,track,url}.ts`、`src/components/analytics/*`（执行时如已存在）：复用既有事件入口，并先处理新私有URL的脱敏。
- `src/lib/og/fonts.ts`、`scripts/build-og-fonts.mjs`、现有结果 OG 文件。
- `tests/e2e/flow.spec.ts`、`motion.spec.ts`、`interaction-motion.spec.ts`、`i18n.spec.ts`、`playwright.config.ts`。

写代码前阅读安装版本的 Next.js 文档，不凭旧版经验关闭 Cache Components：

- `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/image-response.md`

已核实：结果链接现可公开显示免费画像；分享组件存在但未挂载；没有分享表或归因表。已有通用统计正在另一组工作中增加，不把本任务当作从零搭建全站统计。不能把现有结果接口当作新分享页的数据接口。

## 1. P0 用户流程与页面合同

### 1.1 结果页入口

仅对真实结果的所有者显示“生成我的相处说明书”，未付费、已付费、待探索结果均可使用。放在 `PreferenceReading` 之后、付费面板之前的新区域。非所有者和 sample 不出现创建入口。

- 标题：`把你认同的相处方式，整理成一张卡。`
- 说明：`选三条像你的描述，预览后再决定是否公开。`
- 主按钮：`生成我的相处说明书`。
- 保留结果页现有 dock、价格、报告购买路径和所有已有文案；新入口是正文区域，不增加第二个固定底栏。
- P0 不修改报告正文结构；P1 可为 ReportBody 新增可选的服务器渲染 `relationshipFooter` 插槽，仅在真实、本人报告第三章尾部传入入口。sample 不传该插槽，四个章节和两组列表仍完整 SSR。

### 1.2 编辑抽屉 / 桌面弹窗

复用 `ResponsiveSheet`。打开后显示服务器给出的四条候选，每维一条，默认选三条。显示 `已选 3 / 3`，复用 NumberMotion。最多三条；已选三条时点第四条不擅自替换，提示先取消一条。少于三条时生成按钮禁用。

公开选项：

1. `显示参考类型`：默认关闭。开启时清晰结果显示参考类型，部分均衡仍附说明；四维都不明确时只显示“待探索”，绝不显示内部计分用的四字母。
2. `显示四维倾向`：默认关闭。开启仅显示四个定性类别，不含百分比。三种状态为维度左端、接近均衡、右端。卡片使用标签/文字，不用人为设定数值画假雷达。
3. 固定提示：`这些句子也可能体现你的偏好。任何持有链接的人都能查看你选择公开的内容。`

先显示本地语义化预览，不写数据库、不生成有效公开 URL。按钮明确写 `确认公开并生成`；用户点击才创建快照。未生成阶段二维码区显示“生成后显示访问入口”，不能放可扫描的假二维码。

生成成功进入同一个弹层的“已生成”状态：

- 静态 PNG 预览；保存图片按钮；复制链接按钮；公开范围摘要；关闭按钮。
- 点击保存仅在图片已获取后发起下载；移动端不支持下载时展示可长按的图片和“长按图片保存”。不能声称已存入相册。
- 链接复制成功才显示“链接已复制”；Clipboard 不可用时提供可选择的只读 URL 输入框和手动复制说明。
- PNG 失败不撤销已经创建的分享：链接仍可用，提供重新生成图片。
- 生成中允许关闭；客户端忽略过期响应。网络重试使用同一 requestId，不能重复生成。关闭后重开可从管理数据发现已经成功的分享。
- 已生成内容不可原地编辑。选择“调整内容”进入新草稿，明确“将生成新的分享；旧分享仍可在我的分享中关闭”。
- 发布中冻结当前提交的选项，允许关闭。关闭后另起草稿的请求使用新requestId，保留上一份未确定请求的识别信息；旧响应不能覆盖新草稿。草稿预览不请求PNG，公开项关闭时对应DOM/无障碍信息立即移除，不做保留旧信息的淡出。

首版不增加原生 Web Share 文件 API，避免异步生成图片后用户手势失效等额外状态；保存与复制覆盖必要路径。

### 1.3 好友页 `/s/[token]`

读取独立公开快照，首屏无需登录、付费或测试即可看到三条句子和用户选定的附加信息。

布局顺序：AppHeader → `一份相处说明书` → 公开卡片 → 简短说明 → `生成我的相处说明书` 主动作 → `免费测试与概览 · 32题轻量版约5分钟` 提示 → 产品解释与帮助链接。

主动作进入当前语言的既有 `/quiz` 版本选择流程，标明轻量版推荐，不自动开始、不覆盖草稿。已有草稿仍按原逻辑恢复；不要重置32/64题记录。P0 不承诺双人提示。

在 P1 上线且当前分享存在有效对照邀请后，可以额外展示 `看看我们的相处差异`，进入独立 `/t/[token]`，而非自动授权。

页面不展示原结果链接、resultId、内部 shareId、访客 ID、订单号、完整报告或“解锁朋友的报告”。不复制原结果页的付费布局。

失效/撤销时展示 `这份分享已关闭或不存在。` 和普通开始测试链接，不回退成 sample、INFJ 或历史快照。网页可能因 streaming 返回200；验收看无个人内容、noindex 和失效文案，JSON/图片接口必须返回明确404/410。

### 1.4 管理页 `/my/shares`

- 在“我的报告”增加“我的分享”普通链接；中英文都有。
- 服务器按当前签名访客取分享，最新优先；每页20条，稳定游标分页。
- 显示创建时间、三条句子、公开范围、预览、复制链接、关闭分享。
- 关闭前用现有弹层确认：`关闭后，链接将不再展示内容。已被保存或转发的图片无法收回。`
- 关闭成功立即更新并刷新服务器状态。重复关闭幂等成功。
- 空态提供返回“我的报告”，不要求关注或注册。
- 沿用现有访客身份及恢复方式，不创造“分享链接恢复账号”。无订单的匿名用户清除 cookie 后，当前系统无法恢复管理权；帮助中如实说明此限制。

## 2. 内容规则与双语

### 2.1 候选句算法

新增纯模块 `src/lib/share-content.ts`：

- `buildShareCandidates(profile, locale)`：固定输出四维 EI、SN、TF、JP 各一条，ID 带内容版本，如 `share-v1:EI:I`。
- 判断均衡先用现有 `balanced[index]`；均衡候选不读取内部平分字母决定措辞。
- 非均衡按现有 profile 字母选择句子。禁止改计分、题库和原中文解释。
- 默认勾选：非均衡优先，其次 `values[index]` 降序，最后按 EI/SN/TF/JP 顺序打破平局；显示始终维度顺序。全均衡默认前三维。
- 客户端只发送三个候选 ID、两个公开开关。服务端从本人结果重新计算候选，校验三个 ID 独立且确实属于本结果。
- 公开数据不返回 candidateId（其内含隐藏类型线索），只返回最终句子文本和01/02/03顺序。

### 2.2 `share-v1` 固定文案

以下是本次新增文案的实施基线，可直接写入中英文内容模块；不替换既有页面文案。

| 维度/状态 | 中文 | English |
| --- | --- | --- |
| EI/E | 我常在交流中整理想法，愿意听你一起讨论。 | Talking things through often helps me organize my thoughts. |
| EI/I | 我有时需要先独处整理，再把想法告诉你。 | I sometimes need time alone to gather my thoughts before sharing. |
| EI/均衡 | 我想聊天还是独处，会随当天的状态变化。 | Whether I want company or time alone can change with my day. |
| SN/S | 说明一件事时，具体的例子会帮助我理解。 | A concrete example helps me understand what you mean. |
| SN/N | 理解细节之前，我常想先知道整体的方向。 | I often want to see the bigger picture before exploring the details. |
| SN/均衡 | 我既需要具体例子，也想知道它与整体的联系。 | I value both concrete examples and how they fit into the bigger picture. |
| TF/T | 面对分歧时，把理由和判断标准说清楚会帮助我。 | Clear reasons and criteria help me work through a disagreement. |
| TF/F | 讨论决定时，也请告诉我它会怎样影响彼此。 | When discussing a decision, I also want to understand its effect on people. |
| TF/均衡 | 做决定时，我会同时留意理由与彼此的感受。 | I consider both the reasoning and how people feel about a decision. |
| JP/J | 重要安排提前说清楚，会让我更安心。 | Knowing important plans in advance helps me feel at ease. |
| JP/P | 安排留一点调整空间，会让我更自在。 | Leaving some room to adjust plans helps me feel comfortable. |
| JP/均衡 | 重要的事我想先确定，其余安排可以留些弹性。 | I like to settle the important parts and keep some flexibility elsewhere. |

共享固定文案：

| key | zh | en |
| --- | --- | --- |
| title | 我的相处说明书 | A little guide to understanding me |
| subtitle | 和我相处，可以从这三件事开始。 | Three things that may help us understand each other. |
| create | 生成我的相处说明书 | Create my guide |
| publish | 确认公开并生成 | Publish and create |
| save | 保存图片 | Save image |
| copy | 复制链接 | Copy link |
| copied | 链接已复制 | Link copied |
| closeShare | 关闭分享 | Close this share |
| disclaimer | 本次探索，不定义我。 | A snapshot for reflection, not a definition of me. |
| testNote | 独立的 MBTI 风格自我探索体验，非官方量表。 | An independent MBTI®-style experience, not the official MBTI® instrument. |

其他 UI/错误文案集中在 `src/lib/i18n/messages/share.ts`，按 `{ zh, en }` 且 `en: typeof zh`。内容与图片同用同一份短文案。英文不使用16Personalities式昵称。

### 2.3 语言绑定

- 分享快照绑定生成结果的 questionnaireLocale；错误语言 URL 重定向到该分享语言。
- 分享/真实对照页 AppHeader 不传共享 `path`，语言切换打开另一语言主页；不能假装同一张用户快照有两种授权文案。
- `/my/shares` 为双语同路径页面，可以传 `path="/my/shares"`。
- 页面链接一律 `href(locale, path)`；API保持根路径 `/api/...`。
- 英文完整实现 P0/P1，不留英文按钮下的中文关闭、错误提示或图片脚注。`ResponsiveSheet` 的关闭 aria-label 目前写死中文，可新增可选 `closeLabel` prop，新功能传对应语言，旧调用默认行为不变。

## 3. 布局与图片规格

这些尺寸仅授权用于新增分享/对照界面，既有页面其余布局继续以设计证据为准。

### 3.1 屏幕布局

- 断点继续使用 md=721px、xl=1101px。页面至少支持320px，无水平溢出。
- 新结果页区块：手机左右27px，上下24px，顶部细线；桌面沿用所在结果内容列宽，上下32px。
- 好友页：手机左右24px，标题28px/1.25，正文14px/1.8，卡片padding24px；桌面内容max-width960px，卡片与说明双列 `minmax(0,560px) minmax(0,320px)`、gap40px，721–900px允许单列。
- 卡片外观：paper背景、ink文字、warm细节，1px现有line边框，4px圆角；主动作胶囊样式，最小触达44px。以三条句子为主，不把类型字母扩大成唯一主视觉。
- 候选用checkbox语义，选项内文字换行，选框不收缩。预览中的三条内容自适应高度，不能截断英文。
- 弹层维持现有480px桌面最大宽、手机84svh高度上限和Vaul滚动容器。不要改全站弹层的布局。生成/复制等动作留在可滚动内容流内，无额外fixed子元素。
- 好友页手机可有唯一一个 Dock；所属main留足safe-area底部空间。Dock必须是动画容器的兄弟节点。

### 3.2 PNG / OG

不引入 html2canvas、截图式海报或新的服务。复用 `next/og` ImageResponse、现有品牌SVG、字体和 `qrcode`。

- 竖版PNG：960×1280；边距64px；logo占用按locale用现有 `brandLogoWidth` 计算，中文基准194px。
- 标题：中文48px、英文42px；三条句子中文38px、英文32px，line-height1.5，每条区域至少150px；01/02/03编号20px。
- 页脚区域至少220px，二维码160×160px，四周至少4模块quiet zone；二维码无logo覆盖。URL来自配置的APP_URL和公开token，不读请求Host。
- 显示附加类型/四维标签时预留独立区域；无附加信息也保持二维码和说明布局稳定。长英文需实测换行，不用整体缩小字体解决溢出。
- 1280px高度分区预算：上下边距128、品牌44、标题/副标题148、三条句子450、可选标签/类型130、页脚220、区域间隙合计160。总和1280；文字实际高度超过预算时先收紧间隙至96并重排可选标签，不压缩二维码quiet zone或裁剪正文。
- OG：1200×630，使用相同快照中的内容（精简排版），全部三条可读；OG不放扫码入口、不承担竖版海报功能。
- 屏幕预览是语义化HTML；已生成的最终导出预览展示实际PNG，两者共享内容与设计常量。导出PNG完全静态。
- 不在分享图中放来源resultId、时间戳型订单号、恢复码或访问者个人信息。二维码只含对应公开分享URL。
- 公开快照仅含定性维度，因此新分享卡不调用需要百分比的原Radar。既有结果/报告雷达和720ms动画保留。
- 给 `scripts/build-og-fonts.mjs` 的sources显式加入新增share/compare中文来源（目前只读三个旧文件）；运行脚本并检查新增字符不缺字。无动态昵称意味着不需要运行时下载全量CJK字体。
- 图片路由先读有效快照，再渲染；失效时404/410，严禁fallback sample。
- 公开PNG用原生`img`或显式关闭优化的图片组件加载，不进入Next图片优化的长期缓存；请求过期时不得用旧blob覆盖新草稿。关闭分享后管理端主动释放旧Object URL；源站撤销不等于远程删除别人已加载的图。

## 4. 数据模型与权限

### 4.1 P0 数据表

在现有schema上新增，生成Drizzle SQL迁移，不重建results或orders。

`result_shares`：

| 字段 | 类型/约束 | 用途 |
| --- | --- | --- |
| id | uuid PK | 内部记录ID，不是授权凭据 |
| token | varchar(32), unique not null | randomBytes(24).toString('base64url')，192bit公开阅读能力 |
| visitor_id | uuid FK visitors, not null | 管理权所有者 |
| result_id | text FK results, not null | 仅内部关联 |
| request_id | uuid, not null | 与visitor_id联合unique，创建重试幂等 |
| request_hash | char(64), not null | 同request_id不同输入返回409 |
| locale | zh/en, not null | 与结果语言一致 |
| content_version | text, not null | share-v1 |
| snapshot | typed jsonb, not null | 仅最终公开数据 |
| selected_ids | text[], not null | 私有管理字段，不放入snapshot |
| show_type / show_dimensions | boolean, not null | 记录公开选择 |
| consent_version | text, not null | share-public-v1 |
| created_at / revoked_at | timestamptz / nullable | 创建与关闭 |

索引：`(visitor_id, created_at desc, id desc)`；active查询视需要加partial index。默认不自动过期，所有者可关闭。

token直接存数据库，便于所有者以后复制同一链接。其权限只有阅读选定公开快照，不能登录、找回、修改或获得报告。不要为此建立新密钥轮换系统。日志和统计不记录原始token。

幂等摘要先规范化三个候选ID为维度顺序，再对resultId、ID数组、两个boolean、consentVersion使用固定字段顺序编码并hash。同requestId不可用于修改公开范围；新草稿产生新requestId。

```ts
type DimensionState = 'left' | 'balanced' | 'right';
type PublicDimension = {
  dimension: 'EI' | 'SN' | 'TF' | 'JP';
  state: DimensionState;
  label: string;
};
type PublicShareSnapshot = {
  version: 'share-v1';
  locale: 'zh' | 'en';
  lines: [string, string, string];
  // 关闭选项时整个字段缺省；不是CSS隐藏。
  typeLabel?: string; // 只允许参考类型或“待探索”及其英文
  typeNote?: string;
  dimensions?: [PublicDimension, PublicDimension, PublicDimension, PublicDimension];
  disclaimer: string;
};
```

`snapshot` 不存原profile、百分比、answers、responses、resultId、owner、unlocked、任何订单字段。显示文本冻结：以后改copy不得默默改变已经公开的内容。

### 4.2 权限矩阵

| 动作 | 权限 |
| --- | --- |
| 创建分享、读取候选 | 有效签名mid + result.owner + 非sample |
| 公开网页/图片/OG | 有效token + 未撤销，只返回snapshot |
| 管理列表/复制旧链接/撤销 | 有效mid + share.visitor_id匹配 |
| 原始答案与完整报告 | 保持原服务器授权逻辑 |
| P1 双人页面 | 有效mid属于双方之一 + pair与父邀请/分享均有效 |

新公开读函数单独写select列白名单；不能在客户端收到完整ResultView后再删除字段。检查HTML、RSC载荷、JSON、metadata、图片alt、data-*和二维码，不能藏着未公开数据。

既有 `/result/[id]` 的公开行为为历史兼容保留，新分享不得暴露它的ID或链接。UI只承诺本次分享公开范围，不承诺撤销其它已流传的旧结果链接。

### 4.3 请求与缓存

- 所有写请求检查APP_URL origin，拒绝cross-site；有效mid只从 `getVisitorId()` 获取，绝不从body接收visitorId。
- JSON schema使用zod，拒绝多余权限字段；流式限制请求体8KiB（事件2KiB），不要只看Content-Length。
- 写请求与owner读取 `Cache-Control: private, no-store`；公开分享网页、公开JSON和图片也不共享长期缓存，避免撤销后持续提供源站副本。
- Next运行时IO位于loading.tsx/Suspense内；API/图片读取前 `await connection()`；不通过 `dynamic='force-dynamic'` 绕开已启用的Cache Components。
- 页面不要用 `use cache` 缓存分享有效性。图像可在单次请求内复用字体；不把授权判断缓存到跨请求全局Map。
- 所有新token页面采用 `Referrer-Policy: no-referrer`，内部敏感链接禁prefetch；通过当前版本支持的响应头配置实现并实测。
- `noindex,nofollow`；share与invitation页面显式给自己的安全OG。pair与owner页OG仅通用品牌。不可直接套会生成双语alternate的 `pageMetadata`：为语言绑定分享提供独立完整metadata helper。
- 加 `/s/`、`/t/`、`/compare/` 及所有locale前缀至robots私有路径；不加入sitemap或llms。robots/noindex不是权限控制，也不保证第三方预览能立刻清除。
- 撤销后源站不再返回内容；历史缓存、截屏和保存图片无法收回，明确告知。
- 限流复用数据库原子窗口模式，新表/命名空间独立，不能消耗报告找回额度：创建20次/访客/小时，撤销60次/访客/小时，事件120次/访客/分钟。token图片读取按可信来源hash限120次/分钟。返回429及Retry-After。
- 来源hash按现有recovery-policy读取可信代理末项，不照搬当前 `clientIp()` 的首项XFF逻辑；无可信地址使用统一unknown桶。禁止保存明文IP。

## 5. P0 路由与API合同

统一返回 `{ok:true,data}` / `{ok:false,error:{code,message}}`，错误按结果/分享语言或requestLocale翻译。

| 路由 | 行为与返回 |
| --- | --- |
| `GET /api/results/[id]/share-options` | owner-only；返回候选、默认选项、已存在分享摘要；不返回answers/order |
| `POST /api/shares` | body `{resultId,selectedIds:[a,b,c],showType,showDimensions,consentVersion,requestId}`；201返回owner可用`{id,url,imageUrl,snapshot}`；幂等重试200 |
| `GET /api/shares?cursor=...` | owner-only，20条，`{items,nextCursor}`；用于管理和重开同步 |
| `DELETE /api/shares/[id]` | owner-only，原子设置revoked_at；重复请求成功；P1同时关闭关联邀请和pair |
| `GET /s/[token]` | SSR公开分享页，P0 only snapshot与免费测试入口 |
| `GET /s/[token]/image` | 960×1280PNG；`?download=1`附attachment文件名mirror-guide.png；默认inline |
| `GET /s/[token]/opengraph-image` | 1200×630；完整显式metadata指向locale正确的公开路径 |
| `GET /my/shares` | 服务器管理页面，loading.tsx包动态数据 |
| `POST /api/share-events` | 白名单事件，只返回确认；见统计章节 |

新page都在 `src/app/[lang]` 下。图片子路由可以用 `image/route.tsx`；不要在与page相同segment建route.ts。已有ROOT_ROUTES覆盖api，`/s` `/t`不加ROOT_ROUTES，继续由locale proxy正常改写。

主错误码：`NO_SESSION`401、`INVALID_ORIGIN`403、`INVALID_SHARE_INPUT`400、`NOT_FOUND`404（跨所有者访问不暴露是否存在）、`SHARE_CLOSED`410、`IDEMPOTENCY_CONFLICT`409、`RATE_LIMITED`429、`SHARE_UNAVAILABLE`503。

重试仅针对可重试错误，创建使用原requestId；不得无限自动重试。公开读统一失效样式，不展示数据库报错。

## 6. P1：双人对照的独立授权

### 6.1 明确的单一方案

P1新增独立邀请，不把P0隐藏的维度偷偷用于对照。

1. A从分享管理或结果页点击 `创建双人对照邀请`。
2. 展示A本次四维定性类别，说明 `持有邀请链接的人可以查看这四个倾向，并用自己的结果与你对照。不会公开具体分数或答案。`
3. A勾选同意并提交；创建单独邀请token。P0分享卡的公开选项保持不变。
4. B打开 `/t/[token]`，能先看A已同意公开的四类，以及通用双人提示示例。
5. B选本人已有结果，或进入现有问卷；测试完成后先看自己的正常结果，再显示 `继续双人对照` 入口。
6. B进入确认页，看到自己的四类及说明 `确认后，你的这四个倾向和双人提示只向这份邀请的发起人展示。` 选择结果不等于同意。
7. B点击 `同意并生成双人提示` 后，服务器事务生成pair。A可在 `/my/shares` 的双人记录看到，B直接进入 `/compare/[id]`。

任何人持pair URL但不是A或B，都看不到双方数据。A公开邀请可多人参与，每个B一份独立pair；不形成公开成员名单。A/B都不能替对方创建新公开分享或授权第三方。

P1首版继续匿名，用 `发起人 / 参与者`、查看者本地 `你 / 对方`，无昵称和头像。同一visitor禁止自邀；换设备或清cookie无法完美识别同一人，不宣称完全防刷。

### 6.2 新表

`comparison_invitations`：id uuid PK、token varchar(32) unique、share_id FK、visitor_id FK、result_id FK、locale、content_version `compare-v1`、`public_snapshot`（仅A同意公开的四类和版本）、consent_version `compare-host-v1`、request_id/request_hash（owner联合幂等）、created_at、expires_at（创建后30天）、revoked_at。每张share最多一个有效邀请；过期可新建，不复活旧token。

`comparisons`：id随机UUID PK、invitation_id FK、host_visitor_id FK、guest_visitor_id FK、guest_result_id FK、host_snapshot、guest_snapshot、content_version、locale（邀请语言）、output_snapshot（三段最终文案）、guest_consent_version `compare-guest-v1`、created_at、revoked_at、revoked_by（内部visitor FK）。unique(invitation_id,guest_visitor_id)：B重复确认返回同一pair，后续换结果需新邀请，不悄悄覆盖已同意数据。

已有pair且resultId相同、授权仍有效时重试200；不同resultId返回409 `ALREADY_JOINED`；pair被撤回后返回410，不自动复活。邀请到期后原pair仍可读取，重试可返回原pair但不新建。每share一个有效邀请的检查在持有share行锁时进行，不使用含`now()`的partial unique index。

pair中的四维仅类别、问卷ID/版本和测试时间（各自同意页明示）；不保存百分比或answers，不调用完整付费报告生成器。

邀请过期只禁止新加入；已同意pair仍可供双方阅读。主动撤销邀请或share关闭才同步撤销关联pair。任何一方单独撤回pair，立即对双方失效，不撤销其它参与者的pair。

并发：创建邀请、加入、撤销均在事务中锁定父share → invitation → pair（固定锁顺序）。先检查有效状态再写入；join与revoke竞态不得留下撤销后可读pair。pair每次读取也联查父对象revoked_at，不能只依赖批量更新是否及时。

### 6.3 路由

| 路由 | 合同 |
| --- | --- |
| `POST /api/comparison-invitations` | owner；`{shareId,consentVersion,requestId}`；服务器取该share的本人result生成类别快照 |
| `DELETE /api/comparison-invitations/[id]` | owner；事务撤销邀请和其pair |
| `GET /t/[token]` | 邀请公开页；仅A邀请snapshot；过期显示结束与普通测试入口 |
| `GET /t/[token]/join?result=[ownResultId]` | cookie本人确认页；result可选，服务端owner验证；URL仅用于本人流程，不写入分享链接/二维码 |
| `POST /api/comparisons` | `{invitationToken,resultId,consentVersion}`，B同意后才创建；忽略任何客户端profile |
| `GET /compare/[id]` | SSR仅双方可读；关闭/不属于双方均通用不可用页 |
| `DELETE /api/comparisons/[id]` | 任一方可撤回，幂等；另一方后续请求立即不可读 |

P1请求沿用P0同源、no-store、限流、body上限。invitationToken作为功能请求输入允许传输，但不进入分析日志和event属性。

### 6.4 问卷后回到对照

- 来自邀请的“开始测试”导航携带 `compare=<invitationToken>`；只接受固定格式token，无任意returnTo URL，避免开放重定向。
- 现有quiz保持原版本草稿系统；新增小型流程上下文，不能把邀请字段混进answers或旧草稿schema。
- 前端从URL取上下文的小岛必须有Suspense；服务端可校验并传值。页面进入、切换版本、下一题、回顾答案均保留当前上下文。
- 提交成功仍导航到当前result语言的结果页，并保留 `compare=`。结果页展示可选继续入口，跳转到邀请语言的确认页。
- 可用sessionStorage作同tab补充，但存储不可用时URL足以完成当前流程；不把token存在分析系统。
- 失效/撤销邀请不影响本人的测试提交、结果阅读或付费。结果页降级为正常结果，不自动加入、不自动公开、不自动恢复其他visitor身份。
- 中英文结果可以参与；只比较定性类别并标注问卷版本不同。输出按邀请语言，用户原结果页仍按结果语言。

### 6.5 三段提示的确定性规则

新增纯模块 `compare-content.ts`，输入只接受双方同意的定性快照。对每维得到 `same-left / same-right / opposite / includes-balanced` 四种关系；不能输入percentages或按“相差多少分”排序。

固定维度优先顺序EI → JP → TF → SN，输出恰好三段：

1. **可能容易理解彼此的地方**：选首个same；若无same但存在balanced，用“需要结合具体情境认识彼此”；全部opposite时用“你们的偏好有不少不同，可以从一件具体小事开始了解”，不可编造共同点。
2. **可能需要说清楚的地方**：选首个opposite；没有opposite但有balanced时用“先确认这个情境下彼此需要什么”；全部same时用“不把相似偏好当成相同需要”。balanced不得被当成另一端，也不得被表述为两人确定相似。
3. **可以一起试一次**：优先采用第2段维度对应练习；没有opposite时采用首个balanced；全same用通用的“各自说一个当前需要，并约定一次复盘”。

每段含title、body、可选practice；持久化输出版本，A和B读到语义一致的提示，主语按查看角色正确映射。

内容锚点（中英文都实现，依现有preferences和report用语扩写，每段最多80中文字符 / 55英文词）：

| 维度 | 差异提示方向 | 练习 |
| --- | --- | --- |
| EI | 边交流边想与先独立整理的节奏可能不同 | 先说话题，再约一个双方方便的讨论时间 |
| SN | 一个先问具体例子，一个先问整体方向 | 先给一个实例，再用一句话说它与整体的关系 |
| TF | 一方先核对理由，另一方先关心人的处境 | 每人先说一个判断标准，再说一个在意的影响 |
| JP | 提前确定与保留弹性的需要可能不同 | 共同固定一个必要节点，其余安排保留调整空间 |

near-balanced内容必须明确情境变化。无匹配率、稀有度、命定关系、诊断、招聘适配等结论。类型字母不参与算法。

## 7. 动画实施合同

### 7.1 共同约束

使用现有CSS、Web Animations API（WAAPI）和小客户端协调组件；不增加Framer Motion/GSAP/Lottie。复用 `--motion-ease-out: cubic-bezier(.22,1,.36,1)` 与已有160/240/280ms变量。

- 动画说明状态和内容层级，不模拟分析过程，不延迟真实结果或按钮可用时机。
- 优先opacity/transform；禁止动画width/height去重新排版整个页面，唯一已有例外是Radix测量高度的accordion。
- 默认CSS是最终可读状态；服务器HTML不能因 `opacity:0` 等待JS而永久不可见。
- 一次装载内滚出/滚入不重播；新的导航重新装载可播放。弹层外壳每次开关正常动画，内部卡片同份数据只首次或真正变更时播放。
- 页面CTA、Dock、二维码扫描区不放在新增内容位移/缩放动画祖先内；二维码本身不晃动、不模糊、不逐点生成。弹层外壳的Radix/Vaul开合是必要例外：弹层内动作随外壳正常移动，但不得额外叠加内容入场或阻止操作；页面fixed Dock始终在外。
- 选择/保存/复制的业务状态即时更新；不通过setTimeout等待动画完才改aria状态。
- `prefers-reduced-motion: reduce`、print下全部新增动画和过渡停用，内容最终态完整。运行中切换reduce或print，立即cancel并完成显示。
- hover移动仅 `(hover:hover) and (pointer:fine)`；触屏不残留hover位移。动画不能遮挡或吞点击。

### 7.2 时序表

| 场景 | 触发 | 动作 / 时长 | 重播与中断 |
| --- | --- | --- | --- |
| 结果页新增分享区 | 首次进入视口 | 标题opacity .4→1、Y 6→0，280ms；说明延迟60ms，280ms | 每挂载一次；按钮不动画 |
| 桌面编辑弹窗 | 打开/关闭 | 复用现有：内容240ms入（Y6、scale .985→1），180ms出（Y4、scale .99）；遮罩200ms入/180ms出，仅淡化 | Radix管理presence；不自己延迟卸载 |
| 手机编辑抽屉 | 打开/关闭/拖拽 | 复用Vaul现有500ms cubic-bezier(.32,.72,0,1)位移与遮罩 | 不覆写Vaul计时/transform，不叠第二个弹层位移 |
| 选中候选 | click/keyboard | 背景/边框160ms；勾选图标opacity .35→1、scale .7→1，160ms | aria-checked即时；快速点击仅最新状态 |
| 已选数量 | 数值改变 | 复用NumberMotion 240ms，仅变化数字滚动 | 不从0数到3，无排队 |
| 草稿预览换句 | 确实变更已选句 | 仅改变的句子opacity .5→1，160ms；不整体重画卡片 | 同一slot新变化取消前次，只留最新；旧文本不被读屏重复读 |
| 创建成功 | 服务器已返回snapshot | 状态图标160ms出现；成功说明opacity .5→1，200ms；最终PNG decode后直接完整展示 | 无额外成功等待；二维码不渐隐；图片失败时保留HTML/链接 |
| 好友页首屏 | 首次渲染 | 卡片标题280ms Y6→0；三条句子各280ms，delay0/60/120ms | 卡片框与二维码静止；慢水合不重新隐藏已显示文案 |
| 点击复制 | Clipboard promise成功 | 仅确认图标scale .85→1、opacity .5→1，160ms；按钮宽度固定 | 显示“已复制”2秒后复位（状态提示计时，不是动画门槛）；失败不成功动画 |
| P1 对照头部 | pair首次进入视口 | A/B两个装饰面板分别X -8/+8→0、opacity .5→1，360ms；中央warm圆点opacity .4→1，160ms延迟120ms | 使用两块独立子元素；不改品牌SVG，不叠加父transform |
| P1 三段沟通提示 | 首次进入视口 | 每段280ms Y6→0，delay0/60/120ms | 单次、静态兜底；用户可立刻阅读和操作 |
| 关闭分享/撤回成功 | 服务端成功 | 状态徽标160ms淡入；原行保持空间 | 不用离场动画延迟移除权限或继续露旧内容 |

不添加循环呼吸、撒花、3D翻卡、扫光、打字机、数字匹配率、“分析中”假进度。网络pending只显示静态“正在生成…”和可关闭控件，无强制最短等待；超过10秒显示可重试提示，重试保留幂等键。

### 7.3 组件边界与清理

- `ShareCard`：无use client的纯展示组件，输入仅PublicShareSnapshot；供公开SSR页面和管理预览使用。允许客户端编辑器导入这个不含任何服务器依赖的纯展示模块，此时它属于编辑器客户端包；公开页仍直接在服务器渲染。禁止在模块内部读locale cookie/DB/字体文件。
- `ShareComposer`：客户端状态机 `editing → submitting → created`，附带可恢复error；加载候选使用AbortController；mutation关闭后不假定服务端已取消。
- `ShareReveal`：小客户端壳，接受服务器children，通过ref/observer控制可选增强，不导入内容/DB；仅对子节点运行单次WAAPI。
- 初次可见内容可CSS入场；水合只观察，不重置；未入视口的元素默认也保持最终样式，仅进入时应用临时WAAPI。
- observer每个区域一个；首次触发后disconnect；处理unmount、animation.cancel、AbortError、StrictMode effect重跑；`animation.finished` rejection要消费。
- 如缺少IntersectionObserver、Element.animate或matchMedia监听，直接静态完成；不因兼容降级阻断内容或动作。
- 选项外部状态如matchMedia继续useSyncExternalStore；禁止为强制重播添加key导致焦点/表单重置。
- toast/内联状态 `role=status`，复制成功/失败只播报一次；可交互控件始终保持键盘焦点。关闭弹层回到原trigger；失败留在当前表单。
- 有待处理网络请求、图片加载和timers时切路由必须释放订阅；同一分享多次打开不产生多个observer或重复埋点。

## 8. 统计、归因与质量

不新增第三方SDK或用户画像平台。先以Postgres记录最小事件与归因，提供维护者运行的聚合查询/脚本，不增加公开统计API。

### 8.0 与现有GA4统计整合（必须先做）

最新工作树已有 `instrumentation-client.ts` 在水合前初始化GA4，并由 `src/lib/analytics/url.ts` 清洗URL。当前清洗器尚不认识本方案的新路由，未知路径可能保留原token。**新增页面可访问之前，先补路由脱敏，不能等统计阶段才补。**

- 对 `/s/[token]`、`/s/[token]/image`、`/t/[token]`、`/t/[token]/join`、`/compare/[id]`，以及中文无前缀、内部`/zh`与英文`/en`变体，输出固定占位路径；query中的compare/result/requestId/token全部删除。
- 同源page_referrer使用相同规则；对新分享/对照路径，GA参数不保留任何query（包括可能被误用携带token的utm/from）。不将完整动态标题、链接URL、选定句子或用户类型发给自动增强事件。
- 现有GA已开通时复用其CTA/quiz_start入口，不增加第二个GA初始化器或重复page_view。必要的新客户端行为可映射到既有typed事件目录，但只携带固定surface/动作；具体share/visitor关联只在自有数据库。
- 检查GA自动外链点击/表单/下载采集是否会带完整link_url或表单值；新token页面停用此类自动采集或对新交互不接入它，只发送手动白名单事件。以实际发出的参数验收，不能只检查自写track函数。
- 新访客来源、首次完成和真实付款统计仍以本规格服务端事实为准，不能依赖GA脚本是否载入。保留既有分析功能，不重构其无关部分。

### 8.1 事件

| 事件 | 可信触发 | 去重与说明 |
| --- | --- | --- |
| share_created | 直接查询result_shares创建事实 | 每share一次；不需额外写事件才能算成功 |
| share_image_requested | 用户点击保存 | 保存意图，不代表系统相册保存成功 |
| share_link_copied | Clipboard成功后客户端POST | 复制意图，不代表已发送；手动复制不伪造成功 |
| share_browser_visible | 页面前台可见且卡片进入视口后POST | 每share×visitor×UTC日一次；GET/OG/crawler不记 |
| share_quiz_started | 有效归因visitor实际选择版本/恢复作答 | 每归因窗口一次；可复用现有quiz_start触发点，单击CTA不算开始 |
| comparison_created | 直接查询comparisons创建事实 | 每pair一次 |
| comparison_viewed | 已授权pair前台可见 | 每pair×viewer×UTC日一次 |

完成测试、付费以results/orders服务器事实计算，不接受浏览器上报“我完成了/我付款了”。没有share_success事件；WeChat配置成功也不是分享成功。

`share_events`：id uuid、event_name（白名单）、share_id（内部FK，P1另有nullable pair_id）、actor_visitor_id（服务器取得）、locale、occurred_at（服务器）、dedupe_key unique、channel枚举 `link / image / unknown`、surface枚举 `result / quiz / share_page / my_shares / invitation / pair`。索引`(event_name,occurred_at)`和`(share_id,actor_visitor_id,occurred_at)`。不允许任意JSON属性。

事件API采用判别联合body：`{eventId,eventName,surface,channel,shareToken?}` 或P1 `{eventId,eventName,surface,pairId}`。创建事实事件和完成/付款事件不允许客户端提交。quiz-start不接收shareToken，服务端按mid查有效归因。访问事件服务端验证token；pair-view验证参与权限。eventId用UUID，重试复用；可见访问额外用服务端构造的资源ID+visitor+UTC日去重键。收到事件返回204或`{ok:true,data:{accepted:true}}`，统一选一种即可。

同源事件body可含用于查找的公开token，但数据库只存内部ID。严禁把完整URL、query、token、订单号、原始答案、四维分数、类型、IP、openid、UA全文写入事件。频道只是路径标签，不冒充已确认来自微信/朋友圈。

### 8.2 7日归因

采用“首次有效分享触达，7日内首次完成”，计量单位是签名浏览器visitor，不是真实自然人。

- `referral_attributions`：visitor_id PK、share_id FK、first_touch_at、expires_at、quiz_started_at nullable、first_result_id nullable unique、completed_at nullable。仅首次结果尚不存在的visitor可进入新客归因。
- 前台可见POST成功后建立有效触达，排除share owner本人、已知bot、撤销share；现有 `mid` 在proxy的响应设置，首次Server Component可能看不到cookie，因此不能在page/metadata GET里记触达。
- 7日内首次触达不被后来的share覆盖，窗口为`[first_touch_at,expires_at)`；超过7日且仍未完成才允许下一次有效触达重新开始窗口。
- P0归因只保存在服务器，不向quiz URL/draft新增ref。quiz-start从mid查当前归因；过期完成不归因。P1的compare token仅用于返回授权流程，不改变归因来源。不要用延长cookie反复续7日。
- `POST /api/results` 兼容旧数字数组与现有对象，不要求任何新增邀请字段。来源是辅助信息，失败不得让合法答卷提交失败。
- 在 `createResult` 事务中先确保visitor存在，然后锁该visitor行，再检查是否已有result并插入。并发两次提交只能有一个首次完成。将有效归因关联至第一条result；重测、检查答案产生的记录不算新客。
- **故障隔离**：结果插入属于主事务，归因读写放其内的savepoint/Drizzle嵌套事务。归因SQL失败回滚该savepoint并记录不含参数的错误类别，主事务照常提交result；不能只catch PostgreSQL错误而让整个事务留在aborted状态。首次结果认定在主事务中完成，失败归因不允许由后续重测补领。若数据库整体无法写result，按原业务错误返回，不伪造完成。
- 归因触达/quiz-start写入也按同一visitor行锁顺序处理，与首次完成互斥。同步请求未成功记录触达就完成的用户不追补成“确认归因”；记录为未知，报告中列为数据覆盖限制。
- 事件传输失败不影响内容显示/测试。可以在点击CTA时先做一次短超时POST重试（上限800ms），随后无论结果都正常导航；不得无限等待统计。
- P1邀请公开可见事件将来源归入它的parent share。P1选已有结果对照不计新增测试完成。
- 撤销后不接收新的触达；撤销前已登记且未过期的首次触达，之后合法完成仍可记入历史归因，产品对照授权则立即失效。统计与产品授权分开判断，不能因来源关闭使已成功完成的测试报错。
- 订单恢复替换mid后只读取新mid的历史，不把恢复前临时身份的归因迁移给已存在用户。
- 最终报告说明“首次触达归因”，不能宣称因果增量。

### 8.3 指标输出

新增只读 `scripts/report-share-growth.ts`，按指定起止日期输出JSON或CSV到stdout（不带visitor/token/订单号明细），列出：

1. 统计期内首次完成的不同visitor构成基础队列；列分母、首次完成后7日内创建过卡片人数和创建率，未满7日标观察中。另列老用户创建数，不混入该分母。
2. 有效分享访问visitor数；排除所有者，注明同浏览器跨卡去重口径。
3. 分享来源首次完成数 / 有效分享新访客数；仅已满7日的触达队列给最终转化率，未满7日标为观察中。
4. 每100个种子用户带来的新完成数：种子队列按首次share_created时间定义，后续7日产生的首次触达，再允许各触达7日完成，因此队列至少14日后成熟；只展示完整窗口或标“暂定”。种子只按visitor计一次。
5. 新客后续生成自己分享并带来的下一代首次完成数，利用internal share owner及归因链计算，排除自环，不公开关系链。
6. 归因新客的真实付费人数/首次完成新客，默认观察首次完成后7日；仅paid、provider非mock，按visitor去重；收入按CNY/USD分别汇总，退款状态单列，不混币种。

另输出原产品主指标“每100位首次完成用户，7日内带来的首次完成用户”：分母为统计期内首次完成的visitor；分子为来源share属于这些visitor、且受邀首次完成在邀请者首次完成后7日内的记录。完整经过7日才成熟。它不同于上面的14日分享种子窗口，字段分别命名`first_completion_referral_7d`与`share_seed_referral_14d`。所有比例输出分子分母、口径版本与观察窗口，分母为0返回null；当前没有实验组，变化只描述关联。

事件默认保留90日；归因有效明细保留180日后清理，不删除业务分享/对照/结果。清理completed归因后仍以results判断老用户，不能使其重新获得新客资格。聚合脚本限制在完整可用的数据窗口内查询：事件90日、归因180日；超出时明确报数据不完整，不输出看似准确的全历史率。创建事实来自业务表，去重不依赖已清理的事件。提供明确的维护命令和dry-run，不创建未经请求的自动任务。隐私/帮助文案同步说明新增公开范围、匿名浏览器来源统计和保留期限；公共copy有改动时更新contentUpdatedAt。

## 9. 微信接入和退化行为

微信SDK只作为可选渠道能力；P0核心保存、复制和公开页面不依赖其成功。

- 新增服务器配置 `WECHAT_SHARE_ENABLED`，默认false；已配置有效公众号并经过该渠道实测时可启用。不要读取或输出生产secret。
- `WeChatShare` 增加明确的 `link` prop，必须是配置APP_URL下的干净公开share/invitation URL；不用window.location.href复制带compare、unlock、跟踪参数的当前地址。
- 仅在有效公开share/invitation页面挂载，不挂在pay、report、owner管理或pair页。
- SDK加载用模块级共享promise防重复script；每次配置只写当前页面数据；清理过期异步响应，避免从一个share切到另一个却沿用旧卡片。
- API失败、无公众号配置、脚本被阻断：保存/复制仍可用，不制造“分享成功”。普通浏览器不加载微信脚本。
- UI可在确认为微信UA时显示“可使用右上角菜单发送链接”，不尝试强行唤起不存在的分享动作。
- 微信链接预览、长按保存、好友访问需真机验收，Playwright mock只验证程序行为，不能算平台实测。
- 上一轮已查到微信规范对诱导分享和性格测试H5有列明约束。本规格不承诺平台允许传播，不加入任何绕过拦截行为；接入记录区分通用能力已完成与微信渠道是否已核验。

## 10. 推荐文件边界

```text
src/lib/share-content.ts                  纯候选/定性类别/默认选择
src/lib/share-types.ts                    严格公开与私有DTO
src/lib/shares.ts                         server-only 数据/事务/权限
src/lib/share-policy.ts                   输入、同源、token、限流规则
src/lib/share-analytics.ts                server-only 事件/归因
src/lib/i18n/messages/share.ts            UI/错误文案
src/lib/og/share-image.tsx                纯图片布局
src/components/share/share-card.tsx       SSR展示
src/components/share/share-entry.tsx      结果页入口与轻量状态
src/components/share/share-composer.tsx   编辑/发布状态机
src/components/share/share-actions.tsx    图片/复制动作
src/components/share/share-reveal.tsx     有限动画协调
src/components/share/share-motion.module.css
src/components/share/share-visit.tsx      前台访问最小事件
src/app/[lang]/s/[token]/...              page/loading/image/OG
src/app/[lang]/my/shares/...              owner管理
src/app/api/shares/...                    创建/列表/撤销
src/app/api/share-events/route.ts
src/app/api/results/[id]/share-options/route.ts
scripts/report-share-growth.ts
tests/unit/share-content.test.ts
tests/unit/share-policy.test.ts
tests/e2e/share.spec.ts
tests/e2e/share-motion.spec.ts
```

P1相同边界新增 `compare-content.ts`、`comparisons.ts`、`messages/compare.ts`、`components/compare/*`、`t/[token]`、`compare/[id]`及对应API/测试。根据现有组织微调可行，但不能把数据层导入客户端或将整页改为client。

## 11. 分步任务和各步完成条件

### P0-01：基线与纯内容

- 记录当前改动，读框架文档；建立share类型、四维候选、双语copy及纯逻辑测试。
- 完成条件：清晰/部分均衡/全均衡三类候选正确；所有旧中文输出原样；四问卷版本都可用。

### P0-02：数据与安全API

- 新表、迁移、创建/列表/关闭、幂等、DTO白名单、no-store、限流。
- 同步扩展既有analytics URL分类与敏感参数清洗；新增路由第一次可访问前就覆盖，不重做全站统计。
- 完成条件：A能创建和管理；B不可操作A；无session/sample不可创建；重试不重复；关闭后各公开输出不可读。

### P0-03：静态分享页面与图片

- 实现SSR卡片、好友页、公开图片、完整metadata、robots；补字体sources并构建字体。
- 完成条件：禁JS能读三条/附加已授权信息；隐藏字段在所有载荷均不存在；PNG中英文无缺字、二维码可扫描；失效不回退sample。

### P0-04：交互与管理

- 接结果入口、ResponsiveSheet、三选三、开关、生成、复制/保存、错误恢复、我的分享。
- 完成条件：关闭生成中弹层、失败重试、快速选择、存储禁用均不丢权限或重复创建；既有支付/恢复/sample流程保持。

### P0-05：统计与归因

- 最小事件、有效触达、quiz开始、首次结果事务、只读聚合脚本、保留期维护说明。
- 完成条件：两个独立浏览器上下文能产生一条新客归因；重复触达/重测/自邀/爬虫读取不算新人；失败统计不阻断测试。

### P0-06：动画与完整验收

- 按第7节逐项加入动画，静态功能完成后再加，避免动画掩盖功能缺失。
- 完成条件：reduce/noJS/print/中断/多次开关/手机dock全部通过；完成第12节验证并保存证据。

### P1-01～04（后续明确执行时）

1. 定性对照纯逻辑、双语内容和组合测试。
2. 邀请/双人表、同意与撤销事务、owner权限测试。
3. 邀请页、选结果/问卷续接、双方页和管理列表。
4. 双人动画、跨locale/跨版本/撤回/第三方隔离与回归验收。

每步完成后在 `docs/verification/share-growth.md` 更新简短记录：完成内容、验证命令/结果、未解决问题。不要每一步停下来问用户要不要继续；执行到指定阶段真正完成。缺少环境条件时区分代码完成与未验证项，不伪报通过。

## 12. 验收矩阵

### 12.1 纯规则与服务端

- 全均衡结果从候选、share.typeLabel、OG到image都不泄漏内部确定类型。
- 任一维均衡时使用双端/情境句，不因type字母选单端文案。
- 非本人resultId、伪造profile、伪造candidateId、sample、重复候选、0/2/4条均拒绝。
- 同requestId同body一次写入；不同body409；同一share重复撤销成功。
- 读public snapshot明确列白名单，隐藏type/dimensions在HTML、RSC、JSON、alt、meta、图像均不存在。
- token不具备管理、恢复cookie或读付费报告能力；删除任意他人share/pair返回404。
- create/revoke、P1join/revoke并发后不得泄漏已撤销内容。
- 新API同源、body上限、限流与Retry-After；日志不含敏感参数。
- 归因first touch窗口、跨窗口、首次完成并发、自邀、重测、mock支付剔除。
- 归因savepoint里模拟SQL失败，results仍成功落库且返回正常结果；后续重测不能冒领首次转化。原数组API也走同一规则。
- 检查GA dataLayer及模拟发送参数：所有新路由、英文/内部zh、query/referrer均无token、resultId或私人内容；自动下载/外链事件同样覆盖。

### 12.2 浏览器功能

- A生成 → A复制/图片 → 独立B上下文打开 → B选版本完成 → B生成自己的卡。两语言分别跑。
- P0分享已有32/64题版本草稿用户，不能丢进度或合并draft。
- PNG失败但复制成功；clipboard失败出现手动方式；关闭弹层时pending完成可在管理页找回。
- A关闭分享后B重新请求网页/PNG/OG失败，无原句；管理页显示已关闭。
- 非本人打开旧result仍按既有流程工作，分享页不出现付费panel。
- 本地存储与sessionStorage抛错时当次流程仍可继续；cookies禁用时写操作明确提示会话不可用，公开阅读正常。
- P1：A同意四维公开；B测试后再次明确同意；C即使持pair URL也看不到；A/B可回访；任一方撤回双方失效；A撤销邀请不影响B的原始结果。
- P1：无共同点、无差异、全均衡、跨32/64/中英文都输出恰当三段且无匹配率。

### 12.3 动画与可访问性

- 使用现有 `motion.spec.ts` 的animationstart/WAAPI记录方式验证“每次挂载仅一次”，不只截图猜测。
- 动画开始后的第一帧，主按钮已可点击；动画未完关闭弹层、切路由不抛异常，不延迟权限变化。
- 快速勾选/取消10次，最终候选、预览和aria-checked一致，无过期句子回闪；聚焦元素不因key重建丢失。
- 不依赖任意长waitForTimeout；用数据状态、aria、animation.finished、请求结果等待。
- reduce：新增节点无活动animation/transition，opacity=1、transform=none；运行中切换同样成立。
- 无JS：公开卡片三句/公开标签/普通链接在服务器HTML中完整；已有报告四章和两组列表完整。
- print：公开卡片完整，按钮不遮挡；图片本身静态。二维码预览不位移。
- 手机抽屉可滚动，底部动作可达；关闭返回trigger，Esc/Tab/checkbox键盘可操作；状态读屏只播报一次。
- 卡片预览占位尺寸固定，图片解码不导致整页跳跃；滚动过程无多次重播或持续动画。

### 12.4 运行与证据

按仓库要求执行（数据库必须是测试/本地环境，不对生产自动迁移）：

```bash
npm run typecheck
npm run lint
npm test
APP_URL=http://localhost:3000 npm run build
npm run test:e2e
```

有schema变更运行 `npm run db:generate`，检查生成SQL；在明确的本地/测试数据库运行 `npm run db:migrate`。若当前DATABASE_URL无法确定环境，不执行迁移，先完成无依赖验证并说明缺少的测试环境；不要输出连接串。

截图：393×852、1363×936为必验，另检320px及720/721边界。记录中文/英文结果分享入口、编辑、生成成功、好友页、管理页、失效页；P1补邀请确认与双人页。对既有区域对照 `docs/design-evidence/`，新增区域以本规格尺寸和当前视觉体系验收。

保存到 `docs/verification/share-growth/`，总说明 `docs/verification/share-growth.md`。检查PNG实际成品，并实际解码二维码验证仅指向正确public URL。截图在动画最终态；另用行为测试确认动画确实发生。

真微信验收单独记录iOS/Android设备、是否公众号配置、卡片标题/描述/图片、打开链接、长按保存。无设备/配置时如实写未验证，不影响通用浏览器能力的交付，不声称微信已可用。

## 13. 交付清单

- [ ] 指定阶段功能全部完成，无占位按钮或虚假成功反馈。
- [ ] 中英文完整，已有品牌修改保留，所有旧中文与支付语义不变。
- [ ] 新表迁移、公开DTO、同意与撤销、统计口径已实现和验证。
- [ ] 动画表逐项落地，reduce/静态/中断降级完整。
- [ ] 新旧必要测试通过；无法运行的检查有具体原因。
- [ ] 截图、PNG、测试说明与执行进度保存在仓库。
- [ ] 将实际落定的持久设计规则补充到最新AGENTS.md，仅追加相关内容，不重写既有指令。
- [ ] 最终说明完成范围、测试结果、环境限制和待执行的下一阶段；不自动部署。

## 14. 本地依据与外部依赖记录

本规格依据当前仓库源码、已安装Next.js文档、现有Radix/Vaul动画实现及前一轮认可的传播方案编写。计时与尺寸是本次新增功能的实施决策，不是行业效果保证。

微信规则参考前一轮查到的[2025-10-23版规范存档](https://archive.is/wOOnB)与[官方规范入口](https://weixin.qq.com/agreement/weixin_external_links_content_management_specification)。当前任务未证明该产品已获准在微信传播；实际渠道接入必须记录核验结果。此条件不阻止P0通用保存/复制能力的本地实现。
