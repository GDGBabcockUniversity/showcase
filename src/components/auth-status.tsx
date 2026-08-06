"use client";

import { signOut, useSession } from "@/lib/auth-client";
import { SignInTrigger } from "@/components/sign-in-trigger";

export function AuthStatus() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <span className="h-8 w-16" />;
  }

  if (!session) {
    return (
      <SignInTrigger className="rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-blue/60 hover:text-fg">
        Sign in
      </SignInTrigger>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-24 truncate text-sm text-fg sm:inline">
        {session.user.name}
      </span>
      <button
        type="button"
        onClick={() => signOut()}
        className="rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-blue/60 hover:text-fg"
      >
        Sign out
      </button>
    </div>
  );
}
