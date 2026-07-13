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
  collectPriorReferenceImages,
  detectAspectRatio,
  enhanceImageEditPrompt,
  enhanceImagePrompt,
  isImageGenerationPrompt,
  shouldRouteToImageEdit,
} from "@/lib/chat/image-prompt";
import { cacheMessageImages } from "@/lib/chat/session-image-cache";
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
import {
  FREE_SIGNED_IN_VIDEO_LIMIT,
  GUEST_VIDEO_LIMIT,
  useVideoQuotaStore,
} from "@/stores/video-quota.store";
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

const IMAGE_ONLY_PROMPT = "Bu görseli incele.";
const MEDIA_STATUS_RE = /(üretiliyor|oluşturuluyor|üretim|bekleyin|sürebilir)/i;

function isStructuredData(value: unknown): value is ChatStructuredResponse {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.answer === "string" &&
    typeof record.confidence === "number" &&
    Array.isArray(record.followUpQuestions)
  );
}

function removeFailedAssistantTurn() {
  useChatStore.setState((state) => {
    const next = [...state.messages];
    const lastIndex = next.length - 1;
    const lastMessage = next[lastIndex];

    if (lastIndex < 0 || lastMessage.role !== "assistant") {
      return { messages: next };
    }

    const content = lastMessage.content.trim();
    const hasMedia =
      Boolean(lastMessage.images?.length) || Boolean(lastMessage.videos?.length);
    const isPlaceholder = !content || MEDIA_STATUS_RE.test(content);

    if (!hasMedia && isPlaceholder) {
      return { messages: next.slice(0, -1) };
    }

    return { messages: next };
  });
}

export function useChat() {
  const {
    messages,
    settings,
    isLoading,
    error,
    addMessage,
    updateLastAssistantMessage,
    setLastAssistantContent,
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
      if (
        (!trimmed && attachments.length === 0) ||
        useChatStore.getState().isLoading
      ) {
        return;
      }

      const mode: OrwixMode = options.mode ?? "general";
      const apiImages = attachments.map(({ mimeType, data, name }) => ({
        mimeType,
        data,
        name,
      }));

      const userMessage: ChatMessage = {
        id: createMessageId(),
        role: "user",
        content:
          trimmed || (attachments.length > 0 ? IMAGE_ONLY_PROMPT : ""),
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

      // Lock before mutating so rapid double-submit cannot race.
      setLoading(true);
      setError(null);
      addMessage(userMessage);
      addMessage(assistantMessage);

      if (userMessage.images?.length) {
        cacheMessageImages(userMessage.id, userMessage.images);
      }

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
        const accountId = useAuthStore.getState().activeAccountId;
        const videoQuota = useVideoQuotaStore.getState();

        if (!videoQuota.canGenerate(accountId)) {
          if (!accountId) {
            setLastAssistantContent(
              `Ücretsiz video hakkın (${GUEST_VIDEO_LIMIT}) bitti. Giriş yaparsan ${FREE_SIGNED_IN_VIDEO_LIMIT} video hakkı daha tanınır.`,
            );
            useImageQuotaStore.getState().openLoginModal();
          } else {
            setLastAssistantContent(
              `Ücretsiz video hakkınız (${FREE_SIGNED_IN_VIDEO_LIMIT}) doldu.`,
            );
          }
          setLoading(false);
          return;
        }

        try {
          setLastAssistantContent("Video oluşturuluyor…");

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

          videoQuota.consume(accountId);
          const remaining = useVideoQuotaStore
            .getState()
            .getRemaining(accountId);
          const remainingLabel = Number.isFinite(remaining)
            ? ` Kalan video hakkı: ${remaining}.`
            : "";

          const caption =
            (videoResult.text.trim() || "Video hazır.") + remainingLabel;

          useChatStore.setState((state) => {
            const updated = [...state.messages];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: caption,
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
          removeFailedAssistantTurn();
        } finally {
          setLoading(false);
        }
        return;
      }

      const priorReferenceImages = collectPriorReferenceImages(messages);

      const wantsImageEdit = shouldRouteToImageEdit(trimmed, {
        hasPriorImages: priorReferenceImages.length > 0,
        hasAttachments: attachments.length > 0,
      });

      const wantsImage =
        mode === "image" ||
        isImageGenerationPrompt(trimmed) ||
        wantsImageEdit;

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
          setLastAssistantContent("Görsel oluşturuluyor…");

          const promptForApi = referenceImages?.length
            ? enhanceImageEditPrompt(trimmed)
            : enhanceImagePrompt(trimmed || "Kaliteli bir görsel üret.");

          const imageResult = await generateGeminiImage({
            prompt: promptForApi,
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

          useChatStore.setState((state) => {
            const updated = [...state.messages];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
              const assistantId = updated[lastIndex].id;
              const nextImages = imageResult.images.map((image) => ({
                mimeType: image.mimeType,
                dataUrl: image.dataUrl,
              }));

              cacheMessageImages(assistantId, nextImages);

              updated[lastIndex] = {
                ...updated[lastIndex],
                content: caption,
                images: nextImages,
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
          removeFailedAssistantTurn();
        } finally {
          setLoading(false);
        }
        return;
      }

      // Exclude the just-added user + empty assistant so we don't duplicate the turn.
      const prior = useChatStore
        .getState()
        .messages.slice(0, -2)
          .filter((message) => message.content.trim().length > 0)
          .slice(-8)
          .map((message) => ({
            role: message.role,
            content:
              message.content.length > 2500
                ? `${message.content.slice(0, 2500)}…`
                : message.content,
        }));

      const history = [
        ...prior,
        {
          role: "user" as const,
          content: trimmed || (attachments.length > 0 ? IMAGE_ONLY_PROMPT : trimmed),
        },
      ];

      const systemInstruction = buildSystemInstruction(
        settings.systemInstruction,
        mode,
      );

      // Pro = kalite. Diğer her şey = Flash-Lite (3.5 Flash şu an yavaş/503).
      const chatModel =
        settings.model === GEMINI_MODELS.PRO
          ? GEMINI_MODELS.PRO
          : GEMINI_MODELS.FLASH_LITE;

      const payload = {
        prompt: trimmed || (attachments.length > 0 ? IMAGE_ONLY_PROMPT : ""),
        history,
        images: apiImages,
        model: chatModel,
        temperature: settings.temperature,
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
        removeFailedAssistantTurn();
      } finally {
        setLoading(false);
      }
    },
    [
      addMessage,
      messages,
      setError,
      setLastAssistantContent,
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
