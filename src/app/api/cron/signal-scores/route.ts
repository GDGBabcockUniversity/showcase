import { NextResponse } from "next/server";
import { recordAbuseFlags, scanForAbuse } from "@/lib/abuse";
import { runNightlySignalScoring } from "@/lib/signal-scores";

// Vercel Cron invokes this via GET and auto-attaches this header when
// CRON_SECRET is set as a project env var.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scores = await runNightlySignalScoring();

  const abuse = await scanForAbuse();
  await recordAbuseFlags(abuse);

  return NextResponse.json({ scored: scores.length, abuseFlags: abuse.length });
}
