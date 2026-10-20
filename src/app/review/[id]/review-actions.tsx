"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { toast } from "sonner";
import {
  LuCheck,
  LuCircleCheck,
  LuClock3,
  LuLoaderCircle,
  LuMessageSquare,
  LuShieldAlert,
  LuX,
} from "react-icons/lu";
import { demoteProject, setProjectStatus } from "@/app/review/actions";
import { STATUS_LABEL, type ProjectStatus } from "@/lib/project-status";

const decisions = [
  {
    status: "PUBLISHED",
    label: "Publish project",
    description: "Ready for the public board",
    icon: LuCircleCheck,
  },
  {
    status: "CHANGES_REQUESTED",
    label: "Request changes",
    description: "Give the maker another pass",
    icon: LuMessageSquare,
  },
  {
    status: "PENDING",
    label: "Return to queue",
    description: "Leave for a later review",
    icon: LuClock3,
  },
  {
    status: "REJECTED",
    label: "Reject submission",
    description: "Keep this project off the board",
    icon: LuX,
  },
] as const;

export function StatusButtons({
  projectId,
  current,
}: {
  projectId: string;
  current: ProjectStatus;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<ProjectStatus | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState(false);

  async function set(status: ProjectStatus) {
    if (pending) return;
    setPending(status);
    setFeedback("");
    setError(false);
    try {
      const res = await setProjectStatus(projectId, status);
      if (res.ok) {
        const message = `Marked ${STATUS_LABEL[status].toLowerCase()}.`;
        toast.success(message);
        setFeedback(message);
        router.refresh();
      } else {
        setError(true);
        setFeedback(
          res.error ?? "The decision could not be saved. Please try again.",
        );
      }
    } catch {
      setError(true);
      setFeedback("Unable to save. Check your connection and try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div aria-busy={pending !== null}>
      <div className="space-y-2">
        {decisions.map(({ status, label, description, icon: Icon }) => (
          <button
            key={status}
            type="button"
            disabled={pending !== null || status === current}
            onClick={() => set(status)}
            className={`review-control w-full justify-start gap-3 px-4 py-3 text-left ${status === "PUBLISHED" && current !== status ? "review-control-primary" : ""} ${status === "REJECTED" ? "review-tone-red" : ""}`}
          >
            {pending === status ? (
              <LuLoaderCircle
                size={18}
                aria-hidden
                className="shrink-0 animate-spin motion-reduce:animate-none"
              />
            ) : current === status ? (
              <LuCheck size={18} aria-hidden className="shrink-0" />
            ) : (
              <Icon size={18} aria-hidden className="shrink-0" />
            )}
            <span className="min-w-0">
              <span className="block text-xs font-semibold">
                {pending === status ? "Saving decision…" : label}
                {current === status && (
                  <span className="ml-1.5 text-[10px] font-normal">
                    · Current
                  </span>
                )}
              </span>
              <span className="mt-0.5 block whitespace-normal text-[11px] font-normal opacity-70">
                {description}
              </span>
            </span>
          </button>
        ))}
      </div>
      {feedback && (
        <p
          role={error ? "alert" : "status"}
          className={`mt-4 text-xs leading-relaxed ${error ? "review-tone-red" : "review-tone-green"}`}
        >
          {feedback}
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
