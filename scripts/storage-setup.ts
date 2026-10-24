// One-time setup for Neon Object Storage:
//   bun scripts/storage-setup.ts
//
// Verifies the bucket exists on the configured endpoint and installs the CORS
// rules the browser needs to PUT uploads straight to storage and to fetch
// objects back. Run it again whenever the allowed origin changes (a new deploy
// URL, another local port).
//
// Reads .env / .env.local the way drizzle.config.ts does, so the same values
// the app uses are what gets tested here.
import { config } from "dotenv";
import { HeadBucketCommand, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import { s3Client, storageBucket } from "../src/lib/s3";

config({ path: ".env.local" });
config({ path: ".env" });

const bucket = storageBucket();
if (!bucket) {
  console.error("S3_BUCKET is not set. Add it to .env and re-run.");
  process.exit(1);
}

const client = s3Client();

try {
  await client.send(new HeadBucketCommand({ Bucket: bucket }));
} catch {
  console.error(
    `Bucket "${bucket}" was not found on the configured endpoint. Create it in the Neon console (Storage > create bucket) with public read access, then re-run.`,
  );
  process.exit(1);
}

// Origin(s) that may upload from and fetch to the browser. The app's own URL
// is the one that matters; local dev runs against BETTER_AUTH_URL too.
const origin = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
await client.send(
  new PutBucketCorsCommand({
    Bucket: bucket,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: [origin],
          // PUT carries the presigned upload; GET/HEAD serve the stored
          // objects back to <img>/<video> tags.
          AllowedMethods: ["PUT", "GET", "HEAD"],
          AllowedHeaders: ["content-type"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  }),
);

console.log(`CORS configured on "${bucket}" for ${origin}.`);
