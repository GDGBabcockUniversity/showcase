import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { THEME_COOKIE, themeFromCookie } from "@/lib/theme";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthStatus } from "@/components/auth-status";
import { SearchBox } from "@/components/search-box";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/feed", label: "Feed" },
  { href: "/this-month", label: "This Month" },
  { href: "/submit", label: "Submit" },
];

export async function Nav() {
  const theme = themeFromCookie((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur-xl">
      <nav className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-5">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Image
            src="/logo.png"
            alt=""
            width={36}
            height={36}
            priority
            className="h-9 w-9 shrink-0 rounded-[10px]"
          />
          <span className="min-w-0">
            <span className="block truncate font-display text-sm font-semibold tracking-tight">
              GDG Babcock Showcase
            </span>
            <span className="block truncate font-mono text-[10px] uppercase tracking-wider text-muted">
              Student projects, in motion
            </span>
          </span>
        </Link>

        {/* Suspense because SearchBox reads useSearchParams, same as AuthModal
            in the root layout. Hidden on small screens — no room in a 4.5rem bar. */}
        <Suspense fallback={<div className="hidden flex-1 lg:block lg:max-w-xs" />}>
          <div className="hidden flex-1 lg:block lg:max-w-xs">
            <SearchBox />
          </div>
        </Suspense>

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
          <ThemeToggle initialLight={theme === "light"} />
          <AuthStatus />
        </div>
      </nav>
    </header>
  );
}
