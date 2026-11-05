"use server";

import { createHash, randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { signIn } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/send";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getRequestIp } from "@/lib/security/request-ip";
import { z } from "zod";

export type AuthActionState = {
  error?: string;
  success?: string;
};

const loginSchema = z.object({
  email: z.string().email().max(254).transform((email) => email.trim().toLowerCase()),
  password: z.string().min(1).max(128),
});

const registrationSchema = z
  .object({
    name: z.string().trim().min(2).max(60),
    email: z.string().email().max(254).transform((email) => email.trim().toLowerCase()),
    password: z.string().min(12).max(72),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine((value) => new TextEncoder().encode(value.password).length <= 72, {
    path: ["password"],
    message: "Password is too long.",
  });

export async function loginUser(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const allowed = await checkRateLimit("login-action", parsed.data.email, 8, 900);
  if (!allowed) return { error: "Too many attempts. Please try again later." };

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email or password is incorrect, or the email is not verified." };
    }
    throw error;
  }

  return {};
}

export async function googleSignIn() {
  await signIn("google", { redirectTo: "/" });
}

export async function registerUser(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registrationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details." };

  const requestHeaders = await headers();
  const [emailAllowed, ipAllowed] = await Promise.all([
    checkRateLimit("registration-email", parsed.data.email, 4, 3600),
    checkRateLimit("registration-ip", getRequestIp(requestHeaders), 10, 3600),
  ]);
  if (!emailAllowed || !ipAllowed) return { error: "Too many attempts. Please try again later." };
  if (!process.env.APP_URL || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return { error: "Account email delivery is not configured yet." };
  }

  const genericResponse = "If registration is available for that address, a verification email will arrive shortly.";
  const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existingUser) return { success: genericResponse };

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const passwordHash = await hash(parsed.data.password, 12);
  let userId: string;

  try {
    const user = await prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: { name: parsed.data.name, email: parsed.data.email, passwordHash },
      });
      await transaction.verificationToken.create({
        data: {
          identifier: parsed.data.email,
          token: tokenHash,
          expires: new Date(Date.now() + 1000 * 60 * 60),
        },
      });
      return createdUser;
    });
    userId = user.id;
  } catch {
    return { success: genericResponse };
  }

  const verificationUrl = new URL("/verify", process.env.APP_URL);
  verificationUrl.searchParams.set("email", parsed.data.email);
  verificationUrl.searchParams.set("token", rawToken);

  try {
    await sendEmail({
      to: parsed.data.email,
      subject: "Verify your Ink & Signal account",
      html: `<p>Welcome to Ink &amp; Signal.</p><p><a href="${verificationUrl.toString()}">Verify your email address</a>. This link expires in one hour.</p>`,
    });
  } catch {
    await prisma.$transaction([
      prisma.verificationToken.deleteMany({ where: { identifier: parsed.data.email } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);
    return { success: genericResponse };
  }

  return { success: genericResponse };
}

export async function verifyEmail(email: string, rawToken: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!z.string().email().safeParse(normalizedEmail).success || !/^[a-f0-9]{64}$/.test(rawToken)) {
    return false;
  }

  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const token = await prisma.verificationToken.findUnique({ where: { token: tokenHash } });
  if (!token || token.identifier !== normalizedEmail || token.expires <= new Date()) return false;

  await prisma.$transaction([
    prisma.user.update({
      where: { email: normalizedEmail },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token: tokenHash } }),
  ]);
  return true;
}

export async function confirmEmailVerification(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get("email");
  const token = formData.get("token");
  if (typeof email !== "string" || typeof token !== "string") return { error: "This verification link is invalid." };
  const verified = await verifyEmail(email, token);
  return verified
    ? { success: "Email verified. You can now sign in." }
    : { error: "This verification link has expired or has already been used." };
}

export async function requestPasswordReset(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = z.object({ email: z.string().email().max(254) }).safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Enter a valid email address." };
  const email = parsed.data.email.trim().toLowerCase();
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "unknown";
  if (!(await checkRateLimit("password-reset", `${ip}:${email}`, 4, 3600))) {
    return { success: "If an account exists for that address, password reset instructions will arrive shortly." };
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, emailVerified: true } });
  if (user?.emailVerified && process.env.APP_URL && process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    await prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      create: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 1000 * 60 * 30) },
      update: { tokenHash, expiresAt: new Date(Date.now() + 1000 * 60 * 30) },
    });
    const resetUrl = new URL("/reset-password", process.env.APP_URL);
    resetUrl.searchParams.set("token", rawToken);
    try {
      await sendEmail({
        to: email,
        subject: "Reset your Ink & Signal password",
        html: `<p><a href="${resetUrl.toString()}">Choose a new password</a>. This link expires in 30 minutes.</p>`,
      });
    } catch {
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, tokenHash } });
    }
  }

  return { success: "If an account exists for that address, password reset instructions will arrive shortly." };
}

export async function resetPassword(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = z.object({
    token: z.string().regex(/^[a-f0-9]{64}$/),
    password: z.string().min(12).max(72),
    confirmPassword: z.string(),
  }).refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your password." };
  if (new TextEncoder().encode(parsed.data.password).length > 72) return { error: "Password is too long." };

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!reset || reset.expiresAt <= new Date()) return { error: "This reset link has expired. Request a new one." };
  const passwordHash = await hash(parsed.data.password, 12);
  const updated = await prisma.$transaction(async (transaction) => {
    const consumed = await transaction.passwordResetToken.deleteMany({
      where: { id: reset.id, tokenHash, expiresAt: { gt: new Date() } },
    });
    if (consumed.count !== 1) return false;
    await transaction.user.update({ where: { id: reset.userId }, data: { passwordHash } });
    return true;
  });
  return updated ? { success: "Password updated. You can now sign in." } : { error: "This reset link has already been used." };
}