# 付费配对截图索引

主记录：[实施与验证](../paid-pairing.md)。截图均来自本地合成测试数据和演示支付。

## 主要流程

手机视口 393×852，桌面视口 1363×936。手机采用设备像素比 3，PNG 物理宽度可能为1179；全页截图高度随内容变化。

| 状态 | 手机 | 桌面 |
| --- | --- | --- |
| 公开介绍 | [中文](introduction-zh-mobile.png) / [English](introduction-en-mobile.png) | [中文](introduction-zh-desktop.png) / [English](introduction-en-desktop.png) |
| 未购结果权益预览 | [中文](benefit-zh-mobile.png) / [English](benefit-en-mobile.png) | [中文](benefit-zh-desktop.png) / [English](benefit-en-desktop.png) |
| 已购结果邀请入口 | [中文](paid-entry-zh-mobile.png) / [English](paid-entry-en-mobile.png) | [中文](paid-entry-zh-desktop.png) / [English](paid-entry-en-desktop.png) |
| 付款成功与续接 | [中文](payment-ready-zh-mobile.png) / [English](payment-ready-en-mobile.png) | [中文](payment-ready-zh-desktop.png) / [English](payment-ready-en-desktop.png) |
| 发起人公开同意 | [中文](host-consent-zh-mobile.png) / [English](host-consent-en-mobile.png) | [中文](host-consent-zh-desktop.png) / [English](host-consent-en-desktop.png) |
| 好友邀请页 | [中文](invitation-zh-mobile.png) / [English](invitation-en-mobile.png) | [中文](invitation-zh-desktop.png) / [English](invitation-en-desktop.png) |
| 好友独立同意 | [中文](guest-consent-zh-mobile.png) / [English](guest-consent-en-mobile.png) | [中文](guest-consent-zh-desktop.png) / [English](guest-consent-en-desktop.png) |
| 双方私密指南 | [中文](pair-zh-mobile.png) / [English](pair-en-mobile.png) | [中文](pair-zh-desktop.png) / [English](pair-en-desktop.png) |
| 管理空态 | [中文](center-empty-zh-mobile.png) / [English](center-empty-en-mobile.png) | [中文](center-empty-zh-desktop.png) / [English](center-empty-en-desktop.png) |
| 管理历史态 | [中文](center-history-zh-mobile.png) / [English](center-history-en-mobile.png) | [中文](center-history-zh-desktop.png) / [English](center-history-en-desktop.png) |
| 报告首屏入口 | [中文](report-top-zh-mobile.png) / [English](report-top-en-mobile.png) | [中文](report-top-zh-desktop.png) / [English](report-top-en-desktop.png) |
| 订单恢复后多邀请选择 | [中文](payment-multiple-zh-mobile.png) / [English](payment-multiple-en-mobile.png) | [中文](payment-multiple-zh-desktop.png) / [English](payment-multiple-en-desktop.png) |

## 窄屏和断点

- 320px 实际加载后的结果首屏：[中文](result-zh-320-top.png) / [English](result-en-320-top.png)。
- 320px 已购单一底栏：[中文](result-zh-320-paid.png) / [English](result-en-320-paid.png)。
- 390×749 微信常见高度：[中文介绍](intro-zh-390-mobile.png) / [英文介绍](intro-en-390-mobile.png)；[中文结果](result-zh-390-locked.png) / [英文结果](result-en-390-locked.png)。这是浏览器尺寸模拟，不代表微信真机验证。
- 720/721px：[手机侧](intro-en-720-mobile.png) / [桌面侧](intro-en-721-mobile.png)。已验证介绍与结果页无横向溢出，购买与邀请动作留在视口内。

## PNG 与二维码

- 实际服务端导出的 [中文 PNG](guide-zh.png) / [English PNG](guide-en.png)，均960×1280。
- [二维码校验](png-qr.json)：对实际图片使用系统 Vision 解码，各得到唯一二维码，目标与对应 expected-url 文件完全一致。
- 测试数据会被撤销；图片中的 localhost 链接是回归证据，不作为对外分享链接。

## 人工检查结论

- 保留冷灰纸、黑色报告、暖色细线和中英品牌；与 `docs/design-evidence` 的报告结构一致。
- 报告顶部已缩为紧凑入口，多条续接在阅读区后；中英报告标题在指定首屏内。
- 英文手机章节标签保留全文并换行，避免相邻列重叠；中文排版未改。
- 320px 截图等待真实结果加载，不以骨架屏作为布局证据。
- 支付成功面板明确演示状态、报告权益和独立同意；按钮不会被动画延迟。
- PNG 的三段文字、品牌和二维码均完整；关闭的可选类型与四维标签未出现在图片中。
