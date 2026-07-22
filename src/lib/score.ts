import type { RubricScores } from "@/components/dots";

export const RUBRIC_WEIGHTS = {
  originality: 0.35,
  polish: 0.2,
  utility: 0.3,
  completeness: 0.15,
} as const;

export function weightedScore(scores: RubricScores) {
  return (
    scores.originality * RUBRIC_WEIGHTS.originality +
    scores.polish * RUBRIC_WEIGHTS.polish +
    scores.utility * RUBRIC_WEIGHTS.utility +
    scores.completeness * RUBRIC_WEIGHTS.completeness
  );
}
