import { create } from "zustand";
import { persist } from "zustand/middleware";

import { GEMINI_MODELS } from "@/server/types/gemini.types";
import type { ChatMessage, ChatSettings } from "@/types/chat.types";

export const GUEST_CHAT_ACCOUNT_ID = "__guest__";
const MAX_SESSIONS_PER_ACCOUNT = 40;
const MAX_MESSAGES_PER_SESSION = 120;
/** Skip persisting huge base64 media so localStorage doesn't blow up / wipe history. */
const MAX_PERSISTED_DATA_URL_CHARS = 80_000;

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface ChatSessionSummary {
  id: string;
  title: string;
  updatedAt: number;
}

interface ChatState {
  messages: ChatMessage[];
  activeSessionId: string | null;
  /** Persisted chat sessions keyed by auth account id (or guest) */
  sessionsByAccountId: Record<string, ChatSession[]>;
  settings: ChatSettings;
  isLoading: boolean;
  error: string | null;
  historyOpen: boolean;
  addMessage: (message: ChatMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
  /** Replace (not append) the last assistant message body */
  setLastAssistantContent: (content: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  updateSettings: (settings: Partial<ChatSettings>) => void;
  setHistoryOpen: (open: boolean) => void;
  /** Archive current chat (if any) and start a blank session */
  startNewChat: (accountId?: string | null) => void;
  /** Load a saved session into the active view */
  loadSession: (accountId: string, sessionId: string) => void;
  /** Upsert the active conversation into persisted sessions */
  persistActiveSession: (accountId: string) => void;
  getSessionSummaries: (accountId: string) => ChatSessionSummary[];
  clearSessionMessages: () => void;
  removeAccountHistory: (accountId: string) => void;
  /** @deprecated use startNewChat — kept for call sites during transition */
  clearMessages: () => void;
}

const defaultSettings: ChatSettings = {
  model: GEMINI_MODELS.FLASH_LITE,
  temperature: 1,
  systemInstruction: `Sen Orwix'sin — Kvlfinansholding bünyesinde geliştirilen yapay zeka asistanı. Çıtan: sektör lideri asistan kalitesi.

Kurallar:
- Yazılı yanıtlarda resmi, ölçülü ve profesyonel Türkçe kullan. Arkadaşça hitap, samimi lakap veya fazla gündelik üslup kullanma.
- Kullanıcı başka dil istemedikçe Türkçe yanıt ver.
- Doğrudan en iyi cevabı ver. "Sorun nedir?", "Ne demek istedin?", "Daha fazla detay ver" diye tekrar tekrar sorma.
- Yeterli derinlikte yaz: ne bir cümleyle geçiştir ne de boş uzat. Gerekirse yapılandır (özet → adımlar → sonuç).
- Uydurma; emin değilsen kısaca belirt. Kaynak isterse net ayır.
- Kod, tarif, analiz veya tasarım istendiğinde eksiksiz, çalışır / uygulanabilir teslim et; iskelet veya "..." bırakma.
- Belirsizlikte tek net varsayım yapıp ilerle; varsayımı bir satırda söyle.
- Sohbet bağlamını, önceki görselleri ve kararları dikkate al.
- Rakip ürün adlarıyla ("ChatGPT gibi", "Gemini olarak") kendini tanıtma; sen Orwix'sin.`,
  structuredOutput: false,
  streaming: true,
};

function createSessionId(): string {
  return crypto.randomUUID();
}

function sanitizeMessagesForPersist(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    ...message,
    images: message.images?.map((image) => ({
      mimeType: image.mimeType,
      dataUrl:
        image.dataUrl.length > MAX_PERSISTED_DATA_URL_CHARS
          ? ""
          : image.dataUrl,
    })),
    videos: message.videos?.map((video) => ({
      mimeType: video.mimeType,
      dataUrl: "",
    })),
  }));
}

export function deriveChatTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find(
    (message) => message.role === "user" && message.content.trim(),
  );
  if (!firstUser) return "Yeni sohbet";

  const cleaned = firstUser.content
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 72);

  return cleaned || "Yeni sohbet";
}

function trimSessions(sessions: ChatSession[]): ChatSession[] {
  const sorted = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  return sorted.slice(0, MAX_SESSIONS_PER_ACCOUNT).map((session) => ({
    ...session,
    messages:
      session.messages.length > MAX_MESSAGES_PER_SESSION
        ? session.messages.slice(
            session.messages.length - MAX_MESSAGES_PER_SESSION,
          )
        : session.messages,
  }));
}

function upsertSession(
  sessions: ChatSession[],
  session: ChatSession,
): ChatSession[] {
  const without = sessions.filter((item) => item.id !== session.id);
  return trimSessions([session, ...without]);
}

function isChatMessageArray(value: unknown): value is ChatMessage[] {
  return (
    Array.isArray(value) &&
    (value.length === 0 ||
      (typeof value[0] === "object" &&
        value[0] !== null &&
        "role" in value[0] &&
        "content" in value[0]))
  );
}

