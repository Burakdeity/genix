"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";

import { OrwixWordmark } from "@/components/brand/orwix-logo";
import { BackgroundPicker } from "@/components/theme/background-picker";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ClientOnly } from "@/components/ui/client-only";
import { Button } from "@/components/ui/button";
import { ORWIX_HEADER_NAV } from "@/content/orwix-content";
import { useAuthStore } from "@/stores/auth.store";
import { useChatStore } from "@/stores/chat.store";
import { cn } from "@/lib/utils";

function AuthButtons({ className }: { className?: string }) {
  const openAuthModal = useAuthStore((state) => state.openAuthModal);

  return (
    <div className={cn("flex shrink-0 items-center gap-0.5 sm:gap-2", className)}>
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

function ContactMenu({
  align = "end",
  className,
}: {
  align?: "start" | "center" | "end";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { label, name, phoneDisplay, whatsappUrl } = ORWIX_HEADER_NAV.contact;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "orwix-nav-link inline-flex size-9 items-center justify-center gap-1 rounded-lg text-sm transition-all hover:bg-primary/10 sm:h-9 sm:w-auto sm:px-3",
        )}
      >
        <MessageCircle className="size-4 shrink-0 text-primary" />
        <span className="hidden font-medium sm:inline">{label}</span>
        <ChevronDown
          className={cn(
            "hidden size-3.5 opacity-60 transition-transform sm:block",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          className={cn(
            "orwix-glass z-50 rounded-xl p-3 shadow-xl",
            // Mobile: keep the panel fully inside the viewport
            "fixed left-3 right-3 top-[4.75rem] w-auto sm:absolute sm:left-auto sm:right-auto sm:top-full sm:mt-2 sm:w-[min(18rem,calc(100vw-2rem))]",
            align === "end" && "sm:right-0",
            align === "start" && "sm:left-0",
            align === "center" && "sm:left-1/2 sm:-translate-x-1/2",
          )}
        >
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="mt-1 text-xs text-muted-foreground">WhatsApp</p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex min-h-11 items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 active:bg-primary/15"
            onClick={() => setOpen(false)}
          >
            <MessageCircle className="size-4 shrink-0 text-primary" />
            <span className="break-all">{phoneDisplay}</span>
          </a>
        </div>
      ) : null}
    </div>
  );
}

export function OrwixHeader() {
  const clearMessages = useChatStore((state) => state.clearMessages);

  const goHome = () => {
    clearMessages();
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
            <ContactMenu align="end" />
            <ClientOnly
              fallback={<div className="hidden size-9 shrink-0 sm:block" />}
            >
              <BackgroundPicker className="hidden sm:block" />
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
