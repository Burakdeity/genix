"use client";

import { Gauge, Sparkles } from "lucide-react";

import { GEMINI_MODELS } from "@/server/types/gemini.types";
import type { ChatSettings } from "@/types/chat.types";
import { cn } from "@/lib/utils";

export type QualityMode = "speed" | "quality";

export function modelToQualityMode(model: ChatSettings["model"]): QualityMode {
  return model === GEMINI_MODELS.FLASH_LITE ? "speed" : "quality";
}

export function qualityModeToModel(mode: QualityMode): ChatSettings["model"] {
  return mode === "speed" ? GEMINI_MODELS.FLASH_LITE : GEMINI_MODELS.PRO;
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

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border/70 bg-muted/40 p-0.5",
        className,
      )}
      role="group"
      aria-label="Yanıt modu"
    >
      <button
        type="button"
        disabled={disabled}
        aria-pressed={mode === "speed"}
        onClick={() => onChange(qualityModeToModel("speed"))}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all",
          mode === "speed"
            ? "bg-primary text-primary-foreground shadow-sm"
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
        onClick={() => onChange(qualityModeToModel("quality"))}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all",
          mode === "quality"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
          disabled && "opacity-50",
        )}
      >
        <Sparkles className="size-3.5" />
        Kalite
      </button>
    </div>
  );
}
