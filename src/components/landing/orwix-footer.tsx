"use client";

import { useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";

import { ORWIX_FOOTER } from "@/content/orwix-content";
import type { OrwixMode } from "@/content/orwix-content";
import { createBrandBirth } from "@/lib/chat/brand-seed";

interface OrwixFooterProps {
  onSelectPrompt: (
    prompt: string,
    options?: { mode?: OrwixMode; autoSend?: boolean },
  ) => void;
}

export function OrwixFooter({ onSelectPrompt }: OrwixFooterProps) {
  const [busy, setBusy] = useState(false);
  const [tease, setTease] = useState<string | null>(null);

  const handleBrandBirth = async () => {
    if (busy) return;
    setBusy(true);

    const birth = createBrandBirth();
    setTease(birth.tease);

    // Short beat so the "birth" feels intentional, not a random paste.
    await new Promise((resolve) => setTimeout(resolve, 700));

    onSelectPrompt(birth.prompt, { mode: birth.mode, autoSend: true });
    setBusy(false);
    setTease(null);
  };

  return (
    <footer className="orwix-footer relative z-10 mt-10 w-full overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <div className="text-center">
          <div className="orwix-footer-badge mb-4 inline-flex items-center gap-2">
            <Sparkles className="size-3.5" />
            <span>Sıfırdan marka stüdyosu</span>
          </div>
          <h2 className="font-heading text-3xl font-semibold leading-tight md:text-5xl">
            <span className="orwix-gradient-text">{ORWIX_FOOTER.tagline}</span>
          </h2>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            {ORWIX_FOOTER.subtitle}
          </p>
          <button
            type="button"
            onClick={() => void handleBrandBirth()}
            disabled={busy}
            className="orwix-surprise-btn mt-6 inline-flex items-center gap-2 disabled:pointer-events-none disabled:opacity-80"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Wand2 className="size-4" />
            )}
            {busy ? tease ?? "Doğuyor…" : ORWIX_FOOTER.surpriseLabel}
          </button>
          <p className="mx-auto mt-3 max-w-md text-xs text-muted-foreground">
            Her tıkta uydurma bir marka: site, logo, film veya yatırımcı sunumu —
            sıradan “şaşırt beni” değil.
          </p>
        </div>

        <p className="orwix-footer-copyright mt-12 text-center text-sm">
          {ORWIX_FOOTER.copyright}
        </p>
      </div>
    </footer>
  );
}
