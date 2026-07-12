import { create } from "zustand";
import { persist } from "zustand/middleware";

export const GUEST_VIDEO_LIMIT = 1;
export const FREE_SIGNED_IN_VIDEO_LIMIT = 1;

interface VideoQuotaState {
  guestUsed: number;
  usedByAccountId: Record<string, number>;
  getRemaining: (accountId: string | null) => number;
  canGenerate: (accountId: string | null) => boolean;
  consume: (accountId: string | null) => void;
}

export const useVideoQuotaStore = create<VideoQuotaState>()(
  persist(
    (set, get) => ({
      guestUsed: 0,
      usedByAccountId: {},

      getRemaining: (accountId) => {
        const state = get();
        if (!accountId) {
          return Math.max(0, GUEST_VIDEO_LIMIT - state.guestUsed);
        }
        const used = state.usedByAccountId[accountId] ?? 0;
        return Math.max(0, FREE_SIGNED_IN_VIDEO_LIMIT - used);
      },

      canGenerate: (accountId) => get().getRemaining(accountId) > 0,

      consume: (accountId) => {
        if (!accountId) {
          set((state) => ({
            guestUsed: Math.min(GUEST_VIDEO_LIMIT, state.guestUsed + 1),
          }));
          return;
        }

        set((state) => {
          const used = state.usedByAccountId[accountId] ?? 0;
          return {
            usedByAccountId: {
              ...state.usedByAccountId,
              [accountId]: Math.min(FREE_SIGNED_IN_VIDEO_LIMIT, used + 1),
            },
          };
        });
      },
    }),
    {
      name: "orwix-video-quota",
      skipHydration: true,
      partialize: (state) => ({
        guestUsed: state.guestUsed,
        usedByAccountId: state.usedByAccountId,
      }),
    },
  ),
);
