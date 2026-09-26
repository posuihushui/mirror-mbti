# 观己 mirror：链接、UI/UX 与文案审查

2026-09-24。基于本地运行页面的当前截图和无障碍树，以及对应页面源码。桌面截图为当前浏览器视口；手机截图为 393×852。截图中的 Next.js 开发提示和右上角的视口尺寸提示属于检查环境，不作为产品问题。

## 逐步体验

1. **首页 → 示例结果（总体良好，链接文案需修正）**：桌面和手机首页主按钮突出；手机固定入口始终可见。桌面“先看看报告 / See a sample report”实际进入示例**测试结果**，和落点名称不符。

   ![桌面中文首页](/Users/lake/work/mine/mirror-mbti/output/audit-2026-09-24/01-home-zh.jpg)
   ![手机中文首页](/Users/lake/work/mine/mirror-mbti/output/audit-2026-09-24/09-home-mobile-zh.jpg)

2. **示例结果 → 示例报告（可用，命名混淆）**：结果的四维解释和报告的章节阅读区分清楚，入口可达。中文结果页浏览器标题却是“报告示例”；结果页结尾也称自己为“示例报告”。报告顶部“完成测试后，你会读到属于自己的那一份”可能被理解为测试一结束即可读完整报告。英文结果标题已正确写成 Sample result。

   ![桌面示例结果](/Users/lake/work/mine/mirror-mbti/output/audit-2026-09-24/02-result-sample-zh.jpg)
   ![手机示例结果](/Users/lake/work/mine/mirror-mbti/output/audit-2026-09-24/10-result-sample-mobile-zh.jpg)
   ![桌面示例报告](/Users/lake/work/mine/mirror-mbti/output/audit-2026-09-24/03-report-sample-zh.jpg)
   ![手机示例报告](/Users/lake/work/mine/mirror-mbti/output/audit-2026-09-24/11-report-sample-mobile-zh.jpg)
   ![手机报告第二章](/Users/lake/work/mine/mirror-mbti/output/audit-2026-09-24/18-report-chapter2-mobile-zh.jpg)

3. **测试版本与题目（良好）**：32 题优先，64 题为次级选择；手机英文题目五个选项和底部导航都在 393×852 内。未作答，以免修改浏览器中的已有草稿。

   ![中文版本选择](/Users/lake/work/mine/mirror-mbti/output/audit-2026-09-24/04-quiz-versions-zh.jpg)
   ![英文桌面题目](/Users/lake/work/mine/mirror-mbti/output/audit-2026-09-24/06-quiz-question-en.jpg)
   ![英文手机题目](/Users/lake/work/mine/mirror-mbti/output/audit-2026-09-24/07-quiz-question-mobile-en.jpg)

4. **更多菜单与语言切换（良好）**：菜单分组明确，手机入口可见；从中文测试页切到英文后仍在测试页，路由正确。桌面和手机菜单的相关链接均可从无障碍树读出。

   ![中文桌面菜单](/Users/lake/work/mine/mirror-mbti/output/audit-2026-09-24/05-more-menu-zh.jpg)
   ![英文手机菜单](/Users/lake/work/mine/mirror-mbti/output/audit-2026-09-24/17-more-menu-mobile-en.jpg)

5. **16 型人格索引（良好）**：四乘四的类型表在手机端保持完整，后续分组可继续探索。

   ![手机类型索引](/Users/lake/work/mine/mirror-mbti/output/audit-2026-09-24/08-types-mobile-zh.jpg)

6. **双人指南介绍（内容清晰，下一步过晚）**：例子具体，不把关系化成分数；但 393×852 的首屏看不到“免费开始测试”或“从我的报告继续”，需要读完例子和三步说明后才遇到操作。

   ![双人指南首屏](/Users/lake/work/mine/mirror-mbti/output/audit-2026-09-24/12-pairing-mobile-zh.jpg)
   ![双人指南底部入口](/Users/lake/work/mine/mirror-mbti/output/audit-2026-09-24/13-pairing-mobile-end-zh.jpg)

