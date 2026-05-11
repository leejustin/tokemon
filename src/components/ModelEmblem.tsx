import type { AIModel } from "../data/types";
import { getLabBranding } from "../data/labBranding";
import { TYPE_META } from "../data/typeMeta";
import { PixelSprite } from "./PixelSprite";
import { getSprite } from "../data/sprites";

interface Props {
  model: AIModel;
  size?: number;
  /** When true, renders the Pokedex CRT screen treatment around the creature */
  framed?: boolean;
  /** Show the evolution stage pip badge */
  showStage?: boolean;
  /** Animate the creature with a gentle bob */
  animated?: boolean;
}

/**
 * Wraps a model's hand-drawn pixel sprite in a Pokemon-card-style frame:
 * lab-tinted gradient background, type stripe at the bottom, optional CRT
 * screen with corner LEDs and Dex number plate (`framed` variant) for the
 * detail-page hero.
 */
export function ModelEmblem({
  model,
  size = 96,
  framed = false,
  showStage = false,
  animated = true,
}: Props) {
  const lab = getLabBranding(model.lab);
  const primary = TYPE_META[model.types[0]];
  const radius = Math.round(size * 0.18);
  const sprite = getSprite(model.fullName);

  // Inner card: gradient background + sprite + type stripe
  const card = (
    <div
      className="relative shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `linear-gradient(160deg, ${lab.color}, ${lab.colorAlt})`,
        boxShadow:
          "inset 0 0 0 1px rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.3)",
        overflow: "hidden",
      }}
      aria-label={`${model.name}`}
    >
      {/* subtle inner sheen */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 55%)",
        }}
      />
      {/* dotted grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: `${Math.max(6, size * 0.08)}px ${Math.max(6, size * 0.08)}px`,
        }}
      />
      {/* the pixel sprite */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ paddingBottom: size * 0.06 }}
      >
        <PixelSprite
          grid={sprite.grid}
          palette={sprite.palette}
          size={Math.round(size * 0.86)}
          animated={animated}
        />
      </div>
      {/* type stripe at the bottom */}
      <div
        className="absolute bottom-0 inset-x-0"
        style={{
          height: Math.max(3, size * 0.04),
          background: primary.hex,
          boxShadow: "inset 0 1px 0 rgba(0,0,0,0.35)",
        }}
      />
      {/* evolution stage pip */}
      {showStage && model.evolutionStage && (
        <div
          className="absolute top-1.5 right-1.5 rounded-full bg-canvas-base/90 text-white text-[10px] font-mono font-bold flex items-center justify-center ring-1 ring-white/20"
          style={{
            width: Math.max(16, size * 0.16),
            height: Math.max(16, size * 0.16),
          }}
        >
          {model.evolutionStage}
        </div>
      )}
    </div>
  );

  if (!framed) return card;

  // Framed: Pokedex-bezel treatment around the card.
  // We use proper top/bottom bars (instead of absolute corner overlays) so
  // the LEDs and Dex # plate never collide with the rounded corner arcs.
  const bezelRadius = radius + 8;
  const sidePad = Math.round(size * 0.09);
  const barPadY = Math.max(6, Math.round(size * 0.05));

  return (
    <div
      className="relative inline-flex flex-col"
      style={{
        borderRadius: bezelRadius,
        background:
          "radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.05), transparent 60%), linear-gradient(180deg, #14171f, #0a0c12)",
        boxShadow:
          "inset 0 0 0 1px rgba(255,255,255,0.07), inset 0 0 30px rgba(0,0,0,0.55), 0 6px 20px rgba(0,0,0,0.5)",
      }}
    >
      {/* Top bezel bar: status LEDs */}
      <div
        className="flex items-center gap-1.5"
        style={{
          paddingLeft: sidePad,
          paddingRight: sidePad,
          paddingTop: barPadY,
          paddingBottom: Math.round(barPadY * 0.65),
        }}
      >
        <span
          className="rounded-full bg-emerald-400 animate-blink"
          style={{
            width: 8,
            height: 8,
            boxShadow: "0 0 6px rgba(74, 222, 128, 0.85)",
          }}
        />
        <span
          className="rounded-full bg-amber-400"
          style={{
            width: 8,
            height: 8,
            boxShadow: "0 0 6px rgba(251, 191, 36, 0.65)",
          }}
        />
        <span
          className="rounded-full bg-rose-500"
          style={{
            width: 8,
            height: 8,
            boxShadow: "0 0 6px rgba(244, 63, 94, 0.65)",
          }}
        />
        <span className="ml-auto text-[9px] font-mono uppercase tracking-[0.25em] text-ink-500">
          REC
        </span>
      </div>

      {/* The card itself */}
      <div style={{ paddingLeft: sidePad, paddingRight: sidePad }}>
        {card}
      </div>

      {/* Bottom bezel bar: Dex # plate */}
      <div
        className="flex items-center justify-between"
        style={{
          paddingLeft: sidePad,
          paddingRight: sidePad,
          paddingTop: Math.round(barPadY * 0.65),
          paddingBottom: barPadY,
        }}
      >
        <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-ink-500">
          POKEMODEL
        </span>
        <span
          className="text-[10px] font-mono font-semibold text-emerald-300/85 tracking-wider px-1.5 py-0.5 rounded"
          style={{
            background: "rgba(16, 185, 129, 0.08)",
            boxShadow: "inset 0 0 0 1px rgba(16, 185, 129, 0.18)",
          }}
        >
          #{String(model.id).padStart(3, "0")}
        </span>
      </div>

      {/* faint scanlines overlay across the whole bezel */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          borderRadius: bezelRadius,
          background:
            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 2px, transparent 3px)",
        }}
      />
    </div>
  );
}
