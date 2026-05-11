# Tokemon — Gotta Burn 'Em All

> An unofficial, fan-made Pokedex for AI models. Browse, compare, and "evolve"
> through frontier LLMs from OpenAI, Anthropic, Google DeepMind, Meta, Mistral,
> DeepSeek, Alibaba (Qwen), xAI, Cohere, and Microsoft — then send them into a
> simulated battle and watch the token bill rack up in real time.

A static React + Vite + TypeScript + Tailwind app. No backend, no analytics,
no cookies — just a fun visualization of the modern model landscape. All
state lives in `localStorage` because we blew our database hosting budget
on AI credits. Source: <https://github.com/leejustin/tokemon>.

## Features

- **National Pokemodel Index** — 30+ AI models with sprite art (procedural SVG),
  Pokedex numbers, lab badges, and base stats.
- **Types** — Each model has 1–3 elemental types (Reasoning, Coding, Vision,
  Multimodal, Open-Source, Multilingual, Tool-Use, Speed, Frontier, Compact,
  Audio, Long-Context).
- **Base stats** — Pokemon-style HP/Attack/Defense/Sp.Atk/Sp.Def/Speed mapped
  to Context, Reasoning, Safety, Coding, Multilingual, and Tokens-per-second.
- **Evolution chains** — DeepSeek V2.5 → V3 → R1, GPT-4o-mini → 4o → 5,
  Claude Haiku → Sonnet → Opus, Llama 8B → 70B → 405B, Gemini Flash → Pro,
  Mistral Small → Large, Qwen 72B → QwQ, Grok 2 → Grok 3, Llama 4 Scout → Maverick.
- **Battle Compare** — Pick up to 4 models and view a side-by-side stat chart
  with the highest stat for each row crowned with a ★.
- **Adventure Mode** — Walk around a SF tech-meetup co-working space and
  Pier 67. Battle every trainer in the conference room (win or lose) to
  unlock the mythic Claude Mythos. Two more legendaries hide on the bay.
- **Filter & Search** — Filter by lab or type, search by name, sort by Dex
  number, name, lab, stat total, context length, or price.
- **Retro CRT vibes** — Animated scanlines, blinking LEDs, dot-grid background,
  Press Start 2P + Orbitron typography.

## Disclaimers

Tokemon is an unofficial fan project. _Pokemon_, _Pokedex_, and related marks
are trademarks of Nintendo / Game Freak / The Pokemon Company; this site is
not affiliated with or endorsed by them. Model names are trademarks of their
respective owners. Stats and prices are approximations curated for
entertainment and may be out of date or inaccurate. See the in-app
"Read full disclaimer" link for the full notice.

## Getting Started

```bash
npm install
npm run dev      # http://localhost:4201
npm run build    # outputs dist/
npm run preview  # preview production build
```

## Project Structure

```
src/
  data/
    models.ts     # The big dataset of all AI models
    typeMeta.ts   # Type colors and glyphs
    types.ts      # TypeScript interfaces
  components/
    ModelCard.tsx        # Small grid card
    ModelSprite.tsx      # Procedural SVG "sprite" for each model
    DexDetail.tsx        # The right-hand Pokedex screen
    EvolutionChain.tsx
    CompareModal.tsx
    StatBar.tsx
    TypeBadge.tsx
    Disclaimer.tsx
  App.tsx          # Layout + filters + state
  index.css        # Tailwind + Pokedex CRT styles
```

## Adding a New Model

Open `src/data/models.ts` and append a new entry to the `MODELS` array. To
create an evolution chain, give multiple models the same `evolutionChain`
slug and incrementing `evolutionStage` numbers (1, 2, 3).

```ts
{
  id: 31,
  name: "Your Model",
  fullName: "your-org/your-model",
  lab: "Your Org",
  species: "The Something Pokemodel",
  description: "A pokedex flavor entry that explains the model.",
  types: ["Reasoning", "Open-Source"],
  stats: { hp: 128, attack: 100, defense: 95, spAttack: 110, spDefense: 90, speed: 100 },
  abilities: ["Open Weights", "Tool Use"],
  released: "2025",
  params: "32B",
  context: "128K",
  modalities: ["text"],
  price: { input: 0.5, output: 1.5 },
  openWeights: true,
  availableOn: ["Fireworks", "Self-hosted"],
  accent: "#22d3ee",
}
```

## Deploying

This is a fully static SPA — drop the `dist/` folder onto any static host:

- **GitHub Pages (CI)** — On push to `main`, [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) runs `npm run build` and deploys `dist/`. One-time setup in the repo on GitHub:
  1. **Settings → Pages → Build and deployment → Source:** choose **GitHub Actions** (not “Deploy from a branch”).
  2. **Settings → Actions → General → Workflow permissions:** set **Read and write permissions** (required so the workflow can publish to Pages).
  After the first successful run, the site is at `https://<your-username>.github.io/<repo>/` (e.g. `…/tokemon/`). `vite.config.ts` reads `VITE_BASE_PATH` from the workflow so assets load under that path.
- **Custom domain** — Add a one-line file `public/CNAME` whose contents are your hostname (e.g. `tokemon.example.com`). In **Settings → Pages**, set the same **Custom domain** and follow GitHub’s DNS checks. Then edit the workflow: set `VITE_BASE_PATH` to `"/"` instead of `/<repo>/`, because the live site is served at the domain root.
- **Vercel / Netlify** — Connect the repo, build `npm run build`, publish `dist`. Use default base `/` (do not set `VITE_BASE_PATH` unless you use a subpath).
- **Cloudflare Pages** — Same as Vercel.
- **Local production** — `npm run preview` serves the build at `http://localhost:4173` with `base: "/"`.

## License

The code in this repo is MIT-licensed. The model data is curated from public
sources for educational/entertainment use. All trademarks and product names
remain the property of their respective owners.
