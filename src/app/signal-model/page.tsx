import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Dots } from "@/components/dots";
import { ENGAGEMENT_WEIGHTS } from "@/lib/gauge";

export const metadata: Metadata = {
  title: "The signal model — GDG Babcock Showcase",
  description:
    "How community signal is calculated: the weights behind clicks, likes, comments, and views.",
};

const RATE_LABEL: Record<keyof typeof ENGAGEMENT_WEIGHTS, string> = {
  clicks: "Clicks",
  likes: "Likes",
  comments: "Comments",
  views: "Views",
};

const ORDER: (keyof typeof ENGAGEMENT_WEIGHTS)[] = [
  "clicks",
  "likes",
  "comments",
  "views",
];

export default function SignalModelPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="border-b border-border pb-8">
          <p className="eyebrow flex items-center gap-3">
            <Dots />
            The signal model
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            How ranking works
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Every interaction pays a different rate. A project&apos;s signal score
            is a weighted sum of its views, clicks, likes, and comments —
            weighted toward the actions that mean someone actually engaged,
            not just looked.
          </p>
        </section>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {ORDER.map((key) => (
            <div key={key} className="rounded-2xl border border-border bg-surface p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
                {RATE_LABEL[key]}
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold">
                {Math.round(ENGAGEMENT_WEIGHTS[key] * 100)}%
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
          <p>
            <strong className="text-fg">Clicks</strong> weigh highest —
            someone opened the link and left the board to look at the actual
            project. That&apos;s the strongest signal a project earned attention.
          </p>
          <p>
            <strong className="text-fg">Likes</strong> come next: a
            lightweight but deliberate vote. <strong className="text-fg">
              Comments
            </strong>{" "}
            take real effort to write, but they&apos;re rarer, so they carry less
            total weight despite the higher bar per action.{" "}
            <strong className="text-fg">Views</strong> are the easiest to
            rack up and count for the least.
          </p>
          <p>
            Raw counts are normalized before weighting, so an early project
            with 10 clicks isn&apos;t drowned out by one with 10,000 views — each
            interaction type is measured against what&apos;s typical for it, not
            against absolute scale.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
