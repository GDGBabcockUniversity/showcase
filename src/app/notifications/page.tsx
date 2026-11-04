import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { NotificationList } from "@/components/notification-list";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getNotifications, getUnreadCount } from "@/lib/notifications";
import { markAllNotificationsRead } from "./actions";

export const metadata: Metadata = {
  title: "Notifications — GDG Babcock Showcase",
  description: "Likes and comments on your projects.",
};

export default async function NotificationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/?authModal=1");

  // shortcut: newest 100 only, add pagination if people pile up more than that
  const [items, unread] = await Promise.all([
    getNotifications(session.user.id, 100),
    getUnreadCount(session.user.id),
  ]);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Notifications
          </h1>
          {unread > 0 && (
            <form action={markAllNotificationsRead}>
              <Button type="submit" variant="outline" size="sm">
                Mark all read
              </Button>
            </form>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-surface p-2">
          <NotificationList items={items} />
        </div>
      </main>
      <Footer />
    </>
  );
}
