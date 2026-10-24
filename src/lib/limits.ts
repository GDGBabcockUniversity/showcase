// Shared so the input caps, the server validation and the column widths can't
// drift apart. Changing a max here means a matching `npm run db:push`.
export const TITLE_MIN = 2;
export const TITLE_MAX = 80;
export const SUMMARY_MIN = 20;
export const SUMMARY_MAX = 240;
export const BIO_MAX = 200;
export const MAX_COLLABORATORS = 5;
export const MAX_EXTRA_MEDIA = 4;

// Only URLs on the app's own storage hosts are accepted for covers and media,
// so a crafted form can't point them at somewhere arbitrary. UploadThing's
// hosts stay on the list: rows written before the Neon migration still carry
// those URLs and have to keep validating when their project is edited.
//
// Neon's S3 endpoint is branch-specific
// (https://<branch-slug>.storage.c-<n>.<region>.aws.neon.tech/<bucket>/<key>),
// so the host is matched by shape rather than pinned to one branch.
const UPLOAD_HOSTS =
  /^https:\/\/[a-z0-9-]+\.ufs\.sh\/|^https:\/\/utfs\.io\/|^https:\/\/[a-z0-9-]+\.storage\.c-\d+\.[a-z]{2}(?:-[a-z]+)+-\d+\.aws\.neon\.tech\//;

export function isUploadUrl(value: string) {
  return UPLOAD_HOSTS.test(value);
}

// The uploader tags videos with a fragment when it stores the URL, so the
// stored URL alone knows whether to render a still or a clip. Fragments never
// reach the server, so the file still fetches normally.
export const VIDEO_MARK = "#video";
export const MEDIA_ACCEPT =
  "image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime";

export function isVideoUrl(url: string) {
  return url.endsWith(VIDEO_MARK);
}
