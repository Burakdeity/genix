import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  DEFAULT_BACKGROUND_PRESET,
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
    },
  ),
);

export function applyBackgroundToDocument(preset: BackgroundPresetId) {
  document.documentElement.setAttribute("data-orwix-bg", preset);
}
