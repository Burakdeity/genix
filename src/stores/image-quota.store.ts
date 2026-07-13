import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  billingDayKey,
  FREE_SIGNED_IN_IMAGE_LIMIT,
  GUEST_IMAGE_LIMIT,
  PRO_IMAGE_LIMIT,
} from "@/lib/billing/plans";

export {
  FREE_SIGNED_IN_IMAGE_LIMIT,
  GUEST_IMAGE_LIMIT,
  PRO_IMAGE_LIMIT,
} from "@/lib/billing/plans";

type DayUsage = { day: string; count: number };
type ProEntitlement = { expiresAt: number };

interface ImageQuotaState {
  guest: DayUsage;
  usedByAccountId: Record<string, DayUsage>;
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

function readCount(entry: DayUsage | undefined, day: string): number {
  if (!entry || entry.day !== day) return 0;
  return entry.count;
}

function hasActivePro(
  proByAccountId: Record<string, ProEntitlement>,
  accountId: string,
): boolean {
  const entitlement = proByAccountId[accountId];
  if (!entitlement) return false;
  return entitlement.expiresAt > Date.now();
}

function resolveLimit(
  proByAccountId: Record<string, ProEntitlement>,
  accountId: string | null,
): number {
  if (!accountId) return GUEST_IMAGE_LIMIT;
  if (hasActivePro(proByAccountId, accountId)) return PRO_IMAGE_LIMIT;
  return FREE_SIGNED_IN_IMAGE_LIMIT;
}

export const useImageQuotaStore = create<ImageQuotaState>()(
  persist(
    (set, get) => ({
      guest: { day: "", count: 0 },
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

      openProModal: () => set({ proModalOpen: true, loginModalOpen: false }),
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

      getLimit: (accountId) =>
        resolveLimit(get().proByAccountId, accountId),

      getRemaining: (accountId) => {
        const day = billingDayKey();
        const state = get();
        const limit = resolveLimit(state.proByAccountId, accountId);
        if (!accountId) {
          return Math.max(0, limit - readCount(state.guest, day));
        }
        return Math.max(
          0,
          limit - readCount(state.usedByAccountId[accountId], day),
        );
      },

      canGenerate: (accountId) => get().getRemaining(accountId) > 0,

      consume: (accountId) => {
        const day = billingDayKey();
        const limit = resolveLimit(get().proByAccountId, accountId);

        if (!accountId) {
          set((state) => ({
            guest: {
              day,
              count: Math.min(limit, readCount(state.guest, day) + 1),
            },
          }));
          return;
        }

        set((state) => ({
          usedByAccountId: {
            ...state.usedByAccountId,
            [accountId]: {
              day,
              count: Math.min(
                limit,
                readCount(state.usedByAccountId[accountId], day) + 1,
              ),
            },
          },
        }));
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

        const day = billingDayKey();
        set((prev) => ({
          awaitingLoginBonus: false,
          loginModalOpen: false,
          usedByAccountId: {
            ...prev.usedByAccountId,
            [accountId]: { day, count: 0 },
          },
        }));
        return true;
      },
    }),
    {
      name: "orwix-image-quota",
      skipHydration: true,
      version: 4,
      partialize: (state) => ({
        guest: state.guest,
        usedByAccountId: state.usedByAccountId,
        proByAccountId: state.proByAccountId,
        awaitingLoginBonus: state.awaitingLoginBonus,
      }),
      migrate: (persisted) => {
        const data = persisted as {
          guestUsed?: number;
          guest?: DayUsage;
          usedByAccountId?: Record<
            string,
            DayUsage | { period?: string; day?: string; count: number } | number
          >;
          proByAccountId?: Record<string, ProEntitlement>;
          awaitingLoginBonus?: boolean;
        };
        const day = billingDayKey();
        const nextUsage: Record<string, DayUsage> = {};
        for (const [id, value] of Object.entries(data.usedByAccountId ?? {})) {
          if (typeof value === "number") {
            nextUsage[id] = { day, count: 0 };
          } else if (value && typeof value === "object") {
            const entryDay =
              "day" in value && typeof value.day === "string"
                ? value.day
                : day;
            nextUsage[id] = {
              day: entryDay === day ? entryDay : day,
              count: entryDay === day ? value.count : 0,
            };
          }
        }

        return {
          guest: data.guest ?? { day, count: 0 },
          usedByAccountId: nextUsage,
          proByAccountId: data.proByAccountId ?? {},
          awaitingLoginBonus: data.awaitingLoginBonus ?? false,
        };
      },
    },
  ),
);
