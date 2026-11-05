"use client";

import Link from "next/link";
import { useActionState } from "react";
import { googleSignIn, loginUser } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginUser, {});

  return (
    <div className="auth-form-wrap">
      <form action={googleSignIn}>
        <button className="oauth-button" type="submit"><span aria-hidden="true">G</span> Continue with Google</button>
      </form>
      <div className="auth-divider"><span>or use email</span></div>
      <form action={formAction} className="auth-form">
        <label htmlFor="email">Email address</label>
        <input autoComplete="email" id="email" name="email" placeholder="you@example.com" required type="email" />
        <div className="password-label-row">
          <label htmlFor="password">Password</label>
          <Link href="/forgot-password">Forgot password?</Link>
        </div>
        <input autoComplete="current-password" id="password" name="password" required type="password" />
        <p aria-live="polite" className={state.error ? "form-message is-error" : "form-message"}>{state.error ?? ""}</p>
        <button className="button auth-submit" disabled={pending} type="submit">
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="auth-switch">New to Ink &amp; Signal? <Link href="/register">Create an account</Link></p>
    </div>
  );
}