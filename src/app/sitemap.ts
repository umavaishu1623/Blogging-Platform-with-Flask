import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  const staticRoutes = ["", "/explore", "/categories", "/about", "/contact", "/privacy", "/terms"]
    .map((route) => ({ url: `${baseUrl}${route}`, lastModified: new Date(), changeFrequency: "weekly" as const }));
  if (!process.env.DATABASE_URL) return staticRoutes;

  const [articles, categories, authors] = await Promise.all([
    prisma.blog.findMany({ where: { status: "PUBLISHED", publishedAt: { lte: new Date() } }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ where: { blogs: { some: { status: "PUBLISHED", publishedAt: { lte: new Date() } } } }, select: { slug: true, createdAt: true } }),
    prisma.user.findMany({ where: { blogs: { some: { status: "PUBLISHED", publishedAt: { lte: new Date() } } } }, select: { id: true, updatedAt: true } }),
  ]);
  return [
    ...staticRoutes,
    ...articles.map((article) => ({ url: `${baseUrl}/blog/${article.slug}`, lastModified: article.updatedAt, changeFrequency: "monthly" as const })),
    ...categories.map((category) => ({ url: `${baseUrl}/categories/${category.slug}`, lastModified: category.createdAt, changeFrequency: "weekly" as const })),
    ...authors.map((author) => ({ url: `${baseUrl}/authors/${author.id}`, lastModified: author.updatedAt, changeFrequency: "monthly" as const })),
  ];
}