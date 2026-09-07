"use client";

import { openAuthModal } from "@/lib/require-auth";
import { Button } from "@/components/ui/button";

export function SignInTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    // Callers pass their own styling, so this stays unopinionated.
    <Button type="button" variant="ghost" size="none" onClick={openAuthModal} className={className}>
      {children}
    </Button>
  );
}
