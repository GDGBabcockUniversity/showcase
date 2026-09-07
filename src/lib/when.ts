import { differenceInCalendarDays, format, isToday, isYesterday } from "date-fns";

// Coarse buckets near the present, exact dates once "how long ago" stops being
// the useful part. Doubles as the feed's grouping key.
export function relativeDate(date: Date) {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";

  const days = differenceInCalendarDays(new Date(), date);
  if (days <= 7) return "Last week";
  if (days <= 31) return "Last month";
  return format(date, "d MMM yyyy");
}
