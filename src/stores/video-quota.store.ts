import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  billingMonthKey,
  FREE_SIGNED_IN_VIDEO_LIMIT,
  GUEST_VIDEO_LIMIT,
  PRO_VIDEO_LIMIT,
} from "@/lib/billing/plans";
import { useImageQuotaStore } from "@/stores/image-quota.store";

export {
  FREE_SIGNED_IN_VIDEO_LIMIT,
  GUEST_VIDEO_LIMIT,
  PRO_VIDEO_LIMIT,
} from "@/lib/billing/plans";

type PeriodUsage = { period: string; count: number };

interface VideoQuotaState {
  guestUsed: number;
  usedByAccountId: Record<string, PeriodUsage>;
  getLimit: (accountId: string | null) => number;
  getRemaining: (accountId: string | null) => number;
  canGenerate: (accountId: string | null) => boolean;
  consume: (accountId: string | null) => void;
}

function readUsage(
  entry: PeriodUsage | number | undefined,
  period: string,
): number {
  if (entry == null) return 0;
  if (typeof entry === "number") return entry;
  return entry.period === period ? entry.count : 0;
}

function resolveLimit(accountId: string | null): number {
  if (!accountId) return GUEST_VIDEO_LIMIT;
  if (useImageQuotaStore.getState().isPro(accountId)) return PRO_VIDEO_LIMIT;
  return FREE_SIGNED_IN_VIDEO_LIMIT;
}

export const useVideoQuotaStore = create<VideoQuotaState>()(
  persist(
    (set, get) => ({
      guestUsed: 0,
      usedByAccountId: {},

      getLimit: (accountId) => resolveLimit(accountId),

      getRemaining: (accountId) => {
        const state = get();
        if (!accountId) {
          return Math.max(0, GUEST_VIDEO_LIMIT - state.guestUsed);
        }
        const period = billingMonthKey();
        const used = readUsage(state.usedByAccountId[accountId], period);
        return Math.max(0, resolveLimit(accountId) - used);
      },

      canGenerate: (accountId) => get().getRemaining(accountId) > 0,

      consume: (accountId) => {
        if (!accountId) {
          set((state) => ({
            guestUsed: Math.min(GUEST_VIDEO_LIMIT, state.guestUsed + 1),
          }));
          return;
        }

        const period = billingMonthKey();
        const limit = resolveLimit(accountId);
        set((state) => {
          const used = readUsage(state.usedByAccountId[accountId], period);
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
    }),
    {
      name: "orwix-video-quota",
      skipHydration: true,
      version: 2,
      partialize: (state) => ({
        guestUsed: state.guestUsed,
        usedByAccountId: state.usedByAccountId,
      }),
      migrate: (persisted) => {
        const data = persisted as {
          guestUsed?: number;
          usedByAccountId?: Record<string, PeriodUsage | number>;
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
        return {
          guestUsed: data.guestUsed ?? 0,
          usedByAccountId: nextUsage,
        };
      },
    },
  ),
);
