import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <article className="legal-page page-width">
      <p className="eyebrow">LAST UPDATED: NOVEMBER 5, 2026</p>
      <h1>Privacy policy</h1>
      <p className="legal-lede">This policy describes the information Ink &amp; Signal uses to provide accounts, publishing, and newsletter services.</p>
      <h2>Information you provide</h2><p>When you register, we store your name, email address, and a salted password hash, or the account details supplied by your Google sign-in. Profile details, articles, comments, and saved-story records are stored when you choose to add them.</p>
      <h2>Service and security data</h2><p>We store session tokens, verification and password-reset token hashes, moderation reports, and article-view records. Article views use a random browser identifier stored in an HTTP-only cookie and a one-way hash in the database. A small list of recently viewed article slugs is stored in your browser's local storage. Rate-limiting providers may process network identifiers to prevent abuse.</p>
      <h2>Newsletter and contact</h2><p>Newsletter addresses are stored only after you submit consent and verify the address. Unsubscribe records are retained to honor opt-outs. Contact messages are sent to our configured email provider and are not stored as platform content.</p>
      <h2>Service providers and retention</h2><p>We use hosting, database, image-storage, and email providers to operate the service. They process data under their own privacy terms. Account data remains while the account is active; operational records are retained only as needed for service, security, and legal obligations.</p><p>When enabled, AI writing suggestions send the article text you submit to the configured AI provider. Do not send information you are not authorized to share. Review that provider's data terms before enabling the feature.</p>
      <h2>Your choices</h2><p>You can update your profile, unsubscribe from the newsletter, and request access, correction, or deletion of your account data by contacting us. Authored content may require transfer or anonymization rather than deletion where needed to preserve publication records.</p>
      <h2>Contact</h2><p>For privacy requests, use the <Link href="/contact">contact form</Link>. This policy should be reviewed against the operator's location, provider contracts, and applicable law before production launch.</p>
    </article>
  );
}