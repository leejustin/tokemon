import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

/**
 * The iconic red Pokedex chassis, wrapped around the main content area.
 *
 * Design goals:
 *  - Frame the app, don't trap it. The shell is decorative chrome.
 *  - On large screens (>= lg), full chrome: blue lens, LEDs, hinge, speaker.
 *  - On small screens, the chrome collapses to a thin red header strip with
 *    the lens + LEDs so the content area still reads as "inside a Pokedex".
 *  - The "screen" interior is dark and lets the existing UI live as-is.
 */
export function PokedexShell({ children }: Props) {
  return (
    <div className="relative">
      {/* ─── Desktop chrome (lg+) ────────────────────────────────────────── */}
      <div className="hidden lg:block">
        <div
          className="relative rounded-[28px] p-5"
          style={{
            background:
              "linear-gradient(145deg, #ef4444 0%, #dc2626 35%, #b91c1c 70%, #7f1d1d 100%)",
            boxShadow:
              "0 30px 60px -20px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -3px 0 rgba(0,0,0,0.35)",
          }}
        >
          {/* Top instrument cluster: blue lens + LEDs */}
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-3">
              <BlueLens />
              <div className="flex items-center gap-1.5">
                <LED color="#f87171" />
                <LED color="#fbbf24" />
                <LED color="#4ade80" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Pokedex grille (decorative speaker pattern) */}
              <Grille rows={3} cols={6} />
              {/* Hinge / latch */}
              <div className="flex flex-col gap-1 ml-2">
                <Stud />
                <Stud />
              </div>
            </div>
          </div>

          {/* Inner "screen" */}
          <ScreenSurface>{children}</ScreenSurface>

          {/* Bottom bezel: D-pad + buttons (decorative) */}
          <div className="flex items-center justify-between mt-4 px-1">
            <DPad />
            <div className="flex items-center gap-2">
              <RoundButton color="#0ea5e9" label="A" />
              <RoundButton color="#1e293b" label="B" />
            </div>
          </div>

          {/* Right-edge "hinge" stripe so it reads as a clamshell device */}
          <div
            className="absolute top-3 bottom-3 right-0 w-1.5 rounded-r-[28px]"
            style={{
              background:
                "linear-gradient(180deg, #450a0a, #7f1d1d 40%, #450a0a 100%)",
            }}
          />
        </div>
      </div>

      {/* ─── Mobile chrome (< lg) ────────────────────────────────────────── */}
      <div className="lg:hidden">
        <div
          className="relative rounded-2xl p-2.5"
          style={{
            background:
              "linear-gradient(145deg, #ef4444 0%, #dc2626 50%, #991b1b 100%)",
            boxShadow:
              "0 10px 30px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 0 rgba(0,0,0,0.3)",
          }}
        >
          {/* compact instrument strip */}
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <BlueLens size={28} />
              <div className="flex items-center gap-1">
                <LED color="#f87171" size={6} />
                <LED color="#fbbf24" size={6} />
                <LED color="#4ade80" size={6} />
              </div>
            </div>
            <Grille rows={2} cols={5} />
          </div>

          <ScreenSurface>{children}</ScreenSurface>
        </div>
      </div>
    </div>
  );
}

/* ─── Pieces ───────────────────────────────────────────────────────── */

function ScreenSurface({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: "#07090d",
        boxShadow:
          "inset 0 0 0 2px #0a0c12, inset 0 0 0 4px #1f1217, inset 0 0 28px rgba(0,0,0,0.65)",
      }}
    >
      {children}
    </div>
  );
}

