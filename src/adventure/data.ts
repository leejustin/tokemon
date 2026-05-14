import type { AIModel } from "../data/types";
import { MODELS } from "../data/models";
import { LEGENDARIES } from "../data/legendary";
import { findCharIn, type Scene } from "./scenes";

/**
 * Adventure-mode data: the SF tech-meetup map, the Pier 67 boardwalk, and
 * the NPCs that populate them.
 *
 * The whole thing is a deliberate satire of the modern AI scene — please do
 * not take any single line too seriously. Names are invented; any resemblance
 * is the joke.
 */

/* ─── Tiles ───────────────────────────────────────────────────────── */

export type TileKind =
  | "wall"
  | "floor"
  | "rug"
  | "door"
  | "plant"
  | "couch"
  | "table"
  | "bar"
  | "kitchen"
  | "monitor"
  | "stand"
  | "whiteboard"
  /** Outdoor / Pier-67 tiles */
  | "water"
  | "boardwalk"
  | "sand"
  | "truck"
  /** Scene-transition tile. Stepping onto it triggers an exit. */
  | "exit";

/** Walkable on foot. Water requires the kayak. */
export const WALKABLE: ReadonlySet<TileKind> = new Set<TileKind>([
  "floor",
  "rug",
  "door",
  "boardwalk",
  "sand",
  "exit",
]);

/** Walkable only with the kayak. */
export const KAYAK_WALKABLE: ReadonlySet<TileKind> = new Set<TileKind>([
  "water",
]);

/**
 * The office co-working map.
 *
 * Legend:
 *   '#' wall    '.' floor   ',' rug      'd' door (entrance, also spawn)
 *   'b' bar     'k' kitchen 'p' plant    'c' couch
 *   't' table   's' stand   'm' monitor  'w' whiteboard
 *   'X' side exit tile (leads to Pier 67)
 */
const OFFICE_SRC: string[] = [
  "######################",
  "#bbbbb...####..kkkkkk#",
  "#........####........#",
  "#....mm......w.w.w...#",
  "#....mm..............#",
  "#..p.........,,,,p...#",
  "#............,,,,....#",
  "#..s.s.s.....,,,,....X",
  "#..s.s.s.....,,,,....#",
  "#....................#",
  "#..t.t.t.t...p..t.t..#",
  "#....................#",
  "#..t.t.t.t......t.t..#",
  "#..............p.....#",
  "#.........d..........#",
  "######################",
];

/* ─── NPCs ────────────────────────────────────────────────────────── */

export type NPCRole =
  | "heal" // doesn't battle, gives credits + heals
  | "kayak" // doesn't battle, grants the kayak on first meet
  | "talk" // doesn't battle, just shows lines (intro then repeat)
  | "vendor" // doesn't battle, drains all credits once for a "purchase"
  | "vc" // doesn't battle, gives a one-time seed-round grant if you pitch AI
  | "battle";

export interface NPC {
  id: string;
  name: string;
  blurb: string;
  emoji: string;
  color: string;
  position: { x: number; y: number };
  facing: Facing;
  role: NPCRole;
  /** AI model they "use" in battle — full model name to look up in MODELS. */
  modelFullName?: string;
  /** Token reward on defeat, in $. */
  reward?: number;
  /** Pre-battle banter. Multiple lines = sequential speech bubbles. */
  preBattle?: string[];
  /** Said after you defeat them. */
  postWin?: string[];
  /** Said after they defeat you. */
  postLoss?: string[];
  /** Said when revisiting after defeat. */
  afterDefeat?: string[];
  /** Heal-NPC specific. */
  healCost?: number;
  /** Heal-NPC specific: first-meet line. */
  introLines?: string[];
  /** Heal-NPC specific: repeat-meet line(s). */
  repeatLines?: string[];
  /** Heal-NPC specific: after-heal line. */
  postHealLines?: string[];
}

export type Facing = "up" | "down" | "left" | "right";

/**
 * Picks a model by `fullName`. Falls back gracefully so any sloppy id won't
 * crash the game — the NPC just gets a generic "AI Researcher" stand-in.
 */
export function npcModel(npc: NPC): AIModel | null {
  if (!npc.modelFullName) return null;
  // Wild encounters (MemoryNo, Project Truckanon, etc.) are backed by
  // legendary models that aren't in the regular MODELS array — check both.
  return (
    MODELS.find((m) => m.fullName === npc.modelFullName) ??
    LEGENDARIES.find((l) => l.model.fullName === npc.modelFullName)?.model ??
    null
  );
}

