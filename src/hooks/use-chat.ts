"use client";

import { useCallback } from "react";

import {
  generateGeminiResponse,
  streamGeminiResponse,
} from "@/lib/api/gemini-client";
import type { ChatStructuredResponse } from "@/server/schemas/chat-response.schema";
import { useChatStore } from "@/stores/chat.store";
import type { ChatMessage } from "@/types/chat.types";

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
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || isLoading) return;

      const userMessage: ChatMessage = {
        id: createMessageId(),
        role: "user",
        content: trimmed,
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

      const payload = {
        prompt: trimmed,
        model: settings.model,
        systemInstruction: settings.systemInstruction || undefined,
        temperature: settings.temperature,
        structured: settings.structuredOutput,
      };

      try {
        if (settings.streaming && !settings.structuredOutput) {
          await streamGeminiResponse(payload, (chunk) => {
            updateLastAssistantMessage(chunk);
          });
          return;
        }

        const response = await generateGeminiResponse(payload);

        if (isStructuredData(response.structuredData)) {
          const structuredData = response.structuredData;
          useChatStore.setState((state) => {
            const updated = [...state.messages];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0) {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: structuredData.answer,
                structuredData,
              };
            }
            return { messages: updated };
          });
          return;
        }

        useChatStore.setState((state) => {
          const updated = [...state.messages];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0) {
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: response.text,
            };
          }
          return { messages: updated };
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Mesaj gönderilirken bir hata oluştu.";
        setError(message);

        useChatStore.setState((state) => {
          const messages = [...state.messages];
          const lastIndex = messages.length - 1;
          const lastMessage = messages[lastIndex];

          if (
            lastIndex >= 0 &&
            lastMessage.role === "assistant" &&
            !lastMessage.content.trim()
          ) {
            return { messages: messages.slice(0, -1) };
          }

          return { messages };
        });
      } finally {
        setLoading(false);
      }
    },
    [
      addMessage,
      isLoading,
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
