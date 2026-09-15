import { enSite } from "@/lib/i18n/content/en/site";
import { site } from "@/lib/site";

/** English terms body, rendered inside `LegalPage`. Needs owner review before launch. */
export function TermsEn() {
  return (
    <>
      <h2>The service</h2>
      <p>mirror offers a free 32-item Quick or 64-item Standard test, your personality type with a short overview, and a full personality report you can unlock for a fee. Everything is for self-exploration and is not a psychological diagnosis, career advice or an assessment of anyone.</p>
      <h2>Payment and unlocking</h2>
      <p>The full report is a one-time purchase at the price shown on the payment screen, paid in USDT or USDC on Ethereum or Solana to the receiving address shown there. Once the payment is confirmed on-chain, the full report for that test result opens and you can return to it in the same browser at any time. There is no subscription and nothing renews.</p>
      <p>You are responsible for network fees. Send at least the amount shown, in a supported token, on the network you selected. For Ethereum, pay from the wallet you connected and signed with. Payments below the amount shown, on another network, in another token or from another wallet may not be detected, and we cannot reverse or retrieve them.</p>
      <p>On-chain payments are final and cannot be reversed by us. Because the report is delivered immediately after payment and can be read in full, we don’t offer refunds unless the law requires it or the report can’t be accessed because of us. If you paid but the report didn’t unlock, email <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a> with your order number, network and transaction hash and we will check it.</p>
      <p>“My reports” lists every test for the current visitor. After clearing browser data or switching devices, you can recover a visitor’s records with a full order number from this site; recovery never unlocks other unpaid reports. Only use your own order numbers, and keep these recovery credentials safe.</p>
      <p>When all four dimensions are close to balanced, no definite type is given and no new paid unlock is offered. You can review your answers or retake the test; reports you’ve already bought remain accessible. The versions have not been equated, and more items don’t mean more accurate results.</p>
      <h2>Your obligations</h2>
      <ul>
        <li>Don’t submit answers or create orders in bulk by automated means.</li>
        <li>Don’t copy or distribute report text for commercial purposes.</li>
        <li>Don’t use test results to screen, evaluate or discriminate against others.</li>
      </ul>
      <h2>Intellectual property</h2>
      <p>The site’s items, text, images and design are protected by copyright. You may save and share links to your own result pages for personal purposes. {enSite.trademark}</p>
      <h2>Disclaimer</h2>
      <p>Personality leanings change with situations and experience; results describe only how you leaned in this set of answers. We are not responsible for decisions made on the basis of results.</p>
      <h2>Changes</h2>
      <p>We may update these terms. Updated versions are published on this page with their date. Continuing to use the service means you accept the updated terms.</p>
    </>
  );
}
