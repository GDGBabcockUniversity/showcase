"use client";

import { useState } from "react";
import { LuCalendar } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// The value stays the same "YYYY-MM-DDTHH:mm" local string the plain
// datetime-local input produced, so the forms' ISO conversion is untouched.
function split(value: string) {
  const [date = "", time = ""] = value.split("T");
  return { date, time };
}

function toLocalDate(date: string) {
  if (!date) return undefined;
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function fromLocalDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const DEFAULT_TIME = "09:00";

export function DateTimePicker({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { date, time } = split(value);

  function setDate(picked: Date | undefined) {
    if (!picked) return onChange("");
    onChange(`${fromLocalDate(picked)}T${time || DEFAULT_TIME}`);
    setOpen(false);
  }

  function setTime(next: string) {
    // Picking a time before a date implies today.
    onChange(next ? `${date || fromLocalDate(new Date())}T${next}` : "");
  }

  const label = date
    ? toLocalDate(date)!.toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Pick a date";

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          id={id}
          type="button"
          className={`flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2 text-sm outline-none transition-colors hover:border-blue focus:border-blue ${
            date ? "text-fg" : "text-muted"
          }`}
        >
          <LuCalendar size={14} aria-hidden />
          {label}
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            mode="single"
            autoFocus
            selected={toLocalDate(date)}
            onSelect={setDate}
            // Yesterday is never a release date.
            disabled={{ before: new Date() }}
          />
        </PopoverContent>
      </Popover>

      <Input
        type="time"
        aria-label="Release time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="w-auto"
      />

      {value && (
        <Button
          type="button"
          variant="quiet"
          size="none"
          onClick={() => onChange("")}
          className="text-[10px] hover:text-red"
        >
          Clear
        </Button>
      )}
    </div>
  );
}
