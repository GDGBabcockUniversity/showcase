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
    router.push(qs ? `/feed?${qs}` : "/feed");
  }

  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted">Department</span>
      <select
        value={current ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-full border border-border bg-bg px-4 py-2 text-sm text-fg outline-none transition-colors hover:border-blue/50"
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
