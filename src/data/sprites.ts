import type { Palette } from "../components/PixelSprite";

/**
 * Hand-drawn 16x16 pixel sprites for each Pokemodel.
 *
 * Conventions:
 *   "." = transparent
 *   "0" = outline (almost-black)
 *   "1" = main body color
 *   "2" = secondary body color (shading or accent panel)
 *   "3" = highlight
 *   "4" = type/feature accent (varies per sprite)
 *   "5" = secondary accent
 *   "w" = white (eye sclera, teeth, sparkle)
 *   "k" = pupil black
 *   "p" = peach/pink (cheeks, blush)
 *   "y" = yellow accent (lightning, crown, frontier)
 *   "g" = gold (crown, halo, prize)
 */

export interface Sprite {
  /** 16x16 array of strings */
  grid: readonly string[];
  /** palette mapping key -> color */
  palette: Palette;
}

const OUT = "#0c0e14";
const WHITE = "#f8fafc";
const PUPIL = "#0c0e14";
const CHEEK = "#fda4af";
const GOLD = "#fbbf24";
const SHADE = "rgba(0,0,0,0.18)";

/* ─── Helpers ────────────────────────────────────────────────────────── */

function basePalette(
  body: string,
  body2: string,
  highlight: string,
  accent: string,
  accent2: string = accent
): Palette {
  return {
    "0": OUT,
    "1": body,
    "2": body2,
    "3": highlight,
    "4": accent,
    "5": accent2,
    w: WHITE,
    k: PUPIL,
    p: CHEEK,
    y: "#facc15",
    g: GOLD,
    s: SHADE,
  };
}

/* ─── OpenAI line: Omni-Slime family (round, jelly, antenna) ──────────── */
/* All OpenAI sprites are descendants of a green dewdrop creature.
   GPT-4o-mini → 4o → GPT-5 grow taller and gain features.
   o1-mini → o3 are a parallel "thinker" branch (purple, monocle/halo). */

// 1. GPT-4o mini — tiny green slime
const sp_gpt4o_mini: Sprite = {
  grid: [
    "................",
    "................",
    "................",
    "................",
    "................",
    "......0000......",
    ".....011110.....",
    "....01331110....",
    "...0133311110...",
    "...013ww1110....",
    "...01wkwk110....",
    "...011p1p110....",
    "...01211211110..",
    "....012211210...",
    ".....001100.....",
    "................",
  ],
  palette: basePalette("#34d399", "#10b981", "#a7f3d0", "#10a37f"),
};

// 2. GPT-4o — bigger, antenna, two cheek dots, headphones
const sp_gpt4o: Sprite = {
  grid: [
    "................",
    "........0.......",
    "........4.......",
    ".......040......",
    "......04340.....",
    ".....0011110....",
    "....011331110...",
    "...01133331110..",
    "..0113w33w31110.",
    "..0113wkwk31110.",
    "..011p1p11p3110.",
    "..0112112112110.",
    "..01122112221110",
    "...011222221110.",
    "....001112100...",
    ".....0000000....",
  ],
  palette: basePalette("#34d399", "#059669", "#a7f3d0", "#10a37f"),
};

// 3. GPT-5 — tall, multi-antenna, glowing crown, cape-like swirl
const sp_gpt5: Sprite = {
  grid: [
    "......g.g.g.....",
    ".....0g0g0g0....",
    ".....ggggggg....",
    "......0444......",
    ".....04344......",
    "....0011110.....",
    "...011333110....",
    "..01133333110...",
    ".0113ww33ww110..",
    ".0113wkw3wkw110.",
    ".0112p11p11p110.",
    ".01122111122110.",
    ".011222112222110",
    "..01222222222110",
    "...0112221110...",
    "....00000000....",
  ],
  palette: basePalette("#6ee7b7", "#10a37f", "#d1fae5", "#0ea5e9"),
};

