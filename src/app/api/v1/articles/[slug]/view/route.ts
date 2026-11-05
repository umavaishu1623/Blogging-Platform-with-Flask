import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";

type ViewRouteProps = { params: Promise<{ slug: string }> };

export async function POST(request: NextRequest, { params }: ViewRouteProps) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  const { slug } = await params;
  const ip = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "unknown";
  if (!(await checkRateLimit("article-view", ip, 120, 60))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const article = await prisma.blog.findFirst({
    where: { slug, status: "PUBLISHED", publishedAt: { lte: new Date() } },
    select: { id: true },
  });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let visitorId = request.cookies.get("ink-viewer")?.value;
  if (!visitorId || !/^[0-9a-f-]{36}$/i.test(visitorId)) visitorId = randomUUID();
  const visitorHash = createHash("sha256").update(visitorId).digest("hex");
  const viewedOn = new Date();
  viewedOn.setUTCHours(0, 0, 0, 0);

  try {
    await prisma.$transaction([
      prisma.articleView.create({ data: { blogId: article.id, visitorHash, viewedOn } }),
      prisma.blog.update({ where: { id: article.id }, data: { viewCount: { increment: 1 } } }),
    ]);
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
  }

  const response = new NextResponse(null, { status: 204 });
  response.cookies.set("ink-viewer", visitorId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}