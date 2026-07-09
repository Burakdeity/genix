"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";

import { AuthModal } from "@/components/auth/auth-modal";
import { ChatDisclaimer } from "@/components/chat/chat-disclaimer";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessageItem } from "@/components/chat/chat-message";
import { GenixGreeting } from "@/components/chat/genix-greeting";
import { ErrorBoundary } from "@/components/error-boundary";
import { ClientOnly } from "@/components/ui/client-only";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DesktopHeader } from "@/components/layout/desktop-header";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { MobileHeader } from "@/components/layout/mobile-header";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { VoiceModePanel } from "@/components/voice/voice-mode-panel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/hooks/use-chat";

export function ChatInterface() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    messages,
    settings,
    isLoading,
    error,
    sendMessage,
    updateSettings,
    clearMessages,
  } = useChat();

  const isEmpty = messages.length === 0;
  const lastMessage = messages.at(-1);
  const isAssistantTyping =
    isLoading &&
    lastMessage?.role === "assistant" &&
    !lastMessage.content.trim();

  const lastAssistantText = [...messages]
    .reverse()
    .find((message) => message.role === "assistant" && message.content.trim())
    ?.content;

  return (
    <ErrorBoundary>
      <div className="genix-shell relative flex h-[100dvh] w-full overflow-hidden bg-background">
        <div className="hidden overflow-visible md:flex">
          <AppSidebar onNewChat={clearMessages} />
        </div>

        <main className="relative flex min-w-0 flex-1 flex-col">
          <MobileHeader
            model={settings.model}
            onModelChange={(model) => updateSettings({ model })}
            onNewChat={clearMessages}
            onMenuOpen={() => setDrawerOpen(true)}
          />

          <DesktopHeader
            model={settings.model}
            onModelChange={(model) => updateSettings({ model })}
            onNewChat={clearMessages}
          />

          {isEmpty ? (
            <ClientOnly
              fallback={
                <div className="flex flex-1 flex-col items-center justify-center px-6 pb-40 pt-6 md:pb-36">
                  <p className="text-center text-2xl font-medium text-muted-foreground">
                    Yükleniyor...
                  </p>
                </div>
              }
            >
              <GenixGreeting />
            </ClientOnly>
          ) : (
            <ScrollArea className="min-h-0 flex-1 px-4 pb-32 pt-4 md:px-6 md:pb-28 md:pt-6">
              <div className="mx-auto max-w-3xl space-y-5 md:space-y-6">
                {messages.map((message, index) => (
                  <ChatMessageItem
                    key={message.id}
                    message={message}
                    isTyping={
                      isAssistantTyping &&
                      index === messages.length - 1 &&
                      message.role === "assistant"
                    }
                  />
                ))}
              </div>
            </ScrollArea>
          )}

          {error ? (
            <Alert
              variant="destructive"
              className="absolute inset-x-4 bottom-28 z-10 md:bottom-24 md:mx-auto md:max-w-2xl"
            >
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 z-10">
            <ChatInput
              onSend={sendMessage}
              isLoading={isLoading}
              model={settings.model}
              onModelChange={(model) => updateSettings({ model })}
              floating
            />
            <ChatDisclaimer />
          </div>
        </main>

        <MobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onNewChat={clearMessages}
        />
        <InstallPrompt />
        <AuthModal />
        <VoiceModePanel
          onSend={sendMessage}
          isLoading={isLoading}
          lastAssistantText={lastAssistantText}
        />
      </div>
    </ErrorBoundary>
  );
}
