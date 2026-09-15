import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/site/app-header";
import { PrimaryButton } from "@/components/site/primary-button";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "测试、订单与数据帮助", description: "暂停续答、重新测试、订单找回、支付未解锁与数据删除的帮助入口及联系方式。", alternates: { canonical: "/help" } };

const help = [
  ["暂停、检查答案与重新开始", "各版本草稿保存在当前浏览器。再次进入测试可继续已答进度；答题页的“检查已答题”可跳转修改，“重新开始”只清空当前版本草稿。存储不可用时页面会提示，保持本页打开仍可完成测试。"],
  ["找回测试与已购报告", "进入“我的报告”可查看同一用户的全部测试。更换设备或清除浏览器数据后，输入任意一个完整网站订单号即可找回。微信账单请使用商户单号，而非微信交易单号。订单号是找回凭据，请妥善保存，不要公开。未创建过订单且没有原浏览器会话时，暂时无法凭个人资料找回匿名记录。"],
  ["换设备后已经做了新的测试", "可以在记录列表底部展开“找回其他测试记录”。找回会切换到订单所属用户，不合并双方记录。切换前保存当前用户的订单号；没有订单的记录，请保留原浏览器会话。"],
  ["支付成功，但报告还未解锁", "先回到原订单状态页等待确认，再从“我的报告”查看。订单可能仍在等待支付结果，请不要急着重复付款。仍未解决时，通过下方邮箱提供完整网站订单号、支付时间与问题描述，便于核实。演示支付不会扣款。"],
  ["申请删除数据", "向下方邮箱说明希望删除的数据范围，并提供结果编号或订单编号。我们需要先核实记录归属，再处理删除；不需要发送身份证、银行卡信息或完整作答内容。没有足够归属凭据时，无法仅凭类型或测试时间定位匿名用户。"],
];

export default function HelpPage() {
  return <><AppHeader variant="page" title="测试与订单帮助" backHref="/" />
    <main className="mx-auto max-w-[760px] px-[27px] pt-7 pb-20 md:px-10 md:pt-[55px]">
      <p className="eyebrow text-mist">HERE TO HELP</p><h1 className="mt-5 text-[27px] leading-[1.6] md:text-[36px]">让每一次探索，都能继续。</h1>
      <div className="mt-7"><PrimaryButton href="/my/report" prefetch={false}>查看或找回测试记录</PrimaryButton></div>
      {help.map(([title, body]) => <section key={title} className="mt-7 border-t border-line pt-6"><h2 className="text-[20px]">{title}</h2><p className="mt-4 text-[13px] leading-[2] text-mist">{body}</p></section>)}
      <section id="contact" className="mt-7 border-t border-line pt-6"><h2 className="text-[20px]">联系观己</h2><p className="mt-4 text-[13px] leading-[2] text-mist">测试问题、订单异常或数据删除申请，请发送邮件：</p><a href={`mailto:${site.supportEmail}`} className="text-link mt-3 min-h-11 break-all">{site.supportEmail}</a></section>
      <nav className="mt-7 flex flex-wrap gap-6 text-[12px]" aria-label="帮助导航"><Link href="/about" className="text-link">测试说明</Link><Link href="/preferences" className="text-link">偏好与复测</Link><Link href="/privacy" className="text-link">隐私政策</Link></nav>
    </main></>;
}
