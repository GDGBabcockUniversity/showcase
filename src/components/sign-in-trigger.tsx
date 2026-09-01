"use client";

import { openAuthModal } from "@/lib/require-auth";

export function SignInTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={openAuthModal}
      className={className}
    >
      {children}
    </button>
  );
}
