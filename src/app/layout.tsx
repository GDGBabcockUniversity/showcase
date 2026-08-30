import type { Metadata } from "next";
import { Suspense } from "react";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import { AuthModal } from "@/components/auth-modal";
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${inter.variable} ${jetbrains.variable} h-full`}
    >
      <head>
        {/*
          Raw <script> on purpose. React warns in dev that this won't run on
          client renders — fine, it only needs to run once, before first paint.
          next/script's beforeInteractive is not a substitute: for inline
          app-dir scripts Next queues them into self.__next_s and runs them once
          the client runtime boots, i.e. after paint, which brings back the
          theme flash this exists to prevent.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('theme')==='light')document.documentElement.classList.add('light')}catch{}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Suspense fallback={null}>
          <AuthModal />
        </Suspense>
      </body>
    </html>
  );
}
