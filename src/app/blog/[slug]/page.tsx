import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Clock3, Eye } from "lucide-react";
import { RichText } from "@/components/rich-text";
import { ArticleEngagement } from "@/components/article-engagement";
import { CommentForm } from "@/components/comment-form";
import { ViewTracker } from "@/components/view-tracker";
import { ShareButton } from "@/components/share-button";
import { ReadingProgress } from "@/components/reading-progress";
import { ReportForm } from "@/components/report-form";
import { getPublishedArticle, getReadingMinutes, getRelatedArticles } from "@/lib/articles";
import { ArticleCard } from "@/components/article-card";

type ArticlePageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) return { title: "Story not found" };
  return {
    title: article.seoTitle ?? article.title,
    description: article.seoDescription ?? article.description,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.seoTitle ?? article.title,
      description: article.seoDescription ?? article.description,
      publishedTime: article.publishedAt?.toISOString(),
      authors: [article.author.name ?? "Ink & Signal contributor"],
      images: article.coverImageUrl ? [article.coverImageUrl] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) notFound();

  const readMinutes = getReadingMinutes(article.content);
  const relatedArticles = await getRelatedArticles(
    article.id,
    article.categories.map((category) => category.id),
    article.tags.map((tag) => tag.id),
  );
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: { "@type": "Person", name: article.author.name ?? "Ink & Signal contributor" },
    image: article.coverImageUrl ? [article.coverImageUrl] : undefined,
    mainEntityOfPage: `${process.env.APP_URL ?? "http://localhost:3000"}/blog/${article.slug}`,
  };

  return (
    <article className="article-page page-width">
      <ReadingProgress />
      <ViewTracker slug={article.slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <Link className="back-link" href="/explore"><ArrowLeft size={15} /> All stories</Link>
      <header className="article-header">
        <div className="article-topic-row">
          {article.categories.map((category) => <Link href={`/categories/${category.slug}`} key={category.id}>{category.name}</Link>)}
          {article.tags.map((tag) => <Link href={`/search?tag=${encodeURIComponent(tag.slug)}`} key={tag.id}>#{tag.name}</Link>)}
        </div>
        <h1>{article.title}</h1>
        <p className="article-deck">{article.description}</p>
        <div className="article-byline">
          <div className="author-avatar">{article.author.name?.slice(0, 1) ?? "I"}</div>
          <div><Link className="article-author-link" href={`/authors/${article.author.id}`}><strong>{article.author.name ?? "Ink & Signal contributor"}</strong></Link><span>{article.publishedAt?.toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}</span></div>
          <span className="reading-time"><Clock3 size={14} /> {readMinutes} min read</span>
          <ShareButton title={article.title} />
        </div>
      </header>
      {article.coverImageUrl && <div className="article-cover"><Image alt={article.coverImageAlt ?? ""} fill priority sizes="(max-width: 900px) 100vw, 900px" src={article.coverImageUrl} /></div>}
      <div className="article-body-layout">
        <aside className="article-stats" aria-label="Story engagement">
          <span><Eye size={16} /> {article.viewCount}</span>
          <ArticleEngagement blogId={article.id} slug={article.slug} likes={article._count.likes} bookmarks={article._count.bookmarks} />
        </aside>
        <div className="article-body"><RichText content={article.content} /></div>
      </div>
      <div className="article-report"><ReportForm blogId={article.id} /></div>
      <section className="comments-section">
        <div className="section-heading"><div><p className="eyebrow">JOIN THE CONVERSATION</p><h2>Responses <span>({article._count.comments})</span></h2></div></div>
        <CommentForm blogId={article.id} />
        {article.comments.length ? article.comments.map((comment) => (
          <article className="comment-item" key={comment.id}>
            <div className="comment-avatar" id={`comment-${comment.id}`}>{comment.author.name?.slice(0, 1) ?? "R"}</div>
            <div><strong>{comment.author.name ?? "Reader"}</strong><time>{comment.createdAt.toLocaleDateString("en", { month: "short", day: "numeric" })}</time><p>{comment.body}</p>
              <details className="reply-details"><summary>Reply</summary><CommentForm blogId={article.id} compact parentId={comment.id} /></details>
              <ReportForm blogId={article.id} commentId={comment.id} />
              {comment.replies.map((reply) => <div className="comment-reply" key={reply.id}><strong>{reply.author.name ?? "Reader"}</strong><p>{reply.body}</p></div>)}
            </div>
          </article>
        )) : <p className="muted-copy">No responses yet. A thoughtful conversation starts with one.</p>}
      </section>
      {relatedArticles.length > 0 && <section className="related-section"><div className="section-heading"><div><p className="eyebrow">FOLLOW THE THREAD</p><h2>Related stories</h2></div></div><div className="article-grid">{relatedArticles.map((related) => <ArticleCard article={related} key={related.id} />)}</div></section>}
    </article>
  );
}