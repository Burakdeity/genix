export const BACKGROUND_PRESET_IDS = [
  "cosmic",
  "ocean",
  "violet",
  "rose",
  "crimson",
  "ember",
  "forest",
] as const;

export type BackgroundPresetId = (typeof BACKGROUND_PRESET_IDS)[number];

export const DEFAULT_BACKGROUND_PRESET: BackgroundPresetId = "ocean";

export interface BackgroundPreset {
  id: BackgroundPresetId;
  label: string;
  swatch: string;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: "cosmic",
    label: "Turkuaz",
    swatch: "linear-gradient(135deg, #0d9488, #14b8a6, #22d3ee)",
  },
  {
    id: "ocean",
    label: "Mavi",
    swatch: "linear-gradient(135deg, #1d4ed8, #3b82f6, #38bdf8)",
  },
  {
    id: "violet",
    label: "Mor",
    swatch: "linear-gradient(135deg, #6d28d9, #a855f7, #e879f9)",
  },
  {
    id: "rose",
    label: "Pembe",
    swatch: "linear-gradient(135deg, #be185d, #ec4899, #f9a8d4)",
  },
  {
    id: "crimson",
    label: "Kırmızı",
    swatch: "linear-gradient(135deg, #b91c1c, #ef4444, #fb7185)",
  },
  {
    id: "ember",
    label: "Sarı",
    swatch: "linear-gradient(135deg, #d97706, #f59e0b, #fde047)",
  },
  {
    id: "forest",
    label: "Yeşil",
    swatch: "linear-gradient(135deg, #15803d, #22c55e, #86efac)",
  },
];

const LEGACY_PRESET_MAP: Record<string, BackgroundPresetId> = {
  midnight: "violet",
};

export function isBackgroundPresetId(
  value: string,
): value is BackgroundPresetId {
  return BACKGROUND_PRESET_IDS.includes(value as BackgroundPresetId);
}

export function resolveBackgroundPresetId(value: string): BackgroundPresetId {
  if (isBackgroundPresetId(value)) return value;
  return LEGACY_PRESET_MAP[value] ?? DEFAULT_BACKGROUND_PRESET;
}
