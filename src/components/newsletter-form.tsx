"use client";

import { useActionState } from "react";
import { subscribeNewsletter } from "@/lib/actions/newsletter";

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeNewsletter, {});

  return (
    <form action={formAction} className="newsletter-form">
      <label className="sr-only" htmlFor="newsletter-email">Email address</label>
      <input autoComplete="email" id="newsletter-email" name="email" placeholder="Your email address" required type="email" />
      <button className="button button-dark" disabled={pending} type="submit">{pending ? "Sending..." : "Subscribe"}</button>
      <label className="newsletter-consent"><input name="consent" required type="checkbox" /> I agree to receive the Ink &amp; Signal newsletter.</label>
      <p aria-live="polite" className={`newsletter-message ${state.error ? "is-error" : ""}`}>{state.error ?? state.success ?? ""}</p>
    </form>
  );
}