"use client";

import { useActionState } from "react";
import { confirmNewsletter } from "@/lib/actions/newsletter";

export function NewsletterVerifyForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(confirmNewsletter, {});
  return <form action={formAction} className="verification-form"><input name="token" type="hidden" value={token} /><p aria-live="polite" className={`form-message ${state.error ? "is-error" : ""} ${state.success ? "is-success" : ""}`}>{state.error ?? state.success ?? ""}</p><button className="button" disabled={pending || !token} type="submit">{pending ? "Confirming..." : "Confirm subscription"}</button></form>;
}