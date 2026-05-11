import type { AIModel } from "../data/types";
import { ModelEmblem } from "./ModelEmblem";
import { getLabBranding } from "../data/labBranding";

interface Props {
  current: AIModel[];
  incoming: AIModel | null;
  onCancel: () => void;
  onReplace: (removeId: number) => void;
  max: number;
}

/**
 * Asks the user which existing model to swap out when the compare list is
 * full and they try to add another. Avoids the surprise of silently dropping
 * the oldest entry FIFO-style.
 */
export function OverflowModal({ current, incoming, onCancel, onReplace, max }: Props) {
  if (!incoming) return null;
  const incomingLab = getLabBranding(incoming.lab);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-pop"
      onClick={onCancel}
      role="dialog"
      aria-label="Compare list is full"
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-canvas-panel border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 pb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-pokered-400">
              Compare list full
            </div>
            <h3 className="font-display font-bold text-white text-lg mt-0.5">
              Replace a model?
            </h3>
            <p className="text-xs text-ink-400 mt-1">
              You can compare up to {max} models. Pick one below to swap with{" "}
              <span className="text-white font-medium">{incoming.name}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="px-2 py-1 rounded-md text-xs font-semibold bg-white/[0.05] text-ink-200 hover:bg-white/[0.1]"
          >
            ✕
          </button>
        </div>

        {/* Incoming */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-pokered-500/[0.07] ring-1 ring-inset ring-pokered-500/30">
            <ModelEmblem model={incoming} size={56} animated={false} />
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-ink-500">
                Incoming
              </div>
              <div className="text-sm font-semibold text-white truncate">
                {incoming.name}
              </div>
              <div
                className="text-[11px] font-medium truncate"
                style={{ color: incomingLab.color }}
              >
                {incoming.lab}
              </div>
            </div>
          </div>
        </div>

        {/* Replace candidates */}
        <div className="px-5 pb-5">
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-500 mb-2">
            Replace which?
          </div>
          <div className="space-y-1.5">
            {current.map((m) => {
              const lab = getLabBranding(m.lab);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onReplace(m.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] ring-1 ring-inset ring-white/10 transition-colors text-left"
                >
                  <ModelEmblem model={m} size={44} animated={false} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white truncate">
                      {m.name}
                    </div>
                    <div
                      className="text-[11px] font-medium truncate"
                      style={{ color: lab.color }}
                    >
                      {m.lab}
                    </div>
                  </div>
                  <span className="text-[11px] text-ink-400 font-medium shrink-0 group-hover:text-white">
                    Replace →
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
