import {
  computeScores,
  cohortBounds,
  ENGAGEMENT_WEIGHTS,
  normalizeMetric,
  percentile,
  projectExposureEnd,
} from "./signal-scores";

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

// Small cohort (< 10) uses the median; larger cohorts use p90. Scores
// saturate smoothly instead of maxing out at the benchmark.
const small = normalizeMetric([1, 2, 3, 4]);
if (!approx(small[1], 0.5) || !approx(small[3], 4 / 6)) {
  throw new Error("small-cohort metrics should use value / (value + median)");
}

const large = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const normalizedLarge = normalizeMetric(large);
if (Math.max(...normalizedLarge) >= 1) {
  throw new Error("normalized values should approach but never reach 1.0");
}
if (normalizedLarge[11] <= normalizedLarge[8]) {
  throw new Error(
    "values above p90 should continue receiving diminishing credit",
  );
}

// An all-zero metric normalizes everyone to zero rather than dividing by zero.
if (normalizeMetric([0, 0, 0]).some((v) => v !== 0)) {
  throw new Error("an all-zero cohort should normalize to all zeros, not NaN");
}

// Weighted sum matches the four published weights.
const scores = computeScores("2026-01", [
  { projectId: "a", views: 100, clicks: 100, likes: 100, comments: 100 },
]);
if (!approx(scores[0].score, 0.5)) {
  throw new Error("a lone project should normalize each metric to 0.5");
}
if (
  !approx(
    Object.values(ENGAGEMENT_WEIGHTS).reduce((sum, weight) => sum + weight, 0),
    1,
  )
) {
  throw new Error("engagement weights should sum to 1.0");
}

const publishedAt = new Date("2026-01-01T00:00:00Z");
const januaryEnd = cohortBounds("2026-01").end;
if (
  projectExposureEnd(
    publishedAt,
    new Date("2026-01-04T00:00:00Z"),
  ).toISOString() !== "2026-01-04T00:00:00.000Z"
) {
  throw new Error(
    "active projects should have exposure through the current scoring time",
  );
}
if (
  projectExposureEnd(
    publishedAt,
    new Date("2026-02-20T00:00:00Z"),
  ).getTime() !== januaryEnd.getTime()
) {
  throw new Error("exposure should close at the end of the publication month");
}