// 4. o1-mini — small purple thinker with a single thought antenna
const sp_o1_mini: Sprite = {
  grid: [
    "................",
    "................",
    "........4.......",
    "........4.......",
    ".......040......",
    "................",
    ".....000000.....",
    "....01122110....",
    "...0112222110...",
    "..011w1221w110..",
    "..011kw11wk110..",
    "..011211p11110..",
    "..01122222110...",
    "...011221110....",
    "....00000000....",
    "................",
  ],
  palette: basePalette("#a78bfa", "#7c3aed", "#ddd6fe", "#facc15"),
};

// 5. o3 — taller purple thinker with halo of orbiting orbs
const sp_o3: Sprite = {
  grid: [
    ".....4.....4....",
    "....040...040...",
    ".....0..4..0....",
    "........040.....",
    "....4........4..",
    "...040.....040..",
    "....01111110....",
    "...0112222110...",
    "..011222222110..",
    "..0w12222221w0..",
    "..0wk1ww1ww0k0..",
    "..0112p1k1pk110.",
    "..01122111122110",
    "...0112222221110",
    "....00111122110.",
    ".....00000000...",
  ],
  palette: basePalette("#c4b5fd", "#7c3aed", "#ede9fe", "#facc15"),
};

/* ─── Anthropic line: Sage hooded creatures (orange/peach) ──────────── */

// 6. Claude Haiku 3.5 — tiny robed sprite with a single leaf
const sp_haiku: Sprite = {
  grid: [
    "................",
    "................",
    ".......4........",
    "......040.......",
    ".......01.......",
    "......0010......",
    ".....011110.....",
    "....01122110....",
    "...0112222110...",
    "...01w1221w10...",
    "...01kw11wk10...",
    "...0112p1p110...",
    "...01122221100..",
    "....011221110...",
    ".....001100.....",
    "................",
  ],
  palette: basePalette("#fbbf24", "#d97757", "#fde68a", "#84cc16"),
};

// 7. Claude Sonnet 4 — taller, holds an open book
const sp_sonnet: Sprite = {
  grid: [
    "................",
    "................",
    "......0000......",
    ".....011110.....",
    "....01122110....",
    "...0112222110...",
    "..0w11222211w0..",
    "..0kw1ww1ww0k0..",
    "..0112p111p110..",
    "..0112221122110.",
    "..0112222222110.",
    "..0011111111100.",
    "..0w0000ww0000w.",
    "..0wwwww00wwww0.",
    "..00000000000000",
    "................",
  ],
  palette: basePalette("#fbbf24", "#b45309", "#fde68a", "#fcd34d"),
};

// 8. Claude Opus 4 — large robed sage with scroll + amber halo
const sp_opus: Sprite = {
  grid: [
    "......g..g......",
    ".....g0gg0g.....",
    "......gggg......",
    ".....01111110...",
    "....0111111110..",
    "...011333331110.",
    "..01133333331110",
    ".011w33333w11100",
    ".011kw3333wk1110",
    ".011p3333p11110.",
    ".0112233222110..",
    "..0122222221100.",
    ".000111111110...",
    "0wwwwwwwwwwww0..",
    "0wwww000000ww0..",
    "..000000000000..",
  ],
  palette: basePalette("#fbbf24", "#92400e", "#fde68a", "#d97757"),
};

/* ─── Google DeepMind: water/wave wisps ─────────────────────────────── */

// 9. Gemini 2.0 Flash — small lightning sprite shaped like a Gemini star
const sp_gemini_2_0_flash: Sprite = {
  grid: [
    "................",
    ".......y........",
    "......yyy.......",
    "......040.......",
    ".....01410......",
    "....0144410.....",
    "...014444410....",
    "..011444444110..",
    "..01144444110...",
    "...0w1441w10....",
    "....0kw11wk0....",
    "....011p1p10....",
    ".....01p1110....",
    "......01110.....",
    ".......000......",
    "................",
  ],
  palette: basePalette("#60a5fa", "#1d4ed8", "#bfdbfe", "#facc15"),
};

// 10. Gemini 2.5 Flash — bigger four-pointed Gemini star creature with cape
const sp_gemini_2_5_flash: Sprite = {
  grid: [
    "................",
    ".......y........",
    "......y4y.......",
    ".....yy4yy......",
    "....y014410y....",
    "...yy144410yy...",
    "..0y1444444y0...",
    "..014444444110..",
    ".0114w4444w110..",
    ".0114kw11wk110..",
    "..0114p11p1110..",
    "..0114111144110.",
    "...014211441100.",
    "....0144441110..",
    ".....01100110...",
    "................",
  ],
  palette: basePalette("#60a5fa", "#1d4ed8", "#dbeafe", "#facc15"),
};

