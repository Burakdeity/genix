"use client";

import { AuthModal } from "@/components/auth/auth-modal";
import { ImageLoginBonusSync } from "@/components/billing/image-login-bonus-sync";
import { ImageLoginModal } from "@/components/billing/image-login-modal";
import { ProPlanModal } from "@/components/billing/pro-plan-modal";
import { OrwixAppShell } from "@/components/landing/orwix-app-shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { useChat } from "@/hooks/use-chat";

export function ChatInterface() {
  const { messages, isLoading, error, sendMessage, settings, updateSettings } =
    useChat();

  return (
    <>
      <ErrorBoundary>
        <OrwixAppShell
          messages={messages}
          isLoading={isLoading}
          error={error}
          onSend={sendMessage}
          model={settings.model}
          onModelChange={(model) => updateSettings({ model })}
        />
      </ErrorBoundary>
      <AuthModal />
      <ImageLoginModal />
      <ImageLoginBonusSync />
      <ProPlanModal />
    </>
  );
}
