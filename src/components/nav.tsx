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
      {/* Wraps rather than hides: below lg the search box and the links drop
          onto their own rows instead of disappearing, so nothing in the nav is
          unreachable on a narrow window. */}
      <nav className="mx-auto flex min-h-[4.5rem] max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-3 lg:flex-nowrap lg:py-0">
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
            in the root layout. `order-last basis-full` puts it on its own row
            until there's space for it inline. */}
        <Suspense fallback={<div className="order-last basis-full lg:order-none lg:max-w-xs lg:flex-1 lg:basis-auto" />}>
          <div className="order-last basis-full lg:order-none lg:max-w-xs lg:flex-1 lg:basis-auto">
            <SearchBox />
          </div>
        </Suspense>

        {/* Scrolls sideways on a phone rather than wrapping the pills. */}
        <div className="order-last -mx-5 flex basis-full items-center gap-1 overflow-x-auto px-5 [scrollbar-width:none] md:order-none md:mx-0 md:basis-auto md:overflow-visible md:rounded-full md:border md:border-border md:bg-surface/70 md:p-1 md:px-1 [&::-webkit-scrollbar]:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 rounded-full border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:bg-bg hover:text-fg md:border-transparent"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle initialLight={theme === "light"} />
          <AuthStatus />
        </div>
      </nav>
    </header>
  );
}
