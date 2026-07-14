"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Square, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { toPlainMessageText } from "@/lib/chat/plain-text";
import { cn } from "@/lib/utils";

interface AssistantMessageActionsProps {
  text: string;
  className?: string;
}

export function AssistantMessageActions({
  text,
  className,
}: AssistantMessageActionsProps) {
  const plain = toPlainMessageText(text);
  const { isSupported, isSpeaking, speak, stop } = useSpeechSynthesis("juniper");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  if (!plain) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(plain);
      setCopied(true);
    } catch {
      // Fallback for older browsers / denied permission
      const area = document.createElement("textarea");
      area.value = plain;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
        setCopied(true);
      } finally {
        document.body.removeChild(area);
      }
    }
  }

  function handleListen() {
    if (isSpeaking) {
      stop();
      return;
    }
    speak(plain);
  }

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="group"
      aria-label="Mesaj eylemleri"
    >
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="h-7 gap-1.5 px-2 text-muted-foreground"
        onClick={() => void handleCopy()}
        aria-label={copied ? "Kopyalandı" : "Metni kopyala"}
      >
        {copied ? (
          <Check className="size-3.5 text-primary" />
        ) : (
          <Copy className="size-3.5" />
        )}
        <span className="text-[11px] font-medium">
          {copied ? "Kopyalandı" : "Kopyala"}
        </span>
      </Button>

      {isSupported ? (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className={cn(
            "h-7 gap-1.5 px-2 text-muted-foreground",
            isSpeaking && "text-primary",
          )}
          onClick={handleListen}
          aria-label={isSpeaking ? "Dinlemeyi durdur" : "Metni sesli dinle"}
          aria-pressed={isSpeaking}
        >
          {isSpeaking ? (
            <Square className="size-3.5 fill-current" />
          ) : (
            <Volume2 className="size-3.5" />
          )}
          <span className="text-[11px] font-medium">
            {isSpeaking ? "Durdur" : "Dinle"}
          </span>
        </Button>
      ) : null}
    </div>
  );
}
