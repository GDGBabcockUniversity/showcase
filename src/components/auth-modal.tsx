"use client";

import { useEffect, useRef, useState } from "react";
import { LuX } from "react-icons/lu";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEPARTMENTS, LEVELS } from "@/lib/departments";
import { slugify, USERNAME_MAX, USERNAME_MIN } from "@/lib/username";
import { OPEN_AUTH_MODAL_EVENT } from "@/lib/require-auth";

// The department and level selects stay native; this keeps them looking like
// the Input component.
const inputClass =
  "w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-fg outline-none transition-colors placeholder:text-muted focus:border-blue";
const errClass = "mt-1 font-mono text-[11px] text-red";

export function AuthModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Where to go after signing in. Only set when the proxy bounced the user
  // here from a gated route (?redirect=); a plain sign-in from the nav leaves
  // this null so they stay on the page they were already reading.
  const redirectTo = useRef<string | null>(null);

  useEffect(() => {
    function open() {
      // Opened straight from the nav, so there's nowhere to send them after.
      redirectTo.current = null;
      dialogRef.current?.showModal();
    }
    window.addEventListener(OPEN_AUTH_MODAL_EVENT, open);
    return () => window.removeEventListener(OPEN_AUTH_MODAL_EVENT, open);
  }, []);

  useEffect(() => {
    if (searchParams.get("authModal")) {
      // Read before router.replace strips the query below.
      redirectTo.current = searchParams.get("redirect");
      dialogRef.current?.showModal();
      router.replace(pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function reset() {
    setMode("signin");
    setName("");
    setUsername("");
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
        : await signUp.email({ name, username, email, password, department, level });
    setPending(false);
    if (error) {
      setError(error.message ?? "Something went wrong.");
      return;
    }
    dialogRef.current?.close();
    reset();
    if (redirectTo.current) router.push(redirectTo.current);
    // Re-render server components so the new session is picked up.
    router.refresh();
  }

  // max-h + scroll matter in sign-up mode, which is tall enough to overflow a
  // short laptop viewport now that the dialog is larger.
  return (
    <dialog
      ref={dialogRef}
      onClose={reset}
      onClick={(e) => {
        // A backdrop click reports the dialog as its target, and so does a click
        // on the dialog's own padding — so compare against the box instead.
        const r = e.currentTarget.getBoundingClientRect();
        const outside =
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom;
        if (outside) e.currentTarget.close();
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-8 text-fg backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{mode === "signin" ? "Welcome back" : "Join the board"}</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">
            {mode === "signin" ? "Sign in" : "Create an account"}
          </h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close"
        >
          <LuX size={16} aria-hidden />
        </Button>
      </div>

      <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-4">
        {mode === "signup" && (
          <>
            <div>
              <Label htmlFor="modal-name">Name</Label>
              <Input
                id="modal-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="modal-username">Username</Label>
              <Input
                id="modal-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={USERNAME_MIN}
                maxLength={USERNAME_MAX}
                placeholder="jdoe23"
                className="mt-2"
              />
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                Your profile lives at /u/{slugify(username) || "your-handle"}
              </p>
            </div>
            <div>
              <Label htmlFor="modal-department">Department</Label>
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
              <Label htmlFor="modal-level">Level</Label>
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
          <Label htmlFor="modal-email">Email</Label>
          <Input
            id="modal-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="modal-password">Password</Label>
          <Input
            id="modal-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="mt-2"
          />
        </div>
        {error && <p className={errClass}>{error}</p>}
        <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
          {mode === "signin" ? "Sign in" : "Sign up"}
        </Button>
      </form>

      <div className="mt-4 flex items-center gap-3 text-muted">
        <span className="h-px flex-1 bg-border" />
        <span className="font-mono text-[10px] uppercase tracking-wider">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() =>
          signIn.social({
            provider: "google",
            callbackURL: redirectTo.current ?? pathname,
          })
        }
        className="mt-4 w-full"
      >
        Continue with Google
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="none"
        onClick={() => {
          setError(null);
          setMode(mode === "signin" ? "signup" : "signin");
        }}
        className="mt-6 text-sm"
      >
        {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </Button>
    </dialog>
  );
}
