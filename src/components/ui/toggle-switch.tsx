"use client";

import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  id: string;
}

export function ToggleSwitch({
  checked,
  onCheckedChange,
  label,
  id,
}: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 transition-colors hover:bg-muted/50">
      <label
        htmlFor={id}
        className="cursor-pointer text-sm font-medium text-secondary-foreground"
      >
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-primary" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}
