"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type RecentArticle = { id: string; slug: string; title: string; description: string; author: { id: string; name: string | null } };

export function RecentlyViewed() {
  const [articles, setArticles] = useState<RecentArticle[]>([]);
  useEffect(() => {
    try {
      const slugs: unknown = JSON.parse(localStorage.getItem("ink-recent-articles") ?? "[]");
      if (!Array.isArray(slugs) || !slugs.length) return;
      void fetch(`/api/v1/articles/recent?slugs=${encodeURIComponent(slugs.slice(0, 5).join(","))}`)
        .then((response) => response.ok ? response.json() as Promise<{ data: RecentArticle[] }> : null)
        .then((result) => { if (result) setArticles(result.data); })
        .catch(() => undefined);
    } catch {
      localStorage.removeItem("ink-recent-articles");
    }
  }, []);
  if (!articles.length) return null;
  return <section className="recently-viewed page-width"><p className="eyebrow">PICK UP WHERE YOU LEFT OFF</p><h2>Recently viewed</h2><div>{articles.map((article) => <Link href={`/blog/${article.slug}`} key={article.id}><strong>{article.title}</strong><span>By {article.author.name ?? "Ink & Signal contributor"}</span></Link>)}</div></section>;
}