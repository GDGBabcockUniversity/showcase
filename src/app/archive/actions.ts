"use server";

import { getArchivedProjectsPage, type ArchivePage } from "@/lib/projects";

export async function loadMoreArchive(cursor: string): Promise<ArchivePage> {
  return getArchivedProjectsPage(cursor);
}
