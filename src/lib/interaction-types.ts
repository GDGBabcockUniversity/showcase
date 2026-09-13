export const INTERACTION_TYPES = ["view", "click", "like", "comment"] as const;

export type InteractionType = (typeof INTERACTION_TYPES)[number];

export type Interactions = {
  views: number;
  clicks: number;
  likes: number;
  comments: number;
};