// 11. Gemini 2.5 Pro — towering star creature, crown, cosmic eyes
const sp_gemini_2_5_pro: Sprite = {
  grid: [
    ".......g........",
    "......gyg.......",
    ".....gyyyg......",
    "....gy0yy0yg....",
    "...gy014410yg...",
    "..gy01444410y...",
    "..0144444444110.",
    ".0114w4444w4110.",
    ".0114kw1k1wk110.",
    ".0114p11p11p110.",
    ".01144111144110.",
    ".01144211442110.",
    "..01122244411100",
    "...0114444411100",
    "....01100001100.",
    "................",
  ],
  palette: basePalette("#3b82f6", "#1e3a8a", "#bfdbfe", "#facc15"),
};

/* ─── Meta: open-source llama-cubs ──────────────────────────────────── */

// 12. Llama 3.1 8B — small llama cub
const sp_llama_8b: Sprite = {
  grid: [
    "................",
    "................",
    "................",
    ".......0000.....",
    "......01111100..",
    ".....01w1k1k10..",
    ".....01k1ww110..",
    ".....01p11p110..",
    "....01111111110.",
    "....011p11p1110.",
    "....01100001110.",
    "....01100001110.",
    "....01100001110.",
    "....011001100...",
    "....0000000000..",
    "................",
  ],
  palette: basePalette("#cbd5e1", "#475569", "#e2e8f0", "#1877f2"),
};

// 13. Llama 3.1 70B — adult llama with saddle
const sp_llama_70b: Sprite = {
  grid: [
    "................",
    "................",
    "......0000......",
    ".....011111000..",
    "....011w1k1110..",
    "....01k1ww1110..",
    "....01p1111110..",
    "....01111111100.",
    "...01122222110..",
    "..01112222221110",
    "..0112p2222p110.",
    "..01100110011000",
    "..01100110011000",
    "..01100110011000",
    "..01100110011000",
    "..0000000000000.",
  ],
  palette: basePalette("#94a3b8", "#334155", "#cbd5e1", "#1877f2"),
};

// 14. Llama 3.1 405B — colossal llama with banner-cape
const sp_llama_405b: Sprite = {
  grid: [
    "......0000......",
    ".....011111000..",
    "....011w1k1110..",
    "....01k1ww1110..",
    "....01p1111110..",
    "....01111111100.",
    "...01122222110..",
    "..01112222221110",
    "..0112p4444p110.",
    "..01122444221110",
    "..01122444221110",
    "..01100440011000",
    "..01100440011000",
    "..01100440011000",
    "..01100440011000",
    "..0000000000000.",
  ],
  palette: basePalette("#94a3b8", "#1e293b", "#cbd5e1", "#1877f2"),
};

// 15. Llama 4 Scout — flying mecha-llama with goggles
const sp_llama_4_scout: Sprite = {
  grid: [
    "................",
    ".......0000.....",
    "......011111000.",
    "......0114411100",
    "......014ww4110.",
    "......01wkkw110.",
    "......01p11p110.",
    "...0001111111100",
    "..01112222221100",
    "..0112p2222p110.",
    "..0112222222110.",
    "..01100110011000",
    "..01100110011000",
    "..0000....0000..",
    "................",
    "................",
  ],
  palette: basePalette("#22d3ee", "#0e7490", "#cffafe", "#1877f2"),
};

// 16. Llama 4 Maverick — armored llama swarm-leader
const sp_llama_4_maverick: Sprite = {
  grid: [
    "...44....44.....",
    "..4400....0044..",
    "..04011111100...",
    "..0114w1k14110..",
    "..0114k1ww1110..",
    "..0114p1114110..",
    "..011144441110..",
    "..0114444444110.",
    ".01124444442110.",
    ".01124444442110.",
    ".01100440011000.",
    ".01100440011000.",
    ".01100440011000.",
    ".01100440011000.",
    "..0000000000000.",
    "................",
  ],
  palette: basePalette("#7dd3fc", "#0c4a6e", "#e0f2fe", "#fbbf24"),
};

