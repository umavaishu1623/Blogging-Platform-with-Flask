"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";

export type ProfileState = { error?: string; success?: string };

export async function updateProfile(
  _previousState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireUser();
  const parsed = z.object({
    name: z.string().trim().min(2).max(60),
    bio: z.string().trim().max(500),
    website: z.union([z.literal(""), z.string().url().refine((value) => value.startsWith("https://"))]),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your profile details." };
  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, bio: parsed.data.bio || null, website: parsed.data.website || null },
  });
  revalidatePath("/profile");
  revalidatePath(`/authors/${user.id}`);
  return { success: "Profile updated." };
}