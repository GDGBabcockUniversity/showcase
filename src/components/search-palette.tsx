"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { LuSearch, LuX } from "react-icons/lu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OPEN_SEARCH_EVENT, type SearchResults } from "@/lib/search-palette";

/**
 * Search the whole board from anywhere, with ⌘K.
 *
 * Mounted once in the root layout, so the shortcut works on every page
 * without each one having to know about it. The nav's trigger opens it by
 * dispatching an event rather than by importing it.
 *
 * Radix supplies the parts that are easy to get wrong and invisible when they
 * are: the focus trap, the Escape handler, `aria-modal`, and returning focus
 * to the trigger on close.
 */

// Long enough that a burst of typing is one request, short enough that
// results feel like a consequence of typing rather than of waiting.
const DEBOUNCE_MS = 180;

// Results are stored with the query they answer. That pairing is what lets
// "still searching" and "nothing matched" be derived rather than tracked:
// a loading flag kept in its own state has to be set from inside the effect
// that starts the request, and would go stale whenever a request is abandoned.
type Loaded = SearchResults & { query: string; failed?: boolean };

const EMPTY: Loaded = { query: "", people: [], projects: [] };

export function SearchPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [loaded, setLoaded] = React.useState<Loaded>(EMPTY);
  const [active, setActive] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);

  const trimmed = query.trim();

  // ⌘K anywhere, plus the nav trigger's event. Both land here.
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        // Chrome binds ⌘K to the address bar, so this has to be claimed.
        event.preventDefault();
        setOpen((wasOpen) => !wasOpen);
      }
    }
    function onRequest() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_SEARCH_EVENT, onRequest);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_SEARCH_EVENT, onRequest);
    };
  }, []);

  // Fetch, debounced, with the previous request abandoned rather than left to
  // land later and overwrite newer results — the classic way a palette ends up
  // showing matches for a prefix of what was typed.
  React.useEffect(() => {
    if (!trimmed) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(String(response.status));
        const body = (await response.json()) as SearchResults;
        setLoaded({ ...body, query: trimmed });
      } catch (error) {
        // An abort is the expected outcome of typing another character, not a
        // failure worth showing anyone.
        if ((error as Error)?.name === "AbortError") return;
        // Flagged rather than left as an empty result: a dropped request and
        // a board with nothing to show are different facts, and reporting the
        // first as the second tells the reader something untrue about the
        // board.
        setLoaded({ query: trimmed, people: [], projects: [], failed: true });
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  // Only show results that answer what is currently typed. Anything else is
  // the previous query's answer, which would flash the wrong rows mid-edit.
  const current = loaded.query === trimmed ? loaded : EMPTY;
  const settled = loaded.query === trimmed;

  // Section offsets into one flat list, so Down keeps going from the last
  // maker into the first project. Computed rather than counted up through the
  // JSX, which would mean mutating a variable while rendering.
  const peopleCount = current.people.length;
  const projectCount = current.projects.length;
  const total = peopleCount + projectCount;
  // The trailing "see all" row is only offered when there is a search to see
  // all of, and something to compare it against.
  const allIndex = total > 0 && trimmed ? total : -1;
  const rowCount = allIndex >= 0 ? total + 1 : total;

  const allHref = `/search?q=${encodeURIComponent(trimmed)}`;

  function hrefAt(index: number) {
    if (index === allIndex) return allHref;
    if (index < peopleCount) {
      const person = current.people[index];
      return `/u/${person.username ?? person.id}`;
    }
    return `/project/${current.projects[index - peopleCount].id}`;
  }

  // New results mean the old highlight points at something else, or nothing.
  // Adjusted during render rather than from an effect, which is both this
  // repo's convention and a cascading render avoided.
  const [highlightedFor, setHighlightedFor] = React.useState("");
  if (highlightedFor !== current.query) {
    setHighlightedFor(current.query);
    setActive(0);
  }

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (rowCount === 0) {
      // Nothing to pick, so Enter falls through to the full results page —
      // the palette never swallows the keystroke and does nothing.
      if (event.key === "Enter" && trimmed) {
        event.preventDefault();
        go(allHref);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % rowCount);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + rowCount) % rowCount);
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(hrefAt(Math.min(active, rowCount - 1)));
    }
  }

  // Keep the highlighted row on screen when the keyboard is driving.
  React.useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-row="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  // A fresh open is a fresh search: leaving the last query in place means
  // reopening shows results for something already finished with.
  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setLoaded(EMPTY);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-slot="dialog-overlay"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        />
        <DialogPrimitive.Content
          data-slot="dialog-content"
          // Pinned near the top rather than centred: the box grows downward as
          // results arrive, and a vertically centred panel would slide under
          // the reader's eye every time the count changed.
          className="fixed left-1/2 top-[8vh] z-50 flex max-h-[80vh] w-[calc(100%-2rem)] max-w-[34rem] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-panel text-fg shadow-2xl outline-none"
        >
          <DialogPrimitive.Title className="sr-only">
            Search projects and people
          </DialogPrimitive.Title>

          <div className="flex items-center gap-3 border-b border-border px-4">
            <LuSearch size={18} aria-hidden className="shrink-0 text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Search projects, topics & people…"
              aria-label="Search projects and people"
              className="w-full bg-transparent py-4 text-base text-fg outline-none placeholder:text-muted"
            />
          </div>

          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-3">
            {!trimmed && (
              <Notice>
                Type a keyword, topic, or maker&apos;s name to search the board.
              </Notice>
            )}

            {trimmed && !settled && <Notice>Searching…</Notice>}

            {trimmed && settled && total === 0 && (
              <Notice>
                {current.failed
                  ? "Couldn’t reach search just now — try again."
                  : `Nothing matched “${trimmed}”.`}
              </Notice>
            )}

            {peopleCount > 0 && (
              <>
                <SectionLabel>Makers ({peopleCount})</SectionLabel>
                <div className="mt-2 flex flex-col gap-1.5">
                  {current.people.map((person, i) => (
                    <ResultRow
                      key={person.id}
                      index={i}
                      active={active === i}
                      onHover={setActive}
                      onPick={() => go(hrefAt(i))}
                    >
                      <Avatar className="size-10 shrink-0 border border-border">
                        {person.image && (
                          <AvatarImage src={person.image} alt="" />
                        )}
                        <AvatarFallback className="font-display text-sm font-semibold">
                          {person.name[0]?.toUpperCase() ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {person.name}
                        </span>
                        <span className="block truncate font-mono text-[10px] uppercase tracking-wider text-muted">
                          {person.department ?? "Unfiled"} · {person.projects}{" "}
                          project{person.projects === 1 ? "" : "s"}
                        </span>
                      </span>
                    </ResultRow>
                  ))}
                </div>
              </>
            )}

            {projectCount > 0 && (
              <>
                <SectionLabel className={peopleCount > 0 ? "mt-5" : undefined}>
                  Projects ({projectCount})
                </SectionLabel>
                <div className="mt-2 flex flex-col gap-1.5">
                  {current.projects.map((project, i) => {
                    const at = peopleCount + i;
                    return (
                      <ResultRow
                        key={project.id}
                        index={at}
                        active={active === at}
                        onHover={setActive}
                        onPick={() => go(hrefAt(at))}
                      >
                        {project.cover && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={project.cover}
                            alt=""
                            className="h-12 w-16 shrink-0 rounded-md border border-border object-cover"
                          />
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">
                            {project.title}
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted">
                            {project.summary}
                          </span>
                        </span>
                      </ResultRow>
                    );
                  })}
                </div>
              </>
            )}

            {allIndex >= 0 && (
              <ResultRow
                index={allIndex}
                active={active === allIndex}
                onHover={setActive}
                onPick={() => go(allHref)}
                className="mt-3 justify-center"
              >
                <span className="text-xs font-medium text-blue">
                  See all results for “{trimmed}” →
                </span>
              </ResultRow>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3 text-muted">
            <span className="flex items-center gap-2 text-xs">
              Press <Key>Esc</Key> to close
            </span>
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-2 text-xs sm:flex">
                <Key>↑</Key>
                <Key>↓</Key>
                to navigate
              </span>
              <DialogPrimitive.Close
                aria-label="Close search"
                className="rounded-full p-1 outline-none transition-colors hover:text-fg focus-visible:text-fg"
              >
                <LuX size={16} aria-hidden />
              </DialogPrimitive.Close>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 py-10 text-center text-sm text-muted">{children}</p>
  );
}

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted ${className ?? ""}`}
    >
      {children}
    </p>
  );
}

/**
 * One selectable result.
 *
 * A button rather than a link, because the palette owns navigation: it has to
 * close itself on the way out, and the same row has to be reachable by the
 * arrow keys as by the pointer. Hovering moves the highlight so the mouse and
 * the keyboard never disagree about which row is selected.
 */
function ResultRow({
  index,
  active,
  onHover,
  onPick,
  className,
  children,
}: {
  index: number;
  active: boolean;
  onHover: (index: number) => void;
  onPick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-row={index}
      onMouseMove={() => onHover(index)}
      onClick={onPick}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left outline-none transition-colors ${
        active
          ? "border-blue/40 bg-surface-2"
          : "border-transparent hover:bg-surface"
      } ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted">
      {children}
    </kbd>
  );
}
