import type { Metadata } from "next";
import { ArticleCard } from "@/components/article-card";
import { getTrendingArticles } from "@/lib/articles";

export const metadata: Metadata = { title: "Trending stories" };
export const dynamic = "force-dynamic";

export default async function TrendingPage() {
  const articles = await getTrendingArticles();
  return <div className="listing-page page-width"><header className="listing-header compact-listing-header"><p className="eyebrow">READERS ARE SPENDING TIME WITH</p><h1>Trending <em>now.</em></h1><p>Stories read most often over the past seven days, with newest work as a fresh-start fallback.</p></header>{articles.length ? <div className="article-grid">{articles.map((article) => <ArticleCard article={article} key={article.id} />)}</div> : <div className="empty-listing"><div><h2>The conversation is just beginning.</h2><p>As readers discover stories, the most-read will rise to this shelf.</p></div></div>}</div>;
}