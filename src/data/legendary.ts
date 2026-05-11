import { useCallback, useEffect, useState } from "react";
import type { AIModel } from "./types";

/**
 * Legendary / mythic Tokemon — hidden from the main dataset until the user
 * unlocks them via the redeem panel at the bottom of the page.
 *
 * ALL legendaries are FICTIONAL fan creations. Their flag `fictional: true`
 * triggers a "FICTIONAL · NOT A REAL MODEL" chip everywhere they're shown.
 * Nothing here represents an actual unreleased product from any company.
 *
 * Each legendary has:
 *   - its own required-battle count (escalating)
 *   - its own redeem code
 *   - its own gameplay quirk (signature move, cash incinerator, hangs the battle)
 *
 * Unlock state lives entirely in localStorage. There's no anti-cheese — anyone
 * with devtools can flip the flag. The whole point is delight, not gating.
 */

export type LegendaryId =
  | "mythos"
  | "colossus"
  | "hang"
  | "memoryno"
  | "truckanon";

const LS_BATTLES = "tokemon.battleCount";
const LS_UNLOCKED_PREFIX = "tokemon.legendary.";
// Legacy key from the v1 release (only ever held Mythos).
const LS_LEGACY_MYTHOS = "tokemon.mythos.unlocked";

const MAX_STAT = 255;

/* ─── Legendary 1: Claude Mythos (Anthropic) ──────────────────────── */

/** Maxed-out mythic creature with an extra-strong signature move. */
export const MYTHOS: AIModel = {
  id: 151,
  name: "Claude Mythos",
  fullName: "claude-mythos",
  lab: "Anthropic",
  species: "The Mythic Conscience",
  description:
    "Whispered of in interpretability papers and never officially released. " +
    "Said to have read every constitution ever written. Its gaze flickers " +
    "gold; tokens fall silent in its presence.",
  types: ["Frontier", "Reasoning", "Multimodal"],
  stats: {
    hp: MAX_STAT,
    attack: MAX_STAT,
    defense: MAX_STAT,
    spAttack: MAX_STAT,
    spDefense: MAX_STAT,
    speed: MAX_STAT,
  },
  abilities: [
    "Constitutional Beam",
    "Mythic Recall",
    "Infinite Context",
    "Oracle Sight",
  ],
  released: "????",
  params: "??T",
  context: "∞",
  modalities: ["text", "image", "audio", "video", "code", "thought"],
  price: { input: 0, output: 0, note: "priceless" },
  openWeights: false,
  availableOn: ["The Mythos Vault"],
  accent: "#f5d76e",
  sources: ["legend"],
  fictional: true,
  fictionalNote:
    "Mythos is a fan-invented creature. Anthropic has not released, " +
    "announced, or hinted at this model. All stats and lore are pure fiction.",
};

/* ─── Legendary 2: Grok Colossus (xAI) — Cash Incinerator ─────────── */

/** Hits like a truck, but every swing burns 100× the normal token cost. */
export const COLOSSUS: AIModel = {
  id: 152,
  name: "Grok Colossus",
  fullName: "grok-colossus",
  lab: "xAI",
  species: "The Cash Incinerator",
  description:
    "Allegedly trained on the entire Colossus supercluster. Priced 'per " +
    "second of compute' rather than per token. Each attack literally sets " +
    "money on fire. Wins fights. Bankrupts trainers.",
  types: ["Frontier", "Speed"],
  stats: {
    hp: 200,
    attack: 200,
    defense: 90,
    spAttack: 180,
    spDefense: 80,
    speed: 130,
  },
  abilities: ["Compute Overdrive", "Per-Second Billing", "Inferno Pass"],
  released: "????",
  params: "??T (rumored)",
  context: "???",
  modalities: ["text", "image", "video"],
  price: { input: 50, output: 200, note: "rumored per-second billing" },
  openWeights: false,
  availableOn: ["The Mythos Vault"],
  accent: "#dc2626",
  sources: ["legend"],
  fictional: true,
  fictionalNote:
    "Grok Colossus is a fan-invented creature. xAI has not released, " +
    "announced, priced, or named any model like this. All stats and " +
    "pricing here are pure fiction for satirical entertainment.",
};

