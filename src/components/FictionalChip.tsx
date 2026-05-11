interface Props {
  /** Smaller, denser variant for card grids. */
  compact?: boolean;
  /** Optional override for the hover tooltip. */
  note?: string;
}

const DEFAULT_NOTE =
  "Fan-invented creature. Not a real, announced, or shipped product. " +
  "Stats are pure satirical fiction.";

/**
 * A tiny red "⚠ FICTIONAL" pill that we render next to the name of any
 * model with `fictional: true`. Hover/long-press shows the disclaimer note.
 *
 * Used in three places:
 *   1. `ModelCard` (grid)
 *   2. `DexDetail` (the big detail page hero)
 *   3. `RedeemPanel` (vault slots)
 */
export function FictionalChip({ compact, note }: Props) {
  return (
    <span
      role="note"
      title={note ?? DEFAULT_NOTE}
      className={`inline-flex items-center gap-1 rounded font-mono uppercase ring-1 ring-inset ${
        compact
          ? "text-[8px] tracking-[0.18em] px-1 py-[1px]"
          : "text-[9px] sm:text-[10px] tracking-[0.25em] px-1.5 py-0.5"
      }`}
      style={{
        background: "rgba(220,38,38,0.16)",
        color: "#fca5a5",
        boxShadow: "inset 0 0 0 1px rgba(220,38,38,0.35)",
      }}
    >
      <span aria-hidden>⚠</span>
      <span>Fictional</span>
    </span>
  );
}
