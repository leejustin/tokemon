import type { AIModel } from "../data/types";
import { chainOf } from "../data/models";
import { ModelEmblem } from "./ModelEmblem";

interface Props {
  model: AIModel;
  onSelect: (m: AIModel) => void;
}

export function EvolutionChain({ model, onSelect }: Props) {
  const chain = chainOf(model);

  if (chain.length <= 1) {
    return (
      <div className="text-sm text-ink-400">
        This Pokemodel does not evolve.{" "}
        <span className="text-ink-500">(At least, not yet.)</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
      {chain.map((m, i) => {
        const isCurrent = m.id === model.id;
        return (
          <div key={m.id} className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onSelect(m)}
              className={`group flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all
                ${
                  isCurrent
                    ? "bg-white/[0.06] ring-1 ring-pokered-500/60"
                    : "hover:bg-white/[0.04] ring-1 ring-transparent hover:ring-white/10"
                }`}
              style={{ minWidth: 110 }}
            >
              <ModelEmblem model={m} size={56} showStage />
              <div className="text-[10px] font-mono uppercase tracking-wider text-ink-500">
                Stage {m.evolutionStage}
              </div>
              <div
                className={`text-xs font-semibold leading-tight text-center max-w-[110px] truncate ${
                  isCurrent ? "text-white" : "text-ink-200"
                }`}
              >
                {m.name}
              </div>
            </button>
            {i < chain.length - 1 && (
              <div className="flex flex-col items-center text-ink-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14m0 0l-5-5m5 5l-5 5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
