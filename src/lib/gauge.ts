export type Interactions = {
  views: number;
  clicks: number;
  likes: number;
  comments: number;
};

const HALF = { views: 400, clicks: 80, likes: 40, comments: 15 } as const;

export const ENGAGEMENT_WEIGHTS = {
  views: 0.2,
  clicks: 0.4,
  likes: 0.25,
  comments: 0.15,
} as const;

export const GAUGE_WEIGHTS = ENGAGEMENT_WEIGHTS;

function normalize(value: number, half: number) {
  if (value <= 0) return 0;
  return value / (value + half);
}

export function engagementScore(i: Interactions): number {
  return Number(
    (
      normalize(i.views, HALF.views) * ENGAGEMENT_WEIGHTS.views * 5 +
      normalize(i.clicks, HALF.clicks) * ENGAGEMENT_WEIGHTS.clicks * 20 +
      normalize(i.likes, HALF.likes) * ENGAGEMENT_WEIGHTS.likes * 16 +
      normalize(i.comments, HALF.comments) * ENGAGEMENT_WEIGHTS.comments * 12
    ).toFixed(2),
  );
}

export function projectGauge(project: Interactions) {
  const score = engagementScore(project);

  if (score >= 8.5) return "surging";
  if (score >= 6.5) return "strong";
  if (score >= 4.5) return "steady";
  return "early";
}
