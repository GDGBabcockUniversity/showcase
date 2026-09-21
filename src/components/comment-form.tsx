"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { addComment, type CommentState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initial: CommentState = { ok: false };

export function CommentForm({ projectId }: { projectId: string }) {
  const action = addComment.bind(null, projectId);
  const [state, formAction, pending] = useActionState(action, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mt-4 flex flex-col gap-2">
      <Textarea
        name="body"
        required
        maxLength={500}
        rows={3}
        placeholder="What stood out to you?"
      />
      <Button type="submit" size="sm" disabled={pending} className="self-end py-1.5">
        {pending ? "Posting…" : "Comment"}
      </Button>
    </form>
  );
}
