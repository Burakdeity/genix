import { create } from "zustand";
import { persist } from "zustand/middleware";

import { primeVoiceAudio } from "@/lib/voice/audio-utils";
import { useAuthStore } from "@/stores/auth.store";
import { useImageQuotaStore } from "@/stores/image-quota.store";
import { useVoiceQuotaStore } from "@/stores/voice-quota.store";
import type { VoiceProfileId } from "@/types/voice.types";

interface VoiceState {
  isOpen: boolean;
  profileId: VoiceProfileId;
  autoSpeak: boolean;
  open: () => void;
  /** Prime mic + AudioContext during the user gesture, then open. */
  openLive: () => Promise<void>;
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
      openLive: async () => {
        const accountId = useAuthStore.getState().activeAccountId;
        const voiceQuota = useVoiceQuotaStore.getState();
        if (!voiceQuota.canStart(accountId)) {
          if (!accountId) {
            useImageQuotaStore.getState().openLoginModal();
          } else {
            useImageQuotaStore.getState().openProModal();
          }
          return;
        }

        try {
          await primeVoiceAudio();
        } catch {
          // Panel will still open; connect() surfaces mic permission errors.
        }
        set({ isOpen: true });
      },
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
