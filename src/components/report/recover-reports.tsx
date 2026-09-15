"use client";

import { useState, type FormEvent } from "react";
import { PrimaryButton } from "@/components/site/primary-button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { href } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/locale-provider";
import { siteMessages } from "@/lib/i18n/messages/site";

type RecoveryResponse = { ok: true; data: { recovered: true } } | { ok: false; error: { message: string } };

/** `returnTo` (a same-site path) replaces the default history page, e.g. to resume a payment. */
export function RecoverReports({ returnTo }: { returnTo?: string } = {}) {
  const locale = useLocale();
  const t = siteMessages[locale].recover;
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
        body: JSON.stringify({ orderId, locale }), cache: "no-store",
      });
      const json = (await response.json()) as RecoveryResponse;
      if (!json.ok) throw new Error(json.error.message);
      // A fresh navigation discards router data associated with the previous visitor cookie.
      window.location.assign(returnTo ?? href(locale, "/my/report"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t.failed);
      setPending(false);
    }
  };

  return (
    <form onSubmit={recover} aria-label={t.formLabel} aria-busy={pending}>
      <FieldGroup>
        <Field data-invalid={!!error} data-disabled={pending}>
          <FieldLabel htmlFor="recovery-order-id">{t.label}</FieldLabel>
          <Input id="recovery-order-id" name="orderId" placeholder={t.placeholder} required maxLength={64}
            autoComplete="off" autoCapitalize="characters" spellCheck={false} disabled={pending}
            aria-invalid={!!error} aria-describedby={`recovery-order-help${error ? " recovery-error" : ""}`} />
          <FieldDescription id="recovery-order-help">{t.help}</FieldDescription>
          {error && <FieldError id="recovery-error">{error}</FieldError>}
        </Field>
        <PrimaryButton type="submit" disabled={pending}>{pending ? t.pending : t.submit}</PrimaryButton>
      </FieldGroup>
      <p className="mt-4 text-[11px] leading-[1.9] text-mist">{t.footnote}</p>
    </form>
  );
}
