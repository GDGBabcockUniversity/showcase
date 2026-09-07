import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg outline-none transition-colors",
        "placeholder:text-muted focus-visible:border-blue disabled:cursor-not-allowed disabled:opacity-60",
        "aria-invalid:border-red",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
