import { useCallback, useEffect, useState } from "react";
import { MODELS } from "../data/models";
import type { AIModel } from "../data/types";
import { SCENES } from "./data";
import type { SceneId } from "./scenes";
import { LEGENDARIES } from "../data/legendary";

/**
 * Persistent adventure state. Whole save is just a small JSON blob in
 * localStorage so we don't accidentally lose progress on refresh.
 *
 * Schema is versioned — if the shape changes incompatibly, bumping the
 * version drops old saves rather than rendering broken state.
 */

const LS_KEY = "tokemon.adventure.v1";

const STARTING_CREDITS = 5;
export const MAX_HP = 100;

export interface AdventureSave {
  /** fullName of partner AIModel, or null if not yet chosen. */
  partnerFullName: string | null;
  partnerHP: number;
  credits: number;
  defeated: string[];
  /** Every NPC the player has *initiated* a battle with (win or loss).
   *  Used to unlock Mythos by simply showing up to every trainer. */
  engaged: string[];
  /** Talk-NPC ids the player has already met (one-time intro lines). */
  metTalk: string[];
  /** Vendor-NPC ids the player has already paid (one-time transactions). */
  paidVendor: string[];
  metHeal: boolean;
  totalBattles: number;
  blackouts: number;
  /** Has the player received the kayak yet? Enables water tiles. */
  hasKayak: boolean;
}

const DEFAULT_SAVE: AdventureSave = {
  partnerFullName: null,
  partnerHP: MAX_HP,
  credits: STARTING_CREDITS,
  defeated: [],
  engaged: [],
  metTalk: [],
  paidVendor: [],
  metHeal: false,
  totalBattles: 0,
  blackouts: 0,
  hasKayak: false,
};

function readSave(): AdventureSave {
  try {
    if (typeof window === "undefined") return DEFAULT_SAVE;
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_SAVE;
    const parsed = JSON.parse(raw) as Partial<AdventureSave>;
    return { ...DEFAULT_SAVE, ...parsed };
  } catch {
    return DEFAULT_SAVE;
  }
}

function writeSave(save: AdventureSave): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS_KEY, JSON.stringify(save));
    }
  } catch {
    /* private mode / quota — fine */
  }
}

/* ─── Hook ────────────────────────────────────────────────────────── */

export interface AdventureState {
  save: AdventureSave;
  partner: AIModel | null;

  setPartner: (model: AIModel) => void;
  applyBattleResult: (args: {
    won: boolean;
    npcId: string;
    finalPlayerHP: number;
    reward: number;
    tokensBurned: number;
  }) => void;
  /** Pay $cost for a full heal. Returns true if the transaction succeeded. */
  heal: (cost: number) => boolean;
  /** Free top-up from a friendly NPC. */
  grantCredits: (amount: number) => void;
  markMetHeal: () => void;
  /** Grant the kayak so the player can paddle on water tiles. */
  grantKayak: () => void;
  /** Mark an NPC as defeated. Used by wild encounters. */
  markDefeated: (npcId: string) => void;
  /** Mark an NPC as engaged (battle started, win or loss). */
  markEngaged: (npcId: string) => void;
  /** Mark a talk-only NPC as already met. */
  markTalked: (npcId: string) => void;
  /** Drain *all* current credits (and remember it). Returns drained amount. */
  drainCreditsOnce: (npcId: string) => number;
  /** Mark a vendor/VC NPC as already transacted-with, without touching
   *  credits. Used by the VC NPC where we *grant* money instead of taking. */
  markPaidVendor: (npcId: string) => void;
  /** Wipes the save (used by the "New game" button). */
  reset: () => void;
}