7. **我的报告（入口齐全，跨语言需预告）**：每条记录可分别打开结果、报告和邀请。中文列表中的英文问卷记录链接到英文页面，这是符合问卷语言规则的行为；记录卡上没有语言标识，跳转可能显得突然。

   ![手机报告列表](/Users/lake/work/mine/mirror-mbti/output/audit-2026-09-24/14-my-report-mobile-zh.jpg)

8. **英文帮助页（能找到恢复入口，支付说明失准）**：顶部“View or recover my tests”可直达找回表单。支付故障段落却无条件要求链上网络、代币和交易哈希；当前本地英文支付模式默认为 mock，项目也支持 Waffo 卡支付。分享帮助是一整段长文字，标题还写 referral measurement，但正文没有解释统计。

   ![英文帮助首屏](/Users/lake/work/mine/mirror-mbti/output/audit-2026-09-24/15-help-mobile-en.jpg)
   ![英文支付帮助](/Users/lake/work/mine/mirror-mbti/output/audit-2026-09-24/16-help-payment-mobile-en.jpg)

## 建议优先级

1. **P1｜把示例链路的名称与落点统一。** 若首页和空报告列表继续指向 `/result/sample`，改成“先看示例测试结果 / See a sample result”；中文结果页标题改成“示例测试结果”。共用的 SampleCta 按结果页、报告页给不同正文；报告顶部改为“完成测试后，你会先看到自己的测试结果”，避免暗示完整报告在测试后立即开放。相关源码：[首页链接](/Users/lake/work/mine/mirror-mbti/src/app/[lang]/page.tsx:100)、[中文页面名称](/Users/lake/work/mine/mirror-mbti/src/lib/i18n/messages/pages.ts:117)、[共用结尾文案](/Users/lake/work/mine/mirror-mbti/src/lib/i18n/messages/result.ts:44)。
2. **P1｜英文支付帮助按实际支付方式写。** 公共主句只要求网站订单号、付款时间和问题描述；链上支付时再要求网络与交易哈希，卡支付用订单号核查。当前固定链上文案在 [英文帮助文案](/Users/lake/work/mine/mirror-mbti/src/lib/i18n/messages/pages.ts:283)。
3. **P2｜双人指南首段之后补一组早期行动入口。** 可复用末尾两个入口“免费开始测试 / 从我的报告继续”，保留底部重复入口；这样手机读者无需读完整个例子才知道下一步。[页面结构](/Users/lake/work/mine/mirror-mbti/src/app/[lang]/pairing/page.tsx:20)。
4. **P2｜在跨语言报告记录上显示问卷语言。** 例如“轻量版 · 32 题 · English”，让中文列表中跳到英文报告的行为可预期；不要改变结果绑定问卷语言的规则。[记录链接](/Users/lake/work/mine/mirror-mbti/src/app/[lang]/my/report/page.tsx:107)。
5. **P2｜拆分帮助页的分享长段。** 按“公开什么、谁能阅读、如何撤回”分段，加到“我的双人指南”的直接链接；“来源统计”放在真正解释统计的隐私说明里，或从当前帮助标题中删除。[分享帮助文案](/Users/lake/work/mine/mirror-mbti/src/lib/i18n/messages/share-help.ts:1)。
6. **P3｜复核报告章节的标题层级。** 手机切到第二章时，无障碍树中只剩章节 `<h2>`，因为唯一 `<h1>` 在被隐藏的第一章；可把报告总标题放在章节面板外，再让四章标题都用 `<h2>`。[章节面板](/Users/lake/work/mine/mirror-mbti/src/components/report/report-body.tsx:97)。

链接名称和落点一致的建议也符合 [W3C 对链接目的的说明](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-link-only)：用户应能从名称判断会打开什么，落地页标题与链接名称接近有助于保持连续性。这里是可用性建议，不代表已判定该站不符合 WCAG。

## 检查边界

本次逐步查看了公开首页、示例结果、示例报告、测试入口、菜单、类型索引、双人指南、报告列表和帮助页；已验证所走路径的 URL 与章节切换，没有遇到 404。未完成问卷、创建订单、实际付款、邀请/同意或全站链接爬取；无障碍风险仅依据所见画面与无障碍树，未做读屏器实测。所有页面截图来自开发环境。
