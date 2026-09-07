"use client";

import { LuMoon, LuSun } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { THEME_COOKIE } from "@/lib/theme";
import { THEME_CHANGE_EVENT, useLightTheme } from "@/lib/use-theme";

export function ThemeToggle({ initialLight }: { initialLight: boolean }) {
  const light = useLightTheme(initialLight);

  function toggle() {
    const next = document.documentElement.classList.toggle("light");
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
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
