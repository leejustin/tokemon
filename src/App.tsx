import { useEffect, useMemo, useState } from "react";
import { MODELS } from "./data/models";
import type { AIModel, ModelType } from "./data/types";
import { Pokedex, type SortKey } from "./components/Pokedex";
import { DexDetail } from "./components/DexDetail";
import { CompareModal } from "./components/CompareModal";
import { CompareDrawer } from "./components/CompareDrawer";
import { DisclaimerLink, FooterDisclaimer } from "./components/Disclaimer";
import { PokedexShell } from "./components/PokedexShell";
import { BattleScene } from "./components/BattleScene";
import { OverflowModal } from "./components/OverflowModal";
import { RedeemPanel } from "./components/RedeemPanel";
import { useLegendary } from "./data/legendary";
import { AdventureView } from "./adventure/AdventureView";

type View = { kind: "grid" } | { kind: "detail"; modelId: number };

const MAX_COMPARE = 4;

function App() {
  // Navigation
  const [view, setView] = useState<View>({ kind: "grid" });
  const [adventureOpen, setAdventureOpen] = useState(false);

  // Filters (persist across grid/detail navigation)
  const [query, setQuery] = useState("");
  const [labFilter, setLabFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState<ModelType | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("id");

  // Compare
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [battleOpen, setBattleOpen] = useState(false);
  /** When the user tries to add a model while the compare list is full, this
   *  holds the incoming model's id; we show a modal asking which existing
   *  model they want to replace. */
  const [overflowIncoming, setOverflowIncoming] = useState<number | null>(null);

  // Legendary unlock state (battle count + per-legendary redemption)
  const legendary = useLegendary();
  const allModels = useMemo<AIModel[]>(
    () => [...MODELS, ...legendary.unlockedModels],
    [legendary.unlockedModels]
  );


  const compareModels = compareIds
    .map((id) => allModels.find((m) => m.id === id))
    .filter((m): m is AIModel => Boolean(m));

  function selectModel(m: AIModel) {
    setView({ kind: "detail", modelId: m.id });
  }

  function openBattle() {
    if (compareModels.length >= 2) {
      legendary.recordBattle();
      setBattleOpen(true);
    }
  }
  function openCompare() {
    if (compareModels.length >= 2) setCompareOpen(true);
  }

  function backToGrid() {
    setView({ kind: "grid" });
  }

  function toggleCompare(id: number) {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) {
        // Don't silently FIFO — ask the user which model to replace
        setOverflowIncoming(id);
        return prev;
      }
      return [...prev, id];
    });
  }

  function replaceWith(removeId: number, addId: number) {
    setCompareIds((prev) => {
      const next = prev.filter((x) => x !== removeId);
      if (!next.includes(addId)) next.push(addId);
      return next;
    });
    setOverflowIncoming(null);
  }

  // Esc closes battle / modal / overflow / detail (in that priority)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (battleOpen) setBattleOpen(false);
      else if (compareOpen) setCompareOpen(false);
      else if (overflowIncoming !== null) setOverflowIncoming(null);
      else if (view.kind === "detail") backToGrid();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [battleOpen, compareOpen, overflowIncoming, view.kind]);

  // Scroll to top on view change
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
  }, [view.kind === "detail" ? view.modelId : null]);

  const detailModel =
    view.kind === "detail"
      ? allModels.find((m) => m.id === view.modelId) ?? null
      : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        query={query}
        setQuery={setQuery}
        compareCount={compareModels.length}
        onOpenCompare={openCompare}
        onOpenBattle={openBattle}
        onOpenAdventure={() => setAdventureOpen(true)}
        onHome={backToGrid}
        showSearch={view.kind === "grid"}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-5 pb-32">
        <PokedexShell>
          <div className="px-4 sm:px-6 py-6">
            {view.kind === "grid" && (
              <Pokedex
                models={allModels}
                query={query}
                labFilter={labFilter}
                typeFilter={typeFilter}
                sortKey={sortKey}
                setQuery={setQuery}
                setLabFilter={setLabFilter}
                setTypeFilter={setTypeFilter}
                setSortKey={setSortKey}
                onSelect={selectModel}
                onCompareToggle={toggleCompare}
                inCompare={(id) => compareIds.includes(id)}
              />
            )}

            {view.kind === "detail" && detailModel && (
              <DexDetail
                model={detailModel}
                onSelect={selectModel}
                onBack={backToGrid}
                onAddCompare={() => toggleCompare(detailModel.id)}
                inCompare={compareIds.includes(detailModel.id)}
              />
            )}
          </div>
        </PokedexShell>
      </main>

      <RedeemPanel state={legendary} />

      <FooterDisclaimer />

      <footer className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 text-xs text-ink-500 border-t border-white/5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-display font-bold text-ink-300 tracking-wider">
              TOKEMON
            </span>
            <span className="mx-2 text-ink-600">·</span>
            A fan-made Pokedex for AI models. Static dataset, no tracking.
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/leejustin/tokemon"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-ink-300 hover:text-white transition-colors"
              aria-label="View Tokemon source on GitHub"
            >
              <svg
                aria-hidden
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1-.02-1.96-3.2.69-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.16 1.18.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.49 3.16-1.18 3.16-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56 4.56-1.52 7.85-5.83 7.85-10.91C23.5 5.65 18.35.5 12 .5z" />
              </svg>
              GitHub
            </a>
            <DisclaimerLink />
          </div>
        </div>
        <p className="text-[11px] text-ink-500/90 leading-snug max-w-3xl">
          <span className="text-amber-300/90 font-mono">Note:</span> this app
          uses your browser's <code className="text-ink-300">localStorage</code>{" "}
          for everything. We blew our database hosting budget on AI credits, so
          this is a static webpage. Your save lives only in this browser, on
          this device. Clearing site data wipes your Pokedex.
        </p>
      </footer>

      <CompareDrawer
        models={compareModels}
        onCompare={openCompare}
        onBattle={openBattle}
        onRemove={(id) => setCompareIds((prev) => prev.filter((x) => x !== id))}
        onClear={() => setCompareIds([])}
        max={MAX_COMPARE}
      />

      {overflowIncoming !== null && (
        <OverflowModal
          current={compareModels}
          incoming={allModels.find((m) => m.id === overflowIncoming) ?? null}
          onCancel={() => setOverflowIncoming(null)}
          onReplace={(removeId) => replaceWith(removeId, overflowIncoming)}
          max={MAX_COMPARE}
        />
      )}

      {battleOpen && compareModels.length >= 2 && (
        <BattleScene
          models={compareModels}
          onClose={() => setBattleOpen(false)}
          onShowDetails={() => {
            setBattleOpen(false);
            setCompareOpen(true);
          }}
        />
      )}

      {compareOpen && (
        <CompareModal
          models={compareModels}
          onClose={() => setCompareOpen(false)}
          onRemove={(id) => setCompareIds((prev) => prev.filter((x) => x !== id))}
        />
      )}

      {adventureOpen && (
        <AdventureView onExit={() => setAdventureOpen(false)} />
      )}
    </div>
  );
}

