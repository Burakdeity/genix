"use client";

import { useEffect, useRef, useState } from "react";

import { AlertCircle } from "lucide-react";

import { ChatMessageItem } from "@/components/chat/chat-message";
import { OrwixBackground } from "@/components/landing/orwix-background";
import { OrwixCookieConsent } from "@/components/landing/orwix-cookie-consent";
import { OrwixFooter } from "@/components/landing/orwix-footer";
import { OrwixHeader } from "@/components/landing/orwix-header";
import { OrwixHero } from "@/components/landing/orwix-hero";
import { OrwixMetaBanner } from "@/components/landing/orwix-meta-banner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { ChatMessage, ChatSettings } from "@/types/chat.types";

interface PromptRequest {
  id: number;
  text: string;
}

interface OrwixAppShellProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSend: (message: string) => Promise<void>;
  model: ChatSettings["model"];
  onModelChange: (model: ChatSettings["model"]) => void;
}

export function OrwixAppShell({
  messages,
  isLoading,
  error,
  onSend,
  model,
  onModelChange,
}: OrwixAppShellProps) {
  const hasMessages = messages.length > 0;
  const [promptRequest, setPromptRequest] = useState<PromptRequest | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSelectPrompt = (text: string) => {
    setPromptRequest({ id: Date.now(), text });
  };

  useEffect(() => {
    if (!hasMessages) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, hasMessages, isLoading]);

  return (
    <div
      className={cn(
        "orwix-page flex flex-col",
        hasMessages ? "h-[100dvh] overflow-hidden" : "min-h-[100dvh]",
      )}
    >
      <OrwixBackground />
      <div
        className={cn(
          "relative z-10 flex flex-col",
          hasMessages ? "h-full min-h-0" : "min-h-[100dvh]",
        )}
      >
        <OrwixHeader />
        {!hasMessages ? <OrwixMetaBanner /> : null}

        <main
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            hasMessages ? "overflow-hidden" : "",
          )}
        >
          {hasMessages ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 md:px-6 md:pt-6">
              <div className="mx-auto max-w-3xl space-y-5 pb-4">
                {messages.map((message, index) => (
                  <ChatMessageItem
                    key={message.id}
                    message={message}
                    isTyping={
                      isLoading &&
                      index === messages.length - 1 &&
                      message.role === "assistant"
                    }
                  />
                ))}
                <div ref={messagesEndRef} className="h-px w-full shrink-0" />
              </div>
            </div>
          ) : null}

          <div
            className={cn(
              "shrink-0",
              hasMessages
                ? "border-t border-border/40 bg-background/70 backdrop-blur-md"
                : "",
            )}
          >
            <OrwixHero
              onSend={onSend}
              isLoading={isLoading}
              hasMessages={hasMessages}
              promptRequest={promptRequest}
              model={model}
              onModelChange={onModelChange}
            />

            {error ? (
              <div className="mx-auto max-w-3xl px-4 pb-4 md:px-6">
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            ) : null}
          </div>
        </main>

        {!hasMessages ? (
          <OrwixFooter onSelectPrompt={handleSelectPrompt} />
        ) : null}
        <OrwixCookieConsent />
      </div>
    </div>
  );
}
