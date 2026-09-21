import { differenceInCalendarDays, isSameMonth } from "date-fns";

// The feed only ever shows the current calendar month — anything older has
// aged out to /archive, searchable by the month it was published. Within
// this month, split into three graduated recency bands so the newest
// launches don't get lost next to ones from three weeks ago.
export const FEED_BUCKETS = ["This week", "Last week", "This month"] as const;
export type FeedBucket = (typeof FEED_BUCKETS)[number];

// null means "not in the current calendar month" — the feed excludes it,
// not just labels it differently.
export function feedBucket(date: Date, now = new Date()): FeedBucket | null {
  if (!isSameMonth(date, now)) return null;
  const days = differenceInCalendarDays(now, date);
  if (days <= 7) return "This week";
  if (days <= 14) return "Last week";
  return "This month";
}
