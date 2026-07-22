export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success";
}) {
  const className =
    tone === "success"
      ? "border-green/30 bg-green/10 text-green"
      : "border-border text-muted";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${className}`}
    >
      {label}
    </span>
  );
}
