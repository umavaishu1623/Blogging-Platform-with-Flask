"use client";

import { useActionState } from "react";
import { sendContactMessage } from "@/lib/actions/contact";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContactMessage, {});

  return (
    <form action={formAction} className="contact-form">
      <label htmlFor="contact-name">Name</label><input autoComplete="name" id="contact-name" maxLength={80} minLength={2} name="name" required />
      <label htmlFor="contact-email">Email</label><input autoComplete="email" id="contact-email" name="email" required type="email" />
      <label htmlFor="contact-subject">Subject</label><input id="contact-subject" maxLength={120} minLength={3} name="subject" required />
      <label htmlFor="contact-message">Message</label><textarea id="contact-message" maxLength={6000} minLength={20} name="message" required rows={6} />
      <p aria-live="polite" className={`form-message ${state.error ? "is-error" : ""} ${state.success ? "is-success" : ""}`}>{state.error ?? state.success ?? ""}</p>
      <button className="button" disabled={pending} type="submit">{pending ? "Sending..." : "Send message"}</button>
    </form>
  );
}