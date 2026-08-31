"use client";

import { useActionState, useEffect, useState } from "react";
import { updateProfile, type ProfileState } from "@/app/actions";
import { DEPARTMENTS, LEVELS } from "@/lib/departments";
import { useSession } from "@/lib/auth-client";

const inputClass =
  "w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg outline-none transition-colors placeholder:text-muted focus:border-blue/60";
const labelClass = "block font-mono text-[10px] uppercase tracking-wider text-muted";

const initial: ProfileState = { ok: false };

export function ProfileForm({
  name: initialName,
  email,
  department: initialDepartment,
  level: initialLevel,
}: {
  name: string;
  email: string;
  department: string | null;
  level: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, initial);
  const { refetch } = useSession();

  const [name, setName] = useState(initialName);
  const [department, setDepartment] = useState(initialDepartment ?? "");
  const [level, setLevel] = useState(initialLevel ?? "");

  // The nav reads the name from better-auth's client session store, which the
  // server action can't touch — pull it again so the header updates too.
  useEffect(() => {
    if (state.ok) refetch();
  }, [state, refetch]);

  const dirty =
    name !== initialName ||
    department !== (initialDepartment ?? "") ||
    level !== (initialLevel ?? "");

  return (
    <form action={formAction} className="mt-4 grid gap-5 sm:grid-cols-2">
      <div>
        <label htmlFor="profile-name" className={labelClass}>Name</label>
        <input
          id="profile-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          className={`mt-2 ${inputClass}`}
        />
      </div>

      <div>
        <span className={labelClass}>Email</span>
        <input
          value={email}
          readOnly
          aria-readonly
          className={`mt-2 ${inputClass} cursor-not-allowed opacity-60`}
        />
      </div>

      <div>
        <label htmlFor="profile-department" className={labelClass}>Department</label>
        <select
          id="profile-department"
          name="department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className={`mt-2 ${inputClass}`}
        >
          <option value="">Not set</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="profile-level" className={labelClass}>Level</label>
        <select
          id="profile-level"
          name="level"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className={`mt-2 ${inputClass}`}
        >
          <option value="">Not set</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between gap-4 sm:col-span-2">
        <p aria-live="polite" className="font-mono text-[11px]">
          {state.error ? (
            <span className="text-red">{state.error}</span>
          ) : state.ok && !dirty ? (
            <span className="text-green">Saved.</span>
          ) : (
            <span className="text-muted">Your email can&apos;t be changed here.</span>
          )}
        </p>
        <button
          type="submit"
          disabled={pending || !dirty}
          className="inline-flex items-center justify-center rounded-full bg-blue px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
