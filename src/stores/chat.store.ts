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
  temperature: 0.7,
  systemInstruction:
    "Sen Orwix'sin. Türkçe, net ve yardımcı yanıt ver. Basit sorularda 2-4 cümle yaz; uzun konularda önce özetle. Uydurma.",
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
          settings?: { model?: ChatSettings["model"] };
        };

        return {
          ...current,
          historiesByAccountId:
            p.historiesByAccountId ?? current.historiesByAccountId,
          settings: {
            ...current.settings,
            ...(p.settings?.model ? { model: p.settings.model } : {}),
          },
        };
      },
    },
  ),
);
