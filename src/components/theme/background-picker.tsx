"use client";

import { useState } from "react";
import { Palette } from "lucide-react";

import { BACKGROUND_PRESETS } from "@/constants/background-presets";
import { useStoresHydrated } from "@/hooks/use-stores-hydrated";
import {
  applyBackgroundToDocument,
  useBackgroundStore,
} from "@/stores/background.store";
import { cn } from "@/lib/utils";

interface BackgroundPickerProps {
  className?: string;
}

export function BackgroundPicker({ className }: BackgroundPickerProps) {
  const hydrated = useStoresHydrated();
  const preset = useBackgroundStore((state) => state.preset);
  const setPreset = useBackgroundStore((state) => state.setPreset);
  const [open, setOpen] = useState(false);

  const selectPreset = (next: (typeof BACKGROUND_PRESETS)[number]["id"]) => {
    setPreset(next);
    applyBackgroundToDocument(next);
    setOpen(false);
  };

  const swatches = (
    <div className="flex items-center gap-1.5">
      {BACKGROUND_PRESETS.map((item) => {
        const active = hydrated && preset === item.id;
        return (
          <button
            key={item.id}
            type="button"
            title={item.label}
            aria-label={`${item.label} arka plan`}
            aria-pressed={active}
            onClick={() => selectPreset(item.id)}
            className={cn(
              "relative size-6 shrink-0 cursor-pointer rounded-full transition-transform hover:scale-110",
              active &&
                "ring-2 ring-primary ring-offset-2 ring-offset-background",
            )}
            style={{ background: item.swatch }}
          >
            {active ? (
              <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/30" />
            ) : null}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={cn("relative", className)}>
      <div className="hidden items-center gap-2 md:flex">
        <Palette className="size-4 text-muted-foreground" aria-hidden />
        {swatches}
      </div>

      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          title="Arka plan rengi"
          aria-label="Arka plan rengi seç"
          aria-expanded={open}
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
        >
          <Palette className="size-4" />
        </button>
        {open ? (
          <div className="orwix-glass absolute right-0 top-full z-30 mt-2 rounded-xl p-3 shadow-xl">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              Arka plan
            </p>
            {swatches}
          </div>
        ) : null}
      </div>
    </div>
  );
}
