import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { ArticleCard } from "@/components/article-card";
import { searchArticles, getCategories } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Explore stories",
  description: "Browse thoughtful writing from independent voices across every subject.",
};

export default async function ExplorePage() {
  const [{ articles }, categories] = await Promise.all([searchArticles(), getCategories()]);

  return (
    <div className="listing-page page-width">
      <header className="listing-header">
        <p className="eyebrow"><span className="section-index">01</span> THE OPEN SHELF</p>
        <h1>Find your next<br /><em>good read.</em></h1>
        <p>Essays, field notes, and new perspectives from people with something to say.</p>
        <form action="/search" className="search-form">
          <Search aria-hidden="true" size={18} />
          <input aria-label="Search stories" name="q" placeholder="Search stories, ideas, writers..." />
          <button className="button" type="submit">Search</button>
        </form>
      </header>

      {categories.length > 0 && (
        <nav aria-label="Browse by category" className="category-strip">
          <span>Browse by</span>
          {categories.map((category) => <Link href={`/categories/${category.slug}`} key={category.id}>{category.name}</Link>)}
        </nav>
      )}

      <div className="listing-section-heading">
        <div><p className="eyebrow">A LITTLE OF EVERYTHING</p><h2>All stories</h2></div>
        <span>{articles.length} {articles.length === 1 ? "story" : "stories"}</span>
      </div>
      {articles.length ? (
        <div className="article-grid">{articles.map((article) => <ArticleCard article={article} key={article.id} />)}</div>
      ) : (
        <div className="empty-listing">
          <span className="empty-icon"><Search size={20} /></span>
          <div><h2>A fresh page, for now.</h2><p>Published stories will appear here. Search a topic or be the first to write one.</p></div>
          <Link className="underlined-link" href="/write">Start a story <ArrowRight size={15} /></Link>
        </div>
      )}
    </div>
  );
}