import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <section className="auth-page page-width">
      <div className="auth-aside">
        <p className="eyebrow">MAKE ROOM FOR GOOD IDEAS</p>
        <h1>Read deeply.<br /><em>Write honestly.</em></h1>
        <p>Join a thoughtful community of readers and independent writers. Start with a story that matters to you.</p>
        <span className="auth-aside-mark" aria-hidden="true">i<span>.</span></span>
      </div>
      <div className="auth-panel">
        <p className="eyebrow">YOUR ACCOUNT</p>
        <h2>Create account</h2>
        <RegisterForm />
      </div>
    </section>
  );
}