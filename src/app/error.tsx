"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ErrorScreen, primaryAction, secondaryAction } from "@/components/error-screen";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorScreen
      code="500"
      title="Something went wrong on our end"
      message={
        error.digest
          ? `Try again in a moment. If it keeps happening, tell us this reference: ${error.digest}`
          : "Try again in a moment. If it keeps happening, let a GDG lead know."
      }
      missingBar={1}
    >
      <button type="button" onClick={reset} className={primaryAction}>
        Try again
      </button>
      <Link href="/" className={secondaryAction}>
        Back to the board
      </Link>
    </ErrorScreen>
  );
}