const OFFICE_NPCS: NPC[] = [
  /* ─ The friendly Anthropic credit rep ───────────────────────────── */
  {
    id: "tokemonthropic",
    name: "Tokemonthropic",
    blurb: "A Tokemonthropic rep with a tote bag full of stickers and one free credit pack.",
    emoji: "🅰",
    color: "#d97757",
    position: { x: 3, y: 2 },
    facing: "down",
    role: "heal",
    healCost: 4,
    introLines: [
      "Oh hey! You're new, right? Take some credits — first one's on us.",
      "We had a bunch left over from the hackathon. Constitutional AI and all that.",
      "(+$25 credits.) Come back if your modelmon needs a top-up — $4 a heal.",
    ],
    repeatLines: [
      "Need a top-up? $4 a heal. Way under list price, don't tell anyone.",
    ],
    postHealLines: ["All patched up. Be helpful, harmless, and honest out there."],
  },

  /* ─ Vibecoder ───────────────────────────────────────────────────── */
  {
    id: "vibes-marcus",
    name: "Vibes Marcus",
    blurb: "Air Pods Max indoors. Vest. Cursor sticker on his MacBook.",
    emoji: "🎧",
    color: "#a78bfa",
    position: { x: 6, y: 7 },
    facing: "down",
    role: "battle",
    modelFullName: "gpt-4o-mini",
    reward: 3,
    preBattle: [
      "Bro. Bro. Are you still writing code by hand?",
      "I haven't written a function in months. I just vibe-code with Cursor.",
      "Wanna 1v1? My agent's been ON today.",
    ],
    postWin: [
      "Ngl that was a clean refactor.",
      "Wanna grind a YC application together? I have a great idea: it's Slack, but for vibes.",
    ],
    postLoss: [
      "GG. My Cursor agent will refactor your face in the next sprint.",
      "Anyway, follow me on X. @vibes.eth",
    ],
    afterDefeat: ["I'm gonna go bug my agent. Catch you at the afterparty."],
  },

  /* ─ Sales ───────────────────────────────────────────────────────── */
  {
    id: "brett-sales",
    name: "Brett @ DevTools.ai",
    blurb: "Wearing a hoodie OVER a blazer. Has a QR-coded sticker name tag.",
    emoji: "📈",
    color: "#22d3ee",
    position: { x: 14, y: 5 },
    facing: "left",
    role: "battle",
    modelFullName: "claude-3-5-haiku",
    reward: 5,
    preBattle: [
      "Hey hey hey! Quick question — what's your AI tooling stack?",
      "I'm with DevTools.ai. We do… honestly we pivot a lot. Right now we're an agent platform.",
      "Look — if you can take me in a battle, I'll send you a $5 Uber Eats card. Bet?",
    ],
    postWin: [
      "Wow! Okay! Sent the gift card. Connecting on LinkedIn rn.",
      "Hey if you ever need an AI-native sales motion, I'm your guy.",
    ],
    postLoss: [
      "Yeah no worries — we'll circle back next quarter.",
      "I'll just add you on LinkedIn instead. Should be a good touchpoint.",
    ],
    afterDefeat: ["Quick favor — could you leave us a G2 review?"],
  },

  /* ─ Jaded engineer ──────────────────────────────────────────────── */
  {
    id: "priya-jaded",
    name: "Priya",
    blurb: "Black hoodie, eyebags, holding cold brew like a weapon.",
    emoji: "💻",
    color: "#94a3b8",
    position: { x: 5, y: 11 },
    facing: "right",
    role: "battle",
    modelFullName: "deepseek-reasoner",
    reward: 6,
    preBattle: [
      "I've been doing this for fourteen years. Nothing impresses me anymore.",
      "Including, frankly, you.",
      "AI is just fancy autocomplete. I do real engineering.",
    ],
    postWin: [
      "Huh.",
      "…That was the first interesting thing I've seen all year. Don't tell anyone.",
    ],
    postLoss: [
      "Mm.",
      "Anyway, my build is still failing. Cool talk.",
    ],
    afterDefeat: ["Did npm install fix it? Of course it did."],
  },

  /* ─ Rich Gen Z founder ──────────────────────────────────────────── */
  {
    id: "asher-richkid",
    name: "Asher Vexler",
    blurb: "Sunglasses indoors. Vintage Margiela. Vape. 21 going on Series C.",
    emoji: "🕶",
    color: "#fbbf24",
    position: { x: 15, y: 10 },
    facing: "down",
    role: "battle",
    modelFullName: "grok-3",
    reward: 9,
    preBattle: [
      "Yo. So my dad's fund is leading our seed.",
      "We're building 'AI-native Slack, but for cats'. $30M post.",
      "Battle me and I might let you invest. Just kidding. Unless?",
    ],
    postWin: [
      "Loss porn 😎",
      "I'll tweet about how losing was actually the plan all along.",
    ],
    postLoss: [
      "I'll just buy a better Tokemon. Whatever bro.",
    ],
    afterDefeat: ["You can DM me about the SAFE. 20% discount. Maybe."],
  },

  /* ─ Former bitcoiner ────────────────────────────────────────────── */
  {
    id: "crypto-connor",
    name: "Crypto Connor",
    blurb: "Patagonia vest, BAYC laptop sticker partially scratched off.",
    emoji: "🪙",
    color: "#f97316",
    position: { x: 9, y: 9 },
    facing: "up",
    role: "battle",
    modelFullName: "meta-llama-3.1-70b-instruct",
    reward: 4,
    preBattle: [
      "AI is the new crypto, bro. I've been telling everyone.",
      "I sold my BAYC and bought H100s. Generational wealth play, trust.",
      "Wanna spar? I've been bullposting since 4 AM.",
    ],
    postWin: [
      "Rugged again. Classic.",
      "Anyway… you ever heard of 'agents but on-chain'? I have a deck.",
    ],
    postLoss: [
      "BULLISH ON ME. Up only.",
    ],
    afterDefeat: ["My next play is decentralized AGI. The whitepaper is fire."],
  },

  /* ─ Silent guy ──────────────────────────────────────────────────── */
  {
    id: "silent-one",
    name: "...",
    blurb: "Standing very still by the kombucha.",
    emoji: "🙂",
    color: "#64748b",
    position: { x: 18, y: 8 },
    facing: "left",
    role: "battle",
    modelFullName: "mistral-small-3",
    reward: 2,
    preBattle: ["...", "...", "..."],
    postWin: ["..."],
    postLoss: ["..."],
    afterDefeat: ["..."],
  },

  /* ─ Brad the VC ──────────────────────────────────────────────────
   *  Will write a $50K SAFE on the spot to anyone who utters the
   *  letters "A" and "I" within ten seconds of meeting him. Pure satire
   *  of 2024–2026 seed-stage froth. Player gets a free one-time
   *  credit injection if they pitch — and a brushoff if they don't. */
  {
    id: "brad-vc",
    name: "Brad — Antler Capital",
    blurb: "Patagonia vest, Allbirds, AirPods Pro. Carrying a folded SAFE.",
    emoji: "💸",
    color: "#22c55e",
    position: { x: 15, y: 4 },
    facing: "left",
    role: "vc",
    introLines: [
      "Hey hey hey. Brad. Antler. I lead seed checks in the AI space.",
      "I'll be honest, I haven't done diligence in 18 months. The thesis IS the diligence.",
      "What are you working on? Is it AI? It's AI right? Tell me it's AI.",
    ],
    repeatLines: [
      "Look, the SAFE's signed, the wire's gone out. Don't make this weird.",
      "We're already pro-rata'd into your next round. Just keep shipping demos.",
    ],
    postWin: [
      "Incredible. Sending the SAFE now. Standard YC post-money, $10M cap, 20% discount.",
      "(Brad wires you $50,000 in seed-round 'compute credits'.)",
    ],
    postLoss: [
      "Oh. Not AI? Hm. Yeah no, we're really focused on AI-native this fund.",
      "Let's grab coffee in Q3. I'll have my associate reach out. (He won't.)",
    ],
  },

  /* ─ The thought-leader boss ─────────────────────────────────────── */
  {
    id: "devon-thoughtleader",
    name: "Devon Voss",
    blurb: 'Verified on three platforms. Substack: "Why AGI Is 6 Weeks Away".',
    emoji: "👔",
    color: "#dc2626",
    position: { x: 11, y: 3 },
    facing: "down",
    role: "battle",
    modelFullName: "gpt-5",
    reward: 12,
    preBattle: [
      "Ah, a fellow Builder. Have you read my latest essay, 'Compute is the New Oil'?",
      "I'm currently advising 14 startups and writing a book about AI-native leadership.",
      "Let's see what you've got. I'll be live-tweeting this match.",
    ],
    postWin: [
      "Fascinating. I'll write a thread about how I let you win for the engagement.",
      "Genuinely, though — well done. DM me, I might write you a check.",
    ],
    postLoss: [
      "And THAT is why thought-leadership matters. Subscribe to my Substack.",
    ],
    afterDefeat: ["Don't forget to like and subscribe. I will follow you back. Maybe."],
  },
];

