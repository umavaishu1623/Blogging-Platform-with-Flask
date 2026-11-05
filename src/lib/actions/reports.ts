"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";

export type ReportState = { error?: string; success?: string };

export async function reportContent(
  blogId: string,
  commentId: string | null,
  _previousState: ReportState,
  formData: FormData,
): Promise<ReportState> {
  const user = await requireUser();
  const parsed = z.object({ reason: z.string().trim().min(10).max(1000) }).safeParse({ reason: formData.get("reason") });
  if (!parsed.success || !/^[a-z0-9]{20,30}$/i.test(blogId)) return { error: "Add a short reason for this report." };
  if (!(await checkRateLimit("report", user.id, 5, 3600))) return { error: "Report limit reached. Try again later." };

  const blog = await prisma.blog.findFirst({
    where: { id: blogId, status: "PUBLISHED", publishedAt: { lte: new Date() } },
    select: { id: true, slug: true },
  });
  if (!blog) return { error: "This story is not available." };
  if (commentId) {
    const comment = await prisma.comment.findFirst({ where: { id: commentId, blogId, status: "VISIBLE" }, select: { id: true } });
    if (!comment) return { error: "This response is not available." };
  }

  const existing = await prisma.report.findFirst({
    where: { reporterId: user.id, blogId, commentId, status: "OPEN" },
    select: { id: true },
  });
  if (!existing) await prisma.report.create({ data: { reporterId: user.id, blogId, commentId, reason: parsed.data.reason } });
  revalidatePath(`/blog/${blog.slug}`);
  return { success: "Thank you. The moderation team will review this report." };
}