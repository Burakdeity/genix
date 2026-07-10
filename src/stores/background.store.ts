import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  DEFAULT_BACKGROUND_PRESET,
  resolveBackgroundPresetId,
  type BackgroundPresetId,
} from "@/constants/background-presets";

interface BackgroundState {
  preset: BackgroundPresetId;
  setPreset: (preset: BackgroundPresetId) => void;
}

export const useBackgroundStore = create<BackgroundState>()(
  persist(
    (set) => ({
      preset: DEFAULT_BACKGROUND_PRESET,

      setPreset: (preset) => set({ preset }),
    }),
    {
      name: "orwix-background",
      skipHydration: true,
      partialize: (state) => ({ preset: state.preset }),
      merge: (persisted, current) => {
        const raw =
          persisted &&
          typeof persisted === "object" &&
          "preset" in persisted &&
          typeof (persisted as { preset?: unknown }).preset === "string"
            ? (persisted as { preset: string }).preset
            : current.preset;

        return {
          ...current,
          ...((persisted as object) ?? {}),
          preset: resolveBackgroundPresetId(raw),
        };
      },
    },
  ),
);

export function applyBackgroundToDocument(preset: BackgroundPresetId) {
  document.documentElement.setAttribute(
    "data-orwix-bg",
    resolveBackgroundPresetId(preset),
  );
}