interface HeaderProps {
  query: string;
  setQuery: (s: string) => void;
  compareCount: number;
  onOpenCompare: () => void;
  onOpenBattle: () => void;
  onOpenAdventure: () => void;
  onHome: () => void;
  showSearch: boolean;
}

function Header({
  query,
  setQuery,
  compareCount,
  onOpenCompare,
  onOpenBattle,
  onOpenAdventure,
  onHome,
  showSearch,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-canvas-base/70 border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <button
          type="button"
          onClick={onHome}
          className="flex items-center gap-2.5 group"
          aria-label="Back to Pokedex"
        >
          <Logo />
          <div className="hidden sm:block">
            <div className="font-display font-black text-white text-sm leading-none tracking-wider group-hover:text-pokered-400 transition-colors">
              TOKEMON
            </div>
            <div className="text-[9px] tracking-[0.3em] text-ink-500 mt-0.5">
              GOTTA BURN 'EM ALL
            </div>
          </div>
        </button>

        <div className="flex-1 flex items-center justify-center">
          {showSearch && (
            <div className="relative w-full max-w-md">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 pointer-events-none"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M21 21l-4.3-4.3M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search models, labs…"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-sm placeholder:text-ink-500 text-white focus:outline-none focus:border-white/20 focus:bg-white/[0.06]"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenAdventure}
            title="Adventure Mode — walk around the meetup"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition bg-amber-400/10 text-amber-200 border-amber-300/30 hover:bg-amber-400/20"
          >
            <span aria-hidden>🎮</span>
            <span className="hidden sm:inline">Adventure</span>
          </button>
          <button
            type="button"
            onClick={onOpenCompare}
            disabled={compareCount < 2}
            title="Compare side-by-side"
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition
              ${
                compareCount < 2
                  ? "bg-white/[0.03] text-ink-500 border-white/5 cursor-not-allowed"
                  : "bg-white/[0.05] text-white border-white/10 hover:bg-white/[0.1]"
              }`}
          >
            <span aria-hidden>📊</span>
            <span className="hidden sm:inline">Compare</span>
          </button>
          <button
            type="button"
            onClick={onOpenBattle}
            disabled={compareCount < 2}
            title="Battle"
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition
              ${
                compareCount < 2
                  ? "bg-white/[0.03] text-ink-500 border-white/5 cursor-not-allowed"
                  : "bg-pokered-500 text-white border-pokered-400 hover:brightness-110"
              }`}
          >
            <span aria-hidden>⚔</span>
            <span className="hidden sm:inline">Battle</span>
            <span
              className={`inline-flex items-center justify-center text-[10px] font-mono rounded-full w-5 h-5 ${
                compareCount === 0 ? "bg-white/[0.03]" : "bg-black/30 text-white"
              }`}
            >
              {compareCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-black/60 shadow-md">
      <div className="absolute inset-0 bg-gradient-to-b from-pokered-500 to-pokered-700" />
      <div className="absolute bottom-0 inset-x-0 h-1/2 bg-white" />
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-black" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white ring-[1.5px] ring-black" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-ink-200 ring-[0.5px] ring-ink-500" />
    </div>
  );
}

export default App;
