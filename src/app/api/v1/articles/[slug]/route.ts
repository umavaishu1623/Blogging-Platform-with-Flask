import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";

type ArticleRouteProps = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: ArticleRouteProps) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: { code: "DATABASE_UNAVAILABLE", message: "Database is not configured." } }, { status: 503 });
  const { slug } = await params;
  if (slug.length > 100) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Story not found." } }, { status: 404 });
  const article = await prisma.blog.findFirst({
    where: { slug, status: "PUBLISHED", publishedAt: { lte: new Date() } },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      content: true,
      coverImageUrl: true,
      coverImageAlt: true,
      publishedAt: true,
      updatedAt: true,
      viewCount: true,
      author: { select: { id: true, name: true, image: true, bio: true } },
      categories: { select: { id: true, name: true, slug: true } },
      tags: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!article) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Story not found." } }, { status: 404 });
  return NextResponse.json({ data: article });
}