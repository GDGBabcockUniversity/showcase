import { engagementScore, GAUGE_WEIGHTS, projectGauge } from "./gauge";

function approx(a: number, b: number, epsilon = 0.0001) {
  return Math.abs(a - b) < epsilon;
}

if (engagementScore({ views: 0, clicks: 0, likes: 0, comments: 0 }) !== 0) {
  throw new Error("zero interactions should score zero");
}

if (!approx(engagementScore({ views: 400, clicks: 0, likes: 0, comments: 0 }), 0.5)) {
  throw new Error("expected half saturation for views");
}

const low = engagementScore({ views: 100, clicks: 10, likes: 5, comments: 1 });
const high = engagementScore({ views: 100, clicks: 500, likes: 5, comments: 1 });

if (high <= low) {
  throw new Error("click weighting should materially change the score");
}

if (GAUGE_WEIGHTS.clicks <= GAUGE_WEIGHTS.views) {
  throw new Error("clicks should have higher weight than views");
}

if (
  !["early", "steady", "strong", "surging"].includes(
    projectGauge({ views: 100, clicks: 10, likes: 5, comments: 1 }),
  )
) {
  throw new Error("projectGauge should return a valid band");
}
