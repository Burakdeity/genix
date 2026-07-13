"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Clock, Minus, Sparkles, SquarePen } from "lucide-react";

import { ProfileMenu } from "@/components/auth/profile-menu";
import { OrwixWordmark } from "@/components/brand/orwix-logo";
import { BackgroundPicker } from "@/components/theme/background-picker";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ClientOnly } from "@/components/ui/client-only";
import { Button } from "@/components/ui/button";
import {
  ORWIX_HEADER_NAV,
  type OrwixMode,
  type OrwixNavItem,
} from "@/content/orwix-content";
import {
  ORWIX_PRO_PRICE_LABEL,
  ORWIX_PRO_PRICE_USD,
  PLAN_CARD_FEATURES,
} from "@/lib/billing/plans";
import { useStoresHydrated } from "@/hooks/use-stores-hydrated";
import { useAuthStore } from "@/stores/auth.store";
import {
  GUEST_CHAT_ACCOUNT_ID,
  useChatStore,
} from "@/stores/chat.store";
import { useImageQuotaStore } from "@/stores/image-quota.store";
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

type NavSelectOptions = { mode?: OrwixMode; autoSend?: boolean };

interface OrwixHeaderProps {
  onSelectPrompt?: (text: string, options?: NavSelectOptions) => void;
}

function useDropdownClose(open: boolean, onClose: () => void) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return rootRef;
}

