"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone ===
          true);

    setIsStandalone(standalone);

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIos(ios);

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone || dismissed) {
    return null;
  }

  if (deferredPrompt) {
    return (
      <div className="fixed inset-x-4 bottom-20 z-50 rounded-2xl border border-border bg-card p-4 shadow-2xl md:bottom-6 md:left-auto md:right-6 md:max-w-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-foreground">Uygulamayı yükle</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ana ekrana ekleyerek mobil uygulama gibi kullanın.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-muted-foreground"
            aria-label="Kapat"
          >
            <X className="size-4" />
          </button>
        </div>
        <Button
          className="mt-3 w-full gap-2"
          onClick={() => {
            void deferredPrompt.prompt();
            setDeferredPrompt(null);
            setDismissed(true);
          }}
        >
          <Download className="size-4" />
          Yükle
        </Button>
      </div>
    );
  }

  if (isIos) {
    return (
      <div className="fixed inset-x-4 bottom-20 z-50 rounded-2xl border border-border bg-card p-4 shadow-2xl md:bottom-6 md:left-auto md:right-6 md:max-w-sm">
        <p className="font-semibold text-foreground">iPhone&apos;a ekle</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Safari&apos;de{" "}
          <span className="font-medium text-foreground">Paylaş</span> →{" "}
          <span className="font-medium text-foreground">Ana Ekrana Ekle</span>{" "}
          seçeneğine dokunun.
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3"
          onClick={() => setDismissed(true)}
        >
          Anladım
        </Button>
      </div>
    );
  }

  return null;
}
