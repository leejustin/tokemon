import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AIModel } from "../data/types";
import { statTotal } from "../data/models";
import { ModelEmblem } from "./ModelEmblem";
import { TypeBadge } from "./TypeBadge";
import { getLabBranding } from "../data/labBranding";
import { isColossus, isHang, isLegendary, isMythos } from "../data/legendary";

type Side = "left" | "right";
type Mode = "auto" | "manual";
type Phase =
  | "mode-select"
  | "intro"
  | "open"
  | "ready"
  | "fight"
  | "winner";

/** When it's the player's turn in manual mode, this controls who's "thinking". */
type Actor = "player" | "ai" | "anim" | null;

/**
 * Adventure-mode hook-up. When set, this component:
 *   - skips the mode-select overlay (always manual),
 *   - starts the player (left side) at `playerStartHP` instead of full HP,
 *   - calls `onResolve` once a winner is decided.
 *
 * Token burn is reported in real dollars (matching the BurnLedger) so the
 * adventure can debit it from the player's credit balance.
 */
export interface AdventureBattleHook {
  playerStartHP: number;
  preBattleNote?: string;
  onResolve: (result: {
    won: boolean;
    finalPlayerHP: number;
    tokensBurned: number;
  }) => void;
}

interface Props {
  /** All selected models. We split into teams automatically (see splitTeams). */
  models: AIModel[];
  onClose: () => void;
  /** Switch to the side-by-side comparison view. */
  onShowDetails: () => void;
  /** When set, run in adventure / campaign mode. See `AdventureBattleHook`. */
  adventure?: AdventureBattleHook;
}

const HP_PER_SIDE = 100;
const AUTO_SWING_INTERVAL_MS = 900;
const ANIM_DURATION_MS = 700;
const AI_THINK_MS = 520;

const TOKENS_PER_ATTACK_IN = 1500;
const TOKENS_PER_ATTACK_OUT = 800;
/** Cash-incinerator multiplier for Grok Colossus. Every swing it makes
 *  burns 100× the normal token count. */
const COLOSSUS_BURN_MULT = 100;
/** Hang chance for GPT-o∞ when it's about to attack. */
const HANG_CHANCE = 0.25;
const MAX_ATTACK_DROPS = 3;
const ATTACK_DROP_MULT = 0.15;
/** Each side can use heal moves (Community Patch, Recover Cache, etc.) at
 *  most this many times per battle. Stops the AI from spamming "Community
 *  Patch" forever and stalling the match. Pokemon-style PP, basically. */
const MAX_HEALS_PER_SIDE = 3;

/**
 * Pokemon-style battle scene with two modes:
 *
 *   • **Manual** — You control the LEFT team. Pick a move each turn from your
 *     active modelmon's 4-move set; the right team is an "AI" trainer that
 *     auto-picks a move in response. Real Pokemon-style: turn-based, with
 *     damage rolls, crits, and HP bars depleted as moves land.
 *
 *   • **Auto** — Both teams auto-swing on a timer using the same damage
 *     engine. Pure spectator mode (closer to the original cutscene).
 *
 * Both modes share the same `applySwing()` resolution, so damage feels
 * identical whether you're playing or just watching.
 *
 * Team rules (unchanged):
 *   2 models → 1 vs 1
 *   3 models → 1 vs 2  (top stat solo)
 *   4 models → 2 vs 2  (top + bottom vs the middle two — balances by talent)
 *
 * Legendaries keep their flavor through moves and quirks, but still use the
 * same turn loop so battles stay interactive.
 */
