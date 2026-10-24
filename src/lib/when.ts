import { differenceInCalendarDays } from "date-fns";

// The feed is a rolling recency window, not a calendar month. Anchoring it to
// the calendar meant the board emptied itself on the 1st of every month no
// matter how active it was — and it dropped a project from four days ago just
// because the month had rolled over. Anything past the window has aged out to
// /archive, searchable by the month it was published.
export const FEED_WINDOW_DAYS = 30;

export const FEED_BUCKETS = ["This week", "Last week", "Earlier"] as const;
export type FeedBucket = (typeof FEED_BUCKETS)[number];

// null means "outside the window" — the feed excludes it, not just labels it
// differently. Future-dated rows are excluded too rather than counted as new.
export function feedBucket(date: Date, now = new Date()): FeedBucket | null {
  const days = differenceInCalendarDays(now, date);
  if (days < 0 || days > FEED_WINDOW_DAYS) return null;
  if (days <= 7) return "This week";
  if (days <= 14) return "Last week";
  return "Earlier";
}
