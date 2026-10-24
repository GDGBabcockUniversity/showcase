"use client";

// Mirrors the auth-modal pattern: the trigger in the nav dispatches an event
// rather than importing the palette, so the dialog, the fetching and the
// result rendering stay out of the bundle for every page until someone
// actually opens it.
export const OPEN_SEARCH_EVENT = "open-search-palette";

export function openSearchPalette() {
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
}

/** What the palette renders for a person. Mirrors `Person` from lib/projects. */
export type PersonHit = {
  id: string;
  username: string | null;
  name: string;
  image: string | null;
  department: string | null;
  projects: number;
};

/** What the palette renders for a project. Mirrors `ProjectHit`. */
export type ProjectResult = {
  id: string;
  title: string;
  summary: string;
  cover: string | null;
  department: string;
  type: string;
};

export type SearchResults = {
  people: PersonHit[];
  projects: ProjectResult[];
};
