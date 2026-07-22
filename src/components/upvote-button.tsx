"use client";

import { useEffect, useState } from "react";

export function UpvoteButton({
  id,
  initial,
  size = "sm",
}: {
  id: string;
  initial: number;
  size?: "sm" | "lg";
}) {
  const key = `upvote:${id}`;
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    setVoted(localStorage.getItem(key) === "1");
  }, [key]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !voted;
    setVoted(next);
    if (next) localStorage.setItem(key, "1");
    else localStorage.removeItem(key);
  };

  const count = initial + (voted ? 1 : 0);
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
