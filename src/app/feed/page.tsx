import { redirect } from "next/navigation";

// The feed's board is now the home page — this just forwards old links
// (bookmarks, external references) to the same view at "/", query params
// and all, rather than breaking them.
export default async function FeedRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") params.set(key, value);
  }
  const qs = params.toString();
  redirect(qs ? `/?${qs}` : "/");
}
