import { shareHelpMessages } from "@/lib/i18n/messages/share-help";
import type { Metadata } from "next";
import { site } from "@/lib/site";
import { PrivacyEn } from "@/components/legal/privacy-en";
import { LegalPage } from "@/components/site/legal-page";
import { getLocale } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";

const copy = {
  zh: { title: "隐私政策", description: "观己 mirror 如何收集、使用与保护你的作答与订单信息。", updated: "2026-09-15" },
  en: { title: "Privacy policy", description: "How mirror collects, uses and protects your answers and order information.", updated: "2026-09-17" },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({ locale, title: copy[locale].title, description: copy[locale].description, path: "/privacy" });
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  if (locale === "en") {
    return (
      <LegalPage eyebrow="PRIVACY" path="/privacy" title={copy.en.title} updated={copy.en.updated}>
        <PrivacyEn />
      </LegalPage>
    );
  }
  return (
    <LegalPage eyebrow="PRIVACY" path="/privacy" title={copy.zh.title} updated={copy.zh.updated}>
      <h2>我们收集什么</h2>
      <p>观己 mirror 不要求注册账号。为了在刷新页面或再次打开时找回你的结果，我们会在浏览器中写入一个随机、经签名的访客标识 Cookie。作答完成后，你所选 32 题或 64 题问卷的答案、题目编号、问卷与计分版本、报告版本以及计算出的四维偏好会与该访客标识一并保存在服务器。</p>
      <p>购买完整报告时，我们会记录订单编号、金额、支付渠道、支付状态以及支付服务商返回的交易号。在微信内支付时，微信会提供你的 openid 以完成支付，我们仅将其用于该目的。</p>
      <p>我们使用 Google Analytics 统计网站的访问与使用情况。它会收到你访问的页面类型、按钮点击、答题进度节点（如完成 25%）、支付步骤与结果、结果页状态（是否示例、是否已解锁、倾向是否明确）、设备与浏览器信息，以及 Google 根据网络地址推断的大致地区。发送前，网址中的结果编号与订单编号会被替换为占位符；我们不会发送你的作答、计算出的类型与分数、订单编号、微信 openid、钱包地址或链上交易哈希。我们没有开启 Google 信号与广告个性化功能。</p>
      <h2>我们如何使用</h2>
      <ul>
        <li>展示你的性格画像与完整报告，并在你回访时找回它们。</li>
        <li>确认支付结果，为对应的测试结果开放完整报告。</li>
        <li>统计页面访问与功能使用情况，改进测试与报告体验。</li>
        <li>排查故障、防止滥用与保障服务安全。</li>
      </ul>
      <h2>我们不会做什么</h2>
      <p>我们不会出售你的作答或结果，不会用于招聘筛选、信用评估或任何形式的自动化决策，也不会在未经你同意的情况下向第三方共享，法律法规要求的情形除外。</p>
      <h2>Cookie 与本地存储</h2>
      <p>访客标识 Cookie 有效期为一年，仅用于识别浏览器。各版本作答进度、题目顺序与最近一次结果编号会保存在浏览器本地存储中，清除浏览器数据会一并清除；服务器上的结果不受影响，但在没有 Cookie 的浏览器中将无法自动找回。</p>
      <p>你可以在“我的报告”中输入任意一个完整的网站订单号，恢复该订单所属访客的 Cookie，并查看该访客的全部测试记录。未支付的测试仅展示简要结果，已解锁的测试可阅读完整报告。订单号相当于找回凭据，请妥善保存，不要向他人公开。</p>
      <p>为限制订单号查询滥用，我们会短期保存经密钥处理的来源地址标识、查询次数与时间，不保存原始 IP 地址到查询限流记录中。</p>
      <p>Google Analytics 会写入以 _ga 开头的 Cookie（有效期最长两年），用于区分访问者与会话。你可以在浏览器中阻止或清除这些 Cookie，或安装 Google 提供的停用插件，测试与报告仍可正常使用。为避免重复统计同一笔购买，浏览器本地存储还会保留最近 20 笔购买的单向摘要，无法据此还原订单编号。</p>
      <h2>{shareHelpMessages.zh.title}</h2><p>{shareHelpMessages.zh.body}</p><p>{shareHelpMessages.zh.measurement}</p>
      <h2>保存期限与删除</h2>
      <p>结果与订单信息会在服务运行期间保留。如需删除与你相关的数据，请发送邮件至 <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>，提供结果编号或订单编号，我们会在核实后处理。</p>
      <h2>关于本测试</h2>
      <p>题目为独立原创的演示问卷，并非官方 MBTI 量表，也未经过心理测量学验证。结果仅供自我探索，不构成任何心理诊断或专业建议。</p>
    </LegalPage>
  );
}
