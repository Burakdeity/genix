"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createProCheckoutSession } from "@/lib/api/billing-client";
import {
  FREE_SIGNED_IN_IMAGE_LIMIT,
  ORWIX_PRO_PRICE_LABEL,
  PRO_BENEFITS,
} from "@/lib/billing/plans";
import { useAuthStore } from "@/stores/auth.store";
import { useImageQuotaStore } from "@/stores/image-quota.store";

export function ProPlanModal() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const open = useImageQuotaStore((state) => state.proModalOpen);
  const closeProModal = useImageQuotaStore((state) => state.closeProModal);
  const activeAccountId = useAuthStore((state) => state.activeAccountId);
  const accounts = useAuthStore((state) => state.accounts);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) return null;

  const startCheckout = async () => {
    if (!activeAccountId) {
      closeProModal();
      openAuthModal("picker");
      return;
    }

    const account = accounts.find((item) => item.id === activeAccountId);
    setLoading(true);
    setError(null);
    try {
      const { url } = await createProCheckoutSession({
        accountId: activeAccountId,
        email: account?.email,
      });
      window.location.assign(url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ödeme sayfası açılamadı. Stripe anahtarlarını kontrol edin.",
      );
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[320] flex items-center justify-center bg-black/45 p-4">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <button
          type="button"
          onClick={closeProModal}
          disabled={loading}
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted disabled:opacity-50"
          aria-label="Kapat"
        >
          <X className="size-4" />
        </button>

        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Sparkles className="size-6" />
        </div>

        <h2 className="text-2xl font-semibold text-foreground">Orwix Pro</h2>
        <p className="mt-1 text-lg font-semibold text-primary">
          {ORWIX_PRO_PRICE_LABEL}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Ücretsiz haklarınız doldu (ör. {FREE_SIGNED_IN_IMAGE_LIMIT} görsel /
          gün). Güvenli Stripe ödemesiyle Pro&apos;ya geçin.
        </p>

        <ul className="mt-4 space-y-2 text-sm text-foreground">
          {PRO_BENEFITS.map((benefit) => (
            <li key={benefit}>• {benefit}</li>
          ))}
        </ul>

        {error ? (
          <p className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2">
          <Button
            type="button"
            className="h-11 rounded-full"
            disabled={loading}
            onClick={() => void startCheckout()}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Stripe açılıyor…
              </>
            ) : (
              <>Pro satın al — {ORWIX_PRO_PRICE_LABEL}</>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 rounded-full"
            disabled={loading}
            onClick={closeProModal}
          >
            Daha sonra
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
