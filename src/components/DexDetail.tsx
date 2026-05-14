import type { AIModel } from "../data/types";
import { STAT_KEYS, statTotal } from "../data/models";
import { TypeBadge } from "./TypeBadge";
import { StatBar } from "./StatBar";
import { EvolutionChain } from "./EvolutionChain";
import { ModelEmblem } from "./ModelEmblem";
import { FictionalChip } from "./FictionalChip";
import { getLabBranding } from "../data/labBranding";

interface Props {
  model: AIModel;
  onSelect: (m: AIModel) => void;
  onBack: () => void;
  onAddCompare: () => void;
  inCompare: boolean;
}

export function DexDetail({ model, onSelect, onBack, onAddCompare, inCompare }: Props) {
  const lab = getLabBranding(model.lab);
  const total = statTotal(model);

  return (
    <div key={model.id} className="animate-pop">
      {/* Top bar with back + actions */}
      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-ink-300 hover:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5m0 0l5-5m-5 5l5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Modeldex
        </button>
        <button
          type="button"
          onClick={onAddCompare}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition
            ${
              inCompare
                ? "bg-pokered-500 text-white border-pokered-400 hover:brightness-110"
                : "bg-pokered-500/10 text-pokered-300 border-pokered-500/40 hover:bg-pokered-500/20 hover:border-pokered-400"
            }`}
        >
          {inCompare ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M5 12l5 5L20 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              In compare
            </>
          ) : (
            <>⚔ Add to compare</>
          )}
        </button>
      </div>

      {/* Hero */}
      <section className="grid grid-cols-12 gap-6 items-center">
        <div className="col-span-12 sm:col-span-4 md:col-span-3 flex justify-center sm:justify-start">
          <ModelEmblem model={model} size={160} framed showStage />
        </div>
        <div className="col-span-12 sm:col-span-8 md:col-span-9">
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-ink-500">
            Pokemodel #{String(model.id).padStart(3, "0")}
            {model.evolutionStage && (
              <span className="ml-2">· Stage {model.evolutionStage}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <h1
              className="font-display font-black text-3xl md:text-4xl text-white tracking-tight"
              style={{ textShadow: `0 1px 24px ${lab.color}33` }}
            >
              {model.name}
            </h1>
            {model.fictional && (
              <FictionalChip note={model.fictionalNote} />
            )}
          </div>
          <div className="mt-1 text-sm text-ink-400">
            <span style={{ color: lab.color }} className="font-medium">
              {model.lab}
            </span>
            <span className="mx-1.5 text-ink-600">·</span>
            <span className="italic">{model.species}</span>
          </div>
          <div className="text-[11px] font-mono text-ink-500 mt-0.5">{model.fullName}</div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {model.types.map((t) => (
              <TypeBadge key={t} type={t} size="md" variant="solid" />
            ))}
            {model.openWeights && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-lime-500/10 text-lime-300 ring-1 ring-inset ring-lime-500/30">
                <span style={{ fontFamily: "Orbitron" }}>ʘ</span> Open weights
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Fictional-model disclaimer banner */}
      {model.fictional && (
        <section
          role="note"
          aria-label="Fictional model disclaimer"
          className="mt-5 rounded-xl p-3.5 ring-1 ring-inset"
          style={{
            background:
              "linear-gradient(180deg, rgba(220,38,38,0.12), rgba(220,38,38,0.05))",
            boxShadow: "inset 0 0 0 1px rgba(220,38,38,0.35)",
          }}
        >
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="text-2xl leading-none"
              style={{ filter: "drop-shadow(0 0 6px rgba(248,113,113,0.5))" }}
            >
              ⚠
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-rose-300">
                Fictional · Not a Real Model
              </div>
              <p className="text-sm text-ink-200 leading-relaxed mt-1">
                {model.fictionalNote ??
                  "This creature is a fan-invented satirical entry. Stats, " +
                    "pricing, mechanics, and lore are pure fiction and do " +
                    "not represent any real, announced, or shipped product."}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Dex flavor entry */}
      <section className="mt-5 surface p-4 relative overflow-hidden">
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ background: lab.color }}
        />
        <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-500 mb-1">
          Dex Entry
        </div>
        <p className="text-sm text-ink-200 leading-relaxed">{model.description}</p>
      </section>

      {/* Stats + Quick facts grid */}
      <section className="mt-5 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-3 surface p-4">
          <div className="flex items-baseline justify-between mb-2">
            <SectionTitle>Base Stats</SectionTitle>
            <div className="text-[11px] font-mono text-ink-400">
              Total <span className="text-white font-semibold">{total}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            {STAT_KEYS.map(({ key, label, meaning }) => (
              <StatBar
                key={key}
                label={label}
                value={model.stats[key]}
                meaning={meaning}
                accent={lab.color}
              />
            ))}
          </div>
        </div>

        <div className="md:col-span-2 surface p-4">
          <SectionTitle>Specs</SectionTitle>
          <dl className="mt-2 space-y-2 text-sm">
            <Spec label="Released" value={model.released} />
            <Spec label="Parameters" value={model.params} />
            <Spec label="Context" value={model.context} />
            <Spec label="Modalities" value={model.modalities.join(", ")} />
            <Spec
              label="Pricing"
              value={
                model.price.input === undefined && model.price.output === undefined
                  ? "—"
                  : `$${model.price.input ?? "?"} / $${model.price.output ?? "?"}`
              }
              hint={model.price.note ?? "per 1M tokens (in / out)"}
            />
          </dl>
        </div>
      </section>

      {/* Evolution chain */}
      <section className="mt-5 surface p-4">
        <SectionTitle>Evolution Chain</SectionTitle>
        <div className="mt-2">
          <EvolutionChain model={model} onSelect={onSelect} />
        </div>
      </section>

      {/* Abilities + Available */}
      <section className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="surface p-4">
          <SectionTitle>Abilities</SectionTitle>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {model.abilities.map((a) => (
              <span
                key={a}
                className="px-2 py-1 text-xs rounded-md bg-white/[0.04] ring-1 ring-inset ring-white/10 text-ink-200"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
        <div className="surface p-4">
          <SectionTitle>Available On</SectionTitle>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {model.availableOn.map((p) => (
              <span
                key={p}
                className="px-2 py-1 text-[11px] font-mono rounded-md bg-white/[0.04] ring-1 ring-inset ring-white/10 text-ink-200"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-500">
      {children}
    </div>
  );
}

function Spec({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-xs text-ink-400 shrink-0">{label}</dt>
      <dd className="text-xs font-mono text-white text-right">
        <div>{value}</div>
        {hint && <div className="text-[10px] text-ink-500 italic font-sans">{hint}</div>}
      </dd>
    </div>
  );
}
