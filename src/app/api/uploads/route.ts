import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth";
import { MAX_EXTRA_MEDIA } from "@/lib/limits";
import { s3Client, storageBucket } from "@/lib/s3";

const MB = 1024 * 1024;

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

// Size and count are enforced here as well as in the submit action — the client
// can call these endpoints directly, so the limits have to live on the route.
// Videos get a bigger cap than stills; even a short screen recording dwarfs a
// screenshot.
const KINDS = {
  projectCover: {
    types: IMAGE_TYPES,
    maxBytes: () => 4 * MB,
    maxCount: 1,
  },
  avatar: {
    types: IMAGE_TYPES,
    maxBytes: () => 2 * MB,
    maxCount: 1,
  },
  projectMedia: {
    types: [...IMAGE_TYPES, ...VIDEO_TYPES],
    maxBytes: (type: string) => (type.startsWith("video/") ? 32 * MB : 4 * MB),
    maxCount: MAX_EXTRA_MEDIA,
  },
} as const;

type UploadKind = keyof typeof KINDS;

// Keys get the extension for their content type, so a fetched object renders
// with the right type. The #video fragment the client appends still decides
// still vs. clip at render time — the extension alone wouldn't.
const EXT_BY_TYPE: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

// Issues presigned PUT URLs so each file's bytes travel straight from the
// browser to object storage. The server never receives the payload, which
// keeps 32MB videos off the server-action body limit entirely.

type UploadRequest = {
  kind: UploadKind;
  files: { name: string; type: string; size: number }[];
};

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  // Rejects before a byte is stored anywhere, same as the old UploadThing
  // middleware did.
  if (!session) return NextResponse.json({ error: "Sign in to upload." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as UploadRequest | null;
  if (!body || !Array.isArray(body.files) || body.files.length === 0) {
    return NextResponse.json({ error: "No files to upload." }, { status: 400 });
  }
  const files = body.files;
  const kind = KINDS[body.kind];
  if (!kind) return NextResponse.json({ error: "Unknown upload kind." }, { status: 400 });
  if (files.length > kind.maxCount) {
    return NextResponse.json(
      { error: `Up to ${kind.maxCount} file${kind.maxCount === 1 ? "" : "s"} at a time.` },
      { status: 400 },
    );
  }
  for (const file of files) {
    const name = typeof file.name === "string" && file.name ? file.name : "That file";
    if (!kind.types.includes(file.type)) {
      return NextResponse.json({ error: `${name}: that file type isn't allowed.` }, { status: 400 });
    }
    if (typeof file.size !== "number" || !Number.isFinite(file.size) || file.size <= 0) {
      return NextResponse.json({ error: `${name}: missing file size.` }, { status: 400 });
    }
    if (file.size > kind.maxBytes(file.type)) {
      return NextResponse.json({ error: `${name} is too large.` }, { status: 400 });
    }
  }

  const bucket = storageBucket();
  if (!bucket || !process.env.AWS_ENDPOINT_URL_S3) {
    return NextResponse.json({ error: "Storage is not configured." }, { status: 503 });
  }

  const uploads = await Promise.all(
    files.map(async (file) => {
      // Filed under the user's id so a stray object can be traced to its
      // uploader later; the random part keeps collisions impossible.
      const key = `${body.kind}/${session.user.id}/${randomUUID()}${EXT_BY_TYPE[file.type] ?? ""}`;
      const url = await getSignedUrl(
        s3Client(),
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          ContentType: file.type,
        }),
        {
          expiresIn: 15 * 60,
          // Sign content-type and nothing else: the client sends exactly that
          // value. Signing length or host invites signature mismatches from
          // browsers that set their own.
          signableHeaders: new Set(["content-type"]),
        },
      );
      // Path-style is the only addressing Neon supports, so the public URL is
      // the endpoint, the bucket and the key concatenated. This is the value
      // that gets stored in the db.
      const endpoint = process.env.AWS_ENDPOINT_URL_S3!.replace(/\/+$/, "");
      return {
        key,
        url, // presigned PUT target
        publicUrl: `${endpoint}/${bucket}/${key}`, // public read URL
        contentType: file.type,
      };
    }),
  );

  return NextResponse.json({ uploads });
}
