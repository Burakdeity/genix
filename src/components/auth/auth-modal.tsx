"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { AccountPicker } from "@/components/auth/account-picker";
import { GoogleAuthProvider } from "@/components/auth/google-auth-provider";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";

export function AuthModal() {
  const [mounted, setMounted] = useState(false);

  const authModalOpen = useAuthStore((state) => state.authModalOpen);
  const view = useAuthStore((state) => state.view);
  const closeAuthModal = useAuthStore((state) => state.closeAuthModal);
  const setView = useAuthStore((state) => state.setView);
  const setSignInEmail = useAuthStore((state) => state.setSignInEmail);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !authModalOpen) {
    return null;
  }

  // Portal escapes layout stacking contexts; wrap again so OAuth hooks
  // always have a provider even when rendered under document.body.
  return createPortal(
    <GoogleAuthProvider>
      <div className="fixed inset-0 z-[300]">
        {view === "sign-in" ? (
          <SignInPanel
            onBack={() => {
              setSignInEmail(null);
              setView("picker");
            }}
            onClose={closeAuthModal}
          />
        ) : (
          <div className="relative min-h-[100dvh]">
            <button
              type="button"
              onClick={closeAuthModal}
              className={cn(
                "absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 flex size-10 items-center justify-center rounded-full",
                "bg-white/80 text-[#444746] shadow-sm hover:bg-white",
              )}
              aria-label="Kapat"
            >
              ✕
            </button>
            <AccountPicker />
          </div>
        )}
      </div>
    </GoogleAuthProvider>,
    document.body,
  );
}
