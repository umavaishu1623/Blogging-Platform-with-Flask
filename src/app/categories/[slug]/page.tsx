import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/article-card";
import { prisma } from "@/lib/db/prisma";
import { searchArticles } from "@/lib/articles";

type CategoryPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!process.env.DATABASE_URL) return { title: "Category" };
  const category = await prisma.category.findUnique({ where: { slug } });
  return { title: category?.name ?? "Category", description: `Stories filed under ${category?.name ?? "this category"}.` };
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  if (!process.env.DATABASE_URL) notFound();
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();
  const { articles } = await searchArticles({ category: slug });

  return (
    <div className="listing-page page-width">
      <header className="listing-header compact-listing-header">
        <p className="eyebrow">THE JOURNAL / CATEGORY</p>
        <h1>{category.name}<em>.</em></h1>
        <p>Recent writing and considered perspectives in {category.name.toLowerCase()}.</p>
      </header>
      {articles.length ? <div className="article-grid">{articles.map((article) => <ArticleCard article={article} key={article.id} />)}</div> : (
        <div className="empty-listing"><div><h2>This shelf is waiting.</h2><p>There are no published stories in this category yet.</p></div></div>
      )}
    </div>
  );
}