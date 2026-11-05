import Image from "next/image";
import Link from "next/link";
import type { Blog, Category, Tag, User } from "@prisma/client";

type ArticleCardProps = {
  article: Blog & { author: User; categories: Category[]; tags: Tag[] };
};

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="article-card">
      <Link aria-label={`Read ${article.title}`} className="article-image" href={`/blog/${article.slug}`}>
        {article.coverImageUrl ? (
          <Image alt={article.coverImageAlt ?? ""} fill sizes="(max-width: 700px) 100vw, 33vw" src={article.coverImageUrl} />
        ) : <span aria-hidden="true" className="article-image-placeholder">i<span>.</span></span>}
        <span className="article-number">{article.publishedAt?.toLocaleDateString("en", { day: "2-digit" })}</span>
      </Link>
      <div className="article-meta">
        <span>{article.categories[0]?.name ?? "Essay"}</span>
        <span>{article.publishedAt?.toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
      </div>
      <h3><Link href={`/blog/${article.slug}`}>{article.title}</Link></h3>
      <p>{article.description}</p>
      <div className="article-author">By <Link href={`/authors/${article.author.id}`}>{article.author.name ?? "Ink & Signal contributor"}</Link></div>
    </article>
  );
}