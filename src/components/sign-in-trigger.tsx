"use client";

import { OPEN_AUTH_MODAL_EVENT } from "@/components/auth-modal";

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
      onClick={() => window.dispatchEvent(new Event(OPEN_AUTH_MODAL_EVENT))}
      className={className}
    >
      {children}
    </button>
  );
}
