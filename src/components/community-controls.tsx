"use client";

import { useState } from "react";
import { setFollowing, requestCollaboration } from "@/app/community-actions";

export function ShareLink({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(
            new URL(url, window.location.origin).href,
          );
          setCopied(true);
        }}
        className="rounded-full border border-border px-4 py-2 text-xs hover:border-blue"
      >
        {copied ? "Link copied" : `Share ${title}`}
      </button>
    </div>
  );
}

export function FollowButton({
  makerId,
  projectId,
  following,
}: {
  makerId?: string;
  projectId?: string;
  following: boolean;
}) {
  return (
    <form action={setFollowing.bind(null, { makerId, projectId }, !following)}>
      <button className="rounded-full border border-border px-4 py-2 text-xs hover:border-blue">
        {following ? "Following" : "Follow"}
      </button>
    </form>
  );
}

export function CollaborationForm({ projectId }: { projectId: string }) {
  return (
    <form
      action={async (data) =>
        requestCollaboration(projectId, String(data.get("message") ?? ""))
      }
      className="mt-4 grid gap-2"
    >
      <label htmlFor="collab-message" className="text-xs text-muted">
        Tell the maker what you can contribute
      </label>
      <textarea
        id="collab-message"
        name="message"
        required
        minLength={10}
        maxLength={1000}
        className="min-h-24 rounded-xl border border-border bg-background p-3 text-sm"
      />
      <button className="justify-self-start rounded-full bg-blue px-4 py-2 text-xs text-white">
        Send request
      </button>
    </form>
  );
}
