import { NextResponse } from "next/server";
import { recordAbuseFlags, scanForAbuse } from "@/lib/abuse";
import { runNightlySignalScoring } from "@/lib/signal-scores";

// No in-framework scheduler exists in this Next.js version — this is meant
// to be hit nightly by an external trigger (a scheduled CI job, a host's
// cron product, or a campus cron box) with the shared secret below.
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scores = await runNightlySignalScoring();

  const abuse = await scanForAbuse();
  await recordAbuseFlags(abuse);

  return NextResponse.json({ scored: scores.length, abuseFlags: abuse.length });
}
