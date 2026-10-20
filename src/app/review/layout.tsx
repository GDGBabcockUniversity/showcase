import Link from "next/link";
import {
  LuArrowUpRight,
  LuInbox,
  LuLayoutDashboard,
  LuShieldCheck,
  LuFlag,
  LuTrophy,
} from "react-icons/lu";
import { Nav } from "@/components/nav";
import "./review.css";

export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <a
        href="#review-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-fg focus:px-4 focus:py-3 focus:text-bg"
      >
        Skip to review content
      </a>
      <Nav />
      <div className="review-workspace flex-1">
        <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="review-sidebar lg:sticky lg:top-[4.5rem] lg:h-[calc(100dvh-4.5rem)]">
            <div className="hidden items-center gap-3 px-3 pb-8 pt-2 lg:flex">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-bg text-blue">
                <LuShieldCheck size={21} aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold tracking-tight">Showcase</p>
                <p className="mt-0.5 text-xs text-muted">Review workspace</p>
              </div>
            </div>
            <p className="review-caption hidden px-3 pb-3 lg:block">
              Workspace
            </p>
            <nav
              aria-label="Review workspace"
              className="flex gap-1 overflow-x-auto lg:flex-col"
            >
              <Link href="/review" className="review-side-link">
                <LuLayoutDashboard size={17} aria-hidden />
                <span>Overview</span>
              </Link>
              <Link href="/review#submissions" className="review-side-link">
                <LuInbox size={17} aria-hidden />
                <span>Submissions</span>
              </Link>
              <Link href="/review#reports" className="review-side-link">
                <LuFlag size={17} aria-hidden />
                <span>Reports</span>
              </Link>
              <Link href="/review#rankings" className="review-side-link">
                <LuTrophy size={17} aria-hidden />
                <span>Rankings</span>
              </Link>
            </nav>
            <div className="mt-auto hidden border-t border-border px-3 pt-5 lg:block">
              <p className="text-xs font-medium">A thoughtful second look.</p>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Help student projects put their best work forward.
              </p>
              <Link
                href="/"
                className="mt-5 inline-flex min-h-10 items-center gap-2 text-xs font-medium text-muted hover:text-fg"
              >
                View public board <LuArrowUpRight size={14} aria-hidden />
              </Link>
            </div>
          </aside>
          <main
            id="review-content"
            className="min-w-0 px-4 py-7 sm:px-8 sm:py-10 lg:px-10 xl:px-12"
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
