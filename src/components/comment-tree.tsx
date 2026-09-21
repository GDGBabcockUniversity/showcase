"use client";

import { useState } from "react";
import Link from "next/link";
import { LuReply, LuChevronDown, LuChevronUp } from "react-icons/lu";
import type { ProjectComment } from "@/lib/projects";
import { CommentForm } from "@/components/comment-form";
import { CommentUpvoteButton } from "@/components/comment-upvote-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRequireAuth } from "@/lib/require-auth";

function CommentBody({ body }: { body: string }) {
  // Extract @username mention at start of reply without using /s regex flag
  const spaceIndex = body.indexOf(" ");
  if (body.startsWith("@") && spaceIndex > 1) {
    const mention = body.slice(0, spaceIndex);
    if (/^@[a-zA-Z0-9_-]+$/.test(mention)) {
      const rest = body.slice(spaceIndex);
      return (
        <p className="mt-1.5 break-words text-sm leading-relaxed text-muted">
          <span className="font-medium text-blue">{mention}</span>
          {rest}
        </p>
      );
    }
  }

  return <p className="mt-1.5 break-words text-sm leading-relaxed text-muted">{body}</p>;
}

function CommentItem({
  comment,
  projectId,
  rootParentId,
  isLoggedIn,
  isReply = false,
}: {
  comment: ProjectComment;
  projectId: string;
  rootParentId: string;
  isLoggedIn: boolean;
  isReply?: boolean;
}) {
  const [replying, setReplying] = useState(false);
  const requireAuth = useRequireAuth();

  const handleReplyClick = () => {
    if (!requireAuth()) return;
    setReplying((prev) => !prev);
  };

  // If this comment is a reply itself, replying to it targets the root top-level parent ID
  // and pre-fills `@handle ` (Level 3 tagging behavior, matching YouTube)
  const targetParentId = comment.parentId ? rootParentId : comment.id;
  const initialMention = comment.parentId
    ? `@${comment.username || comment.by.replace(/\s+/g, "_")} `
    : "";

  return (
    <div className="group relative flex items-start gap-3">
      <Avatar
        aria-hidden
        className={`mt-0.5 border border-border ${
          isReply ? "size-7 sm:size-8" : "size-8"
        }`}
      >
        <AvatarImage src={comment.image ?? undefined} alt="" />
        <AvatarFallback
          className="font-display text-xs font-semibold text-white"
          style={{
            background:
              "linear-gradient(135deg, var(--color-blue), var(--color-green))",
          }}
        >
          {comment.by.trim()[0]?.toUpperCase() ?? "?"}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <Link
            href={`/u/${comment.username ?? comment.userId}`}
            className="min-w-0 break-words text-sm font-medium transition-colors hover:text-blue"
          >
            {comment.by}
          </Link>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
            {new Date(comment.createdAt).toLocaleDateString()}
          </p>
        </div>

        <CommentBody body={comment.body} />

        <div className="mt-2.5 flex items-center gap-3">
          <CommentUpvoteButton
            commentId={comment.id}
            projectId={projectId}
            initial={comment.upvotes}
            upvoted={comment.upvoted}
          />

          <button
            type="button"
            onClick={handleReplyClick}
            className="inline-flex items-center gap-1 rounded-lg border border-transparent px-2 py-1 font-mono text-[10px] text-muted transition-colors hover:border-border hover:text-fg"
          >
            <LuReply size={12} aria-hidden />
            <span>Reply</span>
          </button>
        </div>

        {replying && isLoggedIn && (
          <div className="mt-3">
            <CommentForm
              projectId={projectId}
              parentId={targetParentId}
              initialText={initialMention}
              autoFocus
              placeholder={`Replying to ${comment.by}…`}
              onCancel={() => setReplying(false)}
              onSuccess={() => setReplying(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CommentThread({
  comment,
  projectId,
  isLoggedIn,
}: {
  comment: ProjectComment;
  projectId: string;
  isLoggedIn: boolean;
}) {
  const [showReplies, setShowReplies] = useState(true);
  const replyCount = comment.replies.length;

  return (
    <li className="relative border-b border-border pb-5 last:border-0">
      {/* Top Level Comment */}
      <CommentItem
        comment={comment}
        projectId={projectId}
        rootParentId={comment.id}
        isLoggedIn={isLoggedIn}
      />

      {/* Replies Thread Container */}
      {replyCount > 0 && (
        <div className="mt-2 pl-7 sm:pl-8">
          {/* YouTube-style Expand / Collapse toggle */}
          <div className="mb-2 flex items-center">
            <button
              type="button"
              onClick={() => setShowReplies((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full py-1 text-xs font-medium text-blue hover:underline focus:outline-none"
            >
              <span className="flex items-center gap-1 font-mono text-[11px]">
                {showReplies ? (
                  <LuChevronUp size={14} />
                ) : (
                  <LuChevronDown size={14} />
                )}
                {replyCount} {replyCount === 1 ? "reply" : "replies"}
              </span>
            </button>
          </div>

          {/* Smooth animated collapsible container for replies */}
          <div
            className="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out"
            style={{
              gridTemplateRows: showReplies ? "1fr" : "0fr",
              opacity: showReplies ? 1 : 0,
            }}
          >
            <div className="overflow-hidden space-y-4 pt-1">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  projectId={projectId}
                  rootParentId={comment.id}
                  isLoggedIn={isLoggedIn}
                  isReply
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

export function CommentTree({
  comments,
  projectId,
  isLoggedIn,
}: {
  comments: ProjectComment[];
  projectId: string;
  isLoggedIn: boolean;
}) {
  if (comments.length === 0) {
    return (
      <p className="mt-6 text-sm text-muted">
        No comments yet — be the first to say something.
      </p>
    );
  }

  return (
    <ol className="mt-6 space-y-5">
      {comments.map((topComment) => (
        <CommentThread
          key={topComment.id}
          comment={topComment}
          projectId={projectId}
          isLoggedIn={isLoggedIn}
        />
      ))}
    </ol>
  );
}
