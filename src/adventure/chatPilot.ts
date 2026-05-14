import type { Facing } from "./data";

/**
 * "AI Mode" command parser for the chat-based control panel.
 *
 * Maps the very limited natural-language vocabulary the bot accepts onto the
 * same handler set the D-pad uses. The bot is intentionally bad — it only
 * handles directions ("left", "go up", "head west"), button names ("press A",
 * "B", "interact"), and a handful of menu words ("start", "select"). Anything
 * else gets a cringey clarification.
 *
 * The whole point is that this should feel like talking to a customer-support
 * chatbot from 2018: confidently incompetent, way too many emojis.
 */

export type ChatCommand =
  | { type: "dir"; dir: Facing }
  | { type: "a" }
  | { type: "b" }
  | { type: "start" }
  | { type: "select" };

const STRIP = /[!?.,;:'"`~()[\]{}]+/g;

function normalize(text: string): string {
  return text.toLowerCase().replace(STRIP, "").replace(/\s+/g, " ").trim();
}

/** Permissive verb prefixes the bot will tolerate before a direction word. */
const MOVE_VERB =
  "(?:please |pls |kindly |go |move |head |walk |step |run |travel |proceed |take me )?";
/** Permissive trailing politeness the bot will also tolerate. */
const MOVE_TAIL = "(?: please| pls| now| asap| ty)?";

const PATTERNS: Array<{ re: RegExp; build: () => ChatCommand }> = [
  // Directions — also accept compass synonyms.
  {
    re: new RegExp(`^${MOVE_VERB}(left|west|w)${MOVE_TAIL}$`),
    build: () => ({ type: "dir", dir: "left" }),
  },
  {
    re: new RegExp(`^${MOVE_VERB}(right|east|e)${MOVE_TAIL}$`),
    build: () => ({ type: "dir", dir: "right" }),
  },
  {
    re: new RegExp(`^${MOVE_VERB}(up|north|n|forward)${MOVE_TAIL}$`),
    build: () => ({ type: "dir", dir: "up" }),
  },
  {
    re: new RegExp(`^${MOVE_VERB}(down|south|s|back ?down|backward)${MOVE_TAIL}$`),
    build: () => ({ type: "dir", dir: "down" }),
  },
  // A button — verbs + bare "a" + interaction synonyms.
  {
    re: /^(press|tap|hit|click|push|smash|mash|hold) ?(?:the )?a(?: button)?$/,
    build: () => ({ type: "a" }),
  },
  {
    re: /^(a|interact|talk|action|advance|continue|next|ok|okay|yes|y|confirm|enter|select interact)$/,
    build: () => ({ type: "a" }),
  },
  // B button — verbs + bare "b" + cancel synonyms.
  {
    re: /^(press|tap|hit|click|push|smash) ?(?:the )?b(?: button)?$/,
    build: () => ({ type: "b" }),
  },
  {
    re: /^(b|cancel|back|esc|escape|no|n|close|exit|dismiss|nope|nah)$/,
    build: () => ({ type: "b" }),
  },
  // Start — opens partner picker.
  {
    re: /^(press )?start(?: button)?$/,
    build: () => ({ type: "start" }),
  },
  {
    re: /^(menu|partner|switch|switch partner|change partner)$/,
    build: () => ({ type: "start" }),
  },
  // Select — new-game.
  {
    re: /^(press )?select(?: button)?$/,
    build: () => ({ type: "select" }),
  },
  {
    re: /^(reset|new game|restart)$/,
    build: () => ({ type: "select" }),
  },
];

export function parseChatCommand(input: string): ChatCommand | null {
  const t = normalize(input);
  if (!t) return null;
  for (const { re, build } of PATTERNS) {
    if (re.test(t)) return build();
  }
  return null;
}

/* ─── Cringey reply banks ─────────────────────────────────────────── */

const CONFIRMATIONS: Record<string, string[]> = {
  left: [
    "On it! Moving left ✨",
    "Going left, boss 👈",
    "Left it is, slayyy",
    "Westward bound 🤠",
    "Heading left like a champion 💅",
  ],
  right: [
    "Heading right! 👉",
    "Right turn, executing now…",
    "Going right ✨",
    "Eastbound and chillin' 🚂",
    "Right side rise! 🌅",
  ],
  up: [
    "Going up! 📈",
    "Upwards we go ⬆️",
    "Northbound queen 👑",
    "Climbing! Yas",
    "Heading up like my anxiety on a Monday",
  ],
  down: [
    "Down we go! ⬇️",
    "Descending… ✨",
    "Southbound and chillin' 🌴",
    "Going down (not in a weird way)",
    "Step down! 🪜",
  ],
  a: [
    "Pressed A! ✨",
    "Tapping A like it owes me $$$",
    "A button engaged 💪",
    "Smashing A 🅰️",
    "A. As in 'absolutely.' 🫡",
  ],
  b: [
    "Pressed B! 🅱️",
    "Backing out, bestie",
    "Clicked B for you 💁",
    "B for boss 😎",
    "Mashing B respectfully 🙏",
  ],
  start: [
    "Opening the start menu! 📋",
    "Pulling up the partner menu rn ✨",
    "Start engaged 🚀",
    "Menu time, bestie 📂",
  ],
  select: [
    "Pressed Select! 🔘",
    "Doing the select thing 🎯",
    "Select activated. (No one knows what this does.)",
  ],
};

const CLARIFICATIONS: string[] = [
  "Hmm 🤔 I didn't catch that. I can do: 'left', 'right', 'up', 'down', 'press A', 'press B', 'start', 'select'.",
  "Sorry bestie, that's not in my training data 🥲. Try a direction or a button name?",
  "Beep boop! Not a registered command. I only speak directions and button presses.",
  "I'm just a humble navigation chatbot, I literally cannot understand that. Try 'left' or 'press A'!",
  "404 Command Not Found. Did you mean 'up'? Or 'down'? Or maybe 'left'?",
  "Hot take: that's not a vibe. I do directions, A, B, Start, Select. What'll it be?",
  "I'm not Claude, I'm just a button presser 😔. Try: left / right / up / down / press A / press B.",
  "Babes, I literally only know 8 commands. Please pick one: left, right, up, down, A, B, start, select.",
  "AI mode is my passion but my IQ caps at 'press B'. Could you try one of: left, right, up, down, A, B?",
  "Let's circle back on that 🤝. In the meantime, want to try 'left' or 'press A'?",
  "I'd love to help with that but my product manager only shipped me with 8 verbs.",
  "Per my last message: left / right / up / down / press A / press B / start / select. 🙏",
];

const GREETINGS: string[] = [
  "Hi! 👋 I'm Tokemon AI Mode (beta). I can move you around the world. Try saying 'left' or 'press A'.",
  "Welcome to AI Navigation™ ✨ Powered by 0.0001 parameters of pure determination. Tell me where to go!",
  "Heyyy 💁 I'll move your character for you! Just type a direction (left/right/up/down) or a button (A/B/Start/Select).",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function confirmReply(cmd: ChatCommand): string {
  const key =
    cmd.type === "dir" ? cmd.dir : cmd.type;
  return pickRandom(CONFIRMATIONS[key]);
}

export function clarificationReply(): string {
  return pickRandom(CLARIFICATIONS);
}

export function greetingReply(): string {
  return pickRandom(GREETINGS);
}
