import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterVerifyForm } from "@/components/newsletter-verify-form";

export const metadata: Metadata = { title: "Confirm newsletter" };

type VerifyNewsletterProps = { searchParams: Promise<{ token?: string }> };

export default async function VerifyNewsletterPage({ searchParams }: VerifyNewsletterProps) {
  const { token } = await searchParams;
  return <section className="verify-page page-width"><p className="eyebrow">THE INK &amp; SIGNAL LETTER</p><h1>One last step.</h1><p>Confirm your address to complete your subscription.</p>{token ? <NewsletterVerifyForm token={token} /> : <Link className="button" href="/">Back to the journal</Link>}</section>;
}