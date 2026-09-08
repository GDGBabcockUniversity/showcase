import Link from "next/link";
import { FaInstagram, FaTiktok, FaXTwitter } from "react-icons/fa6";
import Image from "next/image";

const SOCIALS = [
  { label: "X", href: "https://x.com/gdgbabcock", Icon: FaXTwitter },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@gdgbabcock",
    Icon: FaTiktok,
  },
  {
    label: "Instagram",
    href: "https://instagram.com/gdgbabcock",
    Icon: FaInstagram,
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Image
            src={"/gdg-logo.png"}
            alt=""
            width={36}
            height={36}
            priority
            className="h-9 w-9 shrink-0 rounded-[10px]"
            quality={100}
          />
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

          <span className="flex items-center gap-3 md:border-l md:border-border md:pl-4">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${label} — @gdgbabcock`}
                className="hover:text-fg"
              >
                <Icon size={16} aria-hidden />
              </a>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
