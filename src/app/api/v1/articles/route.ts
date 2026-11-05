import { NextResponse, type NextRequest } from "next/server";
import { searchArticles } from "@/lib/articles";

export async function GET(request: NextRequest) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: { code: "DATABASE_UNAVAILABLE", message: "Database is not configured." } }, { status: 503 });
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q")?.slice(0, 120) ?? "";
  const category = searchParams.get("category")?.slice(0, 80) ?? "";
  const tag = searchParams.get("tag")?.slice(0, 80) ?? "";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const result = await searchArticles({ query, category, tag, page });

  return NextResponse.json({
    data: result.articles.map(({ author, categories, tags, ...article }) => ({
      ...article,
      author: { id: author.id, name: author.name, image: author.image },
      categories: categories.map(({ id, name, slug }) => ({ id, name, slug })),
      tags: tags.map(({ id, name, slug }) => ({ id, name, slug })),
    })),
    pagination: { page: result.page, totalPages: result.totalPages },
  });
}