import { computeScores, ENGAGEMENT_WEIGHTS, normalizeMetric, percentile } from "./signal-scores";

function approx(a: number, b: number, epsilon = 0.0001) {
  return Math.abs(a - b) < epsilon;
}

// Nearest-rank percentile
if (percentile([1, 2, 3, 4, 5], 0.9) !== 5) {
  throw new Error("p90 of [1..5] should be the max");
}
if (percentile([], 0.9) !== 0) {
  throw new Error("percentile of an empty cohort should be 0");
}

// Small cohort (< 10) falls back to the median, large cohort uses p90.
const small = normalizeMetric([1, 2, 3, 4]);
if (!approx(small[3], 1)) {
  throw new Error("the median-benchmark project should normalize to 1.0");
}

const large = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const normalizedLarge = normalizeMetric(large);
if (Math.max(...normalizedLarge) > 1.0001) {
  throw new Error("normalized values must be capped at 1.0");
}
if (normalizedLarge[normalizedLarge.length - 1] < 0.9) {
  throw new Error("the top project in a >=10 cohort should be near or at the p90 benchmark");
}

// An all-zero metric normalizes everyone to zero rather than dividing by zero.
if (normalizeMetric([0, 0, 0]).some((v) => v !== 0)) {
  throw new Error("an all-zero cohort should normalize to all zeros, not NaN");
}

// Weighted sum matches the four published weights.
const scores = computeScores("2026-01", [
  { projectId: "a", views: 100, clicks: 100, likes: 100, comments: 100 },
]);
if (!approx(scores[0].score, ENGAGEMENT_WEIGHTS.views + ENGAGEMENT_WEIGHTS.clicks + ENGAGEMENT_WEIGHTS.likes + ENGAGEMENT_WEIGHTS.comments)) {
  throw new Error("a lone project should normalize every metric to 1.0 and sum to the total weight");
}
if (!approx(scores[0].score, 1)) {
  throw new Error("the four weights should sum to 1.0");
}