export function BattleScene({
  models,
  onClose,
  onShowDetails,
  adventure,
}: Props) {
  const { left, right } = useMemo(() => splitTeams(models), [models]);
  const isAdventure = !!adventure;

  // Adventure runs always-manual; otherwise the user picks first.
  const [mode, setMode] = useState<Mode | null>(isAdventure ? "manual" : null);
  const [phase, setPhase] = useState<Phase>(
    isAdventure ? "intro" : "mode-select"
  );
  const [actor, setActor] = useState<Actor>(null);
  const [leftHP, setLeftHP] = useState(
    isAdventure
      ? Math.max(1, Math.min(HP_PER_SIDE, adventure!.playerStartHP))
      : HP_PER_SIDE
  );
  const [rightHP, setRightHP] = useState(HP_PER_SIDE);
  /** Whether the player has won/lost in adventure mode — gates onResolve. */
  const resolvedRef = useRef(false);
  const [attackerSide, setAttackerSide] = useState<Side | null>(null);
  const [shake, setShake] = useState<Side | null>(null);
  const [activeIdx, setActiveIdx] = useState<{ left: number; right: number }>({
    left: 0,
    right: 0,
  });
  const [attackDrops, setAttackDrops] = useState<Record<Side, number>>({
    left: 0,
    right: 0,
  });
  const [log, setLog] = useState<string[]>(["A wild matchup begins!"]);
  const [burned, setBurned] = useState<{ left: number; right: number }>({
    left: 0,
    right: 0,
  });
  /** Set by `applySwing` when GPT-o∞ hangs. The hang effect below watches
   *  this and renders the glitch overlay + stack-trace dump. */
  const [hangEvent, setHangEvent] = useState<{
    side: Side;
    modelName: string;
  } | null>(null);

  // Latest refs — used inside async chains where captured state would go stale.
  const leftHPRef = useRef(leftHP);
  const rightHPRef = useRef(rightHP);
  const activeIdxRef = useRef(activeIdx);
  const attackDropsRef = useRef(attackDrops);
  leftHPRef.current = leftHP;
  rightHPRef.current = rightHP;
  activeIdxRef.current = activeIdx;
  attackDropsRef.current = attackDrops;

  /** Sum of $ burned by both sides — debited from adventure credits once. */
  const totalBurned = burned.left + burned.right;

  /** Per-side heal-move usage counter. We hard-cap heals at MAX_HEALS_PER_SIDE
   *  so the AI can't loop "Community Patch" forever and stall the match. */
  const healsUsedRef = useRef<{ left: number; right: number }>({
    left: 0,
    right: 0,
  });

  const leftPower = teamPower(left);
  const rightPower = teamPower(right);

  // Winner is computed from live HP once we're in "winner" phase. A hang
  // always forces a draw regardless of HP.
  const winner: Side | null =
    phase === "winner"
      ? hangEvent
        ? null
        : leftHP <= 0 && rightHP <= 0
          ? null
          : rightHP <= 0
            ? "left"
            : leftHP <= 0
              ? "right"
              : leftHP === rightHP
                ? null
                : leftHP > rightHP
                  ? "left"
                  : "right"
      : null;

  /* ─── Helpers (memoized) ───────────────────────────────────────────── */

  const activeMember = useCallback(
    (side: Side): AIModel => {
      const team = side === "left" ? left : right;
      // Read from ref so async chains in the auto-loop see live rotations.
      const idx =
        side === "left" ? activeIdxRef.current.left : activeIdxRef.current.right;
      return team[idx % team.length];
    },
    [left, right]
  );

  const rotateActive = useCallback(
    (side: Side) => {
      setActiveIdx((cur) => {
        if (side === "left") {
          return { ...cur, left: (cur.left + 1) % left.length };
        }
        return { ...cur, right: (cur.right + 1) % right.length };
      });
    },
    [left.length, right.length]
  );

  /** Resolve one attacker→defender swing: applies damage, animates, logs, and
   *  rotates active member.
   *
   *  Returns `{ defenderHP, hung }`. When `hung` is true, GPT-o∞ has errored
   *  out: damage is NOT applied, but the battle is forced into a draw and
   *  callers should bail out of their swing loops. The hang effect itself is
   *  rendered by the dedicated `useEffect` that watches `hangEvent`.
   */
  const applySwing = useCallback(
    (attackerSideArg: Side, move: Move): { defenderHP: number; hung: boolean } => {
      const attacker = activeMember(attackerSideArg);

      // Hang mechanic — GPT-o∞ rolls before doing anything. On hang we never
      // even compute damage; we just trigger the error sequence.
      //
      // Compare-mode only: in adventure mode a forced draw would mean the
      // NPC neither counts as defeated nor as a clean loss, which is just
      // frustrating. Adventure runs treat GPT-o∞ as a normal heavy hitter.
      if (
        !isAdventure &&
        isHang(attacker) &&
        Math.random() < HANG_CHANCE
      ) {
        setHangEvent({ side: attackerSideArg, modelName: attacker.name });
        return { defenderHP: NaN, hung: true };
      }

      const defenderSide: Side = attackerSideArg === "left" ? "right" : "left";
      const cost = attackCost(attacker);
      const colossus = isColossus(attacker);

      setAttackerSide(attackerSideArg);
      setShake(move.effect === "heal" ? null : defenderSide);

      const currentDefHP =
        defenderSide === "left" ? leftHPRef.current : rightHPRef.current;

      setBurned((b) =>
        attackerSideArg === "left"
          ? { ...b, left: b.left + cost }
          : { ...b, right: b.right + cost }
      );

      if (move.effect === "heal") {
        healsUsedRef.current = {
          ...healsUsedRef.current,
          [attackerSideArg]: healsUsedRef.current[attackerSideArg] + 1,
        };
        const currentAttackerHP =
          attackerSideArg === "left" ? leftHPRef.current : rightHPRef.current;
        const healedHP = Math.min(HP_PER_SIDE, currentAttackerHP + move.power);
        const recovered = healedHP - currentAttackerHP;
        if (attackerSideArg === "left") {
          leftHPRef.current = healedHP;
          setLeftHP(healedHP);
        } else {
          rightHPRef.current = healedHP;
          setRightHP(healedHP);
        }
        setLog((l) =>
          truncatedLog([
            ...l,
            `${attacker.name} used ${move.name}!  +${recovered} HP  ·  ${
              colossus ? "🔥 " : ""
            }${formatUSD(cost)}${colossus ? " incinerated" : ""}`,
          ])
        );
        rotateActive(attackerSideArg);
        return { defenderHP: currentDefHP, hung: false };
      }

      if (move.effect === "attackDown") {
        const nextDrop = Math.min(
          MAX_ATTACK_DROPS,
          attackDropsRef.current[defenderSide] + 1
        );
        attackDropsRef.current = {
          ...attackDropsRef.current,
          [defenderSide]: nextDrop,
        };
        setAttackDrops((cur) => ({ ...cur, [defenderSide]: nextDrop }));
        setLog((l) =>
          truncatedLog([
            ...l,
            `${attacker.name} used ${move.name}!  ${teamLabel(
              defenderSide
            )} Attack fell  ·  ${colossus ? "🔥 " : ""}${formatUSD(cost)}${
              colossus ? " incinerated" : ""
            }`,
          ])
        );
        rotateActive(attackerSideArg);
        return { defenderHP: currentDefHP, hung: false };
      }

      const defender = activeMember(defenderSide);
      const { hp: dmg, crit } = computeDamage(
        attacker,
        defender,
        move,
        attackDropsRef.current[attackerSideArg]
      );
      const newDefHP = Math.max(0, currentDefHP - dmg);

      if (defenderSide === "left") {
        leftHPRef.current = newDefHP;
        setLeftHP(newDefHP);
      } else {
        rightHPRef.current = newDefHP;
        setRightHP(newDefHP);
      }

      setLog((l) =>
        truncatedLog([
          ...l,
          `${attacker.name} used ${move.name}!  ${
            crit ? "✦ critical! " : ""
          }-${dmg} HP  ·  ${colossus ? "🔥 " : ""}${formatUSD(cost)}${
            colossus ? " incinerated" : ""
          }`,
        ])
      );

      // Rotate active member of the attacking side (keeps multi-member teams fun)
      rotateActive(attackerSideArg);

      return { defenderHP: newDefHP, hung: false };
    },
    [activeMember, isAdventure, rotateActive]
  );

  /* ─── Intro / phase orchestration ─────────────────────────────────── */

  // After the user picks a mode, run the intro cinematic.
  useEffect(() => {
    if (mode === null) return;
    let canceled = false;
    const timeouts: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((res) => {
        const t = window.setTimeout(res, ms);
        timeouts.push(t);
      });

    (async () => {
      setPhase("intro");
      setLog(
        isAdventure
          ? [adventure!.preBattleNote ?? "A challenger appears!"]
          : [`Mode: ${mode === "manual" ? "Manual" : "Auto"} battle.`]
      );
      await wait(550);
      if (canceled) return;
      setPhase("open");
      const intro = [
        ...left.map((m) => `${m.name} was sent out!`),
        ...right.map((m) => `${m.name} was sent out!`),
      ].slice(0, 4);
      setLog((l) => [...l, ...intro]);
      await wait(550);
      if (canceled) return;
      setPhase("ready");
      await wait(280);
      if (canceled) return;
      setPhase("fight");
      // Player goes first in manual mode. In auto mode, the auto-loop drives.
      setActor(mode === "manual" ? "player" : null);
    })();

    return () => {
      canceled = true;
      timeouts.forEach((t) => window.clearTimeout(t));
    };
  }, [mode, left, right]);

  /* ─── GPT-o∞ hang ─────────────────────────────────────────────────── */

  // Runs once each time applySwing reports a hang. Dumps a stack-trace into
  // the battle log, then ends the fight as a forced draw with a special
  // banner via `errorState`. The CRT glitch overlay is rendered in the JSX.
  useEffect(() => {
    if (!hangEvent) return;
    let canceled = false;
    const timeouts: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((res) => {
        const t = window.setTimeout(res, ms);
        timeouts.push(t);
      });

    (async () => {
      setLog((l) =>
        truncatedLog([
          ...l,
          `${hangEvent.modelName} is thinking…`,
          "(reasoning_traces=∞)",
        ])
      );
      await wait(900);
      if (canceled) return;
      setLog((l) =>
        truncatedLog([
          ...l,
          "ERROR · Connection reset by peer",
          "504 Gateway Timeout",
          "Context length exceeded: 4_194_304 / 4_194_304",
          "TimeoutError(reasoning_traces)",
        ])
      );
      await wait(1100);
      if (canceled) return;
      // Force a draw — leave HPs intact, just end the battle.
      setAttackerSide(null);
      setShake(null);
      setPhase("winner");
    })();

    return () => {
      canceled = true;
      timeouts.forEach((t) => window.clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hangEvent]);

  /* ─── Multi-legendary chaos line ──────────────────────────────────── */

  // Just a flavor line on entry — no mechanics change.
  useEffect(() => {
    if (phase !== "open") return;
    const allCombatants = [...left, ...right];
    const legendaryCount = allCombatants.filter(isLegendary).length;
    if (legendaryCount >= 2) {
      const line =
        legendaryCount >= 3
          ? "Three legendaries enter the arena. Reality buckles."
          : "Two legendaries face off. The air tastes like ozone and venture capital.";
      setLog((l) => truncatedLog([...l, line]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ─── Auto-mode driver ────────────────────────────────────────────── */

  useEffect(() => {
    if (phase !== "fight" || mode !== "auto") return;

    let canceled = false;
    let swingCount = 0;
    const timeouts: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((res) => {
        const t = window.setTimeout(res, ms);
        timeouts.push(t);
      });

    (async () => {
      // Initial breath before first swing
      await wait(400);
      while (!canceled) {
        // Decide attacker side: alternate to keep it lively
        const attacker: Side = swingCount % 2 === 0 ? "left" : "right";
        const member = activeMember(attacker);
        const allMoves = moveSetFor(member);
        // Filter out heals once a side has hit its heal cap so neither
        // team can stall forever by random-rolling Community Patch.
        const moves =
          healsUsedRef.current[attacker] >= MAX_HEALS_PER_SIDE
            ? allMoves.filter((m) => m.effect !== "heal")
            : allMoves;
        const pool = moves.length > 0 ? moves : allMoves;
        const move = pool[Math.floor(Math.random() * pool.length)];

        const swing = applySwing(attacker, move);
        if (swing.hung) {
          // Hang handler will set phase=winner with a forced-draw banner.
          return;
        }
        await wait(ANIM_DURATION_MS);
        if (canceled) return;
        setAttackerSide(null);
        setShake(null);

        if (swing.defenderHP <= 0) {
          await wait(450);
          if (canceled) return;
          const winnerName = (attacker === "left" ? left : right)
            .map((m) => m.name)
            .join(" + ");
          setLog((l) =>
            truncatedLog([...l, `${winnerName}'s team wins!`])
          );
          setPhase("winner");
          return;
        }

        swingCount++;
        await wait(AUTO_SWING_INTERVAL_MS - ANIM_DURATION_MS);
        if (canceled) return;
      }
    })();

    return () => {
      canceled = true;
      timeouts.forEach((t) => window.clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mode]);

  /* ─── Manual mode: player + AI handlers ───────────────────────────── */

  const aiRespond = useCallback(async () => {
    // Brief "thinking" beat, then choose a move and swing.
    await new Promise((r) => window.setTimeout(r, AI_THINK_MS));
    if (rightHPRef.current <= 0 || leftHPRef.current <= 0) return;
    const member = activeMember("right");
    const allMoves = moveSetFor(member);
    // Once the AI has used its heal allowance, drop heal moves so it
    // can't loop "Community Patch" forever and stall the battle.
    const moves =
      healsUsedRef.current.right >= MAX_HEALS_PER_SIDE
        ? allMoves.filter((m) => m.effect !== "heal")
        : allMoves;
    const move = pickAIMove(
      moves.length > 0 ? moves : allMoves,
      member,
      activeMember("left"),
      rightHPRef.current
    );
    setActor("anim");
    const swing = applySwing("right", move);
    if (swing.hung) {
      setActor(null);
      return;
    }
    await new Promise((r) => window.setTimeout(r, ANIM_DURATION_MS));
    setAttackerSide(null);
    setShake(null);
    if (swing.defenderHP <= 0) {
      setLog((l) =>
        truncatedLog([...l, `${activeMember("right").name}'s team wins!`])
      );
      setPhase("winner");
      setActor(null);
      return;
    }
    setActor("player");
  }, [activeMember, applySwing]);

  const onPlayerMove = useCallback(
    async (move: Move) => {
      if (phase !== "fight" || mode !== "manual" || actor !== "player") return;
      setActor("anim");
      const swing = applySwing("left", move);
      if (swing.hung) {
        setActor(null);
        return;
      }
      await new Promise((r) => window.setTimeout(r, ANIM_DURATION_MS));
      setAttackerSide(null);
      setShake(null);
      if (swing.defenderHP <= 0) {
        setLog((l) =>
          truncatedLog([...l, `${activeMember("left").name}'s team wins!`])
        );
        setPhase("winner");
        setActor(null);
        return;
      }
      setActor("ai");
      void aiRespond();
    },
    [activeMember, actor, aiRespond, applySwing, mode, phase]
  );

  /* ─── Adventure resolution ────────────────────────────────────────── */

  // In adventure mode, we defer `onResolve` until the user actually dismisses
  // the battle — so they get to read the winner banner first. The wrapped
  // `closeBattle` below fires both in a single click.
  const closeBattle = useCallback(() => {
    if (isAdventure && adventure && !resolvedRef.current) {
      resolvedRef.current = true;
      const playerWon = rightHP <= 0 && leftHP > 0;
      adventure.onResolve({
        won: playerWon,
        finalPlayerHP: Math.max(0, Math.round(leftHP)),
        tokensBurned: totalBurned,
      });
    }
    onClose();
  }, [isAdventure, adventure, leftHP, rightHP, totalBurned, onClose]);

  /* ─── Esc closes ──────────────────────────────────────────────────── */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeBattle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeBattle]);

  function forfeit() {
    // Used by "Skip" in auto mode — resolve by current HP
    setPhase("winner");
    const w: Side | null =
      leftHP === rightHP
        ? null
        : leftHP > rightHP
          ? "left"
          : "right";
    setLog((l) =>
      truncatedLog([
        ...l,
        w === null
          ? "It's a draw!"
          : `${(w === "left" ? left : right).map((m) => m.name).join(" + ")} wins!`,
      ])
    );
  }

  /* ─── Render ──────────────────────────────────────────────────────── */

  const playerActive = activeMember("left");
  const playerMoves = moveSetFor(playerActive);
  const [selectedMoveIndex, setSelectedMoveIndex] = useState(0);
  const isPlayerTurn =
    mode === "manual" && phase === "fight" && actor === "player";
  const isAITurn = mode === "manual" && phase === "fight" && actor === "ai";

  useEffect(() => {
    setSelectedMoveIndex((idx) => Math.min(idx, playerMoves.length - 1));
  }, [playerMoves.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || isTypingTarget(e.target)) return;
      if (e.key === "Escape") return;

      if (phase === "mode-select") {
        if (e.key === "1" || e.key.toLowerCase() === "m") {
          setMode("manual");
          e.preventDefault();
        } else if (e.key === "2" || e.key.toLowerCase() === "a") {
          setMode("auto");
          e.preventDefault();
        }
        return;
      }

      if (phase === "winner" && (e.key === "Enter" || e.key === " ")) {
        if (isAdventure) closeBattle();
        else onShowDetails();
        e.preventDefault();
        return;
      }

      if (!isPlayerTurn) return;

      const digit = Number(e.key);
      if (Number.isInteger(digit) && digit >= 1 && digit <= playerMoves.length) {
        void onPlayerMove(playerMoves[digit - 1]);
        e.preventDefault();
        return;
      }

      const cols = 2;
      const lastIndex = playerMoves.length - 1;
      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          setSelectedMoveIndex((idx) => Math.max(0, idx - 1));
          e.preventDefault();
          break;
        case "ArrowRight":
        case "d":
        case "D":
          setSelectedMoveIndex((idx) => Math.min(lastIndex, idx + 1));
          e.preventDefault();
          break;
        case "ArrowUp":
        case "w":
        case "W":
          setSelectedMoveIndex((idx) => Math.max(0, idx - cols));
          e.preventDefault();
          break;
        case "ArrowDown":
        case "s":
        case "S":
          setSelectedMoveIndex((idx) => Math.min(lastIndex, idx + cols));
          e.preventDefault();
          break;
        case "Enter":
        case " ":
          void onPlayerMove(playerMoves[selectedMoveIndex]);
          e.preventDefault();
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    closeBattle,
    isAdventure,
    isPlayerTurn,
    onPlayerMove,
    onShowDetails,
    phase,
    playerMoves,
    selectedMoveIndex,
  ]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-pop"
      onClick={closeBattle}
      role="dialog"
      aria-label="Battle scene"
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl border border-white/10 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          background:
            "linear-gradient(180deg, #1e293b 0%, #0f172a 50%, #050810 100%)",
          // Cap to viewport so the sticky footer (Continue button) stays
          // reachable on phones, where the arena + log otherwise push it
          // below the fold.
          maxHeight: "calc(100dvh - 1rem)",
        }}
      >
        <button
          type="button"
          onClick={closeBattle}
          aria-label="Close"
          className="absolute top-3 right-3 z-30 px-2 py-1 rounded-md text-xs font-semibold bg-white/[0.08] text-ink-100 hover:bg-white/[0.16]"
        >
          ✕
        </button>

        {/* Scrollable middle: header, arena, ledger, log. The footer below
            stays sticky so "Continue →" / "View comparison →" is always
            tappable on small screens. */}
        <div className="flex-1 min-h-0 overflow-y-auto rounded-t-2xl">
        {/* Team headers */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 p-2 sm:p-4 pb-0">
          <TeamBar
            team={left}
            hp={leftHP}
            power={leftPower}
            burned={burned.left}
            align="left"
            label={mode === "manual" ? "You" : undefined}
          />
          <TeamBar
            team={right}
            hp={rightHP}
            power={rightPower}
            burned={burned.right}
            align="right"
            label={mode === "manual" ? "Rival" : undefined}
          />
        </div>

        {/* Arena */}
        <div className="relative h-[150px] sm:h-[340px] md:h-[380px] mx-2 sm:mx-4 mt-2 sm:mt-4 rounded-xl overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, #0e1729 0%, #1c2742 45%, #2c1a4a 60%, #1a1023 100%)",
            }}
          />
          <div
            className="absolute left-0 right-0 top-[58%] h-px"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />

          <TeamSide
            side="left"
            team={left}
            phase={phase}
            isAttacking={attackerSide === "left"}
            isHit={shake === "left"}
            activeIdx={activeIdx.left}
            fainted={phase === "winner" && winner === "right"}
          />
          <TeamSide
            side="right"
            team={right}
            phase={phase}
            isAttacking={attackerSide === "right"}
            isHit={shake === "right"}
            activeIdx={activeIdx.right}
            fainted={phase === "winner" && winner === "left"}
          />

          {shake && (
            <div
              key={`flash-${shake}-${leftHP}-${rightHP}`}
              className="absolute inset-0 pointer-events-none animate-hit-flash"
              style={{ background: "rgba(255,255,255,0.18)" }}
            />
          )}

          {hangEvent && <HangGlitch />}

          {/* Mode-select overlay */}
          {phase === "mode-select" && (
            <ModeSelect
              onPick={(m) => {
                setMode(m);
              }}
            />
          )}

          {phase === "winner" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {hangEvent ? (
                <div
                  className="px-6 py-4 rounded-xl text-center animate-pop"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(16,163,127,0.15), rgba(0,0,0,0.55))",
                    boxShadow:
                      "inset 0 0 0 1px rgba(16,163,127,0.4), 0 10px 40px rgba(0,0,0,0.6)",
                  }}
                >
                  <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-emerald-300">
                    Battle Errored
                  </div>
                  <div className="text-2xl font-display font-black text-white mt-1 font-mono">
                    {hangEvent.modelName} hung
                  </div>
                  <div className="text-xs text-ink-300 mt-1 font-mono">
                    TimeoutError(reasoning_traces) · forced draw
                  </div>
                </div>
              ) : (
                <div
                  className="px-6 py-4 rounded-xl text-center animate-pop"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(0,0,0,0.4))",
                    boxShadow:
                      "inset 0 0 0 1px rgba(255,255,255,0.15), 0 10px 40px rgba(0,0,0,0.6)",
                  }}
                >
                  <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-amber-300">
                    {winner === null ? "Draw" : "Winner"}
                  </div>
                  <div className="text-2xl font-display font-black text-white mt-1">
                    {winner === null
                      ? "Stalemate"
                      : (winner === "left" ? left : right)
                          .map((m) => m.name)
                          .join(" + ")}
                  </div>
                  <div className="text-xs text-ink-300 mt-1">
                    Battle Power {leftPower} vs {rightPower}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Money burned ledger */}
        <BurnLedger
          left={left}
          right={right}
          burnedLeft={burned.left}
          burnedRight={burned.right}
        />

        {/* Action area: manual move picker, or battle log in auto mode */}
        {mode === "manual" && phase === "fight" ? (
          <ManualActionPanel
            active={playerActive}
            moves={playerMoves}
            canPick={isPlayerTurn}
            waiting={isAITurn}
            log={log}
            onPick={onPlayerMove}
            rivalName={teamName(right)}
            selectedIndex={selectedMoveIndex}
            onSelectIndex={setSelectedMoveIndex}
          />
        ) : (
          <div className="m-4 mt-4 rounded-xl bg-white/[0.05] ring-1 ring-inset ring-white/10 p-3 min-h-[64px]">
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-500 mb-1">
              Battle Log
            </div>
            <div className="text-sm text-ink-200 leading-snug font-mono space-y-0.5">
              {log.slice(-3).map((line, i, arr) => (
                <div
                  key={`${log.length}-${i}`}
                  className={i === arr.length - 1 ? "text-white" : "text-ink-300"}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        </div>
        {/* Footer actions — sticky at the bottom of the panel. */}
        <div
          className="flex items-center justify-between gap-3 p-3 sm:p-4 shrink-0 border-t border-white/10 rounded-b-2xl"
          style={{
            background:
              "linear-gradient(180deg, rgba(5,8,16,0) 0%, rgba(5,8,16,0.85) 30%, #050810 100%)",
          }}
        >
          <div className="hidden sm:flex text-[11px] text-ink-500 items-center gap-1.5 flex-wrap min-w-0">
            <TeamTypeChips team={left} />
            <span className="text-ink-600 mx-1">vs</span>
            <TeamTypeChips team={right} />
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {phase === "fight" && mode === "auto" && (
              <button
                type="button"
                onClick={forfeit}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-white/[0.05] text-ink-200 hover:bg-white/[0.1]"
              >
                Skip ⏭
              </button>
            )}
            <button
              type="button"
              onClick={isAdventure ? closeBattle : onShowDetails}
              className="px-3 py-2 rounded-lg text-sm font-semibold bg-pokered-500 text-white hover:brightness-110 shadow-lg shadow-pokered-500/30"
            >
              {isAdventure
                ? phase === "winner"
                  ? "Continue →"
                  : "Forfeit →"
                : "View detailed comparison →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Mode select overlay ─────────────────────────────────────────── */

function ModeSelect({ onPick }: { onPick: (m: Mode) => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/65 backdrop-blur-[2px]">
      <div
        className="px-6 py-5 rounded-xl text-center max-w-md w-[88%]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(0,0,0,0.5))",
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.15), 0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-amber-300">
          Choose your style
        </div>
        <div className="font-display font-black text-white text-xl mt-1">
          How will you battle?
        </div>
        <div className="text-xs text-ink-300 mt-1.5 leading-relaxed">
          Pick your own moves like a real Trainer, or sit back and let the
          arena settle it.
        </div>
        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <button
            type="button"
            onClick={() => onPick("manual")}
            className="rounded-lg px-3 py-3 text-left bg-pokered-500/90 hover:bg-pokered-500 text-white transition active:scale-[0.98]"
          >
            <div className="font-display font-bold text-sm">⚔ Manual</div>
            <div className="text-[10px] text-white/85 mt-0.5 leading-snug">
              You pick moves. AI plays the rival side.
            </div>
          </button>
          <button
            type="button"
            onClick={() => onPick("auto")}
            className="rounded-lg px-3 py-3 text-left bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/10 transition active:scale-[0.98]"
          >
            <div className="font-display font-bold text-sm">▶ Auto</div>
            <div className="text-[10px] text-ink-300 mt-0.5 leading-snug">
              Cinematic. Both sides play themselves.
            </div>
          </button>
        </div>
        <div className="text-[10px] font-mono text-ink-500 mt-3">
          Keyboard: 1 or M for Manual · 2 or A for Auto
        </div>
      </div>
    </div>
  );
}

/* ─── Manual action panel (move picker + log) ──────────────────────── */

function ManualActionPanel({
  active,
  moves,
  canPick,
  waiting,
  log,
  onPick,
  rivalName,
  selectedIndex,
  onSelectIndex,
}: {
  active: AIModel;
  moves: Move[];
  canPick: boolean;
  waiting: boolean;
  log: string[];
  onPick: (m: Move) => void;
  rivalName: string;
  selectedIndex: number;
  onSelectIndex: (idx: number) => void;
}) {
  const padded = padMoves(moves);
  return (
    <div className="mx-2 mt-2 sm:mx-4 sm:mt-4 rounded-xl bg-white/[0.05] ring-1 ring-inset ring-white/10 p-2 sm:p-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {/* Move picker — first on mobile so the call-to-action is visible
            without scrolling. (sm:order-2 keeps the desktop "log left,
            moves right" layout unchanged.) */}
        <div className="sm:order-2">
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-500 mb-1 flex items-center justify-between gap-2">
            <span className="truncate">
              <span className="text-white">{active.name}</span> · pick a move
            </span>
            {waiting && (
              <span className="text-amber-300 normal-case tracking-normal shrink-0">
                {rivalName} thinking…
              </span>
            )}
          </div>
          {canPick && (
            <div className="text-[10px] font-mono text-ink-500 mb-1 hidden sm:block">
              Keyboard: 1-4 to move · arrows/WASD + Enter
            </div>
          )}
          <div className="grid grid-cols-2 gap-1.5">
            {padded.map((m, i) =>
              m ? (
                <button
                  key={`${m.name}-${i}`}
                  type="button"
                  onClick={() => onPick(m)}
                  onFocus={() => onSelectIndex(i)}
                  aria-keyshortcuts={`${i + 1}`}
                  disabled={!canPick}
                  className={`rounded-md px-2.5 py-2 text-left transition ${
                    canPick
                      ? i === selectedIndex
                        ? "bg-pokered-500/25 hover:bg-pokered-500/35 text-white ring-1 ring-inset ring-pokered-400/70 active:scale-[0.98]"
                        : "bg-white/[0.06] hover:bg-white/[0.14] text-white ring-1 ring-inset ring-white/10 active:scale-[0.98]"
                      : "bg-white/[0.03] text-ink-500 ring-1 ring-inset ring-white/5 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono text-amber-300">
                      {i + 1}
                    </span>
                    <span className="text-[12px] font-display font-bold leading-tight truncate">
                      {m.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-ink-500">
                      {moveMetaLabel(m).label}
                    </span>
                    <span className="text-[10px] font-mono text-amber-300 tabular-nums">
                      {moveMetaLabel(m).value}
                    </span>
                  </div>
                </button>
              ) : (
                <div
                  key={`empty-${i}`}
                  className="rounded-md px-2.5 py-2 bg-white/[0.02] ring-1 ring-inset ring-white/[0.04] text-ink-600 text-[10px] font-mono"
                >
                  —
                </div>
              )
            )}
          </div>
        </div>

        {/* Battle log — comes second on mobile so it doesn't push the move
            buttons off-screen, but stays in its original left column on
            desktop. We only show 1 line on mobile and the last 3 on desktop. */}
        <div className="min-w-0 sm:order-1">
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-500 mb-1 hidden sm:block">
            Battle Log
          </div>
          <div className="text-[12px] sm:text-sm text-ink-200 leading-snug font-mono space-y-0.5 sm:min-h-[64px]">
            {log.slice(-1).map((line, i) => (
              <div
                key={`mob-${log.length}-${i}`}
                className="text-white truncate sm:hidden"
              >
                {line}
              </div>
            ))}
            {log.slice(-3).map((line, i, arr) => (
              <div
                key={`${log.length}-${i}`}
                className={`hidden sm:block ${
                  i === arr.length - 1 ? "text-white" : "text-ink-300"
                }`}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function padMoves(moves: Move[]): (Move | null)[] {
  const out: (Move | null)[] = [...moves];
  while (out.length < 4) out.push(null);
  return out.slice(0, 4);
}

function moveMetaLabel(move: Move): { label: string; value: string | number } {
  if (move.effect === "heal") return { label: "Recover", value: `+${move.power}` };
  if (move.effect === "attackDown") return { label: "Effect", value: "Atk ↓" };
  return { label: "Power", value: move.power };
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable
  );
}

/* ─── Team / arena rendering (unchanged) ──────────────────────────── */

function splitTeams(models: AIModel[]): { left: AIModel[]; right: AIModel[] } {
  if (models.length <= 1) return { left: models, right: [] };
  if (models.length === 2) {
    return { left: [models[0]], right: [models[1]] };
  }
  const ranked = [...models].sort((a, b) => statTotal(b) - statTotal(a));
  if (models.length === 3) {
    return { left: [ranked[0]], right: [ranked[1], ranked[2]] };
  }
  return { left: [ranked[0], ranked[3]], right: [ranked[1], ranked[2]] };
}

function teamPower(team: AIModel[]): number {
  return team.reduce((sum, m) => sum + statTotal(m), 0);
}

function TeamBar({
  team,
  hp,
  power,
  burned,
  align,
  label,
}: {
  team: AIModel[];
  hp: number;
  power: number;
  burned: number;
  align: "left" | "right";
  label?: string;
}) {
  const lab = team.length === 1 ? getLabBranding(team[0].lab) : null;
  const tint = lab?.color ?? "#94a3b8";
  return (
    <div
      className={`rounded-lg p-2.5 bg-white/[0.05] ring-1 ring-inset ring-white/10 flex flex-col gap-1.5 ${
        align === "right" ? "text-right items-end" : ""
      }`}
    >
      <div
        className={`flex items-baseline gap-2 ${
          align === "right" ? "flex-row-reverse" : ""
        }`}
      >
        <div className="text-sm font-display font-bold text-white truncate min-w-0">
          {team.map((m) => m.name).join(" + ")}
        </div>
        {label && (
          <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-amber-300 shrink-0">
            {label}
          </span>
        )}
        <div className="text-[10px] font-mono text-ink-500 shrink-0">
          BP {power}
        </div>
      </div>
      <div
        className={`flex items-center gap-2 text-[10px] font-mono text-ink-400 ${
          align === "right" ? "flex-row-reverse" : ""
        }`}
      >
        <span>{teamRateLabel(team)}</span>
        <span className="text-ink-600">·</span>
        <span className="text-amber-300">burned {formatUSD(burned)}</span>
      </div>
      <div
        className={`flex items-center gap-2 w-full ${
          align === "right" ? "flex-row-reverse" : ""
        }`}
      >
        <span className="text-[10px] font-mono text-ink-400">HP</span>
        <div className="relative h-2 flex-1 rounded-full bg-black/60 ring-1 ring-inset ring-white/5 overflow-hidden">
          <div
            className="absolute inset-y-0 rounded-full transition-[width] duration-500 ease-out"
            style={{
              width: `${Math.max(0, hp)}%`,
              right: align === "right" ? 0 : undefined,
              left: align === "right" ? undefined : 0,
              background:
                hp > 50
                  ? "linear-gradient(90deg, #34d399, #10b981)"
                  : hp > 20
                    ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
                    : "linear-gradient(90deg, #f87171, #dc2626)",
              boxShadow: `0 0 8px ${tint}88`,
            }}
          />
        </div>
        <span className="text-[10px] font-mono text-ink-300 tabular-nums w-10">
          {Math.round(hp)}/{HP_PER_SIDE}
        </span>
      </div>
    </div>
  );
}

function TeamSide({
  side,
  team,
  phase,
  isAttacking,
  isHit,
  activeIdx,
  fainted,
}: {
  side: Side;
  team: AIModel[];
  phase: Phase;
  isAttacking: boolean;
  isHit: boolean;
  activeIdx: number;
  fainted: boolean;
}) {
  const isLeft = side === "left";

  const containerStyle: React.CSSProperties = {
    position: "absolute",
    bottom: isLeft ? "8%" : "52%",
    [isLeft ? "left" : "right"]: "4%",
    // Cap width so the two sides can't bleed into each other on a narrow
    // mobile arena. They're already on opposite diagonals; this keeps the
    // sprites from overlapping at the center.
    width: "min(180px, 38%)",
    height: "min(150px, 44%)",
  };

  return (
    <div style={containerStyle}>
      {team.map((m, i) => (
        <Combatant
          key={m.id}
          model={m}
          side={side}
          phase={phase}
          isAttacking={isAttacking && i === activeIdx % team.length}
          isHit={isHit}
          isActive={i === activeIdx % team.length}
          slotIndex={i}
          slotCount={team.length}
          fainted={fainted}
          delay={i * 120}
        />
      ))}
    </div>
  );
}

function Combatant({
  model,
  side,
  phase,
  isAttacking,
  isHit,
  isActive,
  slotIndex,
  slotCount,
  fainted,
  delay,
}: {
  model: AIModel;
  side: Side;
  phase: Phase;
  isAttacking: boolean;
  isHit: boolean;
  isActive: boolean;
  slotIndex: number;
  slotCount: number;
  fainted: boolean;
  delay: number;
}) {
  const isLeft = side === "left";
  const offset = slotCount > 1 ? slotIndex * 18 : 0;
  const baseSize = slotCount > 1 ? 96 : 120;
  const scale = isActive ? 1 : 0.85;

  let transform = `translate(${isLeft ? -offset : offset}px, ${offset * 0.6}px) scale(${scale})`;

  if (phase === "intro" || phase === "mode-select") {
    transform = isLeft
      ? `translateX(-260%) translateY(-20%) scale(${scale})`
      : `translateX(260%) translateY(-20%) scale(${scale})`;
  } else if (isAttacking) {
    transform = isLeft
      ? `translate(${30 - offset}px, ${offset * 0.6}px) scale(1.08)`
      : `translate(${-30 + offset}px, ${offset * 0.6}px) scale(1.08)`;
  } else if (isHit && isActive) {
    transform = isLeft
      ? `translate(${-12 - offset}px, ${offset * 0.6}px) scale(${scale})`
      : `translate(${12 + offset}px, ${offset * 0.6}px) scale(${scale})`;
  } else if (fainted && isActive) {
    transform = `translateY(40px) rotate(20deg) scale(${scale})`;
  }

  return (
    <div
      className="absolute flex items-center justify-center"
      style={{
        inset: 0,
        zIndex: 10 - slotIndex,
        transform,
        transition: `transform 220ms cubic-bezier(0.3, 1.4, 0.6, 1) ${delay}ms, opacity 300ms ${delay}ms, filter 200ms`,
        opacity:
          phase === "intro" || phase === "mode-select"
            ? 0
            : fainted && isActive
              ? 0.45
              : isActive
                ? 1
                : 0.7,
        filter: isHit && isActive ? "brightness(1.6) saturate(1.3)" : undefined,
      }}
    >
      {phase === "intro" || phase === "mode-select" ? (
        <Pokeball size={50} delay={delay} />
      ) : (
        // On phones the arena is intentionally short to keep the move
        // picker above the fold, so we scale the sprite down via CSS
        // (ModelEmblem only takes a fixed numeric size). Desktop renders
        // the sprite at native size.
        <div className="scale-[0.65] sm:scale-100 origin-center">
          <ModelEmblem
            model={model}
            size={baseSize}
            animated={phase === "ready" || phase === "fight"}
          />
        </div>
      )}
    </div>
  );
}

/** CRT-glitch overlay shown while GPT-o∞ is hanging. Pulsing green scanlines,
 *  desync shimmer, and a fake stack-trace ticker. */
function HangGlitch() {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 animate-mythos-flash">
      {/* Green scanlines */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(16,163,127,0.08) 0px, rgba(16,163,127,0.08) 1px, transparent 1px, transparent 3px)",
          mixBlendMode: "screen",
        }}
      />
      {/* RGB split shimmer */}
      <div
        className="absolute inset-0 animate-pulse"
        style={{
          background:
            "linear-gradient(90deg, rgba(248,113,113,0.06), transparent 25%, transparent 75%, rgba(34,211,238,0.06))",
          mixBlendMode: "screen",
        }}
      />
      {/* "Connection lost" tag */}
      <div
        className="absolute top-3 left-3 px-2 py-1 rounded font-mono text-[10px] tracking-[0.25em] uppercase"
        style={{
          background: "rgba(0,0,0,0.6)",
          color: "#10a37f",
          boxShadow: "inset 0 0 0 1px rgba(16,163,127,0.4)",
          animation: "mythos-flicker 0.4s steps(2, end) infinite",
        }}
      >
        ● Stalled — reasoning_traces=∞
      </div>
      {/* Floating stack-trace lines */}
      <div
        className="absolute right-3 top-3 max-w-[60%] text-right font-mono text-[10px] leading-tight"
        style={{
          color: "rgba(167,243,208,0.85)",
          textShadow: "0 0 4px rgba(16,163,127,0.6)",
        }}
      >
        at OpenAI.Completions.create (api.ts:142)
        <br />
        at Agent.tick (planner.ts:88)
        <br />
        at process.&lt;anonymous&gt; (loop.ts:7)
      </div>
    </div>
  );
}

function Pokeball({ size, delay }: { size: number; delay: number }) {
  return (
    <div
      className="rounded-full relative"
      style={{
        width: size,
        height: size,
        background: "#f8fafc",
        boxShadow:
          "0 6px 12px rgba(0,0,0,0.5), inset 0 -3px 4px rgba(0,0,0,0.4), inset 0 3px 3px rgba(255,255,255,0.4)",
        overflow: "hidden",
        animation: `pokeball-drop 700ms ease-out ${delay}ms both`,
      }}
    >
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          height: "50%",
          background: "linear-gradient(180deg, #ef4444, #b91c1c)",
        }}
      />
      <div
        className="absolute left-0 right-0"
        style={{ top: "calc(50% - 2px)", height: 4, background: "#0a0a0a" }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
        style={{
          width: size * 0.28,
          height: size * 0.28,
          boxShadow: "inset 0 0 0 2px #0a0a0a, inset 0 -1px 1px rgba(0,0,0,0.4)",
        }}
      />
    </div>
  );
}

function BurnLedger({
  left,
  right,
  burnedLeft,
  burnedRight,
}: {
  left: AIModel[];
  right: AIModel[];
  burnedLeft: number;
  burnedRight: number;
}) {
  const total = burnedLeft + burnedRight;
  // Light the whole ledger on fire when Colossus is in the fight.
  const colossusInPlay = [...left, ...right].some(isColossus);
  return (
    <div
      className={`mx-2 sm:mx-4 mt-2 sm:mt-3 rounded-xl ring-1 ring-inset px-3 py-2 sm:p-3 ${
        colossusInPlay
          ? "bg-rose-500/[0.08] ring-rose-400/30"
          : "bg-amber-500/[0.06] ring-amber-400/20"
      }`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-baseline gap-2 min-w-0">
          <span
            className={`text-[10px] font-mono uppercase tracking-[0.25em] shrink-0 ${
              colossusInPlay ? "text-rose-300" : "text-amber-300"
            }`}
          >
            {colossusInPlay ? "🔥 Cash Incinerator" : "💸 Burned"}
          </span>
          {/* Simulation footnote is desktop-only — too noisy on a phone. */}
          <span className="hidden sm:inline text-[10px] font-mono text-ink-500">
            (simulation · {formatTokens(TOKENS_PER_ATTACK_IN)} in /{" "}
            {formatTokens(TOKENS_PER_ATTACK_OUT)} out per swing
            {colossusInPlay ? ` · ${COLOSSUS_BURN_MULT}× when Colossus attacks` : ""}
            )
          </span>
        </div>
        <div
          className={`text-base sm:text-lg font-display font-black tabular-nums ${
            colossusInPlay ? "text-rose-300" : "text-amber-300"
          }`}
        >
          {formatUSD(total)}
        </div>
      </div>
      {/* Per-team breakdown is desktop-only — phone keeps just the total
          to leave room for the move buttons above the fold. */}
      <div className="hidden sm:grid mt-1.5 grid-cols-2 gap-3 text-[11px] font-mono">
        <div className="text-ink-300">
          <span className="text-ink-500">{teamName(left)}: </span>
          <span className="text-white tabular-nums">
            {formatUSD(burnedLeft)}
          </span>
          <span className="text-ink-600"> · {teamRateLabel(left)}</span>
        </div>
        <div className="text-ink-300 text-right">
          <span className="text-ink-600">{teamRateLabel(right)} · </span>
          <span className="text-ink-500">{teamName(right)}: </span>
          <span className="text-white tabular-nums">
            {formatUSD(burnedRight)}
          </span>
        </div>
      </div>
    </div>
  );
}

function teamName(team: AIModel[]): string {
  return team.map((m) => m.name).join(" + ");
}

function teamRateLabel(team: AIModel[]): string {
  if (team.length === 0) return "—";
  const ins = team.map((m) => m.price.input).filter((n): n is number => n != null);
  const outs = team.map((m) => m.price.output).filter((n): n is number => n != null);
  if (ins.length === 0 && outs.length === 0) return "open weights";
  const avg = (xs: number[]) =>
    xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
  const fmt = (n: number) => (n < 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(1)}`);
  return `${fmt(avg(ins))}/${fmt(avg(outs))} per 1M`;
}

function TeamTypeChips({ team }: { team: AIModel[] }) {
  const types = Array.from(new Set(team.flatMap((m) => m.types))).slice(0, 3);
  return (
    <span className="inline-flex items-center gap-1 flex-wrap">
      {types.map((t) => (
        <TypeBadge key={t} type={t} size="xs" />
      ))}
    </span>
  );
}

/* ─── Moves & damage ──────────────────────────────────────────────── */

export interface Move {
  name: string;
  /** Damage power or support strength. */
  power: number;
  effect?: "damage" | "heal" | "attackDown";
}

/** Each type contributes several moves. A model's set is up to 4 unique picks
 *  drawn deterministically (so the same modelmon always gets the same kit). */
const MOVES_BY_TYPE: Record<string, Move[]> = {
  Reasoning: [
    { name: "Chain of Thought", power: 70 },
    { name: "Deep Think", power: 85 },
    { name: "Self-Reflection", power: 16, effect: "heal" },
    { name: "Socratic Trap", power: 45, effect: "attackDown" },
  ],
  Coding: [
    { name: "Refactor Strike", power: 65 },
    { name: "Stack Trace", power: 55 },
    { name: "Hotfix Patch", power: 18, effect: "heal" },
    { name: "Lint Storm", power: 45, effect: "attackDown" },
  ],
  Vision: [
    { name: "Pixel Gaze", power: 60 },
    { name: "Image Lock", power: 50 },
    { name: "Focus Shift", power: 14, effect: "heal" },
    { name: "Occlusion Fog", power: 45, effect: "attackDown" },
  ],
  Speed: [
    { name: "Token Burst", power: 45 },
    { name: "Streaming Slam", power: 55 },
    { name: "Latency Dodge", power: 14, effect: "heal" },
    { name: "Rate Limit", power: 45, effect: "attackDown" },
  ],
  Multimodal: [
    { name: "Mode Swap", power: 60 },
    { name: "Cross-Modal", power: 70 },
    { name: "Context Blend", power: 16, effect: "heal" },
    { name: "Signal Jam", power: 45, effect: "attackDown" },
  ],
  "Long-Context": [
    { name: "Context Coil", power: 65 },
    { name: "Memory Bind", power: 50 },
    { name: "Recall Cache", power: 20, effect: "heal" },
    { name: "Attention Sink", power: 45, effect: "attackDown" },
  ],
  Multilingual: [
    { name: "Polyglot Rush", power: 55 },
    { name: "Lexical Beam", power: 65 },
    { name: "Translation Loop", power: 15, effect: "heal" },
    { name: "Grammar Snare", power: 45, effect: "attackDown" },
  ],
  "Tool-Use": [
    { name: "Tool Call", power: 60 },
    { name: "Function Smash", power: 75 },
    { name: "Repair Tool", power: 18, effect: "heal" },
    { name: "Permission Denied", power: 45, effect: "attackDown" },
  ],
  "Open-Source": [
    { name: "Fork Strike", power: 60 },
    { name: "Pull Request", power: 50 },
    { name: "Community Patch", power: 18, effect: "heal" },
    { name: "License Check", power: 45, effect: "attackDown" },
  ],
  Audio: [
    { name: "Sonic Echo", power: 55 },
    { name: "Spectrogram", power: 65 },
    { name: "Noise Gate", power: 14, effect: "heal" },
    { name: "Feedback Squeal", power: 45, effect: "attackDown" },
  ],
  Compact: [
    { name: "Quick Quip", power: 40 },
    { name: "Tiny Punch", power: 50 },
    { name: "Cache Nap", power: 16, effect: "heal" },
    { name: "Quantize", power: 45, effect: "attackDown" },
  ],
  Frontier: [
    { name: "Frontier Blast", power: 90 },
    { name: "Scaling Roar", power: 75 },
    { name: "Safety Case", power: 18, effect: "heal" },
    { name: "Alignment Tax", power: 45, effect: "attackDown" },
  ],
};

export function moveSetFor(model: AIModel): Move[] {
  const out: Move[] = [];
  const seen = new Set<string>();
  for (const t of model.types) {
    const pool = MOVES_BY_TYPE[t];
    if (!pool) continue;
    const start = model.id % pool.length;
    for (let i = 0; i < pool.length && out.length < 4; i++) {
      const pick = pool[(start + i) % pool.length];
      if (!seen.has(pick.name)) {
        out.push(pick);
        seen.add(pick.name);
      }
    }
    if (out.length >= 4) break;
  }
  // Mythos signature move. Damage is still capped by computeDamage so this is
  // a scary haymaker, not an instant win.
  if (isMythos(model)) {
    return [
      { name: "Constitutional Beam", power: 120 },
      { name: "Mythic Recall", power: 90 },
      { name: "Oracle Sight", power: 45, effect: "attackDown" },
      { name: "Infinite Context", power: 22, effect: "heal" },
    ];
  }
  // Pad unusual type combinations with simple defaults.
  const fallbackMoves: Move[] = [
    { name: "Tackle", power: 35 },
    { name: "Cache Warmup", power: 14, effect: "heal" },
    { name: "Prompt Fumble", power: 45, effect: "attackDown" },
    { name: "Token Tap", power: 45 },
  ];
  for (const move of fallbackMoves) {
    if (out.length >= 4) break;
    if (!seen.has(move.name)) out.push(move);
  }
  return out;
}

/** Damage = base × atk/def ratio × variance × crit.
 *
 *  Tuned so a typical hit lands 10–18 HP on a 100-HP bar, meaning fights run
 *  ~5–8 swings. Heavy hitters (Frontier, Sp.Atk-heavy) still feel weighty
 *  without one-shotting through pure stat advantage. */
export function computeDamage(
  attacker: AIModel,
  defender: AIModel,
  move: Move,
  attackDrops = 0
): { hp: number; crit: boolean } {
  if (isMythos(attacker)) {
    return { hp: HP_PER_SIDE, crit: true };
  }
  const attackMult = Math.max(0.55, 1 - attackDrops * ATTACK_DROP_MULT);
  const ratio = Math.max(
    0.6,
    Math.min(
      1.6,
      (attacker.stats.attack * attackMult) / Math.max(60, defender.stats.defense)
    )
  );
  const variance = 0.88 + Math.random() * 0.24;
  const crit = Math.random() < 0.08;
  const base = move.power * 0.18;
  const raw = base * ratio * variance * (crit ? 1.6 : 1);
  return { hp: Math.max(3, Math.min(28, Math.round(raw))), crit };
}

/** Simple rival "AI": prefer the highest-power move 70% of the time, otherwise
 *  pick randomly. Adds a tiny "personality" knob via stat ratios so smarter
 *  models pick better moves slightly more often. */
function pickAIMove(
  moves: Move[],
  myActive: AIModel,
  _opp: AIModel,
  myHP = HP_PER_SIDE
): Move {
  if (moves.length === 0) return { name: "Tackle", power: 35 };
  const heal = moves.find((m) => m.effect === "heal");
  if (heal && myHP <= 45 && Math.random() < 0.55) return heal;
  const smart = Math.min(0.95, 0.4 + (myActive.stats.attack / 300));
  if (Math.random() < smart) {
    return [...moves].sort((a, b) => moveScore(b) - moveScore(a))[0];
  }
  return moves[Math.floor(Math.random() * moves.length)];
}

function moveScore(move: Move): number {
  if (move.effect === "heal") return 50;
  if (move.effect === "attackDown") return 58;
  return move.power;
}

function teamLabel(side: Side): string {
  return side === "left" ? "Your team's" : "Rival team's";
}

function tokensFor(model: AIModel): { in: number; out: number; mult: number } {
  const mult = isColossus(model) ? COLOSSUS_BURN_MULT : 1;
  return {
    in: TOKENS_PER_ATTACK_IN * mult,
    out: TOKENS_PER_ATTACK_OUT * mult,
    mult,
  };
}

function attackCost(model: AIModel): number {
  const { in: inTok, out: outTok } = tokensFor(model);
  const inUsd = ((model.price.input ?? 0) * inTok) / 1_000_000;
  const outUsd = ((model.price.output ?? 0) * outTok) / 1_000_000;
  return inUsd + outUsd;
}

function formatUSD(n: number): string {
  if (n === 0) return "$0";
  if (n < 0.01) return `$${n.toFixed(4)}`;
  if (n < 1) return `$${n.toFixed(3)}`;
  return `$${n.toFixed(2)}`;
}

function formatTokens(n: number): string {
  if (n < 1000) return `${n}`;
  return `${(n / 1000).toFixed(1)}k`;
}

function truncatedLog(lines: string[]): string[] {
  return lines.slice(-12);
}
