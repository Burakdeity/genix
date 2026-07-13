"use client";

import { useEffect, useRef, useState } from "react";

import { AlertCircle } from "lucide-react";

import { ChatHistoryList } from "@/components/chat/chat-history-panel";
import { ChatMessageItem } from "@/components/chat/chat-message";
import { ChatScrollArea } from "@/components/chat/chat-scroll-area";
import { OrwixBackground } from "@/components/landing/orwix-background";
import { OrwixCookieConsent } from "@/components/landing/orwix-cookie-consent";
import { OrwixFooter } from "@/components/landing/orwix-footer";
import { OrwixHeader } from "@/components/landing/orwix-header";
import { OrwixHero } from "@/components/landing/orwix-hero";
import { OrwixMetaBanner } from "@/components/landing/orwix-meta-banner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClientOnly } from "@/components/ui/client-only";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import {
  GUEST_CHAT_ACCOUNT_ID,
  useChatStore,
} from "@/stores/chat.store";
import type {
  ChatAttachment,
  ChatMessage,
  ChatSettings,
  SendMessageOptions,
} from "@/types/chat.types";
import type { OrwixMode } from "@/content/orwix-content";

interface PromptRequest {
  id: number;
  text: string;
  mode?: OrwixMode;
  autoSend?: boolean;
  brandBirth?: boolean;
}

interface OrwixAppShellProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSend: (
    message: string,
    attachments?: ChatAttachment[],
    options?: SendMessageOptions,
  ) => Promise<void>;
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
  const accountId =
    useAuthStore((state) => state.activeAccountId) ?? GUEST_CHAT_ACCOUNT_ID;
  const hasSavedSessions = useChatStore(
    (state) => (state.sessionsByAccountId[accountId] ?? []).length > 0,
  );

  const handleSelectPrompt = (
    text: string,
    options?: { mode?: OrwixMode; autoSend?: boolean; brandBirth?: boolean },
  ) => {
    setPromptRequest({
      id: Date.now(),
      text,
      mode: options?.mode,
      autoSend: options?.autoSend,
      brandBirth: options?.brandBirth,
    });
  };

  // Consume external prompt requests once handled so they don't retrigger.
  useEffect(() => {
    if (!promptRequest) return;
    const timer = window.setTimeout(() => {
      setPromptRequest((current) =>
        current?.id === promptRequest.id ? null : current,
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [promptRequest]);

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
        <OrwixHeader onSelectPrompt={handleSelectPrompt} />
        {!hasMessages ? <OrwixMetaBanner /> : null}

        <main
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            hasMessages ? "overflow-hidden" : "",
          )}
        >
          {hasMessages ? (
            <ChatScrollArea>
              <div className="px-5 pt-5 md:px-8 md:pt-6">
                <div className="mx-auto max-w-3xl space-y-6 pb-5">
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
            </ChatScrollArea>
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
          <>
            {hasSavedSessions ? (
              <ClientOnly>
                <section className="mx-auto w-full max-w-xl px-5 pb-8 md:px-6">
                  <ChatHistoryList limit={12} />
                </section>
              </ClientOnly>
            ) : null}
            <OrwixFooter onSelectPrompt={handleSelectPrompt} />
          </>
        ) : null}
        <OrwixCookieConsent />
      </div>
    </div>
  );
}
