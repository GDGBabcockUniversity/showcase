"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { signIn, signUp, warmUpFirebase } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OPEN_AUTH_MODAL_EVENT } from "@/lib/require-auth";
import { LuLoaderCircle } from "react-icons/lu";
import { FcGoogle } from "react-icons/fc";

const errClass = "mt-1 font-mono text-[11px] text-red";

export function AuthModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Where to go after signing in. Only set when the proxy bounced the user
  // here from a gated route (?redirect=); a plain sign-in from the nav leaves
  // this null so they stay on the page they were already reading.
  const redirectTo = useRef<string | null>(null);

  useEffect(() => {
    warmUpFirebase();
  }, []);

  useEffect(() => {
    function onOpenRequest() {
      // Opened straight from the nav, so there's nowhere to send them after.
      redirectTo.current = null;
      setOpen(true);
    }
    window.addEventListener(OPEN_AUTH_MODAL_EVENT, onOpenRequest);
    return () => window.removeEventListener(OPEN_AUTH_MODAL_EVENT, onOpenRequest);
  }, []);

  // Adjusting state during render rather than in an effect, so the modal is
  // already open on the first paint after ?authModal arrives.
  const wantsModal = !!searchParams.get("authModal");
  const [sawParam, setSawParam] = useState(false);
  if (wantsModal !== sawParam) {
    setSawParam(wantsModal);
    if (wantsModal) setOpen(true);
  }

  useEffect(() => {
    if (!wantsModal) return;
    // Read before router.replace strips the query.
    redirectTo.current = searchParams.get("redirect");
    router.replace(pathname);
  }, [wantsModal, searchParams, pathname, router]);

  function reset() {
    setMode("signin");
    setName("");
    setEmail("");
    setPassword("");
    setError(null);
    setPending(false);
  }

  async function run(attempt: () => Promise<void>) {
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      await attempt();
      setOpen(false);
      reset();
      if (redirectTo.current) router.push(redirectTo.current);
      // Re-render server components so the new session is picked up.
      router.refresh();
    } catch (err) {
      setError(friendly(err));
    } finally {
      setPending(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    run(() =>
      mode === "signin" ? signIn.email(email, password) : signUp.email(name, email, password),
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "signin" ? "Sign in to Showcase" : "Create your Showcase account"}
          </DialogTitle>
          <DialogDescription>
            Use your GDG Babcock account to submit projects, vote and comment.
          </DialogDescription>
        </DialogHeader>

        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={pending}
          onClick={() => run(signIn.google)}
          className="mt-6 w-full"
        >
          <FcGoogle aria-hidden />
          Continue with Google
        </Button>

        <div className="mt-5 flex items-center gap-3 text-muted">
          <span className="h-px flex-1 bg-border" />
          <span className="font-mono text-[10px] uppercase tracking-wider">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onSubmit} aria-busy={pending} className="mt-5 flex flex-col gap-4">
          {mode === "signup" && (
            <div>
              <Label htmlFor="modal-name">Full name</Label>
              <Input
                id="modal-name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={pending}
                className="mt-2"
              />
            </div>
          )}
          <div>
            <Label htmlFor="modal-email">Email</Label>
            <Input
              id="modal-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={pending}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="modal-password">Password</Label>
            <Input
              id="modal-password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === "signup" ? 12 : undefined}
              disabled={pending}
              className="mt-2"
            />
          </div>
          {error && (
            <p role="alert" className={errClass}>
              {error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
            {pending && (
              <LuLoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden />
            )}
            <span aria-live="polite">
              {pending
                ? mode === "signin"
                  ? "Signing in…"
                  : "Creating account…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </span>
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
          <Button
            type="button"
            variant="ghost"
            size="none"
            disabled={pending}
            onClick={() => {
              setError(null);
              setPassword("");
              setMode(mode === "signin" ? "signup" : "signin");
            }}
            className="font-semibold text-blue hover:underline"
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </Button>
        </p>

        <Button
          type="button"
          variant="ghost"
          size="none"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            reset();
          }}
          className="mt-4 w-full text-xs text-muted hover:text-fg"
        >
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// Firebase errors read like "Firebase: Error (auth/wrong-password)."
function friendly(err: unknown) {
  const message = err instanceof Error ? err.message : "";
  if (/auth\/(invalid-credential|wrong-password|user-not-found)/.test(message)) return "Wrong email or password.";
  if (message.includes("auth/email-already-in-use")) return "That email already has an account. Sign in instead.";
  if (message.includes("auth/weak-password")) return "Pick a stronger password.";
  if (/auth\/(popup-closed-by-user|cancelled-popup-request)/.test(message)) return "Google sign-in was cancelled.";
  return message.replace(/^Firebase: /, "") || "Unable to connect. Please try again.";
}
