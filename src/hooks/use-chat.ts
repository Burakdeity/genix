"use client";

import { useCallback } from "react";

import {
  generateGeminiImage,
  generateGeminiResponse,
  streamGeminiResponse,
} from "@/lib/api/gemini-client";
import { getEasterEggReply } from "@/lib/chat/easter-eggs";
import {
  detectAspectRatio,
  isImageGenerationPrompt,
} from "@/lib/chat/image-prompt";
import {
  createStreamTypewriter,
  typeText,
} from "@/lib/chat/typewriter";
import type { ChatStructuredResponse } from "@/server/schemas/chat-response.schema";
import { useAuthStore } from "@/stores/auth.store";
import { useChatStore } from "@/stores/chat.store";
import {
  FREE_SIGNED_IN_IMAGE_LIMIT,
  GUEST_IMAGE_LIMIT,
  useImageQuotaStore,
} from "@/stores/image-quota.store";
import type { ChatAttachment, ChatMessage } from "@/types/chat.types";

function createMessageId(): string {
  return crypto.randomUUID();
}

function isStructuredData(value: unknown): value is ChatStructuredResponse {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.answer === "string" &&
    typeof record.confidence === "number" &&
    Array.isArray(record.followUpQuestions)
  );
}

export function useChat() {
  const {
    messages,
    settings,
    isLoading,
    error,
    addMessage,
    updateLastAssistantMessage,
    setLoading,
    setError,
    updateSettings,
    clearMessages,
  } = useChatStore();

  const sendMessage = useCallback(
    async (prompt: string, attachments: ChatAttachment[] = []) => {
      const trimmed = prompt.trim();
      if ((!trimmed && attachments.length === 0) || isLoading) return;

      const apiImages = attachments.map(({ mimeType, data, name }) => ({
        mimeType,
        data,
        name,
      }));

      const userMessage: ChatMessage = {
        id: createMessageId(),
        role: "user",
        content: trimmed || (attachments.length > 0 ? "Görsel ekledim" : ""),
        images: attachments.map(({ mimeType, dataUrl }) => ({
          mimeType,
          dataUrl,
        })),
        createdAt: Date.now(),
      };

      const assistantMessage: ChatMessage = {
        id: createMessageId(),
        role: "assistant",
        content: "",
        createdAt: Date.now(),
      };

      addMessage(userMessage);
      addMessage(assistantMessage);
      setLoading(true);
      setError(null);

      const easterEgg = trimmed ? getEasterEggReply(trimmed) : null;
      if (easterEgg && attachments.length === 0) {
        try {
          await typeText(easterEgg, updateLastAssistantMessage);
        } finally {
          setLoading(false);
        }
        return;
      }

      const wantsImage =
        isImageGenerationPrompt(trimmed) ||
        (attachments.length > 0 &&
          /\b(düzenle|edit|değiştir|varyasyon|yeniden\s+çiz|bu\s+görsel)\b/i.test(
            trimmed,
          ));

      if (wantsImage) {
        const accountId = useAuthStore.getState().activeAccountId;
        const quota = useImageQuotaStore.getState();

        if (!quota.canGenerate(accountId)) {
          if (!accountId) {
            await typeText(
              `Ücretsiz görsel hakkınızı (${GUEST_IMAGE_LIMIT}) kullandınız. Daha fazla görsel üretmek için giriş yapın — giriş sonrası ${FREE_SIGNED_IN_IMAGE_LIMIT} hak daha açılır.`,
              updateLastAssistantMessage,
            );
            useAuthStore.getState().openAuthModal("picker");
          } else {
            await typeText(
              `Ücretsiz görsel hakkınız (${FREE_SIGNED_IN_IMAGE_LIMIT}) doldu. Sınırsız üretim için Pro plana geçin.`,
              updateLastAssistantMessage,
            );
            quota.openProModal();
          }
          setLoading(false);
          return;
        }

        try {
          const imageResult = await generateGeminiImage({
            prompt:
              trimmed ||
              "Bu görselleri referans alarak kaliteli bir görsel üret.",
            aspectRatio: detectAspectRatio(trimmed),
            images: apiImages,
          });

          quota.consume(accountId);
          const remaining = useImageQuotaStore.getState().getRemaining(accountId);
          const remainingLabel = Number.isFinite(remaining)
            ? ` Kalan hak: ${remaining}.`
            : "";

          const caption =
            (imageResult.text.trim() ||
              "Görsel hazır. İstersen başka bir varyasyon da üretebilirim.") +
            remainingLabel;

          await typeText(caption, updateLastAssistantMessage);

          useChatStore.setState((state) => {
            const updated = [...state.messages];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
              updated[lastIndex] = {
                ...updated[lastIndex],
                images: imageResult.images.map((image) => ({
                  mimeType: image.mimeType,
                  dataUrl: image.dataUrl,
                })),
              };
            }
            return { messages: updated };
          });
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Görsel üretilirken bir hata oluştu.";
          setError(message);

          useChatStore.setState((state) => {
            const next = [...state.messages];
            const lastIndex = next.length - 1;
            const lastMessage = next[lastIndex];

            if (
              lastIndex >= 0 &&
              lastMessage.role === "assistant" &&
              !lastMessage.content.trim()
            ) {
              return { messages: next.slice(0, -1) };
            }

            return { messages: next };
          });
        } finally {
          setLoading(false);
        }
        return;
      }

      const history = [
        ...messages
          .filter((message) => message.content.trim().length > 0)
          .slice(-30)
          .map((message) => ({
            role: message.role,
            content: message.content,
          })),
        {
          role: "user" as const,
          content:
            trimmed ||
            (attachments.length > 0 ? "Bu görseli incele." : trimmed),
        },
      ];

      const payload = {
        prompt: trimmed,
        history,
        images: apiImages,
        model: settings.model,
        systemInstruction: settings.systemInstruction || undefined,
        temperature: settings.temperature,
        structured: settings.structuredOutput,
      };

      try {
        if (settings.streaming && !settings.structuredOutput) {
          const typewriter = createStreamTypewriter(updateLastAssistantMessage);
          await streamGeminiResponse(payload, (chunk) => {
            typewriter.push(chunk);
          });
          await typewriter.done();
          return;
        }

        const response = await generateGeminiResponse(payload);

        if (isStructuredData(response.structuredData)) {
          const structuredData = response.structuredData;
          await typeText(structuredData.answer, updateLastAssistantMessage);
          useChatStore.setState((state) => {
            const updated = [...state.messages];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0) {
              updated[lastIndex] = {
                ...updated[lastIndex],
                structuredData,
              };
            }
            return { messages: updated };
          });
          return;
        }

        await typeText(response.text, updateLastAssistantMessage);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Mesaj gönderilirken bir hata oluştu.";
        setError(message);

        useChatStore.setState((state) => {
          const next = [...state.messages];
          const lastIndex = next.length - 1;
          const lastMessage = next[lastIndex];

          if (
            lastIndex >= 0 &&
            lastMessage.role === "assistant" &&
            !lastMessage.content.trim()
          ) {
            return { messages: next.slice(0, -1) };
          }

          return { messages: next };
        });
      } finally {
        setLoading(false);
      }
    },
    [
      addMessage,
      isLoading,
      messages,
      setError,
      setLoading,
      settings,
      updateLastAssistantMessage,
    ],
  );

  return {
    messages,
    settings,
    isLoading,
    error,
    sendMessage,
    updateSettings,
    clearMessages,
  };
}
