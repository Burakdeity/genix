import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  billingMonthKey,
  FREE_SIGNED_IN_IMAGE_LIMIT,
  GUEST_IMAGE_LIMIT,
  PRO_IMAGE_LIMIT,
} from "@/lib/billing/plans";

export {
  FREE_SIGNED_IN_IMAGE_LIMIT,
  GUEST_IMAGE_LIMIT,
  PRO_IMAGE_LIMIT,
} from "@/lib/billing/plans";

type PeriodUsage = { period: string; count: number };
type ProEntitlement = { expiresAt: number };

interface ImageQuotaState {
  guestUsed: number;
  usedByAccountId: Record<string, PeriodUsage>;
  /** Paid Pro entitlements — unlocked only after Stripe confirmation */
  proByAccountId: Record<string, ProEntitlement>;
  loginModalOpen: boolean;
  proModalOpen: boolean;
  awaitingLoginBonus: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  dismissLoginModal: () => void;
  openProModal: () => void;
  closeProModal: () => void;
  isPro: (accountId: string | null) => boolean;
  getProExpiresAt: (accountId: string | null) => number | null;
  getLimit: (accountId: string | null) => number;
  getRemaining: (accountId: string | null) => number;
  canGenerate: (accountId: string | null) => boolean;
  consume: (accountId: string | null) => void;
  activatePro: (accountId: string, expiresAt: number) => void;
  claimLoginBonus: (accountId: string) => boolean;
}

function readUsage(
  entry: PeriodUsage | number | undefined,
  period: string,
): number {
  if (entry == null) return 0;
  if (typeof entry === "number") {
    return entry;
  }
  return entry.period === period ? entry.count : 0;
}

function hasActivePro(
  proByAccountId: Record<string, ProEntitlement>,
  accountId: string,
): boolean {
  const entitlement = proByAccountId[accountId];
  if (!entitlement) return false;
  return entitlement.expiresAt > Date.now();
}

export const useImageQuotaStore = create<ImageQuotaState>()(
  persist(
    (set, get) => ({
      guestUsed: 0,
      usedByAccountId: {},
      proByAccountId: {},
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
      dismissLoginModal: () =>
        set({ loginModalOpen: false, awaitingLoginBonus: false }),

      openProModal: () =>
        set({ proModalOpen: true, loginModalOpen: false }),
      closeProModal: () => set({ proModalOpen: false }),

      isPro: (accountId) => {
        if (!accountId) return false;
        return hasActivePro(get().proByAccountId, accountId);
      },

      getProExpiresAt: (accountId) => {
        if (!accountId) return null;
        const entitlement = get().proByAccountId[accountId];
        if (!entitlement || entitlement.expiresAt <= Date.now()) return null;
        return entitlement.expiresAt;
      },

      getLimit: (accountId) => {
        if (!accountId) return GUEST_IMAGE_LIMIT;
        if (hasActivePro(get().proByAccountId, accountId)) return PRO_IMAGE_LIMIT;
        return FREE_SIGNED_IN_IMAGE_LIMIT;
      },

      getRemaining: (accountId) => {
        const state = get();
        if (!accountId) {
          return Math.max(0, GUEST_IMAGE_LIMIT - state.guestUsed);
        }
        const period = billingMonthKey();
        const used = readUsage(state.usedByAccountId[accountId], period);
        const limit = hasActivePro(state.proByAccountId, accountId)
          ? PRO_IMAGE_LIMIT
          : FREE_SIGNED_IN_IMAGE_LIMIT;
        return Math.max(0, limit - used);
      },

      canGenerate: (accountId) => get().getRemaining(accountId) > 0,

      consume: (accountId) => {
        if (!accountId) {
          set((state) => ({
            guestUsed: Math.min(GUEST_IMAGE_LIMIT, state.guestUsed + 1),
          }));
          return;
        }

        const period = billingMonthKey();
        set((state) => {
          const used = readUsage(state.usedByAccountId[accountId], period);
          const limit = hasActivePro(state.proByAccountId, accountId)
            ? PRO_IMAGE_LIMIT
            : FREE_SIGNED_IN_IMAGE_LIMIT;
          return {
            usedByAccountId: {
              ...state.usedByAccountId,
              [accountId]: {
                period,
                count: Math.min(limit, used + 1),
              },
            },
          };
        });
      },

      activatePro: (accountId, expiresAt) => {
        if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return;
        set((state) => ({
          proByAccountId: {
            ...state.proByAccountId,
            [accountId]: { expiresAt },
          },
          proModalOpen: false,
          loginModalOpen: false,
        }));
      },

      claimLoginBonus: (accountId) => {
        const state = get();
        if (!state.awaitingLoginBonus) return false;
        if (hasActivePro(state.proByAccountId, accountId)) {
          set({
            awaitingLoginBonus: false,
            loginModalOpen: false,
          });
          return false;
        }

        const period = billingMonthKey();
        set((prev) => ({
          awaitingLoginBonus: false,
          loginModalOpen: false,
          usedByAccountId: {
            ...prev.usedByAccountId,
            [accountId]: { period, count: 0 },
          },
        }));
        return true;
      },
    }),
    {
      name: "orwix-image-quota",
      skipHydration: true,
      version: 3,
      partialize: (state) => ({
        guestUsed: state.guestUsed,
        usedByAccountId: state.usedByAccountId,
        proByAccountId: state.proByAccountId,
        awaitingLoginBonus: state.awaitingLoginBonus,
      }),
      migrate: (persisted) => {
        const data = persisted as {
          guestUsed?: number;
          usedByAccountId?: Record<string, PeriodUsage | number>;
          proAccountIds?: string[];
          proByAccountId?: Record<string, ProEntitlement>;
          awaitingLoginBonus?: boolean;
        };
        const period = billingMonthKey();
        const nextUsage: Record<string, PeriodUsage> = {};
        for (const [id, value] of Object.entries(data.usedByAccountId ?? {})) {
          if (typeof value === "number") {
            nextUsage[id] = { period, count: value };
          } else if (value && typeof value === "object") {
            nextUsage[id] = value;
          }
        }

        // Drop legacy free Pro unlocks — paid Stripe entitlement required.
        const proByAccountId: Record<string, ProEntitlement> = {
          ...(data.proByAccountId ?? {}),
        };

        return {
          guestUsed: data.guestUsed ?? 0,
          usedByAccountId: nextUsage,
          proByAccountId,
          awaitingLoginBonus: data.awaitingLoginBonus ?? false,
        };
      },
    },
  ),
);
