import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { RichText } from "@/components/rich-text";
import { getReadingMinutes } from "@/lib/articles";
import Link from "next/link";

export const metadata: Metadata = { title: "Story preview" };

type PreviewPageProps = { params: Promise<{ id: string }> };

export default async function ArticlePreviewPage({ params }: PreviewPageProps) {
  const user = await requireRole("AUTHOR", "ADMIN");
  const { id } = await params;
  const article = await prisma.blog.findFirst({
    where: { id, ...(user.role === "ADMIN" ? {} : { authorId: user.id }) },
    include: { author: { select: { id: true, name: true } }, categories: true, tags: true },
  });
  if (!article) notFound();

  return <article className="article-page page-width"><Link className="back-link" href={`/dashboard/articles/${article.id}/edit`}>Back to editor</Link><p className="preview-banner">Preview only. This story is not public yet.</p><header className="article-header"><div className="article-topic-row">{article.categories.map((category) => <span key={category.id}>{category.name}</span>)}</div><h1>{article.title || "Untitled draft"}</h1><p className="article-deck">{article.description}</p><div className="article-byline"><div><strong>{article.author.name ?? "Ink & Signal contributor"}</strong></div><span className="reading-time">{getReadingMinutes(article.content)} min read</span></div></header>{article.coverImageUrl && <div className="article-cover"><Image alt={article.coverImageAlt ?? ""} fill sizes="(max-width: 900px) 100vw, 900px" src={article.coverImageUrl} /></div>}<div className="article-body-layout"><div /><div className="article-body"><RichText content={article.content} /></div></div></article>;
}