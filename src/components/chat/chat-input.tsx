"use client";

import { useState } from "react";
import { ArrowUp, Loader2, Mic } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ClientOnly } from "@/components/ui/client-only";
import { useVoiceStore } from "@/stores/voice.store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GEMINI_MODELS } from "@/server/types/gemini.types";
import type { ChatSettings } from "@/types/chat.types";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => Promise<void>;
  isLoading: boolean;
  model: ChatSettings["model"];
  onModelChange: (model: ChatSettings["model"]) => void;
  floating?: boolean;
}

export function ChatInput({
  onSend,
  isLoading,
  model,
  onModelChange,
  floating = false,
}: ChatInputProps) {
  const [value, setValue] = useState("");

  const openVoiceMode = useVoiceStore((state) => state.open);

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;

    setValue("");
    await onSend(trimmed);
  };

  const canSend = value.trim().length > 0 && !isLoading;

  return (
    <div
      className={cn(
        "w-full px-4 pt-2",
        floating
          ? "pb-[max(0.25rem,env(safe-area-inset-bottom))]"
          : "border-t border-border pb-[max(1rem,env(safe-area-inset-bottom))]",
      )}
    >
      <div className="genix-input-bar mx-auto flex max-w-2xl items-end gap-2 rounded-2xl px-3 py-2.5 md:px-4">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Genix'e bir mesaj yazın..."
          disabled={isLoading}
          rows={1}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSubmit();
            }
          }}
          className="max-h-32 min-h-[24px] min-w-0 flex-1 resize-none bg-transparent py-1.5 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
        />

        <ClientOnly
          fallback={
            <div className="hidden h-8 shrink-0 items-center px-2 text-xs text-muted-foreground md:flex">
              {model === GEMINI_MODELS.PRO ? "Pro" : "Flash"}
            </div>
          }
        >
          <div className="hidden shrink-0 md:block">
            <Select
              value={model}
              onValueChange={(next) =>
                onModelChange(next as ChatSettings["model"])
              }
            >
              <SelectTrigger className="h-8 w-auto gap-1 border-0 bg-transparent px-2 text-xs text-muted-foreground shadow-none hover:bg-muted hover:text-foreground focus:ring-0">
                <SelectValue>
                  {model === GEMINI_MODELS.PRO ? "Pro" : "Flash"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border-border bg-popover text-popover-foreground">
                <SelectItem value={GEMINI_MODELS.FLASH_LITE}>Flash</SelectItem>
                <SelectItem value={GEMINI_MODELS.FLASH}>Flash (2.5)</SelectItem>
                <SelectItem value={GEMINI_MODELS.PRO}>Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </ClientOnly>

        <button
          type="button"
          onClick={openVoiceMode}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Ses modu"
        >
          <Mic className="size-4" />
        </button>

        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!canSend}
          size="icon"
          className="size-9 shrink-0 rounded-xl"
          aria-label="Gönder"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowUp className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