function NavDropdown({
  label,
  items,
  open,
  onToggle,
  onClose,
  onSelectItem,
}: {
  label: string;
  items: ReadonlyArray<OrwixNavItem>;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSelectItem: (item: OrwixNavItem) => void;
}) {
  const menuId = useId();
  const rootRef = useDropdownClose(open, onClose);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={cn(
          "orwix-nav-link flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium tracking-[-0.01em] transition-all hover:bg-primary/10",
          open && "bg-primary/10 text-foreground",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={onToggle}
      >
        {label}
        <ChevronDown
          className={cn(
            "size-3.5 opacity-60 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="orwix-glass absolute left-1/2 top-[calc(100%+0.5rem)] z-50 w-72 -translate-x-1/2 overflow-hidden rounded-2xl border border-border/60 p-1.5 shadow-xl shadow-black/10"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className="flex w-full flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-primary/10"
              onClick={() => {
                onSelectItem(item);
                onClose();
              }}
            >
              <span className="text-sm font-medium text-foreground">
                {item.label}
              </span>
              {item.description ? (
                <span className="text-xs text-muted-foreground">
                  {item.description}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PlansDropdown({
  open,
  onToggle,
  onClose,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const hydrated = useStoresHydrated();
  const activeAccountId = useAuthStore((state) => state.activeAccountId);
  const isPro = useImageQuotaStore((state) =>
    hydrated ? state.isPro(activeAccountId) : false,
  );
  const openProModal = useImageQuotaStore((state) => state.openProModal);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  const startProCheckout = () => {
    onClose();
    if (!activeAccountId) {
      openAuthModal("picker");
      return;
    }
    openProModal();
  };

  const panel = open ? (
    <div className="fixed inset-0 z-[280]">
      <button
        type="button"
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        aria-label="Planlar menüsünü kapat"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        id={menuId}
        role="dialog"
        aria-modal="true"
        aria-label="Plan karşılaştırması"
        className="orwix-glass absolute left-1/2 top-[max(4.75rem,env(safe-area-inset-top))] z-10 flex max-h-[min(78dvh,40rem)] w-[min(34rem,calc(100vw-1.25rem))] -translate-x-1/2 flex-col overflow-hidden rounded-3xl border border-border/50 shadow-2xl shadow-black/20"
      >
        <div className="relative shrink-0 overflow-hidden border-b border-border/40 px-5 pb-4 pt-5">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_55%)]"
            aria-hidden
          />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              Abonelik
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">
              Size uygun planı seçin
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Free ile başlayın; büyüdükçe Pro ile ölçekleyin.
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <div
              className={cn(
                "flex flex-col rounded-2xl border p-4",
                !isPro
                  ? "border-border/70 bg-background/70"
                  : "border-border/40 bg-muted/20 opacity-90",
              )}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">Free</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Keşfetmek için
                  </p>
                </div>
                {!isPro ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Mevcut
                  </span>
                ) : null}
              </div>
              <p className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
                $0
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  / ay
                </span>
              </p>
              <ul className="mt-4 flex flex-1 flex-col gap-2.5">
                {PLAN_CARD_FEATURES.free.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-start gap-2 text-sm leading-snug"
                  >
                    {item.included ? (
                      <Check
                        className="mt-0.5 size-3.5 shrink-0 text-primary"
                        aria-hidden
                      />
                    ) : (
                      <Minus
                        className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50"
                        aria-hidden
                      />
                    )}
                    <span
                      className={
                        item.included
                          ? "text-foreground/90"
                          : "text-muted-foreground/70"
                      }
                    >
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative flex flex-col overflow-hidden rounded-2xl border border-primary/35 bg-primary/[0.06] p-4 ring-1 ring-primary/15">
              <div
                className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full bg-primary/15 blur-2xl"
                aria-hidden
              />
              <div className="relative mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Sparkles className="size-3.5 text-primary" aria-hidden />
                    Pro
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Ciddi üretim için
                  </p>
                </div>
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                  {isPro ? "Aktif" : "Önerilen"}
                </span>
              </div>
              <p className="relative text-2xl font-semibold tracking-[-0.03em] text-foreground">
                ${ORWIX_PRO_PRICE_USD}
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  / ay
                </span>
              </p>
              <ul className="relative mt-4 flex flex-1 flex-col gap-2.5">
                {PLAN_CARD_FEATURES.pro.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-start gap-2 text-sm leading-snug text-foreground/90"
                  >
                    <Check
                      className="mt-0.5 size-3.5 shrink-0 text-primary"
                      aria-hidden
                    />
                    {item.label}
                  </li>
                ))}
              </ul>

              <div className="relative mt-5">
                {isPro ? (
                  <p className="rounded-xl bg-primary/12 px-3 py-2.5 text-center text-sm font-medium text-primary">
                    Pro planınız aktif
                  </p>
                ) : (
                  <Button
                    type="button"
                    className="orwix-cta-btn h-10 w-full rounded-full border-0 text-sm font-semibold text-white"
                    onClick={startProCheckout}
                  >
                    Pro&apos;ya geç — {ORWIX_PRO_PRICE_LABEL}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="shrink-0 border-t border-border/40 px-5 py-3 text-center text-[11px] text-muted-foreground">
          Güvenli ödeme Stripe ile · İstediğiniz zaman iptal
        </p>
      </div>
    </div>
  ) : null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        className={cn(
          "orwix-nav-link flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium tracking-[-0.01em] transition-all hover:bg-primary/10",
          open && "bg-primary/10 text-foreground",
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={menuId}
        onClick={onToggle}
      >
        Planlar
        <ChevronDown
          className={cn(
            "size-3.5 opacity-60 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {mounted && panel ? createPortal(panel, document.body) : null}
    </div>
  );
}

export function OrwixHeader({ onSelectPrompt }: OrwixHeaderProps = {}) {
  const activeAccountId = useAuthStore((state) => state.activeAccountId);
  const startNewChat = useChatStore((state) => state.startNewChat);
  const setHistoryOpen = useChatStore((state) => state.setHistoryOpen);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const goHome = () => {
    startNewChat(activeAccountId ?? GUEST_CHAT_ACCOUNT_ID);
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.location.assign("/");
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavItem = (item: OrwixNavItem) => {
    if (item.href) {
      const target = document.querySelector(item.href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      window.location.hash = item.href;
      return;
    }

    onSelectPrompt?.(item.prompt ?? "", {
      mode: item.mode,
    });
  };

  return (
    <header className="relative z-20 px-3 pt-3 sm:px-4 sm:pt-4 md:px-6">
      {/* Glass blur on a separate layer — backdrop-filter clips rounded children otherwise */}
      <div className="relative mx-auto h-12 max-w-5xl sm:h-14">
        <div
          className="orwix-glass pointer-events-none absolute inset-0 rounded-2xl"
          aria-hidden
        />
        <div className="relative z-10 flex h-full items-center justify-between gap-3 px-2.5 sm:gap-4 sm:px-4">
          <div className="flex min-w-0 items-center gap-1 sm:gap-3 md:gap-5">
            <button
              type="button"
              onClick={goHome}
              className="shrink-0 rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-label="Ana sayfaya git"
            >
              <OrwixWordmark className="h-6 w-auto sm:h-7" />
            </button>

            <nav className="flex items-center gap-0.5 sm:gap-1">
              {ORWIX_HEADER_NAV.dropdowns.map((dropdown) => (
                <div key={dropdown.label} className="hidden md:block">
                  <NavDropdown
                    label={dropdown.label}
                    items={dropdown.items}
                    open={openMenu === dropdown.label}
                    onToggle={() =>
                      setOpenMenu((current) =>
                        current === dropdown.label ? null : dropdown.label,
                      )
                    }
                    onClose={() => setOpenMenu(null)}
                    onSelectItem={handleNavItem}
                  />
                </div>
              ))}
              <PlansDropdown
                open={openMenu === "Planlar"}
                onToggle={() =>
                  setOpenMenu((current) =>
                    current === "Planlar" ? null : "Planlar",
                  )
                }
                onClose={() => setOpenMenu(null)}
              />
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              onClick={goHome}
              title="Yeni sohbet"
              aria-label="Yeni sohbet"
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground sm:size-9"
            >
              <SquarePen className="size-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              title="Geçmiş"
              aria-label="Sohbet geçmişi"
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground sm:size-9"
            >
              <Clock className="size-4" strokeWidth={1.75} />
            </button>
            <ClientOnly fallback={<div className="size-8 shrink-0 sm:size-9" />}>
              <BackgroundPicker />
            </ClientOnly>
            <ClientOnly fallback={<div className="size-8 shrink-0 sm:size-9" />}>
              <ThemeToggle />
            </ClientOnly>
            <AuthButtons />
          </div>
        </div>
      </div>
    </header>
  );
}
