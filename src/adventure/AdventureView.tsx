import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AIModel } from "../data/types";
import {
  BLACKOUT_LINES,
  BRAD_PITCH_AMOUNT,
  KAYAK_WALKABLE,
  NO_CREDITS_LINE,
  PIER_WELCOME_LINES,
  SCENES,
  TILE_FLAVOR,
  WALKABLE,
  WELCOME_LINES,
  WILD_NPCS,
  bradPitchFor,
  findKnownNPC,
  findNPCAt,
  npcModel,
  type Facing,
  type NPC,
  type TileKind,
} from "./data";
import {
  parseMap,
  type SceneEncounter,
  type SceneId,
} from "./scenes";
import { useAdventure, MAX_HP } from "./useAdventure";
import { useLegendary, type LegendaryId } from "../data/legendary";
import { PartnerPicker } from "./PartnerPicker";
import { BattleScene } from "../components/BattleScene";
import { ModelEmblem } from "../components/ModelEmblem";
import { PixelSprite } from "../components/PixelSprite";
import { getNPCSprite, sp_player } from "./sprites";
import {
  clarificationReply,
  confirmReply,
  greetingReply,
  parseChatCommand,
} from "./chatPilot";

const TILE_SIZE = 32;
const SPRITE_SIZE = 28;

/** Soft minimum px size for the rendered Game Boy "screen" — below this the
 *  map gets unreadable on tiny viewports. We let it shrink anyway because the
 *  whole device still needs to fit, but never bigger than this. */
const SCREEN_MAX_W = 480;
const SCREEN_MAX_H = 432;

/** Total battle-NPC count across all scenes, used by the HUD's defeated/total
 *  counter. Computed once at module load — adding a new scene auto-updates it. */
const TOTAL_BATTLE_NPCS = Object.values(SCENES).reduce(
  (n, s) => n + s.npcs.filter((x) => x.role === "battle").length,
  0
);
const MYTHOS_REQUIRED_NPC_IDS = SCENES.office.npcs
  .filter((x) => x.role === "battle")
  .map((x) => x.id);
const MYTHOS_UNLOCK_LINES = [
  "Every meetup trainer has seen what your modelmon can do.",
  "(Mythical added to your Modeldex as #151: Claude Mythos.)",
];
const OAKLAND_WARNING_LINE =
  "Be careful, that direction leads to Oakland. Let's not go there.";
const TREASURE_ISLAND_WARNING_LINE =
  "That leads to Treasure Island. The only treasure you'll find there is solitude.";
const SOUTH_BAY_WARNING_LINE =
  "You own a Caltrain Go Pass. Might as well use it to get to South Bay.";
const MEMORYNO_ENCOUNTER_COOLDOWN_MS = 5_000;

interface Props {
  onExit: () => void;
}

/**
 * Top-down tile-based adventure mode set in a SF tech-meetup co-working
 * office. WASD/arrows move 1 tile at a time; E/Space/Enter interacts with
 * whatever the player is facing.
 *
 * NPCs trigger turn-based battles (re-using `BattleScene` in adventure mode).
 * Damage persists between fights — you need to talk to "Tokemonthropic"
 * (the Anthropic rep) to heal up for $4 a pop.
 */
