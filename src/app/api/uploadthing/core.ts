import { headers } from "next/headers";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { MAX_EXTRA_MEDIA } from "@/lib/limits";

const f = createUploadthing();

// Size and count are enforced here as well as in the submit action — the client
// can call these endpoints directly, so the limits have to live on the route.
const IMAGE = { maxFileSize: "4MB", maxFileCount: 1 } as const;

async function requireUploader() {
  const session = await auth.api.getSession({ headers: await headers() });
  // Anything thrown here rejects the upload before a byte is stored.
  if (!session) throw new UploadThingError("Sign in to upload.");
  return { userId: session.user.id };
}

export const uploadRouter = {
  projectCover: f({ image: IMAGE })
    .middleware(requireUploader)
    .onUploadComplete(({ metadata, file }) => {
      // Returned to the client that started the upload.
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  projectMedia: f({ image: { ...IMAGE, maxFileCount: MAX_EXTRA_MEDIA } })
    .middleware(requireUploader)
    .onUploadComplete(({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
