"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";

const idSchema = z.string().min(1).max(32);

export type CommentActionState = { error?: string; success?: string };

export async function toggleLike(blogId: string, slug: string) {
  const user = await requireUser();
  if (!idSchema.safeParse(blogId).success) return;
  const blog = await prisma.blog.findFirst({
    where: { id: blogId, status: "PUBLISHED", publishedAt: { lte: new Date() } },
    select: { id: true },
  });
  if (!blog) return;

  const where = { userId_blogId: { userId: user.id, blogId } };
  const existing = await prisma.like.findUnique({ where });
  if (existing) await prisma.like.delete({ where });
  else await prisma.like.create({ data: { userId: user.id, blogId } });
  revalidatePath(`/blog/${slug}`);
}

export async function toggleBookmark(blogId: string, slug: string) {
  const user = await requireUser();
  if (!idSchema.safeParse(blogId).success) return;
  const blog = await prisma.blog.findFirst({
    where: { id: blogId, status: "PUBLISHED", publishedAt: { lte: new Date() } },
    select: { id: true },
  });
  if (!blog) return;

  const where = { userId_blogId: { userId: user.id, blogId } };
  const existing = await prisma.bookmark.findUnique({ where });
  if (existing) await prisma.bookmark.delete({ where });
  else await prisma.bookmark.create({ data: { userId: user.id, blogId } });
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/saved");
}

export async function toggleFollow(followingId: string) {
  const user = await requireUser();
  if (user.id === followingId || !idSchema.safeParse(followingId).success) return;
  const author = await prisma.user.findFirst({
    where: { id: followingId, role: { in: ["AUTHOR", "ADMIN"] }, blogs: { some: { status: "PUBLISHED" } } },
    select: { id: true },
  });
  if (!author) return;
  const where = { followerId_followingId: { followerId: user.id, followingId } };
  const existing = await prisma.follow.findUnique({ where });
  if (existing) await prisma.follow.delete({ where });
  else {
    await prisma.follow.create({ data: { followerId: user.id, followingId } });
    await prisma.notification.create({
      data: { userId: followingId, actorId: user.id, type: "FOLLOW" },
    });
    revalidatePath("/notifications");
  }
  revalidatePath(`/authors/${followingId}`);
}

export async function postComment(
  blogId: string,
  parentId: string | null,
  _previousState: CommentActionState,
  formData: FormData,
): Promise<CommentActionState> {
  const user = await requireUser();
  const parsed = z.object({ body: z.string().trim().min(2).max(5000) }).safeParse({
    body: formData.get("body"),
  });
  if (!parsed.success || !idSchema.safeParse(blogId).success) {
    return { error: "Write a response of up to 5,000 characters." };
  }
  if (!(await checkRateLimit("comment", user.id, 12, 3600))) {
    return { error: "You have posted several responses recently. Try again later." };
  }

  const blog = await prisma.blog.findFirst({
    where: { id: blogId, status: "PUBLISHED", publishedAt: { lte: new Date() } },
    select: { slug: true, authorId: true },
  });
  if (!blog) return { error: "This story is not available for responses." };

  let recipientId = blog.authorId;
  let notificationType: "COMMENT" | "REPLY" = "COMMENT";
  if (parentId) {
    const parent = await prisma.comment.findFirst({
      where: { id: parentId, blogId, parentId: null, status: "VISIBLE" },
      select: { id: true, authorId: true },
    });
    if (!parent) return { error: "This response thread is no longer available." };
    recipientId = parent.authorId;
    notificationType = "REPLY";
  }

  const comment = await prisma.comment.create({
    data: { blogId, authorId: user.id, parentId, body: parsed.data.body },
  });
  if (recipientId !== user.id) {
    await prisma.notification.create({
      data: { userId: recipientId, actorId: user.id, blogId, commentId: comment.id, type: notificationType },
    });
    revalidatePath("/notifications");
  }
  revalidatePath(`/blog/${blog.slug}`);
  return { success: "Your response has been posted." };
}