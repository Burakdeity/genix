import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { VoiceProfileId } from "@/types/voice.types";

interface VoiceState {
  isOpen: boolean;
  profileId: VoiceProfileId;
  autoSpeak: boolean;
  open: () => void;
  close: () => void;
  setProfileId: (id: VoiceProfileId) => void;
  setAutoSpeak: (value: boolean) => void;
}

export const useVoiceStore = create<VoiceState>()(
  persist(
    (set) => ({
      isOpen: false,
      profileId: "juniper",
      autoSpeak: true,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setProfileId: (profileId) => set({ profileId }),
      setAutoSpeak: (autoSpeak) => set({ autoSpeak }),
    }),
    {
      name: "orwix-voice",
      skipHydration: true,
      partialize: (state) => ({
        profileId: state.profileId,
        autoSpeak: state.autoSpeak,
      }),
    },
  ),
);
