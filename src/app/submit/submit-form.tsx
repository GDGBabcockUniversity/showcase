"use client";

import { useActionState, useEffect, useRef, useState, type DragEvent } from "react";
import { DEPARTMENTS, PROJECT_TYPES, TYPE_LABEL } from "@/lib/departments";
import { CollaboratorPicker } from "@/components/collaborator-picker";

export type SubmitState = {
  ok: boolean;
  message?: string;
  errors?: Partial<
    Record<
      | "title"
      | "summary"
      | "collaborators"
      | "department"
      | "type"
      | "url"
      | "cover"
      | "media",
      string
    >
  >;
  receipt?: {
    title: string;
    department: string;
    collaborators: string[];
    media: number;
  };
};

const MAX_COLLABORATORS = 5;

const initial: SubmitState = { ok: false };

const inputClass =
  "w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg outline-none transition-colors placeholder:text-muted focus:border-blue/60";
const labelClass = "block font-mono text-[10px] uppercase tracking-wider text-muted";
const errClass = "mt-1 font-mono text-[11px] text-red";

function FileDrop({
  id,
  name,
  multiple,
  required,
  accept = "image/png,image/jpeg,image/webp",
  hint,
}: {
  id: string;
  name: string;
  multiple?: boolean;
  required?: boolean;
  accept?: string;
  hint: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [previews, setPreviews] = useState<{ name: string; url: string }[]>([]);

  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  function sync() {
    const files = inputRef.current?.files;
    setPreviews((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return files
        ? Array.from(files).map((f) => ({ name: f.name, url: URL.createObjectURL(f) }))
        : [];
    });
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setOver(false);
    if (!inputRef.current) return;
    const dt = new DataTransfer();
    const incoming = Array.from(e.dataTransfer.files).filter((f) =>
      accept.split(",").some((a) => f.type === a.trim()),
    );
    (multiple ? incoming : incoming.slice(0, 1)).forEach((f) => dt.items.add(f));
    if (dt.files.length === 0) return;
    inputRef.current.files = dt.files;
    sync();
  }

  return (
    <label
      htmlFor={id}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={`mt-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-3 py-6 text-center text-xs transition-colors ${
        over ? "border-blue bg-blue/5 text-fg" : "border-border bg-bg text-muted hover:border-blue/60"
      }`}
    >
      {previews.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-2">
          {previews.map((p) => (
            <img
              key={p.url}
              src={p.url}
              alt={p.name}
              className="h-20 w-20 rounded-lg border border-border object-cover"
            />
          ))}
        </div>
      ) : (
        <span className="font-medium text-fg">Drop or click to upload</span>
      )}
      <span className="font-mono text-[10px] uppercase tracking-wider">{hint}</span>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        required={required}
        onChange={sync}
        className="sr-only"
      />
    </label>
  );
}

export function SubmitForm({
  action,
}: {
  action: (prev: SubmitState, formData: FormData) => Promise<SubmitState>;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  if (state.ok && state.receipt) {
    return (
      <div className="rounded-2xl border border-green/30 bg-green/5 p-6">
        <p className="eyebrow text-green">Received</p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
          {state.receipt.title} is in the queue.
        </h2>
        <p className="mt-2 text-sm text-muted">
          Filed
          {state.receipt.collaborators.length > 0
            ? ` with ${state.receipt.collaborators.join(", ")}`
            : ""}
          {" · "}
          {state.receipt.department}
          {state.receipt.media > 0
            ? ` · ${state.receipt.media} image${state.receipt.media === 1 ? "" : "s"}`
            : ""}
          . A reviewer will pick it up before the next board.
        </p>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-muted">
          Refresh to submit another.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-5 lg:grid-cols-2">
      <div>
        <label htmlFor="title" className={labelClass}>Title</label>
        <input
          id="title"
          name="title"
          required
          maxLength={80}
          placeholder="CampusCart"
          className={`mt-2 ${inputClass}`}
        />
        {state.errors?.title && <p className={errClass}>{state.errors.title}</p>}
      </div>

      <div>
        <label htmlFor="department" className={labelClass}>Department</label>
        <select
          id="department"
          name="department"
          required
          defaultValue=""
          className={`mt-2 ${inputClass}`}
        >
          <option value="" disabled>Pick one</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        {state.errors?.department && <p className={errClass}>{state.errors.department}</p>}
      </div>

      <div className="lg:col-span-2">
        <label htmlFor="summary" className={labelClass}>Summary</label>
        <textarea
          id="summary"
          name="summary"
          required
          maxLength={240}
          rows={3}
          placeholder="One sentence a busy student would still read."
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
        />
        {state.errors?.collaborators && (
          <p className={errClass}>{state.errors.collaborators}</p>
        )}
      </div>

      <div>
        <span className={labelClass}>Cover image</span>
        <FileDrop id="cover" name="cover" required hint="PNG / JPG / WEBP · ≤ 4 MB" />
        {state.errors?.cover && <p className={errClass}>{state.errors.cover}</p>}
      </div>

      <div>
        <span className={labelClass}>
          More media <span className="text-muted/70">(optional)</span>
        </span>
        <FileDrop id="media" name="media" multiple hint="Up to 4 · 4 MB each" />
        {state.errors?.media && <p className={errClass}>{state.errors.media}</p>}
      </div>

      <fieldset className="lg:col-span-2">
        <legend className={labelClass}>Type</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PROJECT_TYPES.map((t) => (
            <label
              key={t}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors has-[:checked]:border-blue has-[:checked]:bg-blue/10 has-[:checked]:text-blue hover:text-fg"
            >
              <input type="radio" name="type" value={t} required className="sr-only" />
              {TYPE_LABEL[t]}
            </label>
          ))}
        </div>
        {state.errors?.type && <p className={errClass}>{state.errors.type}</p>}
      </fieldset>

      {state.message && !state.ok && (
        <p aria-live="polite" className="font-mono text-xs text-red lg:col-span-2">
          {state.message}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-border pt-5 lg:col-span-2">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
          Reviewed before it goes live.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-full bg-blue px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Sending…" : "Submit for review"}
        </button>
      </div>
    </form>
  );
}
