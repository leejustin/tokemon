import { useRef, useState } from "react";
import {
  LEGENDARIES,
  type LegendaryDef,
  type LegendaryState,
} from "../data/legendary";
import { ModelEmblem } from "./ModelEmblem";
import { TypeBadge } from "./TypeBadge";

interface Props {
  state: LegendaryState;
}

/**
 * The "Ancient Vault" — a glorious gold/violet panel that sits below the
 * main Pokedex. Hosts five legendary slots — three unlock from arena
 * battles via vault codes, and two more await discovery in Adventure Mode.
 */
export function RedeemPanel({ state }: Props) {
  return (
    <section
      aria-label="Mythos Vault"
      className="max-w-6xl w-full mx-auto px-3 sm:px-6 pb-10"
    >
      <div
        className="relative rounded-2xl overflow-hidden ring-1 ring-amber-300/30 p-5 sm:p-7"
        style={{
          background:
            "radial-gradient(120% 100% at 10% 0%, rgba(245,215,110,0.10), transparent 55%), radial-gradient(120% 100% at 90% 100%, rgba(167,139,250,0.14), transparent 55%), linear-gradient(180deg, #14101f 0%, #0a0a16 100%)",
          boxShadow:
            "inset 0 0 0 1px rgba(245,215,110,0.18), 0 30px 80px -30px rgba(167,139,250,0.35)",
        }}
      >
        <SparkleField />

        <div className="relative flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.4em] text-amber-300">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
              Ancient Vault
            </div>
            <h2 className="mt-1 font-display font-black text-xl sm:text-2xl text-white leading-tight">
              Five legendaries are sealed within.
            </h2>
            <p className="text-xs text-ink-400 mt-1 max-w-prose">
              Two reveal codes through simple arena battles up here
              (<span className="text-amber-200">4</span> and{" "}
              <span className="text-amber-200">8</span> battles).{" "}
              <span className="text-amber-200">Claude Mythos</span> only stirs
              once you've battled <em>every</em> trainer at the GenAI Builder
              Meetup in <span className="text-cyan-300">Adventure Mode</span>{" "}
              — win or lose, you just have to show up. Two more wait out on
              the bay and a small island. Every creature here is a{" "}
              <span className="text-rose-300">fictional fan creation</span>.
            </p>
          </div>
          <div className="text-[10px] font-mono text-amber-300/80 tabular-nums">
            {state.battles} battles fought
          </div>
        </div>

        <div className="relative grid gap-3">
          {LEGENDARIES.map((def) => (
            <LegendarySlot key={def.id} def={def} state={state} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Single slot row ─────────────────────────────────────────────── */

function LegendarySlot({
  def,
  state,
}: {
  def: LegendaryDef;
  state: LegendaryState;
}) {
  const unlocked = state.isUnlocked(def.id);
  const codeRevealed = state.isCodeRevealed(def.id);
  const isAdventure = def.source === "adventure";

  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  // Flash on adventure auto-unlock too
  const prevUnlockedRef = useRef(unlocked);
  if (prevUnlockedRef.current !== unlocked) {
    if (!prevUnlockedRef.current && unlocked) {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 1800);
    }
    prevUnlockedRef.current = unlocked;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isAdventure) return;
    if (state.redeem(def.id, input)) {
      setFlash(true);
      setError(null);
      setInput("");
      window.setTimeout(() => setFlash(false), 1800);
    } else {
      setError(
        !codeRevealed
          ? `Run ${def.requiredBattles} battles first to learn the code.`
          : "The vault rejects your code."
      );
      window.setTimeout(() => setError(null), 2400);
    }
  }

  return (
    <div
      className={`relative rounded-xl ring-1 ring-inset p-3 sm:p-4 grid gap-3 sm:gap-4 transition ${
        unlocked
          ? "bg-amber-400/[0.08] ring-amber-300/30"
          : "bg-black/30 ring-white/10"
      }`}
      style={{
        gridTemplateColumns: "auto 1fr",
      }}
    >
      {/* Emblem */}
      <div className="flex flex-col items-center gap-2 w-[88px] sm:w-[112px]">
        <div
          className="relative rounded-xl p-2"
          style={{
            background: unlocked
              ? "radial-gradient(circle at 50% 50%, rgba(245,215,110,0.25), transparent 65%)"
              : "rgba(0,0,0,0.4)",
            filter: unlocked ? undefined : "grayscale(1) brightness(0.4)",
            transition: "filter 600ms ease",
          }}
        >
          {unlocked && (
            <div
              aria-hidden
              className="absolute -inset-1.5 rounded-2xl pointer-events-none"
              style={{
                background:
                  "conic-gradient(from 0deg, rgba(245,215,110,0.0), rgba(245,215,110,0.45), rgba(167,139,250,0.45), rgba(245,215,110,0.0))",
                animation: "mythos-orbit 6s linear infinite",
                filter: "blur(12px)",
                opacity: 0.55,
              }}
            />
          )}
          <div className="relative">
            <ModelEmblem model={def.model} size={72} animated={unlocked} />
          </div>
        </div>
        {unlocked ? (
          <div className="flex items-center gap-1">
            {def.model.types.slice(0, 2).map((t) => (
              <TypeBadge key={t} type={t} size="xs" />
            ))}
          </div>
        ) : (
          <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-ink-600">
            ??? ???
          </div>
        )}
      </div>

      {/* Body */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-display font-black text-white text-base sm:text-lg leading-tight">
            {unlocked ? (
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #f5d76e, #fde68a, #a78bfa)",
                }}
              >
                {def.model.name}
              </span>
            ) : (
              "? ? ?"
            )}
          </div>
          <FictionalChip />
          {unlocked && (
            <span className="text-[10px] font-mono text-amber-300/80">
              No. {def.model.id}
            </span>
          )}
        </div>

        <p className="mt-1 text-xs sm:text-[13px] text-ink-300 leading-snug">
          {unlocked ? def.model.description : def.flavor}
        </p>
        <p
          className={`mt-1 text-[11px] font-mono leading-snug ${
            unlocked ? "text-amber-300/80" : "text-ink-500"
          }`}
        >
          <span className="text-amber-300">Quirk:</span> {def.mechanic}
        </p>

        {/* Progress / code reveal — vault-only */}
        {!unlocked && !isAdventure && (
          <div className="mt-2.5">
            <Progress
              current={state.battles}
              target={def.requiredBattles}
            />
            {codeRevealed && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-md px-2 py-1 bg-black/40 ring-1 ring-amber-300/40">
                <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-amber-300/80">
                  Code
                </span>
                <span
                  className="font-mono text-base font-bold tracking-[0.4em] text-amber-300"
                  style={{
                    textShadow:
                      "0 0 12px rgba(245,215,110,0.6), 0 0 2px rgba(245,215,110,0.9)",
                    animation: "mythos-flicker 2.4s ease-in-out infinite",
                  }}
                >
                  {def.redeemCode}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Adventure-only "where to find" hint */}
        {!unlocked && isAdventure && (
          <div className="mt-2.5 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-md px-2 py-1 bg-cyan-500/[0.08] ring-1 ring-inset ring-cyan-300/30">
              <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-cyan-300/90">
                🎮 Adventure
              </span>
              <span className="text-[11px] font-mono text-cyan-100">
                {def.whereToFind ?? "Defeat in Adventure Mode"}
              </span>
            </div>
          </div>
        )}

        {/* Form / status */}
        {!unlocked && !isAdventure && (
          <form onSubmit={handleSubmit} className="mt-2.5 flex flex-wrap gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                codeRevealed
                  ? "Enter the code above"
                  : "Battle to learn the code"
              }
              autoComplete="off"
              spellCheck={false}
              aria-label={`Battle code for ${def.model.name}`}
              className="flex-1 min-w-[160px] px-3 py-1.5 rounded-lg bg-black/40 ring-1 ring-inset ring-amber-300/20 text-amber-100 placeholder:text-ink-500 font-mono tracking-[0.3em] uppercase text-sm focus:outline-none focus:ring-amber-300/50"
            />
            <button
              type="submit"
              disabled={!codeRevealed}
              className={`px-3 py-1.5 rounded-lg font-display font-bold text-sm transition active:scale-[0.98] ${
                codeRevealed
                  ? "text-black"
                  : "text-ink-500 bg-white/[0.04] cursor-not-allowed"
              }`}
              style={
                codeRevealed
                  ? {
                      background:
                        "linear-gradient(180deg, #fde68a 0%, #f5d76e 50%, #d4a017 100%)",
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.5), 0 6px 16px -6px rgba(245,215,110,0.6)",
                    }
                  : undefined
              }
            >
              Redeem ✦
            </button>
          </form>
        )}
        {unlocked && (
          <div className="mt-2 text-[11px] font-mono text-amber-300/90">
            ✦ Joined your Pokedex as #{def.model.id}.{" "}
            <span className="text-ink-400">
              Add it to a battle to see the quirk in action.
            </span>
          </div>
        )}

        {error && (
          <div className="mt-2 text-[11px] font-mono text-rose-300">
            {error}
          </div>
        )}
      </div>

      {/* Unlock flash */}
      {flash && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none animate-mythos-flash rounded-xl"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(245,215,110,0.7), transparent 60%)",
          }}
        />
      )}
    </div>
  );
}

