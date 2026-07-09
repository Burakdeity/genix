"use client";

import { Moon, Sun } from "lucide-react";

import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { useStoresHydrated } from "@/hooks/use-stores-hydrated";
import { useThemeStore } from "@/stores/theme.store";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "icon" | "switch";
  className?: string;
}

export function ThemeToggle({
  variant = "icon",
  className,
}: ThemeToggleProps) {
  const hydrated = useStoresHydrated();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isDark = hydrated && theme === "dark";

  if (variant === "switch") {
    return (
      <div className={className}>
        <ToggleSwitch
          id="orwix-dark-theme"
          label="Koyu tema"
          checked={isDark}
          onCheckedChange={toggleTheme}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
      aria-label={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
      className={cn(
        "flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      {isDark ? (
        <Sun className="size-5" strokeWidth={1.75} />
      ) : (
        <Moon className="size-5" strokeWidth={1.75} />
      )}
    </button>
  );
}
