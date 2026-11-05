import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms and conditions" };

export default function TermsPage() {
  return (
    <article className="legal-page page-width">
      <p className="eyebrow">LAST UPDATED: NOVEMBER 5, 2026</p>
      <h1>Terms and conditions</h1>
      <p className="legal-lede">By using Ink &amp; Signal, you agree to these terms. The platform is an early publishing service; additional policies may apply when the service launches publicly.</p>
      <h2>Your account</h2><p>Keep your account credentials secure and provide an email address you control. You are responsible for activity performed through your account and for maintaining accurate profile information.</p>
      <h2>Your writing</h2><p>You retain ownership of work you submit. You grant Ink &amp; Signal a non-exclusive license to host, display, distribute, and make that work available as required to operate the service. You must have the rights needed to publish your content and media.</p>
      <h2>Community standards</h2><p>Do not publish unlawful, infringing, deceptive, abusive, or malicious content; interfere with the service; attempt to access accounts or data without authorization; or misuse reporting, comments, or messaging. We may hide content or restrict accounts to protect readers and the service, and we will provide a moderation process as it is implemented.</p>
      <h2>Availability and liability</h2><p>The service is provided as available. We work to keep it reliable and secure but cannot promise uninterrupted access or that every published contribution is accurate. To the extent allowed by applicable law, we are not liable for indirect or consequential loss from use of the service.</p>
      <h2>Changes and contact</h2><p>We may update these terms as features and legal requirements evolve. Material changes will be posted here. For questions, use the <Link href="/contact">contact form</Link>. These terms should receive jurisdiction-specific legal review before public launch.</p>
    </article>
  );
}