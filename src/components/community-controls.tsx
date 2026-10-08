"use client";

import { useActionState, useState } from "react";
import {
  requestCollaboration,
  type CollaborationRequestState,
} from "@/app/community-actions";

export function ShareLink({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label={copied ? "Project link copied" : `Share ${title}`}
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

export function CollaborationForm({ projectId }: { projectId: string }) {
  const initialState: CollaborationRequestState = { status: "idle" };
  const action = requestCollaboration.bind(null, projectId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="mt-5 border-t border-green/20 pt-4">
      <p className="text-sm font-medium">Have a skill to contribute?</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Send a short introduction. Keep contact details and next steps in your
        message.
      </p>
      {state.status === "success" ? (
        <p
          role="status"
          className="mt-4 border border-green/30 px-3 py-3 text-sm text-green"
        >
          {state.message}
        </p>
      ) : (
        <form action={formAction} className="mt-4 grid gap-3">
          <label
            htmlFor="collab-message"
            className="font-mono text-[10px] uppercase tracking-wider text-muted"
          >
            Your message
          </label>
          <textarea
            id="collab-message"
            name="message"
            required
            minLength={10}
            maxLength={1000}
            placeholder="I can help with…"
            aria-describedby="collab-hint collab-feedback"
            aria-invalid={state.status === "error"}
            className="min-h-28 resize-y rounded-lg border border-border bg-bg px-3 py-2.5 text-sm leading-relaxed placeholder:text-muted/70 focus-visible:border-blue focus-visible:ring-1 focus-visible:ring-blue"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p id="collab-hint" className="text-[11px] text-muted">
              10–1,000 characters
            </p>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-green px-4 text-xs font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? "Sending…" : "Send collaboration request"}
            </button>
          </div>
          <p
            id="collab-feedback"
            aria-live="polite"
            role={state.status === "error" ? "alert" : "status"}
            className={`min-h-5 text-xs ${state.status === "error" ? "text-red" : "text-muted"}`}
          >
            {state.message ?? ""}
          </p>
        </form>
      )}
    </div>
  );
}
