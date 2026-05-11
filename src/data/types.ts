export type ModelType =
  | "Reasoning"
  | "Coding"
  | "Vision"
  | "Multimodal"
  | "Open-Source"
  | "Multilingual"
  | "Tool-Use"
  | "Speed"
  | "Frontier"
  | "Compact"
  | "Audio"
  | "Long-Context";

export interface ModelStats {
  /** Context window in tokens */
  hp: number;
  /** Reasoning power (general intelligence benchmarks) */
  attack: number;
  /** Safety / alignment / refusal robustness */
  defense: number;
  /** Coding strength */
  spAttack: number;
  /** Multilingual / world knowledge */
  spDefense: number;
  /** Tokens-per-second / latency profile */
  speed: number;
}

export interface PriceInfo {
  /** USD per 1M input tokens */
  input?: number;
  /** USD per 1M output tokens */
  output?: number;
  /** "open-weights" if free to self-host */
  note?: string;
}

export interface AIModel {
  /** Pokedex number, 3-digit padded display */
  id: number;
  /** "Pokemon" name */
  name: string;
  /** Real model name */
  fullName: string;
  /** Lab / vendor */
  lab: string;
  /** Short flavor description (Pokedex entry) */
  description: string;
  /** Model "species" tagline */
  species: string;
  /** Types (1-2) */
  types: ModelType[];
  /** Battle-style stats */
  stats: ModelStats;
  /** Special abilities */
  abilities: string[];
  /** Released year/month-ish */
  released: string;
  /** Parameters (e.g. "70B", "MoE 671B (37B active)", "Unknown") */
  params: string;
  /** Context window human-readable */
  context: string;
  /** Modalities */
  modalities: string[];
  /** Price info */
  price: PriceInfo;
  /** Evolution chain id (models in the same chain share this) */
  evolutionChain?: string;
  /** Stage in chain (1 = base, 2, 3) */
  evolutionStage?: number;
  /** Open-source weights? */
  openWeights: boolean;
  /** Where you can use it (api / open-source platform) */
  availableOn: string[];
  /** A pokeball-style accent color (hex) */
  accent: string;
  /** Sources for the trainer's reference */
  sources?: string[];
  /** Fan-invented creature (not a real, announced, or shipped product).
   *  Renders a prominent "FICTIONAL" chip everywhere the model is shown. */
  fictional?: boolean;
  /** Longer disclaimer shown on hover / under the FICTIONAL chip.
   *  Defaults to a generic notice if omitted. */
  fictionalNote?: string;
}
