"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notification } from "@/db/schema";

async function userId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Sign in first.");
  return session.user.id;
}

// The user id in the where clause keeps anyone from marking another person's rows.
export async function markNotificationRead(id: string) {
  await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(and(eq(notification.id, id), eq(notification.userId, await userId())));
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead() {
  await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(and(eq(notification.userId, await userId()), isNull(notification.readAt)));
  revalidatePath("/", "layout");
}