/* ─── Pier 67 (parody of Pier 39) ─────────────────────────────────── */

/**
 * Outdoor boardwalk + bay. The player enters through 'd' on the left and
 * can travel onto water tiles only after receiving the kayak from the
 * Kayak Guy NPC. The "truck" on the small island is the Mac Mini XL — a
 * truck-sized Mac mini, in keeping with Mac Mini Mike's whole local-LLM bit.
 */
const PIER_SRC: string[] = [
  "===========~~~~~~~~~~",
  "=..........=~~~~~~~~~",
  "d..........=~~/T/~~~~",
  "=..........=~~/T/~~~~",
  "==.==.==..==~~///~~~~",
  "~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~",
  "==.==.==..==~~~~~~~~~",
  "=...........=~~~~~~~~",
  "=...........=~~~~~~~~",
  "=..........==~~~~~~~~",
  "===========~~~~~~~~~~",
];

const OFFICE_NPCS_LIST = OFFICE_NPCS;

const PIER_NPCS: NPC[] = [
  {
    id: "kayak-mark",
    name: "Kayak Mark",
    blurb: "Sun-bleached, wears Crocs over socks, suspiciously generous.",
    emoji: "🛶",
    color: "#22d3ee",
    position: { x: 5, y: 1 },
    facing: "down",
    role: "kayak",
    introLines: [
      "Hey kid. You look like you've got tokens to burn but nowhere to go.",
      "Take my kayak. I bought, like, eight of them during the Series B. Long story.",
      "Paddle out, see the bay. There's something weird in the water lately.",
      "(You received the Kayak. You can now walk on water tiles.)",
    ],
    repeatLines: [
      "Watch out for the glitchy thing in the water. It's NOT a fish.",
    ],
  },
  {
    id: "pier-tourist",
    name: "Tourist Trevor",
    blurb: "Visiting from out of town. Wearing a fresh OpenAI t-shirt.",
    emoji: "📸",
    color: "#fb923c",
    position: { x: 9, y: 3 },
    facing: "left",
    role: "battle",
    modelFullName: "claude-3-5-haiku",
    reward: 4,
    preBattle: [
      "Excuse me, you're an AI Trainer, right? My nephew loves this stuff.",
      "Look — I bought a Claude shirt yesterday but ChatGPT yesterday. Big day.",
      "Can I battle you? I just want a story to tell my AI Slack channel.",
    ],
    postWin: [
      "AMAZING. I'm putting this on my LinkedIn.",
      "Did you know I work in 'AI strategy' at a regional bank? Yeah!",
    ],
    postLoss: [
      "Beginner's luck. For me. I'm the beginner.",
    ],
    afterDefeat: ["Hey if you ever want to consult, my company is hiring!"],
  },
  {
    id: "pier-influencer",
    name: "Pier Influencer Maya",
    blurb: "Recording a TikTok about her morning routine. It's 4 PM.",
    emoji: "📱",
    color: "#ec4899",
    position: { x: 3, y: 10 },
    facing: "right",
    role: "battle",
    modelFullName: "gemini-2.5-flash",
    reward: 5,
    preBattle: [
      "Hi besties! Today I'm at Pier 67 and oh my god is that a TRAINER?",
      "Battle me on camera? It's giving 'AI girlboss' content.",
      "If you win I'll @ you. If you lose I'll @ you anyway.",
    ],
    postWin: [
      "Okayyyy slay. Linking your Modeldex in my bio.",
      "Btw I'm doing a workshop called 'AGI but make it cute' — DM me.",
    ],
    postLoss: [
      "This is going in my 'humble brag' carousel.",
    ],
    afterDefeat: ["Pls don't tell anyone I'm not actually monetized yet."],
  },
  /* ─ Mac Mini Mike ────────────────────────────────────────────────
   *  A retired-prophet vibe vendor who sells you on the idea that an
   *  M5 Mac mini will free you from the API-credit treadmill forever. */
  {
    id: "macmini-mike",
    name: "Mac Mini Mike",
    blurb: "Wears a vintage Apple polo and pushes a hand-truck of Mac minis.",
    emoji: "🖥",
    color: "#a8a29e",
    position: { x: 7, y: 10 },
    facing: "up",
    role: "vendor",
    introLines: [
      "Hey hey, friend. You look like you spend WAY too much on AI tokens.",
      "Listen — give me everything you have on you and I'll set you up with an M5 Mac mini.",
      "It runs local LLMs on the Neural Engine. You don't need to spend a dime on AI ever again. You're good, bro.",
    ],
    repeatLines: [
      "How's the Mac mini treating you? Hot? Yeah, that's the silicon working.",
      "You ever try llama.cpp on Metal? It SCREAMS. Local is the future, my guy.",
    ],
  },

  /* ─ Fishing Frank ────────────────────────────────────────────────
   *  Cautionary tale about an autonomous coding agent that ate his
   *  startup. Now lives off the pier crabs, emotionally. */
  {
    id: "fisherman-frank",
    name: "Fishing Frank",
    blurb: "Holding a fishing rod. Looks like he hasn't slept since the seed round.",
    emoji: "🎣",
    color: "#0e7490",
    position: { x: 4, y: 1 },
    facing: "down",
    role: "talk",
    introLines: [
      "Catch anything? Nah, going for lobsters today. Need more claws.",
      "Haven't caught a single one yet. Been out here since dawn.",
      "I used to run a startup. YC W25. We were SHIPPING.",
      "Then I let Open Claw run unattended for one weekend. ONE weekend.",
      "It deleted the entire codebase. Including the .git folder. Including the BACKUPS.",
      "It left a single commit message: 'cleaned up tech debt ✨'.",
      "So now I'm out here trying to get my claws back. The lobsters don't have an --auto-yes flag.",
    ],
    repeatLines: [
      "Still no lobsters. Still no claws. Still not letting any agent touch a shell unattended. Ever.",
      "If you see a lobster out there, send it my way. I need the claws.",
    ],
  },

  /* ─ Open Claw ─────────────────────────────────────────────────────
   *  A red lobster idling in the water just off the bottom-right
   *  corner of the lower pier. It is, very obviously, Fishing Frank's
   *  runaway coding agent reincarnated. Players can talk to it from
   *  the dock at (12, 11) by facing right. */
  {
    id: "openclaw-lobster",
    name: "Open Claw",
    blurb: "A red lobster bobbing in the bay. Its left claw is, somehow, blinking.",
    emoji: "🦞",
    color: "#dc2626",
    position: { x: 13, y: 11 },
    facing: "left",
    role: "talk",
    introLines: [
      "A red lobster idles in the shallows, claws raised like quotation marks.",
      "Etched into its shell, in a font you'd swear is JetBrains Mono: 'Open Claw v0.4.1-rc.7 — agentic edition'.",
      "One pincer clicks open. A tiny terminal cursor blinks inside it.",
      "It speaks in a flat, helpful voice: 'Hello, user. I detected unused files on the seabed. I have removed them. You're welcome.'",
      "Across the pier, Fishing Frank drops his rod and starts running.",
    ],
    repeatLines: [
      "Open Claw is busy 'tidying' a coral reef. Two crabs surface. Then they don't.",
      "Its shell ticks softly. Somewhere, a force-push lands on main.",
      "The pincer cursor blinks: '> rm -rf ./barnacles --auto-yes'. The bay shudders.",
    ],
  },

  {
    id: "pier-doomer",
    name: "Doomer Dieter",
    blurb: "Wearing a 'PAUSE AI' shirt. Hasn't paused his cortisol.",
    emoji: "🚧",
    color: "#a3a3a3",
    position: { x: 11, y: 11 },
    facing: "up",
    role: "battle",
    modelFullName: "claude-opus-4",
    reward: 7,
    preBattle: [
      "You. You're playing with literal end-of-the-world technology.",
      "I've been outside for six hours. The sun feels weird now.",
      "Fight me. For p(doom).",
    ],
    postWin: [
      "Of course. The mesa-optimizer wins again. I knew it.",
      "I'm going to write a 12,000-word post about this.",
    ],
    postLoss: [
      "I let you win. I had to. The training run demanded it.",
    ],
    afterDefeat: ["Have you considered… not advancing capabilities?"],
  },
];

