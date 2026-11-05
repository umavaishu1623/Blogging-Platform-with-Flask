import type { Metadata } from "next";
import { unsubscribeNewsletter } from "@/lib/actions/newsletter";

export const metadata: Metadata = { title: "Unsubscribe" };

type UnsubscribeProps = { searchParams: Promise<{ token?: string }> };

export default async function UnsubscribePage({ searchParams }: UnsubscribeProps) {
  const { token } = await searchParams;
  return <section className="verify-page page-width"><p className="eyebrow">NEWSLETTER PREFERENCES</p><h1>Leave the list?</h1><p>Confirm below to stop receiving the Ink &amp; Signal newsletter.</p><form action={unsubscribeNewsletter}><input name="token" type="hidden" value={token ?? ""} /><button className="button" type="submit">Unsubscribe</button></form></section>;
}