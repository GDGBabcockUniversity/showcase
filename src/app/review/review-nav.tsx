"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuFlag, LuInbox, LuLayoutDashboard, LuTrophy } from "react-icons/lu";

const links = [
  { href: "/review", label: "Overview", icon: LuLayoutDashboard },
  { href: "/review/submissions", label: "Submissions", icon: LuInbox },
  { href: "/review/reports", label: "Reports", icon: LuFlag },
  { href: "/review/rankings", label: "Rankings", icon: LuTrophy },
];

export function ReviewNav() {
  const pathname = usePathname();
  // A single project review (/review/<id>) belongs under Submissions.
  const section = links.find((l) => l.href !== "/review" && pathname.startsWith(l.href));
  const current = section?.href ?? (pathname === "/review" ? "/review" : "/review/submissions");

  return (
    <nav aria-label="Review workspace" className="grid grid-cols-4 gap-1 lg:flex lg:flex-col">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={href === current ? "page" : undefined}
          className="review-side-link flex-col justify-center gap-1 px-1 text-[11px] lg:flex-row lg:justify-start lg:gap-[0.65rem] lg:px-[0.85rem] lg:text-[0.8125rem]"
        >
          <Icon size={17} aria-hidden />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
