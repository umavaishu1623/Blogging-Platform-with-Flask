import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/article-card";
import { getCategories, searchArticles } from "@/lib/articles";

export const metadata: Metadata = { title: "Search stories" };

type SearchPageProps = {
  searchParams: Promise<{ q?: string; category?: string; tag?: string; page?: string }>;
};

function pageHref(query: string, category: string, tag: string, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (category) params.set("category", category);
  if (tag) params.set("tag", tag);
  params.set("page", String(page));
  return `/search?${params.toString()}`;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 120) ?? "";
  const category = params.category?.slice(0, 80) ?? "";
  const tag = params.tag?.slice(0, 80) ?? "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const [{ articles, totalPages }, categories] = await Promise.all([
    searchArticles({ query, category, tag, page }),
    getCategories(),
  ]);

  return (
    <div className="listing-page page-width">
      <header className="search-results-header">
        <p className="eyebrow">THE JOURNAL / SEARCH</p>
        <h1>{query ? <>Results for <em>“{query}”</em></> : "Search the journal"}</h1>
        <form action="/search" className="search-form">
          <input aria-label="Search stories" defaultValue={query} name="q" placeholder="Search stories, ideas, writers..." />
          <button className="button" type="submit">Search</button>
        </form>
        <form action="/search" className="filter-form">
          <input name="q" type="hidden" value={query} />
          <label htmlFor="category">Category</label>
          <select defaultValue={category} id="category" name="category">
            <option value="">All categories</option>
            {categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
          </select>
          <label htmlFor="tag">Tag slug</label>
          <input defaultValue={tag} id="tag" name="tag" placeholder="e.g. creativity" />
          <button className="filter-button" type="submit">Apply filters</button>
        </form>
      </header>

      <div className="listing-section-heading">
        <div><p className="eyebrow">{query || category || tag ? "MATCHING STORIES" : "LATEST"}</p><h2>{articles.length ? `${articles.length} on this page` : "No stories found"}</h2></div>
      </div>
      {articles.length ? <div className="article-grid">{articles.map((article) => <ArticleCard article={article} key={article.id} />)}</div> : (
        <div className="empty-listing"><div><h2>Nothing on this page yet.</h2><p>Try a broader phrase or clear one of the filters.</p></div><Link className="underlined-link" href="/explore">Browse all stories</Link></div>
      )}
      {totalPages > 1 && <nav aria-label="Search result pages" className="pagination">
        {page > 1 && <Link href={pageHref(query, category, tag, page - 1)}>Previous</Link>}
        <span>Page {page} of {totalPages}</span>
        {page < totalPages && <Link href={pageHref(query, category, tag, page + 1)}>Next</Link>}
      </nav>}
    </div>
  );
}