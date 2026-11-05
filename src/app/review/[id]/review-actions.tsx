"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  LuCircleCheck,
  LuClock3,
  LuLoaderCircle,
  LuMessageSquare,
  LuShieldAlert,
  LuX,
} from "react-icons/lu";
import { demoteProject, setProjectStatus } from "@/app/review/actions";
import { NOTE_MAX, NOTE_MIN, STATUS_LABEL, type ProjectStatus } from "@/lib/project-status";

type Decision = { status: ProjectStatus; label: string; done: string };

const PUBLISH: Decision = { status: "PUBLISHED", label: "Publish", done: "Published" };
const CHANGES: Decision = { status: "CHANGES_REQUESTED", label: "Request changes", done: "Changes requested" };
const REJECT: Decision = { status: "REJECTED", label: "Reject", done: "Rejected" };
const REQUEUE: Decision = { status: "PENDING", label: "Move back to the queue", done: "Moved back to the queue" };

export type LastDecision = {
  reviewer: string | null;
  reviewedAt: string;
  note: string | null;
};

export function StatusButtons({
  projectId,
  current,
  last,
}: {
  projectId: string;
  current: ProjectStatus;
  last: LastDecision | null;
}) {
  const router = useRouter();
  const noteId = useId();
  const [pending, setPending] = useState<ProjectStatus | null>(null);
  // The decision whose note is being written, if any.
  const [drafting, setDrafting] = useState<Decision | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function decide(decision: Decision, withNote?: string) {
    if (pending) return;
    setPending(decision.status);
    setError("");
    try {
      const res = await setProjectStatus(projectId, decision.status, withNote);
      if (res.ok) {
        toast.success(`${decision.done}.`);
        setDrafting(null);
        setNote("");
        router.refresh();
      } else {
        setError(res.error ?? "The decision wasn't saved. Try again.");
      }
    } catch {
      setError("The decision wasn't saved. Check your connection and try again.");
    } finally {
      setPending(null);
    }
  }

  const busy = pending !== null;
  const spinner = (
    <LuLoaderCircle size={16} aria-hidden className="shrink-0 animate-spin motion-reduce:animate-none" />
  );

  return (
    <div aria-busy={busy}>
      {last && (
        <div className="mb-5 rounded-xl border border-border bg-bg px-4 py-3">
          <p className="text-[11px] text-muted">
            {current === "PENDING" ? "Moved back to the queue" : STATUS_LABEL[current]} by{" "}
            <span className="font-medium text-fg">{last.reviewer ?? "a reviewer"}</span>,{" "}
            {formatDistanceToNow(new Date(last.reviewedAt), { addSuffix: true })}
          </p>
          {last.note && (
            <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed">
              {last.note}
            </p>
          )}
        </div>
      )}

      {drafting ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            decide(drafting, note);
          }}
          className="space-y-3"
        >
          <label htmlFor={noteId} className="block text-xs font-semibold">
            {drafting === CHANGES ? "What should the maker change?" : "Why is this being rejected?"}
          </label>
          <textarea
            id={noteId}
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            required
            minLength={NOTE_MIN}
            maxLength={NOTE_MAX}
            rows={5}
            disabled={busy}
            placeholder={
              drafting === CHANGES
                ? "e.g. The demo link returns a 404. Add screenshots of the dashboard."
                : "e.g. This is a template with no changes, not original student work."
            }
            className="w-full resize-y rounded-xl border border-border bg-bg px-3 py-3 text-sm leading-relaxed placeholder:text-muted"
          />
          <p className="text-[11px] leading-relaxed text-muted">
            The maker sees this note on their account page.
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy || note.trim().length < NOTE_MIN}
              className={`review-control flex-1 ${drafting === REJECT ? "review-control-danger" : "review-control-primary"}`}
            >
              {pending && spinner}
              {drafting === CHANGES ? "Send back to maker" : "Reject project"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setDrafting(null);
                setError("");
              }}
              className="review-control"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            disabled={busy || current === "PUBLISHED"}
            onClick={() => decide(PUBLISH)}
            className="review-control review-control-primary w-full"
          >
            {pending === "PUBLISHED" ? spinner : <LuCircleCheck size={16} aria-hidden />}
            {current === "PUBLISHED" ? "Published" : PUBLISH.label}
          </button>
          <div className="grid gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setNote(current === "CHANGES_REQUESTED" ? (last?.note ?? "") : "");
                setDrafting(CHANGES);
              }}
              className="review-control"
            >
              <LuMessageSquare size={16} aria-hidden />
              {CHANGES.label}
            </button>
            <button
              type="button"
              disabled={busy || current === "REJECTED"}
              onClick={() => {
                setNote("");
                setDrafting(REJECT);
              }}
              className="review-control review-tone-red"
            >
              <LuX size={16} aria-hidden />
              {REJECT.label}
            </button>
          </div>
          {current !== "PENDING" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => decide(REQUEUE)}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 text-xs font-medium text-muted hover:text-fg disabled:opacity-50"
            >
              {pending === "PENDING" ? spinner : <LuClock3 size={14} aria-hidden />}
              {REQUEUE.label}
            </button>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="review-tone-red mt-4 text-xs leading-relaxed">
          {error}
        </p>
      )}
    </div>
  );
}

export function DemoteForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const reasonId = useId();
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending || reason.trim().length < 5) return;
    setPending(true);
    setError("");
    try {
      const res = await demoteProject(projectId, reason);
      if (res.ok) {
        toast.success("Demoted for this cohort.");
        setReason("");
        router.refresh();
      } else setError(res.error ?? "The override could not be saved.");
    } catch {
      setError("Unable to save. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} aria-busy={pending} className="space-y-3">
      <label htmlFor={reasonId} className="block text-xs font-medium">
        Reason for override
      </label>
      <textarea
        id={reasonId}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        required
        minLength={5}
        rows={3}
        disabled={pending}
        placeholder="Describe the coordinated activity you verified…"
        className="w-full resize-y rounded-xl border border-border bg-bg px-3 py-3 text-sm leading-relaxed placeholder:text-muted"
      />
      <p className="text-xs leading-relaxed text-muted">
        At least 5 characters. This reason is recorded permanently.
      </p>
      {error && (
        <p role="alert" className="review-tone-red text-xs">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || reason.trim().length < 5}
        className="review-control review-tone-red w-full"
      >
        {pending ? (
          <LuLoaderCircle
            size={16}
            aria-hidden
            className="animate-spin motion-reduce:animate-none"
          />
        ) : (
          <LuShieldAlert size={16} aria-hidden />
        )}
        {pending ? "Saving override…" : "Demote for this month"}
      </button>
    </form>
  );
}