function FictionalChip() {
  return (
    <span
      className="text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.25em] px-1.5 py-0.5 rounded ring-1 ring-inset"
      style={{
        background: "rgba(220,38,38,0.15)",
        color: "#fca5a5",
        boxShadow: "inset 0 0 0 1px rgba(220,38,38,0.3)",
      }}
      title="Fan-invented creature. Not a real, announced, or shipped model."
    >
      ⚠ Fictional
    </span>
  );
}

function Progress({ current, target }: { current: number; target: number }) {
  const clamped = Math.min(current, target);
  const pct = (clamped / target) * 100;
  return (
    <div className="flex items-center gap-2 max-w-sm">
      <div className="relative h-1.5 flex-1 rounded-full bg-black/50 ring-1 ring-inset ring-amber-300/15 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #f5d76e, #a78bfa)",
            boxShadow: "0 0 10px rgba(245,215,110,0.5)",
          }}
        />
      </div>
      <span className="text-[10px] font-mono text-ink-400 tabular-nums w-10 text-right">
        {clamped}/{target}
      </span>
    </div>
  );
}

/** Decorative twinkling dots — fixed positions so they don't reflow. */
function SparkleField() {
  const dots = [
    { top: "8%", left: "5%", d: 0 },
    { top: "20%", left: "92%", d: 0.6 },
    { top: "75%", left: "12%", d: 1.2 },
    { top: "60%", left: "55%", d: 1.8 },
    { top: "30%", left: "40%", d: 0.3 },
    { top: "85%", left: "78%", d: 0.9 },
    { top: "12%", left: "70%", d: 1.5 },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none">
      {dots.map((d, i) => (
        <span
          key={i}
          className="absolute w-1 h-1 rounded-full bg-amber-200"
          style={{
            top: d.top,
            left: d.left,
            boxShadow:
              "0 0 6px rgba(245,215,110,0.9), 0 0 12px rgba(245,215,110,0.5)",
            animation: `mythos-twinkle 3.6s ease-in-out ${d.d}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
