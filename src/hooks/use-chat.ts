"use client";

import { useCallback } from "react";

import {
  generateGeminiImage,
  generateGeminiResponse,
  generateGeminiVideo,
  streamGeminiResponse,
} from "@/lib/api/gemini-client";
import { getEasterEggReply } from "@/lib/chat/easter-eggs";
import {
  dataUrlToInlineImage,
  detectAspectRatio,
  enhanceImagePrompt,
  isImageEditPrompt,
  isImageGenerationPrompt,
} from "@/lib/chat/image-prompt";
import {
  buildSystemInstruction,
  shouldEnableCodeExecution,
  shouldEnableSearch,
} from "@/lib/chat/mode-prompts";
import {
  enhanceVideoPrompt,
  isVideoGenerationPrompt,
} from "@/lib/chat/video-prompt";
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
import type {
  ChatAttachment,
  ChatMessage,
  SendMessageOptions,
} from "@/types/chat.types";
import type { OrwixMode } from "@/content/orwix-content";
import {
  GEMINI_IMAGE_MODELS,
  GEMINI_MODELS,
  GEMINI_VIDEO_MODELS,
} from "@/server/types/gemini.types";

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
    async (
      prompt: string,
      attachments: ChatAttachment[] = [],
      options: SendMessageOptions = {},
    ) => {
      const trimmed = prompt.trim();
      if ((!trimmed && attachments.length === 0) || isLoading) return;

      const mode: OrwixMode = options.mode ?? "general";
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

      const wantsVideo =
        mode === "video" || isVideoGenerationPrompt(trimmed);

      if (wantsVideo) {
        try {
          await typeText(
            "Video üretiliyor (Veo)… Bu 1–2 dakika sürebilir.\n",
            updateLastAssistantMessage,
          );

          const videoResult = await generateGeminiVideo({
            prompt: enhanceVideoPrompt(trimmed),
            model:
              settings.model === GEMINI_MODELS.PRO
                ? GEMINI_VIDEO_MODELS.PRO
                : GEMINI_VIDEO_MODELS.FAST,
            aspectRatio: /\b(9:16|dikey|story|reels)\b/i.test(trimmed)
              ? "9:16"
              : "16:9",
          });

          await typeText(
            videoResult.text.trim() || "Video hazır.",
            updateLastAssistantMessage,
          );

          useChatStore.setState((state) => {
            const updated = [...state.messages];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
              updated[lastIndex] = {
                ...updated[lastIndex],
                videos: videoResult.videos.map((video) => ({
                  mimeType: video.mimeType,
                  dataUrl: video.dataUrl,
                })),
              };
            }
            return { messages: updated };
          });
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Video üretilirken bir hata oluştu.";
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

      const priorReferenceImages = messages
        .slice()
        .reverse()
        .flatMap((message) => message.images ?? [])
        .slice(0, 1)
        .map((image) => dataUrlToInlineImage(image.dataUrl, image.mimeType))
        .filter(
          (image): image is { mimeType: string; data: string } => image !== null,
        );

      const wantsImage =
        mode === "image" ||
        isImageGenerationPrompt(trimmed) ||
        (attachments.length > 0 && isImageEditPrompt(trimmed)) ||
        (priorReferenceImages.length > 0 && isImageEditPrompt(trimmed));

      if (wantsImage) {
        const accountId = useAuthStore.getState().activeAccountId;
        const quota = useImageQuotaStore.getState();

        if (!quota.canGenerate(accountId)) {
          if (!accountId) {
            updateLastAssistantMessage(
              `Ücretsiz görsel hakkın (${GUEST_IMAGE_LIMIT}) bitti. Giriş yaparsan hemen ${FREE_SIGNED_IN_IMAGE_LIMIT} görsel hakkı daha tanınır.`,
            );
            quota.openLoginModal();
          } else {
            updateLastAssistantMessage(
              `Ücretsiz görsel hakkınız (${FREE_SIGNED_IN_IMAGE_LIMIT}) doldu. Sınırsız üretim için Pro plana geçin.`,
            );
            quota.openProModal();
          }
          setLoading(false);
          return;
        }

        const preferQuality = settings.model === GEMINI_MODELS.PRO;
        const referenceImages =
          apiImages.length > 0
            ? apiImages
            : priorReferenceImages.length > 0
              ? priorReferenceImages
              : undefined;

        try {
          updateLastAssistantMessage("Görsel üretiliyor…");

          const imageResult = await generateGeminiImage({
            prompt: enhanceImagePrompt(
              trimmed ||
                (referenceImages?.length
                  ? "Bu görselleri referans alarak istenen değişikliği uygula."
                  : "Kaliteli bir görsel üret."),
            ),
            model: preferQuality
              ? GEMINI_IMAGE_MODELS.PRO
              : GEMINI_IMAGE_MODELS.FLASH_NEW,
            aspectRatio: detectAspectRatio(trimmed),
            imageSize: preferQuality ? "2K" : "1K",
            images: referenceImages,
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

          updateLastAssistantMessage(caption);

          useChatStore.setState((state) => {
            const updated = [...state.messages];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: caption,
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
          .slice(-4)
          .map((message) => ({
            role: message.role,
            content:
              message.content.length > 1500
                ? `${message.content.slice(0, 1500)}…`
                : message.content,
          })),
        {
          role: "user" as const,
          content:
            trimmed ||
            (attachments.length > 0 ? "Bu görseli incele." : trimmed),
        },
      ];

      const systemInstruction = buildSystemInstruction(
        settings.systemInstruction,
        mode,
      );

      const preferSpeed = settings.model !== GEMINI_MODELS.PRO;
      const payload = {
        prompt: trimmed,
        history,
        images: apiImages,
        model: preferSpeed ? GEMINI_MODELS.FLASH_LITE : GEMINI_MODELS.PRO,
        systemInstruction: systemInstruction || undefined,
        structured: settings.structuredOutput,
        enableSearch: shouldEnableSearch(trimmed, mode),
        enableCodeExecution: shouldEnableCodeExecution(trimmed, mode),
      };

      try {
        if (settings.streaming && !settings.structuredOutput) {
          const typewriter = createStreamTypewriter(updateLastAssistantMessage);
          await streamGeminiResponse(
            payload,
            (chunk) => {
              typewriter.push(chunk);
            },
            (sources) => {
              useChatStore.setState((state) => {
                const updated = [...state.messages];
                const lastIndex = updated.length - 1;
                if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
                  updated[lastIndex] = {
                    ...updated[lastIndex],
                    sources,
                  };
                }
                return { messages: updated };
              });
            },
          );
          await typewriter.done();
          return;
        }

        const response = await generateGeminiResponse({
          ...payload,
          temperature: settings.temperature,
        });

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
                ...(response.sources?.length
                  ? { sources: response.sources }
                  : {}),
              };
            }
            return { messages: updated };
          });
          return;
        }

        await typeText(response.text, updateLastAssistantMessage);
        if (response.sources?.length) {
          useChatStore.setState((state) => {
            const updated = [...state.messages];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
              updated[lastIndex] = {
                ...updated[lastIndex],
                sources: response.sources,
              };
            }
            return { messages: updated };
          });
        }
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
