import { create } from "zustand";
import { persist } from "zustand/middleware";

export const GUEST_IMAGE_LIMIT = 1;
export const FREE_SIGNED_IN_IMAGE_LIMIT = 5;

interface ImageQuotaState {
  guestUsed: number;
  usedByAccountId: Record<string, number>;
  proAccountIds: string[];
  proModalOpen: boolean;
  openProModal: () => void;
  closeProModal: () => void;
  isPro: (accountId: string | null) => boolean;
  getRemaining: (accountId: string | null) => number;
  canGenerate: (accountId: string | null) => boolean;
  consume: (accountId: string | null) => void;
  activatePro: (accountId: string) => void;
}

export const useImageQuotaStore = create<ImageQuotaState>()(
  persist(
    (set, get) => ({
      guestUsed: 0,
      usedByAccountId: {},
      proAccountIds: [],
      proModalOpen: false,

      openProModal: () => set({ proModalOpen: true }),
      closeProModal: () => set({ proModalOpen: false }),

      isPro: (accountId) => {
        if (!accountId) return false;
        return get().proAccountIds.includes(accountId);
      },

      getRemaining: (accountId) => {
        const state = get();
        if (accountId && state.proAccountIds.includes(accountId)) {
          return Number.POSITIVE_INFINITY;
        }
        if (!accountId) {
          return Math.max(0, GUEST_IMAGE_LIMIT - state.guestUsed);
        }
        const used = state.usedByAccountId[accountId] ?? 0;
        return Math.max(0, FREE_SIGNED_IN_IMAGE_LIMIT - used);
      },

      canGenerate: (accountId) => get().getRemaining(accountId) > 0,

      consume: (accountId) => {
        if (accountId && get().proAccountIds.includes(accountId)) {
          return;
        }

        if (!accountId) {
          set((state) => ({
            guestUsed: Math.min(GUEST_IMAGE_LIMIT, state.guestUsed + 1),
          }));
          return;
        }

        set((state) => {
          const used = state.usedByAccountId[accountId] ?? 0;
          return {
            usedByAccountId: {
              ...state.usedByAccountId,
              [accountId]: Math.min(FREE_SIGNED_IN_IMAGE_LIMIT, used + 1),
            },
          };
        });
      },

      activatePro: (accountId) => {
        set((state) => ({
          proAccountIds: state.proAccountIds.includes(accountId)
            ? state.proAccountIds
            : [...state.proAccountIds, accountId],
          proModalOpen: false,
        }));
      },
    }),
    {
      name: "orwix-image-quota",
      skipHydration: true,
      partialize: (state) => ({
        guestUsed: state.guestUsed,
        usedByAccountId: state.usedByAccountId,
        proAccountIds: state.proAccountIds,
      }),
    },
  ),
);
