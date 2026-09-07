"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LuX } from "react-icons/lu";
import { searchUsers, type CollaboratorOption } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Typeahead, so this is short on purpose — unlike the feed search box, which
// waits 3s because each keystroke there costs a full page navigation.
const DEBOUNCE_MS = 250;

export function CollaboratorPicker({
  name,
  max,
  labelledBy,
  initial = [],
}: {
  name: string;
  max: number;
  labelledBy: string;
  // Pre-selected people, so the edit form starts from what's already saved.
  initial?: CollaboratorOption[];
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<CollaboratorOption[]>([]);
  const [picked, setPicked] = useState<CollaboratorOption[]>(initial);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // Close when focus or a click lands outside the picker.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function onQueryChange(value: string) {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);

    if (value.trim().length < 2) {
      setOptions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    timer.current = setTimeout(async () => {
      // Ignore results that come back after a newer keystroke.
      const ticket = ++seq.current;
      const found = await searchUsers(value);
      if (ticket !== seq.current) return;
      setOptions(found);
      setOpen(true);
      setLoading(false);
    }, DEBOUNCE_MS);
  }

  function add(option: CollaboratorOption) {
    if (picked.length >= max || picked.some((p) => p.id === option.id)) return;
    setPicked([...picked, option]);
    setQuery("");
    setOptions([]);
    setOpen(false);
  }

  function remove(id: string) {
    setPicked(picked.filter((p) => p.id !== id));
  }

  const available = options.filter((o) => !picked.some((p) => p.id === o.id));
  const full = picked.length >= max;

  return (
    <div ref={box} className="relative mt-2">
      {/* the form reads these, not the visible text input */}
      {picked.map((p) => (
        <input key={p.id} type="hidden" name={name} value={p.id} />
      ))}

      {picked.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2">
          {picked.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2 rounded-full border border-border bg-bg px-3 py-1 text-sm"
            >
              {p.name}
              <Button
                type="button"
                variant="ghost"
                size="none"
                onClick={() => remove(p.id)}
                aria-label={`Remove ${p.name}`}
                className="text-muted hover:bg-transparent hover:text-red"
              >
                <LuX size={12} aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-labelledby={labelledBy}
        autoComplete="off"
        value={query}
        disabled={full}
        onChange={(e) => onQueryChange(e.target.value)}
        onFocus={() => available.length > 0 && setOpen(true)}
        placeholder={full ? `${max} collaborators added` : "Search by name…"}
      />

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-surface py-1 shadow-lg"
        >
          {available.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">No one found.</li>
          ) : (
            available.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => add(o)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-bg"
                >
                  <span className="truncate">{o.name}</span>
                  {o.department && (
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted">
                      {o.department}
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted">
        {loading ? "Searching…" : `Up to ${max} · pick from registered users`}
      </p>
    </div>
  );
}
