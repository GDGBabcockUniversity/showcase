"use client";

import { useActionState, useEffect, useRef } from "react";
import { addComment, type CommentState } from "@/app/actions";

const initial: CommentState = { ok: false };

export function CommentForm({ projectId }: { projectId: string }) {
  const action = addComment.bind(null, projectId);
  const [state, formAction, pending] = useActionState(action, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mt-4 flex flex-col gap-2">
      <textarea
        name="body"
        required
        maxLength={500}
        rows={3}
        placeholder="What stood out to you?"
        className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg outline-none transition-colors placeholder:text-muted focus:border-blue resize-y"
      />
      {state.error && <p className="font-mono text-[11px] text-red">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-end rounded-full bg-blue px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Posting…" : "Comment"}
      </button>
    </form>
  );
}
