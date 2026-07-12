"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ImageIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import {
  FREE_SIGNED_IN_IMAGE_LIMIT,
  GUEST_IMAGE_LIMIT,
  useImageQuotaStore,
} from "@/stores/image-quota.store";

export function ImageLoginModal() {
  const [mounted, setMounted] = useState(false);
  const open = useImageQuotaStore((state) => state.loginModalOpen);
  const closeLoginModal = useImageQuotaStore((state) => state.closeLoginModal);
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
          onClick={closeLoginModal}
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          aria-label="Kapat"
        >
          <X className="size-4" />
        </button>

        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <ImageIcon className="size-6" />
        </div>

        <h2 className="text-2xl font-semibold text-foreground">
          Ücretsiz görsel hakkın bitti
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Misafir olarak {GUEST_IMAGE_LIMIT} görsel hakkını kullandın. Giriş
          yaparsan hemen {FREE_SIGNED_IN_IMAGE_LIMIT} görsel hakkı daha
          tanınır — ekstra ücret yok.
        </p>

        <ul className="mt-4 space-y-2 text-sm text-foreground">
          <li>• Giriş = +{FREE_SIGNED_IN_IMAGE_LIMIT} görsel hakkı</li>
          <li>• Aynı kalitede üretim devam eder</li>
          <li>• Hakların bu cihazda hatırlanır</li>
        </ul>

        <div className="mt-6 flex flex-col gap-2">
          <Button
            type="button"
            className="h-11 rounded-full"
            onClick={() => {
              closeLoginModal();
              openAuthModal("picker");
            }}
          >
            Giriş yap — {FREE_SIGNED_IN_IMAGE_LIMIT} hak kazan
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 rounded-full"
            onClick={closeLoginModal}
          >
            Daha sonra
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
