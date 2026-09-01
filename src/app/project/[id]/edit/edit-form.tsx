"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { deleteProject, updateProject, type EditState } from "@/app/actions";
import { CollaboratorPicker } from "@/components/collaborator-picker";
import { DEPARTMENTS, PROJECT_TYPES, TYPE_LABEL } from "@/lib/departments";
import {
  MAX_COLLABORATORS,
  SUMMARY_MAX,
  SUMMARY_MIN,
  TITLE_MAX,
  TITLE_MIN,
} from "@/lib/limits";

const inputClass =
  "w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg outline-none transition-colors placeholder:text-muted focus:border-blue";
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
    department: string;
    type: string;
    url: string;
  };
  collaborators: { id: string; name: string; department: string | null }[];
}) {
  const save = updateProject.bind(null, project.id);
  const [state, formAction, pending] = useActionState(save, initial);

  const [title, setTitle] = useState(project.title);
  const [summary, setSummary] = useState(project.summary);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <>
      <form action={formAction} className="grid gap-5 lg:grid-cols-2">
        <div>
          <span className="flex items-baseline justify-between gap-2">
            <label htmlFor="title" className={labelClass}>Title</label>
            <CharCount value={title} max={TITLE_MAX} />
          </span>
          <input
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            minLength={TITLE_MIN}
            maxLength={TITLE_MAX}
            className={`mt-2 ${inputClass}`}
          />
          {state.errors?.title && <p className={errClass}>{state.errors.title}</p>}
        </div>

        <div>
          <label htmlFor="department" className={labelClass}>Department</label>
          <select
            id="department"
            name="department"
            defaultValue={project.department}
            className={`mt-2 ${inputClass}`}
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {state.errors?.department && <p className={errClass}>{state.errors.department}</p>}
        </div>

        <div className="lg:col-span-2">
          <span className="flex items-baseline justify-between gap-2">
            <label htmlFor="summary" className={labelClass}>Summary</label>
            <CharCount value={summary} max={SUMMARY_MAX} />
          </span>
          <textarea
            id="summary"
            name="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            minLength={SUMMARY_MIN}
            maxLength={SUMMARY_MAX}
            rows={3}
            className={`mt-2 ${inputClass} resize-y`}
          />
          {state.errors?.summary && <p className={errClass}>{state.errors.summary}</p>}
        </div>

        <div>
          <label htmlFor="url" className={labelClass}>Live URL (optional)</label>
          <input
            id="url"
            name="url"
            type="url"
            defaultValue={project.url}
            placeholder="https://"
            className={`mt-2 ${inputClass}`}
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
          <p aria-live="polite" className="font-mono text-[11px]">
            {state.ok ? (
              <span className="text-green">{state.message}</span>
            ) : state.message ? (
              <span className="text-red">{state.message}</span>
            ) : (
              <Link href={`/project/${project.id}`} className="text-muted hover:text-fg">
                ← Back to the project
              </Link>
            )}
          </p>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center rounded-full bg-blue px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
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
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                setDeleting(true);
                deleteProject(project.id).catch(() => setDeleting(false));
              }}
              className="rounded-full bg-red px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Yes, delete it"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-sm text-muted hover:text-fg"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-4 rounded-full border border-red/40 px-4 py-2 text-sm font-medium text-red transition-colors hover:bg-red/10"
          >
            Delete project
          </button>
        )}
      </section>
    </>
  );
}
