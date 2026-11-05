import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { ProfileForm } from "@/components/profile-form";
import { SignOutForm } from "@/components/auth/signout-form";

export const metadata: Metadata = { title: "Your profile" };

export default async function ProfilePage() {
  const sessionUser = await requireUser();
  const [user, articles, bookmarks] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } }),
    prisma.blog.count({ where: { authorId: sessionUser.id } }),
    prisma.bookmark.count({ where: { userId: sessionUser.id } }),
  ]);

  return (
    <div className="profile-page page-width">
      <div className="profile-heading"><div className="profile-avatar">{user.name?.slice(0, 1) ?? "I"}</div><div><p className="eyebrow">YOUR ACCOUNT / {user.role}</p><h1>{user.name ?? "Your profile"}</h1><p>{user.email}</p></div></div>
      <div className="profile-stats"><span><strong>{articles}</strong> stories</span><span><strong>{bookmarks}</strong> saved</span><Link href="/saved">Saved articles</Link><Link href="/dashboard/articles">Writing desk</Link><Link href="/notifications">Notifications</Link><SignOutForm /></div>
      <section className="profile-edit"><p className="eyebrow">PROFILE DETAILS</p><ProfileForm bio={user.bio ?? ""} name={user.name ?? ""} website={user.website ?? ""} /></section>
    </div>
  );
}