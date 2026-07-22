import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Dots } from "@/components/dots";
import { DEPARTMENTS, PROJECT_TYPES } from "@/lib/departments";
import { SubmitForm, type SubmitState } from "./submit-form";

export const metadata: Metadata = {
  title: "Submit — GDG Babcock Showcase",
  description: "Put your project on the board. Every submission is reviewed.",
};

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const OK_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_EXTRA_MEDIA = 4;
const MAX_COLLABORATORS = 5;

async function submitProject(_: SubmitState, formData: FormData): Promise<SubmitState> {
  "use server";

  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const by = String(formData.get("by") ?? "").trim();
  const department = String(formData.get("department") ?? "");
  const type = String(formData.get("type") ?? "");
  const url = String(formData.get("url") ?? "").trim();
  const collaborators = String(formData.get("collaborators") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const cover = formData.get("cover");
  const media = formData.getAll("media").filter((f): f is File => f instanceof File && f.size > 0);

  const errors: SubmitState["errors"] = {};
  if (title.length < 2) errors.title = "Give it a real name.";
  if (title.length > 80) errors.title = "Under 80 characters.";
  if (summary.length < 20) errors.summary = "One full sentence, at least 20 characters.";
  if (summary.length > 240) errors.summary = "Under 240 characters.";
  if (by.length < 2) errors.by = "Who's shipping it?";
  if (!(DEPARTMENTS as readonly string[]).includes(department)) errors.department = "Pick a department.";
  if (!(PROJECT_TYPES as readonly string[]).includes(type)) errors.type = "Pick a type.";
  if (url) {
    try {
      const u = new URL(url);
      if (u.protocol !== "http:" && u.protocol !== "https:") errors.url = "http or https only.";
    } catch {
      errors.url = "Not a valid URL.";
    }
  }

  if (collaborators.length > MAX_COLLABORATORS) {
    errors.collaborators = `Up to ${MAX_COLLABORATORS} collaborators.`;
  } else if (collaborators.some((c) => c.length > 80)) {
    errors.collaborators = "Each name under 80 characters.";
  }

  if (!(cover instanceof File) || cover.size === 0) {
    errors.cover = "Cover image is required.";
  } else if (!OK_IMAGE_TYPES.has(cover.type)) {
    errors.cover = "PNG, JPG, or WEBP only.";
  } else if (cover.size > MAX_IMAGE_BYTES) {
    errors.cover = "Cover is over 4 MB.";
  }

  if (media.length > MAX_EXTRA_MEDIA) {
    errors.media = `Up to ${MAX_EXTRA_MEDIA} extra images.`;
  } else if (media.some((f) => !OK_IMAGE_TYPES.has(f.type))) {
    errors.media = "PNG, JPG, or WEBP only.";
  } else if (media.some((f) => f.size > MAX_IMAGE_BYTES)) {
    errors.media = "One of the images is over 4 MB.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: "Fix the highlighted fields." };
  }

  // ponytail: no persistence yet — files are validated then dropped. Wire cover/media to
  // object storage (S3 / R2 / Supabase Storage) and the rest to a DB when submissions stop
  // being sample data. Validation shape doesn't change when storage lands.
  console.log("[submit]", {
    title,
    summary,
    by,
    collaborators,
    department,
    type,
    url,
    cover: cover instanceof File ? { name: cover.name, size: cover.size } : null,
    media: media.map((f) => ({ name: f.name, size: f.size })),
  });

  return {
    ok: true,
    receipt: {
      title,
      by,
      department,
      collaborators,
      media: 1 + media.length,
    },
  };
}

export default function SubmitPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <section className="border-b border-border pb-8">
          <p className="eyebrow flex items-center gap-3">
            <Dots />
            Submit a project
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[0.95] tracking-tight sm:text-5xl">
            Put it on the board.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            One sentence, one link, one reviewer. Being published here means someone
            actually looked at what you shipped.
          </p>
        </section>

        <div className="mt-8">
          <SubmitForm action={submitProject} />
        </div>
      </main>
      <Footer />
    </>
  );
}
