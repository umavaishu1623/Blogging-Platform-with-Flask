import { auth } from "@/auth";
import { toggleFollow } from "@/lib/actions/interactions";
import { prisma } from "@/lib/db/prisma";

export async function FollowButton({ authorId }: { authorId: string }) {
  const session = await auth();
  if (!session?.user || session.user.id === authorId) return null;
  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: session.user.id, followingId: authorId } },
    select: { id: true },
  });
  return <form action={toggleFollow.bind(null, authorId)}><button className="button button-small" type="submit">{follow ? "Following" : "Follow author"}</button></form>;
}