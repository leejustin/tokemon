import type { AIModel } from "../data/types";
import { TypeBadge } from "./TypeBadge";
import { ModelEmblem } from "./ModelEmblem";
import { FictionalChip } from "./FictionalChip";
import { getLabBranding } from "../data/labBranding";

interface Props {
  model: AIModel;
  onSelect?: () => void;
  onCompareToggle?: () => void;
  inCompare?: boolean;
}

export function ModelCard({ model, onSelect, onCompareToggle, inCompare }: Props) {
  const lab = getLabBranding(model.lab);

  return (
    <div
      className={`group relative rounded-xl border transition-all duration-150
        bg-canvas-raised
        ${
          inCompare
            ? "border-pokered-500/60 ring-1 ring-pokered-500/40"
            : "border-white/[0.06] hover:border-white/20"
        }
        hover:bg-canvas-panel hover:-translate-y-0.5 hover:shadow-soft`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left p-3 pr-10 focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <ModelEmblem model={model} size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-ink-500">
              <span>#{String(model.id).padStart(3, "0")}</span>
              <span className="opacity-50">·</span>
              <span className="truncate" style={{ color: lab.color }}>
                {model.lab}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="text-sm font-semibold text-white truncate">
                {model.name}
              </div>
              {model.fictional && <FictionalChip compact />}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {model.types.slice(0, 2).map((t) => (
                <TypeBadge key={t} type={t} size="xs" />
              ))}
              {model.types.length > 2 && (
                <span className="text-[10px] text-ink-500 px-1 self-center">
                  +{model.types.length - 2}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Compare toggle — always visible, more prominent when active */}
      {onCompareToggle && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCompareToggle();
          }}
          aria-label={inCompare ? "Remove from compare" : "Add to compare"}
          aria-pressed={inCompare}
          title={inCompare ? "Remove from compare" : "Add to compare"}
          className={`absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold transition-all
            ${
              inCompare
                ? "bg-pokered-500 text-white ring-1 ring-pokered-400 shadow-sm"
                : "bg-white/[0.04] text-ink-500 ring-1 ring-white/10 hover:bg-white/[0.1] hover:text-white hover:ring-white/20"
            }`}
        >
          {inCompare ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 12l5 5L20 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