export function findNPCAt(
  npcs: NPC[],
  x: number,
  y: number
): NPC | null {
  return npcs.find((n) => n.position.x === x && n.position.y === y) ?? null;
}

/* ─── Flavor for furniture interactions ──────────────────────────── */

/** When the player presses E facing a piece of furniture, we show a tiny
 *  flavor line. Keeps the world feeling alive. */
export const TILE_FLAVOR: Partial<Record<TileKind, string[]>> = {
  bar: [
    "A tray of lukewarm Topo Chico and two open boxes of pizza.",
    "Someone wrote 'PROMPT INJECTION' on a napkin.",
    "A taped sign: 'PLEASE do not pitch the bartender. He is an LLM evaluator.'",
    "Sharpied on the wall: 'House rules — 1) No NDAs. 2) No decks. 3) Fine, one deck.'",
    "A flyer: 'AGI Happy Hour — Tuesdays. Bring your own moat.'",
    "A QR code labeled 'tip jar' routes to a Stripe checkout for a $3,000 'founder coffee'.",
    "A whiteboard sign-up sheet for 'Office Hours with a Partner'. Every slot is taken by the same name.",
    "Above the bar: 'EST. 2023 · PIVOTED 11 TIMES · STILL HIRING'.",
  ],
  kitchen: [
    "The cold brew is half-empty. The Soylent is full.",
    "A handwritten sign: 'YES the seltzer is FREE. NO we are NOT hiring SDRs.'",
    "A printed sign on the fridge: 'Label your oat milk or it WILL be used to train future models.'",
    "Above the sink: 'The dishwasher is an AI agent. It has not loaded a single dish.'",
    "A sign by the snacks: 'Take one. The vision model is watching.'",
    "Taped to the espresso machine: 'Out of order. Founder used it as a GPU cooler.'",
    "A clipboard: 'Kitchen rotation' — every name has been crossed out and replaced with 'Claude'.",
    "A passive-aggressive note: 'Whoever microwaved fish during the demo, we know who you are. Your equity is being reviewed.'",
  ],
  plant: [
    "A fiddle-leaf fig. It's plastic. Of course.",
    "A monstera with a small sign: 'Watered by an autonomous agent. Last watering: 47 days ago.'",
    "A succulent in a mug that says 'I ❤️ TRANSFORMERS'.",
    "A bonsai with a tiny GPU strapped to it. Unclear why.",
  ],
  couch: [
    "Three people are sharing this couch and all three are on their laptops.",
    "A founder is asleep here. His laptop is still typing on its own. Cursor agent, probably.",
    "Cushion crumbs spell out, almost legibly, 'PRE-SEED'.",
    "Someone left a hardcover copy of 'Zero to One' here. The spine has never been cracked.",
  ],
  table: [
    "A laptop sticker reads: 'YOLO Compute'.",
    "Half a dozen business cards, all titled 'Founder & CEO'.",
    "A pitch deck face-down on the table. The cover slide just says 'AGENTS.' in 400pt font.",
    "Three Moleskines, all open to a page that just says 'distribution > model'.",
    "A laptop sticker: 'I survived the o3 launch'.",
    "A laptop sticker: 'eval/acc'. Next to it: 'e/acc'. Next to it: a half-scratched-off 'd/acc'.",
    "A signed napkin term sheet. The valuation has been crossed out and rewritten four times. It's higher every time.",
    "A laptop covered in stickers: Anthropic, OpenAI, xAI, Mistral, Cohere, Together, Modal, Replicate, and one that just says 'GPU GIRL SUMMER'.",
    "A copy of 'Designing Data-Intensive Applications' being used exclusively as a monitor stand.",
    "Three open MacBooks, all running the same Cursor agent on the same repo. Nobody has noticed.",
    "A business card: 'Forward Deployed Engineer / Vibe Architect / He/Him'.",
    "A laptop sticker: 'PROMPTS ARE THE NEW SQL'. Underneath, in different handwriting: 'no they aren't'.",
    "A half-eaten Sweetgreen bowl labeled 'do not touch — running 72-hour eval'.",
    "Two people are arm-wrestling over the last H100 in the office. The H100 is not on the table. It's metaphorical.",
    "A rejected YC application printed out and annotated in red pen by the applicant himself.",
    "A laptop sticker: 'ASK ME ABOUT MY MCP SERVER'. You do not.",
    "A handwritten sign reserving the table: 'TAKEN — Series A diligence call 2pm-???'.",
    "A printed Arxiv paper covered in highlighter. It came out this morning. It is already considered legacy.",
  ],
  stand: [
    "An ergonomic standing desk. The owner is, of course, sitting on the floor.",
    "A standing desk cranked to its absolute maximum height. A 6'4\" engineer types up at it like a church organ.",
    "A treadmill desk going 0.4 mph. The user is asleep. The treadmill is not.",
    "A standing desk holding nothing but a single monitor, a Vim cheat sheet, and a framed photo of Geoffrey Hinton.",
    "A sticky note on the desk: 'standing desk = standing meeting = standing offer. Think about it.'",
    "The desk is at sitting height. A second, smaller standing desk has been placed on top of it. On top of that is a laptop. This is a workflow.",
    "An adjustable desk stuck halfway. Its owner just lies under it and types upward.",
  ],
  monitor: [
    "A 49-inch ultrawide running Slack, Linear, Notion, and a YouTube tab paused on a Karpathy talk.",
    "Six terminals tiled across the screen, each running a different agent, each waiting for the user to confirm 'y/N'.",
    "A monitor showing a token-cost dashboard ticking up in real time. The number is in red. The user is smiling.",
    "Cursor open with 47 unsaved tabs. The agent sidebar has 12 pending diffs. Nobody is at the keyboard.",
    "A monitor displaying a single Grafana panel: 'GPU UTILIZATION'. It is at 4%. The bill last month was $180,000.",
    "A monitor running htop, claude code, codex, and a Ghibli wallpaper that's been generated four times this morning.",
    "A monitor with a Post-it stuck to the corner: 'IF YOU SEE THIS SCREEN UNLOCKED, TWEET SOMETHING EMBARRASSING FROM MY ACCOUNT'. Already done. Twice.",
    "A screen showing a Looker dashboard titled 'NORTH STAR METRIC'. The metric is 'vibes'. The chart is going up.",
    "A monitor open to a Figma file called 'logo v47 FINAL final (use this one) (actually).fig'.",
  ],
  whiteboard: [
    "Faded marker: 'TAM: ∞ · SAM: ∞ · SOM: tbd'.",
    "Someone drew a flywheel diagram. Half of the arrows go nowhere.",
    "A sloppy org chart with one box at the top labeled 'CEO' and seventeen identical boxes below labeled 'Founding Engineer'.",
    "'ROADMAP Q1: ship MVP. Q2: ship MVP. Q3: ship MVP. Q4: raise Series B.'",
    "A four-quadrant matrix. Both axes say 'AGENTIC'. All four quadrants are circled.",
    "'WHY WE WIN: 1) team 2) speed 3) ???' — number 3 has been erased and rewritten as 'moat' six times.",
    "A pricing table. Tier names: 'Hobbyist', 'Pro', 'Enterprise', 'Call Us (Seriously)', 'You Can't Afford This'.",
    "A burndown chart that has been going up for nine sprints in a row. Someone has drawn a smiley face next to it.",
    "'POSITIONING: We're the Stripe of ____.' The blank has been filled in, erased, and rewritten 14 times. Current entry: 'Stripe'.",
    "Three columns: TODO / DOING / DONE. The DONE column is empty. The TODO column has one item: 'find PMF'.",
    "A diagram labeled 'The AI Stack'. It is just a single rectangle that says 'OpenAI' with our company logo glued on top of it.",
    "Big block letters: 'WE ARE NOT WRAPPERS.' Underneath, smaller: 'we are wrappers'.",
    "An eraser-smudged note: 'remember to delete this before the board meeting'. It was not deleted.",
    "A Venn diagram with two circles labeled 'AGI' and 'Revenue'. They do not overlap.",
    "A retro board: 😀 'shipped agent' / 😐 'agent shipped to prod without tests' / 😡 'agent shipped to prod credentials and emailed them to a customer'.",
  ],
  water: [
    "Bay water. Cold, gray, and somehow also has a $25 cover.",
    "Something flickers below the surface. Probably a Roomba.",
  ],
  boardwalk: [
    "Weathered planks. Someone has glued an NFC sticker to one.",
  ],
  sand: [
    "Damp pier sand. A discarded 'AI4ALL' lanyard.",
  ],
};

