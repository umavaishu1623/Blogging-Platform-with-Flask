"use server";

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/send";
import { checkRateLimit } from "@/lib/security/rate-limit";

export type NewsletterState = { error?: string; success?: string };

export async function subscribeNewsletter(
  _previousState: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = z.object({ email: z.string().email().max(254), consent: z.literal("on") })
    .safeParse({ email: formData.get("email"), consent: formData.get("consent") });
  if (!parsed.success) return { error: "Enter your email and confirm the subscription." };

  const email = parsed.data.email.trim().toLowerCase();
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "unknown";
  if (!(await checkRateLimit("newsletter", ip, 5, 3600))) {
    return { error: "Too many requests. Please try again later." };
  }
  if (!process.env.APP_URL || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return { error: "Newsletter signup is not configured yet." };
  }

  const rawVerification = randomBytes(32).toString("hex");
  const rawUnsubscribe = randomBytes(32).toString("hex");
  const verificationTokenHash = createHash("sha256").update(rawVerification).digest("hex");
  const unsubscribeTokenHash = createHash("sha256").update(rawUnsubscribe).digest("hex");
  await prisma.newsletterSubscription.upsert({
    where: { email },
    create: { email, consentAt: new Date(), verificationTokenHash, unsubscribeTokenHash },
    update: { consentAt: new Date(), verifiedAt: null, unsubscribedAt: null, verificationTokenHash, unsubscribeTokenHash },
  });

  const verifyUrl = new URL("/newsletter/verify", process.env.APP_URL);
  verifyUrl.searchParams.set("token", rawVerification);
  const unsubscribeUrl = new URL("/newsletter/unsubscribe", process.env.APP_URL);
  unsubscribeUrl.searchParams.set("token", rawUnsubscribe);

  try {
    await sendEmail({
      to: email,
      subject: "Confirm your Ink & Signal subscription",
      html: `<p>Confirm your newsletter subscription:</p><p><a href="${verifyUrl.toString()}">Verify my email</a></p><p><a href="${unsubscribeUrl.toString()}">Cancel this subscription</a></p>`,
    });
  } catch {
    return { error: "We could not send the confirmation email. Please try again later." };
  }

  return { success: "Check your inbox for a confirmation link. Your subscription begins after verification." };
}

export async function verifyNewsletter(rawToken: string) {
  if (!/^[a-f0-9]{64}$/.test(rawToken)) return false;
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const result = await prisma.newsletterSubscription.updateMany({
    where: { verificationTokenHash: tokenHash, unsubscribedAt: null },
    data: { verifiedAt: new Date(), verificationTokenHash: null },
  });
  return result.count === 1;
}

export async function confirmNewsletter(
  _previousState: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const token = formData.get("token");
  if (typeof token !== "string" || !(await verifyNewsletter(token))) {
    return { error: "This confirmation link has expired or has already been used." };
  }
  return { success: "Your email is confirmed. Thanks for subscribing." };
}

export async function unsubscribeNewsletter(
  _previousState: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const token = formData.get("token");
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
    return { error: "This unsubscribe link is invalid." };
  }
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const result = await prisma.newsletterSubscription.updateMany({
    where: { unsubscribeTokenHash: tokenHash, unsubscribedAt: null },
    data: { unsubscribedAt: new Date(), verificationTokenHash: null },
  });
  revalidatePath("/");
  return result.count === 1
    ? { success: "You have been unsubscribed." }
    : { error: "This link has expired or has already been used." };
}