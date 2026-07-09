"use client";

import { useState } from "react";

import { AlertCircle } from "lucide-react";

import { ChatMessageItem } from "@/components/chat/chat-message";
import { OrwixBackground } from "@/components/landing/orwix-background";
import { OrwixCookieConsent } from "@/components/landing/orwix-cookie-consent";
import { OrwixFooter } from "@/components/landing/orwix-footer";
import { OrwixHeader } from "@/components/landing/orwix-header";
import { OrwixHero } from "@/components/landing/orwix-hero";
import { OrwixMetaBanner } from "@/components/landing/orwix-meta-banner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage } from "@/types/chat.types";

interface PromptRequest {
  id: number;
  text: string;
}

interface OrwixAppShellProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSend: (message: string) => Promise<void>;
}

export function OrwixAppShell({
  messages,
  isLoading,
  error,
  onSend,
}: OrwixAppShellProps) {
  const hasMessages = messages.length > 0;
  const [promptRequest, setPromptRequest] = useState<PromptRequest | null>(null);

  const handleSelectPrompt = (text: string) => {
    setPromptRequest({ id: Date.now(), text });
  };

  return (
    <div className="orwix-page flex min-h-[100dvh] flex-col">
      <OrwixBackground />
      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <OrwixHeader />
        {!hasMessages ? <OrwixMetaBanner /> : null}

        <main className="flex-1">
          {hasMessages ? (
            <ScrollArea className="max-h-[min(40dvh,420px)] px-4 pt-6 md:px-6">
              <div className="mx-auto max-w-3xl space-y-5">
                {messages.map((message) => (
                  <ChatMessageItem key={message.id} message={message} />
                ))}
              </div>
            </ScrollArea>
          ) : null}

          <OrwixHero
            onSend={onSend}
            isLoading={isLoading}
            hasMessages={hasMessages}
            promptRequest={promptRequest}
          />

          {error ? (
            <div className="mx-auto max-w-3xl px-4 pb-4 md:px-6">
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : null}
        </main>

        {!hasMessages ? (
          <OrwixFooter onSelectPrompt={handleSelectPrompt} />
        ) : null}
        <OrwixCookieConsent />
      </div>
    </div>
  );
}
