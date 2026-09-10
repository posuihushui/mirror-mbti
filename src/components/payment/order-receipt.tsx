"use client";

import { Copy } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Full order numbers are recovery credentials; only render in owner-only surfaces. */
export function OrderReceipt({ orderId }: { orderId: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      toast("订单号已复制，请妥善保存");
    } catch {
      toast("暂时无法复制，请长按订单号保存");
    }
  };
  return (
    <div className="flex flex-col gap-3 text-left">
      <span className="text-[11px] text-mist">本网站订单号</span>
      <code className="block break-all text-[12px] leading-[1.8] select-all">{orderId}</code>
      <Button variant="link" onClick={copy} className="min-h-11 self-start text-[12px]">
        <Copy size={16} data-icon="inline-start" />复制订单号
      </Button>
      <p className="text-[11px] leading-[1.9] text-mist">订单号可找回该用户的全部测试记录，包括已解锁的报告。请妥善保存，不要向他人公开。</p>
    </div>
  );
}