/* ─── DeepSeek: whale family ────────────────────────────────────────── */

// 17. DeepSeek V2.5 — small blue whale-pup with single bubble
const sp_ds_v25: Sprite = {
  grid: [
    "................",
    "................",
    "................",
    "......w.........",
    ".....ww0........",
    "....0011110.....",
    "...01113w110....",
    "...013w3wk10....",
    "..0111kw1111100.",
    "..0111p11111110.",
    "..0112222111110.",
    "...01222111110..",
    "....00111110....",
    "......0000......",
    "................",
    "................",
  ],
  palette: basePalette("#60a5fa", "#1e40af", "#bfdbfe", "#1d4ed8"),
};

// 18. DeepSeek V3 — bigger whale with spout + fin
const sp_ds_v3: Sprite = {
  grid: [
    ".....w..........",
    "....ww0.........",
    ".....w0.........",
    "....0040........",
    "...001111110....",
    "..01113331110...",
    "..0133w333110...",
    "..01w333wk1100..",
    ".01133kw333110..",
    ".01133p11331110.",
    ".01122221111100.",
    ".01222222221110.",
    "..0122222211100.",
    "...0011111100...",
    "......00000.....",
    "................",
  ],
  palette: basePalette("#3b82f6", "#1e3a8a", "#93c5fd", "#1d4ed8"),
};

// 19. DeepSeek R1 — armored reasoning-whale with star + reasoning halo
const sp_ds_r1: Sprite = {
  grid: [
    ".....g..g..g....",
    "....g0gg0g0.....",
    ".....gggg.......",
    "....001111110...",
    "...01133333110..",
    "...0133w333110..",
    "..01w3333wk110..",
    ".0113kw3333110..",
    ".0113p1133311100",
    ".01122441331110.",
    ".01122444331110.",
    ".011244443331110",
    "..0122444221100.",
    "...0001111000...",
    "......00000.....",
    "................",
  ],
  palette: basePalette("#3b82f6", "#1e3a8a", "#dbeafe", "#facc15"),
};

/* ─── Mistral: alpine wind-spirits + flame creature ─────────────────── */

// 20. Mistral Small 3 — small wind-sprite with tricolor scarf
const sp_mistral_small: Sprite = {
  grid: [
    "................",
    "................",
    "......0000......",
    ".....011110.....",
    "....01133110....",
    "...01133331100..",
    "...0w1331w110...",
    "...0kw11wk110...",
    "..0114444411100.",
    "..0115555511100.",
    "..0110000011100.",
    "...01100001100..",
    "....011001100...",
    ".....01100110...",
    "......0000......",
    "................",
  ],
  palette: basePalette("#fb923c", "#9a3412", "#fed7aa", "#fbbf24", "#dc2626"),
};

// 21. Mistral Large 2 — towering mountain-marshal with tricolor cape
const sp_mistral_large: Sprite = {
  grid: [
    ".......0........",
    "......040.......",
    "......0000......",
    ".....011110.....",
    "....01133110....",
    "...0113333110...",
    "..01133333110...",
    "..01w3333w110...",
    "..01kw333wk110..",
    "..011p11p11110..",
    ".011444444411100",
    ".011555555511100",
    ".011000000011100",
    ".0110.....01100.",
    "0000000.000000..",
    "................",
  ],
  palette: basePalette("#fb923c", "#7c2d12", "#fed7aa", "#fbbf24", "#dc2626"),
};

// 22. Codestral — code hunter, cat-like with brackets as ears
const sp_codestral: Sprite = {
  grid: [
    "................",
    ".....4....4.....",
    "....044..440....",
    "....040..040....",
    "....040..040....",
    ".....01111100...",
    "....01w1k1110...",
    "....01k1ww110...",
    "...0114111110...",
    "...0114p1p1110..",
    "...01144441110..",
    "...01144441110..",
    "...01100001100..",
    "....00....00....",
    "................",
    "................",
  ],
  palette: basePalette("#fb923c", "#7c2d12", "#fed7aa", "#10b981"),
};

