import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { requireRole } from "@/lib/auth/authorization";
import { deleteBlog } from "@/lib/actions/blogs";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = { title: "Your stories" };

type ArticlesDashboardProps = { searchParams: Promise<{ notice?: string }> };

export default async function ArticlesDashboard({ searchParams }: ArticlesDashboardProps) {
  const user = await requireRole("AUTHOR", "ADMIN");
  const { notice } = await searchParams;
  const articles = await prisma.blog.findMany({
    where: user.role === "ADMIN" ? {} : { authorId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, slug: true, status: true, updatedAt: true, publishedAt: true },
  });

  return (
    <div className="dashboard-page page-width">
      <div className="dashboard-heading"><div><p className="eyebrow">YOUR WORKSPACE</p><h1>Your stories</h1></div><Link className="button" href="/write"><Plus size={16} /> New story</Link></div>
      {notice && <p aria-live="polite" className="dashboard-notice">Story {notice}.</p>}
      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead><tr><th>Title</th><th>Status</th><th>Last updated</th><th>Actions</th></tr></thead>
          <tbody>{articles.map((article) => <tr key={article.id}>
            <td><Link href={`/dashboard/articles/${article.id}/edit`}>{article.title || "Untitled draft"}</Link></td>
            <td><span className={`status-label status-${article.status.toLowerCase()}`}>{article.status.toLowerCase()}</span></td>
            <td>{article.updatedAt.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</td>
            <td className="dashboard-row-actions"><Link href={`/dashboard/articles/${article.id}/edit`}>Edit</Link>{article.status === "PUBLISHED" && <Link href={`/blog/${article.slug}`}>View</Link>}<form action={deleteBlog.bind(null, article.id)}><button aria-label={`Delete ${article.title || "draft"}`} title="Delete story" type="submit"><Trash2 size={15} /></button></form></td>
          </tr>)}</tbody>
        </table>
        {!articles.length && <div className="empty-listing"><div><h2>Your first story starts with a draft.</h2><p>Write, save, preview, and publish from one workspace.</p></div><Link className="underlined-link" href="/write">Create a story</Link></div>}
      </div>
    </div>
  );
}