import { useMemo, useState } from "react";
import { MODELS, statTotal } from "../data/models";
import type { AIModel } from "../data/types";
import { ModelEmblem } from "../components/ModelEmblem";
import { TypeBadge } from "../components/TypeBadge";

interface Props {
  current: AIModel | null;
  onPick: (model: AIModel) => void;
  onCancel: () => void;
  /** Mythical models the player has unlocked; rendered in their own section. */
  mythicals?: AIModel[];
}

/**
 * Pre-adventure roster picker.
 *
 * Anything in `mythicals` (e.g. legendaries the player has earned) is rendered
 * in its own labeled section so it's clear those are unlocks, not regular
 * roster picks. They're still fully selectable as a battle partner.
 */
export function PartnerPicker({ current, onPick, onCancel, mythicals = [] }: Props) {
  const [hoverId, setHoverId] = useState<number | null>(null);

  const pool = MODELS;

  const everyModel = useMemo(() => [...pool, ...mythicals], [pool, mythicals]);

  const showcase = hoverId
    ? everyModel.find((m) => m.id === hoverId) ?? null
    : current ?? pool[0] ?? null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-pop"
      role="dialog"
      aria-label="Choose your partner"
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
        style={{
          background:
            "linear-gradient(180deg, #1e293b 0%, #0f172a 50%, #050810 100%)",
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="absolute top-3 right-3 z-20 px-2 py-1 rounded-md text-xs font-semibold bg-white/[0.08] text-ink-100 hover:bg-white/[0.16]"
        >
          ✕
        </button>

        <div className="p-5 sm:p-6 pb-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-amber-300">
            Adventure Mode
          </div>
          <h2 className="font-display font-black text-white text-xl sm:text-2xl mt-1">
            Choose your partner.
          </h2>
          <p className="text-xs text-ink-400 mt-1">
            Pick one modelmon to take to the meetup. You can switch later, but
            switching wipes your battle damage. Pick whoever you vibe with —
            stats matter, but no one's recommending you a starter here.
          </p>
        </div>

        <div className="grid sm:grid-cols-[1fr_320px] gap-4 p-5 pt-1">
          {/* Roster grid */}
          <div className="rounded-xl bg-white/[0.03] ring-1 ring-inset ring-white/10 p-3 max-h-[420px] overflow-y-auto">
            {mythicals.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-300">
                    Mythical (unlocked)
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-amber-300/40 to-transparent" />
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                  {mythicals.map((m) => (
                    <PartnerTile
                      key={m.id}
                      model={m}
                      isCurrent={current?.id === m.id}
                      mythic
                      onHover={() => setHoverId(m.id)}
                      onLeave={() => setHoverId(null)}
                      onPick={() => onPick(m)}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-500 mb-2">
              All models
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {pool.map((m) => (
                <PartnerTile
                  key={m.id}
                  model={m}
                  isCurrent={current?.id === m.id}
                  onHover={() => setHoverId(m.id)}
                  onLeave={() => setHoverId(null)}
                  onPick={() => onPick(m)}
                />
              ))}
            </div>
          </div>

          {/* Showcase panel */}
          <div className="rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/10 p-4 flex flex-col items-center text-center min-h-[280px]">
            {showcase ? (
              <>
                <ModelEmblem model={showcase} size={96} animated />
                <div className="mt-2 font-display font-bold text-white">
                  {showcase.name}
                </div>
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-400">
                  {showcase.species}
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-1">
                  {showcase.types.map((t) => (
                    <TypeBadge key={t} type={t} size="xs" />
                  ))}
                </div>
                <div className="mt-3 text-[11px] font-mono text-ink-300 leading-snug">
                  Stat total{" "}
                  <span className="text-white">{statTotal(showcase)}</span> ·{" "}
                  {showcase.lab}
                </div>
                <p className="mt-2 text-xs text-ink-300 line-clamp-4 leading-snug">
                  {showcase.description}
                </p>
              </>
            ) : (
              <div className="text-ink-500 text-xs">
                Hover a modelmon to preview.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PartnerTile({
  model,
  isCurrent,
  mythic = false,
  onHover,
  onLeave,
  onPick,
}: {
  model: AIModel;
  isCurrent: boolean;
  mythic?: boolean;
  onHover: () => void;
  onLeave: () => void;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      className={`group rounded-lg p-2 flex flex-col items-center gap-1 ring-1 ring-inset transition active:scale-[0.97] ${
        isCurrent
          ? "bg-pokered-500/15 ring-pokered-400/50"
          : mythic
            ? "bg-amber-300/10 ring-amber-300/40 hover:bg-amber-300/20"
            : "bg-white/[0.04] ring-white/10 hover:bg-white/[0.1]"
      }`}
    >
      <ModelEmblem model={model} size={48} animated={false} />
      <div className="text-[10px] font-display font-bold text-white text-center leading-tight truncate w-full">
        {model.name}
      </div>
    </button>
  );
}
