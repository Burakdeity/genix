import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  billingDayKey,
  FREE_VOICE_MINUTES,
  GUEST_VOICE_MINUTES,
  PRO_VOICE_MINUTES,
} from "@/lib/billing/plans";
import { useImageQuotaStore } from "@/stores/image-quota.store";

export {
  FREE_VOICE_MINUTES,
  GUEST_VOICE_MINUTES,
  PRO_VOICE_MINUTES,
} from "@/lib/billing/plans";

type DayUsage = { day: string; seconds: number };

interface VoiceQuotaState {
  guest: DayUsage;
  usedByAccountId: Record<string, DayUsage>;
  getLimitMinutes: (accountId: string | null) => number;
  getRemainingSeconds: (accountId: string | null) => number;
  canStart: (accountId: string | null) => boolean;
  consumeSeconds: (accountId: string | null, seconds: number) => void;
}

function readSeconds(entry: DayUsage | undefined, day: string): number {
  if (!entry || entry.day !== day) return 0;
  return entry.seconds;
}

function resolveLimitMinutes(accountId: string | null): number {
  if (!accountId) return GUEST_VOICE_MINUTES;
  if (useImageQuotaStore.getState().isPro(accountId)) return PRO_VOICE_MINUTES;
  return FREE_VOICE_MINUTES;
}

export const useVoiceQuotaStore = create<VoiceQuotaState>()(
  persist(
    (set, get) => ({
      guest: { day: "", seconds: 0 },
      usedByAccountId: {},

      getLimitMinutes: (accountId) => resolveLimitMinutes(accountId),

      getRemainingSeconds: (accountId) => {
        const day = billingDayKey();
        const limitSeconds = resolveLimitMinutes(accountId) * 60;
        const state = get();
        if (!accountId) {
          const used = readSeconds(state.guest, day);
          return Math.max(0, limitSeconds - used);
        }
        const used = readSeconds(state.usedByAccountId[accountId], day);
        return Math.max(0, limitSeconds - used);
      },

      canStart: (accountId) => get().getRemainingSeconds(accountId) > 0,

      consumeSeconds: (accountId, seconds) => {
        if (seconds <= 0) return;
        const day = billingDayKey();
        const add = Math.ceil(seconds);

        if (!accountId) {
          set((state) => {
            const used = readSeconds(state.guest, day);
            const limit = GUEST_VOICE_MINUTES * 60;
            return {
              guest: {
                day,
                seconds: Math.min(limit, used + add),
              },
            };
          });
          return;
        }

        const limit = resolveLimitMinutes(accountId) * 60;
        set((state) => {
          const used = readSeconds(state.usedByAccountId[accountId], day);
          return {
            usedByAccountId: {
              ...state.usedByAccountId,
              [accountId]: {
                day,
                seconds: Math.min(limit, used + add),
              },
            },
          };
        });
      },
    }),
    {
      name: "orwix-voice-quota",
      skipHydration: true,
      partialize: (state) => ({
        guest: state.guest,
        usedByAccountId: state.usedByAccountId,
      }),
    },
  ),
);
