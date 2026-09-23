"use client";

import { Copy } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics/track";
import { useLocale } from "@/lib/i18n/locale-provider";
import { siteMessages } from "@/lib/i18n/messages/site";

/** Full order numbers are recovery credentials; only render in owner-only surfaces. */
export function OrderReceipt({ orderId }: { orderId: string }) {
  const t = siteMessages[useLocale()].receipt;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      track("copy_to_clipboard", { copy_target: "order_id", outcome: "copied" });
      toast(t.copied);
    } catch {
      track("copy_to_clipboard", { copy_target: "order_id", outcome: "failed" });
      toast(t.copyFailed);
    }
  };
  return (
    <div className="flex flex-col gap-3 text-left">
      <span className="text-xs text-mist">{t.label}</span>
      <code className="block break-all text-xs select-all">{orderId}</code>
      <Button variant="link" onClick={copy} className="min-h-11 self-start text-xs">
        <Copy size={16} data-icon="inline-start" />{t.copy}
      </Button>
      <p className="text-xs text-mist">{t.note}</p>
    </div>
  );
}
