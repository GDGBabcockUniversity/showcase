import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { THEME_COOKIE, themeFromCookie } from "@/lib/theme";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthStatus } from "@/components/auth-status";
import { SearchBox } from "@/components/search-box";
import { MobileMenu } from "@/components/mobile-menu";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/this-month", label: "This Month" },
  { href: "/archive", label: "Archive" },
  { href: "/following", label: "Following" },
  { href: "/collections", label: "Collections" },
  { href: "/submit", label: "Submit" },
];

export async function Nav() {
  const theme = themeFromCookie((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur-xl">
      <nav className="mx-auto flex min-h-[4.5rem] max-w-7xl flex-nowrap items-center justify-between gap-x-4 px-5 py-0">
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
          </span>
        </Link>

        {/* Desktop View Elements */}
        <Suspense
          fallback={<div className="hidden lg:block lg:max-w-xs lg:flex-1" />}
        >
          <div className="hidden lg:block lg:max-w-xs lg:flex-1">
            <SearchBox />
          </div>
        </Suspense>

        <div className="hidden lg:flex items-center gap-1 rounded-full border border-border bg-surface/70 p-1 px-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:bg-bg hover:text-fg"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle initialLight={theme === "light"} />
          <AuthStatus />
        </div>

        {/* Mobile View Elements */}
        <div className="flex lg:hidden items-center gap-3">
          <ThemeToggle initialLight={theme === "light"} />
          <MobileMenu>
            <Suspense fallback={<div className="h-10" />}>
              <SearchBox />
            </Suspense>
            <div className="flex flex-col gap-1 -mx-2">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-4 py-3 text-base font-medium text-muted transition-colors hover:bg-surface hover:text-fg"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="border-t border-border pt-6">
              <AuthStatus />
            </div>
          </MobileMenu>
        </div>
      </nav>
    </header>
  );
}
