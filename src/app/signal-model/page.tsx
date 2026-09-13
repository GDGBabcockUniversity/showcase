import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Dots } from "@/components/dots";
import { ENGAGEMENT_WEIGHTS } from "@/lib/signal-scores";

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
            not just looked. It&apos;s computed once overnight, not on every page
            load, so the number you see might be a few hours behind the most
            recent clicks — that&apos;s by design, not a bug.
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
            rack up and count for the least. You can comment more than once on
            a project — that&apos;s still a real discussion — but only your first
            comment on each project adds to its signal, and anything a
            reviewer hides for being spam or abuse doesn&apos;t count at all.
          </p>
          <p>
            <strong className="text-fg">Raw counts are normalized before
            weighting.</strong> Your project&apos;s views, clicks, likes, and
            comments are each compared only to other projects published in
            the same calendar month — its &quot;cohort&quot; — not to every project
            ever shipped. Specifically, each count is measured against the
            <strong className="text-fg"> 90th-percentile project</strong> in
            that cohort — roughly, what a strong result looked like that
            month. Reach that mark and the metric maxes out at 100%; a
            runaway outlier with ten times the clicks doesn&apos;t get extra
            credit for it. If fewer than 10 projects published that month,
            there isn&apos;t enough data for a reliable &quot;strong result&quot;
            benchmark, so the comparison point becomes the typical (median)
            project instead.
          </p>
          <p>
            <strong className="text-fg">One tradeoff, stated plainly:</strong>{" "}
            your signal only ever counts interactions from your publish date
            through the end of that same calendar month. Publish on the 1st
            of a quiet month and you get nearly four weeks to build signal;
            publish on the 28th of a busy one and you get two days before
            that month&apos;s comparison closes. We know this rewards early-month
            publishing — it&apos;s a deliberate simplicity tradeoff for this first
            version, not an oversight.
          </p>
          <p>
            Review is separate from ranking. A reviewer checks that a project
            is real, coherent, and not spam or plagiarism before it ever
            reaches the board — signal only decides order among projects that
            already passed that bar.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