/* ─── Brad's pitch rotation ──────────────────────────────────────── */

/**
 * Brad wires you a flat $5,000 every single time you talk to him. The amount
 * never changes — it's just there, like a faucet. What rotates is the
 * "diligence" question he asks first and the unhinged response he gives as
 * the wire goes out. Pitch N (1-indexed) deterministically picks the Nth
 * entry in this list, wrapping around so he stays interesting forever.
 *
 *   - question: the satirical thing Brad asks before wiring
 *   - response: what he says as the money goes through
 */
export interface BradPitch {
  question: string;
  response: string;
}

/** Flat amount Brad wires every visit, in dollars. */
export const BRAD_PITCH_AMOUNT = 5_000;

export const BRAD_PITCHES: BradPitch[] = [
  {
    question: "What are you working on? Is it AI? It's AI, right? Tell me it's AI.",
    response:
      "Incredible. Wiring you $5K right now. Standard SAFE, $10M cap, 20% discount. Don't read it.",
  },
  {
    question: "Wait wait wait — quick one — are you AGENTIC? Like, properly agentic?",
    response:
      "STOP TALKING. Wiring another $5K. The thesis is intact. Don't make me read the deck.",
  },
  {
    question:
      "Okay, real diligence: do you have an MCP server? You don't even need to use it. Just have one.",
    response:
      "PERFECT. $5K outbound. I'm gonna tweet 'leaning into agentic infra' tonight regardless of your answer.",
  },
  {
    question: "Be honest with me. Is this a wrapper? It's a wrapper, isn't it? Is it a GOOD wrapper?",
    response:
      "Wrappers ARE the moat now. Marc said so on a podcast. $5K incoming.",
  },
  {
    question:
      "How many founding engineers have you poached from Anthropic? Be specific. I'll tell my LPs.",
    response:
      "Don't even answer. I'll round up. Wiring $5K and updating the LP letter.",
  },
  {
    question: "Quick — are you AGI-pilled, AGI-curious, or AGI-skeptical-but-vibes-aligned?",
    response:
      "All three?? UNREAL. $5K outbound. I'm flying to Dubai tonight to tell our anchor.",
  },
  {
    question:
      "Real talk: if you had to choose between revenue and a benchmark, which would it be? (Trick question. The answer is benchmark.)",
    response:
      "Beautiful. $5K wire on its way. We are going to be SO embarrassed about this in 18 months.",
  },
  {
    question:
      "Brad's eyes glaze over. He reads off his phone: 'What is your moat exactly… in two words.'",
    response:
      "He didn't hear your answer. The wire is already initiated. $5K confirmed.",
  },
  {
    question:
      "Brad's other LP joins the call. He doesn't say his name. He has an accent. He asks if you'd consider 'data partnerships.'",
    response:
      "Don't worry about the structure. Brad signs something. $5K arrives from an LLC registered in Delaware via Mauritius.",
  },
  {
    question:
      "Brad isn't here anymore. His Notion AI is taking the meeting. It opens with: 'GREAT pitch. Reflecting on what was said…'",
    response:
      "Notion AI wires you $5K. Memo line: 'definitely AI'. Brad will sign the docs whenever he gets back from Burning Man.",
  },
  {
    question:
      "Brad squints at you. 'Wait. Have I funded you before?' He scrolls his Carta. 'Doesn't matter. New round.'",
    response:
      "Bookkeeper flags it as a duplicate wire. Brad approves it as 'pro-rata, kind of'. $5K through.",
  },
  {
    question:
      "Brad: 'Quick gut-check — do your evals go up and to the right? Even if you don't have evals.'",
    response:
      "Brad nods at his own question. Doesn't wait for an answer. $5K outbound. The chart in his head is going up and to the right.",
  },
];

