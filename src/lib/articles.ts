import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

const PAGE_SIZE = 12;

export type ArticleFilters = {
  query?: string;
  category?: string;
  tag?: string;
  page?: number;
};

export async function searchArticles(filters: ArticleFilters = {}) {
  if (!process.env.DATABASE_URL) return { articles: [], page: 1, totalPages: 0 };

  const page = Math.max(1, Math.min(1000, Math.floor(filters.page ?? 1)));
  const query = filters.query?.trim();
  const category = filters.category?.trim() || null;
  const tag = filters.tag?.trim() || null;
  const offset = (page - 1) * PAGE_SIZE;

  if (query) {
    const where = Prisma.sql`
      b."status" = 'PUBLISHED'
      AND b."publishedAt" IS NOT NULL
      AND b."publishedAt" <= NOW()
      AND to_tsvector('english', coalesce(b."title", '') || ' ' || coalesce(b."description", '') || ' ' || b."content"::text)
        @@ websearch_to_tsquery('english', ${query})
      AND (${category}::text IS NULL OR EXISTS (
        SELECT 1 FROM "_BlogToCategory" bc JOIN "Category" c ON c.id = bc."B"
        WHERE bc."A" = b.id AND c.slug = ${category}
      ))
      AND (${tag}::text IS NULL OR EXISTS (
        SELECT 1 FROM "_BlogToTag" bt JOIN "Tag" t ON t.id = bt."B"
        WHERE bt."A" = b.id AND t.slug = ${tag}
      ))
    `;

    const [matches, count] = await Promise.all([
      prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT b.id FROM "Blog" b
        WHERE ${where}
        ORDER BY b."publishedAt" DESC, b.id
        LIMIT ${PAGE_SIZE} OFFSET ${offset}
      `),
      prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count FROM "Blog" b WHERE ${where}
      `),
    ]);

    const articles = matches.length
      ? await prisma.blog.findMany({
          where: { id: { in: matches.map((match) => match.id) } },
          include: { author: true, categories: true, tags: true },
        })
      : [];
    const byId = new Map(articles.map((article) => [article.id, article]));
    const total = Number(count[0]?.count ?? 0n);
    return {
      articles: matches.flatMap((match) => {
        const article = byId.get(match.id);
        return article ? [article] : [];
      }),
      page,
      totalPages: Math.ceil(total / PAGE_SIZE),
    };
  }

  const where: Prisma.BlogWhereInput = {
    status: "PUBLISHED",
    publishedAt: { lte: new Date() },
    ...(category ? { categories: { some: { slug: category } } } : {}),
    ...(tag ? { tags: { some: { slug: tag } } } : {}),
  };
  const [articles, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      include: { author: true, categories: true, tags: true },
      orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
      skip: offset,
      take: PAGE_SIZE,
    }),
    prisma.blog.count({ where }),
  ]);

  return { articles, page, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getPublishedArticle(slug: string) {
  if (!process.env.DATABASE_URL) return null;
  return prisma.blog.findFirst({
    where: { slug, status: "PUBLISHED", publishedAt: { lte: new Date() } },
    include: {
      author: true,
      categories: true,
      tags: true,
      comments: {
        where: { status: "VISIBLE", parentId: null },
        include: {
          author: { select: { id: true, name: true, image: true } },
          replies: {
            where: { status: "VISIBLE" },
            include: { author: { select: { id: true, name: true, image: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { likes: true, bookmarks: true, comments: true } },
    },
  });
}

export async function getCategories() {
  if (!process.env.DATABASE_URL) return [];
  return prisma.category.findMany({
    where: { blogs: { some: { status: "PUBLISHED", publishedAt: { lte: new Date() } } } },
    orderBy: { name: "asc" },
  });
}

export function getReadingMinutes(content: Prisma.JsonValue) {
  const words = JSON.stringify(content).match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
  return Math.max(1, Math.ceil(words / 220));
}