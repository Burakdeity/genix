"use client";

import { useEffect, useRef } from "react";

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
  const activeAccountId = useAuthStore((state) => state.activeAccountId);
  const prevAccountId = useRef<string | null>(null);

  useEffect(() => {
    const previous = prevAccountId.current;
    prevAccountId.current = activeAccountId;

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
      content: `Giriş başarılı. ${FREE_SIGNED_IN_IMAGE_LIMIT} görsel hakkı tanındı. Kalan hak: ${remaining}. Yeni bir görsel isteği yazabilirsin.`,
      createdAt: Date.now(),
    });
  }, [activeAccountId]);

  return null;
}