export function useAdventure(): AdventureState {
  const [save, setSave] = useState<AdventureSave>(() => readSave());

  // Cross-tab sync so the adventure stays in step
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === LS_KEY) setSave(readSave());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Persist whenever it changes
  useEffect(() => {
    writeSave(save);
  }, [save]);

  // Partner can be a regular roster model OR an unlocked mythical
  // (mythicals live in legendary.ts, not MODELS). Search both pools so a
  // saved mythical partner like "grok-colossus" still resolves on reload.
  const partner = save.partnerFullName
    ? (MODELS.find((m) => m.fullName === save.partnerFullName) ??
        LEGENDARIES.find((l) => l.model.fullName === save.partnerFullName)
          ?.model ??
        null)
    : null;

  const setPartner = useCallback((model: AIModel) => {
    setSave((s) => ({
      ...s,
      partnerFullName: model.fullName,
      partnerHP: MAX_HP,
    }));
  }, []);

  const applyBattleResult = useCallback<
    AdventureState["applyBattleResult"]
  >((args) => {
    setSave((s) => {
      const nextCredits = Math.max(
        0,
        s.credits - args.tokensBurned + (args.won ? args.reward : 0)
      );
      const fainted = args.finalPlayerHP <= 0;
      // Blackout: lose half credits, respawn with half HP — see SPAWN handler
      // in AdventureView for the visible side-effect (returning to entrance).
      if (fainted) {
        return {
          ...s,
          partnerHP: Math.round(MAX_HP * 0.5),
          credits: Math.floor(nextCredits * 0.5),
          totalBattles: s.totalBattles + 1,
          blackouts: s.blackouts + 1,
          defeated:
            args.won && !s.defeated.includes(args.npcId)
              ? [...s.defeated, args.npcId]
              : s.defeated,
        };
      }
      return {
        ...s,
        partnerHP: Math.max(0, args.finalPlayerHP),
        credits: nextCredits,
        totalBattles: s.totalBattles + 1,
        defeated:
          args.won && !s.defeated.includes(args.npcId)
            ? [...s.defeated, args.npcId]
            : s.defeated,
      };
    });
  }, []);

  const heal = useCallback((cost: number): boolean => {
    let ok = false;
    setSave((s) => {
      if (s.credits < cost) return s;
      ok = true;
      return { ...s, credits: s.credits - cost, partnerHP: MAX_HP };
    });
    return ok;
  }, []);

  const grantCredits = useCallback((amount: number) => {
    setSave((s) => ({ ...s, credits: s.credits + amount }));
  }, []);

  const markMetHeal = useCallback(() => {
    setSave((s) => (s.metHeal ? s : { ...s, metHeal: true }));
  }, []);

  const grantKayak = useCallback(() => {
    setSave((s) => (s.hasKayak ? s : { ...s, hasKayak: true }));
  }, []);

  const markDefeated = useCallback((npcId: string) => {
    setSave((s) =>
      s.defeated.includes(npcId)
        ? s
        : { ...s, defeated: [...s.defeated, npcId] }
    );
  }, []);

  const markEngaged = useCallback((npcId: string) => {
    setSave((s) =>
      s.engaged.includes(npcId)
        ? s
        : { ...s, engaged: [...s.engaged, npcId] }
    );
  }, []);

  const markTalked = useCallback((npcId: string) => {
    setSave((s) =>
      s.metTalk.includes(npcId)
        ? s
        : { ...s, metTalk: [...s.metTalk, npcId] }
    );
  }, []);

  const markPaidVendor = useCallback((npcId: string) => {
    setSave((s) =>
      s.paidVendor.includes(npcId)
        ? s
        : { ...s, paidVendor: [...s.paidVendor, npcId] }
    );
  }, []);

  const drainCreditsOnce = useCallback((npcId: string): number => {
    let drained = 0;
    setSave((s) => {
      if (s.paidVendor.includes(npcId)) return s;
      drained = s.credits;
      return {
        ...s,
        credits: 0,
        paidVendor: [...s.paidVendor, npcId],
      };
    });
    return drained;
  }, []);

  const reset = useCallback(() => {
    setSave({ ...DEFAULT_SAVE });
  }, []);

  return {
    save,
    partner,
    setPartner,
    applyBattleResult,
    heal,
    grantCredits,
    markMetHeal,
    grantKayak,
    markDefeated,
    markEngaged,
    markTalked,
    drainCreditsOnce,
    markPaidVendor,
    reset,
  };
}

/** Spawn point for a scene id. */
export function spawnFor(sceneId: SceneId): { x: number; y: number } {
  return SCENES[sceneId].spawn;
}
