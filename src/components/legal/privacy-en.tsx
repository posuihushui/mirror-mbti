import { enSite } from "@/lib/i18n/content/en/site";
import { site } from "@/lib/site";

/** English privacy policy body, rendered inside `LegalPage`. Needs owner review before launch. */
export function PrivacyEn() {
  return (
    <>
      <h2>What we collect</h2>
      <p>mirror does not require an account. So you can find your result again after a refresh or a later visit, we store a random, signed visitor-ID cookie in your browser. When you finish the test, your answers to the 32- or 64-item questionnaire, the question IDs, questionnaire and scoring versions, report version and your calculated preferences are saved on our server with that visitor ID.</p>
      <p>When you buy a full report, we record the order number, amount, network, token, payment status and the blockchain transaction hash. For Ethereum payments we also record the wallet address you connect and a signed message proving you control it; signing that message never moves funds. Blockchain transactions are public and permanent by design, and we cannot change or remove data on a public ledger. We will never ask for your private keys or recovery phrase.</p>
      <h2>How we use it</h2>
      <ul>
        <li>To show your personality profile and full report, and to find them again when you return.</li>
        <li>To confirm payments and open the full report for the matching test result.</li>
        <li>To troubleshoot, prevent abuse and keep the service secure.</li>
      </ul>
      <h2>What we don’t do</h2>
      <p>We don’t sell your answers or results, and we don’t use them for hiring, credit decisions or any automated decision-making. We don’t share them with third parties without your consent, except where the law requires it.</p>
      <h2>Cookies and local storage</h2>
      <p>The visitor-ID cookie lasts one year and only identifies your browser. Progress for each version, question order and your most recent result ID are kept in your browser’s local storage; clearing browser data removes them. Results on our server are unaffected, but a browser without the cookie can’t find them automatically.</p>
      <p>In “My reports” you can enter any full order number from this site to restore that visitor’s cookie and see all of that visitor’s tests. Unpaid tests show brief results only; unlocked tests show the full report. An order number works as a recovery credential, so keep it safe and don’t share it.</p>
      <p>To limit abuse of order-number lookups, we briefly keep a keyed hash of the request’s source address, the number of attempts and their times. Raw IP addresses are not stored in these rate-limit records.</p>
      <h2>Retention and deletion</h2>
      <p>Results and order information are kept while the service runs. To delete data related to you, email <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a> with a result ID or order number, and we will handle it after verifying ownership. On-chain payment records outside our systems can’t be deleted.</p>
      <h2>About this test</h2>
      <p>The items are an independent, original questionnaire, not the official MBTI® instrument, and have not been psychometrically validated. Results are for self-exploration only and are not a psychological diagnosis or professional advice. {enSite.trademark}</p>
    </>
  );
}
