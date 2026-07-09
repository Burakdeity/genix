"use client";

import { MessageSquare, History, Layers } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { id: "chat", label: "Sohbet", icon: MessageSquare, active: true },
  { id: "prompts", label: "Geçmiş", icon: History, active: false },
  { id: "integrations", label: "Araçlar", icon: Layers, active: false },
] as const;

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-[10px] font-medium transition-colors",
                item.active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
