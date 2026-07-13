"use client";

import { Gauge, Lock, Sparkles } from "lucide-react";

import { GEMINI_MODELS } from "@/server/types/gemini.types";
import type { ChatSettings } from "@/types/chat.types";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { useImageQuotaStore } from "@/stores/image-quota.store";

export type QualityMode = "speed" | "quality";

export function qualityModeToModel(mode: QualityMode): ChatSettings["model"] {
  // Hız = Flash-Lite (en düşük latency). Kalite = Pro.
  return mode === "speed" ? GEMINI_MODELS.FLASH_LITE : GEMINI_MODELS.PRO;
}

export function modelToQualityMode(model: ChatSettings["model"]): QualityMode {
  return model === GEMINI_MODELS.PRO ? "quality" : "speed";
}

interface QualityModeToggleProps {
  model: ChatSettings["model"];
  onChange: (model: ChatSettings["model"]) => void;
  disabled?: boolean;
  className?: string;
}

export function QualityModeToggle({
  model,
  onChange,
  disabled = false,
  className,
}: QualityModeToggleProps) {
  const mode = modelToQualityMode(model);
  const activeAccountId = useAuthStore((state) => state.activeAccountId);
  const isPro = useImageQuotaStore((state) => state.isPro(activeAccountId));
  const openProModal = useImageQuotaStore((state) => state.openProModal);

  const selectSpeed = () => onChange(qualityModeToModel("speed"));
  const selectQuality = () => {
    if (!isPro) {
      openProModal();
      return;
    }
    onChange(qualityModeToModel("quality"));
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-xl border border-border/60 bg-muted/35 p-0.5",
        className,
      )}
      role="group"
      aria-label="Yanıt modu"
    >
      <button
        type="button"
        disabled={disabled}
        aria-pressed={mode === "speed"}
        onClick={selectSpeed}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-[10px] px-3 text-xs font-semibold transition-all",
          mode === "speed"
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:text-foreground",
          disabled && "opacity-50",
        )}
      >
        <Gauge className="size-3.5" />
        Hız
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={mode === "quality"}
        title={isPro ? "Kalite modeli" : "Kalite modeli Pro plana özel"}
        onClick={selectQuality}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-[10px] px-3 text-xs font-semibold transition-all",
          mode === "quality"
            ? "bg-foreground text-background shadow-sm"
            : "text-muted-foreground hover:text-foreground",
          disabled && "opacity-50",
        )}
      >
        {isPro ? (
          <Sparkles className="size-3.5" />
        ) : (
          <Lock className="size-3.5" />
        )}
        Kalite
      </button>
    </div>
  );
}
