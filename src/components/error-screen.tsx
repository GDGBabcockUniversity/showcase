// Shared by 404, route errors and the global error page, so all three read as
// one family. Plain markup only: it has to render inside error boundaries.
const BARS = [
  { fill: "#4285F4", h: 60 },
  { fill: "#EA4335", h: 60 },
  { fill: "#FBBC04", h: 60 },
  { fill: "#34A853", h: 60 },
];

export function ErrorScreen({
  code,
  title,
  message,
  missingBar,
  children,
}: {
  code: string;
  title: string;
  message: string;
  /** Index of the logo bar to drop, to show that something is missing. */
  missingBar?: number;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 py-16 text-center sm:py-24">
      <svg viewBox="0 0 100 100" width="88" height="88" aria-hidden="true" overflow="visible">
        <g transform="skewY(-24) translate(0 29)">
          {BARS.map((b, i) => (
            <rect
              key={i}
              x={8 + i * 23}
              y={14}
              width={18}
              height={b.h}
              rx={9}
              fill={b.fill}
              opacity={i === missingBar ? 0.15 : 1}
            />
          ))}
        </g>
      </svg>
      <p className="mt-8 font-mono text-sm tracking-widest text-muted">{code}</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
        {message}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>
    </main>
  );
}

export const primaryAction =
  "inline-flex h-11 items-center justify-center rounded-xl bg-blue px-5 text-sm font-medium text-white transition-opacity hover:opacity-90";
export const secondaryAction =
  "inline-flex h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-medium transition-colors hover:border-blue hover:text-blue";
