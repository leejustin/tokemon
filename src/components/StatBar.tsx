interface Props {
  label: string;
  value: number;
  max?: number;
  meaning?: string;
  /** color hex for the bar fill */
  accent?: string;
}

export function StatBar({ label, value, max = 150, meaning, accent = "#22c55e" }: Props) {
  const pct = Math.min(100, Math.max(2, (value / max) * 100));

  return (
    <div className="grid grid-cols-12 items-center gap-3 py-1">
      <div className="col-span-3 text-[11px] font-medium uppercase tracking-wider text-ink-400">
        {label}
      </div>
      <div className="col-span-1 text-right text-xs font-mono font-semibold text-white tabular-nums">
        {value}
      </div>
      <div className="col-span-8">
        <div className="relative h-2 rounded-full bg-white/[0.04] overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
            style={{
              width: `${pct}%`,
              background: accent,
            }}
          />
        </div>
        {meaning && (
          <div className="mt-0.5 text-[10px] text-ink-500">{meaning}</div>
        )}
      </div>
    </div>
  );
}
