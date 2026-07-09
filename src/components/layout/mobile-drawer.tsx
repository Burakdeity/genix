"use client";

import { Clock, Settings, SquarePen, X } from "lucide-react";

import { ProfileMenu } from "@/components/auth/profile-menu";
import { OrwixWordmark } from "@/components/brand/orwix-logo";
import { ClientOnly } from "@/components/ui/client-only";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  onNewChat: () => void;
}

export function MobileDrawer({ open, onClose, onNewChat }: MobileDrawerProps) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(280px,85vw)] flex-col border-r border-border bg-card p-4 transition-transform duration-300 md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <OrwixWordmark className="text-xl font-bold" />
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full hover:bg-muted"
            aria-label="Kapat"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-foreground hover:bg-muted"
          >
            <SquarePen className="size-5 text-muted-foreground" />
            Yeni sohbet
          </button>
          <button
            type="button"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-foreground hover:bg-muted"
          >
            <Clock className="size-5 text-muted-foreground" />
            Geçmiş
          </button>
          <button
            type="button"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-foreground hover:bg-muted"
          >
            <Settings className="size-5 text-muted-foreground" />
            Ayarlar
          </button>
        </nav>

        <div className="mt-auto space-y-3 border-t border-border pt-4">
          <ClientOnly
            fallback={
              <div className="h-11 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
                Koyu tema
              </div>
            }
          >
            <ThemeToggle variant="switch" />
            <ProfileMenu align="drawer" />
          </ClientOnly>
        </div>
      </aside>
    </>
  );
}
