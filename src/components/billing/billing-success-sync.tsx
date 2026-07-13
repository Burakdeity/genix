"use client";

import { useEffect, useRef, useState } from "react";

import { confirmProCheckoutSession } from "@/lib/api/billing-client";
import { useStoresHydrated } from "@/hooks/use-stores-hydrated";
import { useImageQuotaStore } from "@/stores/image-quota.store";

/**
 * After Stripe Checkout redirect (?billing=success&session_id=...),
 * verify payment server-side and unlock Pro for the account.
 */
export function BillingSuccessSync() {
  const [notice, setNotice] = useState<string | null>(null);
  const handledRef = useRef<string | null>(null);
  const hydrated = useStoresHydrated();
  const activatePro = useImageQuotaStore((state) => state.activatePro);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const billing = params.get("billing");
    const sessionId = params.get("session_id");

    const clearBillingParams = () => {
      const nextParams = new URLSearchParams(window.location.search);
      nextParams.delete("billing");
      nextParams.delete("session_id");
      const next = `${window.location.pathname}${nextParams.toString() ? `?${nextParams}` : ""}${window.location.hash}`;
      window.history.replaceState({}, "", next);
    };

    if (billing === "cancel") {
      setNotice(
        "Ödeme iptal edildi. İstediğiniz zaman Planlar’dan tekrar deneyebilirsiniz.",
      );
      clearBillingParams();
      return;
    }

    if (billing !== "success" || !sessionId) return;
    if (handledRef.current === sessionId) return;
    handledRef.current = sessionId;

    let cancelled = false;

    void (async () => {
      try {
        const result = await confirmProCheckoutSession(sessionId);
        if (cancelled) return;
        activatePro(result.accountId, result.expiresAt);
        setNotice("Ödeme alındı — Orwix Pro aktif.");
        clearBillingParams();
      } catch (error) {
        if (cancelled) return;
        // Allow a remount retry if confirmation failed.
        handledRef.current = null;
        setNotice(
          error instanceof Error
            ? error.message
            : "Ödeme doğrulanamadı. Lütfen tekrar deneyin veya destek alın.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activatePro, hydrated]);

  if (!notice) return null;

  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-[350] w-[min(24rem,calc(100vw-1.5rem))] -translate-x-1/2 rounded-2xl border border-border/60 bg-background/95 px-4 py-3 text-center text-sm shadow-xl backdrop-blur">
      <p className="text-foreground">{notice}</p>
      <button
        type="button"
        className="mt-2 text-xs font-medium text-primary hover:underline"
        onClick={() => setNotice(null)}
      >
        Kapat
      </button>
    </div>
  );
}
