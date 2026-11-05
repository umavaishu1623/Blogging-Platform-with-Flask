import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { BlogEditor } from "@/components/editor/blog-editor";
import { becomeAuthor } from "@/lib/actions/blogs";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = { title: "Write a story" };

export default async function WritePage() {
  const session = await auth();
  if (!session?.user) return <div className="write-gate page-width"><p className="eyebrow">THE WRITING DESK</p><h1>Your next story<br />starts <em>here.</em></h1><p>Sign in or create a reader account to open your writing desk.</p><Link className="button" href="/login">Sign in to write</Link></div>;

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role === "READER") return (
    <div className="write-gate page-width"><p className="eyebrow">THE WRITING DESK</p><h1>Make room for<br /><em>your voice.</em></h1><p>Become an author to create drafts, publish stories, and build a readership.</p><form action={becomeAuthor}><button className="button" type="submit">Open my writing desk</button></form></div>
  );
  if (!user) return <div className="write-gate page-width"><h1>Account unavailable</h1><p>Please sign in again.</p></div>;

  return <section className="editor-page"><div className="editor-page-heading page-width"><p className="eyebrow">THE WRITING DESK</p><h1>New story</h1></div><BlogEditor /></section>;
}