/* ─── Mixtral 8x22B — eight-headed council (one big head + 7 tiny) ──── */
const sp_mixtral: Sprite = {
  grid: [
    "................",
    "..0000....0000..",
    ".044440..04444.0",
    "..0440....044.0.",
    "................",
    "...000....000...",
    "...044....440...",
    "...000....000...",
    "....01111110....",
    "...01122221100..",
    "..011w1k1k1110..",
    "..011kw1ww1110..",
    "..011p1111p110..",
    "..0114444411100.",
    "..0110000011100.",
    "..0000....0000..",
  ],
  palette: basePalette("#fb923c", "#7c2d12", "#fed7aa", "#fbbf24"),
};

/* ─── Qwen: dragon-scribes ──────────────────────────────────────────── */

// 23. Qwen 2.5 72B — winged purple dragon with scroll
const sp_qwen_72b: Sprite = {
  grid: [
    "................",
    "..4....4.....4..",
    "..40..04...040..",
    "...0444010440...",
    "....011111110...",
    "...011w1k1110...",
    "...01k1ww1110...",
    "...01p1111p110..",
    "..011144441110..",
    "..0114444444110.",
    "..0114444444110.",
    "..0110044001100.",
    "..0000.00.00000.",
    "................",
    "................",
    "................",
  ],
  palette: basePalette("#a78bfa", "#5b21b6", "#ddd6fe", "#facc15"),
};

// 24. Qwen QwQ 32B — pondering dragon with question-mark thought
const sp_qwen_qwq: Sprite = {
  grid: [
    ".....4444.......",
    "....4....4......",
    ".........4......",
    "........4.......",
    "................",
    "........4.......",
    "................",
    "....01111110....",
    "...011w1k1110...",
    "...01k1ww1110...",
    "...01p1p11p110..",
    "..011144441110..",
    "..0114444444110.",
    "..0110044001100.",
    "..0000.00.00000.",
    "................",
  ],
  palette: basePalette("#a78bfa", "#5b21b6", "#ddd6fe", "#facc15"),
};

/* ─── xAI: snarky electric ──────────────────────────────────────────── */

// 25. Grok 2 — small black-and-blue spark gremlin
const sp_grok_2: Sprite = {
  grid: [
    "................",
    "................",
    ".......y........",
    "......yy0.......",
    "......0y00......",
    "......0011000...",
    ".....011w1k10...",
    ".....01k1ww10...",
    ".....011p1p110..",
    "....01122221100.",
    "...0112p22p2110.",
    "...01122222110..",
    "....01100110....",
    "....0000.000....",
    "................",
    "................",
  ],
  palette: basePalette("#60a5fa", "#0c1929", "#bfdbfe", "#facc15"),
};

// 26. Grok 3 — bigger snark-mech with crown of bolts
const sp_grok_3: Sprite = {
  grid: [
    "....y...y...y...",
    "...y0y.y0y.y0y..",
    "....yy.yy.yy....",
    "......0000......",
    ".....011111000..",
    "....01w11k1110..",
    "....01k11ww110..",
    "....01p1111p110.",
    "...0112222221100",
    "..0112p222222110",
    "..0112222p221110",
    "..0110000000110.",
    "..0000.....0000.",
    "................",
    "................",
    "................",
  ],
  palette: basePalette("#3b82f6", "#0c1929", "#dbeafe", "#facc15"),
};

/* ─── Cohere: citation knight ───────────────────────────────────────── */

// 27. Command R+ — knight-creature holding scroll
const sp_command_r_plus: Sprite = {
  grid: [
    "................",
    ".......040......",
    "......04340.....",
    "......01110.....",
    ".....011111000..",
    "....01w1k11110..",
    "....01k1ww1110..",
    "....01p1111p10..",
    "...0114444411100",
    "...0114444441110",
    "...0114444441100",
    "...01100110011..",
    "..0w0000.000w0..",
    "..0wwwww00wwww0.",
    "..00000000000000",
    "................",
  ],
  palette: basePalette("#39c5bb", "#1f8a82", "#a7f3d0", "#fbbf24"),
};

