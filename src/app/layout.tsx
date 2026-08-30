import type { Metadata } from "next";
import { Suspense } from "react";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import { AuthModal } from "@/components/auth-modal";
import { cookies } from "next/headers";
import { THEME_COOKIE, themeFromCookie } from "@/lib/theme";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GDG Babcock Showcase — reviewed student projects",
  description:
    "Where GDG on Campus Babcock students publish what they build. Every project is reviewed before it goes live, so being published means something.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Resolved on the server, so the right theme is in the very first byte of
  // HTML. No bootstrap script, and nothing to flash.
  const theme = themeFromCookie((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${inter.variable} ${jetbrains.variable} h-full${
        theme === "light" ? " light" : ""
      }`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Suspense fallback={null}>
          <AuthModal />
        </Suspense>
      </body>
    </html>
  );
}
