"use client";

import { ChevronDown, Menu, SquarePen } from "lucide-react";

import { OrwixWordmark } from "@/components/brand/orwix-logo";
import { ClientOnly } from "@/components/ui/client-only";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GEMINI_MODELS } from "@/server/types/gemini.types";
import type { ChatSettings } from "@/types/chat.types";

interface MobileHeaderProps {
  model: ChatSettings["model"];
  onModelChange: (model: ChatSettings["model"]) => void;
  onNewChat: () => void;
  onMenuOpen: () => void;
}

function getModelLabel(model: ChatSettings["model"]): string {
  return model === GEMINI_MODELS.PRO ? "Pro" : "Flash";
}

export function MobileHeader({
  model,
  onModelChange,
  onNewChat,
  onMenuOpen,
}: MobileHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border/60 bg-background/80 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md md:hidden">
      <button
        type="button"
        onClick={onMenuOpen}
        className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
        aria-label="Menü"
      >
        <Menu className="size-6" strokeWidth={1.75} />
      </button>

      <ClientOnly
        fallback={
          <div className="flex items-center gap-1.5 px-1">
            <OrwixWordmark className="text-base font-bold" />
            <span className="text-base font-medium text-muted-foreground">
              {getModelLabel(model)}
            </span>
          </div>
        }
      >
        <Select
          value={model}
          onValueChange={(next) =>
            onModelChange(next as ChatSettings["model"])
          }
        >
          <SelectTrigger className="h-10 w-auto gap-1.5 border-0 bg-transparent px-1 text-base font-medium text-foreground shadow-none focus:ring-0 [&>svg:last-child]:hidden">
            <OrwixWordmark className="text-base font-bold" />
            <span className="text-base font-medium text-muted-foreground">
              {getModelLabel(model)}
            </span>
            <ChevronDown className="size-4 opacity-70" />
          </SelectTrigger>
          <SelectContent className="border-border bg-popover text-popover-foreground">
            <SelectItem value={GEMINI_MODELS.FLASH_LITE}>Orwix Flash</SelectItem>
            <SelectItem value={GEMINI_MODELS.FLASH}>Orwix Flash 2.5</SelectItem>
            <SelectItem value={GEMINI_MODELS.PRO}>Orwix Pro</SelectItem>
          </SelectContent>
        </Select>
      </ClientOnly>

      <button
        type="button"
        onClick={onNewChat}
        className="flex size-10 items-center justify-center rounded-full border border-dashed border-border text-foreground transition-colors hover:bg-muted"
        aria-label="Yeni sohbet"
      >
        <SquarePen className="size-5" strokeWidth={1.75} />
      </button>
    </header>
  );
}
