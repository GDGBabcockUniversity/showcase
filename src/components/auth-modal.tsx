"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-client";
import { DEPARTMENTS, LEVELS } from "@/lib/departments";

const inputClass =
  "w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg outline-none transition-colors placeholder:text-muted focus:border-blue/60";
const labelClass = "block font-mono text-[10px] uppercase tracking-wider text-muted";
const errClass = "mt-1 font-mono text-[11px] text-red";

export const OPEN_AUTH_MODAL_EVENT = "open-auth-modal";

export function AuthModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const redirectTo = searchParams.get("redirect") || "/submit";

  useEffect(() => {
    function open() {
      dialogRef.current?.showModal();
    }
    window.addEventListener(OPEN_AUTH_MODAL_EVENT, open);
    return () => window.removeEventListener(OPEN_AUTH_MODAL_EVENT, open);
  }, []);

  useEffect(() => {
    if (searchParams.get("authModal")) {
      dialogRef.current?.showModal();
      router.replace(pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function reset() {
    setMode("signin");
    setName("");
    setEmail("");
    setPassword("");
    setDepartment("");
    setLevel("");
    setError(null);
    setPending(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { error } =
      mode === "signin"
        ? await signIn.email({ email, password })
        : await signUp.email({ name, email, password, department, level });
    setPending(false);
    if (error) {
      setError(error.message ?? "Something went wrong.");
      return;
    }
    dialogRef.current?.close();
    reset();
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={reset}
      onClick={(e) => {
        if (e.target === e.currentTarget) dialogRef.current?.close();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-surface p-6 text-fg backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{mode === "signin" ? "Welcome back" : "Join the board"}</p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
            {mode === "signin" ? "Sign in" : "Create an account"}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close"
          className="shrink-0 rounded-full p-1 text-muted transition-colors hover:text-fg"
        >
          ✕
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        {mode === "signup" && (
          <>
            <div>
              <label htmlFor="modal-name" className={labelClass}>Name</label>
              <input
                id="modal-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={`mt-2 ${inputClass}`}
              />
            </div>
            <div>
              <label htmlFor="modal-department" className={labelClass}>Department</label>
              <select
                id="modal-department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                className={`mt-2 ${inputClass}`}
              >
                <option value="" disabled>Pick one</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="modal-level" className={labelClass}>Level</label>
              <select
                id="modal-level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                required
                className={`mt-2 ${inputClass}`}
              >
                <option value="" disabled>Pick one</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </>
        )}
        <div>
          <label htmlFor="modal-email" className={labelClass}>Email</label>
          <input
            id="modal-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`mt-2 ${inputClass}`}
          />
        </div>
        <div>
          <label htmlFor="modal-password" className={labelClass}>Password</label>
          <input
            id="modal-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className={`mt-2 ${inputClass}`}
          />
        </div>
        {error && <p className={errClass}>{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-blue px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {mode === "signin" ? "Sign in" : "Sign up"}
        </button>
      </form>

      <div className="mt-4 flex items-center gap-3 text-muted">
        <span className="h-px flex-1 bg-border" />
        <span className="font-mono text-[10px] uppercase tracking-wider">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={() => signIn.social({ provider: "google", callbackURL: redirectTo })}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-fg transition-colors hover:border-blue/60"
      >
        Continue with Google
      </button>

      <button
        type="button"
        onClick={() => {
          setError(null);
          setMode(mode === "signin" ? "signup" : "signin");
        }}
        className="mt-6 text-sm text-muted hover:text-fg"
      >
        {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </dialog>
  );
}
