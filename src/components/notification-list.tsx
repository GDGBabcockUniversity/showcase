"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { markNotificationRead } from "@/app/notifications/actions";
import type { NotificationItem } from "@/lib/notifications";
import { cn } from "@/lib/utils";

export function NotificationList({
  items,
  onNavigate,
}: {
  items: NotificationItem[];
  onNavigate?: () => void;
}) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">No notifications yet.</p>;
  }

  return (
    <ul className="flex flex-col">
      {items.map((n) => {
        const who = n.actorName ?? "Someone";
        return (
          <li
            key={n.id}
            className={cn(
              "flex items-start gap-3 rounded-lg p-2",
              !n.read && "bg-blue/5",
            )}
          >
            <Avatar aria-hidden className="mt-0.5 h-8 w-8 shrink-0 border border-border">
              <AvatarImage src={n.actorImage ?? undefined} alt="" />
              <AvatarFallback className="text-xs">{who[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <Link
              href={`/project/${n.projectId}`}
              onClick={() => {
                if (!n.read) markNotificationRead(n.id);
                onNavigate?.();
              }}
              className="min-w-0 flex-1 text-sm"
            >
              <span className="font-medium">{who}</span>{" "}
              {n.type === "like" ? "liked" : "commented on"}{" "}
              <span className="font-medium">{n.projectTitle}</span>
              {n.body && (
                <span className="mt-0.5 block truncate text-muted">“{n.body}”</span>
              )}
              <span className="mt-0.5 block text-xs text-muted">
                {formatDistanceToNow(n.createdAt, { addSuffix: true })}
              </span>
            </Link>
            {!n.read && (
              <Button
                type="button"
                variant="quiet"
                size="none"
                className="mt-1 shrink-0"
                onClick={() => markNotificationRead(n.id)}
              >
                Mark read
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
