"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerUser } from "@/lib/actions/auth";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerUser, {});

  return (
    <div className="auth-form-wrap">
      <form action={formAction} className="auth-form">
        <label htmlFor="name">Your name</label>
        <input autoComplete="name" id="name" maxLength={60} minLength={2} name="name" required />
        <label htmlFor="email">Email address</label>
        <input autoComplete="email" id="email" name="email" placeholder="you@example.com" required type="email" />
        <label htmlFor="password">Password</label>
        <input autoComplete="new-password" id="password" maxLength={72} minLength={12} name="password" required type="password" />
        <span className="field-hint">Use at least 12 characters.</span>
        <label htmlFor="confirmPassword">Confirm password</label>
        <input autoComplete="new-password" id="confirmPassword" maxLength={72} minLength={12} name="confirmPassword" required type="password" />
        <p aria-live="polite" className={`form-message ${state.error ? "is-error" : ""} ${state.success ? "is-success" : ""}`}>
          {state.error ?? state.success ?? ""}
        </p>
        <button className="button auth-submit" disabled={pending || Boolean(state.success)} type="submit">
          {pending ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
    </div>
  );
}