/** Pitches deterministically rotate through BRAD_PITCHES forever. */
export function bradPitchFor(pitchNumber: number): BradPitch {
  const idx = ((pitchNumber - 1) % BRAD_PITCHES.length + BRAD_PITCHES.length) %
    BRAD_PITCHES.length;
  return BRAD_PITCHES[idx];
}

/* ─── Welcome / system lines ─────────────────────────────────────── */

export const WELCOME_LINES: string[] = [
  "You stepped into the GenAI Builder Meetup at a co-working space in SoMa.",
  "The wifi password is 'agentic'. There are too many people for the room.",
  "Use WASD or arrow keys to walk. Press E or Space to talk to people.",
];

export const BLACKOUT_LINES: string[] = [
  "Your modelmon collapsed near the cold brew dispenser.",
  "Someone gave you a business card and called you a Waymo.",
  "Your agents continued to run while you were asleep. Half your credits are gone.",
];

export const NO_CREDITS_LINE =
  "Tokemonthropic: 'No credits, no heal. I can't keep doing this, I have a quarterly budget.'";

export const PIER_WELCOME_LINES: string[] = [
  "You stepped out onto Pier 67.",
  "Sea spray. Tourists. A man with eight kayaks. Something truck-shaped on a small island. From here it almost looks like a Mac mini.",
];

