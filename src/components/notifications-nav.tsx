import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getNotifications, getUnreadCount } from "@/lib/notifications";
import { NotificationBell } from "@/components/notification-bell";

// Server half of the bell: signed-out visitors get nothing rendered at all.
export async function NotificationsNav() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const [items, unread] = await Promise.all([
    getNotifications(session.user.id, 8),
    getUnreadCount(session.user.id),
  ]);
  return <NotificationBell items={items} unread={unread} />;
}
