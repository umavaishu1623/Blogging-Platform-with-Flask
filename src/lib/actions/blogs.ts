"use server";

import { BlogStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole, requireUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { parseRichContent, slugSchema } from "@/lib/validation/rich-content";

export type BlogActionState = { error?: string };

const blogFields = z.object({
  title: z.string().trim().max(180),
  slug: slugSchema,
  description: z.string().trim().max(320),
  content: z.string().min(2),
  coverImageUrl: z.union([
    z.string().url().refine((value) => {
      try {
        const url = new URL(value);
        return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
      } catch {
        return false;
      }
    }),
    z.literal(""),
  ]),
  coverImageAlt: z.string().max(250),
  categories: z.string().max(500),
  tags: z.string().max(500),
  seoTitle: z.string().max(70),
  seoDescription: z.string().max(180),
  scheduledFor: z.string(),
  status: z.nativeEnum(BlogStatus),
});

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}

function taxonomyNames(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim().slice(0, 60)).filter(Boolean))].slice(0, 12);
}

function taxonomyConnect(value: string) {
  return taxonomyNames(value).map((name) => {
    const slug = slugify(name);
    return { where: { slug }, create: { name, slug } };
  });
}

export async function becomeAuthor() {
  const user = await requireUser();
  if (user.role === "READER") {
    await prisma.user.update({ where: { id: user.id }, data: { role: "AUTHOR" } });
  }
  revalidatePath("/write");
  redirect("/write");
}

async function saveBlog(
  blogId: string | null,
  _previousState: BlogActionState,
  formData: FormData,
): Promise<BlogActionState> {
  const user = await requireRole("AUTHOR", "ADMIN");
  const parsed = blogFields.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the article details." };

  const content = parseRichContent(parsed.data.content);
  if (!content) return { error: "The article content is invalid or too large." };
  const isDraft = parsed.data.status === "DRAFT";
  if (!isDraft && parsed.data.title.length < 5) return { error: "Published stories need a title of at least five characters." };
  if (!isDraft && parsed.data.description.length < 20) return { error: "Published stories need a description of at least 20 characters." };
  const titleSlug = slugify(parsed.data.title) || (isDraft ? `draft-${Date.now().toString(36)}` : "");
  if (!titleSlug) return { error: "Add a title containing letters or numbers." };
  const slug = parsed.data.slug || titleSlug;
  const existing = blogId ? await prisma.blog.findUnique({ where: { id: blogId } }) : null;
  if (blogId && (!existing || (existing.authorId !== user.id && user.role !== "ADMIN"))) {
    return { error: "You cannot edit this article." };
  }

  const duplicate = await prisma.blog.findFirst({ where: { slug, ...(blogId ? { id: { not: blogId } } : {}) }, select: { id: true } });
  if (duplicate) return { error: "That story URL is already in use." };

  const scheduledFor = parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : null;
  if (parsed.data.status === "SCHEDULED" && (!scheduledFor || Number.isNaN(scheduledFor.valueOf()) || scheduledFor <= new Date())) {
    return { error: "Choose a future publication time." };
  }
  if (parsed.data.status === "SCHEDULED" && Math.abs(scheduledFor!.getTime() - Date.now()) > 365 * 24 * 60 * 60 * 1000) {
    return { error: "Articles can be scheduled up to one year ahead." };
  }
  if (!(await checkRateLimit("save-article", user.id, 30, 3600))) {
    return { error: "You have saved several changes recently. Try again later." };
  }

  const publishedAt = parsed.data.status === "PUBLISHED" ? existing?.publishedAt ?? new Date() : null;
  const data = {
    title: parsed.data.title,
    slug,
    description: parsed.data.description,
    content: content as Prisma.InputJsonValue,
    coverImageUrl: parsed.data.coverImageUrl || null,
    coverImageAlt: parsed.data.coverImageAlt || null,
    status: parsed.data.status,
    publishedAt,
    scheduledFor: parsed.data.status === "SCHEDULED" ? scheduledFor : null,
    seoTitle: parsed.data.seoTitle || null,
    seoDescription: parsed.data.seoDescription || null,
    categories: { set: [], connectOrCreate: taxonomyConnect(parsed.data.categories) },
    tags: { set: [], connectOrCreate: taxonomyConnect(parsed.data.tags) },
  };

  let saved;
  try {
    saved = blogId
      ? await prisma.blog.update({ where: { id: blogId }, data })
      : await prisma.blog.create({ data: { ...data, author: { connect: { id: user.id } } } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "A category, tag, or story URL already exists. Review the details and try again." };
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/dashboard");
  revalidatePath(`/blog/${saved.slug}`);
  if (parsed.data.status === "PUBLISHED" && existing?.status !== "PUBLISHED") {
    const followers = await prisma.follow.findMany({ where: { followingId: user.id }, select: { followerId: true } });
    if (followers.length) {
      await prisma.notification.createMany({
        data: followers.map(({ followerId }) => ({ userId: followerId, actorId: user.id, blogId: saved.id, type: "ARTICLE_PUBLISHED" as const })),
      });
      revalidatePath("/notifications");
    }
  }
  redirect(`/dashboard/articles?notice=${parsed.data.status.toLowerCase()}`);
}

export async function createBlog(previousState: BlogActionState, formData: FormData) {
  return saveBlog(null, previousState, formData);
}

export async function updateBlog(blogId: string, previousState: BlogActionState, formData: FormData) {
  if (!/^[a-z0-9]{20,30}$/i.test(blogId)) return { error: "Invalid article." };
  return saveBlog(blogId, previousState, formData);
}

export async function deleteBlog(blogId: string) {
  const user = await requireRole("AUTHOR", "ADMIN");
  if (!/^[a-z0-9]{20,30}$/i.test(blogId)) return;
  const blog = await prisma.blog.findUnique({ where: { id: blogId }, select: { authorId: true, slug: true } });
  if (!blog || (blog.authorId !== user.id && user.role !== "ADMIN")) return;
  await prisma.blog.delete({ where: { id: blogId } });
  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/dashboard/articles");
}