import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getCategories } from "@/lib/articles";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="listing-page page-width">
      <header className="listing-header compact-listing-header">
        <p className="eyebrow"><span className="section-index">02</span> FOLLOW YOUR CURIOSITY</p>
        <h1>Rooms for<br /><em>every idea.</em></h1>
        <p>Explore the journal by subject. Find a familiar corner or wander somewhere new.</p>
      </header>
      {categories.length ? <div className="category-grid">
        {categories.map((category, index) => (
          <Link className="category-tile" href={`/categories/${category.slug}`} key={category.id}>
            <span className="category-number">0{index + 1}</span>
            <span className="category-tile-title">{category.name}</span>
            <span className="category-tile-link">Explore <ArrowUpRight size={16} /></span>
          </Link>
        ))}
      </div> : (
        <div className="empty-listing"><div><h2>Categories will grow with the journal.</h2><p>Once stories are published, their subjects will be collected here.</p></div></div>
      )}
    </div>
  );
}