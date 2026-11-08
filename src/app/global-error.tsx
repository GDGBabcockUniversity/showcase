"use client";

import "./globals.css";
import { ErrorScreen, primaryAction } from "@/components/error-screen";

// Replaces the root layout when it fails, so it brings its own <html>/<body>.
// The theme cookie can't be read here, so it falls back to the default theme.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-full flex-col">
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
        </ErrorScreen>
      </body>
    </html>
  );
}
