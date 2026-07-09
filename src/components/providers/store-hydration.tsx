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
import { applyThemeToDocument, useThemeStore } from "@/stores/theme.store";
import { useVoiceStore } from "@/stores/voice.store";

const persistApis = [
  useAuthStore.persist,
  useThemeStore.persist,
  useVoiceStore.persist,
] as const;

const StoresHydrationContext = createContext(false);

export function useStoresHydrated(): boolean {
  return useContext(StoresHydrationContext);
}

export function StoreHydration({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    let cancelled = false;

    function finish() {
      if (cancelled) return;
      applyThemeToDocument(useThemeStore.getState().theme);
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

  const value = useMemo(() => hydrated, [hydrated]);

  return (
    <StoresHydrationContext.Provider value={value}>
      {children}
    </StoresHydrationContext.Provider>
  );
}
