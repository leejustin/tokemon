import type { NPC, TileKind } from "./data";

/**
 * Multi-scene support for adventure mode.
 *
 * Each `Scene` is a self-contained map with its own tiles, NPCs, exits, and
 * encounter table. Scenes are linked via `exits` keyed by an `(x, y)` tile —
 * stepping onto an exit tile teleports you to another scene at a chosen spawn.
 *
 * Encounters fire when the player steps onto a tile of an `encounterKind`
 * (used by Pier 67's open water for MemoryNo).
 */

export interface SceneExit {
  toScene: SceneId;
  /** Where to drop the player in the destination scene. */
  to: { x: number; y: number };
  /** Which direction the player should face after the transition. */
  facing?: "up" | "down" | "left" | "right";
  /** Optional system line shown after the transition. */
  banner?: string;
}

export interface SceneEncounter {
  /** Trigger when stepping onto these tile kinds. */
  onTile: TileKind[];
  /** 0..1 chance per step. */
  chance: number;
  /** Which NPC to "spawn" for the battle. */
  npcId: string;
  /** Required state: player must have the kayak to encounter on water. */
  requiresKayak?: boolean;
  /** Repeatable. Won't fire again if this id is in `save.defeated`. */
  oneShot?: boolean;
}

export type SceneId = "office" | "pier";

export interface Scene {
  id: SceneId;
  /** Pretty title shown in the HUD. */
  title: string;
  /** Map source — see `parseMap`. */
  source: string[];
  /** Where the player spawns when entering "fresh" (used as fallback). */
  spawn: { x: number; y: number };
  /** All NPCs in this scene. */
  npcs: NPC[];
  /** Exits keyed by "x,y". */
  exits: Record<string, SceneExit>;
  /** Random / step-triggered encounters. */
  encounters?: SceneEncounter[];
  /** Overrides which char-codes map to which tile kinds for this scene. */
  charMap?: Partial<Record<string, TileKind>>;
}

export const DEFAULT_CHAR_MAP: Record<string, TileKind> = {
  "#": "wall",
  ".": "floor",
  ",": "rug",
  d: "door",
  b: "bar",
  k: "kitchen",
  p: "plant",
  c: "couch",
  t: "table",
  s: "stand",
  m: "monitor",
  w: "whiteboard",
  "@": "floor",
  "~": "water",
  "=": "boardwalk",
  "/": "sand",
  "T": "truck",
  X: "exit",
};

export function parseMap(
  source: string[],
  override: Partial<Record<string, TileKind>> = {}
): TileKind[][] {
  const map: Record<string, TileKind | undefined> = {
    ...DEFAULT_CHAR_MAP,
    ...override,
  };
  return source.map((row) =>
    row.split("").map((ch) => map[ch] ?? "floor")
  );
}

export function findCharIn(
  source: string[],
  ch: string
): { x: number; y: number } | null {
  for (let y = 0; y < source.length; y++) {
    const x = source[y].indexOf(ch);
    if (x !== -1) return { x, y };
  }
  return null;
}
