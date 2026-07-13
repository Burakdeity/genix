"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuthStore } from "@/stores/auth.store";
import {
  applyBackgroundToDocument,
  useBackgroundStore,
} from "@/stores/background.store";
import { useChatStore } from "@/stores/chat.store";
import { useImageQuotaStore } from "@/stores/image-quota.store";
import { useVideoQuotaStore } from "@/stores/video-quota.store";
import { useVoiceQuotaStore } from "@/stores/voice-quota.store";
import { applyThemeToDocument, useThemeStore } from "@/stores/theme.store";
import { useVoiceStore } from "@/stores/voice.store";
import { ChatAccountSync } from "@/components/chat/chat-account-sync";

const persistApis = [
  useAuthStore.persist,
  useThemeStore.persist,
  useBackgroundStore.persist,
  useVoiceStore.persist,
  useChatStore.persist,
  useImageQuotaStore.persist,
  useVideoQuotaStore.persist,
  useVoiceQuotaStore.persist,
] as const;

const StoresHydrationContext = createContext(false);

export function useStoresHydrated(): boolean {
  return useContext(StoresHydrationContext);
}

export function StoreHydration({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const theme = useThemeStore((state) => state.theme);
  const backgroundPreset = useBackgroundStore((state) => state.preset);

  useEffect(() => {
    let cancelled = false;

    function finish() {
      if (cancelled) return;
      applyThemeToDocument(useThemeStore.getState().theme);
      applyBackgroundToDocument(useBackgroundStore.getState().preset);
      setHydrated(true);
    }

    const pending = persistApis.filter((api) => !api.hasHydrated());

    if (pending.length === 0) {
      finish();
      return () => {
        cancelled = true;
      };
    }

    const unsubscribers = pending.map((api) =>
      api.onFinishHydration(() => {
        if (persistApis.every((item) => item.hasHydrated())) {
          finish();
        }
      }),
    );

    for (const api of persistApis) {
      void api.rehydrate();
    }

    return () => {
      cancelled = true;
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    applyThemeToDocument(theme);
  }, [hydrated, theme]);

  useEffect(() => {
    if (!hydrated) return;
    applyBackgroundToDocument(backgroundPreset);
  }, [hydrated, backgroundPreset]);

  const value = useMemo(() => hydrated, [hydrated]);

  return (
    <StoresHydrationContext.Provider value={value}>
      <ChatAccountSync hydrated={hydrated} />
      {children}
    </StoresHydrationContext.Provider>
  );
}
