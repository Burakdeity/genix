"use client";

import { AuthModal } from "@/components/auth/auth-modal";
import { OrwixAppShell } from "@/components/landing/orwix-app-shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { ClientOnly } from "@/components/ui/client-only";
import { useChat } from "@/hooks/use-chat";

export function ChatInterface() {
  const { messages, isLoading, error, sendMessage, settings, updateSettings } =
    useChat();

  return (
    <ErrorBoundary>
      <ClientOnly
        fallback={
          <div className="flex min-h-[100dvh] items-center justify-center bg-background text-sm text-muted-foreground">
            Yükleniyor...
          </div>
        }
      >
        <OrwixAppShell
          messages={messages}
          isLoading={isLoading}
          error={error}
          onSend={sendMessage}
          model={settings.model}
          onModelChange={(model) => updateSettings({ model })}
        />
      </ClientOnly>
      <AuthModal />
    </ErrorBoundary>
  );
}
