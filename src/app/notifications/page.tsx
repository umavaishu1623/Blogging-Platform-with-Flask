import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";

export const metadata: Metadata = { title: "Notifications" };

const messages = {
  COMMENT: "commented on your story",
  REPLY: "replied to your comment",
  FOLLOW: "started following you",
  ARTICLE_PUBLISHED: "published a new story",
  MODERATION: "sent you a moderation update",
} as const;

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    include: { actor: { select: { id: true, name: true } }, blog: { select: { slug: true, title: true } }, comment: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unread = notifications.some((notification) => !notification.readAt);

  return (
    <div className="dashboard-page page-width">
      <header className="dashboard-heading"><div><p className="eyebrow">YOUR ACCOUNT</p><h1>Notifications</h1></div>{unread && <form action={markAllNotificationsRead}><button className="text-link" type="submit">Mark all read</button></form>}</header>
      {notifications.length ? <div className="notification-list">{notifications.map((notification) => {
        const href = notification.blog ? `/blog/${notification.blog.slug}${notification.comment ? `#comment-${notification.comment.id}` : ""}` : notification.actor ? `/authors/${notification.actor.id}` : "/profile";
        return <article className={notification.readAt ? "notification-item" : "notification-item is-unread"} key={notification.id}><span className="notification-dot" /><div><p><strong>{notification.actor?.name ?? "Someone"}</strong> {messages[notification.type]}</p>{notification.blog && <Link href={href}>{notification.blog.title}</Link>}<time>{notification.createdAt.toLocaleDateString("en", { month: "short", day: "numeric" })}</time></div>{!notification.readAt && <form action={markNotificationRead.bind(null, notification.id)}><button aria-label="Mark as read" title="Mark as read" type="submit">Mark read</button></form>}</article>;
      })}</div> : <div className="empty-listing"><div><h2>All quiet for now.</h2><p>New comments, follows, and stories from writers you follow will appear here.</p></div><Link className="underlined-link" href="/explore">Read a story</Link></div>}
    </div>
  );
}