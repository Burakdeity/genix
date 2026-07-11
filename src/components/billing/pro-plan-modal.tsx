"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import {
  FREE_SIGNED_IN_IMAGE_LIMIT,
  useImageQuotaStore,
} from "@/stores/image-quota.store";

export function ProPlanModal() {
  const [mounted, setMounted] = useState(false);
  const open = useImageQuotaStore((state) => state.proModalOpen);
  const closeProModal = useImageQuotaStore((state) => state.closeProModal);
  const activatePro = useImageQuotaStore((state) => state.activatePro);
  const activeAccountId = useAuthStore((state) => state.activeAccountId);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[320] flex items-center justify-center bg-black/45 p-4">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <button
          type="button"
          onClick={closeProModal}
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          aria-label="Kapat"
        >
          <X className="size-4" />
        </button>

        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Sparkles className="size-6" />
        </div>

        <h2 className="text-2xl font-semibold text-foreground">Orwix Pro</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Ücretsiz görsel hakkınız ({FREE_SIGNED_IN_IMAGE_LIMIT}) doldu. Pro plana
          geçerek sınırsız görsel üretimi açabilirsiniz.
        </p>

        <ul className="mt-4 space-y-2 text-sm text-foreground">
          <li>• Sınırsız görsel oluşturma</li>
          <li>• Daha yüksek kaliteli üretim</li>
          <li>• Öncelikli erişim</li>
        </ul>

        <div className="mt-6 flex flex-col gap-2">
          <Button
            type="button"
            className="h-11 rounded-full"
            onClick={() => {
              if (!activeAccountId) {
                closeProModal();
                openAuthModal("picker");
                return;
              }
              activatePro(activeAccountId);
            }}
          >
            Pro plana geç
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 rounded-full"
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
