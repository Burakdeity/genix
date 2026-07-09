"use client";

import { useEffect, useState } from "react";

import {
  applyThemeToDocument,
  useThemeStore,
} from "@/stores/theme.store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((state) => state.theme);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const finish = () => {
      applyThemeToDocument(useThemeStore.getState().theme);
      setReady(true);
    };

    if (useThemeStore.persist.hasHydrated()) {
      finish();
      return;
    }

    return useThemeStore.persist.onFinishHydration(finish);
  }, []);

  useEffect(() => {
    if (!ready) return;
    applyThemeToDocument(theme);
  }, [theme, ready]);

  return <>{children}</>;
}
