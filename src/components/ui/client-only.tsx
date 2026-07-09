"use client";

import { useStoresHydrated } from "@/hooks/use-stores-hydrated";

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const hydrated = useStoresHydrated();
  if (!hydrated) return <>{fallback}</>;
  return <>{children}</>;
}
