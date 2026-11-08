import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ErrorScreen, primaryAction, secondaryAction } from "@/components/error-screen";

export const metadata: Metadata = {
  title: "Page not found — GDG Babcock Showcase",
};

export default function NotFound() {
  return (
    <>
      <Nav />
      <ErrorScreen
        code="404"
        title="This page isn’t on the board"
        message="The link may be old, or the project may have been removed. Head back to the board to find what you were after."
        missingBar={2}
      >
        <Link href="/" className={primaryAction}>
          Back to the board
        </Link>
        <Link href="/archive" className={secondaryAction}>
          Browse the archive
        </Link>
      </ErrorScreen>
      <Footer />
    </>
  );
}
