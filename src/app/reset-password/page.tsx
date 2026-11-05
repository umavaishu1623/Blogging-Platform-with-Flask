import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/recovery-forms";

export const metadata: Metadata = { title: "Choose a new password" };

type ResetPasswordProps = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: ResetPasswordProps) {
  const { token } = await searchParams;
  const validTokenShape = token && /^[a-f0-9]{64}$/.test(token);
  return <section className="recovery-page page-width"><p className="eyebrow">ACCOUNT RECOVERY</p><h1>Set a new<br /><em>password.</em></h1>{validTokenShape ? <ResetPasswordForm token={token} /> : <p>This reset link is invalid. <Link href="/forgot-password">Request a new link</Link>.</p>}</section>;
}