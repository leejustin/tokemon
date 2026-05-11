import { useState } from "react";

/**
 * Small always-visible footer disclaimer. Sits above the existing footer row
 * so visitors see the key disclaimers without having to open the modal.
 *
 * Three short clauses, each one tap-targets a section of the full notice for
 * users who want more detail.
 */
export function FooterDisclaimer() {
  return (
    <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 pb-2">
      <div
        className="rounded-xl ring-1 ring-inset ring-white/10 bg-white/[0.03] p-3.5 text-xs text-ink-400 leading-relaxed"
      >
        <div className="flex items-start gap-2.5">
          <span aria-hidden className="text-base leading-none mt-0.5">
            ⚠
          </span>
          <div className="min-w-0">
            <span className="text-ink-200 font-semibold">
              Entertainment only.
            </span>{" "}
            Tokemon is a non-commercial fan project. Several creatures marked
            with the red <span className="text-rose-300">⚠ FICTIONAL</span>{" "}
            chip — including <em>Claude Mythos</em>, <em>Grok Colossus</em>,
            and <em>GPT-o∞ (preview)</em> — are{" "}
            <span className="text-rose-300">
              fan-invented satirical creatures
            </span>{" "}
            that no lab has ever released, announced, or hinted at.{" "}
            <span className="text-ink-200">
              We do not endorse, rank, or prefer any AI model, lab, or vendor
              over any other
            </span>
            ; the "winners" of these battles are creative fiction and reflect
            no real evaluation. All stats, prices, and lore are illustrative.
            Not financial, legal, or technical advice.{" "}
            <DisclaimerLink />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DisclaimerLink() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-ink-400 hover:text-ink-200 underline-offset-4 hover:underline transition-colors"
      >
        Legal & disclaimers
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-pop"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-2xl bg-canvas-panel border border-white/10 p-6 text-sm text-ink-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-pokered-400">
                  Legal Notice
                </div>
                <h3 className="font-display font-black text-lg text-white mt-0.5">
                  Disclaimers
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-2 py-1 text-xs rounded bg-white/[0.05] hover:bg-white/[0.1]"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-4 leading-7">
              <p>
                <strong className="text-white">Tokemon</strong> is an unofficial,
                non-commercial fan project created for entertainment and educational purposes.
                It is a parody tribute to the Pokedex format and is in no way affiliated with,
                endorsed by, or sponsored by Nintendo, Game Freak, Creatures Inc., or The
                Pokemon Company. All trademarks, service marks, trade names, and product names
                referenced (including but not limited to <em>Pokemon</em>, <em>Pokedex</em>,
                and <em>Pokeball</em>) are the property of their respective owners.
              </p>
              <p>
                <strong className="text-white">Some creatures in this Pokedex are explicitly
                fictional.</strong> Any entry marked with the red{" "}
                <span className="text-rose-300">⚠ FICTIONAL</span> chip — including but not
                limited to <em>Claude Mythos</em>, <em>Grok Colossus</em>, and{" "}
                <em>GPT-o∞ (preview)</em> — is a fan-invented satirical creation. Those
                creatures have not been released, announced, hinted at, or priced by any
                actual lab. Their stats, lore, prices, behaviors, and battle mechanics are
                pure entertainment fiction and should not be interpreted as a representation,
                rumor, or leak of any real product.
              </p>
              <p>
                <strong className="text-white">No bias, no endorsement, no ranking.</strong>{" "}
                We do not endorse, recommend, or prefer any AI model, lab, or vendor over any
                other. The battle "winners," type matchups, evolution chains, and stat
                totals are creative interpretations made for a fun visualization — they are
                not benchmarks, evaluations, or competitive claims. If your favorite model
                "loses" a battle here, it means nothing.
              </p>
              <p>
                <strong className="text-white">Entertainment only.</strong> This site is a
                toy. Nothing on it is intended as financial, legal, security, technical,
                purchasing, or career advice. Battle simulations and dollar-burn counters
                are dramatized for fun and do not reflect actual costs of using any model.
              </p>
              <p>
                The lab "emblems" displayed throughout the app are original, simplified
                geometric marks <em>inspired by</em> the visual identities of the AI labs they
                represent. They are not reproductions of those labs' actual logos, which remain
                trademarks of their respective owners (OpenAI, Anthropic, Google DeepMind,
                Meta, Mistral AI, DeepSeek, Alibaba, xAI, Cohere, Microsoft, etc.).
              </p>
              <p>
                Model names, descriptions, capabilities, prices, parameter counts, context
                windows, modalities, and benchmark-derived stats are presented for
                informational and entertainment purposes only. Numbers were collected from
                public sources at the time of writing and may be inaccurate, outdated, or
                simply <em>vibes-based approximations</em>. The ordering, "evolutions," and
                type classifications are creative interpretations and do not reflect official
                positioning by any AI lab.
              </p>
              <p>
                Pricing data is illustrative. Always consult the model provider's official
                pricing page before making purchasing or deployment decisions.
              </p>
              <p>
                The "Adventure Mode" tech-meetup scenario and its NPCs are{" "}
                <strong className="text-white">fictional satirical characters</strong> not
                modeled on any real person, company, or product. Resemblance to any actual
                trainer, vibecoder, salesperson, founder, or jaded engineer is coincidental.
              </p>
              <p>
                This site does not collect personal data. It is a static client-rendered page
                with no analytics, no tracking, no cookies, and no backend.
              </p>
              <p className="text-xs text-ink-500">
                If you are a rightsholder and would like a reference adjusted or removed,
                please open an issue on the project repository.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
