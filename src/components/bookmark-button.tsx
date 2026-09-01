"use client";

import { useState, useTransition } from "react";
import { toggleBookmark } from "@/app/actions";

// Same remount-on-key trick as UpvoteButton: call sites key this by saved
// state so fresh server data replaces the optimistic value without an effect.
export function BookmarkButton({
  id,
  saved,
  size = "sm",
}: {
  id: string;
  saved: boolean;
  size?: "sm" | "lg";
}) {
  const [on, setOn] = useState(saved);
  const [, startTransition] = useTransition();

  const toggle = (e: React.MouseEvent) => {
    // Rows wrap this in a link to the project — don't navigate on save.
    e.preventDefault();
    e.stopPropagation();
    setOn(!on);
    startTransition(async () => {
      await toggleBookmark(id);
    });
  };

  const lg = size === "lg";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Remove from saved" : "Save for later"}
      title={on ? "Remove from saved" : "Save for later"}
      className={[
        "inline-flex shrink-0 items-center justify-center rounded-xl border transition-colors h-[50px]",
        lg ? "w-[46px]" : "w-[44px]",
        on
          ? "border-yellow bg-yellow/10 text-yellow"
          : "border-border bg-panel text-muted hover:border-yellow hover:text-yellow",
      ].join(" ")}
    >
      <svg
        width={lg ? 16 : 14}
        height={lg ? 16 : 14}
        viewBox="0 0 24 24"
        fill={on ? "currentColor" : "none"}
        aria-hidden
      >
        <path
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 4h12v16l-6-4-6 4V4z"
        />
      </svg>
    </button>
  );
}
