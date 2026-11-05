import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = { title: "Author dashboard" };

export default async function AuthorDashboardPage() {
  const user = await requireRole("AUTHOR", "ADMIN");
  const [published, drafts, views, followers, comments] = await Promise.all([
    prisma.blog.count({ where: { authorId: user.id, status: "PUBLISHED" } }),
    prisma.blog.count({ where: { authorId: user.id, status: { in: ["DRAFT", "SCHEDULED"] } } }),
    prisma.blog.aggregate({ where: { authorId: user.id }, _sum: { viewCount: true } }),
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.comment.count({ where: { blog: { authorId: user.id }, status: "VISIBLE" } }),
  ]);

  return <div className="dashboard-page page-width"><header className="dashboard-heading"><div><p className="eyebrow">YOUR WRITING DESK</p><h1>Good work, {user.name ?? "writer"}.</h1></div><Link className="button" href="/write">New story</Link></header><section aria-label="Author statistics" className="admin-metrics"><div><span>Published stories</span><strong>{published}</strong></div><div><span>Drafts and scheduled</span><strong>{drafts}</strong></div><div><span>Total views</span><strong>{views._sum.viewCount ?? 0}</strong></div><div><span>Followers</span><strong>{followers}</strong></div><div><span>Responses</span><strong>{comments}</strong></div></section><nav className="dashboard-links"><Link className="underlined-link" href="/dashboard/articles">Manage stories</Link><Link className="underlined-link" href="/profile">Edit profile</Link><Link className="underlined-link" href="/notifications">Notifications</Link></nav></div>;
}