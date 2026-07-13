"use client";

import { useEffect, useMemo } from "react";
import { Search, X } from "lucide-react";

import { formatChatHistoryDate } from "@/lib/chat/format-chat-date";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import {
  GUEST_CHAT_ACCOUNT_ID,
  useChatStore,
} from "@/stores/chat.store";

interface ChatHistoryListProps {
  className?: string;
  onSelect?: () => void;
  limit?: number;
}

export function ChatHistoryList({
  className,
  onSelect,
  limit = 30,
}: ChatHistoryListProps) {
  const accountId =
    useAuthStore((state) => state.activeAccountId) ?? GUEST_CHAT_ACCOUNT_ID;
  const sessionsByAccountId = useChatStore((state) => state.sessionsByAccountId);
  const activeSessionId = useChatStore((state) => state.activeSessionId);
  const loadSession = useChatStore((state) => state.loadSession);

  const sessions = useMemo(() => {
    const list = sessionsByAccountId[accountId] ?? [];
    return [...list]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit)
      .map((session) => ({
        id: session.id,
        title: session.title,
        updatedAt: session.updatedAt,
      }));
  }, [accountId, limit, sessionsByAccountId]);

  if (sessions.length === 0) {
    return (
      <div className={cn("px-1 py-6 text-sm text-muted-foreground", className)}>
        Henüz kayıtlı sohbet yok.
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <p className="mb-1 px-3 text-[13px] font-medium text-muted-foreground/80">
        En son
      </p>
      <ul className="flex flex-col">
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          return (
            <li key={session.id}>
              <button
                type="button"
                onClick={() => {
                  loadSession(accountId, session.id);
                  onSelect?.();
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-4 rounded-lg px-3 py-3 text-left transition-colors",
                  "hover:bg-muted/60",
                  isActive && "bg-muted/50",
                )}
              >
                <span className="min-w-0 flex-1 truncate text-[15px] font-medium tracking-[-0.01em] text-foreground">
                  {session.title}
                </span>
                <span className="shrink-0 text-[13px] text-muted-foreground">
                  {formatChatHistoryDate(session.updatedAt)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ChatHistoryPanel() {
  const open = useChatStore((state) => state.historyOpen);
  const setHistoryOpen = useChatStore((state) => state.setHistoryOpen);
  const activeAccountId = useAuthStore((state) => state.activeAccountId);

  useEffect(() => {
    if (!open) return;
    if (!activeAccountId) {
      setHistoryOpen(false);
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHistoryOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, activeAccountId, setHistoryOpen]);

  if (!open || !activeAccountId) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh] sm:pt-[14vh]">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]"
        aria-label="Geçmişi kapat"
        onClick={() => setHistoryOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sohbet geçmişi"
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-border/60 bg-background shadow-[0_24px_64px_rgba(12,25,24,0.16)]"
      >
        <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <p className="flex-1 text-sm text-muted-foreground">Sohbetlerde ara</p>
          <button
            type="button"
            onClick={() => setHistoryOpen(false)}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Kapat"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="max-h-[min(60vh,28rem)] overflow-y-auto px-2 py-3">
          <ChatHistoryList onSelect={() => setHistoryOpen(false)} />
        </div>
      </div>
    </div>
  );
}
