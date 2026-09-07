"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

import { cn } from "@/lib/utils";

// react-day-picker ships unstyled here — every class below is this app's own
// palette rather than the library's default stylesheet.
function Calendar({
  className,
  classNames,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      data-slot="calendar"
      className={cn("text-sm", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "space-y-3",
        month_caption: "flex h-8 items-center justify-center",
        caption_label: "font-display text-sm font-semibold tracking-tight",
        nav: "flex items-center justify-between absolute inset-x-0 h-8",
        button_previous:
          "flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-fg disabled:opacity-40",
        button_next:
          "flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-fg disabled:opacity-40",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-8 font-mono text-[10px] uppercase tracking-wider text-muted",
        week: "mt-1 flex",
        day: "h-8 w-8 p-0",
        day_button:
          "h-8 w-8 rounded-lg text-sm transition-colors hover:bg-surface aria-selected:bg-blue aria-selected:text-white",
        today: "font-semibold text-blue",
        outside: "text-muted/50",
        disabled: "text-muted/40 line-through",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <LuChevronLeft size={16} aria-hidden />
          ) : (
            <LuChevronRight size={16} aria-hidden />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
