import { weightedScore } from "./score";

const sample = {
  originality: 10,
  polish: 8,
  utility: 9,
  completeness: 7,
};

if (weightedScore(sample) <= 0) {
  throw new Error("weightedScore should produce a positive score");
}
