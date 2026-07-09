"use client";

import { ChevronDown } from "lucide-react";

import { OrwixWordmark } from "@/components/brand/orwix-logo";
import { BackgroundPicker } from "@/components/theme/background-picker";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ClientOnly } from "@/components/ui/client-only";
import { Button } from "@/components/ui/button";
import { ORWIX_HEADER_NAV } from "@/content/orwix-content";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";

function AuthButtons({ className }: { className?: string }) {
  const openAuthModal = useAuthStore((state) => state.openAuthModal);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-9 rounded-full px-4 text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:text-foreground"
        onClick={() => openAuthModal("picker")}
      >
        Giriş yap
      </Button>
      <Button
        type="button"
        size="sm"
        className="orwix-cta-btn h-9 rounded-full border-0 px-5 text-sm font-semibold text-white"
        onClick={() => openAuthModal("picker")}
      >
        Kaydol
      </Button>
    </div>
  );
}

export function OrwixHeader() {
  return (
    <header className="relative z-20 px-4 pt-4 md:px-6">
      <div className="orwix-glass mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-2xl px-3 md:gap-4 md:px-5">
        <OrwixWordmark className="shrink-0 text-xl font-bold tracking-tight" />

        <nav className="hidden flex-1 items-center justify-center gap-0.5 lg:flex">
          {ORWIX_HEADER_NAV.dropdowns.map((item) => (
            <button
              key={item}
              type="button"
              className="flex items-center gap-0.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-primary/10 hover:text-foreground"
            >
              {item}
              <ChevronDown className="size-3.5 opacity-60" />
            </button>
          ))}
          {ORWIX_HEADER_NAV.links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-primary/10 hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-0.5 md:gap-1">
          <ClientOnly fallback={<div className="size-9" />}>
            <BackgroundPicker />
          </ClientOnly>
          <ClientOnly fallback={<div className="size-9" />}>
            <ThemeToggle className="hover:bg-primary/10" />
          </ClientOnly>
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}
