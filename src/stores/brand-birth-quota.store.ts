import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  billingDayKey,
  FREE_BRAND_BIRTH_PER_DAY,
  GUEST_BRAND_BIRTH_PER_DAY,
  PRO_BRAND_BIRTH_PER_DAY,
} from "@/lib/billing/plans";
import {
  isUnlimitedAccountId,
  UNLIMITED_DAILY_QUOTA,
} from "@/lib/billing/unlimited-accounts";
import { useImageQuotaStore } from "@/stores/image-quota.store";

export {
  FREE_BRAND_BIRTH_PER_DAY,
  GUEST_BRAND_BIRTH_PER_DAY,
  PRO_BRAND_BIRTH_PER_DAY,
} from "@/lib/billing/plans";

type DayUsage = { day: string; count: number };

interface BrandBirthQuotaState {
  guest: DayUsage;
  usedByAccountId: Record<string, DayUsage>;
  getLimit: (accountId: string | null) => number;
  getRemaining: (accountId: string | null) => number;
  canGenerate: (accountId: string | null) => boolean;
  consume: (accountId: string | null) => void;
}

function readCount(entry: DayUsage | undefined, day: string): number {
  if (!entry || entry.day !== day) return 0;
  return entry.count;
}

function resolveLimit(accountId: string | null): number {
  if (!accountId) return GUEST_BRAND_BIRTH_PER_DAY;
  if (isUnlimitedAccountId(accountId)) return UNLIMITED_DAILY_QUOTA;
  if (useImageQuotaStore.getState().isPro(accountId)) {
    return PRO_BRAND_BIRTH_PER_DAY;
  }
  return FREE_BRAND_BIRTH_PER_DAY;
}

export const useBrandBirthQuotaStore = create<BrandBirthQuotaState>()(
  persist(
    (set, get) => ({
      guest: { day: "", count: 0 },
      usedByAccountId: {},

      getLimit: (accountId) => resolveLimit(accountId),

      getRemaining: (accountId) => {
        if (isUnlimitedAccountId(accountId)) return UNLIMITED_DAILY_QUOTA;
        const day = billingDayKey();
        const limit = resolveLimit(accountId);
        const state = get();
        if (!accountId) {
          return Math.max(0, limit - readCount(state.guest, day));
        }
        return Math.max(
          0,
          limit - readCount(state.usedByAccountId[accountId], day),
        );
      },

      canGenerate: (accountId) => {
        if (isUnlimitedAccountId(accountId)) return true;
        return get().getRemaining(accountId) > 0;
      },

      consume: (accountId) => {
        if (isUnlimitedAccountId(accountId)) return;
        const day = billingDayKey();
        const limit = resolveLimit(accountId);

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
    }),
    {
      name: "orwix-brand-birth-quota",
      skipHydration: true,
      partialize: (state) => ({
        guest: state.guest,
        usedByAccountId: state.usedByAccountId,
      }),
    },
  ),
);
