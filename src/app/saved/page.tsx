import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { ArticleCard } from "@/components/article-card";

export const metadata: Metadata = { title: "Saved stories" };

export default async function SavedPage() {
  const user = await requireUser();
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: user.id, blog: { status: "PUBLISHED", publishedAt: { lte: new Date() } } },
    include: { blog: { include: { author: true, categories: true, tags: true } } },
    orderBy: { createdAt: "desc" },
  });
  const articles = bookmarks.map(({ blog }) => blog);

  return (
    <div className="listing-page page-width">
      <header className="listing-header compact-listing-header"><p className="eyebrow">YOUR PERSONAL SHELF</p><h1>Saved <em>stories.</em></h1><p>Good reads, kept close for another moment.</p></header>
      {articles.length ? <div className="article-grid">{articles.map((article) => <ArticleCard article={article} key={article.id} />)}</div> : <div className="empty-listing"><div><h2>A shelf with room to grow.</h2><p>Bookmark a story while you read, and it will find a place here.</p></div><Link className="underlined-link" href="/explore">Explore stories</Link></div>}
    </div>
  );
}