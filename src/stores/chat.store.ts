import { create } from "zustand";

import { GEMINI_MODELS } from "@/server/types/gemini.types";
import type { ChatMessage, ChatSettings } from "@/types/chat.types";

interface ChatState {
  messages: ChatMessage[];
  settings: ChatSettings;
  isLoading: boolean;
  error: string | null;
  addMessage: (message: ChatMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  updateSettings: (settings: Partial<ChatSettings>) => void;
  clearMessages: () => void;
}

const defaultSettings: ChatSettings = {
  model: GEMINI_MODELS.FLASH_LITE,
  temperature: 0.7,
  systemInstruction:
    "Sen yardımcı, net ve profesyonel bir yapay zeka asistanısın. Türkçe yanıt ver.",
  structuredOutput: false,
  streaming: true,
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  settings: defaultSettings,
  isLoading: false,
  error: null,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateLastAssistantMessage: (content) =>
    set((state) => {
      const messages = [...state.messages];
      const lastIndex = messages.length - 1;

      if (lastIndex < 0 || messages[lastIndex].role !== "assistant") {
        return state;
      }

      messages[lastIndex] = {
        ...messages[lastIndex],
        content: messages[lastIndex].content + content,
      };

      return { messages };
    }),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  updateSettings: (settings) =>
    set((state) => ({ settings: { ...state.settings, ...settings } })),
  clearMessages: () => set({ messages: [], error: null }),
}));
