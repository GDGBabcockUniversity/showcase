"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { LuMenu, LuX } from "react-icons/lu";

export function MobileMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu when navigating
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  // Prevent background scrolling when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="flex items-center lg:hidden" ref={menuRef}>
      <button 
        type="button" 
        onClick={() => setOpen(!open)}
        className="p-2 -mr-2 text-muted hover:text-fg transition-colors outline-none relative z-50"
        aria-label="Toggle menu"
      >
        {open ? <LuX size={24} /> : <LuMenu size={24} />}
      </button>

      {open && (
        <div className="absolute left-0 top-[4.5rem] w-full bg-bg border-b border-border shadow-xl z-50 p-5 flex flex-col gap-6 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}
