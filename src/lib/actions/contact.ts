"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { sendEmail } from "@/lib/email/send";
import { checkRateLimit } from "@/lib/security/rate-limit";

export type ContactState = { error?: string; success?: string };

export async function sendContactMessage(
  _previousState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().email().max(254),
    subject: z.string().trim().min(3).max(120),
    message: z.string().trim().min(20).max(6000),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please complete each field. Messages should be at least 20 characters." };

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "unknown";
  if (!(await checkRateLimit("contact", ip, 4, 3600))) return { error: "Message limit reached. Try again later." };
  const recipient = process.env.CONTACT_EMAIL;
  if (!recipient) return { error: "The contact form is not configured yet." };

  try {
    await sendEmail({
      to: recipient,
      subject: `Contact form: ${parsed.data.subject}`,
      html: `<p>From: ${parsed.data.name.replace(/[&<>"']/g, "")}</p><p>Reply to: ${parsed.data.email.replace(/[&<>"']/g, "")}</p><p>${parsed.data.message.replace(/[&<>"']/g, "")}</p>`,
    });
  } catch {
    return { error: "We could not send your message. Please try again later." };
  }
  return { success: "Thanks for reaching out. Your message has been sent." };
}