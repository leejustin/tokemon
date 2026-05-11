import type { Palette } from "../components/PixelSprite";

/**
 * Hand-drawn 16×16 sprites for the adventure-mode player + NPCs.
 *
 * Each sprite is a small character on a transparent background. They share a
 * common silhouette (head + body + arms + legs) and use palette swaps to
 * communicate the character's archetype:
 *
 *   - red cap + blue jacket  = the player
 *   - bright Anthropic orange = the friendly heal NPC
 *   - chunky silver headphones = vibecoder
 *   - blazer + name tag = salesperson
 *   - drawn hood + cold brew = jaded engineer
 *   - sunglasses + designer top = Gen-Z rich kid
 *   - patagonia vest = ex-bitcoiner
 *   - blank robes = the Silent One
 *   - black suit + red tie = thought leader
 *
 * Palette legend (consistent across sprites):
 *   "." transparent
 *   "0" outline (dark ink)
 *   "S" skin (cheek pink baked in via shading)
 *   "H" hair
 *   "B" body / shirt main color
 *   "A" body accent (stripe, tie, name tag, vest)
 *   "L" pants
 *   "F" feet / shoes
 *   "w" eye white
 *   "k" pupil
 *   "g" glasses lens / shades
 *   "Y" yellow accent (emblem, sticker, cap badge)
 *   "W" white (highlights, papers, headphone cup)
 *   "p" pink cheek dot
 */

export interface Sprite {
  grid: readonly string[];
  palette: Palette;
}

const OUTLINE = "#0c0e14";
const EYE_WHITE = "#f8fafc";
const PUPIL = "#0c0e14";
const SKIN = "#fcd9b6";
const SKIN_SHADE = "#e8b890";
const CHEEK = "#fda4af";
const SHOE = "#3f2410";

function commonBase(
  hair: string,
  body: string,
  accent: string,
  pants: string,
  extras: Partial<Palette> = {}
): Palette {
  return {
    "0": OUTLINE,
    S: SKIN,
    s: SKIN_SHADE,
    H: hair,
    B: body,
    A: accent,
    L: pants,
    F: SHOE,
    w: EYE_WHITE,
    k: PUPIL,
    p: CHEEK,
    Y: "#fbbf24",
    W: "#f8fafc",
    g: "#0c0e14",
    ...extras,
  };
}

/* ─── Player — Trainer (red cap with brim, blue jacket) ───────────── */

/**
 * Front-facing trainer sprite redrawn to be closer to the Pokemon
 * Yellow/Crystal trainer silhouette: visible cap brim, hair tufts at the
 * sides, big readable eyes, planted feet. Still 16×16, still flat-palette.
 */
export const sp_player: Sprite = {
  grid: [
    "................",
    "....00H00H00....",
    "...0HHHHHH0H0...",
    "...0HHWHHHH0....",
    "..0HHHHHHHHH0...",
    "..0000000HHH0...",
    "...0SSSSSS0.....",
    "...0SwkSkwS0....",
    "...0SSSppS0.....",
    "....0SSSS0......",
    "..0BBBBBBBB0....",
    "..0BAYYYYAB0....",
    "..0BBBBBBBB0....",
    "...0LL00LL0.....",
    "...0LL00LL0.....",
    "...0FF00FF0.....",
  ],
  palette: commonBase("#dc2626", "#1d4ed8", "#facc15", "#1e293b"),
};

/* ─── NPC: Tokemonthropic (heal NPC) ───────────────────────────────
 * Bright Anthropic-orange shirt, holding a tote bag with a sticker. */

export const sp_tokemonthropic: Sprite = {
  grid: [
    "................",
    "....000000......",
    "...0HHHHHH0.....",
    "...0HHHHHH0.....",
    "...0SSSSSS0.....",
    "...0SwkSkw0.....",
    "...0SpSSpS0.....",
    "....0SSSS0......",
    "..0BBBBBBBB0....",
    "..0BABBBBAB0....",
    "..0BABBBBAB0....",
    "..0BABBBBAB0....",
    "...0BBBBBB0.....",
    "....LL..LL......",
    "....LL..LL......",
    "....FF..FF......",
  ],
  palette: commonBase("#92400e", "#d97757", "#fde68a", "#1f2937"),
};

