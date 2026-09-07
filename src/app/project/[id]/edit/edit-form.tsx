"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { deleteProject, updateProject, type EditState } from "@/app/actions";
import { CollaboratorPicker } from "@/components/collaborator-picker";
import { DateTimePicker } from "@/components/date-time-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PROJECT_TYPES, TYPE_LABEL } from "@/lib/departments";
import { FileDrop, isoToLocal, localToIso } from "@/app/submit/submit-form";
import {
  MAX_COLLABORATORS,
  MAX_EXTRA_MEDIA,
  MEDIA_ACCEPT,
  SUMMARY_MAX,
  TITLE_MAX,
} from "@/lib/limits";

const labelClass = "block font-mono text-[10px] uppercase tracking-wider text-muted";
const errClass = "mt-1 font-mono text-[11px] text-red";

const initial: EditState = { ok: false };

function CharCount({ value, max }: { value: string; max: number }) {
  const tone =
    value.length >= max ? "text-red" : value.length > max * 0.9 ? "text-yellow" : "text-muted";
  return (
    <span className={`font-mono text-[10px] tabular-nums ${tone}`}>
      {value.length}/{max}
    </span>
  );
}

export function EditForm({
  project,
  collaborators,
}: {
  project: {
    id: string;
    title: string;
    summary: string;
    type: string;
    url: string;
    cover: string | null;
    media: string[];
    draft: boolean;
    releaseAt: string | null;
  };
  collaborators: { id: string; name: string; department: string | null }[];
}) {
  const save = updateProject.bind(null, project.id);
  const [state, formAction, pending] = useActionState(save, initial);

  const [title, setTitle] = useState(project.title);
  const [summary, setSummary] = useState(project.summary);
  // The stored instant reads as local time, which the server can't know, so
  // the two renders legitimately differ — the client's is the right one.
  const [releaseAt, setReleaseAt] = useState(() => isoToLocal(project.releaseAt));

  // Toast whatever the action came back with; the per-field errors stay next
  // to their inputs where they're actionable.
  useEffect(() => {
    if (!state.message) return;
    if (state.ok) toast.success(state.message);
    else toast.error(state.message);
  }, [state]);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <>
      <form action={formAction} className="grid gap-5 lg:grid-cols-2">
        <div>
          <span className="flex items-baseline justify-between gap-2">
            <Label htmlFor="title">Title</Label>
            <CharCount value={title} max={TITLE_MAX} />
          </span>
          <Input
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_MAX}
            aria-invalid={!!state.errors?.title}
            className="mt-2"
          />
          {state.errors?.title && <p className={errClass}>{state.errors.title}</p>}
        </div>

        <div className="lg:col-span-2">
          <span className="flex items-baseline justify-between gap-2">
            <Label htmlFor="summary">Summary</Label>
            <CharCount value={summary} max={SUMMARY_MAX} />
          </span>
          <Textarea
            id="summary"
            name="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={SUMMARY_MAX}
            rows={3}
            aria-invalid={!!state.errors?.summary}
            className="mt-2"
          />
          {state.errors?.summary && <p className={errClass}>{state.errors.summary}</p>}
        </div>

        <div>
          <Label htmlFor="url">Live URL (optional)</Label>
          <Input
            id="url"
            name="url"
            type="url"
            defaultValue={project.url}
            placeholder="https://"
            aria-invalid={!!state.errors?.url}
            className="mt-2"
          />
          {state.errors?.url && <p className={errClass}>{state.errors.url}</p>}
        </div>

        <div>
          <span id="collaborators-label" className={labelClass}>
            Collaborators <span className="text-muted/70">(optional)</span>
          </span>
          <CollaboratorPicker
            name="collaborators"
            max={MAX_COLLABORATORS}
            labelledBy="collaborators-label"
            initial={collaborators}
          />
          {state.errors?.collaborators && (
            <p className={errClass}>{state.errors.collaborators}</p>
          )}
        </div>

        <div>
          <span className={labelClass}>Cover image</span>
          <FileDrop
            id="cover"
            name="cover"
            endpoint="projectCover"
            hint="PNG / JPG / WEBP · ≤ 4 MB"
            initial={project.cover ? [project.cover] : []}
          />
          {state.errors?.cover && <p className={errClass}>{state.errors.cover}</p>}
        </div>

        <div>
          <span className={labelClass}>
            More media <span className="text-muted/70">(images or video, optional)</span>
          </span>
          <FileDrop
            id="media"
            name="media"
            endpoint="projectMedia"
            multiple
            accept={MEDIA_ACCEPT}
            hint={`Images or clips · up to ${MAX_EXTRA_MEDIA}`}
            initial={project.media}
          />
          {state.errors?.media && <p className={errClass}>{state.errors.media}</p>}
        </div>

        <div>
          <Label htmlFor="releaseAt">
            Scheduled release <span className="text-muted/70">(optional)</span>
          </Label>
          <DateTimePicker id="releaseAt" value={releaseAt} onChange={setReleaseAt} />
          <input type="hidden" name="releaseAt" value={localToIso(releaseAt)} />
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted">
            Clear it to go live now. Your local time.
          </p>
          {state.errors?.releaseAt && <p className={errClass}>{state.errors.releaseAt}</p>}
        </div>

        <fieldset className="lg:col-span-2">
          <legend className={labelClass}>Type</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {PROJECT_TYPES.map((t) => (
              <label
                key={t}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors has-[:checked]:border-blue has-[:checked]:bg-blue/10 has-[:checked]:text-blue hover:text-fg"
              >
                <input
                  type="radio"
                  name="type"
                  value={t}
                  defaultChecked={project.type === t}
                  className="sr-only"
                />
                {TYPE_LABEL[t]}
              </label>
            ))}
          </div>
          {state.errors?.type && <p className={errClass}>{state.errors.type}</p>}
        </fieldset>

        <div className="flex items-center justify-between gap-4 border-t border-border pt-5 lg:col-span-2">
          <Link
            href={`/project/${project.id}`}
            className="font-mono text-[11px] text-muted hover:text-fg"
          >
            ← Back to the project
          </Link>

          <span className="flex items-center gap-4">
            {project.draft && (
              <Button type="submit" name="intent" value="draft" variant="quiet" size="none" disabled={pending}>
                Save draft
              </Button>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : project.draft ? "Publish" : "Save changes"}
            </Button>
          </span>
        </div>
      </form>

      {/* Delete is destructive and cascades, so it asks first and sits apart
          from the save form — a nested form would submit the wrong action. */}
      <section className="mt-12 rounded-2xl border border-red/30 bg-red/5 p-5">
        <p className="eyebrow text-red">Danger zone</p>
        <p className="mt-2 text-sm text-muted">
          Deleting removes the project along with its views, clicks, likes,
          comments and saves. This can&apos;t be undone.
        </p>

        {confirming ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm">
              Delete <strong>{project.title}</strong> permanently?
            </span>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleting}
              onClick={() => {
                setDeleting(true);
                deleteProject(project.id).catch(() => setDeleting(false));
              }}
            >
              {deleting ? "Deleting…" : "Yes, delete it"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="destructive-outline"
            size="sm"
            onClick={() => setConfirming(true)}
            className="mt-4"
          >
            Delete project
          </Button>
        )}
      </section>
    </>
  );
}
