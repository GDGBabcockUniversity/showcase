"use client";

import { useState } from "react";
import Link from "next/link";
import { LuBell } from "react-icons/lu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { NotificationList } from "@/components/notification-list";
import { markAllNotificationsRead } from "@/app/notifications/actions";
import type { NotificationItem } from "@/lib/notifications";

export function NotificationBell({
  items,
  unread,
}: {
  items: NotificationItem[];
  unread: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="relative">
          <LuBell className="h-4 w-4" aria-hidden />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
          <span className="sr-only">Notifications, {unread} unread</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-2">
        <div className="flex items-center justify-between px-2 pb-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unread > 0 && (
            <Button
              type="button"
              variant="quiet"
              size="none"
              onClick={() => markAllNotificationsRead()}
            >
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          <NotificationList items={items} onNavigate={() => setOpen(false)} />
        </div>
        <Link
          href="/notifications"
          onClick={() => setOpen(false)}
          className="mt-1 block rounded-lg border-t border-border px-2 pt-2 text-center text-sm text-blue hover:underline"
        >
          Show all
        </Link>
      </PopoverContent>
    </Popover>
  );
}