/* ─── NPC: Vibes Marcus — vibecoder w/ huge AirPods Max ──────────── */

export const sp_vibes: Sprite = {
  grid: [
    "................",
    "...AA000000AA...",
    "...A0HHHHHH0A...",
    "...A0HHHHHH0A...",
    "...A0SSSSSS0A...",
    "...A0SwkSkw0A...",
    "...AA0SSSS0AA...",
    "....0SSSSSS0....",
    "...0BBBBBBBB0...",
    "...0BBBBBBBB0...",
    "...0BBYYBBBB0...",
    "...0BBBBBBBB0...",
    "...0BBBBBBBB0...",
    "....LL..LL......",
    "....LL..LL......",
    "....FF..FF......",
  ],
  // A = silver headphone cup, B = purple hoodie, Y = sticker on chest
  palette: commonBase("#1f2937", "#7c3aed", "#fde68a", "#1e293b", {
    A: "#cbd5e1",
  }),
};

/* ─── NPC: Brett — salesperson, blazer over hoodie, name tag ─────── */

export const sp_brett: Sprite = {
  grid: [
    "................",
    "....000000......",
    "...0HHHHHH0.....",
    "...0HHHHHH0.....",
    "...0SSSSSS0.....",
    "...0SwkSkw0.....",
    "....0SSSS0......",
    "....0BBBB0......",
    "...0ABBBBA0.....",
    "...0AABBAA0.....",
    "...0AABBAA0.....",
    "...0AABBAA0.....",
    "....WWBBWW......",
    "....LL..LL......",
    "....LL..LL......",
    "....FF..FF......",
  ],
  // A = navy blazer, B = light hoodie underneath, W = white shirt collar/name tag
  palette: commonBase("#854d0e", "#cbd5e1", "#1e3a8a", "#1e293b"),
};

/* ─── NPC: Priya — hood up, dark hoodie, cold brew mug ───────────── */

export const sp_priya: Sprite = {
  grid: [
    "................",
    "...0BBBBBBBB0...",
    "..0BBBBBBBBBB0..",
    "..0BBSSSSSSBB0..",
    "..0BSSSSSSSB0...",
    "..0BSwkSSkwSB...",
    "..0BSppSSppSB...",
    "...0BSSSSSSB0...",
    "...0BBBBBBBB0...",
    "...0BBBBBBBBA...",
    "...0BBBBBBBBA...",
    "...0BBBBBBBBA...",
    "...0BBBBBBBB0...",
    "....LL..LL......",
    "....LL..LL......",
    "....FF..FF......",
  ],
  // B = drawn hood (black) covering hair, A = cold-brew mug on right hand
  palette: commonBase("#0f172a", "#1f2937", "#92400e", "#020617"),
};

/* ─── NPC: Asher — sunglasses, designer top, gold chain ──────────── */

export const sp_asher: Sprite = {
  grid: [
    "................",
    "....000000......",
    "...0HHHHHH0.....",
    "...0HHHHHH0.....",
    "...0SSSSSS0.....",
    "...0gggggg0.....",
    "....0SSSS0......",
    "....0YYYY0......",
    "...0BBBBBBA0....",
    "...0BBYYBBA0....",
    "...0BBBBBBA0....",
    "...0BBBBBBA0....",
    "....0BBBB0......",
    "....LL..LL......",
    "....LL..LL......",
    "....FF..FF......",
  ],
  // g = black shades band, B = colorful designer top, A = strap detail, Y = gold chain
  palette: commonBase("#fef3c7", "#000000", "#7c2d12", "#3f3f46", {
    g: "#0c0e14",
    Y: "#fbbf24",
  }),
};

/* ─── NPC: Crypto Connor — patagonia vest over flannel ───────────── */

export const sp_connor: Sprite = {
  grid: [
    "................",
    "....000000......",
    "...0HHHHHH0.....",
    "...0HHHHHH0.....",
    "...0SSSSSS0.....",
    "...0SwkSkw0.....",
    "....0SSSS0......",
    "...0BBBBBB0.....",
    "..0ABBBBBBA0....",
    "..0ABBYBBBA0....",
    "..0ABBYBBBA0....",
    "..0ABBBBBBA0....",
    "...0BBBBBB0.....",
    "....LL..LL......",
    "....LL..LL......",
    "....FF..FF......",
  ],
  // A = orange vest panels, B = blue flannel underneath, Y = zipper
  palette: commonBase("#854d0e", "#1e40af", "#f97316", "#3f3f46"),
};

