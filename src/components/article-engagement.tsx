import { Bookmark, Heart } from "lucide-react";
import { auth } from "@/auth";
import { toggleBookmark, toggleLike } from "@/lib/actions/interactions";
import { prisma } from "@/lib/db/prisma";

type ArticleEngagementProps = {
  blogId: string;
  slug: string;
  likes: number;
  bookmarks: number;
};

export async function ArticleEngagement({ blogId, slug, likes, bookmarks }: ArticleEngagementProps) {
  const session = await auth();
  const [liked, bookmarked] = session?.user
    ? await Promise.all([
        prisma.like.findUnique({ where: { userId_blogId: { userId: session.user.id, blogId } }, select: { id: true } }),
        prisma.bookmark.findUnique({ where: { userId_blogId: { userId: session.user.id, blogId } }, select: { id: true } }),
      ])
    : [null, null];

  return (
    <div className="engagement-actions" aria-label="Story actions">
      <form action={toggleLike.bind(null, blogId, slug)}>
        <button aria-label={liked ? "Unlike story" : "Like story"} aria-pressed={Boolean(liked)} title={liked ? "Unlike story" : "Like story"} type="submit">
          <Heart aria-hidden="true" fill={liked ? "currentColor" : "none"} size={17} /><span>{likes}</span>
        </button>
      </form>
      <form action={toggleBookmark.bind(null, blogId, slug)}>
        <button aria-label={bookmarked ? "Remove bookmark" : "Bookmark story"} aria-pressed={Boolean(bookmarked)} title={bookmarked ? "Remove bookmark" : "Bookmark story"} type="submit">
          <Bookmark aria-hidden="true" fill={bookmarked ? "currentColor" : "none"} size={17} /><span>{bookmarks}</span>
        </button>
      </form>
    </div>
  );
}