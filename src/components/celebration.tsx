"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const GDG = [
  "var(--color-blue)",
  "var(--color-red)",
  "var(--color-yellow)",
  "var(--color-green)",
] as const;

type Piece = {
  color: string;
  left: number;
  delay: number;
  duration: number;
  drift: string;
  spin: string;
  size: number;
  rest: string;
  round: boolean;
};

const r = (min: number, max: number) => min + Math.random() * (max - min);

// Generated after mount: Math.random() during render would differ between
// server and client and break hydration.
function makePieces(): Piece[] {
  return Array.from({ length: 60 }, () => {
    const duration = r(4, 11);
    return {
      color: GDG[Math.floor(Math.random() * GDG.length)],
      left: r(0, 100),
      // Negative delay: pieces are already mid-fall on arrival, no empty start.
      delay: -r(0, duration),
      duration,
      drift: `${r(-20, 20)}vw`,
      spin: `${r(-1080, 1080)}deg`,
      size: r(6, 13),
      rest: `${r(5, 85)}vh`,
      round: Math.random() < 0.35,
    };
  });
}

export function Confetti() {
  const [pieces, setPieces] = useState<Piece[]>([]);
  useEffect(() => setPieces(makePieces()), []);

  return (
    // Fixed rather than absolute: the fall spans the viewport instead of being
    // clipped to main's box, which on a short page cut it off almost at once.
    // -z-10 keeps it behind the content, inside main's isolated stacking context.
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {pieces.map((p, i) => (
        <span
          key={i}
          data-slot="confetti-piece"
          className={cn("absolute top-0 block", p.round ? "rounded-full" : "rounded-[2px]")}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 1.6,
            background: p.color,
            // Consumed by the confetti-fall keyframes / the reduced-motion rule.
            "--drift": p.drift,
            "--spin": p.spin,
            "--rest": p.rest,
            animation: `confetti-fall ${p.duration}s linear ${p.delay}s infinite`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// The four Google colours as soft blobs, drifting slowly behind the content.
export function GdgBackdrop() {
  const blobs = [
    { color: "var(--color-blue)", className: "-left-24 top-0 h-80 w-80", delay: "0s" },
    { color: "var(--color-red)", className: "right-0 top-10 h-72 w-72", delay: "-4s" },
    { color: "var(--color-yellow)", className: "left-1/3 top-40 h-96 w-96", delay: "-8s" },
    { color: "var(--color-green)", className: "-right-16 top-64 h-80 w-80", delay: "-12s" },
  ];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {blobs.map((b) => (
        <span
          key={b.color}
          className={cn("absolute rounded-full blur-[90px] opacity-[0.22]", b.className)}
          style={{
            background: b.color,
            animation: `gdg-drift 18s ease-in-out ${b.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}
