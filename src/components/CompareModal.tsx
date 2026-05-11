import type { AIModel } from "../data/types";
import { STAT_KEYS, statTotal } from "../data/models";
import { TypeBadge } from "./TypeBadge";
import { ModelEmblem } from "./ModelEmblem";
import { getLabBranding } from "../data/labBranding";

interface Props {
  models: AIModel[];
  onClose: () => void;
  onRemove: (id: number) => void;
}

export function CompareModal({ models, onClose, onRemove }: Props) {
  if (models.length === 0) return null;

  const maxByStat: Record<string, number> = {};
  for (const k of STAT_KEYS) {
    maxByStat[k.key] = Math.max(...models.map((m) => m.stats[k.key]));
  }
  const maxTotal = Math.max(...models.map(statTotal));

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-pop"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-canvas-panel border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-canvas-panel/95 backdrop-blur z-10 px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-pokered-400">
              Battle Comparison
            </div>
            <div className="text-lg font-display font-bold text-white">
              {models.length} Pokemodels in the arena
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-white/[0.05] text-ink-200 hover:bg-white/[0.1]"
          >
            ✕ Close
          </button>
        </div>

        <div className="p-5">
          {/* Header row */}
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `140px repeat(${models.length}, minmax(0, 1fr))` }}
          >
            <div />
            {models.map((m) => {
              const lab = getLabBranding(m.lab);
              return (
                <div
                  key={m.id}
                  className="rounded-xl bg-white/[0.03] ring-1 ring-inset ring-white/10 p-3 relative"
                >
                  <button
                    type="button"
                    onClick={() => onRemove(m.id)}
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-md text-xs text-ink-400 bg-white/[0.05] hover:bg-pokered-500 hover:text-white"
                    title="Remove"
                  >
                    ×
                  </button>
                  <div className="flex flex-col items-center text-center">
                    <ModelEmblem model={m} size={64} />
                    <div className="mt-2 text-[10px] font-mono uppercase tracking-wider text-ink-500">
                      #{String(m.id).padStart(3, "0")}
                    </div>
                    <div
                      className="text-xs font-medium"
                      style={{ color: lab.color }}
                    >
                      {m.lab}
                    </div>
                    <div className="text-sm font-semibold text-white mt-0.5 leading-tight">
                      {m.name}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1 justify-center">
                      {m.types.slice(0, 2).map((t) => (
                        <TypeBadge key={t} type={t} size="xs" />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="mt-5">
            <SectionLabel>Base Stats</SectionLabel>
            <div className="mt-2 space-y-1">
              {STAT_KEYS.map((s) => (
                <div
                  key={s.key}
                  className="grid gap-3 items-center py-1.5 border-b border-white/5"
                  style={{
                    gridTemplateColumns: `140px repeat(${models.length}, minmax(0, 1fr))`,
                  }}
                >
                  <div>
                    <div className="text-xs font-medium text-ink-300">{s.label}</div>
                    <div className="text-[10px] text-ink-500">{s.meaning}</div>
                  </div>
                  {models.map((m) => {
                    const v = m.stats[s.key];
                    const isMax = v === maxByStat[s.key] && models.length > 1;
                    return (
                      <div key={m.id} className="flex items-center gap-2">
                        <div className="relative h-1.5 flex-1 rounded-full bg-white/[0.04]">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{
                              width: `${Math.min(100, (v / 150) * 100)}%`,
                              background: m.accent,
                            }}
                          />
                        </div>
                        <div
                          className={`text-xs font-mono font-semibold tabular-nums w-12 text-right ${
                            isMax ? "text-amber-300" : "text-ink-200"
                          }`}
                        >
                          {v}
                          {isMax && <span className="ml-0.5">★</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              <div
                className="grid gap-3 items-center py-2 mt-2 bg-white/[0.03] rounded-lg px-2"
                style={{
                  gridTemplateColumns: `140px repeat(${models.length}, minmax(0, 1fr))`,
                }}
              >
                <div className="text-xs font-semibold text-pokered-300">Total</div>
                {models.map((m) => {
                  const t = statTotal(m);
                  const isMax = t === maxTotal && models.length > 1;
                  return (
                    <div
                      key={m.id}
                      className={`text-sm font-mono font-bold ${
                        isMax ? "text-amber-300" : "text-white"
                      }`}
                    >
                      {t} {isMax && "★"}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Specs */}
          <div className="mt-5">
            <SectionLabel>Specs</SectionLabel>
            <div className="mt-2 space-y-1">
              <MetaRow label="Context" models={models} value={(m) => m.context} />
              <MetaRow label="Parameters" models={models} value={(m) => m.params} />
              <MetaRow
                label="Pricing (in/out per 1M)"
                models={models}
                value={(m) =>
                  m.price.input === undefined && m.price.output === undefined
                    ? "—"
                    : `$${m.price.input ?? "?"} / $${m.price.output ?? "?"}`
                }
              />
              <MetaRow
                label="Open Weights"
                models={models}
                value={(m) => (m.openWeights ? "Yes" : "No")}
              />
              <MetaRow label="Released" models={models} value={(m) => m.released} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-500">
      {children}
    </div>
  );
}

function MetaRow({
  label,
  models,
  value,
}: {
  label: string;
  models: AIModel[];
  value: (m: AIModel) => string;
}) {
  return (
    <div
      className="grid gap-3 items-center py-1.5 border-b border-white/5"
      style={{ gridTemplateColumns: `140px repeat(${models.length}, minmax(0, 1fr))` }}
    >
      <div className="text-xs text-ink-300 font-medium">{label}</div>
      {models.map((m) => (
        <div
          key={m.id}
          className="text-xs font-mono text-ink-100 truncate"
          title={value(m)}
        >
          {value(m)}
        </div>
      ))}
    </div>
  );
}
