import { create } from "zustand";
import { persist } from "zustand/middleware";

export const GUEST_IMAGE_LIMIT = 1;
export const FREE_SIGNED_IN_IMAGE_LIMIT = 5;

interface ImageQuotaState {
  guestUsed: number;
  usedByAccountId: Record<string, number>;
  proAccountIds: string[];
  /** Shown when guest quota is exhausted — ask user to sign in */
  loginModalOpen: boolean;
  proModalOpen: boolean;
  /** After guest limit: grant fresh signed-in credits on next login */
  awaitingLoginBonus: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openProModal: () => void;
  closeProModal: () => void;
  isPro: (accountId: string | null) => boolean;
  getRemaining: (accountId: string | null) => number;
  canGenerate: (accountId: string | null) => boolean;
  consume: (accountId: string | null) => void;
  activatePro: (accountId: string) => void;
  /**
   * Call after sign-in when guest quota was exhausted.
   * Ensures the account has a full free signed-in allowance (5).
   * Returns true if bonus was applied.
   */
  claimLoginBonus: (accountId: string) => boolean;
}

export const useImageQuotaStore = create<ImageQuotaState>()(
  persist(
    (set, get) => ({
      guestUsed: 0,
      usedByAccountId: {},
      proAccountIds: [],
      loginModalOpen: false,
      proModalOpen: false,
      awaitingLoginBonus: false,

      openLoginModal: () =>
        set({
          loginModalOpen: true,
          proModalOpen: false,
          awaitingLoginBonus: true,
        }),
      closeLoginModal: () => set({ loginModalOpen: false }),

      openProModal: () =>
        set({ proModalOpen: true, loginModalOpen: false }),
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
          loginModalOpen: false,
        }));
      },

      claimLoginBonus: (accountId) => {
        const state = get();
        if (!state.awaitingLoginBonus) return false;
        if (state.proAccountIds.includes(accountId)) {
          set({
            awaitingLoginBonus: false,
            loginModalOpen: false,
          });
          return false;
        }

        // Fresh free signed-in allowance after guest limit
        set((prev) => ({
          awaitingLoginBonus: false,
          loginModalOpen: false,
          usedByAccountId: {
            ...prev.usedByAccountId,
            [accountId]: 0,
          },
        }));
        return true;
      },
    }),
    {
      name: "orwix-image-quota",
      skipHydration: true,
      partialize: (state) => ({
        guestUsed: state.guestUsed,
        usedByAccountId: state.usedByAccountId,
        proAccountIds: state.proAccountIds,
        awaitingLoginBonus: state.awaitingLoginBonus,
      }),
    },
  ),
);
