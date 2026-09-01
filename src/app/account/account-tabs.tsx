"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// The three lists are rendered on the server and passed through as nodes, so
// switching tabs is instant and costs no extra queries.
export function AccountTabs({
  counts,
  shipped,
  liked,
  saved,
}: {
  counts: { shipped: number; liked: number; saved: number };
  shipped: React.ReactNode;
  liked: React.ReactNode;
  saved: React.ReactNode;
}) {
  const tabs = [
    { value: "shipped", label: "Shipped", blurb: "Projects filed under your account", count: counts.shipped, body: shipped },
    { value: "liked", label: "Liked", blurb: "Projects you've upvoted", count: counts.liked, body: liked },
    { value: "saved", label: "Saved", blurb: "Projects you bookmarked to come back to", count: counts.saved, body: saved },
  ];

  return (
    <Tabs defaultValue="shipped" className="mt-12">
      <TabsList className="border border-border">
        {tabs.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
            <span className="font-mono text-[10px] tabular-nums text-muted">
              {t.count}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((t) => (
        <TabsContent key={t.value} value={t.value}>
          <h2 className="mt-4 border-b border-border pb-3 font-display text-xl font-semibold tracking-tight">
            {t.blurb}
          </h2>
          {t.body}
        </TabsContent>
      ))}
    </Tabs>
  );
}
