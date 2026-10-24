import { FEED_BUCKETS, FEED_WINDOW_DAYS, feedBucket } from "./when";

const now = new Date("2026-10-23T12:00:00Z");
const daysAgo = (n: number) =>
  new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

const cases: [number, string | null][] = [
  [0, "This week"],
  [7, "This week"],
  [8, "Last week"],
  [14, "Last week"],
  [15, "Earlier"],
  [FEED_WINDOW_DAYS, "Earlier"],
  [FEED_WINDOW_DAYS + 1, null],
  [365, null],
];

for (const [days, expected] of cases) {
  const actual = feedBucket(daysAgo(days), now);
  if (actual !== expected) {
    throw new Error(
      `feedBucket ${days}d ago: expected ${expected}, got ${actual}`,
    );
  }
}

// The regression this window replaced: a calendar-month feed dropped anything
// published last month, so the board went blank on the 1st. A project from
// 25 days ago is in September when "now" is late October, and must still show.
if (feedBucket(new Date("2026-09-28T12:00:00Z"), now) === null) {
  throw new Error("a project from 25 days ago must stay in the feed");
}

// Future-dated rows are excluded, not treated as the newest thing on the board.
if (feedBucket(daysAgo(-3), now) !== null) {
  throw new Error("future-dated projects must be excluded");
}

// Every bucket feedBucket can return has to be one the feed actually groups by.
for (const days of [0, 10, 20]) {
  const bucket = feedBucket(daysAgo(days), now);
  if (bucket && !(FEED_BUCKETS as readonly string[]).includes(bucket)) {
    throw new Error(`feedBucket returned ${bucket}, absent from FEED_BUCKETS`);
  }
}

console.log("when.test.ts: ok");
