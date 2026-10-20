"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DEPARTMENTS } from "@/lib/departments";

export function DepartmentSelect({
  current,
}: {
  current?: (typeof DEPARTMENTS)[number];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("dept", value);
    else params.delete("dept");
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <label className="flex w-full min-w-0 items-center gap-2 text-sm text-muted sm:w-auto">
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted">Department</span>
      <select
        value={current ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 rounded-full border border-border bg-bg px-4 py-2 text-sm text-fg outline-none transition-colors hover:border-blue/50 sm:max-w-xs"
      >
        <option value="">All departments</option>
        {DEPARTMENTS.map((department) => (
          <option key={department} value={department}>
            {department}
          </option>
        ))}
      </select>
    </label>
  );
}
