import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/feed", label: "Feed" },
  { href: "/this-month", label: "This Month" },
  { href: "/submit", label: "Submit" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur-xl">
      <nav className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-5">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="signal-corner flex h-9 w-9 items-center justify-center border border-border bg-surface">
            <svg width="20" height="20" viewBox="0 0 16 16" aria-hidden>
              <path
                d="M1.5 8h13M8 1.5v13"
                stroke="currentColor"
                strokeWidth="0.6"
                strokeLinecap="round"
                className="text-muted"
                opacity="0.4"
              />
              <circle cx="8"    cy="2.2"  r="1.7" fill="var(--color-blue)" />
              <circle cx="13.8" cy="8"    r="1.7" fill="var(--color-red)" />
              <circle cx="8"    cy="13.8" r="1.7" fill="var(--color-yellow)" />
              <circle cx="2.2"  cy="8"    r="1.7" fill="var(--color-green)" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-sm font-semibold tracking-tight">
              GDG Babcock Showcase
            </span>
            <span className="block truncate font-mono text-[10px] uppercase tracking-wider text-muted">
              Student projects, in motion
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1 rounded-full border border-border bg-surface/70 p-1 md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:bg-bg hover:text-fg"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <span className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-green lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-green" /> live
          </span>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
