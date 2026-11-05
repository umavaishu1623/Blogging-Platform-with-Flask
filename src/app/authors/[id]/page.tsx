import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArticleCard } from "@/components/article-card";
import { FollowButton } from "@/components/follow-button";
import { prisma } from "@/lib/db/prisma";

type AuthorPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { id } = await params;
  const author = await prisma.user.findUnique({ where: { id }, select: { name: true, bio: true } });
  return author ? { title: author.name ?? "Writer", description: author.bio ?? `Read stories by ${author.name ?? "this writer"}.` } : { title: "Writer not found" };
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { id } = await params;
  const author = await prisma.user.findFirst({
    where: { id, role: { in: ["AUTHOR", "ADMIN"] }, blogs: { some: { status: "PUBLISHED", publishedAt: { lte: new Date() } } } },
    include: {
      blogs: { where: { status: "PUBLISHED", publishedAt: { lte: new Date() } }, include: { author: true, categories: true, tags: true }, orderBy: { publishedAt: "desc" } },
      _count: { select: { followers: true } },
    },
  });
  if (!author) notFound();

  return <div className="author-page page-width"><section className="author-profile"><div className="profile-avatar">{author.name?.slice(0, 1) ?? "I"}</div><div><p className="eyebrow">WRITER / {author._count.followers} FOLLOWERS</p><h1>{author.name ?? "Independent writer"}</h1>{author.bio && <p>{author.bio}</p>}{author.website && <a className="author-website" href={author.website} rel="noreferrer" target="_blank">Visit website ↗</a>}</div><FollowButton authorId={author.id} /></section><div className="listing-section-heading"><div><p className="eyebrow">FROM THIS WRITER</p><h2>Published stories</h2></div><Link className="underlined-link" href="/explore">Explore all</Link></div><div className="article-grid">{author.blogs.map((article) => <ArticleCard article={article} key={article.id} />)}</div></div>;
}