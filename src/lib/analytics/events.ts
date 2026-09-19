import type { Locale } from "@/lib/i18n/locale";
import type { CryptoNetwork } from "@/lib/payments/types";
import type { PaymentMode } from "@/lib/site";
import type { ReportCommerce } from "./commerce";

/**
 * The GA4 event catalog. `docs/analytics.md` lists what each event answers and which parameters to
 * register as custom dimensions.
 *
 * Never add result IDs, order numbers, answers, scores, personality types, wallet addresses or
 * transaction hashes: order numbers are recovery credentials, and the privacy policy promises not
 * to share results with third parties.
 */

/** What a tracked link or button leads to. A closed list, so reports never split on a typo. */
export type CtaId =
  | "start_quiz"
  | "resume_quiz"
  | "retake_quiz"
  | "view_sample_result"
  | "read_sample_report"
  | "unlock_report"
  | "read_report"
  | "view_result"
  | "review_answers"
  | "retry_payment"
  | "back_to_result"
  | "my_report"
  | "open_about"
  | "view_about"
  | "view_help"
  | "view_preferences"
  | "view_types"
  | "view_type"
  | "view_privacy"
  | "view_terms"
  | "contact_email"
  | "order_receipt"
  | "recover_other"
  | "pairing_info"
  | "invite_pairing"
  | "my_pairing"
  | "home";

/** Where the CTA sits. Every event also carries `page_type`, so `dock` on the result page and on home stay apart. */
export type CtaLocation =
  | "header_nav"
  | "header_mobile"
  | "hero"
  | "dock"
  | "steps_bar"
  | "page_cta"
  | "sample_cta"
  | "sample_notice"
  | "unlock_panel"
  | "result_panel"
  | "unclear_result"
  | "history_item"
  | "payment_sheet"
  | "payment_success"
  | "pay_status"
  | "report_closing"
  | "about_overlay"
  | "empty_overlay"
  | "type_grid"
  | "type_context"
  | "pairing_benefit"
  | "pairing_center";

export type TrackAttrs = { "data-track": CtaId; "data-track-location": CtaLocation };

/**
 * Marks a link or button for the delegated `cta_click` listener in `track.ts`. Safe in Server
 * Components: it only renders data attributes, so tracked CTAs stay in the server HTML.
 */
export function trackAttrs(cta: CtaId, location: CtaLocation): TrackAttrs {
  return { "data-track": cta, "data-track-location": location };
}

export const quizMilestones = [25, 50, 75, 100] as const;
export type QuizMilestone = (typeof quizMilestones)[number];

/** The highest progress milestone crossed when the answered count moves from `before` to `after`. */
export function progressMilestone(before: number, after: number, total: number): QuizMilestone | null {
  if (total <= 0 || after <= before) return null;
  let crossed: QuizMilestone | null = null;
  for (const milestone of quizMilestones) {
    const threshold = Math.ceil((total * milestone) / 100);
    if (before < threshold && after >= threshold) crossed = milestone;
  }
  return crossed;
}

type Empty = Record<never, never>;
type Quiz = { questionnaire_id: string; question_count: number };
type Checkout = ReportCommerce & { payment_mode: PaymentMode };

export type AnalyticsEvents = {
  // Site
  page_view: { page_location: string; page_referrer: string };
  cta_click: { cta_id: CtaId; cta_location: CtaLocation };
  language_menu_open: { cta_location: CtaLocation };
  more_menu_open: { cta_location: CtaLocation };
  language_switch: { language_to: Locale };
  faq_open: { faq_index: number; cta_location: CtaLocation };
  page_not_found: Empty;

  // Quiz
  quiz_start: Quiz & { resumed: boolean; answered_count: number };
  quiz_progress: Quiz & { progress_percent: QuizMilestone; answered_count: number };
  quiz_version_switch: Quiz & { answered_count: number };
  quiz_review_open: Quiz & { answered_count: number };
  quiz_review_jump: Quiz & { question_number: number };
  quiz_restart: Quiz & { answered_count: number };
  quiz_incomplete: Quiz & { question_number: number };
  quiz_submit: Quiz;
  quiz_complete: Quiz;
  quiz_submit_error: Quiz & { error_code: string };
  quiz_storage_unavailable: Quiz;

  // Result, report and history
  result_view: Quiz & { is_sample: boolean; result_owner: boolean; result_clear: boolean; result_unlocked: boolean };
  result_answers_review: { outcome: "loaded" | "failed" };
  report_view: Quiz & { is_sample: boolean };
  report_chapter_view: { chapter_number: number; nav_method: "tab" | "sidebar" | "next" };
  report_tab_switch: { tab: "strengths" | "blindspots" };
  my_report_view: { record_count: number; unlocked_count: number };
  recover_submit: Empty;
  recover_success: Empty;
  recover_error: { error_code: string };

  // Checkout: GA4's recommended ecommerce events, so the monetization reports work unchanged
  view_item: ReportCommerce;
  begin_checkout: Checkout;
  add_payment_info: Checkout & { payment_type: string };
  purchase: Checkout & { payment_type: string; transaction_id?: string };
  payment_cancel: { payment_mode: PaymentMode; stage: "before_order" | "processing" | "wechat_jsapi" };
  payment_error: { payment_mode: PaymentMode; error_code: string };
  payment_redirect: { payment_mode: PaymentMode; target: "wechat_oauth" | "wechat_h5" | "waffo_checkout" };
  checkout_close: { payment_mode: PaymentMode; completed: boolean };
  pay_status_view: { payment_mode: PaymentMode; order_status: string };
  copy_to_clipboard: { copy_target: "order_id" | "recipient_address"; outcome: "copied" | "failed" };

  // Stablecoin checkout
  crypto_network_select: { network: CryptoNetwork };
  crypto_token_select: { network: CryptoNetwork; token_symbol: string };
  crypto_wallet_connect: { wallet_name: string; outcome: "connected" | "signed" | "wrong_wallet" | "rejected" | "failed" };
  crypto_transfer_submit: { token_symbol: string; outcome: "sent" | "rejected" | "failed" };
  crypto_wallet_open: { network: CryptoNetwork; token_symbol: string };
  crypto_wallet_link: { wallet_name: string };
  crypto_order_expired: { network: CryptoNetwork };
};

export type AnalyticsEventName = keyof AnalyticsEvents;
