"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { addComment, type CommentState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initial: CommentState = { ok: false };

export function CommentForm({
  projectId,
  parentId,
  initialText = "",
  autoFocus = false,
  placeholder = "What stood out to you?",
  onCancel,
  onSuccess,
}: {
  projectId: string;
  parentId?: string;
  initialText?: string;
  autoFocus?: boolean;
  placeholder?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}) {
  const action = addComment.bind(null, projectId);
  const [state, formAction, pending] = useActionState(action, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      onSuccess?.();
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state, onSuccess]);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      if (initialText) {
        textareaRef.current.setSelectionRange(
          initialText.length,
          initialText.length,
        );
      }
    }
  }, [autoFocus, initialText]);

  return (
    <form ref={formRef} action={formAction} className="mt-4 flex flex-col gap-2">
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <Textarea
        ref={textareaRef}
        name="body"
        required
        maxLength={500}
        rows={parentId ? 2 : 3}
        defaultValue={initialText}
        placeholder={placeholder}
      />
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={pending}
            className="py-1.5"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={pending}
          className="py-1.5"
        >
          {pending ? "Posting…" : parentId ? "Reply" : "Comment"}
        </Button>
      </div>
    </form>
  );
}
