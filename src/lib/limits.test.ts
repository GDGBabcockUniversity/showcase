import { isUploadUrl } from "./limits";

// Rows written before the migration still carry UploadThing URLs and have to
// keep validating when their project is edited.
const accepted = [
  "https://utfs.io/f/test-cover",
  "https://abc123.ufs.sh/f/image-1",
  // Neon Object Storage public URLs (path-style: endpoint + bucket + key).
  "https://br-winter-pond-aptw82ef.storage.c-2.us-east-2.aws.neon.tech/showcase-media/projectCover/user-1/file.png",
  "https://some-branch.storage.c-4.eu-central-1.aws.neon.tech/bucket/a/video.mp4",
];

const rejected = [
  "http://utfs.io/f/not-https",
  "https://utfs.io.evil.com/f/spoof",
  "https://evil.com/f/x",
  // No branch slug before ".storage".
  "https://storage.c-2.us-east-2.aws.neon.tech/bucket/key",
  // No region between the compute id and ".aws".
  "https://br-x.storage.c-2.aws.neon.tech/bucket/key",
  "not a url",
];

for (const url of accepted) {
  if (!isUploadUrl(url)) throw new Error(`isUploadUrl should accept ${url}`);
}
for (const url of rejected) {
  if (isUploadUrl(url)) throw new Error(`isUploadUrl should reject ${url}`);
}
