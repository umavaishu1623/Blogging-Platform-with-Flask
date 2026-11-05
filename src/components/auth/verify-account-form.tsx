"use client";

import Link from "next/link";
import { useActionState } from "react";
import { confirmEmailVerification } from "@/lib/actions/auth";

export function VerifyAccountForm({ email, token }: { email: string; token: string }) {
  const [state, formAction, pending] = useActionState(confirmEmailVerification, {});
  return <form action={formAction} className="verification-form"><input name="email" type="hidden" value={email} /><input name="token" type="hidden" value={token} /><p aria-live="polite" className={`form-message ${state.error ? "is-error" : ""} ${state.success ? "is-success" : ""}`}>{state.error ?? state.success ?? ""}</p>{state.success ? <Link className="button" href="/login">Continue to sign in</Link> : <button className="button" disabled={pending || !token} type="submit">{pending ? "Verifying..." : "Confirm email address"}</button>}</form>;
}