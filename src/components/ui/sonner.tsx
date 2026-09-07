"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

import { useLightTheme } from "@/lib/use-theme";

// Follows the app's own theme: the cookie-set `light` class on <html>, which
// the toggle flips at runtime. Colours come from the app's CSS variables, so a
// toast matches whatever the rest of the page is wearing.
function Toaster({ initialLight, ...props }: ToasterProps & { initialLight: boolean }) {
  const light = useLightTheme(initialLight);

  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      theme={light ? "light" : "dark"}
      style={
        {
          "--normal-bg": "var(--color-panel)",
          "--normal-text": "var(--color-fg)",
          "--normal-border": "var(--color-border)",
          "--success-bg": "var(--color-panel)",
          "--success-text": "var(--color-green)",
          "--success-border": "var(--color-green)",
          "--error-bg": "var(--color-panel)",
          "--error-text": "var(--color-red)",
          "--error-border": "var(--color-red)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "!rounded-xl !font-sans !shadow-[0_18px_45px_rgba(0,0,0,0.25)]",
          description: "!text-muted",
          actionButton: "!bg-blue !text-white",
          cancelButton: "!bg-surface !text-muted",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
