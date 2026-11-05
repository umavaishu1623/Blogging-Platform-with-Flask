import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  const slugs = [...new Set((request.nextUrl.searchParams.get("slugs") ?? "").split(",").filter((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)).slice(0, 5))];
  if (!slugs.length) return NextResponse.json({ data: [] });
  const articles = await prisma.blog.findMany({
    where: { slug: { in: slugs }, status: "PUBLISHED", publishedAt: { lte: new Date() } },
    select: { id: true, title: true, slug: true, description: true, publishedAt: true, author: { select: { id: true, name: true } } },
  });
  const bySlug = new Map(articles.map((article) => [article.slug, article]));
  return NextResponse.json({ data: slugs.flatMap((slug) => bySlug.has(slug) ? [bySlug.get(slug)] : []) });
}