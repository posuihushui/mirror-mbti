"use client";

import { useState, type FormEvent } from "react";
import { PrimaryButton } from "@/components/site/primary-button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type RecoveryResponse = { ok: true; data: { recovered: true } } | { ok: false; error: { message: string } };

export function RecoverReports() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const recover = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const orderId = String(new FormData(event.currentTarget).get("orderId") ?? "").trim().toUpperCase();
    setError("");
    setPending(true);
    try {
      const response = await fetch("/api/reports/recover", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId }), cache: "no-store",
      });
      const json = (await response.json()) as RecoveryResponse;
      if (!json.ok) throw new Error(json.error.message);
      // A fresh navigation discards router data associated with the previous visitor cookie.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/my/report");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "暂时无法找回，请稍后重试。");
      setPending(false);
    }
  };

  return (
    <form onSubmit={recover} aria-label="通过订单找回测试记录" aria-busy={pending}>
      <FieldGroup>
        <Field data-invalid={!!error} data-disabled={pending}>
          <FieldLabel htmlFor="recovery-order-id">订单号</FieldLabel>
          <Input id="recovery-order-id" name="orderId" placeholder="输入以 M 开头的完整订单号" required maxLength={64}
            autoComplete="off" autoCapitalize="characters" spellCheck={false} disabled={pending}
            aria-invalid={!!error} aria-describedby={`recovery-order-help${error ? " recovery-error" : ""}`} />
          <FieldDescription id="recovery-order-help">可在原浏览器的“我的报告 → 订单与找回凭据”中查看；微信账单中请使用商户单号，而非微信交易单号。</FieldDescription>
          {error && <FieldError id="recovery-error">{error}</FieldError>}
        </Field>
        <PrimaryButton type="submit" disabled={pending}>{pending ? "正在找回…" : "找回测试记录"}</PrimaryButton>
      </FieldGroup>
      <p className="mt-4 text-[11px] leading-[1.9] text-mist">订单号是找回凭据，请仅输入自己的订单号。找回后，此浏览器将记住对应用户。</p>
    </form>
  );
}
