"use client";

import Link from "next/link";
import { signOut, useSession } from "@/lib/auth-client";
import { SignInTrigger } from "@/components/sign-in-trigger";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

  const { name, image } = session.user;

  return (
    <div className="flex items-center gap-2">
      <Link href="/account" className="rounded-full transition-opacity hover:opacity-80">
        <Avatar aria-hidden className="border border-border">
          <AvatarImage src={image ?? undefined} alt="" />
          <AvatarFallback
            className="font-display text-xs font-semibold text-white"
            style={{
              background:
                "linear-gradient(135deg, var(--color-blue), var(--color-green))",
            }}
          >
            {name.trim()[0]?.toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>
        <span className="sr-only">Your account, {name}</span>
      </Link>
      <Button
        type="button"
        variant="outline"
        size="none"
        onClick={() => signOut()}
        className="px-3 py-1.5 text-sm text-muted hover:text-fg"
      >
        Sign out
      </Button>
    </div>
  );
}
