"use client";

import { LuMoon, LuSun } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { THEME_COOKIE } from "@/lib/theme";
import { THEME_CHANGE_EVENT, useLightTheme } from "@/lib/use-theme";

export function ThemeToggle({ initialLight }: { initialLight: boolean }) {
  const light = useLightTheme(initialLight);

  function toggle() {
    const root = document.documentElement;
    // Components with transitions would fade while the rest snap; freeze them for the swap.
    root.classList.add("theme-switching");
    const next = root.classList.toggle("light");
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
    void root.offsetHeight; // flush styles while transitions are off
    requestAnimationFrame(() => root.classList.remove("theme-switching"));
    // A cookie, not localStorage, so the server can read it on the next request.
    document.cookie = `${THEME_COOKIE}=${next ? "light" : "dark"}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggle}
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      className="text-muted"
    >
      {light ? <LuMoon size={15} /> : <LuSun size={15} />}
    </Button>
  );
}
