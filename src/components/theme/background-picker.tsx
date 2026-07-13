"use client";

import { useEffect, useRef, useState } from "react";
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
  const rootRef = useRef<HTMLDivElement>(null);

  const selectPreset = (next: (typeof BACKGROUND_PRESETS)[number]["id"]) => {
    setPreset(next);
    applyBackgroundToDocument(next);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        title="Tema rengi"
        aria-label="Tema rengi seç"
        aria-expanded={open}
        className={cn(
          "orwix-nav-link flex size-8 items-center justify-center rounded-full transition-colors hover:bg-primary/10 sm:size-9",
          open && "bg-primary/10 text-foreground",
        )}
      >
        <Palette className="size-4" />
      </button>
      {open ? (
        <div className="orwix-glass absolute right-0 top-full z-50 mt-2 w-[min(15rem,calc(100vw-1.5rem))] rounded-xl p-3 shadow-xl">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Tema
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {BACKGROUND_PRESETS.map((item) => {
              const active = hydrated && preset === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  aria-label={`${item.label} teması`}
                  aria-pressed={active}
                  onClick={() => selectPreset(item.id)}
                  className={cn(
                    "relative size-6 shrink-0 cursor-pointer rounded-full transition-transform hover:scale-110",
                    active &&
                      "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  )}
                  style={{ backgroundImage: item.swatch }}
                >
                  {active ? (
                    <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/30" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