/* ─── NPC: The Silent One — pale, expressionless, plain hoodie ───── */

export const sp_silent: Sprite = {
  grid: [
    "................",
    "....000000......",
    "...0HHHHHH0.....",
    "...0HHHHHH0.....",
    "...0SSSSSS0.....",
    "...0SkSSkS0.....",
    "....0SSSS0......",
    "....0SSSS0......",
    "...0BBBBBB0.....",
    "...0BBBBBB0.....",
    "...0BBBBBB0.....",
    "...0BBBBBB0.....",
    "....0BBBB0......",
    "....LL..LL......",
    "....LL..LL......",
    "....FF..FF......",
  ],
  // Everything muted gray. No eye whites. No cheek pink. Vibes off.
  palette: commonBase("#475569", "#64748b", "#475569", "#334155"),
};

/* ─── NPC: Devon Voss — thought leader, suit + red tie ───────────── */

export const sp_devon: Sprite = {
  grid: [
    "................",
    "....000000......",
    "...0HHHHHH0.....",
    "...0HHHHHH0.....",
    "...0SSSSSS0.....",
    "...0SwkSkw0.....",
    "....0SSSS0......",
    "....0WWWW0......",
    "...0BWAAWB0.....",
    "...0BBWAWBB0....",
    "...0BBBABBB0....",
    "...0BBBABBB0....",
    "....0BBBB0......",
    "....LL..LL......",
    "....LL..LL......",
    "....FF..FF......",
  ],
  // B = black suit, W = white collar/shirt, A = red tie
  palette: commonBase("#1f2937", "#0c0a14", "#dc2626", "#0c0a14"),
};

/* ─── NPC: Kayak Mark — bucket hat, board shorts, suntan ─────────── */

export const sp_kayak_mark: Sprite = {
  grid: [
    "................",
    "..0HHHHHHHHHH0..",
    "..0HHWWWWWWHH0..",
    "..00000000000...",
    "....0SSSSSS0....",
    "....0SwkSkwS....",
    "....0SSppSS0....",
    "....0SSSSSS0....",
    "...0BBBBBBBB0...",
    "...0BAAAAABB0...",
    "...0BBBBBBBB0...",
    "....0LLLLLL0....",
    "....0LLLLLL0....",
    "....0LL00LL0....",
    "....0FF00FF0....",
    "................",
  ],
  // H = bucket hat (tan), W = hat trim, B = open shirt (cyan), A = palm-tree print
  palette: commonBase("#fde68a", "#22d3ee", "#67e8f9", "#92400e", {
    W: "#cbd5e1",
  }),
};

/* ─── NPC: Tourist Trevor — fanny pack + bright OpenAI tee ───────── */

export const sp_tourist: Sprite = {
  grid: [
    "................",
    "....000000......",
    "...0HHHHHH0.....",
    "...0HHHHHH0.....",
    "...0SSSSSS0.....",
    "...0SwkSkw0.....",
    "....0SSpS0......",
    "...0BBBBBB0.....",
    "...0BAAAAB0.....",
    "...0BBBBBB0.....",
    "..0LLLLLLLL0....",
    "..0LLYYYYLL0....",
    "..0LLLLLLLL0....",
    "....0L00L0......",
    "....0L00L0......",
    "....0F00F0......",
  ],
  palette: commonBase("#1f2937", "#10a37f", "#a7f3d0", "#92400e", {
    Y: "#fbbf24",
  }),
};

/* ─── NPC: Influencer Maya — pink top + ring light vibe ─────────── */

export const sp_influencer: Sprite = {
  grid: [
    "................",
    "....000000......",
    "...0HHHHHH0.....",
    "...0HHHHHH0.....",
    "..0HHHSSHHH0....",
    "...0SwkSkw0.....",
    "....0SSpS0......",
    "...0BBBBBB0.....",
    "...0BWWWWB0.....",
    "...0BBBBBB0.....",
    "...0BBBBBB0.....",
    "....0LLLL0......",
    "....0LLLL0......",
    "....0LL0L0......",
    "....0L00L0......",
    "....0F00F0......",
  ],
  palette: commonBase("#a16207", "#ec4899", "#fbcfe8", "#1f2937"),
};

