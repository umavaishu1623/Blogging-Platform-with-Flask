"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, resetPassword } from "@/lib/actions/auth";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, {});
  return (
    <div className="auth-form-wrap">
      <form action={formAction} className="auth-form">
        <label htmlFor="reset-email">Email address</label>
        <input autoComplete="email" id="reset-email" name="email" required type="email" />
        <p aria-live="polite" className={`form-message ${state.error ? "is-error" : ""} ${state.success ? "is-success" : ""}`}>{state.error ?? state.success ?? ""}</p>
        <button className="button auth-submit" disabled={pending} type="submit">{pending ? "Sending..." : "Send reset link"}</button>
      </form>
      <p className="auth-switch"><Link href="/login">Back to sign in</Link></p>
    </div>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, {});
  return (
    <div className="auth-form-wrap">
      <form action={formAction} className="auth-form">
        <input name="token" type="hidden" value={token} />
        <label htmlFor="new-password">New password</label>
        <input autoComplete="new-password" id="new-password" maxLength={72} minLength={12} name="password" required type="password" />
        <label htmlFor="confirm-password">Confirm password</label>
        <input autoComplete="new-password" id="confirm-password" maxLength={72} minLength={12} name="confirmPassword" required type="password" />
        <p aria-live="polite" className={`form-message ${state.error ? "is-error" : ""} ${state.success ? "is-success" : ""}`}>{state.error ?? state.success ?? ""}</p>
        {state.success ? <Link className="button auth-submit" href="/login">Continue to sign in</Link> : <button className="button auth-submit" disabled={pending} type="submit">{pending ? "Updating..." : "Set new password"}</button>}
      </form>
    </div>
  );
}