/* ─── Microsoft: tiny scholar (Phi) ─────────────────────────────────── */

// 28. Phi-4 — tiny scholar in graduation cap with book
const sp_phi_4: Sprite = {
  grid: [
    "................",
    ".....4444444....",
    "....4.....4.....",
    ".....40000......",
    "......0000......",
    ".....011110.....",
    "....01w1k110....",
    "....01k1ww10....",
    "....01p1p110....",
    "...01111111100..",
    "..0114444411100.",
    "..0114444411100.",
    "..0110000011100.",
    "..00.....0.00...",
    "................",
    "................",
  ],
  palette: basePalette("#7dd3fc", "#0c4a6e", "#e0f2fe", "#fbbf24"),
};

/* ─── Whisper: pure listener ────────────────────────────────────────── */

// 29. Whisper Large v3 — eared listener creature
const sp_whisper: Sprite = {
  grid: [
    "................",
    ".....4.....4....",
    "....040...040...",
    "...040440440....",
    "....040.040.....",
    ".....011110.....",
    "....01w1k110....",
    "....01k1ww10....",
    "....011p1p10....",
    "....011111110...",
    "...0112222110...",
    "...0112222110...",
    "...0110011000...",
    "...0000.0000....",
    "................",
    "................",
  ],
  palette: basePalette("#a7f3d0", "#10a37f", "#d1fae5", "#0ea5e9"),
};

/* ─── Map model fullName → sprite ───────────────────────────────────── */

/**
 * Keyed by `fullName` so renumbering Dex IDs (e.g. by release date) doesn't
 * misalign sprites with their models. fullName is unique and stable.
 */
export // 151. Claude Mythos — mythic, haloed, gold-and-violet, double crown
const sp_mythos: Sprite = {
  grid: [
    "......gggg......",
    ".....g0000g.....",
    "....g011110g....",
    "....01133110....",
    "...0113gg3110...",
    "..01w3gggg3w10..",
    "..0kg3g00g3gk0..",
    "..0113gggg3110..",
    "..011p3gg3p110..",
    "..0112gggg2110..",
    "..0011222211100.",
    ".000111111110...",
    "0wwww0gggg0www0.",
    "0www0g0000g0ww0.",
    "..00g0gggg0g00..",
    ".....g.gg.g.....",
  ],
  palette: basePalette("#a78bfa", "#5b21b6", "#ddd6fe", "#f5d76e", "#fbbf24"),
};

// 152. Grok Colossus — towering red mech with flame crown, dollar-sign chest
const sp_colossus: Sprite = {
  grid: [
    "....y..yy..y....",
    "...y4y0044y4y...",
    "....044444440...",
    "...01111111110..",
    "..0112wkkw21100.",
    "..0112w22w2110..",
    "..01122222211p0.",
    "..0112y22y21100.",
    "..0112yyyy21100.",
    "..0011444411100.",
    ".000111111111100",
    "..0111000011110.",
    "...0110..0110...",
    "...0110..0110...",
    "...0440..0440...",
    "...4440..0444...",
  ],
  palette: basePalette("#dc2626", "#7f1d1d", "#fca5a5", "#f97316", "#fbbf24"),
};

// 153. GPT-o∞ (preview) — broken/glitching circular orb with stack-trace lines
const sp_hang: Sprite = {
  grid: [
    "................",
    "....0011110.....",
    "...011333310....",
    "..0133g00g3310..",
    ".013g0wkkw0g310.",
    ".013gw3333wg310.",
    "013g03g4g303g310",
    "013g0g4yy4g0g310",
    ".013gw3333wg310.",
    ".013g0wkkw0g310.",
    "..0133g00g3310..",
    "...011333310....",
    "....0011110.....",
    "....0.0..0.0....",
    "...040.04.040...",
    "....0..04..0....",
  ],
  palette: basePalette("#10a37f", "#064e3b", "#a7f3d0", "#22d3ee", "#facc15"),
};

