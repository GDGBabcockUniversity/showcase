"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { demoteProject, setProjectStatus } from "@/app/review/actions";
import { Button } from "@/components/ui/button";
import { PROJECT_STATUSES, STATUS_LABEL, type ProjectStatus } from "@/lib/project-status";

export function StatusButtons({ projectId, current }: { projectId: string; current: ProjectStatus }) {
  const router = useRouter();
  const [pending, setPending] = useState<ProjectStatus | null>(null);

  async function set(status: ProjectStatus) {
    setPending(status);
    const res = await setProjectStatus(projectId, status);
    setPending(null);
    if (res.ok) {
      toast.success(`Marked ${STATUS_LABEL[status].toLowerCase()}.`);
      router.refresh();
    } else {
      toast.error(res.error ?? "That didn't work.");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {PROJECT_STATUSES.map((s) => (
        <Button
          key={s}
          type="button"
          variant={s === current ? "default" : "outline"}
          size="sm"
          disabled={pending !== null || s === current}
          onClick={() => set(s)}
        >
          {pending === s ? "Saving…" : STATUS_LABEL[s]}
        </Button>
      ))}
    </div>
  );
}

export function DemoteForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    const res = await demoteProject(projectId, reason);
    setPending(false);
    if (res.ok) {
      toast.success("Demoted for this cohort.");
      setReason("");
      router.refresh();
    } else {
      toast.error(res.error ?? "That didn't work.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Why this project is being demoted — logged permanently."
        rows={2}
        className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm"
      />
      <Button type="button" variant="destructive" size="sm" disabled={pending} onClick={submit} className="self-end">
        {pending ? "Demoting…" : "Demote from this month"}
      </Button>
    </div>
  );
}
