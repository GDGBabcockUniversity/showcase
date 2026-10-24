export type UploadKind = "projectCover" | "projectMedia" | "avatar";

export type UploadedFile = {
  // The public URL the file lives at from now on — this is what callers store.
  publicUrl: string;
  // The file's own MIME type, so callers can tell a clip from a still.
  type: string;
};

type UploadProgress = (sent: number, total: number) => void;

// Asks the server for presigned PUT URLs, then sends each file's bytes
// straight to object storage. The app server never sees the payload — same
// shape as the old UploadThing flow, and it keeps uploads off the 8mb
// server-action body limit.

export async function uploadFiles(
  kind: UploadKind,
  files: File[],
  onProgress?: UploadProgress,
): Promise<UploadedFile[]> {
  const res = await fetch("/api/uploads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      kind,
      files: files.map(({ name, type, size }) => ({ name, type, size })),
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.uploads) {
    throw new Error(data?.error ?? "Upload failed.");
  }

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  let sent = 0;
  const results: UploadedFile[] = [];
  for (let i = 0; i < data.uploads.length; i++) {
    const { url, publicUrl, contentType } = data.uploads[i];
    await putFile(url, files[i], contentType, (fileSent) =>
      onProgress?.(sent + fileSent, totalBytes),
    );
    sent += files[i].size;
    results.push({ publicUrl, type: files[i].type });
  }
  return results;
}

// fetch can't report upload progress, so the PUT goes through XHR.
function putFile(
  url: string,
  file: File,
  contentType: string,
  onProgress: (sent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    // The presigned URL signed this exact value; sending it is part of the
    // signature check.
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(putErrorMessage(xhr.status)));
    };
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection."));
    xhr.send(file);
  });
}

function putErrorMessage(status: number): string {
  switch (status) {
    case 403:
      // Signature mismatch — usually the presign window lapsed mid-upload.
      return "Upload expired — try that file again.";
    case 413:
      return "That file is too large.";
    default:
      return "Upload failed.";
  }
}