export function AdventureView({ onExit }: Props) {
  const adventure = useAdventure();
  const legendary = useLegendary();
  const { save, partner } = adventure;
  const mythosUnlocked = legendary.isUnlocked("mythos");
  const mythosRequirementMet = useMemo(
    () => hasEngagedAllMythosTrainers(save.engaged, undefined, save.defeated),
    [save.defeated, save.engaged]
  );

  // First-time entry: show partner picker if there's no saved partner
  const [pickerOpen, setPickerOpen] = useState<boolean>(!partner);

  // Bottom-of-Game-Boy control deck. "pad" is the regular D-pad + A/B; "chat"
  // swaps in the deeply unhelpful AI chat panel.
  const [controlMode, setControlMode] = useState<"pad" | "chat">("pad");

  // Current scene + player position within that scene
  const [sceneId, setSceneId] = useState<SceneId>("office");
  const scene = SCENES[sceneId];
  const TILES = useMemo(
    () => parseMap(scene.source, scene.charMap),
    [scene]
  );
  const MAP_W = scene.source[0].length;
  const MAP_H = scene.source.length;

  const [pos, setPos] = useState<{ x: number; y: number }>(scene.spawn);
  const [facing, setFacing] = useState<Facing>("up");

  // Dialogue state: a queue of lines and a `mode` to know what to do on close
  const [dialogue, setDialogue] = useState<DialogueState | null>(null);

  // Active battle (null when not battling)
  const [battle, setBattle] = useState<{ npc: NPC; npcModel: AIModel } | null>(
    null
  );
  const lastMemoryNoEncounterAtRef = useRef(0);

  // Welcome on first load — only when we already have a partner
  const welcomedRef = useRef(false);
  useEffect(() => {
    if (!partner || welcomedRef.current) return;
    welcomedRef.current = true;
    setDialogue({
      lines: WELCOME_LINES,
      kind: "system",
    });
  }, [partner]);

  // Mythos is awarded for showing up to every office trainer, win or lose.
  // This also fixes existing saves that already met the requirement.
  useEffect(() => {
    if (!battle && !mythosUnlocked && mythosRequirementMet) {
      legendary.unlockDirect("mythos");
    }
  }, [battle, legendary, mythosRequirementMet, mythosUnlocked]);

  /* ─── Scene transitions ───────────────────────────────────────── */

  const transitionTo = useCallback(
    (targetId: SceneId, to: { x: number; y: number }, dir: Facing, banner?: string) => {
      setSceneId(targetId);
      setPos(to);
      setFacing(dir);
      if (banner) {
        const lines =
          targetId === "pier" ? [...PIER_WELCOME_LINES, banner] : [banner];
        setDialogue({ lines, kind: "system" });
      }
    },
    []
  );

  /* ─── Movement ────────────────────────────────────────────────── */

  const tryMove = useCallback(
    (dx: number, dy: number, newFacing: Facing) => {
      setFacing(newFacing);
      const tx = pos.x + dx;
      const ty = pos.y + dy;
      if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) {
        const currentTile = TILES[pos.y]?.[pos.x];
        if (scene.id === "pier" && dx > 0 && currentTile === "water") {
          setDialogue({ lines: [OAKLAND_WARNING_LINE], kind: "system" });
        }
        if (scene.id === "pier" && dy < 0 && currentTile === "water") {
          setDialogue({
            lines: [TREASURE_ISLAND_WARNING_LINE],
            kind: "system",
          });
        }
        if (scene.id === "pier" && dy > 0 && currentTile === "water") {
          setDialogue({ lines: [SOUTH_BAY_WARNING_LINE], kind: "system" });
        }
        return;
      }
      const tile = TILES[ty][tx];
      const onFoot = WALKABLE.has(tile);
      const onKayak = save.hasKayak && KAYAK_WALKABLE.has(tile);
      if (!onFoot && !onKayak) return;
      if (findNPCAt(scene.npcs, tx, ty)) return;
      setPos({ x: tx, y: ty });

      // Exit tile? Trigger transition.
      const exit = scene.exits[`${tx},${ty}`];
      if (exit) {
        transitionTo(exit.toScene, exit.to, exit.facing ?? "up", exit.banner);
        return;
      }

      // Step-based random encounters (e.g. water → MemoryNo)
      if (scene.encounters) {
        for (const enc of scene.encounters) {
          if (!enc.onTile.includes(tile)) continue;
          if (enc.requiresKayak && !save.hasKayak) continue;
          if (enc.oneShot && save.defeated.includes(enc.npcId)) continue;
          if (Math.random() < enc.chance) {
            if (
              enc.npcId === "wild-memoryno" &&
              Date.now() - lastMemoryNoEncounterAtRef.current <
                MEMORYNO_ENCOUNTER_COOLDOWN_MS
            ) {
              continue;
            }
            if (enc.npcId === "wild-memoryno") {
              lastMemoryNoEncounterAtRef.current = Date.now();
            }
            tryStartWildEncounter(enc);
            return;
          }
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pos.x, pos.y, scene, save.hasKayak, save.defeated]
  );

  /** Returns the tile + NPC the player is currently facing. */
  const inFront = useCallback((): { x: number; y: number } => {
    let dx = 0,
      dy = 0;
    if (facing === "up") dy = -1;
    if (facing === "down") dy = 1;
    if (facing === "left") dx = -1;
    if (facing === "right") dx = 1;
    return { x: pos.x + dx, y: pos.y + dy };
  }, [facing, pos.x, pos.y]);

  /* ─── Interaction ─────────────────────────────────────────────── */

  const interact = useCallback(() => {
    if (dialogue || battle || pickerOpen) return;
    const target = inFront();
    if (
      target.x < 0 ||
      target.y < 0 ||
      target.x >= MAP_W ||
      target.y >= MAP_H
    )
      return;
    const npc = findNPCAt(scene.npcs, target.x, target.y);
    if (npc) {
      startNPCInteraction(npc);
      return;
    }
    // "Truck" tile? It's actually the Mac Mini XL — kick off that encounter.
    const tile = TILES[target.y][target.x];
    if (tile === "truck") {
      const truckNpc = WILD_NPCS.find((n) => n.id === "wild-truck");
      if (truckNpc && !save.defeated.includes(truckNpc.id)) {
        setDialogue({
          lines: truckNpc.preBattle ?? ["..."],
          kind: "pre-battle",
          npcId: truckNpc.id,
          fromWild: true,
        });
        return;
      }
      if (truckNpc) {
        setDialogue({
          lines: truckNpc.afterDefeat ?? ["The Mac Mini XL hums on."],
          kind: "system",
        });
        return;
      }
    }
    // Furniture flavor
    const flavors = TILE_FLAVOR[tile];
    if (flavors) {
      const line = flavors[Math.floor(Math.random() * flavors.length)];
      setDialogue({ lines: [line], kind: "system" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogue, battle, pickerOpen, inFront, scene, save.defeated]);

  function tryStartWildEncounter(enc: SceneEncounter) {
    const npc = WILD_NPCS.find((n) => n.id === enc.npcId);
    if (!npc) return;
    setDialogue({
      lines: npc.preBattle ?? ["A wild thing appears!"],
      kind: "pre-battle",
      npcId: npc.id,
      fromWild: true,
    });
  }

  function startNPCInteraction(npc: NPC) {
    if (npc.role === "heal") {
      if (!save.metHeal) {
        setDialogue({
          lines: npc.introLines ?? ["..."],
          kind: "heal-intro",
          npcId: npc.id,
        });
      } else {
        setDialogue({
          lines: npc.repeatLines ?? ["..."],
          kind: "heal-prompt",
          npcId: npc.id,
        });
      }
      return;
    }
    if (npc.role === "kayak") {
      if (!save.hasKayak) {
        setDialogue({
          lines: npc.introLines ?? ["..."],
          kind: "kayak-intro",
          npcId: npc.id,
        });
      } else {
        setDialogue({
          lines: npc.repeatLines ?? ["..."],
          kind: "system",
          npcId: npc.id,
        });
      }
      return;
    }
    if (npc.role === "talk") {
      const seen = save.metTalk.includes(npc.id);
      setDialogue({
        lines:
          (seen ? npc.repeatLines : npc.introLines) ?? ["..."],
        kind: seen ? "system" : "talk-intro",
        npcId: npc.id,
      });
      return;
    }
    if (npc.role === "vendor") {
      const paid = save.paidVendor.includes(npc.id);
      setDialogue({
        lines:
          (paid ? npc.repeatLines : npc.introLines) ?? ["..."],
        kind: paid ? "system" : "vendor-intro",
        npcId: npc.id,
      });
      return;
    }
    if (npc.role === "vc") {
      // Brad never stops. Each visit shows the next pitch in the ladder —
      // bigger amount, increasingly unhinged "diligence question" — and the
      // money lands when the dialogue closes (see vc-intro in closeDialogue).
      const nextPitch = bradPitchFor(save.bradPitches + 1);
      const intro =
        save.bradPitches === 0
          ? // First time: include Brad's full intro before his question.
            npc.introLines ?? []
          : [
              `Brad spots you again. He's been here the whole time.`,
              `"Back already? Good. The fund just closed another tranche."`,
            ];
      setDialogue({
        lines: [...intro, nextPitch.question],
        kind: "vc-intro",
        npcId: npc.id,
      });
      return;
    }
    // Battle NPC
    if (save.defeated.includes(npc.id)) {
      setDialogue({
        lines: npc.afterDefeat ?? ["..."],
        kind: "post-defeat",
        npcId: npc.id,
      });
      return;
    }
    setDialogue({
      lines: npc.preBattle ?? ["..."],
      kind: "pre-battle",
      npcId: npc.id,
    });
  }

  function advanceDialogue() {
    if (!dialogue) return;
    if (dialogue.lines.length > 1) {
      setDialogue({ ...dialogue, lines: dialogue.lines.slice(1) });
      return;
    }
    // Last line — apply the kind-specific side-effect
    closeDialogue();
  }

  function closeDialogue() {
    if (!dialogue) return;
    const d = dialogue;
    setDialogue(null);

    switch (d.kind) {
      case "pre-battle": {
        const npc = findKnownNPC(d.npcId ?? "");
        if (!npc) return;
        const m = npcModel(npc);
        if (!m) {
          setDialogue({
            lines: [`${npc.name} forgot their laptop. Battle canceled.`],
            kind: "system",
          });
          return;
        }
        // Showing up counts — even if you lose, you've engaged this trainer.
        adventure.markEngaged(npc.id);
        setBattle({ npc, npcModel: m });
        return;
      }
      case "talk-intro": {
        if (d.npcId) adventure.markTalked(d.npcId);
        return;
      }
      case "vendor-intro": {
        if (!d.npcId) return;
        const paid = adventure.drainCreditsOnce(d.npcId);
        const npc = findKnownNPC(d.npcId);
        const flavor =
          paid > 0
            ? `(You handed over $${paid} in compute credits and received an M5 Mac mini.)`
            : `(You had no credits to give. Mike hands you the Mac mini anyway. He's a giver.)`;
        setDialogue({
          lines: [flavor, ...(npc?.repeatLines ?? [])],
          kind: "system",
          npcId: d.npcId,
        });
        return;
      }
      case "vc-intro": {
        if (!d.npcId) return;
        // Brad assumes you're doing AI. He always wires a flat $5K — only the
        // satirical question + response rotates each visit. Counter is kept
        // around so the rotation is deterministic per visit.
        const pitchNumber = adventure.recordBradPitch();
        const pitch = bradPitchFor(pitchNumber);
        adventure.grantCredits(BRAD_PITCH_AMOUNT);
        setDialogue({
          lines: [
            pitch.response,
            `(Brad wires you $${BRAD_PITCH_AMOUNT.toLocaleString("en-US")}.)`,
          ],
          kind: "system",
          npcId: d.npcId,
        });
        return;
      }
      case "heal-intro": {
        adventure.grantCredits(25);
        adventure.markMetHeal();
        return;
      }
      case "kayak-intro": {
        adventure.grantKayak();
        return;
      }
      case "heal-prompt": {
        const npc = findKnownNPC(d.npcId ?? "");
        if (!npc) return;
        const cost = npc.healCost ?? 4;
        setDialogue({
          lines: [
            save.credits < cost
              ? NO_CREDITS_LINE
              : `Tokemonthropic: 'Top up for $${cost}? Yes to heal, No to bail.'`,
          ],
          kind: "heal-confirm",
          npcId: npc.id,
        });
        return;
      }
      default:
        return;
    }
  }

  function confirmHeal(npcId: string, yes: boolean) {
    setDialogue(null);
    if (!yes) return;
    const npc = findKnownNPC(npcId);
    if (!npc) return;
    const cost = npc.healCost ?? 4;
    const ok = adventure.heal(cost);
    if (!ok) {
      setDialogue({ lines: [NO_CREDITS_LINE], kind: "system" });
      return;
    }
    setDialogue({
      lines: npc.postHealLines ?? ["Patched up."],
      kind: "system",
    });
  }

  /* ─── Battle resolution ───────────────────────────────────────── */

  function onBattleResolved(result: {
    won: boolean;
    finalPlayerHP: number;
    tokensBurned: number;
  }) {
    if (!battle) return;
    const { npc } = battle;
    const reward = npc.reward ?? 0;
    const unlocksMythos =
      !mythosUnlocked &&
      hasEngagedAllMythosTrainers(save.engaged, npc.id, save.defeated);
    if (unlocksMythos) legendary.unlockDirect("mythos");

    adventure.applyBattleResult({
      won: result.won,
      npcId: npc.id,
      finalPlayerHP: result.finalPlayerHP,
      reward,
      tokensBurned: result.tokensBurned,
    });
    setBattle(null);

    if (result.finalPlayerHP <= 0) {
      // Black out → respawn at the current scene's entrance
      setPos(scene.spawn);
      setFacing("up");
      setDialogue({
        lines: [
          ...BLACKOUT_LINES,
          ...(unlocksMythos ? MYTHOS_UNLOCK_LINES : []),
        ],
        kind: "system",
      });
      return;
    }

    if (result.won) {
      // Adventure-unlock awards (Mythical added to the Pokedex)
      const unlockId = adventureUnlockFor(npc.id);
      if (unlockId) legendary.unlockDirect(unlockId);

      const earnedLine =
        reward > 0
          ? `${npc.name} hands you $${reward} in compute credits.`
          : `(No reward this time.)`;
      const tail = npc.postWin ?? ["..."];
      setDialogue({
        lines: [
          ...tail,
          earnedLine,
          ...(unlocksMythos ? MYTHOS_UNLOCK_LINES : []),
        ],
        kind: "system",
      });
    } else {
      setDialogue({
        lines: [
          ...(npc.postLoss ?? ["..."]),
          ...(unlocksMythos ? MYTHOS_UNLOCK_LINES : []),
        ],
        kind: "system",
      });
    }
  }

  /* ─── Unified actions (shared by keyboard + on-screen Game Boy pad) ── */

  /** A-button semantics: advance dialogue, interact, confirm heal yes. */
  const pressA = useCallback(() => {
    if (dialogue) {
      if (dialogue.kind === "heal-confirm" && dialogue.npcId) {
        confirmHeal(dialogue.npcId, true);
      } else {
        advanceDialogue();
      }
      return;
    }
    if (battle || pickerOpen) return;
    interact();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogue, battle, pickerOpen, interact]);

  /** B-button semantics: cancel dialogue, decline heal, close picker. */
  const pressB = useCallback(() => {
    if (dialogue) {
      if (dialogue.kind === "heal-confirm" && dialogue.npcId) {
        confirmHeal(dialogue.npcId, false);
      } else {
        setDialogue(null);
      }
      return;
    }
    if (pickerOpen && partner) {
      setPickerOpen(false);
    }
  }, [dialogue, pickerOpen, partner]);

  /** D-pad helper used by both keyboard arrows and the on-screen pad. */
  const pressDir = useCallback(
    (dir: Facing) => {
      if (dialogue || battle || pickerOpen) return;
      if (dir === "up") tryMove(0, -1, "up");
      else if (dir === "down") tryMove(0, 1, "down");
      else if (dir === "left") tryMove(-1, 0, "left");
      else tryMove(1, 0, "right");
    },
    [dialogue, battle, pickerOpen, tryMove]
  );

  /* ─── Keyboard handling ───────────────────────────────────────── */

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // If the user is typing in the AI-mode chat input (or any other text
      // field), don't hijack their letters as movement keys.
      const tgt = e.target as HTMLElement | null;
      if (
        tgt &&
        (tgt.tagName === "INPUT" ||
          tgt.tagName === "TEXTAREA" ||
          tgt.isContentEditable)
      ) {
        return;
      }

      // Always allow Esc to close the picker / dialogue without exiting the
      // mode entirely; leaving the adventure is via the explicit Exit button.
      if (e.key === "Escape") {
        pressB();
        if (dialogue || (pickerOpen && partner)) e.preventDefault();
        return;
      }

      // Block movement while in dialogue/picker/battle
      if (dialogue || battle || pickerOpen) {
        if (dialogue && (e.key === "Enter" || e.key === " " || e.key === "e" || e.key === "E")) {
          pressA();
          e.preventDefault();
        } else if (
          dialogue &&
          dialogue.kind === "heal-confirm" &&
          dialogue.npcId &&
          (e.key === "n" || e.key === "N")
        ) {
          confirmHeal(dialogue.npcId, false);
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          pressDir("up");
          e.preventDefault();
          break;
        case "ArrowDown":
        case "s":
        case "S":
          pressDir("down");
          e.preventDefault();
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          pressDir("left");
          e.preventDefault();
          break;
        case "ArrowRight":
        case "d":
        case "D":
          pressDir("right");
          e.preventDefault();
          break;
        case "Enter":
        case " ":
        case "e":
        case "E":
          pressA();
          e.preventDefault();
          break;
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressDir, pressA, pressB, dialogue, battle, pickerOpen, partner]);

  /* ─── Render ──────────────────────────────────────────────────── */

  const mapPxW = MAP_W * TILE_SIZE;
  const mapPxH = MAP_H * TILE_SIZE;

  return (
    <div className="fixed inset-0 z-40 bg-black/95 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <GameBoyShell
        screenAspectRatio={mapPxW / mapPxH}
        controlMode={controlMode}
        onSetControlMode={setControlMode}
        onDir={pressDir}
        onA={pressA}
        onB={pressB}
        onStart={() => setPickerOpen(true)}
        onSelect={() => {
          if (
            window.confirm(
              "Reset adventure progress? You'll lose credits, healed HP, and battle wins. (Mythos is unaffected.)"
            )
          ) {
            adventure.reset();
          }
        }}
        onExit={onExit}
        statusBar={
          <StatusBar
            partner={partner}
            partnerHP={save.partnerHP}
            credits={save.credits}
            defeated={save.defeated.length}
          />
        }
        overlay={
          dialogue ? (
            <DialogueBox
              dialogue={dialogue}
              onAdvance={advanceDialogue}
              onConfirmHeal={confirmHeal}
            />
          ) : null
        }
      >
        {(scaledW, scaledH) => {
          const scale = Math.min(scaledW / mapPxW, scaledH / mapPxH);
          // Center the scaled map within the available screen rect so the
          // letterboxing (when the map's aspect doesn't perfectly match the
          // bezel) lands as even black bars on each side.
          const renderedW = mapPxW * scale;
          const renderedH = mapPxH * scale;
          const offsetX = Math.max(0, (scaledW - renderedW) / 2);
          const offsetY = Math.max(0, (scaledH - renderedH) / 2);
          return (
            <div
              style={{
                position: "absolute",
                left: offsetX,
                top: offsetY,
                width: mapPxW,
                height: mapPxH,
                background: "#0a0a14",
                imageRendering: "pixelated",
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <MapGrid tiles={TILES} />
              <NPCLayer npcs={scene.npcs} />
              <Player
                x={pos.x}
                y={pos.y}
                facing={facing}
                onWater={TILES[pos.y]?.[pos.x] === "water"}
              />
              <FloorLabels sceneId={sceneId} />
            </div>
          );
        }}
      </GameBoyShell>

      {pickerOpen && (
        <PartnerPicker
          current={partner}
          mythicals={legendary.unlockedModels}
          onPick={(m) => {
            adventure.setPartner(m);
            setPickerOpen(false);
          }}
          onCancel={() => {
            if (partner) setPickerOpen(false);
            else onExit();
          }}
        />
      )}

      {battle && partner && (
        <BattleScene
          models={[partner, battle.npcModel]}
          onClose={() => setBattle(null)}
          onShowDetails={() => setBattle(null)}
          adventure={{
            playerStartHP: Math.max(1, save.partnerHP),
            onResolve: onBattleResolved,
            preBattleNote: `${battle.npc.name} sends out ${battle.npcModel.name}!`,
          }}
        />
      )}
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────── */

/**
 * Compact 1-line status strip rendered just above the Game Boy "screen".
 * Fits on a phone — partner emblem, HP bar, credits, defeated counter.
 */
function StatusBar({
  partner,
  partnerHP,
  credits,
  defeated,
}: {
  partner: AIModel | null;
  partnerHP: number;
  credits: number;
  defeated: number;
}) {
  const hpPct = (partnerHP / MAX_HP) * 100;
  return (
    <div className="flex items-center gap-2 sm:gap-3 px-2 py-1.5 text-[10px] font-mono text-ink-300 w-full">
      {partner ? (
        <ModelEmblem model={partner} size={22} animated={false} />
      ) : (
        <div className="w-[22px] h-[22px] rounded bg-white/10" />
      )}
      <div className="hidden xs:block min-w-0 truncate text-white font-display font-bold text-[11px] max-w-[100px]">
        {partner?.name ?? "—"}
      </div>
      <div className="flex items-center gap-1.5 flex-1 min-w-0 max-w-[180px]">
        <span className="uppercase tracking-[0.15em] text-ink-500">HP</span>
        <div className="relative h-1.5 flex-1 rounded-full bg-black/60 ring-1 ring-inset ring-white/5 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out"
            style={{
              width: `${Math.max(0, hpPct)}%`,
              background:
                hpPct > 50
                  ? "linear-gradient(90deg, #34d399, #10b981)"
                  : hpPct > 20
                    ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
                    : "linear-gradient(90deg, #f87171, #dc2626)",
            }}
          />
        </div>
        <span className="tabular-nums text-ink-200 w-9 text-right">
          {Math.round(partnerHP)}/{MAX_HP}
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        <span className="text-amber-300 leading-none">$</span>
        <span className="font-display font-black text-amber-200 tabular-nums">
          {credits < 1 ? credits.toFixed(2) : Math.floor(credits)}
        </span>
      </div>
      <div className="hidden sm:flex items-center gap-1">
        <span className="text-ink-500">DEF</span>
        <span className="text-white tabular-nums">{defeated}</span>
        <span className="text-ink-500">/ {TOTAL_BATTLE_NPCS}</span>
      </div>
    </div>
  );
}

/* ─── Game Boy chassis ────────────────────────────────────────────── */

interface GameBoyShellProps {
  /** Width / height of the displayed map; used to letterbox the screen. */
  screenAspectRatio: number;
  /** Which control deck to render below the screen — physical buttons or
   *  the (deliberately bad) AI chat panel. */
  controlMode: "pad" | "chat";
  onSetControlMode: (mode: "pad" | "chat") => void;
  statusBar: React.ReactNode;
  /** Optional overlay (e.g. dialogue box) drawn over the LCD at native scale,
   *  so it stays readable regardless of how much the inner map was shrunk. */
  overlay?: React.ReactNode;
  /** Renders the inner pixel content; receives the px size of the screen so
   *  the caller can scale its fixed-size map to fit. */
  children: (screenW: number, screenH: number) => React.ReactNode;
  onDir: (dir: Facing) => void;
  onA: () => void;
  onB: () => void;
  onStart: () => void;
  onSelect: () => void;
  onExit: () => void;
}

/**
 * Wraps the adventure map in a chunky Game-Boy-style chassis with on-screen
 * D-pad and A/B buttons. The "screen" auto-fits the available viewport,
 * preserving the map's aspect ratio. Works on phones (full-bleed) and
 * desktops (centered, capped to a comfortable handheld size).
 */
function GameBoyShell({
  screenAspectRatio,
  controlMode,
  onSetControlMode,
  statusBar,
  overlay,
  children,
  onDir,
  onA,
  onB,
  onStart,
  onSelect,
  onExit,
}: GameBoyShellProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const [screenSize, setScreenSize] = useState<{ w: number; h: number }>({
    w: 320,
    h: 288,
  });

  useEffect(() => {
    if (!screenRef.current) return;
    const el = screenRef.current;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setScreenSize({ w: rect.width, h: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      className="relative flex flex-col items-stretch w-full"
      style={{
        maxWidth: 460,
        maxHeight: "100%",
        padding: "10px",
        borderRadius: "18px 18px 56px 18px",
        background:
          "linear-gradient(160deg, #d6d3c4 0%, #c4c0ad 40%, #a8a394 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -3px 0 rgba(0,0,0,0.18), 0 24px 60px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.4)",
      }}
    >
      {/* Top bezel: brand + control-mode toggle + leave button */}
      <div className="flex items-center justify-between gap-2 px-1.5 pb-1.5 shrink-0">
        <div
          className="font-display font-black text-[10px] tracking-[0.3em]"
          style={{ color: "#3b2e1c" }}
        >
          TOKEMON·DEX
        </div>
        <ControlModeToggle
          mode={controlMode}
          onChange={onSetControlMode}
        />
        <button
          type="button"
          onClick={onExit}
          aria-label="Leave adventure"
          className="text-[9px] px-2 py-0.5 rounded-md font-mono uppercase tracking-[0.15em]"
          style={{
            background: "#7f1d1d",
            color: "#fde68a",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.4)",
          }}
        >
          ⏻ Leave
        </button>
      </div>

      {/* Screen bezel (the dark gray plastic around the LCD) */}
      <div
        className="relative shrink-0"
        style={{
          background: "linear-gradient(180deg, #5b5648, #3a3528)",
          borderRadius: 14,
          padding: "8px 10px 12px 10px",
          boxShadow:
            "inset 0 2px 4px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Indicator strip above the LCD */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="flex items-center gap-1">
            <span
              className="block rounded-full"
              style={{
                width: 5,
                height: 5,
                background: "#dc2626",
                boxShadow: "0 0 5px rgba(220,38,38,0.7)",
              }}
            />
            <span
              className="text-[7px] font-mono tracking-[0.2em] uppercase"
              style={{ color: "#fbbf24" }}
            >
              POWER
            </span>
          </div>
          <div className="flex-1 h-px bg-black/40" />
          <div
            className="text-[7px] font-mono tracking-[0.2em] uppercase"
            style={{ color: "#9ca3af" }}
          >
            DOT-MATRIX·WITH·STEREO
          </div>
        </div>

        {/* The LCD itself */}
        <div
          ref={screenRef}
          className="relative overflow-hidden"
          style={{
            width: "100%",
            aspectRatio: `${screenAspectRatio}`,
            maxWidth: SCREEN_MAX_W,
            maxHeight: SCREEN_MAX_H,
            margin: "0 auto",
            background: "#1a1726",
            borderRadius: 4,
            boxShadow:
              "inset 0 0 0 2px #0a0a14, inset 0 0 14px rgba(0,0,0,0.6)",
            imageRendering: "pixelated",
          }}
        >
          {children(screenSize.w, screenSize.h)}
          {overlay}
        </div>
      </div>

      {/* Status strip just below the screen, above the controls */}
      <div className="mt-1.5 mb-1 rounded-md bg-black/40 ring-1 ring-inset ring-black/40 shrink-0">
        {statusBar}
      </div>

      {/* Control deck — either physical D-pad + A/B, or the deeply
          unhelpful AI chat panel. */}
      {controlMode === "pad" ? (
        <div className="shrink-0 flex flex-col">
          <div className="flex items-center justify-between gap-3 px-1 pt-3 pb-1">
            <DPadControl onDir={onDir} />
            <ABButtons onA={onA} onB={onB} />
          </div>

          {/* Start / Select angled bar */}
          <div className="flex items-center justify-center gap-3 mt-2 mb-1">
            <PillButton label="SELECT" onClick={onSelect} />
            <PillButton label="START" onClick={onStart} />
          </div>

          {/* Speaker grille */}
          <div className="flex justify-end items-center gap-1.5 mt-1 pr-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  width: 18,
                  height: 2,
                  borderRadius: 2,
                  background:
                    "linear-gradient(180deg, #3a3528 0%, #1f1c14 100%)",
                  transform: `rotate(-22deg)`,
                  opacity: 0.85 - i * 0.08,
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <ChatControls
          onDir={onDir}
          onA={onA}
          onB={onB}
          onStart={onStart}
          onSelect={onSelect}
        />
      )}
    </div>
  );
}

function DPadControl({ onDir }: { onDir: (dir: Facing) => void }) {
  const padBase: React.CSSProperties = {
    background: "linear-gradient(180deg, #1f1f24, #0a0a0f)",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.6), 0 2px 0 rgba(0,0,0,0.5)",
  };
  const SIZE = 96;
  const ARM = SIZE / 3;

  function arrow(dir: Facing): React.CSSProperties {
    const base: React.CSSProperties = {
      position: "absolute",
      width: ARM,
      height: ARM,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "rgba(255,255,255,0.65)",
      fontSize: 14,
      userSelect: "none",
      WebkitUserSelect: "none",
      touchAction: "manipulation",
      cursor: "pointer",
    };
    if (dir === "up") return { ...base, top: 0, left: ARM };
    if (dir === "down") return { ...base, bottom: 0, left: ARM };
    if (dir === "left") return { ...base, left: 0, top: ARM };
    return { ...base, right: 0, top: ARM };
  }

  function makeHandlers(dir: Facing) {
    return {
      onPointerDown: (e: React.PointerEvent) => {
        e.preventDefault();
        onDir(dir);
      },
    };
  }

  return (
    <div
      className="relative shrink-0"
      style={{ width: SIZE, height: SIZE }}
      aria-label="Directional pad"
    >
      {/* horizontal arm */}
      <div
        className="absolute rounded-md"
        style={{
          ...padBase,
          left: 0,
          right: 0,
          top: ARM,
          height: ARM,
        }}
      />
      {/* vertical arm */}
      <div
        className="absolute rounded-md"
        style={{
          ...padBase,
          top: 0,
          bottom: 0,
          left: ARM,
          width: ARM,
        }}
      />
      {/* center dot */}
      <div
        className="absolute rounded-sm"
        style={{
          left: ARM + ARM / 4,
          top: ARM + ARM / 4,
          width: ARM / 2,
          height: ARM / 2,
          background: "#0a0a0f",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)",
        }}
      />
      {/* arrow hit-targets (transparent buttons rendered via styling) */}
      <button
        type="button"
        aria-label="Up"
        style={arrow("up")}
        {...makeHandlers("up")}
      >
        ▲
      </button>
      <button
        type="button"
        aria-label="Down"
        style={arrow("down")}
        {...makeHandlers("down")}
      >
        ▼
      </button>
      <button
        type="button"
        aria-label="Left"
        style={arrow("left")}
        {...makeHandlers("left")}
      >
        ◀
      </button>
      <button
        type="button"
        aria-label="Right"
        style={arrow("right")}
        {...makeHandlers("right")}
      >
        ▶
      </button>
    </div>
  );
}

function ABButtons({
  onA,
  onB,
}: {
  onA: () => void;
  onB: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 shrink-0"
      style={{ transform: "rotate(-22deg)", transformOrigin: "center" }}
    >
      <ActionButton label="B" onPress={onB} />
      <ActionButton label="A" onPress={onA} />
    </div>
  );
}

function ActionButton({
  label,
  onPress,
}: {
  label: "A" | "B";
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      className="rounded-full font-display font-black select-none"
      style={{
        width: 46,
        height: 46,
        background:
          "radial-gradient(circle at 35% 30%, #ef9aa9 0%, #b91c1c 60%, #5b0a13 100%)",
        color: "rgba(255,255,255,0.92)",
        fontSize: 16,
        textShadow: "0 1px 1px rgba(0,0,0,0.5)",
        boxShadow:
          "inset 0 -2px 3px rgba(0,0,0,0.45), inset 0 2px 2px rgba(255,255,255,0.4), 0 3px 0 rgba(0,0,0,0.5)",
        touchAction: "manipulation",
      }}
    >
      {label}
    </button>
  );
}

function PillButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="select-none"
      style={{
        transform: "rotate(-22deg)",
        background: "linear-gradient(180deg, #4a4538, #2c2a22)",
        color: "rgba(255,255,255,0.55)",
        padding: "4px 12px",
        borderRadius: 999,
        fontSize: 8,
        fontFamily: "'Press Start 2P', monospace",
        letterSpacing: 1.5,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.6), 0 2px 0 rgba(0,0,0,0.5)",
        touchAction: "manipulation",
      }}
    >
      {label}
    </button>
  );
}

/**
 * Tiny segmented control in the top bezel that flips between the physical
 * D-pad and the AI chat panel. Visually styled to look like a 1990s "MODE"
 * switch on the back of a handheld.
 */
function ControlModeToggle({
  mode,
  onChange,
}: {
  mode: "pad" | "chat";
  onChange: (m: "pad" | "chat") => void;
}) {
  return (
    <div
      className="inline-flex items-center rounded-full overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #2a2418, #1a1610)",
        boxShadow:
          "inset 0 1px 0 rgba(0,0,0,0.7), inset 0 -1px 0 rgba(255,255,255,0.05), 0 1px 0 rgba(255,255,255,0.25)",
      }}
    >
      {(["pad", "chat"] as const).map((m) => {
        const active = mode === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            aria-pressed={active}
            className="px-2 py-0.5 transition-colors"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 7,
              letterSpacing: 1.2,
              color: active ? "#fde68a" : "rgba(253,230,138,0.45)",
              background: active
                ? "linear-gradient(180deg, #b45309, #7c2d12)"
                : "transparent",
              boxShadow: active
                ? "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.5)"
                : undefined,
            }}
          >
            {m === "pad" ? "PAD" : "AI"}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The "AI Mode" control deck. Replaces the D-pad and A/B with a chat input
 * that only understands a tiny vocabulary ("left", "press A", etc.) and
 * cheerfully misunderstands everything else.
 *
 * The whole thing is meant to be a deliberately bad UX gag — the LLM-themed
 * app's most LLM-themed feature is a terrible LLM. Every command goes
 * through the same `pressDir` / `pressA` / etc. handlers as the D-pad, so
 * gameplay still works; it's just slower and more annoying.
 */
function ChatControls({
  onDir,
  onA,
  onB,
  onStart,
  onSelect,
}: {
  onDir: (dir: Facing) => void;
  onA: () => void;
  onB: () => void;
  onStart: () => void;
  onSelect: () => void;
}) {
  type Msg = { id: number; from: "user" | "bot"; text: string };
  const idRef = useRef(0);
  const nextId = () => ++idRef.current;

  const [messages, setMessages] = useState<Msg[]>(() => [
    { id: nextId(), from: "bot", text: greetingReply() },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Always pin the message list to the latest reply.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function pushBot(text: string) {
    setMessages((m) => [...m, { id: nextId(), from: "bot", text }]);
  }

  function send(raw: string) {
    const text = raw.trim();
    if (!text) return;
    setMessages((m) => [...m, { id: nextId(), from: "user", text }]);
    setInput("");

    const cmd = parseChatCommand(text);
    // Slight delay before the bot "responds" — it's a chatbot, it has to think.
    window.setTimeout(() => {
      if (!cmd) {
        pushBot(clarificationReply());
        return;
      }
      switch (cmd.type) {
        case "dir":
          onDir(cmd.dir);
          break;
        case "a":
          onA();
          break;
        case "b":
          onB();
          break;
        case "start":
          onStart();
          break;
        case "select":
          onSelect();
          break;
      }
      pushBot(confirmReply(cmd));
    }, 220);
  }

  return (
    <div
      className="shrink-0 flex flex-col mt-2 mb-1 mx-0.5"
      style={{
        // Bot-y dark panel. Sits where the D-pad/A-B usually live so the
        // chassis height stays consistent when the user toggles modes.
        background: "linear-gradient(180deg, #11141c, #060810)",
        borderRadius: 12,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.18)",
        padding: 8,
      }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span
          className="block rounded-full"
          style={{
            width: 6,
            height: 6,
            background: "#10b981",
            boxShadow: "0 0 6px rgba(16,185,129,0.7)",
          }}
        />
        <span
          className="text-[8px] font-mono tracking-[0.25em] uppercase"
          style={{ color: "#94a3b8" }}
        >
          AI Mode (beta)
        </span>
        <span className="flex-1" />
        <span
          className="text-[7px] font-mono tracking-[0.2em] uppercase"
          style={{ color: "rgba(148,163,184,0.6)" }}
        >
          GPT-0.0001
        </span>
      </div>

      <div
        ref={scrollRef}
        className="overflow-y-auto pr-1 mb-1.5 space-y-1"
        style={{ height: 88 }}
      >
        {messages.map((m) => (
          <ChatBubble key={m.id} from={m.from} text={m.text} />
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-1.5"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="say 'left' or 'press A'…"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="flex-1 min-w-0 rounded-md px-2 py-1.5 text-[12px] font-mono text-white placeholder:text-ink-500 focus:outline-none"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        />
        <button
          type="submit"
          className="rounded-md px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-[0.15em]"
          style={{
            background:
              "linear-gradient(180deg, #2563eb 0%, #1d4ed8 60%, #1e3a8a 100%)",
            color: "white",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.4)",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

function ChatBubble({ from, text }: { from: "user" | "bot"; text: string }) {
  const isUser = from === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className="rounded-lg px-2 py-1 text-[11px] leading-snug max-w-[88%]"
        style={{
          background: isUser
            ? "linear-gradient(180deg, #2563eb, #1d4ed8)"
            : "rgba(255,255,255,0.06)",
          color: isUser ? "white" : "#e6e9ef",
          border: isUser ? "none" : "1px solid rgba(255,255,255,0.08)",
          fontFamily: isUser
            ? "'JetBrains Mono', monospace"
            : "Inter, sans-serif",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function MapGrid({ tiles }: { tiles: TileKind[][] }) {
  const cells = useMemo(() => {
    const out: { x: number; y: number; kind: TileKind }[] = [];
    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[0].length; x++) {
        out.push({ x, y, kind: tiles[y][x] });
      }
    }
    return out;
  }, [tiles]);

  return (
    <>
      {cells.map((t) => (
        <Tile key={`${t.x},${t.y}`} x={t.x} y={t.y} kind={t.kind} />
      ))}
    </>
  );
}

/* ─── Tile rendering ──────────────────────────────────────────────── */

/* Crisp pixel-art tile palette. No gradients — flat colors with hard edges
 * so the whole map reads as a Game-Boy-Color-style game. Each furniture
 * tile is laid out from a tiny 8×8 char grid that we resolve to flat-color
 * blocks via absolute positioning. */

const FLOOR_DARK = "#1a1726";
const FLOOR_LIGHT = "#23202f";
const WALL_BASE = "#221b35";
const WALL_LIGHT = "#3a2f54";
const WALL_DARK = "#0d0917";
const RUG_BASE = "#7c2d12";
const RUG_LIGHT = "#a3431b";
const RUG_DARK = "#451a0a";

const TILE_BLOCKS: Record<TileKind, string[]> = {
  // Walls render with a faux-brick pattern via row offsetting in CSS below.
  wall: [],
  floor: [],
  rug: [],
  // Furniture grids: 8×8, single-character codes resolved via TILE_PALETTE.
  // '.' = transparent, characters specific to each piece of furniture.
  door: [
    "DDDDDDDD",
    "DaaaaaaD",
    "DaEEEEaD",
    "DaENNEaD",
    "DaENNEaD",
    "DaEEEEaD",
    "DaaaaaaD",
    "DDDDDDDD",
  ],
  plant: [
    "..GGGG..",
    ".GgGGgG.",
    "GgGgGgGG",
    ".GgGGgG.",
    "..GGGG..",
    "...bb...",
    "..bbbb..",
    "..bbbb..",
  ],
  couch: [
    "........",
    "uuuuuuuu",
    "uUcccccu",
    "uUcuucUu",
    "uUcuucUu",
    "uUcccccu",
    "uuuuuuuu",
    "........",
  ],
  table: [
    "........",
    "..tttt..",
    ".tTTTTt.",
    ".tTTTTt.",
    ".tTTTTt.",
    "..tttt..",
    "........",
    "........",
  ],
  bar: [
    "........",
    "wwwwwwww",
    "BBBBBBBB",
    "BbBbBbBb",
    "BbBbBbBb",
    "Bbbbbbbb",
    "BBBBBBBB",
    "........",
  ],
  kitchen: [
    "KKKKKKKK",
    "KkkkkkkK",
    "KkOOkOOK",
    "KkkkkkkK",
    "KkddkddK",
    "KkkkkkkK",
    "KkkkkkkK",
    "KKKKKKKK",
  ],
  monitor: [
    "........",
    "mmmmmmmm",
    "mssssssm",
    "msGssssm",
    "mssssssm",
    "mmmmmmmm",
    "..mmmm..",
    "..mmmm..",
  ],
  stand: [
    "........",
    "..tttt..",
    "..tttt..",
    "..tttt..",
    "..tttt..",
    "...gg...",
    "...gg...",
    "..tttt..",
  ],
  whiteboard: [
    "WWWWWWWW",
    "WaaaaaaW",
    "W-aaaa-W",
    "Waaaaa-W",
    "Wa----aW",
    "Waa-a-aW",
    "W------W",
    "WWWWWWWW",
  ],
  water: [],
  boardwalk: [],
  sand: [],
  exit: [],
  truck: [
    "........",
    "wwww1111",
    "wkkw1111",
    "wwww1111",
    "00000000",
    "22444422",
    "22kkk422",
    "00000000",
  ],
};

const TILE_PALETTE: Record<string, string> = {
  "#": "#3a3a52",
  "b": "#7c5a3a",
  "D": "#92400e",
  "E": "#0c0e14",
  "N": "#0ea5e9",
  "G": "#16a34a",
  "g": "#15803d",
  "u": "#1e293b",
  "U": "#475569",
  "c": "#94a3b8",
  "0": "#0c0e14",
  "1": "#94a3b8",
  "2": "#475569",
  "4": "#1f2937",
  "t": "#5c2c08",
  "T": "#92400e",
  "w": "#a3a3a3",
  "B": "#5c2c08",
  "K": "#2a2740",
  "k": "#475569",
  "O": "#0c0e14",
  "d": "#0c0e14",
  "m": "#1f2937",
  "s": "#0f172a",
  "S": "#1e293b",
  "W": "#cbd5e1",
  "a": "#f8fafc",
  "-": "#64748b",
};

function Tile({ x, y, kind }: { x: number; y: number; kind: TileKind }) {
  const style: React.CSSProperties = {
    position: "absolute",
    left: x * TILE_SIZE,
    top: y * TILE_SIZE,
    width: TILE_SIZE,
    height: TILE_SIZE,
  };

  // Special-case the big background tiles for crispness + perf.
  if (kind === "wall") {
    return <WallTile style={style} y={y} />;
  }
  if (kind === "floor") {
    const c = (x + y) % 2 === 0 ? FLOOR_LIGHT : FLOOR_DARK;
    return <div style={{ ...style, background: c }} />;
  }
  if (kind === "exit") {
    // Bright, unmistakable doorway. Pulsing amber/red door frame with an
    // "EXIT" arrow so the player can spot it from across the map.
    return (
      <div
        style={{
          ...style,
          background:
            "linear-gradient(180deg, #fbbf24 0%, #f59e0b 45%, #b45309 100%)",
          boxShadow:
            "inset 0 0 0 2px #7c2d12, inset 0 0 0 4px #fde68a, 0 0 12px rgba(251,191,36,0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 10,
          color: "#7c2d12",
          textShadow: "0 1px 0 rgba(255,255,255,0.5)",
          animation: "mythos-flicker 1.6s ease-in-out infinite",
        }}
        title="Side door — leads outside to Pier 67"
      >
        ➜
      </div>
    );
  }
  if (kind === "rug") {
    const stripe = (x + y) % 2 === 0;
    return (
      <div
        style={{
          ...style,
          background: stripe ? RUG_BASE : RUG_LIGHT,
          boxShadow: `inset 0 0 0 1px ${RUG_DARK}`,
        }}
      />
    );
  }
  if (kind === "water") {
    return <WaterTile style={style} x={x} y={y} />;
  }
  if (kind === "boardwalk") {
    return <BoardwalkTile style={style} x={x} y={y} />;
  }
  if (kind === "sand") {
    return <SandTile style={style} x={x} y={y} />;
  }

  // Furniture / interactive tiles: render from a tiny 8×8 grid.
  const block = TILE_BLOCKS[kind];
  if (!block) return null;
  return (
    <div
      style={{
        ...style,
        background: (x + y) % 2 === 0 ? FLOOR_LIGHT : FLOOR_DARK,
      }}
    >
      <FurnitureBlock grid={block} />
    </div>
  );
}

/* ─── Outdoor tile types (Pier 67) ───────────────────────────────── */

function WaterTile({
  style,
  x,
  y,
}: {
  style: React.CSSProperties;
  x: number;
  y: number;
}) {
  // Two-tone bay water with a small wave-crest highlight every other cell.
  const baseLight = "#2a5b8a";
  const baseDark = "#1f4567";
  const crest = "#9bd1f5";
  const isLight = (x + y) % 2 === 0;
  return (
    <div
      style={{
        ...style,
        background: isLight ? baseLight : baseDark,
      }}
    >
      {(x % 3 === (y % 4 === 0 ? 0 : 2)) && (
        <div
          style={{
            position: "absolute",
            left: 8,
            top: 14,
            width: 8,
            height: 1,
            background: crest,
          }}
        />
      )}
      {(y % 5 === 2 && x % 4 === 1) && (
        <div
          style={{
            position: "absolute",
            left: 16,
            top: 22,
            width: 6,
            height: 1,
            background: crest,
            opacity: 0.7,
          }}
        />
      )}
    </div>
  );
}

function BoardwalkTile({
  style,
  y,
}: {
  style: React.CSSProperties;
  x: number;
  y: number;
}) {
  // Wood-plank deck. Two horizontal planks per tile with darker seams.
  const plankA = "#a16207";
  const plankB = "#854d0e";
  const seam = "#3f2410";
  const top = y % 2 === 0 ? plankA : plankB;
  const bot = y % 2 === 0 ? plankB : plankA;
  return (
    <div style={{ ...style, overflow: "hidden", background: top }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: TILE_SIZE / 2,
          height: TILE_SIZE / 2,
          background: bot,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: TILE_SIZE / 2 - 1,
          height: 1,
          background: seam,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 1,
          background: seam,
          opacity: 0.6,
        }}
      />
    </div>
  );
}

function SandTile({
  style,
  x,
  y,
}: {
  style: React.CSSProperties;
  x: number;
  y: number;
}) {
  // Damp sand with a tiny grain dot pattern.
  const baseA = "#a16207";
  const baseB = "#854d0e";
  const base = (x + y) % 2 === 0 ? baseA : baseB;
  return (
    <div style={{ ...style, background: base }}>
      {((x * 7 + y * 3) % 5 === 0) && (
        <div
          style={{
            position: "absolute",
            left: 4 + ((x * 13) % 16),
            top: 4 + ((y * 11) % 16),
            width: 2,
            height: 2,
            background: "#5c2c08",
            opacity: 0.6,
          }}
        />
      )}
    </div>
  );
}

function WallTile({
  style,
  y,
}: {
  style: React.CSSProperties;
  y: number;
}) {
  // Brick pattern: dark base with two lighter "brick" rectangles. Offset on
  // alternating rows so it doesn't look like a plain grid.
  const offset = y % 2 === 0 ? 0 : -TILE_SIZE / 2;
  return (
    <div style={{ ...style, background: WALL_BASE, overflow: "hidden" }}>
      {/* mortar line across the middle */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: TILE_SIZE / 2 - 1,
          height: 1,
          background: WALL_DARK,
        }}
      />
      {/* vertical brick seams (top row) */}
      <div
        style={{
          position: "absolute",
          left: offset + TILE_SIZE / 2,
          top: 0,
          width: 1,
          height: TILE_SIZE / 2,
          background: WALL_DARK,
        }}
      />
      {/* vertical brick seams (bottom row, offset to break the grid) */}
      <div
        style={{
          position: "absolute",
          left: offset === 0 ? TILE_SIZE / 2 + TILE_SIZE / 2 : 0,
          top: TILE_SIZE / 2,
          width: 1,
          height: TILE_SIZE / 2,
          background: WALL_DARK,
        }}
      />
      {/* subtle top highlight on each brick row */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 1,
          background: WALL_LIGHT,
          opacity: 0.45,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: TILE_SIZE / 2,
          height: 1,
          background: WALL_LIGHT,
          opacity: 0.25,
        }}
      />
    </div>
  );
}

/** Render an 8×8 character grid as a stack of 4×4 colored blocks within
 *  a tile. Each char → one 4×4-px block. '.' or ' ' is transparent. */
function FurnitureBlock({ grid }: { grid: string[] }) {
  const blocks: { x: number; y: number; color: string }[] = [];
  const px = TILE_SIZE / 8; // 4px per block when TILE_SIZE is 32
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === "." || ch === " ") continue;
      const color = TILE_PALETTE[ch];
      if (!color) continue;
      blocks.push({ x: x * px, y: y * px, color });
    }
  }
  return (
    <>
      {blocks.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: b.x,
            top: b.y,
            width: px,
            height: px,
            background: b.color,
          }}
        />
      ))}
    </>
  );
}

function NPCLayer({ npcs }: { npcs: NPC[] }) {
  return (
    <>
      {npcs.map((n) => (
        <NPCSprite key={n.id} npc={n} />
      ))}
    </>
  );
}

function NPCSprite({ npc }: { npc: NPC }) {
  const sprite = getNPCSprite(npc.id);
  return (
    <div
      title={`${npc.name} — ${npc.blurb}`}
      style={{
        position: "absolute",
        left: npc.position.x * TILE_SIZE,
        top: npc.position.y * TILE_SIZE,
        width: TILE_SIZE,
        height: TILE_SIZE,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 5,
      }}
    >
      <PixelSprite
        grid={sprite.grid}
        palette={sprite.palette}
        size={SPRITE_SIZE}
        shadow
        animated={false}
      />
    </div>
  );
}

function Player({
  x,
  y,
  facing,
  onWater,
}: {
  x: number;
  y: number;
  facing: Facing;
  onWater: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x * TILE_SIZE,
        top: y * TILE_SIZE,
        width: TILE_SIZE,
        height: TILE_SIZE,
        transition: "left 130ms ease-out, top 130ms ease-out",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 6,
      }}
    >
      <div style={{ position: "relative" }}>
        <PixelSprite
          grid={sp_player.grid}
          palette={sp_player.palette}
          size={SPRITE_SIZE}
          shadow={!onWater}
          animated
        />
        {onWater && <KayakBoat />}
        <FacingPip facing={facing} />
      </div>
    </div>
  );
}

/** Cyan kayak hull drawn behind the player when paddling on water. */
function KayakBoat() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: -3,
        right: -3,
        bottom: -1,
        height: 8,
        background: "#22d3ee",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 0 rgba(0,0,0,0.4), 0 2px 0 #0c0e14",
        borderRadius: "40% 40% 30% 30% / 50% 50% 30% 30%",
        zIndex: -1,
      }}
    />
  );
}

/** Small "look direction" yellow pip overlaid on the player's sprite.
 *  Lets the user see which way they're facing without needing 4 sprites. */
function FacingPip({ facing }: { facing: Facing }) {
  const base: React.CSSProperties = {
    position: "absolute",
    width: 4,
    height: 4,
    background: "#fde68a",
    boxShadow: "0 0 0 1px #0c0e14",
  };
  // The sprite is ~SPRITE_SIZE × SPRITE_SIZE with the figure centered.
  // Place the pip just outside the silhouette in the facing direction.
  if (facing === "up")
    return <div style={{ ...base, top: -2, left: "50%", transform: "translateX(-50%)" }} />;
  if (facing === "down")
    return <div style={{ ...base, bottom: -2, left: "50%", transform: "translateX(-50%)" }} />;
  if (facing === "left")
    return <div style={{ ...base, left: -2, top: "55%", transform: "translateY(-50%)" }} />;
  return <div style={{ ...base, right: -2, top: "55%", transform: "translateY(-50%)" }} />;
}

/** Painted floor labels for ambient flavor — no gameplay effect. */
function FloorLabels({ sceneId }: { sceneId: SceneId }) {
  const labels: { x: number; y: number; text: string }[] =
    sceneId === "office"
      ? [
          { x: 2, y: 1, text: "BAR" },
          { x: 14, y: 1, text: "KITCHENETTE" },
          { x: 11, y: 4, text: "MAIN STAGE" },
          { x: 4, y: 7, text: "DESKS" },
          { x: 14, y: 7, text: "VIBE LOUNGE" },
          { x: 5, y: 12, text: "NETWORKING" },
          { x: 8, y: 14, text: "← ENTRANCE" },
          { x: 20, y: 6, text: "TO PIER →" },
        ]
      : [
          { x: 0, y: 0, text: "← OFFICE" },
          { x: 4, y: 4, text: "PIER 67" },
          { x: 14, y: 1, text: "ISLAND" },
          { x: 14, y: 6, text: "OPEN WATER" },
          { x: 2, y: 9, text: "BOARDWALK" },
        ];
  return (
    <>
      {labels.map((l) => (
        <div
          key={`${l.x},${l.y}`}
          style={{
            position: "absolute",
            left: l.x * TILE_SIZE,
            top: l.y * TILE_SIZE - 4,
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 7,
            letterSpacing: 1,
            color: "rgba(255,255,255,0.15)",
            pointerEvents: "none",
            zIndex: 3,
            textShadow: "0 1px 0 rgba(0,0,0,0.6)",
          }}
        >
          {l.text}
        </div>
      ))}
    </>
  );
}

/* ─── Dialogue ────────────────────────────────────────────────────── */

function hasEngagedAllMythosTrainers(
  engaged: string[],
  currentNpcId?: string,
  defeated: string[] = []
): boolean {
  const seen = new Set([...engaged, ...defeated]);
  if (currentNpcId) seen.add(currentNpcId);
  return MYTHOS_REQUIRED_NPC_IDS.every((id) => seen.has(id));
}

type DialogueKind =
  | "system"
  | "pre-battle"
  | "post-defeat"
  | "heal-intro"
  | "heal-prompt"
  | "heal-confirm"
  | "kayak-intro"
  | "talk-intro"
  | "vendor-intro"
  | "vc-intro";

/** Map an NPC id to the legendary slot it unlocks on victory (if any). */
function adventureUnlockFor(npcId: string): LegendaryId | null {
  if (npcId === "wild-memoryno") return "memoryno";
  if (npcId === "wild-truck") return "truckanon";
  return null;
}

interface DialogueState {
  lines: string[];
  kind: DialogueKind;
  npcId?: string;
  /** If true, the speaker is a wild encounter NPC (not on the scene map). */
  fromWild?: boolean;
}

function DialogueBox({
  dialogue,
  onAdvance,
  onConfirmHeal,
}: {
  dialogue: DialogueState;
  onAdvance: () => void;
  onConfirmHeal: (npcId: string, yes: boolean) => void;
}) {
  const line = dialogue.lines[0] ?? "";
  const speaker = dialogue.npcId ? findKnownNPC(dialogue.npcId) : undefined;
  const isHealConfirm = dialogue.kind === "heal-confirm";

  return (
    <div
      className="absolute left-3 right-3 bottom-3 z-20"
      onClick={() => {
        if (!isHealConfirm) onAdvance();
      }}
    >
      <div
        className="rounded-md p-3 pr-10 relative cursor-pointer"
        style={{
          background:
            "linear-gradient(180deg, rgba(248,250,252,0.97), rgba(226,232,240,0.97))",
          boxShadow:
            "0 0 0 3px #0a0a14, 0 0 0 5px rgba(255,255,255,0.9), 0 12px 30px rgba(0,0,0,0.6)",
          fontFamily: "'Press Start 2P', monospace",
        }}
      >
        {speaker && (
          <div
            className="absolute -top-3 left-3 px-2 py-0.5 rounded"
            style={{
              background: "#0a0a14",
              color: "#fde68a",
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 8,
              letterSpacing: 1,
            }}
          >
            {speaker.name}
          </div>
        )}
        <div
          style={{
            fontSize: 11,
            lineHeight: 1.7,
            color: "#0a0a14",
            letterSpacing: 0.5,
          }}
        >
          {line}
        </div>

        {isHealConfirm && dialogue.npcId ? (
          <div className="mt-2 flex gap-2 text-[10px]" style={{ fontFamily: "'Press Start 2P', monospace" }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onConfirmHeal(dialogue.npcId!, true);
              }}
              className="px-3 py-1.5 rounded bg-emerald-600 text-white hover:brightness-110"
            >
              YES
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onConfirmHeal(dialogue.npcId!, false);
              }}
              className="px-3 py-1.5 rounded bg-slate-700 text-white hover:brightness-110"
            >
              NO
            </button>
            <div className="text-[9px] text-slate-700 self-center ml-2">
              (Y / N)
            </div>
          </div>
        ) : (
          <div
            className="absolute right-3 bottom-2 animate-pulse"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 10,
              color: "#0a0a14",
            }}
          >
            ▼
          </div>
        )}
      </div>
    </div>
  );
}