// 154. MemoryNo — glitched DDR memory stick, pins on one side, sparking
const sp_memoryno: Sprite = {
  grid: [
    "................",
    "..gw0000000000g.",
    "..0w11111111100.",
    "..014444444410..",
    "..014ww44ww4410.",
    "..014w4w4w4w410.",
    "..014ww44ww4410.",
    "..0144444444410.",
    "..0144gg44gg410.",
    "..0144444444410.",
    "..0144wwww4w410.",
    "..0114444444110.",
    "..01w1w1w1w1w10.",
    "..0w0w0w0w0w0w0.",
    "..g.g.g.g.g.g.g.",
    "..0.0.0.0.0.0.0.",
  ],
  palette: basePalette("#22d3ee", "#0f766e", "#a7f3d0", "#fde047", "#a78bfa"),
};

// 155. Project Truckanon — small unmarked moving truck, dark windows
const sp_truckanon: Sprite = {
  grid: [
    "................",
    "................",
    "....0000000000..",
    "...0wwww1111110.",
    "...0wkkw1111110.",
    "...0wwww1111110.",
    "..00000000000000",
    "..0222222222220.",
    "..0244444444220.",
    "..0244ggg444220.",
    "..0244ggg444220.",
    "..0244444444220.",
    "..0222222222220.",
    "..00000000000000",
    "...0kk0....0kk0.",
    "...0kk0....0kk0.",
  ],
  palette: basePalette("#1f2937", "#94a3b8", "#475569", "#fbbf24"),
};

const SPRITES: Record<string, Sprite> = {
  "gpt-4o-mini": sp_gpt4o_mini,
  "gpt-4o": sp_gpt4o,
  "gpt-5": sp_gpt5,
  "o1-mini": sp_o1_mini,
  o3: sp_o3,
  "claude-3-5-haiku": sp_haiku,
  "claude-sonnet-4": sp_sonnet,
  "claude-opus-4": sp_opus,
  "gemini-2.0-flash": sp_gemini_2_0_flash,
  "gemini-2.5-flash": sp_gemini_2_5_flash,
  "gemini-2.5-pro": sp_gemini_2_5_pro,
  "meta-llama-3.1-8b-instruct": sp_llama_8b,
  "meta-llama-3.1-70b-instruct": sp_llama_70b,
  "meta-llama-3.1-405b-instruct": sp_llama_405b,
  "meta-llama-4-scout-17b-16e": sp_llama_4_scout,
  "meta-llama-4-maverick-17b-128e": sp_llama_4_maverick,
  "deepseek-v2.5": sp_ds_v25,
  "deepseek-chat": sp_ds_v3,
  "deepseek-reasoner": sp_ds_r1,
  "mistral-small-3": sp_mistral_small,
  "mistral-large-2": sp_mistral_large,
  "codestral-22b": sp_codestral,
  "qwen-2.5-72b-instruct": sp_qwen_72b,
  "qwen-qwq-32b": sp_qwen_qwq,
  "grok-2": sp_grok_2,
  "grok-3": sp_grok_3,
  "command-r-plus": sp_command_r_plus,
  "mixtral-8x22b-instruct": sp_mixtral,
  "phi-4": sp_phi_4,
  "whisper-large-v3": sp_whisper,
  "claude-mythos": sp_mythos,
  "grok-colossus": sp_colossus,
  "gpt-o-infinity-preview": sp_hang,
  "memoryno": sp_memoryno,
  "project-truckanon": sp_truckanon,
};

/** Fallback sprite if we ever miss one */
export const FALLBACK_SPRITE: Sprite = {
  grid: [
    "................",
    "......0000......",
    ".....011110.....",
    "....01122110....",
    "...0112222110...",
    "..011w11k1110...",
    "..01k1ww11110...",
    "..011p1111110...",
    "..0112222221100.",
    "..01122222211100",
    "..0112p2222p110.",
    "...01122222110..",
    "....011001100...",
    "....00....00....",
    "................",
    "................",
  ],
  palette: basePalette("#94a3b8", "#475569", "#cbd5e1", "#22d3ee"),
};

export function getSprite(fullName: string): Sprite {
  return SPRITES[fullName] ?? FALLBACK_SPRITE;
}
