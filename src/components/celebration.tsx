import { cn } from "@/lib/utils";

const GDG = [
  "var(--color-blue)",
  "var(--color-red)",
  "var(--color-yellow)",
  "var(--color-green)",
] as const;

// Deterministic on purpose: Math.random() here would render different pieces
// on the server and the client and blow up hydration. A cheap hash of the
// index gives the same scatter every time.
function scatter(i: number, spread: number, offset = 0) {
  return ((i * 9301 + 49297 + offset) % 233280) / 233280 * spread;
}

const PIECES = Array.from({ length: 40 }, (_, i) => ({
  color: GDG[i % GDG.length],
  left: scatter(i, 100),
  // Short delays: a 6s stagger meant the page looked empty on arrival.
  delay: scatter(i, 2.5, 17),
  duration: 5 + scatter(i, 5, 91),
  drift: `${scatter(i, 24, 53) - 12}vw`,
  size: 6 + scatter(i, 6, 31),
  // Where the piece sits when motion is off — see globals.css.
  rest: `${5 + scatter(i, 80, 7)}vh`,
  round: i % 3 === 0,
}));

export function Confetti() {
  return (
    // Fixed rather than absolute: the fall spans the viewport instead of being
    // clipped to main's box, which on a short page cut it off almost at once.
    // -z-10 keeps it behind the content, inside main's isolated stacking context.
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {PIECES.map((p, i) => (
        <span
          key={i}
          data-slot="confetti-piece"
          className={cn("absolute top-0 block", p.round ? "rounded-full" : "rounded-[2px]")}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 1.6,
            background: p.color,
            // Both consumed by the confetti-fall keyframes / the reduced-motion rule.
            "--drift": p.drift,
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
