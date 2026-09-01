"use client";

import { useState, useTransition } from "react";
import { toggleLike } from "@/app/actions";
import { useRequireAuth } from "@/lib/require-auth";

// Keyed by `${id}-${liked}-${initial}` at every call site: when the server
// confirms new counts (after revalidation), React remounts this with fresh
// initial state instead of needing an effect to resync props into state.
export function UpvoteButton({
  id,
  initial,
  liked,
  size = "sm",
}: {
  id: string;
  initial: number;
  liked: boolean;
  size?: "sm" | "lg";
}) {
  const [voted, setVoted] = useState(liked);
  const [count, setCount] = useState(initial);
  const [, startTransition] = useTransition();
  const requireAuth = useRequireAuth();

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Opens the modal right here instead of letting the server bounce them.
    if (!requireAuth()) return;
    const next = !voted;
    setVoted(next);
    setCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      await toggleLike(id);
    });
  };

  const lg = size === "lg";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={voted}
      aria-label={voted ? "Remove upvote" : "Upvote"}
      className={[
        "inline-flex shrink-0 items-center gap-1.5 rounded-xl border font-mono tabular-nums transition-colors h-[50px]",
        lg ? "px-2.5 py-1.5 min-w-[46px]" : "px-2.5 py-2 min-w-[48px]",
        voted
          ? "border-blue bg-blue/10 text-blue"
          : "border-border bg-panel text-fg hover:border-blue hover:text-blue",
      ].join(" ")}
    >
      <svg
        width={lg ? 16 : 12}
        height={lg ? 16 : 12}
        viewBox="0 0 24 24"
        fill={voted ? "currentColor" : "none"}
        aria-hidden
      >
        <path
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4l8 9h-5v7h-6v-7H4l8-9z"
        />
      </svg>
      <span>{count}</span>
    </button>
  );
}
