import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AuthView, UserAccount } from "@/types/auth.types";

const DEFAULT_ACCOUNTS: UserAccount[] = [];

interface AuthState {
  accounts: UserAccount[];
  activeAccountId: string | null;
  authModalOpen: boolean;
  view: AuthView;
  signInEmail: string | null;
  openAuthModal: (view?: AuthView) => void;
  closeAuthModal: () => void;
  setView: (view: AuthView) => void;
  setSignInEmail: (email: string | null) => void;
  signInWithAccount: (accountId: string) => void;
  signInWithGoogle: (name: string, email: string, picture?: string) => void;
  signOut: () => void;
  removeAccount: (accountId: string) => void;
  getActiveAccount: () => UserAccount | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accounts: DEFAULT_ACCOUNTS,
      activeAccountId: null,
      authModalOpen: false,
      view: "picker",
      signInEmail: null,

      openAuthModal: (view = "picker") =>
        set({ authModalOpen: true, view, signInEmail: null }),

      closeAuthModal: () =>
        set({ authModalOpen: false, view: "picker", signInEmail: null }),

      setView: (view) => set({ view }),

      setSignInEmail: (email) => set({ signInEmail: email }),

      signInWithAccount: (accountId) => {
        const account = get().accounts.find((item) => item.id === accountId);
        if (!account) return;

        if (account.signedOut) {
          set({
            signInEmail: account.email,
            view: "sign-in",
            authModalOpen: true,
          });
          return;
        }

        set({
          activeAccountId: accountId,
          view: "picker",
          authModalOpen: false,
        });
      },

      signInWithGoogle: (name, email, picture) => {
        const normalizedEmail = email.trim().toLowerCase();
        const existing = get().accounts.find(
          (item) => item.email.toLowerCase() === normalizedEmail,
        );

        if (existing) {
          set({
            accounts: get().accounts.map((item) =>
              item.id === existing.id
                ? {
                    ...item,
                    name,
                    email: normalizedEmail,
                    picture,
                    signedOut: false,
                  }
                : item,
            ),
            activeAccountId: existing.id,
            view: "picker",
            signInEmail: null,
            authModalOpen: false,
          });
          return;
        }

        const newAccount: UserAccount = {
          id: crypto.randomUUID(),
          name,
          email: normalizedEmail,
          avatarColor: "#1a73e8",
          picture,
          provider: "google",
          signedOut: false,
        };

        set({
          accounts: [...get().accounts, newAccount],
          activeAccountId: newAccount.id,
          view: "picker",
          signInEmail: null,
          authModalOpen: false,
        });
      },

      signOut: () => {
        const { activeAccountId } = get();
        if (!activeAccountId) return;

        set({
          accounts: get().accounts.map((item) =>
            item.id === activeAccountId ? { ...item, signedOut: true } : item,
          ),
          activeAccountId: null,
          view: "picker",
        });
      },

      removeAccount: (accountId) => {
        const { activeAccountId } = get();
        set({
          accounts: get().accounts.filter((item) => item.id !== accountId),
          activeAccountId:
            activeAccountId === accountId ? null : activeAccountId,
        });
      },

      getActiveAccount: () => {
        const { accounts, activeAccountId } = get();
        if (!activeAccountId) return null;
        return accounts.find((item) => item.id === activeAccountId) ?? null;
      },
    }),
    {
      name: "orwix-auth",
      skipHydration: true,
      partialize: (state) => ({
        accounts: state.accounts,
        activeAccountId: state.activeAccountId,
      }),
    },
  ),
);
