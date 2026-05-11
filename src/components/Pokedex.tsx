import { useMemo } from "react";
import type { AIModel, ModelType } from "../data/types";
import { MODELS as DEFAULT_MODELS, statTotal } from "../data/models";
import { TYPE_META } from "../data/typeMeta";
import { ModelCard } from "./ModelCard";
import { Select } from "./Select";

export type SortKey = "id" | "name" | "lab" | "total" | "context" | "price";

interface Props {
  /** Full model list to show; defaults to the static MODELS export. Apps
   *  pass an augmented list when unlockables (e.g. Mythos) are in play. */
  models?: AIModel[];

  query: string;
  labFilter: string;
  typeFilter: ModelType | "All";
  sortKey: SortKey;

  setQuery: (s: string) => void;
  setLabFilter: (s: string) => void;
  setTypeFilter: (t: ModelType | "All") => void;
  setSortKey: (k: SortKey) => void;

  onSelect: (m: AIModel) => void;
  onCompareToggle: (id: number) => void;
  inCompare: (id: number) => boolean;
}

const ALL_TYPES = Object.keys(TYPE_META) as ModelType[];

export function Pokedex({
  models,
  query,
  labFilter,
  typeFilter,
  sortKey,
  setQuery,
  setLabFilter,
  setTypeFilter,
  setSortKey,
  onSelect,
  onCompareToggle,
  inCompare,
}: Props) {
  const MODELS = models ?? DEFAULT_MODELS;
  const labs = useMemo(
    () => ["All", ...Array.from(new Set(MODELS.map((m) => m.lab)))],
    [MODELS]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = MODELS.filter((m) => {
      if (labFilter !== "All" && m.lab !== labFilter) return false;
      if (typeFilter !== "All" && !m.types.includes(typeFilter)) return false;
      if (
        q &&
        !m.name.toLowerCase().includes(q) &&
        !m.fullName.toLowerCase().includes(q) &&
        !m.lab.toLowerCase().includes(q) &&
        !m.species.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name);
        case "lab":
          return a.lab.localeCompare(b.lab) || a.id - b.id;
        case "total":
          return statTotal(b) - statTotal(a);
        case "context":
          return ctxSort(b) - ctxSort(a);
        case "price":
          return (a.price.input ?? 9999) - (b.price.input ?? 9999);
        default:
          return a.id - b.id;
      }
    });

    return list;
  }, [MODELS, query, labFilter, typeFilter, sortKey]);

  const filtersActive =
    query.trim() !== "" || labFilter !== "All" || typeFilter !== "All";

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <Select
          value={labFilter}
          onChange={setLabFilter}
          options={labs.map((l) => ({ value: l, label: l === "All" ? "All labs" : l }))}
        />
        <Select
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as ModelType | "All")}
          options={[
            { value: "All", label: "All types" },
            ...ALL_TYPES.map((t) => ({ value: t, label: t })),
          ]}
        />
        <Select
          value={sortKey}
          onChange={(v) => setSortKey(v as SortKey)}
          prefix="Sort:"
          options={[
            { value: "id", label: "Dex #" },
            { value: "name", label: "Name" },
            { value: "lab", label: "Lab" },
            { value: "total", label: "Stat total ↓" },
            { value: "context", label: "Context ↓" },
            { value: "price", label: "Price ↑" },
          ]}
        />

        <div className="flex-1" />

        <div className="text-xs font-mono text-ink-500">
          {filtered.length}
          <span className="text-ink-600"> of </span>
          {MODELS.length}
        </div>

        {filtersActive && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setLabFilter("All");
              setTypeFilter("All");
            }}
            className="text-xs text-ink-400 hover:text-white px-2 py-1.5 rounded-md hover:bg-white/[0.05] transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Active type filter chip (quick removal) */}
      {typeFilter !== "All" && (
        <div className="mb-4 flex items-center gap-2 text-xs text-ink-500">
          <span>Filtering by type:</span>
          <button
            type="button"
            onClick={() => setTypeFilter("All")}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-ink-200"
          >
            <span style={{ color: TYPE_META[typeFilter].hex }}>
              {TYPE_META[typeFilter].glyph}
            </span>
            {typeFilter}
            <span className="text-ink-500 ml-0.5">×</span>
          </button>
        </div>
      )}

      {/* Grid: auto-fill ensures cards always reflow nicely at any width */}
      <div
        className="grid gap-2.5"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
      >
        {filtered.map((m) => (
          <ModelCard
            key={m.id}
            model={m}
            onSelect={() => onSelect(m)}
            onCompareToggle={() => onCompareToggle(m.id)}
            inCompare={inCompare(m.id)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-ink-500">
          <div className="text-base">No Pokemodels match your filters.</div>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setLabFilter("All");
              setTypeFilter("All");
            }}
            className="mt-2 text-xs text-pokered-400 hover:text-pokered-300 underline-offset-4 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

function ctxSort(m: AIModel): number {
  const c = m.context.toLowerCase().replace(/[^0-9km.]/g, "");
  const num = parseFloat(c);
  if (Number.isNaN(num)) return 0;
  if (c.includes("m")) return num * 1_000_000;
  if (c.includes("k")) return num * 1_000;
  return num;
}
