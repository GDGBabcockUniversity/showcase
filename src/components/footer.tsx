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
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-4">
          {/* Text Links */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <Link href="/" className="hover:text-fg py-1 md:py-0">
              Home
            </Link>
            <Link href="/this-month" className="hover:text-fg py-1 md:py-0">
              This Month
            </Link>
            <Link href="/signal-model" className="hover:text-fg py-1 md:py-0">
              Signal model
            </Link>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-4 border-t border-border pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-4">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${label} — @gdgbabcock`}
                className="p-2 -m-2 hover:text-fg transition-colors"
              >
                <Icon size={18} aria-hidden />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
