import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { interaction, notification, project, user } from "@/db/schema";

export type NotificationItem = {
  id: string;
  type: string;
  body: string | null;
  read: boolean;
  createdAt: Date;
  projectId: string;
  projectTitle: string;
  actorName: string | null;
  actorImage: string | null;
};

export async function getNotifications(
  userId: string,
  limit: number,
): Promise<NotificationItem[]> {
  const rows = await db
    .select({
      id: notification.id,
      type: interaction.type,
      body: interaction.body,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      projectId: project.id,
      projectTitle: project.title,
      actorName: user.name,
      actorImage: user.image,
    })
    .from(notification)
    .innerJoin(interaction, eq(interaction.id, notification.interactionId))
    .innerJoin(project, eq(project.id, interaction.projectId))
    .leftJoin(user, eq(user.id, interaction.userId))
    .where(eq(notification.userId, userId))
    .orderBy(desc(notification.createdAt))
    .limit(limit);
  return rows.map(({ readAt, ...r }) => ({ ...r, read: readAt !== null }));
}

export async function getUnreadCount(userId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(notification)
    .where(and(eq(notification.userId, userId), isNull(notification.readAt)));
  return row?.n ?? 0;
}