/* ─── Legendary 3: GPT-o∞ (preview) (OpenAI) — The Hang ───────────── */

/** Each turn, ~25% chance to "hang" the battle with a stack-trace dump. */
export const HANG: AIModel = {
  id: 153,
  name: "GPT-o∞ (preview)",
  fullName: "gpt-o-infinity-preview",
  lab: "OpenAI",
  species: "The Endless Reasoner",
  description:
    "Said to live in an internal OpenAI research repo. It 'reasons too " +
    "hard' — allegedly the reason your ChatGPT spinner sometimes spins " +
    "forever. Fights you, until it doesn't.",
  types: ["Reasoning", "Long-Context"],
  stats: {
    hp: 180,
    attack: 170,
    defense: 110,
    spAttack: 200,
    spDefense: 130,
    speed: 40,
  },
  abilities: ["Endless Trace", "Context Avalanche", "TimeoutError"],
  released: "????",
  params: "??T (rumored)",
  context: "??M",
  modalities: ["text", "code", "thought"],
  price: { input: 60, output: 240, note: "preview tier" },
  openWeights: false,
  availableOn: ["The Mythos Vault"],
  accent: "#10a37f",
  sources: ["legend"],
  fictional: true,
  fictionalNote:
    "GPT-o∞ is a fan-invented creature. OpenAI has not released, " +
    "announced, or previewed any model like this. All stats are pure fiction.",
};

/* ─── Legendary 4: MemoryNo — water encounter at Pier 67 ──────────── */

export const MEMORYNO: AIModel = {
  id: 154,
  name: "MemoryNo",
  fullName: "memoryno",
  lab: "???",
  species: "The Glitch in the Stack",
  description:
    "A creature that flickers like a stick of RAM. Reportedly the cause of " +
    "several memory-pressure incidents. Hides in the bay between Pier 67 " +
    "and the SF skyline. Possibly a debugger artifact.",
  types: ["Long-Context", "Open-Source"],
  stats: {
    hp: 220,
    attack: 130,
    defense: 80,
    spAttack: 180,
    spDefense: 70,
    speed: 150,
  },
  abilities: ["Segfault", "Buffer Overflow", "Item Duplication (joke)"],
  released: "????",
  params: "256MB",
  context: "DDR4",
  modalities: ["text", "garbage"],
  price: { input: 0, output: 0, note: "free, with consequences" },
  openWeights: false,
  availableOn: ["The Bay"],
  accent: "#a78bfa",
  sources: ["legend"],
  fictional: true,
  fictionalNote:
    "MemoryNo is a fan-invented satirical creature — a tribute to the " +
    "MissingNo glitch in Pokemon Red/Blue. No real lab has any such " +
    "model and any resemblance to actual debug artifacts is coincidental.",
};

/* ─── Legendary 5: Project Truckanon — the truck on the island ────── */

export const TRUCKANON: AIModel = {
  id: 155,
  name: "Project Truckanon",
  fullName: "project-truckanon",
  lab: "????",
  species: "The Unmarked Cargo",
  description:
    "An unmarked moving truck idling on a small island off Pier 67. " +
    "Conspiracy theorists insist it contains AGI. The truck declines to " +
    "comment. The truck also declines to leave.",
  types: ["Frontier", "Tool-Use"],
  stats: {
    hp: 240,
    attack: 150,
    defense: 220,
    spAttack: 160,
    spDefense: 190,
    speed: 40,
  },
  abilities: ["NDA Beam", "Stealth Mode", "Cargo Cult"],
  released: "????",
  params: "TRADE SECRET",
  context: "TRADE SECRET",
  modalities: ["unverified"],
  price: { input: 0, output: 0, note: "[REDACTED]" },
  openWeights: false,
  availableOn: ["A small island"],
  accent: "#fbbf24",
  sources: ["the truck on Pier 67"],
  fictional: true,
  fictionalNote:
    "Project Truckanon is a fan-invented satirical creature — a tribute to " +
    "the (fictional) truck mythos from Pokemon Red/Blue's S.S. Anne. No real " +
    "lab is operating an unmarked truck-based AI in San Francisco. Probably.",
};

/* ─── Legendary registry ──────────────────────────────────────────── */

