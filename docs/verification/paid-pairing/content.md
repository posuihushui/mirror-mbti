# PP-02 内容与固定示例验证

更新：2026-09-17。状态：内容子任务完成；整体交付状态见 `../paid-pairing.md`。

## 已实现

- 新生成内容冻结为 `compare-v2`。三段标题为「可能容易理解的地方／需要说清楚的地方／下次可以怎么说」；第三段包含可引用的 `openingLine` 和可执行的 `practice`，完整提供中英文。
- 确定性维度优先级保持 EI → JP → TF → SN；第二段优先相反方向，再取均衡维度；第三段复用该维度。双方全均衡及没有需要选择的差异维度时使用通用例句和练习。没有评分、匹配率或关系结论。
- `CompareContent` 保留 `compare-v1` 与 `compare-v2` 两种冻结 DTO。阅读时直接渲染存储的标题、正文和练习；不会为历史 v1 补生成 v2 例句。
- `getPairingExample(locale)` 每次返回固定虚构输入：JP 为 J/P，其余三维均衡，使用正式生成器。数据不来自当前访客或邀请者。
- `ComparisonReading({content, locale, compact?, animate?})` 为服务器阅读组件；完整阅读和权益卡摘录共用它。紧凑模式只显示原第二、三段。有限动画只增强静态内容。
- `ComparisonReadingActions({id, locale, children})` 单独承载撤回交互，服务器传入已授权的阅读内容；撤回操作位于动画容器外。
- 独立同意常量更新为 `compare-host-v2`、`compare-guest-v2`。好友独立确认保持明确。2026-09-19 按最新 AGENTS 调整：公开邀请话术不含购买提示，双方解锁要求放在本人结果与付款前。

## 本模块已执行的验证

1. `npx vitest run tests/unit/compare-content.test.ts tests/unit/pairing-example.test.ts`：**2 文件、27 测试通过**。
   - 中英文分别遍历全部 6,561 种类别组合，确认角色互换不改变正文、三段完整、例句和练习存在。
   - 四维优先级逐项覆盖；无共同点、无差异、部分均衡、全均衡及跨版本降级。
   - 输出不复制原 result/profile/order 等字段；英文正文没有中文 fallback。
   - 固定示例使用正式生成器，调用方改动不能污染下一次示例。
   - `renderToStaticMarkup` 验证默认动画包装和关闭动画均输出完整正文；compact 渲染正式第二、三段；历史 v1 保持存储文本且没有 v2 标签或例句。
2. 对本子任务 9 个源文件/测试文件执行定向 ESLint：**通过**。

## 验证边界

- 上述 SSR 测试确认纯阅读内容在初始 HTML 中，但不替代页面级权限、真实浏览器减少动态效果/打印/无 JS 验收。
- 全仓库 typecheck、build、数据库与端到端验证由主任务统一执行；本记录不将其标为已通过。
- 本子任务未修改 schema、授权事务、支付流程、页面路由或分析上报。
