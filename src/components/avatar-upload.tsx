"use client";

import { useState } from "react";
import { LuPencil } from "react-icons/lu";
import { toast } from "sonner";
import { updateAvatar } from "@/app/actions";
import { useSession } from "@/lib/auth-client";
import { uploadFiles } from "@/lib/uploads";

export function AvatarUpload({ name, image }: { name: string; image: string | null }) {
  // Shown straight after the upload so the new picture doesn't wait on a
  // revalidation round-trip.
  const [src, setSrc] = useState(image);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { refetch } = useSession();

  async function onPick(file: File) {
    setError(null);
    setIsUploading(true);
    try {
      const [uploaded] = await uploadFiles("avatar", [file]);
      const saved = await updateAvatar(uploaded.publicUrl);
      if (!saved.ok) {
        const message = saved.error ?? "Couldn't save that.";
        setError(message);
        toast.error(message);
        return;
      }
      setSrc(uploaded.publicUrl);
      setError(null);
      toast.success("Profile picture updated.");
      // The nav reads the avatar from better-auth's client session store.
      refetch();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed.";
      setError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <label
        htmlFor="avatar-file"
        className="group relative block h-16 w-16 shrink-0 cursor-pointer rounded-full"
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className="h-16 w-16 rounded-full border border-border object-cover"
          />
        ) : (
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full font-display text-2xl font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, var(--color-blue), var(--color-green))",
            }}
            aria-hidden
          >
            {name[0]}
          </span>
        )}

        {/* Pencil overlay on hover, and always while an upload is running.
            focus-within keeps it reachable from the keyboard. */}
        <span
          className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/55 text-white transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${
            isUploading ? "opacity-100" : "opacity-0"
          }`}
        >
          {isUploading ? (
            <span className="font-mono text-[9px] uppercase tracking-wider">…</span>
          ) : (
            <LuPencil size={16} aria-hidden />
          )}
        </span>

        <input
          id="avatar-file"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={isUploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            void onPick(file);
          }}
          className="sr-only"
        />
        <span className="sr-only">Change profile picture</span>
      </label>
      {error && <p className="mt-1 font-mono text-[11px] text-red">{error}</p>}
    </div>
  );
}
