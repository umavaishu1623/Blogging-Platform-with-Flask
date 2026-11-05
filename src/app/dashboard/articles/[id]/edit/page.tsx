import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogEditor } from "@/components/editor/blog-editor";
import { requireRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = { title: "Edit story" };

type EditPageProps = { params: Promise<{ id: string }> };

export default async function EditArticlePage({ params }: EditPageProps) {
  const user = await requireRole("AUTHOR", "ADMIN");
  const { id } = await params;
  const article = await prisma.blog.findFirst({
    where: { id, ...(user.role === "ADMIN" ? {} : { authorId: user.id }) },
    include: { categories: { select: { name: true } }, tags: { select: { name: true } } },
  });
  if (!article) notFound();

  return <section className="editor-page"><div className="editor-page-heading page-width"><p className="eyebrow">THE WRITING DESK / EDIT</p><h1>Edit story</h1></div><BlogEditor article={{ ...article, categoryNames: article.categories.map((item) => item.name).join(", "), tagNames: article.tags.map((item) => item.name).join(", ") }} /></section>;
}