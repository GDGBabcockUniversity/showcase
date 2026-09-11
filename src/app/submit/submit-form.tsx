"use client";

import { useActionState, useEffect, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { LuX } from "react-icons/lu";
import { PROJECT_TYPES, TYPE_LABEL } from "@/lib/departments";
import { MAX_TAGS, TAGS, TAG_LABEL } from "@/lib/tags";
import { CollaboratorPicker } from "@/components/collaborator-picker";
import { DateTimePicker } from "@/components/date-time-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useUploadThing } from "@/lib/uploadthing";
import {
  isVideoUrl,
  MAX_COLLABORATORS,
  MEDIA_ACCEPT,
  SUMMARY_MAX,
  SUMMARY_MIN,
  TITLE_MAX,
  TITLE_MIN,
  VIDEO_MARK,
} from "@/lib/limits";

export type SubmitState = {
  ok: boolean;
  message?: string;
  errors?: Partial<
    Record<
      | "title"
      | "summary"
      | "collaborators"
      | "type"
      | "tags"
      | "url"
      | "cover"
      | "media"
      | "releaseAt",
      string
    >
  >;
  receipt?: {
    title: string;
    collaborators: string[];
    media: number;
    releaseAt: string | null;
  };
};

type ErrorField = NonNullable<SubmitState["errors"]> extends Partial<Record<infer K, string>>
  ? K
  : never;

const initial: SubmitState = { ok: false };

// For elements that aren't <label> (a legend, and spans that title a control
// group) — matches the Label component's styling.
const labelClass = "block font-mono text-[10px] uppercase tracking-wider text-muted";
const errClass = "mt-1 font-mono text-[11px] text-red";

export function FileDrop({
  id,
  name,
  endpoint,
  multiple,
  accept = "image/png,image/jpeg,image/webp",
  hint,
  initial = [],
}: {
  id: string;
  name: string;
  endpoint: "projectCover" | "projectMedia";
  multiple?: boolean;
  accept?: string;
  hint: string;
  // Already-uploaded images (editing an existing project). They post the same
  // hidden inputs as new ones, so removing one here removes it on save.
  initial?: string[];
}) {
  const [over, setOver] = useState(false);
  const [urls, setUrls] = useState<string[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Files go straight to UploadThing on pick; the form only ever carries the
  // resulting URLs. That also sidesteps the 8mb server-action body limit.
  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onUploadProgress: setProgress,
    onClientUploadComplete: (res) => {
      setUrls((prev) => [
        ...prev,
        ...res.map((r) => r.ufsUrl + (r.type.startsWith("video/") ? VIDEO_MARK : "")),
      ]);
      setError(null);
    },
    onUploadError: (e) => {
      setError(e.message);
      toast.error(e.message);
    },
  });

  function take(list: File[]) {
    const images = list.filter((f) => accept.split(",").some((a) => f.type === a.trim()));
    if (images.length === 0) return;
    setError(null);
    setProgress(0);
    void startUpload(multiple ? images : images.slice(0, 1));
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setOver(false);
    take(Array.from(e.dataTransfer.files));
  }

  return (
    <div className="mt-2">
      {urls.map((u) => (
        <input key={u} type="hidden" name={name} value={u} />
      ))}

      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-3 py-6 text-center text-xs transition-colors ${
          over ? "border-blue bg-blue/5 text-fg" : "border-border bg-bg text-muted hover:border-blue/60"
        }`}
      >
        {urls.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-2">
            {urls.map((u) => (
              <span key={u} className="relative">
                {isVideoUrl(u) ? (
                  <video
                    src={u}
                    muted
                    className="h-20 w-20 rounded-lg border border-border object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={u}
                    alt=""
                    className="h-20 w-20 rounded-lg border border-border object-cover"
                  />
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Remove image"
                  onClick={(e) => {
                    // The label would otherwise open the file picker.
                    e.preventDefault();
                    setUrls((prev) => prev.filter((x) => x !== u));
                  }}
                  className="absolute -right-1.5 -top-1.5 h-5 w-5 bg-bg text-muted hover:border-red hover:text-red"
                >
                  <LuX size={11} aria-hidden />
                </Button>
              </span>
            ))}
          </div>
        ) : (
          <span className="font-medium text-fg">
            {isUploading ? "Uploading…" : "Drop or click to upload"}
          </span>
        )}
        <span className="font-mono text-[10px] uppercase tracking-wider">
          {isUploading ? "Uploading…" : hint}
        </span>
        <input
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={isUploading}
          onChange={(e) => take(Array.from(e.target.files ?? []))}
          className="sr-only"
        />
      </label>

      {isUploading && (
        <div className="mt-2 flex items-center gap-2">
          <Progress value={progress} aria-label="Upload progress" />
          <span className="font-mono text-[10px] tabular-nums text-muted">{progress}%</span>
        </div>
      )}
      {error && <p className={errClass}>{error}</p>}
    </div>
  );
}

// Which step owns each server-side error, so a failed submit can jump there.
const STEPS = [
  {
    id: "main",
    label: "Main info",
    heading: "Main info",
    blurb: "The essentials a reviewer reads first: what it is, who it's for, and where to find it.",
    fields: ["title", "summary", "url", "type", "tags"] as ErrorField[],
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
    fields: ["releaseAt"] as ErrorField[],
  },
];

// <input type="datetime-local"> gives local wall-clock time; the server is
// sent the absolute instant instead, so a schedule doesn't shift with the
// server's timezone.
export function localToIso(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export function isoToLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // Shift by the offset so toISOString's UTC slice reads as local time.
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

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
  const [type, setType] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [releaseAt, setReleaseAt] = useState("");
  // Recomputed on navigation rather than per keystroke — enough to drive the
  // sidebar ticks and the checklist without re-rendering the form constantly.
  const [filled, setFilled] = useState<Record<string, boolean>>({});

  function readFilled() {
    const fd = formRef.current ? new FormData(formRef.current) : null;
    if (!fd) return {};
    const next = {
      title: title.trim().length >= TITLE_MIN,
      summary: summary.trim().length >= SUMMARY_MIN,
      type: !!type,
      tags: tags.length > 0,
      cover: !!String(fd.get("cover") ?? ""),
      collaborators: fd.getAll("collaborators").length > 0,
      media: fd.getAll("media").length > 0,
    };
    setFilled(next);
    return next;
  }

  useEffect(() => {
    if (state.message && !state.ok) toast.error(state.message);
  }, [state]);

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
    main: !!filled.title && !!filled.summary && !!filled.type,
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
          {state.receipt.media > 0
            ? ` · ${state.receipt.media} image${state.receipt.media === 1 ? "" : "s"}`
            : ""}
          .{" "}
          {state.receipt.releaseAt
            ? `Scheduled to go live ${new Date(state.receipt.releaseAt).toLocaleString()}.`
            : "A reviewer will pick it up before the next board."}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 font-mono text-[11px] uppercase tracking-wider text-blue transition-colors hover:underline"
        >
          Refresh to submit another.
        </button>
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
              <Label htmlFor="title">Title</Label>
              <CharCount value={title} max={TITLE_MAX} />
            </span>
            <Input
              id="title"
              name="title"
              maxLength={TITLE_MAX}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="CampusCart"
              aria-invalid={!!state.errors?.title}
              className="mt-2"
            />
            {state.errors?.title && <p className={errClass}>{state.errors.title}</p>}
          </div>

          <div className={current.id === "main" ? "lg:col-span-2" : "hidden"}>
            <span className="flex items-baseline justify-between gap-2">
              <Label htmlFor="summary">Summary</Label>
              <CharCount value={summary} max={SUMMARY_MAX} />
            </span>
            <Textarea
              id="summary"
              name="summary"
              maxLength={SUMMARY_MAX}
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="One sentence a busy student would still read."
              aria-invalid={!!state.errors?.summary}
              className="mt-2"
            />
            {state.errors?.summary && <p className={errClass}>{state.errors.summary}</p>}
          </div>

          <div className={current.id === "main" ? "" : "hidden"}>
            <Label htmlFor="url">Live URL (optional)</Label>
            <Input
              id="url"
              name="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
              aria-invalid={!!state.errors?.url}
              className="mt-2"
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

          <fieldset className={current.id === "main" ? "lg:col-span-2" : "hidden"}>
            <legend className={labelClass}>
              Topics <span className="text-muted/70">(optional, up to {MAX_TAGS})</span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <label
                  key={t}
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors has-[:checked]:border-blue has-[:checked]:bg-blue/10 has-[:checked]:text-blue hover:text-fg"
                >
                  <input
                    type="checkbox"
                    name="tags"
                    value={t}
                    checked={tags.includes(t)}
                    onChange={(e) =>
                      setTags((prev) =>
                        e.target.checked ? [...prev, t] : prev.filter((x) => x !== t),
                      )
                    }
                    className="sr-only"
                  />
                  {TAG_LABEL[t]}
                </label>
              ))}
            </div>
            {state.errors?.tags && <p className={errClass}>{state.errors.tags}</p>}
          </fieldset>

          {/* Images and media */}
          <div className={current.id === "media" ? "" : "hidden"}>
            <span className={labelClass}>Cover image</span>
            <FileDrop id="cover" name="cover" endpoint="projectCover" hint="PNG / JPG / WEBP · ≤ 4 MB" />
            {state.errors?.cover && <p className={errClass}>{state.errors.cover}</p>}
          </div>

          <div className={current.id === "media" ? "" : "hidden"}>
            <span className={labelClass}>
              More media <span className="text-muted/70">(images or video, optional)</span>
            </span>
            <FileDrop
              id="media"
              name="media"
              endpoint="projectMedia"
              multiple
              accept={MEDIA_ACCEPT}
              hint="Images or clips · up to 4"
            />
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
              <ChecklistRow label="Type" ok={!!filled.type} hint="Pick one" />
              <ChecklistRow label="Cover image" ok={!!filled.cover} hint="Required" />
              <ChecklistRow label="Topics" ok={!!filled.tags} hint="Optional" />
              <ChecklistRow label="Collaborators" ok={!!filled.collaborators} hint="Optional" />
            </ul>
            <div className="mt-5">
              <Label htmlFor="releaseAt">
                Schedule release <span className="text-muted/70">(optional)</span>
              </Label>
              <DateTimePicker id="releaseAt" value={releaseAt} onChange={setReleaseAt} />
              <input type="hidden" name="releaseAt" value={localToIso(releaseAt)} />
            
              {state.errors?.releaseAt && <p className={errClass}>{state.errors.releaseAt}</p>}
            </div>

            {!allReady && (
              <p className="mt-3 font-mono text-[11px] text-muted">
                Fill the missing items above — the steps are listed on the left.
              </p>
            )}
          </div>
        </div>

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

          <div className="flex items-center gap-4">
            {/* Saves whatever's filled in and lands on the edit page, where the
                draft can be finished and published later. */}
            <Button type="submit" name="intent" value="draft" variant="quiet" size="none" disabled={pending}>
              Save draft
            </Button>

            {isLast ? (
              <Button key="submit" type="submit" size="lg" disabled={pending}>
                {pending ? "Sending…" : "Submit for review"}
              </Button>
            ) : (
              <Button key="next" type="button" size="lg" onClick={() => go(step + 1)}>
                Next step: {STEPS[step + 1].label}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
