export type RubricScores = {
  originality: number;
  polish: number;
  utility: number;
  completeness: number;
};

const COLORS = [
  "var(--color-blue)",
  "var(--color-red)",
  "var(--color-yellow)",
  "var(--color-green)",
];

function clamp(value: number) {
  return Math.max(0, Math.min(10, value));
}

export function Dots() {
  return (
    <span className="inline-flex items-center gap-1.5" aria-hidden>
      {COLORS.map((color, index) => (
        <span
          key={index}
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: color }}
        />
      ))}
    </span>
  );
}

export function ScoreMeter({ scores }: { scores: RubricScores }) {
  const values = [
    scores.originality,
    scores.polish,
    scores.utility,
    scores.completeness,
  ];

  return (
    <span className="inline-flex items-end gap-2" aria-label="Rubric score meter">
      {values.map((value, index) => {
        const v = clamp(value);
        return (
          <span
            key={index}
            className="rounded-full transition-transform"
            style={{
              background: COLORS[index],
              height: `${8 + v * 1.2}px`,
              width: `${8 + v * 1.2}px`,
              opacity: 0.35 + v / 15,
            }}
          />
        );
      })}
    </span>
  );
}

export function PublishedStamp() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-green/30 bg-green/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-green">
      <span className="h-1.5 w-1.5 rounded-full bg-green" />
      Published
    </span>
  );
}
