"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";

export async function markNotificationRead(notificationId: string) {
  const user = await requireUser();
  if (!/^[a-z0-9]{20,30}$/i.test(notificationId)) return;
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/notifications");
}