/* ─── NPC: Doomer Dieter — gaunt, hoodie pulled low ─────────────── */

export const sp_doomer: Sprite = {
  grid: [
    "................",
    "...0BBBBBBBB0...",
    "..0BBBBBBBBBB0..",
    "..0BBSSSSSSBB0..",
    "..0BSwkSSkwSB...",
    "..0BSSSSSSSSB...",
    "...0BSSSSSSB0...",
    "...0BBBBBBBB0...",
    "...0BBAABBBBA...",
    "...0BBAABBBBA...",
    "...0BBBBBBBB0...",
    "....0BBBBBB0....",
    "....0LLLLLL0....",
    "....0LL00LL0....",
    "....0LL00LL0....",
    "....0FF00FF0....",
  ],
  // B = drawn hood (gray), A = "PAUSE AI" text-block on shirt sleeve
  palette: commonBase("#0c0e14", "#3f3f46", "#dc2626", "#1f2937"),
};

/* ─── NPC: MemoryNo — glitching stack of memory chips ────────────── */

export const sp_memoryno_world: Sprite = {
  grid: [
    "................",
    "...0HHHHHHHH0...",
    "...0AAAAAAAA0...",
    "..0HwwwHHHHH00..",
    "...0AAAAAAAA0...",
    "..0HHHHHwwwH00..",
    "...0AAAAAAAA0...",
    "..0HHHHHHHHH00..",
    "...0AAAAAAAA0...",
    "..0HHwwHHHHHH...",
    "...0AAAAAAAA0...",
    "..0HHHHHHwHH00..",
    "...0WWWWWWWW0...",
    "...0HHHHHHHH0...",
    "...0..0..0..0...",
    "....0..0..0.....",
  ],
  // H = green PCB body, A = gold contact bars, W = silver pin row
  palette: commonBase("#14532d", "#22d3ee", "#a78bfa", "#475569", {
    H: "#15803d",
    A: "#fcd34d",
    W: "#cbd5e1",
  }),
};

/* ─── In-world Mac Mini XL — looks like a small unmarked moving truck,
 *     because that's basically what a truck-sized Mac mini looks like. ─── */

export const sp_truck_world: Sprite = {
  grid: [
    "................",
    "................",
    "...000000000000.",
    "..0wwww111111100",
    "..0wkkw111111100",
    "..0wwww111111100",
    "..00000000000000",
    "..0222222222220.",
    "..0244444444220.",
    "..0244ggg444220.",
    "..0244ggg444220.",
    "..0244444444220.",
    "..0222222222220.",
    "..00000000000000",
    "...0FF0....0FF0.",
    "...0FF0....0FF0.",
  ],
  palette: commonBase("#1f2937", "#94a3b8", "#475569", "#fbbf24", {
    F: "#0c0e14",
  }),
};

/* ─── Registry ────────────────────────────────────────────────────── */

export const NPC_SPRITES: Record<string, Sprite> = {
  // Office NPCs
  "sam-anthropic": sp_tokemonthropic, // legacy id alias
  "tokemonthropic": sp_tokemonthropic,
  "vibes-marcus": sp_vibes,
  "brett-sales": sp_brett,
  "priya-jaded": sp_priya,
  "asher-richkid": sp_asher,
  "crypto-connor": sp_connor,
  "silent-one": sp_silent,
  "devon-thoughtleader": sp_devon,
  // Pier 67
  "kayak-mark": sp_kayak_mark,
  "pier-tourist": sp_tourist,
  "pier-influencer": sp_influencer,
  "pier-doomer": sp_doomer,
  // Mac Mini Mike reuses the salesman silhouette; Fishing Frank reuses
  // the kayak guy (similar washed-up-by-the-bay vibe).
  "macmini-mike": sp_brett,
  "fisherman-frank": sp_kayak_mark,
  // Brad the VC reuses the salesman silhouette — same vest energy.
  "brad-vc": sp_brett,
  // Wild creatures
  "wild-memoryno": sp_memoryno_world,
  "wild-truck": sp_truck_world,
};

export function getNPCSprite(npcId: string): Sprite {
  return NPC_SPRITES[npcId] ?? sp_silent;
}
