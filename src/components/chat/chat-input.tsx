"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, AudioLines, Loader2, Mic } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ClientOnly } from "@/components/ui/client-only";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
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
  const dictationBaseRef = useRef("");
  const openVoiceMode = useVoiceStore((state) => state.openLive);

  const {
    isSupported: dictationSupported,
    isListening,
    error: dictationError,
    start: startDictation,
    stop: stopDictation,
  } = useSpeechRecognition({
    lang: "tr-TR",
    continuous: true,
    onFinalTranscript: (text) => {
      const next = `${dictationBaseRef.current} ${text}`.replace(/\s+/g, " ").trim();
      dictationBaseRef.current = next;
      setValue(next);
    },
    onInterimTranscript: (text) => {
      setValue(`${dictationBaseRef.current} ${text}`.replace(/\s+/g, " ").trim());
    },
  });

  useEffect(() => {
    if (isListening) return;
    dictationBaseRef.current = value;
  }, [value, isListening]);

  useEffect(() => {
    if (isLoading && isListening) stopDictation();
  }, [isLoading, isListening, stopDictation]);

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    if (isListening) stopDictation();
    setValue("");
    dictationBaseRef.current = "";
    await onSend(trimmed);
  };

  const toggleDictation = () => {
    if (isListening) {
      stopDictation();
      return;
    }
    dictationBaseRef.current = value.trim();
    startDictation();
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
      <div className="orwix-composer-wrap mx-auto max-w-2xl">
        <div className="orwix-composer flex items-end gap-2 rounded-[27px] px-3 py-2.5 md:px-4">
          <textarea
            value={value}
            onChange={(event) => {
              const next = event.target.value;
              if (!isListening) dictationBaseRef.current = next;
              setValue(next);
            }}
            placeholder={
              isListening
                ? "Dinleniyor… konuşun"
                : "Orwix'e bir mesaj yazın..."
            }
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
                {model === GEMINI_MODELS.PRO
                  ? "Pro"
                  : model === GEMINI_MODELS.FLASH
                    ? "Flash+"
                    : "Flash"}
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
                    {model === GEMINI_MODELS.PRO
                      ? "Pro"
                      : model === GEMINI_MODELS.FLASH
                        ? "Flash+"
                        : "Flash"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="border-border bg-popover text-popover-foreground">
                  <SelectItem value={GEMINI_MODELS.FLASH_LITE}>Flash</SelectItem>
                  <SelectItem value={GEMINI_MODELS.FLASH}>Flash+</SelectItem>
                  <SelectItem value={GEMINI_MODELS.PRO}>Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </ClientOnly>

          {dictationSupported ? (
            <button
              type="button"
              onClick={toggleDictation}
              disabled={isLoading}
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-50",
                isListening
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              aria-label={isListening ? "Dinlemeyi durdur" : "Sesle yaz"}
              aria-pressed={isListening}
              title="Konuşun — soru yazıya dökülür"
            >
              <Mic className="size-4" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => void openVoiceMode()}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Canlı ses"
            title="Canlı sesli sohbet"
          >
            <AudioLines className="size-4" />
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
        {dictationError ? (
          <p className="mt-1 px-1 text-xs text-destructive">{dictationError}</p>
        ) : null}
      </div>
    </div>
  );
}