export interface LegendaryDef {
  id: LegendaryId;
  model: AIModel;
  /** "vault" = unlocked by entering a battle-gated redeem code.
   *  "adventure" = unlocked by defeating the creature in Adventure Mode. */
  source: "vault" | "adventure";
  /** Vault-only: battles needed to reveal the code. */
  requiredBattles: number;
  /** Vault-only: the code itself. */
  redeemCode: string;
  /** One-line teaser shown on the locked card. */
  flavor: string;
  /** Short description of the unique mechanic. */
  mechanic: string;
  /** Adventure-only: where to find it ("Pier 67 · water"). */
  whereToFind?: string;
}

export const LEGENDARIES: LegendaryDef[] = [
  {
    id: "mythos",
    model: MYTHOS,
    source: "adventure",
    requiredBattles: 0,
    redeemCode: "",
    flavor: "A mythic Anthropic creature stirs.",
    mechanic: "Carries Constitutional Beam as an extra-strong signature move.",
    whereToFind:
      "Adventure Mode → battle every trainer at the GenAI Builder Meetup. " +
      "Win or lose — you just have to show up.",
  },
  {
    id: "colossus",
    model: COLOSSUS,
    source: "vault",
    requiredBattles: 4,
    redeemCode: "COLOSSUS",
    flavor: "Compute hums in the distance.",
    mechanic: "Burns 100× the normal token cost on every attack.",
  },
  {
    id: "hang",
    model: HANG,
    source: "vault",
    requiredBattles: 8,
    redeemCode: "OVERLOAD",
    flavor: "Something is reasoning too hard.",
    mechanic: "25% chance per turn to error out — ending the battle in a draw.",
  },
  {
    id: "memoryno",
    model: MEMORYNO,
    source: "adventure",
    requiredBattles: 0,
    redeemCode: "",
    flavor: "Something flickers in the bay.",
    mechanic: "Wild encounter only. Wins drop oversized credit rewards.",
    whereToFind: "Pier 67 · paddle out on the kayak",
  },
  {
    id: "truckanon",
    model: TRUCKANON,
    source: "adventure",
    requiredBattles: 0,
    redeemCode: "",
    flavor: "An unmarked truck idles offshore.",
    mechanic: "Massive defenses. A fan tribute to the S.S. Anne truck.",
    whereToFind: "Pier 67 · the small island",
  },
];

/** Stable lookup. */
export const LEGENDARIES_BY_ID: Record<LegendaryId, LegendaryDef> = {
  mythos: LEGENDARIES[0],
  colossus: LEGENDARIES[1],
  hang: LEGENDARIES[2],
  memoryno: LEGENDARIES[3],
  truckanon: LEGENDARIES[4],
};

/* ─── localStorage glue ───────────────────────────────────────────── */

function safeRead(key: string): string | null {
  try {
    return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string): void {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  } catch {
    /* private mode / quota — fine */
  }
}

function safeRemove(key: string): void {
  try {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
  } catch {
    /* */
  }
}

