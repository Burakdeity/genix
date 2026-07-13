"use client";

import { useEffect, useRef } from "react";

import { useStoresHydrated } from "@/hooks/use-stores-hydrated";
import { useAuthStore } from "@/stores/auth.store";
import { useChatStore } from "@/stores/chat.store";
import {
  FREE_SIGNED_IN_IMAGE_LIMIT,
  useImageQuotaStore,
} from "@/stores/image-quota.store";

/**
 * When the user signs in after exhausting guest image quota,
 * grant the free signed-in allowance and notify in chat.
 */
export function ImageLoginBonusSync() {
  const hydrated = useStoresHydrated();
  const activeAccountId = useAuthStore((state) => state.activeAccountId);
  const prevAccountId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!hydrated) return;

    const previous = prevAccountId.current;
    prevAccountId.current = activeAccountId;

    // Skip the first hydrated snapshot so refresh doesn't re-grant
    if (previous === undefined) return;
    if (!activeAccountId || previous === activeAccountId) return;

    const quota = useImageQuotaStore.getState();
    if (!quota.awaitingLoginBonus) return;

    const granted = quota.claimLoginBonus(activeAccountId);
    if (!granted) return;

    const remaining = useImageQuotaStore
      .getState()
      .getRemaining(activeAccountId);

    useChatStore.getState().addMessage({
      id: crypto.randomUUID(),
      role: "assistant",
      content: `Giriş başarılı. Bu ay ${FREE_SIGNED_IN_IMAGE_LIMIT} görsel hakkı tanındı. Kalan hak: ${remaining}. Yeni bir görsel isteği yazabilirsin.`,
      createdAt: Date.now(),
    });
  }, [activeAccountId, hydrated]);

  return null;
}
