import type { ReactNode } from "react";

/**
 * Pokemon-style "lab marks" for each AI lab.
 *
 * These are NOT exact reproductions of corporate logos. They are simplified,
 * Pokemodel-style emblems inspired by each lab's visual identity, drawn in
 * a single consistent style (single-color marks on a 64x64 viewBox) so the
 * Pokedex grid reads as one coherent series of trainer badges.
 */
export interface LabBranding {
  /** Display name */
  name: string;
  /** Primary brand color */
  color: string;
  /** Secondary color for gradients / accents */
  colorAlt: string;
  /** SVG mark — drawn in a 64x64 viewBox, monochrome, "currentColor" fill */
  mark: ReactNode;
}

/* eslint-disable react-refresh/only-export-components */
export const LAB_BRANDING: Record<string, LabBranding> = {
  OpenAI: {
    name: "OpenAI",
    color: "#10a37f",
    colorAlt: "#0d8c6c",
    mark: (
      // 6-petal knot inscribed in a hex (inspired by the OpenAI mark)
      <g fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round">
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
          const x = 32 + Math.cos(angle) * 14;
          const y = 32 + Math.sin(angle) * 14;
          return <circle key={i} cx={x} cy={y} r="9" />;
        })}
      </g>
    ),
  },

  Anthropic: {
    name: "Anthropic",
    color: "#d97757",
    colorAlt: "#b85a3a",
    mark: (
      // Three angular brushstrokes converging like a stylized "A"
      <g fill="currentColor">
        <path d="M22 50 L30 14 L34 14 L26 50 Z" />
        <path d="M42 50 L34 14 L38 14 L46 50 Z" />
        <rect x="29" y="36" width="14" height="4" />
      </g>
    ),
  },

  "Google DeepMind": {
    name: "Google DeepMind",
    color: "#4285f4",
    colorAlt: "#1a73e8",
    mark: (
      // Three concentric arcs (inspired by Gemini's wave / DeepMind ripples)
      <g fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round">
        <path d="M14 38 Q 32 18 50 38" />
        <path d="M20 44 Q 32 30 44 44" />
        <path d="M26 50 Q 32 44 38 50" />
      </g>
    ),
  },

  "Meta AI": {
    name: "Meta AI",
    color: "#1877f2",
    colorAlt: "#0c5cc4",
    mark: (
      // Sideways infinity loop (inspired by the Meta wordmark loop)
      <g fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 32 C 14 18, 30 18, 32 32 C 34 46, 50 46, 50 32 C 50 18, 34 18, 32 32 C 30 46, 14 46, 14 32 Z" />
      </g>
    ),
  },

  "Mistral AI": {
    name: "Mistral AI",
    color: "#fa520f",
    colorAlt: "#c43500",
    mark: (
      // Three stacked horizontal bars (inspired by the Mistral tricolor mark)
      <g fill="currentColor">
        <rect x="14" y="18" width="36" height="8" rx="1" />
        <rect x="14" y="30" width="36" height="8" rx="1" opacity="0.75" />
        <rect x="14" y="42" width="36" height="8" rx="1" opacity="0.5" />
      </g>
    ),
  },

  DeepSeek: {
    name: "DeepSeek",
    color: "#4d6bfe",
    colorAlt: "#2c4ad8",
    mark: (
      // Whale silhouette (inspired by the DeepSeek mark)
      <g fill="currentColor">
        <path d="M12 36 C 16 26, 28 22, 38 26 C 46 29, 52 34, 52 38 C 52 42, 46 46, 38 46 C 28 46, 16 44, 12 36 Z" />
        <path d="M48 28 L 56 20 L 54 32 Z" />
        <circle cx="20" cy="32" r="2.2" fill="#fff" />
      </g>
    ),
  },

  "Alibaba Qwen": {
    name: "Alibaba Qwen",
    color: "#615ced",
    colorAlt: "#3f3ab9",
    mark: (
      // A stylized "Q" — circle with a tail
      <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
        <circle cx="30" cy="32" r="14" />
        <path d="M38 40 L 50 52" />
      </g>
    ),
  },

  xAI: {
    name: "xAI",
    color: "#1d9bf0",
    colorAlt: "#0a7bc8",
    mark: (
      // Bold geometric X (inspired by the xAI mark)
      <g fill="currentColor">
        <path d="M14 14 L24 14 L50 50 L40 50 Z" />
        <path d="M40 14 L50 14 L24 50 L14 50 Z" />
      </g>
    ),
  },

  Cohere: {
    name: "Cohere",
    color: "#39c5bb",
    colorAlt: "#1f8a82",
    mark: (
      // Three stacked angled bars (inspired by Cohere's chevron mark)
      <g fill="currentColor">
        <path d="M14 22 L46 18 L46 26 L14 30 Z" />
        <path d="M14 32 L46 28 L46 36 L14 40 Z" opacity="0.75" />
        <path d="M14 42 L46 38 L46 46 L14 50 Z" opacity="0.5" />
      </g>
    ),
  },

  Microsoft: {
    name: "Microsoft",
    color: "#5fb4e6",
    colorAlt: "#3a8fc2",
    mark: (
      // 2x2 grid of squares (inspired by the Microsoft window)
      <g fill="currentColor">
        <rect x="14" y="14" width="16" height="16" />
        <rect x="34" y="14" width="16" height="16" opacity="0.85" />
        <rect x="14" y="34" width="16" height="16" opacity="0.85" />
        <rect x="34" y="34" width="16" height="16" opacity="0.7" />
      </g>
    ),
  },
};

export function getLabBranding(lab: string): LabBranding {
  return (
    LAB_BRANDING[lab] ?? {
      name: lab,
      color: "#64748b",
      colorAlt: "#475569",
      mark: (
        <g fill="currentColor">
          <circle cx="32" cy="32" r="18" />
        </g>
      ),
    }
  );
}
