import type { AIModel } from "../data/types";
import { ModelEmblem } from "./ModelEmblem";

interface Props {
  models: AIModel[];
  onCompare: () => void;
  onBattle: () => void;
  onRemove: (id: number) => void;
  onClear: () => void;
  max?: number;
}

export function CompareDrawer({
  models,
  onCompare,
  onBattle,
  onRemove,
  onClear,
  max = 4,
}: Props) {
  if (models.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 px-4 pointer-events-none">
      <div
        className="mx-auto max-w-3xl pointer-events-auto animate-slide-up
          rounded-2xl border border-white/10
          bg-canvas-panel/95 backdrop-blur
          shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)]
          flex items-center gap-3 p-2 pl-4"
      >
        <div className="hidden sm:flex items-center gap-2 text-xs text-ink-400 shrink-0">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-pokered-500/15 text-pokered-300 font-bold">
            {models.length}
          </span>
          <span className="hidden md:inline">selected</span>
        </div>

        <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar min-w-0">
          {models.map((m) => (
            <div
              key={m.id}
              className="group relative shrink-0 rounded-lg p-1 hover:bg-white/[0.05] transition-colors"
              title={`${m.name} — ${m.lab}`}
            >
              <ModelEmblem model={m} size={44} />
              <button
                type="button"
                onClick={() => onRemove(m.id)}
                aria-label={`Remove ${m.name}`}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-canvas-base text-ink-300 ring-1 ring-white/15 text-[10px] leading-none hover:bg-pokered-500 hover:text-white"
              >
                ×
              </button>
            </div>
          ))}
          {models.length < max && (
            <div className="text-[10px] font-mono text-ink-500 px-2 hidden md:block">
              + add up to {max - models.length} more
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClear}
          className="hidden sm:inline text-xs text-ink-400 hover:text-white px-2 py-1.5"
        >
          Clear
        </button>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onCompare}
            disabled={models.length < 2}
            title="Side-by-side stats"
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition
              ${
                models.length < 2
                  ? "bg-white/[0.05] text-ink-500 cursor-not-allowed"
                  : "bg-white/[0.06] text-white hover:bg-white/[0.12]"
              }`}
          >
            <CompareIcon />
            <span className="hidden sm:inline">Compare</span>
          </button>
          <button
            type="button"
            onClick={onBattle}
            disabled={models.length < 2}
            title={
              models.length === 2
                ? "Battle 1v1"
                : models.length === 3
                  ? "Battle 1v2 (highest stats vs others)"
                  : "Battle 2v2 (top half vs bottom half)"
            }
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition
              ${
                models.length < 2
                  ? "bg-white/[0.05] text-ink-500 cursor-not-allowed"
                  : "bg-pokered-500 text-white hover:brightness-110"
              }`}
          >
            <BattleIcon />
            <span className="hidden sm:inline">Battle</span>
            <span className="text-[10px] font-mono opacity-80">{models.length}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function CompareIcon() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 20V11" />
      <path d="M12 20V4" />
      <path d="M18 20v-7" />
      <path d="M3 20h18" />
    </svg>
  );
}

function BattleIcon() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
      <path d="M13 19l6-6" />
      <path d="M16 16l4 4" />
      <path d="M19 21l2-2" />
      <path d="M9.5 17.5L21 6V3h-3L6.5 14.5" />
      <path d="M11 19l-6-6" />
      <path d="M8 16l-4 4" />
      <path d="M5 21l-2-2" />
    </svg>
  );
}
