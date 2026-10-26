import { S3Client } from "@aws-sdk/client-s3";

// The S3 client for Neon Object Storage. Neon serves path-style requests only
// and signs with SigV4 — both covered by forcePathStyle and the plain SDK.
// The endpoint is branch-specific, so it comes from the environment rather
// than being hard-coded here.
//
// Built lazily so importing this module (and everything that pulls in the
// upload route) doesn't throw while the vars are unset.

let client: S3Client | null = null;

export function s3Client(): S3Client {
  if (client) return client;
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Neon Object Storage env vars are missing (AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY).",
    );
  }
  client = new S3Client({
    region: process.env.AWS_REGION ?? "us-east-2",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
  return client;
}

export function storageBucket(): string | undefined {
  return process.env.S3_BUCKET;
}
