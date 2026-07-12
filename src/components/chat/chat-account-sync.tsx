"use client";

import { useEffect, useRef } from "react";

import { useAuthStore } from "@/stores/auth.store";
import {
  GUEST_CHAT_ACCOUNT_ID,
  useChatStore,
} from "@/stores/chat.store";

function resolveAccountId(accountId: string | null): string {
  return accountId ?? GUEST_CHAT_ACCOUNT_ID;
}

function restoreActiveSession(accountId: string) {
  const store = useChatStore.getState();
  const sessions = store.sessionsByAccountId[accountId] ?? [];
  const activeId = store.activeSessionId;
  const match = activeId
    ? sessions.find((session) => session.id === activeId)
    : null;

  if (match) {
    store.loadSession(accountId, match.id);
    return;
  }

  store.clearSessionMessages();
}

/**
 * Keeps chat sessions in sync with the signed-in account:
 * - restore the last open session on load
 * - save active session while chatting
 * - clear the visible session on logout (history stays for next login)
 * - persist guest sessions under a local guest key
 */
export function ChatAccountSync({ hydrated }: { hydrated: boolean }) {
  const skipNextMessagePersistRef = useRef(false);

  useEffect(() => {
    if (!hydrated) return;

    const activeId = useAuthStore.getState().activeAccountId;
    skipNextMessagePersistRef.current = true;
    restoreActiveSession(resolveAccountId(activeId));

    const unsubAuth = useAuthStore.subscribe((state, prev) => {
      if (state.activeAccountId === prev.activeAccountId) {
        if (state.accounts.length < prev.accounts.length) {
          const remaining = new Set(state.accounts.map((a) => a.id));
          for (const id of Object.keys(
            useChatStore.getState().sessionsByAccountId,
          )) {
            if (id === GUEST_CHAT_ACCOUNT_ID) continue;
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
        useChatStore.getState().persistActiveSession(prevId);
      } else if (useChatStore.getState().messages.length > 0) {
        useChatStore.getState().persistActiveSession(GUEST_CHAT_ACCOUNT_ID);
      }

      skipNextMessagePersistRef.current = true;

      if (nextId) {
        const guestSessions =
          useChatStore.getState().sessionsByAccountId[
            GUEST_CHAT_ACCOUNT_ID
          ] ?? [];
        const currentMessages = useChatStore.getState().messages;

        if (currentMessages.length > 0) {
          useChatStore.getState().persistActiveSession(nextId);
        } else if (guestSessions.length > 0) {
          const accountSessions =
            useChatStore.getState().sessionsByAccountId[nextId] ?? [];
          if (accountSessions.length === 0) {
            useChatStore.setState((store) => ({
              sessionsByAccountId: {
                ...store.sessionsByAccountId,
                [nextId]: guestSessions,
                [GUEST_CHAT_ACCOUNT_ID]: [],
              },
            }));
          }
        }

        restoreActiveSession(nextId);
      } else {
        restoreActiveSession(GUEST_CHAT_ACCOUNT_ID);
      }
    });

    const unsubChat = useChatStore.subscribe((state, prev) => {
      if (state.messages === prev.messages) return;

      if (skipNextMessagePersistRef.current) {
        skipNextMessagePersistRef.current = false;
        return;
      }

      if (state.messages.length === 0) return;

      const accountId = resolveAccountId(
        useAuthStore.getState().activeAccountId,
      );

      useChatStore.getState().persistActiveSession(accountId);
    });

    return () => {
      unsubAuth();
      unsubChat();
    };
  }, [hydrated]);

  return null;
}
