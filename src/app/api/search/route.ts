import { NextResponse } from "next/server";
import { searchPeople, searchProjectHits } from "@/lib/projects";

// Both halves of the palette in one round trip. Splitting them would mean two
// requests racing per keystroke, and the slower one deciding when the results
// stop looking half-drawn.
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("q") ?? "";
  // Anything past this is a paste, not a search. Capping it keeps a pathological
  // string out of two ILIKEs rather than relying on the database to shrug it off.
  const query = raw.trim().slice(0, 80);

  if (!query) return NextResponse.json({ people: [], projects: [] });

  const [people, projects] = await Promise.all([
    searchPeople(query),
    searchProjectHits(query),
  ]);

  return NextResponse.json({ people, projects });
}
