"use client";

import { useEffect } from "react";

import { AuthModal } from "@/components/auth/auth-modal";
import { BillingSuccessSync } from "@/components/billing/billing-success-sync";
import { ImageLoginBonusSync } from "@/components/billing/image-login-bonus-sync";
import { ImageLoginModal } from "@/components/billing/image-login-modal";
import { ProPlanModal } from "@/components/billing/pro-plan-modal";
import { ChatHistoryPanel } from "@/components/chat/chat-history-panel";
import { OrwixAppShell } from "@/components/landing/orwix-app-shell";
import { VoiceModePanel } from "@/components/voice/voice-mode-panel";
import { ErrorBoundary } from "@/components/error-boundary";
import { useChat } from "@/hooks/use-chat";
import { GEMINI_MODELS } from "@/server/types/gemini.types";
import { useAuthStore } from "@/stores/auth.store";
import { useImageQuotaStore } from "@/stores/image-quota.store";

export function ChatInterface() {
  const { messages, isLoading, error, sendMessage, settings, updateSettings } =
    useChat();
  const activeAccountId = useAuthStore((state) => state.activeAccountId);
  const isPro = useImageQuotaStore((state) => state.isPro(activeAccountId));

  useEffect(() => {
    if (!isPro && settings.model === GEMINI_MODELS.PRO) {
      updateSettings({ model: GEMINI_MODELS.FLASH_LITE });
    }
  }, [isPro, settings.model, updateSettings]);

  return (
    <>
      <ErrorBoundary>
        <OrwixAppShell
          messages={messages}
          isLoading={isLoading}
          error={error}
          onSend={sendMessage}
          model={settings.model}
          onModelChange={(model) => {
            if (model === GEMINI_MODELS.PRO && !isPro) {
              useImageQuotaStore.getState().openProModal();
              return;
            }
            updateSettings({ model });
          }}
        />
      </ErrorBoundary>
      <ChatHistoryPanel />
      <AuthModal />
      <ImageLoginModal />
      <ImageLoginBonusSync />
      <BillingSuccessSync />
      <ProPlanModal />
      <VoiceModePanel />
    </>
  );
}
