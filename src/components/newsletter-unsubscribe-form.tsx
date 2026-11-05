"use client";

import { useActionState } from "react";
import { unsubscribeNewsletter } from "@/lib/actions/newsletter";

export function NewsletterUnsubscribeForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(unsubscribeNewsletter, {});

  return (
    <form action={formAction} className="verification-form">
      <input name="token" type="hidden" value={token} />
      <p aria-live="polite" className={`form-message ${state.error ? "is-error" : ""} ${state.success ? "is-success" : ""}`}>
        {state.error ?? state.success ?? ""}
      </p>
      {state.success ? null : <button className="button" disabled={pending || !token} type="submit">{pending ? "Unsubscribing..." : "Unsubscribe"}</button>}
    </form>
  );
}