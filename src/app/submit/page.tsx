import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Dots } from "@/components/dots";
import { DEPARTMENTS, PROJECT_TYPES } from "@/lib/departments";
import { auth } from "@/lib/auth";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { project, user } from "@/db/schema";
import {
  MAX_COLLABORATORS,
  MAX_EXTRA_MEDIA,
  SUMMARY_MAX,
  SUMMARY_MIN,
  TITLE_MAX,
  TITLE_MIN,
} from "@/lib/limits";
import { SubmitForm, type SubmitState } from "./submit-form";

export const metadata: Metadata = {
  title: "Submit — GDG Babcock Showcase",
  description: "Put your project on the board. Every submission is reviewed.",
};

// Only accept URLs on UploadThing's own hosts, so a crafted form can't point
// the cover at somewhere arbitrary.
const UPLOAD_HOSTS = /^https:\/\/[a-z0-9-]+\.ufs\.sh\/|^https:\/\/utfs\.io\//;

function isUploadUrl(value: string) {
  return UPLOAD_HOSTS.test(value);
}

async function submitProject(_: SubmitState, formData: FormData): Promise<SubmitState> {
  "use server";

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/?authModal=1&redirect=/submit");
  }

  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const department = String(formData.get("department") ?? "");
  const type = String(formData.get("type") ?? "");
  const url = String(formData.get("url") ?? "").trim();
  // The picker submits user ids, one hidden input each.
  const collaboratorIds = [
    ...new Set(
      formData.getAll("collaborators").map((v) => String(v)).filter(Boolean),
    ),
  ].filter((id) => id !== session.user.id);
  // UploadThing URLs, posted by the drop zones — the bytes never touch this action.
  const cover = String(formData.get("cover") ?? "").trim();
  const media = formData.getAll("media").map(String).filter(Boolean);

  const errors: SubmitState["errors"] = {};
  if (title.length < TITLE_MIN) errors.title = "Give it a real name.";
  if (title.length > TITLE_MAX) errors.title = `Under ${TITLE_MAX} characters.`;
  if (summary.length < SUMMARY_MIN)
    errors.summary = `One full sentence, at least ${SUMMARY_MIN} characters.`;
  if (summary.length > SUMMARY_MAX) errors.summary = `Under ${SUMMARY_MAX} characters.`;
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

  // Never trust ids straight off the form — resolve them against real accounts.
  // The names that come back are what the receipt shows.
  let collaborators: { id: string; name: string }[] = [];
  if (collaboratorIds.length > MAX_COLLABORATORS) {
    errors.collaborators = `Up to ${MAX_COLLABORATORS} collaborators.`;
  } else if (collaboratorIds.length > 0) {
    collaborators = await db
      .select({ id: user.id, name: user.name })
      .from(user)
      .where(inArray(user.id, collaboratorIds));
    if (collaborators.length !== collaboratorIds.length) {
      errors.collaborators = "One of those accounts no longer exists.";
    }
  }

  // Size and MIME are enforced by the upload route; here we only check that
  // what came back is a URL we actually issued.
  if (!cover) {
    errors.cover = "Cover image is required.";
  } else if (!isUploadUrl(cover)) {
    errors.cover = "That cover didn't upload properly — try again.";
  }

  if (media.length > MAX_EXTRA_MEDIA) {
    errors.media = `Up to ${MAX_EXTRA_MEDIA} extra images.`;
  } else if (media.some((u) => !isUploadUrl(u))) {
    errors.media = "One of those images didn't upload properly — try again.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, message: "Fix the highlighted fields." };
  }

  await db.insert(project).values({
    id: randomUUID(),
    userId: session.user.id,
    title,
    summary,
    department,
    type,
    url: url || "",
    collaborators: collaborators.map((c) => c.id),
    cover,
    media,
  });

  return {
    ok: true,
    receipt: {
      title,
      department,
      collaborators: collaborators.map((c) => c.name),
      media: 1 + media.length,
    },
  };
}

export default function SubmitPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:py-14">
        <p className="eyebrow flex items-center gap-3 border-b border-border pb-6">
          <Dots />
          Submit a project
        </p>

        <div className="mt-8">
          <SubmitForm action={submitProject} />
        </div>
      </main>
      <Footer />
    </>
  );
}
