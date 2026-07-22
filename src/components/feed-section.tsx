import Link from "next/link";
import type { ReactNode } from "react";

export function FeedSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <section className="mt-16 border-t border-border pt-10">
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Archive</p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
        {action ? (
          <Link href={action.href} className="text-sm text-blue hover:underline">
            {action.label}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
