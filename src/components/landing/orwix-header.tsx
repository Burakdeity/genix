"use client";

import { ChevronDown, Clock, SquarePen } from "lucide-react";

import { ProfileMenu } from "@/components/auth/profile-menu";
import { OrwixWordmark } from "@/components/brand/orwix-logo";
import { BackgroundPicker } from "@/components/theme/background-picker";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ClientOnly } from "@/components/ui/client-only";
import { Button } from "@/components/ui/button";
import { ORWIX_HEADER_NAV } from "@/content/orwix-content";
import { useStoresHydrated } from "@/hooks/use-stores-hydrated";
import { useAuthStore } from "@/stores/auth.store";
import {
  GUEST_CHAT_ACCOUNT_ID,
  useChatStore,
} from "@/stores/chat.store";
import { cn } from "@/lib/utils";

function AuthButtons({ className }: { className?: string }) {
  const hydrated = useStoresHydrated();
  const activeAccountId = useAuthStore((state) => state.activeAccountId);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);

  if (!hydrated) {
    return (
      <div
        className={cn(
          "h-9 w-[148px] shrink-0 rounded-full bg-muted/40",
          className,
        )}
        aria-hidden
      />
    );
  }

  if (activeAccountId) {
    return (
      <div className={cn("flex shrink-0 items-center", className)}>
        <ProfileMenu align="header" />
      </div>
    );
  }

  return (
    <div
      className={cn("flex shrink-0 items-center gap-0.5 sm:gap-2", className)}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="orwix-nav-link h-9 rounded-full px-2 text-sm font-medium hover:bg-primary/10 sm:px-4"
        onClick={() => openAuthModal("picker")}
      >
        Giriş yap
      </Button>
      <Button
        type="button"
        size="sm"
        className="orwix-cta-btn h-9 shrink-0 rounded-full border-0 px-2.5 text-sm font-semibold text-white sm:px-5"
        onClick={() => openAuthModal("picker")}
      >
        Kaydol
      </Button>
    </div>
  );
}

export function OrwixHeader() {
  const activeAccountId = useAuthStore((state) => state.activeAccountId);
  const startNewChat = useChatStore((state) => state.startNewChat);
  const setHistoryOpen = useChatStore((state) => state.setHistoryOpen);

  const goHome = () => {
    startNewChat(activeAccountId ?? GUEST_CHAT_ACCOUNT_ID);
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.location.assign("/");
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="relative z-20 px-2 pt-3 sm:px-4 sm:pt-4 md:px-6">
      {/* Glass blur on a separate layer — backdrop-filter clips rounded children otherwise */}
      <div className="relative mx-auto h-14 max-w-6xl">
        <div
          className="orwix-glass pointer-events-none absolute inset-0 rounded-2xl"
          aria-hidden
        />
        <div className="relative z-10 flex h-full items-center justify-between gap-1 px-2 sm:gap-3 sm:px-3 md:gap-4 md:px-5">
          <button
            type="button"
            onClick={goHome}
            className="shrink-0 rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            aria-label="Ana sayfaya git"
          >
            <OrwixWordmark className="h-6 w-auto sm:h-8" />
          </button>

          <nav className="hidden flex-1 items-center justify-center gap-0.5 lg:flex">
            {ORWIX_HEADER_NAV.dropdowns.map((item) => (
              <button
                key={item}
                type="button"
                className="orwix-nav-link flex items-center gap-0.5 rounded-lg px-3 py-2 text-sm transition-all hover:bg-primary/10"
              >
                {item}
                <ChevronDown className="size-3.5 opacity-60" />
              </button>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              onClick={goHome}
              title="Yeni sohbet"
              aria-label="Yeni sohbet"
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
            >
              <SquarePen className="size-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              title="Geçmiş"
              aria-label="Sohbet geçmişi"
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
            >
              <Clock className="size-4" strokeWidth={1.75} />
            </button>
            <ClientOnly fallback={<div className="size-9 shrink-0" />}>
              <BackgroundPicker />
            </ClientOnly>
            <ClientOnly fallback={<div className="size-9 shrink-0" />}>
              <ThemeToggle />
            </ClientOnly>
            <AuthButtons />
          </div>
        </div>
      </div>
    </header>
  );
}
