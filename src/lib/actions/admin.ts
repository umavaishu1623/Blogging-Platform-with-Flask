"use server";

import { ReportStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";

export async function changeUserRole(userId: string, formData: FormData) {
  const admin = await requireRole("ADMIN");
  const role = z.nativeEnum(Role).safeParse(formData.get("role"));
  if (!role.success || !/^[a-z0-9]{20,30}$/i.test(userId) || userId === admin.id) return;
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) return;
  if (target.role === "ADMIN" && role.data !== "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) return;
  }
  await prisma.user.update({ where: { id: userId }, data: { role: role.data } });
  revalidatePath("/admin");
}

export async function moderateComment(commentId: string, status: "VISIBLE" | "HIDDEN") {
  await requireRole("ADMIN");
  const parsedStatus = z.enum(["VISIBLE", "HIDDEN"]).safeParse(status);
  if (!parsedStatus.success || !/^[a-z0-9]{20,30}$/i.test(commentId)) return;
  await prisma.comment.update({ where: { id: commentId }, data: { status: parsedStatus.data } });
  revalidatePath("/admin");
}

export async function updateReport(reportId: string, formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = z.nativeEnum(ReportStatus).safeParse(formData.get("status"));
  if (!parsed.success || !/^[a-z0-9]{20,30}$/i.test(reportId)) return;
  await prisma.report.update({
    where: { id: reportId },
    data: {
      status: parsed.data,
      resolvedBy: parsed.data === "OPEN" ? null : admin.id,
      resolvedAt: parsed.data === "OPEN" ? null : new Date(),
    },
  });
  revalidatePath("/admin");
}

export async function createCategory(formData: FormData) {
  await requireRole("ADMIN");
  const parsed = z.object({ name: z.string().trim().min(2).max(60) }).safeParse({ name: formData.get("name") });
  if (!parsed.success) return;
  const slug = parsed.data.name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  if (!slug) return;
  await prisma.category.upsert({ where: { slug }, create: { name: parsed.data.name, slug }, update: { name: parsed.data.name } });
  revalidatePath("/admin");
  revalidatePath("/categories");
}