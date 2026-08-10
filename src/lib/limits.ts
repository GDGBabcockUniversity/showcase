// Shared so the input caps, the server validation and the column widths can't
// drift apart. Changing a max here means a matching `npm run db:push`.
export const TITLE_MIN = 2;
export const TITLE_MAX = 80;
export const SUMMARY_MIN = 20;
export const SUMMARY_MAX = 240;
export const MAX_COLLABORATORS = 5;
export const MAX_EXTRA_MEDIA = 4;