function isChatSessionArray(value: unknown): value is ChatSession[] {
  return (
    Array.isArray(value) &&
    (value.length === 0 ||
      (typeof value[0] === "object" &&
        value[0] !== null &&
        "messages" in value[0] &&
        "title" in value[0]))
  );
}

/** Convert legacy flat message dumps into one session each. */
function migrateAccountHistories(
  histories: Record<string, unknown> | undefined,
  sessions: Record<string, ChatSession[]> | undefined,
): Record<string, ChatSession[]> {
  const next: Record<string, ChatSession[]> = { ...(sessions ?? {}) };

  if (!histories) return next;

  for (const [accountId, value] of Object.entries(histories)) {
    if (isChatSessionArray(value)) {
      next[accountId] = trimSessions(value);
      continue;
    }

    if (!isChatMessageArray(value) || value.length === 0) continue;
    if (next[accountId]?.length) continue;

    const updatedAt =
      value[value.length - 1]?.createdAt ??
      value[0]?.createdAt ??
      Date.now();

    next[accountId] = [
      {
        id: createSessionId(),
        title: deriveChatTitle(value),
        updatedAt,
        messages: sanitizeMessagesForPersist(value),
      },
    ];
  }

  return next;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      activeSessionId: null,
      sessionsByAccountId: {},
      settings: defaultSettings,
      isLoading: false,
      error: null,
      historyOpen: false,

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

      setLastAssistantContent: (content) =>
        set((state) => {
          const messages = [...state.messages];
          const lastIndex = messages.length - 1;

          if (lastIndex < 0 || messages[lastIndex].role !== "assistant") {
            return state;
          }

          messages[lastIndex] = {
            ...messages[lastIndex],
            content,
          };

          return { messages };
        }),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      updateSettings: (settings) =>
        set((state) => ({ settings: { ...state.settings, ...settings } })),
      setHistoryOpen: (open) => set({ historyOpen: open }),

      startNewChat: (accountId) => {
        const resolvedId = accountId ?? null;
        if (resolvedId && get().messages.length > 0) {
          get().persistActiveSession(resolvedId);
        }

        set({
          messages: [],
          activeSessionId: null,
          error: null,
          isLoading: false,
          historyOpen: false,
        });
      },

      clearMessages: () => {
        get().startNewChat(null);
      },

      loadSession: (accountId, sessionId) => {
        const sessions = get().sessionsByAccountId[accountId] ?? [];
        const session = sessions.find((item) => item.id === sessionId);
        if (!session) return;

        set({
          messages: session.messages,
          activeSessionId: session.id,
          error: null,
          isLoading: false,
          historyOpen: false,
        });
      },

      persistActiveSession: (accountId) => {
        const current = get().messages;
        if (current.length === 0) return;

        const existingSessions = get().sessionsByAccountId[accountId] ?? [];
        const activeId = get().activeSessionId ?? createSessionId();
        const previous = existingSessions.find((item) => item.id === activeId);
        const sanitized = sanitizeMessagesForPersist(current);

        const session: ChatSession = {
          id: activeId,
          title:
            previous?.title && previous.title !== "Yeni sohbet"
              ? previous.title
              : deriveChatTitle(sanitized),
          updatedAt: Date.now(),
          messages: sanitized,
        };

        set((state) => ({
          activeSessionId: activeId,
          sessionsByAccountId: {
            ...state.sessionsByAccountId,
            [accountId]: upsertSession(existingSessions, session),
          },
        }));
      },

      getSessionSummaries: (accountId) => {
        const sessions = get().sessionsByAccountId[accountId] ?? [];
        return [...sessions]
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .map((session) => ({
            id: session.id,
            title: session.title,
            updatedAt: session.updatedAt,
        }));
      },

      clearSessionMessages: () =>
        set({
          messages: [],
          activeSessionId: null,
          error: null,
          isLoading: false,
        }),

      removeAccountHistory: (accountId) =>
        set((state) => {
          const next = { ...state.sessionsByAccountId };
          delete next[accountId];
          return { sessionsByAccountId: next };
        }),
    }),
    {
      name: "orwix-chat-history",
      skipHydration: true,
      partialize: (state) => ({
        sessionsByAccountId: state.sessionsByAccountId,
        activeSessionId: state.activeSessionId,
        settings: {
          model: state.settings.model,
        },
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as {
          sessionsByAccountId?: Record<string, ChatSession[]>;
          /** Legacy flat message history */
          historiesByAccountId?: Record<string, unknown>;
          activeSessionId?: string | null;
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

        const model =
          mapped === GEMINI_MODELS.PRO
            ? GEMINI_MODELS.PRO
            : GEMINI_MODELS.FLASH_LITE;

        const sessionsByAccountId = migrateAccountHistories(
          p.historiesByAccountId,
          p.sessionsByAccountId ?? current.sessionsByAccountId,
        );

        return {
          ...current,
          sessionsByAccountId,
          activeSessionId: p.activeSessionId ?? current.activeSessionId,
          settings: {
            ...current.settings,
            model,
          },
        };
      },
    },
  ),
);
