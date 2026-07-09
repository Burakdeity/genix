"use client";

import {
  Clock,
  Puzzle,
  Search,
  Settings,
  SquarePen,
  UserRound,
  Moon,
} from "lucide-react";

import { ProfileMenu } from "@/components/auth/profile-menu";
import { GenixWordmark } from "@/components/brand/genix-logo";
import { ClientOnly } from "@/components/ui/client-only";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  onNewChat: () => void;
}

const navItems = [
  { id: "new", label: "Yeni sohbet", icon: SquarePen },
  { id: "search", label: "Ara", icon: Search },
  { id: "history", label: "Geçmiş", icon: Clock },
  { id: "apps", label: "Uzantılar", icon: Puzzle },
] as const;

export function AppSidebar({ onNewChat }: AppSidebarProps) {
  return (
    <aside className="flex w-14 shrink-0 flex-col items-center overflow-visible border-r border-border bg-sidebar py-3 md:w-16">
      <button
        type="button"
        className="mb-6 flex size-10 items-center justify-center rounded-xl transition-transform hover:scale-105"
        aria-label="Genix"
      >
        <GenixWordmark className="text-[11px] font-extrabold" />
      </button>

      <nav className="flex flex-1 flex-col items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              onClick={item.id === "new" ? onNewChat : undefined}
              className={cn(
                "flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-5" />
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-2 pb-2">
        <ClientOnly
          fallback={
            <button
              type="button"
              title="Koyu temaya geç"
              className="flex size-10 items-center justify-center rounded-full text-muted-foreground"
              aria-label="Koyu temaya geç"
            >
              <Moon className="size-5" strokeWidth={1.75} />
            </button>
          }
        >
          <ThemeToggle />
        </ClientOnly>
        <button
          type="button"
          title="Ayarlar"
          className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Settings className="size-5" />
        </button>
        <ClientOnly
          fallback={
            <button
              type="button"
              title="Profil"
              className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground"
              aria-label="Profil"
            >
              <UserRound className="size-4" strokeWidth={1.75} />
            </button>
          }
        >
          <ProfileMenu align="sidebar" />
        </ClientOnly>
      </div>
    </aside>
  );
}
