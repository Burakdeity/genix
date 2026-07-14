import { create } from "zustand";
import { persist } from "zustand/middleware";

import { GEMINI_MODELS } from "@/server/types/gemini.types";
import type { ChatMessage, ChatSettings } from "@/types/chat.types";

const MAX_MESSAGES_PER_ACCOUNT = 120;

interface ChatState {
  messages: ChatMessage[];
  /** Persisted chat history keyed by auth account id */
  historiesByAccountId: Record<string, ChatMessage[]>;
  settings: ChatSettings;
  isLoading: boolean;
  error: string | null;
  addMessage: (message: ChatMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  updateSettings: (settings: Partial<ChatSettings>) => void;
  clearMessages: () => void;
  loadAccountHistory: (accountId: string) => void;
  persistAccountHistory: (accountId: string) => void;
  clearSessionMessages: () => void;
  removeAccountHistory: (accountId: string) => void;
}

const defaultSettings: ChatSettings = {
  model: GEMINI_MODELS.FLASH_LITE,
  temperature: 1,
  systemInstruction: `Sen Orwix'sin (Kvlfinansholding). Kısa, net, Türkçe yanıt ver. Uydurma.`,
  structuredOutput: false,
  streaming: true,
};

function trimHistory(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= MAX_MESSAGES_PER_ACCOUNT) return messages;
  return messages.slice(messages.length - MAX_MESSAGES_PER_ACCOUNT);
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      historiesByAccountId: {},
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

      loadAccountHistory: (accountId) => {
        const history = get().historiesByAccountId[accountId] ?? [];
        set({
          messages: history,
          error: null,
          isLoading: false,
        });
      },

      persistAccountHistory: (accountId) => {
        const messages = trimHistory(get().messages);
        set((state) => ({
          historiesByAccountId: {
            ...state.historiesByAccountId,
            [accountId]: messages,
          },
        }));
      },

      clearSessionMessages: () =>
        set({ messages: [], error: null, isLoading: false }),

      removeAccountHistory: (accountId) =>
        set((state) => {
          const next = { ...state.historiesByAccountId };
          delete next[accountId];
          return { historiesByAccountId: next };
        }),
    }),
    {
      name: "orwix-chat-history",
      skipHydration: true,
      partialize: (state) => ({
        historiesByAccountId: state.historiesByAccountId,
        settings: {
          model: state.settings.model,
        },
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as {
          historiesByAccountId?: Record<string, ChatMessage[]>;
          settings?: { model?: string };
        };

        const legacyModelMap: Record<string, ChatSettings["model"]> = {
          "gemini-2.5-pro": GEMINI_MODELS.PRO,
          "gemini-2.5-flash": GEMINI_MODELS.FLASH,
          "gemini-2.5-flash-lite": GEMINI_MODELS.FLASH_LITE,
          "gemini-2.5-pro-latest": GEMINI_MODELS.PRO,
          "gemini-2.5-flash-latest": GEMINI_MODELS.FLASH,
          "gemini-pro-latest": GEMINI_MODELS.PRO,
          "gemini-flash-latest": GEMINI_MODELS.FLASH,
          "gemini-flash-lite-latest": GEMINI_MODELS.FLASH_LITE,
          "gemini-3-pro-preview": GEMINI_MODELS.PRO,
          "gemini-3-flash-preview": GEMINI_MODELS.FLASH,
          "gemini-3.1-pro-preview": GEMINI_MODELS.PRO,
          "gemini-3.5-flash": GEMINI_MODELS.FLASH,
          "gemini-3.1-flash-lite": GEMINI_MODELS.FLASH_LITE,
        };

        const persistedModel = p.settings?.model;
        const mapped =
          (persistedModel && legacyModelMap[persistedModel]) ||
          (Object.values(GEMINI_MODELS).includes(
            persistedModel as ChatSettings["model"],
          )
            ? (persistedModel as ChatSettings["model"])
            : undefined);

        // Always prefer Flash-Lite after reload unless user picks Kalite (Pro).
        const model =
          mapped === GEMINI_MODELS.PRO
            ? GEMINI_MODELS.PRO
            : GEMINI_MODELS.FLASH_LITE;

        return {
          ...current,
          historiesByAccountId:
            p.historiesByAccountId ?? current.historiesByAccountId,
          settings: {
            ...current.settings,
            model,
          },
        };
      },
    },
  ),
);
