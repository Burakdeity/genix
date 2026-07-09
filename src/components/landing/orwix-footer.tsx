"use client";

import { Sparkles, Wand2 } from "lucide-react";

import {
  ORWIX_FOOTER,
  ORWIX_SURPRISE_PROMPTS,
} from "@/content/orwix-content";

interface OrwixFooterProps {
  onSelectPrompt: (prompt: string) => void;
}

export function OrwixFooter({ onSelectPrompt }: OrwixFooterProps) {
  const handleSurprise = () => {
    const random =
      ORWIX_SURPRISE_PROMPTS[
        Math.floor(Math.random() * ORWIX_SURPRISE_PROMPTS.length)
      ];
    onSelectPrompt(random);
  };

  return (
    <footer className="orwix-footer relative z-10 mt-10 w-full overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <div className="text-center">
          <div className="orwix-footer-badge mb-4 inline-flex items-center gap-2">
            <Sparkles className="size-3.5" />
            <span>Sınırsız fikir alanı</span>
          </div>
          <h2 className="font-heading text-3xl font-semibold leading-tight md:text-5xl">
            <span className="orwix-gradient-text">{ORWIX_FOOTER.tagline}</span>
          </h2>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            {ORWIX_FOOTER.subtitle}
          </p>
          <button
            type="button"
            onClick={handleSurprise}
            className="orwix-surprise-btn mt-6 inline-flex items-center gap-2"
          >
            <Wand2 className="size-4" />
            {ORWIX_FOOTER.surpriseLabel}
          </button>
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          {ORWIX_FOOTER.copyright}
        </p>
      </div>
    </footer>
  );
}