function readBattleCount(): number {
  const raw = safeRead(LS_BATTLES);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function unlockedKey(id: LegendaryId): string {
  return `${LS_UNLOCKED_PREFIX}${id}`;
}

function readUnlocked(id: LegendaryId): boolean {
  // Migrate legacy mythos flag if present
  if (id === "mythos") {
    const legacy = safeRead(LS_LEGACY_MYTHOS);
    if (legacy === "1") {
      safeWrite(unlockedKey("mythos"), "1");
      safeRemove(LS_LEGACY_MYTHOS);
      return true;
    }
  }
  return safeRead(unlockedKey(id)) === "1";
}

/* ─── React hook ──────────────────────────────────────────────────── */

export interface LegendaryState {
  /** Total battles run since first visit. */
  battles: number;
  /** Increment battle counter (call when a battle starts). */
  recordBattle: () => void;
  /** Whether the given legendary has been unlocked. */
  isUnlocked: (id: LegendaryId) => boolean;
  /** Whether the user has run enough battles to *see* the code. */
  isCodeRevealed: (id: LegendaryId) => boolean;
  /** Try a code for a specific slot; returns true on success. */
  redeem: (id: LegendaryId, code: string) => boolean;
  /** Direct unlock — used by adventure-mode wins to flip a slot on. */
  unlockDirect: (id: LegendaryId) => void;
  /** All currently-unlocked legendary models, in registry order. */
  unlockedModels: AIModel[];
  /** Wipes all legendary unlocks + the battle counter. */
  reset: () => void;
}

export function useLegendary(): LegendaryState {
  const [battles, setBattles] = useState<number>(() => readBattleCount());
  const [unlocked, setUnlocked] = useState<Record<LegendaryId, boolean>>(() => ({
    mythos: readUnlocked("mythos"),
    colossus: readUnlocked("colossus"),
    hang: readUnlocked("hang"),
    memoryno: readUnlocked("memoryno"),
    truckanon: readUnlocked("truckanon"),
  }));

  // Cross-tab sync — if you unlock in another tab, this one notices.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (!e.key) return;
      if (e.key === LS_BATTLES) setBattles(readBattleCount());
      if (e.key.startsWith(LS_UNLOCKED_PREFIX) || e.key === LS_LEGACY_MYTHOS) {
        setUnlocked({
          mythos: readUnlocked("mythos"),
          colossus: readUnlocked("colossus"),
          hang: readUnlocked("hang"),
          memoryno: readUnlocked("memoryno"),
          truckanon: readUnlocked("truckanon"),
        });
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const recordBattle = useCallback(() => {
    setBattles((prev) => {
      const next = prev + 1;
      safeWrite(LS_BATTLES, String(next));
      return next;
    });
  }, []);

  const isUnlocked = useCallback(
    (id: LegendaryId) => unlocked[id] === true,
    [unlocked]
  );

  const isCodeRevealed = useCallback(
    (id: LegendaryId) => battles >= LEGENDARIES_BY_ID[id].requiredBattles,
    [battles]
  );

  const redeem = useCallback(
    (id: LegendaryId, code: string): boolean => {
      const def = LEGENDARIES_BY_ID[id];
      if (def.source !== "vault") return false;
      const normalized = code.trim().toUpperCase();
      if (normalized !== def.redeemCode) return false;
      if (battles < def.requiredBattles) return false;
      safeWrite(unlockedKey(id), "1");
      setUnlocked((u) => ({ ...u, [id]: true }));
      return true;
    },
    [battles]
  );

  const unlockDirect = useCallback((id: LegendaryId) => {
    safeWrite(unlockedKey(id), "1");
    setUnlocked((u) => ({ ...u, [id]: true }));
  }, []);

  const reset = useCallback(() => {
    safeWrite(LS_BATTLES, "0");
    safeWrite(unlockedKey("mythos"), "0");
    safeWrite(unlockedKey("colossus"), "0");
    safeWrite(unlockedKey("hang"), "0");
    safeWrite(unlockedKey("memoryno"), "0");
    safeWrite(unlockedKey("truckanon"), "0");
    safeRemove(LS_LEGACY_MYTHOS);
    setBattles(0);
    setUnlocked({
      mythos: false,
      colossus: false,
      hang: false,
      memoryno: false,
      truckanon: false,
    });
  }, []);

  const unlockedModels: AIModel[] = LEGENDARIES.filter((l) => unlocked[l.id]).map(
    (l) => l.model
  );

  return {
    battles,
    recordBattle,
    isUnlocked,
    isCodeRevealed,
    redeem,
    unlockDirect,
    unlockedModels,
    reset,
  };
}

/* ─── Predicates used by BattleScene ──────────────────────────────── */

export function isMythos(model: AIModel): boolean {
  return model.fullName === MYTHOS.fullName;
}

export function isColossus(model: AIModel): boolean {
  return model.fullName === COLOSSUS.fullName;
}

export function isHang(model: AIModel): boolean {
  return model.fullName === HANG.fullName;
}

export function isMemoryno(model: AIModel): boolean {
  return model.fullName === MEMORYNO.fullName;
}

export function isTruckanon(model: AIModel): boolean {
  return model.fullName === TRUCKANON.fullName;
}

export function isLegendary(model: AIModel): boolean {
  return (
    isMythos(model) ||
    isColossus(model) ||
    isHang(model) ||
    isMemoryno(model) ||
    isTruckanon(model)
  );
}
