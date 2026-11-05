"use server";

import { createHash, randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/send";
import { checkRateLimit } from "@/lib/security/rate-limit";
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

  const allowed = await checkRateLimit("registration", parsed.data.email, 4, 3600);
  if (!allowed) return { error: "Too many attempts. Please try again later." };
  if (!process.env.APP_URL || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return { error: "Account email delivery is not configured yet." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existingUser) return { success: "If registration is available for that address, a verification email will arrive shortly." };

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const passwordHash = await hash(parsed.data.password, 12);
  let userId: string;

  try {
    const user = await prisma.user.create({
      data: { name: parsed.data.name, email: parsed.data.email, passwordHash },
    });
    userId = user.id;
    await prisma.verificationToken.create({
      data: {
        identifier: parsed.data.email,
        token: tokenHash,
        expires: new Date(Date.now() + 1000 * 60 * 60),
      },
    });
  } catch {
    return { success: "If registration is available for that address, a verification email will arrive shortly." };
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
    return { error: "We could not send the verification email. Please try again later." };
  }

  return { success: "Check your inbox for a verification link. It expires in one hour." };
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