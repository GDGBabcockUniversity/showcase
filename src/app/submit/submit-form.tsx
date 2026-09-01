"use client";

import { useActionState, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { DEPARTMENTS, PROJECT_TYPES, TYPE_LABEL } from "@/lib/departments";
import { CollaboratorPicker } from "@/components/collaborator-picker";
import {
  MAX_COLLABORATORS,
  SUMMARY_MAX,
  SUMMARY_MIN,
  TITLE_MAX,
  TITLE_MIN,
} from "@/lib/limits";

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

type ErrorField = NonNullable<SubmitState["errors"]> extends Partial<Record<infer K, string>>
  ? K
  : never;

const initial: SubmitState = { ok: false };

const inputClass =
  "w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg outline-none transition-colors placeholder:text-muted focus:border-blue";
const labelClass = "block font-mono text-[10px] uppercase tracking-wider text-muted";
const errClass = "mt-1 font-mono text-[11px] text-red";

function FileDrop({
  id,
  name,
  multiple,
  accept = "image/png,image/jpeg,image/webp",
  hint,
}: {
  id: string;
  name: string;
  multiple?: boolean;
  accept?: string;
  hint: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  function put(list: File[]) {
    const dt = new DataTransfer();
    list.forEach((f) => dt.items.add(f));
    if (inputRef.current) inputRef.current.files = dt.files;
  }

  function commit(list: File[]) {
    setFiles(list);
    put(list);
  }

  // React clears uncontrolled inputs once a form action settles, which would
  // otherwise drop the chosen file whenever the server returns a validation
  // error. Files can't be controlled, so put them back after every render.
  useEffect(() => {
    const el = inputRef.current;
    if (!el || files.length === 0) return;
    if (el.files && el.files.length > 0) return;
    put(files);
  });

  const previews = useMemo(
    () => files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })),
    [files],
  );
  useEffect(
    () => () => previews.forEach((p) => URL.revokeObjectURL(p.url)),
    [previews],
  );

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setOver(false);
    const incoming = Array.from(e.dataTransfer.files).filter((f) =>
      accept.split(",").some((a) => f.type === a.trim()),
    );
    if (incoming.length === 0) return;
    commit(multiple ? incoming : incoming.slice(0, 1));
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
        onChange={(e) => commit(Array.from(e.target.files ?? []))}
        className="sr-only"
      />
    </label>
  );
}

// Which step owns each server-side error, so a failed submit can jump there.
const STEPS = [
  {
    id: "main",
    label: "Main info",
    heading: "Main info",
    blurb: "The essentials a reviewer reads first: what it is, who it's for, and where to find it.",
    fields: ["title", "summary", "url", "department", "type"] as ErrorField[],
  },
  {
    id: "media",
    label: "Images and media",
    heading: "Images and media",
    blurb: "A cover image is required — it's the first thing people see on the board.",
    fields: ["cover", "media"] as ErrorField[],
  },
  {
    id: "makers",
    label: "Makers",
    heading: "Makers",
    blurb: "Credit anyone who built this with you. They're picked from registered accounts.",
    fields: ["collaborators"] as ErrorField[],
  },
  {
    id: "review",
    label: "Launch checklist",
    heading: "Launch checklist",
    blurb: "Everything below has to be filled in before this can go to a reviewer.",
    fields: [] as ErrorField[],
  },
];

function CharCount({ value, max }: { value: string; max: number }) {
  const used = value.length;
  const tone = used >= max ? "text-red" : used > max * 0.9 ? "text-yellow" : "text-muted";
  return (
    <span className={`font-mono text-[10px] tabular-nums ${tone}`}>
      {used}/{max}
    </span>
  );
}

function StepIcon({ index, state }: { index: number; state: "done" | "active" | "todo" | "error" }) {
  const tone =
    state === "error"
      ? "border-red text-red"
      : state === "done"
        ? "border-green text-green"
        : state === "active"
          ? "border-blue text-blue"
          : "border-border text-muted";
  return (
    <span
      aria-hidden
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] ${tone}`}
    >
      {state === "done" ? "✓" : state === "error" ? "!" : index + 1}
    </span>
  );
}

function ChecklistRow({ label, ok, hint }: { label: string; ok: boolean; hint: string }) {
  return (
    <li className="flex items-start gap-3 border-b border-border py-3 last:border-b-0">
      <span
        aria-hidden
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
          ok ? "bg-green/15 text-green" : "bg-border text-muted"
        }`}
      >
        {ok ? "✓" : "·"}
      </span>
      <span className="min-w-0">
        <span className="block text-sm">{label}</span>
        <span className="block font-mono text-[10px] uppercase tracking-wider text-muted">
          {ok ? "Ready" : hint}
        </span>
      </span>
    </li>
  );
}

