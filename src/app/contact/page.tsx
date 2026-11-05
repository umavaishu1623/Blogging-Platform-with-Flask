import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="contact-page page-width">
      <div><p className="eyebrow">SOMETHING ON YOUR MIND?</p><h1>Let's talk<br /><em>it through.</em></h1><p className="contact-copy">Questions about publishing, account access, or the journal? Send a note and our team will get back to you.</p></div>
      <ContactForm />
    </div>
  );
}