"use client";

import { useEffect, useRef } from "react";

import { useAuthStore } from "@/stores/auth.store";
import { useChatStore } from "@/stores/chat.store";

/**
 * Keeps chat messages in sync with the signed-in account:
 * - load history on login
 * - save history while chatting
 * - clear the visible session on logout (history stays for next login)
 */
export function ChatAccountSync({ hydrated }: { hydrated: boolean }) {
  const previousAccountIdRef = useRef<string | null | undefined>(undefined);
  const skipNextMessagePersistRef = useRef(false);

  useEffect(() => {
    if (!hydrated) return;

    const activeId = useAuthStore.getState().activeAccountId;
    previousAccountIdRef.current = activeId;

    if (activeId) {
      skipNextMessagePersistRef.current = true;
      useChatStore.getState().loadAccountHistory(activeId);
    } else {
      useChatStore.getState().clearSessionMessages();
    }

    const unsubAuth = useAuthStore.subscribe((state, prev) => {
      if (state.activeAccountId === prev.activeAccountId) {
        // Prune chat history when an account is removed
        if (state.accounts.length < prev.accounts.length) {
          const remaining = new Set(state.accounts.map((a) => a.id));
          for (const id of Object.keys(
            useChatStore.getState().historiesByAccountId,
          )) {
            if (!remaining.has(id)) {
              useChatStore.getState().removeAccountHistory(id);
            }
          }
        }
        return;
      }

      const prevId = prev.activeAccountId;
      const nextId = state.activeAccountId;

      if (prevId) {
        useChatStore.getState().persistAccountHistory(prevId);
      }

      previousAccountIdRef.current = nextId;
      skipNextMessagePersistRef.current = true;

      if (nextId) {
        const history =
          useChatStore.getState().historiesByAccountId[nextId] ?? [];
        const currentMessages = useChatStore.getState().messages;

        if (history.length === 0 && currentMessages.length > 0) {
          // Keep in-progress guest chat as this account's first history
          useChatStore.getState().persistAccountHistory(nextId);
        } else {
          useChatStore.getState().loadAccountHistory(nextId);
        }
      } else {
        useChatStore.getState().clearSessionMessages();
      }
    });

    const unsubChat = useChatStore.subscribe((state, prev) => {
      if (state.messages === prev.messages) return;

      if (skipNextMessagePersistRef.current) {
        skipNextMessagePersistRef.current = false;
        return;
      }

      const accountId = useAuthStore.getState().activeAccountId;
      if (!accountId) return;

      useChatStore.getState().persistAccountHistory(accountId);
    });

    return () => {
      unsubAuth();
      unsubChat();
    };
  }, [hydrated]);

  return null;
}
