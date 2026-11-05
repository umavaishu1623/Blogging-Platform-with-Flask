import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

function validCronSecret(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !provided) return false;
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes);
}

export async function GET(request: NextRequest) {
  if (!validCronSecret(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const now = new Date();
  const due = await prisma.blog.findMany({
    where: { status: "SCHEDULED", scheduledFor: { lte: now } },
    select: { id: true, authorId: true, scheduledFor: true },
    orderBy: { scheduledFor: "asc" },
    take: 100,
  });

  let published = 0;
  for (const article of due) {
    const claimed = await prisma.blog.updateMany({
      where: { id: article.id, status: "SCHEDULED", scheduledFor: { lte: now } },
      data: { status: "PUBLISHED", publishedAt: article.scheduledFor ?? now, scheduledFor: null },
    });
    if (claimed.count !== 1) continue;
    published += 1;

    const followers = await prisma.follow.findMany({ where: { followingId: article.authorId }, select: { followerId: true } });
    if (followers.length) {
      await prisma.notification.createMany({
        data: followers.map(({ followerId }) => ({ userId: followerId, actorId: article.authorId, blogId: article.id, type: "ARTICLE_PUBLISHED" as const })),
      });
    }
  }

  if (published) {
    revalidatePath("/");
    revalidatePath("/explore");
    revalidatePath("/notifications");
  }
  return NextResponse.json({ published });
}