function BlueLens({ size = 56 }: { size?: number }) {
  // Classic Pokedex blue camera lens with white hot-spot
  return (
    <div
      className="relative rounded-full"
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 35% 30%, #93c5fd 0%, #3b82f6 40%, #1d4ed8 75%, #0c1f4f 100%)",
        boxShadow:
          "inset 0 -3px 6px rgba(0,0,0,0.45), inset 0 2px 4px rgba(255,255,255,0.45), 0 2px 6px rgba(0,0,0,0.5), 0 0 0 3px #f8fafc, 0 0 0 5px #1e293b",
      }}
    >
      {/* highlight */}
      <span
        className="absolute rounded-full bg-white/85"
        style={{
          width: size * 0.22,
          height: size * 0.18,
          top: size * 0.18,
          left: size * 0.22,
          filter: "blur(0.5px)",
        }}
      />
      {/* secondary glint */}
      <span
        className="absolute rounded-full bg-white/40"
        style={{
          width: size * 0.1,
          height: size * 0.08,
          bottom: size * 0.18,
          right: size * 0.22,
        }}
      />
    </div>
  );
}

function LED({ color, size = 10 }: { color: string; size?: number }) {
  return (
    <span
      className="rounded-full inline-block"
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 1px rgba(0,0,0,0.35), 0 0 6px ${color}99, 0 0 0 1.5px rgba(0,0,0,0.35)`,
      }}
    />
  );
}

function Grille({ rows, cols }: { rows: number; cols: number }) {
  const dots: React.ReactElement[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push(
        <span
          key={`${r}-${c}`}
          className="rounded-full bg-pokered-900/80"
          style={{
            width: 4,
            height: 4,
            boxShadow:
              "inset 0 1px 0 rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.15)",
          }}
        />
      );
    }
  }
  return (
    <div
      className="grid gap-1.5 p-1.5 rounded"
      style={{
        gridTemplateColumns: `repeat(${cols}, 4px)`,
        background:
          "linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.05))",
        boxShadow: "inset 0 1px 0 rgba(0,0,0,0.25)",
      }}
    >
      {dots}
    </div>
  );
}

function Stud() {
  return (
    <span
      className="block rounded-full"
      style={{
        width: 6,
        height: 6,
        background: "#7f1d1d",
        boxShadow:
          "inset 0 1px 1px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.15)",
      }}
    />
  );
}

function DPad() {
  return (
    <div className="relative" style={{ width: 36, height: 36 }} aria-hidden>
      {/* horizontal */}
      <div
        className="absolute top-1/2 left-0 -translate-y-1/2 rounded-sm"
        style={{
          width: 36,
          height: 12,
          background:
            "linear-gradient(180deg, #0f172a, #020617)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 0 rgba(255,255,255,0.05)",
        }}
      />
      {/* vertical */}
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2 rounded-sm"
        style={{
          width: 12,
          height: 36,
          background:
            "linear-gradient(90deg, #0f172a, #020617)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 0 rgba(255,255,255,0.05)",
        }}
      />
      {/* center */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 8,
          height: 8,
          background: "#1e293b",
        }}
      />
    </div>
  );
}

function RoundButton({ color, label }: { color: string; label: string }) {
  return (
    <div
      className="relative rounded-full flex items-center justify-center"
      style={{
        width: 24,
        height: 24,
        background: `radial-gradient(circle at 35% 30%, ${lighten(color, 0.4)}, ${color} 60%, ${darken(color, 0.4)})`,
        boxShadow:
          "inset 0 -1px 2px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.25), 0 1px 2px rgba(0,0,0,0.5)",
      }}
      aria-hidden
    >
      <span
        className="text-[8px] font-display font-black"
        style={{ color: "rgba(255,255,255,0.85)" }}
      >
        {label}
      </span>
    </div>
  );
}

/* ─── tiny color helpers ──────────────────────────────────────────── */

function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}
function parseHex(hex: string): [number, number, number] {
  const c = hex.replace("#", "");
  return [
    parseInt(c.slice(0, 2), 16),
    parseInt(c.slice(2, 4), 16),
    parseInt(c.slice(4, 6), 16),
  ];
}
function toHex(rgb: [number, number, number]) {
  return "#" + rgb.map((v) => clamp(v).toString(16).padStart(2, "0")).join("");
}
function lighten(hex: string, amt: number): string {
  const [r, g, b] = parseHex(hex);
  return toHex([r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt]);
}
function darken(hex: string, amt: number): string {
  const [r, g, b] = parseHex(hex);
  return toHex([r * (1 - amt), g * (1 - amt), b * (1 - amt)]);
}
