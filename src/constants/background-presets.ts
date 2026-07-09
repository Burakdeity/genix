export const BACKGROUND_PRESET_IDS = [
  "cosmic",
  "ocean",
  "ember",
  "forest",
  "rose",
  "midnight",
] as const;

export type BackgroundPresetId = (typeof BACKGROUND_PRESET_IDS)[number];

export const DEFAULT_BACKGROUND_PRESET: BackgroundPresetId = "cosmic";

export interface BackgroundPreset {
  id: BackgroundPresetId;
  label: string;
  swatch: string;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: "cosmic",
    label: "Kozmik",
    swatch: "linear-gradient(135deg, #7c3aed, #c026d3, #22d3ee)",
  },
  {
    id: "ocean",
    label: "Okyanus",
    swatch: "linear-gradient(135deg, #0369a1, #0ea5e9, #22d3ee)",
  },
  {
    id: "ember",
    label: "Ateş",
    swatch: "linear-gradient(135deg, #c2410c, #f97316, #fbbf24)",
  },
  {
    id: "forest",
    label: "Orman",
    swatch: "linear-gradient(135deg, #047857, #10b981, #34d399)",
  },
  {
    id: "rose",
    label: "Gül",
    swatch: "linear-gradient(135deg, #be185d, #ec4899, #f472b6)",
  },
  {
    id: "midnight",
    label: "Gece",
    swatch: "linear-gradient(135deg, #1e293b, #475569, #94a3b8)",
  },
];

export function isBackgroundPresetId(
  value: string,
): value is BackgroundPresetId {
  return BACKGROUND_PRESET_IDS.includes(value as BackgroundPresetId);
}
