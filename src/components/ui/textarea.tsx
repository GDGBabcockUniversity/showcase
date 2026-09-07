import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full resize-y rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg outline-none transition-colors",
        "placeholder:text-muted focus-visible:border-blue disabled:cursor-not-allowed disabled:opacity-60",
        "aria-invalid:border-red",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
