import Link from "next/link";
import { Dots } from "@/components/dots";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Dots />
          <span>GDG on Campus Babcock</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/feed" className="hover:text-fg">
            Feed
          </Link>
          <Link href="/this-month" className="hover:text-fg">
            This Month
          </Link>
          <Link href="/signal-model" className="hover:text-fg">
            Signal model
          </Link>
        </div>
      </div>
    </footer>
  );
}
