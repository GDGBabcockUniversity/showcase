import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "block font-mono text-[10px] uppercase tracking-wider text-muted",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
