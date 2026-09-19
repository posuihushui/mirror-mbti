import type { Metadata } from "next";
import { site } from "@/lib/site";
import { TermsEn } from "@/components/legal/terms-en";
import { LegalPage } from "@/components/site/legal-page";
import { getLocale } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";

const copy = {
  zh: { title: "用户协议", description: "使用观己 mirror 与购买完整人格报告的条款。", updated: "2026-09-11" },
  en: { title: "Terms of service", description: "The terms for using mirror and buying a full personality report.", updated: "2026-09-17" },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({ locale, title: copy[locale].title, description: copy[locale].description, path: "/terms" });
}

export default async function TermsPage() {
  const locale = await getLocale();
  if (locale === "en") {
    return (
      <LegalPage eyebrow="TERMS" path="/terms" title={copy.en.title} updated={copy.en.updated}>
        <TermsEn />
      </LegalPage>
    );
  }
  return (
    <LegalPage eyebrow="TERMS" path="/terms" title={copy.zh.title} updated={copy.zh.updated}>
      <h2>服务内容</h2>
      <p>观己 mirror 提供 32 题轻量版与 64 题标准版的免费测试、人格倾向与简短概览，以及可付费解锁的完整人格报告。所有内容用于自我探索，不构成心理诊断、职业建议或对任何人的评价。</p>
      <h2>付费与解锁</h2>
      <p>完整报告按次购买，价格以支付页面显示为准。支付成功后，对应测试结果的完整报告立即开放，可在同一浏览器内随时回访。购买不含订阅，不会自动续费。</p>
      <p>“我的报告”会列出当前访客的全部测试记录。清除浏览器数据或更换设备后，可凭完整的网站订单号找回对应访客的记录；找回操作不会解锁其他未支付的报告。请仅使用自己的订单号，并妥善保管该找回凭据。</p>
      <p>由于报告在支付成功后即时交付并可完整阅读，除法律法规另有规定或报告因我们的原因无法访问外，不支持退款。若支付成功但报告未能解锁，请保留订单编号并发送邮件至 <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>，我们会核实并处理。</p>
      <p>四个维度均接近均衡时，本次不生成确定类型，也不提供新的付费解锁。可以检查答案或重新作答；已购报告的访问权益不受影响。版本之间尚未做等值校准，题数更多不代表结果更准确。</p>
      <h2>你的义务</h2>
      <ul>
        <li>不得以自动化方式批量提交作答或创建订单。</li>
        <li>不得复制、传播报告文案用于商业用途。</li>
        <li>不得将测试结果用于对他人的筛选、评价或歧视。</li>
      </ul>
      <h2>知识产权</h2>
      <p>站点的题目、文案、图片与设计均受著作权保护。你可以为个人目的保存与分享自己的结果页面链接。</p>
      <h2>免责声明</h2>
      <p>人格倾向会随情境与经历变化，结果只描述你本次作答中的偏向。我们不对基于结果作出的任何决定承担责任。</p>
      <h2>协议变更</h2>
      <p>我们可能更新本协议，更新后的版本会在本页面公布并注明日期。继续使用即视为接受更新后的条款。</p>
    </LegalPage>
  );
}
