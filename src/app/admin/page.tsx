import type { Metadata } from "next";
import { ReportStatus, Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { changeUserRole, createCategory, moderateComment, updateReport } from "@/lib/actions/admin";

export const metadata: Metadata = { title: "Administration" };

export default async function AdminPage() {
  await requireRole("ADMIN");
  const [users, published, drafts, comments, views, reports, openReports, recentComments, categories] = await Promise.all([
    prisma.user.count(),
    prisma.blog.count({ where: { status: "PUBLISHED" } }),
    prisma.blog.count({ where: { status: "DRAFT" } }),
    prisma.comment.count(),
    prisma.blog.aggregate({ _sum: { viewCount: true } }),
    prisma.report.findMany({ where: { status: "OPEN" }, include: { reporter: { select: { name: true, email: true } }, blog: { select: { title: true } }, comment: { select: { body: true } } }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.comment.findMany({ include: { author: { select: { name: true } }, blog: { select: { title: true } } }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.category.findMany({ orderBy: { name: "asc" }, take: 100 }),
  ]);
  const usersList = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 25, select: { id: true, name: true, email: true, role: true, createdAt: true } });

  return (
    <div className="admin-page page-width">
      <header className="dashboard-heading"><div><p className="eyebrow">INK &amp; SIGNAL / ADMIN</p><h1>Overview</h1></div><span className="admin-live">Live database totals</span></header>
      <section aria-label="Platform statistics" className="admin-metrics">
        <div><span>Registered users</span><strong>{users}</strong></div><div><span>Published stories</span><strong>{published}</strong></div><div><span>Drafts</span><strong>{drafts}</strong></div><div><span>Comments</span><strong>{comments}</strong></div><div><span>Article views</span><strong>{views._sum.viewCount ?? 0}</strong></div><div><span>Open reports</span><strong>{openReports}</strong></div>
      </section>

      <section className="admin-section"><div className="admin-section-heading"><div><p className="eyebrow">ACCESS CONTROL</p><h2>Recent users</h2></div></div>
        <div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr><th>User</th><th>Joined</th><th>Role</th><th>Update role</th></tr></thead><tbody>
          {usersList.map((user) => <tr key={user.id}><td>{user.name ?? user.email}<small>{user.name ? user.email : ""}</small></td><td>{user.createdAt.toLocaleDateString()}</td><td>{user.role}</td><td><form action={changeUserRole.bind(null, user.id)} className="role-form"><select aria-label={`Role for ${user.name ?? user.email}`} defaultValue={user.role} name="role">{Object.values(Role).map((role) => <option key={role} value={role}>{role}</option>)}</select><button type="submit">Save</button></form></td></tr>)}
        </tbody></table></div>
      </section>

      <section className="admin-section"><div className="admin-section-heading"><div><p className="eyebrow">COMMUNITY SAFETY</p><h2>Open reports</h2></div></div>
        {reports.length ? <div className="admin-report-list">{reports.map((report) => <article className="admin-report" key={report.id}><p>{report.blog?.title ? `Story: ${report.blog.title}` : `Comment: ${report.comment?.body ?? "Unavailable content"}`}</p><p>{report.reason}</p><span>Reported by {report.reporter.name ?? report.reporter.email}</span><form action={updateReport.bind(null, report.id)}><select defaultValue={ReportStatus.REVIEWED} name="status"><option value="REVIEWED">Mark reviewed</option><option value="DISMISSED">Dismiss</option><option value="ACTIONED">Take action</option></select><button type="submit">Update</button></form></article>)}</div> : <p className="muted-copy">No open reports.</p>}
      </section>

      <section className="admin-section"><div className="admin-section-heading"><div><p className="eyebrow">CONTENT TAXONOMY</p><h2>Categories</h2></div></div><form action={createCategory} className="category-create-form"><label className="sr-only" htmlFor="new-category">Category name</label><input id="new-category" maxLength={60} minLength={2} name="name" placeholder="New category name" required /><button className="button button-small" type="submit">Add category</button></form><div className="admin-category-list">{categories.map((category) => <span key={category.id}>{category.name}</span>)}</div></section>

      <section className="admin-section"><div className="admin-section-heading"><div><p className="eyebrow">RECENT DISCUSSION</p><h2>Comments</h2></div></div>
        <div className="admin-comment-list">{recentComments.map((comment) => <article className="admin-comment" key={comment.id}><div><strong>{comment.author.name ?? "Reader"}</strong><span> on {comment.blog.title}</span><p>{comment.body}</p></div><form action={moderateComment.bind(null, comment.id, comment.status === "HIDDEN" ? "VISIBLE" : "HIDDEN")}><button type="submit">{comment.status === "HIDDEN" ? "Restore" : "Hide"}</button></form></article>)}</div>
      </section>
    </div>
  );
}