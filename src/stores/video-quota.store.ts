import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  billingDayKey,
  FREE_SIGNED_IN_VIDEO_LIMIT,
  GUEST_VIDEO_LIMIT,
  PRO_VIDEO_LIMIT,
} from "@/lib/billing/plans";
import {
  isUnlimitedAccountId,
  UNLIMITED_DAILY_QUOTA,
} from "@/lib/billing/unlimited-accounts";
import { useImageQuotaStore } from "@/stores/image-quota.store";

export {
  FREE_SIGNED_IN_VIDEO_LIMIT,
  GUEST_VIDEO_LIMIT,
  PRO_VIDEO_LIMIT,
} from "@/lib/billing/plans";

type DayUsage = { day: string; count: number };

interface VideoQuotaState {
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
  if (!accountId) return GUEST_VIDEO_LIMIT;
  if (isUnlimitedAccountId(accountId)) return UNLIMITED_DAILY_QUOTA;
  if (useImageQuotaStore.getState().isPro(accountId)) return PRO_VIDEO_LIMIT;
  return FREE_SIGNED_IN_VIDEO_LIMIT;
}

export const useVideoQuotaStore = create<VideoQuotaState>()(
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
      name: "orwix-video-quota",
      skipHydration: true,
      version: 3,
      partialize: (state) => ({
        guest: state.guest,
        usedByAccountId: state.usedByAccountId,
      }),
      migrate: (persisted) => {
        const data = persisted as {
          guestUsed?: number;
          guest?: DayUsage;
          usedByAccountId?: Record<
            string,
            DayUsage | { period?: string; day?: string; count: number } | number
          >;
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
        };
      },
    },
  ),
);
