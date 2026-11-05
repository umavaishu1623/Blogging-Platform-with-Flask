import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/recovery-forms";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return <section className="recovery-page page-width"><p className="eyebrow">ACCOUNT RECOVERY</p><h1>Find your way<br /><em>back in.</em></h1><p>Enter the email address on your account. If it is verified, we will send a one-time reset link.</p><ForgotPasswordForm /></section>;
}