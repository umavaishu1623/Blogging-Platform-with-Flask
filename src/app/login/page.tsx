import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <section className="auth-page page-width">
      <div className="auth-aside">
        <p className="eyebrow">A PLACE FOR YOUR NEXT CHAPTER</p>
        <h1>Come back<br />to the <em>conversation.</em></h1>
        <p>Your reading list, your writing desk, and voices worth following are right where you left them.</p>
        <span className="auth-aside-mark" aria-hidden="true">i<span>.</span></span>
      </div>
      <div className="auth-panel">
        <p className="eyebrow">WELCOME BACK</p>
        <h2>Sign in</h2>
        <LoginForm />
      </div>
    </section>
  );
}