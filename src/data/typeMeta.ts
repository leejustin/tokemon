import type { ModelType } from "./types";

export interface TypeMeta {
  label: string;
  /** tailwind background color class */
  bg: string;
  /** tailwind text color class */
  text: string;
  /** tailwind ring color class */
  ring: string;
  /** raw hex for SVGs / accents */
  hex: string;
  /** A short emoji-free symbol used as a glyph */
  glyph: string;
}

export const TYPE_META: Record<ModelType, TypeMeta> = {
  Reasoning: {
    label: "Reasoning",
    bg: "bg-purple-600",
    text: "text-purple-100",
    ring: "ring-purple-400",
    hex: "#9333ea",
    glyph: "Ψ",
  },
  Coding: {
    label: "Coding",
    bg: "bg-emerald-600",
    text: "text-emerald-100",
    ring: "ring-emerald-400",
    hex: "#059669",
    glyph: "λ",
  },
  Vision: {
    label: "Vision",
    bg: "bg-sky-600",
    text: "text-sky-100",
    ring: "ring-sky-400",
    hex: "#0284c7",
    glyph: "◉",
  },
  Multimodal: {
    label: "Multimodal",
    bg: "bg-indigo-600",
    text: "text-indigo-100",
    ring: "ring-indigo-400",
    hex: "#4f46e5",
    glyph: "✦",
  },
  "Open-Source": {
    label: "Open-Source",
    bg: "bg-lime-600",
    text: "text-lime-50",
    ring: "ring-lime-400",
    hex: "#65a30d",
    glyph: "ʘ",
  },
  Multilingual: {
    label: "Multilingual",
    bg: "bg-amber-600",
    text: "text-amber-50",
    ring: "ring-amber-400",
    hex: "#d97706",
    glyph: "亜",
  },
  "Tool-Use": {
    label: "Tool-Use",
    bg: "bg-cyan-600",
    text: "text-cyan-50",
    ring: "ring-cyan-400",
    hex: "#0891b2",
    glyph: "⚙",
  },
  Speed: {
    label: "Speed",
    bg: "bg-yellow-500",
    text: "text-yellow-950",
    ring: "ring-yellow-300",
    hex: "#eab308",
    glyph: "⚡",
  },
  Frontier: {
    label: "Frontier",
    bg: "bg-rose-600",
    text: "text-rose-50",
    ring: "ring-rose-400",
    hex: "#e11d48",
    glyph: "★",
  },
  Compact: {
    label: "Compact",
    bg: "bg-teal-600",
    text: "text-teal-50",
    ring: "ring-teal-400",
    hex: "#0d9488",
    glyph: "◇",
  },
  Audio: {
    label: "Audio",
    bg: "bg-fuchsia-600",
    text: "text-fuchsia-50",
    ring: "ring-fuchsia-400",
    hex: "#c026d3",
    glyph: "♪",
  },
  "Long-Context": {
    label: "Long-Context",
    bg: "bg-blue-600",
    text: "text-blue-50",
    ring: "ring-blue-400",
    hex: "#2563eb",
    glyph: "∞",
  },
};
