"use client";

import { useState, useTransition } from "react";
import { LuArrowBigUp } from "react-icons/lu";
import { toggleCommentUpvote } from "@/app/actions";
import { useRequireAuth } from "@/lib/require-auth";

export function CommentUpvoteButton({
  commentId,
  projectId,
  initial,
  upvoted,
}: {
  commentId: string;
  projectId: string;
  initial: number;
  upvoted: boolean;
}) {
  const [voted, setVoted] = useState(upvoted);
  const [count, setCount] = useState(initial);
  const [, startTransition] = useTransition();
  const requireAuth = useRequireAuth();

  const toggle = () => {
    if (!requireAuth()) return;
    const next = !voted;
    setVoted(next);
    setCount((value) => value + (next ? 1 : -1));
    startTransition(() => toggleCommentUpvote(commentId, projectId));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={voted}
      aria-label={voted ? "Remove comment upvote" : "Upvote comment"}
      className={[
        "inline-flex items-center gap-1 rounded-lg border px-2 py-1 font-mono text-[10px] tabular-nums transition-colors",
        voted
          ? "border-blue bg-blue/10 text-blue"
          : "border-border text-muted hover:border-blue hover:text-blue",
      ].join(" ")}
    >
      <LuArrowBigUp size={12} fill={voted ? "currentColor" : "none"} aria-hidden />
      <span>{count}</span>
    </button>
  );
}