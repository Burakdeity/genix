"use client";

import { SquarePen } from "lucide-react";

import { OrwixWordmark } from "@/components/brand/orwix-logo";
import { ClientOnly } from "@/components/ui/client-only";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GEMINI_MODELS } from "@/server/types/gemini.types";
import type { ChatSettings } from "@/types/chat.types";

interface DesktopHeaderProps {
  model: ChatSettings["model"];
  onModelChange: (model: ChatSettings["model"]) => void;
  onNewChat: () => void;
}

function getModelLabel(model: ChatSettings["model"]): string {
  if (model === GEMINI_MODELS.PRO) return "Pro";
  if (model === GEMINI_MODELS.FLASH) return "Flash 2.5";
  return "Flash";
}

export function DesktopHeader({
  model,
  onModelChange,
  onNewChat,
}: DesktopHeaderProps) {
  return (
    <header className="hidden h-14 shrink-0 items-center justify-between border-b border-border/80 bg-background/80 px-6 backdrop-blur-md md:flex">
      <div className="flex min-w-0 items-center gap-3">
        <OrwixWordmark className="text-lg font-bold" />
        <Badge
          variant="secondary"
          className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
        >
          {getModelLabel(model)}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <ClientOnly
          fallback={
            <div className="h-9 w-[148px] rounded-xl border border-border bg-card px-3 text-sm leading-9 text-muted-foreground">
              {getModelLabel(model)}
            </div>
          }
        >
          <Select
            value={model}
            onValueChange={(next) =>
              onModelChange(next as ChatSettings["model"])
            }
          >
            <SelectTrigger className="h-9 w-[148px] rounded-xl border-border bg-card text-sm shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-popover text-popover-foreground">
              <SelectItem value={GEMINI_MODELS.FLASH_LITE}>Orwix Flash</SelectItem>
              <SelectItem value={GEMINI_MODELS.FLASH}>Orwix Flash 2.5</SelectItem>
              <SelectItem value={GEMINI_MODELS.PRO}>Orwix Pro</SelectItem>
            </SelectContent>
          </Select>
        </ClientOnly>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onNewChat}
          className="h-9 gap-1.5 rounded-xl"
        >
          <SquarePen className="size-4" />
          Yeni sohbet
        </Button>
      </div>
    </header>
  );
}