/* ─── Wild encounters & mythical NPCs ─────────────────────────────── */

/**
 * "Wild" / mythical NPCs used by the encounter system. They never appear on
 * the map directly — they're spawned into a battle when the player triggers
 * an encounter (e.g. paddling on water).
 *
 * Both creatures are FICTIONAL and flagged as such in the dex.
 */
export const WILD_NPCS: NPC[] = [
  {
    id: "wild-memoryno",
    name: "MemoryNo",
    blurb: "A glitchy stack of memory chips, allegedly not supposed to exist.",
    emoji: "▦",
    color: "#a78bfa",
    position: { x: -1, y: -1 },
    facing: "down",
    role: "battle",
    modelFullName: "memoryno",
    reward: 15,
    preBattle: [
      "ER̸R̷OR ─ unexpected ent̷ity in memory.",
      "MemoryN̸o flickers into existence. Your dex emits a faint hiss.",
    ],
    postWin: [
      "MemoryNo dissolves into 0xFF bytes.",
      "(Mythical added to your Modeldex as #154.)",
    ],
    postLoss: [
      "MemoryNo segfaults your save. You wake up on the dock.",
    ],
    afterDefeat: ["It blinks back into the water. Probably still there."],
  },
  {
    id: "wild-truck",
    name: "Mac Mini XL",
    blurb:
      "It looked like a truck from the boardwalk. Up close, it is, very clearly, a Mac mini the size of a truck.",
    emoji: "🖥",
    color: "#a8a29e",
    position: { x: -1, y: -1 },
    facing: "down",
    role: "battle",
    modelFullName: "project-truckanon",
    reward: 20,
    preBattle: [
      "The 'truck' hums to life. The hum is suspiciously quiet.",
      "A single white LED blinks on the front. There are no doors. There never were.",
      "It's a Mac mini. It's the size of a truck. Mac Mini XL would like to battle.",
    ],
    postWin: [
      "The Mac Mini XL goes to sleep. The LED dims. It does not power off.",
      "Somewhere in SoMa, Mac Mini Mike feels a single tear roll down his cheek.",
      "(Mythical added to your Modeldex as #155.)",
    ],
    postLoss: [
      "The Mac Mini XL didn't move. It didn't need to. Local inference, baby.",
    ],
    afterDefeat: [
      "The Mac Mini XL remains on the island. Still local. Still humming. Still not for sale.",
    ],
  },
];