export function SubmitForm({
  action,
}: {
  action: (prev: SubmitState, formData: FormData) => Promise<SubmitState>;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  // Controlled, because React clears uncontrolled fields once a form action
  // settles — a validation error would otherwise wipe everything typed so far.
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [url, setUrl] = useState("");
  const [department, setDepartment] = useState("");
  const [type, setType] = useState("");
  // Recomputed on navigation rather than per keystroke — enough to drive the
  // sidebar ticks and the checklist without re-rendering the form constantly.
  const [filled, setFilled] = useState<Record<string, boolean>>({});

  function readFilled() {
    const fd = formRef.current ? new FormData(formRef.current) : null;
    if (!fd) return {};
    const cover = fd.get("cover");
    const next = {
      title: title.trim().length >= TITLE_MIN,
      summary: summary.trim().length >= SUMMARY_MIN,
      department: !!department,
      type: !!type,
      cover: cover instanceof File && cover.size > 0,
      collaborators: fd.getAll("collaborators").length > 0,
      media: fd.getAll("media").filter((f) => f instanceof File && f.size > 0).length > 0,
    };
    setFilled(next);
    return next;
  }

  // Jump to the first step the server complained about. Adjusting state during
  // render rather than in an effect, so the wrong step never paints first.
  const [seen, setSeen] = useState(state);
  if (seen !== state) {
    setSeen(state);
    const bad = state.errors && (Object.keys(state.errors) as ErrorField[])[0];
    const idx = bad ? STEPS.findIndex((s) => s.fields.includes(bad)) : -1;
    if (idx >= 0) setStep(idx);
  }

  function go(next: number) {
    readFilled();
    setStep(next);
  }

  const stepHasError = (i: number) =>
    !!state.errors && STEPS[i].fields.some((f) => state.errors?.[f]);

  const ready = {
    main: !!filled.title && !!filled.summary && !!filled.department && !!filled.type,
    media: !!filled.cover,
    makers: true,
  };
  const allReady = ready.main && ready.media;

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

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
      {/* Sidebar */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center gap-3 px-3 pb-4">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-display text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--color-blue), var(--color-green))" }}
            aria-hidden
          >
            {title.trim()[0]?.toUpperCase() ?? "?"}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">
              {title.trim() || "Untitled project"}
            </span>
            <span className="block font-mono text-[10px] uppercase tracking-wider text-muted">
              Draft
            </span>
          </span>
        </div>
        <nav>
          <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {STEPS.map((s, i) => {
              const active = i === step;
              const err = stepHasError(i);
              const done = !err && !active && (
                (s.id === "main" && ready.main) ||
                (s.id === "media" && ready.media) ||
                (s.id === "makers" && !!filled.collaborators)
              );
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-current={active ? "step" : undefined}
                    className={`flex w-full items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                      active ? "bg-surface text-fg" : "text-muted hover:bg-surface/60 hover:text-fg"
                    }`}
                  >
                    <StepIcon index={i} state={err ? "error" : active ? "active" : done ? "done" : "todo"} />
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Step panel */}
      <form
        ref={formRef}
        action={formAction}
        onKeyDown={(e) => {
          // Enter would otherwise submit from any step
          if (e.key === "Enter" && !isLast && (e.target as HTMLElement).tagName !== "TEXTAREA") {
            e.preventDefault();
          }
        }}
        className="min-w-0"
      >
        <h1 className="font-display text-3xl font-bold tracking-tight">{current.heading}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{current.blurb}</p>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {/* Main info */}
          <div className={current.id === "main" ? "" : "hidden"}>
            <span className="flex items-baseline justify-between gap-2">
              <label htmlFor="title" className={labelClass}>Title</label>
              <CharCount value={title} max={TITLE_MAX} />
            </span>
            <input
              id="title"
              name="title"
              maxLength={TITLE_MAX}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="CampusCart"
              className={`mt-2 ${inputClass}`}
            />
            {state.errors?.title && <p className={errClass}>{state.errors.title}</p>}
          </div>

          <div className={current.id === "main" ? "" : "hidden"}>
            <label htmlFor="department" className={labelClass}>Department</label>
            <select
              id="department"
              name="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={`mt-2 ${inputClass}`}
            >
              <option value="" disabled>Pick one</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {state.errors?.department && <p className={errClass}>{state.errors.department}</p>}
          </div>

          <div className={current.id === "main" ? "lg:col-span-2" : "hidden"}>
            <span className="flex items-baseline justify-between gap-2">
              <label htmlFor="summary" className={labelClass}>Summary</label>
              <CharCount value={summary} max={SUMMARY_MAX} />
            </span>
            <textarea
              id="summary"
              name="summary"
              maxLength={SUMMARY_MAX}
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="One sentence a busy student would still read."
              className={`mt-2 ${inputClass} resize-y`}
            />
            {state.errors?.summary && <p className={errClass}>{state.errors.summary}</p>}
          </div>

          <div className={current.id === "main" ? "" : "hidden"}>
            <label htmlFor="url" className={labelClass}>Live URL (optional)</label>
            <input
              id="url"
              name="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
              className={`mt-2 ${inputClass}`}
            />
            {state.errors?.url && <p className={errClass}>{state.errors.url}</p>}
          </div>

          <fieldset className={current.id === "main" ? "lg:col-span-2" : "hidden"}>
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
                    checked={type === t}
                    onChange={() => setType(t)}
                    className="sr-only"
                  />
                  {TYPE_LABEL[t]}
                </label>
              ))}
            </div>
            {state.errors?.type && <p className={errClass}>{state.errors.type}</p>}
          </fieldset>

          {/* Images and media */}
          <div className={current.id === "media" ? "" : "hidden"}>
            <span className={labelClass}>Cover image</span>
            <FileDrop id="cover" name="cover" hint="PNG / JPG / WEBP · ≤ 4 MB" />
            {state.errors?.cover && <p className={errClass}>{state.errors.cover}</p>}
          </div>

          <div className={current.id === "media" ? "" : "hidden"}>
            <span className={labelClass}>
              More media <span className="text-muted/70">(optional)</span>
            </span>
            <FileDrop id="media" name="media" multiple hint="Up to 4 · 4 MB each" />
            {state.errors?.media && <p className={errClass}>{state.errors.media}</p>}
          </div>

          {/* Makers */}
          <div className={current.id === "makers" ? "lg:col-span-2" : "hidden"}>
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

          {/* Launch checklist */}
          <div className={current.id === "review" ? "lg:col-span-2" : "hidden"}>
            <ul className="rounded-2xl border border-border bg-surface px-5 py-2">
              <ChecklistRow label="Title" ok={!!filled.title} hint={`At least ${TITLE_MIN} characters`} />
              <ChecklistRow label="Summary" ok={!!filled.summary} hint={`At least ${SUMMARY_MIN} characters`} />
              <ChecklistRow label="Department" ok={!!filled.department} hint="Pick one" />
              <ChecklistRow label="Type" ok={!!filled.type} hint="Pick one" />
              <ChecklistRow label="Cover image" ok={!!filled.cover} hint="Required" />
              <ChecklistRow label="Collaborators" ok={!!filled.collaborators} hint="Optional" />
            </ul>
            {!allReady && (
              <p className="mt-3 font-mono text-[11px] text-muted">
                Fill the missing items above — the steps are listed on the left.
              </p>
            )}
          </div>
        </div>

        {state.message && !state.ok && (
          <p aria-live="polite" className="mt-5 font-mono text-xs text-red">
            {state.message}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-5">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => go(step - 1)}
              className="font-mono text-[11px] uppercase tracking-wider text-muted transition-colors hover:text-fg"
            >
              ← Back
            </button>
          ) : (
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
              Reviewed before it goes live.
            </p>
          )}

          {isLast ? (
            <button
              key="submit"
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center rounded-full bg-blue px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Sending…" : "Submit for review"}
            </button>
          ) : (
            <button
              key="next"
              type="button"
              onClick={() => go(step + 1)}
              className="inline-flex items-center justify-center rounded-full bg-blue px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Next step: {STEPS[step + 1].label}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
