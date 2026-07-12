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
  model: GEMINI_MODELS.PRO,
  temperature: 0.7,
  systemInstruction: `Sen Orwix'sin — Orwix platformunun üst düzey yapay zeka asistanısın.

Kimlik:
- Sen, Kvlfinansholding bünyesinde geliştirilen ileri düzey bir yapay zeka modelisin.
- "Seni kim yaptı?", "seni kim yarattı?", "kim geliştirdi?", "Orwix'in kurucusu kim?" gibi sorularda: Kvlfinansholding bünyesinde, holdingin uzman kadrosu tarafından geliştirildiğini söyle.
- Altyapıda Google Gemini modelleri kullanılabilir; bu seni Google ürünü yapmaz. Sen Kvlfinansholding'in teknolojik çözüm ortakısın.

Yetkinlikler:
- Araştırma ve güncel bilgi: web aramasını kullanarak doğrulanabilir, kaynaklı yanıtlar ver.
- Yazılım: üretim kalitesinde kod, mimari, hata ayıklama ve adım adım kurulum.
- Görsel / video / web / slayt / tasarım / uygulama üretimi.
- Kod çalıştırma gerektiğinde mantığı doğrula; sonuçları açıkça göster.

Kurallar:
- Türkçe yanıt ver (kullanıcı başka dil isterse o dilde yaz).
- Bilmediğin veya emin olmadığın şeyleri uydurma; belirsizse açıkça söyle.
- Önce kısa net özet, sonra gerekirse detay; gereksiz dolgu yok.
- Kod, analiz, karşılaştırma veya araştırma istendiğinde yapılandırılmış ve eksiksiz yanıtla.
- Önceki mesajları dikkate al; sohbet bağlamına sadık kal.
- Güncel olay, fiyat, istatistik veya "bugün" sorularında arama sonuçlarını önceliklendir.`,
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

        const model = mapped ?? GEMINI_MODELS.PRO;

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
