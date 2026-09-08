import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Variants mirror the shapes already used across the app: a blue pill for
// primary actions, a bordered pill, a quiet mono link, and a red one for
// anything destructive.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 outline-none",
  {
    variants: {
      variant: {
        default: "rounded-full bg-blue text-white hover:opacity-90",
        outline:
          "rounded-full border border-border text-fg hover:border-blue hover:text-blue",
        ghost: "rounded-full text-muted hover:bg-surface hover:text-fg",
        quiet:
          "font-mono text-[11px] uppercase tracking-wider text-muted hover:text-fg",
        destructive: "rounded-full bg-red text-white hover:opacity-90",
        "destructive-outline":
          "rounded-full border border-red/40 text-red hover:bg-red/10",
      },
      size: {
        default: "px-5 py-2 text-sm font-medium",
        lg: "px-5 py-2.5 text-sm font-medium",
        sm: "px-4 py-2 text-sm font-medium",
        icon: "h-8 w-8 rounded-full p-0",
        none: "",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