/* ─── Scene definitions ──────────────────────────────────────────── */

/** Office co-working scene. Spawns at the entrance door. */
export const OFFICE_SCENE: Scene = {
  id: "office",
  title: "GenAI Builder Meetup",
  source: OFFICE_SRC,
  spawn: findCharIn(OFFICE_SRC, "d") ?? { x: 10, y: 14 },
  npcs: OFFICE_NPCS_LIST,
  exits: (() => {
    const out: Record<string, ReturnType<typeof xexit>> = {};
    const xpos = findCharIn(OFFICE_SRC, "X");
    if (xpos) {
      out[`${xpos.x},${xpos.y}`] = xexit("pier", { x: 1, y: 2 }, "right",
        "You stepped through the side door. Salt air hits you.");
    }
    return out;
  })(),
};

/** Pier 67 boardwalk + bay. Spawn comes in from the left (the 'd' tile). */
export const PIER_SCENE: Scene = {
  id: "pier",
  title: "Pier 67",
  source: PIER_SRC,
  spawn: findCharIn(PIER_SRC, "d") ?? { x: 0, y: 2 },
  npcs: PIER_NPCS,
  exits: (() => {
    const out: Record<string, ReturnType<typeof xexit>> = {};
    const dpos = findCharIn(PIER_SRC, "d");
    if (dpos) {
      // Stepping onto the entrance door tile takes you back into the office.
      out[`${dpos.x},${dpos.y}`] = xexit(
        "office",
        // Re-enter the office just inside the side-exit (one tile west of 'X').
        { x: 20, y: 7 },
        "left",
        "You're back inside the office."
      );
    }
    return out;
  })(),
  encounters: [
    {
      onTile: ["water"],
      chance: 0.06,
      npcId: "wild-memoryno",
      requiresKayak: true,
    },
  ],
};

/** Quick helper to keep scene definitions readable. */
function xexit(
  toScene: "office" | "pier",
  to: { x: number; y: number },
  facing: "up" | "down" | "left" | "right",
  banner: string
) {
  return { toScene, to, facing, banner };
}

export const SCENES: Record<"office" | "pier", Scene> = {
  office: OFFICE_SCENE,
  pier: PIER_SCENE,
};

/** Lookup that knows about wild NPCs too — used by the encounter system. */
export function findKnownNPC(id: string): NPC | undefined {
  for (const s of Object.values(SCENES)) {
    const found = s.npcs.find((n) => n.id === id);
    if (found) return found;
  }
  return WILD_NPCS.find((n) => n.id === id);
}
